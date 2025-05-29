
"use client";

import type { FC } from 'react';
import { PlayCircle, StopCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { translations, type Language } from '@/lib/translations';

interface ContinuousListeningSectionProps {
  language: Language;
  isPlaying: boolean;
  onPlayAll: () => void;
  onStop: () => void;
  disabled: boolean;
  currentSentenceIndex: number; 
  totalSentencesInChunk: number;
  isLoadingChunk: boolean;
}

const ContinuousListeningSection: FC<ContinuousListeningSectionProps> = ({
  language,
  isPlaying,
  onPlayAll,
  onStop,
  disabled,
  currentSentenceIndex,
  totalSentencesInChunk,
  isLoadingChunk,
}) => {
  const progress = totalSentencesInChunk > 0 && isPlaying ? ((currentSentenceIndex + 1) / totalSentencesInChunk) * 100 : 0;

  const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
    let text = translations[key] ? translations[key][language] : String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Radio className="mr-3 h-6 w-6 text-primary" />
          {t('continuousListeningTitle')}
        </CardTitle>
        <CardDescription>
          {t('continuousListeningDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingChunk ? (
          <Alert>
            <AlertDescription className="text-center text-muted-foreground">
              {t('loadingChunkData')}
            </AlertDescription>
          </Alert>
        ) : disabled && !isPlaying ? (
           <Alert>
            <AlertDescription className="text-center text-muted-foreground">
              {t('enableContinuousPlayInfo')}
            </AlertDescription>
          </Alert>
        ): (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isPlaying ? (
                <Button onClick={onPlayAll} disabled={disabled} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {t('playAllInChunkButton')}
                </Button>
              ) : (
                <Button onClick={onStop} variant="destructive" className="w-full sm:w-auto">
                  <StopCircle className="mr-2 h-5 w-5" />
                  {t('stopContinuousPlayButton')}
                </Button>
              )}
            </div>
            {isPlaying && totalSentencesInChunk > 0 && (
              <div className="mt-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {t('playingSentence', {current: currentSentenceIndex + 1, total: totalSentencesInChunk})}
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
