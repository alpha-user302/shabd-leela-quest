import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Calendar, RefreshCw, Users, Target, Clock, Medal, Award } from "lucide-react";

interface TeamReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamReport {
  team_name: string;
  answered_key: string;
  accuracy_percentage: number;
  submitted_at: string;
  is_final: boolean;
}

export function TeamReportsModal({ open, onOpenChange }: TeamReportsModalProps) {
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [passKey, setPassKey] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchReports();
      loadPassKey();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('team-reports-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_submissions'
          },
          () => {
            // Refresh reports when submissions change
            fetchReports();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pass_key'
          },
          () => {
            // Refresh reports when pass key changes
            fetchReports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open]);

  const loadPassKey = async () => {
    try {
      const { data, error } = await supabase
        .from('pass_key')
        .select('pass_key')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setPassKey(data.pass_key);
      }
    } catch (error) {
      console.error('Error loading pass key:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      // Get latest submissions for each team (including drafts)
      const { data: submissions, error: submissionsError } = await supabase
        .from('team_submissions')
        .select(`
          team_id,
          answers,
          submitted_at,
          is_final,
          teams!inner(team_name)
        `)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Get the latest submission for each team
      const latestSubmissions = submissions?.reduce((acc, submission) => {
        if (!acc[submission.team_id] || 
            new Date(submission.submitted_at) > new Date(acc[submission.team_id].submitted_at)) {
          acc[submission.team_id] = submission;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate accuracy for each team
      const reportsData = Object.values(latestSubmissions).map((submission: any) => {
        const answeredKey = submission.answers?.join('') || '';
        let accuracyPercentage = 0;

        if (passKey && answeredKey) {
          let correctAnswers = 0;
          const answers = answeredKey.split('');
          const correctKeys = passKey.split('');
          
          for (let i = 0; i < Math.min(answers.length, correctKeys.length); i++) {
            if (answers[i] && correctKeys[i] && answers[i] === correctKeys[i]) {
              correctAnswers++;
            }
          }
          accuracyPercentage = Math.round((correctAnswers / 10) * 100 * 100) / 100;
        }

        return {
          team_name: submission.teams.team_name,
          answered_key: answeredKey,
          accuracy_percentage: accuracyPercentage,
          submitted_at: submission.submitted_at,
          is_final: submission.is_final
        };
      });

      // Sort reports by accuracy (highest first), then by submission time (earliest first)
      const sortedReports = reportsData.sort((a, b) => {
        if (b.accuracy_percentage === a.accuracy_percentage) {
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        }
        return b.accuracy_percentage - a.accuracy_percentage;
      });

      setReports(sortedReports);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError("Failed to fetch team reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 inline ml-1 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 inline ml-1 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 inline ml-1 text-amber-600" />;
    return null;
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy === 100) return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">Perfect!</Badge>;
    if (accuracy >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (accuracy >= 70) return <Badge variant="default">Very Good</Badge>;
    if (accuracy >= 50) return <Badge variant="secondary">Good</Badge>;
    if (accuracy >= 30) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const formatAnswerBreakdown = (answeredKey: string) => {
    if (!answeredKey) return <span className="text-muted-foreground">No answers submitted</span>;
    
    const answers = answeredKey.split('');
    const correctAnswers = passKey.split('');
    
    return (
      <>
        {answers.map((answer, index) => {
          const isCorrect = answer && correctAnswers[index] && answer === correctAnswers[index];
          const isEmpty = !answer || answer === '';
          
          return (
            <span key={index} className="inline-block">
              <span className="text-muted-foreground">Q{index + 1}=</span>
              <span 
                className={`font-mono font-bold px-1 py-0.5 rounded text-xs ${
                  isEmpty 
                    ? 'text-muted-foreground bg-muted' 
                    : isCorrect 
                    ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
                    : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
                }`}
              >
                {answer || '_'}
              </span>
              {isCorrect && <span className="text-green-500 text-xs ml-0.5">✓</span>}
              {!isEmpty && !isCorrect && <span className="text-red-500 text-xs ml-0.5">✗</span>}
              {index < answers.length - 1 && <span className="text-muted-foreground">, </span>}
            </span>
          );
        })}
      </>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Live Team Leaderboard
              </DialogTitle>
              <DialogDescription>
                Real-time team rankings based on accuracy and submission time
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchReports}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
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
          <div className="space-y-6">
            {/* Pass Key Reference */}
            {passKey && (
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Target className="w-5 h-5" />
                    Correct Answer Key (Admin View)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Master Answer Key:</div>
                    <div className="text-lg leading-relaxed">
                      {passKey.split('').map((answer, index) => (
                        <span key={index} className="inline-block">
                          <span className="text-muted-foreground">Q{index + 1}=</span>
                          <span className="font-mono font-bold text-primary bg-primary/20 px-2 py-1 rounded text-sm">
                            {answer}
                          </span>
                          {index < 9 && <span className="text-muted-foreground">, </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardDescription>Total Teams</CardDescription>
                  <CardTitle className="text-2xl text-primary flex items-center justify-center gap-1">
                    <Users className="w-5 h-5" />
                    {reports.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardDescription>Perfect Scores</CardDescription>
                  <CardTitle className="text-2xl text-yellow-500 flex items-center justify-center gap-1">
                    <Trophy className="w-5 h-5" />
                    {reports.filter(r => r.accuracy_percentage === 100).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardDescription>Average Score</CardDescription>
                  <CardTitle className="text-2xl text-blue-500 flex items-center justify-center gap-1">
                    <Target className="w-5 h-5" />
                    {Math.round(reports.reduce((sum, r) => sum + r.accuracy_percentage, 0) / reports.length)}%
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardDescription>Top Score</CardDescription>
                  <CardTitle className="text-2xl text-green-500">
                    {Math.max(...reports.map(r => r.accuracy_percentage))}%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Leaderboard Rankings
                </CardTitle>
                <CardDescription>
                  Teams ranked by accuracy percentage (highest first), then by submission time (earliest first)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead className="min-w-[400px]">Question Breakdown</TableHead>
                      <TableHead className="text-center">Accuracy</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow 
                        key={`${report.team_name}-${index}`}
                        className={`${
                          index === 0 ? 'bg-primary/5 border-primary/20' :
                          index === 1 ? 'bg-secondary/5 border-secondary/20' :
                          index === 2 ? 'bg-accent/5 border-accent/20' :
                          ''
                        }`}
                      >
                        <TableCell className="font-bold text-lg">
                          <div className="flex items-center">
                            #{index + 1}
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-lg">{report.team_name}</TableCell>
                        <TableCell className="py-4">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-2">Individual Answers:</div>
                            <div className="text-sm leading-relaxed">
                              {formatAnswerBreakdown(report.answered_key)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-xl">{report.accuracy_percentage}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getAccuracyBadge(report.accuracy_percentage)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={report.is_final ? "default" : "secondary"}
                            className={report.is_final ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}
                          >
                            {report.is_final ? "Final" : "Draft"}
                          </Badge>
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
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}