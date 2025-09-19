import React from 'react';
import './CharacterPanel.css';

const CharacterPanel = ({ character, onCharacterUpdate }) => {
  if (!character) {
    return (
      <div className="character-panel">
        <div className="no-selection">
          <h3>Karakter Seçilmedi</h3>
          <p>Harita üzerindeki bir karaktere tıklayın</p>
        </div>
      </div>
    );
  }

  const getNeedColor = (value) => {
    if (value > 70) return '#4CAF50';
    if (value > 40) return '#FF9800';
    return '#F44336';
  };

  const getNeedStatus = (value) => {
    if (value > 70) return 'İyi';
    if (value > 40) return 'Orta';
    return 'Kötü';
  };

  const getPriorityNeed = (needs) => {
    const needTranslations = {
      hunger: 'Açlık',
      thirst: 'Susuzluk',
      energy: 'Enerji',
      social: 'Sosyallik'
    };

    const entries = Object.entries(needs);
    entries.sort((a, b) => a[1] - b[1]);
    const [needName, value] = entries[0];

    return `${needTranslations[needName]} (${Math.round(value)}/100)`;
  };

  return (
    <div className="character-panel">
      <div className="character-header">
        <h2>{character.name}</h2>
        <div className="character-basic-info">
          <span>Yaş: {character.age}</span>
          <span>Aktivite: {character.currentActivity}</span>
        </div>
      </div>

      <div className="character-section">
        <h3>İhtiyaçlar</h3>
        <div className="needs-grid">
          {Object.entries(character.needs).map(([need, value]) => (
            <div key={need} className="need-item">
              <div className="need-header">
                <span className="need-name">
                  {need === 'hunger' && '🍽️ Açlık'}
                  {need === 'thirst' && '💧 Susuzluk'}
                  {need === 'energy' && '⚡ Enerji'}
                  {need === 'social' && '👥 Sosyallik'}
                </span>
                <span className="need-status" style={{ color: getNeedColor(value) }}>
                  {getNeedStatus(value)}
                </span>
              </div>
              <div className="need-bar">
                <div
                  className="need-fill"
                  style={{
                    width: `${value}%`,
                    backgroundColor: getNeedColor(value)
                  }}
                ></div>
              </div>
              <div className="need-value">{Math.round(value)}/100</div>
            </div>
          ))}
        </div>
      </div>

      <div className="character-section">
        <h3>Kişilik</h3>
        <div className="personality-traits">
          <div className="trait-group">
            <strong>Özellikler:</strong>
            <div className="trait-tags">
              {character.personality.traits.map((trait, index) => (
                <span key={index} className="trait-tag">{trait}</span>
              ))}
            </div>
          </div>

          <div className="trait-group">
            <strong>İlgi Alanları:</strong>
            <div className="trait-tags">
              {character.personality.interests.map((interest, index) => (
                <span key={index} className="trait-tag interest">{interest}</span>
              ))}
            </div>
          </div>

          <div className="trait-group">
            <strong>Korkular:</strong>
            <div className="trait-tags">
              {character.personality.fears.map((fear, index) => (
                <span key={index} className="trait-tag fear">{fear}</span>
              ))}
            </div>
          </div>

          <div className="trait-group">
            <strong>Hedefler:</strong>
            <div className="trait-tags">
              {character.personality.goals.map((goal, index) => (
                <span key={index} className="trait-tag goal">{goal}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="character-section">
        <h3>Konum & Durum</h3>
        <div className="location-info">
          <div className="info-row">
            <span>Konum:</span>
            <span>({character.position.x}, {character.position.y})</span>
          </div>
          <div className="info-row">
            <span>Şu an:</span>
            <span className="current-thought">{character.currentActivity}</span>
          </div>
          <div className="info-row">
            <span>En düşük ihtiyaç:</span>
            <span className="priority-need">
              {getPriorityNeed(character.needs)}
            </span>
          </div>
        </div>
      </div>

      {character.inventory && character.inventory.length > 0 && (
        <div className="character-section">
          <h3>Envanter</h3>
          <div className="inventory-items">
            {character.inventory.map((item, index) => (
              <div key={index} className="inventory-item">
                {item.name} x{item.quantity || 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {character.memories && (
        <div className="character-section">
          <h3>🧠 Hafıza Sistemi</h3>

          {/* Kısa Dönem Anılar */}
          {character.memories.shortTerm && character.memories.shortTerm.length > 0 && (
            <div className="memory-subsection">
              <h4>📝 Son Anılar</h4>
              <div className="memories-list">
                {character.memories.shortTerm.slice(-3).map((memory, index) => (
                  <div key={index} className="memory-item">
                    <div className="memory-content">
                      {memory.content && memory.content.length > 80
                        ? memory.content.substring(0, 80) + '...'
                        : memory.content || 'Anı içeriği yok'
                      }
                    </div>
                    <div className="memory-meta">
                      <span>Tip: {memory.type || 'bilinmiyor'}</span>
                      <span>Önem: {memory.importance || 0}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kaynak Konumları */}
          {character.memories.longTerm && character.memories.longTerm.resourceLocations &&
           Object.keys(character.memories.longTerm.resourceLocations).length > 0 && (
            <div className="memory-subsection">
              <h4>🗺️ Bilinen Kaynak Konumları</h4>
              <div className="resource-locations">
                {Object.entries(character.memories.longTerm.resourceLocations).map(([key, resource]) => (
                  <div key={key} className="resource-item">
                    <div className="resource-header">
                      <span className="resource-type">
                        {resource.type === 'water' && '💧 Su'}
                        {resource.type === 'food' && '🍽️ Gıda'}
                        {resource.type === 'crops' && '🌾 Ürün'}
                        {resource.type === 'shelter' && '🏠 Barınak'}
                        {!['water', 'food', 'crops', 'shelter'].includes(resource.type) && `📦 ${resource.type}`}
                      </span>
                      <span className="resource-location">({resource.x}, {resource.y})</span>
                    </div>
                    <div className="resource-meta">
                      <span>Kalite: {resource.quality || 'bilinmiyor'}</span>
                      {resource.source && <span>Kaynak: {resource.source}</span>}
                      <span>Ziyaret: {resource.timesVisited || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paylaşılan Bilgiler */}
          {character.memories.longTerm && character.memories.longTerm.sharedInformation &&
           character.memories.longTerm.sharedInformation.length > 0 && (
            <div className="memory-subsection">
              <h4>💬 Öğrenilen Bilgiler</h4>
              <div className="shared-info-list">
                {character.memories.longTerm.sharedInformation.slice(-5).map((info, index) => (
                  <div key={index} className="shared-info-item">
                    <div className="shared-info-header">
                      <span className="info-source">👤 {info.source}</span>
                      <span className="info-time">
                        {new Date(info.timestamp).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="shared-info-content">
                      {typeof info.information === 'string'
                        ? info.information
                        : info.information.content
                        || JSON.stringify(info.information).substring(0, 60) + '...'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keşifler */}
          {character.memories.longTerm && character.memories.longTerm.discoveries &&
           character.memories.longTerm.discoveries.length > 0 && (
            <div className="memory-subsection">
              <h4>🔍 Keşifler</h4>
              <div className="discoveries-list">
                {character.memories.longTerm.discoveries.slice(-3).map((discovery, index) => (
                  <div key={index} className="discovery-item">
                    <div className="discovery-content">
                      {discovery.content || 'Keşif açıklaması yok'}
                    </div>
                    <div className="discovery-meta">
                      {discovery.location && (
                        <span>📍 ({discovery.location.x}, {discovery.location.y})</span>
                      )}
                      <span>
                        {new Date(discovery.timestamp).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Önemli Anılar */}
          {character.memories.longTerm && character.memories.longTerm.important &&
           character.memories.longTerm.important.length > 0 && (
            <div className="memory-subsection">
              <h4>⭐ Önemli Anılar</h4>
              <div className="important-memories">
                {character.memories.longTerm.important.slice(-3).map((memory, index) => (
                  <div key={index} className="important-memory-item">
                    <div className="memory-content">
                      {memory.content && memory.content.length > 80
                        ? memory.content.substring(0, 80) + '...'
                        : memory.content || 'Anı içeriği yok'
                      }
                    </div>
                    <div className="memory-meta">
                      <span>Tip: {memory.type || 'bilinmiyor'}</span>
                      <span>Önem: {memory.importance || 0}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hafıza boşsa */}
          {(!character.memories.shortTerm || character.memories.shortTerm.length === 0) &&
           (!character.memories.longTerm ||
            (Object.keys(character.memories.longTerm.resourceLocations || {}).length === 0 &&
             (character.memories.longTerm.sharedInformation || []).length === 0 &&
             (character.memories.longTerm.discoveries || []).length === 0 &&
             (character.memories.longTerm.important || []).length === 0)) && (
            <div className="no-memories">
              <p>Henüz hiçbir anı kaydedilmemiş.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterPanel;