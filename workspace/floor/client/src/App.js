import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import useWorldStore from './store/worldStore';
import WorldCanvas from './components/WorldCanvas';
import CharacterPanel from './components/CharacterPanel';
import ConversationWindow from './components/ConversationWindow';
import './App.css';

function App() {
  const {
    worldState,
    selectedCharacter,
    activeConversations,
    isConnected,
    simulationSpeed,
    isPaused,
    setSocket,
    setSelectedCharacter,
    initializeSocket,
    moveCharacter,
    sendMessage,
    setSimulationSpeed,
    togglePause,
    cleanup
  } = useWorldStore();

  useEffect(() => {
    const socket = io('http://localhost:3001');
    setSocket(socket);
    initializeSocket();

    return () => {
      cleanup();
    };
  }, []);

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
  };

  const handleCellClick = (x, y) => {
    if (selectedCharacter) {
      moveCharacter(selectedCharacter.id, { x, y });
    }
  };

  const handleSendMessage = (conversationId, message) => {
    sendMessage(conversationId, message);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>Sanal Dünya Simülasyonu</h1>
        <div className="controls">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
            {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
          </div>

          <div className="simulation-controls">
            <button onClick={togglePause} className="control-button">
              {isPaused ? '▶️ Başlat' : '⏸️ Durdur'}
            </button>

            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="speed-selector"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          {worldState && (
            <div className="world-info">
              <span>Oyun Zamanı: {Math.floor((worldState.gameTime || 0) / 60)}s {(worldState.gameTime || 0) % 60}dk</span>
              <span>Gün: {worldState.timeOfDay}</span>
              <span>Karakterler: {worldState.characters?.length || 0}</span>
              <span>Hız: {worldState.simulationSpeed || 1}x</span>
            </div>
          )}
        </div>
      </div>

      <div className="app-content">
        <ConversationWindow
          activeConversations={activeConversations}
          worldState={worldState}
          onSendMessage={handleSendMessage}
        />

        <div className="main-view">
          <WorldCanvas
            worldState={worldState}
            selectedCharacter={selectedCharacter}
            onCharacterSelect={handleCharacterSelect}
            onCellClick={handleCellClick}
          />
        </div>

        <CharacterPanel
          character={selectedCharacter}
        />
      </div>

      {!isConnected && (
        <div className="disconnected-overlay">
          <div className="disconnected-message">
            <h3>Sunucuya Bağlanılamıyor</h3>
            <p>Lütfen sunucunun çalıştığından emin olun</p>
            <div className="loading-spinner" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
