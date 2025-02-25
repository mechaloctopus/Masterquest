// Hands UI System
const HandsSystem = {
    create: function() {
        try {
            const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            const { SIZE, COLOR, SIDE_OFFSET, BOTTOM_OFFSET, BACKGROUND } = CONFIG.HANDS;

            const leftHand = new BABYLON.GUI.Ellipse("leftHand");
            leftHand.width = SIZE;
            leftHand.height = SIZE;
            leftHand.color = COLOR;
            leftHand.thickness = 4;
            leftHand.background = BACKGROUND;
            leftHand.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            leftHand.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            leftHand.left = SIDE_OFFSET;
            leftHand.bottom = BOTTOM_OFFSET;
            gui.addControl(leftHand);
            
            const rightHand = new BABYLON.GUI.Ellipse("rightHand");
            rightHand.width = SIZE;
            rightHand.height = SIZE;
            rightHand.color = COLOR;
            rightHand.thickness = 4;
            rightHand.background = BACKGROUND;
            rightHand.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            rightHand.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            rightHand.right = SIDE_OFFSET;
            rightHand.bottom = BOTTOM_OFFSET;
            gui.addControl(rightHand);

            return [leftHand, rightHand];
        } catch (error) {
            Logger.error("Failed to create hands: " + error.message);
            // Return dummy hands that won't cause errors when animated
            return [{bottom: 0}, {bottom: 0}];
        }
    },
    
    updateHands: function(handControls, state, deltaTime) {
        try {
            const baseBottomOffset = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
            const strikeBaseSideOffset = parseInt(CONFIG.HANDS.SIDE_OFFSET);
            const leftHand = handControls[0];
            const rightHand = handControls[1];
            
            // Add debug logging to check state
            if (state.striking && state.strikeProgress === 0) {
                console.log("Strike starting");
            }
            
            // Update bobbing time
            state.bobTime += deltaTime;

            // Calculate bobbing based on movement intensity
            const movementIntensity = state.moveVector ? state.moveVector.length() : 0;
            
            // Apply easing to movement intensity for smoother transitions
            state.smoothedMovementIntensity = state.smoothedMovementIntensity || 0;
            state.smoothedMovementIntensity += (movementIntensity - state.smoothedMovementIntensity) * (deltaTime * 5);
            
            // Increase bobbing amount for more visibility
            const bobAmount = Math.sin(state.bobTime * 10) * 20 * state.smoothedMovementIntensity;
            const swayAmount = Math.cos(state.bobTime * 8) * 15 * state.smoothedMovementIntensity;
            
            // Apply bobbing to left hand
            if (leftHand && leftHand.bottom !== undefined) {
                leftHand.bottom = baseBottomOffset + bobAmount + "px";
                leftHand.left = (parseInt(CONFIG.HANDS.SIDE_OFFSET) + swayAmount) + "px";
                
                if (leftHand.rotation !== undefined) {
                    leftHand.rotation = Math.sin(state.bobTime * 6) * 0.2 * state.smoothedMovementIntensity;
                }
            }
            
            // Handle right hand (strike animation or normal bobbing)
            if (rightHand) {
                if (state.striking) {
                    // Update strike progress
                    state.strikeProgress += deltaTime * 3.5; // Faster strike animation
                    
                    if (state.strikeProgress <= 1) {
                        // Determine forward/backward phase
                        const animationPhase = state.strikeProgress < 0.5 ? 
                            state.strikeProgress * 2 : // Forward punch (0->0.5 becomes 0->1)
                            2 - (state.strikeProgress * 2); // Return punch (0.5->1 becomes 1->0)
                        
                        // Calculate how far toward center to move (0 = edge, 1 = center)
                        const centerRatio = animationPhase;
                        
                        // Calculate actual pixel values for movement
                        const screenWidth = window.innerWidth;
                        const maxMove = screenWidth / 2.5; // Move closer to center
                        const moveAmount = maxMove * centerRatio;
                        
                        // Move hand toward center of screen
                        rightHand.right = (strikeBaseSideOffset - moveAmount) + "px";
                        
                        // Also move slightly up for a more natural punch motion
                        rightHand.bottom = (baseBottomOffset + 30 * centerRatio) + "px";
                        
                        // Add rotation for more dynamic movement
                        if (rightHand.rotation !== undefined) {
                            rightHand.rotation = centerRatio * -0.3;
                        }
                    } else {
                        // Reset after animation completes
                        rightHand.right = CONFIG.HANDS.SIDE_OFFSET;
                        rightHand.bottom = baseBottomOffset + "px";
                        if (rightHand.rotation !== undefined) {
                            rightHand.rotation = 0;
                        }
                        state.striking = false;
                        state.strikeProgress = 0;
                        console.log("Strike complete");
                    }
                } else {
                    // Apply normal bobbing to right hand when not striking
                    rightHand.bottom = (baseBottomOffset - bobAmount) + "px";
                    rightHand.right = (parseInt(CONFIG.HANDS.SIDE_OFFSET) - swayAmount) + "px";
                    
                    if (rightHand.rotation !== undefined) {
                        rightHand.rotation = Math.sin(state.bobTime * 6) * -0.2 * state.smoothedMovementIntensity;
                    }
                }
            }
        } catch (e) {
            console.error("Hand update error:", e);
        }
    }
}; 