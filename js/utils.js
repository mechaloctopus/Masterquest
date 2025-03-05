// Utility functions for the application
const Utils = (function() {
    // Animation easing functions
    const easing = {
        linear: (t) => t,
        
        // Sine easing
        sine: {
            in: (t) => 1 - Math.cos((t * Math.PI) / 2),
            out: (t) => Math.sin((t * Math.PI) / 2),
            inOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2
        },
        
        // Elastic easing
        elastic: {
            in: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            out: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            inOut: (t) => {
                const c5 = (2 * Math.PI) / 4.5;
                return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
                    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
            }
        },
        
        // Bounce easing
        bounce: {
            in: (t) => 1 - easing.bounce.out(1 - t),
            out: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            },
            inOut: (t) => t < 0.5
                ? (1 - easing.bounce.out(1 - 2 * t)) / 2
                : (1 + easing.bounce.out(2 * t - 1)) / 2
        }
    };
    
    // Get easing function by name
    function getEasingFunction(name) {
        if (!name || typeof name !== 'string') return easing.linear;
        
        try {
            const [type, direction = 'out'] = name.split('.');
            return easing[type]?.[direction] || easing.linear;
        } catch (e) {
            console.error("Error getting easing function:", e);
            return easing.linear;
        }
    }
    
    // Lerp (linear interpolation)
    function lerp(start, end, amt) {
        // Ensure valid numbers to avoid NaN
        start = Number(start) || 0;
        end = Number(end) || 0;
        amt = Number(amt) || 0;
        
        // Clamp amt to [0,1] range
        amt = amt < 0 ? 0 : amt > 1 ? 1 : amt;
        
        return (1 - amt) * start + amt * end;
    }
    
    // Clamp a value between min and max
    function clamp(value, min, max) {
        // Ensure valid numbers
        value = Number(value) || 0;
        min = Number(min) != null ? Number(min) : Number.MIN_SAFE_INTEGER;
        max = Number(max) != null ? Number(max) : Number.MAX_SAFE_INTEGER;
        
        // Swap if min > max
        if (min > max) [min, max] = [max, min];
        
        return Math.max(min, Math.min(max, value));
    }
    
    // Convert hex color to RGB
    function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') {
            return { r: 0, g: 0, b: 0 };
        }
        
        try {
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
            
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255
            } : { r: 0, g: 0, b: 0 };
        } catch (e) {
            console.error("Error converting hex to RGB:", e);
            return { r: 0, g: 0, b: 0 };
        }
    }
    
    // Convert RGB to hex color
    function rgbToHex(r, g, b) {
        try {
            // Ensure values are numbers and in range [0,1]
            r = clamp(Number(r) || 0, 0, 1);
            g = clamp(Number(g) || 0, 0, 1);
            b = clamp(Number(b) || 0, 0, 1);
            
            // Convert to 0-255 range and build hex
            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
            
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (e) {
            console.error("Error converting RGB to hex:", e);
            return "#000000";
        }
    }
    
    // Check if device has touch capability
    function isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }
    
    // Debug logging with timestamps
    function debug(message, type = 'log') {
        if (!message) return;
        
        try {
            const timestamp = new Date().toISOString().substr(11, 8);
            const prefix = `[${timestamp}]`;
            
            if (type === 'error') {
                console.error(prefix, message);
            } else if (type === 'warn') {
                console.warn(prefix, message);
            } else {
                console.log(prefix, message);
            }
        } catch (e) {
            // Fallback if anything goes wrong
            console.log(message);
        }
    }
    
    // Initialize - log that we're ready
    try {
        if (window.Logger) {
            window.addEventListener('DOMContentLoaded', () => {
                Logger.log("> UTILS MODULE READY");
            });
        }
    } catch (e) {
        console.log("> UTILS MODULE READY");
    }
    
    /**
     * Utility to toggle panel collapse state
     * @param {HTMLElement} panelElement - The panel element to toggle
     * @param {HTMLElement} toggleElement - The toggle button element
     * @param {Function} callback - Optional callback after toggle is complete
     */
    function togglePanelCollapse(panelElement, toggleElement, callback) {
        if (!panelElement) return;
        
        const isCollapsed = panelElement.classList.toggle('collapsed');
        
        if (toggleElement) {
            toggleElement.textContent = isCollapsed ? '▲' : '▼';
        }
        
        if (typeof callback === 'function') {
            callback(isCollapsed);
        }
        
        return isCollapsed;
    }
    
    // Expose public API
    return {
        easing,
        getEasingFunction,
        lerp,
        clamp,
        hexToRgb,
        rgbToHex,
        isTouchDevice,
        debug,
        togglePanelCollapse
    };
})(); 

// Expose the utility in the global scope
window.togglePanelCollapse = Utils.togglePanelCollapse; 