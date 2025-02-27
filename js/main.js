// Main Game Loop
function initGame() {
    try {
        // Log startup
        Logger.log("> SYSTEM INITIALIZING...");
        Logger.log("> LOADING NEON GRID PROTOCOL...");
        
        // Initialize core systems
        const canvas = document.getElementById('renderCanvas');
        if (!canvas) {
            throw new Error("Canvas element not found! Cannot initialize game.");
        }
        
        const engine = new BABYLON.Engine(canvas, true);
        
        // Add some error handling for the engine initialization
        engine.onError = function(e) {
            Logger.error("Engine error: " + e.message);
        };
        
        const scene = SceneManager.create(engine);
        if (!scene) {
            throw new Error("Failed to create scene");
        }
        
        // Initialize game state
        const state = {
            moveVector: new BABYLON.Vector3(0, 0, 0),
            jumpForce: 0,
            bobTime: 0,
            grounded: true,
            smoothedMovementIntensity: 0,
            striking: false,
            strikeProgress: 0
        };

        // Initialize subsystems one by one with error handling
        let audioSystem, camera, hands;
        
        try {
            // Update grid colors to neon green
            GridSystem.create(scene);
            Logger.log("> NEON GREEN GRID INITIALIZED");
        } catch (e) {
            Logger.error("Grid initialization failed: " + e.message);
        }
        
        try {
            // Initialize fireworks
            FireworksSystem.init();
            Logger.log("> BIRTHDAY FIREWORKS ACTIVATED");
        } catch (e) {
            Logger.error("Fireworks initialization failed: " + e.message);
        }
        
        try {
            // Change skybox colors to vaporwave theme
            // Override skybox color to vaporwave gradient
            SkyboxSystem.create(scene);
            Logger.log("> VAPORWAVE SKYBOX INITIALIZED");
        } catch (e) {
            Logger.error("Skybox initialization failed: " + e.message);
        }
        
        try {
            camera = CameraManager.create(scene, canvas);
            Logger.log("> CAMERA INITIALIZED");
        } catch (e) {
            Logger.error("Camera initialization failed: " + e.message);
            // Create fallback camera
            camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), scene);
        }
        
        try {
            hands = HandsSystem.create(scene, camera);
            Logger.log("> HANDS SYSTEM INITIALIZED");
        } catch (e) {
            Logger.error("Hands initialization failed: " + e.message);
            hands = null;
        }
        
        try {
            audioSystem = AudioSystem.create();
            Logger.log("> AUDIO SYSTEM INITIALIZED");
        } catch (e) {
            Logger.error("Audio initialization failed: " + e.message);
            // Create dummy audio system
            audioSystem = {
                sfx: { footsteps: {}, jump: {}, strike: {} },
                isWalking: false
            };
        }
        
        try {
            ControlSystem.setupControls(scene, camera, state, audioSystem);
            Logger.log("> CONTROLS INITIALIZED");
        } catch (e) {
            Logger.error("Controls initialization failed: " + e.message);
        }
        
        // Setup performance monitoring
        try {
            SceneManager.addPerformanceMonitor(engine, scene);
        } catch (e) {
            Logger.error("Performance monitor initialization failed: " + e.message);
        }
        
        // Main game loop
        scene.registerBeforeRender(() => {
            try {
                const deltaTime = engine.getDeltaTime() / 1000;
                
                // Update systems
                MovementSystem.update(camera, state, deltaTime);
                AudioSystem.update(state, audioSystem);
                HandsSystem.updateHands(hands, state, deltaTime);
                
                // Update animation time for other possible uses
                state.bobTime += deltaTime;
            } catch (e) {
                // Don't log every frame to avoid console spam
                console.error("Update loop error:", e);
            }
        });

        // Start the render loop
        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());

        // Log ready state
        Logger.log("> SYSTEM READY");
        Logger.log("> INITIALIZE GRID NAVIGATION...");

        try {
            // Initialize 3D birthday text (try both methods)
            let birthdayText = BirthdayTextSystem.create(scene);
            if (!birthdayText) {
                // Fallback to primitive version if CreateText is not available
                birthdayText = BirthdayTextSystem.createWithPrimitives(scene);
            }
            Logger.log("> 3D BIRTHDAY MESSAGE INITIALIZED");
        } catch (e) {
            Logger.error("Birthday text initialization failed: " + e.message);
        }

    } catch (error) {
        Logger.error(error.message);
        // Try to recover with a basic scene
        try {
            const canvas = document.getElementById('renderCanvas');
            const engine = new BABYLON.Engine(canvas, true);
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            
            // Basic grid
            for(let i = -20; i <= 20; i += 2) {
                BABYLON.MeshBuilder.CreateLines("grid", {
                    points: [
                        new BABYLON.Vector3(i, 0, -20),
                        new BABYLON.Vector3(i, 0, 20)
                    ]
                }, scene).color = new BABYLON.Color3(0.5, 0, 1);
                
                BABYLON.MeshBuilder.CreateLines("grid", {
                    points: [
                        new BABYLON.Vector3(-20, 0, i),
                        new BABYLON.Vector3(20, 0, i)
                    ]
                }, scene).color = new BABYLON.Color3(0.5, 0, 1);
            }
            
            // Basic camera
            const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), scene);
            camera.attachControl(canvas, true);
            
            engine.runRenderLoop(() => scene.render());
            Logger.log("> EMERGENCY FALLBACK MODE ACTIVATED");
        } catch (fallbackError) {
            Logger.error("Emergency fallback also failed: " + fallbackError.message);
        }
    }
}

// Initialize the game
initGame();

// Add PWA support
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