import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query(`
      SELECT 
        id, name, address, latitude, longitude, confidence, method, api_version as "apiVersion",
        category, rating, phone_number as "phoneNumber", created_at as "createdAt",
        nearby_places_count as "nearbyPlacesCount", photos_count as "photosCount",
        device_make as "deviceMake", device_model as "deviceModel"
      FROM locations 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const location = {
      ...result.rows[0],
      location: result.rows[0].latitude && result.rows[0].longitude ? {
        latitude: result.rows[0].latitude,
        longitude: result.rows[0].longitude
      } : null
    };

    return NextResponse.json(location);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}