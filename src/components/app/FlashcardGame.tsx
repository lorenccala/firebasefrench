"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { Zap, ChevronLeft, ChevronRight, Eye, CheckCircle, RotateCcw, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

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
      setIsFlipped(false);
    } else {
      setWordsToPractice([]);
    }
  }, [sentences]);

  const currentWord = useMemo(() => {
    return wordsToPractice[currentWordIndex];
  }, [wordsToPractice, currentWordIndex]);

  const learnedCount = learnedWords.size;
  const totalWords = wordsToPractice.length;

  const handleNextWord = () => {
    if (wordsToPractice.length === 0) return;
    setIsMeaningRevealed(false);
    setIsFlipped(false);
    setCurrentWordIndex(prevIndex => (prevIndex + 1) % wordsToPractice.length);
  };

  const handlePrevWord = () => {
    if (wordsToPractice.length === 0) return;
    setIsMeaningRevealed(false);
    setIsFlipped(false);
    setCurrentWordIndex(prevIndex => (prevIndex - 1 + wordsToPractice.length) % wordsToPractice.length);
  };

  const handleRevealMeaning = () => {
    setIsMeaningRevealed(true);
    setIsFlipped(true);
  };
  
  const handleMarkAsLearned = () => {
    if (currentWord) {
      setLearnedWords(prev => new Set(prev).add(currentWord.frenchVerb));
    }
  };

  const handleResetProgress = () => {
    setLearnedWords(new Set());
  };

  if (isLoading) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <Zap className="mr-3 h-8 w-8 animate-pulse" />
            {t('flashcardGameTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <div className="animate-pulse-glow">
            <LoadingSpinner />
          </div>
          <p className="mt-6 text-muted-foreground text-lg animate-slide-in-up">{t('loadingFlashcards')}</p>
        </CardContent>
      </Card>
    );
  }

  if (wordsToPractice.length === 0 && !isLoading) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <Zap className="mr-3 h-8 w-8" />
            {t('flashcardGameTitle')}
          </CardTitle>
           <CardDescription className="text-lg mt-2">{t('flashcardGameDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-accent/50 bg-accent/5">
            <Target className="h-5 w-5 text-accent" />
            <AlertDescription className="text-center text-accent/80 text-lg">
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
    const regex = new RegExp(`\\b(${verb}(?:e|es|s|ons|ez|ent|ai|as|a|âmes|âtes|èrent|ais|ait|ions|iez|aient|rai|ras|ra|rons|rez|ront)?)\\b`, 'gi');
    return sentence.replace(regex, '<strong class="text-primary font-bold bg-primary/10 px-1 rounded">$1</strong>');
  };

  return (
    <Card className="card-modern w-full animate-fade-in-scale">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <Zap className="mr-3 h-8 w-8" />
          {t('flashcardGameTitle')}
        </CardTitle>
        <CardDescription className="text-lg mt-2">{t('flashcardGameDescription')}</CardDescription>
        
        {/* Progress Stats */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" />
            {learnedCount}/{totalWords} {t('learnedStatus')}
          </Badge>
          {learnedCount > 0 && (
            <Button
              onClick={handleResetProgress}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {currentWord ? (
          <div className="flex flex-col items-center">
            {/* Enhanced Flashcard */}
            <div className="relative w-full max-w-lg mx-auto">
              <div className={`flashcard flashcard-flip ${isFlipped ? 'flipped' : ''}`}>
                <div className="relative w-full h-80 rounded-2xl shadow-2xl preserve-3d">
                  {/* Front of Card */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary via-primary to-secondary p-8 rounded-2xl flex flex-col items-center justify-center">
                    {isCurrentWordLearned && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white animate-pulse">
                          <CheckCircle className="h-4 w-4 mr-1"/>
                          Mastered!
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary-foreground mb-4 animate-float" data-ai-hint="flashcard word french">
                        {currentWord.frenchVerb}
                      </p>
                      <div className="w-16 h-1 bg-primary-foreground/30 rounded-full mx-auto"></div>
                      <p className="text-primary-foreground/80 mt-4 text-lg">
                        French Verb
                      </p>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div className="absolute inset-0 backface-hidden rotateY-180 bg-gradient-to-br from-card via-card to-muted/30 p-8 rounded-2xl flex flex-col items-center justify-center border border-border/50">
                    <div className="text-center space-y-6 w-full">
                      <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                        <p className="text-3xl font-bold text-secondary mb-2" data-ai-hint="translation word meaning">
                          {translation || (language === 'al' ? t('noAlbanianTranslation') : t('noEnglishTranslation'))}
                        </p>
                        <div className="w-12 h-1 bg-secondary/30 rounded-full mx-auto"></div>
                        <p className="text-secondary/70 mt-2 text-sm uppercase tracking-wide">
                          {language === 'al' ? 'Albanian' : 'English'} Translation
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                          Example Usage
                        </p>
                        <p 
                          className="text-base leading-relaxed" 
                          data-ai-hint="context sentence example"
                          dangerouslySetInnerHTML={{ __html: highlightVerbInSentence(currentWord.frenchSentence, currentWord.frenchVerb) }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-lg mx-auto space-y-4 mt-8">
              {!isMeaningRevealed && currentWord && (
                <Button 
                  onClick={handleRevealMeaning} 
                  size="lg"
                  className="w-full btn-gradient-accent hover:scale-105 transition-transform text-lg py-6"
                >
                  <Eye className="mr-3 h-6 w-6" />
                  {t('revealMeaningButton')}
                </Button>
              )}
              
              {isMeaningRevealed && currentWord && !isCurrentWordLearned && (
                <Button 
                  onClick={handleMarkAsLearned} 
                  size="lg"
                  className="w-full bg-green-500 hover:bg-green-600 text-white hover:scale-105 transition-transform text-lg py-6"
                >
                  <CheckCircle className="mr-3 h-6 w-6" />
                  {t('markAsLearnedButton')}
                </Button>
              )}
              
              {isMeaningRevealed && currentWord && isCurrentWordLearned && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-lg font-semibold">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    You've mastered this word!
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center h-80">
            <Alert className="border-secondary/50 bg-secondary/5">
              <Target className="h-5 w-5 text-secondary" />
              <AlertDescription className="text-secondary/80 text-center text-lg">
                {t('noWordsForFlashcards')}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-6 border-t border-border/50">
        <Button 
          onClick={handlePrevWord} 
          variant="outline" 
          size="lg"
          disabled={wordsToPractice.length <= 1}
          className="hover:scale-105 transition-transform"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> 
          {t('prevWordButton')}
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            {wordsToPractice.length > 0 ? t('wordCounter', { current: currentWordIndex + 1, total: wordsToPractice.length }) : ''}
          </p>
          {totalWords > 0 && (
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${(learnedCount / totalWords) * 100}%` }}
              />
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleNextWord} 
          variant="outline" 
          size="lg"
          disabled={wordsToPractice.length <= 1}
          className="hover:scale-105 transition-transform"
        >
          {t('nextWordButton')} 
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardGame;

