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
            URL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            VOLUME: 0.6,
            AUTOPLAY: true
        },
        SFX: {
            FOOTSTEPS: {
                URL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                VOLUME: 0.3
            },
            JUMP: {
                URL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                VOLUME: 0.6
            },
            STRIKE: {
                URL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                VOLUME: 0.7
            }
        }
    },
    ANIMATION_SPEED: 10 // Controls bobbing speed
}; 