const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addAvatarField() {
  try {
    console.log('Adding avatar field to User table...')
    
    // This will be handled by Prisma schema, just test the connection
    const users = await prisma.user.findMany({ take: 1 })
    console.log('✅ Database connection successful')
    console.log('Run: npx prisma db push')
    console.log('This will add the avatar field to the database')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addAvatarField()
