import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Save, Send, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface QuizInterfaceProps {
  onBack: () => void;
}

export function QuizInterface({ onBack }: QuizInterfaceProps) {
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { toast } = useToast();
  const { team } = useAuth();

  const questions = [
    "What is the first character of the secret code?",
    "What is the second character of the secret code?", 
    "What is the third character of the secret code?",
    "What is the fourth character of the secret code?",
    "What is the fifth character of the secret code?",
    "What is the sixth character of the secret code?",
    "What is the seventh character of the secret code?",
    "What is the eighth character of the secret code?",
    "What is the ninth character of the secret code?",
    "What is the tenth character of the secret code?"
  ];

  useEffect(() => {
    loadExistingSubmission();
  }, []);

  const loadExistingSubmission = async () => {
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
        setAnswers(submission.answers || Array(10).fill(""));
        setHasSubmitted(submission.is_final);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    // Only allow single character
    const char = value.slice(-1);
    const newAnswers = [...answers];
    newAnswers[index] = char;
    setAnswers(newAnswers);
  };

  const saveProgress = async () => {
    if (!team) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_submissions')
        .upsert({
          team_id: team.id,
          answers: answers,
          is_final: false
        });

      if (error) throw error;

      toast({
        title: "Progress saved",
        description: "Your answers have been saved as draft.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFinal = async () => {
    if (!team) return;

    // Check if all questions are answered
    const unanswered = answers.some(answer => answer === "");
    if (unanswered) {
      toast({
        title: "Incomplete submission",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_submissions')
        .upsert({
          team_id: team.id,
          answers: answers,
          is_final: true
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Submission complete!",
        description: "Your final answers have been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: "Error",
        description: "Failed to submit answers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    const answered = answers.filter(answer => answer !== "").length;
    return (answered / 10) * 100;
  };

  const nextQuestion = () => {
    if (currentQuestion < 9) setCurrentQuestion(currentQuestion + 1);
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Badge variant={hasSubmitted ? "default" : "secondary"}>
          {hasSubmitted ? "Final Submission" : "Draft"}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Progress</CardTitle>
          <CardDescription>
            Complete all 10 questions to form the secret code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {answers.filter(a => a !== "").length} of 10 questions answered
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSubmitted && (
        <Alert>
          <AlertDescription>
            You have already submitted your final answers. You can view them below but cannot make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Question {currentQuestion + 1} of 10</CardTitle>
          <CardDescription>{questions[currentQuestion]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={answers[currentQuestion]}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Enter single character"
                maxLength={1}
                className="w-20 h-20 text-center text-2xl font-mono"
                disabled={hasSubmitted}
              />
              <div className="text-sm text-muted-foreground">
                Enter one character (letter, number, or symbol)
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={nextQuestion}
                disabled={currentQuestion === 9}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Answers Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Answers</CardTitle>
          <CardDescription>
            Review all your answers below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {answers.map((answer, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Q{index + 1}
                </div>
                <Input
                  value={answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-12 h-12 text-center font-mono text-lg"
                  maxLength={1}
                  disabled={hasSubmitted}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Complete Answer Key:</div>
            <div className="font-mono text-xl tracking-widest">
              {answers.join("") || "_ _ _ _ _ _ _ _ _ _"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!hasSubmitted && (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={saveProgress}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
          <Button 
            onClick={submitFinal}
            disabled={loading || answers.some(a => a === "")}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Final Answers
          </Button>
        </div>
      )}
    </div>
  );
}