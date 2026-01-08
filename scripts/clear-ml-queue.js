const ML_API_URL = 'http://34.224.33.158:8000';

async function clearQueue() {
  console.log('🗑️  Clearing ML API queue...\n');

  try {
    const res = await fetch(`${ML_API_URL}/clear_queue`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Queue cleared:', data);
    } else {
      console.log('❌ Status:', res.status);
      console.log('Response:', await res.text());
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

clearQueue();
