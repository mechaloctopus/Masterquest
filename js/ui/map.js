// Minimal Map System - Built from scratch
const MapSystem = (function() {
    // Essential DOM elements
    let mapCanvas = null;
    let ctx = null;
    let mapContainer = null;
    
    // Basic player position tracking
    let playerX = 0;
    let playerZ = 0;
    let playerRotation = 0;
    
    // Simple configuration
    const MAP_SIZE = 200;
    const GRID_CELL_SIZE = 20; // Pixels per grid cell
    const WORLD_GRID_SIZE = 2; // World units per grid cell
    const SCALE = GRID_CELL_SIZE / WORLD_GRID_SIZE; // Pixels per world unit
    
    function init() {
        console.log("[MAP] Initializing minimal map system");
        
        // Get the map container and create a fixed style for it
        mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error("[MAP] Could not find map container");
            return false;
        }
        
        // Style the map container for a fixed appearance
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '10px';
        mapContainer.style.right = '10px';
        mapContainer.style.width = MAP_SIZE + 'px';
        mapContainer.style.height = MAP_SIZE + 'px';
        mapContainer.style.border = '2px solid #00cc99';
        mapContainer.style.backgroundColor = 'rgba(0, 26, 51, 0.8)';
        mapContainer.style.zIndex = '100';
        
        // Remove the toggle button if it exists
        const mapToggle = document.getElementById('mapToggle');
        if (mapToggle) {
            mapToggle.style.display = 'none';
        }
        
        // Get or create the canvas element
        mapCanvas = document.getElementById('mapCanvas');
        if (!mapCanvas) {
            mapCanvas = document.createElement('canvas');
            mapCanvas.id = 'mapCanvas';
            mapContainer.appendChild(mapCanvas);
        }
        
        // Set canvas size
        mapCanvas.width = MAP_SIZE;
        mapCanvas.height = MAP_SIZE;
        mapCanvas.style.display = 'block';
        
        // Get the drawing context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Could not get canvas context");
            return false;
        }
        
        // Add origin marker
        addOriginMarker();
        
        // Start the render loop
        requestAnimationFrame(update);
        
        console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    // Add a marker at the origin (0,0)
    function addOriginMarker() {
        const originMarker = {
            x: 0,
            z: 0,
            color: "#00FFFF",
            label: "Origin"
        };
        
        // Store the origin in a global variable so we can access it
        window.originMarker = originMarker;
    }
    
    // Update player position - called by the game
    function updatePlayerPosition(position, rotation) {
        if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
            return;
        }
        
        // Store player position and rotation
        playerX = position.x;
        playerZ = position.z;
        playerRotation = rotation;
        
        // Occasionally log position for debugging
        if (Math.random() < 0.01) {
            console.log(`[MAP] Player at: (${playerX.toFixed(2)}, ${playerZ.toFixed(2)}), rotation: ${playerRotation.toFixed(2)}`);
        }
    }
    
    // Main update loop
    function update() {
        render();
        requestAnimationFrame(update);
    }
    
    // Render the map
    function render() {
        if (!ctx || !mapCanvas) return;
        
        // Clear the canvas
        ctx.fillStyle = '#001a33'; // Dark blue background
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw the grid with proper player-relative movement
        drawGrid();
        
        // Draw the origin point
        drawOrigin();
        
        // Draw the player arrow in the center
        drawPlayer();
    }
    
    // Draw the grid with proper offsets based on player position
    function drawGrid() {
        const center = MAP_SIZE / 2;
        
        // Calculate grid offsets based on player position
        // The grid moves in the opposite direction of player movement
        const offsetX = (-playerX * SCALE) % GRID_CELL_SIZE;
        const offsetZ = (-playerZ * SCALE) % GRID_CELL_SIZE;
        
        // Make sure offsets wrap properly (positive values between 0 and GRID_CELL_SIZE)
        const startX = (offsetX + GRID_CELL_SIZE) % GRID_CELL_SIZE;
        const startZ = (offsetZ + GRID_CELL_SIZE) % GRID_CELL_SIZE;
        
        // Draw vertical grid lines
        ctx.strokeStyle = '#00cc99'; // Neon green grid
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3; // Semi-transparent grid
        
        for (let x = startX; x < MAP_SIZE; x += GRID_CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, MAP_SIZE);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let z = startZ; z < MAP_SIZE; z += GRID_CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, z);
            ctx.lineTo(MAP_SIZE, z);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Draw the origin marker relative to player position
    function drawOrigin() {
        if (!window.originMarker) return;
        
        const center = MAP_SIZE / 2;
        const origin = window.originMarker;
        
        // Calculate origin position relative to player
        // When player moves, origin moves in opposite direction
        const x = center + (origin.x - playerX) * SCALE;
        const y = center + (origin.z - playerZ) * SCALE;
        
        // Draw the origin point if it's in view
        if (x >= -10 && x <= MAP_SIZE + 10 && y >= -10 && y <= MAP_SIZE + 10) {
            // Draw point
            ctx.fillStyle = origin.color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText(origin.label, x + 6, y + 4);
        }
    }
    
    // Draw the player arrow (always in center)
    function drawPlayer() {
        const center = MAP_SIZE / 2;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(-playerRotation); // Negative for correct direction
        
        // Draw player triangle
        ctx.fillStyle = '#ff00cc'; // Pink/purple player marker
        ctx.beginPath();
        ctx.moveTo(0, -10); // Tip of the arrow
        ctx.lineTo(-6, 6);  // Bottom left
        ctx.lineTo(6, 6);   // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Draw white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
    }
    
    // Initialize the system once DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Only expose what's absolutely needed
    return {
        updatePlayerPosition: updatePlayerPosition
    };
})(); 