// Audio System - Works alongside RadioPlayerSystem
const AudioSystem = {
    context: null,
    sfx: {
        footsteps: null,
        jump: null,
        strike: null
    },
    loaded: {
        footsteps: false,
        jump: false,
        strike: false
    },
    isWalking: false,
    
    create: function() {
        try {
            // Try to create audio context for better audio control
            if (window.AudioContext || window.webkitAudioContext) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Initialize sound effects
            this.sfx.footsteps = new Audio(CONFIG.AUDIO.SFX.FOOTSTEPS.URL);
            this.sfx.footsteps.volume = CONFIG.AUDIO.SFX.FOOTSTEPS.VOLUME;
            this.sfx.footsteps.loop = true;
            
            this.sfx.jump = new Audio(CONFIG.AUDIO.SFX.JUMP.URL);
            this.sfx.jump.volume = CONFIG.AUDIO.SFX.JUMP.VOLUME;
            
            this.sfx.strike = new Audio(CONFIG.AUDIO.SFX.STRIKE.URL);
            this.sfx.strike.volume = CONFIG.AUDIO.SFX.STRIKE.VOLUME;
            
            // Mark sounds as loaded
            this.loaded = {
                footsteps: true,
                jump: true,
                strike: true
            };
            
            Logger.log("> AUDIO INITIALIZED");
            return this;
        } catch (e) {
            Logger.error("Audio initialization error: " + e.message);
            return {
                sfx: { footsteps: {}, jump: {}, strike: {} },
                isWalking: false,
                loaded: { footsteps: false, jump: false, strike: false }
            };
        }
    },
    
    update: function(state, audioSystem) {
        // This is kept simple as RadioPlayerSystem handles most audio now
        if (!audioSystem || !audioSystem.loaded) return;
        
        // Footsteps audio logic (only play if not already playing and if moving)
        const isMoving = state.moveVector && state.moveVector.length() > 0.1;
        if (isMoving && !audioSystem.isWalking && state.grounded && audioSystem.sfx.footsteps) {
            if (audioSystem.sfx.footsteps.play) {
                audioSystem.sfx.footsteps.play().catch(e => console.warn("Footsteps play failed:", e));
                audioSystem.isWalking = true;
            }
        } else if ((!isMoving || !state.grounded) && audioSystem.isWalking && audioSystem.sfx.footsteps) {
            if (audioSystem.sfx.footsteps.pause) {
                audioSystem.sfx.footsteps.pause();
                if (audioSystem.sfx.footsteps.currentTime) {
                    audioSystem.sfx.footsteps.currentTime = 0;
                }
                audioSystem.isWalking = false;
            }
        }
    },
    
    playSound: function(sound, name) {
        if (!sound || !sound.play) return;
        
        sound.play().catch(e => {
            console.warn(`Failed to play ${name} sound:`, e);
            
            // Try to unlock audio context
            if (this.context) {
                this.context.resume().then(() => {
                    sound.play().catch(err => console.warn(`Still failed to play ${name}:`, err));
                });
            }
        });
    }
}; 