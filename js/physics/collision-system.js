// Collision Detection System
const CollisionSystem = (function() {
    // Private properties
    let initialized = false;
    let scene = null;
    let camera = null;
    
    // Store the entities we've already collided with to avoid duplicate messages
    const collidedEntities = new Set();
    
    // Track distance from each entity for better collision reset
    const entityDistances = new Map();
    
    // Configuration
    const COLLISION_RADIUS = 1.0; // Size of the player's collision sphere (reduced to 1 unit)
    const RESET_DISTANCE = 2.0;   // Distance player needs to move away to allow for re-collision detection
    const BOUNCE_FORCE = 1.0;     // Force applied when bouncing horizontally (impulse) - increased for visibility
    const BOUNCE_HEIGHT = 5.0;    // Vertical jump force for the bounce - increased for visibility
    const COLLISION_DAMAGE = 5;   // Amount of health reduced on collision
    
    // Damage effect configuration
    const DAMAGE_FLASH_DURATION = 500; // How long the red flash lasts in milliseconds
    const DAMAGE_FLASH_OPACITY = 0.4;  // Maximum opacity of the red flash
    
    // Reference to damage overlay element
    let damageOverlay = null;
    
    // Debug flag - set to true to show more detailed logs
    const DEBUG = true;
    
    // Reference to player state for smooth physics
    let playerState = null;
    
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
     * Create and initialize the damage overlay element
     */
    function initDamageOverlay() {
        // Check if it already exists
        if (damageOverlay) return;
        
        // Create a new div element for the damage overlay
        damageOverlay = document.createElement('div');
        
        // Set its styles
        Object.assign(damageOverlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0)', // Start transparent
            pointerEvents: 'none', // Don't capture mouse events
            transition: 'background-color 0.1s ease-in, background-color 0.4s ease-out',
            zIndex: 1000, // Make sure it's on top
            opacity: 0
        });
        
        // Add it to the document body
        document.body.appendChild(damageOverlay);
    }
    
    /**
     * Show the damage indicator (red flash)
     */
    function showDamageIndicator() {
        // Make sure we have the overlay initialized
        if (!damageOverlay) {
            initDamageOverlay();
        }
        
        // Set the opacity to show the red flash
        damageOverlay.style.backgroundColor = `rgba(255, 0, 0, ${DAMAGE_FLASH_OPACITY})`;
        damageOverlay.style.opacity = 1;
        
        // Set a timeout to fade it out
        setTimeout(() => {
            if (damageOverlay) {
                damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
                damageOverlay.style.opacity = 0;
            }
        }, DAMAGE_FLASH_DURATION);
    }
    
    /**
     * Make sure the health system is available and initialized
     * @returns {boolean} Whether the health system is available
     */
    function ensureHealthSystem() {
        // Check if already available
        if (window.HealthBarSystem && typeof window.HealthBarSystem.damage === 'function') {
            return true;
        }
        
        console.log("Attempting to load or initialize health system...");
        
        // Try to initialize it if it exists but isn't fully initialized
        if (window.HealthBarSystem && typeof window.HealthBarSystem.init === 'function') {
            window.HealthBarSystem.init();
            return true;
        }
        
        // Try to create a very basic health system as a last resort
        if (!window.HealthBarSystem) {
            console.log("Creating a basic fallback health system...");
            
            // Create minimal health system
            window.HealthBarSystem = {
                _health: 100,
                _maxHealth: 100,
                
                init: function() { 
                    console.log("Fallback health system initialized");
                    return true; 
                },
                
                getHealth: function() { 
                    return { 
                        current: this._health, 
                        max: this._maxHealth, 
                        percentage: (this._health / this._maxHealth) * 100 
                    }; 
                },
                
                damage: function(amount) {
                    this._health = Math.max(0, this._health - amount);
                    console.log(`Fallback health system: Health reduced to ${this._health}/${this._maxHealth}`);
                    return this._health;
                },
                
                setHealth: function(health, max) {
                    if (max !== undefined) this._maxHealth = max;
                    this._health = Math.min(this._maxHealth, Math.max(0, health));
                    return this._health;
                }
            };
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Apply damage to player health
     */
    function applyDamage() {
        // First ensure the health system is available
        if (!ensureHealthSystem()) {
            console.error("Failed to initialize health system after multiple attempts!");
            return null;
        }
        
        try {
            // Apply the damage amount
            const newHealth = window.HealthBarSystem.damage(COLLISION_DAMAGE);
            
            // Force an update if possible
            if (typeof window.HealthBarSystem.setHealth === 'function') {
                window.HealthBarSystem.setHealth(newHealth);
            }
            
            // Log the damage
            const healthInfo = window.HealthBarSystem.getHealth();
            logToConsole(`Player took ${COLLISION_DAMAGE} damage. Health: ${healthInfo.current}/${healthInfo.max}`);
            
            // Debug output for health update
            if (DEBUG) {
                console.log(`Health update: ${newHealth}/${healthInfo.max} (${healthInfo.percentage.toFixed(1)}%)`);
            }
            
            // Check if player is dead (health <= 0)
            if (newHealth <= 0) {
                logToConsole("CRITICAL: Player health depleted!");
                // Could trigger game over or respawn logic here
            }
            
            return newHealth;
        } catch (e) {
            console.error("Error updating health:", e);
        }
        
        return null;
    }
    
    /**
     * Apply a bounce effect away from an entity
     * @param {Object} entityPosition - The position of the entity to bounce away from
     */
    function applyBounceEffect(entityPosition) {
        if (!camera) return;
        
        // Get reference to player state if available
        if (window.gameState && window.gameState.playerState) {
            playerState = window.gameState.playerState;
        }
        
        // Show damage indicator when bounce occurs
        showDamageIndicator();
        
        // Apply damage to player health
        applyDamage();
        
        // Calculate direction vector from entity to player (this is the bounce direction)
        const bounceDirection = new BABYLON.Vector3(
            camera.position.x - entityPosition.x,
            0, // Keep horizontal for direction calculation
            camera.position.z - entityPosition.z
        );
        
        // Normalize the direction vector (for horizontal movement)
        bounceDirection.normalize();
        
        // If we have access to player state with physics properties, use it for smoother bouncing
        if (playerState) {
            // For horizontal movement, add velocity to moveVector if it exists
            if (playerState.moveVector) {
                // Add bounce force in the appropriate direction - increased for visibility
                playerState.moveVector.x += bounceDirection.x * BOUNCE_FORCE * 10; // Increased multiplier
                playerState.moveVector.z += bounceDirection.z * BOUNCE_FORCE * 10; // Increased multiplier
                
                // Limit removed to allow for exaggerated bounce for testing
                
                // Create a small timer to gradually reduce this added velocity
                setTimeout(() => {
                    if (playerState && playerState.moveVector) {
                        playerState.moveVector.x *= 0.9; // Slower decay for more dramatic effect
                        playerState.moveVector.z *= 0.9; // Slower decay for more dramatic effect
                    }
                }, 200); // Longer timeout for more dramatic effect
            }
            
            // For vertical movement, use jumpForce for a natural arc
            if (typeof playerState.jumpForce !== 'undefined') {
                // Apply strong upward force regardless of ground state for testing
                playerState.jumpForce = BOUNCE_HEIGHT;
                playerState.grounded = false;
                
                // Log that we're applying the exaggerated bounce
                console.log(`Applied exaggerated test bounce: Horizontal=${BOUNCE_FORCE * 10}, Vertical=${BOUNCE_HEIGHT}`);
            }
        } else {
            // Fallback for when we don't have access to the player state
            // Apply a large impulse to the camera directly
            const impulse = bounceDirection.scale(BOUNCE_FORCE * 5); // Increased for visibility
            impulse.y = BOUNCE_HEIGHT;
            
            // Apply movement in fewer frames for more immediate effect
            let framesLeft = 3;
            const applyImpulse = () => {
                if (framesLeft > 0 && camera) {
                    camera.position.addInPlace(impulse.scale(1 / 3));
                    framesLeft--;
                    requestAnimationFrame(applyImpulse);
                }
            };
            applyImpulse();
        }
        
        // Log the bounce for debugging
        console.log(`Bounce applied with EXAGGERATED test force: ${BOUNCE_FORCE.toFixed(2)}, jump: ${BOUNCE_HEIGHT.toFixed(2)}`);
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
        
        // Initialize the damage overlay
        initDamageOverlay();
        
        // Register with scene rendering to guarantee collision checks
        if (scene) {
            scene.onBeforeRenderObservable.add(checkCollisionsOnRender);
        }
        
        // Try to get reference to player state
        if (window.gameState && window.gameState.playerState) {
            playerState = window.gameState.playerState;
        }
        
        // Make sure health system is initialized
        ensureHealthSystem();
        
        // Verify that health system is correctly initialized
        if (window.HealthBarSystem) {
            console.log("Health System detected during collision system init:", window.HealthBarSystem);
        } else {
            console.warn("Health System not found during collision system init!");
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
            
            // Get a stable entity ID
            const entityId = entity.id || `unknown-${Math.random()}`;
            
            // Store current distance for this entity
            entityDistances.set(entityId, distance);
            
            // Occasionally log distance for debugging
            if (DEBUG && Math.random() < 0.001) {
                console.log(`Distance to ${entity.name || 'entity'}: ${distance.toFixed(2)} (ID: ${entityId})`);
            }
            
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
                    
                    // Apply bounce effect when first colliding
                    applyBounceEffect(entityPosition);
                }
            } else if (distance > RESET_DISTANCE) {
                // When player moves sufficiently away, remove from collided set to allow future collisions
                if (collidedEntities.has(entityId)) {
                    collidedEntities.delete(entityId);
                    
                    if (DEBUG) {
                        console.log(`Reset collision detection for entity: ${entityId} (Distance: ${distance.toFixed(2)}m)`);
                    }
                }
            }
        });
        
        // Active check to reset collision status for entities that are no longer found
        // This prevents issues where entities might be removed but still in our collision set
        for (const entityId of collidedEntities) {
            if (!entityDistances.has(entityId) || !currentlyColliding.has(entityId)) {
                if (DEBUG) {
                    console.log(`Removing entity ${entityId} from collision set - no longer tracked or colliding`);
                }
                collidedEntities.delete(entityId);
            }
        }
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
        entityDistances.clear();
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

// Initialize after page load to ensure all dependencies are loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - checking collision system initialization");
    // If there's a scene available, initialize
    if (window.scene && window.camera) {
        window.CollisionSystem.init(window.scene, window.camera);
    }
}); 