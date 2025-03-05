// Logger Toggle Functionality
(function() {
    // Initialize after DOM is loaded
    window.addEventListener('DOMContentLoaded', function() {
        const logElement = document.getElementById('log');
        const logToggle = document.getElementById('logToggle');
        const logContent = document.getElementById('logContent');
        
        // Ensure log is visible by default unless specified in config
        if (logElement) {
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
        }
        
        // Function to toggle log visibility
        function toggleLog() {
            if (window.togglePanelCollapse) {
                const isCollapsed = window.togglePanelCollapse(logElement, logToggle);
                
                // When opening the console, force scroll to the latest entry
                if (!isCollapsed) {
                    if (window.Logger && typeof window.Logger.forceScrollToBottom === 'function') {
                        window.Logger.forceScrollToBottom();
                    } else {
                        // Fallback if Logger.forceScrollToBottom is not available
                        setTimeout(() => {
                            logContent.scrollTop = logContent.scrollHeight;
                        }, 10);
                    }
                }
            } else {
                // Fallback to original code
                logElement.classList.toggle('collapsed');
                
                if (logElement.classList.contains('collapsed')) {
                    logToggle.textContent = '▶ CONSOLE';
                } else {
                    logToggle.textContent = '▼';
                    
                    // When opening the console, force scroll to the latest entry
                    if (window.Logger && typeof window.Logger.forceScrollToBottom === 'function') {
                        window.Logger.forceScrollToBottom();
                    } else {
                        // Fallback if Logger.forceScrollToBottom is not available
                        setTimeout(() => {
                            logContent.scrollTop = logContent.scrollHeight;
                        }, 10);
                    }
                }
            }
        }
        
        // Add click event to toggle button
        logToggle.addEventListener('click', toggleLog);
        
        // Extend original Logger.log to ensure console is visible when logging
        if (window.Logger) {
            // Make the forceScrollToBottom function available globally
            if (window.Logger.forceScrollToBottom) {
                window.Logger.forceScrollToBottom = window.Logger.forceScrollToBottom;
            }
            
            // Override the log function to ensure console is visible
            const originalLog = window.Logger.log;
            window.Logger.log = function(message) {
                // Call the original log function
                originalLog(message);
                
                // Make sure log is visible for important messages
                if (message.includes('ERROR') || message.includes('WARNING')) {
                    logElement.classList.remove('collapsed');
                    logToggle.textContent = '▼';
                }
            };
        }
    });
})(); 