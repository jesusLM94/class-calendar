import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET /api/health - Health check
export async function GET() {
  try {
    // Test database connection
    const db = await getDatabase();
    await db.command({ ping: 1 });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
