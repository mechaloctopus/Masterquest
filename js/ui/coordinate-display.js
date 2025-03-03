// Coordinate Display System - Shows player position and direction
const CoordinateSystem = (function() {
    // Private properties
    let initialized = false;
    let displayElement = null;
    let positionElement = null;
    let directionElement = null;
    let gridCoordElement = null;
    
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
            positionElement.innerHTML = 'Position: X:0.00 Y:0.00 Z:0.00';
            displayElement.appendChild(positionElement);
            
            // Create direction display
            directionElement = document.createElement('div');
            directionElement.className = 'coord-direction';
            directionElement.innerHTML = 'Direction: 0°';
            displayElement.appendChild(directionElement);
            
            // Create grid coordinate display
            gridCoordElement = document.createElement('div');
            gridCoordElement.className = 'coord-grid';
            gridCoordElement.innerHTML = 'Grid: (0, 0)';
            displayElement.appendChild(gridCoordElement);
            
            // Add to the DOM
            document.body.appendChild(displayElement);
            
            // Apply initial styles
            applyStyles();
            
            // Mark as initialized
            initialized = true;
            console.log('Coordinate display system initialized');
            
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
                bottom: 10px;
                left: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                border: 1px solid #00ffff;
                border-radius: 5px;
                padding: 10px;
                color: #00ffff;
                font-family: 'Orbitron', sans-serif;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 0 10px #00ffff;
                min-width: 220px;
            }
            
            .coord-position, .coord-direction, .coord-grid {
                margin-bottom: 5px;
            }
            
            .coord-grid {
                color: #ff00cc;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }
    
    // Update player position and direction
    function updatePosition(newPosition, newDirection) {
        position = newPosition;
        direction = newDirection;
        
        // Update the display
        updateDisplay();
    }
    
    // Update the display with current values
    function updateDisplay() {
        if (!initialized || !displayElement) return;
        
        // Update position display with formatted coordinates
        positionElement.innerHTML = `Position: X:${position.x.toFixed(2)} Y:${position.y.toFixed(2)} Z:${position.z.toFixed(2)}`;
        
        // Convert direction from radians to degrees (0-360)
        const degrees = ((direction * 180 / Math.PI) % 360 + 360) % 360;
        directionElement.innerHTML = `Direction: ${degrees.toFixed(1)}°`;
        
        // Calculate grid coordinates
        const gridX = Math.round(position.x / gridSize);
        const gridZ = Math.round(position.z / gridSize);
        gridCoordElement.innerHTML = `Grid: (${gridX}, ${gridZ})`;
    }
    
    // Show the coordinate display
    function show() {
        if (displayElement) {
            displayElement.style.display = 'block';
        }
    }
    
    // Hide the coordinate display
    function hide() {
        if (displayElement) {
            displayElement.style.display = 'none';
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