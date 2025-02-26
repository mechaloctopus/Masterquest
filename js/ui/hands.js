// Hands System
const HandsSystem = {
    create: function(scene, camera) {
        Logger.log("> INITIALIZING HAND SYSTEM");
        
        const hands = {
            leftHand: document.getElementById('leftHand'),
            rightHand: document.getElementById('rightHand'),
            bobAmount: 0,
            strikeProgress: 0
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
            
            Logger.log("> HAND SYSTEM READY");
        } else {
            Logger.warning("Hand elements not found in DOM");
        }
        
        return hands;
    },
    
    updateHands: function(hands, state, deltaTime) {
        if (!hands || !hands.leftHand || !hands.rightHand) return;
        
        // Basic bobbing motion when moving
        const bobIntensity = state.moveVector ? state.moveVector.length() * 5 : 0;
        
        // Smooth out movement intensity
        state.smoothedMovementIntensity = state.smoothedMovementIntensity * 0.9 + bobIntensity * 0.1;
        
        // Calculate bobbing
        let bobY = 0;
        if (state.grounded && state.smoothedMovementIntensity > 0.1) {
            bobY = Math.sin(state.bobTime * CONFIG.ANIMATION_SPEED) * state.smoothedMovementIntensity;
        }
        
        // Apply bobbing to hands
        hands.leftHand.style.transform = `translateY(${-bobY * 10}px)`;
        hands.rightHand.style.transform = `translateY(${bobY * 10}px)`;
        
        // Handle strike animation if state.striking is true
        if (state.striking) {
            // Forward motion for strike
            const strikeAnimation = (progress) => {
                if (progress < 0.5) {
                    // Forward motion (0-0.5)
                    return progress * 2; // 0 to 1
                } else {
                    // Return motion (0.5-1)
                    return 2 - progress * 2; // 1 to 0
                }
            };
            
            // Update strike progress
            state.strikeProgress += CONFIG.HANDS.STRIKE.SPEED * deltaTime;
            if (state.strikeProgress > 1) {
                state.strikeProgress = 0;
                state.striking = false;
            }
            
            // Calculate strike animation value
            const strikeValue = strikeAnimation(state.strikeProgress);
            
            // Apply strike animation to right hand
            const distance = CONFIG.HANDS.STRIKE.DISTANCE;
            hands.rightHand.style.transform = 
                `translateY(${bobY * 10}px) translateZ(${strikeValue * distance}px)`;
        }
    }
}; 