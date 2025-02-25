// Hands UI System
const HandsSystem = {
    create: function() {
        try {
            const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            const { SIZE, COLOR, SIDE_OFFSET, BOTTOM_OFFSET, BACKGROUND } = CONFIG.HANDS;

            // Left hand creation
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
            
            // Right hand creation
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

            // Log successful creation
            console.log("Hands created successfully:", leftHand, rightHand);
            
            return { leftHand, rightHand };
        } catch (error) {
            Logger.error("Failed to create hands: " + error.message);
            console.error("Hands creation error:", error);
            
            // Return dummy object that won't cause errors when animated
            return { 
                leftHand: { bottom: 0, left: 0 },
                rightHand: { bottom: 0, right: 0 }
            };
        }
    },
    
    updateHands: function(hands, state, deltaTime) {
        try {
            // Early exit if hands aren't valid
            if (!hands || !hands.leftHand || !hands.rightHand) {
                console.warn("Invalid hand controls:", hands);
                return;
            }
            
            const { leftHand, rightHand } = hands;
            const baseOffset = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
            const sideOffset = parseInt(CONFIG.HANDS.SIDE_OFFSET);
            
            // Debug log every few seconds
            if (Math.floor(state.bobTime) % 5 === 0 && Math.floor(state.bobTime * 10) % 10 === 0) {
                console.log("Hand controls:", leftHand, rightHand);
                console.log("Movement intensity:", state.smoothedMovementIntensity);
            }
            
            // Update bobbing time
            state.bobTime += deltaTime;
            
            // Calculate movement intensity
            const movementIntensity = state.moveVector ? state.moveVector.length() : 0;
            state.smoothedMovementIntensity = state.smoothedMovementIntensity || 0;
            state.smoothedMovementIntensity += (movementIntensity - state.smoothedMovementIntensity) * (deltaTime * 5);
            
            // Calculate animation values
            const bobAmount = Math.sin(state.bobTime * 10) * 20 * state.smoothedMovementIntensity;
            const swayAmount = Math.cos(state.bobTime * 8) * 15 * state.smoothedMovementIntensity;
            
            // Handle normal movement animation for both hands
            if (!state.striking) {
                // Left hand animation
                this.setHandPosition(leftHand, {
                    bottom: baseOffset + bobAmount,
                    left: sideOffset + swayAmount,
                    rotation: Math.sin(state.bobTime * 6) * 0.2 * state.smoothedMovementIntensity
                });
                
                // Right hand animation (mirror left hand movement)
                this.setHandPosition(rightHand, {
                    bottom: baseOffset + bobAmount,
                    right: sideOffset - swayAmount,
                    rotation: Math.sin(state.bobTime * 6) * -0.2 * state.smoothedMovementIntensity
                });
            } else {
                // Left hand continues normal animation during strike
                this.setHandPosition(leftHand, {
                    bottom: baseOffset + bobAmount,
                    left: sideOffset + swayAmount,
                    rotation: Math.sin(state.bobTime * 6) * 0.2 * state.smoothedMovementIntensity
                });
                
                // Update strike progress (faster strike animation)
                state.strikeProgress += deltaTime * 4;
                
                if (state.strikeProgress <= 1) {
                    // Calculate strike animation phase
                    const phase = state.strikeProgress < 0.5 ? 
                        state.strikeProgress * 2 : // Forward punch
                        2 - (state.strikeProgress * 2); // Return punch
                    
                    // Calculate screen position
                    const screenWidth = window.innerWidth;
                    const moveAmount = (screenWidth / 2.5) * phase;
                    
                    // Animate right hand for strike: change subtraction to addition
                    this.setHandPosition(rightHand, {
                        bottom: baseOffset + (40 * phase),
                        right: sideOffset - moveAmount,
                        rotation: phase * -0.5
                    });
                } else {
                    // Reset strike state
                    state.striking = false;
                    state.strikeProgress = 0;
                    console.log("Strike animation complete");
                    
                    // Reset right hand position
                    this.setHandPosition(rightHand, {
                        bottom: baseOffset,
                        right: sideOffset,
                        rotation: 0
                    });
                }
            }
        } catch (e) {
            console.error("Hand update error:", e);
        }
    },
    
    // Helper method to safely set hand position properties
    setHandPosition: function(hand, props) {
        try {
            if (!hand) return;
            
            if (props.bottom !== undefined) {
                hand.bottom = props.bottom + "px";
            }
            
            if (props.left !== undefined && hand.left !== undefined) {
                hand.left = props.left + "px";
            }
            
            if (props.right !== undefined && hand.right !== undefined) {
                hand.right = props.right + "px";
            }
            
            if (props.rotation !== undefined) {
                hand.rotation = props.rotation;
            }
        } catch (e) {
            console.error("Error setting hand position:", e, hand, props);
        }
    }
}; 