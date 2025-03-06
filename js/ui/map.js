// Minimal Map System - Direct Connection to Coordinate Display
const MapSystem = (function() {
    // Essential DOM elements
    let mapCanvas = null;
    let ctx = null;
    let mapContainer = null;
    
    // Player position tracking
    let playerX = 0;
    let playerZ = 0;
    let playerRotation = 0;
    
    // Simple configuration
    const MAP_SIZE = 150;
    const GRID_CELL_SIZE = 20; // Pixels per grid cell
    const WORLD_GRID_SIZE = 2; // World units per grid cell
    const SCALE = GRID_CELL_SIZE / WORLD_GRID_SIZE; // Pixels per world unit
    
    // Update rate limiting
    let frameCount = 0;
    
    // Direct coordinate check timer
    let coordinateCheckTimer = null;
    let lastLoggedPosition = { x: 0, z: 0 };
    
    // Debug mode
    const DEBUG = true;
    
    function init() {
        console.log("[MAP] Initializing map system with direct coordinate connection");
        
        // Get the map container
        mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error("[MAP] Could not find map container");
            return false;
        }
        
        // Fix styling for the map
        styleMapContainer();
        
        // Get or create canvas
        mapCanvas = document.getElementById('mapCanvas');
        if (!mapCanvas) {
            console.error("[MAP] Could not find map canvas");
            return false;
        }
        
        // Set canvas size directly
        mapCanvas.width = MAP_SIZE;
        mapCanvas.height = MAP_SIZE;
        
        // Get drawing context
        ctx = mapCanvas.getContext('2d');
        if (!ctx) {
            console.error("[MAP] Could not get canvas context");
            return false;
        }
        
        // Create origin marker
        addOrigin();
        
        // Start the update loop
        requestAnimationFrame(updateLoop);
        
        // *** CRITICAL FIX: Set up direct coordinate polling ***
        setupDirectCoordinateConnection();
        
        // Make sure CoordinateSystem is initialized after a short delay
        setTimeout(ensureCoordinateDisplay, 100);
        
        console.log("[MAP] Map system initialized successfully");
        return true;
    }
    
    function styleMapContainer() {
        // Make map permanently visible
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '10px';
        mapContainer.style.right = '10px';
        mapContainer.style.width = MAP_SIZE + 'px';
        mapContainer.style.height = MAP_SIZE + 'px';
        mapContainer.style.border = '2px solid #00cc99';
        mapContainer.style.backgroundColor = 'rgba(0, 26, 51, 0.8)';
        mapContainer.style.zIndex = '100';
        
        // Hide any toggle button
        const mapToggle = document.getElementById('mapToggle');
        if (mapToggle) {
            mapToggle.style.display = 'none';
        }
        
        // Make sure canvas fills the container
        const style = document.createElement('style');
        style.textContent = `
            #mapCanvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            #mapContainer {
                overflow: visible !important; /* Changed from hidden to visible */
                display: flex;
                flex-direction: column;
                padding-bottom: 0; /* Remove padding, let the coordinate display position itself */
            }
            
            /* Fix coordinate display styling - don't override the original */
            .map-coordinates {
                display: flex !important;
                flex-direction: column;
                justify-content: center;
                width: 100%;
                margin-top: ${MAP_SIZE}px; /* Position below map */
                background-color: rgba(0, 26, 51, 0.95);
                border: 1px solid #00cc99;
                color: #00cc99;
                padding: 5px;
            }
            .coord-position, .coord-grid {
                display: flex;
                justify-content: space-between;
                padding: 2px 5px;
            }
            .coord-compass {
                font-weight: bold;
                color: #ff00cc;
                text-align: center;
            }
            .coord-label {
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    function addOrigin() {
        // Just store origin info for drawing later
        window.mapOrigin = {
            x: 0,
            z: 0,
            color: "#00FFFF",
            label: "Origin"
        };
    }
    
    // *** CRITICAL FIX: This is the key function to fix the map! ***
    function setupDirectCoordinateConnection() {
        // Check if we can use the coordinate display system
        if (window.CoordinateSystem) {
            console.log("[MAP] Connecting directly to CoordinateSystem");
            
            // Method 1: Poll the coordinate display DOM elements (most reliable)
            coordinateCheckTimer = setInterval(function() {
                const coordPos = document.getElementById('coordPos');
                if (coordPos) {
                    const text = coordPos.textContent;
                    const match = text.match(/X:(-?\d+) Z:(-?\d+)/);
                    if (match) {
                        const x = parseFloat(match[1]);
                        const z = parseFloat(match[2]);
                        
                        // Only update if position actually changed
                        if (x !== playerX || z !== playerZ) {
                            updatePlayerPosition({x, z}, playerRotation);
                            
                            if (DEBUG && (Math.abs(x - lastLoggedPosition.x) > 0.5 || Math.abs(z - lastLoggedPosition.z) > 0.5)) {
                                console.log(`[MAP] Position from CoordinateSystem: (${x}, ${z})`);
                                lastLoggedPosition = {x, z};
                            }
                        }
                    }
                }
            }, 100); // Check 10 times per second
            
            // Method 2: Hook into camera updates (backup method)
            if (window.BABYLON && BABYLON.Engine.Instances.length > 0) {
                try {
                    const engine = BABYLON.Engine.Instances[0];
                    if (engine?.scenes?.length > 0) {
                        const scene = engine.scenes[0];
                        scene.onBeforeRenderObservable.add(() => {
                            if (scene.activeCamera?.position) {
                                const camera = scene.activeCamera;
                                updatePlayerPosition({
                                    x: camera.position.x,
                                    z: camera.position.z
                                }, camera.rotation.y);
                            }
                        });
                        console.log("[MAP] Connected to Babylon camera for position updates");
                    }
                } catch (e) {
                    console.warn("[MAP] Could not connect to Babylon camera:", e);
                }
            }
        } else {
            console.warn("[MAP] CoordinateSystem not available, falling back to polling");
            
            // Method 3: Poll the state.systems.camera directly
            coordinateCheckTimer = setInterval(function() {
                if (window.state?.systems?.camera) {
                    const camera = state.systems.camera;
                    if (camera?.position) {
                        updatePlayerPosition({
                            x: camera.position.x,
                            z: camera.position.z
                        }, camera.rotation.y);
                    }
                }
            }, 100); // Check 10 times per second
        }
    }
    
    // Standard update function for position updates (may be called manually)
    function updatePlayerPosition(position, rotation) {
        if (!position) return;
        
        // Store values
        playerX = typeof position.x === 'number' ? position.x : playerX;
        playerZ = typeof position.z === 'number' ? position.z : playerZ;
        playerRotation = typeof rotation === 'number' ? rotation : playerRotation;
    }
    
    // Main render loop
    function updateLoop() {
        frameCount++;
        
        // Render the map
        renderMap();
        
        // Debug output occasionally
        if (DEBUG && frameCount % 300 === 0) {
            console.log(`[MAP] Current position: (${playerX.toFixed(2)}, ${playerZ.toFixed(2)})`);
        }
        
        // Continue loop
        requestAnimationFrame(updateLoop);
    }
    
    // Render the map
    function renderMap() {
        if (!ctx || !mapCanvas) return;
        
        // Clear canvas
        ctx.fillStyle = '#001a33'; // Dark blue background
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw origin point
        drawOrigin();
        
        // Draw player arrow
        drawPlayer();
    }
    
    // Draw the grid with proper scaling
    function drawGrid() {
        const center = MAP_SIZE / 2;
        
        // Calculate grid offsets based on player position
        // Grid moves in opposite direction of player
        const offsetX = (-playerX * SCALE) % GRID_CELL_SIZE;
        const offsetZ = (-playerZ * SCALE) % GRID_CELL_SIZE;
        
        // Make sure offsets are properly wrapped (between 0 and cell size)
        const startX = (offsetX + GRID_CELL_SIZE) % GRID_CELL_SIZE;
        const startZ = (offsetZ + GRID_CELL_SIZE) % GRID_CELL_SIZE;
        
        // Set grid style
        ctx.strokeStyle = '#00cc99'; // Neon green
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        // Draw vertical grid lines
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
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
    
    // Draw the origin point
    function drawOrigin() {
        const origin = window.mapOrigin;
        if (!origin) return;
        
        const center = MAP_SIZE / 2;
        
        // Calculate origin position relative to player
        const x = center + (origin.x - playerX) * SCALE;
        const y = center + (origin.z - playerZ) * SCALE;
        
        // Check if within view
        if (x >= -10 && x <= MAP_SIZE + 10 && y >= -10 && y <= MAP_SIZE + 10) {
            // Draw the point
            ctx.fillStyle = origin.color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the label
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px monospace';
            ctx.fillText(origin.label, x + 5, y + 3);
        }
    }
    
    // Draw the player arrow
    function drawPlayer() {
        const center = MAP_SIZE / 2;
        
        // Save context for rotation
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(-playerRotation); // Negative rotation for correct direction
        
        // Draw player arrow
        ctx.fillStyle = '#ff00cc'; // Pink/purple
        ctx.beginPath();
        ctx.moveTo(0, -8);  // Arrow tip
        ctx.lineTo(-5, 5);  // Bottom left
        ctx.lineTo(5, 5);   // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
    }
    
    // Clean up when unloading
    function cleanup() {
        if (coordinateCheckTimer) {
            clearInterval(coordinateCheckTimer);
        }
    }
    
    // Ensure coordinate display is visible
    function ensureCoordinateDisplay() {
        // Check if CoordinateSystem exists but isn't initialized yet
        if (window.CoordinateSystem && typeof window.CoordinateSystem.init === 'function') {
            // Initialize if not already done
            if (!document.getElementById('coordinateDisplay')) {
                console.log("[MAP] Initializing CoordinateSystem");
                window.CoordinateSystem.init();
            }
            
            // Make sure it's visible
            if (typeof window.CoordinateSystem.show === 'function') {
                window.CoordinateSystem.show();
                console.log("[MAP] CoordinateSystem display shown");
            }
        } else {
            console.warn("[MAP] CoordinateSystem not available");
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Clean up when window unloads
    window.addEventListener('unload', cleanup);
    
    // Public API - only expose what's needed
    return {
        updatePlayerPosition: updatePlayerPosition,
        // Add an explicit init function to the public API for App.js to call
        init: init
    };
})(); 