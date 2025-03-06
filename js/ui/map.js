// Minimal Map System - Direct Connection to Coordinate Display
const MapSystem = (function() {
    // Essential DOM elements
    let mapCanvas = null;
    let ctx = null;
    let mapContainer = null;
    
    // Player position tracking
    let playerX = 0;
    let playerZ = 0;
    let playerRotation = 0;
    
    // NPC and Foe tracking
    let npcs = []; // Format: [{id: 'npc1', x: 0, z: 0, label: 'NPC1'}, ...]
    let foes = []; // Format: [{id: 'foe1', x: 0, z: 0, label: 'Foe1'}, ...]
    
    // Simple configuration
    const MAP_SIZE = 150;
    const GRID_CELL_SIZE = 10; // Pixels per grid cell (zoomed out for 16x16 grid view)
    const WORLD_GRID_SIZE = 2; // World units per grid cell
    const SCALE = GRID_CELL_SIZE / WORLD_GRID_SIZE; // Pixels per world unit
    
    // World grid configuration from CONFIG (if available)
    const WORLD_GRID_LIMITS = (typeof CONFIG !== 'undefined' && CONFIG.GRID) ? CONFIG.GRID.SIZE : 50;
    
    // Direct coordinate check timer
    let coordinateCheckTimer = null;
    
    // Fullscreen map toggle state
    let isFullscreen = false;
    
    // Debug mode - set to true to troubleshoot foe tracking
    const DEBUG = true;
    
    function init() {
        console.log("[MAP] Initializing map system");
        
        // Get the map container
        mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error("[MAP] Could not find map container");
            return false;
        }
        
        // Fix styling for the map
        styleMapContainer();
        
        // Get or create canvas
        mapCanvas = document.getElementById('mapCanvas');
        if (!mapCanvas) {
            mapCanvas = document.createElement('canvas');
            mapCanvas.id = 'mapCanvas';
            mapContainer.appendChild(mapCanvas);
        }
        
        // Set up canvas context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Could not get 2D context from canvas");
            return false;
        }
        
        // Initialize canvas size
        resizeMapCanvas();
        
        // Start the update loop
        updateLoop();
        
        // Set up coordinate connection
        setupDirectCoordinateConnection();
        
        // Connect to Entity system right away
        connectToEntitySystems();
        
        // Add the keyboard listener for map fullscreen toggle
        document.addEventListener('keydown', handleKeyPress);
        
        // Make sure coordinate display is initialized and visible
        setTimeout(ensureCoordinateDisplay, 300);
        
        console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    // Connect to Entity system to get entity data
    function connectToEntitySystems() {
        console.log("[MAP] Connecting to entity system...");
        
        // First, directly fetch entities once
        updateEntities();
        
        // Then set up polling for updates
        setInterval(updateEntities, 500); // Check twice per second
    }
    
    // Update NPC and Foe positions from Entity system
    function updateEntities() {
        // Check if EntitySystem is available
        if (window.EntitySystem) {
            try {
                // Update NPCs
                const allNPCs = EntitySystem.getAllNPCs();
                updateNPCsOnMap(allNPCs);
                
                // Update Foes
                const allFoes = EntitySystem.getAllFoes();
                updateFoesOnMap(allFoes);
                
                console.log(`[MAP] Updated ${allNPCs.length} NPCs and ${allFoes.length} foes from EntitySystem`);
            } catch (e) {
                console.warn("[MAP] Could not get entities from EntitySystem:", e);
                // Try fallback methods
                tryFallbackEntityMethods();
            }
        } else {
            console.warn("[MAP] EntitySystem not available, trying legacy systems");
            tryFallbackEntityMethods();
        }
    }
    
    // Fallback methods for getting entities if EntitySystem is not available
    function tryFallbackEntityMethods() {
        // Log that we're trying legacy systems
        console.log("[MAP] EntitySystem not available or returned no entities, trying legacy systems");
        
        // Try legacy NPC system
        if (window.NPCSystem && typeof NPCSystem.getAllNPCs === 'function') {
            try {
                const allNPCs = NPCSystem.getAllNPCs();
                updateNPCsOnMap(allNPCs);
                console.log(`[MAP] FALLBACK: Found ${allNPCs.length} NPCs via legacy NPCSystem`);
            } catch (e) {
                console.warn("[MAP] Legacy NPCSystem failed:", e);
            }
        } else {
            console.log("[MAP] Legacy NPCSystem not available");
        }
        
        // Try legacy FOE system
        tryLegacyFoeMethods();
    }
    
    // Enhanced foe update function for legacy system - tries multiple methods
    function tryLegacyFoeMethods() {
        console.log("[MAP] Attempting to use legacy FoeSystem as fallback");
        
        // First try the standard FoeSystem approach
        if (window.FoeSystem && typeof FoeSystem.getAllFoes === 'function') {
            try {
                const allFoes = FoeSystem.getAllFoes();
                if (Array.isArray(allFoes) && allFoes.length > 0) {
                    console.log(`[MAP] FALLBACK: Found ${allFoes.length} foes via legacy FoeSystem.getAllFoes`);
                    updateFoesOnMap(allFoes);
                    return; // Successfully updated
                } else {
                    console.log("[MAP] Legacy FoeSystem.getAllFoes returned empty array");
                }
            } catch (e) {
                console.warn("[MAP] Legacy FoeSystem.getAllFoes failed:", e);
            }
        }
        
        // Try second approach - check if foes are directly accessible
        if (window.FoeSystem && Array.isArray(FoeSystem.foes)) {
            console.log(`[MAP] FALLBACK: Found ${FoeSystem.foes.length} foes via legacy FoeSystem.foes property`);
            updateFoesOnMap(FoeSystem.foes);
            return; // Successfully updated
        } else {
            console.log("[MAP] Legacy FoeSystem.foes not available");
        }
        
        console.log("[MAP] All fallback methods for foes failed");
    }
    
    // Process NPC data from the NPC system
    function updateNPCsOnMap(npcData) {
        // Reset the NPC array
        npcs = [];
        
        // Process each NPC
        if (Array.isArray(npcData)) {
            npcData.forEach((npc, index) => {
                // Try to extract position data
                let npcPosition = null;
                
                if (npc.mesh && npc.mesh.position) {
                    npcPosition = npc.mesh.position;
                } else if (npc.position) {
                    npcPosition = npc.position;
                }
                
                if (npcPosition) {
                    npcs.push({
                        id: npc.id || `npc-${index}`,
                        x: npcPosition.x,
                        z: npcPosition.z,
                        label: npc.name || `NPC ${index + 1}`
                    });
                    
                    if (DEBUG) {
                        console.log(`[MAP] Added NPC '${npc.name || "unnamed"}' at (${npcPosition.x.toFixed(1)}, ${npcPosition.z.toFixed(1)})`);
                    }
                }
            });
        }
        
        if (DEBUG) {
            console.log(`[MAP] Updated ${npcs.length} NPCs on map`);
        }
    }
    
    // Process Foe data from the Foe system
    function updateFoesOnMap(foeData) {
        // Back up existing foes in case we need to restore them
        const oldFoes = [...foes];
        
        // Reset the Foe array
        foes = [];
        
        // Process each Foe
        if (Array.isArray(foeData)) {
            foeData.forEach((foe, index) => {
                // Extract foe position using various possible data structures
                let foePosition = null;
                let foeId = foe.id || `foe-${index}`;
                let foeName = foe.name || `Foe ${index + 1}`;
                
                // Check all possible position paths
                if (foe.mesh && foe.mesh.position) {
                    foePosition = foe.mesh.position;
                } else if (foe.position) {
                    foePosition = foe.position;
                } else if (typeof foe.x === 'number' && typeof foe.z === 'number') {
                    foePosition = { x: foe.x, z: foe.z };
                }
                
                // Only add if we found a valid position
                if (foePosition && typeof foePosition.x === 'number' && typeof foePosition.z === 'number') {
                    foes.push({
                        id: foeId,
                        x: foePosition.x,
                        z: foePosition.z,
                        label: foeName
                    });
                    
                    console.log(`[MAP] Added foe '${foeName}' at position (${foePosition.x.toFixed(1)}, ${foePosition.z.toFixed(1)})`);
                } else {
                    console.warn(`[MAP] Could not determine position for foe '${foeName}'`);
                }
            });
        }
        
        if (foes.length === 0 && oldFoes.length > 0) {
            // If we lost foes, it might be a temporary error, restore the old ones
            console.warn("[MAP] Lost foe tracking, maintaining last known positions");
            foes = oldFoes;
        }
        
        console.log(`[MAP] Updated ${foes.length} Foes on map`);
    }
    
    function styleMapContainer() {
        // Create and inject CSS for map
        const style = document.createElement('style');
        style.textContent = `
            #mapContainer {
                position: absolute;
                width: ${MAP_SIZE}px;
                height: ${MAP_SIZE}px;
                bottom: 10px;
                right: 10px;
                border: 2px solid #00FFFF;
                background-color: rgba(0,0,0,0.5);
                border-radius: 4px;
                overflow: hidden;
                pointer-events: none;
                z-index: 1000;
            }
            
            #mapCanvas {
                width: 100%;
                height: 100%;
            }
        `;
        document.head.appendChild(style);
    }
    
    function setupDirectCoordinateConnection() {
        // Poll the coordinate display DOM elements
        coordinateCheckTimer = setInterval(function() {
            const coordPos = document.getElementById('coordPos');
            const compassElem = document.getElementById('coordCompass');
            
            if (coordPos) {
                // Get position from coordinates
                const text = coordPos.textContent;
                const match = text.match(/X:(-?\d+) Z:(-?\d+)/);
                if (match) {
                    const x = parseFloat(match[1]);
                    const z = parseFloat(match[2]);
                    
                    // Get rotation from compass direction
                    let newRotation = playerRotation;
                    if (compassElem) {
                        const direction = compassElem.textContent;
                        // Convert compass direction to radians
                        switch (direction) {
                            case 'N': newRotation = 0; break;
                            case 'NE': newRotation = Math.PI / 4; break;
                            case 'E': newRotation = Math.PI / 2; break;
                            case 'SE': newRotation = Math.PI * 3/4; break;
                            case 'S': newRotation = Math.PI; break;
                            case 'SW': newRotation = Math.PI * 5/4; break;
                            case 'W': newRotation = Math.PI * 3/2; break;
                            case 'NW': newRotation = Math.PI * 7/4; break;
                        }
                    }
                    
                    // Update position and rotation
                    updatePlayerPosition({x, z}, newRotation);
                }
            }
        }, 100); // Check 10 times per second
        
        // Backup method: Connect to Babylon camera if available
        if (window.BABYLON && BABYLON.Engine.Instances.length > 0) {
            try {
                const engine = BABYLON.Engine.Instances[0];
                if (engine?.scenes?.length > 0) {
                    const scene = engine.scenes[0];
                    scene.onBeforeRenderObservable.add(() => {
                        if (scene.activeCamera?.position) {
                            const camera = scene.activeCamera;
                            updatePlayerPosition({
                                x: camera.position.x,
                                z: camera.position.z
                            }, camera.rotation.y);
                        }
                    });
                }
            } catch (e) {
                console.warn("[MAP] Could not connect to Babylon camera");
            }
        }
    }
    
    function updatePlayerPosition(position, rotation) {
        if (!position) return;
        
        // Store values
        playerX = typeof position.x === 'number' ? position.x : playerX;
        playerZ = typeof position.z === 'number' ? position.z : playerZ;
        
        // Only update rotation if provided and different
        if (typeof rotation === 'number' && Math.abs(rotation - playerRotation) > 0.01) {
            playerRotation = rotation;
            
            if (DEBUG) {
                console.log(`[MAP] Rotation updated: ${playerRotation.toFixed(2)}`);
            }
        }
    }
    
    // Main render loop
    function updateLoop() {
        // Render the map
        renderMap();
        
        // Continue loop
        requestAnimationFrame(updateLoop);
    }
    
    // Render the map
    function renderMap() {
        if (!ctx || !mapCanvas) return;
        
        // Clear canvas
        ctx.fillStyle = '#001a33'; // Dark blue background
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw NPCs and Foes
        drawNPCs();
        drawFoes();
        
        // Draw player arrow
        drawPlayer();
        
        // Add header if in fullscreen mode
        if (isFullscreen) {
            drawFullscreenHeader();
        }
        
        // Add debug info if enabled
        if (DEBUG) {
            drawDebugInfo();
        }
    }
    
    // Draw the grid with proper scaling and boundaries
    function drawGrid() {
        const center = isFullscreen ? mapCanvas.width / 2 : MAP_SIZE / 2;
        
        // Calculate player offset in screen pixels
        const playerOffsetX = playerX * (isFullscreen ? 1 : SCALE);
        const playerOffsetZ = playerZ * (isFullscreen ? 1 : SCALE);
        
        // In fullscreen mode, we want to show the entire grid
        // In normal mode, center on the player
        if (isFullscreen) {
            // Draw the entire grid with the player's position marked
            const gridSize = WORLD_GRID_LIMITS * 2;
            
            // Ensure we can see the entire grid with some padding
            // Use 85% of canvas size to leave some margin around the grid
            const cellSize = Math.min(mapCanvas.width, mapCanvas.height) * 0.85 / gridSize;
            
            // Center the grid in the canvas
            const offsetX = (mapCanvas.width - (cellSize * gridSize)) / 2;
            const offsetY = (mapCanvas.height - (cellSize * gridSize)) / 2;
            
            // Draw grid lines
            ctx.strokeStyle = '#00cc99'; // Neon green
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.3;
            
            // Draw vertical grid lines
            for (let x = 0; x <= gridSize; x++) {
                const xPos = offsetX + x * cellSize;
                ctx.beginPath();
                ctx.moveTo(xPos, offsetY);
                ctx.lineTo(xPos, offsetY + gridSize * cellSize);
                ctx.stroke();
            }
            
            // Draw horizontal grid lines
            for (let z = 0; z <= gridSize; z++) {
                const zPos = offsetY + z * cellSize;
                ctx.beginPath();
                ctx.moveTo(offsetX, zPos);
                ctx.lineTo(offsetX + gridSize * cellSize, zPos);
                ctx.stroke();
            }
            
            // Draw grid boundary
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff00ff'; // Magenta boundary
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.rect(offsetX, offsetY, gridSize * cellSize, gridSize * cellSize);
            ctx.stroke();
            
            // Store these values for use in other drawing functions
            this.fullscreenGridInfo = {
                offsetX: offsetX,
                offsetY: offsetY,
                cellSize: cellSize,
                gridSize: gridSize
            };
            
            // Reset alpha
            ctx.globalAlpha = 1.0;
        } else {
            // Original grid drawing for normal mode
            // Calculate the grid edges in screen space
            const gridLeftEdge = center - (WORLD_GRID_LIMITS * SCALE + playerOffsetX);
            const gridRightEdge = center + (WORLD_GRID_LIMITS * SCALE - playerOffsetX);
            const gridTopEdge = center - (WORLD_GRID_LIMITS * SCALE - playerOffsetZ);
            const gridBottomEdge = center + (WORLD_GRID_LIMITS * SCALE + playerOffsetZ);
            
            // Draw the grid boundary
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff00ff'; // Magenta boundary
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.rect(gridLeftEdge, gridTopEdge, gridRightEdge - gridLeftEdge, gridBottomEdge - gridTopEdge);
            ctx.stroke();
            
            // Reset styles for grid lines
            ctx.strokeStyle = '#00cc99'; // Neon green
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.3;
            
            // Draw vertical grid lines
            for (let x = -WORLD_GRID_LIMITS; x <= WORLD_GRID_LIMITS; x += WORLD_GRID_SIZE) {
                const screenX = center + (x - playerX) * SCALE;
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, mapCanvas.height);
                ctx.stroke();
            }
            
            // Draw horizontal grid lines
            for (let z = -WORLD_GRID_LIMITS; z <= WORLD_GRID_LIMITS; z += WORLD_GRID_SIZE) {
                const screenZ = center + (z - playerZ) * SCALE;
                ctx.beginPath();
                ctx.moveTo(0, screenZ);
                ctx.lineTo(mapCanvas.width, screenZ);
                ctx.stroke();
            }
            
            // Reset alpha
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Draw the player arrow
    function drawPlayer() {
        const center = isFullscreen ? mapCanvas.width / 2 : MAP_SIZE / 2;
        
        // Draw cardinal direction indicators if not in fullscreen
        if (!isFullscreen) {
            drawCardinalDirections();
        }
        
        // Calculate player position in fullscreen mode
        let playerDrawX = center;
        let playerDrawY = center;
        
        // In fullscreen mode, position the player based on grid coordinates
        if (isFullscreen && this.fullscreenGridInfo) {
            const { offsetX, offsetY, cellSize, gridSize } = this.fullscreenGridInfo;
            
            // Convert player coordinates to screen position
            // Center is 0,0, so we need to offset by half the grid size
            playerDrawX = offsetX + (playerX + WORLD_GRID_LIMITS) * cellSize;
            playerDrawY = offsetY + (playerZ + WORLD_GRID_LIMITS) * cellSize;
        }
        
        // Save context for rotation
        ctx.save();
        ctx.translate(playerDrawX, playerDrawY);
        
        // Rotate to player direction
        ctx.rotate(playerRotation);
        
        // Draw player arrow (slightly larger in fullscreen mode)
        const arrowSize = isFullscreen ? 12 : 8;
        ctx.fillStyle = '#ff00cc'; // Pink/purple
        ctx.beginPath();
        ctx.moveTo(0, -arrowSize);  // Arrow tip
        ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);  // Bottom left
        ctx.lineTo(arrowSize * 0.6, arrowSize * 0.6);   // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Reset rotation
        ctx.restore();
    }
    
    // Separate function for direction debug drawing
    function drawDirectionDebug(center) {
        ctx.save();
        ctx.strokeStyle = '#ffff00'; // Yellow
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(center, center);
        
        // Convert playerRotation to degrees for debugging
        const degrees = ((playerRotation * 180 / Math.PI) % 360 + 360) % 360;
        
        // Draw the direction line
        const dirX = center + Math.sin(playerRotation) * 15;
        const dirY = center - Math.cos(playerRotation) * 15;
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        ctx.restore();
        
        // Direction name is still calculated for other uses, but we don't display it
        getCardinalDirection(playerRotation);
    }
    
    // Draw cardinal direction indicators (N, S, E, W)
    function drawCardinalDirections() {
        const margin = 5;
        const size = MAP_SIZE;
        
        // Set text style
        ctx.font = '12px monospace';
        ctx.fillStyle = '#00cc99'; // Neon green
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the letters at the edges
        ctx.fillText('N', size/2, margin + 6);
        ctx.fillText('S', size/2, size - margin - 6);
        ctx.fillText('E', size - margin - 6, size/2);
        ctx.fillText('W', margin + 6, size/2);
    }
    
    // Draw debug information - simplified to empty function
    function drawDebugInfo() {
        // Removed all debug text as requested
    }
    
    // Get cardinal direction based on rotation angle
    function getCardinalDirection(radians) {
        // Normalize the angle to 0-2π
        const angle = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        
        // Define direction ranges
        if (angle < Math.PI * 0.25 || angle >= Math.PI * 1.75) return "North";
        if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) return "East";
        if (angle >= Math.PI * 0.75 && angle < Math.PI * 1.25) return "South";
        if (angle >= Math.PI * 1.25 && angle < Math.PI * 1.75) return "West";
        
        return "Unknown";
    }
    
    // Draw NPCs as blue dots
    function drawNPCs() {
        if (!npcs || npcs.length === 0) return;
        
        const center = isFullscreen ? mapCanvas.width / 2 : MAP_SIZE / 2;
        
        // Use a bright blue color for NPCs
        ctx.fillStyle = '#0088ff'; // Blue color for NPCs
        ctx.strokeStyle = '#ffffff'; // White outline
        
        npcs.forEach(npc => {
            if (!npc || typeof npc.x !== 'number' || typeof npc.z !== 'number') return;
            
            let npcX, npcZ;
            
            if (isFullscreen && this.fullscreenGridInfo) {
                // In fullscreen mode, position based on grid coordinates
                const { offsetX, offsetY, cellSize } = this.fullscreenGridInfo;
                npcX = offsetX + (npc.x + WORLD_GRID_LIMITS) * cellSize;
                npcZ = offsetY + (npc.z + WORLD_GRID_LIMITS) * cellSize;
            } else {
                // In normal mode, position relative to player
                npcX = center + (npc.x - playerX) * SCALE;
                npcZ = center + (npc.z - playerZ) * SCALE;
            }
            
            // Only draw if within the visible area
            if (npcX >= 0 && npcX <= mapCanvas.width && npcZ >= 0 && npcZ <= mapCanvas.height) {
                // Draw dot
                const dotSize = isFullscreen ? 5 : 4; // Slightly larger in fullscreen
                ctx.beginPath();
                ctx.arc(npcX, npcZ, dotSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw NPC label if provided and in fullscreen mode
                if (isFullscreen && npc.label) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(npc.label, npcX, npcZ - 10);
                    
                    // Reset fill color for the next NPC
                    ctx.fillStyle = '#0088ff';
                }
            }
        });
    }
    
    // Draw Foes as red dots
    function drawFoes() {
        if (!foes || foes.length === 0) return;
        
        const center = isFullscreen ? mapCanvas.width / 2 : MAP_SIZE / 2;
        
        // Use a bright red for maximum visibility
        ctx.fillStyle = '#ff0000'; // Bright red color for Foes
        ctx.strokeStyle = '#ffffff'; // White outline
        
        foes.forEach(foe => {
            if (!foe || typeof foe.x !== 'number' || typeof foe.z !== 'number') return;
            
            let foeX, foeZ;
            
            if (isFullscreen && this.fullscreenGridInfo) {
                // In fullscreen mode, position based on grid coordinates
                const { offsetX, offsetY, cellSize } = this.fullscreenGridInfo;
                foeX = offsetX + (foe.x + WORLD_GRID_LIMITS) * cellSize;
                foeZ = offsetY + (foe.z + WORLD_GRID_LIMITS) * cellSize;
            } else {
                // In normal mode, position relative to player
                foeX = center + (foe.x - playerX) * SCALE;
                foeZ = center + (foe.z - playerZ) * SCALE;
            }
            
            // Only draw if within the visible area
            if (foeX >= 0 && foeX <= mapCanvas.width && foeZ >= 0 && foeZ <= mapCanvas.height) {
                // Draw dot
                const dotSize = isFullscreen ? 5 : 4; // Slightly larger in fullscreen
                ctx.beginPath();
                ctx.arc(foeX, foeZ, dotSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw foe label if provided and in fullscreen mode
                if (isFullscreen && foe.label) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(foe.label, foeX, foeZ - 10);
                    
                    // Reset fill color for the next foe
                    ctx.fillStyle = '#ff0000';
                }
            }
        });
    }
    
    // Draw header for fullscreen mode
    function drawFullscreenHeader() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, mapCanvas.width, 30);
        
        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("Full Map View (Press 'M' to exit)", mapCanvas.width / 2, 15);
    }
    
    // Clean up when unloading
    function cleanup() {
        if (coordinateCheckTimer) {
            clearInterval(coordinateCheckTimer);
        }
    }
    
    // Ensure coordinate display is visible
    function ensureCoordinateDisplay() {
        if (window.CoordinateSystem && typeof window.CoordinateSystem.init === 'function') {
            // Initialize if not already done
            if (!document.getElementById('coordinateDisplay')) {
                console.log("[MAP] Initializing CoordinateSystem");
                window.CoordinateSystem.init();
            }
            
            // Make sure it's visible
            if (typeof window.CoordinateSystem.show === 'function') {
                window.CoordinateSystem.show();
            }
        }
    }
    
    // Handle keyboard input for map toggle
    function handleKeyPress(event) {
        // Toggle fullscreen map on 'M' keypress
        if (event.key.toLowerCase() === 'm') {
            toggleFullscreenMap();
        }
    }
    
    // Toggle fullscreen map view
    function toggleFullscreenMap() {
        isFullscreen = !isFullscreen;
        
        if (isFullscreen) {
            // Expand the map
            mapContainer.classList.add('expanded');
            
            // Hide coordinate display in fullscreen mode
            if (window.CoordinateSystem && typeof window.CoordinateSystem.hide === 'function') {
                window.CoordinateSystem.hide();
            }
            
            // Resize canvas to match new container size
            setTimeout(() => {
                resizeMapCanvas();
                renderMap();
            }, 300); // Wait for transition to complete
        } else {
            // Return to normal size
            mapContainer.classList.remove('expanded');
            
            // Show coordinate display in normal mode
            if (window.CoordinateSystem && typeof window.CoordinateSystem.show === 'function') {
                window.CoordinateSystem.show();
            } else {
                // If not available, try to initialize it
                setTimeout(ensureCoordinateDisplay, 100);
            }
            
            // Resize canvas to original size
            setTimeout(() => {
                resizeMapCanvas();
                renderMap();
            }, 300); // Wait for transition to complete
        }
    }
    
    // Resize the map canvas to match container
    function resizeMapCanvas() {
        if (!mapCanvas || !mapContainer) return;
        
        mapCanvas.width = mapContainer.clientWidth;
        mapCanvas.height = mapContainer.clientHeight;
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Clean up when window unloads
    window.addEventListener('unload', cleanup);
    
    // Public API
    return {
        updatePlayerPosition: updatePlayerPosition,
        init: init,
        // Add methods for updating NPCs and Foes
        updateNPC: updateNPC,
        updateFoe: updateFoe,
        // Manual methods to force entity updates
        refreshEntities: updateEntities,
        refreshFoes: updateFoesFromSystem
    };
})(); 