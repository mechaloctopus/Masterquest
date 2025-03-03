// Map System
const MapSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainerElement = null;
    let mapToggleElement = null;
    let mapCanvasElement = null;
    let mapContext = null;
    let isCollapsed = false;
    
    // Map data
    let mapData = null;
    let playerPosition = { x: 0, z: 0 };
    let playerRotation = 0;
    const mapScale = 0.1; // Scale factor for converting world to map coordinates
    
    // Initialize the map
    function init() {
        if (initialized) return true;
        
        // Get map elements
        mapContainerElement = document.getElementById('mapContainer');
        if (!mapContainerElement) {
            console.error("Map container element not found!");
            return false;
        }
        
        mapToggleElement = document.getElementById('mapToggle');
        mapCanvasElement = document.getElementById('mapCanvas');
        
        // Set up map canvas
        if (mapCanvasElement) {
            const width = mapCanvasElement.parentElement.clientWidth;
            const height = mapCanvasElement.parentElement.clientHeight - 30; // Subtract header height
            
            mapCanvasElement.width = width;
            mapCanvasElement.height = height;
            
            mapContext = mapCanvasElement.getContext('2d');
        }
        
        // Set up toggle functionality
        if (mapToggleElement) {
            mapToggleElement.addEventListener('click', toggleMap);
        }
        
        // Initialize with empty map data
        createEmptyMap();
        
        // Start map rendering
        requestAnimationFrame(render);
        
        initialized = true;
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> MAP SYSTEM INITIALIZED");
        }
        
        return true;
    }
    
    // Create empty map data
    function createEmptyMap() {
        mapData = {
            width: 50,
            height: 50,
            grid: true,
            gridSpacing: 2,
            gridColor: "#00ffcc",
            backgroundColor: "rgba(0, 0, 51, 0.8)",
            points: [] // Points of interest
        };
    }
    
    // Toggle map collapsed state
    function toggleMap() {
        if (!mapContainerElement) return;
        
        isCollapsed = !isCollapsed;
        
        if (isCollapsed) {
            mapContainerElement.classList.add('collapsed');
            if (mapToggleElement) {
                mapToggleElement.textContent = '▲';
            }
        } else {
            mapContainerElement.classList.remove('collapsed');
            if (mapToggleElement) {
                mapToggleElement.textContent = '▼';
            }
            
            // Resize canvas when expanded
            if (mapCanvasElement) {
                const width = mapCanvasElement.parentElement.clientWidth;
                const height = mapCanvasElement.parentElement.clientHeight - 30;
                
                mapCanvasElement.width = width;
                mapCanvasElement.height = height;
            }
        }
        
        // Emit map toggle event
        if (window.EventSystem) {
            EventSystem.emit('map.toggled', { collapsed: isCollapsed });
        }
    }
    
    // Update player position on the map
    function updatePlayerPosition(position, rotation) {
        playerPosition = { x: position.x, z: position.z };
        playerRotation = rotation;
    }
    
    // Render the map
    function render() {
        if (!mapContext || !mapData || isCollapsed) {
            requestAnimationFrame(render);
            return;
        }
        
        // Clear canvas
        mapContext.fillStyle = mapData.backgroundColor;
        mapContext.fillRect(0, 0, mapCanvasElement.width, mapCanvasElement.height);
        
        // Draw grid if enabled
        if (mapData.grid) {
            drawGrid();
        }
        
        // Draw points of interest
        drawPoints();
        
        // Draw player marker
        drawPlayer();
        
        // Continue render loop
        requestAnimationFrame(render);
    }
    
    // Draw map grid
    function drawGrid() {
        if (!mapContext) return;
        
        const spacing = mapData.gridSpacing * mapScale * mapCanvasElement.width;
        mapContext.strokeStyle = mapData.gridColor;
        mapContext.lineWidth = 0.5;
        mapContext.globalAlpha = 0.3;
        
        // Calculate center offset
        const centerX = mapCanvasElement.width / 2;
        const centerZ = mapCanvasElement.height / 2;
        
        // Calculate player offset
        const playerOffsetX = playerPosition.x * mapScale;
        const playerOffsetZ = playerPosition.z * mapScale;
        
        // Draw vertical lines
        for (let x = -mapData.width / 2; x <= mapData.width / 2; x += mapData.gridSpacing) {
            const mapX = centerX + (x * mapScale - playerOffsetX) * mapCanvasElement.width;
            
            mapContext.beginPath();
            mapContext.moveTo(mapX, 0);
            mapContext.lineTo(mapX, mapCanvasElement.height - 40); // Leave space for coordinates
            mapContext.stroke();
            
            // Draw grid coordinate labels for major grid lines
            if (x % 10 === 0) {
                mapContext.fillStyle = "#00ffcc";
                mapContext.font = "8px Orbitron";
                mapContext.fillText(x.toString(), mapX - 5, mapCanvasElement.height - 42);
            }
        }
        
        // Draw horizontal lines
        for (let z = -mapData.height / 2; z <= mapData.height / 2; z += mapData.gridSpacing) {
            const mapZ = centerZ + (z * mapScale - playerOffsetZ) * mapCanvasElement.height;
            
            mapContext.beginPath();
            mapContext.moveTo(0, mapZ);
            mapContext.lineTo(mapCanvasElement.width, mapZ);
            mapContext.stroke();
            
            // Draw grid coordinate labels for major grid lines
            if (z % 10 === 0) {
                mapContext.fillStyle = "#00ffcc";
                mapContext.font = "8px Orbitron";
                mapContext.fillText(z.toString(), 5, mapZ + 8);
            }
        }
        
        mapContext.globalAlpha = 1.0;
    }
    
    // Draw points of interest
    function drawPoints() {
        if (!mapContext || !mapData.points) return;
        
        // Calculate center offset
        const centerX = mapCanvasElement.width / 2;
        const centerZ = mapCanvasElement.height / 2;
        
        // Calculate player offset
        const playerOffsetX = playerPosition.x * mapScale;
        const playerOffsetZ = playerPosition.z * mapScale;
        
        // Draw each point
        mapData.points.forEach(point => {
            const mapX = centerX + (point.x * mapScale - playerOffsetX) * mapCanvasElement.width;
            const mapZ = centerZ + (point.z * mapScale - playerOffsetZ) * mapCanvasElement.height;
            
            // Skip points outside the map
            if (mapX < 0 || mapX > mapCanvasElement.width || mapZ < 0 || mapZ > mapCanvasElement.height) {
                return;
            }
            
            // Draw point
            mapContext.fillStyle = point.color || "#ffffff";
            mapContext.beginPath();
            mapContext.arc(mapX, mapZ, point.size || 3, 0, Math.PI * 2);
            mapContext.fill();
            
            // Draw label if specified
            if (point.label) {
                mapContext.fillStyle = "#ffffff";
                mapContext.font = "8px Arial";
                mapContext.fillText(point.label, mapX + 5, mapZ + 3);
            }
        });
    }
    
    // Draw player marker
    function drawPlayer() {
        if (!mapContext) return;
        
        const centerX = mapCanvasElement.width / 2;
        const centerZ = mapCanvasElement.height / 2;
        
        // Draw player position
        mapContext.fillStyle = "#ff00cc";
        mapContext.beginPath();
        mapContext.arc(centerX, centerZ, 4, 0, Math.PI * 2);
        mapContext.fill();
        
        // Draw direction indicator
        const dirX = Math.sin(playerRotation) * 8;
        const dirZ = Math.cos(playerRotation) * 8;
        
        mapContext.strokeStyle = "#ff00cc";
        mapContext.lineWidth = 2;
        mapContext.beginPath();
        mapContext.moveTo(centerX, centerZ);
        mapContext.lineTo(centerX + dirX, centerZ - dirZ);
        mapContext.stroke();
    }
    
    // Add a point of interest to the map
    function addPoint(x, z, options = {}) {
        if (!mapData) createEmptyMap();
        
        const point = {
            x,
            z,
            color: options.color || "#ffffff",
            size: options.size || 3,
            label: options.label || null,
            type: options.type || "generic"
        };
        
        mapData.points.push(point);
        
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        if (!mapData || !mapData.points) return false;
        
        const index = mapData.points.findIndex(p => p.x === x && p.z === z);
        
        if (index !== -1) {
            mapData.points.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    // Clear all points from the map
    function clearPoints() {
        if (!mapData) return;
        
        mapData.points = [];
    }
    
    // Set map data
    function setMapData(data) {
        mapData = data;
    }
    
    // Get map data
    function getMapData() {
        return mapData;
    }
    
    // Check if map is collapsed
    function isMapCollapsed() {
        return isCollapsed;
    }
    
    // Show the map
    function show() {
        if (!mapContainerElement) return;
        
        mapContainerElement.style.display = 'block';
    }
    
    // Hide the map
    function hide() {
        if (!mapContainerElement) return;
        
        mapContainerElement.style.display = 'none';
    }
    
    // Handle window resize
    function handleResize() {
        if (!mapCanvasElement || isCollapsed) return;
        
        const width = mapCanvasElement.parentElement.clientWidth;
        const height = mapCanvasElement.parentElement.clientHeight - 30;
        
        mapCanvasElement.width = width;
        mapCanvasElement.height = height;
    }
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        updatePlayerPosition,
        addPoint,
        removePoint,
        clearPoints,
        setMapData,
        getMapData,
        toggle: toggleMap,
        isCollapsed: isMapCollapsed,
        show,
        hide
    };
})(); 