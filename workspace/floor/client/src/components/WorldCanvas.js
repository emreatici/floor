import React, { useRef, useEffect, useState } from 'react';
import { Application, Graphics, Text, Container } from 'pixi.js';

const WorldCanvas = ({ worldState, selectedCharacter, onCharacterSelect, onCellClick }) => {
  const canvasRef = useRef();
  const appRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);

  const CELL_SIZE = 20; // Çok daha büyük hücreler
  const VISIBLE_GRID_X = 50; // Daha küçük grid - daha büyük hücreler
  const VISIBLE_GRID_Y = 35; // Daha küçük grid - daha büyük hücreler

  const terrainColors = {
    grass: 0x7CB342,      // Açık yeşil
    mountain: 0x5D4037,   // Koyu kahverengi
    water: 0x1976D2,      // Koyu mavi
    forest: 0x2E7D32,     // Koyu yeşil
    house: 0xF57C00,      // Turuncu
    farmland: 0x8BC34A    // Sarımsı yeşil
  };

  const getTerrainSymbol = (terrain) => {
    const symbols = {
      grass: '🌱',     // Çimen - gıda bulunabilir
      mountain: '⛰️',   // Dağ - geçilemez
      water: '💧',     // Su - içilebilir
      forest: '🌲',    // Orman - odun kaynağı
      house: '🏠',     // Ev - dinlenme yeri
      farmland: '🌾'   // Tarla - gıda kaynağı
    };
    return symbols[terrain] || '';
  };

  useEffect(() => {
    if (!isInitialized && canvasRef.current) {
      initializePixi();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized && worldState) {
      updateCanvas();
    }
  }, [worldState, selectedCharacter, isInitialized]);

  const initializePixi = async () => {
    try {
      const app = new Application();
      await app.init({
        canvas: canvasRef.current,
        width: VISIBLE_GRID_X * CELL_SIZE, // Dinamik genişlik
        height: VISIBLE_GRID_Y * CELL_SIZE, // Dinamik yükseklik
        backgroundColor: 0x87CEEB
      });

      appRef.current = app;

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('pointertap', handleCanvasClick);

      app.stage.addChild(new Container());
      app.stage.addChild(new Container());

      setIsInitialized(true);
    } catch (error) {
      console.error('PixiJS initialization error:', error);
    }
  };

  const handleCanvasClick = (event) => {
    const globalPos = event.global;
    const localPos = appRef.current.stage.toLocal(globalPos);

    const gridX = Math.floor(localPos.x / CELL_SIZE);
    const gridY = Math.floor(localPos.y / CELL_SIZE);

    if (onCellClick) {
      onCellClick(gridX, gridY);
    }

    if (worldState && worldState.characters) {
      const clickedCharacter = worldState.characters.find(char =>
        Math.abs(char.position.x - gridX) < 1 &&
        Math.abs(char.position.y - gridY) < 1
      );

      if (clickedCharacter && onCharacterSelect) {
        onCharacterSelect(clickedCharacter);
      }
    }
  };

  const updateCanvas = () => {
    if (!appRef.current || !worldState) return;

    console.log('Updating canvas with worldState:', {
      size: worldState.size,
      gridExists: !!worldState.grid,
      charactersCount: worldState.characters?.length || 0
    });

    const app = appRef.current;
    const [terrainLayer, characterLayer] = app.stage.children;

    terrainLayer.removeChildren();
    characterLayer.removeChildren();

    drawTerrain(terrainLayer);
    drawCharacters(characterLayer);
  };

  const drawTerrain = (container) => {
    if (!worldState.grid) {
      console.log('No grid data available');
      return;
    }

    console.log('Drawing terrain, grid size:', worldState.grid.length);

    // Dikdörtgen harita alanı
    const startX = 0;
    const startY = 0;
    const endX = Math.min(worldState.size, VISIBLE_GRID_X);
    const endY = Math.min(worldState.size, VISIBLE_GRID_Y);

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        if (worldState.grid[x] && worldState.grid[x][y]) {
          const terrain = worldState.grid[x][y];
          const cell = new Graphics();

          // Temel hücre çiz
          cell.rect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
          cell.fill(terrainColors[terrain] || 0x888888);
          cell.stroke({ width: 0.5, color: 0x000000, alpha: 0.1 });

          container.addChild(cell);

          // Terrain simgeleri ekle
          const symbol = getTerrainSymbol(terrain);
          if (symbol) {
            const symbolText = new Text({
              text: symbol,
              style: {
                fontSize: Math.max(8, CELL_SIZE - 4),
                fill: 0x000000,
                fontWeight: 'bold'
              }
            });

            symbolText.x = x * CELL_SIZE + CELL_SIZE/2 - symbolText.width/2;
            symbolText.y = y * CELL_SIZE + CELL_SIZE/2 - symbolText.height/2;

            container.addChild(symbolText);
          }
        }
      }
    }
  };

  const drawCharacters = (container) => {
    if (!worldState.characters) {
      console.log('No characters data available');
      return;
    }

    console.log('Drawing characters:', worldState.characters.length);

    worldState.characters.forEach(character => {
      // Karakterin absolut pozisyonunu kullan
      const x = character.position.x;
      const y = character.position.y;

      // Sadece görünen alanda olan karakterleri göster
      if (x >= 0 && x < VISIBLE_GRID_X && y >= 0 && y < VISIBLE_GRID_Y) {

        console.log(`Drawing character ${character.name} at (${x}, ${y})`);

        const characterSprite = new Graphics();

        const isSelected = selectedCharacter && selectedCharacter.id === character.id;

        // Karaktere göre renk
        const characterColors = {
          'Ahmet': 0x2196F3,   // Mavi
          'Ayşe': 0xE91E63,    // Pembe
          'Mehmet': 0x4CAF50,  // Yeşil
          'Fatma': 0xFF9800    // Turuncu
        };

        const baseColor = characterColors[character.name] || 0x0000FF;
        const color = isSelected ? 0xFF0000 : baseColor;

        characterSprite.circle(
          x * CELL_SIZE + CELL_SIZE / 2,
          y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2.2 // Büyük karakter
        );
        characterSprite.fill(color);
        characterSprite.stroke({ width: 2, color: 0xFFFFFF });

        characterSprite.eventMode = 'static';
        characterSprite.cursor = 'pointer';
        characterSprite.on('pointertap', () => {
          if (onCharacterSelect) {
            onCharacterSelect(character);
          }
        });

        const nameText = new Text({
          text: character.name,
          style: {
            fontSize: 10,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 2
          }
        });

        nameText.x = x * CELL_SIZE + CELL_SIZE / 2 - nameText.width / 2;
        nameText.y = y * CELL_SIZE - 15;

        container.addChild(characterSprite);
        container.addChild(nameText);

        if (isSelected) {
          const selectionRing = new Graphics();
          selectionRing.circle(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2
          );
          selectionRing.stroke({ width: 2, color: 0xFF0000, alpha: 0.8 });
          container.addChild(selectionRing);
        }
      } else {
        console.log(`Character ${character.name} at (${x}, ${y}) is outside visible area`);
      }
    });
  };

  return (
    <div className="world-canvas-container">
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'crosshair'
        }}
      />
      {selectedCharacter && (
        <div className="camera-info">
          Seçili: {selectedCharacter.name} ({selectedCharacter.position.x}, {selectedCharacter.position.y})
        </div>
      )}

      <div className="map-legend">
        <h4>Harita Rehberi</h4>
        <div className="legend-items">
          <div className="legend-item">🌱 Çimen - Gıda</div>
          <div className="legend-item">🌾 Tarla - Gıda</div>
          <div className="legend-item">💧 Su - İçecek</div>
          <div className="legend-item">🌲 Orman</div>
          <div className="legend-item">🏠 Ev - Dinlenme</div>
          <div className="legend-item">⛰️ Dağ - Geçilemez</div>
        </div>
        <div className="character-colors">
          <h5>Karakterler</h5>
          <div className="legend-item">🔵 Ahmet</div>
          <div className="legend-item">🟠 Fatma</div>
          <div className="legend-item">🟢 Mehmet</div>
          <div className="legend-item">🩷 Ayşe</div>
        </div>
      </div>
    </div>
  );
};

export default WorldCanvas;