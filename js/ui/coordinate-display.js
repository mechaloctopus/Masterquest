// Coordinate Display System - Shows player position and direction
window.CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let displayElement = null;
    let positionElement = null;
    let directionElement = null;
    let gridCoordElement = null;
    let compassElement = null;
    
    // Current player data
    let position = { x: 0, y: 0, z: 0 };
    let direction = 0; // In radians
    
    // Grid settings
    const gridSize = CONFIG.GRID.SPACING || 2; // Grid cell size
    
    // Initialize the coordinate display
    function init() {
        if (initialized) return true;
        
        try {
            // Create UI container
            displayElement = document.createElement('div');
            displayElement.id = 'coordinateDisplay';
            displayElement.className = 'coordinate-display';
            
            // Create position display
            positionElement = document.createElement('div');
            positionElement.className = 'coord-position';
            positionElement.innerHTML = 'Position: X:0 Z:0';
            displayElement.appendChild(positionElement);
            
            // Create grid coordinate display
            gridCoordElement = document.createElement('div');
            gridCoordElement.className = 'coord-grid';
            gridCoordElement.innerHTML = 'Grid: (0, 0)';
            displayElement.appendChild(gridCoordElement);
            
            // Create compass direction display
            compassElement = document.createElement('div');
            compassElement.className = 'coord-compass';
            compassElement.innerHTML = 'Facing: N';
            displayElement.appendChild(compassElement);
            
            // Create angle direction display
            directionElement = document.createElement('div');
            directionElement.className = 'coord-direction';
            directionElement.innerHTML = 'Angle: 0°';
            displayElement.appendChild(directionElement);
            
            // Add to the DOM
            document.body.appendChild(displayElement);
            
            // Mark as initialized
            initialized = true;
            console.log('Coordinate display system initialized');
            
            // Show the display immediately
            show();
            
            return true;
        } catch (e) {
            console.error('Failed to initialize coordinate display:', e);
            return false;
        }
    }
    
    // Apply CSS styles
    function applyStyles() {
        const css = `
            .coordinate-display {
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.8);
                border: 2px solid #00ffff;
                border-radius: 5px;
                padding: 12px;
                color: #00ffff;
                font-family: 'Orbitron', sans-serif;
                font-size: 16px;
                z-index: 1000;
                box-shadow: 0 0 15px #00ffff;
                min-width: 220px;
            }
            
            .coord-position, .coord-direction, .coord-grid, .coord-compass {
                margin-bottom: 8px;
                text-shadow: 0 0 5px #00ffff;
            }
            
            .coord-grid {
                color: #ff00cc;
            }
            
            .coord-compass {
                color: #ffff00;
                font-weight: bold;
                font-size: 18px;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
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
        updateDisplay();
    }
    
    // Map world coordinates to 0-100 range
    function normalizeCoordinate(value) {
        // Assuming the world is roughly -50 to 50 in size
        // Map to 0-100 range
        const normalized = Math.floor(((value + 50) / 100) * 100);
        return Math.max(0, Math.min(100, normalized)); // Clamp between 0-100
    }
    
    // Update the display with current values
    function updateDisplay() {
        if (!initialized || !displayElement) return;
        
        // Make sure the display is visible
        displayElement.style.display = 'block';
        
        // Normalize coordinates to 0-100 range
        const normX = normalizeCoordinate(position.x);
        const normZ = normalizeCoordinate(position.z);
        
        // Update position display with normalized coordinates (0-100)
        positionElement.innerHTML = `Position: X:${normX} Z:${normZ}`;
        
        // Calculate grid coordinates
        const gridX = Math.round(position.x / gridSize);
        const gridZ = Math.round(position.z / gridSize);
        gridCoordElement.innerHTML = `Grid: (${gridX}, ${gridZ})`;
        
        // Update compass direction
        const compassDir = getCompassDirection(direction);
        compassElement.innerHTML = `Facing: ${compassDir}`;
        
        // Convert direction from radians to degrees (0-360)
        const degrees = ((direction * 180 / Math.PI) % 360 + 360) % 360;
        directionElement.innerHTML = `Angle: ${Math.round(degrees)}°`;
    }
    
    // Show the coordinate display
    function show() {
        if (displayElement) {
            displayElement.style.display = 'block';
            // Force an update of the display values
            updateDisplay();
            console.log("Coordinate display shown");
        }
    }
    
    // Hide the coordinate display
    function hide() {
        if (displayElement) {
            displayElement.style.display = 'none';
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