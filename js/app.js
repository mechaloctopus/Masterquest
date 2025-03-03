// Application Entry Point
const App = (function() {
    // Private application state
    const state = {
        initialized: false,
        engine: null,
        scene: null,
        gameState: null,
        systems: {},
    };

    // Initialize all application systems
    function init() {
        if (state.initialized) {
            Logger.log("> SYSTEM ALREADY INITIALIZED");
            return;
        }

        try {
            Logger.log("> SYSTEM INITIALIZING...");
            Logger.log("> LOADING NEON GRID PROTOCOL...");
            
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
            
            // Initialize game state
            state.gameState = {
                moveVector: new BABYLON.Vector3(0, 0, 0),
                jumpForce: 0,
                bobTime: 0,
                grounded: true,
                smoothedMovementIntensity: 0,
                striking: false,
                strikeProgress: 0
            };

            // Setup event listeners
            setupEventListeners();
            
            // Initialize loader first
            initializeLoader();
            
            // Initialize core systems
            initializeCoreSystems();
            
            // Queue asset loading
            queueAssetLoading();
            
            // Start loading process
            LoaderSystem.startLoading();
            
            // Listen for loading completion
            EventSystem.on('loader.complete', () => {
                // Initialize remaining systems after assets are loaded
                initializeGameSystems();
                
                // Setup main render loop
                setupRenderLoop();
                
                // Handle window resize
                window.addEventListener('resize', () => state.engine.resize());
                
                // Mark as initialized
                state.initialized = true;
                Logger.log("> SYSTEM READY");
                Logger.log("> INITIALIZE GRID NAVIGATION...");
            });
            
        } catch (error) {
            Logger.error(error.message);
            activateEmergencyFallback();
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // System readiness events
        EventSystem.on('loader.error', data => {
            Logger.error(`Loading error: ${data.taskName} - ${data.error}`);
        });
        
        EventSystem.on('loader.progress', data => {
            // Could add a loading screen here
            console.log(`Loading progress: ${Math.round(data.progress * 100)}%`);
        });
    }
    
    // Initialize the loader system
    function initializeLoader() {
        try {
            LoaderSystem.initialize(state.scene);
            Logger.log("> ASSET LOADER INITIALIZED");
            state.systems.loader = true;
        } catch (e) {
            Logger.error(`Loader initialization failed: ${e.message}`);
        }
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
            
            LoaderSystem.loadSounds(audioFiles);
            Logger.log("> QUEUED AUDIO ASSETS FOR LOADING");
        } catch (e) {
            Logger.error(`Failed to queue assets: ${e.message}`);
        }
    }

    // Initialize core systems needed before asset loading
    function initializeCoreSystems() {
        const coreInitializers = [
            { name: "grid", fn: () => {
                GridSystem.create(state.scene);
                Logger.log("> NEON GREEN GRID INITIALIZED");
            }},
            { name: "skybox", fn: () => {
                SkyboxSystem.create(state.scene);
                Logger.log("> VAPORWAVE SKYBOX INITIALIZED");
            }},
            { name: "camera", fn: () => {
                const canvas = document.getElementById('renderCanvas');
                state.systems.camera = CameraManager.create(state.scene, canvas);
                Logger.log("> CAMERA INITIALIZED");
            }}
        ];

        // Initialize each core system with error handling
        coreInitializers.forEach(system => {
            try {
                system.fn();
                state.systems[system.name] = true;
            } catch (e) {
                Logger.error(`${system.name} initialization failed: ${e.message}`);
                
                // Create fallbacks for critical systems
                if (system.name === "camera" && !state.systems.camera) {
                    state.systems.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), state.scene);
                }
            }
        });
    }

    // Initialize game systems after assets are loaded
    function initializeGameSystems() {
        const systemInitializers = [
            { name: "fireworks", fn: () => {
                FireworksSystem.init();
                Logger.log("> BIRTHDAY FIREWORKS ACTIVATED");
            }},
            { name: "hands", fn: () => {
                state.systems.hands = HandsSystem.create(state.scene, state.systems.camera);
                Logger.log("> HANDS SYSTEM INITIALIZED");
            }},
            { name: "audio", fn: () => {
                state.systems.audio = AudioSystem.create();
                Logger.log("> AUDIO SYSTEM INITIALIZED");
            }},
            { name: "controls", fn: () => {
                ControlSystem.setupControls(state.scene, state.systems.camera, state.gameState, state.systems.audio);
                Logger.log("> CONTROLS INITIALIZED");
            }},
            { name: "performance", fn: () => {
                SceneManager.addPerformanceMonitor(state.engine, state.scene);
            }},
            { name: "birthdayText", fn: () => {
                let birthdayText = BirthdayTextSystem.create(state.scene);
                if (!birthdayText) {
                    birthdayText = BirthdayTextSystem.createWithPrimitives(state.scene);
                }
                Logger.log("> 3D BIRTHDAY MESSAGE INITIALIZED");
            }},
            { name: "radioPlayer", fn: () => {
                if (window.RadioPlayerSystem) {
                    Logger.log("> RADIO PLAYER WILL SELF-INITIALIZE");
                }
            }}
        ];

        // Initialize each game system with error handling
        systemInitializers.forEach(system => {
            try {
                system.fn();
                state.systems[system.name] = true;
            } catch (e) {
                Logger.error(`${system.name} initialization failed: ${e.message}`);
                
                // Create fallbacks for critical systems
                if (system.name === "audio" && !state.systems.audio) {
                    state.systems.audio = {
                        sfx: { footsteps: {}, jump: {}, strike: {} },
                        isWalking: false
                    };
                }
            }
        });
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
    };
})();

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    App.init();
    App.setupServiceWorker();
}); 