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

    const result = await pool.query(`
      SELECT 
        id, name, address, latitude, longitude, confidence, method, api_version as "apiVersion",
        category, rating, phone_number as "phoneNumber", created_at as "createdAt",
        nearby_places_count as "nearbyPlacesCount", photos_count as "photosCount",
        device_make as "deviceMake", device_model as "deviceModel"
      FROM locations 
      ORDER BY created_at DESC 
      LIMIT $1
    `, [limit]);

    // Format location object for each result
    const formattedResults = result.rows.map(row => ({
      ...row,
      location: row.latitude && row.longitude ? {
        latitude: row.latitude,
        longitude: row.longitude
      } : null
    }));

    return NextResponse.json({
      locations: formattedResults,
      total: formattedResults.length
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved locations' }, { status: 500 });
  }
}