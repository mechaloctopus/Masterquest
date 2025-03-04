// Side Menu System
window.SideMenuSystem = (function() {
    // Private properties
    let initialized = false;
    let sideMenuElement = null;
    let sideMenuContentElement = null;
    
    // UI elements to forcefully move to side menu
    const uiElements = [
        { id: 'radioPlayer', preventMove: false }
    ];
    
    // Initialize the side menu
    function init() {
        if (initialized) return true;
        
        try {
            console.log("[SideMenu] Initializing side menu system...");
            
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
            
            // Remove test coordinates button if it exists
            removeTestCoordinatesButton();
            
            // Force clean up any existing panels
            cleanupExistingPanels();
            
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
            
            // Set console to always be visible
            ensureConsoleIsVisible();
            
            initialized = true;
            return true;
        } catch (e) {
            console.error("[SideMenu] Failed to initialize:", e);
            return false;
        }
    }
    
    // Ensure console is always visible
    function ensureConsoleIsVisible() {
        const log = document.getElementById('log');
        if (log) {
            // Remove log from side menu if it was moved there
            if (sideMenuContentElement.contains(log)) {
                sideMenuContentElement.removeChild(log);
            }
            
            // Make sure it's added to the body
            if (!document.body.contains(log)) {
                document.body.appendChild(log);
            }
            
            // Position in upper left
            log.style.position = 'absolute';
            log.style.top = '20px';
            log.style.left = '20px';
            log.style.maxHeight = '200px';
            log.style.width = '300px';
            log.classList.remove('collapsed');
            
            console.log("[SideMenu] Ensured console is visible in upper left");
        }
    }
    
    // Remove the test coordinates button
    function removeTestCoordinatesButton() {
        const testButton = document.getElementById('testCoordButton');
        if (testButton) {
            testButton.parentNode.removeChild(testButton);
            console.log("[SideMenu] Test coordinates button removed");
        }
    }
    
    // Clean up any existing panels outside the side menu
    function cleanupExistingPanels() {
        // Remove any duplicate elements that might exist outside the side menu
        uiElements.forEach(element => {
            const elementsOutsideSideMenu = document.querySelectorAll(`body > #${element.id}`);
            elementsOutsideSideMenu.forEach(el => {
                if (!sideMenuElement.contains(el)) {
                    el.parentNode.removeChild(el);
                    console.log(`[SideMenu] Removed duplicate ${element.id} outside side menu`);
                }
            });
        });
        
        // Also remove any inventory container that might still be visible
        const inventoryContainer = document.getElementById('inventoryContainer');
        if (inventoryContainer) {
            inventoryContainer.parentNode.removeChild(inventoryContainer);
            console.log("[SideMenu] Removed redundant inventory container");
        }
        
        // Remove pause button if it exists
        const pauseButton = document.querySelector('.pause-button');
        if (pauseButton) {
            pauseButton.parentNode.removeChild(pauseButton);
            console.log("[SideMenu] Removed pause button");
        }
    }
    
    // Move UI elements to the side menu
    function moveElementsToSideMenu() {
        // Clear existing content first
        const existingContentInSideMenu = Array.from(sideMenuContentElement.children);
        existingContentInSideMenu.forEach(child => {
            if (child.id === 'radioPlayer') {
                child.parentNode.removeChild(child);
            }
        });
        
        // Now move the elements
        uiElements.forEach(element => {
            const el = document.getElementById(element.id);
            if (el && !element.preventMove) {
                // Check if the element is already a child of side menu content
                if (!sideMenuContentElement.contains(el)) {
                    // Clone the element to avoid reference issues
                    const clone = el.cloneNode(true);
                    
                    // Remove the original
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                    
                    // Add the clone to side menu
                    sideMenuContentElement.appendChild(clone);
                    console.log(`[SideMenu] Moved ${element.id} to side menu`);
                }
            } else {
                console.warn(`[SideMenu] Element ${element.id} not found or prevented from moving`);
            }
        });
    }
    
    // Setup handlers for toggle buttons
    function setupToggleHandlers() {
        // Radio player toggle - query inside side menu
        const radioToggle = sideMenuContentElement.querySelector('#radioToggle');
        const radioPlayer = sideMenuContentElement.querySelector('#radioPlayer');
        
        if (radioToggle && radioPlayer) {
            // Update the toggle button text
            radioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            
            // Remove existing event listeners by cloning
            const newRadioToggle = radioToggle.cloneNode(true);
            radioToggle.parentNode.replaceChild(newRadioToggle, radioToggle);
            
            // Add new event listener
            newRadioToggle.addEventListener('click', function() {
                radioPlayer.classList.toggle('collapsed');
                newRadioToggle.textContent = radioPlayer.classList.contains('collapsed') ? '▲' : '▼';
            });
            
            console.log("[SideMenu] Set up radio toggle handler");
        }
        
        // Also setup log toggle if it exists
        const logToggle = document.querySelector('#logToggle');
        const log = document.querySelector('#log');
        
        if (logToggle && log) {
            // Update the toggle button text
            logToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            
            // Remove existing event listeners by cloning
            const newLogToggle = logToggle.cloneNode(true);
            logToggle.parentNode.replaceChild(newLogToggle, logToggle);
            
            // Add new event listener
            newLogToggle.addEventListener('click', function() {
                log.classList.toggle('collapsed');
                newLogToggle.textContent = log.classList.contains('collapsed') ? '▲' : '▼';
            });
            
            console.log("[SideMenu] Set up log toggle handler");
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
            
            console.log("[SideMenu] Started dragging");
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
            if (isDragging) {
                console.log("[SideMenu] Stopped dragging");
            }
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