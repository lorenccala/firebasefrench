
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

// Define an interface for the raw data structure from JSON
interface RawSentenceData {
  id: string;
  verb: string; // This is the French verb
  targetSentence: string; // French sentence
  verbEnglish: string; // This is the English verb
  englishSentence: string; // English sentence
  verbAlbanian: string;
  albanianSentence: string;
  audioSrcEn?: string;
  audioSrcFr?: string;
}

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
      const rawData: RawSentenceData[] = await response.json();
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.warn("No sentences found or data is not in expected format.");
        setAllSentences([]);
      } else {
        const transformedSentences: Sentence[] = rawData.map(item => ({
          id: parseInt(item.id, 10),
          french: item.targetSentence,
          english: item.englishSentence,
          verbFrench: item.verb, // Map French verb
          verbEnglish: item.verbEnglish, // Map English verb
          audioSrcFr: item.audioSrcFr,
          audioSrcEn: item.audioSrcEn,
        }));
        setAllSentences(transformedSentences);
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
       if (!audioRef.current.paused) { 
         audioRef.current.currentTime = 0; 
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
    isContinuousPlayingRef.current = false; 
    stopAudio();
    continuousPlayCurrentIndexRef.current = 0;
    showNotification("Continuous play stopped.");
  }, [stopAudio, showNotification]);


  const applyChunkSettings = useCallback(() => {
    if (isInitialLoading) return; 
    
    if (allSentences.length === 0 && !isInitialLoading) {
      setCurrentChunkSentences([]);
      setCurrentSentenceIndex(0);
      setIsChunkLoading(false);
      return;
    }

    setIsChunkLoading(true);

    if (isContinuousPlayingRef.current) {
      stopContinuousPlay();
    } else {
      stopAudio();
    }
    
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
      } else if (allSentences.length > 0) { 
        showNotification(`Chunk ${selectedChunkNum + 1} is empty.`);
      }
    }, 200);

  }, [allSentences, selectedChunkNum, chunkSize, studyMode, stopAudio, stopContinuousPlay, showNotification, isInitialLoading]);
  
  useEffect(() => { 
    if (!isInitialLoading) { 
        applyChunkSettings(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChunkNum, chunkSize, isInitialLoading, allSentences.length]); 
  

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
    
    stopAudio(); 
    await new Promise(resolve => setTimeout(resolve, 50));


    const playPart = async (src: string, type: 'fr' | 'en'): Promise<boolean> => {
      if (playRequestCounterRef.current !== currentPlayId) {
        return false; 
      }

      try {
        audioElement.src = src;
        audioElement.load(); 
        audioElement.playbackRate = playbackSpeedRef.current;
        
        await audioElement.play();
        
        if (playRequestCounterRef.current === currentPlayId) {
          setIsAudioPlaying(true);
          setCurrentAudioSrcType(type);
          return true;
        }
      } catch (err) {
        console.error(`Error playing ${type} audio:`, err);
        const attemptedSrc = audioElement.currentSrc || src;
        showNotification(`Error playing audio. Source: ${attemptedSrc}. Please check if the file exists and the path is correct.`, "destructive");
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
        handleSequenceEndLogicRef.current?.();
      }
    } else if (sentence.audioSrcEn) {
      const success = await playPart(sentence.audioSrcEn, 'en');
       if (success && playRequestCounterRef.current === currentPlayId) {
         setTimeout(() => {
           if (playRequestCounterRef.current === currentPlayId) {
             setIsAudioPlaying(false);
             setCurrentAudioSrcType(null);
             handleSequenceEndLogicRef.current?.();
           }
         }, 500); 
       } else if (playRequestCounterRef.current === currentPlayId) {
         handleSequenceEndLogicRef.current?.();
       }
    } else {
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
          setCurrentSentenceIndex(nextIndex); 
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
            (currentAudioSrcTypeRef.current !== 'fr' && currentAudioSrcTypeRef.current !== null) 
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
      } else { 
         if(playRequestCounterRef.current === endedPlayId) handleSequenceEndLogicRef.current?.();
      }
    };

    audio.addEventListener('ended', handleAudioEnded);
    
    audio.addEventListener('error', (e) => {
      const mediaError = audio.error; 
      const attemptedSrc = audio.currentSrc || (e.target as HTMLAudioElement)?.src || 'Source unknown';
      let detailedMessage = 'Unknown audio error occurred.';
      let errorCode: number | string = 'N/A';

      if (mediaError) {
        errorCode = mediaError.code;
        switch (mediaError.code) {
          case 1: // MediaError.MEDIA_ERR_ABORTED
            detailedMessage = 'Audio playback was aborted.';
            break;
          case 2: // MediaError.MEDIA_ERR_NETWORK
            detailedMessage = 'A network error occurred while fetching the audio.';
            break;
          case 3: // MediaError.MEDIA_ERR_DECODE
            detailedMessage = 'The audio could not be decoded.';
            break;
          case 4: // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
            detailedMessage = `The audio format is not supported, or the audio file was not found at '${attemptedSrc}'. Please ensure audio files are in the 'public' folder and paths are correct.`;
            break;
          default:
            detailedMessage = mediaError.message || 'An unspecified audio error occurred.';
        }
        console.error(`Audio Error Details - Code: ${errorCode}, Message: "${detailedMessage}", Attempted Source: ${attemptedSrc}`, mediaError, e);
      } else {
        console.error(`Audio Error - An unknown error occurred. Attempted Source: ${attemptedSrc}`, e);
      }
      
      showNotification(`Audio Error: ${detailedMessage} (Code: ${errorCode})`, "destructive");
      stopAudio(); 
      if(handleSequenceEndLogicRef.current) {
        handleSequenceEndLogicRef.current();
      }
    });

    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('error', (e) => { /* Re-reference the modified handler if needed or ensure this matches for removal */ });
      if (enPlayTimeoutRef.current) clearTimeout(enPlayTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; 
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
      isContinuousPlayingRef.current = true; 
      continuousPlayCurrentIndexRef.current = 0;
      setCurrentSentenceIndex(0);
      
      setIsAnswerRevealed(true); 
      
      setTimeout(() => playAudioSequence(currentChunkSentencesRef.current[0], true), 100);
      showNotification("Starting continuous play for the chunk.");
    } else {
      showNotification("No sentences in chunk to play continuously.", "destructive");
    }
  };

  const currentSentenceData = currentChunkSentences[currentSentenceIndex] || null;

  if (isInitialLoading && allSentences.length === 0) { 
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={64} /></div>;
  }

  if (error && allSentences.length === 0) { 
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="container mx-auto max-w-screen-xl bg-card shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 ring-1 ring-border/50 grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length > 0)} 
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
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)} 
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
