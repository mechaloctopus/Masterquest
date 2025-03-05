// Loading Screen System
const LoadingScreenSystem = (function() {
    // Private properties
    let initialized = false;
    let loadingScreenElement = null;
    let loadingBarElement = null;
    let loadingStatusElement = null;
    let loadingConsoleElement = null;
    let gridHorizontalElement = null;
    let gridVerticalElement = null;
    let horizontalLines = [];
    let verticalLines = [];
    let forceHideTimer = null;
    let consoleIndicator = null;
    let messageQueue = [];
    let processingMessages = false;
    
    // Initialize the loading screen
    function init() {
        if (initialized) return true;
        
        loadingScreenElement = document.getElementById('loadingScreen');
        if (!loadingScreenElement) {
            console.error("Loading screen element not found!");
            return false;
        }
        
        loadingBarElement = document.getElementById('loadingBar');
        loadingStatusElement = document.getElementById('loadingStatus');
        loadingConsoleElement = document.getElementById('loadingConsole');
        gridHorizontalElement = document.getElementById('gridHorizontal');
        gridVerticalElement = document.getElementById('gridVertical');
        consoleIndicator = document.querySelector('.console-indicator');
        
        // Initialize the grid with fewer lines for better performance
        createGrid();
        
        // Listen for loader events
        if (window.EventSystem) {
            EventSystem.on('loader.start', handleLoaderStart);
            EventSystem.on('loader.progress', handleLoaderProgress);
            EventSystem.on('loader.complete', handleLoaderComplete);
            EventSystem.on('loader.error', handleLoaderError);
        }
        
        // Also listen for log events to show in the loading console
        if (window.EventSystem) {
            EventSystem.on('logAdded', handleLogEvent);
        }
        
        // Set a maximum time for the loading screen to be visible
        // This ensures we transition to the game even if loader.complete isn't fired
        forceHideTimer = setTimeout(hideLoadingScreen, 15000); // 15 seconds max
        
        // Show some initial console messages with delays to create a boot sequence effect
        setTimeout(() => addConsoleMessage("> SYSTEM HARDWARE CHECK: PASSED"), 800);
        setTimeout(() => addConsoleMessage("> INITIALIZING GRAPHICS ENGINE"), 1600);
        setTimeout(() => addConsoleMessage("> PREPARING AUDIO SUBSYSTEMS"), 2300);
        setTimeout(() => addConsoleMessage("> SCANNING FOR ASSET BUNDLE MANIFEST"), 3000);
        
        initialized = true;
        return true;
    }
    
    // Create the grid lines for the background effect - optimized for performance
    function createGrid() {
        if (!gridHorizontalElement || !gridVerticalElement) return;
        
        // Clear any existing lines
        gridHorizontalElement.innerHTML = '';
        gridVerticalElement.innerHTML = '';
        horizontalLines = [];
        verticalLines = [];
        
        // Create horizontal lines - reduced count for better performance
        const horizontalCount = 12; // Slightly increased for better visuals
        const horizontalSpacing = 100 / (horizontalCount - 1);
        
        for (let i = 0; i < horizontalCount; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal-line';
            line.style.top = `${i * horizontalSpacing}%`;
            
            // Vary the opacity based on distance from center for a more realistic effect
            line.style.opacity = 0.3 + ((1 - Math.abs(i - horizontalCount / 2) / (horizontalCount / 2)) * 0.7);
            
            gridHorizontalElement.appendChild(line);
            horizontalLines.push(line);
        }
        
        // Create vertical lines - reduced count for better performance
        const verticalCount = 12; // Slightly increased for better visuals
        const verticalSpacing = 100 / (verticalCount - 1);
        
        for (let i = 0; i < verticalCount; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical-line';
            line.style.left = `${i * verticalSpacing}%`;
            
            // Vary the opacity based on distance from center for a more realistic effect
            line.style.opacity = 0.3 + ((1 - Math.abs(i - verticalCount / 2) / (verticalCount / 2)) * 0.7);
            
            gridVerticalElement.appendChild(line);
            verticalLines.push(line);
        }
        
        // Start the grid animation with a short delay
        setTimeout(() => animateGrid(), 300);
    }
    
    // Animate the grid to create the retro-futuristic effect
    function animateGrid() {
        // Start horizontal grid animation
        gridHorizontalElement.style.transform = 'rotateX(60deg) translateZ(-80px)';
        
        // Start vertical grid animation
        gridVerticalElement.style.transform = 'rotateX(60deg) translateZ(-80px)';
        
        // Animate individual lines for better effect - with fewer animations
        animateLines();
    }
    
    // Animate individual grid lines - optimized for better performance
    function animateLines() {
        // Use a batch approach for line animations with staggered timing
        
        horizontalLines.forEach((line, index) => {
            const delay = index * 80; // Staggered delay for each line
            setTimeout(() => {
                line.style.transform = 'translateZ(0px)';
            }, delay);
        });
        
        verticalLines.forEach((line, index) => {
            const delay = index * 80 + 500; // Staggered delay with offset from horizontal
            setTimeout(() => {
                line.style.transform = 'translateZ(0px)';
            }, delay);
        });
    }
    
    // Handle loader start event
    function handleLoaderStart(data) {
        updateProgressBar(0);
        updateStatus("Loading assets...");
        addConsoleMessage("> INITIALIZING ASSET LOADER");
        
        // Blink console indicator
        if (consoleIndicator) {
            consoleIndicator.style.animation = "blinkIndicator 0.5s infinite alternate";
        }
    }
    
    // Handle loader progress event
    function handleLoaderProgress(data) {
        const { progress, completedTasks, totalTasks, lastTask } = data;
        updateProgressBar(progress);
        updateStatus(`Loading assets: ${completedTasks} / ${totalTasks}`);
        
        // Add visual feedback based on progress
        if (progress > 0.25 && progress < 0.3) {
            addConsoleMessage("> CORE SYSTEMS ONLINE");
        } else if (progress > 0.5 && progress < 0.55) {
            addConsoleMessage("> ENVIRONMENT ASSETS LOADED");
        } else if (progress > 0.75 && progress < 0.8) {
            addConsoleMessage("> AUDIO PROCESSING COMPLETE");
        }
        
        // Log loaded tasks with smart throttling
        if (lastTask) {
            // Only log milestone tasks or every 3rd task
            if (completedTasks === 1 || completedTasks === totalTasks || 
                completedTasks % 3 === 0 || lastTask.includes('important')) {
                addConsoleMessage(`> LOADED: ${lastTask}`);
            }
        }
        
        // If progress is high (90%+) but complete event hasn't fired,
        // start a short timer to force transition
        if (progress > 0.9 && forceHideTimer === null) {
            forceHideTimer = setTimeout(hideLoadingScreen, 3000);
            addConsoleMessage("> FINALIZING GAME WORLD");
        }
    }
    
    // Handle loader complete event
    function handleLoaderComplete(data) {
        updateProgressBar(1);
        updateStatus("Loading complete!");
        addConsoleMessage("> ALL ASSETS LOADED SUCCESSFULLY");
        setTimeout(() => addConsoleMessage("> SYSTEM READY"), 500);
        
        // Change console indicator to steady green
        if (consoleIndicator) {
            consoleIndicator.style.animation = "none";
            consoleIndicator.style.opacity = "1";
        }
        
        // Clear any existing force hide timer
        if (forceHideTimer !== null) {
            clearTimeout(forceHideTimer);
            forceHideTimer = null;
        }
        
        // Hide the loading screen after a shorter delay
        setTimeout(() => {
            hideLoadingScreen();
        }, 1200); // Slightly longer for better UX
    }
    
    // Handle loader error event
    function handleLoaderError(data) {
        const { taskName, error } = data;
        addConsoleMessage(`> ERROR LOADING: ${taskName} - ${error}`, 'error');
        
        // Change console indicator to red for errors
        if (consoleIndicator) {
            consoleIndicator.style.backgroundColor = "#ff3366";
            consoleIndicator.style.boxShadow = "0 0 5px rgba(255, 51, 102, 0.8)";
            consoleIndicator.style.animation = "blinkIndicator 0.3s infinite";
        }
        
        // If we get an error and progress is reasonably high, consider finishing loading
        // This prevents getting stuck on the loading screen due to minor asset failures
        setTimeout(() => {
            if (loadingBarElement && loadingBarElement.style.width.replace('%', '') > 50) {
                addConsoleMessage("> INITIATING RECOVERY PROCEDURE", "warning");
                setTimeout(() => {
                    addConsoleMessage("> CONTINUING WITH AVAILABLE ASSETS", "warning");
                    hideLoadingScreen();
                }, 1500);
            }
        }, 2000);
    }
    
    // Handle log events
    function handleLogEvent(data) {
        const { type, message } = data;
        if (type === 'error') {
            addConsoleMessage(`> ERROR: ${message}`, 'error');
        } else if (type === 'warning') {
            addConsoleMessage(`> WARNING: ${message}`, 'warning');
        } else {
            addConsoleMessage(`> ${message}`);
        }
    }
    
    // Update the progress bar
    function updateProgressBar(progress) {
        if (!loadingBarElement) return;
        
        // Convert to percentage width
        const percent = Math.min(Math.max(progress * 100, 0), 100);
        loadingBarElement.style.width = `${percent}%`;
        
        // Add a color gradient based on progress
        if (percent < 30) {
            loadingBarElement.style.background = "linear-gradient(90deg, #ff0066, #ff33cc)";
        } else if (percent < 60) {
            loadingBarElement.style.background = "linear-gradient(90deg, #ff0066, #ff00cc, #ff66cc)";
        } else {
            loadingBarElement.style.background = "linear-gradient(90deg, #ff0066, #ff00cc, #ff66ff)";
        }
    }
    
    // Update the status text
    function updateStatus(message) {
        if (!loadingStatusElement) return;
        
        loadingStatusElement.textContent = message;
    }
    
    // Add a message to the loading console with a queue system for sequential display
    function addConsoleMessage(message, type = 'info') {
        if (!loadingConsoleElement) return;
        
        // Add message to queue
        messageQueue.push({ message, type });
        
        // Start processing if not already doing so
        if (!processingMessages) {
            processMessageQueue();
        }
    }
    
    // Process message queue to display messages sequentially with typewriter effect
    function processMessageQueue() {
        if (messageQueue.length === 0) {
            processingMessages = false;
            return;
        }
        
        processingMessages = true;
        const { message, type } = messageQueue.shift();
        
        const messageElement = document.createElement('div');
        messageElement.className = 'loading-console-line';
        
        if (type === 'error') {
            messageElement.style.color = '#ff3366';
        } else if (type === 'warning') {
            messageElement.style.color = '#ffcc00';
        }
        
        loadingConsoleElement.appendChild(messageElement);
        
        // Auto-scroll to bottom
        loadingConsoleElement.scrollTop = loadingConsoleElement.scrollHeight;
        
        // Add the text with typewriter effect
        typeText(messageElement, message, 0, 20);
        
        // Limit number of messages for performance
        while (loadingConsoleElement.children.length > 18) {
            loadingConsoleElement.removeChild(loadingConsoleElement.firstChild);
        }
    }
    
    // Function to type text character by character
    function typeText(element, text, index, speed) {
        if (index < text.length) {
            element.textContent = text.substring(0, index + 1);
            
            // Continue with next character
            setTimeout(function() {
                typeText(element, text, index + 1, speed);
                // Ensure we continue to scroll while typing
                loadingConsoleElement.scrollTop = loadingConsoleElement.scrollHeight;
            }, speed);
        } else {
            // When done typing this message, process the next one after a delay
            setTimeout(processMessageQueue, 300);
        }
    }
    
    // Hide the loading screen
    function hideLoadingScreen() {
        if (!loadingScreenElement) return;
        
        // Clear any existing force hide timer
        if (forceHideTimer !== null) {
            clearTimeout(forceHideTimer);
            forceHideTimer = null;
        }
        
        // Add a final message
        addConsoleMessage("> LAUNCHING APPLICATION");
        
        // Add fade-out transition
        loadingScreenElement.classList.add('hidden');
        
        // Remove it from the DOM after the transition completes
        setTimeout(() => {
            loadingScreenElement.style.display = 'none';
            
            // Cleanup to free memory
            horizontalLines = [];
            verticalLines = [];
            if (gridHorizontalElement) gridHorizontalElement.innerHTML = '';
            if (gridVerticalElement) gridVerticalElement.innerHTML = '';
        }, 800);
    }
    
    // Show the loading screen (for manual control)
    function showLoadingScreen() {
        if (!loadingScreenElement) return;
        
        loadingScreenElement.style.display = '';
        
        // Allow the display change to take effect before removing the hidden class
        setTimeout(() => {
            loadingScreenElement.classList.remove('hidden');
            
            // Reset and recreate the grid when showing again
            createGrid();
        }, 10);
    }
    
    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        show: showLoadingScreen,
        hide: hideLoadingScreen,
        updateProgress: updateProgressBar,
        updateStatus,
        addConsoleMessage
    };
})(); 