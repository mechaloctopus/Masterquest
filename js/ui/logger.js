// Enhanced Logging System with Toggle Controls
window.Logger = (function() {
    // Private variables
    let logContentElement = null;
    let logElement = null;
    let logToggle = null;
    let initialized = false;
    const SYSTEM_NAME = 'LOGGER';
    
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
        
        // Obtain DOM elements
        if (window.Utils && window.Utils.dom) {
            logContentElement = Utils.dom.getElement('logContent', {
                system: SYSTEM_NAME,
                required: true,
                errorMessage: "Log content element not found! Logger will not function."
            });
            
            logElement = Utils.dom.getElement('log', {
                system: SYSTEM_NAME,
                required: true
            });
            
            logToggle = Utils.dom.getElement('logToggle', {
                system: SYSTEM_NAME,
                required: true
            });
        } else {
            logContentElement = document.getElementById('logContent');
            logElement = document.getElementById('log');
            logToggle = document.getElementById('logToggle');
            
            if (!logContentElement) {
                console.error("Log content element not found!");
                return false;
            }
        }
        
        // Set initial state based on config
        if (logElement && logToggle) {
            const defaultCollapsed = window.CONFIG && 
                                    window.CONFIG.UI && 
                                    window.CONFIG.UI.LOGGER && 
                                    window.CONFIG.UI.LOGGER.COLLAPSED_BY_DEFAULT;
            
            if (defaultCollapsed) {
                logElement.classList.add('collapsed');
                logToggle.textContent = '▶ CONSOLE';
            } else {
                logElement.classList.remove('collapsed');
                logToggle.textContent = '▼';
            }
            
            // Add toggle event listener
            logToggle.addEventListener('click', toggleLogger);
        }
        
        // Subscribe to log events using Utils.events if available
        if (window.Utils && window.Utils.events) {
            Utils.events.listen('log', handleLogEvent, { system: SYSTEM_NAME });
        } else if (window.EventSystem && EventSystem.isInitialized()) {
            EventSystem.on('log', handleLogEvent);
        }
        
        initialized = true;
        return true;
    }
    
    // Toggle logger visibility
    function toggleLogger() {
        if (!logElement || !logToggle) return;
        
        if (window.togglePanelCollapse) {
            const isCollapsed = window.togglePanelCollapse(logElement, logToggle);
            
            // When opening the console, force scroll to the latest entry
            if (!isCollapsed) {
                forceScrollToBottom();
            }
        } else {
            // Fallback to original code
            logElement.classList.toggle('collapsed');
            
            if (logElement.classList.contains('collapsed')) {
                logToggle.textContent = '▶ CONSOLE';
            } else {
                logToggle.textContent = '▼';
                forceScrollToBottom();
            }
        }
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
            // Fallback to console or use Utils.handleError if available
            if (type === MESSAGE_TYPES.ERROR && window.Utils && window.Utils.handleError) {
                Utils.handleError(SYSTEM_NAME, message);
                return;
            }
            
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

        // Create a message element with proper class for CSS styling
        const messageElement = document.createElement('div');
        messageElement.className = 'log-message';
        
        // Add type-specific classes
        if (type === MESSAGE_TYPES.ERROR) {
            messageElement.classList.add('log-error');
        } else if (type === MESSAGE_TYPES.WARNING) {
            messageElement.classList.add('log-warning');
        } else if (type === MESSAGE_TYPES.DEBUG) {
            messageElement.classList.add('log-debug');
        }
        
        // Create a span for the text that will be animated
        const textSpan = document.createElement('span');
        textSpan.className = 'log-text';
        messageElement.appendChild(textSpan);
        
        // Add to DOM first so it appears immediately
        logContentElement.appendChild(messageElement);
        
        // Get prefix based on message type
        let prefix = '';
        switch (type) {
            case MESSAGE_TYPES.ERROR:
                prefix = 'ERROR: ';
                break;
            case MESSAGE_TYPES.WARNING:
                prefix = 'WARNING: ';
                break;
            case MESSAGE_TYPES.DEBUG:
                prefix = 'DEBUG: ';
                break;
        }
        
        // Use typewriter effect for displaying text
        if (window.Utils && window.Utils.typeText) {
            // Use shared utility if available
            window.Utils.typeText(textSpan, prefix + message, 0, 5, null, logContentElement);
        } else if (window.typeText) {
            // Legacy support
            window.typeText(textSpan, prefix + message, 0, 5, null, logContentElement);
        } else {
            // Fallback to direct text setting if utility not available
            textSpan.textContent = prefix + message;
        }

        // Limit number of log entries to prevent performance issues
        const maxEntries = window.Utils && window.Utils.getConfig 
            ? Utils.getConfig('UI.LOGGER.MAX_ENTRIES', 100)
            : (window.CONFIG && window.CONFIG.UI && window.CONFIG.UI.LOGGER && window.CONFIG.UI.LOGGER.MAX_ENTRIES || 100);
            
        while (logContentElement.children.length > maxEntries) {
            logContentElement.removeChild(logContentElement.children[0]);
        }
        
        // Scroll to bottom
        forceScrollToBottom();
        
        // Show log for important messages
        if ((type === MESSAGE_TYPES.ERROR || type === MESSAGE_TYPES.WARNING) && logElement) {
            logElement.classList.remove('collapsed');
            if (logToggle) logToggle.textContent = '▼';
        }
        
        // Emit event if needed
        if (window.Utils && window.Utils.events) {
            Utils.events.emit('logger.message', { type, message }, { system: SYSTEM_NAME });
        } else if (window.EventSystem && EventSystem.isInitialized()) {
            EventSystem.emit('logger.message', { type, message });
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
        
        try {
            // First attempt: direct scrollTop setting
            logContentElement.scrollTop = logContentElement.scrollHeight;
            
            // Second attempt: use requestAnimationFrame for next paint cycle
            requestAnimationFrame(() => {
                logContentElement.scrollTop = logContentElement.scrollHeight;
                
                // Third attempt: small delay to ensure DOM updates are complete
                setTimeout(() => {
                    logContentElement.scrollTop = logContentElement.scrollHeight;
                }, 10);
            });
        } catch (e) {
            if (window.Utils && window.Utils.handleError) {
                Utils.handleError(SYSTEM_NAME, "Error forcing scroll to bottom", e);
            } else {
                console.error("Error forcing scroll to bottom:", e);
            }
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
        toggleLogger,
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