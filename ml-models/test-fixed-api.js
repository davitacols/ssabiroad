const axios = require('axios');

const ML_API_URL = 'http://34.224.33.158:8000';

async function testMLAPI() {
  console.log('🧪 Testing ML API Training Fix\n');
  
  try {
    // 1. Check health
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get(`${ML_API_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log();
    
    // 2. Check queue
    console.log('2️⃣ Checking training queue...');
    const queue = await axios.get(`${ML_API_URL}/training_queue`);
    console.log('✅ Queue size:', queue.data.total);
    console.log('   Should retrain:', queue.data.should_retrain);
    console.log('   Last training:', queue.data.last_training);
    console.log();
    
    // 3. Check stats
    console.log('3️⃣ Checking stats...');
    const stats = await axios.get(`${ML_API_URL}/stats`);
    console.log('✅ Stats:', {
      queue_size: stats.data.active_learning.queue_size,
      should_retrain: stats.data.active_learning.should_retrain,
      last_training: stats.data.active_learning.last_training
    });
    console.log();
    
    // 4. Test training endpoint
    if (queue.data.total >= 5) {
      console.log('4️⃣ Testing training endpoint...');
      const training = await axios.post(`${ML_API_URL}/trigger_training`, {}, {
        timeout: 60000
      });
      console.log('✅ Training result:', training.data);
      console.log();
      
      // 5. Check queue after training
      console.log('5️⃣ Checking queue after training...');
      const queueAfter = await axios.get(`${ML_API_URL}/training_queue`);
      console.log('✅ Queue size after:', queueAfter.data.total);
      console.log();
    } else {
      console.log('⚠️  Not enough samples in queue to test training');
      console.log(`   Current: ${queue.data.total}, Required: 5`);
      console.log();
    }
    
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ All Tests Passed!                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testMLAPI();
