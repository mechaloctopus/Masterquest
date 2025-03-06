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
    let entityUpdateTimer = null;
    
    // Debug mode - set to false to improve performance
    const DEBUG = false;
    
    // Performance throttling
    const COORDINATE_CHECK_INTERVAL = 250; // ms (reduced from 100ms)
    const ENTITY_UPDATE_INTERVAL = 1000; // ms (reduced from 500ms)
    
    // Track last update time for throttling
    let lastRenderTime = 0;
    const RENDER_THROTTLE = 50; // ms, limits to ~20fps max
    
    function init() {
        if (DEBUG) console.log("[MAP] Initializing map system");
        
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
            console.error("[MAP] Could not find map canvas");
            return false;
        }
        
        // Set canvas size directly
        mapCanvas.width = MAP_SIZE;
        mapCanvas.height = MAP_SIZE;
        
        // Get drawing context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Could not get canvas context");
            return false;
        }
        
        // Start the update loop
        requestAnimationFrame(updateLoop);
        
        // Set up coordinate connection
        setupDirectCoordinateConnection();
        
        // Make sure CoordinateSystem is initialized
        setTimeout(ensureCoordinateDisplay, 100);
        
        // Connect to Entity system right away
        connectToEntitySystems();
        
        if (DEBUG) console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    // Connect to Entity system to get entity data
    function connectToEntitySystems() {
        if (DEBUG) console.log("[MAP] Connecting to entity system...");
        
        // First, directly fetch entities once
        updateEntities();
        
        // Then set up polling for updates with reduced frequency
        entityUpdateTimer = setInterval(updateEntities, ENTITY_UPDATE_INTERVAL);
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
                
                if (DEBUG) console.log(`[MAP] Updated ${allNPCs.length} NPCs and ${allFoes.length} foes from EntitySystem`);
                return; // Successfully updated
            } catch (e) {
                if (DEBUG) console.warn("[MAP] Could not get entities from EntitySystem, trying fallbacks");
                // Try fallback methods
                tryFallbackEntityMethods();
            }
        } else {
            // Only try fallbacks if primary method not available
            tryFallbackEntityMethods();
        }
    }
    
    // Fallback methods for getting entities if EntitySystem is not available
    function tryFallbackEntityMethods() {
        // Try legacy NPC system
        if (window.NPCSystem && typeof NPCSystem.getAllNPCs === 'function') {
            try {
                const allNPCs = NPCSystem.getAllNPCs();
                updateNPCsOnMap(allNPCs);
                if (DEBUG) console.log(`[MAP] FALLBACK: Found NPCs via legacy NPCSystem`);
            } catch (e) {
                if (DEBUG) console.warn("[MAP] Legacy NPCSystem failed");
            }
        }
        
        // Try legacy FOE system
        tryLegacyFoeMethods();
    }
    
    // Enhanced foe update function for legacy system - tries multiple methods
    function tryLegacyFoeMethods() {
        // First try the standard FoeSystem approach
        if (window.FoeSystem && typeof FoeSystem.getAllFoes === 'function') {
            try {
                const allFoes = FoeSystem.getAllFoes();
                if (Array.isArray(allFoes) && allFoes.length > 0) {
                    updateFoesOnMap(allFoes);
                    return; // Successfully updated
                }
            } catch (e) {
                // Continue to next method
            }
        }
        
        // Try second approach - check if foes are directly accessible
        if (window.FoeSystem && Array.isArray(FoeSystem.foes)) {
            updateFoesOnMap(FoeSystem.foes);
        }
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
                }
            });
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
                } else if (DEBUG) {
                    console.warn(`[MAP] Could not determine position for foe '${foeName}'`);
                }
            });
        }
        
        if (foes.length === 0 && oldFoes.length > 0) {
            // If we lost foes, it might be a temporary error, restore the old ones
            foes = oldFoes;
        }
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
        // Poll the coordinate display DOM elements less frequently
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
        }, COORDINATE_CHECK_INTERVAL);
        
        // Backup method: Connect to Babylon camera if available
        if (window.BABYLON && BABYLON.Engine.Instances.length > 0) {
            try {
                const engine = BABYLON.Engine.Instances[0];
                if (engine?.scenes?.length > 0) {
                    const scene = engine.scenes[0];
                    // Use onAfterRenderObservable instead of onBeforeRenderObservable
                    // and throttle the updates to reduce performance impact
                    let lastCameraUpdate = 0;
                    scene.onAfterRenderObservable.add(() => {
                        const now = performance.now();
                        if (now - lastCameraUpdate > COORDINATE_CHECK_INTERVAL && scene.activeCamera?.position) {
                            const camera = scene.activeCamera;
                            updatePlayerPosition({
                                x: camera.position.x,
                                z: camera.position.z
                            }, camera.rotation.y);
                            lastCameraUpdate = now;
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
        }
    }
    
    // Main render loop with throttling
    function updateLoop() {
        const now = performance.now();
        
        // Only render if enough time has passed since last render
        if (now - lastRenderTime >= RENDER_THROTTLE) {
            renderMap();
            lastRenderTime = now;
        }
        
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
    }
    
    // Draw the grid with proper scaling and boundaries
    function drawGrid() {
        const center = MAP_SIZE / 2;
        
        // Calculate player offset in screen pixels
        const playerOffsetX = playerX * SCALE;
        const playerOffsetZ = playerZ * SCALE;
        
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
        ctx.globalAlpha = 0.4;
        
        // Draw vertical grid lines (running north-south)
        for (let worldX = -WORLD_GRID_LIMITS; worldX <= WORLD_GRID_LIMITS; worldX += WORLD_GRID_SIZE) {
            // Convert world X to screen X
            const screenX = center + (worldX - playerX) * SCALE;
            
            // Only draw if within view
            if (screenX >= 0 && screenX <= MAP_SIZE) {
                ctx.beginPath();
                ctx.moveTo(screenX, gridTopEdge);
                ctx.lineTo(screenX, gridBottomEdge);
                ctx.stroke();
            }
        }
        
        // Draw horizontal grid lines (running east-west)
        for (let worldZ = -WORLD_GRID_LIMITS; worldZ <= WORLD_GRID_LIMITS; worldZ += WORLD_GRID_SIZE) {
            // Convert world Z to screen Y (remember Z is inverted)
            const screenY = center - (worldZ - playerZ) * SCALE;
            
            // Only draw if within view
            if (screenY >= 0 && screenY <= MAP_SIZE) {
                ctx.beginPath();
                ctx.moveTo(gridLeftEdge, screenY);
                ctx.lineTo(gridRightEdge, screenY);
                ctx.stroke();
            }
        }
        
        // Draw "void" in areas outside the grid
        ctx.fillStyle = 'rgba(0, 0, 20, 0.7)'; // Dark blue with transparency
        
        // Fill the areas outside the grid (only if needed)
        if (gridTopEdge > 0) {
            ctx.fillRect(0, 0, MAP_SIZE, gridTopEdge);
        }
        if (gridBottomEdge < MAP_SIZE) {
            ctx.fillRect(0, gridBottomEdge, MAP_SIZE, MAP_SIZE - gridBottomEdge);
        }
        if (gridLeftEdge > 0) {
            ctx.fillRect(0, gridTopEdge, gridLeftEdge, gridBottomEdge - gridTopEdge);
        }
        if (gridRightEdge < MAP_SIZE) {
            ctx.fillRect(gridRightEdge, gridTopEdge, MAP_SIZE - gridRightEdge, gridBottomEdge - gridTopEdge);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
    
    // Draw the player arrow
    function drawPlayer() {
        const center = MAP_SIZE / 2;
        
        // Draw cardinal direction indicators
        drawCardinalDirections();
        
        // Save context for rotation
        ctx.save();
        ctx.translate(center, center);
        
        // Rotate to player direction
        ctx.rotate(playerRotation);
        
        // Draw player arrow
        ctx.fillStyle = '#ff00cc'; // Pink/purple
        ctx.beginPath();
        ctx.moveTo(0, -8);  // Arrow tip
        ctx.lineTo(-5, 5);  // Bottom left
        ctx.lineTo(5, 5);   // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
        
        // Draw debug direction line if needed
        if (DEBUG) {
            drawDirectionDebug(center);
        }
    }
    
    // Separate function for direction debug drawing
    function drawDirectionDebug(center) {
        ctx.save();
        ctx.strokeStyle = '#ffff00'; // Yellow
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(center, center);
        
        // Draw the direction line
        const dirX = center + Math.sin(playerRotation) * 15;
        const dirY = center - Math.cos(playerRotation) * 15;
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        ctx.restore();
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
        if (!npcs.length) return;
        
        const center = MAP_SIZE / 2;
        ctx.fillStyle = '#0088ff'; // Blue color for NPCs
        ctx.strokeStyle = '#ffffff'; // White outline
        
        npcs.forEach(npc => {
            // Calculate position relative to player
            const x = center + (npc.x - playerX) * SCALE;
            const y = center - (npc.z - playerZ) * SCALE; // Reversed Z
            
            // Only draw if within map boundaries (with margin)
            if (x >= -5 && x <= MAP_SIZE + 5 && y >= -5 && y <= MAP_SIZE + 5) {
                // Draw dot
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2); // Larger size for visibility
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }
    
    // Draw Foes as red dots
    function drawFoes() {
        if (!foes.length) return;
        
        const center = MAP_SIZE / 2;
        
        // Use a bright red for maximum visibility
        ctx.fillStyle = '#ff0000'; // Bright red color for Foes
        ctx.strokeStyle = '#ffffff'; // White outline
        
        foes.forEach(foe => {
            // Calculate position relative to player
            const x = center + (foe.x - playerX) * SCALE;
            const y = center - (foe.z - playerZ) * SCALE; // Reversed Z
            
            // Only draw if within map boundaries (with margin)
            if (x >= -5 && x <= MAP_SIZE + 5 && y >= -5 && y <= MAP_SIZE + 5) {
                // Draw dot
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }
    
    // Adding the missing functions that were referenced in the return object
    
    // Update a single NPC's position
    function updateNPC(id, position) {
        if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
            return false;
        }
        
        // Find NPC by ID
        const npcIndex = npcs.findIndex(npc => npc.id === id);
        
        if (npcIndex >= 0) {
            // Update existing NPC
            npcs[npcIndex].x = position.x;
            npcs[npcIndex].z = position.z;
        } else {
            // Add new NPC
            npcs.push({
                id: id,
                x: position.x,
                z: position.z,
                label: id
            });
        }
        
        return true;
    }
    
    // Update a single Foe's position
    function updateFoe(id, position) {
        if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
            return false;
        }
        
        // Find Foe by ID
        const foeIndex = foes.findIndex(foe => foe.id === id);
        
        if (foeIndex >= 0) {
            // Update existing Foe
            foes[foeIndex].x = position.x;
            foes[foeIndex].z = position.z;
        } else {
            // Add new Foe
            foes.push({
                id: id,
                x: position.x,
                z: position.z,
                label: id
            });
        }
        
        return true;
    }
    
    // Force refresh of foes from system
    function updateFoesFromSystem() {
        if (window.EntitySystem && typeof EntitySystem.getAllFoes === 'function') {
            try {
                const allFoes = EntitySystem.getAllFoes();
                updateFoesOnMap(allFoes);
                return true;
            } catch (e) {
                if (DEBUG) console.warn("[MAP] Error refreshing foes:", e);
            }
        }
        
        // Try fallback methods
        tryLegacyFoeMethods();
        return true;
    }
    
    // Clean up when unloading
    function cleanup() {
        if (coordinateCheckTimer) {
            clearInterval(coordinateCheckTimer);
        }
        if (entityUpdateTimer) {
            clearInterval(entityUpdateTimer);
        }
    }
    
    // Ensure coordinate display is visible
    function ensureCoordinateDisplay() {
        if (window.CoordinateSystem && typeof window.CoordinateSystem.init === 'function') {
            // Initialize if not already done
            if (!document.getElementById('coordinateDisplay')) {
                if (DEBUG) console.log("[MAP] Initializing CoordinateSystem");
                window.CoordinateSystem.init();
            }
            
            // Make sure it's visible
            if (typeof window.CoordinateSystem.show === 'function') {
                window.CoordinateSystem.show();
            }
        }
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