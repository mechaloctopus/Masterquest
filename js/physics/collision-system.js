// Collision Detection System
const CollisionSystem = (function() {
    // Private properties
    let initialized = false;
    let scene = null;
    let camera = null;
    
    // Store the entities we've already collided with to avoid duplicate messages
    const collidedEntities = new Set();
    
    // Configuration
    const COLLISION_RADIUS = 3.0; // Increased size of the player's collision sphere
    const DEBUG_MODE = true; // Enable detailed debug logging
    
    // Force a log message to appear in the system
    function forceLogMessage(message) {
        console.log("FORCE LOG:", message);
        
        // Try multiple ways to log the message
        if (window.Logger && window.Logger.log) {
            Logger.log(message);
        }
        
        // Direct DOM manipulation as a fallback
        const logContent = document.getElementById('logContent');
        if (logContent) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry info';
            logEntry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
            logContent.appendChild(logEntry);
            logContent.scrollTop = logContent.scrollHeight;
        }
    }
    
    /**
     * Initialize the collision system
     * @param {Object} sceneInstance - The Babylon scene
     * @param {Object} cameraInstance - The player camera
     */
    function init(sceneInstance, cameraInstance) {
        console.log("CollisionSystem.init called with:", sceneInstance ? "scene provided" : "NO SCENE", cameraInstance ? "camera provided" : "NO CAMERA");
        
        // Directly set the scene and camera
        scene = sceneInstance;
        camera = cameraInstance;
        
        // Register for position updates
        if (window.EventSystem) {
            console.log("CollisionSystem registering for player.position events");
            EventSystem.on('player.position', checkCollisions);
            
            // Also register for scene rendering to guarantee collision checks
            if (scene) {
                scene.onBeforeRenderObservable.add(checkCollisionsOnRender);
                console.log("Added scene render observer for collision checks");
            }
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
        
        // Force a log message to verify the logger is working
        forceLogMessage("Collision detection system initialized");
        
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
        
        // Call collision check with camera position
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
            npcs = window.EntitySystem.getAllNPCs() || [];
            foes = window.EntitySystem.getAllFoes() || [];
        }
        
        // Combine all entities to check
        const allEntities = [...npcs, ...foes];
        
        if (allEntities.length === 0) {
            // If no entities, we can't do collision detection
            return;
        }
        
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
            
            // Occasionally log the distance for debugging
            if (DEBUG_MODE && Math.random() < 0.01) {
                console.log(`Distance to ${entity.id || 'unknown entity'}: ${distance.toFixed(2)}`);
            }
            
            // Check if player is in collision range
            if (distance < COLLISION_RADIUS) {
                // If we haven't already logged a collision with this entity
                const entityId = entity.id || `unknown-${Math.random()}`;
                
                if (!collidedEntities.has(entityId)) {
                    // Create collision message
                    const entityName = entity.name || "Unknown Entity";
                    const entityType = entity.type === 'npc' ? 'NPC' : 'Foe';
                    const message = `Collision detected with ${entityType}: ${entityName} (ID: ${entityId})`;
                    
                    // Log the collision to console
                    console.log(`COLLISION DETECTED! Distance: ${distance.toFixed(2)}m, message: ${message}`);
                    
                    // Use forced logging to ensure it appears
                    forceLogMessage(message);
                    
                    // Emit collision event
                    if (window.EventSystem) {
                        EventSystem.emit('collision.detected', {
                            entityId: entityId,
                            entityType: entity.type || 'unknown',
                            entityName: entityName,
                            playerPosition: playerPos,
                            entityPosition: entityPosition,
                            distance: distance
                        });
                    }
                    
                    // Add to collided entities to avoid duplicate messages
                    collidedEntities.add(entityId);
                }
            } else {
                // When player moves away, remove from collided set to allow future collisions
                const entityId = entity.id || `unknown-${Math.random()}`;
                if (collidedEntities.has(entityId) && distance > COLLISION_RADIUS + 1) {
                    collidedEntities.delete(entityId);
                }
            }
        });
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
        
        // Force a message to the log to verify logger is working
        forceLogMessage("Debug entities called - found " + (npcs.length + foes.length) + " entities");
        
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
        
        // Get camera position if possible
        if (!camera) {
            console.error("Camera not initialized");
            forceLogMessage("Test collision failed - camera not initialized");
            return false;
        }
        
        // Log current position
        console.log("Current camera position:", camera.position);
        
        // Force a collision detection with current position
        checkCollisions({
            position: camera.position,
            rotation: camera.rotation.y
        });
        
        // Also force a collision with ALL entities (ignoring distance)
        forceCollisionWithAll();
        
        // Notify user
        forceLogMessage("Manual collision test triggered");
        
        return true;
    }
    
    /**
     * Force a collision with all entities regardless of distance
     */
    function forceCollisionWithAll() {
        console.log("Forcing collision with all entities");
        
        // Get all entities
        const npcs = window.EntitySystem?.getAllNPCs() || [];
        const foes = window.EntitySystem?.getAllFoes() || [];
        const allEntities = [...npcs, ...foes];
        
        if (allEntities.length === 0) {
            forceLogMessage("No entities found to force collision with");
            return;
        }
        
        // Log collision with each entity
        allEntities.forEach(entity => {
            if (!entity) return;
            
            const entityId = entity.id || `unknown-${Math.random()}`;
            const entityName = entity.name || "Unknown Entity";
            const entityType = entity.type === 'npc' ? 'NPC' : 'Foe';
            
            const message = `FORCED collision with ${entityType}: ${entityName} (ID: ${entityId})`;
            forceLogMessage(message);
            
            // Add to collided set
            collidedEntities.add(entityId);
        });
        
        console.log(`Forced collision with ${allEntities.length} entities`);
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
        forceLogMessage("All collision detections reset");
    }
    
    // Public API
    return {
        init,
        checkCollisions,
        resetEntityCollision,
        resetAllCollisions,
        debugEntities,
        testCollision,
        forceCollisionWithAll
    };
})();

// Export to window
window.CollisionSystem = CollisionSystem; 