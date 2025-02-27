// Logging System
const Logger = (function() {
    // Reference to the log content element
    let logContentElement;
    
    // Initialize logger
    function init() {
        logContentElement = document.getElementById('logContent');
        if (!logContentElement) {
            console.error("Log content element not found!");
        }
    }
    
    // Log a message
    function log(message) {
        if (!logContentElement) {
            init();
        }
        
        // Add message to log
        const messageElement = document.createElement('div');
        messageElement.className = 'log-message';
        messageElement.textContent = message;
        
        // Add to DOM
        logContentElement.appendChild(messageElement);
        
        // Auto-scroll to bottom
        logContentElement.scrollTop = logContentElement.scrollHeight;
        
        // Also log to console
        console.log(message);
    }
    
    // Log an error message
    function error(message) {
        if (!logContentElement) {
            init();
        }
        
        // Add error message to log
        const errorElement = document.createElement('div');
        errorElement.className = 'log-message log-error';
        errorElement.textContent = "ERROR: " + message;
        
        // Add to DOM
        logContentElement.appendChild(errorElement);
        
        // Auto-scroll to bottom
        logContentElement.scrollTop = logContentElement.scrollHeight;
        
        // Also log to console
        console.error(message);
    }
    
    // Log a warning message (added function)
    function warning(message) {
        if (!logContentElement) {
            init();
        }
        
        // Add warning message to log
        const warningElement = document.createElement('div');
        warningElement.className = 'log-message log-warning';
        warningElement.textContent = "WARNING: " + message;
        
        // Add to DOM
        logContentElement.appendChild(warningElement);
        
        // Auto-scroll to bottom
        logContentElement.scrollTop = logContentElement.scrollHeight;
        
        // Also log to console
        console.warn(message);
    }
    
    // Clear the log
    function clear() {
        if (logContentElement) {
            logContentElement.innerHTML = '';
        }
    }
    
    // Public API
    return {
        init,
        log,
        error,
        warning, // Add this to the public API
        clear
    };
})(); 