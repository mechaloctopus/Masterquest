// Skybox System
const SkyboxSystem = {
    create: function(scene) {
        try {
            // Create a simpler color-based skybox using a large sphere
            const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {
                diameter: 1000,
                segments: 12
            }, scene);
            
            // Create a gradient material for the skybox
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
            skyboxMaterial.backFaceCulling = false; // Show the inside of the sphere
            skyboxMaterial.disableLighting = true;
            
            // Create a procedural texture (gradient from black to purple)
            const size = 512;
            const texture = new BABYLON.DynamicTexture("skyTexture", size, scene);
            const ctx = texture.getContext();
            
            const grd = ctx.createLinearGradient(0, 0, 0, size);
            grd.addColorStop(0, "#000000"); // Black at top
            grd.addColorStop(1, "#1a0033"); // Deep purple at bottom
            
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            texture.update();
            
            skyboxMaterial.emissiveTexture = texture;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            
            // Add some stars
            for (let i = 0; i < 1000; i++) {
                const star = BABYLON.MeshBuilder.CreateSphere("star" + i, {
                    diameter: 0.1 + Math.random() * 0.5
                }, scene);
                
                // Random position on a sphere
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 450 + Math.random() * 50;
                
                star.position.x = r * Math.sin(phi) * Math.cos(theta);
                star.position.y = r * Math.cos(phi);
                star.position.z = r * Math.sin(phi) * Math.sin(theta);
                
                // Create glowing material
                const starMaterial = new BABYLON.StandardMaterial("starMat" + i, scene);
                starMaterial.emissiveColor = new BABYLON.Color3(
                    0.8 + Math.random() * 0.2,
                    0.8 + Math.random() * 0.2,
                    0.8 + Math.random() * 0.2
                );
                starMaterial.disableLighting = true;
                star.material = starMaterial;
            }
        } catch (e) {
            Logger.error("Failed to create skybox: " + e.message);
        }
    }
}; 