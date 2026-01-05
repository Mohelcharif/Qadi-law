'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getStatusColor, getCategoryLabel } from '@/lib/utils';
import { CheckCircle2, XCircle, Download, FileText } from 'lucide-react';

interface SubmissionTabProps {
  filing: any;
}

export function SubmissionTab({ filing }: SubmissionTabProps) {
  const readyItems = filing.requirements.filter(
    (req: any) => req.status === 'APPROVED'
  );
  const blockedItems = filing.requirements.filter(
    (req: any) => req.status !== 'APPROVED'
  );

  const canSubmit = blockedItems.length === 0 && filing.requirements.length > 0;

  const exportPackage = () => {
    // Generate CSV export of the submission package
    const headers = ['#', 'Requirement', 'Category', 'Status', 'Issues', 'Latest File'];
    const rows = filing.requirements.map((req: any, idx: number) => [
      idx + 1,
      req.name,
      getCategoryLabel(req.category),
      req.status,
      req.issues?.length || 0,
      req.submissions?.[0]?.fileName || 'None',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filing.name}-submission-package.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Submission Readiness Card */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Package Status</CardTitle>
          <CardDescription>
            Review the status of all requirements before final submission to DFSA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-green-200 bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {readyItems.length}
                </div>
                <div className="text-sm text-green-700">Ready for Submission</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-red-200 bg-red-50">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-900">
                  {blockedItems.length}
                </div>
                <div className="text-sm text-red-700">Blocked / Not Ready</div>
              </div>
            </div>
          </div>

          {canSubmit ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="font-semibold text-green-900">
                  Package Ready for Submission
                </div>
                <div className="text-sm text-green-700">
                  All requirements have been approved and are ready for DFSA submission
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <XCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-900">
                  Cannot Submit Yet
                </div>
                <div className="text-sm text-yellow-700">
                  {blockedItems.length} item(s) must be approved before submission
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={exportPackage} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Package (CSV)
            </Button>
            <Button disabled={!canSubmit}>
              <FileText className="h-4 w-4 mr-2" />
              Submit to DFSA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ready Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Ready for Submission ({readyItems.length})
          </CardTitle>
          <CardDescription>
            These requirements have been approved and are ready to submit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No items approved yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Latest File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyItems.map((req: any, index: number) => (
                  <TableRow key={req.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(req.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.submissions?.[0]?.fileName || 'None'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Blocked Items */}
      {blockedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Blocked Items ({blockedItems.length})
            </CardTitle>
            <CardDescription>
              These requirements need attention before submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Open Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedItems.map((req: any, index: number) => (
                  <TableRow key={req.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(req.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(req.status)}>
                        {req.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {req.issues?.length > 0 ? (
                        <Badge variant="destructive">{req.issues.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
