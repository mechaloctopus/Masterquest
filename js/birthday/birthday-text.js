// Birthday Text System
const BirthdayTextSystem = {
    create: function(scene) {
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE");
            
            // Create overall parent for positioning
            const textParent = new BABYLON.TransformNode("birthdayTextParent", scene);
            textParent.position = new BABYLON.Vector3(0, 5, -15); // Position in front of player
            
            // Create "HAPPY BIRTHDAY" text
            const happyText = BABYLON.MeshBuilder.CreateText(
                "happyBirthday",
                "HAPPY BIRTHDAY", 
                {
                    size: 2, 
                    depth: 0.5, 
                    font: "Arial Bold"
                },
                scene,
                new BABYLON.StandardMaterial("happyMat", scene)
            );
            happyText.parent = textParent;
            happyText.position.y = 2;
            
            // Create "MARCUS" text
            const marcusText = BABYLON.MeshBuilder.CreateText(
                "marcus",
                "MARCUS!", 
                {
                    size: 3, 
                    depth: 0.8, 
                    font: "Arial Bold"
                },
                scene,
                new BABYLON.StandardMaterial("marcusMat", scene)
            );
            marcusText.parent = textParent;
            marcusText.position.y = -2;
            
            // Create vaporwave materials
            const createTextMaterial = (name, emissiveColor) => {
                const material = new BABYLON.StandardMaterial(name, scene);
                material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                material.specularColor = new BABYLON.Color3(1, 1, 1);
                material.emissiveColor = emissiveColor;
                return material;
            };
            
            // Apply materials
            happyText.material = createTextMaterial("happyMat", new BABYLON.Color3(0, 1, 1)); // Cyan
            marcusText.material = createTextMaterial("marcusMat", new BABYLON.Color3(1, 0.4, 0.8)); // Pink
            
            // Add glow effect
            const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
            glowLayer.intensity = 1.5;
            
            // Make the text float and rotate slowly
            scene.registerBeforeRender(() => {
                const time = performance.now() * 0.001;
                textParent.position.y = 5 + Math.sin(time * 0.5) * 0.5; // Gentle floating
                textParent.rotation.y = Math.sin(time * 0.2) * 0.2; // Gentle side-to-side rotation
            });
            
            return textParent;
        } catch (e) {
            Logger.error("Failed to create 3D birthday text: " + e.message);
            return null;
        }
    },
    
    // Alternative method using scaled cubes if CreateText is not available
    createWithPrimitives: function(scene) {
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE (PRIMITIVE VERSION)");
            
            // Parent node
            const textParent = new BABYLON.TransformNode("birthdayTextParent", scene);
            textParent.position = new BABYLON.Vector3(0, 5, -15);
            
            // Text materials
            const pinkMaterial = new BABYLON.StandardMaterial("pinkMat", scene);
            pinkMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            pinkMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0.8); // Pink
            
            const cyanMaterial = new BABYLON.StandardMaterial("cyanMat", scene);
            cyanMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            cyanMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan
            
            // Create "HAPPY BIRTHDAY" text with cubes
            const createLetter = (char, position, material, parent) => {
                const letter = BABYLON.MeshBuilder.CreateBox(
                    "letter_" + char, 
                    {width: 1.5, height: 3, depth: 0.5}, 
                    scene
                );
                letter.position = position;
                letter.material = material;
                letter.parent = parent;
                return letter;
            };
            
            // Create Happy Birthday text
            const happyNode = new BABYLON.TransformNode("happyNode", scene);
            happyNode.parent = textParent;
            happyNode.position.y = 2;
            
            // Create a row of letter-like shapes for "HAPPY BIRTHDAY"
            let xPos = -10;
            ["H","A","P","P","Y"," ","B","I","R","T","H","D","A","Y"].forEach(char => {
                if (char === " ") {
                    xPos += 1.5;
                    return;
                }
                createLetter(char, new BABYLON.Vector3(xPos, 0, 0), cyanMaterial, happyNode);
                xPos += 1.8;
            });
            
            // Create Marcus text
            const marcusNode = new BABYLON.TransformNode("marcusNode", scene);
            marcusNode.parent = textParent;
            marcusNode.position.y = -2;
            
            // Create a row of letter-like shapes for "MARCUS!"
            xPos = -6;
            ["M","A","R","C","U","S","!"].forEach(char => {
                createLetter(char, new BABYLON.Vector3(xPos, 0, 0), pinkMaterial, marcusNode);
                xPos += 1.8;
            });
            
            // Add glow effect
            const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
            glowLayer.intensity = 1.5;
            
            // Animation
            scene.registerBeforeRender(() => {
                const time = performance.now() * 0.001;
                textParent.position.y = 5 + Math.sin(time * 0.5) * 0.5;
                textParent.rotation.y = Math.sin(time * 0.2) * 0.2;
            });
            
            return textParent;
        } catch (e) {
            Logger.error("Failed to create 3D birthday text: " + e.message);
            return null;
        }
    }
}; 