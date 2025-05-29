"use client";

import type { FC } from 'react';
import { PlayCircle, StopCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContinuousListeningSectionProps {
  isPlaying: boolean;
  onPlayAll: () => void;
  onStop: () => void;
  disabled: boolean;
  currentSentenceIndex: number; // -1 if not playing, 0-indexed otherwise
  totalSentencesInChunk: number;
  isLoadingChunk: boolean;
}

const ContinuousListeningSection: FC<ContinuousListeningSectionProps> = ({
  isPlaying,
  onPlayAll,
  onStop,
  disabled,
  currentSentenceIndex,
  totalSentencesInChunk,
  isLoadingChunk,
}) => {
  const progress = totalSentencesInChunk > 0 && isPlaying ? ((currentSentenceIndex + 1) / totalSentencesInChunk) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Radio className="mr-3 h-6 w-6 text-primary" />
          Continuous Listening
        </CardTitle>
        <CardDescription>
          Immerse yourself by listening to all sentences in the current chunk sequentially.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingChunk ? (
          <Alert>
            <AlertDescription className="text-center text-muted-foreground">
              Loading chunk data... Please wait.
            </AlertDescription>
          </Alert>
        ) : disabled && !isPlaying ? (
           <Alert>
            <AlertDescription className="text-center text-muted-foreground">
              Load a chunk with sentences to enable continuous play.
            </AlertDescription>
          </Alert>
        ): (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isPlaying ? (
                <Button onClick={onPlayAll} disabled={disabled} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play All in Chunk
                </Button>
              ) : (
                <Button onClick={onStop} variant="destructive" className="w-full sm:w-auto">
                  <StopCircle className="mr-2 h-5 w-5" />
                  Stop Continuous Play
                </Button>
              )}
            </div>
            {isPlaying && totalSentencesInChunk > 0 && (
              <div className="mt-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Playing sentence {currentSentenceIndex + 1} of {totalSentencesInChunk}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ContinuousListeningSection;
