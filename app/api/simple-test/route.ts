export async function GET() {
  return Response.json({
    success: true,
    message: 'Test endpoint working',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return Response.json({
    success: true,
    method: 'POST',
    message: 'POST test working'
  });
}