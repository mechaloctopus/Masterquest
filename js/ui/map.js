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
        
        // Connect to Entity system right away
        connectToEntitySystems();
        
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
        // Try legacy NPC system
        if (window.NPCSystem && typeof NPCSystem.getAllNPCs === 'function') {
            try {
                const allNPCs = NPCSystem.getAllNPCs();
                updateNPCsOnMap(allNPCs);
                console.log(`[MAP] Found ${allNPCs.length} NPCs via NPCSystem (legacy)`);
            } catch (e) {
                console.warn("[MAP] Could not get NPCs from legacy system:", e);
            }
        }
        
        // Try legacy FOE system with multiple approaches
        tryLegacyFoeMethods();
    }
    
    // Enhanced foe update function for legacy system - tries multiple methods
    function tryLegacyFoeMethods() {
        // First try the standard FoeSystem approach
        if (window.FoeSystem && typeof FoeSystem.getAllFoes === 'function') {
            try {
                const allFoes = FoeSystem.getAllFoes();
                if (Array.isArray(allFoes) && allFoes.length > 0) {
                    console.log(`[MAP] Found ${allFoes.length} foes via FoeSystem.getAllFoes (legacy)`);
                    updateFoesOnMap(allFoes);
                    return; // Successfully updated
                } else {
                    console.log("[MAP] FoeSystem.getAllFoes returned empty array");
                }
            } catch (e) {
                console.warn("[MAP] Error using FoeSystem.getAllFoes:", e);
            }
        }
        
        // Try second approach - check if foes are directly accessible
        if (window.FoeSystem && Array.isArray(FoeSystem.foes)) {
            console.log(`[MAP] Found ${FoeSystem.foes.length} foes via FoeSystem.foes property (legacy)`);
            updateFoesOnMap(FoeSystem.foes);
            return; // Successfully updated
        }
        
        // Final approach - check global state for foes
        if (window.state && state.foes) {
            console.log(`[MAP] Found foes via global state.foes (legacy)`);
            updateFoesOnMap(Array.isArray(state.foes) ? state.foes : [state.foes]);
            return; // Successfully updated
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
        if (!ctx) return;
        
        // Clear the canvas
        ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
        
        // Draw a simplified grid
        drawGrid();
        
        // Draw player position
        drawPlayer();
        
        // Draw NPCs
        drawNPCs();
        
        // Draw foes
        drawFoes();
        
        // No longer draw debug info, detailed rotation, etc.
    }
    
    // Simplified grid drawing
    function drawGrid() {
        if (!ctx) return;
        
        // Draw a simple grid with fewer lines
        ctx.strokeStyle = '#303030'; // Dark gray grid
        ctx.lineWidth = 0.5;
        
        // Draw fewer grid lines for a cleaner look
        const gridStep = GRID_CELL_SIZE * 2; // Double the spacing
        
        for (let i = 0; i <= MAP_SIZE; i += gridStep) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, MAP_SIZE);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(MAP_SIZE, i);
            ctx.stroke();
        }
        
        // Draw center lines more prominently
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        
        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(MAP_SIZE/2, 0);
        ctx.lineTo(MAP_SIZE/2, MAP_SIZE);
        ctx.stroke();
        
        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, MAP_SIZE/2);
        ctx.lineTo(MAP_SIZE, MAP_SIZE/2);
        ctx.stroke();
    }
    
    // Simplified player drawing - just an arrow, no text
    function drawPlayer() {
        if (!ctx) return;
        
        const center = {
            x: (MAP_SIZE / 2) + (playerX * SCALE),
            y: (MAP_SIZE / 2) + (playerZ * SCALE)
        };
        
        // Draw player as a circle with direction arrow
        const radius = 6;
        
        // Player circle
        ctx.fillStyle = '#FFFF00'; // Yellow
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction arrow
        const arrowLength = radius * 2;
        const dx = Math.sin(playerRotation) * arrowLength;
        const dy = Math.cos(playerRotation) * arrowLength;
        
        ctx.strokeStyle = '#FFFFFF'; // White arrow
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + dx, center.y - dy); // Note the negative for dy (z)
        ctx.stroke();
        
        // No longer draw text information
    }
    
    // Draw NPCs on the map
    function drawNPCs() {
        if (!ctx || npcs.length === 0) return;
        
        // Draw each NPC as a blue dot
        ctx.fillStyle = '#00AAFF';
        
        npcs.forEach(npc => {
            if (typeof npc.x !== 'number' || typeof npc.z !== 'number') return;
            
            // Draw a simple blue dot for the NPC
            const x = (MAP_SIZE / 2) + (npc.x * SCALE);
            const z = (MAP_SIZE / 2) + (npc.z * SCALE);
            
            ctx.beginPath();
            ctx.arc(x, z, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // No longer draw the label
        });
    }
    
    // Draw foes on the map
    function drawFoes() {
        if (!ctx || foes.length === 0) return;
        
        // Draw each foe as a red dot
        ctx.fillStyle = '#FF3300';
        
        foes.forEach(foe => {
            if (typeof foe.x !== 'number' || typeof foe.z !== 'number') return;
            
            // Draw a simple red dot for the foe
            const x = (MAP_SIZE / 2) + (foe.x * SCALE);
            const z = (MAP_SIZE / 2) + (foe.z * SCALE);
            
            ctx.beginPath();
            ctx.arc(x, z, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // No longer draw the label
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
        updateFoe: updateFoe,
        // Manual methods to force entity updates
        refreshEntities: updateEntities,
        refreshFoes: updateFoesFromSystem
    };
})(); 