"use client";

import type { FC } from 'react';
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Clock, Star, AlertTriangle, CheckCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from './LoadingSpinner';
import { analyzeProgress, type ProgressAnalysisInput, type ProgressAnalysisOutput } from '@/ai/flows/progress-analyzer';
import { translations, type Language } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';

interface UserProgress {
  correctAnswers: number;
  totalAttempts: number;
  strugglingVerbs: string[];
  strongVerbs: string[];
  studyTimeMinutes: number;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface AIProgressDashboardProps {
  language: Language;
  userProgress: UserProgress;
}

const AIProgressDashboard: FC<AIProgressDashboardProps> = ({
  language,
  userProgress,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProgressAnalysisOutput | null>(null);
  const { toast } = useToast();

  const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
    let text = translations[key]?.[language] ?? String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };

  const handleAnalyzeProgress = async () => {
    setIsAnalyzing(true);
    try {
      const input: ProgressAnalysisInput = {
        correctAnswers: userProgress.correctAnswers,
        totalAttempts: userProgress.totalAttempts,
        strugglingVerbs: userProgress.strugglingVerbs,
        strongVerbs: userProgress.strongVerbs,
        studyTimeMinutes: userProgress.studyTimeMinutes,
        preferredDifficulty: userProgress.preferredDifficulty,
      };

      const result = await analyzeProgress(input);
      setAnalysis(result);
      
      toast({
        title: "Analysis Complete!",
        description: "Your personalized learning insights are ready",
      });
    } catch (error) {
      console.error('Error analyzing progress:', error);
      toast({
        title: "Error",
        description: "Failed to analyze progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const accuracyPercentage = userProgress.totalAttempts > 0 
    ? Math.round((userProgress.correctAnswers / userProgress.totalAttempts) * 100)
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'study_focus': return <Target className="h-4 w-4" />;
      case 'practice_method': return <Brain className="h-4 w-4" />;
      case 'difficulty_adjustment': return <TrendingUp className="h-4 w-4" />;
      case 'time_management': return <Clock className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <Card className="card-modern animate-fade-in-scale">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <Brain className="mr-3 h-8 w-8" />
          AI Progress Dashboard
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          Personalized insights powered by artificial intelligence
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{accuracyPercentage}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-gradient-to-br from-secondary/10 to-transparent">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary">{Math.round(userProgress.studyTimeMinutes)}</div>
              <div className="text-sm text-muted-foreground">Minutes Studied</div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent">{userProgress.strongVerbs.length}</div>
              <div className="text-sm text-muted-foreground">Mastered Verbs</div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Button */}
        <Button 
          onClick={handleAnalyzeProgress}
          disabled={isAnalyzing || userProgress.totalAttempts === 0}
          size="lg"
          className="w-full btn-gradient-primary hover:scale-105 transition-transform"
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner size={20} />
              <span className="ml-2">Analyzing Your Progress...</span>
            </>
          ) : (
            <>
              <Brain className="mr-2 h-5 w-5" />
              Get AI Analysis & Recommendations
            </>
          )}
        </Button>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6 animate-slide-in-up">
            {/* Overall Score */}
            <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{analysis.overallScore}/100</div>
                <div className="text-lg font-semibold mb-4">Overall Learning Score</div>
                <Progress value={analysis.overallScore} className="h-3 bg-muted/50" />
              </CardContent>
            </Card>

            {/* Motivational Message */}
            <Alert className="border-accent/50 bg-accent/5">
              <Star className="h-5 w-5 text-accent" />
              <AlertDescription className="text-lg font-medium text-accent-foreground">
                {analysis.motivationalMessage}
              </AlertDescription>
            </Alert>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-green-300/50 bg-green-50/50 dark:bg-green-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-red-300/50 bg-red-50/50 dark:bg-red-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700 dark:text-red-300">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-primary" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.recommendations.map((rec, index) => (
                  <Alert key={index} className="border border-border/50 bg-card/50">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <AlertDescription>{rec.description}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* Next Session Focus */}
            <Alert className="border-secondary/50 bg-secondary/5">
              <Target className="h-5 w-5 text-secondary" />
              <AlertDescription className="text-lg">
                <strong>Next Session Focus:</strong> {analysis.nextSessionFocus}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProgressDashboard; 