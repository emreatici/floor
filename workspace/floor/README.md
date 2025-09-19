# Floor - AI Character Simulation World

🤖 **Türkçe konuşan yapay zeka karakterlerinin yaşadığı interaktif 2D dünya simülasyonu**

Floor, Ollama LLM kullanarak gerçek zamanlı olarak düşünen, konuşan ve birbirleriyle etkileşime giren AI karakterlerin bulunduğu gelişmiş bir sosyal simülasyon platformudur. Karakterler hayatta kalma ihtiyaçları, kişilik özellikleri ve hafıza sistemleri ile donatılmış olup tamamen otonom davranışlar sergilerler.

## 🎯 Özellikler

### 🧠 Gelişmiş AI Sistemi
- **Ollama LLM entegrasyonu** ile gerçek zamanlı doğal dil işleme
- **Kişilik bazlı karar alma** - her karakter benzersiz özellikler sergiler
- **Dinamik konuşma sistemi** - karakterler birbirleriyle anlamlı diyaloglar kurar
- **Kapsamlı hafıza sistemi** - karakterler deneyimlerini hatırlar, öğrenir ve paylaşır

### 🗺️ İnteraktif 2D Dünya
- **50x35 grid tabanlı harita** - büyük hücreler (20px) ile optimize edilmiş görsellik
- **6 farklı arazi tipi**: Çimen, Dağ, Su, Orman, Ev, Tarla
- **Dinamik kaynak sistemi** - su, gıda ve barınak kaynakları
- **Geçiş yolları** - karakterlerin sıkışmasını önleyen garantili yollar

### 👥 Sosyal Dinamikler
- **4 benzersiz karakter**: Ahmet, Ayşe, Mehmet, Fatma
- **Gerçek zamanlı konuşmalar** - karakterler birbirleriyle sohbet eder
- **Kaynak paylaşımı** - karakterler koordinat bilgilerini paylaşır
- **Sosyal ihtiyaç sistemi** - yalnızlık hissi ve sosyalleşme motivasyonu

### 🎮 İnteraktif Kontroller
- **Simülasyon hız kontrolü** - 0.1x ile 10x arası ayarlanabilir hız
- **Duraklat/Devam et** - simülasyonu istediğiniz zaman durdurun
- **Karakter seçimi** - karakterlere tıklayarak detaylarını görün
- **Gerçek zamanlı istatistikler** - ihtiyaçlar, aktiviteler ve hafıza

## 🛠️ Teknoloji Stack'i

**Backend:**
- Node.js + Express
- Socket.IO (WebSocket)
- SQLite (veritabanı)
- Ollama (LLM entegrasyonu)

**Frontend:**
- React
- PixiJS (2D görselleştirme)
- Zustand (state management)
- Socket.IO Client

## 📋 Gereksinimler

### Sistem Gereksinimleri
- **Node.js** v16 veya üzeri
- **npm** v8 veya üzeri
- **Ollama** yerel kurulum
- **Modern web tarayıcısı** (Chrome, Firefox, Safari, Edge)

### LLM Gereksinimi
Bu proje Ollama ile çalışır. Desteklenen modeller:
- `llama3.2:3b` (önerilen - hızlı ve etkili)
- `qwen2.5:3b`
- `phi3:mini`
- Diğer Türkçe destekli küçük modeller

## 🚀 Kurulum

### 1. Ollama Kurulumu
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# https://ollama.ai/download sayfasından indirin
```

### 2. Model İndirme
```bash
# Önerilen model
ollama pull llama3.2:3b

# Alternatif modeller
ollama pull qwen2.5:3b
ollama pull phi3:mini
```

### 3. Ollama Servisini Başlatma
```bash
# Ollama servisini başlat (varsayılan: http://localhost:11434)
ollama serve
```

### 4. Proje Kurulumu
```bash
# Repo'yu klonlayın
git clone https://github.com/emreatici/floor.git
cd floor

# Sunucu bağımlılıklarını yükleyin
npm install

# İstemci bağımlılıklarını yükleyin
cd client
npm install
cd ..
```

### 5. Ortam Değişkenleri
`.env` dosyası oluşturun:
```env
# Ollama Ayarları
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Sunucu Ayarları
PORT=3001
DATABASE_PATH=./database/world.db

