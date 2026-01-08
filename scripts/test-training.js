const ML_API_URL = 'http://34.224.33.158:8000';

async function testTraining() {
  console.log('🧪 Testing ML API training endpoints\n');

  // Test 1: /trigger_training
  console.log('1️⃣ Testing /trigger_training...');
  try {
    const res = await fetch(`${ML_API_URL}/trigger_training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Response:', data);
    } else {
      console.log('   ❌ Error:', await res.text());
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 2: /retrain
  console.log('2️⃣ Testing /retrain...');
  try {
    const res = await fetch(`${ML_API_URL}/retrain`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000)
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Response:', data);
    } else {
      console.log('   ❌ Error:', await res.text());
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 3: /train
  console.log('3️⃣ Testing /train...');
  try {
    const res = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000)
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Response:', data);
    } else {
      console.log('   ❌ Error:', await res.text());
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
}

testTraining();
