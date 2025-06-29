import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    await pool.query(`
      ALTER TABLE locations 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS opening_hours JSONB,
      ADD COLUMN IF NOT EXISTS price_level INTEGER,
      ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true
    `);

    await pool.query(`
      UPDATE locations 
      SET success = true 
      WHERE success IS NULL
    `);

    return NextResponse.json({ message: 'Columns added successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to add columns' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}