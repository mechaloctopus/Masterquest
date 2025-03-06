// Control System
const ControlSystem = {
    // Store references to control elements and state
    _controls: {
        leftJoystick: null,
        rightJoystick: null,
        keyboard: {
            enabled: true,
            keysDown: {}
        },
        jumpButton: null,
        strikeButton: null,
        enabled: true
    },
    
    setupControls: function(scene, camera, state, audioSystem) {
        // Joystick setup
        const createJoystick = (element) => {
            return nipplejs.create({
                zone: element,
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: CONFIG.UI.JOYSTICKS.COLOR,
                size: CONFIG.UI.JOYSTICKS.SIZE
            });
        };
        
        // Store scene and state references
        this._scene = scene;
        this._state = state;
        
        // Unified function to handle movement vector updates
        const updateMovementVector = (x, z) => {
            // Ensure we're setting a proper Vector3 with good magnitude
            state.moveVector.x = x;
            state.moveVector.z = z;
            
            // Debug to console to verify movement vector is working
            console.debug(`Move vector: ${x.toFixed(2)}, ${z.toFixed(2)}, length: ${state.moveVector.length().toFixed(2)}`);
            
            // Update walking state and sounds
            const isMoving = state.moveVector.length() > 0.1;
            if (isMoving && !audioSystem.isWalking && state.grounded) {
                audioSystem.sfx.footsteps.play().catch(e => console.warn("Audio play failed:", e));
                audioSystem.isWalking = true;
            } else if (!isMoving && audioSystem.isWalking) {
                audioSystem.sfx.footsteps.pause();
                audioSystem.sfx.footsteps.currentTime = 0;
                audioSystem.isWalking = false;
            }
        };

        // Create left joystick (movement)
        const leftJoystickContainer = document.getElementById('leftJoystick');
        if (leftJoystickContainer) {
            this._controls.leftJoystick = createJoystick(leftJoystickContainer);
            
            // Movement joystick events
            this._controls.leftJoystick.on('move', (event, data) => {
                if (!this._controls.enabled) return;
                
                updateMovementVector(data.vector.x, data.vector.y);
            });
            
            this._controls.leftJoystick.on('end', () => {
                if (!this._controls.enabled) return;
                
                updateMovementVector(0, 0);
            });
        }
        
        // Create right joystick (camera)
        const rightJoystickContainer = document.getElementById('rightJoystick');
        if (rightJoystickContainer) {
            this._controls.rightJoystick = createJoystick(rightJoystickContainer);
            
            // Look joystick events
            this._controls.rightJoystick.on('move', (event, data) => {
                if (!this._controls.enabled) return;
                
                const lookY = data.vector.x * CONFIG.CAMERA.SENSITIVITY;
                const lookX = -data.vector.y * CONFIG.CAMERA.SENSITIVITY;
                
                camera.rotation.y += lookY;
                camera.rotation.x += lookX;
            });
        }
        
        // Set up jump button
        const jumpButton = document.getElementById('jumpButton');
        if (jumpButton) {
            this._controls.jumpButton = jumpButton;
            
            jumpButton.addEventListener('touchstart', (e) => {
                if (!this._controls.enabled) return;
                
                this.triggerJump(state, audioSystem);
            });
            
            jumpButton.addEventListener('click', (e) => {
                if (!this._controls.enabled) return;
                
                this.triggerJump(state, audioSystem);
            });
        }
        
        // Set up strike button
        const strikeButton = document.getElementById('strikeButton');
        if (strikeButton) {
            this._controls.strikeButton = strikeButton;
            
            strikeButton.addEventListener('touchstart', (e) => {
                if (!this._controls.enabled) return;
                
                this.triggerStrike(state, audioSystem);
            });
            
            strikeButton.addEventListener('click', (e) => {
                if (!this._controls.enabled) return;
                
                this.triggerStrike(state, audioSystem);
            });
        }
        
        // Set up keyboard controls
        document.addEventListener('keydown', (e) => {
            // Skip keyboard handling if controls are disabled or if typing in terminal
            if (!this._controls.enabled || !this._controls.keyboard.enabled) return;
            
            // Check if terminal input is active and focused
            const terminalInput = document.getElementById('terminalInput');
            if (terminalInput && document.activeElement === terminalInput) {
                return; // Don't process game controls when typing in terminal
            }
            
            this._controls.keyboard.keysDown[e.key.toLowerCase()] = true;
            
            if (e.code === 'Space' && state.grounded) {
                this.triggerJump(state, audioSystem);
            }
            if (e.code === 'KeyF') {
                this.triggerStrike(state, audioSystem);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (!this._controls.keyboard.enabled) return;
            
            this._controls.keyboard.keysDown[e.key.toLowerCase()] = false;
            
            // Handle keyboard movement for desktop
            let xMove = 0, zMove = 0;
            if (e.code === 'KeyW' || e.code === 'ArrowUp') zMove += 1;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') zMove -= 1;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') xMove -= 1;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') xMove += 1;
            
            // Only update if keys are pressed (preserve joystick values otherwise)
            if (xMove !== 0 || zMove !== 0) {
                // Normalize for diagonal movement
                const length = Math.sqrt(xMove*xMove + zMove*zMove);
                if (length > 0) {
                    xMove /= length;
                    zMove /= length;
                }
                updateMovementVector(xMove, zMove);
            }
        });

        // Process keyboard movement
        scene.registerBeforeRender(() => {
            // Handle keyboard movement for desktop
            let xMove = 0, zMove = 0;
            if (this._controls.keyboard.keysDown['w'] || this._controls.keyboard.keysDown['ArrowUp']) zMove += 1;
            if (this._controls.keyboard.keysDown['s'] || this._controls.keyboard.keysDown['ArrowDown']) zMove -= 1;
            if (this._controls.keyboard.keysDown['a'] || this._controls.keyboard.keysDown['ArrowLeft']) xMove -= 1;
            if (this._controls.keyboard.keysDown['d'] || this._controls.keyboard.keysDown['ArrowRight']) xMove += 1;
            
            // Only update if keys are pressed (preserve joystick values otherwise)
            if (xMove !== 0 || zMove !== 0) {
                // Normalize for diagonal movement
                const length = Math.sqrt(xMove*xMove + zMove*zMove);
                if (length > 0) {
                    xMove /= length;
                    zMove /= length;
                }
                updateMovementVector(xMove, zMove);
            }
        });
    },
    
    triggerJump: function(state, audioSystem) {
        if (!state.grounded) return;
        if (audioSystem.loaded && audioSystem.loaded.jump) {
            audioSystem.sfx.jump.currentTime = 0;
            audioSystem.playSound(audioSystem.sfx.jump, 'jump');
        }
        state.jumpForce = CONFIG.PHYSICS.JUMP_FORCE;
        state.grounded = false;
    },
    
    triggerStrike: function(state, audioSystem) {
        // Debug that the function was called
        console.log("Strike triggered");
        
        if (state.striking) {
            console.log("Already striking, ignoring");
            return;
        }
        
        // Set strike state
        state.striking = true;
        state.strikeProgress = 0; // Reset progress
        
        // Add striking class to right hand for visual effect
        const rightHand = document.getElementById('rightHand');
        if (rightHand) {
            rightHand.classList.add('striking');
            
            // Remove the class after the animation completes
            setTimeout(() => {
                if (rightHand) {
                    rightHand.classList.remove('striking');
                }
            }, 500);
        }
        
        // Play sound
        if (audioSystem && audioSystem.sfx && audioSystem.sfx.strike) {
            if (audioSystem.sfx.strike.currentTime) {
                audioSystem.sfx.strike.currentTime = 0;
            }
            if (audioSystem.playSound) {
                audioSystem.playSound(audioSystem.sfx.strike, 'strike');
            } else if (audioSystem.sfx.strike.play) {
                audioSystem.sfx.strike.play().catch(e => console.warn("Strike sound error:", e));
            }
        }
        
        // Visual feedback on button
        const strikeButton = document.getElementById('strikeButton');
        if (strikeButton) {
            strikeButton.style.background = "rgba(255, 0, 255, 0.6)";
            
            // Reset button after a short delay
            setTimeout(() => {
                if (strikeButton) {
                    strikeButton.style.background = "rgba(255, 0, 255, 0.2)";
                }
            }, 200);
        }
        
        // Add screen flash effect for more impact
        const flashElement = document.createElement('div');
        flashElement.style.position = 'fixed';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.width = '100%';
        flashElement.style.height = '100%';
        flashElement.style.backgroundColor = 'rgba(255, 0, 255, 0.15)';
        flashElement.style.pointerEvents = 'none';
        flashElement.style.zIndex = '9';
        flashElement.style.opacity = '1';
        flashElement.style.transition = 'opacity 0.2s ease-out';
        document.body.appendChild(flashElement);
        
        // Fade out and remove the flash element
        setTimeout(() => {
            flashElement.style.opacity = '0';
            setTimeout(() => {
                if (flashElement.parentNode) {
                    document.body.removeChild(flashElement);
                }
            }, 200);
        }, 50);
        
        console.log("Strike action completed");
    },
    
    // Enable all controls
    enableControls: function() {
        this._controls.enabled = true;
        this._controls.keyboard.enabled = true;
        
        // Update UI state
        const strikeButton = document.getElementById('strikeButton');
        const jumpButton = document.getElementById('jumpButton');
        
        if (strikeButton) strikeButton.style.opacity = '1';
        if (jumpButton) jumpButton.style.opacity = '1';
        
        if (window.Logger) {
            Logger.log("> CONTROLS ENABLED");
        }
    },
    
    // Disable all controls
    disableControls: function() {
        this._controls.enabled = false;
        
        // Force movement vector to zero to stop any ongoing movement
        if (this._state) {
            this._state.moveVector.x = 0;
            this._state.moveVector.z = 0;
            this._state.jumpForce = 0;
        }
        
        // Update UI state
        const strikeButton = document.getElementById('strikeButton');
        const jumpButton = document.getElementById('jumpButton');
        
        if (strikeButton) strikeButton.style.opacity = '0.5';
        if (jumpButton) jumpButton.style.opacity = '0.5';
        
        if (window.Logger) {
            Logger.log("> CONTROLS DISABLED");
        }
    },
    
    // Check if controls are enabled
    isEnabled: function() {
        return this._controls.enabled;
    }
}; 