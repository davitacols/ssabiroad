import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(request: NextRequest) {
  try {
    console.log('Recent locations API called');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    const client = await pool.connect();
    console.log('Database connected for recent locations');
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          name,
          address,
          latitude,
          longitude,
          confidence,
          method,
          api_version,
          category,
          rating,
          phone_number,
          created_at,
          nearby_places_count,
          photos_count,
          device_make,
          device_model
        FROM locations
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);
      
      const locations = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        address: row.address,
        location: row.latitude && row.longitude ? {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        } : null,
        confidence: parseFloat(row.confidence),
        method: row.method,
        apiVersion: row.api_version,
        category: row.category,
        rating: row.rating ? parseFloat(row.rating) : null,
        phoneNumber: row.phone_number,
        createdAt: row.created_at,
        nearbyPlacesCount: row.nearby_places_count,
        photosCount: row.photos_count,
        deviceMake: row.device_make,
        deviceModel: row.device_model
      }));
      
      return NextResponse.json({ locations }, {
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
    console.error('Recent locations database error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code
    });
    return NextResponse.json(
      { error: 'Failed to fetch recent locations', details: error.message },
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