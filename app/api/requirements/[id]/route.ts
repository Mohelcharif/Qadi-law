import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canApproveDocuments } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Check if user can approve
    if (status === 'APPROVED' && !canApproveDocuments(session.user.role)) {
      return NextResponse.json(
        { error: 'Only lawyers and admins can approve documents' },
        { status: 403 }
      );
    }

    const requirement = await prisma.documentRequirement.findUnique({
      where: { id: params.id },
      include: { filing: true },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.documentRequirement.update({
      where: { id: params.id },
      data: { status },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        filingId: requirement.filing.id,
        activityType:
          status === 'APPROVED'
            ? 'DOCUMENT_APPROVED'
            : 'REQUIREMENT_STATUS_CHANGED',
        description: `"${requirement.name}" status changed to ${status}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json(
      { error: 'Failed to update requirement' },
      { status: 500 }
    );
  }
}
