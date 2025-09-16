import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Key, FileText, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();

  if (!admin) {
    return <Navigate to="/login?type=admin" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-cyber p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent">
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
          <Card className="shadow-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
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
              <Button className="w-full">
                Manage Teams
              </Button>
            </CardContent>
          </Card>

          {/* Pass Key Settings */}
          <Card className="shadow-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
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
              <Button className="w-full">
                Update Pass Key
              </Button>
            </CardContent>
          </Card>

          {/* Team Reports */}
          <Card className="shadow-glow border-primary/20 hover:border-primary/40 transition-all duration-300">
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
              <Button className="w-full">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Active Teams</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">0</CardTitle>
              <CardDescription>Submissions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-glow border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">N/A</CardTitle>
              <CardDescription>Pass Key Status</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;