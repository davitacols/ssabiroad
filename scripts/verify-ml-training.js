const fetch = require('node-fetch');

const ML_API_URL = 'http://34.224.33.158:8000';

async function verifyTraining() {
  console.log('🔍 Verifying ML training data...\n');
  
  try {
    // Check a few sample images
    const samples = [
      { filename: 'Lagos_Island_0_0_0.jpg', expectedLat: 6.4341, expectedLng: 3.3747 },
      { filename: 'Victoria_Island_0_0_0.jpg', expectedLat: 6.4081, expectedLng: 3.4019 },
      { filename: 'Central_Area_Abuja_0_0_0.jpg', expectedLat: 9.0643, expectedLng: 7.4892 }
    ];
    
    for (const sample of samples) {
      const response = await fetch(`${ML_API_URL}/search?query=${sample.filename}`);
      const data = await response.json();
      
      console.log(`\n📍 ${sample.filename}`);
      console.log(`   Expected: ${sample.expectedLat}, ${sample.expectedLng}`);
      console.log(`   Found: ${data.results?.[0]?.metadata || 'No metadata'}`);
    }
    
    // Get index stats
    const statsResponse = await fetch(`${ML_API_URL}/stats`);
    const stats = await statsResponse.json();
    
    console.log('\n📊 ML Index Stats:');
    console.log(`   Total images: ${stats.total_images || 'Unknown'}`);
    console.log(`   With metadata: ${stats.with_metadata || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyTraining();
