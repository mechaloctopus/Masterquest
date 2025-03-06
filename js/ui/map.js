// Map System - Simple Static Version
const MapSystem = (function() {
    // Debug mode
    const DEBUG = true;
    
    // DOM elements
    let mapContainer = null;
    let mapCanvas = null;
    let ctx = null;
    
    // Map state
    let initialized = false;
    let playerPos = { x: 0, z: 0 };
    let playerRot = 0;
    let frameCounter = 0;
    let needsRedraw = true;
    
    // Map configuration
    const config = {
        backgroundColor: "#001a33",
        gridColor: "#00cc99",
        gridSize: 20,       // Pixel size of grid cells
        playerColor: "#ff00cc"
    };
    
    // Points of interest
    let points = [];
    
    // Initialize the map
    function init() {
        console.log("[MAP] Initializing simplified map system");
        
        // Get required DOM elements
        mapContainer = document.getElementById('mapContainer');
        mapCanvas = document.getElementById('mapCanvas');
        
        if (!mapContainer || !mapCanvas) {
            console.error("[MAP] Failed to find map elements");
            return false;
        }
        
        // Setup canvas and context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Failed to get canvas context");
            return false;
        }
        
        // Remove the toggle button since we're making the map permanent
        const mapToggle = document.getElementById('mapToggle');
        if (mapToggle) {
            mapToggle.style.display = 'none';
        }
        
        // Make map permanently visible
        mapContainer.classList.add('permanent');
        mapContainer.style.display = 'block';
        
        // Remove expanded/collapsed classes
        mapContainer.classList.remove('expanded');
        mapContainer.classList.remove('collapsed');
        
        // Add custom CSS for permanent map
        const style = document.createElement('style');
        style.textContent = `
            #mapContainer.permanent {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 200px;
                height: 200px;
                border: 2px solid #00cc99;
                background: rgba(0, 10, 30, 0.8);
                z-index: 100;
            }
            #mapCanvas {
                width: 100%;
                height: calc(100% - 30px);
                display: block;
            }
        `;
        document.head.appendChild(style);
        
        // Initial resize
        resizeCanvas();
        
        // Add window resize listener
        window.addEventListener('resize', resizeCanvas);
        
        // Add origin point for reference
        addPoint(0, 0, { label: "Origin", color: "#00FFFF" });
        
        // Start render loop
        requestAnimationFrame(renderLoop);
        
        initialized = true;
        console.log("[MAP] Map system initialized");
        console.log("[MAP] Initial player position:", playerPos);
        
        return true;
    }
    
    // Update player position
    function updatePlayerPosition(position, rotation) {
        // Ensure we're getting valid data
        if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
            console.error("[MAP] Invalid position data:", position);
            return;
        }
        
        // Update player position and rotation
        playerPos = { 
            x: Number(position.x), 
            z: Number(position.z) 
        };
        playerRot = Number(rotation);
        
        // Always redraw when position updates
        needsRedraw = true;
        
        // Debug logging
        if (DEBUG && frameCounter % 30 === 0) {
            console.log(`[MAP] Position updated: x=${playerPos.x.toFixed(2)}, z=${playerPos.z.toFixed(2)}, rot=${playerRot.toFixed(2)}`);
        }
    }
    
    // Resize canvas to fit container
    function resizeCanvas() {
        if (!mapCanvas || !mapContainer) return;
        
        const width = mapContainer.clientWidth;
        const height = mapContainer.clientHeight - 30; // Subtract header height
        
        mapCanvas.width = width;
        mapCanvas.height = height;
        
        if (DEBUG) {
            console.log("[MAP] Canvas resized to:", width, "×", height);
        }
        
        needsRedraw = true;
    }
    
    // Main render loop
    function renderLoop() {
        frameCounter++;
        
        // Only render when necessary or occasionally
        if (needsRedraw || frameCounter % 15 === 0) {
            render();
            needsRedraw = false;
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    // Render the map
    function render() {
        if (!ctx || !mapCanvas) return;
        
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
    
    // Draw grid - simplified to always be in "collapsed" mode
    function drawGrid() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSpacing = CONFIG.GRID.SPACING || 2;  // World grid spacing (2 units)
        const pixelSpacing = config.gridSize;          // Pixel grid spacing (20 pixels)
        const scale = pixelSpacing / gridSpacing;      // 10 pixels per world unit
        
        // Set grid style
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        // Calculate total offset in pixels based on player position
        // Grid moves opposite to player movement
        const totalOffsetX = -playerPos.x * scale;
        const totalOffsetZ = -playerPos.z * scale;
        
        // Calculate starting positions for grid lines
        let startX = (totalOffsetX % pixelSpacing + pixelSpacing) % pixelSpacing;
        let startY = (totalOffsetZ % pixelSpacing + pixelSpacing) % pixelSpacing;
        
        // Draw vertical grid lines
        for (let x = startX; x < mapCanvas.width + pixelSpacing; x += pixelSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapCanvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = startY; y < mapCanvas.height + pixelSpacing; y += pixelSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapCanvas.width, y);
            ctx.stroke();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Debug logging of grid offsets
        if (DEBUG && frameCounter % 60 === 0) {
            console.log(`[MAP] Grid offset: X=${startX.toFixed(1)}, Z=${startY.toFixed(1)}`);
            console.log(`[MAP] Player position: X=${playerPos.x.toFixed(1)}, Z=${playerPos.z.toFixed(1)}`);
        }
    }
    
    // Draw points of interest
    function drawPoints() {
        if (!ctx || !mapCanvas) return;
        
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;
        const gridSpacing = CONFIG.GRID.SPACING || 2;
        const pixelSpacing = config.gridSize;
        const scale = pixelSpacing / gridSpacing;
        
        points.forEach(point => {
            // Point position relative to player
            const x = centerX + (point.x - playerPos.x) * scale;
            const y = centerY + (point.z - playerPos.z) * scale;
            
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
        
        // Player is always at center in this simplified map
        const x = centerX;
        const y = centerY;
        
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
        points = points.filter(point => !(point.x === x && point.z === z));
        needsRedraw = true;
        return points.length < initialLength;
    }
    
    // Clear all points
    function clearPoints() {
        points = [];
        needsRedraw = true;
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
    
    // Public API
    return {
        init,
        updatePlayerPosition,
        addPoint,
        removePoint,
        clearPoints,
        test: testMove
    };
})(); 