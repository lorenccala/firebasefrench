
"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { PencilLine, Check, RotateCcw, Info, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { type Sentence } from '@/types';
import { translations, type Language } from '@/lib/translations';
import { LoadingSpinner } from './LoadingSpinner';

interface FillInTheBlanksGameProps {
  language: Language;
  sentence: Sentence | null;
  isLoading: boolean;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  currentSentenceIndex: number;
  totalSentencesInChunk: number;
}

const FillInTheBlanksGame: FC<FillInTheBlanksGameProps> = ({
  language,
  sentence,
  isLoading,
  onNextSentence,
  onPrevSentence,
  currentSentenceIndex,
  totalSentencesInChunk,
}) => {
  const [blankedSentence, setBlankedSentence] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
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

  const prepareChallenge = (currentSentence: Sentence | null) => {
    // Always reset user-specific states when preparing a new challenge
    setUserAnswer('');
    setFeedbackMessage('');
    setIsCorrect(null);

    if (!currentSentence || !currentSentence.french) {
      setBlankedSentence(t('sentenceBuilderNoSentence')); // Generic message if no sentence or its French text
      setCorrectAnswer('');
      return;
    }

    if (!currentSentence.verbFrench) {
      setBlankedSentence(t('fillInBlanksCannotCreate')); // Specific message if verb data is missing for this sentence
      setCorrectAnswer('');
      return;
    }

    const verbToBlank = currentSentence.verbFrench;
    // Use a regex to replace the verb, case-insensitive, ensuring whole word match.
    const regex = new RegExp(`\\b${verbToBlank.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    
    if (currentSentence.french.match(regex)) {
      const sentenceWithBlank = currentSentence.french.replace(regex, '_______');
      setBlankedSentence(sentenceWithBlank);
      setCorrectAnswer(verbToBlank); // Store the original form of the verb as the answer
    } else {
      // Fallback if the exact verb form isn't found (e.g. due to conjugation)
      setBlankedSentence(t('fillInBlanksVerbNotFoundInSentence'));
      setCorrectAnswer('');
    }
  };

  useEffect(() => {
    prepareChallenge(sentence);
  }, [sentence, language]); // Add language to dependencies if t() within prepareChallenge needs it

  const handleCheckAnswer = () => {
    if (!correctAnswer) {
      // This case should ideally not be hit if UI correctly gates button, but good for robustness
      setFeedbackMessage(t('fillInBlanksNoChallenge'));
      setIsCorrect(null);
      return;
    }
    // Case-insensitive comparison, trim whitespace
    if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      setIsCorrect(true);
      setFeedbackMessage(t('fillInBlanksCorrect', { answer: correctAnswer }));
    } else {
      setIsCorrect(false);
      setFeedbackMessage(t('fillInBlanksIncorrect', { correctAnswer: correctAnswer }));
    }
  };

  const handleResetChallenge = () => {
    // Re-prepare based on the current sentence, which also resets user input etc.
    prepareChallenge(sentence);
  };
  
  const handleUserAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
    if (feedbackMessage) setFeedbackMessage(''); // Clear feedback when user types
    if (isCorrect !== null) setIsCorrect(null);
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <PencilLine className="mr-3 h-6 w-6 text-primary" />
            {t('fillInTheBlanksTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">{t('loadingChallenge')}</p>
        </CardContent>
      </Card>
    );
  }

  // Case 1: No sentence data loaded into the game at all
  if (!sentence) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <PencilLine className="mr-3 h-6 w-6 text-primary" />
            {t('fillInTheBlanksTitle')}
          </CardTitle>
          <CardDescription>{t('fillInTheBlanksDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-center text-muted-foreground">
              {t('sentenceBuilderNoSentence')} {/* Message: Load a sentence... */}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Case 2: Sentence data exists, but a challenge could not be formed for IT
  // (e.g., missing verbFrench, or verbFrench not found in sentence.french)
  // In this scenario, `correctAnswer` will be '', and `blankedSentence` will hold the specific error message from `prepareChallenge`.
  if (!correctAnswer) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <PencilLine className="mr-3 h-6 w-6 text-primary" />
            {t('fillInTheBlanksTitle')}
          </CardTitle>
           <CardDescription>{t('fillInTheBlanksDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-center text-muted-foreground">
              {blankedSentence || t('fillInBlanksErrorCreating')} {/* Display specific error from prepareChallenge, or a fallback */}
            </AlertDescription>
          </Alert>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
            <Button onClick={onPrevSentence} variant="outline" disabled={currentSentenceIndex === 0 || totalSentencesInChunk === 0}>
                <SkipBack className="mr-2 h-4 w-4" /> {t('prevSentenceButton')}
            </Button>
            <Button onClick={onNextSentence} variant="outline" disabled={currentSentenceIndex >= totalSentencesInChunk - 1 || totalSentencesInChunk === 0}>
                {t('nextSentenceButton')} <SkipForward className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      </Card>
    );
  }

  // Case 3: Challenge is ready, render the game UI
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <PencilLine className="mr-3 h-6 w-6 text-primary" />
          {t('fillInTheBlanksTitle')}
        </CardTitle>
        <CardDescription>{t('fillInTheBlanksDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[80px] p-4 border border-dashed rounded-md bg-muted/30 flex flex-col justify-center items-center text-center">
          <p className="text-xl" data-ai-hint="sentence with blank">
            {blankedSentence.split('_______').map((part, index, arr) => (
              <React.Fragment key={index}>
                {part}
                {index < arr.length - 1 && (
                  <Input
                    type="text"
                    value={userAnswer}
                    onChange={handleUserAnswerChange}
                    className="inline-block w-32 mx-2 p-1 text-xl border-b-2 border-primary focus:border-accent text-center bg-transparent"
                    disabled={isCorrect === true}
                    aria-label={t('fillInBlanksInputLabel')}
                  />
                )}
              </React.Fragment>
            ))}
          </p>
        </div>
        
        {feedbackMessage && (
          <Alert variant={isCorrect === null ? 'default' : (isCorrect ? 'default' : 'destructive')} 
                 className={`${isCorrect ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : ''}`}>
            <AlertDescription dangerouslySetInnerHTML={{ __html: feedbackMessage }} />
          </Alert>
        )}
        
        {sentence && sentence.english && (
            <p className="text-sm text-muted-foreground text-center italic">
                {t('fillInBlanksHintLabel')}: {language === 'al' ? (sentence.albanianSentence || sentence.english) : sentence.english}
            </p>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
         <div className="flex gap-2">
            <Button onClick={onPrevSentence} variant="outline" disabled={currentSentenceIndex === 0 || totalSentencesInChunk === 0}>
                <SkipBack className="mr-2 h-4 w-4" /> {t('prevSentenceButton')}
            </Button>
            <Button onClick={onNextSentence} variant="outline" disabled={currentSentenceIndex >= totalSentencesInChunk - 1 || totalSentencesInChunk === 0}>
                {t('nextSentenceButton')} <SkipForward className="ml-2 h-4 w-4" />
            </Button>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleResetChallenge} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" /> {t('resetButton')}
            </Button>
            <Button 
                onClick={handleCheckAnswer} 
                className="bg-primary hover:bg-primary/90"
                disabled={!userAnswer || isCorrect === true || !correctAnswer} // Also disable if no correctAnswer
            >
            <Check className="mr-2 h-4 w-4" /> {t('checkButton')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FillInTheBlanksGame;
