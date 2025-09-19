const { v4: uuidv4 } = require('uuid');

class Character {
  constructor(name, personality = {}) {
    this.id = uuidv4();
    this.name = name;
    this.age = Math.floor(Math.random() * 30) + 18;

    this.personality = {
      traits: personality.traits || this.generateRandomTraits(),
      interests: personality.interests || this.generateRandomInterests(),
      fears: personality.fears || this.generateRandomFears(),
      goals: personality.goals || this.generateRandomGoals()
    };

    this.needs = {
      hunger: Math.floor(Math.random() * 40) + 60,
      thirst: Math.floor(Math.random() * 40) + 60,
      energy: Math.floor(Math.random() * 40) + 60,
      social: Math.floor(Math.random() * 30) + 20  // 20-50 arası düşük sosyallik
    };

    this.position = { x: 50, y: 50 };
    this.currentActivity = 'wandering';
    this.isInConversation = false;
    this.conversationTarget = null;

    this.memories = {
      shortTerm: [],
      longTerm: {
        important: [],
        traumatic: [],
        relationships: new Map(),
        resourceLocations: new Map(), // Su/gıda/barınak konumları
        sharedInformation: [], // Başkalarından öğrendikleri
        discoveries: [] // Kendi keşiftikleri
      }
    };

    this.inventory = [];
    this.lastUpdate = Date.now();
  }

  generateRandomTraits() {
    const traits = ['meraklı', 'sosyal', 'temkinli', 'cesur', 'yaratık', 'pratik', 'duygusal', 'mantıklı'];
    return this.selectRandom(traits, 3);
  }

  generateRandomInterests() {
    const interests = ['keşif', 'sanat', 'teknoloji', 'doğa', 'müzik', 'yemek', 'spor', 'okuma'];
    return this.selectRandom(interests, 2);
  }

  generateRandomFears() {
    const fears = ['karanlık', 'yalnızlık', 'yükseklik', 'su', 'bilinmeyen'];
    return this.selectRandom(fears, 1);
  }

  generateRandomGoals() {
    const goals = ['arkadaş edinme', 'keşif yapma', 'yaratıcı olma', 'bilgi toplama', 'güvenli alan bulma'];
    return this.selectRandom(goals, 2);
  }

  selectRandom(array, count) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  updateNeeds(deltaTime) {
    const hoursPassed = deltaTime / (1000 * 60 * 60);

    this.needs.hunger = Math.max(0, this.needs.hunger - (hoursPassed * 2));
    this.needs.thirst = Math.max(0, this.needs.thirst - (hoursPassed * 3));
    this.needs.energy = Math.max(0, this.needs.energy - (hoursPassed * 1.5));
    this.needs.social = Math.max(0, this.needs.social - (hoursPassed * 2.5)); // Daha hızlı azalır

    this.lastUpdate = Date.now();
  }

  addMemory(type, content, importance = 5) {
    const memory = {
      id: uuidv4(),
      type,
      content,
      importance,
      timestamp: Date.now()
    };

    if (importance > 7) {
      this.memories.longTerm.important.push(memory);
    } else {
      this.memories.shortTerm.push(memory);
      if (this.memories.shortTerm.length > 10) {
        this.memories.shortTerm.shift();
      }
    }
  }

  getPriorityNeed() {
    const needs = Object.entries(this.needs);
    needs.sort((a, b) => a[1] - b[1]);
    return needs[0];
  }

  moveTo(x, y) {
    this.position.x = Math.max(0, Math.min(49, x));
    this.position.y = Math.max(0, Math.min(34, y));
  }

  // Kaynak konumu hafızaya kaydet
  rememberResourceLocation(resourceType, x, y, quality = 'good') {
    const locationKey = `${x},${y}`;
    this.memories.longTerm.resourceLocations.set(locationKey, {
      type: resourceType,
      x,
      y,
      quality,
      discoveredAt: Date.now(),
      timesVisited: 1
    });

    this.memories.longTerm.discoveries.push({
      type: 'resource_discovery',
      content: `${resourceType} kaynağı buldu (${x}, ${y})`,
      location: { x, y },
      resourceType,
      timestamp: Date.now()
    });
  }

  // Başkasından öğrenilen bilgi
  learnFromOther(source, information) {
    this.memories.longTerm.sharedInformation.push({
      source,
      information,
      timestamp: Date.now(),
      importance: 8
    });

    // Eğer kaynak konumu bilgisiyse, hafızaya ekle
    if (information.resourceType && information.location) {
      const locationKey = `${information.location.x},${information.location.y}`;
      this.memories.longTerm.resourceLocations.set(locationKey, {
        type: information.resourceType,
        x: information.location.x,
        y: information.location.y,
        quality: information.quality || 'unknown',
        discoveredAt: Date.now(),
        source: source,
        timesVisited: 0
      });
    }
  }

  // Bilinen kaynakları listele
  getKnownResources(resourceType = null) {
    const resources = Array.from(this.memories.longTerm.resourceLocations.values());
    return resourceType ? resources.filter(r => r.type === resourceType) : resources;
  }

  // En yakın bilinen kaynağı bul
  getNearestKnownResource(resourceType) {
    const resources = this.getKnownResources(resourceType);
    if (resources.length === 0) return null;

    let nearest = resources[0];
    let minDistance = Math.sqrt(
      Math.pow(nearest.x - this.position.x, 2) + Math.pow(nearest.y - this.position.y, 2)
    );

    for (const resource of resources) {
      const distance = Math.sqrt(
        Math.pow(resource.x - this.position.x, 2) + Math.pow(resource.y - this.position.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = resource;
      }
    }

    return nearest;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      age: this.age,
      personality: this.personality,
      needs: this.needs,
      position: this.position,
      currentActivity: this.currentActivity,
      isInConversation: this.isInConversation,
      conversationTarget: this.conversationTarget,
      memories: {
        shortTerm: this.memories.shortTerm,
        longTerm: {
          important: this.memories.longTerm.important,
          traumatic: this.memories.longTerm.traumatic,
          relationships: Object.fromEntries(this.memories.longTerm.relationships),
          resourceLocations: Object.fromEntries(this.memories.longTerm.resourceLocations),
          sharedInformation: this.memories.longTerm.sharedInformation,
          discoveries: this.memories.longTerm.discoveries
        }
      },
      inventory: this.inventory,
      lastUpdate: this.lastUpdate
    };
  }
}

module.exports = Character;