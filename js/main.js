import { CellViewer } from './cellViewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Create start button
  const startCellModel = document.createElement('button');
  startCellModel.textContent = 'Cell model';
  startCellModel.style.position = 'fixed';
  startCellModel.style.top = '20px';
  startCellModel.style.left = '20px';
  startCellModel.style.padding = '15px 20px';
  startCellModel.style.fontSize = '16px';
  startCellModel.style.fontWeight = 'bold';
  startCellModel.style.backgroundColor = '#4CAF50';
  startCellModel.style.color = 'white';
  startCellModel.style.border = 'none';
  startCellModel.style.borderRadius = '5px';
  startCellModel.style.cursor = 'pointer';
  startCellModel.style.zIndex = '1000';
  
  // Add hover effect
  startCellModel.addEventListener('mouseenter', () => {
    startCellModel.style.backgroundColor = '#45a049';
  });
  
  startCellModel.addEventListener('mouseleave', () => {
    startCellModel.style.backgroundColor = '#4CAF50';
  });
  
  // Add click event to start the simulation
  startCellModel.addEventListener('click', () => {
    new CellViewer('cell');
    startCellModel.remove(); // Remove the button after starting
    startATPsimulation.remove(); // Remove the button after starting
  });

    // Create start button
  const startATPsimulation = document.createElement('button');
  startATPsimulation.textContent = 'ATP molecules';
  startATPsimulation.style.position = 'fixed';
  startATPsimulation.style.top = '20px';
  startATPsimulation.style.left = '200px';
  startATPsimulation.style.padding = '15px 20px';
  startATPsimulation.style.fontSize = '16px';
  startATPsimulation.style.fontWeight = 'bold';
  startATPsimulation.style.backgroundColor = '#4CAF50';
  startATPsimulation.style.color = 'white';
  startATPsimulation.style.border = 'none';
  startATPsimulation.style.borderRadius = '5px';
  startATPsimulation.style.cursor = 'pointer';
  startATPsimulation.style.zIndex = '1000';
  
  // Add hover effect
  startATPsimulation.addEventListener('mouseenter', () => {
    startATPsimulation.style.backgroundColor = '#45a049';
  });
  
  startATPsimulation.addEventListener('mouseleave', () => {
    startATPsimulation.style.backgroundColor = '#4CAF50';
  });
  
  // Add click event to start the simulation
  startATPsimulation.addEventListener('click', () => {
    new CellViewer('atp');
    startATPsimulation.remove(); // Remove the button after starting
    startCellModel.remove(); // Remove the button after starting
  });
  
  document.body.appendChild(startCellModel);
  document.body.appendChild(startATPsimulation);
});