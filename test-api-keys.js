// Test API keys
require('dotenv').config({ path: '.env.local' });

console.log('Testing API Keys...\n');

// Check Anthropic
const anthropicKey = process.env.ANTHROPIC_API_KEY;
console.log('ANTHROPIC_API_KEY:', anthropicKey ? `${anthropicKey.substring(0, 20)}... (${anthropicKey.length} chars)` : 'NOT FOUND');

// Check Google Places
const googleKey = process.env.GOOGLE_PLACES_API_KEY;
console.log('GOOGLE_PLACES_API_KEY:', googleKey ? `${googleKey.substring(0, 20)}... (${googleKey.length} chars)` : 'NOT FOUND');

// Test Anthropic API
async function testAnthropic() {
  if (!anthropicKey) {
    console.log('\n❌ Anthropic API key not found');
    return;
  }
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicKey });
    
    console.log('\n🔍 Testing Anthropic API...');
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Say "API works" if you can read this.'
      }]
    });
    
    console.log('✅ Anthropic API works!');
    console.log('Response:', response.content[0].text);
  } catch (error) {
    console.log('❌ Anthropic API failed:', error.message);
    console.log('Status:', error.status);
  }
}

testAnthropic();
