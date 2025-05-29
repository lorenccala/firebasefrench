
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
import { Input } from '@/components/ui/input'; // Keep for chunk number if still needed, or remove if not
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

const CHUNK_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

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
  const handleChunkSizeChange = (value: string) => {
    const size = parseInt(value, 10);
    if (!isNaN(size)) {
      onChunkSizeChange(size);
    }
  };
  
  const handleSelectedChunkNumChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      // Value from SelectItem is 1-indexed, convert to 0-indexed
      onSelectedChunkNumChange(Math.max(0, num - 1));
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
            <Label htmlFor="chunk-size-select" className="text-sm font-medium">{t('sentencesPerChunkLabelSelect')}</Label>
            <Select
              value={String(chunkSize)}
              onValueChange={handleChunkSizeChange}
              disabled={isLoading || allSentencesCount === 0}
            >
              <SelectTrigger id="chunk-size-select" className="w-full mt-1">
                <SelectValue placeholder={t('sentencesPerChunkLabelSelect')} />
              </SelectTrigger>
              <SelectContent>
                {CHUNK_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <Label htmlFor="chunk-num-select" className="text-sm font-medium">
              {t('chunkNumberLabel', {numChunks: Math.max(1, numChunks)})}
            </Label>
            <Select
              value={String(numChunks === 0 ? 1 : selectedChunkNum + 1)}
              onValueChange={handleSelectedChunkNumChange}
              disabled={isLoading || numChunks === 0 || allSentencesCount === 0}
            >
              <SelectTrigger id="chunk-num-select" className="w-full mt-1">
                <SelectValue placeholder={t('chunkNumberLabel', {numChunks: Math.max(1, numChunks)})} />
              </SelectTrigger>
              <SelectContent>
                {numChunks > 0 ? (
                  Array.from({ length: numChunks }, (_, i) => i + 1).map((chunkNumber) => (
                    <SelectItem key={chunkNumber} value={String(chunkNumber)}>
                      {chunkNumber}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="1" disabled>1</SelectItem>
                )}
              </SelectContent>
            </Select>
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
