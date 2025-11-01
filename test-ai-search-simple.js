const https = require('https');

const query = 'coffee shops in Paris';

const data = JSON.stringify({ query });

const options = {
  hostname: 'ssabiroad.vercel.app',
  path: '/api/ai-search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`Testing: "${query}"\n`);

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('Status:', res.statusCode);
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`\n✅ Found ${result.places?.length || 0} places`);
        if (result.places?.[0]) {
          console.log('\nFirst result:');
          console.log('  Name:', result.places[0].name);
          console.log('  Address:', result.places[0].address);
          console.log('  Rating:', result.places[0].rating || 'N/A');
        }
      } else {
        console.log('\n❌ Error:', result.error);
      }
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
