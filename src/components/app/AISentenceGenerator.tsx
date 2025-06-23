"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from './LoadingSpinner';
import { generateSentences, type GenerateSentenceInput, type GenerateSentenceOutput } from '@/ai/flows/sentence-generator';
import { translations, type Language } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';

interface AISentenceGeneratorProps {
  language: Language;
  onSentencesGenerated?: (sentences: GenerateSentenceOutput['sentences']) => void;
}

const AISentenceGenerator: FC<AISentenceGeneratorProps> = ({
  language,
  onSentencesGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSentences, setGeneratedSentences] = useState<GenerateSentenceOutput['sentences'] | null>(null);
  const [verb, setVerb] = useState('être');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [count, setCount] = useState(3);
  const [tense, setTense] = useState('');
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

  const handleGenerate = async () => {
    if (!verb.trim()) {
      toast({
        title: "Error",
        description: "Please enter a French verb",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const input: GenerateSentenceInput = {
        verb: verb.trim(),
        difficulty,
        count,
        ...(tense && { tense }),
      };

      const result = await generateSentences(input);
      setGeneratedSentences(result.sentences);
      onSentencesGenerated?.(result.sentences);
      
      toast({
        title: "Success!",
        description: `Generated ${result.sentences.length} practice sentences`,
      });
    } catch (error) {
      console.error('Error generating sentences:', error);
      toast({
        title: "Error",
        description: "Failed to generate sentences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    <Card className="card-modern animate-fade-in-scale">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <Wand2 className="mr-3 h-8 w-8" />
          AI Sentence Generator
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          Generate personalized French practice sentences using AI
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="verb">French Verb</Label>
            <Input
              id="verb"
              value={verb}
              onChange={(e) => setVerb(e.target.value)}
              placeholder="e.g., avoir, faire, aller"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of Sentences</Label>
            <Select value={count.toString()} onValueChange={(value) => setCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tense">Specific Tense (Optional)</Label>
            <Input
              id="tense"
              value={tense}
              onChange={(e) => setTense(e.target.value)}
              placeholder="e.g., présent, passé composé"
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !verb.trim()}
          size="lg"
          className="w-full btn-gradient-primary hover:scale-105 transition-transform"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size={20} />
              <span className="ml-2">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Sentences
            </>
          )}
        </Button>

        {/* Generated Sentences */}
        {generatedSentences && (
          <div className="space-y-4 animate-slide-in-up">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Generated Practice Sentences</h3>
            </div>
            
            {generatedSentences.map((sentence, index) => (
              <Card key={index} className="border border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-primary mb-2">
                        {sentence.french}
                      </p>
                      <p className="text-muted-foreground mb-3">
                        {sentence.english}
                      </p>
                      <Alert className="bg-muted/30 border-border/50">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <AlertDescription className="text-sm">
                          <strong>Grammar:</strong> {sentence.explanation}
                        </AlertDescription>
                      </Alert>
                    </div>
                    <Badge className={`ml-2 ${difficultyColors[difficulty]}`}>
                      {difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button 
              onClick={handleGenerate}
              variant="outline"
              className="w-full hover:scale-105 transition-transform"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New Sentences
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISentenceGenerator; 