import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const width = searchParams.get("width") || "800";
  const height = searchParams.get("height") || "600";
  const text = searchParams.get("text") || "Placeholder";

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="lightgray"/>
      <text x="50%" y="50%" font-size="24" font-family="Arial" text-anchor="middle" fill="black" dy=".3em">${text}</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
