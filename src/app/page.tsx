"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, StudyMode } from '@/types';
import { PLAYBACK_SPEEDS, DEFAULT_CHUNK_SIZE, MIN_CHUNK_SIZE, MAX_CHUNK_SIZE, DEFAULT_PRACTICE_TIME_MINUTES } from '@/lib/constants';
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';

import Header from '@/components/app/Header';
import ControlsSection from '@/components/app/ControlsSection';
import StudyArea from '@/components/app/StudyArea';
import ContinuousListeningSection from '@/components/app/ContinuousListeningSection';
import NativeContentSwitchSection from '@/components/app/NativeContentSwitchSection';
import Footer from '@/components/app/Footer';
import { LoadingSpinner } from '@/components/app/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function LinguaLeapPage() {
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [currentChunkSentences, setCurrentChunkSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.ReadListen);
  const [chunkSize, setChunkSize] = useState<number>(DEFAULT_CHUNK_SIZE);
  const [selectedChunkNum, setSelectedChunkNum] = useState<number>(0); // 0-indexed
  const [numChunks, setNumChunks] = useState<number>(0);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isChunkLoading, setIsChunkLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioSrcType, setCurrentAudioSrcType] = useState<'fr' | 'en' | null>(null);

  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(studyMode !== StudyMode.ActiveRecall);
  const [isContinuousPlaying, setIsContinuousPlaying] = useState<boolean>(false);
  
  const continuousPlayCurrentIndexRef = useRef<number>(0);

  const {
    timerSeconds,
    isTimerRunning,
    showSwitchToNativeAlert,
    practiceTimeMinutes,
    setPracticeTimeMinutes,
    startTimer,
    stopTimer,
    formatTime,
    resetTimerAlert
  } = useTimer(DEFAULT_PRACTICE_TIME_MINUTES);

  const currentSentenceIndexRef = useRef(currentSentenceIndex);
  const currentChunkSentencesRef = useRef(currentChunkSentences);
  const playbackSpeedRef = useRef(playbackSpeed);
  const currentAudioSrcTypeRef = useRef(currentAudioSrcType);
  const isAudioPlayingRef = useRef(isAudioPlaying);
  const isContinuousPlayingRef = useRef(isContinuousPlaying);
  const isLoopingRef = useRef(isLooping);

  const enPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSequenceEndLogicRef = useRef<(() => void) | null>(null);
  const playRequestCounterRef = useRef<number>(0);

  useEffect(() => { currentSentenceIndexRef.current = currentSentenceIndex; }, [currentSentenceIndex]);
  useEffect(() => { currentChunkSentencesRef.current = currentChunkSentences; }, [currentChunkSentences]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { currentAudioSrcTypeRef.current = currentAudioSrcType; }, [currentAudioSrcType]);
  useEffect(() => { isAudioPlayingRef.current = isAudioPlaying; }, [isAudioPlaying]);
  useEffect(() => { isContinuousPlayingRef.current = isContinuousPlaying; }, [isContinuousPlaying]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  useEffect(() => {
    if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
      setIsAnswerRevealed(false);
    } else {
      setIsAnswerRevealed(true);
    }
  }, [studyMode]);

  const showNotification = useCallback((message: string, variant: "default" | "destructive" = "default") => {
    toast({
      title: variant === "destructive" ? "Error" : "Notification",
      description: message,
      variant: variant,
    });
  }, [toast]);

  const loadSentenceData = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        // This case is handled by the UI, but we can still log it or set a specific error
        console.warn("No sentences found or data is not in expected format.");
        setAllSentences([]);
      } else {
        setAllSentences(data as Sentence[]);
        showNotification("Sentence data loaded successfully!");
      }
    } catch (err) {
      console.error('Error loading sentence data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setAllSentences([]); // Ensure it's empty on error
      showNotification(`Error loading sentence data: ${errorMessage}`, "destructive");
    } finally {
      setIsInitialLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { loadSentenceData(); }, [loadSentenceData]);

  useEffect(() => {
    if (allSentences.length > 0) {
      const newNumChunks = Math.ceil(allSentences.length / chunkSize);
      setNumChunks(newNumChunks);
      if (selectedChunkNum >= newNumChunks && newNumChunks > 0) {
        setSelectedChunkNum(newNumChunks - 1);
      } else if (newNumChunks === 0) {
        setSelectedChunkNum(0);
      }
    } else {
      setNumChunks(0);
      setSelectedChunkNum(0); // Reset chunk num if no sentences
    }
  }, [allSentences, chunkSize, selectedChunkNum]);


  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
       if (!audioRef.current.paused) { // Ensure it's actually paused
         audioRef.current.currentTime = 0; // Reset time as a fallback
       }
    }
    if (enPlayTimeoutRef.current) {
      clearTimeout(enPlayTimeoutRef.current);
      enPlayTimeoutRef.current = null;
    }
    setIsAudioPlaying(false);
    setCurrentAudioSrcType(null);
  }, []);
  

  const stopContinuousPlay = useCallback(() => {
    setIsContinuousPlaying(false);
    isContinuousPlayingRef.current = false; // Ensure ref is also updated immediately
    stopAudio();
    continuousPlayCurrentIndexRef.current = 0;
    showNotification("Continuous play stopped.");
  }, [stopAudio, showNotification]);


  const applyChunkSettings = useCallback(() => {
    if (isInitialLoading) return; // Don't run if initial load is still happening
    
    if (allSentences.length === 0 && !isInitialLoading) {
      setCurrentChunkSentences([]);
      setCurrentSentenceIndex(0);
      // Optionally show a notification if the user tries to load a chunk when no data is available
      // showNotification("No sentence data available to load chunks.", "destructive");
      setIsChunkLoading(false);
      return;
    }

    setIsChunkLoading(true);

    if (isContinuousPlayingRef.current) {
      stopContinuousPlay();
    } else {
      stopAudio();
    }
    
    // Short delay to allow UI to update (e.g., show loading state)
    setTimeout(() => {
      const startIndex = selectedChunkNum * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, allSentences.length);
      const newChunk = allSentences.slice(startIndex, endIndex);
      
      setCurrentChunkSentences(newChunk);
      setCurrentSentenceIndex(0);
      
      if (studyMode === StudyMode.ActiveRecall) {
        setIsAnswerRevealed(false);
      } else {
        setIsAnswerRevealed(true);
      }
      
      setIsChunkLoading(false);
      if (newChunk.length > 0) {
        showNotification(`Chunk ${selectedChunkNum + 1} loaded!`);
      } else if (allSentences.length > 0) { // Only show if there was data to begin with
        showNotification(`Chunk ${selectedChunkNum + 1} is empty.`);
      }
    }, 200);

  }, [allSentences, selectedChunkNum, chunkSize, studyMode, stopAudio, stopContinuousPlay, showNotification, isInitialLoading]);
  
  useEffect(() => { 
    if (!isInitialLoading) { // Only apply settings after initial data load attempt
        applyChunkSettings(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChunkNum, chunkSize, isInitialLoading, allSentences.length]); // Rerun when selectedChunkNum or chunkSize changes, or after initial load
  

  const playAudioSequence = useCallback(async (
    sentenceToPlay?: Sentence,
    isPartOfContinuousSequence: boolean = false
  ) => {
    const currentPlayId = ++playRequestCounterRef.current;

    if (isPartOfContinuousSequence && !isContinuousPlayingRef.current) {
      return;
    }

    const sentence = sentenceToPlay || currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    const audioElement = audioRef.current;

    if (!audioElement) {
      console.error(`Audio element not ready.`);
      return;
    }

    if (!sentence) {
      if (isPartOfContinuousSequence && isContinuousPlayingRef.current) {
        setTimeout(() => handleSequenceEndLogicRef.current?.(), 50);
      }
      return;
    }

    const hasAudio = sentence.audioSrcFr || sentence.audioSrcEn;
    if (!hasAudio) {
      if (isPartOfContinuousSequence && isContinuousPlayingRef.current) {
        setTimeout(() => handleSequenceEndLogicRef.current?.(), 50);
      }
      return;
    }
    
    // Stop any currently playing audio before starting a new sequence
    // This is important to prevent multiple audio tracks from playing or overlapping
    stopAudio(); 
    // Allow a brief moment for the stopAudio to take effect before playing new audio
    await new Promise(resolve => setTimeout(resolve, 50));


    const playPart = async (src: string, type: 'fr' | 'en'): Promise<boolean> => {
      if (playRequestCounterRef.current !== currentPlayId) {
        return false; // Obsolete request
      }

      try {
        audioElement.src = src;
        audioElement.load(); // Important to call load() after changing src
        audioElement.playbackRate = playbackSpeedRef.current;
        
        // For mobile browsers, play() must be user-initiated.
        // This might sometimes cause issues if not directly tied to a click.
        await audioElement.play();
        
        if (playRequestCounterRef.current === currentPlayId) {
          setIsAudioPlaying(true);
          setCurrentAudioSrcType(type);
          return true;
        }
      } catch (err) {
        console.error(`Error playing ${type} audio:`, err);
        showNotification(`Error playing audio. Please try again.`, "destructive");
        // If play fails, ensure we are in a stopped state
        if (playRequestCounterRef.current === currentPlayId) {
            setIsAudioPlaying(false);
            setCurrentAudioSrcType(null);
        }
      }
      return false;
    };

    if (sentence.audioSrcFr) {
      const success = await playPart(sentence.audioSrcFr, 'fr');
      if (!success && playRequestCounterRef.current === currentPlayId) { 
        // If French fails, don't proceed to English, call end logic
        handleSequenceEndLogicRef.current?.();
      }
    } else if (sentence.audioSrcEn) {
      // If no French audio, play English directly and then call end logic
      const success = await playPart(sentence.audioSrcEn, 'en');
       if (success && playRequestCounterRef.current === currentPlayId) {
         // Since only English played, set a timeout to call end logic, simulating natural pause
         setTimeout(() => {
           if (playRequestCounterRef.current === currentPlayId) {
             setIsAudioPlaying(false);
             setCurrentAudioSrcType(null);
             handleSequenceEndLogicRef.current?.();
           }
         }, 500); // Adjust delay as needed
       } else if (playRequestCounterRef.current === currentPlayId) {
         handleSequenceEndLogicRef.current?.();
       }
    } else {
        // No audio source, immediately call end logic
        handleSequenceEndLogicRef.current?.();
    }
  }, [stopAudio, showNotification]);


  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleSequenceEndLogicInternal = () => {
      const currentGlobalPlayId = playRequestCounterRef.current;
      
      if (isLoopingRef.current && !isContinuousPlayingRef.current) {
        setTimeout(() => {
          if (playRequestCounterRef.current === currentGlobalPlayId) {
            playAudioSequence();
          }
        }, 200);
      }
      else if (isContinuousPlayingRef.current) {
        const nextIndex = continuousPlayCurrentIndexRef.current + 1;
        
        if (nextIndex < currentChunkSentencesRef.current.length) {
          setCurrentSentenceIndex(nextIndex); // This will trigger its own useEffect for answer reveal
          continuousPlayCurrentIndexRef.current = nextIndex;
          
          setTimeout(() => {
            if (playRequestCounterRef.current === currentGlobalPlayId && isContinuousPlayingRef.current) {
              playAudioSequence(
                currentChunkSentencesRef.current[nextIndex],
                true
              );
            }
          }, 200);
        } else {
          stopContinuousPlay();
        }
      }
    };
    
    handleSequenceEndLogicRef.current = handleSequenceEndLogicInternal;

    const handleAudioEnded = () => {
      const endedPlayId = playRequestCounterRef.current;
      const currentType = currentAudioSrcTypeRef.current;

      if (currentType === 'fr') {
        enPlayTimeoutRef.current = setTimeout(async () => {
          if (
            playRequestCounterRef.current !== endedPlayId ||
            (currentAudioSrcTypeRef.current !== 'fr' && currentAudioSrcTypeRef.current !== null) // Allow if it was reset by stopAudio
          ) {
            if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
            return;
          }

          const sentence = currentChunkSentencesRef.current[currentSentenceIndexRef.current];
          if (sentence?.audioSrcEn) {
            try {
              audio.src = sentence.audioSrcEn;
              audio.load();
              audio.playbackRate = playbackSpeedRef.current;
              await audio.play();
              
              if (playRequestCounterRef.current === endedPlayId) {
                setIsAudioPlaying(true);
                setCurrentAudioSrcType('en');
              }
            } catch (err) {
              console.error(`English playback failed:`, err);
              if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
            }
          } else {
             if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
          }
        }, 500);
      }
      else if (currentType === 'en') {
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
        if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
      } else { // If currentType is null (e.g. after stopAudio was called mid-sequence)
         if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
      }
    };

    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e, audio.error);
      showNotification(`Audio error: ${audio.error?.message || 'Unknown error'}`, "destructive");
      stopAudio(); // Stop audio and reset states
       // Also ensure sequence logic is called if an error occurs during playback
      if(handleSequenceEndLogicRef.current) {
        handleSequenceEndLogicRef.current();
      }
    });

    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      if (enPlayTimeoutRef.current) clearTimeout(enPlayTimeoutRef.current);
      // Ensure audio is stopped and resources are potentially released on component unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Release resource
      }
    };
  }, [playAudioSequence, stopAudio, stopContinuousPlay, showNotification]);


  const togglePlayPause = useCallback(() => {
    if (isAudioPlayingRef.current) stopAudio();
    else {
      if (currentChunkSentencesRef.current.length > 0) {
        playAudioSequence();
      } else {
        showNotification("No sentence loaded to play.", "destructive");
      }
    }
  }, [playAudioSequence, stopAudio, showNotification]);


  const handlePrevSentence = () => {
    if (currentSentenceIndexRef.current > 0) {
      stopAudio();
      const newIndex = currentSentenceIndexRef.current - 1;
      setCurrentSentenceIndex(newIndex);
      if (isContinuousPlayingRef.current) continuousPlayCurrentIndexRef.current = newIndex;
      
      if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
        setIsAnswerRevealed(false);
      }
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndexRef.current < currentChunkSentencesRef.current.length - 1) {
      stopAudio();
      const newIndex = currentSentenceIndexRef.current + 1;
      setCurrentSentenceIndex(newIndex);
      if (isContinuousPlayingRef.current) continuousPlayCurrentIndexRef.current = newIndex;
      
      if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
        setIsAnswerRevealed(false);
      }
    }
  };

  useEffect(() => {
    if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
      setIsAnswerRevealed(false);
    } else if (studyMode !== StudyMode.ActiveRecall) {
      setIsAnswerRevealed(true);
    }
    // If continuous playing, answer is always revealed
    if (isContinuousPlayingRef.current) {
        setIsAnswerRevealed(true);
    }
  }, [currentSentenceIndex, studyMode]);


  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    const sentence = currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    if (!isAudioPlayingRef.current && sentence && (sentence.audioSrcFr || sentence.audioSrcEn)) {
      playAudioSequence();
    }
  };

  const handlePlayAllChunkAudio = () => {
    if (currentChunkSentencesRef.current.length > 0) {
      stopAudio();
      setIsContinuousPlaying(true);
      isContinuousPlayingRef.current = true; // Update ref immediately
      continuousPlayCurrentIndexRef.current = 0;
      setCurrentSentenceIndex(0);
      
      setIsAnswerRevealed(true); // Always reveal answers during continuous play
      
      // Delay slightly to ensure state updates are processed
      setTimeout(() => playAudioSequence(currentChunkSentencesRef.current[0], true), 100);
      showNotification("Starting continuous play for the chunk.");
    } else {
      showNotification("No sentences in chunk to play continuously.", "destructive");
    }
  };

  const currentSentenceData = currentChunkSentences[currentSentenceIndex] || null;

  if (isInitialLoading && allSentences.length === 0) { // Show spinner only if absolutely no data yet.
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={64} /></div>;
  }

  if (error && allSentences.length === 0) { // Show critical error if data loading failed and no sentences available
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-destructive p-8 text-center">
        <AlertCircle className="h-16 w-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Application Data</h1>
        <p className="mb-6">{error}</p>
        <Button onClick={loadSentenceData} variant="destructive">
          Try Reloading Data
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-3xl bg-card shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 ring-1 ring-border/50">
        <Header />
        <main className="mt-8 space-y-10 md:space-y-12">
          <ControlsSection
            studyMode={studyMode}
            onStudyModeChange={(newMode) => { 
              setStudyMode(newMode); 
              stopAudio();
            }}
            chunkSize={chunkSize}
            onChunkSizeChange={setChunkSize}
            selectedChunkNum={selectedChunkNum}
            onSelectedChunkNumChange={setSelectedChunkNum}
            numChunks={numChunks}
            onLoadChunk={applyChunkSettings}
            allSentencesCount={allSentences.length}
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length > 0)} // Show loading if chunk is loading OR initial data is still being fetched but some old data might exist
          />
          <StudyArea
            sentence={currentSentenceData}
            studyMode={studyMode}
            isAnswerRevealed={isAnswerRevealed}
            onRevealAnswer={handleRevealAnswer}
            audioControls={{
              isPlaying: isAudioPlaying,
              onTogglePlayPause: togglePlayPause,
              onPrev: handlePrevSentence,
              onNext: handleNextSentence,
              isLooping: isLooping,
              onToggleLoop: () => setIsLooping(prev => !prev),
              playbackSpeed: playbackSpeed,
              onPlaybackSpeedChange: (speed) => {
                setPlaybackSpeed(speed);
                if (audioRef.current) audioRef.current.playbackRate = speed;
              },
              disablePrev: currentSentenceIndex === 0,
              disableNext: currentSentenceIndex >= currentChunkSentences.length - 1,
            }}
            sentenceCounter={{
              currentNum: currentChunkSentences.length > 0 ? currentSentenceIndex + 1 : 0,
              totalInChunk: currentChunkSentences.length,
              totalAll: allSentences.length,
            }}
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)} // True if actively loading chunk or initial data with nothing to show
            allSentencesCount={allSentences.length}
          />
          <ContinuousListeningSection
            isPlaying={isContinuousPlaying}
            onPlayAll={handlePlayAllChunkAudio}
            onStop={stopContinuousPlay}
            disabled={currentChunkSentences.length === 0 || isChunkLoading || (isInitialLoading && allSentences.length === 0)}
            currentSentenceIndex={isContinuousPlaying ? continuousPlayCurrentIndexRef.current : -1}
            totalSentencesInChunk={currentChunkSentences.length}
            isLoadingChunk={isChunkLoading || (isInitialLoading && allSentences.length === 0)}
          />
          <NativeContentSwitchSection
            practiceTimeMinutes={practiceTimeMinutes}
            onPracticeTimeChange={setPracticeTimeMinutes}
            onStartTimer={startTimer}
            timerDisplay={formatTime(timerSeconds)}
            isTimerRunning={isTimerRunning}
            showSwitchToNativeAlert={showSwitchToNativeAlert}
            onHideAlert={resetTimerAlert}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}
