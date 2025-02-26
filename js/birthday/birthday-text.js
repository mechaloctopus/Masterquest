// Birthday Text System
const BirthdayTextSystem = {
    create: function(scene) {
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE");
            
            // Create parent container for text
            const textParent = new BABYLON.TransformNode("birthdayParent", scene);
            textParent.position = new BABYLON.Vector3(0, 4, -15);
            
            // Create the billboard planes
            const happyPlane = BABYLON.MeshBuilder.CreatePlane("happyPlane", {width: 14, height: 3}, scene);
            happyPlane.position.y = 2;
            happyPlane.parent = textParent;
            
            const birthdayPlane = BABYLON.MeshBuilder.CreatePlane("birthdayPlane", {width: 16, height: 3}, scene);
            birthdayPlane.position.y = 0;
            birthdayPlane.parent = textParent;
            
            const marcusPlane = BABYLON.MeshBuilder.CreatePlane("marcusPlane", {width: 16, height: 4}, scene);
            marcusPlane.position.y = -2.5;
            marcusPlane.parent = textParent;
            
            // Create materials with glowing colors
            const createGlowMaterial = (name, color, scene) => {
                const material = new BABYLON.StandardMaterial(name, scene);
                material.emissiveColor = color;
                material.disableLighting = true;
                return material;
            };
            
            const cyanMaterial = createGlowMaterial("cyanMat", new BABYLON.Color3(0, 1, 1), scene);
            const pinkMaterial = createGlowMaterial("pinkMat", new BABYLON.Color3(1, 0.4, 0.8), scene);
            
            // Create the GUI textures for the text
            const createTextTexture = (text, color, plane, fontSize) => {
                const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
                
                const textBlock = new BABYLON.GUI.TextBlock();
                textBlock.text = text;
                textBlock.color = color;
                textBlock.fontSize = fontSize || 120;
                textBlock.fontFamily = "Arial";
                textBlock.fontStyle = "bold";
                textBlock.outlineWidth = 8;
                textBlock.outlineColor = "black";
                
                advancedTexture.addControl(textBlock);
                return advancedTexture;
            };
            
            // Apply textures to planes
            createTextTexture("HAPPY", "#00FFFF", happyPlane, 120);
            createTextTexture("BIRTHDAY", "#00FFFF", birthdayPlane, 120);
            createTextTexture("MARCUS!", "#FF69B4", marcusPlane, 160);
            
            // Add glow effect
            const glowLayer = new BABYLON.GlowLayer("birthdayGlow", scene);
            glowLayer.intensity = 1.5;
            
            // Make planes glow in their respective colors
            happyPlane.material = cyanMaterial;
            birthdayPlane.material = cyanMaterial;
            marcusPlane.material = pinkMaterial;
            
            // Add a bit of transparency to see the glow better
            cyanMaterial.alpha = 0.7;
            pinkMaterial.alpha = 0.7;
            
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
            return null;
        }
    }
};

// Helper function to create a row of text with simple boxes
function createTextRow(text, material, scene) {
    const textGroup = new BABYLON.TransformNode("text_" + text, scene);
    let xOffset = 0;
    const letterWidth = 1.2;
    const spacing = 0.3;
    
    // Center the text
    const totalWidth = text.length * letterWidth + (text.length - 1) * spacing;
    xOffset = -totalWidth / 2;
    
    for (let i = 0; i < text.length; i++) {
        const letter = text[i];
        
        // Create a box for each letter
        const letterMesh = BABYLON.MeshBuilder.CreateBox(
            "letter_" + letter + "_" + i,
            { width: 1, height: 2, depth: 0.5 },
            scene
        );
        
        letterMesh.position.x = xOffset + (letterWidth + spacing) * i;
        letterMesh.material = material;
        letterMesh.parent = textGroup;
    }
    
    return textGroup;
} 