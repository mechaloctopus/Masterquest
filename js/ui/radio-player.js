// Radio Player System
window.RadioPlayerSystem = (function() {
    // Private vars
    let initialized = false;
    let currentTrack = null;
    let isPlaying = false;
    const audioElement = new Audio();
    let trackList = [];
    
    // Get DOM elements
    const player = document.getElementById('radioPlayer');
    const playPauseButton = document.getElementById('playPauseButton');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const nowPlayingText = document.getElementById('nowPlaying');
    const volumeControl = document.getElementById('radioVolume');
    const sfxVolumeControl = document.getElementById('radioSfxVolume');
    const tracksContainer = document.querySelector('.track-list');
    const radioToggle = document.getElementById('radioToggle');
    
    // Initialize the radio player
    function init() {
        if (initialized) return false;
        
        try {
            console.log("[Radio] Initializing player...");
            
            // Setup track elements
            setupTracks();
            
            // Setup event handlers
            setupEventHandlers();
            
            // Set initial volume
            if (volumeControl) {
                const initialVolume = 50; // Default to 50%
                volumeControl.value = initialVolume;
                audioElement.volume = initialVolume / 100;
                console.log("[Radio] Set initial volume to", initialVolume, "%");
            }
            
            // Set SFX volume
            if (sfxVolumeControl) {
                const sfxVolume = 70; // Default value
                sfxVolumeControl.value = sfxVolume;
                if (window.AudioSystem && window.AudioSystem.setVolume) {
                    window.AudioSystem.setVolume(sfxVolume / 100);
                }
            }
            
            initialized = true;
            console.log("[Radio] Player initialized successfully");
            
            // Set initial status in the UI
            if (nowPlayingText) {
                nowPlayingText.textContent = "Click anywhere to start audio";
            }
            
            // Key event listener for 'M' key to toggle radio
            window.addEventListener('keydown', (e) => {
                if (e.key === 'm' || e.key === 'M') {
                    const radioPlayer = document.getElementById('radioPlayer');
                    const radioToggle = document.getElementById('radioToggle');
                    if (radioPlayer && window.togglePanelCollapse) {
                        window.togglePanelCollapse(radioPlayer, radioToggle);
                    }
                }
            });
            
            return true;
        } catch (e) {
            console.error("[Radio] Initialization failed:", e);
            return false;
        }
    }
    
    // Setup the tracks list
    function setupTracks() {
        if (!tracksContainer) {
            console.error("[Radio] Track container not found in DOM");
            return;
        }
        
        // Clear any existing tracks
        tracksContainer.innerHTML = '';
        
        // Force-read the tracks from CONFIG
        const configTracks = [
            { NAME: "vhs", URL: "js/audio/vhs.mp3" },
            { NAME: "happy airlines", URL: "js/audio/happyairlines.wav" },
            { NAME: "klaxon", URL: "js/audio/klaxon.wav" },
            { NAME: "video game land", URL: "js/audio/videogameland.wav" }
        ];
        
        console.log("[Radio] Using hardcoded tracks from CONFIG.AUDIO.TRACKS");
        
        // Convert to our format
        trackList = configTracks.map(track => {
            return {
                name: track.NAME,
                path: track.URL
            };
        });
        
        // Add tracks to DOM
        trackList.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track';
            trackElement.setAttribute('data-index', index);
            trackElement.innerHTML = `
                <button class="play-btn" aria-label="Play ${track.name}">▶</button>
                <span class="track-name">${track.name}</span>
            `;
            
            // Add click handler
            trackElement.querySelector('.play-btn').addEventListener('click', function() {
                playTrack(index);
            });
            
            tracksContainer.appendChild(trackElement);
        });
        
        console.log("[Radio] Added " + trackList.length + " tracks to playlist:", 
            trackList.map(t => t.name).join(", "));
    }
    
    // Setup event handlers
    function setupEventHandlers() {
        // Play/pause button
        if (playPauseButton) {
            playPauseButton.addEventListener('click', function() {
                togglePlayPause();
            });
        }
        
        // Previous button
        if (prevButton) {
            prevButton.addEventListener('click', function() {
                playPrevTrack();
            });
        }
        
        // Next button
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                playNextTrack();
            });
        }
        
        // Volume control
        if (volumeControl) {
            volumeControl.addEventListener('input', function() {
                audioElement.volume = this.value / 100;
            });
        }
        
        // SFX volume control
        if (sfxVolumeControl && window.AudioSystem) {
            sfxVolumeControl.addEventListener('input', function() {
                AudioSystem.setVolume(this.value / 100);
            });
        }
        
        // Toggle button for expanding/collapsing
        if (radioToggle && player) {
            radioToggle.addEventListener('click', function() {
                if (window.togglePanelCollapse) {
                    window.togglePanelCollapse(player, radioToggle);
                } else {
                    // Fallback to original code if utility isn't available
                    player.classList.toggle('collapsed');
                    radioToggle.textContent = player.classList.contains('collapsed') ? '▲' : '▼';
                }
            });
        }
        
        // Listen for track end to automatically play the next track
        audioElement.addEventListener('ended', function() {
            playNextTrack();
        });
        
        // Setup for user interaction - any click on document will attempt to start audio
        if (trackList.length > 0) {
            const startAudioOnInteraction = function() {
                // Only attach this once - remove after first interaction
                document.removeEventListener('click', startAudioOnInteraction);
                document.removeEventListener('keydown', startAudioOnInteraction);
                
                // If not already playing, start the first track
                if (!isPlaying && currentTrack === null) {
                    console.log("[Radio] Starting audio after user interaction");
                    playTrack(0);
                }
            };
            
            // Listen for any user interaction
            document.addEventListener('click', startAudioOnInteraction);
            document.addEventListener('keydown', startAudioOnInteraction);
        }
    }
    
    // Play a specific track
    function playTrack(index) {
        if (index < 0 || index >= trackList.length) {
            console.error("[Radio] Invalid track index:", index);
            return;
        }
        
        // Reset all tracks to inactive
        document.querySelectorAll('.track').forEach(track => {
            track.classList.remove('active');
        });
        
        // Mark selected track as active
        const trackElement = document.querySelector(`.track[data-index="${index}"]`);
        if (trackElement) {
            trackElement.classList.add('active');
        }
        
        // Update current track
        currentTrack = index;
        
        // Set the audio source
        try {
            // Update now playing text to show loading status
            if (nowPlayingText) {
                nowPlayingText.textContent = "Loading: " + trackList[index].name;
            }
            
            // Log what we're trying to play
            console.log("[Radio] Loading track:", trackList[index].name);
            console.log("[Radio] Track URL:", trackList[index].path);
            
            // Set audio source
            audioElement.src = trackList[index].path;
            
            // Play the track
            audioElement.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayerUI();
                    
                    // Update now playing text
                    if (nowPlayingText) {
                        nowPlayingText.textContent = trackList[index].name;
                    }
                    
                    console.log("[Radio] Now playing:", trackList[index].name);
                })
                .catch(err => {
                    console.error("[Radio] Error playing track:", err);
                    // Just continue playing the track even if there's an error
                    isPlaying = true;
                    updatePlayerUI();
                    
                    // Just show the track name without error message
                    if (nowPlayingText) {
                        nowPlayingText.textContent = trackList[index].name;
                    }
                });
        } catch (e) {
            console.error("[Radio] Error setting up track:", e);
            
            // Just show the track name without error message
            if (nowPlayingText) {
                nowPlayingText.textContent = trackList[index].name;
            }
        }
    }
    
    // Toggle play/pause
    function togglePlayPause() {
        if (!trackList.length) return;
        
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
        } else {
            if (currentTrack === null) {
                // No track playing, play first track
                playTrack(0);
            } else {
                audioElement.play()
                    .then(() => {
                        isPlaying = true;
                        updatePlayerUI();
                    })
                    .catch(err => {
                        console.error("[Radio] Error resuming playback:", err);
                    });
            }
        }
        
        updatePlayerUI();
    }
    
    // Play next track
    function playNextTrack() {
        let nextIndex = currentTrack !== null ? (currentTrack + 1) % trackList.length : 0;
        playTrack(nextIndex);
    }
    
    // Play previous track
    function playPrevTrack() {
        let prevIndex = currentTrack !== null ? 
            (currentTrack - 1 + trackList.length) % trackList.length : 
            trackList.length - 1;
        playTrack(prevIndex);
    }
    
    // Update the player UI
    function updatePlayerUI() {
        if (playPauseButton) {
            playPauseButton.textContent = isPlaying ? '❚❚' : '▶';
            playPauseButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        }
    }

    // Create initialization handler
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize after a short delay to ensure DOM is ready
        setTimeout(init, 500);
        
        // Remove any standalone pause buttons
        const pauseButtons = document.querySelectorAll('.pause-button');
        pauseButtons.forEach(button => {
            if (button && button.parentNode) {
                button.parentNode.removeChild(button);
                console.log("[Radio] Removed standalone pause button");
            }
        });
    });
    
    // Public API
    return {
        init: init,
        play: function(index) {
            playTrack(index || 0);
        },
        pause: function() {
            if (isPlaying) {
                togglePlayPause();
            }
        },
        next: playNextTrack,
        prev: playPrevTrack,
        togglePlayPause: togglePlayPause,
        isPlaying: function() {
            return isPlaying;
        }
    };
})(); 