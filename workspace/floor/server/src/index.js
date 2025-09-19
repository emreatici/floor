require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const Database = require('./database/Database');
const OllamaService = require('./services/OllamaService');
const MemoryManager = require('./services/MemoryManager');
const CharacterAI = require('./services/CharacterAI');
const Character = require('./models/Character');
const World = require('./models/World');

class GameServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.database = new Database(process.env.DATABASE_PATH);
    this.ollama = new OllamaService(process.env.OLLAMA_URL, process.env.OLLAMA_MODEL);
    this.memoryManager = new MemoryManager(this.database, this.ollama);
    this.characterAI = new CharacterAI(this.ollama, this.memoryManager, this);

    this.world = new World(parseInt(process.env.WORLD_SIZE) || 50);
    this.activeConversations = new Map();
    this.simulationSpeed = 1;
    this.isPaused = false;
    this.lastUpdate = Date.now();
    this.worldStartTime = Date.now();
    this.gameTime = 0; // Geçen dakika sayısı

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        connected: this.database.isConnected,
        ollama: this.ollama.isConnected,
        characters: this.world.getAllCharacters().length
      });
    });

    this.app.get('/api/world', (req, res) => {
      const worldState = this.world.getWorldState();
      worldState.grid = this.world.grid; // Grid'i de gönder
      res.json(worldState);
    });

    this.app.get('/api/characters', (req, res) => {
      res.json(this.world.getAllCharacters());
    });

    this.app.post('/api/characters', async (req, res) => {
      try {
        const { name, personality } = req.body;
        const character = new Character(name, personality);
        this.world.addCharacter(character);
        await this.database.saveCharacter(character);

        this.io.emit('characterAdded', character.toJSON());
        res.json(character.toJSON());
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.emit('worldUpdate', this.world.getWorldState());

      // Aktif konuşmaları yeni bağlanan cliente gönder
      const activeConversationsArray = Array.from(this.activeConversations.values());
      socket.emit('activeConversations', activeConversationsArray);

      socket.on('moveCharacter', ({ characterId, position }) => {
        if (this.world.moveCharacter(characterId, position.x, position.y)) {
          const character = this.world.getCharacter(characterId);
          this.io.emit('characterUpdate', {
            characterId,
            updates: { position: character.position }
          });
        }
      });

      socket.on('pauseSimulation', () => {
        this.isPaused = !this.isPaused;
        console.log('Simulation', this.isPaused ? 'paused' : 'resumed');
        this.io.emit('simulationStateChanged', { isPaused: this.isPaused });
      });

      socket.on('setSimulationSpeed', (speed) => {
        this.simulationSpeed = Math.max(0.1, Math.min(10, speed));
        console.log('Simulation speed set to:', this.simulationSpeed + 'x');
        this.io.emit('simulationSpeedChanged', { speed: this.simulationSpeed });
      });

      socket.on('sendMessage', async ({ conversationId, message }) => {
        try {
          const conversation = this.activeConversations.get(conversationId);
          if (conversation) {
            const newMessage = {
              speaker: 'User',
              content: message,
              timestamp: Date.now(),
              type: 'user'
            };

            conversation.messages.push(newMessage);
            this.io.emit('newMessage', { conversationId, message: newMessage });

            await this.memoryManager.saveConversation(
              conversation.participants,
              conversation.messages
            );
          }
        } catch (error) {
          console.error('Message send error:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  async initialize() {
    try {
      await this.database.connect();
      await this.ollama.testConnection();

      await this.loadOrCreateCharacters();
      await this.startSimulationLoop();

      console.log('Game server initialized successfully');
    } catch (error) {
      console.error('Server initialization error:', error);
    }
  }

  async loadOrCreateCharacters() {
    try {
      const savedCharacters = await this.database.getAllCharacters();

      if (savedCharacters.length === 0) {
        console.log('Creating default characters...');
        await this.createDefaultCharacters();
      } else {
        console.log(`Loading ${savedCharacters.length} characters from database`);
        for (const characterData of savedCharacters) {
          const character = new Character(characterData.name, characterData.personality);
          Object.assign(character, characterData);
          this.world.addCharacter(character);
        }
      }
    } catch (error) {
      console.error('Character loading error:', error);
      await this.createDefaultCharacters();
    }
  }

  async createDefaultCharacters() {
    const characterConfigs = [
      {
        name: 'Ahmet',
        personality: {
          traits: ['meraklı', 'sosyal', 'cesur'],
          interests: ['keşif', 'teknoloji'],
          fears: ['yalnızlık'],
          goals: ['arkadaş edinme', 'keşif yapma']
        }
      },
      {
        name: 'Ayşe',
        personality: {
          traits: ['yaratık', 'duygusal', 'pratik'],
          interests: ['sanat', 'müzik'],
          fears: ['karanlık'],
          goals: ['yaratıcı olma', 'bilgi toplama']
        }
      },
      {
        name: 'Mehmet',
        personality: {
          traits: ['temkinli', 'mantıklı', 'cesur'],
          interests: ['okuma', 'spor'],
          fears: ['yükseklik'],
          goals: ['güvenli alan bulma', 'bilgi toplama']
        }
      },
      {
        name: 'Fatma',
        personality: {
          traits: ['sosyal', 'duygusal', 'yaratık'],
          interests: ['yemek', 'doğa'],
          fears: ['bilinmeyen'],
          goals: ['arkadaş edinme', 'yaratıcı olma']
        }
      }
    ];

    for (const config of characterConfigs) {
      const character = new Character(config.name, config.personality);

      character.position.x = Math.floor(Math.random() * 30) + 10; // 10-40 arası
      character.position.y = Math.floor(Math.random() * 15) + 10; // 10-25 arası

      this.world.addCharacter(character);
      await this.database.saveCharacter(character);

      console.log(`Created character: ${character.name} at (${character.position.x}, ${character.position.y})`);
    }
  }

  async startSimulationLoop() {
    const SIMULATION_INTERVAL = 3000; // Daha sık güncelleme

    console.log('Starting simulation loop...');
    console.log(`Characters in world: ${this.world.getAllCharacters().length}`);

    setInterval(async () => {
      if (this.isPaused) return;

      const now = Date.now();
      const deltaTime = (now - this.lastUpdate) * this.simulationSpeed;

      try {
        // Oyun zamanını güncelle
        this.gameTime += (deltaTime * this.simulationSpeed) / (1000 * 60); // Dakika cinsinden

        this.world.update(deltaTime);

        const characters = this.world.getAllCharacters();
        console.log(`Updating ${characters.length} characters... (Speed: ${this.simulationSpeed}x, Game Time: ${Math.floor(this.gameTime)} min)`);

        for (const character of characters) {
          console.log(`Updating character: ${character.name} at (${character.position.x}, ${character.position.y})`);
          await this.characterAI.updateCharacter(character, this.world);
          await this.database.saveCharacter(character);
        }

        // Tüm bağlı clientlara güncellenmiş dünya durumunu gönder
        const worldState = this.world.getWorldState();
        worldState.gameTime = Math.floor(this.gameTime); // Dakika cinsinden
        worldState.simulationSpeed = this.simulationSpeed;
        worldState.isPaused = this.isPaused;
        this.io.emit('worldUpdate', worldState);
        console.log(`Sent world update to ${this.io.engine.clientsCount} clients`);

      } catch (error) {
        console.error('Simulation loop error:', error);
      }

      this.lastUpdate = now;
    }, SIMULATION_INTERVAL);

    console.log('Simulation loop started with interval:', SIMULATION_INTERVAL);
  }

  createConversation(participants) {
    const conversationId = require('uuid').v4();
    const conversation = {
      id: conversationId,
      participants,
      messages: [],
      created_at: Date.now(),
      lastMessage: null
    };

    this.activeConversations.set(conversationId, conversation);

    // UI'ye yeni konuşma başlatıldığını bildir
    this.io.emit('conversationStarted', conversation);

    return conversationId;
  }

  addMessageToConversation(conversationId, message) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) return false;

    conversation.messages.push(message);
    conversation.lastMessage = message;

    // UI'ye yeni mesaj gönder
    this.io.emit('newMessage', { conversationId, message });

    return true;
  }

  async start() {
    const port = process.env.PORT || 3001;

    this.server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Frontend should connect to: http://localhost:${port}`);
    });
  }
}

const server = new GameServer();

server.initialize().then(() => {
  server.start();
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});