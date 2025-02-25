// Logging System
const Logger = {
    log: function(msg) {
        const logElement = document.getElementById('log');
        logElement.innerHTML += msg + '<br>';
    },
    
    error: function(msg) {
        this.log(`!! SYSTEM ERROR: ${msg}`);
    },
    
    warning: function(msg) {
        this.log(`! WARNING: ${msg}`);
    },
    
    clear: function() {
        document.getElementById('log').innerHTML = '';
    }
}; 