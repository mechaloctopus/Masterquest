// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainer = null;
    let coordDisplayElement = null;
    let debugElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Reference to the game camera and scene
    let gameCamera = null;
    let gameScene = null;
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Debug settings
    const DEBUG = true;
    let updateCount = 0;
    let lastLogTime = 0;
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
            console.log("[CoordSys] Initializing coordinate display system...");
            
            // Create debug element
            debugElement = document.createElement('div');
            debugElement.id = 'coordDebug';
            debugElement.className = 'coord-debug';
            debugElement.style.position = 'fixed';
            debugElement.style.bottom = '10px';
            debugElement.style.left = '10px';
            debugElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
            debugElement.style.color = '#00ff00';
            debugElement.style.padding = '10px';
            debugElement.style.fontFamily = 'monospace';
            debugElement.style.fontSize = '12px';
            debugElement.style.border = '1px solid #00ff00';
            debugElement.style.zIndex = '9999';
            debugElement.style.whiteSpace = 'pre';
            debugElement.innerHTML = 'Coordinate Debug: Initializing...';
            document.body.appendChild(debugElement);
            
            // Find the map container
            mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                console.error('[CoordSys] Map container not found!');
                debugElement.innerHTML += '\nERROR: Map container not found!';
                return false;
            }
            
            // Create coordinate display within map container
            coordDisplayElement = document.createElement('div');
            coordDisplayElement.id = 'coordinateDisplay';
            coordDisplayElement.className = 'map-coordinates';
            
            // Set initial content
            coordDisplayElement.innerHTML = `
                <div class="coord-position">
                    <span class="coord-label">POS:</span> 
                    <span id="coordPos" class="coord-value">X:0 Z:0</span>
                </div>
                <div class="coord-grid">
                    <span class="coord-label">GRID:</span> 
                    <span id="coordGrid" class="coord-value">(0, 0)</span>
                </div>
                <div id="coordCompass" class="coord-compass">N</div>
            `;
            
            // Add to the map container
            mapContainer.appendChild(coordDisplayElement);
            
            // Try to access window.state and its properties
            if (window.state) {
                debugElement.innerHTML += '\nFound window.state';
                
                if (state.scene) {
                    debugElement.innerHTML += '\nFound state.scene';
                    gameScene = state.scene;
                } else {
                    debugElement.innerHTML += '\nERROR: state.scene not found!';
                }
                
                if (state.systems) {
                    debugElement.innerHTML += '\nFound state.systems';
                    
                    if (state.systems.camera) {
                        debugElement.innerHTML += '\nFound state.systems.camera';
                        gameCamera = state.systems.camera;
                        
                        // Log camera details
                        debugElement.innerHTML += `\nCamera position: x=${gameCamera.position.x.toFixed(2)}, y=${gameCamera.position.y.toFixed(2)}, z=${gameCamera.position.z.toFixed(2)}`;
                        
                        // Set up a direct observer for the camera
                        setupCameraObserver();
                    } else {
                        debugElement.innerHTML += '\nERROR: state.systems.camera not found!';
                    }
                } else {
                    debugElement.innerHTML += '\nERROR: state.systems not found!';
                }
            } else {
                debugElement.innerHTML += '\nERROR: window.state not found!';
            }
            
            // Add a fallback direct polling update
            setInterval(pollCameraPosition, 100); // Poll 10 times per second
            
            // Mark as initialized
            initialized = true;
            console.log('[CoordSys] ✅ Coordinate system initialized');
            
            return true;
        } catch (e) {
            console.error('[CoordSys] ❌ Failed to initialize coordinate display:', e);
            if (debugElement) {
                debugElement.innerHTML += `\nERROR: ${e.message}`;
            }
            return false;
        }
    }
    
    // Setup a direct observer for the camera position
    function setupCameraObserver() {
        if (!gameScene || !gameCamera) {
            debugElement.innerHTML += '\nCannot setup camera observer: missing camera or scene';
            return;
        }
        
        try {
            debugElement.innerHTML += '\nSetting up camera observer...';
            
            // Register a before render callback
            gameScene.registerBeforeRender(function() {
                updateCount++;
                
                // Get camera position
                if (gameCamera && gameCamera.position) {
                    const pos = gameCamera.position;
                    const rot = gameCamera.rotation ? gameCamera.rotation.y : 0;
                    
                    // Only log occasionally to prevent console spam
                    const now = Date.now();
                    if (now - lastLogTime > 1000) { // Log once per second
                        console.log(`[CoordSys] Camera pos: x=${pos.x.toFixed(2)}, z=${pos.z.toFixed(2)}, updateCount=${updateCount}`);
                        lastLogTime = now;
                        
                        // Update debug display
                        if (debugElement) {
                            debugElement.innerHTML = `Coordinate Debug:
Camera found: ${gameCamera ? 'YES' : 'NO'}
Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}
Rotation: ${rot.toFixed(2)} rad
Updates: ${updateCount}
Last update: ${new Date().toLocaleTimeString()}`;
                        }
                    }
                    
                    // Update the position
                    updatePositionDirect(pos, rot);
                } else {
                    if (debugElement) {
                        debugElement.innerHTML += '\nCamera or position is null in observer!';
                    }
                }
            });
            
            debugElement.innerHTML += '\nCamera observer setup complete';
        } catch (e) {
            console.error('[CoordSys] Error setting up camera observer:', e);
            debugElement.innerHTML += `\nError setting up observer: ${e.message}`;
        }
    }
    
    // Poll camera position directly as a fallback
    function pollCameraPosition() {
        try {
            // Re-check for camera if not found earlier
            if (!gameCamera && window.state && state.systems && state.systems.camera) {
                gameCamera = state.systems.camera;
                debugElement.innerHTML += '\nCamera found on poll!';
            }
            
            if (gameCamera && gameCamera.position) {
                const pos = gameCamera.position;
                const rot = gameCamera.rotation ? gameCamera.rotation.y : 0;
                
                // Update the debug display with polling info
                if (debugElement) {
                    debugElement.innerHTML = `Coordinate Debug (Poll):
Camera found: ${gameCamera ? 'YES' : 'NO'}
Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}
Rotation: ${rot.toFixed(2)} rad
Last poll: ${new Date().toLocaleTimeString()}`;
                }
                
                // Update position
                updatePositionDirect(pos, rot);
            }
        } catch (e) {
            console.error('[CoordSys] Error in poll:', e);
        }
    }
    
    // Direct update from camera position
    function updatePositionDirect(cameraPosition, cameraRotation) {
        if (!cameraPosition) {
            console.error('[CoordSys] Invalid camera position');
            return;
        }
        
        try {
            // Update stored position
            position = {
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z
            };
            direction = cameraRotation || 0;
            
            // Force the display update
            updateDisplay();
        } catch (e) {
            console.error('[CoordSys] Error in updatePositionDirect:', e);
        }
    }
    
    // Update position (public method)
    function updatePosition(newPosition, newDirection) {
        console.log('[CoordSys] Manual updatePosition called:', newPosition);
        if (!newPosition) return;
        
        position = {
            x: newPosition.x || 0,
            y: newPosition.y || 0,
            z: newPosition.z || 0
        };
        direction = newDirection || 0;
        
        updateDisplay();
    }
    
    // Update the display elements
    function updateDisplay() {
        try {
            // Directly get elements by ID for more reliable updates
            const posElem = document.getElementById('coordPos');
            const gridElem = document.getElementById('coordGrid');
            const compassElem = document.getElementById('coordCompass');
            
            if (!posElem || !gridElem || !compassElem) {
                console.error('[CoordSys] Display elements not found');
                return;
            }
            
            // Get normalized coordinates
            const normX = normalizeCoordinate(position.x);
            const normZ = normalizeCoordinate(position.z);
            
            // Get grid coordinates
            const gridX = Math.round(position.x / gridSize);
            const gridZ = Math.round(position.z / gridSize);
            
            // Get compass direction
            const compassDir = getCompassDirection(direction);
            
            // Update DOM elements with new values
            posElem.textContent = `X:${normX} Z:${normZ}`;
            gridElem.textContent = `(${gridX}, ${gridZ})`;
            compassElem.textContent = compassDir;
        } catch (e) {
            console.error('[CoordSys] Error updating display:', e);
        }
    }
    
    // Map world coordinates to 0-100 range
    function normalizeCoordinate(value) {
        if (typeof value !== 'number') return 0;
        
        // Map from -50 to 50 range to 0-100 range
        const normalized = Math.floor(((value + 50) / 100) * 100);
        return Math.max(0, Math.min(100, normalized));
    }
    
    // Get compass direction from angle
    function getCompassDirection(radians) {
        // Convert to degrees and normalize to 0-360
        const degrees = ((radians * 180 / Math.PI) % 360 + 360) % 360;
        
        // Map to compass directions
        if (degrees >= 337.5 || degrees < 22.5) return 'N';
        if (degrees >= 22.5 && degrees < 67.5) return 'NE';
        if (degrees >= 67.5 && degrees < 112.5) return 'E';
        if (degrees >= 112.5 && degrees < 157.5) return 'SE';
        if (degrees >= 157.5 && degrees < 202.5) return 'S';
        if (degrees >= 202.5 && degrees < 247.5) return 'SW';
        if (degrees >= 247.5 && degrees < 292.5) return 'W';
        if (degrees >= 292.5 && degrees < 337.5) return 'NW';
        
        return 'N'; // fallback
    }
    
    // Show the coordinate display
    function show() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'flex';
        }
        if (debugElement) {
            debugElement.style.display = 'block';
        }
    }
    
    // Hide the coordinate display
    function hide() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'none';
        }
        if (debugElement) {
            debugElement.style.display = 'none';
        }
    }
    
    // Convert world position to grid position
    function worldToGrid(worldPos) {
        return {
            x: Math.round(worldPos.x / gridSize),
            z: Math.round(worldPos.z / gridSize)
        };
    }
    
    // Convert grid position to world position
    function gridToWorld(gridPos) {
        return {
            x: gridPos.x * gridSize,
            y: 0, // Default y position
            z: gridPos.z * gridSize
        };
    }
    
    // Get grid cell at world position
    function getGridCellAt(worldPos) {
        const gridPos = worldToGrid(worldPos);
        return {
            gridX: gridPos.x,
            gridZ: gridPos.z,
            worldX: gridPos.x * gridSize,
            worldZ: gridPos.z * gridSize
        };
    }
    
    // Public API
    return {
        init: init,
        updatePosition: updatePosition,
        show: show,
        hide: hide,
        worldToGrid: worldToGrid,
        gridToWorld: gridToWorld,
        getGridCellAt: getGridCellAt
    };
})(); 