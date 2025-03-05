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
        mapCanvasElement = document.getElementById('mapCanvas');
        
        if (!mapCanvasElement) {
            console.error("[MAP] Map canvas element not found!");
            return false;
        }
        
        // Check if map is already collapsed in the DOM
        isCollapsed = mapContainerElement.classList.contains('collapsed');
        if (DEBUG) console.log("[MAP] Initial collapse state:", isCollapsed);
        
        // Set up map canvas
        if (mapCanvasElement) {
            const width = mapCanvasElement.parentElement.clientWidth;
            const height = mapCanvasElement.parentElement.clientHeight - 30; // Subtract header height
            
            mapCanvasElement.width = width;
            mapCanvasElement.height = height;
            
            mapContext = mapCanvasElement.getContext('2d');
            if (!mapContext) {
                console.error("[MAP] Could not get canvas context!");
                return false;
            }
            
            if (DEBUG) console.log("[MAP] Canvas setup complete", width, height);
        }
        
        // Set up toggle functionality
        if (mapToggleElement) {
            mapToggleElement.addEventListener('click', toggleMap);
        }
        
        // Initialize with empty map data
        createEmptyMap();
        
        // Add a test point at origin
        if (DEBUG) {
            addPoint(0, 0, { color: "#ff0000", size: 5, label: "Origin" });
            addPoint(10, 10, { color: "#00ff00", size: 5, label: "10,10" });
            addPoint(-10, -10, { color: "#0000ff", size: 5, label: "-10,-10" });
            if (DEBUG) console.log("[MAP] Added test points");
        }
        
        // Start map rendering
        requestAnimationFrame(render);
        
        initialized = true;
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> MAP SYSTEM INITIALIZED");
        }
        
        // Output debug status
        if (DEBUG) console.log("[MAP] Initialization complete:", initialized);
        
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
        if (DEBUG) console.log("[MAP] Empty map created");
    }
    
    // Toggle map collapsed state
    function toggleMap() {
        if (!mapContainerElement) return;
        
        if (DEBUG) console.log("[MAP] Toggle map called. Current state:", isCollapsed);
        
        // Use the shared toggle utility if available
        if (window.togglePanelCollapse) {
            isCollapsed = window.togglePanelCollapse(mapContainerElement, mapToggleElement, function(collapsed) {
                // Handle expanded state
                if (!collapsed) {
                    handleMapExpansion();
                }
                
                // Emit map toggle event
                if (window.EventSystem) {
                    EventSystem.emit('map.toggled', { collapsed: collapsed });
                }
                
                if (DEBUG) console.log("[MAP] Map toggled using global function. New state:", collapsed);
            });
        } else {
            // Fallback to original code
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
                
                handleMapExpansion();
            }
            
            // Emit map toggle event
            if (window.EventSystem) {
                EventSystem.emit('map.toggled', { collapsed: isCollapsed });
            }
            
            if (DEBUG) console.log("[MAP] Map toggled using fallback. New state:", isCollapsed);
        }
    }
    
    // Helper function to handle map expansion
    function handleMapExpansion() {
        // Make the map take up the full screen when expanded
        if (!mapContainerElement.classList.contains('expanded')) {
            mapContainerElement.classList.add('expanded');
            mapContainerElement.style.width = '90vw';
            mapContainerElement.style.height = '90vh';
            mapContainerElement.style.left = '5vw';
            mapContainerElement.style.top = '5vh';
            mapContainerElement.style.zIndex = '1000';
        } else {
            mapContainerElement.classList.remove('expanded');
            mapContainerElement.style.width = '';
            mapContainerElement.style.height = '';
            mapContainerElement.style.left = '';
            mapContainerElement.style.top = '';
            mapContainerElement.style.zIndex = '';
        }
        
        // Resize canvas when expanded
        if (mapCanvasElement) {
            const width = mapCanvasElement.parentElement.clientWidth;
            const height = mapCanvasElement.parentElement.clientHeight - 30;
            
            mapCanvasElement.width = width;
            mapCanvasElement.height = height;
            
            if (DEBUG) console.log("[MAP] Expansion handled. Canvas resized to:", width, height);
        }
    }
    
    // Update player position on the map
    function updatePlayerPosition(position, rotation) {
        // Store previous position for change detection
        lastPlayerPosition = { x: playerPosition.x, z: playerPosition.z };
        
        // Update current position
        playerPosition = { x: position.x, z: position.z };
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
                const playerOffsetX = (playerPosition.x / mapData.gridSpacing) * cellSizeX;
                const playerOffsetZ = (playerPosition.z / mapData.gridSpacing) * cellSizeZ;
                
                // Debug log the offset occasionally
                if (DEBUG && Math.random() < 0.01) {
                    console.log("[MAP] Grid offset:", 
                                playerOffsetX.toFixed(2), 
                                playerOffsetZ.toFixed(2),
                                "Player:", 
                                playerPosition.x.toFixed(2),
                                playerPosition.z.toFixed(2));
                }
                
                // Calculate the remainder to get smooth movement
                const remX = playerOffsetX % cellSizeX;
                const remZ = playerOffsetZ % cellSizeZ;
                
                // Calculate grid start positions - shifted by player position
                const startX = -remX;
                const startZ = -remZ;
                
                // Draw vertical grid lines
                for (let x = startX; x < mapCanvasElement.width + cellSizeX; x += cellSizeX) {
                    mapContext.beginPath();
                    mapContext.moveTo(x, 0);
                    mapContext.lineTo(x, mapCanvasElement.height);
                    mapContext.stroke();
                    
                    // Calculate world X coordinate for this grid line
                    const worldX = Math.floor(playerPosition.x / mapData.gridSpacing) * mapData.gridSpacing + 
                                 ((x - centerX) / cellSizeX) * mapData.gridSpacing;
                    
                    // Draw coordinate labels for major grid lines
                    if (Math.round(worldX) % 10 === 0) {
                        mapContext.fillStyle = "#00ffcc";
                        mapContext.font = "8px Orbitron";
                        mapContext.fillText(Math.round(worldX).toString(), x - 5, mapCanvasElement.height - 10);
                    }
                }
                
                // Draw horizontal grid lines
                for (let z = startZ; z < mapCanvasElement.height + cellSizeZ; z += cellSizeZ) {
                    mapContext.beginPath();
                    mapContext.moveTo(0, z);
                    mapContext.lineTo(mapCanvasElement.width, z);
                    mapContext.stroke();
                    
                    // Calculate world Z coordinate for this grid line
                    const worldZ = Math.floor(playerPosition.z / mapData.gridSpacing) * mapData.gridSpacing + 
                                 ((z - centerZ) / cellSizeZ) * mapData.gridSpacing;
                    
                    // Draw coordinate labels for major grid lines
                    if (Math.round(worldZ) % 10 === 0) {
                        mapContext.fillStyle = "#00ffcc";
                        mapContext.font = "8px Orbitron";
                        mapContext.fillText(Math.round(worldZ).toString(), 5, z + 8);
                    }
                }
            }
            
            mapContext.globalAlpha = 1.0;
            
        } catch (e) {
            console.error("[MAP] Error in drawGrid:", e);
        }
    }
    
    // Draw points of interest
    function drawPoints() {
        if (!mapContext || !mapData.points || !mapData.points.length) return;
        
        try {
            const expanded = mapContainerElement.classList.contains('expanded');
            const gridScale = expanded ? 0.5 : mapScale;
            
            // Calculate center offset
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drawing", mapData.points.length, "points. Player at:", 
                            playerPosition.x.toFixed(2), 
                            playerPosition.z.toFixed(2));
            }
            
            // Draw each point
            mapData.points.forEach(point => {
                // When expanded, points move relative to the fixed grid
                // When collapsed, grid moves relative to the centered player
                let mapX, mapZ;
                
                if (expanded) {
                    // In expanded view, points are positioned on the fixed grid
                    mapX = centerX + (point.x * gridScale * mapCanvasElement.width);
                    mapZ = centerZ + (point.z * gridScale * mapCanvasElement.height);
                } else {
                    // In collapsed view, points are positioned relative to player
                    const offsetX = point.x - playerPosition.x;
                    const offsetZ = point.z - playerPosition.z;
                    mapX = centerX + (offsetX * gridScale * mapCanvasElement.width);
                    mapZ = centerZ + (offsetZ * gridScale * mapCanvasElement.height);
                }
                
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
        
        if (DEBUG) {
            console.log("[MAP] Added point at:", x, z, point.label || "");
        }
        
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        if (!mapData || !mapData.points) return false;
        
        const index = mapData.points.findIndex(p => p.x === x && p.z === z);
        
        if (index !== -1) {
            mapData.points.splice(index, 1);
            if (DEBUG) console.log("[MAP] Removed point at:", x, z);
            return true;
        }
        
        return false;
    }
    
    // Clear all points from the map
    function clearPoints() {
        if (!mapData) return;
        
        mapData.points = [];
        if (DEBUG) console.log("[MAP] Cleared all points");
    }
    
    // Set map data
    function setMapData(data) {
        mapData = data;
        if (DEBUG) console.log("[MAP] Map data set");
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
        if (DEBUG) console.log("[MAP] Map shown");
    }
    
    // Hide the map
    function hide() {
        if (!mapContainerElement) return;
        
        mapContainerElement.style.display = 'none';
        if (DEBUG) console.log("[MAP] Map hidden");
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