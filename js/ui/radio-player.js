// Radio Player System
const RadioPlayerSystem = {
    init: function() {
        this.playerElement = document.getElementById('radioPlayer');
        this.toggleButton = document.getElementById('radioToggle');
        this.volumeSlider = document.getElementById('radioVolume');
        this.sfxVolumeSlider = document.getElementById('radioSfxVolume');
        this.trackElements = document.querySelectorAll('.track');
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.isPlaying = false;
        
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
        
        Logger.log("> RADIO PLAYER INITIALIZED");
    },
    
    setupPlayer: function() {
        // Toggle collapse/expand
        this.toggleButton.addEventListener('click', () => {
            this.playerElement.classList.toggle('collapsed');
            this.toggleButton.textContent = this.playerElement.classList.contains('collapsed') ? '▶ RADIO' : '▼';
        });
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioElement.volume = volume;
            
            // Update config
            CONFIG.AUDIO.MUSIC.VOLUME = volume;
            
            // Also update the existing music if it's playing
            if (window.AudioSystem && AudioSystem.music) {
                AudioSystem.music.volume = volume;
            }
        });
        
        // SFX Volume control
        this.sfxVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            
            // Update config and existing sfx volumes
            CONFIG.UI.AUDIO_CONTROLS.SFX_VOLUME = volume;
            
            if (window.AudioSystem && AudioSystem.sfx) {
                Object.values(AudioSystem.sfx).forEach(sfx => {
                    if (sfx) sfx.volume = volume;
                });
            }
        });
        
        // Track play buttons
        this.trackElements.forEach(track => {
            const playBtn = track.querySelector('.play-btn');
            playBtn.addEventListener('click', () => {
                const url = track.dataset.url;
                
                // If this is the current track, toggle play/pause
                if (this.currentTrack === track) {
                    this.togglePlayPause();
                } else {
                    // Otherwise play the new track
                    this.playTrack(url, track);
                }
            });
        });
        
        // Audio end event
        this.audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
        
        // Add pause/play state tracking
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.currentTrack) {
                this.currentTrack.querySelector('.play-btn').textContent = '❚❚';
            }
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.currentTrack) {
                this.currentTrack.querySelector('.play-btn').textContent = '▶';
            }
        });
        
        // Add keyboard shortcuts for music control
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') { // M key to toggle play/pause
                this.togglePlayPause();
            } else if (e.code === 'KeyN') { // N key for next track
                this.playNextTrack();
            }
        });
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
                
                const playBtn = document.createElement('button');
                playBtn.className = 'play-btn';
                playBtn.textContent = '▶';
                
                const trackName = document.createElement('span');
                trackName.className = 'track-name';
                trackName.textContent = track.NAME;
                
                trackElement.appendChild(playBtn);
                trackElement.appendChild(trackName);
                trackList.appendChild(trackElement);
                
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
            this.trackElements = document.querySelectorAll('.track');
        }
    },
    
    togglePlayPause: function() {
        if (!this.currentTrack) return;
        
        if (this.isPlaying) {
            // Pause the track
            this.audioElement.pause();
            // UI will update through the pause event listener
        } else {
            // Resume playing
            this.audioElement.play().catch(e => {
                Logger.error("Audio resume prevented: " + e.message);
            });
            // UI will update through the play event listener
        }
    },
    
    playTrack: function(url, trackElement) {
        // Stop current track
        this.audioElement.pause();
        
        // Remove active class from all tracks
        this.trackElements.forEach(track => {
            track.classList.remove('active');
        });
        
        // Set new track
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
        this.audioElement.volume = this.volumeSlider.value / 100;
        
        // Add active class
        trackElement.classList.add('active');
        this.currentTrack = trackElement;
        
        // Add this to the playTrack method right before playing
        Logger.log("> PLAYING TRACK: " + url);
        console.log("Playing track with URL:", url);
        
        // Play it
        this.audioElement.play().catch(e => {
            Logger.error("Audio autoplay prevented: " + e.message);
            // UI feedback is handled by the pause event
        });
        
        // Also stop the main background music if it's playing
        if (window.AudioSystem && AudioSystem.music) {
            AudioSystem.music.pause();
        }
        
        // And also add an event listener for errors
        this.audioElement.addEventListener('error', (e) => {
            Logger.error("Audio error: " + (e.message || "Unknown error"));
            console.error("Audio error details:", e);
        });
    },
    
    playNextTrack: function() {
        if (!this.currentTrack) return;
        
        // Find next track (or loop to first)
        let nextTrack = this.currentTrack.nextElementSibling;
        if (!nextTrack) {
            nextTrack = this.trackElements[0];
        }
        
        // Play next track
        const url = nextTrack.dataset.url;
        this.playTrack(url, nextTrack);
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a small delay to ensure other systems are ready
    setTimeout(() => RadioPlayerSystem.init(), 100);
}); 