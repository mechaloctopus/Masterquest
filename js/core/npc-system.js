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
            console.log("NPC System init called with scene:", sceneInstance);
            scene = sceneInstance;
            initialized = true;
            console.log("NPC System initialized successfully");
            
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
            console.error("NPC System init error:", e);
            Logger.error(`NPC System initialization failed: ${e.message}`);
            return false;
        }
    }
    
    // Load NPCs for a specific realm
    function loadNPCsForRealm(realmIndex) {
        console.log(`NPC System: Loading NPCs for realm ${realmIndex}`);
        
        // Clear existing NPCs
        clearNPCs();
        console.log("NPC System: Cleared existing NPCs");
        
        // Get realm config
        const realm = `REALM_${realmIndex}`;
        const realmConfig = CONFIG.REALMS[realm];
        console.log(`NPC System: Retrieved realm config for ${realm}:`, realmConfig);
        
        if (!realmConfig) {
            console.error(`NPC System: Realm ${realmIndex} configuration not found`);
            return;
        }
        
        // Always create at least one NPC as a fallback
        console.log("NPC System: Creating default NPC");
        const npc = createNPC(0, realmIndex, { NAME: "Guide" });
        console.log("NPC System: Default NPC created:", npc);
        
        // If realm has NPCs configured, create them
        if (realmConfig.NPCS && Array.isArray(realmConfig.NPCS)) {
            for (let i = 0; i < realmConfig.NPCS.length; i++) {
                createNPC(i + 1, realmIndex, realmConfig.NPCS[i]);
            }
        }
        
        Logger.log(`Created ${npcs.length} NPCs for realm ${realmIndex}`);
        console.log("NPCs in scene:", npcs);
    }
    
    // Create a single NPC
    function createNPC(index, realmIndex, template) {
        // Generate a unique ID for this NPC
        const npcId = `npc_${realmIndex}_${index}`;
        
        // Use fixed position right in the center of view
        const position = new BABYLON.Vector3(0, 2, -5);
        
        // Create a simple blue sphere
        const npcMesh = BABYLON.MeshBuilder.CreateSphere(npcId, {
            diameter: 1.0
        }, scene);
        
        // Create material for the orb - SIMPLE BLUE
        const material = new BABYLON.StandardMaterial(`${npcId}_material`, scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 1); // Pure blue in RGB
        material.emissiveColor = new BABYLON.Color3(0, 0, 1); // Make it glow blue
        npcMesh.material = material;
        
        // Position the NPC
        npcMesh.position = position;
        
        // Make NPC pickable (clickable)
        npcMesh.isPickable = true;
        
        // Add to the NPCs array
        const npc = {
            id: npcId,
            mesh: npcMesh,
            realmIndex: realmIndex,
            template: template,
            position: position
        };
        
        npcs.push(npc);
        
        // Log for debugging
        console.log(`Created NPC at position:`, position);
        
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
    function clearNPCs() {
        if (npcs.length > 0) {
            // Remove each NPC mesh from the scene
            npcs.forEach(npc => {
                if (npc.mesh) {
                    npc.mesh.dispose();
                }
            });
            
            // Clear the array
            npcs = [];
            Logger.log("All NPCs cleared from scene");
        }
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
        clearNPCs: clearNPCs
    };
})(); 