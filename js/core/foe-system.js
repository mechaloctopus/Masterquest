// Foe System - Handles foes and quiz battles for all realms
window.FoeSystem = (function() {
    // Private properties
    const foes = [];
    let initialized = false;
    let scene = null;
    
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
    
    // Initialize the Foe system
    function init(sceneInstance) {
        if (initialized) {
            safeLog("Foe System already initialized", true);
            return;
        }
        
        try {
            console.log("Foe System init called with scene:", sceneInstance);
            scene = sceneInstance;
            initialized = true;
            
            // Log successful initialization
            console.log("Foe System initialized successfully");
            safeLog("> FOE SYSTEM INITIALIZED");
            
            // Initialize event handlers
            if (window.EventSystem) {
                // Listen for player proximity
                EventSystem.on('player.position', checkFoeProximity);
                
                // Listen for realm changes
                EventSystem.on('realm.change', handleRealmChange);
                
                // Listen for quiz answers
                EventSystem.on('quiz.answer', handleQuizAnswer);
            }
            
            return true;
        } catch (e) {
            console.error("Foe System init error:", e);
            safeLog(`Foe System initialization failed: ${e.message}`, true);
            return false;
        }
    }
    
    // Load foes for a specific realm
    function loadFoesForRealm(realmIndex) {
        console.log(`Foe System: Loading foes for realm ${realmIndex}`);
        safeLog(`> LOADING FOES FOR REALM ${realmIndex}`);
        
        // Clear existing foes
        clearFoes();
        
        // Create a single visible foe
        safeLog("> CREATING RED FOE ORB");
        createVisibleFoe();
        
        safeLog(`> CREATED ${foes.length} FOES`);
        return true;
    }
    
    // Create a single highly visible foe
    function createVisibleFoe() {
        try {
            // Create a red sphere for the foe
            const foeMesh = BABYLON.MeshBuilder.CreateSphere("visible_foe", {
                diameter: 1.2,
                segments: 16
            }, scene);
            
            // Bright red material
            const material = new BABYLON.StandardMaterial("foe_material", scene);
            material.diffuseColor = new BABYLON.Color3(1, 0, 0.3);
            material.emissiveColor = new BABYLON.Color3(1, 0, 0.3);
            foeMesh.material = material;
            
            // Position to the WEST (right) of the NPC
            let position = { x: -5, y: 1, z: -10 };
            
            // Try to use grid if available
            if (window.CoordinateSystem) {
                const gridPos = { x: -5, z: -5 };  // Changed x from 5 to -5 to position it to the west
                position = CoordinateSystem.gridToWorld(gridPos);
                safeLog(`> FOE POSITIONED AT GRID (-5, -5) - WORLD ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
            } else {
                safeLog(`> FOE POSITIONED AT (-5, 1, -10)`);  // Changed x from 5 to -5
            }
            
            // Set the position
            foeMesh.position = new BABYLON.Vector3(position.x, position.y, position.z);
            
            // Create a simple name tag using a dynamic texture
            const nameTagPlane = BABYLON.MeshBuilder.CreatePlane("foeNameTag", { width: 2, height: 0.5 }, scene);
            nameTagPlane.position = new BABYLON.Vector3(0, 1.5, 0);
            nameTagPlane.parent = foeMesh;
            nameTagPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            
            // Create dynamic texture for the name
            const textureWidth = 512;
            const textureHeight = 128; 
            const dynamicTexture = new BABYLON.DynamicTexture("foeNameTexture", {width: textureWidth, height: textureHeight}, scene, true);
            dynamicTexture.hasAlpha = true;
            
            // Create material with the dynamic texture
            const nameTagMaterial = new BABYLON.StandardMaterial("foeNameMaterial", scene);
            nameTagMaterial.diffuseTexture = dynamicTexture;
            nameTagMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            nameTagMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0); // Changed to black
            nameTagMaterial.backFaceCulling = false;
            
            // Make it transparent and visible from both sides
            nameTagMaterial.useAlphaFromDiffuseTexture = true;
            nameTagPlane.material = nameTagMaterial;
            
            // Draw text on the dynamic texture with plain black text
            dynamicTexture.drawText("FOE1", null, null, "30px Arial", "#000000", "transparent", true);
            
            return foeMesh;
        } catch (error) {
            safeLog(`Error creating visible FOE: ${error.message}`, true);
            return null;
        }
    }
    
    // Add spikes to orb to distinguish foes from regular NPCs
    function addSpikesToOrb(foeMesh, color) {
        // Add spikes to make the foe look more threatening
        const spikeCount = 12; // Increase number of spikes
        const spikeLength = 0.7; // Make spikes longer
        
        // Add spikes in multiple directions
        for (let i = 0; i < spikeCount; i++) {
            // Calculate position around the sphere horizontally
            const angle = (i / spikeCount) * Math.PI * 2;
            const direction = new BABYLON.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            // Create spike mesh
            const spike = BABYLON.MeshBuilder.CreateCylinder(
                `spike_h_${i}`,
                {
                    height: spikeLength,
                    diameterTop: 0,
                    diameterBottom: 0.2,
                    tessellation: 4 // Make spikes more angular/sharp
                },
                scene
            );
            
            // Position and orient the spike
            const radius = foeMesh.getBoundingInfo().boundingSphere.radius;
            spike.position = foeMesh.position.clone().add(direction.scale(radius));
            spike.lookAt(spike.position.add(direction));
            spike.rotate(BABYLON.Axis.X, Math.PI / 2);
            
            // Create glowing material for spike
            const spikeMaterial = new BABYLON.StandardMaterial(`spike_material_h_${i}`, scene);
            spikeMaterial.emissiveColor = new BABYLON.Color3.FromHexString(color || "#ff0000");
            spikeMaterial.diffuseColor = new BABYLON.Color3.FromHexString(color || "#ff0000");
            spike.material = spikeMaterial;
            
            // Parent to the orb so it moves with it
            spike.parent = foeMesh;
        }
        
        // Add vertical spikes too for a more 3D threatening appearance
        for (let i = 0; i < 6; i++) {
            // Calculate position around the sphere vertically
            const angle = (i / 6) * Math.PI * 2;
            const direction = new BABYLON.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            );
            
            // Create spike mesh
            const spike = BABYLON.MeshBuilder.CreateCylinder(
                `spike_v_${i}`,
                {
                    height: spikeLength,
                    diameterTop: 0,
                    diameterBottom: 0.2,
                    tessellation: 4
                },
                scene
            );
            
            // Position and orient the spike
            const radius = foeMesh.getBoundingInfo().boundingSphere.radius;
            spike.position = foeMesh.position.clone().add(direction.scale(radius));
            spike.lookAt(spike.position.add(direction));
            
            // Create glowing material for spike
            const spikeMaterial = new BABYLON.StandardMaterial(`spike_material_v_${i}`, scene);
            spikeMaterial.emissiveColor = new BABYLON.Color3.FromHexString(color || "#ff0000");
            spikeMaterial.diffuseColor = new BABYLON.Color3.FromHexString(color || "#ff0000");
            spike.material = spikeMaterial;
            
            // Parent to the orb so it moves with it
            spike.parent = foeMesh;
        }
    }
    
    // Generate quiz questions for a foe
    function generateQuizQuestions(foeIndex, realmIndex) {
        // In a real implementation, these would come from a database or config
        // Here we're generating some placeholder questions
        const baseQuestions = [
            {
                question: "What color scheme is most associated with vaporwave?",
                options: [
                    "Red and yellow", 
                    "Purple and teal", 
                    "Green and brown", 
                    "Black and white"
                ],
                correctAnswer: 1,
                explanation: "Purple and teal are classic vaporwave colors."
            },
            {
                question: "Which decade's aesthetics heavily influenced vaporwave?",
                options: [
                    "1970s", 
                    "1980s", 
                    "1990s", 
                    "2000s"
                ],
                correctAnswer: 2,
                explanation: "The 1990s' early internet and digital aesthetics heavily influenced vaporwave."
            },
            {
                question: "What is a common symbol in vaporwave art?",
                options: [
                    "Mountains", 
                    "Greek statues", 
                    "Horses", 
                    "Skyscrapers"
                ],
                correctAnswer: 1,
                explanation: "Greek statues and classical art are often used in vaporwave aesthetics."
            },
            {
                question: "What pattern is commonly featured in vaporwave backgrounds?",
                options: [
                    "Plaid", 
                    "Polka dots", 
                    "Grid lines", 
                    "Zigzag"
                ],
                correctAnswer: 2,
                explanation: "Grid lines, especially in perspective, are a staple of vaporwave art."
            },
            {
                question: "What font style is most associated with vaporwave?",
                options: [
                    "Gothic", 
                    "Roman", 
                    "Serif", 
                    "Japanese katakana with English"
                ],
                correctAnswer: 3,
                explanation: "Japanese characters alongside English text is very common in vaporwave aesthetics."
            }
        ];
        
        // Select 3 random questions from the base set
        const selectedQuestions = [];
        const indices = new Set();
        
        // Ensure we get unique questions
        while (indices.size < 3 && indices.size < baseQuestions.length) {
            const randomIndex = Math.floor(Math.random() * baseQuestions.length);
            indices.add(randomIndex);
        }
        
        // Build the selected questions array
        Array.from(indices).forEach(index => {
            selectedQuestions.push(baseQuestions[index]);
        });
        
        return selectedQuestions;
    }
    
    // Setup the hovering animation for a foe
    function setupHoverAnimation(foe) {
        if (!scene) return;
        
        const hoverHeight = foe.template.HOVER_HEIGHT || 0.7;
        const hoverSpeed = foe.template.HOVER_SPEED || 0.5;
        
        // Register an animation to run before each render
        scene.registerBeforeRender(() => {
            if (foe && foe.mesh) {
                // Update hover phase
                foe.hoverParams.phase += hoverSpeed * scene.getAnimationRatio() * 0.01;
                
                // Calculate new Y position with sine wave
                const newY = foe.hoverParams.originalY + Math.sin(foe.hoverParams.phase) * hoverHeight;
                
                // Apply new position
                foe.mesh.position.y = newY;
                
                // Slowly rotate the foe
                foe.mesh.rotation.y += 0.003 * scene.getAnimationRatio();
                
                // If in battle state, add more dramatic effects
                if (foe.state === 'battle') {
                    // Pulse size
                    const pulse = 1 + 0.1 * Math.sin(foe.hoverParams.phase * 3);
                    foe.mesh.scaling.x = pulse;
                    foe.mesh.scaling.y = pulse;
                    foe.mesh.scaling.z = pulse;
                    
                    // Maybe add more battle effects here
                }
            }
        });
    }
    
    // Clear all foes from the scene
    function clearFoes() {
        if (foes.length > 0) {
            safeLog("> CLEARING EXISTING FOES");
            
            // Remove each foe mesh from the scene
            foes.forEach(foe => {
                if (foe.mesh) {
                    foe.mesh.dispose();
                }
            });
            
            // Clear the array
            foes = [];
            safeLog("> ALL FOES CLEARED");
        }
    }
    
    // Check player proximity to foes
    function checkFoeProximity(playerData) {
        if (!playerData || !playerData.position) return;
        
        const playerPos = new BABYLON.Vector3(
            playerData.position.x,
            0, // Use ground Y for distance check
            playerData.position.z
        );
        
        // Check each foe
        foes.forEach(foe => {
            if (!foe.mesh) return;
            
            // Skip defeated foes
            if (foe.state === 'defeated') return;
            
            // Calculate distance
            const foePos = foe.mesh.position;
            const distance = BABYLON.Vector3.Distance(
                playerPos,
                new BABYLON.Vector3(foePos.x, 0, foePos.z) // Ignore Y for distance
            );
            
            // Close enough to interact (5 units)
            if (distance < 5) {
                if (foe.state === 'idle') {
                    // Foe becomes aware of player
                    foe.state = 'engaging';
                    
                    // Visual indication
                    highlightFoe(foe, true);
                    
                    // Emit event that foe is engaging
                    if (window.EventSystem) {
                        EventSystem.emit('foe.engaging', {
                            foeId: foe.id,
                            distance: distance
                        });
                    }
                }
                
                // Very close - initiate battle (3 units)
                if (distance < 3 && foe.state === 'engaging' && !foe.isInteracting) {
                    // Start battle
                    startBattle(foe.id);
                }
            } else if (foe.state === 'engaging') {
                // Player moved away, foe returns to idle
                foe.state = 'idle';
                
                // Remove highlight
                highlightFoe(foe, false);
            }
        });
    }
    
    // Handle realm change event
    function handleRealmChange(data) {
        if (!data || !data.realmIndex) return;
        
        // Clear current foes
        clearAllFoes();
        
        // Load foes for the new realm
        loadFoesForRealm(data.realmIndex);
    }
    
    // Highlight or unhighlight a foe
    function highlightFoe(foe, highlight) {
        if (!foe || !foe.mesh || !foe.mesh.material) return;
        
        if (highlight) {
            // Store original emission color
            if (!foe.originalEmissive) {
                foe.originalEmissive = foe.mesh.material.emissiveColor ? 
                    foe.mesh.material.emissiveColor.clone() : 
                    new BABYLON.Color3(0, 0, 0);
            }
            
            // Increase emission for highlight
            foe.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.5, 1);
            
            // Scale up slightly
            foe.mesh.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
        } else {
            // Restore original emission
            if (foe.originalEmissive) {
                foe.mesh.material.emissiveColor = foe.originalEmissive;
            }
            
            // Restore original scale
            foe.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        }
    }
    
    // Start battle with a foe
    function startBattle(foeId) {
        const foe = foes.find(f => f.id === foeId);
        if (!foe) return;
        
        // Don't start battle if already in one or defeated
        if (foe.isInteracting || foe.state === 'defeated') return;
        
        foe.isInteracting = true;
        foe.state = 'battle';
        
        // Log message
        const message = `> FOE ENCOUNTER: ${foe.id} says: "I am a FOE"`;
        
        // Browser console
        console.log(message);
        
        // Try multiple approaches for log
        // 1. Direct add to Logger if available
        if (window.Logger && window.Logger.log) {
            window.Logger.log(message);
        }
        
        // 2. Direct DOM manipulation with typewriter effect
        const logElement = document.getElementById('logContent');
        if (logElement) {
            const entry = document.createElement('div');
            entry.className = 'log-message';
            logElement.appendChild(entry);
            
            // Type the text with animation
            typeText(entry, message, 0, 20);
            
            // Ensure the log scrolls to the bottom
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        // 4. Update the global log
        document.querySelectorAll('#log, #logContent').forEach(el => {
            el.style.display = 'block';
            el.classList.remove('collapsed');
        });
        
        // Automatically end the battle after 3 seconds
        setTimeout(() => {
            endBattle(foeId, true);
        }, 3000);
        
        return foe.quizData;
    }
    
    // End battle with a foe
    function endBattle(foeId, playerWon) {
        const foe = foes.find(f => f.id === foeId);
        if (!foe) return;
        
        foe.isInteracting = false;
        
        // If player won, change state to defeated
        if (playerWon) {
            foe.state = 'defeated';
            
            // Log message
            const message = `> BATTLE ENDED: You defeated ${foe.id}!`;
            
            // Browser console
            console.log(message);
            
            // Try multiple approaches for log
            // 1. Direct add to Logger if available
            if (window.Logger && window.Logger.log) {
                window.Logger.log(message);
            }
            
            // 2. Direct DOM manipulation with typewriter effect
            const logElement = document.getElementById('logContent');
            if (logElement) {
                const entry = document.createElement('div');
                entry.className = 'log-message';
                logElement.appendChild(entry);
                
                // Type the text with animation
                typeText(entry, message, 0, 20);
                
                // Ensure the log scrolls to the bottom
                logElement.scrollTop = logElement.scrollHeight;
            }
            
            // 4. Update the global log
            document.querySelectorAll('#log, #logContent').forEach(el => {
                el.style.display = 'block';
                el.classList.remove('collapsed');
            });
            
            // Visual indication
            if (foe.mesh && foe.mesh.material) {
                // Make it transparent and gray
                foe.mesh.material.alpha = 0.5;
                foe.mesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                foe.mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            }
        } else {
            // Return to idle state
            foe.state = 'idle';
            
            // Log message
            const message = `> BATTLE ENDED: ${foe.id} remains undefeated.`;
            
            // Browser console
            console.log(message);
            
            // Try multiple approaches for log
            // 1. Direct add to Logger if available
            if (window.Logger && window.Logger.log) {
                window.Logger.log(message);
            }
            
            // 2. Direct DOM manipulation with typewriter effect
            const logElement = document.getElementById('logContent');
            if (logElement) {
                const entry = document.createElement('div');
                entry.className = 'log-message';
                logElement.appendChild(entry);
                
                // Type the text with animation
                typeText(entry, message, 0, 20);
                
                // Ensure the log scrolls to the bottom
                logElement.scrollTop = logElement.scrollHeight;
            }
            
            // 4. Update the global log
            document.querySelectorAll('#log, #logContent').forEach(el => {
                el.style.display = 'block';
                el.classList.remove('collapsed');
            });
        }
        
        // Remove highlight
        highlightFoe(foe, false);
    }
    
    // Handle quiz answer
    function handleQuizAnswer(data) {
        if (!data || !data.foeId || typeof data.answerIndex !== 'number') return;
        
        const foe = foes.find(f => f.id === data.foeId);
        if (!foe || !foe.isInteracting) return;
        
        // Get current question
        const currentQuestionIndex = foe.quizData.currentQuestion;
        const currentQuestion = foe.quizData.questions[currentQuestionIndex];
        
        // Check if answer is correct
        const isCorrect = data.answerIndex === currentQuestion.correctAnswer;
        
        // Update score if correct
        if (isCorrect) {
            foe.quizData.score++;
        }
        
        // Emit result event
        if (window.EventSystem) {
            EventSystem.emit('quiz.answerResult', {
                foeId: foe.id,
                isCorrect: isCorrect,
                correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
                explanation: currentQuestion.explanation,
                score: foe.quizData.score,
                maxScore: foe.quizData.maxScore
            });
        }
        
        // Move to next question or finish quiz
        foe.quizData.currentQuestion++;
        
        if (foe.quizData.currentQuestion >= foe.quizData.questions.length) {
            // Quiz complete
            foe.quizData.completed = true;
            
            // Player wins if they got more than half right
            const playerWon = foe.quizData.score > (foe.quizData.maxScore / 2);
            
            // End battle
            setTimeout(() => {
                endBattle(foe.id, playerWon);
            }, 3000); // Give time to read the final answer result
            
        } else {
            // Show next question after a short delay
            setTimeout(() => {
                const nextQuestion = foe.quizData.questions[foe.quizData.currentQuestion];
                
                if (window.EventSystem) {
                    EventSystem.emit('quiz.nextQuestion', {
                        foeId: foe.id,
                        quizData: {
                            question: nextQuestion.question,
                            options: nextQuestion.options,
                            questionNumber: foe.quizData.currentQuestion + 1,
                            totalQuestions: foe.quizData.questions.length
                        }
                    });
                }
            }, 3000); // Give time to read the answer result
        }
    }
    
    // Get a foe by ID
    function getFoe(foeId) {
        return foes.find(foe => foe.id === foeId);
    }
    
    // Get all foes
    function getAllFoes() {
        return [...foes];
    }
    
    // Function to create typewriter effect
    function typeText(element, text, index, speed) {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(function() {
                typeText(element, text, index, speed);
            }, speed);
        }
        
        // Make sure log stays scrolled to the bottom during typing
        const logContent = document.getElementById('logContent');
        if (logContent) {
            logContent.scrollTop = logContent.scrollHeight;
        }
    }
    
    // Public API
    return {
        init: init,
        loadFoesForRealm: loadFoesForRealm,
        createFoe: createVisibleFoe,
        createVisibleFoe: createVisibleFoe,
        clearFoes: clearFoes
    };
})(); 