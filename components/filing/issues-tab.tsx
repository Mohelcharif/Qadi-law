'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSeverityColor, getStatusColor, getCategoryLabel, formatDate } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronDown, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter issues based on search and filters
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.requirement.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [issues, searchQuery]);

  const openIssuesCount = filteredIssues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const highSevCount = filteredIssues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Issues</h3>
          <p className="text-sm text-gray-400">
            {openIssuesCount} open issues • {highSevCount} high severity
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className="px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-white text-sm"
        >
          <option value="">All Severity</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-white text-sm"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading issues...</div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No issues found</h3>
            <p className="text-sm text-gray-400">
              {searchQuery || filters.severity || filters.status
                ? 'Try adjusting your search or filters'
                : 'All documents are looking good!'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="w-[30px] text-gray-400"></TableHead>
                <TableHead className="text-gray-400">Severity</TableHead>
                <TableHead className="text-gray-400">Issue</TableHead>
                <TableHead className="text-gray-400">Source</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue: any) => {
                const isExpanded = expandedIssues.has(issue.id);
                return (
                  <React.Fragment key={issue.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-800/50 border-gray-800"
                      onClick={() => toggleExpanded(issue.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
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
                          <span className="font-medium text-white">{issue.title}</span>
                          <span className="text-xs text-gray-500">
                            {issue.requirement.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
                          {issue.source === 'AI_ANALYSIS' ? 'AI' : issue.source === 'MANUAL_REVIEW' ? 'Lawyer' : 'Client'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(issue.createdAt)}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-gray-800">
                        <TableCell colSpan={6} className="bg-gray-800/30 p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2 text-white">Description</h4>
                              <p className="text-sm text-gray-400">
                                {issue.description}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-white">Document:</span>
                                <div className="text-gray-400 mt-1">
                                  {issue.requirement.name}
                                  <Badge variant="outline" className="ml-2 text-xs border-gray-700">
                                    {getCategoryLabel(issue.requirement.category)}
                                  </Badge>
                                </div>
                              </div>
                              {issue.submission && (
                                <div>
                                  <span className="font-medium text-white">File:</span>
                                  <div className="text-gray-400 mt-1">
                                    {issue.submission.fileName} (v{issue.submission.version})
                                  </div>
                                </div>
                              )}
                              {issue.isRFI && (
                                <div>
                                  <span className="font-medium text-white">Type:</span>
                                  <div className="text-gray-400 mt-1">
                                    Request for Information (RFI)
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
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
      </div>
    </div>
  );
}
