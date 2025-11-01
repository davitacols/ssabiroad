// Test AI Search API endpoint
const fetch = require('node-fetch');

async function testAISearch() {
  console.log('Testing AI Search API...\n');

  const testQueries = [
    'volleyball courts in Lagos',
    'best restaurants in Paris',
    'coffee shops in Tokyo',
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing: "${query}"`);
    console.log('─'.repeat(50));

    try {
      const response = await fetch('https://ssabiroad.vercel.app/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Success! Found ${data.places?.length || 0} places`);
        if (data.places?.[0]) {
          console.log(`\nFirst result:`);
          console.log(`  Name: ${data.places[0].name}`);
          console.log(`  Address: ${data.places[0].address}`);
          console.log(`  Rating: ${data.places[0].rating || 'N/A'}`);
          console.log(`  Status: ${data.places[0].open_now ? 'Open' : 'Closed'}`);
        }
      } else {
        console.log(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test completed!');
}

testAISearch();
