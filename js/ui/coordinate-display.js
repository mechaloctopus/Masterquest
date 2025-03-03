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
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Debug flag
    const DEBUG = true;
    
    // Last update timestamp to track changes
    let lastUpdateTime = 0;
    
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
            
            // Create debug element to show raw data if needed
            debugElement = document.createElement('div');
            debugElement.id = 'coordDebug';
            debugElement.className = 'coord-debug';
            debugElement.style.display = DEBUG ? 'block' : 'none';
            debugElement.innerHTML = 'Waiting for position data...';
            
            // Append elements to map container
            mapContainer.appendChild(coordDisplayElement);
            if (DEBUG) document.body.appendChild(debugElement);
            
            // Set initial content
            updateCoordinateText();
            
            // Set up a direct timer to periodically update the display
            // This ensures updates even if the normal update mechanism fails
            setInterval(function() {
                updateCoordinateText();
            }, 200); // Update 5 times per second
            
            // Register an event listener for player position updates as a backup
            if (window.EventSystem) {
                EventSystem.on('player.position', function(data) {
                    if (DEBUG) console.log('Position event received:', data);
                    updatePositionFromEvent(data);
                });
            }
            
            // Mark as initialized and log success
            initialized = true;
            console.log('✅ Coordinate display system initialized (embedded in map)');
            
            return true;
        } catch (e) {
            console.error('❌ Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Handle position updates from events
    function updatePositionFromEvent(data) {
        if (!data || !data.position) return;
        updatePosition(data.position, data.rotation);
    }
    
    // Update player position and direction (main method)
    function updatePosition(newPosition, newDirection) {
        if (!newPosition) {
            console.error('Invalid position data provided:', newPosition);
            return;
        }
        
        // Update timestamp to track changes
        lastUpdateTime = Date.now();
        
        // Update stored position and direction
        position = {
            x: newPosition.x || 0,
            y: newPosition.y || 0,
            z: newPosition.z || 0
        };
        
        direction = newDirection || 0;
        
        // Update displayed text
        updateCoordinateText();
        
        // Show debug information if enabled
        if (DEBUG && debugElement) {
            debugElement.innerHTML = `
                Raw Position: x=${position.x.toFixed(2)}, y=${position.y.toFixed(2)}, z=${position.z.toFixed(2)}<br>
                Direction: ${direction.toFixed(2)} rad<br>
                Last Update: ${new Date().toLocaleTimeString()}
            `;
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
    
    // Update the coordinates text display
    function updateCoordinateText() {
        if (!coordDisplayElement) return;
        
        // Get normalized coordinates (0-100)
        const normX = normalizeCoordinate(position.x);
        const normZ = normalizeCoordinate(position.z);
        
        // Get compass direction
        const compassDir = getCompassDirection(direction);
        
        // Get grid coordinates
        const gridX = Math.round(position.x / gridSize);
        const gridZ = Math.round(position.z / gridSize);
        
        // Create formatted HTML with all information
        coordDisplayElement.innerHTML = `
            <div class="coord-position">
                <span class="coord-label">POS:</span> 
                <span class="coord-value">X:${normX} Z:${normZ}</span>
            </div>
            <div class="coord-grid">
                <span class="coord-label">GRID:</span> 
                <span class="coord-value">(${gridX}, ${gridZ})</span>
            </div>
            <div class="coord-compass">${compassDir}</div>
        `;
    }
    
    // Show the coordinate display
    function show() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'flex';
        }
        if (DEBUG && debugElement) {
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
    
    // Place an asset at a specific grid position
    function placeAssetAtGrid(gridX, gridZ, assetType) {
        const worldPos = gridToWorld({x: gridX, z: gridZ});
        
        if (DEBUG) {
            console.log(`Placing asset of type ${assetType} at grid (${gridX}, ${gridZ}), world position:`, worldPos);
        }
        
        // This is just a placeholder for the actual asset placement logic
        // You would need to integrate with your asset management system
        
        return {
            gridPosition: {x: gridX, z: gridZ},
            worldPosition: worldPos,
            assetType: assetType
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
        getGridCellAt: getGridCellAt,
        placeAssetAtGrid: placeAssetAtGrid
    };
})(); 