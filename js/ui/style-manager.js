// Style Manager - Apply CONFIG values to CSS variables
const StyleManager = {
    initialize: function() {
        const root = document.documentElement;
        
        // Set button colors and styles
        root.style.setProperty('--jump-button-color', `rgba(0, 255, 0, 0.2)`);
        root.style.setProperty('--jump-button-border', CONFIG.UI.BUTTONS.JUMP.COLOR);
        root.style.setProperty('--jump-button-text', CONFIG.UI.BUTTONS.JUMP.COLOR);
        root.style.setProperty('--jump-button-glow', `drop-shadow(0 0 5px ${CONFIG.UI.BUTTONS.JUMP.GLOW_COLOR})`);
        
        root.style.setProperty('--strike-button-color', `rgba(255, 0, 255, 0.2)`);
        root.style.setProperty('--strike-button-border', CONFIG.UI.BUTTONS.STRIKE.COLOR);
        root.style.setProperty('--strike-button-text', CONFIG.UI.BUTTONS.STRIKE.COLOR); 
        root.style.setProperty('--strike-button-glow', `drop-shadow(0 0 5px ${CONFIG.UI.BUTTONS.STRIKE.GLOW_COLOR})`);
        
        // Set hand styles
        root.style.setProperty('--hand-background', CONFIG.HANDS.BACKGROUND);
        root.style.setProperty('--hand-border', CONFIG.HANDS.COLOR);
        root.style.setProperty('--hand-glow', `0 0 20px ${CONFIG.HANDS.COLOR}, inset 0 0 15px ${CONFIG.HANDS.COLOR}`);
        
        // Update text on buttons
        document.getElementById('jumpButton').textContent = CONFIG.UI.BUTTONS.JUMP.TEXT;
        document.getElementById('strikeButton').textContent = CONFIG.UI.BUTTONS.STRIKE.TEXT;
        
        // Set hand size
        document.querySelectorAll('.hand').forEach(hand => {
            hand.style.width = CONFIG.HANDS.SIZE;
            hand.style.height = CONFIG.HANDS.SIZE;
        });
    },
    
    // Update a specific visual element from the CONFIG
    updateElement: function(elementType, property, value) {
        // This could be expanded to dynamically update specific properties
        // without needing to reinitialize everything
        switch(elementType) {
            case 'grid':
                // Update grid color, size, etc.
                break;
            case 'skybox':
                // Update skybox colors
                break;
            case 'buttons':
                // Update button styles
                break;
            // etc.
        }
    }
};

// Initialize styles when document is ready
document.addEventListener('DOMContentLoaded', function() {
    StyleManager.initialize();
}); 