import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots, setAvailableSlots } from '@/lib/db/schedules';

// GET /api/schedules/[weekStart] - Get available slots for week
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  try {
    const { weekStart } = await params;
    const slots = await getAvailableSlots(weekStart);
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching schedule slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule slots' },
      { status: 500 }
    );
  }
}

// POST /api/schedules/[weekStart] - Set available slots for week
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  try {
    const { weekStart } = await params;
    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: 'Schedules array is required' },
        { status: 400 }
      );
    }

    const success = await setAvailableSlots(weekStart, schedules);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Schedules saved successfully',
      weekStart,
    });
  } catch (error) {
    console.error('Error saving schedule slots:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule slots' },
      { status: 500 }
    );
  }
}
