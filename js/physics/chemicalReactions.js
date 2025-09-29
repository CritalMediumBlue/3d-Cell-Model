export class ChemicalReactions {
    constructor() {
       
        this.cellSize = 1; // micrometers
        this.cellGridCargoProteins = new Map(); // Spatial partitioning grid
        this.cellGridTransportins = new Map(); // Spatial partitioning grid
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
            const key = this.getCellKey(cargo.x, cargo.y, cargo.z);

            if (!this.cellGridCargoProteins.has(key)) {
                this.cellGridCargoProteins.set(key, []);
            }

            this.cellGridCargoProteins.get(key).push(cargo);
        });

        transportins.forEach(transportin => {
            const key = this.getCellKey(transportin.x, transportin.y, transportin.z);

            if (!this.cellGridTransportins.has(key)) {
                this.cellGridTransportins.set(key, []);
            }

            this.cellGridTransportins.get(key).push(transportin);
        });
    }

    bind
        

}