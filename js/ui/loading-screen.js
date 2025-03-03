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
        forceHideTimer = setTimeout(hideLoadingScreen, 10000); // 10 seconds max
        
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
        const horizontalCount = 10; // Reduced from 20
        const horizontalSpacing = 100 / (horizontalCount - 1);
        
        for (let i = 0; i < horizontalCount; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal-line';
            line.style.top = `${i * horizontalSpacing}%`;
            line.style.opacity = 1 - (Math.abs(i - horizontalCount / 2) / (horizontalCount / 2)) * 0.8;
            gridHorizontalElement.appendChild(line);
            horizontalLines.push(line);
        }
        
        // Create vertical lines - reduced count for better performance
        const verticalCount = 10; // Reduced from 20
        const verticalSpacing = 100 / (verticalCount - 1);
        
        for (let i = 0; i < verticalCount; i++) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical-line';
            line.style.left = `${i * verticalSpacing}%`;
            line.style.opacity = 1 - (Math.abs(i - verticalCount / 2) / (verticalCount / 2)) * 0.8;
            gridVerticalElement.appendChild(line);
            verticalLines.push(line);
        }
        
        // Start the grid animation
        animateGrid();
    }
    
    // Animate the grid to create the retro-futuristic effect
    function animateGrid() {
        // Start horizontal grid animation
        gridHorizontalElement.style.transform = 'rotateX(60deg) translateZ(-100px)';
        
        // Start vertical grid animation
        gridVerticalElement.style.transform = 'rotateX(60deg) translateZ(-100px)';
        
        // Animate individual lines for better effect - with fewer animations
        animateLines();
    }
    
    // Animate individual grid lines - optimized for better performance
    function animateLines() {
        // Use a batch approach for line animations
        const batchSize = 3; // Animate every 3 lines instead of every line
        
        horizontalLines.forEach((line, index) => {
            if (index % batchSize === 0) {
                const delay = (index / batchSize) * 100; // Increased delay between batches
                setTimeout(() => {
                    line.style.transform = 'translateZ(0px)';
                }, delay);
            } else {
                // Set transform directly without delay for intermediate lines
                line.style.transform = 'translateZ(0px)';
            }
        });
        
        verticalLines.forEach((line, index) => {
            if (index % batchSize === 0) {
                const delay = (index / batchSize) * 100; // Increased delay between batches
                setTimeout(() => {
                    line.style.transform = 'translateZ(0px)';
                }, delay);
            } else {
                // Set transform directly without delay for intermediate lines
                line.style.transform = 'translateZ(0px)';
            }
        });
    }
    
    // Handle loader start event
    function handleLoaderStart(data) {
        updateProgressBar(0);
        updateStatus("Loading assets...");
        addConsoleMessage("> LOADING ASSETS...");
    }
    
    // Handle loader progress event
    function handleLoaderProgress(data) {
        const { progress, completedTasks, totalTasks, lastTask } = data;
        updateProgressBar(progress);
        updateStatus(`Loading assets: ${completedTasks} / ${totalTasks}`);
        
        // Only log every few tasks to avoid console spam
        if (lastTask && completedTasks % 3 === 0) {
            addConsoleMessage(`> LOADED: ${lastTask}`);
        }
        
        // If progress is high (90%+) but complete event hasn't fired,
        // start a short timer to force transition
        if (progress > 0.9 && forceHideTimer === null) {
            forceHideTimer = setTimeout(hideLoadingScreen, 2000);
        }
    }
    
    // Handle loader complete event
    function handleLoaderComplete(data) {
        updateProgressBar(1);
        updateStatus("Loading complete!");
        addConsoleMessage("> ALL ASSETS LOADED SUCCESSFULLY");
        
        // Clear any existing force hide timer
        if (forceHideTimer !== null) {
            clearTimeout(forceHideTimer);
            forceHideTimer = null;
        }
        
        // Hide the loading screen after a shorter delay
        setTimeout(() => {
            hideLoadingScreen();
        }, 500); // Reduced from 1000
    }
    
    // Handle loader error event
    function handleLoaderError(data) {
        const { taskName, error } = data;
        addConsoleMessage(`> ERROR LOADING: ${taskName} - ${error}`, 'error');
        
        // If we get an error and progress is reasonably high, consider finishing loading
        // This prevents getting stuck on the loading screen due to minor asset failures
        setTimeout(() => {
            if (loadingBarElement && loadingBarElement.style.width.replace('%', '') > 50) {
                hideLoadingScreen();
            }
        }, 2000);
    }
    
    // Handle log events
    function handleLogEvent(data) {
        const { type, message } = data;
        if (type === 'error') {
            addConsoleMessage(`> ERROR: ${message}`, 'error');
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
    }
    
    // Update the status text
    function updateStatus(message) {
        if (!loadingStatusElement) return;
        
        loadingStatusElement.textContent = message;
    }
    
    // Add a message to the loading console
    function addConsoleMessage(message, type = 'info') {
        if (!loadingConsoleElement) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'loading-console-line';
        
        if (type === 'error') {
            messageElement.style.color = '#ff0066';
        }
        
        messageElement.textContent = message;
        loadingConsoleElement.appendChild(messageElement);
        
        // Auto-scroll to bottom
        loadingConsoleElement.scrollTop = loadingConsoleElement.scrollHeight;
        
        // Limit number of messages for performance
        while (loadingConsoleElement.children.length > 15) {
            loadingConsoleElement.removeChild(loadingConsoleElement.firstChild);
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
        
        loadingScreenElement.classList.add('hidden');
        
        // Remove it from the DOM after the transition completes
        setTimeout(() => {
            loadingScreenElement.style.display = 'none';
            
            // Cleanup to free memory
            horizontalLines = [];
            verticalLines = [];
            if (gridHorizontalElement) gridHorizontalElement.innerHTML = '';
            if (gridVerticalElement) gridVerticalElement.innerHTML = '';
        }, 500);
    }
    
    // Show the loading screen (for manual control)
    function showLoadingScreen() {
        if (!loadingScreenElement) return;
        
        loadingScreenElement.style.display = '';
        
        // Allow the display change to take effect before removing the hidden class
        setTimeout(() => {
            loadingScreenElement.classList.remove('hidden');
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