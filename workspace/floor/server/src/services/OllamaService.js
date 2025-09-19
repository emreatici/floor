const axios = require('axios');

class OllamaService {
  constructor(baseURL = 'http://localhost:11434', model = 'oss') {
    this.baseURL = baseURL;
    this.model = model;
    this.isConnected = false;
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      this.isConnected = true;
      console.log('Ollama connection successful');
      return response.data;
    } catch (error) {
      this.isConnected = false;
      console.error('Ollama connection failed:', error.message);
      throw error;
    }
  }

  async generateResponse(prompt, options = {}) {
    if (!this.isConnected) {
      await this.testConnection();
    }

    const requestData = {
      model: this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.8,
        max_tokens: options.max_tokens || 150,
        top_p: options.top_p || 0.9,
        ...options
      }
    };

    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, requestData, {
        timeout: 30000
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama generation error:', error.message);
      throw error;
    }
  }

  async generateCharacterResponse(speaker, listener, context, memories = [], conversationHistory = []) {
    const memoryContext = memories.length > 0
      ? `\n\nÖnemli anılar:\n${memories.map(m => `- ${m.content || m.summary}`).join('\n')}`
      : '';

    const needsText = Object.entries(speaker.needs)
      .map(([need, value]) => `${this.translateNeed(need)}: ${Math.round(value)}/100`)
      .join(', ');

    // Konuşma geçmişini oluştur
    const conversationContext = conversationHistory.length > 0
      ? `\n\nKONUŞMA GEÇMİŞİ:\n${conversationHistory.map(msg =>
          `${msg.speaker === speaker.id ? 'Sen' : listener.name}: "${msg.content}"`
        ).join('\n')}`
      : '';

    // Dinleyici hakkında bilgi
    const listenerInfo = listener ? `\n\nKONUŞMA PARTNERIN ${listener.name}:
- Yaş: ${listener.age}
- Kişilik: ${listener.personality.traits.join(', ')}
- İlgi alanları: ${listener.personality.interests.join(', ')}
- İhtiyaçları: ${Object.entries(listener.needs)
  .map(([need, value]) => `${this.translateNeed(need)}: ${Math.round(value)}/100`)
  .join(', ')}` : '';

    // Bilinen kaynaklar
    const knownResources = speaker.getKnownResources();
    const resourceInfo = knownResources.length > 0 ? `\n\nBİLDİĞİN KAYNAK KONUMLARI:
${knownResources.map(r =>
  `- ${r.type} kaynağı (${r.x}, ${r.y}) ${r.source ? `- ${r.source}'den öğrendin` : '- Sen keşfettin'}`
).join('\n')}` : '\nHenüz kaynak konumu bilmiyorsun.';

    // Paylaşılan bilgiler
    const sharedInfo = speaker.memories.longTerm.sharedInformation.length > 0 ?
      `\n\nBAŞKALARINDAN ÖĞRENDİKLERİN:\n${speaker.memories.longTerm.sharedInformation.slice(-3).map(info =>
        `- ${info.source}: ${info.information.content || JSON.stringify(info.information)}`
      ).join('\n')}` : '';

    const prompt = `Sen ${speaker.name} isimli bir karaktersin.

KARAKTER BİLGİLERİN:
- Yaş: ${speaker.age}
- Kişilik: ${speaker.personality.traits.join(', ')}
- İlgi alanları: ${speaker.personality.interests.join(', ')}
- Korkuları: ${speaker.personality.fears.join(', ')}
- Hedefleri: ${speaker.personality.goals.join(', ')}
- Mevcut ihtiyaçların: ${needsText}${listenerInfo}${conversationContext}

MEVCUT DURUM:
- Konum: (${speaker.position.x}, ${speaker.position.y})
- ${context}${memoryContext}${resourceInfo}${sharedInfo}

KONUŞMA TALİMATLARI:
${conversationHistory.length === 0 ?
  `- Bu konuşmayı sen başlatıyorsun, sıcak bir selamlama yap
- Kendini tanıt ve ${listener ? listener.name : 'karşındaki kişi'} hakkında sorular sor` :
  `- ${listener.name}'in son sözüne DOĞRUDAN cevap ver
- Onun dediğini referans al ve konuyu geliştir
- Karşılıklı etkileşim kur`}

- Kişiliğine uygun konuş (${speaker.personality.traits.join(', ')})
- İlgi alanlarından bahset: ${speaker.personality.interests.join(', ')}
- Çevreyi, gördüklerini, hissettiklerini anlat
- ${listener ? listener.name : 'Karşındaki kişi'} hakkında merak ettiklerini sor
- KAYNAK PAYLAŞIMI: Eğer bildiğin su/gıda/barınak konumu varsa ve ${listener ? listener.name : 'karşındaki'} ihtiyacı varsa, konumu paylaş
- ${listener ? listener.name : 'Karşındaki'}'ın ihtiyaçlarını sor ve yardım teklif et
- Eğer bir kaynağa ihtiyacın varsa, konumunu biliyor mu diye sor
- Sadece ihtiyaçlardan değil, hayatından, rüyalarından, planlarından bahset
- HAYATTa KALMA: Su ve gıda çok değerli, birbirinize yardım edin
- Doğal ve samimi ol, 2-3 cümle ile sınırla
- Türkçe konuş

${conversationHistory.length > 0 ? `\nSON SÖYLENEN: "${conversationHistory[conversationHistory.length - 1]?.content}"\nBuna nasıl cevap verirsin?` : ''}

Cevabın:`;

    return await this.generateResponse(prompt, {
      temperature: 0.9,
      max_tokens: 120
    });
  }

  async generateActivityDecision(character, nearbyCharacters = [], availableActivities = []) {
    const priorityNeed = character.getPriorityNeed();
    const needName = this.translateNeed(priorityNeed[0]);
    const needValue = priorityNeed[1];

    const nearbyText = nearbyCharacters.length > 0
      ? `\nYakınında: ${nearbyCharacters.map(c => c.name).join(', ')}`
      : '\nYakınında kimse yok';

    const activitiesText = availableActivities.length > 0
      ? `\nYapabileceğin aktiviteler: ${availableActivities.join(', ')}`
      : '';

    const prompt = `Sen ${character.name} isimli bir karaktersin.

DURUMUN:
- En düşük ihtiyacın: ${needName} (${needValue}/100)
- Konum: (${character.position.x}, ${character.position.y})
- Mevcut aktivite: ${character.currentActivity}${nearbyText}${activitiesText}

Kişiliğin: ${character.personality.traits.join(', ')}

Ne yapmak istiyorsun? Seçenekler:
1. Yemek ara (hunger için)
2. Su ara (thirst için)
3. Dinlen (energy için)
4. Sosyalleş (social için)
5. Keşfet
6. Bekle

Sadece seçeneğin numarasını ve kısa bir açıklama ver (örnek: "2 - Susuzluk çok yüksek, su bulmalıyım"):`;

    return await this.generateResponse(prompt, {
      temperature: 0.7,
      max_tokens: 50
    });
  }

  async extractConversationSummary(conversation) {
    const messagesText = conversation.messages
      .map(msg => `${msg.speaker}: ${msg.content}`)
      .join('\n');

    const prompt = `Aşağıdaki konuşmanın özetini çıkar:

${messagesText}

Çıktı formatı:
- Özet: [1-2 cümlelik kısa özet]
- Önemli noktalar: [ana konular, liste halinde]
- Duygusal yoğunluk: [1-10 arası sayı]
- İlişki değişimi: [pozitif/negatif/nötr]

Özet:`;

    return await this.generateResponse(prompt, {
      temperature: 0.5,
      max_tokens: 200
    });
  }

  translateNeed(need) {
    const translations = {
      hunger: 'açlık',
      thirst: 'susuzluk',
      energy: 'enerji',
      social: 'sosyallik'
    };
    return translations[need] || need;
  }

  async generateName() {
    const prompt = `Türk ismi öner. Sadece ismi yaz, başka bir şey yazma. Örnekler: Ahmet, Ayşe, Mehmet, Fatma, Ali, Zeynep`;

    return await this.generateResponse(prompt, {
      temperature: 0.9,
      max_tokens: 10
    });
  }
}

module.exports = OllamaService;