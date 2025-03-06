// Map System - Complete Rewrite
const MapSystem = (function() {
    // Debug
    const DEBUG = false; // Turn off debug by default for cleaner UI
    
    // DOM elements
    let mapContainer = null;
    let mapToggle = null;
    let mapCanvas = null;
    let ctx = null;
    
    // Map state
    let initialized = false;
    let isCollapsed = true;
    let playerPos = { x: 0, z: 0 };
    let playerRot = 0;
    let lastPos = { x: 0, z: 0 };
    let frameCounter = 0;
    let needsRedraw = true;
    
    // Map configuration
    const config = {
        backgroundColor: "#001a33",
        gridColor: "#00cc99",
        gridSize: 20,       // Size of grid cells in pixels
        playerColor: "#ff00cc",
        originColor: "#ffcc00",
        scaleFactor: 1      // How much to scale world coordinates
    };
    
    // Map points - the important locations
    let points = [];
    
    // Initialize the map
    function init() {
        console.log("[MAP] Initializing map system");
        
        // Get required DOM elements
        mapContainer = document.getElementById('mapContainer');
        mapToggle = document.getElementById('mapToggle');
        mapCanvas = document.getElementById('mapCanvas');
        
        if (!mapContainer || !mapToggle || !mapCanvas) {
            console.error("[MAP] Failed to find map elements");
            return false;
        }
        
        // Setup canvas and context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Failed to get canvas context");
            return false;
        }
        
        // Initial resize
        resizeCanvas();
        
        // Setup event listeners
        mapToggle.addEventListener('click', toggleMap);
        window.addEventListener('resize', resizeCanvas);
        
        // Add some basic points
        addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
        
        // Start render loop
        requestAnimationFrame(renderLoop);
        
        initialized = true;
        console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    // Update player position - THIS IS CALLED BY THE GAME ENGINE
    function updatePlayerPosition(position, rotation) {
        // Ensure we're getting valid data
        if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
            console.error("[MAP] Invalid position data:", position);
            return;
        }
        
        // Save last position for comparison
        lastPos = { 
            x: playerPos.x, 
            z: playerPos.z 
        };
        
        // Update current position with numeric values
        playerPos = { 
            x: Number(position.x), 
            z: Number(position.z) 
        };
        playerRot = Number(rotation);
        
        // Check if position significantly changed to trigger a redraw
        const deltaX = playerPos.x - lastPos.x;
        const deltaZ = playerPos.z - lastPos.z;
        
        if (Math.abs(deltaX) > 0.001 || Math.abs(deltaZ) > 0.001) {
            needsRedraw = true;
            
            if (DEBUG) {
                console.log(`[MAP] Position updated: (${playerPos.x.toFixed(2)}, ${playerPos.z.toFixed(2)})`);
            }
        }
    }
    
    // Toggle map between expanded and collapsed
    function toggleMap(e) {
        if (e) e.preventDefault();
        
        isCollapsed = !isCollapsed;
        
        if (isCollapsed) {
            mapContainer.classList.remove('expanded');
        } else {
            mapContainer.classList.add('expanded');
        }
        
        // Resize after toggling
        setTimeout(resizeCanvas, 10);
        needsRedraw = true;
    }
    
    // Resize canvas to fit container
    function resizeCanvas() {
        if (!mapCanvas || !mapContainer) return;
        
        const width = mapContainer.clientWidth;
        const height = mapContainer.clientHeight - 30; // Subtract header height
        
        mapCanvas.width = width;
        mapCanvas.height = height;
        needsRedraw = true;
    }
    
    // Main render loop
    function renderLoop() {
        frameCounter++;
        
        // Only render when necessary
        if (needsRedraw || frameCounter % 60 === 0) {
            render();
            needsRedraw = false;
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    // Render the map
    function render() {
        if (!ctx || !mapCanvas) return;
        
        // Skip if map is not visible
        if (mapContainer.style.display === 'none') return;
        
        // Clear canvas
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw points of interest
        drawPoints();
        
        // Draw player
        drawPlayer();
    }
    
    // Draw grid 
    function drawGrid() {
        if (!ctx || !mapCanvas) return;
        
        const expanded = !isCollapsed;
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSize = config.gridSize;
        
        // Set grid style
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        if (expanded) {
            // Expanded mode - fixed grid, player moves
            drawExpandedGrid(centerX, centerY);
        } else {
            // Collapsed mode - moving grid, player fixed in center
            drawCollapsedGrid(centerX, centerY);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
    
    // Draw grid in expanded mode
    function drawExpandedGrid(centerX, centerY) {
        const gridSize = config.gridSize;
        const range = 50; // Number of grid lines to draw
        
        // Draw vertical lines
        for (let i = -range; i <= range; i++) {
            const x = centerX + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
            
            // Draw labels for major grid lines
            if (i % 5 === 0) {
                ctx.fillStyle = "#00ffcc";
                ctx.font = "8px monospace";
                ctx.fillText(i.toString(), x + 2, 10);
            }
        }
        
        // Draw horizontal lines
        for (let i = -range; i <= range; i++) {
            const y = centerY + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapCanvas.width, y);
            ctx.stroke();
            
            // Draw labels for major grid lines
            if (i % 5 === 0) {
                ctx.fillStyle = "#00ffcc";
                ctx.font = "8px monospace";
                ctx.fillText(i.toString(), 2, y - 2);
            }
        }
    }
    
    // Draw grid in collapsed mode
    function drawCollapsedGrid(centerX, centerY) {
        const gridSize = config.gridSize;
        const scaleFactor = config.scaleFactor;
        
        // IMPROVED GRID LOGIC:
        // 1. Scale player position by grid size
        // 2. Calculate remainder for fine-grained movement
        // 3. Ensure we always have positive offsets
        
        // Calculate offset with correct direction (grid moves opposite to player)
        // This is a key part that needed fixing - the grid offset must move
        // in the OPPOSITE direction of player movement to create the illusion
        // of the player moving across the grid
        const scaledX = playerPos.x * gridSize * scaleFactor;
        const scaledZ = playerPos.z * gridSize * scaleFactor;
        
        // Calculate pixel offsets with proper direction (-playerPos to move grid opposite)
        let offsetX = -scaledX % gridSize;
        let offsetZ = -scaledZ % gridSize;
        
        // Ensure offsets are positive for rendering (avoid negative offsets)
        if (offsetX < 0) offsetX += gridSize;
        if (offsetZ < 0) offsetZ += gridSize;
        
        // Draw vertical lines
        for (let x = offsetX; x < mapCanvas.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = offsetZ; y < mapCanvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapCanvas.width, y);
            ctx.stroke();
        }
        
        // Draw origin marker if in view
        const originX = centerX - (playerPos.x * gridSize * scaleFactor);
        const originY = centerY - (playerPos.z * gridSize * scaleFactor);
        
        if (originX > -50 && originX < mapCanvas.width + 50 &&
            originY > -50 && originY < mapCanvas.height + 50) {
            
            // Draw origin marker
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = config.originColor;
            ctx.lineWidth = 1;
            
            // Cross
            ctx.beginPath();
            ctx.moveTo(originX - 5, originY);
            ctx.lineTo(originX + 5, originY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(originX, originY - 5);
            ctx.lineTo(originX, originY + 5);
            ctx.stroke();
            
            // Reset
            ctx.strokeStyle = config.gridColor;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.3;
        }
    }
    
    // Draw points of interest
    function drawPoints() {
        if (!ctx || !mapCanvas) return;
        
        const expanded = !isCollapsed;
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSize = config.gridSize;
        const scaleFactor = config.scaleFactor;
        
        points.forEach(point => {
            let x, y;
            
            if (expanded) {
                // In expanded mode, points move relative to fixed grid
                x = centerX + point.x * gridSize * scaleFactor;
                y = centerY + point.z * gridSize * scaleFactor;
            } else {
                // In collapsed mode, calculate position relative to player
                x = centerX + (point.x - playerPos.x) * gridSize * scaleFactor;
                y = centerY + (point.z - playerPos.z) * gridSize * scaleFactor;
            }
            
            // Only draw if within view with some padding
            if (x > -20 && x < mapCanvas.width + 20 &&
                y > -20 && y < mapCanvas.height + 20) {
                
                // Draw point
                ctx.fillStyle = point.color || "#ffffff";
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw label
                if (point.label) {
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "9px monospace";
                    ctx.fillText(point.label, x + 5, y + 3);
                }
            }
        });
    }
    
    // Draw player marker
    function drawPlayer() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const expanded = !isCollapsed;
        const gridSize = config.gridSize;
        const scaleFactor = config.scaleFactor;
        
        // Calculate player position based on mode
        let x, y;
        
        if (expanded) {
            // In expanded mode, player position is based on map coordinates
            x = centerX + playerPos.x * gridSize * scaleFactor;
            y = centerY + playerPos.z * gridSize * scaleFactor;
        } else {
            // In collapsed mode, player is always centered
            x = centerX;
            y = centerY;
        }
        
        // Draw player triangle
        ctx.fillStyle = config.playerColor;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-playerRot); // Negative because Canvas Y is inverted
        
        // Draw triangle for direction - just a simple arrow
        ctx.beginPath();
        ctx.moveTo(0, -10);    // Tip of arrow
        ctx.lineTo(-6, 6);     // Bottom left
        ctx.lineTo(6, 6);      // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add glow outline
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
    }
    
    // Add a point to the map
    function addPoint(x, z, options = {}) {
        const point = {
            x: parseFloat(x),
            z: parseFloat(z),
            color: options.color || "#ffffff",
            label: options.label || null
        };
        
        points.push(point);
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        const initialLength = points.length;
        
        points = points.filter(point => 
            !(point.x === x && point.z === z)
        );
        
        return points.length < initialLength;
    }
    
    // Clear all points
    function clearPoints() {
        points = [];
    }
    
    // Show map
    function show() {
        if (mapContainer) {
            mapContainer.style.display = "block";
            needsRedraw = true;
        }
    }
    
    // Hide map
    function hide() {
        if (mapContainer) {
            mapContainer.style.display = "none";
        }
    }
    
    // Check if map is collapsed
    function isMapCollapsed() {
        return isCollapsed;
    }
    
    // Set map data (compatibility function)
    function setMapData(data) {
        if (data && data.points) {
            // Clear existing points
            points = [];
            
            // Add new points
            if (Array.isArray(data.points)) {
                data.points.forEach(point => {
                    addPoint(point.x, point.z, {
                        color: point.color,
                        label: point.label
                    });
                });
            }
        }
        needsRedraw = true;
    }
    
    // Get map data (compatibility function)
    function getMapData() {
        return { points: points };
    }
    
    // Test function - for debugging
    function testMove() {
        console.log("[MAP] Testing movement pattern");
        
        // Simulate player moving in a small pattern
        const testPoints = [
            { x: 1, z: 0 },
            { x: 2, z: 0 },
            { x: 2, z: 1 },
            { x: 1, z: 1 },
            { x: 0, z: 0 }
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i >= testPoints.length) {
                clearInterval(interval);
                console.log("[MAP] Test movement complete");
                return;
            }
            
            updatePlayerPosition(testPoints[i], playerRot + 0.5);
            i++;
        }, 500);
    }
    
    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API - only expose what's needed
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
        hide,
        test: testMove
    };
})(); 