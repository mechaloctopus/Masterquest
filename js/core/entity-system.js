// Entity System - A unified factory for creating game entities (NPCs, foes, and environmental objects)
/**
 * EntitySystem - Manages all entity types in the game world
 * 
 * Features:
 * - Centralized factory for creating NPCs, foes, and other entities
 * - Handles common entity functions (creation, animation, proximity detection)
 * - Manages entity collections by type and realm
 * - Provides specialized behaviors for different entity types
 * 
 * Usage:
 * - Use createNPC() to create NPCs with dialogue capabilities
 * - Use createFoe() to create foes with battle capabilities
 * - Use createEnvironmentObject() for non-interactive scenery
 */
window.EntitySystem = (function() {
    // CONSTANTS - "Sealed" configurations for entity components
    // These values are fixed and should not be changed to ensure consistent appearance
    const CONSTANTS = {
        NAMETAG: {
            CONTAINER: {
                WIDTH: "150px",
                HEIGHT: "60px",
                BACKGROUND: "transparent",
                LINK_OFFSET_Y: -60
            },
            TEXT: {
                FONT_SIZE: 16,
                FONT_FAMILY: "Orbitron",
                OUTLINE_WIDTH: 3,
                TOP: "5px",
                SHADOW_BLUR: 15,
                SHADOW_OFFSET_X: 0,
                SHADOW_OFFSET_Y: 0,
                COLORS: {
                    NPC: {
                        COLOR: "#00FFCC",
                        OUTLINE: "#009977",
                        SHADOW: "#00FFAA"
                    },
                    FOE: {
                        COLOR: "#FF5555",
                        OUTLINE: "#AA0000",
                        SHADOW: "#FF0000"
                    },
                    DEFAULT: {
                        COLOR: "#55FF55",
                        OUTLINE: "#00AA00",
                        SHADOW: "#00FF00"
                    }
                },
                MIN_SCALE: 0.7,
                DISTANCE_FACTOR: 100
            }
        },
        HEALTHBAR: {
            BACKGROUND: {
                WIDTH: "120px",
                HEIGHT: "10px",
                COLOR: "#444444",
                CORNER_RADIUS: 5,
                TOP: "-15px"
            },
            FILL: {
                HEIGHT: "8px",
                CORNER_RADIUS: 4,
                LEFT: "1px",
                WIDTH: 120,
                COLORS: {
                    GOOD: "#22FF22",    // Green (> 60%)
                    MEDIUM: "#FFFF22",  // Yellow (30-60%)
                    LOW: "#FF2222"      // Red (< 30%)
                }
            },
            TEXT: {
                FONT_SIZE: 10,
                FONT_FAMILY: "Orbitron",
                COLOR: "white",
                TOP: "-15px"
            }
        }
    };
    
    // Private properties
    const entities = {
        npcs: [],
        foes: [],
        environment: []
    };
    
    let initialized = false;
    let scene = null;
    
    // DOM elements
    let talkButton = null;
    let nearbyNPC = null;
    let currentFoe = null;
    
    // Entity type constants
    const ENTITY_TYPES = {
        NPC: 'npc',
        FOE: 'foe',
        ENVIRONMENT: 'environment'
    };
    
    // Helper function to safely log messages
    function safeLog(message, isError = false, system = 'ENTITY') {
        if (window.Utils && window.Utils.safeLog) {
            Utils.safeLog(message, isError, { system });
        } else {
            console.log(message);
            if (window.Logger) {
                if (isError) {
                    Logger.error(message);
                } else {
                    Logger.log(message);
                }
            }
        }
    }
    
    // Initialize the Entity system
    function init(sceneInstance) {
        if (window.Utils && window.Utils.initializeComponent) {
            return Utils.initializeComponent(
                EntitySystem, 
                "ENTITY SYSTEM", 
                () => {
                    console.log("Entity System init called with scene:", sceneInstance);
                    scene = sceneInstance;
                    
                    // Initialize event handlers
                    if (window.EventSystem) {
                        // Listen for player proximity
                        EventSystem.on('player.position', checkEntityProximity);
                        
                        // Listen for realm changes
                        EventSystem.on('realm.change', handleRealmChange);
                        
                        // Listen for quiz answers if applicable
                        EventSystem.on('quiz.answer', handleQuizAnswer);
                    }
                    
                    // Create talk button for NPC interactions
                    createTalkButton();
                    
                    // Setup action manager for entity clicks
                    if (scene) {
                        scene.actionManager = new BABYLON.ActionManager(scene);
                    }
                    
                    // Add one simple direct message to console to verify it's working
                    setTimeout(() => {
                        // Use direct approach for test message
                        const logContent = document.getElementById('logContent');
                        if (logContent) {
                            // Check if we've already added this message to avoid duplication
                            const existingMessages = logContent.querySelectorAll('[data-entity-system-init="true"]');
                            if (existingMessages.length === 0) {
                                const testMessage = document.createElement('div');
                                testMessage.className = 'log-message';
                                testMessage.setAttribute('data-entity-system-init', 'true');
                                
                                const textSpan = document.createElement('span');
                                textSpan.className = 'log-text';
                                textSpan.textContent = "ENTITY SYSTEM READY - CLICK ENTITIES TO INTERACT";
                                testMessage.appendChild(textSpan);
                                
                                logContent.appendChild(testMessage);
                                logContent.scrollTop = logContent.scrollHeight;
                            }
                        }
                    }, 2000);
                    
                    return true;
                },
                {
                    checkGlobalLogger: true
                }
            );
        } else {
            // Fallback initialization
            scene = sceneInstance;
            initialized = true;
            
            // Create talk button
            createTalkButton();
            
            // Setup action manager for entity clicks
            if (scene) {
                scene.actionManager = new BABYLON.ActionManager(scene);
            }
            
            // Add a simple test message to verify console works
            setTimeout(() => {
                const logContent = document.getElementById('logContent');
                if (logContent) {
                    // Check if we've already added this message to avoid duplication
                    const existingMessages = logContent.querySelectorAll('[data-entity-system-init="true"]');
                    if (existingMessages.length === 0) {
                        const testMessage = document.createElement('div');
                        testMessage.className = 'log-message';
                        testMessage.setAttribute('data-entity-system-init', 'true');
                        
                        const textSpan = document.createElement('span');
                        textSpan.className = 'log-text';
                        textSpan.textContent = "ENTITY SYSTEM READY - CLICK ENTITIES TO INTERACT";
                        testMessage.appendChild(textSpan);
                        
                        logContent.appendChild(testMessage);
                        logContent.scrollTop = logContent.scrollHeight;
                    }
                }
            }, 2000);
            
            // Initialize event handlers
            if (window.EventSystem) {
                EventSystem.on('player.position', checkEntityProximity);
                EventSystem.on('realm.change', handleRealmChange);
                EventSystem.on('quiz.answer', handleQuizAnswer);
            }
            
            safeLog("Entity System initialized");
            return true;
        }
    }
    
    // Create talk button for NPC interactions
    function createTalkButton() {
        // Remove existing button if any
        if (talkButton) {
            document.body.removeChild(talkButton);
        }
        
        // Create new button
        talkButton = document.createElement('button');
        talkButton.id = 'talkButton';
        talkButton.innerText = 'TALK';
        talkButton.className = 'game-button talk-button';
        talkButton.style.display = 'none';
        document.body.appendChild(talkButton);
        
        // Add event listener
        talkButton.addEventListener('click', handleTalkButtonClick);
    }
    
    // Load entities for a specific realm
    function loadEntitiesForRealm(realmIndex) {
        // Clear existing entities
        clearEntities();
        
        // Load NPCs for this realm
        loadNPCsForRealm(realmIndex);
        
        // Load foes for this realm
        loadFoesForRealm(realmIndex);
        
        // Load environmental objects for this realm (if applicable)
        // loadEnvironmentForRealm(realmIndex);
    }
    
    // Load NPCs for a specific realm
    function loadNPCsForRealm(realmIndex) {
        safeLog(`Loading NPCs for realm ${realmIndex}`);
        
        // Create 10 NPCs as requested, arranged in two rows
        for (let i = 0; i < 10; i++) {
            createNPC(i, realmIndex);
        }
    }
    
    // Load foes for a specific realm
    function loadFoesForRealm(realmIndex) {
        safeLog(`Loading foes for realm ${realmIndex}`);
        
        // Create 10 foes for this realm (5 in each row)
        for (let i = 0; i < 10; i++) {
            createFoe(i, realmIndex);
        }
    }
    
    // Create a visible NPC entity
    function createNPC(index, realmIndex, template = {}) {
        if (!scene) {
            safeLog("Cannot create NPC: Scene not initialized", true, 'NPC');
            return null;
        }
        
        // Create a blue orb for NPCs
        const size = template.size || 0.5;
        
        // Position NPCs in rows
        // First row: 5 NPCs side by side at z = 5
        // Second row: 5 NPCs side by side at z = 7
        const row = Math.floor(index / 5);
        const col = index % 5;
        const startX = -8; // Start position of the first NPC
        const spacingX = 4; // Space between NPCs in a row
        const positionZ = 5 + (row * 2); // First row at z=5, second row at z=7
        
        const position = template.position || new BABYLON.Vector3(
            startX + (col * spacingX),
            1,
            positionZ
        );
        
        // Create mesh for NPC
        const npcMesh = BABYLON.MeshBuilder.CreateSphere(
            `npc-${realmIndex}-${index}`,
            { diameter: size * 2 },
            scene
        );
        npcMesh.position = position;
        
        // Create blue material for NPC
        const npcMaterial = new BABYLON.StandardMaterial(`npcMaterial-${realmIndex}-${index}`, scene);
        npcMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1); // Blue
        npcMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 1);
        npcMaterial.emissiveColor = new BABYLON.Color3(0, 0.2, 0.5);
        npcMesh.material = npcMaterial;
        
        // Set health data
        npcMesh.metadata = {
            type: ENTITY_TYPES.NPC,
            currentHealth: template.currentHealth !== undefined ? template.currentHealth : 100,
            maxHealth: template.maxHealth !== undefined ? template.maxHealth : 100
        };
        
        // Add nametag
        const name = template.name || `NPC${index+1}`;
        addNametag(npcMesh, name);
        
        // Create NPC object
        const npc = {
            id: `npc-${realmIndex}-${index}`,
            name: name,
            mesh: npcMesh,
            type: ENTITY_TYPES.NPC,
            realmIndex: realmIndex,
            index: index,
            position: position,
            size: size,
            isHighlighted: false,
            currentHealth: npcMesh.metadata.currentHealth,
            maxHealth: npcMesh.metadata.maxHealth,
            interactionRange: template.interactionRange || 3,
            dialogOptions: template.dialogOptions || {
                greeting: "Hello adventurer!",
                options: [
                    { text: "What is this place?", response: "This is Realm " + realmIndex },
                    { text: "Who are you?", response: "I am " + name },
                    { text: "Goodbye", response: "Farewell!", isExit: true }
                ]
            }
        };
        
        // Add hover animation
        setupHoverAnimation(npc);
        
        // Add click handler to mesh
        setupClickHandler(npc);
        
        // Store NPC in array
        entities.npcs.push(npc);
        
        safeLog(`Created NPC: ${name} in realm ${realmIndex}`, false, 'NPC');
        return npc;
    }
    
    // Create a visible foe entity
    function createFoe(index, realmIndex, template = {}) {
        if (!scene) {
            safeLog("Cannot create foe: Scene not initialized", true, 'FOE');
            return null;
        }
        
        // Create a red orb for foes
        const size = template.size || 0.5;
        
        // Position foes in rows
        // First row: 5 foes side by side at z = -5
        // Second row: 5 foes side by side at z = -7
        const row = Math.floor(index / 5);
        const col = index % 5;
        const startX = -8; // Start position of the first foe
        const spacingX = 4; // Space between foes in a row
        const positionZ = -5 - (row * 2); // First row at z=-5, second row at z=-7
        
        const position = template.position || new BABYLON.Vector3(
            startX + (col * spacingX),
            1,
            positionZ
        );
        
        // Create mesh for foe
        const foeMesh = BABYLON.MeshBuilder.CreateSphere(
            `foe-${realmIndex}-${index}`,
            { diameter: size * 2 },
            scene
        );
        foeMesh.position = position;
        
        // Create red material for foe
        const foeMaterial = new BABYLON.StandardMaterial(`foeMaterial-${realmIndex}-${index}`, scene);
        foeMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
        foeMaterial.specularColor = new BABYLON.Color3(1, 0.5, 0.5);
        foeMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        foeMesh.material = foeMaterial;
        
        // Set health data
        foeMesh.metadata = {
            type: ENTITY_TYPES.FOE,
            currentHealth: template.currentHealth !== undefined ? template.currentHealth : 100,
            maxHealth: template.maxHealth !== undefined ? template.maxHealth : 100
        };
        
        // Add nametag
        const name = template.name || `Foe${index+1}`;
        addNametag(foeMesh, name);
        
        // Generate quiz questions for this foe
        const quizQuestions = template.quizQuestions || generateQuizQuestions(index, realmIndex);
        
        // Create foe object
        const foe = {
            id: `foe-${realmIndex}-${index}`,
            name: name,
            mesh: foeMesh,
            type: ENTITY_TYPES.FOE,
            realmIndex: realmIndex,
            index: index,
            position: position,
            size: size,
            isHighlighted: false,
            currentHealth: foeMesh.metadata.currentHealth,
            maxHealth: foeMesh.metadata.maxHealth,
            interactionRange: template.interactionRange || 3,
            quizQuestions: quizQuestions,
            defeated: false
        };
        
        // Add hover animation
        setupHoverAnimation(foe);
        
        // Add click handler to mesh
        setupClickHandler(foe);
        
        // Store foe in array
        entities.foes.push(foe);
        
        safeLog(`Created foe: ${name} in realm ${realmIndex}`, false, 'FOE');
        return foe;
    }
    
    // Generate quiz questions for a foe
    function generateQuizQuestions(foeIndex, realmIndex) {
        return [
            {
                question: `What is the sum of ${realmIndex} and ${foeIndex}?`,
                options: [`${realmIndex + foeIndex - 1}`, `${realmIndex + foeIndex}`, `${realmIndex + foeIndex + 1}`, `${realmIndex * foeIndex}`],
                correctAnswer: 1
            },
            {
                question: 'Which key is typically used to jump in games?',
                options: ['A', 'W', 'Space', 'Shift'],
                correctAnswer: 2
            }
        ];
    }
    
    // Setup hover animation for entity
    function setupHoverAnimation(entity) {
        if (!scene) return;
        
        // Create animation for bobbing up and down
        const amplitude = 0.1;
        const speed = 0.005;
        
        // Store original Y position
        const originalY = entity.mesh.position.y;
        
        // Create animation
        scene.registerBeforeRender(() => {
            if (entity.mesh) {
                const time = performance.now() * speed;
                entity.mesh.position.y = originalY + Math.sin(time) * amplitude;
            }
        });
    }
    
    // Add nametag to an entity
    function addNametag(mesh, name) {
        // Create a Babylon GUI AdvancedDynamicTexture for the nametag
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            `nametagUI-${mesh.name}`,
            true,
            scene
        );
        
        // Create container to link to the 3D position
        const container = new BABYLON.GUI.Container();
        container.width = CONSTANTS.NAMETAG.CONTAINER.WIDTH;
        container.height = CONSTANTS.NAMETAG.CONTAINER.HEIGHT;
        container.background = CONSTANTS.NAMETAG.CONTAINER.BACKGROUND;
        
        // Create health bar if entity has health data
        if (mesh.metadata && (mesh.metadata.currentHealth !== undefined && mesh.metadata.maxHealth !== undefined)) {
            // Create health bar background (gray)
            const healthBarBackground = new BABYLON.GUI.Rectangle();
            healthBarBackground.width = CONSTANTS.HEALTHBAR.BACKGROUND.WIDTH;
            healthBarBackground.height = CONSTANTS.HEALTHBAR.BACKGROUND.HEIGHT;
            healthBarBackground.background = CONSTANTS.HEALTHBAR.BACKGROUND.COLOR;
            healthBarBackground.color = CONSTANTS.HEALTHBAR.BACKGROUND.COLOR;
            healthBarBackground.cornerRadius = CONSTANTS.HEALTHBAR.BACKGROUND.CORNER_RADIUS;
            healthBarBackground.top = CONSTANTS.HEALTHBAR.BACKGROUND.TOP;
            
            // Create health bar fill (green)
            const healthBarFill = new BABYLON.GUI.Rectangle();
            healthBarFill.width = (mesh.metadata.currentHealth / mesh.metadata.maxHealth) * CONSTANTS.HEALTHBAR.FILL.WIDTH + "px";
            healthBarFill.height = CONSTANTS.HEALTHBAR.FILL.HEIGHT;
            healthBarFill.background = CONSTANTS.HEALTHBAR.FILL.COLORS.GOOD;
            healthBarFill.color = CONSTANTS.HEALTHBAR.FILL.COLORS.GOOD;
            healthBarFill.cornerRadius = CONSTANTS.HEALTHBAR.FILL.CORNER_RADIUS;
            healthBarFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            healthBarFill.left = CONSTANTS.HEALTHBAR.FILL.LEFT;
            
            // Create health text
            const healthText = new BABYLON.GUI.TextBlock();
            healthText.text = `${mesh.metadata.currentHealth}/${mesh.metadata.maxHealth} HP`;
            healthText.fontSize = CONSTANTS.HEALTHBAR.TEXT.FONT_SIZE;
            healthText.fontFamily = CONSTANTS.HEALTHBAR.TEXT.FONT_FAMILY;
            healthText.color = CONSTANTS.HEALTHBAR.TEXT.COLOR;
            healthText.top = CONSTANTS.HEALTHBAR.TEXT.TOP;
            
            // Add health elements to container
            healthBarBackground.addControl(healthBarFill);
            container.addControl(healthBarBackground);
            container.addControl(healthText);
            
            // Store references for updating
            mesh.healthBar = {
                background: healthBarBackground,
                fill: healthBarFill,
                text: healthText
            };
        }
        
        // Create text block for the nametag - simplify to just show the name without entity type
        const entityType = mesh.metadata && mesh.metadata.type ? mesh.metadata.type : "";
        
        const nameText = new BABYLON.GUI.TextBlock();
        nameText.text = name; // Just display the name without brackets or entity type
        nameText.fontSize = CONSTANTS.NAMETAG.TEXT.FONT_SIZE;
        nameText.fontFamily = CONSTANTS.NAMETAG.TEXT.FONT_FAMILY;
        nameText.outlineWidth = CONSTANTS.NAMETAG.TEXT.OUTLINE_WIDTH;
        nameText.top = CONSTANTS.NAMETAG.TEXT.TOP;
        
        // Enhanced glow effect
        nameText.shadowBlur = CONSTANTS.NAMETAG.TEXT.SHADOW_BLUR;
        nameText.shadowOffsetX = CONSTANTS.NAMETAG.TEXT.SHADOW_OFFSET_X;
        nameText.shadowOffsetY = CONSTANTS.NAMETAG.TEXT.SHADOW_OFFSET_Y;
        
        // Choose color based on entity type
        if (entityType.toLowerCase().includes('npc')) {
            // Cyan/teal for NPCs
            nameText.color = CONSTANTS.NAMETAG.TEXT.COLORS.NPC.COLOR;
            nameText.outlineColor = CONSTANTS.NAMETAG.TEXT.COLORS.NPC.OUTLINE;
            nameText.shadowColor = CONSTANTS.NAMETAG.TEXT.COLORS.NPC.SHADOW;
        } else if (entityType.toLowerCase().includes('foe')) {
            // Red for foes
            nameText.color = CONSTANTS.NAMETAG.TEXT.COLORS.FOE.COLOR;
            nameText.outlineColor = CONSTANTS.NAMETAG.TEXT.COLORS.FOE.OUTLINE;
            nameText.shadowColor = CONSTANTS.NAMETAG.TEXT.COLORS.FOE.SHADOW;
        } else {
            // Default neon green
            nameText.color = CONSTANTS.NAMETAG.TEXT.COLORS.DEFAULT.COLOR;
            nameText.outlineColor = CONSTANTS.NAMETAG.TEXT.COLORS.DEFAULT.OUTLINE;
            nameText.shadowColor = CONSTANTS.NAMETAG.TEXT.COLORS.DEFAULT.SHADOW;
        }
        
        // Add text to container
        container.addControl(nameText);
        advancedTexture.addControl(container);
        
        // Link the container to the mesh using a better positioning approach
        container.linkWithMesh(mesh);
        
        // Position above the entity with a smaller offset
        container.linkOffsetY = CONSTANTS.NAMETAG.CONTAINER.LINK_OFFSET_Y;
        
        // Set scaling options to keep text readable at any distance
        // This uses a different approach that should be more compatible
        container.ignoreAdaptivePositioning = true;
        
        // Adjust additional positioning options
        container.transformCenterY = 1.0;
        
        // Store a reference to the scene's onBeforeRenderObservable
        // This will help us adjust the positioning if needed
        const observer = scene.onBeforeRenderObservable.add(() => {
            // If the mesh is too far away, hide the nametag
            if (mesh && scene.activeCamera) {
                const distance = BABYLON.Vector3.Distance(
                    mesh.position,
                    scene.activeCamera.position
                );
                
                // Show/hide based on distance
                container.alpha = distance > 50 ? 0 : 1;
                
                // Adjust size slightly based on distance for better readability
                // But keep a minimum size to avoid text becoming too small
                const scale = Math.max(CONSTANTS.NAMETAG.TEXT.MIN_SCALE, 1 - (distance / CONSTANTS.NAMETAG.TEXT.DISTANCE_FACTOR));
                nameText.fontSize = CONSTANTS.NAMETAG.TEXT.FONT_SIZE * scale;
                
                // Update health bar if it exists and health changed
                if (mesh.healthBar && mesh.metadata) {
                    const healthPercentage = mesh.metadata.currentHealth / mesh.metadata.maxHealth;
                    mesh.healthBar.fill.width = healthPercentage * CONSTANTS.HEALTHBAR.FILL.WIDTH + "px";
                    mesh.healthBar.text.text = `${mesh.metadata.currentHealth}/${mesh.metadata.maxHealth} HP`;
                    
                    // Change color based on health percentage
                    if (healthPercentage > 0.6) {
                        mesh.healthBar.fill.background = CONSTANTS.HEALTHBAR.FILL.COLORS.GOOD;
                    } else if (healthPercentage > 0.3) {
                        mesh.healthBar.fill.background = CONSTANTS.HEALTHBAR.FILL.COLORS.MEDIUM;
                    } else {
                        mesh.healthBar.fill.background = CONSTANTS.HEALTHBAR.FILL.COLORS.LOW;
                    }
                }
            }
        });
        
        // Store a reference to allow removal later
        mesh.nametag = {
            container: container,
            texture: advancedTexture,
            observer: observer
        };
        
        return mesh.nametag;
    }
    
    // Setup click handler for entity
    function setupClickHandler(entity) {
        if (!entity || !entity.mesh || !scene) return;
        
        // Create action manager if not exists
        if (!entity.mesh.actionManager) {
            entity.mesh.actionManager = new BABYLON.ActionManager(scene);
        }
        
        // Add click action (just one!)
        entity.mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function() {
                    // Create the message
                    const entityType = entity.type === ENTITY_TYPES.NPC ? 'NPC' : 'FOE';
                    const message = `${entityType} clicked: Hello, I am ${entity.name}`;
                    
                    // DIRECT APPROACH: Add message directly to the on-screen console
                    const logContent = document.getElementById('logContent');
                    if (logContent) {
                        // Make sure the log is visible
                        const logElement = document.getElementById('log');
                        if (logElement && logElement.classList.contains('collapsed')) {
                            logElement.classList.remove('collapsed');
                            const logToggle = document.getElementById('logToggle');
                            if (logToggle) {
                                logToggle.textContent = '▼';
                            }
                        }
                        
                        // Create message element
                        const messageElement = document.createElement('div');
                        messageElement.className = 'log-message';
                        messageElement.setAttribute('data-entity-message', 'true'); // Mark this as our entity message
                        
                        // Create text span
                        const textSpan = document.createElement('span');
                        textSpan.className = 'log-text';
                        textSpan.textContent = message;
                        messageElement.appendChild(textSpan);
                        
                        // Add to log
                        logContent.appendChild(messageElement);
                        
                        // Scroll to bottom
                        logContent.scrollTop = logContent.scrollHeight;
                    }
                    
                    // IMPORTANT: Don't use Logger system to avoid double messages
                    // Instead continue with entity interaction directly
                    
                    // If it's an NPC, start interaction WITHOUT triggering another console message
                    if (entity.type === ENTITY_TYPES.NPC) {
                        // We're calling startInteraction but prevent it from logging again
                        const wasLogging = window.Logger ? true : false;
                        const origLogger = window.Logger;
                        window.Logger = null; // Temporarily disable logger
                        
                        startInteraction(entity.id);
                        
                        // Restore logger
                        if (wasLogging) {
                            window.Logger = origLogger;
                        }
                    } else if (entity.type === ENTITY_TYPES.FOE && !entity.defeated) {
                        // Same approach for foes - prevent double logging
                        const wasLogging = window.Logger ? true : false;
                        const origLogger = window.Logger;
                        window.Logger = null; // Temporarily disable logger
                        
                        startBattle(entity.id);
                        
                        // Restore logger
                        if (wasLogging) {
                            window.Logger = origLogger;
                        }
                    }
                }
            )
        );
    }
    
    // Clear all entities
    function clearEntities() {
        // Clear NPCs
        entities.npcs.forEach(npc => {
            if (npc.mesh) {
                // Clean up nametag if it exists
                if (npc.mesh.nametag) {
                    // Remove observer first
                    if (npc.mesh.nametag.observer) {
                        scene.onBeforeRenderObservable.remove(npc.mesh.nametag.observer);
                    }
                    npc.mesh.nametag.container.dispose();
                    npc.mesh.nametag.texture.dispose();
                }
                npc.mesh.dispose();
            }
        });
        entities.npcs = [];
        
        // Clear foes
        entities.foes.forEach(foe => {
            if (foe.mesh) {
                // Clean up nametag if it exists
                if (foe.mesh.nametag) {
                    // Remove observer first
                    if (foe.mesh.nametag.observer) {
                        scene.onBeforeRenderObservable.remove(foe.mesh.nametag.observer);
                    }
                    foe.mesh.nametag.container.dispose();
                    foe.mesh.nametag.texture.dispose();
                }
                foe.mesh.dispose();
            }
        });
        entities.foes = [];
        
        // Clear environmental objects
        entities.environment.forEach(obj => {
            if (obj.mesh) {
                // Clean up nametag if it exists
                if (obj.mesh.nametag) {
                    // Remove observer first
                    if (obj.mesh.nametag.observer) {
                        scene.onBeforeRenderObservable.remove(obj.mesh.nametag.observer);
                    }
                    obj.mesh.nametag.container.dispose();
                    obj.mesh.nametag.texture.dispose();
                }
                obj.mesh.dispose();
            }
        });
        entities.environment = [];
        
        // Hide talk button
        if (talkButton) {
            talkButton.style.display = 'none';
        }
        
        nearbyNPC = null;
        currentFoe = null;
    }
    
    // Check proximity to all entities
    function checkEntityProximity(playerData) {
        if (!playerData || !playerData.position) return;
        
        const playerPosition = new BABYLON.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        
        // Check NPC proximity
        checkNPCProximity(playerPosition);
        
        // Check foe proximity
        checkFoeProximity(playerPosition);
    }
    
    // Check proximity to NPCs
    function checkNPCProximity(playerPosition) {
        // Default proximity threshold
        const proximityThreshold = 3;
        let foundNearbyNPC = null;
        
        // Check each NPC
        entities.npcs.forEach(npc => {
            if (!npc.mesh) return;
            
            const distance = BABYLON.Vector3.Distance(
                playerPosition,
                npc.mesh.position
            );
            
            // Within threshold - highlight NPC
            if (distance <= proximityThreshold) {
                highlightEntity(npc, true);
                
                // Store the closest NPC
                if (!foundNearbyNPC || distance < BABYLON.Vector3.Distance(playerPosition, foundNearbyNPC.mesh.position)) {
                    foundNearbyNPC = npc;
                }
            } else {
                highlightEntity(npc, false);
            }
        });
        
        // Update nearby NPC and show/hide talk button
        if (foundNearbyNPC) {
            nearbyNPC = foundNearbyNPC.id;
            showTalkButton();
        } else {
            nearbyNPC = null;
            hideTalkButton();
        }
    }
    
    // Check proximity to foes
    function checkFoeProximity(playerPosition) {
        // Default proximity threshold
        const proximityThreshold = 3;
        
        // Check each foe
        entities.foes.forEach(foe => {
            if (!foe.mesh || foe.defeated) return;
            
            const distance = BABYLON.Vector3.Distance(
                playerPosition,
                foe.mesh.position
            );
            
            // Within threshold - highlight foe
            if (distance <= proximityThreshold) {
                highlightEntity(foe, true);
                
                // If player is close enough, automatically start battle
                // This can be adjusted as needed
                if (distance <= 1.5) {
                    startBattle(foe.id);
                }
            } else {
                highlightEntity(foe, false);
            }
        });
    }
    
    // Show talk button for NPC interaction
    function showTalkButton() {
        if (!talkButton) return;
        talkButton.style.display = 'block';
    }
    
    // Hide talk button
    function hideTalkButton() {
        if (!talkButton) return;
        talkButton.style.display = 'none';
    }
    
    // Handle talk button click
    function handleTalkButtonClick() {
        if (!nearbyNPC) return;
        startInteraction(nearbyNPC);
    }
    
    // Handle realm change
    function handleRealmChange(data) {
        if (!data || typeof data.realmIndex !== 'number') return;
        
        safeLog(`Handling realm change to ${data.realmIndex}`);
        loadEntitiesForRealm(data.realmIndex);
    }
    
    // Highlight an entity
    function highlightEntity(entity, highlight) {
        if (!entity || !entity.mesh || entity.isHighlighted === highlight) return;
        
        entity.isHighlighted = highlight;
        
        // Use utility function if available
        if (window.Utils && window.Utils.setupHighlight) {
            Utils.setupHighlight(entity.mesh, highlight, {
                type: entity.type,
                outlineWidth: 0.03,
                scaleMultiplier: 1.05,
                pulseIntensity: 0.1
            });
            return;
        }
        
        // Fallback highlight implementation
        if (highlight) {
            entity.mesh.renderOutline = true;
            entity.mesh.outlineWidth = 0.03;
            entity.mesh.outlineColor = entity.type === ENTITY_TYPES.NPC ? 
                new BABYLON.Color3(0, 0.7, 1) : 
                new BABYLON.Color3(1, 0, 0);
        } else {
            entity.mesh.renderOutline = false;
        }
    }
    
    // Start interaction with an NPC
    function startInteraction(npcId) {
        const npc = getNPC(npcId);
        if (!npc) return;
        
        safeLog(`Starting interaction with NPC: ${npc.name}`, false, 'NPC');
        
        // Hide talk button during interaction
        hideTalkButton();
        
        // Check if dialogue system exists
        if (window.DialogueSystem) {
            DialogueSystem.startDialogue(npc.id, npc.name, npc.dialogOptions);
        } else {
            safeLog("DialogueSystem not found, cannot start interaction", true, 'NPC');
            // Re-show talk button if dialogue fails
            showTalkButton();
        }
    }
    
    // End interaction with an NPC
    function endInteraction(npcId) {
        const npc = getNPC(npcId);
        if (!npc) return;
        
        safeLog(`Ending interaction with NPC: ${npc.name}`, false, 'NPC');
        
        // Check if NPC is still nearby to show talk button again
        if (nearbyNPC === npcId) {
            showTalkButton();
        }
    }
    
    // Start battle with a foe
    function startBattle(foeId) {
        const foe = getFoe(foeId);
        if (!foe || foe.defeated || currentFoe === foeId) return;
        
        safeLog(`Starting battle with foe: ${foe.name}`, false, 'FOE');
        currentFoe = foeId;
        
        // Check if quiz system exists
        if (window.QuizSystem) {
            QuizSystem.startQuiz(foe.id, foe.name, foe.quizQuestions);
        } else {
            safeLog("Creating simple quiz UI for foe battle", false, 'FOE');
            createSimpleQuizUI(foe);
        }
    }
    
    // End battle with a foe
    function endBattle(foeId, playerWon) {
        const foe = getFoe(foeId);
        if (!foe) return;
        
        safeLog(`Ending battle with foe: ${foe.name}, player ${playerWon ? 'won' : 'lost'}`, false, 'FOE');
        currentFoe = null;
        
        if (playerWon) {
            // Mark foe as defeated
            foe.defeated = true;
            
            // Visual indication of defeat (e.g., fade out)
            if (foe.mesh) {
                const fadeMaterial = foe.mesh.material.clone(`fadeMaterial-${foe.id}`);
                foe.mesh.material = fadeMaterial;
                
                // Animate opacity
                scene.registerBeforeRender(() => {
                    if (fadeMaterial.alpha > 0.1) {
                        fadeMaterial.alpha -= 0.01;
                    } else {
                        // Remove foe mesh when fully transparent
                        foe.mesh.dispose();
                        foe.mesh = null;
                        scene.unregisterBeforeRender();
                    }
                });
            }
            
            // Trigger event for rewards, etc.
            if (window.EventSystem) {
                EventSystem.emit('foe.defeated', { foeId, realmIndex: foe.realmIndex });
            }
        }
    }
    
    // Handle quiz answer
    function handleQuizAnswer(data) {
        if (!data || !data.foeId || !data.isCorrect) return;
        
        const foe = getFoe(data.foeId);
        if (!foe) return;
        
        if (data.isCorrect) {
            safeLog(`Correct answer for foe: ${foe.name}`, false, 'FOE');
            endBattle(foe.id, true);
        } else {
            safeLog(`Incorrect answer for foe: ${foe.name}`, false, 'FOE');
            // Handle incorrect answer (e.g., give another chance or end battle)
        }
    }
    
    // Create a simple quiz UI for foe battles
    function createSimpleQuizUI(foe) {
        // Create container
        const quizContainer = document.createElement('div');
        quizContainer.className = 'quiz-container';
        quizContainer.id = `quiz-${foe.id}`;
        document.body.appendChild(quizContainer);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'quiz-header';
        header.textContent = `Battle with ${foe.name}`;
        quizContainer.appendChild(header);
        
        // Get random question
        const questionIndex = Math.floor(Math.random() * foe.quizQuestions.length);
        const question = foe.quizQuestions[questionIndex];
        
        // Create question text
        const questionText = document.createElement('div');
        questionText.className = 'quiz-question';
        questionText.textContent = question.question;
        quizContainer.appendChild(questionText);
        
        // Create answer buttons
        const answerContainer = document.createElement('div');
        answerContainer.className = 'quiz-answers';
        quizContainer.appendChild(answerContainer);
        
        // Add options
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-answer-btn';
            button.textContent = option;
            button.addEventListener('click', () => {
                // Handle answer
                const isCorrect = index === question.correctAnswer;
                
                // Show result
                button.className = `quiz-answer-btn ${isCorrect ? 'correct' : 'incorrect'}`;
                
                // Disable all buttons
                document.querySelectorAll('.quiz-answer-btn').forEach(btn => {
                    btn.disabled = true;
                });
                
                // Handle quiz result after delay
                setTimeout(() => {
                    // Remove quiz UI
                    quizContainer.remove();
                    
                    // End battle
                    handleQuizAnswer({
                        foeId: foe.id,
                        isCorrect: isCorrect
                    });
                }, 1500);
            });
            answerContainer.appendChild(button);
        });
    }
    
    // Get an NPC by ID
    function getNPC(npcId) {
        return entities.npcs.find(npc => npc.id === npcId);
    }
    
    // Get a foe by ID
    function getFoe(foeId) {
        return entities.foes.find(foe => foe.id === foeId);
    }
    
    // Get all NPCs
    function getAllNPCs() {
        return entities.npcs;
    }
    
    // Get all foes
    function getAllFoes() {
        return entities.foes;
    }
    
    // Public API
    return {
        // Core functions
        init,
        loadEntitiesForRealm,
        
        // NPC functions
        createNPC,
        loadNPCsForRealm,
        startInteraction,
        endInteraction,
        getNPC,
        getAllNPCs,
        
        // Foe functions
        createFoe,
        loadFoesForRealm,
        startBattle,
        endBattle,
        getFoe,
        getAllFoes,
        
        // Environment functions
        // createEnvironmentObject,
        
        // Common functions
        clearEntities,
        
        // For debugging
        entities,
        setupClickHandler
    };
})(); 