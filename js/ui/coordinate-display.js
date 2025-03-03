// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainer = null;
    let coordDisplayElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Reference to the game camera and scene
    let gameCamera = null;
    let gameScene = null;
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
            console.log("Initializing coordinate display system...");
            
            // Find the map container
            mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                console.error('Map container not found!');
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
                    <span class="coord-value">X:0 Z:0</span>
                </div>
                <div class="coord-grid">
                    <span class="coord-label">GRID:</span> 
                    <span class="coord-value">(0, 0)</span>
                </div>
                <div class="coord-compass">N</div>
            `;
            
            // Add to the map container
            mapContainer.appendChild(coordDisplayElement);
            
            // Get references to game objects (this is crucial for tracking position)
            if (window.state && state.scene && state.systems && state.systems.camera) {
                gameScene = state.scene;
                gameCamera = state.systems.camera;
                console.log("Successfully connected to game camera and scene");
                
                // Register a direct update function on the game scene render loop
                gameScene.registerBeforeRender(function() {
                    if (gameCamera) {
                        const pos = gameCamera.position;
                        const rot = gameCamera.rotation.y;
                        updatePositionDirect(pos, rot);
                    }
                });
            } else {
                console.warn("Could not connect to game camera - coordinate tracking will be limited");
            }
            
            // Mark as initialized
            initialized = true;
            console.log('✅ Coordinate display system initialized');
            
            return true;
        } catch (e) {
            console.error('❌ Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Direct update from camera position (called every frame)
    function updatePositionDirect(cameraPosition, cameraRotation) {
        // Update the stored position
        position = {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z
        };
        direction = cameraRotation;
        
        // Update the UI immediately
        updateDisplay();
    }
    
    // Public update position method (can be called from outside)
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
    
    // Update the display with current position values
    function updateDisplay() {
        if (!coordDisplayElement) return;
        
        // Get normalized coordinates (0-100)
        const normX = normalizeCoordinate(position.x);
        const normZ = normalizeCoordinate(position.z);
        
        // Get grid coordinates
        const gridX = Math.round(position.x / gridSize);
        const gridZ = Math.round(position.z / gridSize);
        
        // Get compass direction
        const compassDir = getCompassDirection(direction);
        
        // Get position and grid elements
        const posValue = coordDisplayElement.querySelector('.coord-position .coord-value');
        const gridValue = coordDisplayElement.querySelector('.coord-grid .coord-value');
        const compassElem = coordDisplayElement.querySelector('.coord-compass');
        
        // Update the display directly for better performance
        if (posValue) posValue.textContent = `X:${normX} Z:${normZ}`;
        if (gridValue) gridValue.textContent = `(${gridX}, ${gridZ})`;
        if (compassElem) compassElem.textContent = compassDir;
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