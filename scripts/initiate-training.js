const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initiateTraining() {
  try {
    console.log('\n🚀 Initiating ML Training...\n');
    
    // Get READY training data
    const readyData = await prisma.trainingQueue.findMany({
      where: { status: 'READY' },
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${readyData.length} READY training samples\n`);
    
    if (readyData.length === 0) {
      console.log('❌ No training data available. Upload some images first.');
      return;
    }
    
    // Update status to SENT
    const updateResult = await prisma.trainingQueue.updateMany({
      where: { status: 'READY' },
      data: { status: 'SENT' }
    });
    
    console.log(`✅ Marked ${updateResult.count} samples as SENT\n`);
    
    // Display training data summary
    console.log('Training data prepared:');
    readyData.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.address}`);
      console.log(`     Coords: (${item.latitude}, ${item.longitude})`);
      console.log(`     Image: ${item.imageUrl ? 'Available' : 'Missing'}`);
    });
    
    console.log('\n📊 Training Summary:');
    console.log(`   Total samples: ${readyData.length}`);
    console.log(`   Status: Ready for ML training`);
    console.log(`   Next step: ML model will process these samples`);
    
    console.log('\n✅ Training initiated successfully!');
    console.log('Note: ML API is currently disabled. Enable it in .env.local to complete training.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initiateTraining();
