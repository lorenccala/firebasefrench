
"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { Dices, Check, RotateCcw, Info } from 'lucide-react';
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Dices className="mr-3 h-6 w-6 text-primary" />
            {t('sentenceBuilderTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">{t('loadingChallenge')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!sentence || originalWords.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Dices className="mr-3 h-6 w-6 text-primary" />
            {t('sentenceBuilderTitle')}
          </CardTitle>
          <CardDescription>{t('sentenceBuilderDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-center text-muted-foreground">
              {sentence ? t('sentenceBuilderNoWords') : t('sentenceBuilderNoSentence')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Dices className="mr-3 h-6 w-6 text-primary" />
          {t('sentenceBuilderTitle')}
        </CardTitle>
        <CardDescription>{t('sentenceBuilderDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[60px] p-3 border border-dashed rounded-md bg-muted/30 flex flex-wrap gap-2 items-center">
          {constructedWords.length === 0 && (
            <span className="text-sm text-muted-foreground italic">{t('sentenceBuilderConstructionArea')}</span>
          )}
          {constructedWords.map((word) => (
            <Badge
              key={word.id}
              variant="default"
              className="text-lg p-2 cursor-pointer hover:bg-primary/80"
              onClick={() => handleConstructedWordClick(word)}
              data-ai-hint="word constructed"
            >
              {word.text}
            </Badge>
          ))}
        </div>

        <div className="min-h-[60px] p-3 border rounded-md bg-background flex flex-wrap gap-2 items-center">
          {availableWords.length === 0 && constructedWords.length > 0 && (
            <span className="text-sm text-muted-foreground">{t('sentenceBuilderAllWordsUsed')}</span>
          )}
           {availableWords.length === 0 && constructedWords.length === 0 && (
             <span className="text-sm text-muted-foreground">{t('sentenceBuilderNoWords')}</span>
          )}
          {availableWords.map((word) => (
            <Badge
              key={word.id}
              variant="secondary"
              className="text-lg p-2 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleAvailableWordClick(word)}
              data-ai-hint="word available"
            >
              {word.text}
            </Badge>
          ))}
        </div>

        {feedbackMessage && (
          <Alert variant={isCorrect ? 'default' : 'destructive'} className={`${isCorrect ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : ''}`}>
            <AlertDescription dangerouslySetInnerHTML={{ __html: feedbackMessage }} />
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t">
        <Button onClick={handleResetChallenge} variant="outline" disabled={originalWords.length === 0}>
          <RotateCcw className="mr-2 h-4 w-4" /> {t('resetButton')}
        </Button>
        <Button 
            onClick={handleCheckSentence} 
            className="bg-primary hover:bg-primary/90"
            disabled={constructedWords.length === 0 || originalWords.length === 0 || isCorrect === true}
        >
          <Check className="mr-2 h-4 w-4" /> {t('checkButton')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SentenceBuilderGame;
