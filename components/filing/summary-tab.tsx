'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate, getCategoryLabel, getStatusColor } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, FileText, Calendar, AlertCircle, ArrowRight, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface SummaryTabProps {
  filing: any;
  onRefresh: () => void;
}

export function SummaryTab({ filing, onRefresh }: SummaryTabProps) {
  const progressPercentage = Math.round(
    (filing.stats.approved / filing.stats.total) * 100
  );

  // Calculate client action required items
  const clientActionItems = filing.requirements.filter((req: any) => {
    const needsClientAction =
      (req.status === 'REQUESTED' || req.status === 'NEEDS_CHANGES') &&
      (req.owner === 'CLIENT' || req.owner === 'SHARED');
    const hasOpenIssues = req.issues && req.issues.length > 0;
    return needsClientAction || hasOpenIssues;
  });

  // Calculate risk score (0-100, lower is better)
  const calculateRiskScore = () => {
    let score = 0;

    // Base score from completion (0-40 points)
    const completionPenalty = ((filing.stats.total - filing.stats.approved) / filing.stats.total) * 40;
    score += completionPenalty;

    // Issues penalty (0-40 points)
    const issuesPenalty = Math.min((filing.stats.openIssues / filing.stats.total) * 20, 40);
    score += issuesPenalty;

    // High severity issues penalty (0-20 points)
    const severityPenalty = Math.min(filing.stats.highSeverityIssues * 5, 20);
    score += severityPenalty;

    return Math.min(Math.round(score), 100);
  };

  const riskScore = calculateRiskScore();
  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High';
  const riskColor = riskScore < 30 ? 'text-green-600' : riskScore < 60 ? 'text-yellow-600' : 'text-red-600';

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
    <div className="space-y-6">
      {/* Client Action Required */}
      {clientActionItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">
                  Client Action Required ({clientActionItems.length})
                </CardTitle>
              </div>
              <Link href={`/filings/${filing.id}?tab=documents`}>
                <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-orange-700">
              Items your lawyer needs from you to move the DFSA application forward (documents + business clarifications).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientActionItems.slice(0, 4).map((req: any) => (
              <div key={req.id} className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{req.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {req.description || 'Action required'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(req.status)}>
                    {req.status === 'NEEDS_CHANGES' ? 'INPUT NEEDED' : 'REQUESTED'}
                  </Badge>
                  <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700">
                    Provide Input
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filing.stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filing.stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filing.stats.needsChanges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${riskColor}`}>
              {riskScore}/100
            </div>
            <p className="text-xs text-muted-foreground mt-1">{riskLevel}</p>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
