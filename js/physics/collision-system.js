// Collision Detection System
const CollisionSystem = (function() {
    // Private properties
    let initialized = false;
    let scene = null;
    let camera = null;
    
    // Store the entities we've already collided with to avoid duplicate messages
    const collidedEntities = new Set();
    
    // Configuration
    const COLLISION_RADIUS = 2.0; // Size of the player's collision sphere
    
    /**
     * Initialize the collision system
     * @param {Object} sceneInstance - The Babylon scene
     * @param {Object} cameraInstance - The player camera
     */
    function init(sceneInstance, cameraInstance) {
        if (window.Utils && window.Utils.initializeComponent) {
            return Utils.initializeComponent(
                CollisionSystem, 
                "COLLISION SYSTEM", 
                () => {
                    scene = sceneInstance;
                    camera = cameraInstance;
                    
                    // Register for position updates
                    if (window.EventSystem) {
                        EventSystem.on('player.position', checkCollisions);
                    }
                    
                    // Listen for realm changes to reset collision state
                    if (window.EventSystem) {
                        EventSystem.on('realm.change', () => {
                            collidedEntities.clear();
                        });
                    }
                    
                    return true;
                }
            );
        }
        
        // Fallback if Utils is not available
        if (initialized) return true;
        scene = sceneInstance;
        camera = cameraInstance;
        initialized = true;
        
        if (window.Logger) {
            Logger.log("> COLLISION SYSTEM INITIALIZED");
        } else {
            console.log("> COLLISION SYSTEM INITIALIZED");
        }
        
        return true;
    }
    
    /**
     * Check for collisions between player and entities
     * @param {Object} playerData - The player position data
     */
    function checkCollisions(playerData) {
        if (!initialized || !scene || !camera) return;
        
        const playerPosition = playerData?.position || camera.position;
        
        if (!playerPosition) return;
        
        // Only run collision checks every few frames for performance
        if (Math.random() > 0.2) return; // 20% chance to run collision checks
        
        // Get all entities from EntitySystem
        const npcs = window.EntitySystem?.getAllNPCs() || [];
        const foes = window.EntitySystem?.getAllFoes() || [];
        
        // Combine all entities to check
        const allEntities = [...npcs, ...foes];
        
        // Check collisions with each entity
        allEntities.forEach(entity => {
            if (!entity || !entity.mesh || !entity.id) return;
            
            // Get entity position from its mesh
            const entityPosition = entity.mesh.position;
            
            // Check if player is in collision range with this entity
            if (window.Utils && window.Utils.isInProximity(playerPosition, entityPosition, COLLISION_RADIUS, false)) {
                // If we haven't already logged a collision with this entity
                if (!collidedEntities.has(entity.id)) {
                    // Log the collision
                    const entityType = entity.type === 'npc' ? 'NPC' : 'Foe';
                    const message = `Collision detected with ${entityType}: ${entity.name} (ID: ${entity.id})`;
                    
                    if (window.Logger) {
                        Logger.log(message);
                    } else {
                        console.log(message);
                    }
                    
                    // Emit collision event
                    if (window.EventSystem) {
                        EventSystem.emit('collision.detected', {
                            entityId: entity.id,
                            entityType: entity.type,
                            entityName: entity.name,
                            playerPosition: playerPosition,
                            entityPosition: entityPosition
                        });
                    }
                    
                    // Add to collided entities to avoid duplicate messages
                    collidedEntities.add(entity.id);
                }
            } else {
                // When player moves away, remove from collided set to allow future collisions
                if (collidedEntities.has(entity.id)) {
                    collidedEntities.delete(entity.id);
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