import * as THREE from 'three';

export class BrownianMotion {
  constructor() {
    this.initPhysicsProperties();
  }

  initPhysicsProperties() {
    /*
     * BROWNIAN MOTION PHYSICS PARAMETERS
     * 
     * Brownian motion is the random movement of particles suspended in a fluid (liquid or gas),
     * resulting from their bombardment by fast-moving atoms or molecules in the fluid.
     * 
     * The key physical parameters that determine Brownian motion are:
     * 1. Temperature - Higher temperature means more energetic molecular collisions
     * 2. Viscosity - Higher viscosity means more resistance to movement
     * 3. Particle size - Smaller particles exhibit more pronounced Brownian motion
     */
    
    // Realistic size scales for cellular components
    // Round bacteria are around 1 micrometer in diameter
    // The average human cell is around 20 micrometers in diameter
    // The average virus particle is around 0.1 micrometers in diameter
    // The average protein is around 7-10 nanometers in diameter (0.01 micrometers)
    
    // Physical constants and environmental parameters
    const temperatureKelvin = 310; // Body temperature in Kelvin (37°C)
    const waterViscosity = 0.0008; // Water viscosity in Pa·s at body temperature
    const cytoplasmViscosity = 6 * waterViscosity; // Cytoplasm is more viscous than water (about 5.5 times)
    
    // Boltzmann constant (k_B) relates temperature to energy
    // Units: J/K (Joules per Kelvin)
    const boltzmannConstant = 1.38e-23; 
    
    // Particle radii (We need to convert these to meters for the Stokes-Einstein equation)
    this.proteinRadius = 0.006; // 6 nanometers in radius. 12 nanometers in diameter 
    this.viralRadius = 0.05;    // 50 nanometers in radius (0.05 micrometers)
    this.bacteriaRadius = 0.5;  // 500 nanometers in radius (0.5 micrometers)

    /*
     * STOKES-EINSTEIN RELATION
     * 
     * The diffusion coefficient (D) is calculated using the Stokes-Einstein equation:
     * D = k_B·T / (6πηr)
     * 
     * Where:
     * - k_B is Boltzmann's constant (1.38e-23 J/K)
     * - T is temperature in Kelvin
     * - η (eta) is the fluid viscosity in Pa·s
     * - r is the particle radius in meters
     * 
     * This equation shows that:
     * 1. Diffusion increases with temperature (more thermal energy)
     * 2. Diffusion decreases with viscosity (more resistance)
     * 3. Diffusion decreases with particle size (larger particles move less)
     */
    this.diffusionCoefficientProtein = boltzmannConstant * temperatureKelvin / (6 * Math.PI * cytoplasmViscosity * this.proteinRadius*(1/1e6));
    this.diffusionCoefficientVirus = boltzmannConstant * temperatureKelvin / (6 * Math.PI * waterViscosity * this.viralRadius*(1/1e6));
    this.diffusionCoefficientBacteria = boltzmannConstant * temperatureKelvin / (6 * Math.PI * waterViscosity * this.bacteriaRadius*(1/1e6));
    
    /*
     * TIME STEP IN BROWNIAN MOTION
     * 
     * In the context of the Stokes-Einstein and Einstein-Smoluchowski equations,
     * the time step must have units of seconds (s) to maintain dimensional consistency.
     * 
     * Since the diffusion coefficient D has units of m²/s (square meters per second),
     * and we use it in the equation: SD = √(2·D·Δt)
     * 
     * For SD to have units of meters (m), the time step Δt must have units of seconds (s).
     * 
     * The value 10 here represents 10 seconds in the simulation.
     * This is a relatively large time step chosen for visualization purposes.
     * In a more precise simulation, a smaller time step would be used.
     */
    this.timeStep = 0.0001; // seconds

    /*
     * EINSTEIN-SMOLUCHOWSKI EQUATION
     * 
     * The mean squared displacement (MSD) of a particle undergoing Brownian motion is:
     * MSD = 2·D·t (in 1D) or MSD = 4·D·t (in 2D) or MSD = 6·D·t (in 3D)
     * 
     * For a single step in a random walk, the standard deviation (σ) of displacement is:
     * σ = √(2·D·Δt) for each dimension
     * 
     * This means the displacement in each direction follows a normal distribution with:
     * - Mean = 0 (random motion has no preferred direction)
     * - Standard deviation = √(2·D·Δt)
     */
    // Calculate standard deviations based on the Einstein-Smoluchowski equation
    this.proteinSD = Math.sqrt(2 * this.diffusionCoefficientProtein * this.timeStep);
    this.virusSD = Math.sqrt(2 * this.diffusionCoefficientVirus * this.timeStep);
    this.bacteriaSD = Math.sqrt(2 * this.diffusionCoefficientBacteria * this.timeStep);

    // Convert standard deviations from meters to micrometers and then to the scale of the scene
    this.proteinSD *= 1e6 /0.641;
    this.virusSD *= 1e6 /0.641;
    this.bacteriaSD *= 1e6 /0.641;
  }

  /*
   * BOX-MULLER TRANSFORM FOR GAUSSIAN RANDOM NUMBERS
   * 
   * Brownian motion requires normally distributed random displacements.
   * The Box-Muller transform converts uniform random numbers to normally distributed ones.
   * 
   * Theory:
   * If u1 and u2 are uniform random numbers in (0,1), then:
   * z0 = sqrt(-2·ln(u1))·cos(2π·u2)
   * z1 = sqrt(-2·ln(u1))·sin(2π·u2)
   * 
   * z0 and z1 are independent random variables with standard normal distribution.
   * 
   * This implementation uses a polar form of the Box-Muller transform which is more
   * computationally efficient and avoids trigonometric functions.
   */
  normalPolar(mean = 0, sd = 1) {
    let u1, u2, s;

    // Generate two uniform random numbers in the range (-1, 1) until they lie inside the unit circle
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

    // Scale by the desired standard deviation and shift by the mean
    return [mean + z0 * sd, mean + z1 * sd];
  }
  

  /*
   * BROWNIAN MOTION IMPLEMENTATION
   * 
   * This function simulates the random walk characteristic of Brownian motion.
   * Key theoretical aspects:
   * 
   * 1. Each step is independent of previous steps (Markov process)
   * 2. Displacements follow a normal distribution with mean 0
   * 3. The standard deviation of displacement is determined by:
   *    - Diffusion coefficient (from Stokes-Einstein)
   *    - Time step
   * 
   * In 3D space, we apply random displacements in all three dimensions.
   * Boundary conditions are applied to keep particles within realistic regions.
   * 
   * Parameters:
   * - sd: Standard deviation of displacement (calculated from diffusion coefficient)
   * - molecules: Array of particles to move
   * - minRadius/maxRadius: Boundary constraints (e.g., cell membrane)
   * - minZ/minY: Additional boundary constraints if needed
   */
  applyBrownianMotion(sd, molecules, minRadius, maxRadius, minZ, minY) {
    molecules.forEach(molecule => {
      // Generate normally distributed random displacements for X and Y coordinates
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
      if (molecule.position.length() < minRadius) {
        molecule.position.setLength(minRadius);
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