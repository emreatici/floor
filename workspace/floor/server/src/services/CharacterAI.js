const { v4: uuidv4 } = require('uuid');

class CharacterAI {
  constructor(ollamaService, memoryManager, gameServer = null) {
    this.ollama = ollamaService;
    this.memory = memoryManager;
    this.gameServer = gameServer;
    this.lastActivityCheck = new Map();
    this.conversationCooldown = new Map();
  }

  async updateCharacter(character, world) {
    try {
      const now = Date.now();
      const lastCheck = this.lastActivityCheck.get(character.id) || 0;

      // Daha sık güncelleme (5 saniye)
      if (now - lastCheck < 5000) return;

      character.updateNeeds(now - character.lastUpdate);

      const context = this.buildContext(character, world);
      const decision = await this.makeDecision(character, context);

      console.log(`${character.name} decision:`, decision);
      await this.executeDecision(character, decision, world);

      this.lastActivityCheck.set(character.id, now);

    } catch (error) {
      console.error(`Character AI error for ${character.name}:`, error);
      // Hata durumunda basit hareket yap
      await this.wander(character, world);
    }
  }

  buildContext(character, world) {
    const nearbyCharacters = world.getCharactersNear(
      character.position.x,
      character.position.y,
      3
    ).filter(c => c.id !== character.id);

    const terrain = world.getTerrainAt(character.position.x, character.position.y);

    return {
      position: character.position,
      terrain,
      nearbyCharacters,
      timeOfDay: world.timeOfDay,
      priorityNeed: character.getPriorityNeed(),
      world: world
    };
  }

  async makeDecision(character, context) {
    const [needName, needValue] = context.priorityNeed;

    // Konuşma sırasında hareket etme
    if (character.isInConversation) {
      return {
        type: 'wait',
        reason: `${character.conversationTarget ? character.conversationTarget + ' ile konuşuyor' : 'Konuşma halinde'}`
      };
    }

    // Karakterin kişiliğine göre davranış eğilimi
    const personality = character.personality.traits;
    const isActive = personality.includes('meraklı') || personality.includes('cesur');
    const isSocial = personality.includes('sosyal');
    const isCautious = personality.includes('temkinli');

    // Daha agresif kritik durum eşiği
    if (needValue < 30) {
      return this.getUrgentAction(needName, context);
    }

    // Sosyalleşme kontrolü - daha aktif
    if (context.nearbyCharacters.length > 0) {
      const lastConversation = this.conversationCooldown.get(character.id) || 0;
      const timeSinceLastChat = Date.now() - lastConversation;

      // Sosyal ihtiyaca göre konuşma şansı
      let chatChance = 0;
      if (character.needs.social < 30) chatChance = 0.8; // %80 şans
      else if (character.needs.social < 50) chatChance = 0.5; // %50 şans
      else if (character.needs.social < 70) chatChance = 0.2; // %20 şans

      // Sosyal karakterler daha sık konuşur
      if (isSocial) chatChance += 0.3;

      // En az 5 saniye bekleme (daha sık konuşma)
      if (timeSinceLastChat > 5000 && Math.random() < chatChance) {
        return {
          type: 'socialize',
          target: context.nearbyCharacters[0],
          reason: `Sosyallik: ${Math.round(character.needs.social)}/100 - Konuşmak istiyor`
        };
      }
    }

    // Sosyal ihtiyaç yüksekse başka karakterlere doğru hareket et - daha agresif
    if (character.needs.social < 60) {
      const allCharacters = context.world ? context.world.getAllCharacters() : [];
      const otherCharacters = allCharacters.filter(c => c.id !== character.id && !c.isInConversation);

      if (otherCharacters.length > 0) {
        // En yakın karakteri bul
        const nearestCharacter = this.findNearestCharacter(character.position, otherCharacters);
        if (nearestCharacter) {
          const distance = this.calculateDistance(character.position, nearestCharacter.position);

          // Sosyal ihtiyaca göre mesafe toleransı
          const maxDistance = character.needs.social < 30 ? 8 : (character.needs.social < 45 ? 5 : 3);

          if (distance > maxDistance) {
            return {
              type: 'seek_social',
              target: nearestCharacter,
              reason: `${nearestCharacter.name}'e yaklaşmak istiyor (sosyal: ${Math.round(character.needs.social)})`
            };
          }
        }
      }
    }

    // Kişiliğe göre eylem seçimi
    const actions = ['wait']; // Her karakter beklemeyi tercih edebilir

    // Aktif karakterler daha çok hareket eder
    if (isActive) {
      actions.push('explore', 'wander', 'explore'); // Çoğaltarak şansını artır
    } else {
      actions.push('wait', 'wait'); // Daha çok bekle
    }

    // İhtiyaç durumuna göre - daha proaktif
    if (needValue < 60) {
      const urgency = (60 - needValue) / 60; // 0-1 arası aciliyet

      if (needName === 'hunger' && Math.random() < urgency + 0.3) {
        actions.push('seek_food', 'seek_food'); // Çoğaltarak şansını artır
      }
      if (needName === 'thirst' && Math.random() < urgency + 0.3) {
        actions.push('seek_water', 'seek_water');
      }
      if (needName === 'energy' && Math.random() < urgency + 0.2) {
        actions.push('rest', 'rest');
      }
      if (needName === 'social' && Math.random() < urgency + 0.4) {
        // Sosyal arayışını artır
        const allCharacters = context.world ? context.world.getAllCharacters() : [];
        const availableCharacters = allCharacters.filter(c => c.id !== character.id && !c.isInConversation);
        if (availableCharacters.length > 0) {
          actions.push('seek_social', 'seek_social', 'seek_social');
        }
      }
    }

    // Temkinli karakterler daha az hareket eder
    if (isCautious) {
      actions.push('wait', 'wait', 'wait');
    }

    const selectedAction = actions[Math.floor(Math.random() * actions.length)];

    return {
      type: selectedAction,
      reason: this.getReasonForAction(character, selectedAction, needName, needValue)
    };
  }

