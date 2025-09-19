class World {
  constructor(size = 50) {
    this.size = size; // Daha küçük harita - 50x35
    this.width = 50;
    this.height = 35;
    this.grid = this.initializeGrid();
    this.characters = new Map();
    this.timeOfDay = 'day';
    this.lastUpdate = Date.now();

    this.terrainTypes = {
      grass: { walkable: true, resource: 'food', color: '#4CAF50' },
      mountain: { walkable: false, resource: 'stone', color: '#795548' },
      water: { walkable: false, resource: 'water', color: '#2196F3' },
      forest: { walkable: true, resource: 'wood', color: '#388E3C' },
      house: { walkable: true, shelter: true, color: '#FFC107' },
      farmland: { walkable: true, resource: 'crops', color: '#8BC34A' }
    };
  }

  initializeGrid() {
    const grid = [];
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        grid[x][y] = this.generateTerrain(x, y);
      }
    }
    return grid;
  }

  generateTerrain(x, y) {
    const rand = Math.random();

    // Kenar bölgeler - daha az dağ, daha çok geçilebilir alanlar
    if (x < 3 || y < 3 || x >= this.width - 3 || y >= this.height - 3) {
      return rand < 0.4 ? 'mountain' : (rand < 0.7 ? 'forest' : 'grass');
    }

    // Ana geçiş yolları - yatay ve dikey koridorlar
    const isMainPath = (x === Math.floor(this.width / 2)) || (y === Math.floor(this.height / 2));
    const isSecondaryPath = (x === Math.floor(this.width / 4)) || (x === Math.floor(3 * this.width / 4)) ||
                           (y === Math.floor(this.height / 4)) || (y === Math.floor(3 * this.height / 4));

    if (isMainPath || isSecondaryPath) {
      // Ana yollarda geçilebilir araziler
      if (rand < 0.4) return 'grass';
      if (rand < 0.7) return 'forest';
      if (rand < 0.8) return 'farmland';
      return 'grass';
    }

    // Su kaynakları biraz daha çok ama yine nadir - %5
    if (rand < 0.05) return 'water';

    // Gıda kaynakları - farmland %8, grass %25
    if (rand < 0.08) return 'farmland';
    if (rand < 0.33) return 'grass';

    // Barınaklar - %6
    if (rand < 0.39) return 'house';

    // Orman alanları - geçilebilir
    if (rand < 0.75) return 'forest';

    // Dağlar daha az - %25
    return 'mountain';
  }

  addCharacter(character) {
    this.characters.set(character.id, character);
  }

  removeCharacter(characterId) {
    this.characters.delete(characterId);
  }

  getCharacter(characterId) {
    return this.characters.get(characterId);
  }

  getAllCharacters() {
    return Array.from(this.characters.values());
  }

  getTerrainAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[x][y];
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    const terrain = this.getTerrainAt(x, y);
    return terrain && this.terrainTypes[terrain].walkable;
  }

  getCharactersNear(x, y, radius = 2) {
    return this.getAllCharacters().filter(character => {
      const distance = Math.sqrt(
        Math.pow(character.position.x - x, 2) +
        Math.pow(character.position.y - y, 2)
      );
      return distance <= radius;
    });
  }

  moveCharacter(characterId, newX, newY) {
    const character = this.getCharacter(characterId);
    if (!character) return false;

    if (this.isWalkable(newX, newY)) {
      character.moveTo(newX, newY);
      return true;
    }
    return false;
  }

  update(deltaTime) {
    this.getAllCharacters().forEach(character => {
      character.updateNeeds(deltaTime);
    });

    const hoursPassed = deltaTime / (1000 * 60 * 60);
    if (hoursPassed > 12) {
      this.timeOfDay = this.timeOfDay === 'day' ? 'night' : 'day';
    }

    this.lastUpdate = Date.now();
  }

  getWorldState() {
    return {
      size: this.size,
      width: this.width,
      height: this.height,
      grid: this.grid,
      timeOfDay: this.timeOfDay,
      characters: this.getAllCharacters().map(char => char.toJSON()),
      terrainTypes: this.terrainTypes,
      lastUpdate: this.lastUpdate
    };
  }

  toJSON() {
    return {
      size: this.size,
      width: this.width,
      height: this.height,
      grid: this.grid,
      timeOfDay: this.timeOfDay,
      characters: Object.fromEntries(this.characters),
      lastUpdate: this.lastUpdate
    };
  }
}

module.exports = World;