export class TouchHandler {
  constructor(wholeSceneGroup, particleSystem, arController, simulationTimeStep, onTimeStepChange, pause,unpause,isPaused, 
    mode, reset

  ) {
    this.wholeSceneGroup = wholeSceneGroup;
    this.particleSystem = particleSystem;
    this.rotatableGroup = particleSystem.rotatableGroup;
    this.arController = arController;
    this.simulationTimeStep = simulationTimeStep;
    this.onTimeStepChange = onTimeStepChange; // Callback for time step changes
    this.pause = pause; // Callback for pause events
    this.unpause = unpause; // Callback for unpause events
    this.isPaused = isPaused; // Function to check if simulation is paused
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isARMode = false;
    this.modelPlaced = false;
    this.mode = mode;
    this.restartSimulation = reset;

    // Tap gesture detection properties
    this.tapStartTime = 0;
    this.tapThreshold = 200; // Maximum duration for a tap (ms)
    this.longTapThreshold = 500; // Minimum duration for a long tap (ms)
    this.tapMovementThreshold = 5; // Maximum movement for a tap (pixels)
    this.hasMoved = false;
    
    // Gesture state tracking
    this.currentGesture = null; // 'single', 'pinch', 'three-finger', null
    this.gestureStartTime = 0;
    this.pinchCooldownTime = 0;
    this.pinchCooldownDuration = 300; // ms to wait after pinch before allowing taps
    
    // Scaling properties
    this.initialPinchDistance = 0;
    this.initialScale = 0.01;
    this.currentScale = 0.01;

    
    this.setupTouchInteraction();
  }

  setARMode(isARMode) {
    this.isARMode = isARMode;
  }

  setModelPlaced(modelPlaced) {
    this.modelPlaced = modelPlaced;
  }

