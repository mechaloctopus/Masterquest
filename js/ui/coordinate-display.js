// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainer = null;
    let coordDisplayElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Reference to the camera
    let lastUpdateTime = 0;
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
            console.log("[CoordSys] Initializing coordinate display system...");
            
            // Find the map container
            mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                console.error('[CoordSys] Map container not found!');
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
            
            // Set up a direct polling method for the camera position
            // This is more reliable than trying to hook into the render loop
            setInterval(function() {
                // Try to access the camera directly from the global state
                if (window.state && state.systems && state.systems.camera) {
                    const camera = state.systems.camera;
                    if (camera && camera.position) {
                        // Camera found, update the coordinates
                        updatePositionDirect({
                            x: camera.position.x,
                            y: camera.position.y,
                            z: camera.position.z
                        }, camera.rotation ? camera.rotation.y : 0);
                    }
                }
            }, 100); // Poll 10 times per second
            
            // Mark as initialized
            initialized = true;
            console.log('[CoordSys] ✅ Coordinate system initialized');
            
            return true;
        } catch (e) {
            console.error('[CoordSys] ❌ Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Direct update from camera position
    function updatePositionDirect(cameraPosition, cameraRotation) {
        if (!cameraPosition) return;
        
        // Only update if we have valid data
        if (typeof cameraPosition.x === 'number' && 
            typeof cameraPosition.z === 'number') {
            
            // Update stored position
            position = {
                x: cameraPosition.x,
                y: cameraPosition.y || 0,
                z: cameraPosition.z
            };
            direction = cameraRotation || 0;
            
            // Only log occasionally to avoid spamming
            const now = Date.now();
            if (now - lastUpdateTime > 1000) { // Once per second
                console.log(`[CoordSys] Position updated: x=${position.x.toFixed(2)}, z=${position.z.toFixed(2)}`);
                lastUpdateTime = now;
            }
            
            // Update the display
            updateDisplay();
        }
    }
    
    // Public update position method (called from app.js or test script)
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
    
    // Update the display elements
    function updateDisplay() {
        try {
            // Get elements by ID
            const posElem = document.getElementById('coordPos');
            const gridElem = document.getElementById('coordGrid');
            const compassElem = document.getElementById('coordCompass');
            
            if (!posElem || !gridElem || !compassElem) return;
            
            // Get normalized coordinates (0-100)
            const normX = normalizeCoordinate(position.x);
            const normZ = normalizeCoordinate(position.z);
            
            // Get grid coordinates
            const gridX = Math.round(position.x / gridSize);
            const gridZ = Math.round(position.z / gridSize);
            
            // Get compass direction
            const compassDir = getCompassDirection(direction);
            
            // Update DOM elements directly
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
    }
    
    // Hide the coordinate display
    function hide() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'none';
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