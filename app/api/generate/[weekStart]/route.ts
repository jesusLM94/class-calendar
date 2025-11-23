import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots, saveGeneratedSchedule, Assignment } from '@/lib/db/schedules';
import { saveAssignmentsToHistory } from '@/lib/db/history';
import { getAllCoaches } from '@/lib/db/coaches';
import { ScheduleGenerator } from '@/lib/scheduleGenerator';

// POST /api/generate/[weekStart] - Generate schedule for week
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  try {
    const { weekStart } = await params;
    // Get available slots for the week
    const availableSlots = await getAvailableSlots(weekStart);

    if (!availableSlots || availableSlots.length === 0) {
      return NextResponse.json(
        { error: 'No available slots configured for this week' },
        { status: 400 }
      );
    }

    // Generate the schedule
    const generator = new ScheduleGenerator();
    const schedule = await generator.generateWeekSchedule(weekStart, availableSlots);

    // Validate the schedule
    const validation = generator.validateSchedule(schedule);

    // Calculate quota statistics
    const coaches = await getAllCoaches();
    const quotaStats = generator.calculateQuotaStats(schedule, coaches);

    // Save the generated schedule
    await saveGeneratedSchedule(weekStart, schedule);

    // Save to history
    await saveAssignmentsToHistory(weekStart, schedule);

    return NextResponse.json({
      schedule,
      validation,
      quotaStats,
      weekStart,
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
