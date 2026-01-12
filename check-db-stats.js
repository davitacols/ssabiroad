const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStats() {
  try {
    console.log('📊 Database Statistics\n');
    console.log('='.repeat(50));

    const users = await prisma.user.count();
    console.log(`👥 Users: ${users}`);

    const locations = await prisma.location.count();
    console.log(`📍 Locations: ${locations}`);

    const recognitions = await prisma.location_recognitions.count();
    console.log(`🔍 Location Recognitions: ${recognitions}`);

    const feedback = await prisma.location_feedback.count();
    console.log(`💬 Location Feedback: ${feedback}`);

    let savedLocations = 0;
    try {
      savedLocations = await prisma.saved_location.count();
      console.log(`⭐ Saved Locations: ${savedLocations}`);
    } catch (e) {
      console.log(`⭐ Saved Locations: N/A`);
    }

    let detections = 0;
    try {
      detections = await prisma.detection.count();
      console.log(`🎯 Detections: ${detections}`);
    } catch (e) {
      console.log(`🎯 Detections: N/A`);
    }

    let buildings = 0;
    try {
      buildings = await prisma.building.count();
      console.log(`🏢 Buildings: ${buildings}`);
    } catch (e) {
      console.log(`🏢 Buildings: N/A`);
    }

    let comparisons = 0;
    try {
      comparisons = await prisma.comparison.count();
      console.log(`⚖️  Comparisons: ${comparisons}`);
    } catch (e) {
      console.log(`⚖️  Comparisons: N/A`);
    }

    console.log('='.repeat(50));
    console.log(`\n✅ Total Records: ${users + locations + recognitions + feedback + savedLocations + detections + buildings + comparisons}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStats();
