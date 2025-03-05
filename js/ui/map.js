// Map System
const MapSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainerElement = null;
    let mapToggleElement = null;
    let mapCanvasElement = null;
    let mapContext = null;
    let isCollapsed = false;
    
    // Debug flag - enable to see debug information
    const DEBUG = true;
    
    // Map data
    let mapData = null;
    let playerPosition = { x: 0, z: 0 };
    let lastPlayerPosition = { x: 0, z: 0 }; // To track changes
    let playerRotation = 0;
    const mapScale = 0.1; // Scale factor for converting world to map coordinates
    
    // Initialize the map
    function init() {
        if (initialized) return true;
        
        if (DEBUG) console.log("[MAP] Initializing map system");
        
        // Get map elements
        mapContainerElement = document.getElementById('mapContainer');
        if (!mapContainerElement) {
            console.error("[MAP] Map container element not found!");
            return false;
        }
        
        mapToggleElement = document.getElementById('mapToggle');
        if (!mapToggleElement) {
            console.error("[MAP] Map toggle element not found!");
            return false;
        }
        
        mapCanvasElement = document.getElementById('mapCanvas');
        if (!mapCanvasElement) {
            console.error("[MAP] Map canvas element not found!");
            return false;
        }
        
        // Initial collapse state
        isCollapsed = !mapContainerElement.classList.contains('expanded');
        if (DEBUG) console.log("[MAP] Initial collapse state:", isCollapsed);
        
        // Set up map canvas
        mapCanvasElement.width = mapCanvasElement.parentElement.clientWidth;
        mapCanvasElement.height = mapCanvasElement.parentElement.clientHeight - 30;
        mapContext = mapCanvasElement.getContext('2d');
        
        if (DEBUG) console.log("[MAP] Canvas setup complete", mapCanvasElement.width, mapCanvasElement.height);
        
        // Add toggle event listener
        mapToggleElement.addEventListener('click', function(e) {
            toggleMap();
            e.preventDefault();
        });
        
        // Create initial empty map
        createEmptyMap();
        
        // Add test points for debugging
        if (DEBUG) {
            addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
            addPoint(10, 10, { label: "10,10", color: "#00FF00" });
            addPoint(-10, -10, { label: "-10,-10", color: "#FF00FF" });
            console.log("[MAP] Added test points");
        }
        
        // Start render loop
        requestAnimationFrame(render);
        
        initialized = true;
        console.log("[MAP] Initialization complete:", initialized);
        return true;
    }
    
    // Create an empty map
    function createEmptyMap() {
        if (DEBUG) console.log("[MAP] Empty map created");
        
        mapData = {
            width: 100,
            height: 100,
            grid: true,
            gridSpacing: 1,
            gridColor: "#00cc99",
            backgroundColor: "#001a33",
            points: []
        };
        
        return mapData;
    }
    
    // Toggle map expanded/collapsed
    function toggleMap() {
        if (DEBUG) console.log("[MAP] Toggle map called. Current state:", isCollapsed);
        
        if (!mapContainerElement) return;
        
        // Toggle expanded class
        if (isCollapsed) {
            expandMap();
        } else {
            collapseMap();
        }
        
        // Toggle the collapse state
        isCollapsed = !isCollapsed;
        console.log("[MAP] Map toggled using global function. New state:", isCollapsed);
        
        // Resize canvas after toggle
        handleMapExpansion();
        
        return isCollapsed;
    }
    
    // Expand the map
    function expandMap() {
        if (!mapContainerElement) return;
        
        mapContainerElement.classList.add('expanded');
        const expandEvent = new CustomEvent('map.expanded');
        document.dispatchEvent(expandEvent);
    }
    
    // Collapse the map
    function collapseMap() {
        if (!mapContainerElement) return;
        
        mapContainerElement.classList.remove('expanded');
        const collapseEvent = new CustomEvent('map.collapsed');
        document.dispatchEvent(collapseEvent);
    }
    
    // Handle map expansion resize
    function handleMapExpansion() {
        if (!mapCanvasElement) return;
        
        // Get new dimensions
        mapCanvasElement.width = mapCanvasElement.parentElement.clientWidth;
        mapCanvasElement.height = mapCanvasElement.parentElement.clientHeight - 30;
        
        if (DEBUG) console.log("[MAP] Expansion handled. Canvas resized to:", mapCanvasElement.width, mapCanvasElement.height);
    }
    
    // Update player position on the map
    function updatePlayerPosition(position, rotation) {
        if (!position || position.x === undefined || position.z === undefined) {
            console.error("[MAP] Invalid position provided:", position);
            return;
        }
        
        // Store previous position for change detection
        lastPlayerPosition = { 
            x: playerPosition.x, 
            z: playerPosition.z 
        };
        
        // Update current position
        playerPosition = { 
            x: position.x, 
            z: position.z 
        };
        playerRotation = rotation;
        
        // Debug logs with limited frequency to avoid console spam
        if (DEBUG && 
            (Math.abs(lastPlayerPosition.x - playerPosition.x) > 0.1 || 
             Math.abs(lastPlayerPosition.z - playerPosition.z) > 0.1)) {
            console.log("[MAP] Player position updated:", 
                        playerPosition.x.toFixed(2), 
                        playerPosition.z.toFixed(2),
                        "Rotation:", playerRotation.toFixed(2));
        }
    }
    
    // Render the map - this is called in a loop
    function render() {
        // Always request next frame first to ensure the loop continues even if there's an error
        const animationId = requestAnimationFrame(render);
        
        if (!mapContext || !mapData || !mapCanvasElement) {
            if (DEBUG) console.log("[MAP] Skipping render: missing context, data, or canvas");
            return;
        }
        
        // Skip if not visible, but don't exit the render loop
        if (mapContainerElement.style.display === 'none') {
            return;
        }
        
        try {
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
            
            // Debug rendering count (every ~100 frames)
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Rendering map. Player at:", 
                            playerPosition.x.toFixed(2), 
                            playerPosition.z.toFixed(2));
            }
        } catch (e) {
            console.error("[MAP] Error in render function:", e);
        }
    }
    
    // Draw map grid
    function drawGrid() {
        if (!mapContext) return;
        
        try {
            const expanded = mapContainerElement.classList.contains('expanded');
            const gridScale = expanded ? 0.5 : mapScale; // Larger scale when expanded
            
            mapContext.strokeStyle = mapData.gridColor;
            mapContext.lineWidth = 0.5;
            mapContext.globalAlpha = 0.3;
            
            // Calculate center offset
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            
            // Get grid cell size in pixels
            const cellSizeX = gridScale * mapCanvasElement.width * mapData.gridSpacing;
            const cellSizeZ = gridScale * mapCanvasElement.height * mapData.gridSpacing;
            
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drawing grid. Cell size:", cellSizeX.toFixed(2), cellSizeZ.toFixed(2));
            }
            
            if (expanded) {
                // EXPANDED MODE: Fixed grid, moving player
                // Draw vertical lines
                for (let x = -mapData.width / 2; x <= mapData.width / 2; x += mapData.gridSpacing) {
                    const mapX = centerX + (x * gridScale * mapCanvasElement.width);
                    
                    mapContext.beginPath();
                    mapContext.moveTo(mapX, 0);
                    mapContext.lineTo(mapX, mapCanvasElement.height - 40);
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
                    const mapZ = centerZ + (z * gridScale * mapCanvasElement.height);
                    
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
            } else {
                // COLLAPSED MODE: Moving grid, fixed player
                // Calculate offset based on player position
                // This is the KEY part that makes the grid move with player movement
                const gridCellsX = mapCanvasElement.width / cellSizeX;
                const gridCellsZ = mapCanvasElement.height / cellSizeZ;
                
                // Calculate player offset in grid cells - NEGATIVE because grid moves opposite to player
                const playerOffsetX = -playerPosition.x;
                const playerOffsetZ = -playerPosition.z;
                
                // Debug log the offset occasionally
                if (DEBUG && Math.random() < 0.01) {
                    console.log("[MAP] Grid offset:", 
                                playerOffsetX.toFixed(2), 
                                playerOffsetZ.toFixed(2),
                                "Player:", 
                                playerPosition.x.toFixed(2),
                                playerPosition.z.toFixed(2));
                }
                
                // Calculate grid line positions relative to player position
                const startOffsetX = (playerOffsetX % 1) * cellSizeX;
                const startOffsetZ = (playerOffsetZ % 1) * cellSizeZ;
                
                // Adjust for positive and negative positions
                const startX = (startOffsetX < 0) ? startOffsetX + cellSizeX : startOffsetX;
                const startZ = (startOffsetZ < 0) ? startOffsetZ + cellSizeZ : startOffsetZ;
                
                // Draw vertical grid lines
                for (let x = startX; x <= mapCanvasElement.width + cellSizeX; x += cellSizeX) {
                    mapContext.beginPath();
                    mapContext.moveTo(x, 0);
                    mapContext.lineTo(x, mapCanvasElement.height);
                    mapContext.stroke();
                }
                
                // Draw horizontal grid lines
                for (let z = startZ; z <= mapCanvasElement.height + cellSizeZ; z += cellSizeZ) {
                    mapContext.beginPath();
                    mapContext.moveTo(0, z);
                    mapContext.lineTo(mapCanvasElement.width, z);
                    mapContext.stroke();
                }
                
                // Draw world origin indicator if it's in view
                const originX = centerX + (playerOffsetX * cellSizeX);
                const originZ = centerZ + (playerOffsetZ * cellSizeZ);
                
                // Check if origin is visible on map
                if (originX >= 0 && originX <= mapCanvasElement.width &&
                    originZ >= 0 && originZ <= mapCanvasElement.height) {
                    mapContext.globalAlpha = 1.0;
                    mapContext.strokeStyle = "#ffcc00";
                    mapContext.lineWidth = 1;
                    
                    // Draw crosshair at origin
                    mapContext.beginPath();
                    mapContext.moveTo(originX - 10, originZ);
                    mapContext.lineTo(originX + 10, originZ);
                    mapContext.stroke();
                    
                    mapContext.beginPath();
                    mapContext.moveTo(originX, originZ - 10);
                    mapContext.lineTo(originX, originZ + 10);
                    mapContext.stroke();
                    
                    // Reset opacity
                    mapContext.globalAlpha = 0.3;
                }
            }
            
            // Reset opacity
            mapContext.globalAlpha = 1.0;
        } catch (e) {
            console.error("[MAP] Error in drawGrid:", e);
        }
    }
    
    // Draw points of interest on the map
    function drawPoints() {
        if (!mapContext || !mapData || !mapData.points) return;
        
        try {
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drawing", mapData.points.length, "points. Player at:", playerPosition.x.toFixed(2), playerPosition.z.toFixed(2));
            }
            
            const expanded = mapContainerElement.classList.contains('expanded');
            const gridScale = expanded ? 0.5 : mapScale;
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            
            mapData.points.forEach(point => {
                // Skip invalid points
                if (point.x === undefined || point.z === undefined) return;
                
                let pointX, pointZ;
                
                if (expanded) {
                    // In expanded view, points are positioned relative to fixed grid
                    pointX = centerX + (point.x * gridScale * mapCanvasElement.width);
                    pointZ = centerZ + (point.z * gridScale * mapCanvasElement.height);
                } else {
                    // In collapsed view, calculate point position relative to player
                    const relativeX = point.x - playerPosition.x;
                    const relativeZ = point.z - playerPosition.z;
                    
                    pointX = centerX + (relativeX * gridScale * mapCanvasElement.width);
                    pointZ = centerZ + (relativeZ * gridScale * mapCanvasElement.height);
                }
                
                // Only draw if within canvas bounds (with padding)
                const padding = 20;
                if (pointX >= -padding && pointX <= mapCanvasElement.width + padding &&
                    pointZ >= -padding && pointZ <= mapCanvasElement.height + padding) {
                    
                    // Draw point
                    mapContext.fillStyle = point.color || "#ffffff";
                    mapContext.beginPath();
                    mapContext.arc(pointX, pointZ, 4, 0, Math.PI * 2);
                    mapContext.fill();
                    
                    // Draw label if present
                    if (point.label) {
                        mapContext.fillStyle = "#ffffff";
                        mapContext.font = "10px Orbitron";
                        mapContext.fillText(point.label, pointX + 8, pointZ + 4);
                    }
                }
            });
        } catch (e) {
            console.error("[MAP] Error in drawPoints:", e);
        }
    }
    
    // Draw player marker
    function drawPlayer() {
        if (!mapContext) return;
        
        try {
            const expanded = mapContainerElement.classList.contains('expanded');
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            const gridScale = expanded ? 0.5 : mapScale;
            
            // Calculate player position on the map
            // When expanded, player moves relative to fixed grid
            // When collapsed, player is centered and grid moves
            const playerX = expanded ? 
                centerX + (playerPosition.x * gridScale * mapCanvasElement.width) : 
                centerX;
                
            const playerZ = expanded ? 
                centerZ + (playerPosition.z * gridScale * mapCanvasElement.height) : 
                centerZ;
            
            // Draw player position
            mapContext.fillStyle = "#ff00cc";
            mapContext.beginPath();
            mapContext.arc(playerX, playerZ, 5, 0, Math.PI * 2);
            mapContext.fill();
            
            // Draw direction indicator (arrow showing player direction)
            const dirX = Math.sin(playerRotation) * 10;
            const dirZ = Math.cos(playerRotation) * 10;
            
            mapContext.strokeStyle = "#ff00cc";
            mapContext.lineWidth = 2;
            mapContext.beginPath();
            mapContext.moveTo(playerX, playerZ);
            mapContext.lineTo(playerX + dirX, playerZ + dirZ);
            mapContext.stroke();
            
            // Draw player coordinates
            mapContext.fillStyle = "#ffffff";
            mapContext.font = "10px Orbitron";
            const coordText = `X: ${playerPosition.x.toFixed(1)} Z: ${playerPosition.z.toFixed(1)}`;
            mapContext.fillText(coordText, playerX + 15, playerZ);
            
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drew player at screen coord:", 
                            playerX.toFixed(2), 
                            playerZ.toFixed(2),
                            "World:", 
                            playerPosition.x.toFixed(2),
                            playerPosition.z.toFixed(2));
            }
        } catch (e) {
            console.error("[MAP] Error in drawPlayer:", e);
        }
    }
    
    // Add a point to the map
    function addPoint(x, z, options = {}) {
        if (!mapData) createEmptyMap();
        
        const point = {
            x: x,
            z: z,
            color: options.color || "#ffffff",
            label: options.label || null,
            icon: options.icon || null
        };
        
        mapData.points.push(point);
        
        if (DEBUG) console.log("[MAP] Added point at:", x, z, options.label || "");
        
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        if (!mapData || !mapData.points) return false;
        
        const initialLength = mapData.points.length;
        
        // Filter out the point at the given coordinates
        mapData.points = mapData.points.filter(point => {
            return !(point.x === x && point.z === z);
        });
        
        return mapData.points.length < initialLength;
    }
    
    // Clear all points
    function clearPoints() {
        if (!mapData) return;
        
        mapData.points = [];
    }
    
    // Set map data (replace current map)
    function setMapData(data) {
        mapData = data;
    }
    
    // Get current map data
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
        
        mapContainerElement.style.display = "block";
    }
    
    // Hide the map
    function hide() {
        if (!mapContainerElement) return;
        
        mapContainerElement.style.display = "none";
    }
    
    // Handle window resize
    function handleResize() {
        if (!mapCanvasElement) return;
        
        const width = mapCanvasElement.parentElement.clientWidth;
        const height = mapCanvasElement.parentElement.clientHeight - 30;
        
        mapCanvasElement.width = width;
        mapCanvasElement.height = height;
        
        if (DEBUG) console.log("[MAP] Resized to:", width, height);
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