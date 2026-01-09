#!/usr/bin/env node

const http = require('http');

const ML_API_URL = 'http://34.224.33.158:8000';

async function reloadQueue() {
  console.log('🔄 Reloading ML API queue...');
  
  try {
    // Call /stats to trigger queue reload
    const response = await fetch(`${ML_API_URL}/stats`);
    const data = await response.json();
    
    console.log('✅ Queue reloaded');
    console.log(`📊 Queue size: ${data.active_learning.queue_size}`);
    console.log(`🔄 Should retrain: ${data.active_learning.should_retrain}`);
    
    if (data.active_learning.should_retrain) {
      console.log('\n🚀 Triggering retrain...');
      const retrainResponse = await fetch(`${ML_API_URL}/retrain`, { method: 'POST' });
      const retrainData = await retrainResponse.json();
      console.log('✅ Retrain triggered:', retrainData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

reloadQueue();
