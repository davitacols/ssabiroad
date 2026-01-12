const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReadyForTraining() {
  console.log('🔍 Checking verified locations ready for training...\n');
  
  try {
    // Get all verified feedback
    const verifiedFeedback = await prisma.location_feedback.findMany({
      where: { wasCorrect: true },
      include: {
        location_recognitions: true
      }
    });
    
    console.log(`📊 Total verified feedback: ${verifiedFeedback.length}\n`);
    
    let withImages = 0;
    let withoutImages = 0;
    
    console.log('Breakdown:');
    verifiedFeedback.forEach((feedback, index) => {
      const recognition = feedback.location_recognitions;
      if (recognition.imageUrl) {
        withImages++;
        console.log(`✅ ${index + 1}. Has image: ${recognition.businessName || recognition.detectedAddress || 'Unknown'}`);
      } else {
        withoutImages++;
        console.log(`❌ ${index + 1}. No image: ${recognition.businessName || recognition.detectedAddress || 'Unknown'}`);
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   With images: ${withImages} (can be trained)`);
    console.log(`   Without images: ${withoutImages} (cannot be trained)`);
    console.log(`\n💡 Only locations with imageUrl can be trained by the ML model.`);
    
    if (withImages > 2) {
      console.log(`\n🎯 You have ${withImages - 2} more locations that can be trained!`);
      console.log(`   Run: node scripts\\sync-training.js`);
    } else {
      console.log(`\n✅ All locations with images are already trained!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkReadyForTraining();
