import { CellViewer } from './cellViewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Create start button
  const startButton = document.createElement('button');
  startButton.textContent = 'Cell model';
  startButton.style.position = 'fixed';
  startButton.style.top = '20px';
  startButton.style.left = '20px';
  startButton.style.padding = '15px 20px';
  startButton.style.fontSize = '16px';
  startButton.style.fontWeight = 'bold';
  startButton.style.backgroundColor = '#4CAF50';
  startButton.style.color = 'white';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  startButton.style.cursor = 'pointer';
  startButton.style.zIndex = '1000';
  
  // Add hover effect
  startButton.addEventListener('mouseenter', () => {
    startButton.style.backgroundColor = '#45a049';
  });
  
  startButton.addEventListener('mouseleave', () => {
    startButton.style.backgroundColor = '#4CAF50';
  });
  
  // Add click event to start the simulation
  startButton.addEventListener('click', () => {
    new CellViewer();
    startButton.remove(); // Remove the button after starting
  });
  
  document.body.appendChild(startButton);
});