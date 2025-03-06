// Map System - Complete Rewrite
const MapSystem = (function() {
    // Debug
    const DEBUG = true; // Enable debugging temporarily
    
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
    
    // Map configuration - SIMPLIFIED
    const config = {
        backgroundColor: "#001a33",
        gridColor: "#00cc99",
        gridSize: 20,       // Size of grid cells in pixels
        playerColor: "#ff00cc",
        originColor: "#ffcc00"
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
        
        // Add origin point
        addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
        
        // Start render loop
        requestAnimationFrame(renderLoop);
        
        initialized = true;
        console.log("[MAP] Map system initialized");
        
        // Log the initial state
        if (DEBUG) {
            console.log("[MAP] Initial player position:", playerPos);
        }
        
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
        if (needsRedraw || frameCounter % 30 === 0) {
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
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSize = config.gridSize;
        
        // Set grid style
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        if (!isCollapsed) {
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
    
    // Draw grid in collapsed mode - SIMPLIFIED APPROACH
    function drawCollapsedGrid(centerX, centerY) {
        const gridSize = config.gridSize;
        
        // Calculate grid offsets based on player position
        // Modulo operation ensures seamless grid movement
        let offsetX = -(playerPos.x * gridSize) % gridSize;
        let offsetZ = -(playerPos.z * gridSize) % gridSize;
        
        // Ensure positive offsets for drawing
        if (offsetX < 0) offsetX += gridSize;
        if (offsetZ < 0) offsetZ += gridSize;
        
        // Draw vertical grid lines
        for (let x = offsetX; x < mapCanvas.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = offsetZ; y < mapCanvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapCanvas.width, y);
            ctx.stroke();
        }
    }
    
    // Draw points of interest - SIMPLIFIED
    function drawPoints() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSize = config.gridSize;
        
        points.forEach(point => {
            let x, y;
            
            if (!isCollapsed) {
                // In expanded mode, points have fixed positions on grid
                x = centerX + point.x * gridSize;
                y = centerY + point.z * gridSize;
            } else {
                // In collapsed mode, points move relative to player
                // This is key - the relative position calculation
                x = centerX + (point.x - playerPos.x) * gridSize;
                y = centerY + (point.z - playerPos.z) * gridSize;
            }
            
            // Only draw if within view
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
    
    // Draw player marker - SIMPLIFIED
    function drawPlayer() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        
        // In collapsed mode, player is always at center
        // In expanded mode, player moves on the grid
        const x = !isCollapsed ? centerX + playerPos.x * config.gridSize : centerX;
        const y = !isCollapsed ? centerY + playerPos.z * config.gridSize : centerY;
        
        // Draw player triangle
        ctx.fillStyle = config.playerColor;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-playerRot); // Negative rotation due to Y-axis inversion
        
        // Draw triangle for direction
        ctx.beginPath();
        ctx.moveTo(0, -10);    // Tip of arrow
        ctx.lineTo(-6, 6);     // Bottom left
        ctx.lineTo(6, 6);      // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add white outline
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
        needsRedraw = true;
        return point;
    }
    
    // Remove a point from the map
    function removePoint(x, z) {
        const initialLength = points.length;
        
        points = points.filter(point => 
            !(point.x === x && point.z === z)
        );
        
        needsRedraw = true;
        return points.length < initialLength;
    }
    
    // Clear all points
    function clearPoints() {
        points = [];
        needsRedraw = true;
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