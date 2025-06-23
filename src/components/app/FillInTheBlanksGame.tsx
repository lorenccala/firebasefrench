"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { PencilLine, Check, RotateCcw, Info, SkipForward, SkipBack, Target, Edit3, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

  const progressPercentage = totalSentencesInChunk > 0 ? ((currentSentenceIndex + 1) / totalSentencesInChunk) * 100 : 0;
  const hasAttempted = userAnswer.trim().length > 0;
  const isInputFocused = document.activeElement?.getAttribute('aria-label') === t('fillInBlanksInputLabel');

  const prepareChallenge = (currentSentence: Sentence | null) => {
    setUserAnswer('');
    setFeedbackMessage('');
    setIsCorrect(null);

    if (!currentSentence || !currentSentence.french) {
      setBlankedSentence(t('sentenceBuilderNoSentence')); 
      setCorrectAnswer('');
      return;
    }

    const sourceSentence = currentSentence.french;
    // Get all words, including empty strings from multiple spaces, to preserve original structure
    const originalWordsArray = sourceSentence.split(' '); 
    // Filter to get only "actual" words for random selection
    const actualWords = originalWordsArray.filter(word => word.length > 0);

    if (actualWords.length === 0) {
      setBlankedSentence(t('fillInBlanksCannotProcessSentence'));
      setCorrectAnswer('');
      return;
    }

    const randomIndexInActualWords = Math.floor(Math.random() * actualWords.length);
    const wordToSetAsCorrectAnswer = actualWords[randomIndexInActualWords];
    setCorrectAnswer(wordToSetAsCorrectAnswer);

    // Find the original index of the chosen actual word in the originalWordsArray
    let currentActualWordCount = 0;
    let indexOfWordToBlankInOriginalArray = -1;

    for (let i = 0; i < originalWordsArray.length; i++) {
      if (originalWordsArray[i].length > 0) { // If it's one of the "actualWords"
        if (currentActualWordCount === randomIndexInActualWords) {
          indexOfWordToBlankInOriginalArray = i;
          break;
        }
        currentActualWordCount++;
      }
    }

    if (indexOfWordToBlankInOriginalArray === -1) {
      // This should theoretically not be reached if actualWords.length > 0
      setBlankedSentence(t('fillInBlanksCannotProcessSentence'));
      setCorrectAnswer('');
      return;
    }
    
    const sentenceWithBlankParts = originalWordsArray.map((word, index) => {
      if (index === indexOfWordToBlankInOriginalArray) {
        return '___BLANK___';
      }
      return word;
    });
    
    setBlankedSentence(sentenceWithBlankParts.join(' '));
  };

  useEffect(() => {
    prepareChallenge(sentence);
  }, [sentence, language]);

  const handleCheckAnswer = () => {
    if (!correctAnswer) {
      setFeedbackMessage(t('fillInBlanksNoChallenge'));
      setIsCorrect(null);
      return;
    }
    if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      setIsCorrect(true);
      setFeedbackMessage(t('fillInBlanksCorrect', { answer: correctAnswer }));
    } else {
      setIsCorrect(false);
      setFeedbackMessage(t('fillInBlanksIncorrect', { correctAnswer: correctAnswer }));
    }
  };

  const handleResetChallenge = () => {
    prepareChallenge(sentence);
  };
  
  const handleUserAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
    if (feedbackMessage) setFeedbackMessage('');
    if (isCorrect !== null) setIsCorrect(null);
  };

  if (isLoading) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <PencilLine className="mr-3 h-8 w-8 animate-pulse" />
            {t('fillInTheBlanksTitle')}
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

  if (!sentence) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <PencilLine className="mr-3 h-8 w-8" />
            {t('fillInTheBlanksTitle')}
          </CardTitle>
          <CardDescription className="text-lg mt-2">{t('fillInTheBlanksDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-accent/50 bg-accent/5">
            <Target className="h-5 w-5 text-accent" />
            <AlertDescription className="text-center text-accent/80 text-lg">
              {t('sentenceBuilderNoSentence')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!correctAnswer) {
     return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <PencilLine className="mr-3 h-8 w-8" />
            {t('fillInTheBlanksTitle')}
          </CardTitle>
           <CardDescription className="text-lg mt-2">{t('fillInTheBlanksDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDescription className="text-center text-destructive/80 text-lg">
              {blankedSentence || t('fillInBlanksCannotProcessSentence')}
            </AlertDescription>
          </Alert>
        </CardContent>
         <CardFooter className="flex justify-between items-center gap-4 pt-6 border-t border-border/50">
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
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="card-modern w-full animate-fade-in-scale">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <PencilLine className="mr-3 h-8 w-8" />
          {t('fillInTheBlanksTitle')}
        </CardTitle>
        <CardDescription className="text-lg mt-2">{t('fillInTheBlanksDescription')}</CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-4 py-2">
            <Edit3 className="h-4 w-4 mr-2" />
            {hasAttempted ? 'Attempted' : 'Ready'}
          </Badge>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30 px-4 py-2">
            Sentence {currentSentenceIndex + 1}/{totalSentencesInChunk}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Main Challenge Area */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">?</span>
            </div>
            <h3 className="text-lg font-semibold text-primary">Complete the Sentence</h3>
          </div>
          
          <div className="min-h-[120px] p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 flex flex-col justify-center items-center text-center shadow-inner">
            <div className="text-responsive-xl leading-relaxed" data-ai-hint="sentence with blank">
              {blankedSentence.split('___BLANK___').map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span className="font-medium text-foreground">{part}</span>
                  {index < arr.length - 1 && (
                    <div className="inline-block mx-4 my-2">
                      <Input
                        type="text"
                        value={userAnswer}
                        onChange={handleUserAnswerChange}
                        className={`w-40 text-xl text-center font-bold border-2 rounded-xl transition-all duration-300 ${
                          isCorrect === true 
                            ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                            : isCorrect === false 
                            ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                            : 'border-primary/50 bg-background hover:border-primary focus:border-accent focus:ring-2 focus:ring-accent/20'
                        }`}
                        disabled={isCorrect === true}
                        aria-label={t('fillInBlanksInputLabel')}
                        placeholder="?"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        {/* Enhanced Feedback */}
        {feedbackMessage && (
          <div className="animate-slide-in-up">
            <Alert 
              variant={isCorrect === null ? 'default' : (isCorrect ? 'default' : 'destructive')} 
              className={`${
                isCorrect 
                  ? 'game-element-correct animate-pulse-glow' 
                  : isCorrect === false
                  ? 'game-element-incorrect'
                  : ''
              } border-2`}
            >
              <div className="flex items-center gap-2">
                {isCorrect === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : isCorrect === false ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Info className="h-5 w-5 text-blue-600" />
                )}
                <AlertDescription 
                  className={`text-lg font-medium ${
                    isCorrect === true ? 'text-green-800 dark:text-green-200' : 
                    isCorrect === false ? 'text-red-800 dark:text-red-200' : 
                    'text-blue-800 dark:text-blue-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: feedbackMessage }} 
                />
              </div>
            </Alert>
          </div>
        )}
        
        {/* Translation Hint */}
        {sentence && (sentence.english || sentence.albanianSentence) && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{t('fillInBlanksHintLabel')}</span>
            </div>
            <p className="text-muted-foreground text-center italic text-lg">
              {language === 'al' ? (sentence.albanianSentence || sentence.english) : sentence.english}
            </p>
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
            className="hover:scale-105 transition-transform"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> 
            {t('resetButton')}
          </Button>
          <Button 
            onClick={handleCheckAnswer} 
            size="lg"
            disabled={!userAnswer || isCorrect === true || !correctAnswer}
            className={`transition-all ${
              userAnswer.trim().length > 0 && correctAnswer
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

export default FillInTheBlanksGame;
    