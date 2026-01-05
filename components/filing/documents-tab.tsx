'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStatusColor, getCategoryLabel, formatDate, formatFileSize } from '@/lib/utils';
import { Upload, CheckCircle2, AlertCircle, FileText, Eye } from 'lucide-react';
import { canApproveDocuments } from '@/lib/auth';

interface DocumentsTabProps {
  filing: any;
  onRefresh: () => void;
}

export function DocumentsTab({ filing, onRefresh }: DocumentsTabProps) {
  const { data: session } = useSession();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileUpload = async (requirementId: string, file: File) => {
    setUploadingId(requirementId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/requirements/${requirementId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploadingId(null);
    }
  };

  const handleStatusChange = async (requirementId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const canApprove = session?.user && canApproveDocuments(session.user.role);

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Issues</TableHead>
              <TableHead>Latest Submission</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filing.requirements.map((req: any, index: number) => {
              const latestSubmission = req.submissions?.[0];
              const openIssuesCount = req.issues?.length || 0;

              return (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{req.name}</span>
                      {req.dfsaModuleTag && (
                        <span className="text-xs text-muted-foreground">
                          {req.dfsaModuleTag}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(req.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.owner}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(req.status)}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {openIssuesCount > 0 ? (
                      <Badge variant="destructive" className="rounded-full">
                        {openIssuesCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {latestSubmission ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {latestSubmission.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{latestSubmission.version} •{' '}
                          {formatFileSize(latestSubmission.fileSize)} •{' '}
                          {formatDate(latestSubmission.createdAt)}
                        </span>
                        {latestSubmission.aiAnalyzed && (
                          <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            AI Analyzed
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No submissions
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Upload Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadingId === req.id}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.onchange = (e: any) => {
                            const file = e.target?.files?.[0];
                            if (file) {
                              handleFileUpload(req.id, file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {uploadingId === req.id ? 'Uploading...' : 'Upload'}
                      </Button>

                      {/* Approve Button (Lawyer/Admin only) */}
                      {canApprove &&
                        req.status !== 'APPROVED' &&
                        latestSubmission && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusChange(req.id, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}

                      {/* Request Changes Button (Lawyer/Admin only) */}
                      {canApprove &&
                        req.status !== 'NEEDS_CHANGES' &&
                        latestSubmission && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(req.id, 'NEEDS_CHANGES')
                            }
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Changes
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
