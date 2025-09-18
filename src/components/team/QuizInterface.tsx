import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Save, Send, ArrowLeft, ArrowRight, Target, Clock } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [passKey, setPassKey] = useState<string>('');
  const [savingQuestion, setSavingQuestion] = useState<number | null>(null);
  const { toast } = useToast();
  const { team } = useAuth();

  const questions = [
    {
      id: 1,
      question: "Find the first character of the treasure code",
      hint: "Look for clues in the beginning..."
    },
    {
      id: 2,
      question: "Discover the second character of the treasure code",
      hint: "The pattern continues..."
    },
    {
      id: 3,
      question: "Uncover the third character of the treasure code",
      hint: "Think about sequences..."
    },
    {
      id: 4,
      question: "Reveal the fourth character of the treasure code",
      hint: "Numbers or letters?"
    },
    {
      id: 5,
      question: "Decode the fifth character of the treasure code",
      hint: "Halfway through the mystery..."
    },
    {
      id: 6,
      question: "Extract the sixth character of the treasure code",
      hint: "The treasure is getting closer..."
    },
    {
      id: 7,
      question: "Identify the seventh character of the treasure code",
      hint: "Lucky number seven..."
    },
    {
      id: 8,
      question: "Determine the eighth character of the treasure code",
      hint: "Almost there..."
    },
    {
      id: 9,
      question: "Find the ninth character of the treasure code",
      hint: "One more to go..."
    },
    {
      id: 10,
      question: "Complete the treasure code with the tenth character",
      hint: "The final piece of the puzzle!"
    }
  ];

  useEffect(() => {
    loadExistingSubmission();
    loadPassKey();
  }, []);

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

  const handleAnswerChange = async (index: number, value: string) => {
    // Only allow single character and convert to uppercase
    const char = value.slice(-1).toUpperCase();
    const newAnswers = [...answers];
    newAnswers[index] = char;
    setAnswers(newAnswers);
    
    // Auto-save individual question
    await saveIndividualQuestion(index, char);
  };

  const saveIndividualQuestion = async (questionIndex: number, answer: string) => {
    if (!team) return;

    setSavingQuestion(questionIndex);
    try {
      // Get current submission
      const { data: existing } = await supabase
        .from('team_submissions')
        .select('answers')
        .eq('team_id', team.id)
        .maybeSingle();

      const currentAnswers = existing?.answers || Array(10).fill('');
      currentAnswers[questionIndex] = answer;

      if (existing) {
        // Update existing submission
        await supabase
          .from('team_submissions')
          .update({
            answers: currentAnswers,
            submitted_at: new Date().toISOString()
          })
          .eq('team_id', team.id);
      } else {
        // Insert new submission
        await supabase
          .from('team_submissions')
          .insert({
            team_id: team.id,
            answers: currentAnswers,
            is_final: false
          });
      }

      toast({
        title: "Question saved",
        description: `Question ${questionIndex + 1} answer saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: `Failed to save question ${questionIndex + 1}.`,
        variant: "destructive"
      });
    } finally {
      setSavingQuestion(null);
    }
  };

  const getAnswerStatus = (index: number) => {
    return answers[index] ? 'answered' : 'empty';
  };

  const saveProgress = async () => {
    if (!team) return;

    setLoading(true);
    try {
      // Check if submission exists first
      const { data: existing } = await supabase
        .from('team_submissions')
        .select('id')
        .eq('team_id', team.id)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing submission
        result = await supabase
          .from('team_submissions')
          .update({
            answers: answers,
            is_final: false,
            submitted_at: new Date().toISOString()
          })
          .eq('team_id', team.id);
      } else {
        // Insert new submission
        result = await supabase
          .from('team_submissions')
          .insert({
            team_id: team.id,
            answers: answers,
            is_final: false
          });
      }

      if (result.error) throw result.error;

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
      // Check if submission exists first
      const { data: existing } = await supabase
        .from('team_submissions')
        .select('id')
        .eq('team_id', team.id)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing submission
        result = await supabase
          .from('team_submissions')
          .update({
            answers: answers,
            is_final: true,
            submitted_at: new Date().toISOString()
          })
          .eq('team_id', team.id);
      } else {
        // Insert new submission
        result = await supabase
          .from('team_submissions')
          .insert({
            team_id: team.id,
            answers: answers,
            is_final: true
          });
      }

      if (result.error) throw result.error;

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

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setViewMode('single');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant={hasSubmitted ? "default" : "secondary"}>
              {hasSubmitted ? "Final Submission" : "Draft"}
            </Badge>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('single')}
              >
                Single Question
              </Button>
              <Button 
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Questions
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Treasure Hunt Progress
            </CardTitle>
            <CardDescription>
              Solve all 10 clues to discover the secret treasure code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(getProgress())}% Complete</span>
                </div>
                <Progress value={getProgress()} className="w-full h-3" />
                <div className="text-sm text-muted-foreground">
                  {answers.filter(a => a !== "").length} of 10 questions answered
                </div>
              </div>

              {/* Quick Answer Overview */}
              <div className="grid grid-cols-10 gap-2">
                {answers.map((answer, index) => {
                  const status = getAnswerStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-12 h-12 border-2 rounded-md font-mono text-lg font-bold transition-all relative ${
                        status === 'answered' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-muted border-muted-foreground/20 hover:border-primary/50'
                      } ${currentQuestion === index ? 'ring-2 ring-accent' : ''}`}
                    >
                      {answer || (index + 1)}
                      {savingQuestion === index && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Current Treasure Code:</div>
                <div className="font-mono text-2xl tracking-widest font-bold">
                  {answers.map((answer, index) => (
                    <span 
                      key={index} 
                      className={answer ? 'text-primary' : 'text-muted-foreground'}
                    >
                      {answer || '_'}{index < 9 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSubmitted && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-700 dark:text-green-300">
              ✅ You have successfully submitted your final answers! Your treasure code will be evaluated for accuracy.
            </AlertDescription>
          </Alert>
        )}

        {/* Single Question View */}
        {viewMode === 'single' && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Question {currentQuestion + 1} of 10
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {questions[currentQuestion].question}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Q{currentQuestion + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-2">💡 Hint:</p>
                  <p className="text-accent font-medium">{questions[currentQuestion].hint}</p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Your Answer
                    </label>
                    <Input
                      value={answers[currentQuestion]}
                      onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      placeholder="?"
                      maxLength={1}
                      className="w-24 h-24 text-center text-4xl font-mono font-bold border-2 border-primary/50 focus:border-primary"
                      disabled={hasSubmitted}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Single character only
                    </p>
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
        )}

        {/* All Questions View */}
        {viewMode === 'all' && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle>All Questions Overview</CardTitle>
              <CardDescription>
                Review and answer all questions at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {questions.map((q, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">
                          Question {index + 1}: {q.question}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          💡 {q.hint}
                        </p>
                      </div>
                      <div className="text-center">
                        <Input
                          value={answers[index]}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="w-16 h-16 text-center text-2xl font-mono font-bold"
                          maxLength={1}
                          disabled={hasSubmitted}
                          placeholder="?"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!hasSubmitted && (
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={saveProgress}
              disabled={loading}
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button 
              onClick={submitFinal}
              disabled={loading || answers.some(a => a === "")}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Final Answers
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Each question requires exactly one character (letter, number, or symbol)</li>
              <li>• You can switch between single question view and all questions view</li>
              <li>• Save your progress anytime - your answers are stored as drafts</li>
              <li>• Once you submit final answers, they cannot be changed</li>
              <li>• Your final code will be compared character-by-character with the admin's pass key</li>
              <li>• The team with the highest accuracy wins the treasure hunt!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}