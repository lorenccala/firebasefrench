
"use client";

import type { FC } from 'react';
import { Timer, Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { translations, type Language } from '@/lib/translations';

interface NativeContentSwitchSectionProps {
  language: Language;
  practiceTimeMinutes: number;
  onPracticeTimeChange: (minutes: number) => void;
  onStartTimer: () => void;
  timerDisplay: string;
  isTimerRunning: boolean;
  showSwitchToNativeAlert: boolean;
  onHideAlert: () => void;
}

const NativeContentSwitchSection: FC<NativeContentSwitchSectionProps> = ({
  language,
  practiceTimeMinutes,
  onPracticeTimeChange,
  onStartTimer,
  timerDisplay,
  isTimerRunning,
  showSwitchToNativeAlert,
  onHideAlert,
}) => {
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
          <Timer className="mr-3 h-6 w-6 text-primary" />
          {t('focusTimerTitle')}
        </CardTitle>
        <CardDescription>
         {t('focusTimerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow">
            <Label htmlFor="practice-time" className="text-sm font-medium">{t('practiceTimeLabel')}</Label>
            <Input
              id="practice-time"
              type="number"
              value={practiceTimeMinutes}
              onChange={(e) => onPracticeTimeChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              className="w-full mt-1"
              disabled={isTimerRunning}
            />
          </div>
          <Button onClick={onStartTimer} disabled={isTimerRunning} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            {isTimerRunning ? t('timerActiveButton', {time: timerDisplay}) : t('startTimerButton')}
          </Button>
        </div>
        
        {isTimerRunning && (
          <div className="text-center p-4 border border-dashed border-primary rounded-md bg-primary/10">
            <p className="text-4xl font-mono font-semibold text-primary">{timerDisplay}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('focusOnLearning')}</p>
          </div>
        )}

        <AlertDialog open={showSwitchToNativeAlert} onOpenChange={onHideAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                {t('sessionCompleteTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('sessionCompleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={onHideAlert}>{t('dismissButton')}</Button>
              <a href="https://youtube.com/results?search_query=french+native+content" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/90">
                  <ExternalLink className="mr-2 h-4 w-4" /> {t('findNativeContentButton')}
                </Button>
              </a>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default NativeContentSwitchSection;
