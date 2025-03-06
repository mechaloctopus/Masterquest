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
    const GRID_CELL_SIZE = 20; // Pixels per grid cell
    const WORLD_GRID_SIZE = 2; // World units per grid cell
    const SCALE = GRID_CELL_SIZE / WORLD_GRID_SIZE; // Pixels per world unit
    
    // World grid configuration from CONFIG (if available)
    const WORLD_GRID_LIMITS = (typeof CONFIG !== 'undefined' && CONFIG.GRID) ? CONFIG.GRID.SIZE : 50;
    
    // Direct coordinate check timer
    let coordinateCheckTimer = null;
    
    // Debug mode - set to false for production
    const DEBUG = false;
    
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
        
        // Create origin marker
        addOrigin();
        
        // Start the update loop
        requestAnimationFrame(updateLoop);
        
        // Set up coordinate connection
        setupDirectCoordinateConnection();
        
        // Make sure CoordinateSystem is initialized
        setTimeout(ensureCoordinateDisplay, 100);
        
        // Connect to NPC and FOE systems if available
        setTimeout(connectToEntitySystems, 500);
        
        console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    // Connect to NPC and Foe systems to get entity data
    function connectToEntitySystems() {
        // Try to connect to NPC and Foe systems
        if (window.NPCSystem && typeof NPCSystem.getAllNPCs === 'function') {
            console.log("[MAP] Connected to NPCSystem");
        }
        
        if (window.FoeSystem && typeof FoeSystem.getAllFoes === 'function') {
            console.log("[MAP] Connected to FoeSystem");
        }
        
        // Set up periodic check for entity updates
        setInterval(updateEntities, 1000); // Check once per second
    }
    
    // Update NPC and Foe positions from their systems
    function updateEntities() {
        // Update NPCs if system available
        if (window.NPCSystem && typeof NPCSystem.getAllNPCs === 'function') {
            try {
                const allNPCs = NPCSystem.getAllNPCs();
                updateNPCsOnMap(allNPCs);
            } catch (e) {
                if (DEBUG) console.warn("[MAP] Could not get NPCs:", e);
            }
        }
        
        // Update Foes if system available
        if (window.FoeSystem && typeof FoeSystem.getAllFoes === 'function') {
            try {
                const allFoes = FoeSystem.getAllFoes();
                updateFoesOnMap(allFoes);
            } catch (e) {
                if (DEBUG) console.warn("[MAP] Could not get Foes:", e);
            }
        }
    }
    
    // Process NPC data from the NPC system
    function updateNPCsOnMap(npcData) {
        // Reset the NPC array
        npcs = [];
        
        // Process each NPC
        if (Array.isArray(npcData)) {
            npcData.forEach(npc => {
                if (npc && npc.mesh && npc.mesh.position) {
                    npcs.push({
                        id: npc.id || `npc-${npcs.length}`,
                        x: npc.mesh.position.x,
                        z: npc.mesh.position.z,
                        label: npc.name || `NPC ${npcs.length + 1}`
                    });
                }
            });
        }
        
        if (DEBUG) console.log(`[MAP] Updated ${npcs.length} NPCs on map`);
    }
    
    // Process Foe data from the Foe system
    function updateFoesOnMap(foeData) {
        // Reset the Foe array
        foes = [];
        
        // Process each Foe
        if (Array.isArray(foeData)) {
            foeData.forEach(foe => {
                if (foe && foe.mesh && foe.mesh.position) {
                    foes.push({
                        id: foe.id || `foe-${foes.length}`,
                        x: foe.mesh.position.x,
                        z: foe.mesh.position.z,
                        label: foe.name || `Foe ${foes.length + 1}`
                    });
                }
            });
        }
        
        if (DEBUG) console.log(`[MAP] Updated ${foes.length} Foes on map`);
    }
    
    // Public method to add or update a single NPC
    function updateNPC(id, x, z, label) {
        if (!id || typeof x !== 'number' || typeof z !== 'number') return false;
        
        // Find existing NPC or add new one
        const existingIndex = npcs.findIndex(npc => npc.id === id);
        if (existingIndex >= 0) {
            npcs[existingIndex] = { id, x, z, label: label || npcs[existingIndex].label };
        } else {
            npcs.push({ id, x, z, label: label || `NPC ${npcs.length + 1}` });
        }
        
        return true;
    }
    
    // Public method to add or update a single Foe
    function updateFoe(id, x, z, label) {
        if (!id || typeof x !== 'number' || typeof z !== 'number') return false;
        
        // Find existing Foe or add new one
        const existingIndex = foes.findIndex(foe => foe.id === id);
        if (existingIndex >= 0) {
            foes[existingIndex] = { id, x, z, label: label || foes[existingIndex].label };
        } else {
            foes.push({ id, x, z, label: label || `Foe ${foes.length + 1}` });
        }
        
        return true;
    }
    
    function styleMapContainer() {
        // Make map permanently visible
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '10px';
        mapContainer.style.right = '10px';
        mapContainer.style.width = MAP_SIZE + 'px';
        mapContainer.style.height = MAP_SIZE + 'px';
        mapContainer.style.border = '2px solid #00cc99';
        mapContainer.style.backgroundColor = 'rgba(0, 26, 51, 0.8)';
        mapContainer.style.zIndex = '100';
        
        // Hide any toggle button
        const mapToggle = document.getElementById('mapToggle');
        if (mapToggle) {
            mapToggle.style.display = 'none';
        }
        
        // Make sure canvas fills the container
        const style = document.createElement('style');
        style.textContent = `
            #mapCanvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            #mapContainer {
                overflow: visible !important;
                display: flex;
                flex-direction: column;
                padding-bottom: 0;
            }
            
            /* Fix coordinate display styling */
            .map-coordinates {
                display: flex !important;
                flex-direction: column;
                justify-content: center;
                width: 100%;
                margin-top: ${MAP_SIZE}px; /* Position below map */
                background-color: rgba(0, 26, 51, 0.95);
                border: 1px solid #00cc99;
                color: #00cc99;
                padding: 5px;
            }
            .coord-position, .coord-grid {
                display: flex;
                justify-content: space-between;
                padding: 2px 5px;
            }
            .coord-compass {
                font-weight: bold;
                color: #ff00cc;
                text-align: center;
            }
            .coord-label {
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    function addOrigin() {
        // Store origin info for drawing
        window.mapOrigin = {
            x: 0,
            z: 0,
            color: "#00FFFF",
            label: "Origin"
        };
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
        
        // Draw origin point
        drawOrigin();
        
        // Draw NPCs and Foes
        drawNPCs();
        drawFoes();
        
        // Draw player arrow
        drawPlayer();
        
        // Add debug info if enabled
        if (DEBUG) {
            drawDebugInfo();
        }
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
    
    // Draw the origin point
    function drawOrigin() {
        const origin = window.mapOrigin;
        if (!origin) return;
        
        const center = MAP_SIZE / 2;
        
        // Calculate origin position relative to player
        const x = center + (origin.x - playerX) * SCALE;
        const y = center - (origin.z - playerZ) * SCALE; // Reversed Z
        
        // Check if within view (with small margin)
        if (x >= -10 && x <= MAP_SIZE + 10 && y >= -10 && y <= MAP_SIZE + 10) {
            // Draw the point
            ctx.fillStyle = origin.color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the label
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px monospace';
            ctx.fillText(origin.label, x + 5, y + 3);
        }
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
        
        // Convert playerRotation to degrees for debugging
        const degrees = ((playerRotation * 180 / Math.PI) % 360 + 360) % 360;
        
        // Draw the direction line
        const dirX = center + Math.sin(playerRotation) * 15;
        const dirY = center - Math.cos(playerRotation) * 15;
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        ctx.restore();
        
        // Show compass and rotation as debug text
        ctx.fillStyle = "#ffff00";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        
        // Get direction name for debugging
        const dirName = getCardinalDirection(playerRotation);
        ctx.fillText(`Angle: ${degrees.toFixed(0)}° (${dirName})`, 5, 40);
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
    
    // Draw debug information
    function drawDebugInfo() {
        // Convert rotation to degrees
        const degrees = ((playerRotation * 180 / Math.PI) % 360 + 360) % 360;
        const directionName = getCardinalDirection(playerRotation);
        
        // Calculate if player is within grid
        const inGrid = Math.abs(playerX) <= WORLD_GRID_LIMITS && Math.abs(playerZ) <= WORLD_GRID_LIMITS;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Rot: ${degrees.toFixed(0)}° (${directionName})`, 5, 10);
        ctx.fillText(`Pos: ${playerX.toFixed(0)},${playerZ.toFixed(0)}`, 5, 20);
        ctx.fillText(`Grid: ${inGrid ? 'ON' : 'OFF'}`, 5, 30);
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
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 0.5;
                ctx.stroke();
                
                // Draw label if debug mode is on
                if (DEBUG && npc.label) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(npc.label, x, y - 5);
                    ctx.fillStyle = '#0088ff'; // Reset to blue for next NPC
                }
            }
        });
    }
    
    // Draw Foes as red dots
    function drawFoes() {
        if (!foes.length) return;
        
        const center = MAP_SIZE / 2;
        ctx.fillStyle = '#ff3333'; // Red color for Foes
        ctx.strokeStyle = '#ffffff'; // White outline
        
        foes.forEach(foe => {
            // Calculate position relative to player
            const x = center + (foe.x - playerX) * SCALE;
            const y = center - (foe.z - playerZ) * SCALE; // Reversed Z
            
            // Only draw if within map boundaries (with margin)
            if (x >= -5 && x <= MAP_SIZE + 5 && y >= -5 && y <= MAP_SIZE + 5) {
                // Draw dot
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 0.5;
                ctx.stroke();
                
                // Draw label if debug mode is on
                if (DEBUG && foe.label) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(foe.label, x, y - 5);
                    ctx.fillStyle = '#ff3333'; // Reset to red for next Foe
                }
            }
        });
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
        updateFoe: updateFoe
    };
})(); 