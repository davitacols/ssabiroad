import { PrismaClient } from '@prisma/client';

class DatabaseConnection {
  private static instance: PrismaClient;
  
  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
          }
        }
      });
    }
    return DatabaseConnection.instance;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Test basic query
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database query test passed');
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
    }
  }
}

export default DatabaseConnection;