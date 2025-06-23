"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { Dices, Check, RotateCcw, Info, SkipForward, SkipBack, Target, Puzzle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { type Sentence } from '@/types';
import { translations, type Language } from '@/lib/translations';
import { LoadingSpinner } from './LoadingSpinner';

interface WordToken {
  id: string; // Unique ID for key prop, especially for duplicate words
  text: string;
}

interface SentenceBuilderGameProps {
  language: Language;
  sentence: Sentence | null;
  isLoading: boolean;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  currentSentenceIndex: number;
  totalSentencesInChunk: number;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const SentenceBuilderGame: FC<SentenceBuilderGameProps> = ({
  language,
  sentence,
  isLoading,
  onNextSentence,
  onPrevSentence,
  currentSentenceIndex,
  totalSentencesInChunk,
}) => {
  const [originalWords, setOriginalWords] = useState<WordToken[]>([]);
  const [availableWords, setAvailableWords] = useState<WordToken[]>([]);
  const [constructedWords, setConstructedWords] = useState<WordToken[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const t = (key: keyof typeof translations, params?: Record<string, string | number | React.ReactNode>) => {
    let text = translations[key]?.[language] ?? String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };

  const progressPercentage = totalSentencesInChunk > 0 ? ((currentSentenceIndex + 1) / totalSentencesInChunk) * 100 : 0;
  const wordsUsedPercentage = originalWords.length > 0 ? (constructedWords.length / originalWords.length) * 100 : 0;

  const prepareChallenge = (frenchSentence: string | undefined) => {
    if (!frenchSentence) {
      setOriginalWords([]);
      setAvailableWords([]);
      setConstructedWords([]);
      setFeedbackMessage('');
      setIsCorrect(null);
      return;
    }
    // Split by space, keeping punctuation attached to words.
    // Filter out empty strings that might result from multiple spaces.
    const words = frenchSentence.split(' ').filter(word => word.length > 0);
    const tokens = words.map((word, index) => ({ id: `${word}-${index}`, text: word }));
    
    setOriginalWords(tokens);
    setAvailableWords(shuffleArray(tokens));
    setConstructedWords([]);
    setFeedbackMessage('');
    setIsCorrect(null);
  };

  useEffect(() => {
    prepareChallenge(sentence?.french);
  }, [sentence]);

  const handleAvailableWordClick = (wordToken: WordToken) => {
    setAvailableWords(prev => prev.filter(w => w.id !== wordToken.id));
    setConstructedWords(prev => [...prev, wordToken]);
    setFeedbackMessage('');
    setIsCorrect(null);
  };

  const handleConstructedWordClick = (wordToken: WordToken) => {
    setConstructedWords(prev => prev.filter(w => w.id !== wordToken.id));
    // Add back to available words, perhaps not shuffled to avoid confusion during building
    setAvailableWords(prev => [...prev, wordToken]); // Could re-shuffle or sort if desired
    setFeedbackMessage('');
    setIsCorrect(null);
  };

  const handleCheckSentence = () => {
    if (!sentence) return;
    const constructedSentence = constructedWords.map(w => w.text).join(' ');
    const originalFrenchSentence = originalWords.map(w => w.text).join(' ');

    if (constructedSentence === originalFrenchSentence) {
      setIsCorrect(true);
      setFeedbackMessage(t('sentenceBuilderCorrect'));
    } else {
      setIsCorrect(false);
      setFeedbackMessage(t('sentenceBuilderIncorrect', { correctSentence: originalFrenchSentence }));
    }
  };

  const handleResetChallenge = () => {
    prepareChallenge(sentence?.french);
  };

  if (isLoading) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <Dices className="mr-3 h-8 w-8 animate-pulse" />
            {t('sentenceBuilderTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <div className="animate-pulse-glow">
            <LoadingSpinner />
          </div>
          <p className="mt-6 text-muted-foreground text-lg animate-slide-in-up">{t('loadingChallenge')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!sentence || originalWords.length === 0) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <Dices className="mr-3 h-8 w-8" />
            {t('sentenceBuilderTitle')}
          </CardTitle>
          <CardDescription className="text-lg mt-2">{t('sentenceBuilderDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-accent/50 bg-accent/5">
            <Target className="h-5 w-5 text-accent" />
            <AlertDescription className="text-center text-accent/80 text-lg">
              {sentence ? t('sentenceBuilderNoWords') : t('sentenceBuilderNoSentence')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern w-full animate-fade-in-scale">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <Dices className="mr-3 h-8 w-8" />
          {t('sentenceBuilderTitle')}
        </CardTitle>
        <CardDescription className="text-lg mt-2">{t('sentenceBuilderDescription')}</CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-4 py-2">
            <Puzzle className="h-4 w-4 mr-2" />
            {Math.round(wordsUsedPercentage)}% Built
          </Badge>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30 px-4 py-2">
            Sentence {currentSentenceIndex + 1}/{totalSentencesInChunk}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Construction Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold text-primary">Construction Zone</h3>
          </div>
          
          <div className="min-h-[80px] p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 flex flex-wrap gap-3 items-center transition-all duration-300 hover:border-primary/50">
            {constructedWords.length === 0 && (
              <div className="w-full text-center py-6">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-float" />
                <span className="text-muted-foreground italic text-lg">{t('sentenceBuilderConstructionArea')}</span>
              </div>
            )}
            {constructedWords.map((word, index) => (
              <div
                key={word.id}
                className="game-element game-element-selected animate-slide-in-up hover:scale-105 transition-all duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleConstructedWordClick(word)}
                data-ai-hint="word constructed"
              >
                <span className="text-lg font-semibold text-primary">{word.text}</span>
              </div>
            ))}
          </div>
          
          {/* Progress Bar for Construction */}
          <div className="w-full max-w-md mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${wordsUsedPercentage}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-1">
              {constructedWords.length}/{originalWords.length} words placed
            </p>
          </div>
        </div>

        {/* Available Words Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold text-secondary">Available Words</h3>
          </div>
          
          <div className="min-h-[80px] p-6 border border-border/50 rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 flex flex-wrap gap-3 items-center shadow-inner">
            {availableWords.length === 0 && constructedWords.length > 0 && (
              <div className="w-full text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <span className="text-muted-foreground font-medium">{t('sentenceBuilderAllWordsUsed')}</span>
              </div>
            )}
            {availableWords.length === 0 && constructedWords.length === 0 && (
              <div className="w-full text-center py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <span className="text-muted-foreground">{t('sentenceBuilderNoWords')}</span>
              </div>
            )}
            {availableWords.map((word, index) => (
              <div
                key={word.id}
                className="game-element hover:scale-105 transition-all duration-200 animate-fade-in-scale"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleAvailableWordClick(word)}
                data-ai-hint="word available"
              >
                <span className="text-lg font-medium">{word.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Feedback */}
        {feedbackMessage && (
          <div className="animate-slide-in-up">
            <Alert 
              variant={isCorrect ? 'default' : 'destructive'} 
              className={`${
                isCorrect 
                  ? 'game-element-correct animate-pulse-glow' 
                  : 'game-element-incorrect'
              } border-2`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription 
                  className={`text-lg font-medium ${
                    isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: feedbackMessage }} 
                />
              </div>
            </Alert>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col lg:flex-row justify-between items-center gap-4 pt-6 border-t border-border/50">
        {/* Navigation Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={onPrevSentence} 
            variant="outline" 
            size="lg"
            disabled={currentSentenceIndex === 0 || totalSentencesInChunk === 0}
            className="hover:scale-105 transition-transform"
          >
            <SkipBack className="mr-2 h-5 w-5" /> 
            {t('prevSentenceButton')}
          </Button>
          <Button 
            onClick={onNextSentence} 
            variant="outline" 
            size="lg"
            disabled={currentSentenceIndex >= totalSentencesInChunk - 1 || totalSentencesInChunk === 0}
            className="hover:scale-105 transition-transform"
          >
            {t('nextSentenceButton')} 
            <SkipForward className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {/* Action Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={handleResetChallenge} 
            variant="outline" 
            size="lg"
            disabled={originalWords.length === 0}
            className="hover:scale-105 transition-transform"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> 
            {t('resetButton')}
          </Button>
          <Button 
            onClick={handleCheckSentence} 
            size="lg"
            disabled={constructedWords.length === 0 || originalWords.length === 0 || isCorrect === true}
            className={`transition-all ${
              constructedWords.length === originalWords.length && originalWords.length > 0
                ? 'btn-gradient-primary animate-pulse-glow hover:scale-105' 
                : 'btn-gradient-secondary hover:scale-105'
            }`}
          >
            <Check className="mr-2 h-5 w-5" /> 
            {t('checkButton')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SentenceBuilderGame;
