import React, { useState, useEffect, useRef } from 'react';
import './ConversationWindow.css';

const ConversationWindow = ({ activeConversations, worldState, onSendMessage }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeConversations.length > 0 && !selectedConversation) {
      setSelectedConversation(activeConversations[0]);
    }
  }, [activeConversations, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    onSendMessage && onSendMessage(selectedConversation.id, messageInput);
    setMessageInput('');
  };

  const getCharacterName = (characterId) => {
    if (!worldState || !worldState.characters) return 'Bilinmeyen';
    const character = worldState.characters.find(c => c.id === characterId);
    return character ? character.name : 'Bilinmeyen';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activeConversations || activeConversations.length === 0) {
    return (
      <div className="conversation-window">
        <div className="no-conversations">
          <h3>Aktif Konuşma Yok</h3>
          <p>Karakterler konuşmaya başladığında burada görünecek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-window">
      <div className="conversation-tabs">
        {activeConversations.map(conversation => (
          <button
            key={conversation.id}
            className={`conversation-tab ${
              selectedConversation?.id === conversation.id ? 'active' : ''
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <div className="tab-participants">
              {conversation.participants.map(id => getCharacterName(id)).join(' & ')}
            </div>
            <div className="tab-time">
              {formatTimestamp(conversation.lastMessage?.timestamp || conversation.created_at)}
            </div>
          </button>
        ))}
      </div>

      {selectedConversation && (
        <div className="conversation-content">
          <div className="conversation-header">
            <h3>
              {selectedConversation.participants.map(id => getCharacterName(id)).join(' & ')}
            </h3>
            <div className="conversation-info">
              Mesaj sayısı: {selectedConversation.messages?.length || 0}
            </div>
          </div>

          <div className="messages-container">
            {selectedConversation.messages?.map((message, index) => (
              <div
                key={index}
                className={`message ${message.type || 'character'}`}
              >
                <div className="message-header">
                  <span className="speaker-name">
                    {getCharacterName(message.speaker || message.characterId)}
                  </span>
                  <span className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
                {message.mood && (
                  <div className="message-mood">
                    Ruh hali: {message.mood}
                  </div>
                )}
              </div>
            )) || (
              <div className="no-messages">
                Henüz mesaj yok
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Konuşmaya katıl..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Gönder
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ConversationWindow;