// Test script for coordinate display
(function() {
    // Check if CoordinateSystem exists
    if (!window.CoordinateSystem) {
        console.error("CoordinateSystem not found! Cannot run test.");
        return;
    }
    
    console.log("Starting coordinate display test...");
    
    // Create a dummy camera object
    const dummyCamera = {
        position: { x: 0, y: 1, z: 0 },
        rotation: { y: 0 }
    };
    
    // Create test button
    const testButton = document.createElement('button');
    testButton.id = 'testCoordButton';
    testButton.innerText = 'Test Coordinates';
    testButton.style.position = 'fixed';
    testButton.style.right = '20px';
    testButton.style.bottom = '20px';
    testButton.style.padding = '10px';
    testButton.style.backgroundColor = '#ff00cc';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    testButton.style.zIndex = 10000;
    
    // Add test button to document
    document.body.appendChild(testButton);
    
    // Add click event to test button
    testButton.addEventListener('click', function() {
        console.log("Testing coordinate updates...");
        startCoordinateTest();
    });
    
    let testInterval = null;
    let testActive = false;
    
    // Start the test
    function startCoordinateTest() {
        if (testActive) {
            clearInterval(testInterval);
            testButton.innerText = 'Test Coordinates';
            testActive = false;
            console.log("Coordinate test stopped");
            return;
        }
        
        testActive = true;
        testButton.innerText = 'Stop Test';
        console.log("Coordinate test started");
        
        // Reset dummy camera
        dummyCamera.position.x = 0;
        dummyCamera.position.z = 0;
        dummyCamera.rotation.y = 0;
        
        // Directly update coordinates with dummy camera
        window.CoordinateSystem.updatePosition(
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
            
            // Log position
            console.log(`Test camera: x=${dummyCamera.position.x.toFixed(2)}, z=${dummyCamera.position.z.toFixed(2)}`);
            
            // Update coordinate display
            window.CoordinateSystem.updatePosition(
                dummyCamera.position,
                dummyCamera.rotation.y
            );
        }, 100);
    }
})(); 