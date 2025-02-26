// Birthday Text System
const BirthdayTextSystem = {
    create: function(scene) {
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE");
            
            // Create parent container for text
            const textParent = new BABYLON.TransformNode("birthdayParent", scene);
            textParent.position = new BABYLON.Vector3(0, 4, -10);
            textParent.rotation.y = Math.PI;
            
            // Create text planes
            const createTextPlane = (text, color, yPosition, scale, scene) => {
                // Create dynamic texture - make it large enough for good resolution
                const textSize = text.length * 100;
                const textTexture = new BABYLON.DynamicTexture("textTexture_" + text, {
                    width: textSize, 
                    height: 200
                }, scene);
                
                // Get the context to draw on
                const ctx = textTexture.getContext();
                
                // Clear the context
                ctx.clearRect(0, 0, textSize, 200);
                
                // Create synthwave gradient for text
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                
                // Use different color schemes based on input color
                if (color === "cyan") {
                    gradient.addColorStop(0, "#00FFFF"); // Cyan
                    gradient.addColorStop(0.5, "#0099FF"); // Light blue
                    gradient.addColorStop(1, "#0066FF"); // Darker blue
                } else {
                    gradient.addColorStop(0, "#FF69B4"); // Hot pink
                    gradient.addColorStop(0.5, "#FF00FF"); // Magenta
                    gradient.addColorStop(1, "#9400D3"); // Purple
                }
                
                // Draw text with gradient and glow
                ctx.fillStyle = "#000000"; // Black background
                ctx.fillRect(0, 0, textSize, 200);
                
                // Draw glowing outline
                ctx.font = "bold 110px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = color === "cyan" ? "#00FFFF" : "#FF00FF";
                ctx.shadowBlur = 15;
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 8;
                ctx.strokeText(text, textSize / 2, 100);
                
                // Draw text with gradient
                ctx.fillStyle = gradient;
                ctx.fillText(text, textSize / 2, 100);
                
                // Draw grid lines for synthwave effect
                ctx.strokeStyle = "#444444";
                ctx.lineWidth = 1;
                for (let i = 0; i < 10; i++) {
                    const y = i * 20;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(textSize, y);
                    ctx.stroke();
                }
                
                // Update the texture
                textTexture.update();
                
                // Create a plane for the text
                const plane = BABYLON.MeshBuilder.CreatePlane("plane_" + text, {
                    width: text.length * scale,
                    height: 2 * scale
                }, scene);
                
                // Create material and apply texture
                const material = new BABYLON.StandardMaterial("textMat_" + text, scene);
                material.diffuseTexture = textTexture;
                material.emissiveTexture = textTexture;
                material.specularColor = new BABYLON.Color3(0, 0, 0);
                material.backFaceCulling = false;
                material.useAlphaFromDiffuseTexture = true;
                
                // Apply material and position
                plane.material = material;
                plane.position.y = yPosition;
                plane.parent = textParent;
                
                return plane;
            };
            
            // Create the three text lines
            const happyText = createTextPlane("HAPPY", "cyan", 2, 0.6, scene);
            const birthdayText = createTextPlane("BIRTHDAY", "cyan", 0, 0.6, scene);
            const marcusText = createTextPlane("MARCUS!", "pink", -2.5, 0.9, scene);
            
            // Add glow layer
            const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
            glowLayer.intensity = 1.5;
            
            // Animation
            scene.registerBeforeRender(() => {
                const time = performance.now() * 0.001;
                textParent.position.y = 4 + Math.sin(time * 0.5) * 0.5;
                textParent.rotation.y = Math.sin(time * 0.2) * 0.2;
            });
            
            Logger.log("> 3D BIRTHDAY TEXT CREATED SUCCESSFULLY");
            return textParent;
        } catch (e) {
            Logger.error("Failed to create 3D birthday text: " + e.message);
            
            // FALLBACK: If the above fails, use simple colored boxes
            try {
                Logger.log("> USING FALLBACK BIRTHDAY TEXT");
                
                // Create parent container
                const textParent = new BABYLON.TransformNode("birthdayParent", scene);
                textParent.position = new BABYLON.Vector3(0, 4, -15);
                
                // Create materials
                const cyanMaterial = new BABYLON.StandardMaterial("cyanMat", scene);
                cyanMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 0.8);
                cyanMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1);
                
                const pinkMaterial = new BABYLON.StandardMaterial("pinkMat", scene);
                pinkMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.8);
                pinkMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 1);
                
                // HAPPY
                const happyText = BABYLON.MeshBuilder.CreateText(
                    "happy", 
                    "HAPPY", 
                    { size: 2, depth: 0.2 }, 
                    scene
                ) || createSimpleBox(5, 1, 0.2, scene);
                
                happyText.material = cyanMaterial;
                happyText.position.y = 2;
                happyText.parent = textParent;
                
                // BIRTHDAY
                const birthdayText = BABYLON.MeshBuilder.CreateText(
                    "birthday", 
                    "BIRTHDAY", 
                    { size: 2, depth: 0.2 }, 
                    scene
                ) || createSimpleBox(8, 1, 0.2, scene);
                
                birthdayText.material = cyanMaterial;
                birthdayText.position.y = 0;
                birthdayText.parent = textParent;
                
                // MARCUS!
                const marcusText = BABYLON.MeshBuilder.CreateText(
                    "marcus", 
                    "MARCUS!", 
                    { size: 3, depth: 0.2 }, 
                    scene
                ) || createSimpleBox(7, 1.5, 0.2, scene);
                
                marcusText.material = pinkMaterial;
                marcusText.position.y = -2.5;
                marcusText.parent = textParent;
                
                // Add glow effect
                const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
                glowLayer.intensity = 1.5;
                
                // Animation
                scene.registerBeforeRender(() => {
                    const time = performance.now() * 0.001;
                    textParent.position.y = 4 + Math.sin(time * 0.5) * 0.5;
                    textParent.rotation.y = Math.sin(time * 0.2) * 0.2;
                });
                
                return textParent;
            } catch (fallbackError) {
                Logger.error("Even fallback birthday text failed: " + fallbackError.message);
                return null;
            }
        }
    }
};

// Helper function to create a simple box as fallback
function createSimpleBox(width, height, depth, scene) {
    return BABYLON.MeshBuilder.CreateBox("simpleBox", {
        width: width,
        height: height,
        depth: depth
    }, scene);
} 