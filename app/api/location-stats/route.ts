import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET() {
  try {
    const client = await pool.connect();
    
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
      
      return NextResponse.json({
        totalLocations: parseInt(stats.total_locations),
        v1Count: parseInt(stats.v1_count),
        v2Count: parseInt(stats.v2_count),
        avgConfidence: parseFloat(stats.avg_confidence) || 0,
        todayCount: parseInt(stats.today_count),
        weekCount: parseInt(stats.week_count),
        methods: methodsResult.rows,
        topDevices: devicesResult.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}