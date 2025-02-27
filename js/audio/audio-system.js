// Audio System
const AudioSystem = {
    create: function() {
        // Create audio system
        const audioSystem = {
            context: null,
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
            },
            tracks: [],
            queue: []
        };

        // Initialize audio context with error handling
        try {
            audioSystem.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            Logger.error("Failed to create audio context: " + e.message);
            // Create a dummy context to prevent errors
            audioSystem.context = {
                createDynamicsCompressor: () => ({ connect: () => {} }),
                createConvolver: () => ({ connect: () => {}, buffer: null }),
                createBuffer: () => ({}),
                destination: {},
                sampleRate: 44100
            };
        }

        // Preload all tracks
        audioSystem.preloadTracks = function() {
            if (!CONFIG.AUDIO.TRACKS || !CONFIG.AUDIO.TRACKS.length) {
                Logger.error("No music tracks configured");
                return;
            }
            
            // Preload each track
            CONFIG.AUDIO.TRACKS.forEach((track, index) => {
                Logger.log(`> PRELOADING TRACK: ${track.NAME}`);
                const audio = new Audio();
                
                audio.addEventListener('canplaythrough', () => {
                    audioSystem.tracks[index].loaded = true;
                    Logger.log(`> TRACK READY: ${track.NAME}`);
                });
                
                audio.addEventListener('error', (e) => {
                    Logger.error(`Failed to load track: ${track.NAME}`);
                    // Set a flag so we know this track failed
                    audioSystem.tracks[index].error = true;
                });
                
                // Attempt to load the track
                audio.src = track.URL;
                audio.load(); // Start loading
                
                // Store track information
                audioSystem.tracks[index] = {
                    audio: audio,
                    name: track.NAME,
                    url: track.URL,
                    loaded: false,
                    error: false
                };
            });
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
            
            Logger.log(`> LOADING MUSIC: ${track.NAME}`);
            
            // Create and configure audio element
            const music = new Audio();
            music.loop = true;
            music.volume = audioSystem.volumes.music;
            
            // Add listeners first before setting source
            music.addEventListener('canplaythrough', () => {
                audioSystem.loaded.music = true;
                Logger.log(`> MUSIC READY: ${track.NAME}`);
            });
            
            music.addEventListener('error', (e) => {
                Logger.error(`Background music failed to load: ${track.NAME}`);
                // Try next track if this one fails
                audioSystem.nextTrack();
            });
            
            // Set source and start loading
            music.src = track.URL;
            audioSystem.music = music;
            
            // Return a promise for play attempt
            return new Promise((resolve, reject) => {
                // Wait a bit to ensure we have enough data
                setTimeout(() => {
                    music.play()
                        .then(resolve)
                        .catch(e => {
                            Logger.error("Music autoplay prevented: " + e.message);
                            reject(e);
                        });
                }, 50);
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

        // Load sound effect with better error handling
        const loadSoundEffect = (url, type) => {
            Logger.log(`> LOADING SFX: ${type}`);
            
            const sound = new Audio();
            sound.addEventListener('canplaythrough', () => {
                audioSystem.loaded[type] = true;
                Logger.log(`> SFX READY: ${type}`);
            });
            
            sound.addEventListener('error', (e) => {
                Logger.error(`Sound effect failed to load: ${url}`);
                // Try to set default audio to prevent further errors
                setDefaultAudio(sound);
            });
            
            sound.volume = audioSystem.volumes.sfx;
            sound.src = url;
            sound.load(); // Start loading
            
            return sound;
        };
        
        // Set a default silent audio for cases where loading fails
        const setDefaultAudio = (audioElement) => {
            // Create a short silent audio buffer
            try {
                // Create a short silent audio that works without network requests
                const silentMp3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//uQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwBK8AAAAAAAAAABUgJAUHQQAB9gAAA0LGZFsYAAAAAAAAAAAAAAAAAAAA';
                audioElement.src = silentMp3;
            } catch (e) {
                Logger.error("Could not create fallback audio: " + e.message);
            }
        };

        // Initialize all sound effects
        audioSystem.sfx.footsteps = loadSoundEffect(CONFIG.AUDIO.SFX.FOOTSTEPS.URL, 'footsteps');
        audioSystem.sfx.footsteps.loop = true;
        audioSystem.sfx.jump = loadSoundEffect(CONFIG.AUDIO.SFX.JUMP.URL, 'jump');
        audioSystem.sfx.strike = loadSoundEffect(CONFIG.AUDIO.SFX.STRIKE.URL, 'strike');

        // Set up volume controls
        const musicVolumeSlider = document.getElementById('musicVolume');
        if (musicVolumeSlider) {
            musicVolumeSlider.addEventListener('input', (e) => {
                audioSystem.volumes.music = e.target.value / 100;
                if (audioSystem.music) audioSystem.music.volume = audioSystem.volumes.music;
            });
        }

        // Add listeners for next/previous track if the elements exist
        const nextTrackBtn = document.getElementById('nextTrack');
        if (nextTrackBtn) {
            nextTrackBtn.addEventListener('click', () => audioSystem.nextTrack());
        }
        
        const prevTrackBtn = document.getElementById('prevTrack');
        if (prevTrackBtn) {
            prevTrackBtn.addEventListener('click', () => audioSystem.previousTrack());
        }

        const sfxVolumeSlider = document.getElementById('sfxVolume');
        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener('input', (e) => {
                audioSystem.volumes.sfx = e.target.value / 100;
                Object.values(audioSystem.sfx).forEach(sfx => {
                    if (sfx) sfx.volume = audioSystem.volumes.sfx;
                });
            });
        }

        // Add an interaction event listener to start audio
        const unlockAudio = () => {
            // Create and play a silent sound to unlock audio
            const silentSound = audioSystem.context.createBuffer(1, 1, 22050);
            const source = audioSystem.context.createBufferSource();
            source.buffer = silentSound;
            source.connect(audioSystem.context.destination);
            source.start(0);
            
            // Resume audio context if suspended
            if (audioSystem.context.state === 'suspended') {
                audioSystem.context.resume();
            }
            
            // Start background music after unlocking
            loadMusic(audioSystem.currentTrackIndex).catch(e => {
                // Silent catch to prevent uncaught promise
                console.log("Audio playback waiting for user interaction");
            });
            
            // Remove the listener after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        
        // Add event listeners to unlock audio
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        
        // Add a general error handler for audio context issues
        if (audioSystem.context.addEventListener) {
            audioSystem.context.addEventListener('statechange', () => {
                if (audioSystem.context.state === 'interrupted') 
                    Logger.error("Audio context interrupted");
                if (audioSystem.context.state === 'running')
                    Logger.log("> AUDIO CONTEXT RUNNING");
            });
        }
        
        // Helper function to safely play sounds
        audioSystem.playSound = function(sound, type) {
            if (!sound) return Promise.resolve();
            
            // Create a queue for sounds to prevent overlapping issues
            if (!this.queue[type]) this.queue[type] = [];
            
            // Return a promise for the sound
            return new Promise((resolve) => {
                // If sound is already loaded, play it immediately
                if (this.loaded[type]) {
                    // Reset the sound if it's already playing
                    if (!sound.paused) {
                        sound.currentTime = 0;
                    } else {
                        sound.play().catch(e => {
                            console.warn("Could not play sound:", e);
                        }).finally(resolve);
                    }
                } else {
                    // If not loaded yet, queue it up
                    this.queue[type].push(() => {
                        sound.play().catch(e => {
                            console.warn("Could not play sound:", e);
                        }).finally(resolve);
                    });
                    
                    // Add a listener to play when loaded
                    sound.addEventListener('canplaythrough', () => {
                        // Process the queue
                        while (this.queue[type] && this.queue[type].length) {
                            const playFunc = this.queue[type].shift();
                            playFunc();
                        }
                    }, { once: true });
                }
            });
        };

        // Initialize audio effects
        const initializeAudioEffects = (context) => {
            try {
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
            } catch (e) {
                Logger.error("Failed to initialize audio effects: " + e.message);
                return { 
                    compressor: { connect: () => {} }, 
                    convolver: { connect: () => {}, buffer: null } 
                };
            }
        };

        // Add effects to the audioSystem object
        const effects = initializeAudioEffects(audioSystem.context);
        audioSystem.effects = effects;

        // Load sound with effects chain
        audioSystem.loadSound = function(url, volume, loop = false) {
            const sound = new Audio(url);
            sound.volume = volume || 0.7;
            sound.loop = loop;
            
            try {
                // Connect to effects chain for more synthwave goodness
                const source = this.context.createMediaElementSource(sound);
                source.connect(this.effects.convolver);
            } catch (e) {
                Logger.error("Could not connect sound to effects chain: " + e.message);
            }
            
            return sound;
        };

        // Preload all tracks
        audioSystem.preloadTracks();

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