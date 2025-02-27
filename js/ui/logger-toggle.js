// Logger Toggle Functionality
(function() {
    // Initialize after DOM is loaded
    window.addEventListener('DOMContentLoaded', function() {
        const logElement = document.getElementById('log');
        const logToggle = document.getElementById('logToggle');
        const logContent = document.getElementById('logContent');
        
        // Function to toggle log visibility
        function toggleLog() {
            logElement.classList.toggle('collapsed');
            
            if (logElement.classList.contains('collapsed')) {
                logToggle.textContent = '▶ CONSOLE';
            } else {
                logToggle.textContent = '▼';
            }
        }
        
        // Add click event to toggle button
        logToggle.addEventListener('click', toggleLog);
        
        // Function to make sure the original Logger.log still works
        if (window.Logger) {
            const originalLog = window.Logger.log;
            window.Logger.log = function(message) {
                originalLog(message);
                // Auto-scroll to bottom of log
                logContent.scrollTop = logContent.scrollHeight;
            };
        }
    });
})(); 