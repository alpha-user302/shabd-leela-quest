import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Clock, LogOut } from 'lucide-react';

const TeamDashboard = () => {
  const { team, logout } = useAuth();

  if (!team) {
    return <Navigate to="/team-login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-cyber p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent">
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
          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">10</CardTitle>
              <CardDescription>Total Questions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Answered</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0%</CardTitle>
              <CardDescription>Progress</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Quiz */}
          <Card className="shadow-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Start Quiz
              </CardTitle>
              <CardDescription>
                Begin answering the 10 treasure hunt questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Start Quiz
              </Button>
            </CardContent>
          </Card>

          {/* View Progress */}
          <Card className="shadow-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                View Progress
              </CardTitle>
              <CardDescription>
                Review your current answers and submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" size="lg">
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 shadow-glow border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>You will be presented with 10 questions</li>
              <li>Each question requires one character answer (letter, number, or symbol)</li>
              <li>You can save your answers and edit them anytime before final submission</li>
              <li>Once submitted, your answers will be compared with the admin's pass key</li>
              <li>Your accuracy will be calculated based on character matches</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamDashboard;