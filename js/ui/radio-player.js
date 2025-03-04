// Radio Player System
window.RadioPlayerSystem = (function() {
    // Ensure the radio player is centered
    function positionRadioPlayer() {
        const player = document.getElementById('radioPlayer');
        if (player) {
            player.style.position = 'absolute';
            player.style.top = '20px';
            player.style.left = '50%';
            player.style.transform = 'translateX(-50%)';
            player.style.right = 'auto';
            console.log("[RadioPlayer] Positioned in center");
        }
    }

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
            
            // Check if config exists
            if (!window.CONFIG) {
                console.warn("[Radio] CONFIG not found, using default settings");
            }
            
            // Setup track elements
            setupTracks();
            
            // Setup event handlers
            setupEventHandlers();
            
            // Set initial volume
            if (volumeControl && window.CONFIG && window.CONFIG.AUDIO && window.CONFIG.AUDIO.MUSIC) {
                const initialVolume = window.CONFIG.AUDIO.MUSIC.VOLUME * 100 || 50;
                volumeControl.value = initialVolume;
                audioElement.volume = initialVolume / 100;
            }
            
            // Set SFX volume
            if (sfxVolumeControl && window.CONFIG && window.CONFIG.AUDIO && window.CONFIG.AUDIO.SFX) {
                sfxVolumeControl.value = 70; // Default value
            }
            
            initialized = true;
            console.log("[Radio] Player initialized successfully");

            // Position the radio player in the center
            positionRadioPlayer();
            
            // Re-position on window resize
            window.addEventListener('resize', positionRadioPlayer);
            
            // Key event listener for 'M' key to toggle radio
            window.addEventListener('keydown', (e) => {
                if (e.key === 'm' || e.key === 'M') {
                    const radioPlayer = document.getElementById('radioPlayer');
                    if (radioPlayer) {
                        radioPlayer.classList.toggle('collapsed');
                        const radioToggle = document.getElementById('radioToggle');
                        if (radioToggle) {
                            radioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
                        }
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
        if (!tracksContainer) return;
        
        // Clear any existing tracks
        tracksContainer.innerHTML = '';
        
        // Get tracks from config if available, or use default tracks
        if (window.CONFIG && window.CONFIG.AUDIO && window.CONFIG.AUDIO.TRACKS) {
            // Convert CONFIG.AUDIO.TRACKS format to our format
            trackList = window.CONFIG.AUDIO.TRACKS.map(track => {
                return {
                    name: track.NAME,
                    path: track.URL
                };
            });
        } else {
            // Fallback to default tracks
            trackList = [
                { name: "Cyberpunk Mixtape", path: "audio/music/cyberpunk-mixtape.mp3" },
                { name: "Neon Lights", path: "audio/music/neon-lights.mp3" },
                { name: "Digital Dreams", path: "audio/music/digital-dreams.mp3" }
            ];
        }
        
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
        
        console.log("[Radio] Added " + trackList.length + " tracks to playlist");
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
                player.classList.toggle('collapsed');
                radioToggle.textContent = player.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
    }
    
    // Play a specific track
    function playTrack(index) {
        if (index < 0 || index >= trackList.length) return;
        
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
                })
                .catch(err => {
                    console.error("[Radio] Error playing track:", err);
                    // Show error in now playing text
                    if (nowPlayingText) {
                        nowPlayingText.textContent = "Error: Could not play " + trackList[index].name;
                    }
                    isPlaying = false;
                    updatePlayerUI();
                });
                
            // Add error handler for missing files
            audioElement.onerror = function() {
                console.error("[Radio] Error loading audio file:", trackList[index].path);
                if (nowPlayingText) {
                    nowPlayingText.textContent = "Error: File not found - " + trackList[index].name;
                }
                isPlaying = false;
                updatePlayerUI();
            };
        } catch (e) {
            console.error("[Radio] Error setting up track:", e);
            if (nowPlayingText) {
                nowPlayingText.textContent = "Error: Failed to load track";
            }
            isPlaying = false;
            updatePlayerUI();
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