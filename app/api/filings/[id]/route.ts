import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filing = await prisma.filing.findUnique({
      where: {
        id: params.id,
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
          include: {
            submissions: {
              include: {
                uploadedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                issues: {
                  where: {
                    status: {
                      in: ['OPEN', 'IN_PROGRESS'],
                    },
                  },
                },
              },
              orderBy: {
                version: 'desc',
              },
              take: 1, // Get latest submission
            },
            issues: {
              where: {
                status: {
                  in: ['OPEN', 'IN_PROGRESS'],
                },
              },
            },
            _count: {
              select: {
                issues: true,
                submissions: true,
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!filing) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    // Check if user has access to this filing
    if (filing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate statistics
    const stats = {
      total: filing.requirements.length,
      approved: filing.requirements.filter((r) => r.status === 'APPROVED').length,
      underReview: filing.requirements.filter((r) => r.status === 'UNDER_REVIEW')
        .length,
      needsChanges: filing.requirements.filter((r) => r.status === 'NEEDS_CHANGES')
        .length,
      openIssues: filing.requirements.reduce(
        (sum, r) => sum + r.issues.length,
        0
      ),
      highSeverityIssues: await prisma.issue.count({
        where: {
          requirement: {
            filingId: params.id,
          },
          severity: {
            in: ['HIGH', 'CRITICAL'],
          },
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      }),
    };

    return NextResponse.json({
      ...filing,
      stats,
    });
  } catch (error) {
    console.error('Error fetching filing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filing' },
      { status: 500 }
    );
  }
}

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
    const { status, targetSubmissionDate } = body;

    const filing = await prisma.filing.update({
      where: {
        id: params.id,
      },
      data: {
        ...(status && { status }),
        ...(targetSubmissionDate && {
          targetSubmissionDate: new Date(targetSubmissionDate),
        }),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        filingId: filing.id,
        activityType: 'FILING_STATUS_CHANGED',
        description: `Filing status changed to ${filing.status}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(filing);
  } catch (error) {
    console.error('Error updating filing:', error);
    return NextResponse.json(
      { error: 'Failed to update filing' },
      { status: 500 }
    );
  }
}
