import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Calendar } from "lucide-react";

interface TeamReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamReport {
  team_name: string;
  answered_key: string;
  accuracy_percentage: number;
  submitted_at: string;
}

export function TeamReportsModal({ open, onOpenChange }: TeamReportsModalProps) {
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc('get_team_reports');

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError("Failed to fetch team reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 80) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (accuracy >= 60) return <Badge variant="secondary">Good</Badge>;
    if (accuracy >= 40) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Team Reports & Statistics
          </DialogTitle>
          <DialogDescription>
            View team submissions, accuracy scores, and performance statistics.
          </DialogDescription>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading reports...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && reports.length === 0 && (
          <Alert>
            <AlertDescription>No team submissions found yet.</AlertDescription>
          </Alert>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground">Total Teams</h3>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground">Average Accuracy</h3>
                <p className="text-2xl font-bold">
                  {reports.length > 0 
                    ? Math.round(reports.reduce((sum, r) => sum + r.accuracy_percentage, 0) / reports.length)
                    : 0}%
                </p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground">Top Score</h3>
                <p className="text-2xl font-bold">
                  {reports.length > 0 ? Math.max(...reports.map(r => r.accuracy_percentage)) : 0}%
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Submitted Answer</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, index) => (
                  <TableRow key={`${report.team_name}-${index}`}>
                    <TableCell className="font-medium">
                      {index + 1}
                      {index === 0 && <Trophy className="w-4 h-4 inline ml-1 text-yellow-500" />}
                    </TableCell>
                    <TableCell className="font-medium">{report.team_name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {report.answered_key || "Not submitted"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{report.accuracy_percentage}%</span>
                    </TableCell>
                    <TableCell>
                      {getAccuracyBadge(report.accuracy_percentage)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.submitted_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}