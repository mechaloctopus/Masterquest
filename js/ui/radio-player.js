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
        
        // Initialize with configuration
        this.setupPlayer();
        this.loadTracksFromConfig();
        
        // Set starting volumes from config
        this.volumeSlider.value = CONFIG.AUDIO.MUSIC.VOLUME * 100;
        this.sfxVolumeSlider.value = CONFIG.UI.AUDIO_CONTROLS.SFX_VOLUME * 100;
        
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
                this.playTrack(url, track);
            });
        });
        
        // Audio end event
        this.audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
    },
    
    loadTracksFromConfig: function() {
        // If tracks are defined in CONFIG, use those instead
        if (CONFIG.AUDIO.TRACKS && CONFIG.AUDIO.TRACKS.length > 0) {
            // Clear existing tracks
            const trackList = document.querySelector('.track-list');
            trackList.innerHTML = '';
            
            // Add tracks from config
            CONFIG.AUDIO.TRACKS.forEach(trackConfig => {
                const trackElement = document.createElement('div');
                trackElement.className = 'track';
                trackElement.dataset.url = trackConfig.URL;
                
                trackElement.innerHTML = `
                    <button class="play-btn">▶</button>
                    <span class="track-name">${trackConfig.NAME}</span>
                `;
                
                // Add click handler
                const playBtn = trackElement.querySelector('.play-btn');
                playBtn.addEventListener('click', () => {
                    this.playTrack(trackConfig.URL, trackElement);
                });
                
                trackList.appendChild(trackElement);
            });
            
            // Update track elements reference
            this.trackElements = document.querySelectorAll('.track');
        }
    },
    
    playTrack: function(url, trackElement) {
        // Stop current track
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        
        // Remove active class from all tracks
        this.trackElements.forEach(track => {
            track.classList.remove('active');
        });
        
        // Set new track
        this.audioElement.src = url;
        this.audioElement.volume = this.volumeSlider.value / 100;
        
        // Add active class
        trackElement.classList.add('active');
        trackElement.querySelector('.play-btn').textContent = '❚❚';
        this.currentTrack = trackElement;
        
        // Play it
        this.audioElement.play().catch(e => {
            Logger.warning("Audio autoplay prevented: " + e.message);
            // UI feedback
            trackElement.querySelector('.play-btn').textContent = '▶';
        });
        
        // Update button when playing
        this.audioElement.addEventListener('playing', () => {
            trackElement.querySelector('.play-btn').textContent = '❚❚';
        });
        
        // Also stop the main background music if it's playing
        if (window.AudioSystem && AudioSystem.music) {
            AudioSystem.music.pause();
        }
    },
    
    playNextTrack: function() {
        if (!this.currentTrack) return;
        
        // Find next track (or loop to first)
        let nextTrack = this.currentTrack.nextElementSibling;
        if (!nextTrack) {
            nextTrack = this.trackElements[0];
        }
        
        // Reset current play button
        this.currentTrack.querySelector('.play-btn').textContent = '▶';
        
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