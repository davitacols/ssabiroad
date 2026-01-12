const fetch = require('node-fetch');

const ML_URL = 'http://localhost:8000';

async function syncTraining() {
  try {
    console.log('\n🔄 Syncing training data and updating model...\n');
    
    const response = await fetch(`${ML_URL}/sync-training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Training sync completed!');
      console.log('\nResult:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Training sync failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

syncTraining();
