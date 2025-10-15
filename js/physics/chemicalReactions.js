export class ChemicalReactions {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
       
        this.cellSize = 1; // micrometers
        this.cellGridCargoProteins = new Map(); // Spatial partitioning grid
        this.cellGridTransportins = new Map(); // Spatial partitioning grid
        this.cellGridProteins = new Map(); // Spatial partitioning grid
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

        // Remove from trails if applicable
        if (this.particleSystem.particleTrails.has(particle)) {
            const trail = this.particleSystem.particleTrails.get(particle);
            this.particleSystem.removeTrail(trail);
            this.particleSystem.particleTrails.delete(particle);
        }
    }

    getCellKey(x, y, z) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellY},${cellZ}`;
    }

    buildGrid(cargoProteins, transportins, proteins)  {
        this.cellGridCargoProteins = new Map();
        this.cellGridTransportins = new Map();
        this.cellGridProteins = new Map();

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

        proteins.forEach(protein => {
            const key = this.getCellKey(protein.position.x, protein.position.y, protein.position.z);

            if (!this.cellGridProteins.has(key)) {
                this.cellGridProteins.set(key, []);
            }

            this.cellGridProteins.get(key).push(protein);
        });
    }
    //if particles are in the same grid cell, they will "bind". Once they bind, both particles will be completely removed from the simulation and a new particle will be created.
    bindParticles(cargoProteins, transportins, proteins) {
        this.buildGrid(cargoProteins, transportins, proteins);

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
                    const isCargoInsideNucleus = cargo.position.length() < 7.7/4;
                    if (!cargo.bound && !transportin.bound && !isCargoInsideNucleus) {
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

        // unbind the proteins that are inside the nucleus
        this.cellGridProteins.forEach((proteinList, key) => {
            for (let i = 0; i < proteinList.length; i++) {
                const protein = proteinList[i];
                const distanceFromOrigin = protein.position.length();
                if (distanceFromOrigin < 7.7/4) {
                    particlesToRemove.push({particle: protein, array: proteins});
               
                this.boundPairsCount--;

                const x = protein.position.x;
                const y = protein.position.y;
                const z = protein.position.z;
                this.particleSystem.createParticles( 0.005, 4, 0xffa500, 1, this.particleSystem.cargoProteins, 0, 7.7/4, x,y,z); 
                this.particleSystem.createParticles( 0.005, 4, 0x00ffff, 1, this.particleSystem.transportins, 0, 7.7/4, x,y,z);
                console.log(`Unbound protein at cell ${key}`);

                //remove protein from the simulation
                 }



            }
                
        });
            

        // Remove all bound particles completely
        particlesToRemove.forEach(({particle, array}) => {
            this.removeParticle(particle, array);
        });
    }

 
        

}