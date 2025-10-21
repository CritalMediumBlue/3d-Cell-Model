import { CellViewer } from './cellViewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Add mobile-friendly CSS
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .button-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 300px;
      width: 100%;
      padding: 30px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    
    .subtitle {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .cell-button {
      padding: 18px 24px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .cell-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      background: linear-gradient(45deg, #45a049, #4CAF50);
    }
    
    .cell-button:active {
      transform: translateY(0);
    }
    
    @media (max-width: 480px) {
      .button-container {
        margin: 10px;
        padding: 25px;
        max-width: calc(100vw - 40px);
      }
      
      .cell-button {
        padding: 16px 20px;
        font-size: 15px;
      }
      
      .title {
        font-size: 22px;
      }
    }
  `;
  document.head.appendChild(style);

  // Button configurations
  const buttonConfigs = [
    { text: 'Mikroskopische Bewegung', mode: 'cell' },
    { text: 'Signalmolekül-Explosion', mode: 'atp' },
    { text: 'Nukleartransport', mode: 'nucleus' },
  ];

  // Create main container
  const container = document.createElement('div');
  container.className = 'button-container';
  
  // Add title
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Diffusion - Bewegung auf kleinster Ebene'
  container.appendChild(title);
  
  // Add subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'subtitle';
  subtitle.textContent = 'Tippe auf ein Modell, um zu starten';
  container.appendChild(subtitle);

  const buttons = [];

  // Function to create a button with mobile-friendly styling
  function createButton(config) {
    const button = document.createElement('button');
    button.textContent = config.text;
    button.className = 'cell-button';

    // Add click event
    button.addEventListener('click', () => {
      new CellViewer(config.mode);
      removeContainer();
    });

    return button;
  }

  // Function to remove the container
  function removeContainer() {
    container.remove();
  }

  // Create and append all buttons
  buttonConfigs.forEach(config => {
    const button = createButton(config);
    buttons.push(button);
    container.appendChild(button);
  });
  
  // Add container to body
  document.body.appendChild(container);
});