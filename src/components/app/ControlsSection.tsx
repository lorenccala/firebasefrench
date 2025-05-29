
"use client";

import type { FC } from 'react';
import { Settings, Layers, DownloadCloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StudyMode } from '@/types';
import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from '@/lib/constants';
import { translations, type Language } from '@/lib/translations';

interface ControlsSectionProps {
  language: Language;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  chunkSize: number;
  onChunkSizeChange: (size: number) => void;
  selectedChunkNum: number;
  onSelectedChunkNumChange: (num: number) => void;
  numChunks: number;
  onLoadChunk: () => void;
  allSentencesCount: number;
  isLoading: boolean;
}

const ControlsSection: FC<ControlsSectionProps> = ({
  language,
  studyMode,
  onStudyModeChange,
  chunkSize,
  onChunkSizeChange,
  selectedChunkNum,
  onSelectedChunkNumChange,
  numChunks,
  onLoadChunk,
  allSentencesCount,
  isLoading,
}) => {
  const handleChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onChunkSizeChange(Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, value)));
    } else if (e.target.value === '') {
       onChunkSizeChange(MIN_CHUNK_SIZE);
    }
  };
  
  const handleSelectedChunkNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onSelectedChunkNumChange(Math.max(0, Math.min(numChunks > 0 ? numChunks - 1 : 0, value - 1)));
    } else if (e.target.value === '') {
      onSelectedChunkNumChange(0);
    }
  };

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
          <Settings className="mr-3 h-6 w-6 text-primary" />
          {t('studyConfigurationTitle')}
        </CardTitle>
        <CardDescription>
          {t('studyConfigurationDescription', {count: allSentencesCount})}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <Label htmlFor="study-mode" className="text-sm font-medium">{t('studyModeLabel')}</Label>
            <Select
              value={studyMode}
              onValueChange={(value) => onStudyModeChange(value as StudyMode)}
              disabled={isLoading}
            >
              <SelectTrigger id="study-mode" className="w-full mt-1">
                <SelectValue placeholder={t('studyModeLabel')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StudyMode).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="chunk-size" className="text-sm font-medium">{t('sentencesPerChunkLabel', {min: MIN_CHUNK_SIZE, max: MAX_CHUNK_SIZE})}</Label>
            <Input
              id="chunk-size"
              type="number"
              value={chunkSize}
              onChange={handleChunkSizeChange}
              min={MIN_CHUNK_SIZE}
              max={MAX_CHUNK_SIZE}
              className="w-full mt-1"
              disabled={isLoading || allSentencesCount === 0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <Label htmlFor="chunk-num" className="text-sm font-medium">
              {t('chunkNumberLabel', {numChunks: Math.max(1, numChunks)})}
            </Label>
            <Input
              id="chunk-num"
              type="number"
              value={numChunks === 0 ? 1 : selectedChunkNum + 1}
              onChange={handleSelectedChunkNumChange}
              min="1"
              max={Math.max(1, numChunks)}
              className="w-full mt-1"
              disabled={isLoading || numChunks === 0 || allSentencesCount === 0}
            />
          </div>
          <Button
            onClick={onLoadChunk}
            className="w-full md:self-end bg-primary hover:bg-primary/90"
            disabled={isLoading || allSentencesCount === 0}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="mr-2 h-4 w-4" />
            )}
            {t('loadChunkButton')}
          </Button>
        </div>
        {numChunks > 0 && (
            <p className="text-xs text-muted-foreground text-center">
                {t('currentChunkInfo', {selected: selectedChunkNum + 1, total: numChunks, size: chunkSize})}
            </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ControlsSection;
