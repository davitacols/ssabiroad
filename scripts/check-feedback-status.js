const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFeedbackStatus() {
  console.log('🔍 Checking feedback and training queue status...\n');

  try {
    // Check location_feedback table
    const feedbackCount = await prisma.location_feedback.count();
    console.log('📊 Location Feedback Table:');
    console.log('   Total entries:', feedbackCount);
    
    if (feedbackCount > 0) {
      const recentFeedback = await prisma.location_feedback.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('   Recent feedback:');
      recentFeedback.forEach((f, i) => {
        console.log(`   ${i+1}. ID: ${f.id}, Lat: ${f.correctLat}, Lng: ${f.correctLng}, Address: ${f.correctAddress}`);
      });
    }
    console.log('');

    // Check TrainingQueue table
    const queueCount = await prisma.trainingQueue.count();
    console.log('📊 Training Queue Table:');
    console.log('   Total entries:', queueCount);
    
    const pendingCount = await prisma.trainingQueue.count({
      where: { status: 'PENDING' }
    });
    console.log('   Pending entries:', pendingCount);
    
    if (queueCount > 0) {
      const recentQueue = await prisma.trainingQueue.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('   Recent queue items:');
      recentQueue.forEach((q, i) => {
        console.log(`   ${i+1}. Status: ${q.status}, Lat: ${q.latitude}, Lng: ${q.longitude}, Address: ${q.address}`);
      });
    }
    console.log('');

    // Check if feedback has corresponding queue entries
    if (feedbackCount > 0 && queueCount === 0) {
      console.log('⚠️  WARNING: Feedback exists but training queue is empty!');
      console.log('   This means feedback is not being added to the training queue.');
    } else if (feedbackCount > 0 && queueCount > 0) {
      console.log('✅ Both feedback and training queue have entries.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeedbackStatus();
