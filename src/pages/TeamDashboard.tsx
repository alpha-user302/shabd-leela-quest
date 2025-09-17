import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Clock, LogOut } from 'lucide-react';
import { QuizInterface } from '@/components/team/QuizInterface';
import { ProgressView } from '@/components/team/ProgressView';
import { supabase } from '@/integrations/supabase/client';

const TeamDashboard = () => {
  const { team, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'progress'>('dashboard');
  const [stats, setStats] = useState({
    totalQuestions: 10,
    answered: 0,
    progress: 0,
    hasSubmission: false,
    isFinalSubmission: false
  });

  useEffect(() => {
    if (team) {
      fetchTeamStats();
    }
  }, [team]);

  const fetchTeamStats = async () => {
    if (!team) return;

    try {
      const { data, error } = await supabase
        .from('team_submissions')
        .select('answers, is_final')
        .eq('team_id', team.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const submission = data[0];
        const answered = submission.answers ? submission.answers.filter((a: string) => a !== "").length : 0;
        const progress = (answered / 10) * 100;

        setStats({
          totalQuestions: 10,
          answered,
          progress,
          hasSubmission: true,
          isFinalSubmission: submission.is_final
        });
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  const handleStartQuiz = () => {
    setCurrentView('quiz');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    fetchTeamStats(); // Refresh stats when returning to dashboard
  };

  if (!team) {
    return <Navigate to="/team-login" replace />;
  }

  // Render different views based on current state
  if (currentView === 'quiz') {
    return <QuizInterface onBack={handleBackToDashboard} />;
  }

  if (currentView === 'progress') {
    return <ProgressView onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Team Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome, {team.team_name} ({team.username})
            </p>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{stats.totalQuestions}</CardTitle>
              <CardDescription>Total Questions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{stats.answered}</CardTitle>
              <CardDescription>Answered</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{Math.round(stats.progress)}%</CardTitle>
              <CardDescription>Progress</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start/Continue Quiz */}
          <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {stats.hasSubmission ? (stats.isFinalSubmission ? 'View Quiz' : 'Continue Quiz') : 'Start Quiz'}
              </CardTitle>
              <CardDescription>
                {stats.isFinalSubmission 
                  ? 'Review your final submission'
                  : stats.hasSubmission 
                    ? 'Continue answering the treasure hunt questions'
                    : 'Begin answering the 10 treasure hunt questions'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleStartQuiz}
                disabled={stats.isFinalSubmission}
              >
                {stats.isFinalSubmission ? 'Final Submitted' : stats.hasSubmission ? 'Continue Quiz' : 'Start Quiz'}
              </Button>
            </CardContent>
          </Card>

          {/* View Progress */}
          <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                View Progress
              </CardTitle>
              <CardDescription>
                {stats.hasSubmission 
                  ? 'Review your current answers and submission status'
                  : 'No submission found yet'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline" 
                size="lg"
                onClick={handleViewProgress}
                disabled={!stats.hasSubmission}
              >
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>You will be presented with 10 questions to find the secret treasure code</li>
              <li>Each question requires one character answer (letter, number, or symbol)</li>
              <li>You can save your answers as draft and edit them anytime before final submission</li>
              <li>Once submitted as final, your answers will be compared with the admin's pass key</li>
              <li>Your accuracy will be calculated based on character-by-character matches</li>
              <li>The team with the highest accuracy wins the treasure hunt!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamDashboard;