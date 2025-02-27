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
    
    // Add log entry to the console
    function log(message) {
        if (!logContentElement) {
            init();
        }
        
        console.log(message); // Also log to browser console
        
        if (logContentElement) {
            const entry = document.createElement('div');
            entry.innerHTML = message;
            logContentElement.appendChild(entry);
        }
    }
    
    // Log error message
    function error(message) {
        if (!logContentElement) {
            init();
        }
        
        console.error(message); // Also log to browser console
        
        if (logContentElement) {
            const entry = document.createElement('div');
            entry.innerHTML = `<span style="color: #ff0000;">ERROR: ${message}</span>`;
            logContentElement.appendChild(entry);
        }
    }
    
    // Clear all log entries
    function clear() {
        if (!logContentElement) {
            init();
        }
        
        if (logContentElement) {
            logContentElement.innerHTML = '';
        }
    }
    
    // Public API
    return {
        init,
        log,
        error,
        clear
    };
})(); 