# Dünya Ayarları
WORLD_SIZE=50
```

## 🎮 Kullanım

### Sunucuyu Başlatma
```bash
# Ana dizinde
npm start
```

### İstemciyi Başlatma
```bash
# Yeni terminal açın
cd client
npm start
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

## 🎛️ Kontroller

### Simülasyon Kontrolleri
- **Duraklat/Devam**: Simülasyonu duraklatır veya devam ettirir
- **Hız Kontrolü**: Simülasyon hızını 0.1x - 10x arasında ayarlar
- **Karakter Seçimi**: Karakterlere tıklayarak detaylarını görün

### Harita Etkileşimi
- **Karakter Takibi**: Karakterlerin hareketlerini gerçek zamanlı izleyin
- **Arazi Bilgisi**: Fareyle harita üzerinde gezinerek arazi tiplerini görün
- **Konuşma Takibi**: Aktif konuşmaları gerçek zamanlı takip edin

### Karakter Hafıza Sistemi
- **🧠 Hafıza Görselleştirmesi**: Karakterlere tıklayarak kapsamlı hafıza panelini görün
- **📝 Son Anılar**: Kısa dönem hafıza
- **🗺️ Bilinen Kaynak Konumları**: Su/gıda/barınak konumları
- **💬 Öğrenilen Bilgiler**: Diğerlerinden öğrendikleri
- **🔍 Keşifler**: Kendi buldukları
- **⭐ Önemli Anılar**: Yüksek önemli anılar

## 🧠 AI Sistemi

### Karakter Kişilikleri

Her karakter şu özelliklere sahiptir:
- **Kişilik Özellikleri**: meraklı, sosyal, temkinli, cesur
- **İlgi Alanları**: keşif, sanat, teknoloji, doğa
- **Korkular**: karanlık, yalnızlık, yükseklik
- **Hedefler**: arkadaş edinme, keşif yapma, güvenlik

### Hafıza Sistemi

- **Kısa Vadeli**: Son 10 olay
- **Uzun Vadeli**: Önemli anılar ve ilişkiler
- **RAG**: Bağlamsal anı arama

### Diyalog Sistemi

Ollama entegrasyonu ile karakterler:
- Kişiliklerine uygun konuşur
- Geçmiş anıları hatırlar
- Mevcut ihtiyaçlarını dile getirir
- Doğal Türkçe diyaloglar kurar

## 📊 Veri Yapısı

### Karakter

```javascript
{
  id: "uuid",
  name: "Ahmet",
  age: 25,
  personality: {
    traits: ["meraklı", "sosyal"],
    interests: ["keşif", "teknoloji"],
    fears: ["yalnızlık"],
    goals: ["arkadaş edinme"]
  },
  needs: {
    hunger: 75,    // 0-100
    thirst: 60,
    energy: 90,
    social: 45
  },
  position: { x: 50, y: 50 },
  currentActivity: "keşif yapıyor"
}
```

### Dünya

```javascript
{
  size: 50,
  width: 50,
  height: 35,
  grid: [], // 50x35 terrain array
  timeOfDay: "day",
  characters: [],
  terrainTypes: {
    grass: { walkable: true, resource: "food" },
    water: { walkable: false, resource: "water" },
    // ...
  }
}
```

## 🔌 API Endpoints

- `GET /api/health` - Sunucu durumu
- `GET /api/world` - Dünya durumu
- `GET /api/characters` - Tüm karakterler
- `POST /api/characters` - Yeni karakter oluştur

## 🔗 WebSocket Events

### Client → Server
- `moveCharacter` - Karakter hareket ettir
- `pauseSimulation` - Simülasyonu duraklat
- `setSimulationSpeed` - Hızı ayarla
- `sendMessage` - Konuşmaya katıl

### Server → Client
- `worldUpdate` - Dünya güncellemesi
- `characterUpdate` - Karakter güncellemesi
- `conversationStarted` - Yeni konuşma
- `newMessage` - Yeni mesaj

## 🎨 Görsel Özelleştirme

### Terrain Renkleri

