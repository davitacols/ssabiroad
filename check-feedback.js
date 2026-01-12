const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFeedback() {
  const feedback = await prisma.location_feedback.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('Recent feedback:');
  feedback.forEach(f => {
    console.log({
      id: f.id.substring(0, 8),
      recognitionId: f.recognitionId.substring(0, 8),
      wasCorrect: f.wasCorrect,
      hasLocation: !!(f.correctLat && f.correctLng),
      address: f.correctAddress
    });
  });

  await prisma.$disconnect();
}

checkFeedback();
