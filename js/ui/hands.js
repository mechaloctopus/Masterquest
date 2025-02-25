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
            
            // Update bobbing time
            state.bobTime += deltaTime;

            // Calculate bobbing based on movement intensity
            const movementIntensity = state.moveVector.length();
            
            // Apply easing to movement intensity for smoother transitions
            // Simple smoothing since Scalar.Lerp might not be available
            state.smoothedMovementIntensity = state.smoothedMovementIntensity || 0;
            state.smoothedMovementIntensity += (movementIntensity - state.smoothedMovementIntensity) * (deltaTime * 5);
            
            const bobAmount = Math.sin(state.bobTime * 8) * 10 * state.smoothedMovementIntensity;
            
            // Apply bobbing to left hand (always bobs)
            if (leftHand && typeof leftHand.bottom !== 'undefined') {
                leftHand.bottom = baseBottomOffset + bobAmount + "px";
            }
            
            // Handle strike animation for right hand
            if (rightHand) {
                if (state.striking) {
                    // Update strike progress
                    state.strikeProgress += deltaTime * 0.8; // Strike speed
                    
                    if (state.strikeProgress <= 1) {
                        // Determine forward/backward phase
                        let animationPhase;
                        if (state.strikeProgress < 0.5) {
                            // Forward punch (0->0.5 becomes 0->1)
                            animationPhase = state.strikeProgress * 2;
                        } else {
                            // Return punch (0.5->1 becomes 1->0)
                            animationPhase = 2 - (state.strikeProgress * 2);
                        }
                        
                        // Position right hand for strike
                        const strikeDistance = 100 * animationPhase;
                        if (typeof rightHand.right !== 'undefined') {
                            rightHand.right = (strikeBaseSideOffset - strikeDistance) + "px";
                        }
                    } else {
                        // Reset after animation completes
                        if (typeof rightHand.right !== 'undefined') {
                            rightHand.right = CONFIG.HANDS.SIDE_OFFSET;
                        }
                        state.striking = false;
                        state.strikeProgress = 0;
                    }
                } else {
                    // Apply normal bobbing to right hand when not striking
                    if (typeof rightHand.bottom !== 'undefined') {
                        rightHand.bottom = baseBottomOffset - bobAmount + "px";
                    }
                }
            }
        } catch (e) {
            console.error("Hand update error:", e);
        }
    }
}; 