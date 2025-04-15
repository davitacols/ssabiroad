import { PrismaClient } from "@prisma/client"

// Configure Prisma client with connection pool settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
    // Increase connection timeout and pool settings
    log: ["query", "error", "warn"],
    // @ts-ignore - These are valid Prisma connection options
    __internal: {
      engine: {
        connectionTimeout: 15000, // 15 seconds
        connectionLimit: 10, // Increase from default 5
      },
    },
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

