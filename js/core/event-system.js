// Event System for inter-module communication
const EventSystem = (function() {
    // Private event registry
    const events = {};
    let initialized = false;
    
    // Initialize the event system
    function init() {
        if (initialized) return;
        
        // Clear any existing events
        clear();
        
        // Mark as initialized
        initialized = true;
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> EVENT SYSTEM INITIALIZED");
        } else {
            console.log("> EVENT SYSTEM INITIALIZED");
        }
        
        return true;
    }
    
    // Subscribe to an event
    function on(eventName, callback) {
        if (!eventName || typeof callback !== 'function') {
            console.error("Invalid event subscription:", eventName);
            return null;
        }
        
        if (!initialized) init();
        
        if (!events[eventName]) {
            events[eventName] = [];
        }
        
        events[eventName].push(callback);
        
        // Return unsubscribe function
        return () => off(eventName, callback);
    }
    
    // Unsubscribe from an event
    function off(eventName, callback) {
        if (!eventName || !events[eventName]) return;
        
        if (callback) {
            events[eventName] = events[eventName].filter(cb => cb !== callback);
        } else {
            // If no callback is provided, remove all listeners for this event
            events[eventName] = [];
        }
    }
    
    // Emit an event with data
    function emit(eventName, data) {
        if (!eventName || !events[eventName] || events[eventName].length === 0) return;
        
        events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }
    
    // Get the number of listeners for an event
    function listenerCount(eventName) {
        return events[eventName]?.length || 0;
    }
    
    // Get all registered event names
    function eventNames() {
        return Object.keys(events);
    }
    
    // Clear all event listeners
    function clear() {
        Object.keys(events).forEach(eventName => {
            events[eventName] = [];
        });
    }
    
    // Check if initialized
    function isInitialized() {
        return initialized;
    }
    
    // Try to initialize automatically
    init();
    
    // Public API
    return {
        init,
        on,
        off,
        emit,
        listenerCount,
        eventNames,
        clear,
        isInitialized
    };
})(); 