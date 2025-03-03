// NPC System - Handles NPCs for all realms
const NPCSystem = (function() {
    // Private properties
    const npcs = [];
    let initialized = false;
    let scene = null;
    
    // Initialize the NPC system
    function init(sceneInstance) {
        if (initialized) {
            Logger.warning("NPC System already initialized");
            return;
        }
        
        try {
            scene = sceneInstance;
            initialized = true;
            
            Logger.log("> NPC SYSTEM INITIALIZED");
            
            // Initialize event handlers
            if (window.EventSystem) {
                // Listen for player proximity
                EventSystem.on('player.position', checkNPCProximity);
                
                // Listen for realm changes
                EventSystem.on('realm.change', handleRealmChange);
            }
            
            return true;
        } catch (e) {
            Logger.error(`NPC System initialization failed: ${e.message}`);
            return false;
        }
    }
    
    // Load NPCs for a specific realm
    function loadNPCsForRealm(realmIndex) {
        if (!initialized) {
            Logger.error("Cannot load NPCs - system not initialized");
            return false;
        }
        
        try {
            Logger.log(`> LOADING NPCS FOR REALM ${realmIndex}`);
            
            // Clear existing NPCs
            clearAllNPCs();
            
            // Get realm configuration
            const realmConfig = CONFIG.REALMS[`REALM_${realmIndex}`];
            if (!realmConfig) {
                Logger.error(`Realm configuration for realm ${realmIndex} not found`);
                return false;
            }
            
            // Get NPC count from common config or realm-specific override
            const npcCount = realmConfig.NPC_COUNT || CONFIG.REALMS.COMMON.NPC_COUNT || 10;
            
            // Get NPC template
            const npcTemplate = CONFIG.REALMS.COMMON.NPC_TEMPLATES.DIALOGUE;
            
            // Create NPCs for this realm
            for (let i = 0; i < npcCount; i++) {
                createNPC(i, realmIndex, npcTemplate);
            }
            
            Logger.log(`> ${npcs.length} NPCS CREATED FOR REALM ${realmIndex}`);
            return true;
        } catch (e) {
            Logger.error(`Failed to load NPCs for realm ${realmIndex}: ${e.message}`);
            return false;
        }
    }
    
    // Create a single NPC
    function createNPC(index, realmIndex, template) {
        // Generate a unique ID for this NPC
        const npcId = `npc_${realmIndex}_${index}`;
        
        // Use template position if available, otherwise use random position
        const position = template.POSITION ? 
            new BABYLON.Vector3(template.POSITION.x, template.POSITION.y, template.POSITION.z) :
            new BABYLON.Vector3(
                Math.random() * 40 - 20, // -20 to 20
                1.8,                      // Floating at eye level
                Math.random() * 40 - 20   // -20 to 20
            );
        
        // Create NPC mesh based on template
        let npcMesh;
        
        // Default to neon_orb type if not specified
        const npcType = template.TYPE || "neon_orb";
        
        if (npcType === "neon_orb") {
            // Create a neon orb
            npcMesh = BABYLON.MeshBuilder.CreateSphere(npcId, {
                diameter: template.SCALE || 1.0
            }, scene);
            
            // Create material for the orb
            const material = new BABYLON.StandardMaterial(`${npcId}_material`, scene);
            material.emissiveColor = new BABYLON.Color3.FromHexString(template.COLOR || "#00ffff");
            material.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
            
            // Add glow layer if not already added
            let glowLayer = scene.getGlowLayerByName("npcGlowLayer");
            if (!glowLayer) {
                glowLayer = new BABYLON.GlowLayer("npcGlowLayer", scene);
                glowLayer.intensity = 1.0; // Increase intensity
            }
            glowLayer.addIncludedOnlyMesh(npcMesh);
            
            // Make the orb more visible
            material.diffuseColor = new BABYLON.Color3.FromHexString(template.COLOR || "#00ffff");
            material.emissiveColor = new BABYLON.Color3.FromHexString(template.COLOR || "#00ffff");
            material.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
            npcMesh.material = material;
        } else {
            // Default simple box as fallback
            npcMesh = BABYLON.MeshBuilder.CreateBox(npcId, {
                width: template.SCALE || 1.0,
                height: template.SCALE || 1.0, 
                depth: template.SCALE || 1.0
            }, scene);
            
            // Apply a default material
            const material = new BABYLON.StandardMaterial(`${npcId}_material`, scene);
            material.diffuseColor = new BABYLON.Color3.FromHexString(template.COLOR || "#00ffff");
            npcMesh.material = material;
        }
        
        // Position the NPC
        npcMesh.position = position;
        
        // Make NPC pickable (clickable)
        npcMesh.isPickable = true;
        
        // Add action manager for interactions
        npcMesh.actionManager = new BABYLON.ActionManager(scene);
        
        // Add click interaction
        npcMesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function() {
                    startInteraction(npcId);
                }
            )
        );
        
        // Store the NPC data
        const npc = {
            id: npcId,
            mesh: npcMesh,
            realmIndex: realmIndex,
            template: template,
            position: position,
            dialogueData: template.DIALOGUE || {
                // Default dialogue if none provided in template
                greetings: [template.NAME ? `Hello, I am ${template.NAME}` : "Hello, traveler!"],
                conversations: [
                    { 
                        id: "intro",
                        text: "I am an NPC in this digital realm.",
                        responses: [
                            { id: "ask_more", text: "Tell me more about yourself" },
                            { id: "goodbye", text: "Goodbye" }
                        ]
                    }
                ]
            },
            isInteracting: false,
            hoverParams: {
                originalY: position.y,
                phase: Math.random() * Math.PI * 2 // Random starting phase
            }
        };
        
        // Add to the NPCs array
        npcs.push(npc);
        
        // Setup hovering animation
        setupHoverAnimation(npc);
        
        return npc;
    }
    
    // Setup the hovering animation for an NPC
    function setupHoverAnimation(npc) {
        if (!scene) return;
        
        const hoverHeight = npc.template.HOVER_HEIGHT || 0.5;
        const hoverSpeed = npc.template.HOVER_SPEED || 0.3;
        
        // Register an animation to run before each render
        scene.registerBeforeRender(() => {
            if (npc && npc.mesh) {
                // Update hover phase
                npc.hoverParams.phase += hoverSpeed * scene.getAnimationRatio() * 0.01;
                
                // Calculate new Y position with sine wave
                const newY = npc.hoverParams.originalY + Math.sin(npc.hoverParams.phase) * hoverHeight;
                
                // Apply new position
                npc.mesh.position.y = newY;
                
                // Slowly rotate the NPC
                npc.mesh.rotation.y += 0.002 * scene.getAnimationRatio();
            }
        });
    }
    
    // Clear all NPCs from the scene
    function clearAllNPCs() {
        // Remove each NPC mesh from the scene
        npcs.forEach(npc => {
            if (npc.mesh) {
                npc.mesh.dispose();
            }
        });
        
        // Clear the array
        npcs.length = 0;
    }
    
    // Check player proximity to NPCs
    function checkNPCProximity(playerData) {
        if (!playerData || !playerData.position) return;
        
        const playerPos = new BABYLON.Vector3(
            playerData.position.x,
            0, // Use ground Y for distance check
            playerData.position.z
        );
        
        // Check each NPC
        npcs.forEach(npc => {
            if (!npc.mesh) return;
            
            // Calculate distance
            const npcPos = npc.mesh.position;
            const distance = BABYLON.Vector3.Distance(
                playerPos,
                new BABYLON.Vector3(npcPos.x, 0, npcPos.z) // Ignore Y for distance
            );
            
            // Close enough to interact (3 units)
            if (distance < 3) {
                if (!npc.isNearby) {
                    // Player just came into range
                    npc.isNearby = true;
                    
                    // Emit event that player is near NPC
                    if (window.EventSystem) {
                        EventSystem.emit('npc.playerNearby', {
                            npcId: npc.id,
                            distance: distance
                        });
                    }
                    
                    // Visual indication that interaction is possible
                    highlightNPC(npc, true);
                }
            } else if (npc.isNearby) {
                // Player moved away
                npc.isNearby = false;
                
                // Remove highlight
                highlightNPC(npc, false);
                
                // If was interacting, end interaction
                if (npc.isInteracting) {
                    endInteraction(npc.id);
                }
            }
        });
    }
    
    // Handle realm change event
    function handleRealmChange(data) {
        if (!data || !data.realmIndex) return;
        
        // Clear current NPCs
        clearAllNPCs();
        
        // Load NPCs for the new realm
        loadNPCsForRealm(data.realmIndex);
    }
    
    // Highlight or unhighlight an NPC
    function highlightNPC(npc, highlight) {
        if (!npc || !npc.mesh || !npc.mesh.material) return;
        
        if (highlight) {
            // Store original emission color
            if (!npc.originalEmissive) {
                npc.originalEmissive = npc.mesh.material.emissiveColor ? 
                    npc.mesh.material.emissiveColor.clone() : 
                    new BABYLON.Color3(0, 0, 0);
            }
            
            // Increase emission for highlight
            npc.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            
            // Scale up slightly
            npc.mesh.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
        } else {
            // Restore original emission
            if (npc.originalEmissive) {
                npc.mesh.material.emissiveColor = npc.originalEmissive;
            }
            
            // Restore original scale
            npc.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        }
    }
    
    // Start interaction with an NPC
    function startInteraction(npcId) {
        const npc = npcs.find(n => n.id === npcId);
        if (!npc) return;
        
        npc.isInteracting = true;
        
        // Emit event to UI system to show dialogue
        if (window.EventSystem) {
            EventSystem.emit('dialogue.start', {
                npcId: npc.id,
                dialogueData: npc.dialogueData
            });
        }
        
        return npc.dialogueData;
    }
    
    // End interaction with an NPC
    function endInteraction(npcId) {
        const npc = npcs.find(n => n.id === npcId);
        if (!npc) return;
        
        npc.isInteracting = false;
        
        // Emit event to UI system to hide dialogue
        if (window.EventSystem) {
            EventSystem.emit('dialogue.end', {
                npcId: npc.id
            });
        }
    }
    
    // Get an NPC by ID
    function getNPC(npcId) {
        return npcs.find(npc => npc.id === npcId);
    }
    
    // Get all NPCs
    function getAllNPCs() {
        return [...npcs];
    }
    
    // Public API
    return {
        init: init,
        loadNPCsForRealm: loadNPCsForRealm,
        createNPC: createNPC,
        clearAllNPCs: clearAllNPCs,
        startInteraction: startInteraction,
        endInteraction: endInteraction,
        getNPC: getNPC,
        getAllNPCs: getAllNPCs
    };
})(); 