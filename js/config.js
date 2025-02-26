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
        COLOR: {r: 0.75, g: 0, b: 1}
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
            URL: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Soft_and_Furious/Emotion_Promo_EP/Soft_and_Furious_-_03_-_The_Reckoning.mp3",
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
    ANIMATION_SPEED: 10 // Controls bobbing speed
}; 