```javascript
const terrainColors = {
  grass: 0x4CAF50,    // Yeşil
  mountain: 0x795548,  // Kahverengi
  water: 0x2196F3,     // Mavi
  forest: 0x388E3C,    // Koyu yeşil
  house: 0xFFC107,     // Sarı
  farmland: 0x8BC34A   // Açık yeşil
};
```

## 🐛 Sorun Giderme

### Ollama Bağlantı Sorunları

```bash
# Ollama çalışıyor mu kontrol et
curl http://localhost:11434/api/tags

# Ollama'yı yeniden başlat
ollama serve

# Model indir
ollama pull llama2
```

### Frontend Bağlantı Sorunları

1. Backend sunucunun çalıştığından emin olun
2. CORS ayarlarını kontrol edin
3. Console'da hata mesajlarını kontrol edin

### Performans Sorunları

1. Simülasyon hızını düşürün
2. Karakter sayısını azaltın
3. Hafıza temizleme sıklığını artırın

## 🚀 Geliştirme

### Yeni Terrain Tipi Ekleme

```javascript
// server/src/models/World.js
this.terrainTypes.desert = {
  walkable: true,
  resource: null,
  hazard: 'heat'
};
```

### Yeni Karakter Davranışı

```javascript
// server/src/services/CharacterAI.js
case 'new_behavior':
  await this.newBehavior(character, world);
  break;
```

### Yeni UI Komponenti

```jsx
// client/src/components/NewComponent.js
import React from 'react';

const NewComponent = ({ data }) => {
  return <div>{data}</div>;
};

export default NewComponent;
```

## 📚 Kaynaklar

