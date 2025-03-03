// Health Bar System
const HealthBarSystem = (function() {
    // Private properties
    let initialized = false;
    let healthBarElement = null;
    let healthFillElement = null;
    let healthTextElement = null;
    let currentHealth = 100;
    let maxHealth = 100;
    
    // Initialize the health bar
    function init() {
        if (initialized) return true;
        
        healthBarElement = document.getElementById('healthBar');
        if (!healthBarElement) {
            console.error("Health bar element not found!");
            return false;
        }
        
        healthFillElement = document.getElementById('healthFill');
        healthTextElement = document.getElementById('healthText');
        
        // Set initial health WITHOUT calling setHealth to avoid recursion
        // Just update the UI directly
        updateHealthUI(currentHealth, maxHealth);
        
        initialized = true;
        
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
        // If not initialized, just store the values but don't call init()
        if (!initialized) {
            currentHealth = Math.max(0, Math.min(health, max));
            maxHealth = Math.max(max, 1);
            return (currentHealth / maxHealth) * 100;
        }
        
        // Update health values with validation
        currentHealth = Math.max(0, Math.min(health, max));
        maxHealth = Math.max(max, 1); // Prevent division by zero
        
        // Update the UI
        const percentage = updateHealthUI(currentHealth, maxHealth);
        
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
    
    // Damage the player
    function damage(amount) {
        if (amount <= 0) return currentHealth;
        
        // Calculate new health
        const newHealth = currentHealth - amount;
        
        // Update health bar
        setHealth(newHealth);
        
        // Add hit effect
        addHitEffect();
        
        // Return new health
        return newHealth;
    }
    
    // Heal the player
    function heal(amount) {
        if (amount <= 0) return currentHealth;
        
        // Calculate new health
        const newHealth = currentHealth + amount;
        
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
        
        // Remove class after animation completes
        setTimeout(() => {
            healthBarElement.classList.remove('hit');
        }, 500);
    }
    
    // Add visual heal effect
    function addHealEffect() {
        if (!healthBarElement) return;
        
        // Add heal animation class
        healthBarElement.classList.add('heal');
        
        // Remove class after animation completes
        setTimeout(() => {
            healthBarElement.classList.remove('heal');
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
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        setHealth,
        getHealth,
        damage,
        heal,
        show,
        hide
    };
})(); 