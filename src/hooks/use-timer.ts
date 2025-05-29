"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialMinutes: number) => {
  const [practiceTimeMinutes, setPracticeTimeMinutes] = useState<number>(initialMinutes);
  const [timerSeconds, setTimerSeconds] = useState<number>(practiceTimeMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showSwitchToNativeAlert, setShowSwitchToNativeAlert] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimerSeconds(practiceTimeMinutes * 60);
  }, [practiceTimeMinutes]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer(); // Stop any existing timer
    setTimerSeconds(practiceTimeMinutes * 60); // Reset to current practice time
    setIsTimerRunning(true);
    setShowSwitchToNativeAlert(false);

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prevSeconds => {
        if (prevSeconds <= 1) {
          stopTimer();
          setShowSwitchToNativeAlert(true);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);
  }, [practiceTimeMinutes, stopTimer]);


  useEffect(() => {
    return () => { // Cleanup on unmount
      stopTimer();
    };
  }, [stopTimer]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const resetTimerAlert = () => {
    setShowSwitchToNativeAlert(false);
  };

  return {
    timerSeconds,
    isTimerRunning,
    showSwitchToNativeAlert,
    practiceTimeMinutes,
    setPracticeTimeMinutes,
    startTimer,
    stopTimer,
    formatTime,
    resetTimerAlert,
  };
};
