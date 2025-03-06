// Collision Detection System
const CollisionSystem = (function() {
    // Private properties
    let initialized = false;
    let scene = null;
    let camera = null;
    
    // Store the entities we've already collided with to avoid duplicate messages
    const collidedEntities = new Set();
    
    // Configuration
    const COLLISION_RADIUS = 1.0; // Size of the player's collision sphere (reduced to 1 unit)
    const RESET_DISTANCE = 2.0;   // Distance player needs to move away to allow for re-collision detection
    
    // Direct log message to the on-screen console
    function logToConsole(message) {
        // Use the Logger if available
        if (window.Logger && typeof window.Logger.log === 'function') {
            window.Logger.log(message);
        } else {
            // Fallback to console.log if Logger isn't available
            console.log(message);
        }
    }
    
    /**
     * Initialize the collision system
     * @param {Object} sceneInstance - The Babylon scene
     * @param {Object} cameraInstance - The player camera
     */
    function init(sceneInstance, cameraInstance) {
        // Directly set the scene and camera
        scene = sceneInstance;
        camera = cameraInstance;
        
        // Register with scene rendering to guarantee collision checks
        if (scene) {
            scene.onBeforeRenderObservable.add(checkCollisionsOnRender);
        }
        
        // Notify of initialization
        logToConsole("Collision detection system initialized");
        
        // Mark as initialized
        initialized = true;
        return true;
    }

    /**
     * Check for collisions during scene rendering - guaranteed to run every frame
     */
    function checkCollisionsOnRender() {
        if (!camera || !scene) return;
        
        // Only check occasionally for performance
        if (Math.random() > 0.2) return; // 20% chance to run checks
        
        // Get camera position
        const position = camera.position;
        
        // Run collision detection with the camera position
        checkCollisions({
            position: { x: position.x, y: position.y, z: position.z },
            rotation: camera.rotation.y
        });
    }
    
    /**
     * Check for collisions between player and entities
     * @param {Object} playerData - The player position data
     */
    function checkCollisions(playerData) {
        if (!scene) return;
        
        // Get player position from data or camera
        const playerPosition = playerData?.position || (camera ? camera.position : null);
        if (!playerPosition) return;
        
        // Get all entities from EntitySystem
        let npcs = [];
        let foes = [];
        
        if (window.EntitySystem) {
            npcs = window.EntitySystem.getAllNPCs ? window.EntitySystem.getAllNPCs() : [];
            foes = window.EntitySystem.getAllFoes ? window.EntitySystem.getAllFoes() : [];
        }
        
        // Combine all entities to check
        const allEntities = [...npcs, ...foes];
        
        if (allEntities.length === 0) {
            // If no entities, we can't do collision detection
            return;
        }
        
        // Create a set of currently colliding entity IDs for this frame
        const currentlyColliding = new Set();
        
        // Check collisions with each entity
        allEntities.forEach(entity => {
            if (!entity || !entity.mesh) return;
            
            // Get entity position from its mesh
            const entityPosition = entity.mesh.position;
            
            // Use Babylon Vector3 distance calculation
            const playerPos = new BABYLON.Vector3(
                playerPosition.x,
                playerPosition.y,
                playerPosition.z
            );
            
            const distance = BABYLON.Vector3.Distance(playerPos, entityPosition);
            
            // Occasionally log distance for debugging
            if (Math.random() < 0.001) {
                console.log(`Distance to ${entity.name || 'entity'}: ${distance.toFixed(2)} (ID: ${entity.id || 'unknown'})`);
            }
            
            // Get a stable entity ID
            const entityId = entity.id || `unknown-${Math.random()}`;
            
            // Check if player is in collision range
            if (distance < COLLISION_RADIUS) {
                // Track that we're currently colliding with this entity
                currentlyColliding.add(entityId);
                
                // If we haven't already logged a collision with this entity
                if (!collidedEntities.has(entityId)) {
                    // Create collision message
                    const entityName = entity.name || "Unknown Entity";
                    const entityType = entity.type === 'npc' ? 'NPC' : 'Foe';
                    const detectionMethod = "Scene Render Observer";
                    const message = `Collision detected with ${entityType}: ${entityName} (ID: ${entityId}) [Method: ${detectionMethod}, Distance: ${distance.toFixed(2)}m]`;
                    
                    // Log the collision
                    logToConsole(message);
                    
                    // Add to collided entities to avoid duplicate messages
                    collidedEntities.add(entityId);
                }
            } else if (distance > RESET_DISTANCE) {
                // When player moves sufficiently away, remove from collided set to allow future collisions
                if (collidedEntities.has(entityId)) {
                    collidedEntities.delete(entityId);
                    if (Math.random() < 0.01) { // Occasionally log for debugging
                        console.log(`Reset collision detection for entity: ${entityId} (Distance: ${distance.toFixed(2)}m)`);
                    }
                }
            }
        });
    }
    
    /**
     * Reset collision detection for a specific entity
     * @param {string} entityId - The ID of the entity to reset
     */
    function resetEntityCollision(entityId) {
        if (collidedEntities.has(entityId)) {
            collidedEntities.delete(entityId);
        }
    }
    
    /**
     * Reset all collision detection
     */
    function resetAllCollisions() {
        collidedEntities.clear();
        logToConsole("All collision detections reset");
    }
    
    // Public API
    return {
        init,
        checkCollisions,
        resetEntityCollision,
        resetAllCollisions
    };
})();

// Export to window
window.CollisionSystem = CollisionSystem; 