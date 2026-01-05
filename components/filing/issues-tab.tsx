'use client';

import React, { useEffect, useState } from 'react';
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
import { getSeverityColor, getStatusColor, getCategoryLabel, formatDate } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { canEditIssues } from '@/lib/auth';

interface IssuesTabProps {
  filing: any;
  onRefresh: () => void;
}

export function IssuesTab({ filing, onRefresh }: IssuesTabProps) {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
  });

  useEffect(() => {
    fetchIssues();
  }, [filing.id, filters]);

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(
        `/api/filings/${filing.id}/issues?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchIssues();
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const canEdit = session?.user && canEditIssues(session.user.role);

  const toggleExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const openIssuesCount = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const highSevCount = issues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Issues</h3>
          <p className="text-sm text-muted-foreground">
            {openIssuesCount} open issues • {highSevCount} high severity
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter:</span>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              <option value="">All Severity</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          {(filters.severity || filters.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ severity: '', status: '' })}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Issues Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading issues...</div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No issues found</h3>
            <p className="text-sm text-muted-foreground">
              {filters.severity || filters.status
                ? 'Try adjusting your filters'
                : 'All documents are looking good!'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue: any) => {
                const isExpanded = expandedIssues.has(issue.id);
                return (
                  <React.Fragment key={issue.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpanded(issue.id)}>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{issue.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {issue.requirement.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {issue.source === 'AI_ANALYSIS' ? 'AI' : issue.source === 'MANUAL_REVIEW' ? 'Lawyer' : 'Client'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(issue.createdAt)}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {issue.description}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Document:</span>
                                <div className="text-muted-foreground mt-1">
                                  {issue.requirement.name}
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {getCategoryLabel(issue.requirement.category)}
                                  </Badge>
                                </div>
                              </div>
                              {issue.submission && (
                                <div>
                                  <span className="font-medium">File:</span>
                                  <div className="text-muted-foreground mt-1">
                                    {issue.submission.fileName} (v{issue.submission.version})
                                  </div>
                                </div>
                              )}
                              {issue.isRFI && (
                                <div>
                                  <span className="font-medium">Type:</span>
                                  <div className="text-muted-foreground mt-1">
                                    Request for Information (RFI)
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                              {issue.status === 'OPEN' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(issue.id, 'IN_PROGRESS');
                                  }}
                                >
                                  Start Working
                                </Button>
                              )}
                              {(issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(issue.id, 'RESOLVED');
                                  }}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
