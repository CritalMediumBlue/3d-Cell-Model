export class TouchHandler {
  constructor(cellGroup) {
    this.cellGroup = cellGroup;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isARMode = false;
    this.modelPlaced = false;
    
    this.setupTouchInteraction();
  }

  setARMode(isARMode) {
    this.isARMode = isARMode;
  }

  setModelPlaced(modelPlaced) {
    this.modelPlaced = modelPlaced;
  }
  
  setupTouchInteraction() {
    // Touch events for rotating and scaling the model in AR mode
    document.addEventListener('touchstart', (event) => {
      if (this.isARMode && this.modelPlaced && event.touches.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
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
      }
    }, { passive: false });
  }
}