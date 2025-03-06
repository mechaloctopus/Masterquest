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
    const DEBUG_MODE = true; // Enable detailed debug logging
    
    /**
     * Initialize the collision system
     * @param {Object} sceneInstance - The Babylon scene
     * @param {Object} cameraInstance - The player camera
     */
    function init(sceneInstance, cameraInstance) {
        console.log("CollisionSystem.init called with:", sceneInstance ? "scene provided" : "NO SCENE", cameraInstance ? "camera provided" : "NO CAMERA");
        
        if (window.Utils && window.Utils.initializeComponent) {
            return Utils.initializeComponent(
                CollisionSystem, 
                "COLLISION SYSTEM", 
                () => {
                    scene = sceneInstance;
                    camera = cameraInstance;
                    
                    console.log("CollisionSystem initialization. Scene:", scene ? "available" : "missing", "Camera:", camera ? "available" : "missing");
                    
                    // Register for position updates
                    if (window.EventSystem) {
                        console.log("CollisionSystem registering for player.position events");
                        EventSystem.on('player.position', checkCollisions);
                    } else {
                        console.error("EventSystem not available, collision detection will not work");
                    }
                    
                    // Listen for realm changes to reset collision state
                    if (window.EventSystem) {
                        EventSystem.on('realm.change', () => {
                            console.log("CollisionSystem clearing on realm change");
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
        
        // Register for position updates
        if (window.EventSystem) {
            console.log("CollisionSystem fallback init registering for player.position events");
            EventSystem.on('player.position', checkCollisions);
        } else {
            console.error("EventSystem not available in fallback init, collision detection will not work");
        }
        
        return true;
    }
    
    /**
     * Check for collisions between player and entities
     * @param {Object} playerData - The player position data
     */
    function checkCollisions(playerData) {
        if (!initialized || !scene || !camera) {
            if (DEBUG_MODE) console.log("CollisionSystem not ready for collision checks");
            return;
        }
        
        if (DEBUG_MODE && Math.random() < 0.01) { // Log only occasionally to avoid spam
            console.log("CollisionSystem.checkCollisions called with:", playerData);
        }
        
        const playerPosition = playerData?.position || camera.position;
        
        if (!playerPosition) {
            if (DEBUG_MODE) console.log("No player position available for collision checks");
            return;
        }
        
        // Get all entities from EntitySystem
        let npcs = [];
        let foes = [];
        
        if (window.EntitySystem) {
            npcs = window.EntitySystem.getAllNPCs() || [];
            foes = window.EntitySystem.getAllFoes() || [];
            
            // Debug entities if needed
            if (DEBUG_MODE && Math.random() < 0.01) { // Log only occasionally
                console.log(`CollisionSystem found ${npcs.length} NPCs and ${foes.length} foes to check`);
            }
        } else {
            console.error("EntitySystem not available for collision checks");
        }
        
        // If no entities are available, check if we need to create a temporary debug entity
        if ((npcs.length === 0 && foes.length === 0) && 
            DEBUG_MODE && Math.random() < 0.01) {
            console.log("No entities found for collision checks");
        }
        
        // Combine all entities to check
        const allEntities = [...npcs, ...foes];
        
        // Check collisions with each entity
        allEntities.forEach(entity => {
            if (!entity || !entity.mesh || !entity.id) {
                if (DEBUG_MODE && Math.random() < 0.01) {
                    console.log("Skipping invalid entity in collision check:", entity);
                }
                return;
            }
            
            // Get entity position from its mesh
            const entityPosition = entity.mesh.position;
            
            // Debug proximity occasionally
            if (DEBUG_MODE && Math.random() < 0.005) {
                const distance = BABYLON.Vector3.Distance(
                    new BABYLON.Vector3(playerPosition.x, playerPosition.y, playerPosition.z),
                    entityPosition
                );
                console.log(`Distance to entity ${entity.id}: ${distance.toFixed(2)}, threshold: ${COLLISION_RADIUS}`);
            }
            
            // Check if player is in collision range with this entity
            const inProximity = window.Utils && window.Utils.isInProximity 
                ? window.Utils.isInProximity(playerPosition, entityPosition, COLLISION_RADIUS, false)
                : BABYLON.Vector3.Distance(
                    new BABYLON.Vector3(playerPosition.x, playerPosition.y, playerPosition.z),
                    entityPosition
                  ) < COLLISION_RADIUS;
            
            if (inProximity) {
                // If we haven't already logged a collision with this entity
                if (!collidedEntities.has(entity.id)) {
                    // Log the collision
                    const entityType = entity.type === 'npc' ? 'NPC' : 'Foe';
                    const message = `Collision detected with ${entityType}: ${entity.name} (ID: ${entity.id})`;
                    
                    console.log("COLLISION DETECTED:", message);
                    
                    // Try multiple ways to log to ensure something shows up
                    if (window.Logger && window.Logger.log) {
                        console.log("Logging via Logger.log");
                        Logger.log(message);
                    } else {
                        console.log("Falling back to console log");
                        console.log(message);
                        
                        // Try to append to log content directly as a fallback
                        const logContent = document.getElementById('logContent');
                        if (logContent) {
                            const logEntry = document.createElement('div');
                            logEntry.className = 'log-entry info';
                            logEntry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
                            logContent.appendChild(logEntry);
                            logContent.scrollTop = logContent.scrollHeight;
                        }
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
                    if (DEBUG_MODE) console.log(`Player moved away from entity ${entity.id}, resetting collision status`);
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
    
    /**
     * Debug function to log entity data - can be called from console
     */
    function debugEntities() {
        const npcs = window.EntitySystem?.getAllNPCs() || [];
        const foes = window.EntitySystem?.getAllFoes() || [];
        
        console.log("--- COLLISION SYSTEM DEBUG ---");
        console.log(`Found ${npcs.length} NPCs and ${foes.length} foes`);
        
        if (npcs.length > 0) {
            console.log("First NPC:", npcs[0]);
        }
        
        if (foes.length > 0) {
            console.log("First Foe:", foes[0]);
        }
        
        if (camera) {
            console.log("Player position:", camera.position);
        }
        
        return {
            npcs: npcs,
            foes: foes,
            playerPosition: camera ? camera.position : null
        };
    }
    
    /**
     * Test function to manually trigger a collision detection
     * Can be called from console: CollisionSystem.testCollision()
     */
    function testCollision() {
        console.log("Testing collision detection manually");
        
        if (!camera) {
            console.error("Camera not initialized");
            return false;
        }
        
        // Create a test position a bit in front of the camera
        const forward = new BABYLON.Vector3(
            Math.sin(camera.rotation.y) * 2,
            0,
            Math.cos(camera.rotation.y) * 2
        );
        
        const testPosition = {
            position: {
                x: camera.position.x + forward.x,
                y: camera.position.y,
                z: camera.position.z + forward.z
            },
            rotation: camera.rotation.y
        };
        
        console.log("Testing collision with position:", testPosition);
        
        // Run collision detection
        checkCollisions(testPosition);
        
        // Also log directly to screen
        const message = "Manual collision test triggered";
        
        if (window.Logger && window.Logger.log) {
            Logger.log(message);
        } else {
            // Try to append to log content directly as a fallback
            const logContent = document.getElementById('logContent');
            if (logContent) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry info';
                logEntry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
                logContent.appendChild(logEntry);
                logContent.scrollTop = logContent.scrollHeight;
            }
        }
        
        return true;
    }
    
    // Public API
    return {
        init,
        checkCollisions,
        resetEntityCollision,
        resetAllCollisions,
        debugEntities,
        testCollision
    };
})();

// Export to window
window.CollisionSystem = CollisionSystem; 