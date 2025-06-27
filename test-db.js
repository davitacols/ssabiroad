// Set environment variables manually for testing
process.env.POSTGRES_PRISMA_URL = "postgresql://neondb_owner:npg_VtY2S4DcziOR@ep-red-feather-a51gsrxj-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.POSTGRES_URL_NON_POOLING = "postgresql://neondb_owner:npg_VtY2S4DcziOR@ep-red-feather-a51gsrxj.us-east-2.aws.neon.tech/neondb?sslmode=require";

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Total users: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();