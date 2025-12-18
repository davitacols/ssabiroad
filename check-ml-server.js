// Quick ML server health check
const ML_URL = 'http://34.224.33.158:8000';

async function checkServer() {
  console.log(`Checking ML server at ${ML_URL}...`);
  
  try {
    const response = await fetch(ML_URL, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    console.log('✅ ML Server is ONLINE:', data);
  } catch (error) {
    console.log('❌ ML Server is OFFLINE:', error.message);
    console.log('\nTo fix:');
    console.log('1. SSH into EC2: ssh -i your-key.pem ec2-user@34.224.33.158');
    console.log('2. Start server: cd ml-models/api && python main.py');
    console.log('3. Or use PM2: pm2 start main.py --name navisense');
  }
}

checkServer();
