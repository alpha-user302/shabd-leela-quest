import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Key, FileText, LogOut, Plus } from 'lucide-react';
import { AddTeamModal } from '@/components/admin/AddTeamModal';
import { PassKeyModal } from '@/components/admin/PassKeyModal';
import { TeamReportsModal } from '@/components/admin/TeamReportsModal';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [passKeyOpen, setPassKeyOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalSubmissions: 0,
    passKeyStatus: 'Not Set'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch teams count
      const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      // Fetch submissions count
      const { count: submissionsCount } = await supabase
        .from('team_submissions')
        .select('*', { count: 'exact', head: true });

      // Fetch pass key status
      const { data: passKeyData } = await supabase
        .from('pass_key')
        .select('pass_key')
        .order('created_at', { ascending: false })
        .limit(1);

      setStats({
        totalTeams: teamsCount || 0,
        totalSubmissions: submissionsCount || 0,
        passKeyStatus: passKeyData && passKeyData.length > 0 ? 'Set' : 'Not Set'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTeamAdded = () => {
    fetchStats();
  };

  const handlePassKeyUpdated = () => {
    fetchStats();
  };

  if (!admin) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {admin.username}
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

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Team Management */}
          <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Management
              </CardTitle>
              <CardDescription>
                Add, edit, and manage participating teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setAddTeamOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Team
              </Button>
            </CardContent>
          </Card>

          {/* Pass Key Settings */}
          <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Pass Key Settings
              </CardTitle>
              <CardDescription>
                Set and update the 10-character pass key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setPassKeyOpen(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Update Pass Key
              </Button>
            </CardContent>
          </Card>

          {/* Team Reports */}
          <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Team Reports
              </CardTitle>
              <CardDescription>
                View submission reports and accuracy statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setReportsOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{stats.totalTeams}</CardTitle>
              <CardDescription>Active Teams</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{stats.totalSubmissions}</CardTitle>
              <CardDescription>Submissions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">{stats.passKeyStatus}</CardTitle>
              <CardDescription>Pass Key Status</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Modals */}
        <AddTeamModal 
          open={addTeamOpen} 
          onOpenChange={setAddTeamOpen}
          onTeamAdded={handleTeamAdded}
        />
        <PassKeyModal 
          open={passKeyOpen} 
          onOpenChange={setPassKeyOpen}
          onPassKeyUpdated={handlePassKeyUpdated}
        />
        <TeamReportsModal 
          open={reportsOpen} 
          onOpenChange={setReportsOpen}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;