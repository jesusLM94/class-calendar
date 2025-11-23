import { NextRequest, NextResponse } from 'next/server';
import { getCoachById, updateCoach, deleteCoach } from '@/lib/db/coaches';

// GET /api/coaches/[id] - Get single coach
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coach = await getCoachById(id);

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...coach,
      id: coach._id?.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach' },
      { status: 500 }
    );
  }
}

// PUT /api/coaches/[id] - Update coach
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const success = await updateCoach(
      id,
      name,
      specialties,
      Object.keys(filteredQuotas || {}).length > 0 ? filteredQuotas : undefined
    );

    if (!success) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    return NextResponse.json({
      id,
      name,
      specialties,
      weeklyQuotas: filteredQuotas,
    });
  } catch (error) {
    console.error('Error updating coach:', error);
    return NextResponse.json(
      { error: 'Failed to update coach' },
      { status: 500 }
    );
  }
}

// DELETE /api/coaches/[id] - Delete coach
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteCoach(id);

    if (!success) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Coach deleted successfully' });
  } catch (error) {
    console.error('Error deleting coach:', error);
    return NextResponse.json(
      { error: 'Failed to delete coach' },
      { status: 500 }
    );
  }
}
