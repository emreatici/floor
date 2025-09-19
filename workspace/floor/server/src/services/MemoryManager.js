const { v4: uuidv4 } = require('uuid');

class MemoryManager {
  constructor(database, ollamaService) {
    this.database = database;
    this.ollama = ollamaService;
  }

  async saveMemory(characterId, type, content, importance = 5) {
    const memory = {
      id: uuidv4(),
      character_id: characterId,
      type,
      content,
      summary: null,
      importance,
      created_at: new Date().toISOString()
    };

    if (content.length > 200) {
      memory.summary = await this.generateSummary(content);
    }

    await this.database.saveMemory(memory);
    return memory;
  }

  async generateSummary(content) {
    try {
      const prompt = `Bu metni 1-2 cümleyle özetle:

${content}

Özet:`;

      return await this.ollama.generateResponse(prompt, {
        temperature: 0.5,
        max_tokens: 100
      });
    } catch (error) {
      console.error('Summary generation error:', error);
      return content.substring(0, 100) + '...';
    }
  }

  async getRelevantMemories(characterId, context, limit = 5) {
    try {
      const allMemories = await this.database.getMemories(characterId, 50);

      const contextKeywords = this.extractKeywords(context);
      const scoredMemories = allMemories.map(memory => ({
        ...memory,
        relevanceScore: this.calculateRelevance(memory, contextKeywords)
      }));

      scoredMemories.sort((a, b) => {
        return (b.relevanceScore * b.importance) - (a.relevanceScore * a.importance);
      });

      return scoredMemories.slice(0, limit);
    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return [];
    }
  }

  extractKeywords(text) {
    const commonWords = [
      'bir', 'bu', 'şu', 'o', 've', 'ile', 'için', 'da', 'de', 'ki', 'mi', 'mu', 'mı', 'mü',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ];

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10);
  }

  calculateRelevance(memory, keywords) {
    const memoryText = (memory.content + ' ' + (memory.summary || '')).toLowerCase();
    let score = 0;

    keywords.forEach(keyword => {
      if (memoryText.includes(keyword)) {
        score += 1;
      }
    });

    const recencyBonus = this.calculateRecencyBonus(memory.created_at);
    return score + recencyBonus;
  }

  calculateRecencyBonus(createdAt) {
    const now = new Date();
    const memoryDate = new Date(createdAt);
    const hoursSince = (now - memoryDate) / (1000 * 60 * 60);

    if (hoursSince < 1) return 0.5;
    if (hoursSince < 24) return 0.3;
    if (hoursSince < 168) return 0.1;
    return 0;
  }

  async saveConversation(participants, messages) {
    const conversation = {
      id: uuidv4(),
      participants,
      messages,
      created_at: new Date().toISOString()
    };

    try {
      conversation.summary = await this.ollama.extractConversationSummary(conversation);
    } catch (error) {
      console.error('Conversation summary error:', error);
      conversation.summary = 'Konuşma özeti oluşturulamadı';
    }

    await this.database.saveConversation(conversation);

    for (const participantId of participants) {
      await this.saveMemory(
        participantId,
        'conversation',
        `${messages.map(m => `${m.speaker}: ${m.content}`).join(' ')}`,
        6
      );
    }

    return conversation;
  }

  async saveEvent(characterId, type, description, location = null, participants = []) {
    const event = {
      id: uuidv4(),
      type,
      character_id: characterId,
      location_x: location?.x,
      location_y: location?.y,
      description,
      participants,
      created_at: new Date().toISOString()
    };

    await this.database.logEvent(event);

    const importance = this.calculateEventImportance(type, description);
    await this.saveMemory(characterId, 'event', description, importance);

    return event;
  }

  calculateEventImportance(type, description) {
    const typeScores = {
      'conversation': 5,
      'need_fulfilled': 4,
      'interaction': 6,
      'discovery': 7,
      'conflict': 8,
      'achievement': 8
    };

    let baseScore = typeScores[type] || 5;

    if (description.includes('ilk') || description.includes('first')) {
      baseScore += 2;
    }

    if (description.includes('tehlike') || description.includes('danger')) {
      baseScore += 3;
    }

    return Math.min(10, Math.max(1, baseScore));
  }

  async consolidateMemories(characterId) {
    try {
      const memories = await this.database.getMemories(characterId, 100);
      const oldMemories = memories.filter(m => {
        const age = Date.now() - new Date(m.created_at).getTime();
        return age > (7 * 24 * 60 * 60 * 1000) && m.importance < 6;
      });

      console.log(`Consolidating ${oldMemories.length} old memories for character ${characterId}`);

    } catch (error) {
      console.error('Memory consolidation error:', error);
    }
  }

  async getCharacterRelationships(characterId) {
    try {
      const sql = `
        SELECT * FROM relationships
        WHERE character1_id = ? OR character2_id = ?
        ORDER BY strength DESC
      `;

      return new Promise((resolve, reject) => {
        this.database.db.all(sql, [characterId, characterId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    } catch (error) {
      console.error('Error getting relationships:', error);
      return [];
    }
  }
}

module.exports = MemoryManager;