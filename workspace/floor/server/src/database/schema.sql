-- Karakterler tablosu
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  personality TEXT NOT NULL, -- JSON string
  needs TEXT NOT NULL, -- JSON string
  position TEXT NOT NULL, -- JSON string
  current_activity TEXT DEFAULT 'wandering',
  inventory TEXT DEFAULT '[]', -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hafıza kayıtları tablosu
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'conversation', 'event', 'observation'
  content TEXT NOT NULL,
  summary TEXT,
  importance INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Dünya durumu tablosu
CREATE TABLE IF NOT EXISTS world_state (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  terrain_type TEXT NOT NULL,
  objects TEXT DEFAULT '[]', -- JSON array
  PRIMARY KEY (x, y)
);

-- Konuşma logları tablosu
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  participants TEXT NOT NULL, -- JSON array of character IDs
  messages TEXT NOT NULL, -- JSON array
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- İlişkiler tablosu
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  character1_id TEXT NOT NULL,
  character2_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'stranger', -- 'friend', 'enemy', 'neutral', 'stranger'
  strength INTEGER DEFAULT 0, -- -100 to 100
  last_interaction DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character1_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (character2_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE(character1_id, character2_id)
);

-- Olaylar tablosu
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'action', 'conversation', 'need_fulfilled', 'interaction'
  character_id TEXT,
  location_x INTEGER,
  location_y INTEGER,
  description TEXT NOT NULL,
  participants TEXT, -- JSON array of character IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_memories_character_id ON memories(character_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participants);
CREATE INDEX IF NOT EXISTS idx_relationships_character1 ON relationships(character1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_character2 ON relationships(character2_id);
CREATE INDEX IF NOT EXISTS idx_events_character_id ON events(character_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_x, location_y);