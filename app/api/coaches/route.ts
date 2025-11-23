import { NextRequest, NextResponse } from 'next/server';
import { getAllCoaches, createCoach } from '@/lib/db/coaches';

// GET /api/coaches - Get all coaches
export async function GET() {
  try {
    const coaches = await getAllCoaches();

    // Convert MongoDB _id to string id for client
    const clientCoaches = coaches.map((coach) => ({
      ...coach,
      id: coach._id?.toString(),
      _id: undefined,
    }));

    return NextResponse.json(clientCoaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}

// POST /api/coaches - Create new coach
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, specialties, weeklyQuotas } = body;

    if (!name || !specialties || !Array.isArray(specialties)) {
      return NextResponse.json(
        { error: 'Name and specialties array are required' },
        { status: 400 }
      );
    }

    // Filter out zero values from weeklyQuotas
    const filteredQuotas = weeklyQuotas ? {
      ...(weeklyQuotas.power > 0 && { power: weeklyQuotas.power }),
      ...(weeklyQuotas.cycling > 0 && { cycling: weeklyQuotas.cycling }),
    } : undefined;

    const newCoach = await createCoach(
      name,
      specialties,
      Object.keys(filteredQuotas || {}).length > 0 ? filteredQuotas : undefined
    );

    return NextResponse.json({
      ...newCoach,
      id: newCoach._id?.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error creating coach:', error);
    return NextResponse.json(
      { error: 'Failed to create coach' },
      { status: 500 }
    );
  }
}
