import { NextResponse } from 'next/server';
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
      const result = await client.query('SELECT COUNT(*) as count FROM locations');
      const sampleData = await client.query('SELECT id, name, address, created_at FROM locations ORDER BY created_at DESC LIMIT 5');
      
      return NextResponse.json({
        success: true,
        totalLocations: parseInt(result.rows[0].count),
        sampleData: sampleData.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}