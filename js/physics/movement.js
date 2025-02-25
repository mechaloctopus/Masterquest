// Movement & Physics System
const MovementSystem = {
    update: function(camera, state, deltaTime) {
        // Apply movement based on input vector
        if (state.moveVector) {
            const forward = camera.getDirection(BABYLON.Vector3.Forward())
                                .scale(state.moveVector.z * 0.1);
            const right = camera.getDirection(BABYLON.Vector3.Right())
                                .scale(state.moveVector.x * 0.1);
            camera.position.addInPlace(forward.add(right));
        }
        
        // Jump physics
        camera.position.y += state.jumpForce;
        state.jumpForce += CONFIG.PHYSICS.GRAVITY;
        
        if (camera.position.y <= CONFIG.CAMERA.GROUND_Y) {
            camera.position.y = CONFIG.CAMERA.GROUND_Y;
            state.jumpForce = 0;
            state.grounded = true;
        }
    }
}; 