  getReasonForAction(character, action, needName, needValue) {
    const reasons = {
      'wait': [
        `${character.name} kendini rahat hissediyor`,
        `Durmayı tercih ediyor`,
        `Çevreyi gözlemliyor`,
        `Dinleniyor`,
        `Düşünüyor`
      ],
      'explore': [
        `Meraklı bir ruh hali`,
        `Keşfetmek istiyor`,
        `Yeni yerler arıyor`,
        `Macera peşinde`
      ],
      'wander': [
        `Biraz gezinmek istiyor`,
        `Rastgele dolaşıyor`,
        `Hafif aktivite`,
        `Çevreye bakıyor`
      ],
      'seek_food': [`Açlık hissi ${Math.round(needValue)}/100`],
      'seek_water': [`Susuzluk hissi ${Math.round(needValue)}/100`],
      'rest': [`Yorgunluk hissi ${Math.round(needValue)}/100`]
    };

    const actionReasons = reasons[action] || [`${action} yapıyor`];
    return actionReasons[Math.floor(Math.random() * actionReasons.length)];
  }

  getUrgentAction(needName, context) {
    if (needName === 'social') {
      // Sosyal acil durum - önce yakındaki karakterleri kontrol et
      if (context.nearbyCharacters.length > 0) {
        return { type: 'socialize', target: context.nearbyCharacters[0], reason: 'Çok yalnız - acil sosyalleşme' };
      } else {
        // Yakında kimse yoksa en yakın karakteri bul
        const allCharacters = context.world ? context.world.getAllCharacters() : [];
        const availableCharacters = allCharacters.filter(c => c.id !== context.character?.id && !c.isInConversation);
        if (availableCharacters.length > 0) {
          const nearest = this.findNearestCharacter(context.position || { x: 50, y: 50 }, availableCharacters);
          return { type: 'seek_social', target: nearest, reason: 'Çok yalnız - birine yaklaşmalı' };
        }
      }
    }

    const urgentActions = {
      hunger: { type: 'seek_food', reason: 'Çok aç' },
      thirst: { type: 'seek_water', reason: 'Çok susuz' },
      energy: { type: 'rest', reason: 'Çok yorgun' },
      social: { type: 'explore', reason: 'Yalnız - birilerini arıyor' }
    };

    return urgentActions[needName] || { type: 'wander', reason: 'Belirsiz ihtiyaç' };
  }

  getAvailableActivities(context) {
    const activities = ['bekle', 'keşfet'];

    if (context.terrain === 'water') activities.push('su içmek');
    if (context.terrain === 'grass' || context.terrain === 'farmland') activities.push('yemek aramak');
    if (context.terrain === 'house') activities.push('dinlenmek');
    if (context.nearbyCharacters.length > 0) activities.push('konuşmak');

    return activities;
  }

