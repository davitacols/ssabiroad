const fetch = require('node-fetch');

async function verifyVectors() {
  console.log('🔍 Verifying vectors in Pinecone...\n');
  
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    
    console.log('✅ ML Service Status:');
    console.log(`   Status: ${data.status}`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Device: ${data.device}`);
    console.log(`   Vectors in DB: ${data.vectors_in_db}`);
    
    if (data.vectors_in_db > 0) {
      console.log('\n🎉 SUCCESS! Vectors are stored in Pinecone!');
      console.log(`\n📊 Your ML model now has ${data.vectors_in_db} location(s) trained.`);
      console.log('\n✨ The model can now:');
      console.log('   - Recognize similar locations from images');
      console.log('   - Provide location predictions with confidence scores');
      console.log('   - Improve as more feedback is added');
      console.log('\n📝 Next: Test prediction with an image');
      console.log('   curl -X POST -F "file=@image.jpg" http://localhost:8000/predict');
    } else {
      console.log('\n⚠️  No vectors found. Run sync-training again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyVectors();
