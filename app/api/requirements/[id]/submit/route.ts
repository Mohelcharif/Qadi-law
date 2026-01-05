import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { coddyAI } from '@/lib/coddy-ai';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get the requirement
    const requirement = await prisma.documentRequirement.findUnique({
      where: { id: params.id },
      include: {
        filing: true,
        submissions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (requirement.filing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In a real app, upload to S3/storage
    // For now, we'll just simulate with a fake URL
    const fileUrl = `/uploads/${Date.now()}-${file.name}`;
    const nextVersion =
      requirement.submissions.length > 0
        ? requirement.submissions[0].version + 1
        : 1;

    // Create submission
    const submission = await prisma.documentSubmission.create({
      data: {
        requirementId: params.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        version: nextVersion,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update requirement status
    await prisma.documentRequirement.update({
      where: { id: params.id },
      data: {
        status: 'UNDER_REVIEW',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        filingId: requirement.filing.id,
        activityType: 'DOCUMENT_UPLOADED',
        description: `Document uploaded for "${requirement.name}" (v${nextVersion})`,
        userId: session.user.id,
      },
    });

    // Run AI analysis in the background (simulate)
    try {
      const analysis = await coddyAI.analyzeDocument(fileUrl, {
        requirementName: requirement.name,
        requirementDescription: requirement.description || '',
        category: requirement.category,
      });

      // Update submission with AI results
      await prisma.documentSubmission.update({
        where: { id: submission.id },
        data: {
          aiAnalyzed: true,
          aiSummary: analysis.summary,
          aiExtractedData: analysis.extractedFields as any,
        },
      });

      // Create AI-generated issues
      for (const aiIssue of analysis.issues) {
        await prisma.issue.create({
          data: {
            requirementId: params.id,
            submissionId: submission.id,
            title: aiIssue.title,
            description: aiIssue.description,
            severity: aiIssue.severity,
            status: 'OPEN',
            source: 'AI_ANALYSIS',
          },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          filingId: requirement.filing.id,
          activityType: 'ISSUE_CREATED',
          description: `AI analysis identified ${analysis.issues.length} issue(s) in "${requirement.name}"`,
        },
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Continue even if AI fails
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error submitting document:', error);
    return NextResponse.json(
      { error: 'Failed to submit document' },
      { status: 500 }
    );
  }
}
