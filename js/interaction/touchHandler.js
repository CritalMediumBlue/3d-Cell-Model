export class TouchHandler {
  constructor(cellGroup, arController) {
    this.cellGroup = cellGroup;
    this.arController = arController;
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
          this.cellGroup.rotation.y += deltaX * 0.005;

          const deltaY = touchY - this.touchStartY;
          this.cellGroup.rotation.x += deltaY * 0.005;

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
          
    
          // Apply the scale to the cell group
          this.cellGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);
          this.cellGroup.position.setFromMatrixPosition(this.arController.reticle.matrix);
          this.cellGroup.position.y += 7.7 * this.currentScale;
        }
      }
    }, { passive: false });
  }
}