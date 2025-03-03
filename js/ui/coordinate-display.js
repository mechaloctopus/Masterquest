// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainer = null;
    let coordDisplayElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
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
            updateCoordinateText();
            
            // Add to the map container (after the canvas but before any other controls)
            mapContainer.appendChild(coordDisplayElement);
            
            // Mark as initialized
            initialized = true;
            console.log('Coordinate display system initialized (embedded in map)');
            
            return true;
        } catch (e) {
            console.error('Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Update the coordinates text
    function updateCoordinateText() {
        if (!coordDisplayElement) return;
        
        // Normalize coordinates to 0-100 range
        const normX = normalizeCoordinate(position.x);
        const normZ = normalizeCoordinate(position.z);
        
        // Get compass direction
        const compassDir = getCompassDirection(direction);
        
        // Create formatted HTML
        coordDisplayElement.innerHTML = 
            `<div class="coord-item">X: ${normX} Z: ${normZ}</div>
            <div class="coord-item coord-compass">${compassDir}</div>`;
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
    
    // Update player position and direction
    function updatePosition(newPosition, newDirection) {
        position = newPosition;
        direction = newDirection;
        
        // Update the display
        updateCoordinateText();
    }
    
    // Map world coordinates to 0-100 range
    function normalizeCoordinate(value) {
        // Assuming the world is roughly -50 to 50 in size
        // Map to 0-100 range
        const normalized = Math.floor(((value + 50) / 100) * 100);
        return Math.max(0, Math.min(100, normalized)); // Clamp between 0-100
    }
    
    // Show the coordinate display
    function show() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'block';
            console.log("Coordinate display shown");
        }
    }
    
    // Hide the coordinate display
    function hide() {
        if (coordDisplayElement) {
            coordDisplayElement.style.display = 'none';
            console.log("Coordinate display hidden");
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
    
    // Public API
    return {
        init: init,
        updatePosition: updatePosition,
        show: show,
        hide: hide,
        worldToGrid: worldToGrid,
        gridToWorld: gridToWorld
    };
})(); 