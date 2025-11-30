import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendNewPostEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        createdAt: { gte: yesterday }
      },
      include: { author: true },
      orderBy: { createdAt: "desc" }
    });

    if (newPosts.length === 0) {
      return NextResponse.json({ message: "No new posts to send" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        AND: [
          {
            OR: [
              { emailNotifications: true },
              { emailNotifications: null }
            ]
          },
          {
            OR: [
              { lastEmailSent: null },
              { lastEmailSent: { lt: today } }
            ]
          }
        ]
      }
    });

    let sentCount = 0;

    for (const user of users) {
      for (const post of newPosts) {
        try {
          await sendNewPostEmail(user.email, user.name || "Reader", {
            title: post.title,
            excerpt: post.excerpt,
            slug: post.slug,
            coverImage: post.coverImage || undefined
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastEmailSent: new Date() }
      });
    }

    return NextResponse.json({
      message: "Daily post emails sent",
      sentCount,
      postsCount: newPosts.length,
      usersCount: users.length
    });
  } catch (error) {
    console.error("Error sending daily posts:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
