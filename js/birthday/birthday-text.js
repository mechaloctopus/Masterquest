// Birthday Text System
const BirthdayTextSystem = {
    create: function(scene) {
        if (!CONFIG.BIRTHDAY.SHOW_MESSAGE) {
            return null;
        }
        
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE");
            
            // Create parent container for text
            const textParent = new BABYLON.TransformNode("birthdayParent", scene);
            textParent.position = new BABYLON.Vector3(
                CONFIG.BIRTHDAY.TEXT_POSITION.x,
                CONFIG.BIRTHDAY.TEXT_POSITION.y,
                CONFIG.BIRTHDAY.TEXT_POSITION.z
            );
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
                
                // Create metallic gradient for synthwave look
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                
                // Use different color schemes based on input color
                if (color === CONFIG.BIRTHDAY.COLORS.PRIMARY) {
                    // Metallic blue/cyan gradient
                    gradient.addColorStop(0.0, "#FFFFFF"); // White highlight
                    gradient.addColorStop(0.2, "#00FFFF"); // Cyan
                    gradient.addColorStop(0.5, "#0099FF"); // Blue
                    gradient.addColorStop(0.8, "#0055FF"); // Darker blue
                    gradient.addColorStop(1.0, "#00CCFF"); // Light blue edge
                } else {
                    // Metallic pink/purple gradient
                    gradient.addColorStop(0.0, "#FFFFFF"); // White highlight
                    gradient.addColorStop(0.2, "#FF69B4"); // Hot pink
                    gradient.addColorStop(0.5, "#FF00FF"); // Magenta
                    gradient.addColorStop(0.8, "#9400D3"); // Purple
                    gradient.addColorStop(1.0, "#FF33CC"); // Light pink edge
                }
                
                // Use better font for synthwave
                const fontSize = textSize * 0.75;
                ctx.font = "bold " + fontSize + "px 'Segoe UI', Tahoma, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                // Add multiple shadow and glow layers for more depth
                // Outer glow
                const glowColor = color === CONFIG.BIRTHDAY.COLORS.PRIMARY ? "#00FFFF" : "#FF00FF";
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Draw the text with gradient fill
                ctx.fillStyle = gradient;
                ctx.fillText(text, textSize / 2, 100);
                
                // Add subtle inner shadow for 3D metallic effect
                ctx.shadowColor = "#000000";
                ctx.shadowBlur = 1;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#FFFFFF";
                ctx.strokeText(text, textSize / 2, 100);
                
                // Update texture
                textTexture.update();
                
                // Create plane for the text
                const plane = BABYLON.MeshBuilder.CreatePlane("textPlane_" + text, {
                    width: textSize / 100 * scale,
                    height: 2 * scale
                }, scene);
                
                // Create material with the texture
                const material = new BABYLON.StandardMaterial("textMaterial_" + text, scene);
                material.diffuseTexture = textTexture;
                material.specularColor = new BABYLON.Color3(1, 1, 1);
                material.emissiveColor = color === CONFIG.BIRTHDAY.COLORS.PRIMARY 
                    ? new BABYLON.Color3(0, 0.7, 1) // Cyan glow
                    : new BABYLON.Color3(1, 0, 0.7); // Pink glow
                material.useAlphaFromDiffuseTexture = true;
                
                // Assign material to plane
                plane.material = material;
                
                // Position the plane
                plane.position.y = yPosition;
                
                // Add metallic reflection
                plane.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene);
                plane.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, -0.5);
                plane.material.reflectionTexture.level = 0.5;
                
                // Parent to the container
                plane.parent = textParent;
                
                return plane;
            };
            
            // Create the three text lines with config values
            const happyText = createTextPlane("HAPPY", CONFIG.BIRTHDAY.COLORS.PRIMARY, 2, CONFIG.BIRTHDAY.SCALE, scene);
            const birthdayText = createTextPlane("BIRTHDAY", CONFIG.BIRTHDAY.COLORS.PRIMARY, 0, CONFIG.BIRTHDAY.SCALE, scene);
            const marcusText = createTextPlane(CONFIG.BIRTHDAY.RECIPIENT_NAME, CONFIG.BIRTHDAY.COLORS.SECONDARY, -2.5, CONFIG.BIRTHDAY.SCALE * 1.5, scene);
            
            // Add glow layer
            const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
            glowLayer.intensity = CONFIG.BIRTHDAY.COLORS.GLOW_INTENSITY;
            
            // Animation using config values
            scene.registerBeforeRender(() => {
                const time = performance.now() * 0.001;
                textParent.position.y = CONFIG.BIRTHDAY.TEXT_POSITION.y + 
                    Math.sin(time * CONFIG.BIRTHDAY.ANIMATION.BOB_SPEED) * CONFIG.BIRTHDAY.ANIMATION.BOB_HEIGHT;
                textParent.rotation.y = Math.sin(time * CONFIG.BIRTHDAY.ANIMATION.ROTATION_SPEED) * 0.2;
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