// Birthday Text System
const BirthdayTextSystem = {
    create: function(scene) {
        try {
            Logger.log("> GENERATING 3D BIRTHDAY MESSAGE");
            
            // Create parent container for text
            const textParent = new BABYLON.TransformNode("birthdayParent", scene);
            textParent.position = new BABYLON.Vector3(0, 4, -15);
            
            // Create materials
            const pinkMaterial = new BABYLON.StandardMaterial("pinkMat", scene);
            pinkMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            pinkMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0.8); // Pink
            pinkMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
            
            const cyanMaterial = new BABYLON.StandardMaterial("cyanMat", scene);
            cyanMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            cyanMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan
            cyanMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
            
            // Create HAPPY BIRTHDAY MARCUS! as 3D text with boxes
            const words = [
                { text: "HAPPY", material: cyanMaterial, scale: 0.8, y: 2 },
                { text: "BIRTHDAY", material: cyanMaterial, scale: 0.8, y: 0 },
                { text: "MARCUS!", material: pinkMaterial, scale: 1.2, y: -2.5 }
            ];
            
            words.forEach(word => {
                const wordGroup = createTextRow(word.text, word.material, scene);
                wordGroup.parent = textParent;
                wordGroup.position.y = word.y;
                wordGroup.scaling = new BABYLON.Vector3(word.scale, word.scale, word.scale);
            });
            
            // Add glow effect
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