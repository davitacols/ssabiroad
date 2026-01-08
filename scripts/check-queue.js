const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQueue() {
  try {
    const pending = await prisma.trainingQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('PENDING items:', pending.length);
    pending.forEach((item, i) => {
      console.log(`${i+1}. ${item.address} - ${item.status} - ${item.createdAt}`);
    });

    const all = await prisma.trainingQueue.count();
    console.log('\nTotal in queue:', all);

    const byStatus = await prisma.trainingQueue.groupBy({
      by: ['status'],
      _count: true
    });
    console.log('\nBy status:', byStatus);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueue();
