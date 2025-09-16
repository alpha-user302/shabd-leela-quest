import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('type') || 'admin';
  
  const { loginAdmin, loginTeam } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (type: 'admin' | 'team') => {
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both username and password"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = type === 'admin' 
        ? await loginAdmin(username, password)
        : await loginTeam(username, password);

      if (result.success) {
        toast({
          title: "Success",
          description: `Logged in successfully as ${type}`
        });
        navigate(type === 'admin' ? '/admin' : '/team');
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error || "Invalid credentials"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cyber flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent mb-2">
            Shabd-Leela 2.0
          </h1>
          <p className="text-muted-foreground">The Ultimate Coding Treasure Hunt</p>
        </div>

        <Card className="shadow-glow border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Choose your login type to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Admin Access</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin('admin')}
                    />
                  </div>
                  <Button
                    onClick={() => handleLogin('admin')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Logging in...' : 'Login as Admin'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-4 mt-6">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Team Access</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Team Username
                    </Label>
                    <Input
                      id="team-username"
                      type="text"
                      placeholder="Enter team username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="team-password"
                      type="password"
                      placeholder="Enter team password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin('team')}
                    />
                  </div>
                  <Button
                    onClick={() => handleLogin('team')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Logging in...' : 'Login as Team'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-primary"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;