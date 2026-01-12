const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTrainingData() {
  try {
    // Count total training queue entries
    const totalCount = await prisma.trainingQueue.count();
    
    // Count by status
    const statusCounts = await prisma.trainingQueue.groupBy({
      by: ['status'],
      _count: true
    });
    
    // Count location recognitions (successful detections)
    const recognitionCount = await prisma.location_recognitions.count();
    
    console.log('\n=== Training Data Summary ===\n');
    console.log(`Total training queue entries: ${totalCount}`);
    console.log(`\nBy status:`);
    statusCounts.forEach(s => {
      console.log(`  ${s.status}: ${s._count}`);
    });
    console.log(`\nSuccessful location recognitions: ${recognitionCount}`);
    
    // Get sample of recent entries
    const recentEntries = await prisma.trainingQueue.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        address: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`\nRecent entries:`);
    recentEntries.forEach(e => {
      console.log(`  ${e.createdAt.toISOString()} - ${e.status} - ${e.address}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainingData();
