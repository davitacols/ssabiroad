const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

async function testMLAPI() {
  console.log('🔍 Testing ML API at:', ML_API_URL);
  console.log('');

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthRes = await fetch(`${ML_API_URL}/health`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', healthRes.status);
    if (healthRes.ok) {
      const data = await healthRes.json();
      console.log('   ✅ Health:', data);
    } else {
      console.log('   ❌ Health check failed');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 2: Training queue
  console.log('2️⃣ Testing training queue endpoint...');
  try {
    const queueRes = await fetch(`${ML_API_URL}/training_queue`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', queueRes.status);
    if (queueRes.ok) {
      const data = await queueRes.json();
      console.log('   ✅ Queue size:', data.total || data.queue?.length || 0);
    } else {
      console.log('   ❌ Queue check failed');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 3: Model status
  console.log('3️⃣ Testing model status endpoint...');
  try {
    const statusRes = await fetch(`${ML_API_URL}/model_status`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', statusRes.status);
    if (statusRes.ok) {
      const data = await statusRes.json();
      console.log('   ✅ Model:', data);
    } else {
      console.log('   ❌ Model status failed');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  console.log('📊 Test complete');
}

testMLAPI().catch(console.error);
