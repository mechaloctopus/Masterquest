// Radio Player System - Central Audio Controller
const RadioPlayerSystem = {
    init: function() {
        this.playerElement = document.getElementById('radioPlayer');
        this.toggleButton = document.getElementById('radioToggle');
        this.volumeSlider = document.getElementById('radioVolume');
        this.sfxVolumeSlider = document.getElementById('radioSfxVolume');
        
        // Track elements will be populated in loadTracksFromConfig
        this.trackElements = [];
        
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.isPlaying = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Add global player controls
        this.playerControls = document.getElementById('playerControls');
        this.playPauseBtn = document.getElementById('playPauseButton');
        this.nextBtn = document.getElementById('nextButton');
        this.prevBtn = document.getElementById('prevButton');
        
        // Initialize with configuration
        this.setupPlayer();
        this.loadTracksFromConfig();
        
        // Set starting volumes from config
        this.volumeSlider.value = CONFIG.AUDIO.MUSIC.VOLUME * 100;
        this.sfxVolumeSlider.value = CONFIG.UI.AUDIO_CONTROLS.SFX_VOLUME * 100;
        
        // Initially collapse if configured
        if (CONFIG.UI.AUDIO_CONTROLS.COLLAPSED_BY_DEFAULT) {
            this.playerElement.classList.add('collapsed');
            this.toggleButton.textContent = '▶ RADIO';
        }
        
        // Instead of setting this object as a global, expose a clean API
        if (!window.RadioPlayer) {
            window.RadioPlayer = {
                getAudioElement: () => this.getAudioElement(),
                isAudioPlaying: () => this.isAudioPlaying(),
                getCurrentTrackName: () => this.getCurrentTrackName(),
                togglePlayPause: () => this.togglePlayPause(),
                playNextTrack: () => this.playNextTrack(),
                playPreviousTrack: () => this.playPreviousTrack(),
                getVolume: () => this.volumeSlider.value / 100,
                setVolume: (vol) => {
                    this.volumeSlider.value = vol * 100;
                    this.audioElement.volume = vol;
                }
            };
        }
        
        Logger.log("> RADIO PLAYER INITIALIZED");
        
        // If configured to autoplay, start the default track
        if (CONFIG.AUDIO.MUSIC.AUTOPLAY && this.trackElements.length > 0) {
            setTimeout(() => {
                const trackIndex = CONFIG.AUDIO.MUSIC.CURRENT_TRACK_INDEX || 0;
                const trackToPlay = this.trackElements[trackIndex] || this.trackElements[0];
                this.playTrack(trackToPlay.dataset.url, trackToPlay);
            }, 500);
        }
    },
    
    setupPlayer: function() {
        // Toggle collapse/expand
        this.toggleButton.addEventListener('click', () => {
            this.playerElement.classList.toggle('collapsed');
            this.toggleButton.textContent = this.playerElement.classList.contains('collapsed') ? '▶ RADIO' : '▼';
        });
        
        // Volume control - synchronize all volume controls
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioElement.volume = volume;
            
            // Update config
            CONFIG.AUDIO.MUSIC.VOLUME = volume;
            
            // Update other volume controls that might exist
            const musicVolumeSlider = document.getElementById('musicVolume');
            if (musicVolumeSlider) {
                musicVolumeSlider.value = e.target.value;
            }
        });
        
        // SFX Volume control
        this.sfxVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            
            // Update config 
            CONFIG.UI.AUDIO_CONTROLS.SFX_VOLUME = volume;
            
            // Update AudioSystem's SFX volume if it exists
            if (window.AudioSystem) {
                Object.values(AudioSystem.sfx).forEach(sfx => {
                    if (sfx) sfx.volume = volume;
                });
            }
            
            // Update other volume controls that might exist
            const sfxVolumeSlider = document.getElementById('sfxVolume');
            if (sfxVolumeSlider) {
                sfxVolumeSlider.value = e.target.value;
            }
        });
        
        // Set up player controls if they exist
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.playNextTrack();
            });
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.playPreviousTrack();
            });
        }
        
        // Audio end event
        this.audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
        
        // Add pause/play state tracking
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            // Update all play buttons
            this.updatePlayButtons('❚❚');
            
            // Update the main play/pause button if it exists
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = '❚❚';
                this.playPauseBtn.setAttribute('aria-label', 'Pause');
            }
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            // Update all play buttons
            this.updatePlayButtons('▶');
            
            // Update the main play/pause button if it exists
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = '▶';
                this.playPauseBtn.setAttribute('aria-label', 'Play');
            }
        });
        
        // Add better error handling
        this.audioElement.addEventListener('error', (e) => {
            const errorMessage = e.target.error ? e.target.error.message : "Unknown error";
            Logger.error("Audio error: " + errorMessage);
            
            // Try to load a fallback track if available
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                Logger.log(`Retrying playback (${this.retryCount}/${this.maxRetries})...`);
                setTimeout(() => this.playNextTrack(), 1000);
            } else {
                this.retryCount = 0;
                Logger.error("Max retries reached. Could not play track.");
            }
        });
        
        // Add keyboard shortcuts for music control
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') { // M key to toggle play/pause
                this.togglePlayPause();
            } else if (e.code === 'KeyN') { // N key for next track
                this.playNextTrack();
            } else if (e.code === 'KeyB') { // B key for previous track
                this.playPreviousTrack();
            }
        });
    },
    
    updatePlayButtons: function(symbol) {
        // Update the play button in the currently playing track
        if (this.currentTrack) {
            const playBtn = this.currentTrack.querySelector('.play-btn');
            if (playBtn) playBtn.textContent = symbol;
        }
    },
    
    loadTracksFromConfig: function() {
        const trackList = document.querySelector('.track-list');
        if (!trackList) return;
        
        // Clear existing tracks
        trackList.innerHTML = '';
        
        // Add tracks from config
        if (CONFIG.AUDIO.TRACKS && CONFIG.AUDIO.TRACKS.length > 0) {
            CONFIG.AUDIO.TRACKS.forEach(track => {
                const trackElement = document.createElement('div');
                trackElement.className = 'track';
                trackElement.dataset.url = track.URL;
                trackElement.dataset.name = track.NAME;
                
                const playBtn = document.createElement('button');
                playBtn.className = 'play-btn';
                playBtn.textContent = '▶';
                playBtn.setAttribute('aria-label', `Play ${track.NAME}`);
                
                const trackName = document.createElement('span');
                trackName.className = 'track-name';
                trackName.textContent = track.NAME;
                
                trackElement.appendChild(playBtn);
                trackElement.appendChild(trackName);
                trackList.appendChild(trackElement);
                
                // Preload the track
                const preloadAudio = new Audio();
                preloadAudio.preload = 'metadata';
                
                try {
                    preloadAudio.src = track.URL;
                } catch (e) {
                    Logger.error(`Could not preload track: ${track.NAME} - ${e.message}`);
                }
                
                // Add click event
                playBtn.addEventListener('click', () => {
                    // If this is the current track, toggle play/pause
                    if (this.currentTrack === trackElement) {
                        this.togglePlayPause();
                    } else {
                        // Otherwise play the new track
                        this.playTrack(track.URL, trackElement);
                    }
                });
            });
            
            // Update track elements reference
            this.trackElements = Array.from(document.querySelectorAll('.track'));
        }
    },
    
    togglePlayPause: function() {
        if (!this.currentTrack) {
            // If no track is active, play the first one
            if (this.trackElements.length > 0) {
                const firstTrack = this.trackElements[0];
                this.playTrack(firstTrack.dataset.url, firstTrack);
            }
            return;
        }
        
        if (this.isPlaying) {
            // Pause the track
            this.audioElement.pause();
            // UI will update through the pause event listener
        } else {
            // Resume playing
            this.audioElement.play().catch(e => {
                Logger.error("Audio resume prevented: " + e.message);
                
                // Try to unlock audio context
                if (window.AudioSystem && AudioSystem.context) {
                    AudioSystem.context.resume().then(() => {
                        this.audioElement.play().catch(err => {
                            Logger.error("Still could not play audio: " + err.message);
                        });
                    });
                }
            });
            // UI will update through the play event listener
        }
    },
    
    playTrack: function(url, trackElement) {
        // Stop current track
        this.audioElement.pause();
        
        // Reset error count
        this.retryCount = 0;
        
        // Remove active class from all tracks
        this.trackElements.forEach(track => {
            track.classList.remove('active');
        });
        
        // Log attempt
        Logger.log("> PLAYING TRACK: " + url);
        Logger.log("> TRACK NAME: " + trackElement.dataset.name);
        
        // Add active class
        trackElement.classList.add('active');
        this.currentTrack = trackElement;
        
        // Update the current track index in config
        const trackIndex = this.trackElements.indexOf(trackElement);
        if (trackIndex >= 0) {
            CONFIG.AUDIO.MUSIC.CURRENT_TRACK_INDEX = trackIndex;
        }
        
        // Create a new audio element each time to avoid issues with failed loads
        this.audioElement = new Audio();
        
        // Set up event listeners
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButtons('❚❚');
            
            // Update the main play/pause button if it exists
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = '❚❚';
                this.playPauseBtn.setAttribute('aria-label', 'Pause');
            }
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButtons('▶');
            
            // Update the main play/pause button if it exists
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = '▶';
                this.playPauseBtn.setAttribute('aria-label', 'Play');
            }
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
        
        this.audioElement.addEventListener('error', (e) => {
            const errorMessage = e.target.error ? e.target.error.message : "Unknown error";
            Logger.error("Audio error: " + errorMessage);
            
            // Try to play the next track if this one fails
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.playNextTrack(), 1000);
            } else {
                this.retryCount = 0;
            }
        });
        
        // Set volume and load the track
        this.audioElement.volume = this.volumeSlider.value / 100;
        
        try {
            this.audioElement.src = url;
            
            // Update the currently playing track display if it exists
            const nowPlayingElement = document.getElementById('nowPlaying');
            if (nowPlayingElement) {
                nowPlayingElement.textContent = trackElement.dataset.name || 'Unknown Track';
            }
            
            // Play it
            this.audioElement.play().catch(e => {
                Logger.error("Audio playback prevented: " + e.message);
                
                // Try to unlock audio context
                if (window.AudioSystem && AudioSystem.context) {
                    AudioSystem.context.resume().then(() => {
                        // Try again after resuming context
                        this.audioElement.play().catch(err => {
                            Logger.error("Still could not play audio: " + err.message);
                        });
                    });
                }
            });
        } catch (e) {
            Logger.error(`Error setting audio source: ${e.message}`);
            // Try next track as fallback
            setTimeout(() => this.playNextTrack(), 1000);
        }
    },
    
    playNextTrack: function() {
        if (!this.currentTrack) {
            // If no track is active, play the first one
            if (this.trackElements.length > 0) {
                const firstTrack = this.trackElements[0];
                this.playTrack(firstTrack.dataset.url, firstTrack);
            }
            return;
        }
        
        // Find next track (or loop to first)
        const currentIndex = this.trackElements.indexOf(this.currentTrack);
        const nextIndex = (currentIndex + 1) % this.trackElements.length;
        const nextTrack = this.trackElements[nextIndex];
        
        // Play next track
        if (nextTrack) {
            this.playTrack(nextTrack.dataset.url, nextTrack);
        }
    },
    
    playPreviousTrack: function() {
        if (!this.currentTrack) {
            // If no track is active, play the first one
            if (this.trackElements.length > 0) {
                const firstTrack = this.trackElements[0];
                this.playTrack(firstTrack.dataset.url, firstTrack);
            }
            return;
        }
        
        // Find previous track (or loop to last)
        const currentIndex = this.trackElements.indexOf(this.currentTrack);
        const prevIndex = (currentIndex - 1 + this.trackElements.length) % this.trackElements.length;
        const prevTrack = this.trackElements[prevIndex];
        
        // Play previous track
        if (prevTrack) {
            this.playTrack(prevTrack.dataset.url, prevTrack);
        }
    },
    
    // Utility methods that other systems can use
    getAudioElement: function() {
        return this.audioElement;
    },
    
    isAudioPlaying: function() {
        return this.isPlaying;
    },
    
    getCurrentTrackName: function() {
        return this.currentTrack ? 
            this.currentTrack.dataset.name || this.currentTrack.querySelector('.track-name').textContent : 
            "No track playing";
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a small delay to ensure other systems are ready
    setTimeout(() => RadioPlayerSystem.init(), 200);
}); 