// Logging System
const Logger = (function() {
    // Reference to the log content element
    let logContentElement = null;
    let initialized = false;
    
    // Initialize logger
    function init() {
        if (initialized) return true;
        
        logContentElement = document.getElementById('logContent');
        if (!logContentElement) {
            console.error("Log content element not found!");
            return false;
        }
        
        initialized = true;
        return true;
    }
    
    // Try to initialize when the module is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Log a message
    function log(message) {
        if (!initialized && !init()) {
            console.log(message);
            return;
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
        if (!initialized && !init()) {
            console.error(message);
            return;
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
    
    // Log a warning message
    function warning(message) {
        if (!initialized && !init()) {
            console.warn(message);
            return;
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
        if (!initialized && !init()) return;
        
        logContentElement.innerHTML = '';
    }
    
    // Public API
    return {
        init,
        log,
        error,
        warning,
        clear
    };
})(); 