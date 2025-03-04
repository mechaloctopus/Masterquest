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
        if (initialized) return;
        
        try {
            console.log("[Radio] Initializing radio player...");
            
            // Setup track list
            setupTracks();
            
            // Setup event handlers
            setupEventHandlers();
            
            // Setup audio ended handler
            audioElement.addEventListener('ended', function() {
                playNextTrack();
            });
            
            // Set initial volume
            if (volumeControl) {
                audioElement.volume = volumeControl.value / 100;
            }
            
            // Set global audio volume if AudioSystem exists
            if (window.AudioSystem && sfxVolumeControl) {
                AudioSystem.setVolume(sfxVolumeControl.value / 100);
            }
            
            // Log if logger available
            if (window.Logger) {
                Logger.log("> RADIO PLAYER INITIALIZED");
            }
            
            // Set as initialized
            initialized = true;
            console.log("[Radio] Player initialized successfully");

            // Position the radio player in the center
            positionRadioPlayer();
            
            // Re-position on window resize
            window.addEventListener('resize', positionRadioPlayer);
        } catch (e) {
            console.error("[Radio] Initialization failed:", e);
        }
    }
    
    // Setup the tracks list
    function setupTracks() {
        if (!tracksContainer) return;
        
        // Clear any existing tracks
        tracksContainer.innerHTML = '';
        
        // Get tracks from config if available, or use default tracks
        trackList = window.CONFIG?.AUDIO?.MUSIC || [
            { name: "Cyberpunk Mixtape", path: "audio/music/cyberpunk-mixtape.mp3" },
            { name: "Neon Lights", path: "audio/music/neon-lights.mp3" },
            { name: "Digital Dreams", path: "audio/music/digital-dreams.mp3" }
        ];
        
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
        audioElement.src = trackList[index].path;
        
        // Play the track
        audioElement.play()
            .then(() => {
                isPlaying = true;
                updatePlayerUI();
            })
            .catch(err => {
                console.error("[Radio] Error playing track:", err);
                isPlaying = false;
                updatePlayerUI();
            });
        
        // Update now playing text
        if (nowPlayingText) {
            nowPlayingText.textContent = trackList[index].name;
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