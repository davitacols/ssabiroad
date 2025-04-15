import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL
      }
    },
    // Use the correct connection pool options if needed
    // connection: {
    //   pool: {
    //     max: 10,
    //     idle: 10000, // 10 seconds
    //     acquire: 60000, // 60 seconds
    //   }
    // }
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;