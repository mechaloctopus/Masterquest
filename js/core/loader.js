// Asset and resource loading system
const LoaderSystem = (function() {
    // Private variables
    let assetsManager = null;
    let loadingTasks = [];
    let totalTasks = 0;
    let completedTasks = 0;
    let isLoading = false;
    
    // Initialize the loader with a scene reference
    function initialize(scene) {
        if (!scene) {
            throw new Error("Scene required for LoaderSystem initialization");
        }
        
        assetsManager = new BABYLON.AssetsManager(scene);
        
        // Configure the assets manager
        assetsManager.useDefaultLoadingScreen = false;
        assetsManager.onProgress = onProgress;
        assetsManager.onFinish = onAllTasksComplete;
        assetsManager.onTaskError = onTaskError;
        
        return assetsManager;
    }
    
    // Add a new task to be loaded
    function addTask(name, task) {
        loadingTasks.push({
            name,
            task,
            completed: false,
            error: null
        });
        
        totalTasks++;
        
        // Notify via event system
        if (window.EventSystem) {
            EventSystem.emit('loader.taskAdded', { name });
        }
        
        return task;
    }
    
    // Load a texture
    function loadTexture(name, url) {
        if (!assetsManager) {
            Logger.error("LoaderSystem not initialized. Call initialize() first.");
            return null;
        }
        
        const task = assetsManager.addTextureTask(name, url);
        return addTask(name, task);
    }
    
    // Load a sound
    function loadSound(name, url, loop = false, autoplay = false) {
        if (!assetsManager) {
            Logger.error("LoaderSystem not initialized. Call initialize() first.");
            return null;
        }
        
        const task = assetsManager.addBinaryFileTask(name, url);
        task.onSuccess = (task) => {
            // Handle sound loading manually
            const blob = new Blob([task.data]);
            const blobUrl = URL.createObjectURL(blob);
            const audio = new Audio(blobUrl);
            audio.loop = loop;
            
            // Store the sound for later use
            task.sound = audio;
            
            if (autoplay) {
                audio.play().catch(e => console.warn("Auto-play prevented:", e));
            }
        };
        
        return addTask(name, task);
    }
    
    // Helper method to load multiple textures at once
    function loadTextures(textures) {
        if (!Array.isArray(textures)) {
            Logger.error("textures must be an array of {name, url} objects");
            return [];
        }
        
        return textures.map(tex => loadTexture(tex.name, tex.url));
    }
    
    // Helper method to load multiple sounds at once
    function loadSounds(sounds) {
        if (!Array.isArray(sounds)) {
            Logger.error("sounds must be an array of {name, url, loop, autoplay} objects");
            return [];
        }
        
        return sounds.map(sound => 
            loadSound(sound.name, sound.url, sound.loop, sound.autoplay)
        );
    }
    
    // Start loading all the queued assets
    function startLoading() {
        if (isLoading) {
            Logger.warning("Loading already in progress");
            return;
        }
        
        if (!assetsManager) {
            Logger.error("LoaderSystem not initialized. Call initialize() first.");
            return;
        }
        
        if (loadingTasks.length === 0) {
            Logger.warning("No tasks to load");
            if (window.EventSystem) {
                EventSystem.emit('loader.complete', { 
                    success: true,
                    progress: 1
                });
            }
            return;
        }
        
        isLoading = true;
        completedTasks = 0;
        
        // Notify loading started
        if (window.EventSystem) {
            EventSystem.emit('loader.start', { 
                totalTasks,
                progress: 0
            });
        }
        
        // Start loading
        assetsManager.load();
    }
    
    // Handle progress updates
    function onProgress(remainingCount, totalCount, lastFinishedTask) {
        completedTasks = totalCount - remainingCount;
        const progress = completedTasks / totalTasks;
        
        // Update task status
        if (lastFinishedTask) {
            const task = loadingTasks.find(t => t.name === lastFinishedTask.name);
            if (task) {
                task.completed = true;
            }
        }
        
        // Notify via event system
        if (window.EventSystem) {
            EventSystem.emit('loader.progress', {
                progress,
                completedTasks,
                totalTasks,
                lastTask: lastFinishedTask ? lastFinishedTask.name : null
            });
        }
    }
    
    // Handle task errors
    function onTaskError(task, message, exception) {
        const taskInfo = loadingTasks.find(t => t.name === task.name);
        if (taskInfo) {
            taskInfo.error = message || exception?.message || "Unknown error";
        }
        
        Logger.error(`Failed to load asset: ${task.name}. ${message}`);
        
        // Notify via event system
        if (window.EventSystem) {
            EventSystem.emit('loader.error', {
                taskName: task.name,
                error: message || exception?.message || "Unknown error"
            });
        }
    }
    
    // Handle all tasks completion
    function onAllTasksComplete() {
        isLoading = false;
        
        // Notify via event system
        if (window.EventSystem) {
            EventSystem.emit('loader.complete', {
                success: true,
                progress: 1,
                completedTasks,
                totalTasks
            });
        }
        
        Logger.log(`> ASSETS LOADED: ${completedTasks}/${totalTasks}`);
    }
    
    // Get all loaded assets
    function getLoadedAssets() {
        return loadingTasks.filter(task => task.completed).map(task => ({
            name: task.name,
            task: task.task
        }));
    }
    
    // Get a specific loaded asset by name
    function getAsset(name) {
        const task = loadingTasks.find(t => t.name === name && t.completed);
        return task ? task.task : null;
    }
    
    // Reset the loader for a new set of assets
    function reset() {
        loadingTasks = [];
        totalTasks = 0;
        completedTasks = 0;
        isLoading = false;
        
        // Notify via event system
        if (window.EventSystem) {
            EventSystem.emit('loader.reset');
        }
    }
    
    // Check if loading is in progress
    function isLoadingInProgress() {
        return isLoading;
    }
    
    // Get loading progress
    function getProgress() {
        return totalTasks > 0 ? completedTasks / totalTasks : 1;
    }
    
    // Public API
    return {
        initialize,
        loadTexture,
        loadSound,
        loadTextures,
        loadSounds,
        startLoading,
        getLoadedAssets,
        getAsset,
        reset,
        isLoadingInProgress,
        getProgress
    };
})(); 