// Game Configuration
const CONFIG = {
    // CAMERA SETTINGS
    CAMERA: {
        START_POSITION: {x: 0, y: 1.6, z: -25},
        SPEED: 0.1,
        GROUND_Y: 1.6,
        SENSITIVITY: 0.05,  // Look sensitivity for right joystick/mouse
        FOV: 0.8,           // Field of view (in radians)
        BOB_INTENSITY: 5    // How much the camera bobs when moving
    },
    
    // GRID SETTINGS
    GRID: {
        SIZE: 50,          // How far the grid extends
        SPACING: 2,        // Distance between grid lines
        COLOR: {r: 0, g: 1, b: 0},  // RGB values (0-1)
        GLOW_INTENSITY: 2.0,  // Grid glow effect strength
        VISIBILITY: true      // Toggle grid visibility
    },
    
    // SKYBOX SETTINGS
    SKYBOX: {
        TOP_COLOR: "#000033",    // Deep blue
        BOTTOM_COLOR: "#ff69b4", // Hot pink
        STAR_COUNT: 1500,
        STAR_SIZE_MIN: 0.1,
        STAR_SIZE_MAX: 0.4,
        AMBIENT_LIGHT: 0.3       // Intensity of ambient scene light
    },
    
    // HANDS SETTINGS
    HANDS: {
        SIZE: "80px",
        COLOR: "#ff69b4",  // Hot pink
        BOTTOM_OFFSET: "20px",
        SIDE_OFFSET: "20px",
        BACKGROUND: "rgba(255,105,180,0.2)",
        STRIKE: {
            SPEED: 0.005,
            DISTANCE: 200,
            EASING: "sine"  // "sine", "elastic", "bounce"
        }
    },
    
    // PHYSICS SETTINGS
    PHYSICS: {
        GRAVITY: -0.02,
        JUMP_FORCE: 0.8,
        MOVE_SPEED: 0.1     // Base movement speed
    },
    
    // AUDIO SETTINGS
    AUDIO: {
        MUSIC: {
            VOLUME: 0.5,
            AUTOPLAY: false,
            CURRENT_TRACK_INDEX: 0 // Track the currently playing track
        },
        SFX: {
            FOOTSTEPS: {
                URL: "https://freesound.org/data/previews/147/147054_2538033-lq.mp3",
                VOLUME: 0.2
            },
            JUMP: {
                URL: "https://freesound.org/data/previews/369/369515_6687660-lq.mp3",
                VOLUME: 0.4
            },
            STRIKE: {
                URL: "https://freesound.org/data/previews/320/320775_5260872-lq.mp3",
                VOLUME: 0.5
            }
        },
        TRACKS: [
            {
                NAME: "vhs",
                URL: "js/audio/vhs.mp3"
            },
            {
                NAME: "happy airlines",
                URL: "js/audio/happyairlines.wav"
            },
            {
                NAME: "klaxon",
                URL: "js/audio/klaxon.wav"
            },
            {
                NAME: "video game land",
                URL: "js/audio/videogameland.wav"
            }
        ]
    },
    
    // ANIMATION SETTINGS
    ANIMATION: {
        BOB_SPEED: 10,      // Controls bobbing speed
        FIREWORKS_INTERVAL: 800  // Milliseconds between fireworks
    },
    
    // BIRTHDAY SETTINGS
    BIRTHDAY: {
        SHOW_MESSAGE: true,
        RECIPIENT_NAME: "MARCUS",
        TEXT_POSITION: {x: 0, y: 4, z: -15},
        SCALE: 0.6,
        COLORS: {
            PRIMARY: "cyan",
            SECONDARY: "pink",
            GLOW_INTENSITY: 1.5,
            METALLIC: true  // New option to enable metallic effect
        },
        ANIMATION: {
            BOB_HEIGHT: 0.5,
            BOB_SPEED: 0.5,
            ROTATION_SPEED: 0.2
        }
    },
    
    // FIREWORKS SETTINGS
    FIREWORKS: {
        ENABLED: true,
        FREQUENCY: 800,     // ms between fireworks
        COLORS: [
            '#ff69b4', // Hot pink
            '#00ffff', // Cyan
            '#ff00ff', // Magenta
            '#9370db', // Medium purple
            '#7b68ee'  // Medium slate blue
        ],
        PARTICLE_COUNT: 12,
        PARTICLE_DISTANCE: 50
    },
    
    // UI SETTINGS
    UI: {
        LOGGER: {
            MAX_ENTRIES: 100,
            AUTO_SCROLL: true,
            FONT_SIZE: "14px",
            FONT_COLOR: "#FFA500",
            COLLAPSED_BY_DEFAULT: false
        },
        BUTTONS: {
            JUMP: {
                COLOR: "#00ff00",
                GLOW_COLOR: "#00ff00",
                TEXT: "JUMP",
                SIZE: "80px"
            },
            STRIKE: {
                COLOR: "#ff00ff",
                GLOW_COLOR: "#ff00ff",
                TEXT: "STRIKE",
                SIZE: "80px"
            }
        },
        JOYSTICKS: {
            SIZE: 80,
            COLOR: "#00ff00"
        },
        AUDIO_CONTROLS: {
            SFX_VOLUME: 0.7,
            COLLAPSED_BY_DEFAULT: true
        }
    }
}; 