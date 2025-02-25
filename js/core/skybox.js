// Skybox System
const SkyboxSystem = {
    create: function(scene) {
        new BABYLON.PhotoDome("skyDome", "IMG_2579.jpeg", {
            resolution: 64,
            size: 1000,
            useDirectMapping: false
        }, scene);
    }
}; 