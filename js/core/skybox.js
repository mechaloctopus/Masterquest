// Skybox System
const SkyboxSystem = {
    create: function(scene) {
        try {
            // Create pure black skybox with minimal gradient
            const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {
                diameter: 1000,
                segments: 12
            }, scene);
            
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            
            // Use solid dark color instead of gradient to avoid any purple effect
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0.01); // Almost black with tiny blue tint
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            
            // Create stars with simple white/blue colors only
            for (let i = 0; i < 1500; i++) {
                const star = BABYLON.MeshBuilder.CreateSphere("star" + i, {
                    diameter: 0.1 + Math.random() * 0.3
                }, scene);
                
                // Random position on a sphere
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 450 + Math.random() * 50;
                
                star.position.x = r * Math.sin(phi) * Math.cos(theta);
                star.position.y = r * Math.cos(phi);
                star.position.z = r * Math.sin(phi) * Math.sin(theta);
                
                // Simple white/blue star material
                const starMaterial = new BABYLON.StandardMaterial("starMat" + i, scene);
                
                // Mostly white stars with slight blue tint
                const blueAmount = Math.random() * 0.3;
                starMaterial.emissiveColor = new BABYLON.Color3(1-blueAmount, 1-blueAmount, 1);
                starMaterial.disableLighting = true;
                star.material = starMaterial;
            }
            
            // Add ambient light to make grid more visible
            const hemisphericLight = new BABYLON.HemisphericLight(
                "light", 
                new BABYLON.Vector3(0, 1, 0), 
                scene
            );
            hemisphericLight.intensity = 0.3;
            hemisphericLight.groundColor = new BABYLON.Color3(0, 0.2, 0.4);
            
            // Add glow layer for stars and grid
            const glowLayer = new BABYLON.GlowLayer("starGlow", scene);
            glowLayer.intensity = 1.0;
            
            return { skybox, stars: [] };
        } catch (e) {
            Logger.error("Failed to create skybox: " + e.message);
            return null;
        }
    }
}; 