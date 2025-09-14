import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(request: NextRequest) {
  console.log('Location stats API called');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    console.log('Connecting to database...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    try {
      // Get overall stats
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total_locations,
          COUNT(CASE WHEN api_version = 'v1' THEN 1 END) as v1_count,
          COUNT(CASE WHEN api_version = 'v2' THEN 1 END) as v2_count,
          AVG(confidence) as avg_confidence,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today_count,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_count
        FROM locations
      `);
      
      // Get method breakdown
      const methodsResult = await client.query(`
        SELECT method, COUNT(*) as count
        FROM locations
        GROUP BY method
        ORDER BY count DESC
      `);
      
      // Get device stats
      const devicesResult = await client.query(`
        SELECT 
          device_make,
          device_model,
          COUNT(*) as count
        FROM locations
        WHERE device_make IS NOT NULL
        GROUP BY device_make, device_model
        ORDER BY count DESC
        LIMIT 10
      `);
      
      const stats = statsResult.rows[0];
      
      const response = {
        totalLocations: parseInt(stats.total_locations),
        v1Count: parseInt(stats.v1_count),
        v2Count: parseInt(stats.v2_count),
        avgConfidence: parseFloat(stats.avg_confidence) || 0,
        todayCount: parseInt(stats.today_count),
        weekCount: parseInt(stats.week_count),
        methods: methodsResult.rows,
        topDevices: devicesResult.rows
      };
      
      console.log('Returning stats response:', response);
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}