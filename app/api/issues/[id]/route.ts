import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canEditIssues } from '@/lib/auth';
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
    const { status, severity, title, description } = body;

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        requirement: {
          include: {
            filing: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if user can edit issues (for certain fields)
    if ((severity || title || description) && !canEditIssues(session.user.role)) {
      return NextResponse.json(
        { error: 'Only lawyers and admins can edit issue details' },
        { status: 403 }
      );
    }

    const updated = await prisma.issue.update({
      where: { id: params.id },
      data: {
        ...(status && {
          status,
          ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
        }),
        ...(severity && { severity }),
        ...(title && { title }),
        ...(description && { description }),
      },
    });

    // Log activity if status changed to resolved
    if (status === 'RESOLVED') {
      await prisma.activityLog.create({
        data: {
          filingId: issue.requirement.filing.id,
          activityType: 'ISSUE_RESOLVED',
          description: `Issue resolved: "${issue.title}"`,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}
