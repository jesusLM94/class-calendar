import { NextResponse } from 'next/server';
import { getMondayOfWeek, formatDate } from '@/lib/utils';

// GET /api/current-week - Get Monday of current week
export async function GET() {
  try {
    const monday = getMondayOfWeek();
    const weekStart = formatDate(monday);

    return NextResponse.json({ weekStart });
  } catch (error) {
    console.error('Error getting current week:', error);
    return NextResponse.json(
      { error: 'Failed to get current week' },
      { status: 500 }
    );
  }
}
