// Simple test to verify Claude API configuration
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeAPI() {
  console.log('Testing Claude API configuration...');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('API key exists:', !!apiKey);
  console.log('API key length:', apiKey?.length || 0);
  console.log('API key starts with:', apiKey?.substring(0, 10) || 'N/A');
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not found');
    return;
  }
  
  try {
    const anthropic = new Anthropic({ 
      apiKey: apiKey.trim(),
      maxRetries: 1,
      timeout: 10000
    });
    
    console.log('Making test API call...');
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Hello, can you respond with just "API working"?'
      }]
    });
    
    console.log('✅ Claude API test successful!');
    console.log('Response:', response.content[0].text);
    
  } catch (error) {
    console.error('❌ Claude API test failed:', error.message);
    if (error.status === 401) {
      console.error('Authentication error - API key is invalid');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded');
    } else {
      console.error('Other error:', error.status, error.message);
    }
  }
}

testClaudeAPI();