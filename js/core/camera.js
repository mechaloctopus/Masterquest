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
        
        camera.attachControl(canvas, true);
        camera.speed = CONFIG.CAMERA.SPEED;
        
        return camera;
    }
}; 