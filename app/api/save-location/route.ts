import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const client = await pool.connect();
    
    try {
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          address TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          confidence DECIMAL(3, 2),
          method VARCHAR(50),
          api_version VARCHAR(10),
          category VARCHAR(100),
          rating DECIMAL(2, 1),
          phone_number VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          nearby_places_count INTEGER DEFAULT 0,
          photos_count INTEGER DEFAULT 0,
          device_make VARCHAR(100),
          device_model VARCHAR(100)
        )
      `);
      
      // Insert location
      const result = await client.query(`
        INSERT INTO locations (
          name, address, latitude, longitude, confidence, method, api_version,
          category, rating, phone_number, nearby_places_count, photos_count,
          device_make, device_model
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        data.name || 'Unknown Location',
        data.address || null,
        data.location?.latitude || null,
        data.location?.longitude || null,
        data.confidence || 0,
        data.method || 'unknown',
        data.apiVersion || 'v1',
        data.category || null,
        data.rating || null,
        data.phoneNumber || null,
        data.nearbyPlaces?.length || 0,
        data.photos?.length || 0,
        data.deviceAnalysis?.camera?.make || null,
        data.deviceAnalysis?.camera?.model || null
      ]);
      
      return NextResponse.json({ 
        success: true, 
        id: result.rows[0].id 
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save location' },
      { status: 500 }
    );
  }
}