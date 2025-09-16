import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Code, Users, Lock, Target, Zap } from "lucide-react";
import heroImage from "@/assets/hero-coding-treasure.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 animate-float">
              🏆 Ultimate Coding Challenge
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-treasure bg-clip-text text-transparent">
              Shabd-Leela 2.0
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              The Ultimate Coding Treasure Hunt
            </p>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Decode mysteries, crack challenges, and compete with teams worldwide 
              in the most thrilling coding adventure ever created.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="animate-glow">
                <Users className="mr-2 h-5 w-5" />
                Team Login
              </Button>
              <Button variant="secondary" size="lg">
                <Lock className="mr-2 h-5 w-5" />
                Admin Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate through challenges, solve puzzles, and compete for the ultimate treasure
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-card border-primary/20 hover:shadow-glow-primary transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>10 Unique Challenges</CardTitle>
              <CardDescription>
                Each question requires a single character answer - letters, numbers, or symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Save and edit answers anytime</li>
                <li>• Real-time progress tracking</li>
                <li>• Secure answer submission</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-treasure/20 hover:shadow-glow-treasure transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle>Admin Control Panel</CardTitle>
              <CardDescription>
                Complete team management and challenge configuration system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add/edit team credentials</li>
                <li>• Set 10-character pass key</li>
                <li>• Monitor all submissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 hover:shadow-glow-primary transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Live Leaderboard</CardTitle>
              <CardDescription>
                Real-time accuracy comparison and competitive rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Character-by-character matching</li>
                <li>• Sorted by accuracy percentage</li>
                <li>• Detailed submission reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10</div>
              <div className="text-muted-foreground">Coding Challenges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-treasure mb-2">∞</div>
              <div className="text-muted-foreground">Teams Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-code mb-2">1</div>
              <div className="text-muted-foreground">Ultimate Winner</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">100%</div>
              <div className="text-muted-foreground">Pure Excitement</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start the Hunt?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the ultimate coding treasure hunt and prove your skills against the best developers
          </p>
          <Button size="lg" className="animate-glow">
            <Zap className="mr-2 h-5 w-5" />
            Begin Your Adventure
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Shabd-Leela 2.0 | The Ultimate Coding Treasure Hunt
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;