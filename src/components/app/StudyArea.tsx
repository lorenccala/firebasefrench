"use client";

import type { FC } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, ChevronDown, Eye, EyeOff, Info, Edit3
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
import { type Sentence, StudyMode } from '@/types'; // Added StudyMode import
import { PLAYBACK_SPEEDS } from '@/lib/constants';
import { LoadingSpinner } from './LoadingSpinner';
import GrammarExplainer from './GrammarExplainer';

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
  sentence,
  studyMode,
  isAnswerRevealed,
  onRevealAnswer,
  audioControls,
  sentenceCounter,
  isLoading,
  allSentencesCount
}) => {

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Edit3 className="mr-3 h-6 w-6 text-primary" />
            Study Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading sentences...</p>
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
                    No Sentences Loaded
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertTitle>Data Missing</AlertTitle>
                    <AlertDescription>
                        No sentences are available. Please check if the data source is configured correctly or try reloading the application.
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
                    Chunk Empty or Not Loaded
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert variant="default" className="bg-secondary/30">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Sentences in Current Chunk</AlertTitle>
                    <AlertDescription>
                        This chunk is empty, or you haven't loaded a chunk yet. Please select and load a chunk using the controls above.
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
          Study Zone
        </CardTitle>
        <CardDescription>
          Engage with the sentences. Current mode: <strong>{studyMode}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sentence ? (
          <>
            <div className="p-6 rounded-lg bg-muted/50 min-h-[120px] flex flex-col justify-center">
              <p className="text-2xl font-semibold text-primary-foreground bg-primary p-3 rounded-md shadow text-center" data-ai-hint="foreign language text">
                {sentence.french}
              </p>
              {studyMode === StudyMode.ActiveRecall && !isAnswerRevealed && (
                <Button onClick={onRevealAnswer} className="mt-4 mx-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Eye className="mr-2 h-4 w-4" /> Reveal Answer
                </Button>
              )}
              {(isAnswerRevealed || studyMode !== StudyMode.ActiveRecall) && (
                 <p className="text-lg text-muted-foreground mt-3 text-center pt-2" data-ai-hint="english translation text">
                  {sentence.english}
                </p>
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
                  <Label htmlFor="playback-speed" className="text-sm whitespace-nowrap">Speed:</Label>
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
                  Sentence {sentenceCounter.currentNum} of {sentenceCounter.totalInChunk} in chunk
                </p>
                <Progress value={progressPercentage} className="w-full h-2 mt-1" />
              </div>
            </div>
          </>
        ) : (
            <Alert variant="default" className="bg-secondary/30">
                <Info className="h-4 w-4" />
                <AlertTitle>No Sentence Selected</AlertTitle>
                <AlertDescription>
                Load a chunk to begin your study session.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          Audio playback uses Google Translate TTS.
        </p>
        <GrammarExplainer sentence={sentence} disabled={!sentence || isLoading} />
      </CardFooter>
    </Card>
  );
};

export default StudyArea;
