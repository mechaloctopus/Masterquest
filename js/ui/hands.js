// Hands UI System - Complete Rebuild
const HandsSystem = {
    create: function() {
        try {
            // Create full-screen UI
            const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            
            // Create a container for better control
            const leftContainer = new BABYLON.GUI.Rectangle("leftHandContainer");
            leftContainer.width = "100px";
            leftContainer.height = "100px";
            leftContainer.cornerRadius = 50;
            leftContainer.thickness = 0;
            leftContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            leftContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            leftContainer.left = "20px";
            leftContainer.bottom = "20px";
            gui.addControl(leftContainer);
            
            // Create left hand inside container
            const leftHand = new BABYLON.GUI.Ellipse("leftHand");
            leftHand.width = "80px";
            leftHand.height = "80px";
            leftHand.color = "#0ff";
            leftHand.thickness = 4;
            leftHand.background = "rgba(0,255,255,0.2)";
            leftContainer.addControl(leftHand);
            
            // Create container for right hand
            const rightContainer = new BABYLON.GUI.Rectangle("rightHandContainer");
            rightContainer.width = "100px";
            rightContainer.height = "100px";
            rightContainer.cornerRadius = 50;
            rightContainer.thickness = 0;
            rightContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            rightContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            rightContainer.right = "20px";
            rightContainer.bottom = "20px";
            gui.addControl(rightContainer);
            
            // Create right hand inside container
            const rightHand = new BABYLON.GUI.Ellipse("rightHand");
            rightHand.width = "80px";
            rightHand.height = "80px";
            rightHand.color = "#0ff";
            rightHand.thickness = 4;
            rightHand.background = "rgba(0,255,255,0.2)";
            rightContainer.addControl(rightHand);
            
            console.log("NEW HANDS SYSTEM CREATED");
            
            return {
                leftContainer,
                rightContainer,
                leftHand,
                rightHand
            };
        } catch (error) {
            console.error("Failed to create new hands:", error);
            return {
                leftContainer: null,
                rightContainer: null,
                leftHand: null,
                rightHand: null 
            };
        }
    },
    
    updateHands: function(hands, state, deltaTime) {
        if (!hands || !hands.leftContainer || !hands.rightContainer) {
            return;
        }
        
        try {
            // Update animation time
            state.bobTime += deltaTime;
            
            // Calculate movement intensity
            const movementIntensity = state.moveVector ? state.moveVector.length() : 0;
            if (state.smoothedMovementIntensity === undefined) {
                state.smoothedMovementIntensity = 0;
            }
            state.smoothedMovementIntensity += (movementIntensity - state.smoothedMovementIntensity) * (deltaTime * 5);
            
            // Base values
            const baseOffset = 20;
            const sideOffset = 20;
            
            // Calculate bob and sway
            const bobAmount = Math.sin(state.bobTime * 10) * 20 * state.smoothedMovementIntensity;
            const swayAmount = Math.cos(state.bobTime * 8) * 15 * state.smoothedMovementIntensity;
            
            // Every 30 frames, print debug info
            if (Math.floor(state.bobTime * 30) % 30 === 0) {
                console.log("Animation values:", {
                    bobAmount,
                    swayAmount,
                    intensity: state.smoothedMovementIntensity
                });
            }
            
            // Handle normal bobbing animation
            if (!state.striking) {
                // Update left hand container
                hands.leftContainer.left = (sideOffset + swayAmount) + "px";
                hands.leftContainer.bottom = (baseOffset + bobAmount) + "px";
                hands.leftHand.rotation = Math.sin(state.bobTime * 6) * 0.2 * state.smoothedMovementIntensity;
                
                // Update right hand container
                hands.rightContainer.right = (sideOffset - swayAmount) + "px";
                hands.rightContainer.bottom = (baseOffset + bobAmount) + "px";
                hands.rightHand.rotation = Math.sin(state.bobTime * 6) * -0.2 * state.smoothedMovementIntensity;
            } else {
                // Left hand continues normal animation
                hands.leftContainer.left = (sideOffset + swayAmount) + "px";
                hands.leftContainer.bottom = (baseOffset + bobAmount) + "px";
                hands.leftHand.rotation = Math.sin(state.bobTime * 6) * 0.2 * state.smoothedMovementIntensity;
                
                // Update strike progress
                state.strikeProgress += deltaTime * 4;
                
                if (state.strikeProgress <= 1) {
                    // Forward and return punch animation
                    const phase = state.strikeProgress < 0.5 ? 
                        state.strikeProgress * 2 : // Forward punch
                        2 - (state.strikeProgress * 2); // Return punch
                    
                    // Calculate screen position
                    const screenWidth = window.innerWidth;
                    const moveAmount = (screenWidth / 3) * phase;
                    
                    // Debug log when phase changes
                    if (Math.floor(state.strikeProgress * 20) % 5 === 0) {
                        console.log(`Strike animation: phase=${phase.toFixed(2)}, moveAmount=${moveAmount.toFixed(2)}`);
                    }
                    
                    // Move right hand container for strike
                    const newRightValue = Math.max(0, sideOffset - moveAmount);
                    hands.rightContainer.right = newRightValue + "px";
                    hands.rightContainer.bottom = (baseOffset + (40 * phase)) + "px";
                    hands.rightHand.rotation = phase * -0.5;
                    
                    console.log(`Right container position: ${newRightValue}px from right`);
                } else {
                    // Reset strike state
                    state.striking = false;
                    state.strikeProgress = 0;
                    
                    // Reset right hand position
                    hands.rightContainer.right = sideOffset + "px";
                    hands.rightContainer.bottom = baseOffset + "px";
                    hands.rightHand.rotation = 0;
                }
            }
        } catch (e) {
            console.error("New hand update error:", e);
        }
    }
}; 