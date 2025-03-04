// Test script for coordinate display
(function() {
    // Check if CoordinateSystem exists
    if (!window.CoordinateSystem) {
        console.error("CoordinateSystem not found! Cannot run test.");
        return;
    }
    
    // Create a dummy camera object for testing
    const dummyCamera = {
        position: { x: 0, y: 1, z: 0 },
        rotation: { y: 0 }
    };
    
    // Test state
    let testInterval = null;
    let testActive = false;
    
    // Create test button
    const testButton = document.createElement('button');
    testButton.id = 'testCoordButton';
    testButton.innerText = 'Test Coordinates';
    
    // Add test button to document
    document.body.appendChild(testButton);
    
    // Add click event to test button
    testButton.addEventListener('click', function() {
        toggleCoordinateTest();
    });
    
    // Toggle the coordinate test on/off
    function toggleCoordinateTest() {
        if (testActive) {
            // Stop the test
            clearInterval(testInterval);
            testButton.innerText = 'Test Coordinates';
            testButton.style.backgroundColor = '#ff00cc';
            testActive = false;
            return;
        }
        
        // Start the test
        testActive = true;
        testButton.innerText = 'Stop Test (SIMULATED)';
        testButton.style.backgroundColor = '#ff5500';
        
        // Reset dummy camera
        dummyCamera.position.x = 0;
        dummyCamera.position.z = 0;
        dummyCamera.rotation.y = 0;
        
        // Update with initial position
        CoordinateSystem.updatePosition(
            dummyCamera.position,
            dummyCamera.rotation.y
        );
        
        // Update position every 100ms to simulate movement
        testInterval = setInterval(function() {
            // Move in a circle
            const time = Date.now() / 1000;
            dummyCamera.position.x = Math.sin(time) * 30; // -30 to +30
            dummyCamera.position.z = Math.cos(time) * 30; // -30 to +30
            dummyCamera.rotation.y = time % (Math.PI * 2);
            
            // Update coordinate display
            CoordinateSystem.updatePosition(
                dummyCamera.position,
                dummyCamera.rotation.y
            );
        }, 100);
    }
})(); 