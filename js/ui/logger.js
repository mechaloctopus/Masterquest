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
        
        // Immediately scroll to bottom when a new message is added
        if (window.Utils && window.Utils.forceScrollToBottom) {
            window.Utils.forceScrollToBottom(logContentElement);
        } else {
            // Fallback if utility not available
            logContentElement.scrollTop = logContentElement.scrollHeight;
        }
        
        // Use typewriter effect for displaying text
        if (window.Utils && window.Utils.typeText) {
            // Use shared utility if available
            window.Utils.typeText({
                element: textSpan,
                text: prefix + message,
                speed: 3,
                scrollElement: logContentElement
            });
        } else {
            // Fallback to direct text setting if utility not available
            textSpan.textContent = prefix + message;
            if (window.Utils && window.Utils.forceScrollToBottom) {
                window.Utils.forceScrollToBottom(logContentElement);
            } else {
                logContentElement.scrollTop = logContentElement.scrollHeight;
            }
        }
        
        // Ensure we don't exceed max entries
        pruneOldEntries();
        
        // Emit event if event system is available
        if (window.EventSystem) {
            EventSystem.emit('logAdded', { type, message });
        }
    }
    
    // Helper function to scroll to the bottom of the log
    // Using a more robust approach to ensure scrolling works
    function scrollToBottom() {
        if (!logContentElement) return;
        
        // Use requestAnimationFrame to ensure this happens after DOM updates
        requestAnimationFrame(() => {
            logContentElement.scrollTop = logContentElement.scrollHeight;
        });
    }
    
    // Force scrolling with multiple approaches to ensure it works
    function forceScrollToBottom() {
        if (!logContentElement) return;
        
        if (window.Utils && window.Utils.forceScrollToBottom) {
            window.Utils.forceScrollToBottom(logContentElement);
        } else {
            // Fallback implementation
            logContentElement.scrollTop = logContentElement.scrollHeight;
            
            requestAnimationFrame(() => {
                logContentElement.scrollTop = logContentElement.scrollHeight;
                
                setTimeout(() => {
                    logContentElement.scrollTop = logContentElement.scrollHeight;
                }, 10);
            });
        }
    }
    
    // Remove old entries if we exceed the maximum
    function pruneOldEntries() {
        const maxEntries = window.CONFIG && window.CONFIG.UI && window.CONFIG.UI.LOGGER && window.CONFIG.UI.LOGGER.MAX_ENTRIES || 100;
        
        while (logContentElement.children.length > maxEntries) {
            logContentElement.removeChild(logContentElement.firstChild);
        }
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
        forceScrollToBottom,
        types: MESSAGE_TYPES
    };
})();

// Initialize Logger if loaded directly
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', function() {
        if (window.Logger) window.Logger.init();
    });
} 