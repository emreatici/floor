const axios = require('axios');

async function testOllama() {
  const OLLAMA_URL = 'http://localhost:11434';
  const MODEL = 'oss';

  console.log('Testing Ollama connection...');

  try {
    console.log('1. Checking if Ollama is running...');
    const healthResponse = await axios.get(`${OLLAMA_URL}/api/tags`);
    console.log('✅ Ollama is running');
    console.log('Available models:', healthResponse.data.models?.map(m => m.name) || 'None');

    console.log('\n2. Testing model availability...');
    const models = healthResponse.data.models || [];
    const ossModel = models.find(m => m.name.includes('oss') || m.name.includes('mistral'));

    if (!ossModel) {
      console.log('❌ OSS model not found. Available models:');
      models.forEach(model => console.log(`  - ${model.name}`));
      console.log('\nTo install a model, run: ollama pull llama2');
      return;
    }

    console.log(`✅ Found model: ${ossModel.name}`);

    console.log('\n3. Testing text generation...');
    const testPrompt = 'Merhaba, nasılsın? Kısa bir cevap ver.';

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: ossModel.name,
      prompt: testPrompt,
      stream: false,
      options: {
        temperature: 0.8,
        max_tokens: 50
      }
    }, {
      timeout: 30000
    });

    console.log('✅ Text generation successful');
    console.log('Test prompt:', testPrompt);
    console.log('Response:', response.data.response);

    console.log('\n4. Testing character dialogue...');
    const characterPrompt = `Sen Ahmet isimli bir karaktersin.
Kişiliğin: meraklı, sosyal, cesur
İhtiyaçların: açlık 45/100, susuzluk 60/100, enerji 80/100

Ayşe ile konuşuyorsun. Kısa ve doğal bir selamlama yap:`;

    const characterResponse = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: ossModel.name,
      prompt: characterPrompt,
      stream: false,
      options: {
        temperature: 0.8,
        max_tokens: 100
      }
    });

    console.log('✅ Character dialogue successful');
    console.log('Character response:', characterResponse.data.response);

    console.log('\n🎉 All tests passed! Ollama is ready for the simulation.');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to Ollama. Is it running?');
      console.log('To start Ollama, run: ollama serve');
    } else if (error.response?.status === 404) {
      console.log('❌ Model not found or API endpoint incorrect');
    } else {
      console.log('❌ Error testing Ollama:', error.message);
    }

    console.log('\nTroubleshooting:');
    console.log('1. Make sure Ollama is installed: https://ollama.ai');
    console.log('2. Start Ollama service: ollama serve');
    console.log('3. Install a model: ollama pull llama2');
    console.log('4. Check if running: curl http://localhost:11434/api/tags');
  }
}

if (require.main === module) {
  testOllama();
}

module.exports = testOllama;