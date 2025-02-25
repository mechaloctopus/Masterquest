// Skybox System
const SkyboxSystem = {
    create: function(scene) {
        // Create a simple skybox instead of trying to load an image that doesn't exist
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000}, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/environments/stars", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        
        /* 
        // Original code using PhotoDome - uncomment if you have the image
        new BABYLON.PhotoDome("skyDome", "./assets/IMG_2579.jpeg", {
            resolution: 64,
            size: 1000,
            useDirectMapping: false
        }, scene); 
        */
    }
}; 