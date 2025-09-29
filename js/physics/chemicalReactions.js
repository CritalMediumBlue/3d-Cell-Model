export class ChemicalReactions {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
       
        this.cellSize = 1; // micrometers
        this.cellGridCargoProteins = new Map(); // Spatial partitioning grid
        this.cellGridTransportins = new Map(); // Spatial partitioning grid
        this.boundPairsCount = 0; // Count of bound pairs
    }

  

    // Method to completely remove a particle and clean up all references
    removeParticle(particle, particleArray) {
        if (!this.particleSystem) {
            console.warn('ParticleSystem reference not set. Cannot perform complete cleanup.');
            return;
        }

        // Remove from THREE.js scene
        this.particleSystem.rotatableGroup.remove(particle);

        // Dispose particle geometry and material
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();

        // Remove from particle array
        const index = particleArray.indexOf(particle);
        if (index > -1) {
            particleArray.splice(index, 1);
        }
    }

    getCellKey(x, y, z) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellY},${cellZ}`;
    }

    buildGrid(cargoProteins, transportins)  {
        this.cellGridCargoProteins = new Map();
        this.cellGridTransportins = new Map();

        // Add each point to the appropriate cell
        cargoProteins.forEach(cargo => {
            const key = this.getCellKey(cargo.position.x, cargo.position.y, cargo.position.z);

            if (!this.cellGridCargoProteins.has(key)) {
                this.cellGridCargoProteins.set(key, []);
            }

            this.cellGridCargoProteins.get(key).push(cargo);
        });

        transportins.forEach(transportin => {
            const key = this.getCellKey(transportin.position.x, transportin.position.y, transportin.position.z);

            if (!this.cellGridTransportins.has(key)) {
                this.cellGridTransportins.set(key, []);
            }

            this.cellGridTransportins.get(key).push(transportin);
        });
    }
    //if particles are in the same grid cell, they will "bind". Once they bind, both particles will be completely removed from the simulation and a new particle will be created.
    bindParticles(cargoProteins, transportins) {
        this.buildGrid(cargoProteins, transportins);

        const particlesToRemove = []; // Track particles to remove

        // Check each cell for potential bindings
        this.cellGridCargoProteins.forEach((cargoList, key) => {
            const transportinList = this.cellGridTransportins.get(key);
            if (transportinList) {
                // If there are both cargo proteins and transportins in the same cell, bind them
                const minLength = Math.min(cargoList.length, transportinList.length);
                for (let i = 0; i < minLength; i++) {
                    const cargo = cargoList[i];
                    const transportin = transportinList[i];
                    if (!cargo.bound && !transportin.bound) {
                        this.boundPairsCount++;
                        transportin.bound = true; // Mark as bound
                        cargo.bound = true; // Mark as bound
                        console.log(`Bound pair #${this.boundPairsCount} at cell ${key}`);
                        
                        // Add to removal list instead of hiding
                        particlesToRemove.push({particle: cargo, array: cargoProteins});
                        particlesToRemove.push({particle: transportin, array: transportins});
                        //add new particle with bigger size and different color (green)
                        const x = cargo.position.x;
                        const y = cargo.position.y;
                        const z = cargo.position.z;
                        this.particleSystem.createParticles( 0.005, 4, 0x00ff00, 1, this.particleSystem.proteins, 7.7/4, 7.7, x,y,z); // Proteins

                    }
                }
            }
        });

        // Remove all bound particles completely
        particlesToRemove.forEach(({particle, array}) => {
            this.removeParticle(particle, array);
        });
    }
        

}