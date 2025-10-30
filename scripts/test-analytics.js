const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    console.log('Testing database queries...\n');

    const totalLocations = await prisma.location.count();
    console.log('Total Locations:', totalLocations);

    const totalUsers = await prisma.user.count();
    console.log('Total Users:', totalUsers);

    const totalBookmarks = await prisma.bookmark.count();
    console.log('Total Bookmarks:', totalBookmarks);

    const geofences = await prisma.geofence.count();
    console.log('Total Geofences:', geofences);

    console.log('\nSample locations:');
    const sampleLocations = await prisma.location.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        userId: true,
        createdAt: true
      }
    });
    console.log(JSON.stringify(sampleLocations, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();
