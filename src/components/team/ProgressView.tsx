import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Target, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressViewProps {
  onBack: () => void;
}

interface Submission {
  answers: string[];
  is_final: boolean;
  submitted_at: string;
}

interface TeamReport {
  team_name: string;
  answered_key: string;
  accuracy_percentage: number;
  submitted_at: string;
}

export function ProgressView({ onBack }: ProgressViewProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [report, setReport] = useState<TeamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { team } = useAuth();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!team) return;

    try {
      // Load latest submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('team_submissions')
        .select('answers, is_final, submitted_at')
        .eq('team_id', team.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (submissionError) throw submissionError;

      if (submissionData && submissionData.length > 0) {
        setSubmission(submissionData[0]);
        
        // If final submission exists, get the report
        if (submissionData[0].is_final) {
          const { data: reportData, error: reportError } = await supabase
            .rpc('get_team_reports');

          if (reportError) throw reportError;

          const teamReport = reportData?.find((r: TeamReport) => r.team_name === team.team_name);
          if (teamReport) {
            setReport(teamReport);
          }
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">Loading progress...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Alert>
          <AlertDescription>
            No submissions found. Start the quiz to begin answering questions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getProgress = () => {
    const answered = submission.answers.filter(answer => answer !== "").length;
    return (answered / 10) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPerformanceBadge = (accuracy: number) => {
    if (accuracy >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (accuracy >= 60) return <Badge variant="secondary">Good</Badge>;
    if (accuracy >= 40) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Badge variant={submission.is_final ? "default" : "secondary"}>
          {submission.is_final ? "Final Submission" : "Draft"}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Submission Progress
          </CardTitle>
          <CardDescription>
            Your current progress on the coding treasure hunt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Questions Answered</span>
                <span>{Math.round(getProgress())}% Complete</span>
              </div>
              <Progress value={getProgress()} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {submission.answers.filter(a => a !== "").length} of 10 questions answered
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Last updated: {formatDate(submission.submitted_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Answers</CardTitle>
          <CardDescription>
            Review your submitted answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-10 gap-2">
              {submission.answers.map((answer, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    Q{index + 1}
                  </div>
                  <div className="w-12 h-12 border rounded-md flex items-center justify-center font-mono text-lg bg-muted">
                    {answer || "?"}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Complete Answer Key:</div>
              <div className="font-mono text-xl tracking-widest">
                {submission.answers.map(a => a || "_").join(" ")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Report (if final submission) */}
      {submission.is_final && report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Performance Report
            </CardTitle>
            <CardDescription>
              Your final submission results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {report.accuracy_percentage}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy Score</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-lg font-semibold">
                  {getPerformanceBadge(report.accuracy_percentage)}
                </div>
                <div className="text-sm text-muted-foreground">Performance Level</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Submitted Key</div>
                <div className="font-mono text-lg tracking-wide">
                  {report.answered_key}
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                Your submission has been recorded and evaluated. Thank you for participating in the coding treasure hunt!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Status Alert */}
      {!submission.is_final && (
        <Alert>
          <AlertDescription>
            This is a draft submission. You can continue editing your answers until you submit your final version.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}