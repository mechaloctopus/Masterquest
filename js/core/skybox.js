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
            
            // Create a procedural texture (gradient using space colors)
            const size = 512;
            const texture = new BABYLON.DynamicTexture("skyTexture", size, scene);
            const ctx = texture.getContext();
            
            // Use config values if provided, otherwise use defaults
            const topColor = CONFIG.SKYBOX && CONFIG.SKYBOX.TOP_COLOR ? CONFIG.SKYBOX.TOP_COLOR : "#000011";
            const bottomColor = CONFIG.SKYBOX && CONFIG.SKYBOX.BOTTOM_COLOR ? CONFIG.SKYBOX.BOTTOM_COLOR : "#000022";
            
            const grd = ctx.createLinearGradient(0, 0, 0, size);
            grd.addColorStop(0, topColor); // Deep space (almost black)
            grd.addColorStop(1, bottomColor); // Very dark blue
            
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            
            // Add some subtle noise for stars
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 1.5 + 0.5;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
                ctx.fill();
            }
            
            texture.update();
            
            skyboxMaterial.emissiveTexture = texture;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            
            // Add stars with twinkling effect
            const starCount = CONFIG.SKYBOX && CONFIG.SKYBOX.STAR_COUNT ? CONFIG.SKYBOX.STAR_COUNT : 2000;
            const minSize = CONFIG.SKYBOX && CONFIG.SKYBOX.STAR_SIZE_MIN ? CONFIG.SKYBOX.STAR_SIZE_MIN : 0.1;
            const maxSize = CONFIG.SKYBOX && CONFIG.SKYBOX.STAR_SIZE_MAX ? CONFIG.SKYBOX.STAR_SIZE_MAX : 0.6;
            
            // Create star materials
            const createStarMaterial = (color, scene) => {
                const mat = new BABYLON.StandardMaterial("starMat", scene);
                mat.emissiveColor = color;
                mat.disableLighting = true;
                return mat;
            };
            
            // Star color options
            const starMaterials = [
                createStarMaterial(new BABYLON.Color3(1, 1, 1), scene),       // White
                createStarMaterial(new BABYLON.Color3(0.8, 0.8, 1), scene),   // Bluish white
                createStarMaterial(new BABYLON.Color3(1, 0.8, 0.8), scene),   // Reddish
                createStarMaterial(new BABYLON.Color3(0.8, 1, 0.8), scene),   // Greenish
                createStarMaterial(new BABYLON.Color3(0, 1, 1), scene),       // Cyan
                createStarMaterial(new BABYLON.Color3(1, 0, 1), scene)        // Magenta
            ];
            
            // Create stars
            const stars = [];
            for (let i = 0; i < starCount; i++) {
                const star = BABYLON.MeshBuilder.CreateSphere("star" + i, {
                    diameter: minSize + Math.random() * (maxSize - minSize)
                }, scene);
                
                // Random position on a sphere
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 450 + Math.random() * 50;
                
                star.position.x = r * Math.sin(phi) * Math.cos(theta);
                star.position.y = r * Math.cos(phi);
                star.position.z = r * Math.sin(phi) * Math.sin(theta);
                
                // Assign random star material
                star.material = starMaterials[Math.floor(Math.random() * starMaterials.length)];
                
                // Store initial size for twinkling animation
                star.initialSize = star.scaling.x;
                
                stars.push(star);
            }
            
            // Animate star twinkling
            scene.registerBeforeRender(() => {
                stars.forEach((star, index) => {
                    const time = performance.now() * 0.001;
                    const twinkle = Math.sin(time * (0.1 + Math.random() * 0.2) + index) * 0.3 + 0.7;
                    star.scaling.x = star.scaling.y = star.scaling.z = star.initialSize * twinkle;
                });
            });
            
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
            
            return { skybox, stars };
        } catch (e) {
            Logger.error("Failed to create skybox: " + e.message);
            return null;
        }
    }
}; 