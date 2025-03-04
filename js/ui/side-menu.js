// Side Menu System
window.SideMenuSystem = (function() {
    // Private properties
    let initialized = false;
    let sideMenuElement = null;
    let sideMenuContentElement = null;
    
    // UI elements to manage
    const uiElements = [
        { id: 'log', preventMove: false },
        { id: 'radioPlayer', preventMove: false }
    ];
    
    // Initialize the side menu
    function init() {
        if (initialized) return true;
        
        try {
            // Get side menu elements
            sideMenuElement = document.getElementById('sideMenu');
            if (!sideMenuElement) {
                console.error("[SideMenu] Side menu container not found!");
                return false;
            }
            
            sideMenuContentElement = sideMenuElement.querySelector('.menu-content');
            if (!sideMenuContentElement) {
                console.error("[SideMenu] Side menu content element not found!");
                return false;
            }
            
            // Move UI elements to the side menu
            moveElementsToSideMenu();
            
            // Setup logger toggle handlers for collapsed states
            setupToggleHandlers();
            
            // Add draggable functionality to the side menu
            makeDraggable(sideMenuElement);
            
            // Log initialization if logger is available
            if (window.Logger) {
                Logger.log("> SIDE MENU SYSTEM INITIALIZED");
            }
            
            initialized = true;
            return true;
        } catch (e) {
            console.error("[SideMenu] Failed to initialize:", e);
            return false;
        }
    }
    
    // Move UI elements to the side menu
    function moveElementsToSideMenu() {
        uiElements.forEach(element => {
            const el = document.getElementById(element.id);
            if (el && !element.preventMove) {
                // Remove the element from its current position and add to side menu
                el.parentNode.removeChild(el);
                sideMenuContentElement.appendChild(el);
            }
        });
    }
    
    // Setup handlers for toggle buttons
    function setupToggleHandlers() {
        // Logger toggle
        const logToggle = document.getElementById('logToggle');
        const log = document.getElementById('log');
        
        if (logToggle && log) {
            // Update the toggle button text
            logToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            
            // Remove existing event listeners
            const newLogToggle = logToggle.cloneNode(true);
            logToggle.parentNode.replaceChild(newLogToggle, logToggle);
            
            // Add new event listener
            newLogToggle.addEventListener('click', function() {
                log.classList.toggle('collapsed');
                newLogToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
        
        // Radio player toggle
        const radioToggle = document.getElementById('radioToggle');
        const radioPlayer = document.getElementById('radioPlayer');
        
        if (radioToggle && radioPlayer) {
            // Update the toggle button text
            radioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            
            // Remove existing event listeners
            const newRadioToggle = radioToggle.cloneNode(true);
            radioToggle.parentNode.replaceChild(newRadioToggle, radioToggle);
            
            // Add new event listener
            newRadioToggle.addEventListener('click', function() {
                radioPlayer.classList.toggle('collapsed');
                newRadioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            });
        }
    }
    
    // Make an element draggable
    function makeDraggable(element) {
        if (!element) return;
        
        let offsetX, offsetY, isDragging = false;
        const header = element.querySelector('.menu-header');
        
        if (!header) return;
        
        header.style.cursor = 'move';
        
        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Boundary checks to keep menu on screen
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;
            
            element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            element.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }
    
    // Public API
    return {
        init: init
    };
})();

// Initialize the side menu system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure all other UI elements are ready
    setTimeout(function() {
        SideMenuSystem.init();
    }, 500);
}); 