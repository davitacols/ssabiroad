const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  const ready = await prisma.trainingQueue.count({ where: { status: 'READY' } });
  const sent = await prisma.trainingQueue.count({ where: { status: 'SENT' } });
  const pending = await prisma.trainingQueue.count({ where: { status: 'PENDING' } });
  const failed = await prisma.trainingQueue.count({ where: { status: 'FAILED' } });
  
  console.log('Status counts:');
  console.log('  READY:', ready);
  console.log('  SENT:', sent);
  console.log('  PENDING:', pending);
  console.log('  FAILED:', failed);
  
  if (ready > 0) {
    const sample = await prisma.trainingQueue.findFirst({ where: { status: 'READY' } });
    console.log('\nSample READY item:');
    console.log('  Has image:', !!sample.error);
    console.log('  Image size:', sample.error?.length || 0);
  }
  
  await prisma.$disconnect();
}

checkStatus();
