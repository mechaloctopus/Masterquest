// Health Bar System
const HealthBarSystem = (function() {
    // Private properties
    let initialized = false;
    let healthBarElement = null;
    let healthFillElement = null;
    let healthTextElement = null;
    let currentHealth = 100;
    let maxHealth = 100;
    let gameOverScreenElement = null;
    
    // Initialize the health bar
    function init() {
        if (initialized) return true;
        
        console.log("HealthBarSystem: Initializing...");
        
        healthBarElement = document.getElementById('healthBar');
        if (!healthBarElement) {
            console.error("Health bar element not found! Creating a fallback element.");
            
            // Create a fallback health bar if it doesn't exist in DOM
            healthBarElement = document.createElement('div');
            healthBarElement.id = 'healthBar';
            healthBarElement.style.position = 'fixed';
            healthBarElement.style.top = '10px';
            healthBarElement.style.left = '10px';
            healthBarElement.style.width = '200px';
            healthBarElement.style.height = '20px';
            healthBarElement.style.backgroundColor = '#333';
            healthBarElement.style.border = '2px solid #666';
            healthBarElement.style.borderRadius = '4px';
            healthBarElement.style.zIndex = '1000';
            
            // Create health fill element
            healthFillElement = document.createElement('div');
            healthFillElement.id = 'healthFill';
            healthFillElement.style.width = '100%';
            healthFillElement.style.height = '100%';
            healthFillElement.style.background = 'linear-gradient(90deg, #ff0066, #ff00cc)';
            healthFillElement.style.transition = 'width 0.3s ease-in-out';
            
            // Create health text element
            healthTextElement = document.createElement('div');
            healthTextElement.id = 'healthText';
            healthTextElement.style.position = 'absolute';
            healthTextElement.style.top = '0';
            healthTextElement.style.left = '0';
            healthTextElement.style.width = '100%';
            healthTextElement.style.height = '100%';
            healthTextElement.style.display = 'flex';
            healthTextElement.style.justifyContent = 'center';
            healthTextElement.style.alignItems = 'center';
            healthTextElement.style.color = '#fff';
            healthTextElement.style.fontFamily = 'monospace';
            healthTextElement.style.fontSize = '12px';
            healthTextElement.style.fontWeight = 'bold';
            healthTextElement.style.textShadow = '1px 1px 2px #000';
            
            // Add elements to DOM
            healthBarElement.appendChild(healthFillElement);
            healthBarElement.appendChild(healthTextElement);
            document.body.appendChild(healthBarElement);
        } else {
            // Find child elements if they exist
            healthFillElement = healthBarElement.querySelector('#healthFill') || healthBarElement.querySelector('.health-fill');
            healthTextElement = healthBarElement.querySelector('#healthText') || healthBarElement.querySelector('.health-text');
            
            // Create them if they don't exist
            if (!healthFillElement) {
                healthFillElement = document.createElement('div');
                healthFillElement.id = 'healthFill';
                healthFillElement.style.width = '100%';
                healthFillElement.style.height = '100%';
                healthFillElement.style.background = 'linear-gradient(90deg, #ff0066, #ff00cc)';
                healthBarElement.appendChild(healthFillElement);
            }
            
            if (!healthTextElement) {
                healthTextElement = document.createElement('div');
                healthTextElement.id = 'healthText';
                healthTextElement.style.position = 'absolute';
                healthTextElement.style.top = '0';
                healthTextElement.style.left = '0';
                healthTextElement.style.width = '100%';
                healthTextElement.style.textAlign = 'center';
                healthTextElement.style.color = '#fff';
                healthBarElement.appendChild(healthTextElement);
            }
        }
        
        // Set initial health WITHOUT calling setHealth to avoid recursion
        // Just update the UI directly
        updateHealthUI(currentHealth, maxHealth);
        
        initialized = true;
        
        console.log("HealthBarSystem: Initialized successfully");
        
        // Log initialization if logger is available
        if (window.Logger) {
            Logger.log("> HEALTH SYSTEM INITIALIZED");
        }
        
        return true;
    }
    
    // Internal function to update health UI without recursion checks
    function updateHealthUI(health, max) {
        // Calculate health percentage
        const percentage = (health / max) * 100;
        
        // Update health fill element width
        if (healthFillElement) {
            healthFillElement.style.width = `${percentage}%`;
            
            // Change color based on health percentage
            if (percentage <= 20) {
                healthFillElement.style.background = 'linear-gradient(90deg, #ff0000, #ff3333)';
            } else if (percentage <= 50) {
                healthFillElement.style.background = 'linear-gradient(90deg, #ff6600, #ff9966)';
            } else {
                healthFillElement.style.background = 'linear-gradient(90deg, #ff0066, #ff00cc)';
            }
        }
        
        // Update health text
        if (healthTextElement) {
            healthTextElement.textContent = `${Math.round(health)} / ${Math.round(max)}`;
        }
        
        return percentage;
    }
    
    // Set health value and update the UI
    function setHealth(health, max = maxHealth) {
        // If not initialized, try to initialize first
        if (!initialized) {
            init();
        }
        
        // Update health values with validation
        currentHealth = Math.max(0, Math.min(health, max));
        maxHealth = Math.max(max, 1); // Prevent division by zero
        
        // Update the UI
        const percentage = updateHealthUI(currentHealth, maxHealth);
        
        // Debug log
        console.log(`HealthBarSystem: Health updated to ${currentHealth}/${maxHealth} (${percentage}%)`);
        
        // Emit health change event if event system is available
        if (window.EventSystem) {
            EventSystem.emit('health.changed', {
                current: currentHealth,
                max: maxHealth,
                percentage: percentage
            });
        }
        
        // Return current health percentage
        return percentage;
    }
    
    // Get current health
    function getHealth() {
        return {
            current: currentHealth,
            max: maxHealth,
            percentage: (currentHealth / maxHealth) * 100
        };
    }
    
    // Display game over screen
    function showGameOver() {
        console.log("HealthBarSystem: Player died, showing game over screen");
        
        // Create game over screen if it doesn't exist
        if (!gameOverScreenElement) {
            gameOverScreenElement = document.createElement('div');
            gameOverScreenElement.id = 'gameOverScreen';
            gameOverScreenElement.style.position = 'fixed';
            gameOverScreenElement.style.top = '0';
            gameOverScreenElement.style.left = '0';
            gameOverScreenElement.style.width = '100%';
            gameOverScreenElement.style.height = '100%';
            gameOverScreenElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            gameOverScreenElement.style.display = 'flex';
            gameOverScreenElement.style.flexDirection = 'column';
            gameOverScreenElement.style.justifyContent = 'center';
            gameOverScreenElement.style.alignItems = 'center';
            gameOverScreenElement.style.color = '#ff0000';
            gameOverScreenElement.style.fontFamily = 'monospace';
            gameOverScreenElement.style.fontSize = '32px';
            gameOverScreenElement.style.fontWeight = 'bold';
            gameOverScreenElement.style.zIndex = '9999';
            
            // Create message element
            const messageElement = document.createElement('div');
            messageElement.textContent = "YOU DIED IN BATTLE";
            messageElement.style.marginBottom = '20px';
            messageElement.style.textShadow = '0 0 10px #ff0000';
            
            // Create subtitle element
            const subtitleElement = document.createElement('div');
            subtitleElement.textContent = "press any key to continue from your last checkpoint";
            subtitleElement.style.fontSize = '18px';
            subtitleElement.style.color = '#ffffff';
            
            // Add elements to game over screen
            gameOverScreenElement.appendChild(messageElement);
            gameOverScreenElement.appendChild(subtitleElement);
            
            // Add to DOM
            document.body.appendChild(gameOverScreenElement);
            
            // Add event listener for key press
            document.addEventListener('keydown', handleGameOverKeyPress);
        } else {
            // If it already exists, just show it
            gameOverScreenElement.style.display = 'flex';
        }
        
        // Log game over if logger is available
        if (window.Logger) {
            Logger.log("> PLAYER DIED IN BATTLE");
        }
    }
    
    // Handle key press during game over
    function handleGameOverKeyPress(event) {
        console.log("HealthBarSystem: Key pressed during game over, reloading page");
        
        // Remove the event listener to prevent multiple reloads
        document.removeEventListener('keydown', handleGameOverKeyPress);
        
        // Reload the page
        window.location.reload();
    }
    
    // Damage the player
    function damage(amount) {
        if (amount <= 0) return currentHealth;
        
        console.log(`HealthBarSystem: Taking damage: ${amount}`);
        
        // Calculate new health
        const newHealth = Math.max(0, currentHealth - amount);
        
        // Update health bar
        setHealth(newHealth);
        
        // Add hit effect
        addHitEffect();
        
        // Check if player died
        if (newHealth <= 0) {
            // Show game over screen when health reaches 0
            showGameOver();
        }
        
        // Return new health
        return newHealth;
    }
    
    // Heal the player
    function heal(amount) {
        if (amount <= 0) return currentHealth;
        
        // Calculate new health
        const newHealth = Math.min(maxHealth, currentHealth + amount);
        
        // Update health bar
        setHealth(newHealth);
        
        // Add heal effect
        addHealEffect();
        
        // Return new health
        return newHealth;
    }
    
    // Add visual hit effect
    function addHitEffect() {
        if (!healthBarElement) return;
        
        // Add hit animation class
        healthBarElement.classList.add('hit');
        
        // Add backup animation in case CSS class isn't working
        const originalBorder = healthBarElement.style.border;
        healthBarElement.style.border = '2px solid #ff0000';
        
        // Remove class and restore border after animation completes
        setTimeout(() => {
            healthBarElement.classList.remove('hit');
            healthBarElement.style.border = originalBorder;
        }, 500);
    }
    
    // Add visual heal effect
    function addHealEffect() {
        if (!healthBarElement) return;
        
        // Add heal animation class
        healthBarElement.classList.add('heal');
        
        // Add backup animation in case CSS class isn't working
        const originalBorder = healthBarElement.style.border;
        healthBarElement.style.border = '2px solid #00ff00';
        
        // Remove class after animation completes
        setTimeout(() => {
            healthBarElement.classList.remove('heal');
            healthBarElement.style.border = originalBorder;
        }, 500);
    }
    
    // Show the health bar
    function show() {
        if (!healthBarElement) return;
        
        healthBarElement.style.display = 'block';
    }
    
    // Hide the health bar
    function hide() {
        if (!healthBarElement) return;
        
        healthBarElement.style.display = 'none';
    }
    
    // Initialize when the DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log("HealthBarSystem: DOM ready, initializing...");
        init();
    });
    
    // Also initialize immediately if document is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("HealthBarSystem: Document already ready, initializing immediately...");
        init();
    }
    
    // Create public API
    const publicAPI = {
        init,
        setHealth,
        getHealth,
        damage,
        heal,
        show,
        hide
    };
    
    // Explicitly assign to window object to ensure global availability
    window.HealthBarSystem = publicAPI;
    
    // Also return the public API for module systems
    return publicAPI;
})();

// Secondary export to window to ensure it's available
window.HealthBarSystem = HealthBarSystem; 