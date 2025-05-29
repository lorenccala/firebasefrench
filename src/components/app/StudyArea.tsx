
"use client";

import type { FC } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Eye, Info, Edit3
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
import GrammarExplainer from './GrammarExplainer';
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
    let text = translations[key] ? translations[key][language] : String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        // This is a naive replace, might need more robust solution for ReactNode
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    // For strings that might contain HTML (like the description)
    if (key === 'studyZoneDescription' && params?.mode) {
        return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return text;
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Edit3 className="mr-3 h-6 w-6 text-primary" />
            {t('studyZoneTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">{t('loadingChunkData')}</p>
        </CardContent>
      </Card>
    );
  }

  if (allSentencesCount === 0) {
     return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                    <Info className="mr-3 h-6 w-6 text-primary" />
                    {t('noSentencesLoadedTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertTitle>{t('noSentencesLoadedTitle')}</AlertTitle>
                    <AlertDescription>
                        {t('noSentencesLoadedDescription')}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
     );
  }

  if (!sentence && sentenceCounter.totalInChunk === 0 && !isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                    <Info className="mr-3 h-6 w-6 text-primary" />
                     {t('chunkEmptyTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert variant="default" className="bg-secondary/30">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('noSentenceSelectedTitle')}</AlertTitle>
                    <AlertDescription>
                        {t('chunkEmptyDescription')}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  const progressPercentage = sentenceCounter.totalInChunk > 0 ? (sentenceCounter.currentNum / sentenceCounter.totalInChunk) * 100 : 0;

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Edit3 className="mr-3 h-6 w-6 text-primary" />
          {t('studyZoneTitle')}
        </CardTitle>
        <CardDescription>
          {t('studyZoneDescription', { mode: studyMode })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sentence ? (
          <div className="p-6 rounded-lg bg-muted/50 min-h-[160px] flex flex-col justify-center shadow-inner">
            <div className="min-h-[100px] mb-4 flex flex-col justify-center">
              { (isAnswerRevealed || studyMode !== StudyMode.ActiveRecall) && sentence.verbFrench && sentence.verbEnglish && (
                <div className="mb-3 text-center">
                  <p className="text-sm text-muted-foreground" data-ai-hint="verb conjugation">
                    {t('verbLabel')}: <span className="font-semibold text-primary">{sentence.verbFrench}</span> ({t('verbToLabel')} {sentence.verbEnglish})
                  </p>
                </div>
              )}
              <p className="text-2xl font-semibold text-primary-foreground bg-primary p-3 rounded-md shadow text-center" data-ai-hint="foreign language text">
                {sentence.french}
              </p>
              {(isAnswerRevealed || studyMode !== StudyMode.ActiveRecall) && (
                 <p className="text-lg text-muted-foreground mt-3 text-center pt-2" data-ai-hint="english translation text">
                  {sentence.english}
                </p>
              )}
              {studyMode === StudyMode.ActiveRecall && !isAnswerRevealed && (
                <Button onClick={onRevealAnswer} className="mt-4 mx-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Eye className="mr-2 h-4 w-4" /> {t('revealAnswerButton')}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button onClick={audioControls.onPrev} variant="outline" size="icon" disabled={audioControls.disablePrev}>
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button onClick={audioControls.onTogglePlayPause} variant="default" size="icon" className="w-12 h-12 bg-primary hover:bg-primary/90">
                    {audioControls.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  <Button onClick={audioControls.onNext} variant="outline" size="icon" disabled={audioControls.disableNext}>
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button onClick={audioControls.onToggleLoop} variant={audioControls.isLooping ? "secondary" : "outline"} size="icon">
                    <RotateCcw className={`h-5 w-5 ${audioControls.isLooping ? 'text-primary' : ''}`} />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="playback-speed" className="text-sm whitespace-nowrap">{t('playbackSpeedLabel')}</Label>
                  <Select
                    value={String(audioControls.playbackSpeed)}
                    onValueChange={(value) => audioControls.onPlaybackSpeedChange(Number(value))}
                  >
                    <SelectTrigger id="playback-speed" className="w-[80px]">
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

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('sentenceCounterInChunk', {current: sentenceCounter.currentNum, total: sentenceCounter.totalInChunk})}
                </p>
                <Progress value={progressPercentage} className="w-full h-2 mt-1" />
              </div>
            </div>
          </div>
        ) : (
            <Alert variant="default" className="bg-secondary/30">
                <Info className="h-4 w-4" />
                <AlertTitle>{t('noSentenceSelectedTitle')}</AlertTitle>
                <AlertDescription>
                {t('noSentenceSelectedDescription')}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          {t('audioSourceInfo')}
        </p>
        <GrammarExplainer language={language} sentence={sentence} disabled={!sentence || isLoading} />
      </CardFooter>
    </Card>
  );
};

export default StudyArea;
