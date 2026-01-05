'use client';

import { useEffect, useState } from 'react';
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
import { AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { canEditIssues } from '@/lib/auth';

interface IssuesTabProps {
  filing: any;
  onRefresh: () => void;
}

export function IssuesTab({ filing, onRefresh }: IssuesTabProps) {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-4">
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
              <option value="">All Severities</option>
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
              <option value="">All Statuses</option>
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
                <TableHead>Issue</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue: any) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{issue.title}</span>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description}
                      </span>
                      {issue.isRFI && (
                        <Badge variant="outline" className="mt-1 w-fit">
                          RFI
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {issue.requirement.name}
                      </span>
                      <Badge variant="outline" className="w-fit text-xs mt-1">
                        {getCategoryLabel(issue.requirement.category)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {issue.source === 'AI_ANALYSIS' ? 'AI' : 'Manual'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(issue.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {issue.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(issue.id, 'IN_PROGRESS')
                          }
                        >
                          Start
                        </Button>
                      )}
                      {(issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(issue.id, 'RESOLVED')}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
