// Enhanced Logging System
const Logger = (function() {
    // Private variables
    let logContentElement = null;
    let initialized = false;
    
    // Message types
    const MESSAGE_TYPES = {
        INFO: 'info',
        ERROR: 'error',
        WARNING: 'warning',
        DEBUG: 'debug'
    };
    
    // Initialize logger
    function init() {
        if (initialized) return true;
        
        logContentElement = document.getElementById('logContent');
        if (!logContentElement) {
            console.error("Log content element not found!");
            return false;
        }
        
        // Subscribe to log events from other modules
        if (window.EventSystem) {
            EventSystem.on('log', handleLogEvent);
        }
        
        initialized = true;
        return true;
    }
    
    // Handle log events from the event system
    function handleLogEvent(eventData) {
        const { type = MESSAGE_TYPES.INFO, message } = eventData;
        
        switch (type) {
            case MESSAGE_TYPES.ERROR:
                error(message);
                break;
            case MESSAGE_TYPES.WARNING:
                warning(message);
                break;
            case MESSAGE_TYPES.DEBUG:
                debug(message);
                break;
            default:
                log(message);
        }
    }
    
    // Generic logging function that handles all message types
    function logMessage(message, type = MESSAGE_TYPES.INFO) {
        if (!initialized && !init()) {
            // Fallback to console
            switch (type) {
                case MESSAGE_TYPES.ERROR:
                    console.error(message);
                    break;
                case MESSAGE_TYPES.WARNING:
                    console.warn(message);
                    break;
                case MESSAGE_TYPES.DEBUG:
                    console.debug(message);
                    break;
                default:
                    console.log(message);
            }
            return;
        }
        
        // Create UI element
        const messageElement = document.createElement('div');
        messageElement.className = 'log-message';
        
        // Add type-specific classes and prefixes
        let prefix = '';
        
        switch (type) {
            case MESSAGE_TYPES.ERROR:
                messageElement.classList.add('log-error');
                prefix = 'ERROR: ';
                break;
            case MESSAGE_TYPES.WARNING:
                messageElement.classList.add('log-warning');
                prefix = 'WARNING: ';
                break;
            case MESSAGE_TYPES.DEBUG:
                messageElement.classList.add('log-debug');
                prefix = 'DEBUG: ';
                break;
        }
        
        // Create a span for the text that will be animated
        const textSpan = document.createElement('span');
        textSpan.className = 'log-text';
        messageElement.appendChild(textSpan);
        
        // Add to DOM first so it appears immediately
        logContentElement.appendChild(messageElement);
        
        // Auto-scroll to bottom even before text is typed
        scrollToBottom();
        
        // Use typewriter effect for displaying text
        typeText(textSpan, prefix + message, 0, 3);
        
        // Emit event if event system is available
        if (window.EventSystem) {
            EventSystem.emit('logAdded', { type, message });
        }
    }
    
    // Function to type text character by character
    function typeText(element, text, index, speed) {
        if (index < text.length) {
            // Add one character
            element.textContent = text.substring(0, index + 1);
            
            // Continue with next character
            setTimeout(function() {
                typeText(element, text, index + 1, speed);
                // Ensure we continue to scroll while typing
                scrollToBottom();
            }, speed);
        }
    }
    
    // Helper function to scroll to the bottom of the log
    function scrollToBottom() {
        // Use requestAnimationFrame to ensure this happens after DOM updates
        requestAnimationFrame(() => {
            logContentElement.scrollTop = logContentElement.scrollHeight;
        });
    }
    
    // Log a standard message
    function log(message) {
        logMessage(message, MESSAGE_TYPES.INFO);
        console.log(message);
    }
    
    // Log an error message
    function error(message) {
        logMessage(message, MESSAGE_TYPES.ERROR);
        console.error(message);
    }
    
    // Log a warning message
    function warning(message) {
        logMessage(message, MESSAGE_TYPES.WARNING);
        console.warn(message);
    }
    
    // Log a debug message (only shown in dev mode)
    function debug(message) {
        logMessage(message, MESSAGE_TYPES.DEBUG);
        console.debug(message);
    }
    
    // Clear the log
    function clear() {
        if (!initialized && !init()) return;
        
        logContentElement.innerHTML = '';
        
        // Emit clear event
        if (window.EventSystem) {
            EventSystem.emit('logCleared');
        }
    }
    
    // Try to initialize when the module is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        log,
        error,
        warning,
        debug,
        clear,
        types: MESSAGE_TYPES
    };
})(); 