// Grid System
const GridSystem = {
    create: function(scene) {
        const { SIZE, SPACING, COLOR } = CONFIG.GRID;
        const gridColor = new BABYLON.Color3(COLOR.r, COLOR.g, COLOR.b);
        
        // Horizontal lines
        for(let x = -SIZE; x <= SIZE; x += SPACING) {
            BABYLON.MeshBuilder.CreateLines("gridX", {
                points: [new BABYLON.Vector3(x, 0, -SIZE), new BABYLON.Vector3(x, 0, SIZE)]
            }, scene).color = gridColor;
        }

        // Vertical lines
        for(let z = -SIZE; z <= SIZE; z += SPACING) {
            BABYLON.MeshBuilder.CreateLines("gridZ", {
                points: [new BABYLON.Vector3(-SIZE, 0, z), new BABYLON.Vector3(SIZE, 0, z)]
            }, scene).color = gridColor;
        }

        // Grid glow effect
        new BABYLON.GlowLayer("gridGlow", scene).intensity = 2.0;
    }
}; 