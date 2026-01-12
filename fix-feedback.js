const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingFeedback() {
  console.log('Updating existing feedback records...\n');

  // Update all feedback where wasCorrect is true to also set is_correct
  const result = await prisma.location_feedback.updateMany({
    where: {
      wasCorrect: true
    },
    data: {
      is_correct: true
    }
  });

  console.log(`Updated ${result.count} feedback records with is_correct = true`);

  // Show stats
  const stats = await prisma.location_feedback.groupBy({
    by: ['is_correct', 'wasCorrect'],
    _count: true
  });

  console.log('\nFeedback Statistics:');
  stats.forEach(stat => {
    console.log(`  is_correct: ${stat.is_correct}, wasCorrect: ${stat.wasCorrect}, count: ${stat._count}`);
  });

  await prisma.$disconnect();
}

fixExistingFeedback().catch(console.error);
