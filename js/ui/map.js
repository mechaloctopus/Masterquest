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
    
    // World grid configuration from CONFIG (if available)
    const WORLD_GRID_LIMITS = (typeof CONFIG !== 'undefined' && CONFIG.GRID) ? CONFIG.GRID.SIZE : 50;
    
    // Update rate limiting
    let frameCount = 0;
    
    // Direct coordinate check timer
    let coordinateCheckTimer = null;
    let lastLoggedPosition = { x: 0, z: 0 };
    
    // Debug mode
    const DEBUG = true;
    
    function init() {
        console.log("[MAP] Initializing map system with direct coordinate connection");
        console.log(`[MAP] World grid size: ${WORLD_GRID_LIMITS}x${WORLD_GRID_LIMITS} units`);
        
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
                const compassElem = document.getElementById('coordCompass');
                
                if (coordPos) {
                    // Get position from coordinates
                    const text = coordPos.textContent;
                    const match = text.match(/X:(-?\d+) Z:(-?\d+)/);
                    if (match) {
                        const x = parseFloat(match[1]);
                        const z = parseFloat(match[2]);
                        
                        // Get rotation from compass direction
                        let newRotation = playerRotation;
                        if (compassElem) {
                            const direction = compassElem.textContent;
                            // Convert compass direction to radians
                            switch (direction) {
                                case 'N': newRotation = 0; break;
                                case 'NE': newRotation = Math.PI / 4; break;
                                case 'E': newRotation = Math.PI / 2; break;
                                case 'SE': newRotation = Math.PI * 3/4; break;
                                case 'S': newRotation = Math.PI; break;
                                case 'SW': newRotation = Math.PI * 5/4; break;
                                case 'W': newRotation = Math.PI * 3/2; break;
                                case 'NW': newRotation = Math.PI * 7/4; break;
                            }
                        }
                        
                        // Update position and rotation
                        updatePlayerPosition({x, z}, newRotation);
                        
                        // Debug log for significant changes
                        if (DEBUG && (Math.abs(x - lastLoggedPosition.x) > 0.5 || 
                                      Math.abs(z - lastLoggedPosition.z) > 0.5 ||
                                      Math.abs(newRotation - playerRotation) > 0.1)) {
                            console.log(`[MAP] Position from CoordinateSystem: (${x}, ${z}), Rotation: ${newRotation.toFixed(2)}, Direction: ${compassElem ? compassElem.textContent : 'unknown'}`);
                            lastLoggedPosition = {x, z};
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
                                // IMPORTANT: This is a direct connection to camera rotation
                                updatePlayerPosition({
                                    x: camera.position.x,
                                    z: camera.position.z
                                }, camera.rotation.y);
                                
                                // Log camera rotation for debugging
                                if (DEBUG && frameCount % 300 === 0) {
                                    console.log(`[MAP] Camera rotation: ${camera.rotation.y.toFixed(2)}`);
                                }
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
                        // Also get rotation if available
                        const rotation = camera.rotation?.y || playerRotation;
                        updatePlayerPosition({
                            x: camera.position.x,
                            z: camera.position.z
                        }, rotation);
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
        
        // Only update rotation if provided and different
        if (typeof rotation === 'number' && Math.abs(rotation - playerRotation) > 0.01) {
            playerRotation = rotation;
            // Log rotation changes for debugging
            if (DEBUG) {
                console.log(`[MAP] Rotation updated: ${playerRotation.toFixed(2)}`);
            }
        }
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
        
        // Add debug info if enabled
        if (DEBUG) {
            drawDebugInfo();
        }
    }
    
    // Draw the grid with proper scaling and boundaries
    function drawGrid() {
        const center = MAP_SIZE / 2;
        
        // FIXED: Recalculated grid offset methods
        // First determine how far the player is from the world origin in screen pixels
        const playerOffsetX = playerX * SCALE;
        const playerOffsetZ = playerZ * SCALE;
        
        // Calculate the grid edges in screen space
        const gridLeftEdge = center - (WORLD_GRID_LIMITS * SCALE + playerOffsetX);
        const gridRightEdge = center + (WORLD_GRID_LIMITS * SCALE - playerOffsetX);
        const gridTopEdge = center - (WORLD_GRID_LIMITS * SCALE - playerOffsetZ);
        const gridBottomEdge = center + (WORLD_GRID_LIMITS * SCALE + playerOffsetZ);
        
        // Set grid style for the boundary
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff00ff'; // Magenta boundary
        ctx.globalAlpha = 0.8;
        
        // Draw the grid boundary as a rectangle
        ctx.beginPath();
        ctx.rect(gridLeftEdge, gridTopEdge, gridRightEdge - gridLeftEdge, gridBottomEdge - gridTopEdge);
        ctx.stroke();
        
        // Reset styles for grid lines
        ctx.strokeStyle = '#00cc99'; // Neon green
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        
        // FIXED: Draw grid lines to exactly match the scene grid
        // Calculate where the grid lines should be based on world coordinates
        
        // Draw vertical grid lines (running north-south)
        for (let worldX = -WORLD_GRID_LIMITS; worldX <= WORLD_GRID_LIMITS; worldX += WORLD_GRID_SIZE) {
            // Convert world X to screen X
            const screenX = center + (worldX - playerX) * SCALE;
            
            // Only draw if within view
            if (screenX >= 0 && screenX <= MAP_SIZE) {
                ctx.beginPath();
                ctx.moveTo(screenX, gridTopEdge);
                ctx.lineTo(screenX, gridBottomEdge);
                ctx.stroke();
            }
        }
        
        // Draw horizontal grid lines (running east-west)
        for (let worldZ = -WORLD_GRID_LIMITS; worldZ <= WORLD_GRID_LIMITS; worldZ += WORLD_GRID_SIZE) {
            // Convert world Z to screen Y (remember Z is inverted)
            const screenY = center - (worldZ - playerZ) * SCALE;
            
            // Only draw if within view
            if (screenY >= 0 && screenY <= MAP_SIZE) {
                ctx.beginPath();
                ctx.moveTo(gridLeftEdge, screenY);
                ctx.lineTo(gridRightEdge, screenY);
                ctx.stroke();
            }
        }
        
        // Draw "void" in areas outside the grid
        ctx.fillStyle = 'rgba(0, 0, 20, 0.7)'; // Dark blue with transparency
        
        // Fill the areas outside the grid
        // Top
        if (gridTopEdge > 0) {
            ctx.fillRect(0, 0, MAP_SIZE, gridTopEdge);
        }
        // Bottom
        if (gridBottomEdge < MAP_SIZE) {
            ctx.fillRect(0, gridBottomEdge, MAP_SIZE, MAP_SIZE - gridBottomEdge);
        }
        // Left
        if (gridLeftEdge > 0) {
            ctx.fillRect(0, gridTopEdge, gridLeftEdge, gridBottomEdge - gridTopEdge);
        }
        // Right
        if (gridRightEdge < MAP_SIZE) {
            ctx.fillRect(gridRightEdge, gridTopEdge, MAP_SIZE - gridRightEdge, gridBottomEdge - gridTopEdge);
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
        // FIXED: Adjusted for Z-axis reversal
        const x = center + (origin.x - playerX) * SCALE;
        const y = center - (origin.z - playerZ) * SCALE; // Reversed Z
        
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
        
        // First draw cardinal direction indicators around the edge
        drawCardinalDirections();
        
        // Draw a debug circle to show the center point
        if (DEBUG) {
            ctx.beginPath();
            ctx.arc(center, center, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        // Save context for rotation
        ctx.save();
        ctx.translate(center, center);
        
        // FIXED: Arrow rotation by adjusting offset
        // In the game, 0 radians is North, Math.PI is South
        // Our arrow points up by default, so we need to:
        // 1. Flip the rotation direction (-playerRotation)
        // 2. Add an offset to account for the coordinate system differences
        ctx.rotate(-playerRotation + Math.PI); // Adjusted offset
        
        // Draw player arrow
        ctx.fillStyle = '#ff00cc'; // Pink/purple
        ctx.beginPath();
        ctx.moveTo(0, -8);  // Arrow tip (points UP/NORTH by default)
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
        
        // Draw debug direction line (helps visualize facing direction)
        if (DEBUG) {
            ctx.save();
            ctx.strokeStyle = '#ffff00'; // Yellow
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(center, center);
            
            // FIXED: Calculate the correct direction line
            // Convert playerRotation to degrees for easier debugging
            const degrees = ((playerRotation * 180 / Math.PI) % 360 + 360) % 360;
            
            // Draw the direction line
            const dirAngle = -playerRotation + Math.PI; // Match arrow rotation
            const dirX = center + Math.sin(dirAngle) * 15;
            const dirY = center - Math.cos(dirAngle) * 15;
            ctx.lineTo(dirX, dirY);
            ctx.stroke();
            ctx.restore();
            
            // Show compass and rotation as debug text
            ctx.fillStyle = "#ffff00";
            ctx.font = "9px monospace";
            ctx.textAlign = "left";
            
            // Get direction name for debugging
            const dirName = getCardinalDirection(playerRotation);
            ctx.fillText(`Angle: ${degrees.toFixed(0)}° (${dirName})`, 5, 40);
        }
    }
    
    // Draw cardinal direction indicators (N, S, E, W)
    function drawCardinalDirections() {
        const margin = 5;
        const size = MAP_SIZE;
        
        // Set text style
        ctx.font = '12px monospace';
        ctx.fillStyle = '#00cc99'; // Neon green
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the letters at the edges
        // North
        ctx.fillText('N', size/2, margin + 6);
        
        // South
        ctx.fillText('S', size/2, size - margin - 6);
        
        // East
        ctx.fillText('E', size - margin - 6, size/2);
        
        // West
        ctx.fillText('W', margin + 6, size/2);
    }
    
    // Draw debug information
    function drawDebugInfo() {
        // Convert rotation to degrees for easier reading
        const degrees = ((playerRotation * 180 / Math.PI) % 360 + 360) % 360;
        const directionName = getCardinalDirection(playerRotation);
        
        // Calculate if player is within grid
        const inGrid = Math.abs(playerX) <= WORLD_GRID_LIMITS && Math.abs(playerZ) <= WORLD_GRID_LIMITS;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Rot: ${degrees.toFixed(0)}° (${directionName})`, 5, 10);
        ctx.fillText(`Pos: ${playerX.toFixed(0)},${playerZ.toFixed(0)}`, 5, 20);
        ctx.fillText(`Grid: ${inGrid ? 'ON' : 'OFF'}`, 5, 30);
    }
    
    // Get cardinal direction name
    function getCardinalDirection(radians) {
        // Convert to degrees and normalize to 0-360
        const degrees = ((radians * 180 / Math.PI) % 360 + 360) % 360;
        
        // Map to cardinal directions
        if (degrees >= 337.5 || degrees < 22.5) return 'N';
        if (degrees >= 22.5 && degrees < 67.5) return 'NE';
        if (degrees >= 67.5 && degrees < 112.5) return 'E';
        if (degrees >= 112.5 && degrees < 157.5) return 'SE';
        if (degrees >= 157.5 && degrees < 202.5) return 'S';
        if (degrees >= 202.5 && degrees < 247.5) return 'SW';
        if (degrees >= 247.5 && degrees < 292.5) return 'W';
        if (degrees >= 292.5 && degrees < 337.5) return 'NW';
        
        return 'N'; // fallback
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