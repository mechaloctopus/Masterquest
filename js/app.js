// Application Entry Point
const App = (function() {
    // Constants
    const FORCE_LOAD_TIMEOUT = 8000; // 8 seconds max loading time
    const FALLBACK_LOAD_TIMEOUT = 2000; // 2 seconds for fallback loading screen
    const COORDINATE_SHOW_DELAY = 500; // Delay for coordinate system display
    const MAP_LOG_FREQUENCY = 0.01; // Frequency for position logging (was 0.05)
    const REALM_CONFIG_PREFIX = 'REALM_';
    
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
            
            state.engine = new BABYLON.Engine(canvas, true, { 
                stencil: true,
                antialias: true,
                adaptToDeviceRatio: true
            });
            
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
            
            // Final message for navigation
            setTimeout(() => {
                Logger.log("> INITIALIZE GRID NAVIGATION...");
                if (state.systems.coordinates) {
                    Logger.log("> COORDINATE SYSTEM ACTIVE");
                    Logger.log("> GRID COORDINATES DISPLAYED");
                }
            }, 1000);
            
            // Initialize radio player if available
            initializeRadioPlayer();
            
            // Cleanup test components
            cleanupTestComponents();
            
        } catch (error) {
            Logger.error(error.message);
            activateEmergencyFallback();
        }
    }
    
    // Initialize radio player
    function initializeRadioPlayer() {
        try {
            if (window.RadioPlayerSystem) {
                // RadioPlayerSystem will self-initialize on DOM ready
                Logger.log("> RADIO PLAYER INITIALIZED");
                state.systems.radioPlayer = true;
            }
        } catch (e) {
            Logger.error(`Radio player reference failed: ${e.message}`);
        }
    }
    
    // Cleanup any test components
    function cleanupTestComponents() {
        const testBtn = document.getElementById('testCoordButton');
        if (testBtn) {
            testBtn.parentNode.removeChild(testBtn);
            Logger.log("> TEST COORDINATES BUTTON REMOVED");
        }
    }
    
    // Initialize all systems in order
    function initializeAllSystems() {
        try {
            // Initialize core systems
            initializeCoreSystems();
            
            // Initialize UI systems
            initializeUISystems();
            
            // Initialize entity system
            initializeEntitySystem();
            
            // Set up asset loading
            setupAssetLoading();
            
            // Set up system event listeners
            setupEventListeners();
            
            // Now explicitly initialize the current realm
            console.log("About to initialize current realm...");
            initializeCurrentRealm();
            console.log("Current realm initialization complete");
            
            return true;
        } catch (e) {
            Logger.error(`System initialization failed: ${e.message}`);
            console.error("Critical error in initializeAllSystems:", e);
            activateEmergencyFallback();
            return false;
        }
    }
    
    // Initialize core systems (grid, skybox, camera, audio)
    function initializeCoreSystems() {
        // Initialize loader first if available
        if (window.LoaderSystem) {
            LoaderSystem.initialize(state.scene);
            Logger.log("> ASSET LOADER INITIALIZED");
            state.systems.loader = true;
        }
        
        // Initialize grid
        initializeGridSystem();
        
        // Initialize skybox
        initializeSkyboxSystem();
        
        // Initialize camera
        initializeCameraSystem();
        
        // Initialize audio
        initializeAudioSystem();
        
        // Initialize hands
        initializeHandsSystem();
        
        // Initialize controls - CRITICAL for joysticks and buttons
        initializeControlSystem();
        
        // Initialize collision system
        initializeCollisionSystem();
        
        // Setup performance monitoring
        initializePerformanceMonitoring();
    }
    
    // Initialize grid system
    function initializeGridSystem() {
        try {
            GridSystem.create(state.scene);
            Logger.log("> NEON GREEN GRID INITIALIZED");
            state.systems.grid = true;
        } catch (e) {
            Logger.error(`Grid initialization failed: ${e.message}`);
        }
    }
    
    // Initialize skybox system
    function initializeSkyboxSystem() {
        try {
            SkyboxSystem.create(state.scene);
            Logger.log("> VAPORWAVE SKYBOX INITIALIZED");
            state.systems.skybox = true;
        } catch (e) {
            Logger.error(`Skybox initialization failed: ${e.message}`);
        }
    }
    
    // Initialize camera system
    function initializeCameraSystem() {
        try {
            const canvas = document.getElementById('renderCanvas');
            state.systems.camera = CameraManager.create(state.scene, canvas);
            Logger.log("> CAMERA INITIALIZED");
        } catch (e) {
            Logger.error(`Camera initialization failed: ${e.message}`);
            // Create fallback camera
            state.systems.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), state.scene);
        }
    }
    
    // Initialize audio system
    function initializeAudioSystem() {
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
    }
    
    // Initialize hands system
    function initializeHandsSystem() {
        try {
            state.systems.hands = HandsSystem.create(state.scene, state.systems.camera);
            Logger.log("> HANDS SYSTEM INITIALIZED");
        } catch (e) {
            Logger.error(`Hands initialization failed: ${e.message}`);
            state.systems.hands = null;
        }
    }
    
    // Initialize control system
    function initializeControlSystem() {
        try {
            ControlSystem.setupControls(state.scene, state.systems.camera, state.gameState, state.systems.audio);
            Logger.log("> CONTROLS INITIALIZED");
            state.systems.controls = true;
        } catch (e) {
            Logger.error(`Controls initialization failed: ${e.message}`);
        }
    }
    
    // Initialize collision system
    function initializeCollisionSystem() {
        try {
            if (window.CollisionSystem) {
                // Initialize with scene and camera
                const success = CollisionSystem.init(state.scene, state.systems.camera);
                
                if (success) {
                    Logger.log("> COLLISION SYSTEM INITIALIZED");
                    state.systems.collision = true;
                } else {
                    Logger.error("> COLLISION SYSTEM INIT FAILED");
                }
            } else {
                Logger.error("> COLLISION SYSTEM NOT FOUND");
            }
        } catch (e) {
            Logger.error(`Collision system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize performance monitoring
    function initializePerformanceMonitoring() {
        try {
            SceneManager.addPerformanceMonitor(state.engine, state.scene);
            state.systems.performance = true;
        } catch (e) {
            Logger.error(`Performance monitor initialization failed: ${e.message}`);
        }
    }
    
    // Initialize UI systems (health, map, coordinates, inventory, dialogue)
    function initializeUISystems() {
        // Initialize health system
        initializeHealthSystem();
        
        // Initialize map system
        initializeMapSystem();
        
        // Initialize coordinate display system
        initializeCoordinateSystem();
        
        // Initialize inventory system
        initializeInventorySystem();
        
        // Initialize dialogue system
        initializeDialogueSystem();
    }
    
    // Initialize health system
    function initializeHealthSystem() {
        try {
            if (window.HealthBarSystem) {
                HealthBarSystem.init();
                HealthBarSystem.setHealth(state.gameState.health, state.gameState.maxHealth);
                state.systems.health = true;
            }
        } catch (e) {
            Logger.error(`Health system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize map system
    function initializeMapSystem() {
        try {
            if (window.MapSystem) {
                MapSystem.init();
                Logger.log("> MAP SYSTEM INITIALIZED");
                state.systems.map = true;
            }
        } catch (e) {
            Logger.error(`Map system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize coordinate system
    function initializeCoordinateSystem() {
        try {
            console.log("Initializing coordinate display system...");
            if (typeof window.CoordinateSystem !== 'undefined') {
                if (CoordinateSystem.init()) {
                    Logger.log("> COORDINATE SYSTEM INITIALIZED");
                    state.systems.coordinates = true;
                    
                    // Make sure it's shown
                    setTimeout(() => {
                        CoordinateSystem.show();
                        console.log("Coordinate system display shown after timeout");
                    }, COORDINATE_SHOW_DELAY);
                }
            } else {
                console.error("CoordinateSystem is not defined globally");
                Logger.error("> COORDINATE SYSTEM NOT FOUND");
            }
        } catch (e) {
            console.error("Coordinate system initialization failed:", e);
            Logger.error(`Coordinate system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize inventory system
    function initializeInventorySystem() {
        try {
            if (window.InventorySystem) {
                InventorySystem.init();
                state.systems.inventory = true;
            }
        } catch (e) {
            Logger.error(`Inventory system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize dialogue system
    function initializeDialogueSystem() {
        try {
            if (window.DialogueSystem) {
                DialogueSystem.init();
                Logger.log("> DIALOGUE SYSTEM INITIALIZED");
                state.systems.dialogue = true;
            }
        } catch (e) {
            Logger.error(`Dialogue system initialization failed: ${e.message}`);
        }
    }
    
    // Initialize entity system
    function initializeEntitySystem() {
        console.log("Initializing Entity system, checking window.EntitySystem:", typeof window.EntitySystem);
        if (typeof window.EntitySystem !== 'undefined') {
            EntitySystem.init(state.scene);
            Logger.log("> ENTITY SYSTEM INITIALIZED");
            state.systems.entity = true;
        } else {
            console.error("EntitySystem is not defined globally");
            Logger.error("> ENTITY SYSTEM NOT FOUND");
        }
    }
    
    // Setup asset loading
    function setupAssetLoading() {
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
            }, FORCE_LOAD_TIMEOUT);
        } else {
            // If no loader is available, emit loader complete immediately
            if (window.EventSystem) {
                console.log("No loader system available, emitting completion immediately");
                setTimeout(() => {
                    EventSystem.emit('loader.complete', { 
                        forced: true,
                        message: "Loading completed (no loader available)"
                    });
                }, FALLBACK_LOAD_TIMEOUT);
            }
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
            const realmConfig = CONFIG.REALMS[`${REALM_CONFIG_PREFIX}${realmIndex}`];
            
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
            
            Logger.log(`> CREATING SCENE OBJECTS`);
            
            // Initialize entities for current realm
            loadEntitiesForCurrentRealm(realmIndex);
            
            Logger.log(`> REALM ${realmConfig.NAME} INITIALIZATION COMPLETE`);
        } catch (e) {
            Logger.error(`Realm initialization failed: ${e.message}`);
            console.error("Error initializing realm:", e);
        }
    }
    
    // Load entities for current realm
    function loadEntitiesForCurrentRealm(realmIndex) {
        console.log("Checking for Entity System:", typeof window.EntitySystem);
        if (typeof window.EntitySystem !== 'undefined') {
            console.log("Found EntitySystem, initializing...");
            EntitySystem.loadEntitiesForRealm(realmIndex);
            Logger.log(`> REALM ${realmIndex} ENTITIES LOADED`);
        } else {
            console.error("EntitySystem not available globally");
            Logger.error("> ENTITIES NOT LOADED: SYSTEM UNAVAILABLE");
        }
    }
    
    // Setup event listeners for system events
    function setupEventListeners() {
        // Listen for map position updates
        setupMapPositionUpdates();
        
        // Listen for health changes
        setupHealthListeners();
        
        // Listen for inventory events
        setupInventoryListeners();
        
        // Listen for realm-specific events
        setupRealmListeners();
    }
    
    // Setup map position updates
    function setupMapPositionUpdates() {
        if (window.EventSystem && state.systems.map) {
            // Update map with player position
            state.scene.registerBeforeRender(() => {
                if (state.systems.camera) {
                    const camera = state.systems.camera;
                    const position = camera.position;
                    const rotation = camera.rotation.y;
                    
                    // Update map with player position
                    MapSystem.updatePlayerPosition({ x: position.x, z: position.z }, rotation);
                    
                    // Add debug logging to verify position updates are being sent properly
                    if (Math.random() < MAP_LOG_FREQUENCY) { // Log occasionally (reduced frequency)
                        console.warn("[APP] Sent position to map:", position.x.toFixed(2), position.z.toFixed(2), "rotation:", rotation.toFixed(2));
                    }
                    
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
    }
    
    // Setup health listeners
    function setupHealthListeners() {
        if (window.EventSystem && state.systems.health) {
            EventSystem.on('health.changed', (data) => {
                // Handle health changes, possibly update UI or game state
                state.gameState.health = data.current;
                state.gameState.maxHealth = data.max;
            });
        }
    }
    
    // Setup inventory listeners
    function setupInventoryListeners() {
        if (!window.EventSystem || !state.systems.inventory) return;
        
        // Item selection
        EventSystem.on('inventory.itemSelected', (data) => {
            // Handle item selection
            console.log(`Selected item: ${data.item.name}`);
            
            // Check for health potion
            if (data.item && data.item.id === 'health_potion') {
                useHealthPotion();
            }
        });
        
        // Item added
        EventSystem.on('inventory.itemAdded', (data) => {
            console.log(`Added item: ${data.item.name}`);
        });
        
        // Item removed
        EventSystem.on('inventory.itemRemoved', (data) => {
            console.log(`Removed item with ID: ${data.id}`);
        });
        
        // Game pause/resume from inventory
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
    
    // Setup realm listeners
    function setupRealmListeners() {
        if (!window.EventSystem) return;
        
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
        Logger.log(`Initiating interaction with NPC: ${npcId}`);
        
        // Use EntitySystem to start interaction with this NPC
        if (window.EntitySystem) {
            EntitySystem.startInteraction(npcId);
        } else {
            Logger.error("> NPC INTERACTION FAILED: ENTITY SYSTEM NOT FOUND");
        }
    }
    
    // Handle foe/quiz interaction
    function handleFoeInteraction(foeId) {
        Logger.log(`Initiating battle with foe: ${foeId}`);
        
        // Use EntitySystem to start battle with this foe
        if (window.EntitySystem) {
            EntitySystem.startBattle(foeId);
        } else {
            Logger.error("> FOE BATTLE FAILED: ENTITY SYSTEM NOT FOUND");
        }
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
                    updateGameState(deltaTime);
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
    
    // Update game state
    function updateGameState(deltaTime) {
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
        updatePlayerPositionForEntities();
    }
    
    // Update player position for entities
    function updatePlayerPositionForEntities() {
        // Always try to get the camera, even if state.systems.camera might be null
        const camera = state.systems.camera;
        
        if (!camera) {
            console.error("Camera not available for position updates");
            return;
        }
        
        // We now use the scene render observer in the collision system
        // instead of relying on the EventSystem for player position updates.
        // This function is kept for backward compatibility with other systems.
        
        // Only emit the event if EventSystem is available
        if (window.EventSystem) {
            const position = camera.position;
            // Emit player position event for any systems that might be listening
            EventSystem.emit('player.position', {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: camera.rotation.y
            });
        }
    }
    
    // Example function to damage the player (for testing)
    function damagePlayer(amount) {
        if (!state.systems.health) return;
        
        HealthBarSystem.damage(amount);
        
        // Shake the camera to indicate damage
        if (state.systems.camera) {
            shakeCamera(0.5, 0.05);
        }
    }
    
    // Shake the camera
    function shakeCamera(duration, intensity) {
        const camera = state.systems.camera;
        const originalPosition = camera.position.clone();
        
        let shakeTime = 0;
        
        // Create a shake animation
        const shakeInterval = setInterval(() => {
            shakeTime += 0.05;
            
            if (shakeTime >= duration) {
                clearInterval(shakeInterval);
                camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
                return;
            }
            
            // Random offset
            const offsetX = (Math.random() - 0.5) * intensity;
            const offsetY = (Math.random() - 0.5) * intensity;
            
            camera.position.x = originalPosition.x + offsetX;
            camera.position.y = originalPosition.y + offsetY;
        }, 50);
    }

    // Emergency fallback mode
    function activateEmergencyFallback() {
        try {
            const canvas = document.getElementById('renderCanvas');
            state.engine = new BABYLON.Engine(canvas, true);
            state.scene = new BABYLON.Scene(state.engine);
            state.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            
            // Basic grid
            createFallbackGrid();
            
            // Basic camera
            state.systems.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), state.scene);
            state.systems.camera.attachControl(canvas, true);
            
            state.engine.runRenderLoop(() => state.scene.render());
            Logger.log("> EMERGENCY FALLBACK MODE ACTIVATED");
        } catch (fallbackError) {
            Logger.error("Emergency fallback also failed: " + fallbackError.message);
        }
    }
    
    // Create fallback grid
    function createFallbackGrid() {
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
    }

    // PWA support - placeholder for future implementation
    function setupServiceWorker() {
        // Service worker support will be implemented in the future
        console.log("Service worker setup placeholder - not implemented yet");
    }

    // Initialize UI components
    function initializeUI() {
        // Position console
        const log = document.getElementById('log');
        if (log) {
            log.style.position = 'absolute';
            log.style.top = '20px';
            log.style.left = '20px';
            log.style.width = '300px';
            log.style.maxWidth = '300px';
        }
        
        // Remove any pause buttons
        const pauseButtons = document.querySelectorAll('.pause-button');
        pauseButtons.forEach(btn => {
            if (btn && btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        });
        
        console.log("UI Components initialized and positioned");
    }

    // Public API
    return {
        init: init,
        setupServiceWorker: setupServiceWorker,
        getState: () => ({ ...state }), // Return a copy of state for debugging
        damage: damagePlayer, // Expose damage function for testing
        changeRealm: changeRealm, // Expose realm change function
        initializeUI: initializeUI
    };
})();

// Run once DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    App.initializeUI();
    
    // Continue with regular initialization
    App.init();
    App.setupServiceWorker();
    
    // Add a global test function
    window.testDamage = function(amount = 10) {
        App.damage(amount);
    };
}); 