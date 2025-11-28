import { NextResponse } from "next/server";
import { sendNewPostEmail } from "@/lib/email";

export async function GET() {
  try {
    const result = await sendNewPostEmail(
      "davitacols@gmail.com",
      "David",
      {
        title: "Discover the Future of Location Technology with Pic2Nav",
        excerpt: "Learn how Pic2Nav uses advanced AI and computer vision to identify exact locations from building photos. Explore the technology behind smart navigation and location intelligence.",
        slug: "discover-future-location-technology",
        coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800"
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
