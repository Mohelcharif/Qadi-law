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

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const requirementId = searchParams.get('requirementId');

    const issues = await prisma.issue.findMany({
      where: {
        requirement: {
          filingId: params.id,
        },
        ...(severity && { severity: severity as any }),
        ...(status && { status: status as any }),
        ...(requirementId && { requirementId }),
      },
      include: {
        requirement: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        submission: {
          select: {
            id: true,
            fileName: true,
            version: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requirementId, title, description, severity, isRFI } = body;

    const issue = await prisma.issue.create({
      data: {
        requirementId,
        title,
        description,
        severity,
        isRFI: isRFI || false,
        source: 'MANUAL_REVIEW',
        status: 'OPEN',
        createdById: session.user.id,
      },
      include: {
        requirement: {
          select: {
            id: true,
            name: true,
            filing: true,
          },
        },
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
        filingId: params.id,
        activityType: isRFI ? 'RFI_SENT' : 'ISSUE_CREATED',
        description: `${isRFI ? 'RFI' : 'Issue'} created: "${title}"`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
