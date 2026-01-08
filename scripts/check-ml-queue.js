const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

async function checkMLAPI() {
  console.log('🔍 Checking ML API Queue System\n');
  console.log('API URL:', ML_API_URL);
  console.log('');

  // 1. Check training queue
  console.log('1️⃣ Checking /training_queue endpoint...');
  try {
    const res = await fetch(`${ML_API_URL}/training_queue`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('   Error:', await res.text());
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // 2. Check if there's a different queue endpoint
  console.log('2️⃣ Checking /queue endpoint...');
  try {
    const res = await fetch(`${ML_API_URL}/queue`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // 3. Check feedback endpoint
  console.log('3️⃣ Checking /feedback endpoint (GET)...');
  try {
    const res = await fetch(`${ML_API_URL}/feedback`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // 4. List all available endpoints
  console.log('4️⃣ Checking root endpoint for API info...');
  try {
    const res = await fetch(`${ML_API_URL}/`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // 5. Check docs endpoint
  console.log('5️⃣ Checking /docs endpoint...');
  try {
    const res = await fetch(`${ML_API_URL}/docs`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log('   Status:', res.status);
    console.log('   Available at: http://34.224.33.158:8000/docs');
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n📊 Summary:');
  console.log('The ML API queue might be stored in memory or a separate database.');
  console.log('Items sent via /train or /feedback endpoints may not persist across restarts.');
  console.log('Consider checking EC2 server logs for queue storage location.');
}

checkMLAPI().catch(console.error);
