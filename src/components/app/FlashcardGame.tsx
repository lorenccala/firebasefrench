
"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { Zap, ChevronLeft, ChevronRight, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type Sentence } from '@/types';
import { translations, type Language } from '@/lib/translations';
import { LoadingSpinner } from './LoadingSpinner';

interface FlashcardWord {
  frenchVerb: string;
  englishVerb: string;
  albanianVerb?: string;
  frenchSentence: string;
}

interface FlashcardGameProps {
  language: Language;
  sentences: Sentence[];
  isLoading: boolean;
}

const FlashcardGame: FC<FlashcardGameProps> = ({
  language,
  sentences,
  isLoading,
}) => {
  const [wordsToPractice, setWordsToPractice] = useState<FlashcardWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isMeaningRevealed, setIsMeaningRevealed] = useState<boolean>(false);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());

  const t = (key: keyof typeof translations, params?: Record<string, string | number | React.ReactNode>) => {
    let text = translations[key]?.[language] ?? String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };

  useEffect(() => {
    if (sentences.length > 0) {
      const uniqueVerbsMap = new Map<string, FlashcardWord>();
      sentences.forEach(sentence => {
        if (sentence.verbFrench && !uniqueVerbsMap.has(sentence.verbFrench)) {
          uniqueVerbsMap.set(sentence.verbFrench, {
            frenchVerb: sentence.verbFrench,
            englishVerb: sentence.verbEnglish || '',
            albanianVerb: sentence.verbAlbanian,
            frenchSentence: sentence.french,
          });
        }
      });
      setWordsToPractice(Array.from(uniqueVerbsMap.values()));
      setCurrentWordIndex(0);
      setIsMeaningRevealed(false);
      // Consider if learnedWords should be reset when the chunk changes or persist across chunks.
      // For now, it persists until a full page refresh.
    } else {
      setWordsToPractice([]);
    }
  }, [sentences]);

  const currentWord = useMemo(() => {
    return wordsToPractice[currentWordIndex];
  }, [wordsToPractice, currentWordIndex]);

  const handleNextWord = () => {
    if (wordsToPractice.length === 0) return;
    setIsMeaningRevealed(false);
    setCurrentWordIndex(prevIndex => (prevIndex + 1) % wordsToPractice.length);
  };

  const handlePrevWord = () => {
    if (wordsToPractice.length === 0) return;
    setIsMeaningRevealed(false);
    setCurrentWordIndex(prevIndex => (prevIndex - 1 + wordsToPractice.length) % wordsToPractice.length);
  };

  const handleRevealMeaning = () => {
    setIsMeaningRevealed(true);
  };
  
  const handleMarkAsLearned = () => {
    if (currentWord) {
      setLearnedWords(prev => new Set(prev).add(currentWord.frenchVerb));
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Zap className="mr-3 h-6 w-6 text-primary" />
            {t('flashcardGameTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">{t('loadingFlashcards')}</p>
        </CardContent>
      </Card>
    );
  }

  if (wordsToPractice.length === 0 && !isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Zap className="mr-3 h-6 w-6 text-primary" />
            {t('flashcardGameTitle')}
          </CardTitle>
           <CardDescription>{t('flashcardGameDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-center text-muted-foreground">
              {t('noWordsForFlashcards')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const translation = currentWord ? (language === 'al' ? currentWord.albanianVerb : currentWord.englishVerb) : '';
  const isCurrentWordLearned = currentWord && learnedWords.has(currentWord.frenchVerb);

  // Function to highlight verb in sentence (basic implementation)
  const highlightVerbInSentence = (sentence: string, verb: string) => {
    if (!sentence || !verb) return sentence;
    // A more robust regex might be needed for different verb forms/conjugations
    const regex = new RegExp(`\\b(${verb}(?:e|es|s|ons|ez|ent|ai|as|a|âmes|âtes|èrent|ais|ait|ions|iez|aient|rai|ras|ra|rons|rez|ront)?)\\b`, 'gi');
    return sentence.replace(regex, '<strong class="text-primary font-bold">$1</strong>');
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Zap className="mr-3 h-6 w-6 text-primary" />
          {t('flashcardGameTitle')}
        </CardTitle>
        <CardDescription>{t('flashcardGameDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 min-h-[280px] flex flex-col justify-between">
        {currentWord ? (
          <div className={`relative p-6 rounded-lg ${isCurrentWordLearned ? 'bg-green-100 dark:bg-green-800/30' : 'bg-muted/50'} shadow-inner text-center flex-grow flex flex-col items-center justify-center`}>
            {isCurrentWordLearned && (
                <div className="absolute top-3 right-3 flex items-center text-green-600 dark:text-green-400 text-xs font-medium p-1 bg-green-200 dark:bg-green-700/50 rounded-md">
                    <CheckCircle className="h-4 w-4 mr-1"/> {t('learnedStatus')}
                </div>
            )}
            <p className="text-4xl font-bold text-primary mb-4 break-all" data-ai-hint="flashcard word french">
              {currentWord.frenchVerb}
            </p>
            {isMeaningRevealed && (
              <div className="mt-4 space-y-3 animate-in fade-in duration-500 w-full">
                <p className="text-2xl text-secondary" data-ai-hint="translation word meaning">
                  {translation || (language === 'al' ? t('noAlbanianTranslation') : t('noEnglishTranslation'))}
                </p>
                <p 
                    className="text-sm text-muted-foreground italic mt-2 px-2" 
                    data-ai-hint="context sentence example"
                    dangerouslySetInnerHTML={{ __html: highlightVerbInSentence(currentWord.frenchSentence, currentWord.frenchVerb) }} 
                />
              </div>
            )}
          </div>
        ) : (
           <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground">{t('noWordsForFlashcards')}</p>
           </div>
        )}
        
        <div className="mt-6 space-y-3">
            {!isMeaningRevealed && currentWord && (
            <Button onClick={handleRevealMeaning} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Eye className="mr-2 h-5 w-5" />
                {t('revealMeaningButton')}
            </Button>
            )}
             {isMeaningRevealed && currentWord && !isCurrentWordLearned && (
                <Button onClick={handleMarkAsLearned} variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-100 dark:hover:bg-green-700/30 hover:text-green-700">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('markAsLearnedButton')}
                </Button>
            )}
             {isMeaningRevealed && currentWord && isCurrentWordLearned && (
                <Button onClick={() => {/* Can add "Mark as Unlearned" if needed */}} variant="ghost" className="w-full text-green-600 cursor-default">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('learnedStatus')}
                </Button>
            )}
        </div>

      </CardContent>
      <CardFooter className="flex justify-between items-center pt-6 border-t">
        <Button onClick={handlePrevWord} variant="outline" disabled={wordsToPractice.length <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {t('prevWordButton')}
        </Button>
        <p className="text-sm text-muted-foreground px-2 text-center">
          {wordsToPractice.length > 0 ? t('wordCounter', { current: currentWordIndex + 1, total: wordsToPractice.length }) : ''}
        </p>
        <Button onClick={handleNextWord} variant="outline" disabled={wordsToPractice.length <= 1}>
          {t('nextWordButton')} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardGame;

