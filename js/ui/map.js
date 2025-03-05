// Map System - Complete Rewrite
const MapSystem = (function() {
    // Debug
    const DEBUG = true;
    
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
    
    // Map points
    let points = [];
    
    // Config
    const config = {
        backgroundColor: "#001a33",
        gridColor: "#00cc99",
        gridSpacing: 10,
        playerColor: "#ff00cc",
        originColor: "#ffcc00"
    };
    
    // Initialize
    function init() {
        console.log("[MAP] Initializing map system (new implementation)");
        
        // Get elements
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
        
        // Add test points
        addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
        addPoint(10, 10, { label: "10,10", color: "#00FF00" });
        addPoint(-10, -10, { label: "-10,-10", color: "#FF00FF" });
        console.log("[MAP] Added test points");
        
        // Start render loop
        requestAnimationFrame(renderLoop);
        
        initialized = true;
        console.log("[MAP] Initialization complete");
        return true;
    }
    
    // Update player position
    function updatePlayerPosition(position, rotation) {
        // Log incoming position data
        console.log(`[MAP] Updating player position: x=${position.x.toFixed(2)}, z=${position.z.toFixed(2)}, rot=${rotation.toFixed(2)}`);
        
        // Store position
        playerPos = { 
            x: parseFloat(position.x), 
            z: parseFloat(position.z) 
        };
        playerRot = parseFloat(rotation);
    }
    
    // Toggle map expanded/collapsed
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
        
        console.log(`[MAP] Map toggled, collapsed: ${isCollapsed}`);
    }
    
    // Resize canvas
    function resizeCanvas() {
        if (!mapCanvas || !mapContainer) return;
        
        const width = mapContainer.clientWidth;
        const height = mapContainer.clientHeight - 30; // Subtract header height
        
        mapCanvas.width = width;
        mapCanvas.height = height;
        
        console.log(`[MAP] Canvas resized: ${width}x${height}`);
    }
    
    // Main render loop
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        render();
    }
    
    // Render the map
    function render() {
        if (!ctx || !mapCanvas) return;
        
        // Skip if not visible
        if (mapContainer.style.display === 'none') return;
        
        // Clear canvas
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw points
        drawPoints();
        
        // Draw player
        drawPlayer();
        
        // Draw debug info
        drawDebugInfo();
    }
    
    // Draw grid
    function drawGrid() {
        if (!ctx || !mapCanvas) return;
        
        const expanded = mapContainer.classList.contains('expanded');
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        
        // Set up grid style
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        if (expanded) {
            // Expanded mode: fixed grid
            drawExpandedGrid(centerX, centerY);
        } else {
            // Collapsed mode: moving grid
            drawCollapsedGrid(centerX, centerY);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
    
    // Draw grid in expanded mode
    function drawExpandedGrid(centerX, centerY) {
        const gridSize = 20; // Pixels between grid lines
        const range = 50;    // How many grid lines to draw
        
        // Draw vertical lines
        for (let i = -range; i <= range; i++) {
            const x = centerX + i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
            
            // Draw major grid line labels
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
            
            // Draw major grid line labels
            if (i % 5 === 0) {
                ctx.fillStyle = "#00ffcc";
                ctx.font = "8px monospace";
                ctx.fillText(i.toString(), 2, y - 2);
            }
        }
    }
    
    // Draw grid in collapsed mode
    function drawCollapsedGrid(centerX, centerY) {
        const gridSize = 20; // Pixels between grid lines
        
        // Calculate offset based on player position
        const offsetX = (playerPos.x % 1) * gridSize;
        const offsetY = (playerPos.z % 1) * gridSize;
        
        // Start positions
        const startX = centerX - Math.floor(mapCanvas.width / gridSize / 2) * gridSize - offsetX;
        const startY = centerY - Math.floor(mapCanvas.height / gridSize / 2) * gridSize - offsetY;
        
        // Draw vertical lines
        for (let x = startX; x < mapCanvas.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = startY; y < mapCanvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapCanvas.width, y);
            ctx.stroke();
        }
        
        // Draw origin if in view
        const originX = centerX - (playerPos.x * gridSize);
        const originY = centerY - (playerPos.z * gridSize);
        
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
        
        const expanded = mapContainer.classList.contains('expanded');
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSize = 20;
        
        points.forEach(point => {
            let x, y;
            
            if (expanded) {
                // In expanded mode, points move relative to fixed grid
                x = centerX + point.x * gridSize;
                y = centerY + point.z * gridSize;
            } else {
                // In collapsed mode, calculate position relative to player
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
    
    // Draw player marker
    function drawPlayer() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const expanded = mapContainer.classList.contains('expanded');
        const gridSize = 20;
        
        // Calculate player position based on mode
        let x, y;
        
        if (expanded) {
            // In expanded mode, player position is based on map coordinates
            x = centerX + playerPos.x * gridSize;
            y = centerY + playerPos.z * gridSize;
        } else {
            // In collapsed mode, player is always centered
            x = centerX;
            y = centerY;
        }
        
        // Draw player arrow
        ctx.fillStyle = config.playerColor;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-playerRot); // Negative because Canvas Y is inverted
        
        // Draw triangle for direction
        ctx.beginPath();
        ctx.moveTo(0, -8);    // Tip of arrow
        ctx.lineTo(-5, 5);    // Bottom left
        ctx.lineTo(5, 5);     // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add glow
        ctx.strokeStyle = "#ffccff";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
        
        // Draw coordinates
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.fillText(`X: ${playerPos.x.toFixed(1)} Z: ${playerPos.z.toFixed(1)}`, x + 10, y);
    }
    
    // Draw debug info
    function drawDebugInfo() {
        if (!DEBUG || !ctx) return;
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.fillText(`Player: ${playerPos.x.toFixed(2)}, ${playerPos.z.toFixed(2)}`, 10, mapCanvas.height - 30);
        ctx.fillText(`Rotation: ${playerRot.toFixed(2)}`, 10, mapCanvas.height - 15);
    }
    
    // Add a point to the map
    function addPoint(x, z, options = {}) {
        points.push({
            x: parseFloat(x),
            z: parseFloat(z),
            color: options.color || "#ffffff",
            label: options.label || null
        });
        
        return points[points.length - 1];
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
    
    // Set map data (dummy function for compatibility)
    function setMapData(data) {
        console.log("[MAP] setMapData called, but not implemented in new system");
    }
    
    // Get map data (dummy function for compatibility)
    function getMapData() {
        return { points: points };
    }
    
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