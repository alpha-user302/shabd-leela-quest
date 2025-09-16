import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function TeamLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc('verify_team_login', {
        input_username: username,
        input_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        // Store team session in localStorage
        localStorage.setItem('team_session', JSON.stringify({
          id: data[0].team_id,
          username: data[0].username,
          team_name: data[0].team_name,
          type: 'team'
        }));
        
        toast({
          title: "Login successful",
          description: `Welcome ${data[0].team_name}!`,
        });
        
        navigate('/team-dashboard');
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Team Login
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Access your team dashboard for the coding treasure hunt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter team username"
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 transform transition-all duration-200 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login as Team"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Administrator?{" "}
              <button
                onClick={() => navigate('/admin-login')}
                className="text-primary hover:text-accent transition-colors underline"
              >
                Login here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}