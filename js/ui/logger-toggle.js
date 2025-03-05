// Logger Toggle Functionality
(function() {
    // Initialize after DOM is loaded
    window.addEventListener('DOMContentLoaded', function() {
        const logElement = document.getElementById('log');
        const logToggle = document.getElementById('logToggle');
        const logContent = document.getElementById('logContent');
        
        // Ensure log is visible by default
        if (logElement) {
            logElement.classList.remove('collapsed');
            logElement.style.display = 'block';
            logToggle.textContent = '▼';
        }
        
        // Function to toggle log visibility
        function toggleLog() {
            logElement.classList.toggle('collapsed');
            
            if (logElement.classList.contains('collapsed')) {
                logToggle.textContent = '▶ CONSOLE';
            } else {
                logToggle.textContent = '▼';
                // Make sure log content is visible
                logElement.style.display = 'block'; 
            }
        }
        
        // Add click event to toggle button
        logToggle.addEventListener('click', toggleLog);
        
        // Function to make sure the original Logger.log still works
        if (window.Logger) {
            const originalLog = window.Logger.log;
            window.Logger.log = function(message) {
                originalLog(message);
                // Make sure log is visible
                logElement.classList.remove('collapsed');
                logElement.style.display = 'block';
                logToggle.textContent = '▼';
                // Auto-scroll to bottom of log
                logContent.scrollTop = logContent.scrollHeight;
            };
        }
    });
})(); 