// Side Menu System
window.SideMenuSystem = (function() {
    // Private properties
    let initialized = false;
    
    // Initialize the side menu (disabled)
    function init() {
        if (initialized) return true;
        
        try {
            console.log("[SideMenu] Side menu system is disabled.");
            
            // Remove pause button if it exists
            const pauseButtons = document.querySelectorAll('.pause-button');
            pauseButtons.forEach(button => {
                if (button && button.parentNode) {
                    button.parentNode.removeChild(button);
                    console.log("[SideMenu] Removed pause button");
                }
            });
            
            // Ensure console is properly positioned
            ensureConsoleIsVisible();
            
            // Ensure radio player is properly positioned
            ensureRadioPlayerIsVisible();
            
            initialized = true;
            return true;
        } catch (e) {
            console.error("[SideMenu] Error:", e);
            return false;
        }
    }
    
    // Ensure console is always visible
    function ensureConsoleIsVisible() {
        const log = document.getElementById('log');
        if (log) {
            // Position in upper left
            log.style.position = 'absolute';
            log.style.top = '20px';
            log.style.left = '20px';
            log.style.maxHeight = '200px';
            log.style.width = '300px';
            log.style.maxWidth = '300px';
            log.classList.remove('collapsed');
            
            console.log("[SideMenu] Ensured console is visible in upper left");
        }
    }
    
    // Ensure radio player is visible
    function ensureRadioPlayerIsVisible() {
        const radioPlayer = document.getElementById('radioPlayer');
        if (radioPlayer) {
            // Position in upper right
            radioPlayer.style.position = 'absolute';
            radioPlayer.style.top = '20px';
            radioPlayer.style.right = '20px';
            radioPlayer.style.left = 'auto';
            radioPlayer.style.transform = 'none';
            radioPlayer.style.width = '300px';
            radioPlayer.style.maxWidth = '300px';
            
            console.log("[SideMenu] Ensured radio player is visible in upper right");
        }
    }
    
    // Setup handlers for toggle buttons
    function setupToggleHandlers() {
        // Radio player toggle
        const radioToggle = document.querySelector('#radioToggle');
        const radioPlayer = document.querySelector('#radioPlayer');
        
        if (radioToggle && radioPlayer) {
            radioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            
            radioToggle.addEventListener('click', function() {
                radioPlayer.classList.toggle('collapsed');
                radioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
        
        // Log toggle
        const logToggle = document.querySelector('#logToggle');
        const log = document.querySelector('#log');
        
        if (logToggle && log) {
            logToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            
            logToggle.addEventListener('click', function() {
                log.classList.toggle('collapsed');
                logToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
    }
    
    // Public API
    return {
        init: init
    };
})();

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    SideMenuSystem.init();
}); 