'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStatusColor, formatDate, getCategoryLabel, getSeverityColor } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react';
import { SummaryTab } from '@/components/filing/summary-tab';
import { DocumentsTab } from '@/components/filing/documents-tab';
import { IssuesTab } from '@/components/filing/issues-tab';
import { SubmissionTab } from '@/components/filing/submission-tab';

interface Filing {
  id: string;
  name: string;
  description: string;
  status: string;
  regulator: string;
  jurisdiction: string;
  applicationType: string;
  targetSubmissionDate: string | null;
  createdAt: string;
  organization: {
    name: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  requirements: any[];
  stats: {
    total: number;
    approved: number;
    underReview: number;
    needsChanges: number;
    openIssues: number;
    highSeverityIssues: number;
  };
}

export default function FilingDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [filing, setFiling] = useState<Filing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (params.id) {
      fetchFiling();
    }
  }, [params.id]);

  const fetchFiling = async () => {
    try {
      const response = await fetch(`/api/filings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFiling(data);
      }
    } catch (error) {
      console.error('Error fetching filing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading filing...</div>
      </div>
    );
  }

  if (!filing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Filing not found</h2>
          <p className="text-muted-foreground">The filing you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{filing.name}</h1>
            <Badge className={getStatusColor(filing.status)}>
              {filing.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {filing.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {filing.regulator} / {filing.jurisdiction}
            </span>
            <span>•</span>
            <span>{filing.applicationType}</span>
            {filing.targetSubmissionDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Target: {formatDate(filing.targetSubmissionDate)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filing.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filing.stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((filing.stats.approved / filing.stats.total) * 100)}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filing.stats.openIssues}</div>
            <p className="text-xs text-muted-foreground">
              {filing.stats.highSeverityIssues} high/critical
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Changes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filing.stats.needsChanges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {filing.stats.needsChanges > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filing.stats.needsChanges}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issues">
            Issues
            {filing.stats.openIssues > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filing.stats.openIssues}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submission">Submission Package</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <SummaryTab filing={filing} onRefresh={fetchFiling} onTabChange={setActiveTab} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentsTab filing={filing} onRefresh={fetchFiling} />
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <IssuesTab filing={filing} onRefresh={fetchFiling} />
        </TabsContent>

        <TabsContent value="submission" className="space-y-4">
          <SubmissionTab filing={filing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
