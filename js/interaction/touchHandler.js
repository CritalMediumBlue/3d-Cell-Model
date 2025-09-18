export class TouchHandler {
  constructor(wholeSceneGroup, rotatableGroup, arController, simulationTimeStep) {
    this.wholeSceneGroup = wholeSceneGroup;
    this.rotatableGroup = rotatableGroup;
    this.arController = arController;
    this.simulationTimeStep = simulationTimeStep;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isARMode = false;
    this.modelPlaced = false;

    
    // Scaling properties
    this.initialPinchDistance = 0;
    this.initialScale = 0.1;
    this.currentScale = 0.1;

    
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
          // Single touch - prepare for rotation
          this.touchStartX = event.touches[0].clientX;
          this.touchStartY = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
          // Two touches - prepare for scaling
          this.initialPinchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
          this.initialScale = this.currentScale;
        }
        else if (event.touches.length === 3) {
          // Three touches - prepare for speed control (not implemented)
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
          
          // Calculate the rotation based on horizontal movement
          const deltaX = touchX - this.touchStartX;
          const deltaY = touchY - this.touchStartY;
          
          
          if (this.rotatableGroup) {
            this.wholeSceneGroup.rotation.y += deltaX * 0.005;
            this.rotatableGroup.rotation.x += deltaY * 0.005;
          }

          // Update the starting position
          this.touchStartX = touchX;
          this.touchStartY = touchY;
        }
        // Two touches for scaling (pinch-to-zoom)
        else if (event.touches.length === 2) {
          const currentPinchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
          
          // Calculate scale factor based on distance change
          const scaleChange = currentPinchDistance / this.initialPinchDistance;
          this.currentScale = this.initialScale + (scaleChange - 1) * 0.05;
          if (this.currentScale <= 0.001) {
            this.currentScale = 0.001; // Prevent scaling to zero or negative
          }
          
    
          // Apply the scale to the cell group
          this.wholeSceneGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);
          this.wholeSceneGroup.position.setFromMatrixPosition(this.arController.reticle.matrix);
          this.wholeSceneGroup.position.y += 7.7 * this.currentScale;
        }
        // Three touches for speed control (not implemented)
        else if (event.touches.length === 3) {
          const currentY = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
          const deltaY = currentY - this.touchStartY;
          const threshold = 3; // Minimum movement to consider
          
          if (deltaY > threshold) {
            // Speed up simulation
            this.simulationTimeStep *= 1.05; // Increase speed by 5%
          } else if (deltaY < -threshold) {
            // Slow down simulation
            this.simulationTimeStep /= 1.05; // Decrease speed by 5%
          }
          
          this.touchStartY = currentY;
      }
    }
    }, { passive: false });
  }
}