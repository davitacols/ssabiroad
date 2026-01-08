const ML_API_URL = 'http://34.224.33.158:8000';

async function checkLogs() {
  console.log('📋 Checking ML API for error details\n');

  // Check if there's a logs or status endpoint
  const endpoints = ['/logs', '/status', '/error', '/debug', '/info'];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${ML_API_URL}${endpoint}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        console.log(`✅ ${endpoint}:`, await res.json());
      }
    } catch (err) {
      // Skip
    }
  }

  // Check queue details
  console.log('\n📊 Queue details:');
  const queueRes = await fetch(`${ML_API_URL}/training_queue`);
  const queue = await queueRes.json();
  
  console.log('Total items:', queue.total);
  console.log('Has images:', queue.queue?.filter(i => i.image_path).length || 0);
  console.log('No images:', queue.queue?.filter(i => !i.image_path || i.image_path === '').length || 0);
  
  if (queue.queue?.[0]) {
    console.log('\nSample item:', JSON.stringify(queue.queue[0], null, 2));
  }
}

checkLogs();
