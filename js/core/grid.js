// Grid System
const GridSystem = {
    meshes: [],
    
    create: function(scene) {
        if (!scene) {
            Logger.error("Cannot create grid: Scene is undefined");
            return;
        }
        
        // Clear any existing meshes first
        this.dispose();
        
        const { SIZE, SPACING, COLOR } = CONFIG.GRID;
        const gridColor = new BABYLON.Color3(COLOR.r, COLOR.g, COLOR.b);
        
        try {
            // Horizontal lines
            for(let x = -SIZE; x <= SIZE; x += SPACING) {
                const line = BABYLON.MeshBuilder.CreateLines("gridX", {
                    points: [new BABYLON.Vector3(x, 0, -SIZE), new BABYLON.Vector3(x, 0, SIZE)]
                }, scene);
                line.color = gridColor;
                this.meshes.push(line);
            }

            // Vertical lines
            for(let z = -SIZE; z <= SIZE; z += SPACING) {
                const line = BABYLON.MeshBuilder.CreateLines("gridZ", {
                    points: [new BABYLON.Vector3(-SIZE, 0, z), new BABYLON.Vector3(SIZE, 0, z)]
                }, scene);
                line.color = gridColor;
                this.meshes.push(line);
            }

            // Grid glow effect
            new BABYLON.GlowLayer("gridGlow", scene).intensity = 2.0;
            
            return this.meshes;
        } catch (e) {
            Logger.error("Error creating grid: " + e.message);
            return [];
        }
    },
    
    dispose: function() {
        // Clean up all grid meshes
        this.meshes.forEach(mesh => {
            if (mesh && mesh.dispose) {
                mesh.dispose();
            }
        });
        this.meshes = [];
    }
}; 