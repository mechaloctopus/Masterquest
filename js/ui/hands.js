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
        
        // Smooth out movement intensity
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
            hands.rightHand.style.right = CONFIG.HANDS.SIDE_OFFSET;
            hands.rightHand.style.bottom = CONFIG.HANDS.BOTTOM_OFFSET;
        } else {
            // Handle strike animation if state.striking is true
            // Apply bobbing only to left hand
            hands.leftHand.style.transform = `translateY(${-bobY * 10}px)`;
            
            // Update strike progress
            state.strikeProgress += CONFIG.HANDS.STRIKE.SPEED * deltaTime * 3; // Increased speed for more impact
            
            // Use easing function based on config
            let easingFunction;
            switch (CONFIG.HANDS.STRIKE.EASING.toLowerCase()) {
                case 'elastic':
                    easingFunction = t => (t === 0 || t === 1) ? t : 
                        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
                    break;
                case 'bounce':
                    easingFunction = t => {
                        const n1 = 7.5625;
                        const d1 = 2.75;
                        if (t < 1 / d1) return n1 * t * t;
                        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                        return n1 * (t -= 2.625 / d1) * t + 0.984375;
                    };
                    break;
                case 'sine':
                default:
                    easingFunction = t => Math.sin(t * Math.PI / 2);
            }
            
            if (state.strikeProgress < 0.5) {
                // Forward motion (0-0.5): Move hand to center of screen
                const progress = easingFunction(state.strikeProgress * 2); // 0 to 1
                
                // Calculate positions to move from side to center
                const startRight = parseInt(CONFIG.HANDS.SIDE_OFFSET);
                const endRight = window.innerWidth / 2 - parseInt(CONFIG.HANDS.SIZE) / 2;
                const rightPos = startRight + (endRight - startRight) * progress;
                
                const startBottom = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
                const endBottom = window.innerHeight / 2 - parseInt(CONFIG.HANDS.SIZE) / 2;
                const bottomPos = startBottom + (endBottom - startBottom) * progress;
                
                // Move to center with speed based on progress
                hands.rightHand.style.transition = "none"; // Remove transition for precise control
                hands.rightHand.style.right = `${rightPos}px`;
                hands.rightHand.style.bottom = `${bottomPos}px`;
                
                // Scale and add visual effects during strike
                const scale = 1 + progress * 0.2; // Slightly grow
                const rotation = progress * 20; // Add slight rotation for effect
                hands.rightHand.style.transform = `scale(${scale}) rotate(${rotation}deg) translateZ(${progress * 50}px)`;
                
                // Increase glow effect during strike
                const glowIntensity = 20 + progress * 30;
                hands.rightHand.style.boxShadow = `0 0 ${glowIntensity}px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`;
            } else {
                // Return motion (0.5-1): Move back to original position
                const progress = easingFunction((1 - state.strikeProgress) * 2); // 1 to 0
                
                // Calculate positions to move from center back to side
                const startRight = window.innerWidth / 2 - parseInt(CONFIG.HANDS.SIZE) / 2;
                const endRight = parseInt(CONFIG.HANDS.SIDE_OFFSET);
                const rightPos = startRight + (endRight - startRight) * (1 - progress);
                
                const startBottom = window.innerHeight / 2 - parseInt(CONFIG.HANDS.SIZE) / 2;
                const endBottom = parseInt(CONFIG.HANDS.BOTTOM_OFFSET);
                const bottomPos = startBottom + (endBottom - startBottom) * (1 - progress);
                
                // Move back to original position
                hands.rightHand.style.transition = "none";
                hands.rightHand.style.right = `${rightPos}px`;
                hands.rightHand.style.bottom = `${bottomPos}px`;
                
                // Return to normal scale and rotation
                const scale = 1 + progress * 0.2;
                const rotation = progress * 20;
                hands.rightHand.style.transform = `scale(${scale}) rotate(${rotation}deg) translateZ(${progress * 50}px)`;
                
                // Decrease glow back to normal
                const glowIntensity = 20 + progress * 30;
                hands.rightHand.style.boxShadow = `0 0 ${glowIntensity}px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`;
            }
            
            // Reset animation when complete
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