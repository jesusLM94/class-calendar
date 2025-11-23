import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedSchedule, updateGeneratedSchedule } from '@/lib/db/schedules';

// GET /api/generated/[weekStart] - Get generated schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  try {
    const { weekStart } = await params;
    const schedule = await getGeneratedSchedule(weekStart);

    if (!schedule) {
      return NextResponse.json({ schedule: [] });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching generated schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated schedule' },
      { status: 500 }
    );
  }
}

// PUT /api/generated/[weekStart] - Update generated schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  try {
    const { weekStart } = await params;
    const body = await request.json();
    const { schedule } = body;

    if (!schedule || !Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'Schedule array is required' },
        { status: 400 }
      );
    }

    const success = await updateGeneratedSchedule(weekStart, schedule);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Schedule updated successfully',
      weekStart,
    });
  } catch (error) {
    console.error('Error updating generated schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update generated schedule' },
      { status: 500 }
    );
  }
}
