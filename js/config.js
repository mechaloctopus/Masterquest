// Game Configuration
const CONFIG = {
    // CAMERA SETTINGS
    CAMERA: {
        START_POSITION: {x: 0, y: 1.6, z: 0},
        START_ROTATION: {y: Math.PI}, // Start facing south (Math.PI is 180 degrees, south)
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
            SPEED: 0.05,
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
                URL: "js/audio/footsteps.mp3",
                VOLUME: 0.2
            },
            JUMP: {
                URL: "js/audio/jump.mp3",
                VOLUME: 0.4
            },
            STRIKE: {
                URL: "js/audio/strike.wav",
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
        BOB_SPEED: 10      // Controls bobbing speed
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
    },
    
    // REALM SETTINGS
    REALMS: {
        CURRENT_REALM: 1,  // Which realm to load by default
        COMMON: {
            NPC_COUNT: 10,  // Default number of NPCs per realm
            FOE_COUNT: 10,  // Default number of foes per realm
            // Common settings for all realms
            NPC_TEMPLATES: {
                DIALOGUE: {
                    TYPE: "neon_orb",
                    COLOR: "#00ffff",
                    GLOW_INTENSITY: 1.5,
                    HOVER_HEIGHT: 0.5,
                    HOVER_SPEED: 0.3,
                    SCALE: 1.0
                },
                QUIZ: {
                    TYPE: "neon_orb",
                    COLOR: "#ff00ff",
                    GLOW_INTENSITY: 1.8,
                    HOVER_HEIGHT: 0.7,
                    HOVER_SPEED: 0.5,
                    SCALE: 1.2
                }
            }
        },
        // Individual realm configs will go here
        REALM_1: {
            NAME: "Synthwave Beach",
            SKYBOX: {
                TOP_COLOR: "#000033",    // Deep blue
                BOTTOM_COLOR: "#ff69b4", // Hot pink
            },
            NPCS: [
                {
                    ID: "guide_npc",
                    NAME: "Digital Guide",
                    POSITION: { x: 3, y: 1.8, z: -10 },
                    COLOR: "#0088ff", // Bright blue
                    SCALE: 0.8,
                    HOVER_HEIGHT: 0.3,
                    HOVER_SPEED: 1.5,
                    DIALOGUE: {
                        GREETING: "Welcome to Synthwave Beach! I'm your digital guide.",
                        RESPONSES: [
                            {
                                ID: "about_realm",
                                TEXT: "Tell me about this realm",
                                RESPONSE: "Synthwave Beach is the first realm in your journey. Here you'll learn the basics of navigation and interaction."
                            },
                            {
                                ID: "about_quests",
                                TEXT: "What should I do here?",
                                RESPONSE: "Explore the area, talk to other NPCs, and defeat the quiz foes to earn knowledge and progress to the next realm."
                            }
                        ]
                    }
                }
            ],
            FOES: [
                {
                    ID: "quiz_foe_1",
                    NAME: "Logic Guardian",
                    POSITION: { x: -3, y: 1.8, z: -10 },
                    COLOR: "#ff0000", // Bright red
                    SCALE: 0.8,
                    HOVER_HEIGHT: 0.4,
                    HOVER_SPEED: 1.2,
                    SPIKES: true,
                    QUIZ: {
                        INTRO: "I am the Logic Guardian! Answer my questions to prove your worth.",
                        QUESTIONS: [
                            {
                                QUESTION: "What data type would you use to store a user's response of Yes or No?",
                                OPTIONS: ["String", "Boolean", "Integer", "Float"],
                                CORRECT: 1,
                                EXPLANATION: "Boolean values (true/false) are perfect for yes/no responses."
                            }
                        ]
                    }
                }
            ]
        },
        REALM_2: {
            NAME: "Digital Mountains",
            SKYBOX: {
                TOP_COLOR: "#111133",
                BOTTOM_COLOR: "#00ffff", // Cyan
            }
        }
        // Realms 3-7 to be configured later
    },
    
    // 3D ASSET SETTINGS
    ASSETS: {
        MODELS: {
            PATH: "assets/models/",
            FORMATS: ["glb", "fbx"],
            LOAD_ON_DEMAND: true  // If false, preload all models
        },
        SPRITES: {
            PATH: "assets/sprites/",
            FORMATS: ["png"]
        },
        TEXTURES: {
            PATH: "assets/textures/",
            FORMATS: ["jpg", "png"]
        }
    }
}; 