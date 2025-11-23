import { NextRequest, NextResponse } from 'next/server';
import { getCoachRestrictions, addRestriction, removeRestriction } from '@/lib/db/coaches';

// GET /api/coaches/[id]/restrictions - Get coach restrictions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restrictions = await getCoachRestrictions(id);
    return NextResponse.json(restrictions);
  } catch (error) {
    console.error('Error fetching restrictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restrictions' },
      { status: 500 }
    );
  }
}

// POST /api/coaches/[id]/restrictions - Add restriction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, value, isActive = true } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    const success = await addRestriction(id, { type, value, isActive });

    if (!success) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Restriction added successfully' });
  } catch (error) {
    console.error('Error adding restriction:', error);
    return NextResponse.json(
      { error: 'Failed to add restriction' },
      { status: 500 }
    );
  }
}

// DELETE /api/coaches/[id]/restrictions/[restrictionId] - Remove restriction
// Note: This endpoint structure is different - we'll handle it with query params
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const restrictionId = searchParams.get('restrictionId');

    if (!restrictionId) {
      return NextResponse.json(
        { error: 'Restriction ID is required' },
        { status: 400 }
      );
    }

    const success = await removeRestriction(id, restrictionId);

    if (!success) {
      return NextResponse.json(
        { error: 'Restriction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Restriction removed successfully' });
  } catch (error) {
    console.error('Error removing restriction:', error);
    return NextResponse.json(
      { error: 'Failed to remove restriction' },
      { status: 500 }
    );
  }
}
