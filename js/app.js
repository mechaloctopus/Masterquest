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
            maxHealth: 100,
            currentRealm: 1
        },
        systems: {},
        assets: {},
        realm: {
            current: null,
            npcs: [],
            foes: []
        }
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
            
            // Initialize dialogue system for NPC and Foe interactions
            try {
                if (window.DialogueSystem) {
                    DialogueSystem.init();
                    Logger.log("> DIALOGUE SYSTEM INITIALIZED");
                    state.systems.dialogue = true;
                }
            } catch (e) {
                Logger.error(`Dialogue system initialization failed: ${e.message}`);
            }
            
            // Initialize NPC system
            try {
                if (window.NPCSystem) {
                    NPCSystem.init(state.scene);
                    Logger.log("> NPC SYSTEM INITIALIZED");
                    state.systems.npcs = true;
                }
            } catch (e) {
                Logger.error(`NPC system initialization failed: ${e.message}`);
            }
            
            // Initialize Foe system
            try {
                if (window.FoeSystem) {
                    FoeSystem.init(state.scene);
                    Logger.log("> FOE SYSTEM INITIALIZED");
                    state.systems.foes = true;
                }
            } catch (e) {
                Logger.error(`Foe system initialization failed: ${e.message}`);
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
            
            // Now explicitly initialize the current realm
            console.log("About to initialize current realm...");
            initializeCurrentRealm();
            console.log("Current realm initialization complete");
            
            return true;
        } catch (e) {
            Logger.error(`System initialization failed: ${e.message}`);
            return false;
        }
    }
    
    // Initialize the current realm
    function initializeCurrentRealm() {
        try {
            // Get current realm from config or state
            const realmIndex = CONFIG.REALMS.CURRENT_REALM || 1;
            console.log("Initializing realm:", realmIndex);
            state.gameState.currentRealm = realmIndex;
            
            // Get realm config
            const realmConfig = CONFIG.REALMS[`REALM_${realmIndex}`];
            console.log("Realm config:", realmConfig);
            
            if (!realmConfig) {
                console.error(`Realm configuration for realm ${realmIndex} not found`);
                Logger.error(`Realm configuration for realm ${realmIndex} not found`);
                return;
            }
            
            Logger.log(`> INITIALIZING REALM: ${realmConfig.NAME}`);
            
            // Store current realm info
            state.realm.current = {
                index: realmIndex,
                name: realmConfig.NAME,
                config: realmConfig
            };
            
            // Set up realm-specific skybox if configured
            if (realmConfig.SKYBOX && state.systems.skybox) {
                // Apply realm-specific skybox settings
                // This functionality would be implemented in SkyboxSystem
                // SkyboxSystem.updateForRealm(realmConfig.SKYBOX);
                Logger.log(`> SKYBOX UPDATED FOR REALM: ${realmConfig.NAME}`);
            }
            
            // Initialize NPCs for this realm
            if (window.NPCSystem) {
                console.log("Calling NPCSystem.loadNPCsForRealm with realmIndex:", realmIndex);
                NPCSystem.loadNPCsForRealm(realmIndex);
                console.log("NPCs loaded");
                Logger.log(`> NPCS LOADED FOR REALM: ${realmConfig.NAME}`);
            } else {
                console.error("NPCSystem not available globally");
            }
            
            // Initialize Foes for this realm
            if (window.FoeSystem) {
                console.log("Calling FoeSystem.loadFoesForRealm with realmIndex:", realmIndex);
                FoeSystem.loadFoesForRealm(realmIndex);
                console.log("Foes loaded");
                Logger.log(`> FOES LOADED FOR REALM: ${realmConfig.NAME}`);
            } else {
                console.error("FoeSystem not available globally");
            }
            
            Logger.log(`> REALM ${realmConfig.NAME} INITIALIZED`);
        } catch (e) {
            Logger.error(`Realm initialization failed: ${e.message}`);
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
                    
                    // Update map with player position
                    MapSystem.updatePlayerPosition({ x: position.x, z: position.z }, rotation);
                    
                    // Emit player position for NPC and Foe proximity checks
                    if (window.EventSystem) {
                        EventSystem.emit('player.position', {
                            position: { x: position.x, y: position.y, z: position.z },
                            rotation: rotation
                        });
                    }
                }
            });
        }
        
        // Listen for health changes
        if (window.EventSystem && state.systems.health) {
            EventSystem.on('health.changed', (data) => {
                // Handle health changes, possibly update UI or game state
                state.gameState.health = data.current;
                state.gameState.maxHealth = data.max;
            });
        }
        
        // Listen for inventory events
        if (window.EventSystem && state.systems.inventory) {
            EventSystem.on('inventory.itemSelected', (data) => {
                // Handle item selection
                console.log(`Selected item: ${data.item.name}`);
            });
            
            EventSystem.on('inventory.itemAdded', (data) => {
                // Handle item added
                console.log(`Added item: ${data.item.name}`);
            });
            
            EventSystem.on('inventory.itemRemoved', (data) => {
                // Handle item removed
                console.log(`Removed item with ID: ${data.id}`);
            });
            
            // Listen for game pause/resume from inventory
            EventSystem.on('game.paused', (data) => {
                if (data.source === 'inventory') {
                    pauseGame();
                }
            });
            
            EventSystem.on('game.resumed', (data) => {
                if (data.source === 'inventory') {
                    resumeGame();
                }
            });
            
            // Equipment events
            EventSystem.on('inventory.itemEquipped', (data) => {
                console.log(`Equipped ${data.item.name} in ${data.slot} slot`);
                // Handle equipment effects
                applyEquipmentEffects(data.item, data.slot, true);
            });
            
            EventSystem.on('inventory.itemUnequipped', (data) => {
                console.log(`Unequipped ${data.item.name} from ${data.slot} slot`);
                // Remove equipment effects
                applyEquipmentEffects(data.item, data.slot, false);
            });
        }
        
        // Use health potion when selected
        if (window.EventSystem) {
            EventSystem.on('inventory.itemSelected', (data) => {
                if (data.item && data.item.id === 'health_potion') {
                    useHealthPotion();
                }
            });
        }
        
        // Future: Add event listeners for realm-specific events
        if (window.EventSystem) {
            // Listen for realm change events
            EventSystem.on('realm.change', (data) => {
                if (data && data.realmIndex) {
                    changeRealm(data.realmIndex);
                }
            });
            
            // Listen for NPC interaction events
            EventSystem.on('npc.interact', (data) => {
                if (data && data.npcId) {
                    handleNPCInteraction(data.npcId);
                }
            });
            
            // Listen for foe/quiz interaction events
            EventSystem.on('foe.interact', (data) => {
                if (data && data.foeId) {
                    handleFoeInteraction(data.foeId);
                }
            });
        }
    }
    
    // Change to a different realm
    function changeRealm(realmIndex) {
        // This is a placeholder for future realm-change functionality
        Logger.log(`> PREPARING TO CHANGE TO REALM ${realmIndex}`);
        
        // Future implementation:
        // 1. Clear current realm entities
        // 2. Update state
        // 3. Load new realm assets
        // 4. Initialize new realm
    }
    
    // Handle NPC interaction
    function handleNPCInteraction(npcId) {
        // Placeholder for NPC dialogue system
        Logger.log(`> INTERACTING WITH NPC ID: ${npcId}`);
        
        // Future implementation:
        // 1. Find NPC data
        // 2. Display dialogue UI
        // 3. Process interaction
    }
    
    // Handle foe/quiz interaction
    function handleFoeInteraction(foeId) {
        // Placeholder for foe/quiz system
        Logger.log(`> INTERACTING WITH FOE ID: ${foeId}`);
        
        // Future implementation:
        // 1. Find foe data
        // 2. Display quiz UI
        // 3. Process interaction/combat
    }
    
    // Apply equipment effects when items are equipped/unequipped
    function applyEquipmentEffects(item, slot, isEquipped) {
        if (!item) return;
        
        // Example effects based on equipment
        switch(item.type) {
            case 'helmet':
            case 'hat':
                // Maybe give damage reduction
                break;
            case 'armor':
            case 'chest':
                // More health or defense
                break;
            case 'weapon':
                // Change player attack style or damage
                if (slot === 'rightHand') {
                    console.log('Weapon equipped in right hand');
                    // Show weapon in right hand
                    if (window.HandsSystem && isEquipped) {
                        HandsSystem.setRightHandItem(item);
                    } else if (window.HandsSystem && !isEquipped) {
                        HandsSystem.clearRightHandItem();
                    }
                } else if (slot === 'leftHand') {
                    console.log('Weapon equipped in left hand');
                    // Show weapon in left hand
                    if (window.HandsSystem && isEquipped) {
                        HandsSystem.setLeftHandItem(item);
                    } else if (window.HandsSystem && !isEquipped) {
                        HandsSystem.clearLeftHandItem();
                    }
                }
                break;
        }
    }
    
    // Pause the game
    function pauseGame() {
        if (state.scene) {
            console.log("Game paused");
            state.scene.paused = true;
            
            // Disable controls
            if (window.ControlSystem) {
                ControlSystem.disableControls();
            }
        }
    }
    
    // Resume the game
    function resumeGame() {
        if (state.scene) {
            console.log("Game resumed");
            state.scene.paused = false;
            
            // Re-enable controls
            if (window.ControlSystem) {
                ControlSystem.enableControls();
            }
        }
    }
    
    // Use a health potion
    function useHealthPotion() {
        // Check if we have health potions
        if (window.InventorySystem) {
            // Get all items
            const items = InventorySystem.getAllItems();
            const healthPotion = items.find(item => item.id === 'health_potion');
            
            if (healthPotion && healthPotion.count > 0) {
                // Use the potion
                if (window.HealthBarSystem) {
                    HealthBarSystem.heal(25);
                    Logger.log("> HEALTH POTION USED");
                    
                    // Remove one potion from inventory
                    InventorySystem.removeItem('health_potion', 1);
                    
                    // Play sound effect if available
                    if (state.systems.audio && state.systems.audio.sfx && state.systems.audio.sfx.heal) {
                        state.systems.audio.sfx.heal.play();
                    }
                }
            } else {
                Logger.warning("No health potions available");
            }
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
            
            // Queue music files (example)
            const musicFiles = [];
            
            // Queue all textures, sounds, etc.
            LoaderSystem.loadSounds(audioFiles);
            Logger.log("> QUEUED AUDIO ASSETS FOR LOADING");
            
            // Future: Load realm-specific assets based on current realm
            // const realmAssets = getRealmAssets(state.gameState.currentRealm);
            // LoaderSystem.loadModels(realmAssets.models);
            // LoaderSystem.loadTextures(realmAssets.textures);
        } catch (e) {
            Logger.error(`Failed to queue assets: ${e.message}`);
        }
    }

    // Setup the main render and update loops
    function setupRenderLoop() {
        if (!state.engine || !state.scene) {
            Logger.error("Cannot setup render loop - missing engine or scene");
            return false;
        }
        
        try {
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
                    
                    // Update player position for NPCs and Foes
                    if (state.systems.camera) {
                        const camera = state.systems.camera;
                        const position = camera.position;
                        
                        // Emit player position event for NPC and Foe proximity checks
                        if (window.EventSystem) {
                            EventSystem.emit('player.position', {
                                position: { x: position.x, y: position.y, z: position.z },
                                rotation: camera.rotation.y
                            });
                        }
                    }
                } catch (e) {
                    // Don't log every frame to avoid console spam
                    console.error("Update loop error:", e);
                }
            });
            
            // Start the render loop with error handling
            state.engine.runRenderLoop(function() {
                try {
                    if (state.scene && !state.gameState.paused) {
                        state.scene.render();
                    }
                } catch (e) {
                    console.error("Error in render loop:", e);
                }
            });
            
            Logger.log("> RENDER LOOP STARTED");
            return true;
        } catch (e) {
            Logger.error(`Failed to setup render loop: ${e.message}`);
            return false;
        }
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
        changeRealm: changeRealm // Expose realm change function
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