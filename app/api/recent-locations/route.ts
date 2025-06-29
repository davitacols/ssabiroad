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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const client = await pool.connect();
    
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
      
      return NextResponse.json({ locations });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent locations' },
      { status: 500 }
    );
  }
}