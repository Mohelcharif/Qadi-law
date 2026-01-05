import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filings = await prisma.filing.findMany({
      where: {
        organizationId: session.user.organizationId!,
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        requirements: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            requirements: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress for each filing
    const filingsWithProgress = filings.map((filing) => {
      const total = filing._count.requirements;
      const approved = filing.requirements.filter(
        (r) => r.status === 'APPROVED'
      ).length;

      return {
        ...filing,
        progress: {
          total,
          approved,
          percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
        },
      };
    });

    return NextResponse.json(filingsWithProgress);
  } catch (error) {
    console.error('Error fetching filings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, targetSubmissionDate } = body;

    const filing = await prisma.filing.create({
      data: {
        name,
        description,
        targetSubmissionDate: targetSubmissionDate
          ? new Date(targetSubmissionDate)
          : null,
        organizationId: session.user.organizationId!,
        createdById: session.user.id,
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        filingId: filing.id,
        activityType: 'FILING_CREATED',
        description: `Filing "${filing.name}" created`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(filing, { status: 201 });
  } catch (error) {
    console.error('Error creating filing:', error);
    return NextResponse.json(
      { error: 'Failed to create filing' },
      { status: 500 }
    );
  }
}
