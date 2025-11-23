import { NextRequest, NextResponse } from 'next/server';
import { getScheduleHistory } from '@/lib/db/history';

// GET /api/history - Get schedule history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '6');

    const history = await getScheduleHistory(weeks);

    // Convert MongoDB _id to string for client
    const clientHistory = history.map((assignment) => ({
      ...assignment,
      id: assignment._id?.toString(),
      _id: undefined,
    }));

    return NextResponse.json(clientHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
