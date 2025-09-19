const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
  constructor(dbPath = './database/world.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.isConnected = true;
          this.initializeSchema().then(resolve).catch(reject);
        }
      });
    });
  }

  async initializeSchema() {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Schema initialization error:', err);
          reject(err);
        } else {
          console.log('Database schema initialized');
          resolve();
        }
      });
    });
  }

  async saveCharacter(character) {
    const sql = `
      INSERT OR REPLACE INTO characters
      (id, name, age, personality, needs, position, current_activity, inventory, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        character.id,
        character.name,
        character.age,
        JSON.stringify(character.personality),
        JSON.stringify(character.needs),
        JSON.stringify(character.position),
        character.currentActivity,
        JSON.stringify(character.inventory)
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async getCharacter(characterId) {
    const sql = 'SELECT * FROM characters WHERE id = ?';

    return new Promise((resolve, reject) => {
      this.db.get(sql, [characterId], (err, row) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            ...row,
            personality: JSON.parse(row.personality),
            needs: JSON.parse(row.needs),
            position: JSON.parse(row.position),
            inventory: JSON.parse(row.inventory)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async getAllCharacters() {
    const sql = 'SELECT * FROM characters ORDER BY created_at';

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else {
          const characters = rows.map(row => ({
            ...row,
            personality: JSON.parse(row.personality),
            needs: JSON.parse(row.needs),
            position: JSON.parse(row.position),
            inventory: JSON.parse(row.inventory)
          }));
          resolve(characters);
        }
      });
    });
  }

  async saveMemory(memory) {
    const sql = `
      INSERT INTO memories (id, character_id, type, content, summary, importance)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        memory.id,
        memory.character_id,
        memory.type,
        memory.content,
        memory.summary,
        memory.importance
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async getMemories(characterId, limit = 50) {
    const sql = `
      SELECT * FROM memories
      WHERE character_id = ?
      ORDER BY importance DESC, created_at DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [characterId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async saveConversation(conversation) {
    const sql = `
      INSERT INTO conversations (id, participants, messages, summary)
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        conversation.id,
        JSON.stringify(conversation.participants),
        JSON.stringify(conversation.messages),
        conversation.summary
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async saveWorldState(worldState) {
    const sql = `
      INSERT OR REPLACE INTO world_state (x, y, terrain_type, objects)
      VALUES (?, ?, ?, ?)
    `;

    const promises = [];
    for (let x = 0; x < worldState.grid.length; x++) {
      for (let y = 0; y < worldState.grid[x].length; y++) {
        promises.push(
          new Promise((resolve, reject) => {
            this.db.run(sql, [x, y, worldState.grid[x][y], '[]'], function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
          })
        );
      }
    }

    return Promise.all(promises);
  }

  async logEvent(event) {
    const sql = `
      INSERT INTO events (id, type, character_id, location_x, location_y, description, participants)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        event.id,
        event.type,
        event.character_id,
        event.location_x,
        event.location_y,
        event.description,
        JSON.stringify(event.participants)
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;