'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate, getCategoryLabel } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, FileText, Users, Calendar } from 'lucide-react';

interface SummaryTabProps {
  filing: any;
  onRefresh: () => void;
}

export function SummaryTab({ filing, onRefresh }: SummaryTabProps) {
  const progressPercentage = Math.round(
    (filing.stats.approved / filing.stats.total) * 100
  );

  // Group requirements by category
  const byCategory = filing.requirements.reduce((acc: any, req: any) => {
    if (!acc[req.category]) {
      acc[req.category] = { total: 0, approved: 0 };
    }
    acc[req.category].total++;
    if (req.status === 'APPROVED') {
      acc[req.category].approved++;
    }
    return acc;
  }, {});

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* DFSA Submission Readiness */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>DFSA Submission Readiness</CardTitle>
          <CardDescription>
            Overall progress toward submission to DFSA for {filing.jurisdiction} authorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm text-muted-foreground">
                {filing.stats.approved} / {filing.stats.total} approved ({progressPercentage}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">
                  {filing.stats.approved}
                </div>
                <div className="text-xs text-green-700">Approved</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-900">
                  {filing.stats.openIssues}
                </div>
                <div className="text-xs text-red-700">Open Issues</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-semibold text-orange-900">
                  {filing.stats.needsChanges}
                </div>
                <div className="text-xs text-orange-700">Needs Changes</div>
              </div>
            </div>
          </div>

          {filing.stats.highSeverityIssues > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">
                  {filing.stats.highSeverityIssues} High/Critical Issues
                </div>
                <div className="text-sm text-red-700">
                  These issues must be resolved before submission
                </div>
              </div>
            </div>
          )}

          {filing.targetSubmissionDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Target submission date: {formatDate(filing.targetSubmissionDate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
          <CardDescription>Breakdown by DFSA requirement type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(byCategory).map(([category, stats]: [string, any]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getCategoryLabel(category)}</span>
                <span className="text-muted-foreground">
                  {stats.approved} / {stats.total}
                </span>
              </div>
              <Progress
                value={(stats.approved / stats.total) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Filing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Filing Details</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">Regulator</div>
              <div className="text-muted-foreground">{filing.regulator}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Jurisdiction</div>
              <div className="text-muted-foreground">{filing.jurisdiction}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Application Type</div>
              <div className="text-muted-foreground">{filing.applicationType}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Organization</div>
              <div className="text-muted-foreground">{filing.organization.name}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Created By</div>
              <div className="text-muted-foreground">{filing.createdBy.name}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Created On</div>
              <div className="text-muted-foreground">
                {formatDate(filing.createdAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
