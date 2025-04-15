import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Explicitly handle connection errors
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to the database")
  })
  .catch((e) => {
    console.error("Failed to connect to the database", e)
  })

// Add a shutdown hook to properly close the connection
process.on("beforeExit", async () => {
  await prisma.$disconnect()
})

export default prisma

