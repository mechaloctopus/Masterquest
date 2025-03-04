// Camera Management
const CameraManager = {
    create: function(scene, canvas) {
        const camera = new BABYLON.UniversalCamera(
            "camera", 
            new BABYLON.Vector3(
                CONFIG.CAMERA.START_POSITION.x,
                CONFIG.CAMERA.START_POSITION.y,
                CONFIG.CAMERA.START_POSITION.z
            ), 
            scene
        );
        
        // Set initial rotation (facing south by default)
        if (CONFIG.CAMERA.START_ROTATION) {
            camera.rotation = new BABYLON.Vector3(
                CONFIG.CAMERA.START_ROTATION.x || 0,
                CONFIG.CAMERA.START_ROTATION.y || 0,
                CONFIG.CAMERA.START_ROTATION.z || 0
            );
        }
        
        camera.attachControl(canvas, true);
        camera.speed = CONFIG.CAMERA.SPEED;
        
        return camera;
    }
}; 