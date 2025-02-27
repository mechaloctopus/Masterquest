// Mobile detection helper
(function() {
    function detectMobile() {
        return (window.innerWidth <= 768) || 
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }
    
    // Set a class on body if mobile device is detected
    if (detectMobile()) {
        document.body.classList.add('mobile-detected');
        
        // Auto-collapse UI elements on mobile
        const radioPlayer = document.getElementById('radioPlayer');
        if (radioPlayer && !radioPlayer.classList.contains('collapsed')) {
            radioPlayer.classList.add('collapsed');
            
            // Update toggle button text if needed
            const radioToggle = document.getElementById('radioToggle');
            if (radioToggle) {
                radioToggle.textContent = '▶ RADIO';
            }
        }
        
        const log = document.getElementById('log');
        if (log && !log.classList.contains('collapsed')) {
            log.classList.add('collapsed');
            
            // Update toggle button text if needed
            const logToggle = document.getElementById('logToggle');
            if (logToggle) {
                logToggle.textContent = '▶';
            }
        }
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        // Give the browser time to update dimensions
        setTimeout(function() {
            if (detectMobile()) {
                document.body.classList.add('mobile-detected');
            } else {
                document.body.classList.remove('mobile-detected');
            }
        }, 200);
    });
})(); 