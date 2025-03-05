// NPC System - Handles NPCs for all realms
/**
 * NPCSystem - Manages non-player characters (NPCs) in the game world
 * 
 * Features:
 * - Creates and manages NPCs across different realms
 * - Detects when player approaches an NPC and shows the Talk button
 * - Handles NPC dialogues with branching conversation options
 * - Visually highlights NPCs that are within interaction range
 * 
 * Usage:
 * - Move close to an NPC to see the Talk button
 * - Click the Talk button to start a conversation
 * - Select dialogue options to continue the conversation
 * - Close the dialogue or select a "Goodbye" option to end the conversation
 */
window.NPCSystem = (function() {
    // Private properties
    const npcs = [];
    let initialized = false;
    let scene = null;
    
    // DOM elements
    let talkButton = null;
    let nearbyNPC = null;
    
    // Helper function to safely log messages
    function safeLog(message, isError = false) {
        console.log(message);
        if (window.Logger) {
            if (isError) {
                Logger.error(message);
            } else {
                Logger.log(message);
            }
        }
    }
    
    // Initialize the NPC system
    function init(sceneInstance) {
        if (initialized) {
            safeLog("NPC System already initialized", true);
            return true;
        }
        
        try {
            console.log("NPC System init called with scene:", sceneInstance);
            
            scene = sceneInstance;
            
            // Create talk button
            createTalkButton();
            
            // Setup event listeners
            setupEvents();
            
            initialized = true;
            console.log("NPC System initialized successfully");
            safeLog("> NPC SYSTEM INITIALIZED");
            
            return true;
        } catch (e) {
            console.error("NPC System init error:", e);
            safeLog(`NPC System initialization failed: ${e.message}`, true);
            return false;
        }
    }
    
    // Create the talk button for NPC interactions
    function createTalkButton() {
        talkButton = document.createElement('button');
        talkButton.id = 'npcTalkButton';
        talkButton.innerText = 'TALK';
        talkButton.addEventListener('click', handleTalkButtonClick);
        document.body.appendChild(talkButton);
    }
    
    // Set up event listeners
    function setupEvents() {
        // Listen for player position updates to check proximity
        EventSystem.on('player.position', checkNPCProximity);
        
        // Listen for realm changes to load appropriate NPCs
        EventSystem.on('realm.changed', handleRealmChange);
    }
    
    // Load NPCs for a specific realm
    function loadNPCsForRealm(realmIndex) {
        console.log(`NPC System: Loading NPCs for realm ${realmIndex}`);
        safeLog(`> LOADING NPCS FOR REALM ${realmIndex}`);
        
        // Clear existing NPCs
        clearNPCs();
        
        // Create a single visible NPC right in front of the camera
        safeLog("> CREATING BLUE NPC ORB");
        createVisibleNPC();
        
        safeLog(`> CREATED ${npcs.length} NPCS`);
    }
    
    // Create a single highly visible NPC
    function createVisibleNPC() {
        try {
            // Create a sphere
            const npcMesh = BABYLON.MeshBuilder.CreateSphere("visible_npc", {
                diameter: 1,
                segments: 16
            }, scene);
            
            // Bright blue material
            const material = new BABYLON.StandardMaterial("npc_material", scene);
            material.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
            material.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
            npcMesh.material = material;
            
            // Position in front of starting position
            let position = { x: 0, y: 1, z: -10 };
            
            // Try to use grid if available
            if (window.CoordinateSystem) {
                const gridPos = { x: 2, z: -5 };
                position = CoordinateSystem.gridToWorld(gridPos);
                safeLog(`> NPC POSITIONED AT GRID (2, -5) - WORLD ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
            } else {
                safeLog(`> NPC POSITIONED AT (0, 2, -10)`);
                position.y = 1;
            }
            
            // Set the position
            npcMesh.position = new BABYLON.Vector3(position.x, position.y, position.z);
            
            // Add a name tag above the NPC
            const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("NPC_UI");
            
            // Create a text block for the name tag
            const nameTag = new BABYLON.GUI.TextBlock();
            nameTag.text = "NPC1";
            nameTag.color = "white";
            nameTag.fontSize = 16;
            nameTag.outlineWidth = 2;
            nameTag.outlineColor = "black";
            
            // Create a container for the name tag that will be linked to the NPC
            const nameTagContainer = new BABYLON.GUI.Rectangle();
            nameTagContainer.width = "100px";
            nameTagContainer.height = "30px";
            nameTagContainer.cornerRadius = 5;
            nameTagContainer.background = "rgba(0, 0, 0, 0.5)";
            nameTagContainer.thickness = 0;
            nameTagContainer.linkWithMesh(npcMesh);
            nameTagContainer.linkOffsetY = -60; // Position above the NPC
            nameTagContainer.addControl(nameTag);
            
            advancedTexture.addControl(nameTagContainer);
            
            console.log("NPC created at position:", npcMesh.position);
            
            // Store NPC in the array
            const npc = {
                id: "visible_npc",
                mesh: npcMesh,
                position: npcMesh.position,
                gridPosition: window.CoordinateSystem ? CoordinateSystem.worldToGrid(npcMesh.position) : null,
                isNearby: false,
                isInteracting: false,
                template: {
                    HOVER_HEIGHT: 0.5,
                    HOVER_SPEED: 0.3
                },
                hoverParams: {
                    originalY: npcMesh.position.y,
                    phase: Math.random() * Math.PI * 2 // Random starting phase
                },
                dialogueData: {
                    greetings: [
                        "I am an NPC."
                    ],
                    conversations: [
                        {
                            id: "intro",
                            text: "I am an NPC.",
                            responses: [
                                {
                                    id: "close",
                                    text: "Close"
                                }
                            ]
                        },
                        {
                            id: "close",
                            text: "Goodbye!",
                            responses: []
                        }
                    ]
                }
            };
            
            npcs.push(npc);
            
            // Setup hover animation
            setupHoverAnimation(npc);
            
            // Make the NPC mesh interactive/clickable
            if (npc && npc.mesh) {
                npc.mesh.isPickable = true;
                
                // Create action manager if it doesn't exist
                if (!npc.mesh.actionManager) {
                    npc.mesh.actionManager = new BABYLON.ActionManager(scene);
                }
                
                // Add click action
                npc.mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPickTrigger,
                        function() {
                            if (window.EventSystem) {
                                EventSystem.emit('npc.interact', { npcId: npc.id });
                            }
                        }
                    )
                );
            }
            
            return npc;
        } catch (e) {
            safeLog(`Failed to create visible NPC: ${e.message}`);
            console.error("Error creating NPC:", e);
        }
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
            position: position,
            isNearby: false,
            isInteracting: false,
            // Add sample dialogue data for testing
            dialogueData: {
                greetings: [
                    "Hello traveler! I am an NPC.",
                    "Greetings! I'm here to test dialogue.",
                    "Welcome to the test realm!"
                ],
                conversations: [
                    {
                        id: "intro",
                        text: "I am a test NPC. How can I help you?",
                        responses: [
                            {
                                id: "about",
                                text: "Tell me about yourself"
                            },
                            {
                                id: "quest",
                                text: "Do you have any quests?"
                            }
                        ]
                    },
                    {
                        id: "about",
                        text: "I'm a simple blue orb NPC created to test the dialogue system.",
                        responses: [
                            {
                                id: "intro",
                                text: "Back to main dialogue"
                            }
                        ]
                    },
                    {
                        id: "quest",
                        text: "No quests available yet, this is just a test!",
                        responses: [
                            {
                                id: "intro",
                                text: "Back to main dialogue"
                            }
                        ]
                    }
                ]
            }
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
            safeLog("> CLEARING EXISTING NPCS");
            
            // Remove each NPC mesh from the scene
            npcs.forEach(npc => {
                if (npc.mesh) {
                    npc.mesh.dispose();
                }
            });
            
            // Clear the array
            npcs = [];
            safeLog("> ALL NPCS CLEARED");
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
        
        // Reset nearby NPC if we're too far from all NPCs
        let foundNearbyNPC = false;
        
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
                foundNearbyNPC = true;
                
                if (!npc.isNearby) {
                    // Player just came into range
                    npc.isNearby = true;
                    
                    // Update nearby NPC reference
                    nearbyNPC = npc;
                    
                    // Show the talk button
                    showTalkButton();
                    
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
                
                // If this was the nearby NPC, reset it
                if (nearbyNPC && nearbyNPC.id === npc.id) {
                    nearbyNPC = null;
                    hideTalkButton();
                }
                
                // Remove highlight
                highlightNPC(npc, false);
                
                // If was interacting, end interaction
                if (npc.isInteracting) {
                    endInteraction(npc.id);
                }
            }
        });
        
        // If we didn't find any nearby NPCs, make sure button is hidden
        if (!foundNearbyNPC) {
            nearbyNPC = null;
            hideTalkButton();
        }
    }
    
    // Show the talk button
    function showTalkButton() {
        if (talkButton) {
            talkButton.classList.add('visible');
        }
    }
    
    // Hide the talk button
    function hideTalkButton() {
        if (talkButton) {
            talkButton.classList.remove('visible');
        }
    }
    
    // Handle talk button click
    function handleTalkButtonClick() {
        if (nearbyNPC) {
            startInteraction(nearbyNPC.id);
            hideTalkButton(); // Hide button during interaction
        }
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
            npc.mesh.material.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan glow
            
            // Add glow layer if not exists
            if (!scene.effectLayers || !scene._glowLayer) {
                const glowLayer = new BABYLON.GlowLayer("npcGlowLayer", scene);
                glowLayer.intensity = 1.0;
            }
            
            // Scale up slightly
            npc.mesh.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
            
            // Create a pulsing animation if it doesn't exist
            if (!npc.pulseAnimation) {
                const pulseAnimation = new BABYLON.Animation(
                    "pulseAnimation",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                
                const keys = [
                    { frame: 0, value: new BABYLON.Vector3(1.3, 1.3, 1.3) },
                    { frame: 15, value: new BABYLON.Vector3(1.5, 1.5, 1.5) },
                    { frame: 30, value: new BABYLON.Vector3(1.3, 1.3, 1.3) }
                ];
                
                pulseAnimation.setKeys(keys);
                npc.mesh.animations = [pulseAnimation];
                npc.pulseAnimation = scene.beginAnimation(npc.mesh, 0, 30, true);
            }
        } else {
            // Restore original emission
            if (npc.originalEmissive) {
                npc.mesh.material.emissiveColor = npc.originalEmissive;
            }
            
            // Stop pulse animation if it exists
            if (npc.pulseAnimation) {
                npc.pulseAnimation.stop();
                npc.pulseAnimation = null;
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
        
        // Show talk button again if player is still nearby
        if (npc.isNearby) {
            showTalkButton();
        }
    }
    
    // Get an NPC by ID
    function getNPC(npcId) {
        return npcs.find(n => n.id === npcId);
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
        createVisibleNPC: createVisibleNPC,
        clearNPCs: clearNPCs,
        startInteraction: startInteraction,
        endInteraction: endInteraction,
        getNPC: getNPC
    };
})(); 