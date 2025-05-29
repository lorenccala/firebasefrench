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

interface NativeContentSwitchSectionProps {
  practiceTimeMinutes: number;
  onPracticeTimeChange: (minutes: number) => void;
  onStartTimer: () => void;
  timerDisplay: string;
  isTimerRunning: boolean;
  showSwitchToNativeAlert: boolean;
  onHideAlert: () => void;
}

const NativeContentSwitchSection: FC<NativeContentSwitchSectionProps> = ({
  practiceTimeMinutes,
  onPracticeTimeChange,
  onStartTimer,
  timerDisplay,
  isTimerRunning,
  showSwitchToNativeAlert,
  onHideAlert,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Timer className="mr-3 h-6 w-6 text-primary" />
          Focus Timer
        </CardTitle>
        <CardDescription>
          Set a timer for your practice session. When it ends, consider switching to native content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow">
            <Label htmlFor="practice-time" className="text-sm font-medium">Practice Time (minutes)</Label>
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
            {isTimerRunning ? `Timer Active: ${timerDisplay}` : 'Start Timer'}
          </Button>
        </div>
        
        {isTimerRunning && (
          <div className="text-center p-4 border border-dashed border-primary rounded-md bg-primary/10">
            <p className="text-4xl font-mono font-semibold text-primary">{timerDisplay}</p>
            <p className="text-sm text-muted-foreground mt-1">Focus on your learning!</p>
          </div>
        )}

        <AlertDialog open={showSwitchToNativeAlert} onOpenChange={onHideAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                Practice Session Complete!
              </AlertDialogTitle>
              <AlertDialogDescription>
                Great job focusing! Now is a good time to immerse yourself in native French content like movies, music, or podcasts to solidify your learning.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={onHideAlert}>Dismiss</Button>
              <a href="https://youtube.com/results?search_query=french+native+content" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/90">
                  <ExternalLink className="mr-2 h-4 w-4" /> Find Native Content
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
