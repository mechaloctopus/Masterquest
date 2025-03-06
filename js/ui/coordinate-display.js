// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainer = null;
    let coordDisplayElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Last time we logged position (to prevent log spam)
    let lastLogTime = 0;
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Remove any test coordinates button
    (function removeTestButton() {
        const testBtn = document.getElementById('testCoordButton');
        if (testBtn) {
            testBtn.parentNode.removeChild(testBtn);
            console.log("[CoordSys] Removed test coordinates button");
        }
    })();
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
            // Find the map container
            mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                console.error('[CoordSys] Map container not found!');
                return false;
            }
            
            // Check if coordinate display already exists and remove it
            const existingDisplay = document.getElementById('coordinateDisplay');
            if (existingDisplay) {
                existingDisplay.parentNode.removeChild(existingDisplay);
                console.log('[CoordSys] Removed existing coordinate display');
            }
            
            // Create coordinate display as a separate element
            coordDisplayElement = document.createElement('div');
            coordDisplayElement.id = 'coordinateDisplay';
            coordDisplayElement.className = 'map-coordinates';
            coordDisplayElement.style.display = 'flex'; // Ensure it's visible
            
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
            
            // Add to the document body rather than inside the map
            document.body.appendChild(coordDisplayElement);
            
            // Connect to the Babylon.js camera
            connectToCamera();
            
            // Mark as initialized
            initialized = true;
            console.log('[CoordSys] Coordinate system initialized');
            
            return true;
        } catch (e) {
            console.error('[CoordSys] Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Connect to the camera for position updates
    function connectToCamera() {
        const checkInterval = setInterval(function() {
            // Try to connect to Babylon.js camera first
            if (window.BABYLON && BABYLON.Engine.Instances.length > 0) {
                const engine = BABYLON.Engine.Instances[0];
                if (engine?.scenes?.length > 0) {
                    const scene = engine.scenes[0];
                    
                    if (scene.activeCamera) {
                        // Set up a direct observer on the scene's render loop
                        scene.onBeforeRenderObservable.add(() => {
                            const camera = scene.activeCamera;
                            if (camera?.position) {
                                updateFromCamera(camera);
                            }
                        });
                        
                        clearInterval(checkInterval);
                        return;
                    }
                }
            }
            
            // Fallback: check state.systems.camera
            if (window.state?.systems?.camera) {
                const camera = state.systems.camera;
                if (camera?.position) {
                    updateFromCamera(camera);
                }
            }
        }, 200);
    }
    
    // Update position from camera data
    function updateFromCamera(camera) {
        if (!camera?.position) return;
        
        // Update stored position
        position = {
            x: camera.position.x,
            y: camera.position.y || 0,
            z: camera.position.z
        };
        direction = camera.rotation?.y || 0;
        
        // Occasional logging (limit to once per second)
        const now = Date.now();
        if (now - lastLogTime > 1000) {
            console.log(`[CoordSys] Position: x=${position.x.toFixed(1)}, z=${position.z.toFixed(1)}`);
            lastLogTime = now;
        }
        
        // Update the display
        updateDisplay();
    }
    
    // Public method for position updates (used by test script)
    function updatePosition(newPosition, newDirection) {
        if (!newPosition) return;
        
        position = {
            x: newPosition.x || 0,
            y: newPosition.y || 0,
            z: newPosition.z || 0
        };
        direction = newDirection || 0;
        
        updateDisplay();
    }
    
    // Update the coordinate display elements
    function updateDisplay() {
        try {
            const posElem = document.getElementById('coordPos');
            const gridElem = document.getElementById('coordGrid');
            const compassElem = document.getElementById('coordCompass');
            
            if (!posElem || !gridElem || !compassElem) return;
            
            // Get rounded coordinates
            const rawX = Math.round(position.x);
            const rawZ = Math.round(position.z);
            
            // Get grid coordinates
            const gridX = Math.round(position.x / gridSize);
            const gridZ = Math.round(position.z / gridSize);
            
            // Get compass direction
            const compassDir = getCompassDirection(direction);
            
            // Update the DOM elements
            posElem.textContent = `X:${rawX} Z:${rawZ}`;
            gridElem.textContent = `(${gridX}, ${gridZ})`;
            compassElem.textContent = compassDir;
        } catch (e) {
            console.error('[CoordSys] Error updating display:', e);
        }
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
    
    // Show/hide methods
    function show() {
        if (coordDisplayElement) coordDisplayElement.style.display = 'flex';
    }
    
    function hide() {
        if (coordDisplayElement) coordDisplayElement.style.display = 'none';
    }
    
    // Grid utility functions
    function worldToGrid(worldPos) {
        return {
            x: Math.round(worldPos.x / gridSize),
            z: Math.round(worldPos.z / gridSize)
        };
    }
    
    function gridToWorld(gridPos) {
        return {
            x: gridPos.x * gridSize,
            y: 0,
            z: gridPos.z * gridSize
        };
    }
    
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

// Initialize coordinate display when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[CoordSys] Document ready, initializing coordinate system');
    if (window.CoordinateSystem && typeof window.CoordinateSystem.init === 'function') {
        setTimeout(function() {
            window.CoordinateSystem.init();
            window.CoordinateSystem.show();
        }, 500); // Slight delay to ensure other systems are ready
    }
}); 