  parseAIDecision(aiResponse, context) {
    const response = aiResponse.toLowerCase();

    if (response.includes('1') || response.includes('yemek')) {
      return { type: 'seek_food', reason: 'Yemek arayışı' };
    }
    if (response.includes('2') || response.includes('su')) {
      return { type: 'seek_water', reason: 'Su arayışı' };
    }
    if (response.includes('3') || response.includes('dinlen')) {
      return { type: 'rest', reason: 'Dinlenme' };
    }
    if (response.includes('4') || response.includes('sosyal')) {
      return {
        type: 'socialize',
        target: context.nearbyCharacters[0],
        reason: 'Sosyalleşme'
      };
    }
    if (response.includes('5') || response.includes('keşfet')) {
      return { type: 'explore', reason: 'Keşif' };
    }

    return { type: 'wait', reason: 'Bekle' };
  }

  getRandomAction(context) {
    const actions = ['wander', 'wait', 'explore'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    return { type: randomAction, reason: 'Rastgele eylem' };
  }

  async executeDecision(character, decision, world) {
    character.currentActivity = decision.reason;

    switch (decision.type) {
      case 'seek_food':
        await this.seekResource(character, world, 'food');
        break;

      case 'seek_water':
        await this.seekResource(character, world, 'water');
        break;

      case 'rest':
        await this.rest(character, world);
        break;

      case 'socialize':
        if (decision.target) {
          await this.initiateSocial(character, decision.target, world);
        }
        break;

      case 'seek_social':
        if (decision.target) {
          await this.moveTowardsCharacter(character, decision.target, world);

          // Hedefe yaklaştığında otomatik konuşma başlat
          const distance = this.calculateDistance(character.position, decision.target.position);
          if (distance <= 3 && !character.isInConversation && !decision.target.isInConversation) {
            const cooldownTime = this.conversationCooldown.get(character.id) || 0;
            if (Date.now() - cooldownTime > 3000) { // 3 saniye cooldown
              console.log(`🎯 ${character.name} ${decision.target.name}'e ulaştı, konuşma başlatıyor...`);
              await this.initiateSocial(character, decision.target, world);
            }
          }
        }
        break;

      case 'explore':
        await this.explore(character, world);
        break;

      case 'wander':
        await this.wander(character, world);
        break;

      case 'wait':
        break;

      default:
        await this.wander(character, world);
    }

    await this.memory.saveEvent(
      character.id,
      'action',
      `${character.name} ${decision.reason}`,
      character.position
    );
  }

  async seekResource(character, world, resourceType) {
    const targetTerrains = {
      food: ['grass', 'farmland'],
      water: ['water'],
      shelter: ['house']
    };

    const targets = targetTerrains[resourceType];

    // Önce bilinen kaynakları kontrol et
    const knownResource = character.getNearestKnownResource(resourceType);
    if (knownResource) {
      console.log(`${character.name} bilinen ${resourceType} kaynağına gidiyor: (${knownResource.x}, ${knownResource.y})`);
      await this.moveTowardsLocation(character, knownResource, world);
      return;
    }

    // Bilinmiyorsa keşfet
    const nearbyResource = this.findNearbyTerrain(character.position, world, targets);

    if (nearbyResource && Math.random() > 0.3) { // %70 şansla gitme
      const moved = world.moveCharacter(character.id, nearbyResource.x, nearbyResource.y);
      if (moved) {
        // Kaynak konumunu hafızaya kaydet
        character.rememberResourceLocation(resourceType, nearbyResource.x, nearbyResource.y, 'good');
        console.log(`🏅 ${character.name} yeni ${resourceType} kaynağı keşfetti: (${nearbyResource.x}, ${nearbyResource.y})`);

        if (Math.random() > 0.5) { // %50 şansla ihtiyaç karşılama
          const needMap = { food: 'hunger', water: 'thirst' };
          const needName = needMap[resourceType];
          if (needName) {
            const satisfaction = Math.random() * 40 + 20; // 20-60 arası artış
            character.needs[needName] = Math.min(100, character.needs[needName] + satisfaction);
            character.addMemory('event', `${resourceType} buldu ve biraz rahatlattı`, 5);
          }
        }
      }
    } else {
      // Kaynak bulunmadı veya gitmek istemedi
      if (Math.random() > 0.5) {
        await this.wander(character, world);
      }
      // Bazen hiçbir şey yapmayabilir
    }
  }

  async rest(character, world) {
    const currentTerrain = world.getTerrainAt(character.position.x, character.position.y);

    // Dinlenme miktarı terrain'e göre değişir
    let restAmount = 15; // Varsayılan
    if (currentTerrain === 'house') {
      restAmount = 35; // Evde daha iyi dinlenme
    } else if (currentTerrain === 'grass') {
      restAmount = 25; // Çimende rahat
    }

    // Rastgele faktör ekle
    restAmount += Math.random() * 15 - 5; // ±5 rastgelelik

    character.needs.energy = Math.min(100, character.needs.energy + restAmount);
    character.addMemory('event', `${currentTerrain} arazisinde dinlendi`, 3);
  }

  async initiateSocial(character, target, world) {
    try {
      console.log(`🗣️ ${character.name} (sosyal: ${Math.round(character.needs.social)}) konuşmaya başlıyor with ${target.name} (sosyal: ${Math.round(target.needs.social)})`);

      // Konuşma durumunu ayarla
      character.isInConversation = true;
      target.isInConversation = true;
      character.conversationTarget = target.name;
      target.conversationTarget = character.name;

      // Konuşma oturumu oluştur
      let conversationId = null;
      if (this.gameServer) {
        conversationId = this.gameServer.createConversation([character.id, target.id]);
      }

      // Çok turlu konuşma başlat (3-5 mesaj arası)
      const conversationLength = Math.floor(Math.random() * 3) + 3; // 3-5 mesaj
      let currentSpeaker = character;
      let currentListener = target;
      let conversationMessages = []; // Konuşma geçmişini takip et

      console.log(`📝 ${conversationLength} turlu konuşma başlıyor`);

      for (let turn = 0; turn < conversationLength; turn++) {
        const context = turn === 0
          ? `${character.name} ile ${target.name} karşılaştı ve konuşmaya başladı`
          : `${currentSpeaker.name} ile ${currentListener.name} sohbet ediyor`;

        const memories = await this.memory.getRelevantMemories(currentSpeaker.id, context);

        const response = await this.ollama.generateCharacterResponse(
          currentSpeaker,
          currentListener,
          context,
          memories,
          conversationMessages // Konuşma geçmişini gönder
        );

        console.log(`💬 ${currentSpeaker.name}: "${response}"`);

        // Mesajı conversation geçmişine ekle
        const message = {
          speaker: currentSpeaker.id,
          content: response,
          timestamp: Date.now(),
          type: 'character'
        };
        conversationMessages.push(message);

        // UI'ye mesaj gönder
        if (this.gameServer && conversationId) {
          this.gameServer.addMessageToConversation(conversationId, message);
        }

        // Sosyal ihtiyaçları az artır (her mesaj için 5 puan)
        currentSpeaker.needs.social = Math.min(100, currentSpeaker.needs.social + 5);
        currentListener.needs.social = Math.min(100, currentListener.needs.social + 5);

        // Anıları daha detaylı kaydet
        currentSpeaker.addMemory('conversation', `${currentListener.name} ile sohbet etti: "${response}"`, 6);
        currentListener.addMemory('conversation', `${currentSpeaker.name}: "${response}" dedi`, 5);

        // Paylaşılan kaynak bilgilerini analiz et ve hafızaya kaydet
        await this.extractAndShareResourceInfo(currentSpeaker, currentListener, response);

        // Konuşmacıları değiştir (karşılıklı konuşma)
        [currentSpeaker, currentListener] = [currentListener, currentSpeaker];

        // Mesajlar arası kısa bekleme
        if (turn < conversationLength - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.conversationCooldown.set(character.id, Date.now());
      this.conversationCooldown.set(target.id, Date.now());

      // Konuşma durumunu sıfırla
      character.isInConversation = false;
      target.isInConversation = false;
      character.conversationTarget = null;
      target.conversationTarget = null;

      console.log(`✅ ${conversationLength} turlu konuşma tamamlandı. ${character.name} sosyal: ${Math.round(character.needs.social)}, ${target.name} sosyal: ${Math.round(target.needs.social)}`);

    } catch (error) {
      console.error('Social interaction error:', error);
      // Basit etkileşim yap
      character.needs.social = Math.min(100, character.needs.social + 3);
      target.needs.social = Math.min(100, target.needs.social + 3);
      character.addMemory('event', `${target.name} ile kısa bir etkileşim`, 3);

      this.conversationCooldown.set(character.id, Date.now());
      this.conversationCooldown.set(target.id, Date.now());

      // Hata durumunda da konuşma durumunu sıfırla
      character.isInConversation = false;
      target.isInConversation = false;
      character.conversationTarget = null;
      target.conversationTarget = null;
    }
  }

  async explore(character, world) {
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 1, dy: 1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: -1 }
    ];

    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    const newX = character.position.x + randomDir.dx * 2;
    const newY = character.position.y + randomDir.dy * 2;

    if (world.moveCharacter(character.id, newX, newY)) {
      const terrain = world.getTerrainAt(newX, newY);
      character.addMemory('observation', `${terrain} arazisini keşfetti`, 5);
    }
  }

  async wander(character, world) {
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    const newX = character.position.x + randomDir.dx;
    const newY = character.position.y + randomDir.dy;

    world.moveCharacter(character.id, newX, newY);
  }

  findNearbyTerrain(position, world, terrainTypes, radius = 5) {
    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const x = position.x + dx;
            const y = position.y + dy;
            const terrain = world.getTerrainAt(x, y);

            if (terrain && terrainTypes.includes(terrain) && world.isWalkable(x, y)) {
              return { x, y, terrain };
            }
          }
        }
      }
    }
    return null;
  }

  findNearestCharacter(position, characters) {
    if (characters.length === 0) return null;

    let nearest = characters[0];
    let minDistance = this.calculateDistance(position, nearest.position);

    for (let i = 1; i < characters.length; i++) {
      const distance = this.calculateDistance(position, characters[i].position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = characters[i];
      }
    }

    return nearest;
  }

  calculateDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
  }

  async moveTowardsCharacter(character, target, world) {
    const dx = target.position.x - character.position.x;
    const dy = target.position.y - character.position.y;

    // Hedef yönünde hareket et (normalize edilmiş)
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return;

    const moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);

    const newX = character.position.x + moveX;
    const newY = character.position.y + moveY;

    if (world.moveCharacter(character.id, newX, newY)) {
      character.addMemory('movement', `${target.name}'e doğru hareket etti`, 3);
    }
  }

  async moveTowardsLocation(character, location, world) {
    const dx = location.x - character.position.x;
    const dy = location.y - character.position.y;

    // Hedefe ulaştı mı?
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      console.log(`${character.name} hedef konuma ulaştı: (${location.x}, ${location.y})`);
      return true;
    }

    // Hedef yönünde hareket et
    const moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);

    const newX = character.position.x + moveX;
    const newY = character.position.y + moveY;

    if (world.moveCharacter(character.id, newX, newY)) {
      character.addMemory('movement', `${location.type} kaynağına doğru hareket etti`, 3);
      return false;
    }
    return false;
  }

  async extractAndShareResourceInfo(speaker, listener, message) {
    try {
      // Basit regex pattern'lar ile koordinat arayışı
      const coordinatePattern = /\((\d+),\s*(\d+)\)/g;
      const coordinates = [...message.matchAll(coordinatePattern)];

      // Su/gıda/barınak anahtar kelimeleri
      const resourceKeywords = {
        'water': ['su', 'water', 'çeşme', 'göl', 'nehir'],
        'food': ['gıda', 'yemek', 'food', 'çiftlik', 'farmland', 'grass'],
        'shelter': ['barınak', 'ev', 'house', 'sığınak', 'korunma']
      };

      for (const [x, y] of coordinates.map(m => [parseInt(m[1]), parseInt(m[2])])) {
        // Hangi kaynak türünden bahsediliyor?
        let resourceType = null;
        for (const [type, keywords] of Object.entries(resourceKeywords)) {
          if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
            resourceType = type;
            break;
          }
        }

        if (resourceType) {
          // Dinleyici bu bilgiyi öğrensin
          listener.learnFromOther(speaker.name, {
            resourceType,
            location: { x, y },
            quality: 'shared',
            content: `${speaker.name} (${x}, ${y}) koordinatında ${resourceType} kaynağı olduğunu söyledi`
          });

          console.log(`📢 ${speaker.name}, ${listener.name}'e ${resourceType} kaynağı paylaştı: (${x}, ${y})`);
        }
      }

      // Genel bilgi paylaşımı (koordinat olmadan)
      if (message.toLowerCase().includes('biliyorum') || message.toLowerCase().includes('buldum')) {
        listener.learnFromOther(speaker.name, {
          content: message,
          type: 'general_info'
        });
      }

    } catch (error) {
      console.error('Resource info extraction error:', error);
    }
  }
}

module.exports = CharacterAI;