const https = require('https');

const query = 'gyms in Lagos Nigeria';
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
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log('Status:', res.statusCode);
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.success && result.places) {
      console.log(`\n✅ SUCCESS! Found ${result.places.length} places\n`);
      result.places.slice(0, 3).forEach((place, i) => {
        console.log(`${i + 1}. ${place.name}`);
        console.log(`   ${place.address}`);
        console.log(`   Rating: ${place.rating || 'N/A'} | ${place.open_now ? 'Open' : 'Closed'}`);
        console.log();
      });
    } else {
      console.log('\n❌ Error:', result.error);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
