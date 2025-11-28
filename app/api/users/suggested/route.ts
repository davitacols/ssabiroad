import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        BlogPost: { some: { published: true } }
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        _count: { select: { BlogPost: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json([], { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
