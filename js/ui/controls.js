// Control System
const ControlSystem = {
    setupControls: function(scene, camera, state, audioSystem) {
        // Joystick setup
        const createJoystick = (element) => {
            return nipplejs.create({
                zone: element,
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: '#00ff00',
                size: 80
            });
        };
        
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

        // Movement joystick
        const leftStick = createJoystick(document.getElementById('leftJoystick'));
        leftStick.on('move', (evt, data) => {
            updateMovementVector(data.vector.x, data.vector.y);
        });
        leftStick.on('end', () => {
            // Check if moveVector exists and has the set method
            if (state.moveVector && typeof state.moveVector.set === 'function') {
                state.moveVector.set(0, 0, 0);
            } else {
                // Fallback in case moveVector isn't properly initialized
                state.moveVector = new BABYLON.Vector3(0, 0, 0);
            }
        });

        // Look joystick
        const rightStick = createJoystick(document.getElementById('rightJoystick'));
        rightStick.on('move', (evt, data) => {
            camera.rotation.y += data.vector.x * 0.02;
            
            const newRotationX = camera.rotation.x + data.vector.y * 0.02;
            
            const maxLookUp = Math.PI * 0.45;
            const maxLookDown = -Math.PI * 0.45;
            
            if (newRotationX < maxLookUp && newRotationX > maxLookDown) {
                camera.rotation.x = newRotationX;
            }
            
            camera.rotation.z = 0;
        });

        // Add keyboard controls for desktop users
        const keyState = {};
        document.addEventListener('keydown', (e) => {
            keyState[e.code] = true;
            if (e.code === 'Space' && state.grounded) {
                this.triggerJump(state, audioSystem);
            }
            if (e.code === 'KeyF') {
                this.triggerStrike(state, audioSystem);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keyState[e.code] = false;
        });

        // Setup jump button
        const jumpButton = document.getElementById('jumpButton');
        jumpButton.addEventListener('touchstart', () => this.triggerJump(state, audioSystem));
        jumpButton.addEventListener('mousedown', () => this.triggerJump(state, audioSystem));
        
        // Setup strike button
        const strikeButton = document.getElementById('strikeButton');
        strikeButton.addEventListener('touchstart', () => this.triggerStrike(state, audioSystem));
        strikeButton.addEventListener('mousedown', () => this.triggerStrike(state, audioSystem));
        
        // Process keyboard movement
        scene.registerBeforeRender(() => {
            // Handle keyboard movement for desktop
            let xMove = 0, zMove = 0;
            if (keyState['KeyW'] || keyState['ArrowUp']) zMove += 1;
            if (keyState['KeyS'] || keyState['ArrowDown']) zMove -= 1;
            if (keyState['KeyA'] || keyState['ArrowLeft']) xMove -= 1;
            if (keyState['KeyD'] || keyState['ArrowRight']) xMove += 1;
            
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
        if (state.striking) return;
        state.striking = true;
        state.strikeProgress = 0;
        if (audioSystem.loaded && audioSystem.loaded.strike) {
            audioSystem.sfx.strike.currentTime = 0;
            audioSystem.playSound(audioSystem.sfx.strike, 'strike');
        }
        document.getElementById('strikeButton').style.background = "rgba(255, 0, 255, 0.4)"; 
        setTimeout(() => document.getElementById('strikeButton').style.background = "rgba(255, 0, 255, 0.2)", 100);
    }
}; 