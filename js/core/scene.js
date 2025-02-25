// Scene Management
const SceneManager = {
    create: function(engine) {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        
        // Setup error handling
        engine.onErrorObservable.add((e) => {
            Logger.error(`GRAPHICS: ${e.message}`);
        });
        
        return scene;
    },
    
    // Add performance monitoring
    addPerformanceMonitor: function(engine, scene) {
        let fpsDiv = document.createElement('div');
        fpsDiv.style.position = 'absolute';
        fpsDiv.style.bottom = '10px';
        fpsDiv.style.left = '10px';
        fpsDiv.style.color = '#0f0';
        fpsDiv.style.fontFamily = 'monospace';
        document.body.appendChild(fpsDiv);
        
        scene.registerBeforeRender(() => {
            fpsDiv.textContent = `FPS: ${engine.getFps().toFixed(2)}`;
        });
    }
}; 