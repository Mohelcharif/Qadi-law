'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStatusColor, getCategoryLabel, formatDate, formatFileSize } from '@/lib/utils';
import { Upload, CheckCircle2, AlertCircle, FileText, Search, MoreVertical, Eye, Download } from 'lucide-react';
import { canApproveDocuments } from '@/lib/auth';

interface DocumentsTabProps {
  filing: any;
  onRefresh: () => void;
}

export function DocumentsTab({ filing, onRefresh }: DocumentsTabProps) {
  const { data: session } = useSession();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Filter and search
  const filteredRequirements = useMemo(() => {
    return filing.requirements.filter((req: any) => {
      const matchesSearch =
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.description && req.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (req.dfsaModuleTag && req.dfsaModuleTag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [filing.requirements, searchQuery, categoryFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(filing.requirements.map((req: any) => req.category));
    return Array.from(cats);
  }, [filing.requirements]);

  const approvedCount = filing.requirements.filter((req: any) => req.status === 'APPROVED').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Document Checklist</h3>
          <p className="text-sm text-muted-foreground">
            {approvedCount} of {filing.requirements.length} requirements approved
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Documents Table */}
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
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No documents found matching your search
                </TableCell>
              </TableRow>
            ) : (
              filteredRequirements.map((req: any) => {
                const latestSubmission = req.submissions?.[0];
                const openIssuesCount = req.issues?.length || 0;
                const originalIndex = filing.requirements.indexOf(req);

                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{originalIndex + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.name}</span>
                          {req.dfsaModuleTag && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
                              {req.dfsaModuleTag}
                            </Badge>
                          )}
                        </div>
                        {latestSubmission && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{latestSubmission.fileName}</span>
                            {latestSubmission.aiAnalyzed && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                AI
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(req.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {req.owner.toLowerCase()}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {latestSubmission ? formatDate(latestSubmission.createdAt) : '—'}
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

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {latestSubmission && (
                              <>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Document
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canApprove && (
                              <>
                                {req.status !== 'APPROVED' && latestSubmission && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {req.status !== 'NEEDS_CHANGES' && latestSubmission && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(req.id, 'NEEDS_CHANGES')}
                                  >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Request Changes
                                  </DropdownMenuItem>
                                )}
                                {req.status !== 'UNDER_REVIEW' && latestSubmission && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(req.id, 'UNDER_REVIEW')}
                                  >
                                    Mark Under Review
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
