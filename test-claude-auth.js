const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testClaudeAuth() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  console.log('Testing Claude API authentication...');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  console.log('API Key prefix:', apiKey?.substring(0, 20) || 'none');
  
  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  
  try {
    const anthropic = new Anthropic({ 
      apiKey: apiKey.trim(),
      maxRetries: 1,
      timeout: 10000
    });
    
    console.log('Making test request...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Hello, can you respond with just "API working"?'
      }]
    });
    
    console.log('✅ SUCCESS! Response:', response.content[0].text);
    
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Type:', error.type);
    console.error('Full error:', error);
  }
}

testClaudeAuth();