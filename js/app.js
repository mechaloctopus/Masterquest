// Application Entry Point
const App = (function() {
    // Private application state
    const state = {
        initialized: false,
        engine: null,
        scene: null,
        gameState: {
            moveVector: new BABYLON.Vector3(0, 0, 0),
            jumpForce: 0,
            bobTime: 0,
            grounded: true,
            smoothedMovementIntensity: 0,
            striking: false,
            strikeProgress: 0,
            health: 100,
            maxHealth: 100
        },
        systems: {},
        assets: {}
    };

    // Initialize all application systems
    function init() {
        if (state.initialized) {
            Logger.log("> SYSTEM ALREADY INITIALIZED");
            return;
        }

        try {
            // Initialize the loading screen first
            if (window.LoadingScreenSystem) {
                LoadingScreenSystem.init();
                LoadingScreenSystem.addConsoleMessage("> SYSTEM INITIALIZING...");
                LoadingScreenSystem.addConsoleMessage("> LOADING NEON GRID PROTOCOL...");
            } else {
                Logger.log("> SYSTEM INITIALIZING...");
                Logger.log("> LOADING NEON GRID PROTOCOL...");
            }
            
            // Setup canvas and engine
            const canvas = document.getElementById('renderCanvas');
            if (!canvas) {
                throw new Error("Canvas element not found! Cannot initialize game.");
            }
            
            state.engine = new BABYLON.Engine(canvas, true);
            state.engine.onError = function(e) {
                Logger.error("Engine error: " + e.message);
            };
            
            // Create scene
            state.scene = SceneManager.create(state.engine);
            if (!state.scene) {
                throw new Error("Failed to create scene");
            }
            
            // Initialize all systems in order
            initializeAllSystems();
            
            // Setup main render loop
            setupRenderLoop();
            
            // Handle window resize
            window.addEventListener('resize', () => state.engine.resize());
            
            // Mark as initialized
            state.initialized = true;
            Logger.log("> SYSTEM READY");
            Logger.log("> INITIALIZE GRID NAVIGATION...");
            
        } catch (error) {
            Logger.error(error.message);
            activateEmergencyFallback();
        }
    }
    
    // Initialize all systems in order
    function initializeAllSystems() {
        try {
            // Initialize loader first if available
            if (window.LoaderSystem) {
                LoaderSystem.initialize(state.scene);
                Logger.log("> ASSET LOADER INITIALIZED");
                state.systems.loader = true;
            }
            
            // Initialize grid
            try {
                GridSystem.create(state.scene);
                Logger.log("> NEON GREEN GRID INITIALIZED");
                state.systems.grid = true;
            } catch (e) {
                Logger.error(`Grid initialization failed: ${e.message}`);
            }

            // Initialize fireworks
            try {
                FireworksSystem.init();
                Logger.log("> FIREWORKS INITIALIZED");
                Logger.log("> BIRTHDAY FIREWORKS ACTIVATED");
                state.systems.fireworks = true;
            } catch (e) {
                Logger.error(`Fireworks initialization failed: ${e.message}`);
            }
            
            // Initialize skybox
            try {
                SkyboxSystem.create(state.scene);
                Logger.log("> VAPORWAVE SKYBOX INITIALIZED");
                state.systems.skybox = true;
            } catch (e) {
                Logger.error(`Skybox initialization failed: ${e.message}`);
            }
            
            // Initialize camera
            try {
                const canvas = document.getElementById('renderCanvas');
                state.systems.camera = CameraManager.create(state.scene, canvas);
                Logger.log("> CAMERA INITIALIZED");
            } catch (e) {
                Logger.error(`Camera initialization failed: ${e.message}`);
                // Create fallback camera
                state.systems.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), state.scene);
            }
            
            // Initialize health system
            try {
                if (window.HealthBarSystem) {
                    HealthBarSystem.init();
                    HealthBarSystem.setHealth(state.gameState.health, state.gameState.maxHealth);
                    state.systems.health = true;
                }
            } catch (e) {
                Logger.error(`Health system initialization failed: ${e.message}`);
            }
            
            // Initialize map system
            try {
                if (window.MapSystem) {
                    MapSystem.init();
                    state.systems.map = true;
                }
            } catch (e) {
                Logger.error(`Map system initialization failed: ${e.message}`);
            }
            
            // Initialize inventory system
            try {
                if (window.InventorySystem) {
                    InventorySystem.init();
                    state.systems.inventory = true;
                }
            } catch (e) {
                Logger.error(`Inventory system initialization failed: ${e.message}`);
            }
            
            // Initialize hands
            try {
                state.systems.hands = HandsSystem.create(state.scene, state.systems.camera);
                Logger.log("> HANDS SYSTEM INITIALIZED");
            } catch (e) {
                Logger.error(`Hands initialization failed: ${e.message}`);
                state.systems.hands = null;
            }
            
            // Initialize audio
            try {
                state.systems.audio = AudioSystem.create();
                Logger.log("> AUDIO SYSTEM INITIALIZED");
            } catch (e) {
                Logger.error(`Audio initialization failed: ${e.message}`);
                // Create dummy audio system
                state.systems.audio = {
                    sfx: { footsteps: {}, jump: {}, strike: {} },
                    isWalking: false
                };
            }
            
            // Initialize controls - CRITICAL for joysticks and buttons
            try {
                ControlSystem.setupControls(state.scene, state.systems.camera, state.gameState, state.systems.audio);
                Logger.log("> CONTROLS INITIALIZED");
                state.systems.controls = true;
            } catch (e) {
                Logger.error(`Controls initialization failed: ${e.message}`);
            }
            
            // Setup performance monitoring
            try {
                SceneManager.addPerformanceMonitor(state.engine, state.scene);
                state.systems.performance = true;
            } catch (e) {
                Logger.error(`Performance monitor initialization failed: ${e.message}`);
            }
            
            // Initialize birthday text
            try {
                let birthdayText = BirthdayTextSystem.create(state.scene);
                if (!birthdayText) {
                    // Fallback to primitive version if CreateText is not available
                    birthdayText = BirthdayTextSystem.createWithPrimitives(state.scene);
                }
                Logger.log("> 3D BIRTHDAY MESSAGE INITIALIZED");
                state.systems.birthdayText = true;
            } catch (e) {
                Logger.error(`Birthday text initialization failed: ${e.message}`);
            }
            
            // Initialize radio player
            try {
                if (window.RadioPlayerSystem) {
                    // RadioPlayerSystem will self-initialize on DOM ready
                    Logger.log("> RADIO PLAYER INITIALIZED");
                    state.systems.radioPlayer = true;
                }
            } catch (e) {
                Logger.error(`Radio player reference failed: ${e.message}`);
            }
            
            // If asset loader is available, queue and load assets
            if (state.systems.loader) {
                queueAssetLoading();
                LoaderSystem.startLoading();
                
                // Set a timer to force loader completion if it doesn't complete on its own
                setTimeout(() => {
                    if (window.EventSystem && state.initialized) {
                        // Check if the loading screen is still visible
                        const loadingScreen = document.getElementById('loadingScreen');
                        if (loadingScreen && loadingScreen.style.display !== 'none' && !loadingScreen.classList.contains('hidden')) {
                            console.log("Forcing loader completion event after timeout");
                            EventSystem.emit('loader.complete', { 
                                forced: true,
                                message: "Loading completed (forced)"
                            });
                        }
                    }
                }, 8000); // 8 seconds max loading time
            } else {
                // If no loader is available, emit loader complete immediately
                if (window.EventSystem) {
                    console.log("No loader system available, emitting completion immediately");
                    setTimeout(() => {
                        EventSystem.emit('loader.complete', { 
                            forced: true,
                            message: "Loading completed (no loader available)"
                        });
                    }, 2000); // Give 2 seconds to view the loading screen anyway
                }
            }
            
            // Set up system event listeners
            setupEventListeners();
            
        } catch (e) {
            Logger.error(`System initialization failed: ${e.message}`);
        }
    }
    
    // Setup event listeners for system events
    function setupEventListeners() {
        // Listen for map position updates
        if (window.EventSystem && state.systems.map) {
            // Update map with player position
            state.scene.registerBeforeRender(() => {
                if (state.systems.camera) {
                    const camera = state.systems.camera;
                    const position = camera.position;
                    const rotation = camera.rotation.y;
                    
                    MapSystem.updatePlayerPosition({ x: position.x, z: position.z }, rotation);
                }
            });
        }
        
        // Listen for health changes
        if (window.EventSystem) {
            EventSystem.on('health.changed', (data) => {
                state.gameState.health = data.current;
                state.gameState.maxHealth = data.max;
            });
        }
        
        // Listen for inventory events
        if (window.EventSystem) {
            EventSystem.on('inventory.itemSelected', (data) => {
                Logger.log(`Selected item: ${data.item.name}`);
                
                // Example of using an item
                if (data.item.type === 'consumable' && data.item.id === 'health_potion') {
                    useHealthPotion();
                }
            });
        }
    }
    
    // Example function for using a health potion
    function useHealthPotion() {
        if (!state.systems.health) return;
        
        HealthBarSystem.heal(25);
        InventorySystem.removeItem('health_potion', 1);
        
        Logger.log("> USED HEALTH POTION");
    }
    
    // Queue assets for loading
    function queueAssetLoading() {
        if (!state.systems.loader) {
            Logger.error("Cannot queue assets - loader not initialized");
            return;
        }
        
        try {
            // Queue audio files
            const audioFiles = [
                { name: 'footsteps', url: 'js/audio/footsteps.mp3', loop: true },
                { name: 'jump', url: 'js/audio/jump.mp3' },
                { name: 'strike', url: 'js/audio/strike.wav' }
            ];
            
            // Queue music files (example)
            const musicFiles = [];
            
            // Queue all textures, sounds, etc.
            LoaderSystem.loadSounds(audioFiles);
            Logger.log("> QUEUED AUDIO ASSETS FOR LOADING");
            
            // You could add more asset types here:
            // LoaderSystem.loadTextures(textureFiles);
            // etc.
        } catch (e) {
            Logger.error(`Failed to queue assets: ${e.message}`);
        }
    }

    // Setup the main render and update loops
    function setupRenderLoop() {
        // Main game update loop
        state.scene.registerBeforeRender(() => {
            try {
                const deltaTime = state.engine.getDeltaTime() / 1000;
                
                // Update systems
                MovementSystem.update(state.systems.camera, state.gameState, deltaTime);
                
                if (state.systems.audio) {
                    AudioSystem.update(state.gameState, state.systems.audio);
                }
                
                if (state.systems.hands) {
                    HandsSystem.updateHands(state.systems.hands, state.gameState, deltaTime);
                }
                
                // Update animation time for other possible uses
                state.gameState.bobTime += deltaTime;
            } catch (e) {
                // Don't log every frame to avoid console spam
                console.error("Update loop error:", e);
            }
        });

        // Start the render loop
        state.engine.runRenderLoop(() => state.scene.render());
    }
    
    // Example function to damage the player (for testing)
    function damagePlayer(amount) {
        if (!state.systems.health) return;
        
        HealthBarSystem.damage(amount);
        
        // Shake the camera to indicate damage
        if (state.systems.camera) {
            const camera = state.systems.camera;
            const originalPosition = camera.position.clone();
            
            let shakeTime = 0;
            const shakeDuration = 0.5;
            const shakeIntensity = 0.05;
            
            // Create a shake animation
            const shakeInterval = setInterval(() => {
                shakeTime += 0.05;
                
                if (shakeTime >= shakeDuration) {
                    clearInterval(shakeInterval);
                    camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
                    return;
                }
                
                // Random offset
                const offsetX = (Math.random() - 0.5) * shakeIntensity;
                const offsetY = (Math.random() - 0.5) * shakeIntensity;
                
                camera.position.x = originalPosition.x + offsetX;
                camera.position.y = originalPosition.y + offsetY;
            }, 50);
        }
    }

    // Emergency fallback mode
    function activateEmergencyFallback() {
        try {
            const canvas = document.getElementById('renderCanvas');
            state.engine = new BABYLON.Engine(canvas, true);
            state.scene = new BABYLON.Scene(state.engine);
            state.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            
            // Basic grid
            for(let i = -20; i <= 20; i += 2) {
                BABYLON.MeshBuilder.CreateLines("grid", {
                    points: [
                        new BABYLON.Vector3(i, 0, -20),
                        new BABYLON.Vector3(i, 0, 20)
                    ]
                }, state.scene).color = new BABYLON.Color3(0.5, 0, 1);
                
                BABYLON.MeshBuilder.CreateLines("grid", {
                    points: [
                        new BABYLON.Vector3(-20, 0, i),
                        new BABYLON.Vector3(20, 0, i)
                    ]
                }, state.scene).color = new BABYLON.Color3(0.5, 0, 1);
            }
            
            // Basic camera
            state.systems.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), state.scene);
            state.systems.camera.attachControl(canvas, true);
            
            state.engine.runRenderLoop(() => state.scene.render());
            Logger.log("> EMERGENCY FALLBACK MODE ACTIVATED");
        } catch (fallbackError) {
            Logger.error("Emergency fallback also failed: " + fallbackError.message);
        }
    }

    // PWA support
    function setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                // Comment out for now since sw.js doesn't exist yet
                /* navigator.serviceWorker.register('./sw.js').then(
                    function(registration) {
                        console.log('ServiceWorker registration successful');
                    },
                    function(err) { console.log('ServiceWorker registration failed: ', err); }
                ); */
            });
        }
    }

    // Public API
    return {
        init: init,
        setupServiceWorker: setupServiceWorker,
        getState: () => ({ ...state }), // Return a copy of state for debugging
        damage: damagePlayer, // Expose damage function for testing
    };
})();

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    App.init();
    App.setupServiceWorker();
    
    // Add a global test function
    window.testDamage = function(amount = 10) {
        App.damage(amount);
    };
}); 