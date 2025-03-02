// Hands System
const HandsSystem = {
    create: function(scene, camera) {
        Logger.log("> INITIALIZING HAND SYSTEM");
        
        const hands = {
            leftHand: document.getElementById('leftHand'),
            rightHand: document.getElementById('rightHand'),
            bobAmount: 0,
            strikeProgress: 0,
            // Store original positions of hands for reference
            rightHandOriginalPosition: {
                bottom: CONFIG.HANDS.BOTTOM_OFFSET,
                right: CONFIG.HANDS.SIDE_OFFSET
            }
        };
        
        // Apply initial styles from config
        if (hands.leftHand && hands.rightHand) {
            const applyHandStyles = (hand) => {
                hand.style.width = CONFIG.HANDS.SIZE;
                hand.style.height = CONFIG.HANDS.SIZE;
                hand.style.background = CONFIG.HANDS.BACKGROUND;
                hand.style.borderColor = CONFIG.HANDS.COLOR;
                hand.style.boxShadow = `0 0 20px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`;
            };
            
            applyHandStyles(hands.leftHand);
            applyHandStyles(hands.rightHand);
            
            // Save original positions for reference
            if (hands.rightHand) {
                const computedStyle = window.getComputedStyle(hands.rightHand);
                hands.rightHandOriginalPosition = {
                    bottom: computedStyle.bottom,
                    right: computedStyle.right
                };
            }
            
            Logger.log("> HAND SYSTEM READY");
        } else {
            Logger.warning("Hand elements not found in DOM");
        }
        
        return hands;
    },
    
    updateHands: function(hands, state, deltaTime) {
        if (!hands || !hands.leftHand || !hands.rightHand) return;
        
        // Basic bobbing motion when moving
        const bobIntensity = state.moveVector ? state.moveVector.length() * CONFIG.CAMERA.BOB_INTENSITY : 0;
        
        // Smooth out movement intensity with a more efficient calculation
        state.smoothedMovementIntensity = state.smoothedMovementIntensity * 0.9 + bobIntensity * 0.1;
        
        // Calculate bobbing
        let bobY = 0;
        if (state.grounded && state.smoothedMovementIntensity > 0.1) {
            bobY = Math.sin(state.bobTime * CONFIG.ANIMATION.BOB_SPEED) * state.smoothedMovementIntensity;
        }
        
        // Default hand positions when not striking
        if (!state.striking) {
            // Apply bobbing to hands
            hands.leftHand.style.transform = `translateY(${-bobY * 10}px)`;
            hands.rightHand.style.transform = `translateY(${bobY * 10}px)`;
            hands.rightHand.style.transition = "all 0.2s ease-out";
            
            // No need to set these every frame if they haven't changed
            if (hands.rightHand.style.right !== CONFIG.HANDS.SIDE_OFFSET) {
                hands.rightHand.style.right = CONFIG.HANDS.SIDE_OFFSET;
            }
            if (hands.rightHand.style.bottom !== CONFIG.HANDS.BOTTOM_OFFSET) {
                hands.rightHand.style.bottom = CONFIG.HANDS.BOTTOM_OFFSET;
            }
        } else {
            // Handle strike animation if state.striking is true
            // Apply bobbing only to left hand
            hands.leftHand.style.transform = `translateY(${-bobY * 10}px)`;
            
            // Only update the state.strikeProgress once per frame
            state.strikeProgress += CONFIG.HANDS.STRIKE.SPEED * deltaTime * 100;
            
            // Use sine easing for smoother animation
            const easingFunction = t => Math.sin(t * Math.PI / 2);
            
            // Cache window dimensions to avoid recalculating
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const handSize = parseInt(CONFIG.HANDS.SIZE);
            
            // Pre-compute positions
            let rightPos, bottomPos, scale, rotation, glowIntensity;
            
            if (state.strikeProgress < 0.5) {
                // Forward motion (0-0.5): Move hand to center of screen
                const progress = easingFunction(state.strikeProgress * 2); // 0 to 1
                
                // Calculate positions to move from side to center
                const startRight = parseInt(CONFIG.HANDS.SIDE_OFFSET);
                const endRight = windowWidth / 2 - handSize / 2;
                rightPos = startRight + (endRight - startRight) * progress;
                
                const startBottom = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
                const endBottom = windowHeight / 2 - handSize / 2;
                bottomPos = startBottom + (endBottom - startBottom) * progress;
                
                // Visual effects
                scale = 1 + progress * 0.2;
                rotation = progress * 20;
                glowIntensity = 20 + progress * 30;
            } else {
                // Return motion (0.5-1): Move back to original position
                const progress = easingFunction((1 - state.strikeProgress) * 2); // 1 to 0
                
                // Calculate positions to move from center back to side
                const startRight = windowWidth / 2 - handSize / 2;
                const endRight = parseInt(CONFIG.HANDS.SIDE_OFFSET);
                rightPos = startRight + (endRight - startRight) * (1 - progress);
                
                const startBottom = windowHeight / 2 - handSize / 2;
                const endBottom = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
                bottomPos = startBottom + (endBottom - startBottom) * (1 - progress);
                
                // Visual effects
                scale = 1 + progress * 0.2;
                rotation = progress * 20;
                glowIntensity = 20 + progress * 30;
            }
            
            // Apply computed values - only once per frame
            hands.rightHand.style.transition = "none";
            hands.rightHand.style.right = `${rightPos}px`;
            hands.rightHand.style.bottom = `${bottomPos}px`;
            hands.rightHand.style.transform = `scale(${scale}) rotate(${rotation}deg) translateZ(${Math.min(50, progress * 50)}px)`;
            hands.rightHand.style.boxShadow = `0 0 ${glowIntensity}px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`;
            
            // Reset animation when complete - avoid repeated calculations
            if (state.strikeProgress >= 1) {
                state.strikeProgress = 0;
                state.striking = false;
                
                // Reset hand to original position with transition
                hands.rightHand.style.transition = "all 0.2s ease-out";
                hands.rightHand.style.right = CONFIG.HANDS.SIDE_OFFSET;
                hands.rightHand.style.bottom = CONFIG.HANDS.BOTTOM_OFFSET;
                hands.rightHand.style.transform = `translateY(${bobY * 10}px)`;
                hands.rightHand.style.boxShadow = `0 0 20px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`;
            }
        }
    }
}; 