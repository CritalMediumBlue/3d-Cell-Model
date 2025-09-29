import * as THREE from 'three';

export class BrownianMotion {
  constructor(timeStep) {
    this.initPhysicsProperties(timeStep);
  }

  initPhysicsProperties(timeStep) {
    const temperatureCelsius = 20; // Room temperature in Celsius
    const temperatureKelvin = temperatureCelsius + 273.15; // Convert to Kelvin
    const waterViscosity = 0.001000; // Water viscosity in Pa·s at body temperature (0.691 mPa·s)
    const cytoplasmViscosity = 5 * waterViscosity; // Cytoplasm is more viscous than water (about 5 times)
    const plasmaViscosity = 1.8 * waterViscosity; // Blood plasma viscosity (about 1.2 times water)
    const boltzmannConstant = 1.380649e-23;  //J/K (Joules per Kelvin)
    
    this.proteinRadius = 0.005; // micrometers in radius
    this.viralRadius = 0.05;    // micrometers in radius
    this.bacteriaRadius = 0.5;  // micrometers in radius



    this.ATPRadius = 0.0007; // micrometers in radius (approx 0.7 nm)

    // Calculate diffusion coefficients using the Stokes-Einstein equation
    this.diffusionCoefficientProtein = boltzmannConstant * temperatureKelvin / (6 * Math.PI * cytoplasmViscosity * this.proteinRadius*(1/1e6)); // units: m²/s
    this.diffusionCoefficientVirus = boltzmannConstant * temperatureKelvin / (6 * Math.PI * plasmaViscosity * this.viralRadius*(1/1e6)); // units: m²/s
    this.diffusionCoefficientBacteria = boltzmannConstant * temperatureKelvin / (6 * Math.PI * plasmaViscosity * this.bacteriaRadius*(1/1e6)); // units: m²/s
    this.diffusionCoefficientATP = boltzmannConstant * temperatureKelvin / (6 * Math.PI * plasmaViscosity * this.ATPRadius*(1/1e6)); // units: m²/s

    console.log("Diffusion Coefficient Protein (m²/s): ", this.diffusionCoefficientProtein);
    console.log("Diffusion Coefficient Virus (m²/s): ", this.diffusionCoefficientVirus);
    console.log("Diffusion Coefficient Bacteria (m²/s): ", this.diffusionCoefficientBacteria);
    console.log("Diffusion Coefficient ATP (m²/s): ", this.diffusionCoefficientATP);
    this.timeStep = timeStep; // seconds

    // Calculate standard deviations based on the Einstein-Smoluchowski equation
    this.proteinSD = Math.sqrt(2 * this.diffusionCoefficientProtein * this.timeStep)*1e6 ; // units: micrometers
    this.virusSD = Math.sqrt(2 * this.diffusionCoefficientVirus * this.timeStep)*1e6 ; // units: micrometers
    this.bacteriaSD = Math.sqrt(2 * this.diffusionCoefficientBacteria * this.timeStep)*1e6 ; // units: micrometers
    this.ATPSD = Math.sqrt(2 * this.diffusionCoefficientATP * this.timeStep)*1e6 ; // units: micrometers

  }

  updatePhysicsProperties(timeStep=this.timeStep) {
    this.timeStep = timeStep;
    // Recalculate standard deviations based on the Einstein-Smoluchowski equation
    this.proteinSD = Math.sqrt(2 * this.diffusionCoefficientProtein * this.timeStep)*1e6 ; // units: micrometers
    this.virusSD = Math.sqrt(2 * this.diffusionCoefficientVirus * this.timeStep)*1e6 ; // units: micrometers
    this.bacteriaSD = Math.sqrt(2 * this.diffusionCoefficientBacteria * this.timeStep)*1e6 ; // units: micrometers
    this.ATPSD = Math.sqrt(2 * this.diffusionCoefficientATP * this.timeStep)*1e6 ; // units: micrometers
  }


  normalPolar(mean = 0, sd = 1) {
    let u1, u2, s;

    do {
      u1 = Math.random() * 2 - 1; // Random number in (-1, 1)
      u2 = Math.random() * 2 - 1; // Random number in (-1, 1)
      s = u1 * u1 + u2 * u2;      // Compute s = u1^2 + u2^2
    } while (s >= 1 || s === 0);  // Discard if outside the unit circle or s == 0

    // Compute the scaling factor using the polar form of Box-Muller transform
    const factor = Math.sqrt(-2.0 * Math.log(s) / s);

    // Generate two independent standard normal random variables
    const z0 = u1 * factor;
    const z1 = u2 * factor;

    return [mean + z0 * sd, mean + z1 * sd];
  }
  

  applyBrownianMotion(sd, molecules, minRadius, maxRadius, minZ, minY) {
    
    molecules.forEach(molecule => {
        
      const [deltaX, deltaY] = this.normalPolar(0, sd);
      
      // Generate normally distributed random displacement for Z coordinate
      const deltaZ = this.normalPolar(0, sd)[0];
      
      // Apply the random displacement to the particle position
      // This is the core of the random walk process
      molecule.position.add(new THREE.Vector3(
        deltaX, 
        deltaY,
        deltaZ
      ));
      
      // Apply boundary conditions to keep particles within realistic regions
      
      // Keep particles within maximum radius (e.g., cell boundary)
      if (molecule.position.length() > maxRadius) {
        molecule.position.setLength(maxRadius);
      }
      
      // Keep particles outside minimum radius (e.g., nucleus or other structures)
      if (molecule.position.length() < minRadius + this.bacteriaRadius) {
        molecule.position.setLength(minRadius+ this.bacteriaRadius);
      }
      
      // Additional boundary constraints if specified
      if (minZ !== undefined && molecule.position.z < minZ) {
        molecule.position.z = minZ;
      }
      
      if (minY !== undefined && molecule.position.y < minY) {
        molecule.position.y = minY;
      }
    });
  }
}