import { CellViewer } from './cellViewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Button configurations
  const buttonConfigs = [
    { text: 'Cell model', mode: 'cell', top: '20px' },
    { text: 'ATP molecules', mode: 'atp', top: '70px' },
    { text: 'Nucleus transport', mode: 'nucleus', top: '120px' },
  ];

  const buttons = [];

  // Function to create a button with consistent styling
  function createButton(config) {
    const button = document.createElement('button');
    button.textContent = config.text;
    
    // Apply consistent styling
    Object.assign(button.style, {
      position: 'fixed',
      top: config.top,
      left: '20px',
      padding: '15px 20px',
      fontSize: '16px',
      fontWeight: 'bold',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      zIndex: '1000'
    });

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#45a049';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#4CAF50';
    });

    // Add click event
    button.addEventListener('click', () => {
      new CellViewer(config.mode);
      removeAllButtons();
    });

    return button;
  }

  // Function to remove all buttons
  function removeAllButtons() {
    buttons.forEach(button => button.remove());
  }

  // Create and append all buttons
  buttonConfigs.forEach(config => {
    const button = createButton(config);
    buttons.push(button);
    document.body.appendChild(button);
  });
});