window.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Enable physics
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // Grid Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    ground.material = new BABYLON.GridMaterial("groundMaterial", scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene
    );

    // FPS Player (Camera)
    const player = new BABYLON.UniversalCamera("player", new BABYLON.Vector3(0, 2, 0), scene);
    player.attachControl(canvas, true);
    player.applyGravity = true;
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    player.speed = 0.2;
    scene.activeCamera = player;

    // Add Walls for Reference
    const createWall = (x, z) => {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { height: 3, width: 10, depth: 1 }, scene);
        wall.position.set(x, 1.5, z);
        wall.material = new BABYLON.StandardMaterial("wallMat", scene);
        wall.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
        return wall;
    };
    createWall(0, 5);
    createWall(0, -5);
    createWall(5, 0);
    createWall(-5, 0);

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
        moveX = dx / 50;
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

    console.log("Game loaded successfully!");
});
