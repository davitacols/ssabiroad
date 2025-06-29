import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST() {
  try {
    await pool.query(`
      ALTER TABLE locations 
      ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true
    `);

    await pool.query(`
      UPDATE locations 
      SET success = true 
      WHERE success IS NULL
    `);

    return NextResponse.json({ message: 'Success column added' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to add column' }, { status: 500 });
  }
}