  // Helper method to calculate distance between two touch points
  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  setupTouchInteraction() {
    // Touch events for rotating and scaling the model in AR mode
    document.addEventListener('touchstart', (event) => {
      if (event.touches.length > 0) {
        const currentTime = performance.now();
        
        if (this.isARMode && this.modelPlaced && event.touches.length === 1) {
          // Only start single touch gesture if we're not in cooldown from a recent pinch
          if (currentTime - this.pinchCooldownTime > this.pinchCooldownDuration) {
            // Single touch - prepare for rotation or tap detection
            this.currentGesture = 'single';
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
            this.tapStartTime = currentTime;
            this.gestureStartTime = currentTime;
            this.hasMoved = false;
          }
        } else if (this.isARMode && this.modelPlaced && event.touches.length === 2) {
          // Two touches - prepare for scaling
          this.currentGesture = 'pinch';
          this.gestureStartTime = currentTime;
          this.initialPinchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
          this.initialScale = this.currentScale;
        }
        else if (event.touches.length === 3) {
          // Three touches - prepare for speed control
          this.currentGesture = 'three-finger';
          this.gestureStartTime = currentTime;
          this.touchStartY = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
        }
      }
    });
    
    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 0) {
        // Prevent default to avoid scrolling the page
        
        // Single touch for rotation
        if (this.isARMode && this.modelPlaced && event.touches.length === 1 && this.currentGesture === 'single') {
          const touchX = event.touches[0].clientX;
          const touchY = event.touches[0].clientY;
          
          // Calculate the movement from start position
          const deltaX = touchX - this.touchStartX;
          const deltaY = touchY - this.touchStartY;
          const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Check if movement exceeds tap threshold
          if (totalMovement > this.tapMovementThreshold) {
            this.hasMoved = true;
            
        
              
            if (this.rotatableGroup && (this.mode === "atp" || this.mode === "cell" || this.mode === "nucleus")) {
              this.wholeSceneGroup.rotation.y += deltaX * 0.005;
            }

            // Update the starting position for continuous rotation
            this.touchStartX = touchX;
            this.touchStartY = touchY;
          }
        }
        // Two touches for scaling (pinch-to-zoom)
        else if (this.isARMode && this.modelPlaced && event.touches.length === 2 && this.currentGesture === 'pinch') {
          const currentPinchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
          
          // Calculate scale factor based on distance change
          const scaleChange = currentPinchDistance / this.initialPinchDistance;
          this.currentScale = this.initialScale + (scaleChange - 1) * 0.01;
          if (this.currentScale <= 0) {
            this.currentScale = 0; // Prevent scaling to negative values
          }
          if (this.currentScale > 0.006) {
            // Hide the huge helper grid
            this.wholeSceneGroup.gridHelperHuge.visible = false;
            this.wholeSceneGroup.gridHelperHugeFine.visible = false;
            this.wholeSceneGroup.hugeLabels.forEach(label => label.visible = false);
          } else {
            // Show the huge helper grid
            this.wholeSceneGroup.gridHelperHuge.visible = true;
            this.wholeSceneGroup.gridHelperHugeFine.visible = true;
            this.wholeSceneGroup.hugeLabels.forEach(label => label.visible = true);
          }
          
    
          // Apply the scale to the cell group
          this.wholeSceneGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);
          this.wholeSceneGroup.position.setFromMatrixPosition(this.arController.reticle.matrix);
          this.wholeSceneGroup.position.y += 15 * this.currentScale;

          
        }
        // Three touches for speed control
        else if (event.touches.length === 3 && this.currentGesture === 'three-finger') {
          const currentY = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
          const deltaY = currentY - this.touchStartY;
          const threshold = 5; // Minimum movement to consider
          
          if (Math.abs(deltaY) > threshold) {
            let newTimeStep = this.simulationTimeStep;
            
            if (deltaY > 0) {
              // Swipe down - slow down simulation (decrease time step)
              newTimeStep = this.simulationTimeStep * 0.99;
            } else {
              // Swipe up - speed up simulation (increase time step)
              newTimeStep = this.simulationTimeStep * 1.01;
            }
            
            
              this.simulationTimeStep = newTimeStep;
              
              // Notify CellViewer of the change
              if (this.onTimeStepChange) {
                this.onTimeStepChange(newTimeStep);
              }
            
            
            this.touchStartY = currentY;
          }
        }
    }
    }, { passive: false });
    
    // Touch end event for tap detection
    document.addEventListener('touchend', (event) => {

        if (event.changedTouches.length > 0 && ( this.mode === "atp" || this.mode === "nucleus" )) {
        // Check if this was a single finger tap
        if (event.changedTouches.length === 1 && event.touches.length === 0) {
          const tapDuration = performance.now() - this.tapStartTime;

          // If touch was long enough and didn't move much, consider it a long tap
          if (tapDuration >= this.longTapThreshold && !this.hasMoved) {
            
            this.restartSimulation();
            
          }
        }
      }





      if (this.isARMode && this.modelPlaced && event.changedTouches.length > 0) {
        const currentTime = performance.now();
        
        // Handle end of pinch gesture
        if (this.currentGesture === 'pinch' && event.touches.length < 2) {
          this.pinchCooldownTime = currentTime;
          this.currentGesture = null;
          return; // Exit early to prevent any tap detection
        }
        
        // Handle end of three-finger gesture
        if (this.currentGesture === 'three-finger' && event.touches.length < 3) {
          this.currentGesture = null;
          return; // Exit early
        }
        
        // Handle single touch gestures (tap and long tap)
        if (this.currentGesture === 'single' && event.touches.length === 0 && 
            (this.mode === "atp" || this.mode === "nucleus" || this.mode === "cell")) {
          
          const tapDuration = currentTime - this.tapStartTime;
          
          // Long tap for restart (only if gesture was consistently single touch)
          if (tapDuration >= this.longTapThreshold && !this.hasMoved) {
            this.restartSimulation();
          }
          // Short tap for pause/unpause (only if gesture was consistently single touch)
          else if (tapDuration <= this.tapThreshold && !this.hasMoved) {
            if (this.isPaused()) {
              this.unpause();
            } else {
              this.pause();
            }
          }
          
          this.currentGesture = null;
        }
      }



    });
   
  }
}