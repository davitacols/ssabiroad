const fetch = require('node-fetch');

const ML_URL = 'http://localhost:8000';

async function checkStatus() {
  try {
    console.log('\n📊 Checking ML Training Status...\n');
    
    // Check health
    const healthResponse = await fetch(`${ML_URL}/health`);
    const health = await healthResponse.json();
    
    console.log('Service Health:');
    console.log(`  Status: ${health.status}`);
    console.log(`  Model: ${health.model}`);
    console.log(`  Device: ${health.device}`);
    console.log(`  Vectors in DB: ${health.vectors_in_db}\n`);
    
    // Check stats
    try {
      const statsResponse = await fetch(`${ML_URL}/stats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('Training Statistics:');
        console.log(`  Total recognitions: ${stats.total_recognitions}`);
        console.log(`  Verified feedback: ${stats.verified_feedback}`);
        console.log(`  Vectors in Pinecone: ${stats.vectors_in_pinecone}`);
        console.log(`  Ready for training: ${stats.ready_for_training}\n`);
      }
    } catch (e) {
      console.log('Stats endpoint not available (requires DB connection)\n');
    }
    
    console.log('✅ ML service is running and ready!');
    console.log('\nNote: Training data has been sent to the service.');
    console.log('The model will use these embeddings for future predictions.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure the ML service is running: python app.py\n');
  }
}

checkStatus();
