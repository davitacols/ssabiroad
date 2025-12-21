// Clear ML Training Queue
const http = require('http');

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

async function clearQueue() {
  console.log('🗑️  Clearing ML training queue...\n');
  
  const endpoints = ['/clear_queue', '/queue/clear', '/reset_queue', '/clear'];
  
  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint, ML_API_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || 8000,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
      
      const result = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true, endpoint, data });
            } else {
              resolve({ success: false, endpoint });
            }
          });
        });
        req.on('error', reject);
        req.end();
      });
      
      if (result.success) {
        console.log(`✅ Queue cleared via ${endpoint}`);
        console.log(`📊 Response:`, result.data);
        return;
      }
      
    } catch (err) {
      console.log(`❌ ${endpoint} failed:`, err.message);
    }
  }
  
  console.log('\n⚠️  No clear endpoint found. Queue must be cleared manually on ML server.');
  console.log('💡 You can SSH to the server and delete the queue files or restart the service.');
}

clearQueue().catch(console.error);
