export class TouchHandler {
  constructor(wholeSceneGroup, rotatableGroup, arController, simulationTimeStep, onTimeStepChange, onPause, mode, atpMoleculesToCenter) {
    this.wholeSceneGroup = wholeSceneGroup;
    this.rotatableGroup = rotatableGroup;
    this.arController = arController;
    this.simulationTimeStep = simulationTimeStep;
    this.onTimeStepChange = onTimeStepChange; // Callback for time step changes
    this.onPause = onPause; // Callback for pause events
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isARMode = false;
    this.modelPlaced = false;
    this.mode = mode;
    this.atpMoleculesToCenter = atpMoleculesToCenter;

    // Tap gesture detection properties
    this.tapStartTime = 0;
    this.tapThreshold = 200; // Maximum duration for a tap (ms)
    this.tapMovementThreshold = 10; // Maximum movement for a tap (pixels)
    this.hasMoved = false;
    
    // Click detection properties for non-AR mode
    this.clickStartTime = 0;
    this.clickStartX = 0;
    this.clickStartY = 0;
    this.hasClickMoved = false;
    
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
      if (this.isARMode && this.modelPlaced && event.touches.length > 0) {
        if (event.touches.length === 1) {
          // Single touch - prepare for rotation or tap detection
          this.touchStartX = event.touches[0].clientX;
          this.touchStartY = event.touches[0].clientY;
          this.tapStartTime = performance.now();
          this.hasMoved = false;
        } else if (event.touches.length === 2) {
          // Two touches - prepare for scaling
          this.initialPinchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
          this.initialScale = this.currentScale;
        }
        else if (event.touches.length === 3) {
          // Three touches - prepare for speed control
          this.touchStartY = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
        }
      }
    });
    
    document.addEventListener('touchmove', (event) => {
      if (this.isARMode && this.modelPlaced && event.touches.length > 0) {
        // Prevent default to avoid scrolling the page
        event.preventDefault();
        
        // Single touch for rotation
        if (event.touches.length === 1) {
          const touchX = event.touches[0].clientX;
          const touchY = event.touches[0].clientY;
          
          // Calculate the movement from start position
          const deltaX = touchX - this.touchStartX;
          const deltaY = touchY - this.touchStartY;
          const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Check if movement exceeds tap threshold
          if (totalMovement > this.tapMovementThreshold) {
            this.hasMoved = true;
            
            // Apply rotation only if moved significantly
            if (this.rotatableGroup && (this.mode === "cell" || this.mode === "nucleus")) {
              this.wholeSceneGroup.rotation.y += deltaX * 0.005;
              this.rotatableGroup.rotation.x += deltaY * 0.005;
            } else if (this.rotatableGroup && this.mode === "atp") {
              this.wholeSceneGroup.rotation.y += deltaX * 0.005;
            }

            // Update the starting position for continuous rotation
            this.touchStartX = touchX;
            this.touchStartY = touchY;
          }
        }
        // Two touches for scaling (pinch-to-zoom)
        else if (event.touches.length === 2) {
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
        else if (event.touches.length === 3) {
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
      if (this.isARMode && this.modelPlaced && event.changedTouches.length > 0) {
        // Check if this was a single finger tap
        if (event.changedTouches.length === 1 && event.touches.length === 0) {
          const tapDuration = performance.now() - this.tapStartTime;
          
          // If touch was short enough and didn't move much, consider it a tap
          if (tapDuration <= this.tapThreshold && !this.hasMoved) {
            // Call the pause callback
            if (this.onPause) {
              this.onPause();
            }
          }
        }
      }
        if (this.isARMode && this.modelPlaced && event.changedTouches.length > 0 && this.mode === "atp") {
        // Check if this was a single finger tap
        if (event.changedTouches.length === 1 && event.touches.length === 0) {
          const tapDuration = performance.now() - this.tapStartTime;
          
          // If touch was short enough and didn't move much, consider it a tap
          if (tapDuration <= this.tapThreshold && !this.hasMoved) {
            // Call the pause callback
            if (this.onPause) {
              this.atpMoleculesToCenter();
            }
          }
        }
      }
    });
   
  }
}