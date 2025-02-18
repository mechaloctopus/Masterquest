window.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Enable physics engine
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Create a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene
    );

    // FPS Camera
    const player = new BABYLON.UniversalCamera("player", new BABYLON.Vector3(0, 2, 0), scene);
    player.attachControl(canvas, true);
    player.applyGravity = true;
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(1, 1, 1); // Player collision box
    scene.activeCamera = player;

    // Movement Variables
    let moveX = 0, moveZ = 0;
    const moveSpeed = 0.2;
    let isJumping = false;

    // Joystick Movement
    const joystick = document.getElementById("joystickContainer");
    let joystickActive = false;
    let startX, startY;

    joystick.addEventListener("touchstart", (event) => {
        joystickActive = true;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    });

    joystick.addEventListener("touchmove", (event) => {
        if (!joystickActive) return;
        const dx = event.touches[0].clientX - startX;
        const dy = event.touches[0].clientY - startY;
        moveX = dx / 50; // Normalize values
        moveZ = dy / 50;
    });

    joystick.addEventListener("touchend", () => {
        joystickActive = false;
        moveX = 0;
        moveZ = 0;
    });

    // Swipe Look Controls
    let lastTouchX = null;
    let lastTouchY = null;

    canvas.addEventListener("touchstart", (event) => {
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
    });

    canvas.addEventListener("touchmove", (event) => {
        if (lastTouchX === null || lastTouchY === null) return;

        const deltaX = event.touches[0].clientX - lastTouchX;
        const deltaY = event.touches[0].clientY - lastTouchY;

        player.rotation.y -= deltaX * 0.002;
        player.rotation.x -= deltaY * 0.002;

        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
    });

    // Jump Button
    const jumpButton = document.getElementById("jumpButton");
    jumpButton.addEventListener("touchstart", () => {
        if (!isJumping) {
            player.position.y += 2;
            isJumping = true;
            setTimeout(() => (isJumping = false), 500);
        }
    });

    // Game Loop
    engine.runRenderLoop(() => {
        player.position.x += moveX * moveSpeed;
        player.position.z += moveZ * moveSpeed;
        scene.render();
    });

    // Resize Handling
    window.addEventListener("resize", () => {
        engine.resize();
    });
});
