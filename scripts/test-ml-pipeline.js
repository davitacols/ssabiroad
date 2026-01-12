const fetch = require('node-fetch');

const ML_URL = 'http://localhost:8000';

async function testCompletePipeline() {
  console.log('🧪 Testing Complete ML Training Pipeline\n');
  
  try {
    // 1. Check service health
    console.log('1️⃣ Checking ML service health...');
    const healthRes = await fetch(`${ML_URL}/health`);
    if (!healthRes.ok) {
      console.log('❌ ML service is not running');
      return;
    }
    const health = await healthRes.json();
    console.log('✅ Service healthy');
    console.log(`   Vectors in DB: ${health.vectors_in_db}\n`);
    
    // 2. Get training stats
    console.log('2️⃣ Getting training statistics...');
    const statsRes = await fetch(`${ML_URL}/stats`);
    const stats = await statsRes.json();
    console.log('✅ Stats retrieved');
    console.log(`   Total recognitions: ${stats.total_recognitions}`);
    console.log(`   Verified feedback: ${stats.verified_feedback}`);
    console.log(`   Vectors in Pinecone: ${stats.vectors_in_pinecone}`);
    console.log(`   Ready for training: ${stats.ready_for_training}\n`);
    
    // 3. Run sync training
    console.log('3️⃣ Running sync-training (downloading images, generating embeddings)...');
    const syncRes = await fetch(`${ML_URL}/sync-training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (syncRes.ok) {
      const result = await syncRes.json();
      console.log('✅ Sync completed!');
      console.log(`   Synced: ${result.synced}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Message: ${result.message}\n`);
    } else {
      const error = await syncRes.text();
      console.log('❌ Sync failed:', error);
      return;
    }
    
    // 4. Check updated stats
    console.log('4️⃣ Checking updated statistics...');
    const statsRes2 = await fetch(`${ML_URL}/stats`);
    const stats2 = await statsRes2.json();
    console.log('✅ Updated stats:');
    console.log(`   Vectors in Pinecone: ${stats2.vectors_in_pinecone}`);
    console.log(`   Ready for training: ${stats2.ready_for_training}\n`);
    
    console.log('🎉 Pipeline test complete!');
    console.log('\n📝 Next steps:');
    console.log('   - Test /predict endpoint with a location image');
    console.log('   - Monitor prediction accuracy');
    console.log('   - Add more training data as users provide feedback');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCompletePipeline();
