// Main Game Loop
function initGame() {
    try {
        // Log startup
        Logger.log("> SYSTEM INITIALIZING...");
        Logger.log("> LOADING NEON GRID PROTOCOL...");
        
        // Initialize core systems
        const canvas = document.getElementById('renderCanvas');
        const engine = new BABYLON.Engine(canvas, true);
        const scene = SceneManager.create(engine);
        
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

        // Initialize subsystems
        const audioSystem = AudioSystem.create();
        GridSystem.create(scene);
        SkyboxSystem.create(scene);
        const camera = CameraManager.create(scene, canvas);
        const hands = HandsSystem.create();
        ControlSystem.setupControls(scene, camera, state, audioSystem);
        
        // Setup performance monitoring
        SceneManager.addPerformanceMonitor(engine, scene);
        
        // Main game loop
        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;
            
            // Update all systems
            MovementSystem.update(camera, state, deltaTime);
            HandsSystem.updateHands(hands, state, deltaTime);
            AudioSystem.update(state, audioSystem);
        });

        // Start the render loop
        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());

        // Log ready state
        Logger.log("> SYSTEM READY");
        Logger.log("> INITIALIZE GRID NAVIGATION...");

    } catch (error) {
        Logger.error(error.message);
    }
}

// Initialize the game
initGame();

// Add PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
            function(registration) {
                console.log('ServiceWorker registration successful');
            },
            function(err) { console.log('ServiceWorker registration failed: ', err); }
        );
    });
} 