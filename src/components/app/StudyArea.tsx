"use client";

import type { FC } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Eye, Info, Edit3, Volume2, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Sentence, StudyMode } from '@/types';
import { PLAYBACK_SPEEDS } from '@/lib/constants';
import { LoadingSpinner } from './LoadingSpinner';
// GrammarExplainer removed from here
import { translations, type Language } from '@/lib/translations';

interface AudioControls {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  disablePrev: boolean;
  disableNext: boolean;
}

interface SentenceCounter {
  currentNum: number;
  totalInChunk: number;
  totalAll: number;
}

interface StudyAreaProps {
  language: Language;
  sentence: Sentence | null;
  studyMode: StudyMode;
  isAnswerRevealed: boolean;
  onRevealAnswer: () => void;
  audioControls: AudioControls;
  sentenceCounter: SentenceCounter;
  isLoading: boolean;
  allSentencesCount: number;
}

const StudyArea: FC<StudyAreaProps> = ({
  language,
  sentence,
  studyMode,
  isAnswerRevealed,
  onRevealAnswer,
  audioControls,
  sentenceCounter,
  isLoading,
  allSentencesCount
}) => {

   const t = (key: keyof typeof translations, params?: Record<string, string | number | React.ReactNode>) => {
    let text = translations[key]?.[language] ?? String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    if (key === 'studyZoneDescription' && params?.mode) {
        return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return text;
  };


  if (isLoading) {
    return (
      <Card className="card-modern animate-fade-in-scale">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
            <Edit3 className="mr-3 h-8 w-8 animate-pulse" />
            {t('studyZoneTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <div className="animate-pulse-glow">
            <LoadingSpinner />
          </div>
          <p className="mt-6 text-muted-foreground text-lg animate-slide-in-up">{t('loadingChunkData')}</p>
        </CardContent>
      </Card>
    );
  }

  if (allSentencesCount === 0) {
     return (
        <Card className="card-modern animate-fade-in-scale">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center text-responsive-2xl text-destructive">
                    <Info className="mr-3 h-8 w-8" />
                    {t('noSentencesLoadedTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert className="border-destructive/50 bg-destructive/5">
                    <AlertTitle className="text-destructive">{t('noSentencesLoadedTitle')}</AlertTitle>
                    <AlertDescription className="text-destructive/80">
                        {t('noSentencesLoadedDescription')}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
     );
  }

  if (!sentence && sentenceCounter.totalInChunk === 0 && !isLoading) {
    return (
        <Card className="card-modern animate-fade-in-scale">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center text-responsive-2xl text-accent">
                    <Info className="mr-3 h-8 w-8" />
                     {t('chunkEmptyTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert className="border-accent/50 bg-accent/5">
                    <Info className="h-5 w-5 text-accent" />
                    <AlertTitle className="text-accent">{t('noSentenceSelectedTitle')}</AlertTitle>
                    <AlertDescription className="text-accent/80">
                        {t('chunkEmptyDescription')}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  const progressPercentage = sentenceCounter.totalInChunk > 0 ? (sentenceCounter.currentNum / sentenceCounter.totalInChunk) * 100 : 0;
  
  const targetSentenceText = sentence ? sentence.french : '';
  let translationText = '';
  let verbDisplay = '';

  if (sentence) {
    if (language === 'al') {
      translationText = sentence.albanianSentence || '';
      verbDisplay = sentence.verbFrench ? `${sentence.verbFrench}${sentence.verbAlbanian ? ` (${sentence.verbAlbanian})` : ''}` : '';
    } else { // Default to English UI
      translationText = sentence.english || '';
      verbDisplay = sentence.verbFrench ? `${sentence.verbFrench}${sentence.verbEnglish ? ` (${t('verbToLabel')} ${sentence.verbEnglish})` : ''}` : '';
    }
  }


  return (
    <Card className="card-modern w-full animate-fade-in-scale">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center text-responsive-2xl text-primary">
          <Edit3 className="mr-3 h-8 w-8" />
          {t('studyZoneTitle')}
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          {t('studyZoneDescription', { mode: studyMode })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {sentence ? (
          <div className="space-y-6">
            {/* Main Sentence Display */}
            <div className="study-sentence-card animate-slide-in-up">
              <div className="relative z-10">
                {/* Verb Display */}
                {(isAnswerRevealed || studyMode !== StudyMode.ActiveRecall) && verbDisplay && (
                  <div className="mb-4 text-center animate-fade-in-scale">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                      <span className="text-sm font-medium text-primary">{t('verbLabel')}:</span>
                      <span className="font-bold text-primary text-lg" data-ai-hint="verb conjugation">
                        {verbDisplay}
                      </span>
                    </div>
                  </div>
                )}

                {/* French Sentence */}
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-primary via-primary to-secondary p-6 rounded-2xl shadow-xl">
                    <p className="text-responsive-2xl font-bold text-primary-foreground leading-relaxed" data-ai-hint="foreign language text">
                      {targetSentenceText}
                    </p>
                  </div>
                </div>

                {/* Translation */}
                {(isAnswerRevealed || studyMode !== StudyMode.ActiveRecall) && (
                  <div className="text-center animate-slide-in-up">
                    <p className="text-responsive-xl text-muted-foreground font-medium leading-relaxed" data-ai-hint="translation text">
                      {translationText}
                    </p>
                  </div>
                )}

                {/* Reveal Answer Button */}
                {studyMode === StudyMode.ActiveRecall && !isAnswerRevealed && (
                  <div className="text-center mt-6 animate-fade-in-scale">
                    <Button 
                      onClick={onRevealAnswer} 
                      size="lg"
                      className="btn-gradient-secondary hover:scale-105 transition-transform"
                    >
                      <Eye className="mr-2 h-5 w-5" /> 
                      {t('revealAnswerButton')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Audio Controls */}
            <div className="bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 rounded-2xl p-6 shadow-inner">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Playback Controls */}
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={audioControls.onPrev} 
                    variant="outline" 
                    size="lg"
                    disabled={audioControls.disablePrev}
                    className="audio-control hover:scale-105 transition-transform"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    onClick={audioControls.onTogglePlayPause} 
                    size="lg"
                    className="btn-gradient-primary w-16 h-16 rounded-full hover:scale-110 transition-transform animate-pulse-glow"
                  >
                    {audioControls.isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
                  
                  <Button 
                    onClick={audioControls.onNext} 
                    variant="outline" 
                    size="lg"
                    disabled={audioControls.disableNext}
                    className="audio-control hover:scale-105 transition-transform"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    onClick={audioControls.onToggleLoop} 
                    variant={audioControls.isLooping ? "default" : "outline"} 
                    size="lg"
                    className={`audio-control transition-all ${audioControls.isLooping ? 'btn-gradient-accent animate-pulse' : ''}`}
                  >
                    <RotateCcw className={`h-5 w-5 ${audioControls.isLooping ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <Label htmlFor="playback-speed" className="text-sm font-medium whitespace-nowrap">
                      {t('playbackSpeedLabel')}
                    </Label>
                  </div>
                  <Select
                    value={String(audioControls.playbackSpeed)}
                    onValueChange={(value) => audioControls.onPlaybackSpeedChange(Number(value))}
                  >
                    <SelectTrigger id="playback-speed" className="w-24 bg-card border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <SelectItem key={speed} value={String(speed)}>
                          {speed}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Headphones className="h-5 w-5 text-primary" />
                <p className="text-lg font-semibold text-foreground">
                  {t('sentenceCounterInChunk', {current: sentenceCounter.currentNum, total: sentenceCounter.totalInChunk})}
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-muted/50 shadow-inner"
                  style={{
                    '--progress': `${progressPercentage}%`
                  } as React.CSSProperties}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(progressPercentage)}% Complete
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Alert className="border-secondary/50 bg-secondary/5 animate-fade-in-scale">
            <Info className="h-5 w-5 text-secondary" />
            <AlertTitle className="text-secondary">{t('noSentenceSelectedTitle')}</AlertTitle>
            <AlertDescription className="text-secondary/80">
              {t('noSentenceSelectedDescription')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-center gap-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          <span>{t('audioSourceInfoFile')}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StudyArea;
