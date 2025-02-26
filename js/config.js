// Game Configuration
const CONFIG = {
    CAMERA: {
        START_POSITION: {x: 0, y: 1.6, z: 0},
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
            URL: "https://soundimage.org/wp-content/uploads/2016/04/UI_Quirky13.mp3",
            VOLUME: 0.6,
            AUTOPLAY: true
        },
        SFX: {
            FOOTSTEPS: {
                URL: "https://assets.mixkit.co/sfx/preview/mixkit-fast-small-sweep-transition-166.mp3",
                VOLUME: 0.3
            },
            JUMP: {
                URL: "https://assets.mixkit.co/sfx/preview/mixkit-player-jumping-in-a-video-game-2043.mp3",
                VOLUME: 0.6
            },
            STRIKE: {
                URL: "https://assets.mixkit.co/sfx/preview/mixkit-swift-sword-strike-2166.mp3",
                VOLUME: 0.7
            }
        }
    },
    ANIMATION_SPEED: 10 // Controls bobbing speed
}; 