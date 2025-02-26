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
            
            // Create a procedural texture (gradient using vaporwave colors)
            const size = 512;
            const texture = new BABYLON.DynamicTexture("skyTexture", size, scene);
            const ctx = texture.getContext();
            
            // Use config values if provided, otherwise use defaults
            const topColor = CONFIG.SKYBOX && CONFIG.SKYBOX.TOP_COLOR ? CONFIG.SKYBOX.TOP_COLOR : "#000033";
            const bottomColor = CONFIG.SKYBOX && CONFIG.SKYBOX.BOTTOM_COLOR ? CONFIG.SKYBOX.BOTTOM_COLOR : "#1a0033";
            
            const grd = ctx.createLinearGradient(0, 0, 0, size);
            grd.addColorStop(0, topColor); // Top color (deep blue for vaporwave)
            grd.addColorStop(1, bottomColor); // Bottom color (vaporwave pink/purple)
            
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            texture.update();
            
            skyboxMaterial.emissiveTexture = texture;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            
            // Add some stars with vaporwave colors
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
                
                // Create glowing material with vaporwave colors
                const starMaterial = new BABYLON.StandardMaterial("starMat" + i, scene);
                
                // Choose a color from the vaporwave palette
                const colorChoice = Math.random();
                if (colorChoice < 0.3) {
                    // Cyan
                    starMaterial.emissiveColor = new BABYLON.Color3(0, 0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.2);
                } else if (colorChoice < 0.6) {
                    // Pink/purple
                    starMaterial.emissiveColor = new BABYLON.Color3(0.8 + Math.random() * 0.2, 0, 0.8 + Math.random() * 0.2);
                } else {
                    // White/blue
                    starMaterial.emissiveColor = new BABYLON.Color3(
                        0.7 + Math.random() * 0.3,
                        0.7 + Math.random() * 0.3,
                        0.9 + Math.random() * 0.1
                    );
                }
                
                starMaterial.disableLighting = true;
                star.material = starMaterial;
            }
        } catch (e) {
            Logger.error("Failed to create skybox: " + e.message);
        }
    }
}; 