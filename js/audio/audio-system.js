// Audio System
const AudioSystem = {
    create: function() {
        // Create audio system
        const audioSystem = {
            context: new (window.AudioContext || window.webkitAudioContext)(),
            music: null,
            sfx: {
                footsteps: null,
                jump: null,
                strike: null
            },
            volumes: {
                music: CONFIG.AUDIO.MUSIC.VOLUME,
                sfx: 0.7
            },
            isWalking: false,
            loaded: {
                music: false,
                footsteps: false,
                jump: false,
                strike: false
            }
        };

        // Load background music
        const loadMusic = () => {
            const music = new Audio(CONFIG.AUDIO.MUSIC.URL);
            music.loop = true;
            music.volume = audioSystem.volumes.music;
            music.addEventListener('canplaythrough', () => {
                audioSystem.loaded.music = true;
                Logger.log("> MUSIC READY");
            });
            music.addEventListener('error', () => 
                Logger.warning("Background music failed to load"));
            audioSystem.music = music;
            return music.play().catch(e => {
                Logger.warning("Music autoplay prevented: " + e.message);
            });
        };

        // Load sound effects
        const loadSoundEffect = (url, type) => {
            const sound = new Audio(url);
            sound.addEventListener('canplaythrough', () => {
                audioSystem.loaded[type] = true;
            });
            sound.onerror = () => {
                Logger.warning(`Sound effect failed to load: ${url}`);
            };
            sound.addEventListener('error', () => 
                Logger.warning(`Sound effect failed to load: ${url}`));
            sound.volume = audioSystem.volumes.sfx;
            return sound;
        };

        // Initialize all sound effects
        audioSystem.sfx.footsteps = loadSoundEffect(CONFIG.AUDIO.SFX.FOOTSTEPS.URL, 'footsteps');
        audioSystem.sfx.footsteps.loop = true;
        audioSystem.sfx.jump = loadSoundEffect(CONFIG.AUDIO.SFX.JUMP.URL, 'jump');
        audioSystem.sfx.strike = loadSoundEffect(CONFIG.AUDIO.SFX.STRIKE.URL, 'strike');

        // Set up volume controls
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            audioSystem.volumes.music = e.target.value / 100;
            if (audioSystem.music) audioSystem.music.volume = audioSystem.volumes.music;
        });

        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            audioSystem.volumes.sfx = e.target.value / 100;
            Object.values(audioSystem.sfx).forEach(sfx => {
                sfx.volume = audioSystem.volumes.sfx;
            });
        });

        // Start background music (requires user interaction first on most browsers)
        document.addEventListener('click', () => loadMusic(), {once: true});
        
        // Add a general error handler for audio context issues
        audioSystem.context.addEventListener('statechange', () => {
            if (audioSystem.context.state === 'interrupted') 
                Logger.warning("Audio context interrupted");
        });
        
        // Helper function to safely play sounds
        audioSystem.playSound = function(sound, type) {
            if (sound && audioSystem.loaded[type]) {
                return sound.play().catch(e => {
                    console.warn("Could not play sound:", e);
                });
            }
            return Promise.resolve(); // Return resolved promise if sound can't be played
        };

        return audioSystem;
    },
    
    update: function(state, audioSystem) {
        // Handle footstep sounds
        if (state.moveVector.length() > 0.1 && state.grounded) {
            if (!audioSystem.isWalking && audioSystem.loaded.footsteps) {
                audioSystem.playSound(audioSystem.sfx.footsteps, 'footsteps');
                audioSystem.isWalking = true;
            }
        } else if (audioSystem.isWalking && audioSystem.loaded.footsteps) {
            audioSystem.sfx.footsteps.pause();
            audioSystem.sfx.footsteps.currentTime = 0;
            audioSystem.isWalking = false;
        }
    }
}; 