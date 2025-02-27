// Game Configuration
const CONFIG = {
    CAMERA: {
        START_POSITION: {x: 0, y: 1.6, z: -25},
        SPEED: 0.1,
        GROUND_Y: 1.6
    },
    GRID: {
        SIZE: 50,
        SPACING: 2,
        COLOR: {r: 0, g: 1, b: 0}
    },
    HANDS: {
        SIZE: "80px",
        COLOR: "#0ff",
        BOTTOM_OFFSET: "20px",
        SIDE_OFFSET: "20px",
        BACKGROUND: "rgba(0,255,255,0.2)",
        STRIKE: {
            SPEED: 0.005,
            DISTANCE: 200,
            EASING: "sine" // "sine", "elastic", "bounce"
        }
    },
    PHYSICS: {
        GRAVITY: -0.02,
        JUMP_FORCE: 0.8
    },
    AUDIO: {
        MUSIC: {
            URL: "https://cdn.freesound.org/previews/558/558657_7741937-lq.mp3",
            VOLUME: 0.5,
            AUTOPLAY: true
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
        }
    },
    ANIMATION_SPEED: 10, // Controls bobbing speed
    SKYBOX: {
        TOP_COLOR: "#000000", // Pure black for deep space
        BOTTOM_COLOR: "#000011", // Very slight blue tint at bottom
        STAR_COUNT: 1500,      // Fewer but more distinct stars
        STAR_SIZE_MIN: 0.1,    
        STAR_SIZE_MAX: 0.4     // Smaller max size for stars
    }
}; 