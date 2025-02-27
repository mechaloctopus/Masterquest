// Fireworks System
const FireworksSystem = {
    init: function() {
        if (!CONFIG.FIREWORKS.ENABLED) {
            return;
        }
        
        try {
            this.container = document.getElementById('fireworks');
            if (!this.container) {
                Logger.error("Fireworks container not found");
                return;
            }
            
            this.colors = CONFIG.FIREWORKS.COLORS;
            
            // Start fireworks loop with configurable interval
            this.startFireworks();
            Logger.log("> FIREWORKS INITIALIZED");
        } catch (e) {
            Logger.error("Error initializing fireworks: " + e.message);
        }
    },
    
    createFirework: function() {
        // Random position on screen
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.7); // Keep in upper 70% of screen
        
        // Create firework center
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = `${x}px`;
        firework.style.top = `${y}px`;
        
        // Random color from our vaporwave palette
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        firework.style.backgroundColor = color;
        firework.style.boxShadow = `0 0 10px 2px ${color}`;
        
        // Add to container
        this.container.appendChild(firework);
        
        // Create particles for explosion effect
        this.createParticles(x, y, color);
        
        // Remove after animation completes
        setTimeout(() => {
            if (firework.parentNode) {
                firework.parentNode.removeChild(firework);
            }
        }, 1000);
    },
    
    createParticles: function(x, y, color) {
        // Create particles around the firework
        const particleCount = CONFIG.FIREWORKS.PARTICLE_COUNT;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework';
            
            // Position at center of explosion
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 10px 2px ${color}`;
            
            // Calculate trajectory
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = CONFIG.FIREWORKS.PARTICLE_DISTANCE + Math.random() * 50;
            
            // Set animation
            particle.animate([
                { transform: 'scale(0.1)', opacity: 1 },
                { 
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                    opacity: 0 
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.1, 0.8, 0.9, 1)'
            });
            
            // Add to container
            this.container.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    },
    
    startFireworks: function() {
        // Create a firework at the configured interval
        setInterval(() => this.createFirework(), CONFIG.FIREWORKS.FREQUENCY);
        
        // Create initial fireworks
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.createFirework(), i * 300);
        }
    }
}; 