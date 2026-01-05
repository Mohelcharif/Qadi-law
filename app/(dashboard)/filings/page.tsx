'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

interface Filing {
  id: string;
  name: string;
  description: string;
  status: string;
  regulator: string;
  jurisdiction: string;
  targetSubmissionDate: string | null;
  createdAt: string;
  createdBy: {
    name: string;
  };
  progress: {
    total: number;
    approved: number;
    percentage: number;
  };
}

export default function FilingsPage() {
  const router = useRouter();
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilings();
  }, []);

  const fetchFilings = async () => {
    try {
      const response = await fetch('/api/filings');
      if (response.ok) {
        const data = await response.json();
        setFilings(data);
      }
    } catch (error) {
      console.error('Error fetching filings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading filings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filings</h1>
          <p className="text-muted-foreground mt-1">
            Manage DFSA authorization applications
          </p>
        </div>
        <Button onClick={() => router.push('/filings/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Filing
        </Button>
      </div>

      {filings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No filings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first DFSA authorization filing to get started
            </p>
            <Button onClick={() => router.push('/filings/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Filing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filings.map((filing) => (
            <Card
              key={filing.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/filings/${filing.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{filing.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {filing.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(filing.status)}>
                    {filing.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {filing.progress.approved} / {filing.progress.total} approved
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${filing.progress.percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    {filing.regulator} / {filing.jurisdiction}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {filing.targetSubmissionDate
                      ? formatDate(filing.targetSubmissionDate)
                      : 'No deadline'}
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Created by {filing.createdBy.name} on {formatDate(filing.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
