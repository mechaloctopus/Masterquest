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
    
    /**
     * Creates a typewriter effect by typing text character by character
     * Supports both legacy and modern invocation patterns for backward compatibility
     * 
     * Legacy: typeText(element, text, index, speed, onComplete, scrollElement, append)
     * Modern: typeText({element, text, speed, scrollElement, onComplete, append, index})
     * 
     * @param {HTMLElement|Object} element - DOM element or config object
     * @param {string} text - Text to type (if first param is DOM element)
     * @param {number} index - Current character index (if first param is DOM element)
     * @param {number} speed - Milliseconds between characters
     * @param {Function} onComplete - Optional callback when typing is complete
     * @param {HTMLElement} scrollElement - Optional element to scroll to bottom while typing
     * @param {boolean} append - Whether to append (true) or replace (false) text
     */
    function typeText(element, text, index, speed, onComplete, scrollElement, append = false) {
        // Check if called with config object (new format)
        if (element && typeof element === 'object' && !(element instanceof HTMLElement)) {
            const config = element;
            // Extract parameters from config object
            element = config.element;
            text = config.text;
            index = config.index || 0;
            speed = config.speed || 30;
            onComplete = config.onComplete;
            scrollElement = config.scrollElement;
            append = config.append || false;
        }
        
        if (!element || typeof text !== 'string') return;
        
        // Default speed if not specified
        speed = typeof speed === 'number' ? speed : 30;
        
        if (index === 0 && !append) {
            element.textContent = '';
        }
        
        if (index < text.length) {
            if (append) {
                element.textContent += text.charAt(index);
            } else {
                element.textContent = text.substring(0, index + 1);
            }
            
            // Continue with next character
            setTimeout(function() {
                // Use the same calling format as the original call
                if (arguments[0] && typeof arguments[0] === 'object' && !(arguments[0] instanceof HTMLElement)) {
                    typeText({
                        element,
                        text,
                        index: index + 1,
                        speed,
                        onComplete,
                        scrollElement,
                        append
                    });
                } else {
                    typeText(element, text, index + 1, speed, onComplete, scrollElement, append);
                }
                
                // Scroll if element provided
                if (scrollElement) {
                    scrollElement.scrollTop = scrollElement.scrollHeight;
                }
            }, speed);
        } else if (typeof onComplete === 'function') {
            // Call completion callback if provided
            onComplete();
        }
    }
    
    /**
     * Force an element to scroll to the bottom
     * Uses multiple approaches to ensure reliable scrolling
     * @param {HTMLElement} element - The element to scroll
     */
    function forceScrollToBottom(element) {
        if (!element) return;
        
        // Immediate scroll attempt
        element.scrollTop = element.scrollHeight;
        
        // Backup with requestAnimationFrame for reliable scrolling
        requestAnimationFrame(() => {
            element.scrollTop = element.scrollHeight;
            
            // Additional backup with timeout
            setTimeout(() => {
                element.scrollTop = element.scrollHeight;
            }, 10);
        });
    }
    
    /**
     * Setup a hover animation for a 3D object
     * @param {Object} scene - The Babylon.js scene
     * @param {Object} object - The object to animate (must have mesh and hoverParams properties)
     * @param {Object} options - Configuration options
     * @param {number} options.hoverHeight - Height of the hover animation
     * @param {number} options.hoverSpeed - Speed of the hover animation
     * @param {number} options.rotationSpeed - Speed of rotation
     * @param {boolean} options.addPulse - Whether to add a pulse effect
     * @param {number} options.pulseSpeed - Speed of the pulse effect
     * @param {number} options.pulseAmount - Amount of pulse scaling
     */
    function setupHoverAnimation(scene, object, options = {}) {
        if (!scene || !object || !object.mesh) return;
        
        // Extract options with defaults
        const hoverHeight = options.hoverHeight || 0.5;
        const hoverSpeed = options.hoverSpeed || 0.3;
        const rotationSpeed = options.rotationSpeed || 0.002;
        const addPulse = options.addPulse || false;
        const pulseSpeed = options.pulseSpeed || 3;
        const pulseAmount = options.pulseAmount || 0.1;
        
        // Make sure hoverParams exists
        if (!object.hoverParams) {
            object.hoverParams = {
                phase: 0,
                originalY: object.mesh.position.y
            };
        }
        
        // Register animation to run before each render
        scene.registerBeforeRender(() => {
            if (object && object.mesh) {
                // Update hover phase
                object.hoverParams.phase += hoverSpeed * scene.getAnimationRatio() * 0.01;
                
                // Calculate new Y position with sine wave
                const newY = object.hoverParams.originalY + Math.sin(object.hoverParams.phase) * hoverHeight;
                
                // Apply new position
                object.mesh.position.y = newY;
                
                // Slowly rotate the object
                object.mesh.rotation.y += rotationSpeed * scene.getAnimationRatio();
                
                // Add pulse effect if enabled
                if (addPulse && object.state === 'battle') {
                    const pulse = 1 + pulseAmount * Math.sin(object.hoverParams.phase * pulseSpeed);
                    object.mesh.scaling.x = pulse;
                    object.mesh.scaling.y = pulse;
                    object.mesh.scaling.z = pulse;
                }
            }
        });
    }
    
    /**
     * Standard component initialization utility
     * @param {Object} component - The component object
     * @param {string} name - The name of the component (for logging)
     * @param {Function} initFn - The initialization function to call if not already initialized
     * @param {Object} options - Additional options
     * @param {boolean} options.checkGlobalLogger - Whether to check for global Logger
     * @param {string} options.logPrefix - Prefix for log messages (default: ">")
     * @param {boolean} options.silent - Whether to suppress log messages
     * @returns {boolean} - Whether initialization was successful
     */
    function initializeComponent(component, name, initFn, options = {}) {
        // If already initialized, don't reinitialize
        if (component.initialized) {
            if (!options.silent) {
                const message = `${name} already initialized`;
                if (options.checkGlobalLogger && window.Logger) {
                    window.Logger.warning(message);
                } else {
                    console.warn(message);
                }
            }
            return true;
        }
        
        try {
            // Call the init function
            const result = initFn();
            
            // If the function returns false, initialization failed
            if (result === false) {
                return false;
            }
            
            // Mark as initialized
            component.initialized = true;
            
            // Log success
            if (!options.silent) {
                const prefix = options.logPrefix || ">";
                const message = `${prefix} ${name} INITIALIZED`;
                
                if (options.checkGlobalLogger && window.Logger) {
                    window.Logger.log(message);
                } else {
                    console.log(message);
                }
            }
            
            return true;
        } catch (e) {
            // Log error
            const errorMsg = `Failed to initialize ${name}: ${e.message}`;
            if (options.checkGlobalLogger && window.Logger) {
                window.Logger.error(errorMsg);
            } else {
                console.error(errorMsg);
            }
            return false;
        }
    }
    
    /**
     * Safely log messages to console and Logger if available
     * @param {string} message - The message to log
     * @param {boolean} isError - Whether this is an error message
     * @param {Object} options - Additional options
     * @param {string} options.prefix - Optional prefix for the message
     * @param {string} options.system - Optional system name for the log
     */
    function safeLog(message, isError = false, options = {}) {
        // Apply prefix if provided
        let formattedMessage = message;
        if (options.prefix && !message.startsWith(options.prefix)) {
            formattedMessage = `${options.prefix} ${message}`;
        }
        
        // Add system name if provided
        if (options.system) {
            const systemTag = options.system.toUpperCase();
            formattedMessage = `[${systemTag}] ${formattedMessage}`;
        }
        
        // Always log to console
        if (isError) {
            console.error(formattedMessage);
        } else {
            console.log(formattedMessage);
        }
        
        // Also log to Logger if available
        if (window.Logger) {
            if (isError) {
                Logger.error(formattedMessage);
            } else {
                Logger.log(formattedMessage);
            }
        }
    }
    
    /**
     * Check if player is in proximity to an entity
     * @param {Object} playerPosition - The player's position {x, y, z}
     * @param {Object} entityPosition - The entity's position {x, y, z}
     * @param {number} threshold - The distance threshold for proximity
     * @param {boolean} ignoreY - Whether to ignore Y axis in distance calculation
     * @returns {boolean} - Whether entity is within proximity threshold
     */
    function isInProximity(playerPosition, entityPosition, threshold, ignoreY = true) {
        if (!playerPosition || !entityPosition) return false;
        
        // Convert to BABYLON Vector3 if they aren't already
        const playerPos = playerPosition.x !== undefined ? 
            new BABYLON.Vector3(
                playerPosition.x,
                ignoreY ? 0 : playerPosition.y, 
                playerPosition.z
            ) : playerPosition;
        
        const entityPos = entityPosition.x !== undefined ? 
            new BABYLON.Vector3(
                entityPosition.x,
                ignoreY ? 0 : entityPosition.y,
                entityPosition.z
            ) : entityPosition;
        
        // Calculate distance
        const distance = BABYLON.Vector3.Distance(playerPos, entityPos);
        
        // Return whether within threshold
        return distance < threshold;
    }
    
    /**
     * Setup a highlight effect for a 3D object
     * @param {Object} object - The object to highlight (must have mesh property)
     * @param {boolean} highlight - Whether to highlight or remove highlight
     * @param {Object} options - Highlight options
     * @param {BABYLON.Color3} options.highlightColor - The color to use for highlighting
     * @param {BABYLON.Vector3} options.highlightScale - The scale to use for highlighting
     * @param {BABYLON.Vector3} options.normalScale - The normal scale to restore
     * @param {Object} options.scene - The Babylon scene
     * @param {boolean} options.addPulse - Whether to add a pulse animation
     */
    function setupHighlight(object, highlight, options = {}) {
        if (!object || !object.mesh || !object.mesh.material) return;
        
        const highlightColor = options.highlightColor || new BABYLON.Color3(0, 1, 1); // Cyan default
        const highlightScale = options.highlightScale || new BABYLON.Vector3(1.3, 1.3, 1.3);
        const normalScale = options.normalScale || new BABYLON.Vector3(1, 1, 1);
        const scene = options.scene;
        const addPulse = options.addPulse || false;
        
        if (highlight) {
            // Store original emission color
            if (!object.originalEmissive) {
                object.originalEmissive = object.mesh.material.emissiveColor ? 
                    object.mesh.material.emissiveColor.clone() : 
                    new BABYLON.Color3(0, 0, 0);
            }
            
            // Increase emission for highlight
            object.mesh.material.emissiveColor = highlightColor;
            
            // Add glow layer if requested and not exists
            if (scene && options.addGlow && !scene.effectLayers) {
                const glowLayer = new BABYLON.GlowLayer("highlightGlowLayer", scene);
                glowLayer.intensity = 1.0;
            }
            
            // Scale up slightly
            object.mesh.scaling = highlightScale;
            
            // Create a pulsing animation if requested
            if (addPulse && scene && !object.pulseAnimation) {
                const pulseAnimation = new BABYLON.Animation(
                    "pulseAnimation",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                
                const pulseMax = new BABYLON.Vector3(
                    highlightScale.x * 1.15,
                    highlightScale.y * 1.15,
                    highlightScale.z * 1.15
                );
                
                const keys = [
                    { frame: 0, value: highlightScale.clone() },
                    { frame: 15, value: pulseMax },
                    { frame: 30, value: highlightScale.clone() }
                ];
                
                pulseAnimation.setKeys(keys);
                object.mesh.animations = [pulseAnimation];
                object.pulseAnimation = scene.beginAnimation(object.mesh, 0, 30, true);
            }
        } else {
            // Restore original emission
            if (object.originalEmissive) {
                object.mesh.material.emissiveColor = object.originalEmissive;
            }
            
            // Stop pulse animation if it exists
            if (object.pulseAnimation) {
                object.pulseAnimation.stop();
                object.pulseAnimation = null;
            }
            
            // Restore original scale
            object.mesh.scaling = normalScale;
        }
    }
    
    /**
     * Safely access configuration values with default fallbacks
     * @param {string} path - Dot notation path to configuration value (e.g. "UI.LOGGER.MAX_ENTRIES")
     * @param {any} defaultValue - Default value if path doesn't exist
     * @return {any} - The configuration value or default
     */
    function getConfig(path, defaultValue) {
        try {
            if (!window.CONFIG) {
                return defaultValue;
            }
            
            const parts = path.split('.');
            let current = window.CONFIG;
            
            for (const part of parts) {
                if (current[part] === undefined) {
                    return defaultValue;
                }
                current = current[part];
            }
            
            return current;
        } catch (e) {
            console.error(`Error accessing config path: ${path}`, e);
            return defaultValue;
        }
    }
    
    /**
     * Standardized error handling with system tagging and optional reporting
     * @param {string} system - System identifier (e.g., "LOADER", "NPC")
     * @param {string} message - Error message
     * @param {Error|null} error - Optional error object
     * @param {boolean} isFatal - Whether the error is fatal to the application
     * @return {void}
     */
    function handleError(system, message, error = null, isFatal = false) {
        try {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}][${system}]${isFatal ? '[FATAL]' : ''}`;
            const formattedMessage = `${prefix} ${message}`;
            
            // Log to console with appropriate method
            if (isFatal) {
                console.error(formattedMessage);
            } else {
                console.warn(formattedMessage);
            }
            
            // Log stack trace if error object is provided
            if (error && error.stack) {
                console.error(`${prefix} Stack trace:`, error.stack);
            }
            
            // If Logger system exists, log there too
            if (window.Logger && window.Logger.error) {
                window.Logger.error(formattedMessage);
            }
            
            // Emit event for error tracking
            if (window.EventSystem && EventSystem.isInitialized()) {
                window.EventSystem.emit('system.error', {
                    system,
                    message,
                    error,
                    isFatal,
                    timestamp
                });
            }
            
            // For fatal errors, we might want to stop execution or show an error screen
            if (isFatal && window.LoadingScreen) {
                window.LoadingScreen.showError(message);
            }
        } catch (e) {
            // Fallback if our error handler itself fails
            console.error('Error in error handler:', e);
            console.error('Original error:', message, error);
        }
    }
    
    // Event utility functions
    function createEventUtils() {
        return {
            listen: function(eventName, handler, options = {}) {
                const { once = false, system = 'UNKNOWN' } = options;
                
                if (!window.EventSystem || !EventSystem.isInitialized()) {
                    // Don't log errors for common expected events when the app is starting up
                    if (!['log', 'logger.message'].includes(eventName)) {
                        handleError(system, `Cannot subscribe to event '${eventName}': EventSystem not available`);
                    }
                    return () => {}; // No-op unsubscribe
                }
                
                // Create a wrapper that adds error handling
                const safeHandler = function(data) {
                    try {
                        handler(data);
                    } catch (error) {
                        handleError(
                            system, 
                            `Error in event handler for '${eventName}'`, 
                            error
                        );
                    }
                    
                    // If once is true, automatically unsubscribe after first invocation
                    if (once) {
                        EventSystem.off(eventName, safeHandler);
                    }
                };
                
                // Subscribe to the event
                EventSystem.on(eventName, safeHandler);
                
                // Return unsubscribe function
                return function unsubscribe() {
                    EventSystem.off(eventName, safeHandler);
                };
            },
            
            emit: function(eventName, data = {}, options = {}) {
                const { system = 'UNKNOWN' } = options;
                
                if (!window.EventSystem || !EventSystem.isInitialized()) {
                    // Don't log errors for common expected events when the app is starting up
                    if (!['log', 'logger.message'].includes(eventName)) {
                        handleError(system, `Cannot emit event '${eventName}': EventSystem not available`);
                    }
                    return;
                }
                
                try {
                    // Add metadata to event data
                    const eventData = {
                        ...data,
                        _meta: {
                            timestamp: Date.now(),
                            system
                        }
                    };
                    
                    // Emit the event
                    EventSystem.emit(eventName, eventData);
                } catch (error) {
                    handleError(
                        system,
                        `Error emitting event '${eventName}'`,
                        error
                    );
                }
            },
            
            once: function(eventName, handler, options = {}) {
                return this.listen(eventName, handler, { ...options, once: true });
            }
        };
    }
    
    // DOM utility functions
    function createDOMUtils() {
        return {
            getElement: function(id, options = {}) {
                const { 
                    system = 'DOM', 
                    required = false,
                    errorMessage = `Element #${id} not found` 
                } = options;
                
                const element = document.getElementById(id);
                
                if (!element && required) {
                    handleError(system, errorMessage);
                }
                
                return element;
            },
            
            querySelector: function(selector, options = {}) {
                const { 
                    system = 'DOM', 
                    required = false,
                    parent = document,
                    errorMessage = `Element matching '${selector}' not found`
                } = options;
                
                try {
                    const element = parent.querySelector(selector);
                    
                    if (!element && required) {
                        handleError(system, errorMessage);
                    }
                    
                    return element;
                } catch (error) {
                    handleError(system, `Error querying selector '${selector}'`, error);
                    return null;
                }
            },
            
            querySelectorAll: function(selector, options = {}) {
                const { 
                    system = 'DOM',
                    parent = document
                } = options;
                
                try {
                    return Array.from(parent.querySelectorAll(selector));
                } catch (error) {
                    handleError(system, `Error querying all '${selector}'`, error);
                    return [];
                }
            },
            
            toggleClass: function(element, className, force) {
                if (!element) return false;
                
                try {
                    if (force === undefined) {
                        return element.classList.toggle(className);
                    } else {
                        if (force) {
                            element.classList.add(className);
                        } else {
                            element.classList.remove(className);
                        }
                        return force;
                    }
                } catch (error) {
                    handleError('DOM', `Error toggling class '${className}'`, error);
                    return element.classList.contains(className);
                }
            },
            
            addEvent: function(element, eventType, handler, options = {}) {
                const { system = 'DOM', once = false } = options;
                
                if (!element) {
                    handleError(system, `Cannot add event '${eventType}': Element not found`);
                    return () => {};
                }
                
                try {
                    // Create a wrapper that adds error handling
                    const safeHandler = function(event) {
                        try {
                            handler(event);
                        } catch (error) {
                            handleError(
                                system, 
                                `Error in event handler for '${eventType}'`, 
                                error
                            );
                        }
                    };
                    
                    // Add the event listener
                    element.addEventListener(eventType, safeHandler, { once });
                    
                    // Return a function to remove the event listener
                    return function() {
                        element.removeEventListener(eventType, safeHandler);
                    };
                } catch (error) {
                    handleError(system, `Error adding event '${eventType}'`, error);
                    return () => {};
                }
            }
        };
    }
    
    // Asset management utilities
    function createAssetUtils() {
        // Cache for preloaded assets
        const assetCache = {
            images: {},
            audio: {},
            data: {}
        };
        
        return {
            preloadImage: function(src, id, options = {}) {
                const { system = 'ASSETS' } = options;
                
                return new Promise((resolve, reject) => {
                    // Check if already cached
                    if (assetCache.images[id]) {
                        resolve(assetCache.images[id]);
                        return;
                    }
                    
                    const img = new Image();
                    
                    img.onload = function() {
                        assetCache.images[id] = img;
                        resolve(img);
                    };
                    
                    img.onerror = function(error) {
                        const errorMsg = `Failed to load image: ${src}`;
                        handleError(system, errorMsg, error);
                        reject(new Error(errorMsg));
                    };
                    
                    img.src = src;
                });
            },
            
            preloadAudio: function(src, id, options = {}) {
                const { 
                    system = 'ASSETS',
                    volume = 1.0,
                    loop = false,
                    autoplay = false
                } = options;
                
                return new Promise((resolve, reject) => {
                    // Check if already cached
                    if (assetCache.audio[id]) {
                        resolve(assetCache.audio[id]);
                        return;
                    }
                    
                    const audio = new Audio();
                    
                    audio.oncanplaythrough = function() {
                        assetCache.audio[id] = audio;
                        resolve(audio);
                    };
                    
                    audio.onerror = function(error) {
                        const errorMsg = `Failed to load audio: ${src}`;
                        handleError(system, errorMsg, error);
                        reject(new Error(errorMsg));
                    };
                    
                    audio.volume = volume;
                    audio.loop = loop;
                    audio.src = src;
                    
                    if (autoplay) {
                        audio.play().catch(e => {
                            handleError(system, "Auto-play prevented by browser", e);
                        });
                    }
                });
            },
            
            preloadJSON: function(src, id, options = {}) {
                const { system = 'ASSETS' } = options;
                
                return new Promise((resolve, reject) => {
                    // Check if already cached
                    if (assetCache.data[id]) {
                        resolve(assetCache.data[id]);
                        return;
                    }
                    
                    fetch(src)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            assetCache.data[id] = data;
                            resolve(data);
                        })
                        .catch(error => {
                            const errorMsg = `Failed to load JSON: ${src}`;
                            handleError(system, errorMsg, error);
                            reject(new Error(errorMsg));
                        });
                });
            },
            
            getAsset: function(id, type = 'images') {
                if (!assetCache[type] || !assetCache[type][id]) {
                    return null;
                }
                
                return assetCache[type][id];
            },
            
            isAssetLoaded: function(id, type = 'images') {
                return !!(assetCache[type] && assetCache[type][id]);
            }
        };
    }
    
    // Initialize the utility sub-modules
    const eventUtils = createEventUtils();
    const domUtils = createDOMUtils();
    const assetUtils = createAssetUtils();
    
    // Expose public API
    return {
        // Math & Animation utilities
        easing,
        getEasingFunction,
        lerp,
        clamp,
        
        // Color utilities
        hexToRgb,
        rgbToHex,
        
        // Device & environment utilities
        isTouchDevice,
        
        // Logging & debugging
        debug,
        safeLog,
        handleError,
        
        // UI utilities
        togglePanelCollapse,
        typeText,
        forceScrollToBottom,
        
        // Game object utilities
        setupHoverAnimation,
        setupHighlight,
        isInProximity,
        
        // System utilities
        initializeComponent,
        getConfig,
        
        // Specialized utility modules
        events: eventUtils,
        dom: domUtils,
        assets: assetUtils
    };
})();

// Expose utilities in the global scope for legacy support
window.togglePanelCollapse = Utils.togglePanelCollapse;
window.typeText = Utils.typeText;
window.forceScrollToBottom = Utils.forceScrollToBottom;
window.setupHoverAnimation = Utils.setupHoverAnimation;
window.initializeComponent = Utils.initializeComponent;
window.safeLog = Utils.safeLog;

// Make utils available globally
window.Utils = Utils; 