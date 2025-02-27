// Audio System
const AudioSystem = {
    create: function() {
        // Create audio system
        const audioSystem = {
            context: new (window.AudioContext || window.webkitAudioContext)(),
            music: null,
            currentTrackIndex: CONFIG.AUDIO.MUSIC.CURRENT_TRACK_INDEX || 0,
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

        // Load background music with track selection
        const loadMusic = (trackIndex = 0) => {
            // Stop current music if it exists
            if (audioSystem.music) {
                audioSystem.music.pause();
                audioSystem.music.currentTime = 0;
            }
            
            // Get track from config
            const tracks = CONFIG.AUDIO.TRACKS;
            if (!tracks || !tracks.length) {
                Logger.error("No music tracks configured");
                return Promise.resolve();
            }
            
            // Ensure track index is valid
            audioSystem.currentTrackIndex = (trackIndex + tracks.length) % tracks.length;
            const track = tracks[audioSystem.currentTrackIndex];
            
            // Create and configure audio element
            const music = new Audio(track.URL);
            music.loop = true;
            music.volume = audioSystem.volumes.music;
            
            music.addEventListener('canplaythrough', () => {
                audioSystem.loaded.music = true;
                Logger.log(`> MUSIC READY: ${track.NAME}`);
            });
            
            music.addEventListener('error', (e) => {
                Logger.error(`Background music failed to load: ${track.NAME}`, e);
            });
            
            audioSystem.music = music;
            return music.play().catch(e => {
                Logger.error("Music autoplay prevented: " + e.message);
            });
        };

        // Add radio functionality
        audioSystem.nextTrack = function() {
            return loadMusic(audioSystem.currentTrackIndex + 1);
        };
        
        audioSystem.previousTrack = function() {
            return loadMusic(audioSystem.currentTrackIndex - 1);
        };
        
        audioSystem.getCurrentTrackInfo = function() {
            const track = CONFIG.AUDIO.TRACKS[audioSystem.currentTrackIndex];
            return track ? track.NAME : "Unknown";
        };

        // Load sound effects
        const loadSoundEffect = (url, type) => {
            const sound = new Audio(url);
            sound.addEventListener('canplaythrough', () => {
                audioSystem.loaded[type] = true;
            });
            sound.onerror = () => {
                Logger.error(`Sound effect failed to load: ${url}`);
            };
            sound.addEventListener('error', () => 
                Logger.error(`Sound effect failed to load: ${url}`));
            sound.volume = audioSystem.volumes.sfx;
            return sound;
        };

        // Initialize all sound effects
        audioSystem.sfx.footsteps = loadSoundEffect(CONFIG.AUDIO.SFX.FOOTSTEPS.URL, 'footsteps');
        audioSystem.sfx.footsteps.loop = true;
        audioSystem.sfx.jump = loadSoundEffect(CONFIG.AUDIO.SFX.JUMP.URL, 'jump');
        audioSystem.sfx.strike = loadSoundEffect(CONFIG.AUDIO.SFX.STRIKE.URL, 'strike');

        // Set up volume controls and add track controls
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            audioSystem.volumes.music = e.target.value / 100;
            if (audioSystem.music) audioSystem.music.volume = audioSystem.volumes.music;
        });

        // Add listeners for next/previous track if the elements exist
        const nextTrackBtn = document.getElementById('nextTrack');
        if (nextTrackBtn) {
            nextTrackBtn.addEventListener('click', () => audioSystem.nextTrack());
        }
        
        const prevTrackBtn = document.getElementById('prevTrack');
        if (prevTrackBtn) {
            prevTrackBtn.addEventListener('click', () => audioSystem.previousTrack());
        }

        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            audioSystem.volumes.sfx = e.target.value / 100;
            Object.values(audioSystem.sfx).forEach(sfx => {
                sfx.volume = audioSystem.volumes.sfx;
            });
        });

        // Start background music (requires user interaction first on most browsers)
        document.addEventListener('click', () => loadMusic(audioSystem.currentTrackIndex), {once: true});
        
        // Add a general error handler for audio context issues
        audioSystem.context.addEventListener('statechange', () => {
            if (audioSystem.context.state === 'interrupted') 
                Logger.error("Audio context interrupted");
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

        // Add this inside the create function
        const initializeAudioEffects = (context) => {
            // Create a master compressor for that punchy synthwave sound
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            compressor.connect(context.destination);
            
            // Create a reverb for that spacey synthwave feel
            const convolver = context.createConvolver();
            const reverbLength = 2;
            const rate = context.sampleRate;
            const reverbBuffer = context.createBuffer(2, rate * reverbLength, rate);
            for (let channel = 0; channel < 2; channel++) {
                const data = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * reverbLength / 2));
                }
            }
            convolver.buffer = reverbBuffer;
            convolver.connect(compressor);
            
            return { compressor, convolver };
        };

        // Add this to the audioSystem object
        const effects = initializeAudioEffects(audioSystem.context);
        audioSystem.effects = effects;

        // Then modify the loadSound function to use these effects
        audioSystem.loadSound = function(url, volume, loop = false) {
            // ... existing code ...
            
            // Connect to effects chain for more synthwave goodness
            source.connect(this.effects.convolver);
            
            // ... rest of the function ...
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