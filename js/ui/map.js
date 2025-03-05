// Map System
const MapSystem = (function() {
    // Private properties
    let initialized = false;
    let mapContainerElement = null;
    let mapToggleElement = null;
    let mapCanvasElement = null;
    let mapContext = null;
    let isCollapsed = true; // Default to collapsed
    
    // Debug flag - enable to see detailed logging
    const DEBUG = true;
    
    // Map data
    let mapData = null;
    let playerPosition = { x: 0, z: 0 };
    let playerRotation = 0;
    const mapScale = 0.1; // Scale factor for converting world to map coordinates
    
    // Force a redraw flag
    let needsRedraw = true;
    
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
        
        // Set up map canvas
        resizeCanvas();
        mapContext = mapCanvasElement.getContext('2d');
        
        // Check initial collapse state
        isCollapsed = !mapContainerElement.classList.contains('expanded');
        if (DEBUG) console.log("[MAP] Initial collapse state:", isCollapsed);
        
        // Set up toggle event
        mapToggleElement.addEventListener('click', function(e) {
            toggleMap();
            e.preventDefault();
        });
        
        // Create initial empty map data
        createEmptyMap();
        
        // Add test points for debugging
        if (DEBUG) {
            addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
            addPoint(10, 10, { label: "10,10", color: "#00FF00" });
            addPoint(-10, -10, { label: "-10,-10", color: "#FF00FF" });
            if (DEBUG) console.log("[MAP] Added test points");
        }
        
        // Start the render loop
        requestAnimationFrame(render);
        
        initialized = true;
        if (DEBUG) console.log("[MAP] Initialization complete:", initialized);
        return true;
    }
    
    // Resize canvas to fit container
    function resizeCanvas() {
        if (!mapCanvasElement || !mapCanvasElement.parentElement) return;
        
        mapCanvasElement.width = mapCanvasElement.parentElement.clientWidth;
        mapCanvasElement.height = mapCanvasElement.parentElement.clientHeight - 30; // Subtract header
        
        if (DEBUG) console.log("[MAP] Canvas setup complete", mapCanvasElement.width, mapCanvasElement.height);
        needsRedraw = true;
    }
    
    // Create empty map data
    function createEmptyMap() {
        mapData = {
            width: 100,
            height: 100,
            grid: true,
            gridSpacing: 1,
            gridColor: "#00cc99",
            backgroundColor: "#001a33",
            points: []
        };
        
        if (DEBUG) console.log("[MAP] Empty map created");
        return mapData;
    }
    
    // Toggle map between expanded and collapsed
    function toggleMap() {
        if (DEBUG) console.log("[MAP] Toggle map called. Current state:", isCollapsed);
        
        if (!mapContainerElement) return;
        
        if (isCollapsed) {
            // Expand
            mapContainerElement.classList.add('expanded');
        } else {
            // Collapse
            mapContainerElement.classList.remove('expanded');
        }
        
        // Toggle state
        isCollapsed = !isCollapsed;
        
        // Resize canvas after toggle
        handleMapExpansion();
        
        if (DEBUG) console.log("[MAP] Map toggled using global function. New state:", isCollapsed);
        
        // Force redraw
        needsRedraw = true;
        
        return isCollapsed;
    }
    
    // Handle map expansion
    function handleMapExpansion() {
        if (!mapCanvasElement) return;
        
        // Resize canvas to fit new dimensions
        resizeCanvas();
        
        if (DEBUG) console.log("[MAP] Expansion handled. Canvas resized to:", mapCanvasElement.width, mapCanvasElement.height);
    }
    
    // Update player position on the map
    function updatePlayerPosition(position, rotation) {
        if (!position || position.x === undefined || position.z === undefined) {
            console.error("[MAP] Invalid position provided:", position);
            return;
        }
        
        // Check if position actually changed
        const posChanged = (playerPosition.x !== position.x || playerPosition.z !== position.z);
        const rotChanged = (playerRotation !== rotation);
        
        if (posChanged || rotChanged) {
            // Position changed, update values
            playerPosition = {
                x: position.x,
                z: position.z
            };
            playerRotation = rotation;
            
            // Force redraw when position changes
            needsRedraw = true;
            
            // Log position update occasionally
            if (DEBUG && posChanged && Math.random() < 0.1) {
                console.log("[MAP] Player position updated:", 
                            playerPosition.x.toFixed(2), 
                            playerPosition.z.toFixed(2),
                            "Rotation:", playerRotation.toFixed(2));
            }
        }
    }
    
    // Main render function - called in animation loop
    function render() {
        // Always request next frame first
        requestAnimationFrame(render);
        
        // Skip render if context is missing
        if (!mapContext || !mapCanvasElement || !mapData) {
            return;
        }
        
        // Skip render if map is hidden
        if (mapContainerElement.style.display === 'none') {
            return;
        }
        
        // Skip if no redraw needed (optimization)
        if (!needsRedraw) {
            return;
        }
        
        try {
            // Reset redraw flag
            needsRedraw = false;
            
            // Clear canvas
            mapContext.fillStyle = mapData.backgroundColor;
            mapContext.fillRect(0, 0, mapCanvasElement.width, mapCanvasElement.height);
            
            // Draw grid
            if (mapData.grid) {
                drawGrid();
            }
            
            // Draw points of interest
            drawPoints();
            
            // Draw player marker
            drawPlayer();
            
            // Debug output (occasionally)
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Rendering map. Player at:", 
                            playerPosition.x.toFixed(2), 
                            playerPosition.z.toFixed(2));
            }
        } catch (e) {
            console.error("[MAP] Error in render function:", e);
        }
    }
    
    // Draw grid lines
    function drawGrid() {
        if (!mapContext) return;
        
        try {
            const expanded = mapContainerElement.classList.contains('expanded');
            const cellSize = getCellSize(expanded);
            
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drawing grid. Cell size:", cellSize.x.toFixed(2), cellSize.y.toFixed(2));
            }
            
            mapContext.strokeStyle = mapData.gridColor;
            mapContext.lineWidth = expanded ? 1 : 0.5;
            mapContext.globalAlpha = 0.3;
            
            if (expanded) {
                // EXPANDED MODE: Fixed grid with moving player
                drawExpandedGrid(cellSize);
            } else {
                // COLLAPSED MODE: Moving grid with fixed player
                drawCollapsedGrid(cellSize);
            }
            
            mapContext.globalAlpha = 1.0; // Reset opacity
        } catch (e) {
            console.error("[MAP] Error drawing grid:", e);
        }
    }
    
    // Get cell size based on canvas dimensions and mode
    function getCellSize(expanded) {
        const gridScale = expanded ? 0.5 : mapScale;
        return {
            x: gridScale * mapCanvasElement.width * mapData.gridSpacing,
            y: gridScale * mapCanvasElement.height * mapData.gridSpacing
        };
    }
    
    // Draw grid in expanded mode (fixed grid, moving player)
    function drawExpandedGrid(cellSize) {
        const centerX = mapCanvasElement.width / 2;
        const centerZ = mapCanvasElement.height / 2;
        
        // Draw vertical lines (X axis)
        for (let x = -mapData.width / 2; x <= mapData.width / 2; x += mapData.gridSpacing) {
            const mapX = centerX + (x * cellSize.x / mapData.gridSpacing);
            
            mapContext.beginPath();
            mapContext.moveTo(mapX, 0);
            mapContext.lineTo(mapX, mapCanvasElement.height - 40);
            mapContext.stroke();
            
            // Draw labels for major grid lines
            if (x % 10 === 0) {
                mapContext.fillStyle = "#00ffcc";
                mapContext.font = "10px Orbitron";
                mapContext.fillText(x.toString(), mapX - 5, mapCanvasElement.height - 25);
            }
        }
        
        // Draw horizontal lines (Z axis)
        for (let z = -mapData.height / 2; z <= mapData.height / 2; z += mapData.gridSpacing) {
            const mapZ = centerZ + (z * cellSize.y / mapData.gridSpacing);
            
            mapContext.beginPath();
            mapContext.moveTo(0, mapZ);
            mapContext.lineTo(mapCanvasElement.width, mapZ);
            mapContext.stroke();
            
            // Draw labels for major grid lines
            if (z % 10 === 0) {
                mapContext.fillStyle = "#00ffcc";
                mapContext.font = "10px Orbitron";
                mapContext.fillText(z.toString(), 5, mapZ + 10);
            }
        }
    }
    
    // Draw grid in collapsed mode (moving grid, fixed player)
    function drawCollapsedGrid(cellSize) {
        const centerX = mapCanvasElement.width / 2;
        const centerZ = mapCanvasElement.height / 2;
        
        // Calculate grid offsets based on player position
        // NEGATIVE since grid moves opposite to player
        const offsetX = -playerPosition.x;
        const offsetZ = -playerPosition.z;
        
        if (DEBUG && Math.random() < 0.01) {
            console.log("[MAP] Grid offset:", 
                        offsetX.toFixed(2), 
                        offsetZ.toFixed(2),
                        "Player:", 
                        playerPosition.x.toFixed(2),
                        playerPosition.z.toFixed(2));
        }
        
        // Calculate pixel offsets for the grid lines
        const pixelOffsetX = (offsetX % 1) * cellSize.x;
        const pixelOffsetZ = (offsetZ % 1) * cellSize.y;
        
        // Calculate starting positions
        let startX = pixelOffsetX;
        if (startX < 0) startX += cellSize.x;
        
        let startZ = pixelOffsetZ;
        if (startZ < 0) startZ += cellSize.y;
        
        // Draw vertical grid lines (X axis)
        for (let x = startX; x < mapCanvasElement.width + cellSize.x; x += cellSize.x) {
            mapContext.beginPath();
            mapContext.moveTo(x, 0);
            mapContext.lineTo(x, mapCanvasElement.height);
            mapContext.stroke();
        }
        
        // Draw horizontal grid lines (Z axis)
        for (let z = startZ; z < mapCanvasElement.height + cellSize.y; z += cellSize.y) {
            mapContext.beginPath();
            mapContext.moveTo(0, z);
            mapContext.lineTo(mapCanvasElement.width, z);
            mapContext.stroke();
        }
        
        // Draw world origin indicator if in view
        const originX = centerX + (offsetX * cellSize.x);
        const originZ = centerZ + (offsetZ * cellSize.y);
        
        if (originX >= -20 && originX <= mapCanvasElement.width + 20 &&
            originZ >= -20 && originZ <= mapCanvasElement.height + 20) {
            
            mapContext.globalAlpha = 1.0;
            mapContext.strokeStyle = "#ffcc00";
            mapContext.lineWidth = 1.5;
            
            // Draw crosshair at origin
            mapContext.beginPath();
            mapContext.moveTo(originX - 8, originZ);
            mapContext.lineTo(originX + 8, originZ);
            mapContext.stroke();
            
            mapContext.beginPath();
            mapContext.moveTo(originX, originZ - 8);
            mapContext.lineTo(originX, originZ + 8);
            mapContext.stroke();
            
            // Label
            mapContext.fillStyle = "#ffcc00";
            mapContext.font = "8px Orbitron";
            mapContext.fillText("ORIGIN", originX + 10, originZ);
            
            // Reset
            mapContext.strokeStyle = mapData.gridColor;
            mapContext.lineWidth = 0.5;
            mapContext.globalAlpha = 0.3;
        }
    }
    
    // Draw points of interest
    function drawPoints() {
        if (!mapContext || !mapData || !mapData.points) return;
        
        try {
            if (DEBUG && Math.random() < 0.01) {
                console.log("[MAP] Drawing", mapData.points.length, "points. Player at:", 
                            playerPosition.x.toFixed(2), 
                            playerPosition.z.toFixed(2));
            }
            
            const expanded = mapContainerElement.classList.contains('expanded');
            const gridScale = expanded ? 0.5 : mapScale;
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            
            mapData.points.forEach(point => {
                if (point.x === undefined || point.z === undefined) return;
                
                let pointX, pointZ;
                
                if (expanded) {
                    // Expanded mode: points relative to fixed grid
                    pointX = centerX + (point.x * gridScale * mapCanvasElement.width);
                    pointZ = centerZ + (point.z * gridScale * mapCanvasElement.height);
                } else {
                    // Collapsed mode: points relative to player position
                    const relativeX = point.x - playerPosition.x;
                    const relativeZ = point.z - playerPosition.z;
                    
                    pointX = centerX + (relativeX * gridScale * mapCanvasElement.width);
                    pointZ = centerZ + (relativeZ * gridScale * mapCanvasElement.height);
                }
                
                // Only draw points within or near the map bounds
                const padding = 20;
                if (pointX >= -padding && pointX <= mapCanvasElement.width + padding &&
                    pointZ >= -padding && pointZ <= mapCanvasElement.height + padding) {
                    
                    // Draw point
                    mapContext.fillStyle = point.color || "#ffffff";
                    mapContext.beginPath();
                    mapContext.arc(pointX, pointZ, 3, 0, Math.PI * 2);
                    mapContext.fill();
                    
                    // Draw label if present
                    if (point.label) {
                        mapContext.fillStyle = "#ffffff";
                        mapContext.font = "9px Orbitron";
                        mapContext.fillText(point.label, pointX + 6, pointZ + 3);
                    }
                }
            });
        } catch (e) {
            console.error("[MAP] Error in drawPoints:", e);
        }
    }
    
    // Draw player marker (arrow or triangle pointing in direction of travel)
    function drawPlayer() {
        if (!mapContext) return;
        
        try {
            const expanded = mapContainerElement.classList.contains('expanded');
            const centerX = mapCanvasElement.width / 2;
            const centerZ = mapCanvasElement.height / 2;
            const gridScale = expanded ? 0.5 : mapScale;
            
            // Calculate player position on map
            const playerX = expanded ? 
                centerX + (playerPosition.x * gridScale * mapCanvasElement.width) : 
                centerX;
                
            const playerZ = expanded ? 
                centerZ + (playerPosition.z * gridScale * mapCanvasElement.height) : 
                centerZ;
            
            // Draw player marker as triangle/arrow
            const size = 8; // Size of the triangle
            
            // Calculate points for triangle
            const angle = playerRotation;
            const x1 = playerX + Math.sin(angle) * size;
            const z1 = playerZ + Math.cos(angle) * size;
            
            const x2 = playerX + Math.sin(angle + 2.5) * (size * 0.6);
            const z2 = playerZ + Math.cos(angle + 2.5) * (size * 0.6);
            
            const x3 = playerX + Math.sin(angle - 2.5) * (size * 0.6);
            const z3 = playerZ + Math.cos(angle - 2.5) * (size * 0.6);
            
            // Draw triangle
            mapContext.fillStyle = "#ff00cc";
            mapContext.beginPath();
            mapContext.moveTo(x1, z1);
            mapContext.lineTo(x2, z2);
            mapContext.lineTo(x3, z3);
            mapContext.closePath();
            mapContext.fill();
            
            // Add outer glow
            mapContext.strokeStyle = "#ffccff";
            mapContext.lineWidth = 1;
            mapContext.stroke();
            
            // Draw player coordinates
            mapContext.fillStyle = "#ffffff";
            mapContext.font = "10px Orbitron";
            const coordText = `X: ${playerPosition.x.toFixed(1)} Z: ${playerPosition.z.toFixed(1)}`;
            
            // Position text based on direction player is facing
            const textX = playerX + Math.sin(angle) * 12;
            const textZ = playerZ + Math.cos(angle) * 12;
            
            mapContext.fillText(coordText, textX, textZ);
            
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
        
        // Force redraw when adding points
        needsRedraw = true;
        
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        if (!mapData || !mapData.points) return false;
        
        const initialLength = mapData.points.length;
        
        // Filter out the point with the given coordinates
        mapData.points = mapData.points.filter(point => {
            return !(point.x === x && point.z === z);
        });
        
        // Force redraw if a point was removed
        if (mapData.points.length < initialLength) {
            needsRedraw = true;
            return true;
        }
        
        return false;
    }
    
    // Clear all points
    function clearPoints() {
        if (!mapData) return;
        
        mapData.points = [];
        needsRedraw = true;
    }
    
    // Set map data
    function setMapData(data) {
        mapData = data;
        needsRedraw = true;
    }
    
    // Get map data
    function getMapData() {
        return mapData;
    }
    
    // Check if map is collapsed
    function isMapCollapsed() {
        return isCollapsed;
    }
    
    // Show map
    function show() {
        if (!mapContainerElement) return;
        mapContainerElement.style.display = "block";
        needsRedraw = true;
    }
    
    // Hide map
    function hide() {
        if (!mapContainerElement) return;
        mapContainerElement.style.display = "none";
    }
    
    // Handle window resize
    function handleResize() {
        resizeCanvas();
    }
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    // Initialize when DOM is ready
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