- [Ollama Dokümantasyonu](https://ollama.ai/docs)
- [PixiJS Dokümantasyonu](https://pixijs.com/tutorials)
- [Socket.IO Dokümantasyonu](https://socket.io/docs/)
- [React Dokümantasyonu](https://react.dev/)

## 📄 Lisans

Bu proje açık kaynak kodludur ve kişisel/eğitim amaçlı kullanım için serbesttir.

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 🏗️ Mimari

### Backend (Node.js + Express)
```
server/
├── src/
│   ├── models/           # Veri modelleri
│   │   ├── Character.js  # Karakter sınıfı ve özellikleri
│   │   └── World.js      # Dünya ve arazi sistemleri
│   ├── services/         # İş mantığı servisleri
│   │   ├── OllamaService.js    # LLM entegrasyonu
│   │   ├── CharacterAI.js      # AI karar verme sistemi
│   │   └── MemoryManager.js    # Hafıza yönetimi
│   ├── database/         # Veritabanı işlemleri
│   │   └── Database.js   # SQLite veritabanı yönetimi
│   └── index.js          # Ana sunucu dosyası
├── package.json
└── .env
```

### Frontend (React + PixiJS)
```
client/
├── src/
│   ├── components/       # React bileşenleri
│   │   ├── WorldCanvas.js      # 2D harita görselleştirme
│   │   ├── CharacterPanel.js   # Karakter detay paneli
│   │   ├── ControlPanel.js     # Simülasyon kontrolleri
│   │   └── ConversationPanel.js # Konuşma görüntüleyici
│   ├── hooks/           # React hooks
│   │   └── useSocket.js # WebSocket bağlantı yönetimi
│   ├── store/           # Zustand state yönetimi
│   │   └── gameStore.js # Oyun durumu
│   └── App.js           # Ana uygulama
├── package.json
└── public/
```

## 🔧 Konfigürasyon

### Karakter Kişilikleri
Karakterler `server/src/index.js` dosyasında tanımlanır:
```javascript
const characterConfigs = [
  {
    name: 'Ahmet',
    personality: {
      traits: ['meraklı', 'sosyal', 'cesur'],
      interests: ['keşif', 'teknoloji'],
      fears: ['yalnızlık'],
      goals: ['arkadaş edinme', 'keşif yapma']
    }
  }
  // ...diğer karakterler
];
```

### Dünya Ayarları
`server/src/models/World.js` dosyasından dünya özelliklerini değiştirin:
```javascript
// Arazi dağılımı
generateTerrain(x, y) {
  // Su kaynakları: %5
  if (rand < 0.05) return 'water';
  // Gıda kaynakları: %33
  if (rand < 0.33) return 'grass';
  // ...
}
```

### LLM Prompt'ları
`server/src/services/OllamaService.js` dosyasından AI davranışlarını özelleştirin:
```javascript
const prompt = `Sen ${character.name} isimli bir karaktersin.
// Karakter talimatları buraya...
`;
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

**Ollama bağlantı hatası:**
```bash
# Ollama servisinin çalıştığından emin olun
ollama serve

# Model'in yüklendiğini kontrol edin
ollama list
```

**Karakterler hareket etmiyor:**
- Tarayıcı konsolunu kontrol edin
- Ollama servisinin çalıştığından emin olun
- Model'in doğru yüklendiğini doğrulayın

**Konuşmalar görünmüyor:**
- WebSocket bağlantısını kontrol edin
- Sunucu loglarını inceleyin
- Port 3001'in açık olduğundan emin olun

### Debug Modları
```bash
# Verbose logging ile çalıştırma
DEBUG=* npm start

# Sadece karakter AI logları
DEBUG=character:* npm start
```

## 🤝 Katkıda Bulunma

### Geliştirme Ortamı
```bash
# Development modunda çalıştırma
npm run dev

# Test çalıştırma
npm test

# Linting
npm run lint
```

### Katkı Kuralları
1. **Fork** edin
2. **Feature branch** oluşturun (`git checkout -b feature/amazing-feature`)
3. **Commit** edin (`git commit -m 'Add amazing feature'`)
4. **Push** edin (`git push origin feature/amazing-feature`)
5. **Pull Request** açın

### Kod Standartları
- **ESLint** kurallarına uyun
- **JSDoc** ile fonksiyonları belgelendirin
- **Test** yazın
- **Türkçe** commit mesajları kullanın

## 📚 API Dokümantasyonu

### WebSocket Events

**Client → Server:**
```javascript
// Karakteri hareket ettir
socket.emit('moveCharacter', { characterId, position: { x, y } });

// Simülasyonu duraklat
socket.emit('pauseSimulation');

// Hız değiştir
socket.emit('setSimulationSpeed', speed);
```

**Server → Client:**
```javascript
// Dünya güncelleme
socket.on('worldUpdate', (worldState) => {});

// Yeni konuşma
socket.on('conversationStarted', (conversation) => {});

// Yeni mesaj
socket.on('newMessage', ({ conversationId, message }) => {});
```

### REST API

```bash
# Sağlık kontrolü
GET /api/health

# Dünya durumu
GET /api/world

# Karakterler
GET /api/characters
POST /api/characters
```

## 🔮 Gelecek Özellikler

### v2.0 Planları
- [ ] **Çoklu dünya desteği** - farklı haritalar ve senaryolar
- [ ] **Karakter editörü** - özel karakter oluşturma
- [ ] **Gelişmiş kaynak sistemi** - crafting ve trade
- [ ] **Duygusal sistem** - karakterlerin ruh hali
- [ ] **Hedef sistemi** - uzun vadeli karakter hedefleri

### v3.0 Vizyonu
- [ ] **Multiplayer mod** - kullanıcı kontrolündeki karakterler
- [ ] **Plugin sistemi** - topluluk mod'ları
- [ ] **3D dünya** - Three.js ile 3D görselleştirme
- [ ] **Mobil destek** - React Native uygulaması

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Onur Emre Atici**
- GitHub: [@emreatici](https://github.com/emreatici)

## 🙏 Teşekkürler

- **Ollama** - Yerel LLM desteği için
- **PixiJS** - Performanslı 2D rendering için
- **React** - Kullanıcı arayüzü için
- **Socket.io** - Gerçek zamanlı iletişim için

## 📊 İstatistikler

- **~2500 satır kod** - Kapsamlı AI sistemi
- **6 arazi tipi** - Çeşitli dünya yapısı
- **4 karakter** - Benzersiz kişilikler
- **Real-time** - Anlık simülasyon
- **Türkçe** - Tam Türkçe dil desteği

---

**Floor ile yapay zeka karakterlerinin büyüleyici dünyasını keşfedin! 🚀**

> *Bu proje Claude Code ile geliştirilmiştir ve sürekli olarak geliştirilmektedir.*