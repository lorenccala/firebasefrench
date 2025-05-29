
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, StudyMode } from '@/types';
import { PLAYBACK_SPEEDS, DEFAULT_CHUNK_SIZE, DEFAULT_PRACTICE_TIME_MINUTES } from '@/lib/constants'; // MIN_CHUNK_SIZE, MAX_CHUNK_SIZE no longer needed for direct input
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';
import { translations, type Language } from '@/lib/translations';

import ControlsSection from '@/components/app/ControlsSection';
import StudyArea from '@/components/app/StudyArea';
import ContinuousListeningSection from '@/components/app/ContinuousListeningSection';
import FlashcardGame from '@/components/app/FlashcardGame';
import SentenceBuilderGame from '@/components/app/SentenceBuilderGame';
import NativeContentSwitchSection from '@/components/app/NativeContentSwitchSection';
import Footer from '@/components/app/Footer';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import { LoadingSpinner } from '@/components/app/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings, NotebookPen, Radio, Zap, Dices, TimerIcon, PanelLeft, Lightbulb } from 'lucide-react'; // Added Lightbulb for potential GrammarExplainer re-integration if needed
import GrammarExplainer from '@/components/app/GrammarExplainer'; // Import GrammarExplainer
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';

interface RawSentenceDataFromFile {
  id: string;
  verb: string; // French verb
  targetSentence: string; // French sentence
  verbEnglish: string;
  englishSentence: string;
  verbAlbanian?: string; // Optional: if present in JSON
  albanianSentence?: string; // Optional: if present in JSON
  audioSrcFr?: string;
  audioSrcEn?: string;
  audioSrcAl?: string;
}

type ActiveSection = 'config' | 'study' | 'flashcards' | 'builder' | 'timer' | 'grammar'; // 'listening' removed, 'grammar' added

export default function LinguaLeapPage() {
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [currentChunkSentences, setCurrentChunkSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.ReadListen);
  const [chunkSize, setChunkSize] = useState<number>(DEFAULT_CHUNK_SIZE);
  const [selectedChunkNum, setSelectedChunkNum] = useState<number>(0);
  const [numChunks, setNumChunks] = useState<number>(0);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isChunkLoading, setIsChunkLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayButtonDisabled, setIsPlayButtonDisabled] = useState(false);

  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentAudioSrcType, setCurrentAudioSrcType] = useState<'fr' | 'en' | 'al' | null>(null);

  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(studyMode !== StudyMode.ActiveRecall);
  const [isContinuousPlaying, setIsContinuousPlaying] = useState<boolean>(false);

  const continuousPlayCurrentIndexRef = useRef<number>(0);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<ActiveSection>('study');

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

  const audioSequenceDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSequenceEndLogicRef = useRef<(() => void) | null>(null);
  const playRequestCounterRef = useRef<number>(0);

  useEffect(() => { currentSentenceIndexRef.current = currentSentenceIndex; }, [currentSentenceIndex]);
  useEffect(() => { currentChunkSentencesRef.current = currentChunkSentences; }, [currentChunkSentences]);
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);
  useEffect(() => { currentAudioSrcTypeRef.current = currentAudioSrcType; }, [currentAudioSrcType]);
  useEffect(() => { isAudioPlayingRef.current = isAudioPlaying; }, [isAudioPlaying]);
  useEffect(() => { isContinuousPlayingRef.current = isContinuousPlaying; }, [isContinuousPlaying]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);


  const t = useCallback((key: keyof typeof translations, params?: Record<string, string | number>) => {
    let text = translations[key]?.[currentLanguage] ?? String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  }, [currentLanguage]);

  const showNotification = useCallback((messageKey: keyof typeof translations, variant: "default" | "destructive" = "default", params?: Record<string, string | number>) => {
    let message = translations[messageKey]?.[currentLanguage] ?? String(messageKey);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, String(value));
      });
    }
    toast({
      title: variant === "destructive" ? t('errorTitle') : t('notificationTitle'),
      description: message,
      variant: variant,
    });
  }, [toast, t, currentLanguage]);


  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.playbackRate = playbackSpeed; 

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.oncanplaythrough = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
      audioRef.current = null;
      if (audioSequenceDelayTimeoutRef.current) {
        clearTimeout(audioSequenceDelayTimeoutRef.current);
      }
    };
  }, []); 

  useEffect(() => {
    if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
      setIsAnswerRevealed(false);
    } else {
      setIsAnswerRevealed(true);
    }
  }, [studyMode]);


  const loadSentenceData = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const rawData: RawSentenceDataFromFile[] = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setAllSentences([]);
        showNotification("noSentencesLoadedTitle", "destructive");
      } else {
        const transformedSentences: Sentence[] = rawData.map(item => ({
          id: parseInt(item.id, 10),
          french: item.targetSentence,
          english: item.englishSentence,
          albanianSentence: item.albanianSentence || '',
          verbFrench: item.verb,
          verbEnglish: item.verbEnglish,
          verbAlbanian: item.verbAlbanian,
          audioSrcFr: item.audioSrcFr,
          audioSrcEn: item.audioSrcEn,
          audioSrcAl: item.audioSrcAl,
        }));
        setAllSentences(transformedSentences);
        showNotification("sentenceDataLoaded");
      }
    } catch (err) {
      console.error('Error loading sentence data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setAllSentences([]);
      showNotification("errorLoadingSentenceData", "destructive", { error: errorMessage });
    } finally {
      setIsInitialLoading(false);
    }
  }, [showNotification, t]); // Added t to dependency array

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
      setSelectedChunkNum(0);
    }
  }, [allSentences, chunkSize, selectedChunkNum]);

  const stopAudio = useCallback(() => {
    playRequestCounterRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      if (audioRef.current.load) audioRef.current.load();

      audioRef.current.oncanplaythrough = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    if (audioSequenceDelayTimeoutRef.current) {
      clearTimeout(audioSequenceDelayTimeoutRef.current);
      audioSequenceDelayTimeoutRef.current = null;
    }
    setIsAudioPlaying(false);
    setCurrentAudioSrcType(null);
    console.log(`Audio stopped. New playId counter: ${playRequestCounterRef.current}`);
  }, []);

  const stopContinuousPlay = useCallback(() => {
    setIsContinuousPlaying(false);
    isContinuousPlayingRef.current = false; 
    stopAudio();
    continuousPlayCurrentIndexRef.current = 0;
    showNotification("continuousPlayStopped");
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
    if (isContinuousPlayingRef.current) stopContinuousPlay();
    else stopAudio();

    setTimeout(() => {
      const startIndex = selectedChunkNum * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, allSentences.length);
      const newChunk = allSentences.slice(startIndex, endIndex);
      setCurrentChunkSentences(newChunk);
      setCurrentSentenceIndex(0);
      if (studyMode === StudyMode.ActiveRecall) setIsAnswerRevealed(false);
      else setIsAnswerRevealed(true);
      setIsChunkLoading(false);
      if (newChunk.length > 0) showNotification("chunkLoaded", "default", { chunkNum: selectedChunkNum + 1 });
      else if (allSentences.length > 0) showNotification("chunkEmpty", "default", { chunkNum: selectedChunkNum + 1 });
    }, 200);
  }, [allSentences, selectedChunkNum, chunkSize, studyMode, stopAudio, stopContinuousPlay, showNotification, isInitialLoading]);

  useEffect(() => {
    if (!isInitialLoading) applyChunkSettings();
  }, [selectedChunkNum, chunkSize, isInitialLoading, allSentences.length, applyChunkSettings]);


  const playAudioFile = useCallback((
    originalSrc: string | undefined,
    lang: 'fr' | 'en' | 'al',
    playId: number,
    onEndCallback: () => void
  ) => {
    if (!originalSrc) {
      console.log(`Audio file play for lang "${lang}" (Play ID ${playId}) skipped: No source provided.`);
      if (playRequestCounterRef.current === playId) onEndCallback();
      return;
    }

    if (!audioRef.current) {
      console.warn("Audio element not ready.");
      setIsAudioPlaying(false);
      setCurrentAudioSrcType(null);
      if (playRequestCounterRef.current === playId) onEndCallback();
      return;
    }

    if (playRequestCounterRef.current !== playId) {
      console.log(`Audio file playId ${playId} for "${originalSrc}" [${lang}] is stale. Active playId: ${playRequestCounterRef.current}. Aborting play.`);
      return;
    }

    let pathUnderPublic = originalSrc;
    if (pathUnderPublic.startsWith('/')) {
      pathUnderPublic = pathUnderPublic.substring(1);
    }
    if (!pathUnderPublic.startsWith('data/')) { 
        pathUnderPublic = `data/${pathUnderPublic}`; 
    }
    const finalSrcPath = `/${pathUnderPublic}`; 


    console.log(`Attempting to play audio file (Play ID ${playId}): "${finalSrcPath}" [${lang}]`);
    audioRef.current.src = finalSrcPath;
    

    audioRef.current.oncanplaythrough = null;
    audioRef.current.onended = null;
    audioRef.current.onerror = null;

    audioRef.current.oncanplaythrough = () => {
      if (playRequestCounterRef.current === playId) {
        if (audioRef.current) { 
          audioRef.current.playbackRate = playbackSpeedRef.current; 
        }
        audioRef.current?.play().then(() => {
          if (playRequestCounterRef.current === playId) {
            setIsAudioPlaying(true);
            setCurrentAudioSrcType(lang);
            console.log(`Audio playing (Play ID ${playId}): "${finalSrcPath}" [${lang}]`);
          }
        }).catch(error => {
          console.error(`Error playing audio "${finalSrcPath}" (Play ID ${playId}):`, error);
          showNotification("errorPlayingAudio", "destructive", { source: `${lang} (${finalSrcPath}) - Playback error` });
          if (playRequestCounterRef.current === playId) {
            setIsAudioPlaying(false);
            setCurrentAudioSrcType(null);
            onEndCallback();
          }
        });
      } else {
        console.log(`Audio file oncanplaythrough: playId ${playId} for "${finalSrcPath}" is stale. Aborting actual play.`);
      }
    };

    audioRef.current.onended = () => {
      console.log(`Audio file ended (Play ID ${playId}): "${finalSrcPath}"`);
      if (playRequestCounterRef.current === playId) {
        onEndCallback();
      } else {
        console.log(`Audio file onended: playId ${playId} for "${finalSrcPath}" is stale. Not calling onEndCallback.`);
      }
    };

    audioRef.current.onerror = (e: Event | string) => {
      const target = e instanceof Event ? e.target : null;
      
      if (!(target instanceof HTMLAudioElement)) {
        console.error("Unexpected event target for audio error:", target);
         if (playRequestCounterRef.current === playId) {
          setIsAudioPlaying(false);
          setCurrentAudioSrcType(null);
          onEndCallback();
        }
        return;
      }

      const audioElement = target;
      const errorDetails = audioElement.error;
      let errorMessage = 'Unknown audio error';

      if (errorDetails) {
        switch (errorDetails.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted by the user.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error caused the audio download to fail.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio playback failed due to a corruption issue or unsupported features.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = `The audio source for ${lang} (${finalSrcPath}) is not supported or couldn't be found. (Code: ${errorDetails.code}). ` +
              `Ensure files are in 'public/data/' and paths in data.json are relative to 'data/' ` +
              `(e.g., 'audio/file.mp3' for 'public/data/audio/file.mp3').`;
            break;
          default:
            errorMessage = `An unknown error occurred with the audio (Code: ${errorDetails.code}).`;
        }
      }

      console.error(`HTMLAudioElement.onerror - Code: ${errorDetails?.code}`, `Message: ${errorMessage}`, `Src: "${finalSrcPath}"`, `Lang: ${lang}`, e);

      showNotification("errorPlayingAudio", "destructive", {
        source: `${lang} (${finalSrcPath}) - Error: ${errorDetails?.code || 'unknown'}`
      });

      if (playRequestCounterRef.current === playId) {
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
        onEndCallback();
      }
    };
    audioRef.current.load();
  }, [showNotification]);


  const playAudioSequence = useCallback(async (
    sentenceToPlay?: Sentence,
    isPartOfContinuousSequence: boolean = false
  ) => {
    stopAudio(); 
    const currentPlayId = playRequestCounterRef.current; 

    await new Promise(resolve => setTimeout(resolve, 50));

    if (playRequestCounterRef.current !== currentPlayId) {
      console.log(`Audio sequence ${currentPlayId} became stale before starting. Active: ${playRequestCounterRef.current}.`);
      return;
    }

    const sentence = sentenceToPlay || currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    if (!sentence) {
      console.log(`PlayAudioSequence (ID ${currentPlayId}): No sentence to play.`);
      if (isPartOfContinuousSequence && isContinuousPlayingRef.current) {
         setTimeout(() => {
          if(playRequestCounterRef.current === currentPlayId) { 
            handleSequenceEndLogicRef.current?.()
          }
        }, 50);
      } else {
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
      }
      return;
    }

    console.log(`PlayAudioSequence (ID ${currentPlayId}): Starting for sentence ID ${sentence.id}`);

    let primaryAudioSrc: string | undefined;
    let primaryLang: 'fr' | 'al';
    let secondaryAudioSrc: string | undefined;
    let secondaryLang: 'en' | 'al' | 'fr' | null = null;

    if (currentLanguage === 'al') {
      primaryAudioSrc = sentence.audioSrcFr; // French first
      primaryLang = 'fr';
      secondaryAudioSrc = sentence.audioSrcAl; // Albanian second
      secondaryLang = 'al';
    } else { // English UI or any other
      primaryAudioSrc = sentence.audioSrcFr;
      primaryLang = 'fr';
      secondaryAudioSrc = sentence.audioSrcEn;
      secondaryLang = 'en';
    }


    const playPrimary = () => {
      if (!primaryAudioSrc) {
        console.log(`PlayAudioSequence (ID ${currentPlayId}): No primary audio source for ${primaryLang}.`);
        if (secondaryAudioSrc && secondaryLang) {
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Attempting to play secondary audio directly - ${secondaryLang}`);
          playAudioFile(secondaryAudioSrc, secondaryLang, currentPlayId, () => {
            if (playRequestCounterRef.current !== currentPlayId) return;
            setIsAudioPlaying(false);
            setCurrentAudioSrcType(null);
            handleSequenceEndLogicRef.current?.();
          });
        } else {
          setIsAudioPlaying(false);
          setCurrentAudioSrcType(null);
          handleSequenceEndLogicRef.current?.();
        }
        return;
      }

      console.log(`PlayAudioSequence (ID ${currentPlayId}): Playing primary audio - ${primaryLang} from ${primaryAudioSrc}`);
      playAudioFile(primaryAudioSrc, primaryLang, currentPlayId, () => {
        if (playRequestCounterRef.current !== currentPlayId) {
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary audio ended but sequence is stale. Not playing secondary.`);
          return;
        }
        if (secondaryAudioSrc && secondaryLang) {
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary ended. Delaying for secondary - ${secondaryLang} from ${secondaryAudioSrc}`);
          audioSequenceDelayTimeoutRef.current = setTimeout(() => {
            if (playRequestCounterRef.current !== currentPlayId) {
              console.log(`PlayAudioSequence (ID ${currentPlayId}): Delay for secondary ended but sequence is stale.`);
              return;
            }
            console.log(`PlayAudioSequence (ID ${currentPlayId}): Playing secondary audio - ${secondaryLang}`);
            playAudioFile(secondaryAudioSrc!, secondaryLang!, currentPlayId, () => {
              if (playRequestCounterRef.current !== currentPlayId) {
                console.log(`PlayAudioSequence (ID ${currentPlayId}): Secondary audio ended but sequence is stale.`);
                return;
              }
              console.log(`PlayAudioSequence (ID ${currentPlayId}): Secondary ended. Setting audio to not playing.`);
              setIsAudioPlaying(false);
              setCurrentAudioSrcType(null);
              handleSequenceEndLogicRef.current?.();
            });
          }, 500); 
        } else {
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary ended, no secondary. Setting audio to not playing.`);
          setIsAudioPlaying(false);
          setCurrentAudioSrcType(null);
          handleSequenceEndLogicRef.current?.();
        }
      });
    };

    playPrimary();
  }, [stopAudio, playAudioFile, currentLanguage]);


  useEffect(() => {
    const handleSequenceEndLogicInternal = () => {
      const currentTriggeringPlayId = playRequestCounterRef.current;
      console.log(`handleSequenceEndLogicInternal called, triggered by playId completion related to ${currentTriggeringPlayId}`);

      if (isLoopingRef.current && !isContinuousPlayingRef.current) {
        setTimeout(() => {
          if (playRequestCounterRef.current === currentTriggeringPlayId && isLoopingRef.current && !isContinuousPlayingRef.current) {
            console.log(`Looping: Replay for original playId ${currentTriggeringPlayId}. Calling playAudioSequence.`);
            playAudioSequence(); 
          } else {
            console.log(`Looping: Replay skipped. currentRef: ${playRequestCounterRef.current} vs trigger: ${currentTriggeringPlayId}, isLooping: ${isLoopingRef.current}, isContinuous: ${isContinuousPlayingRef.current}`);
          }
        }, 200); 
      } else if (isContinuousPlayingRef.current) {
        const nextIndex = continuousPlayCurrentIndexRef.current + 1;
        if (nextIndex < currentChunkSentencesRef.current.length) {
          setCurrentSentenceIndex(nextIndex);
          continuousPlayCurrentIndexRef.current = nextIndex;
          setTimeout(() => {
             if (playRequestCounterRef.current === currentTriggeringPlayId && isContinuousPlayingRef.current) {
              console.log(`Continuous: Next sentence for original playId ${currentTriggeringPlayId}. Calling playAudioSequence.`);
              playAudioSequence(currentChunkSentencesRef.current[nextIndex], true); 
            } else {
              console.log(`Continuous: Next sentence skipped. currentRef: ${playRequestCounterRef.current} vs trigger: ${currentTriggeringPlayId}, isContinuous: ${isContinuousPlayingRef.current}`);
            }
          }, 200); 
        } else {
          console.log("Continuous play: End of chunk reached.");
          stopContinuousPlay();
        }
      } else {
        console.log(`Sequence ended (not looping/continuous) for playId ${currentTriggeringPlayId}.`);
      }
    };

    handleSequenceEndLogicRef.current = handleSequenceEndLogicInternal;

    return () => {
      if (audioSequenceDelayTimeoutRef.current) {
        clearTimeout(audioSequenceDelayTimeoutRef.current);
      }
    };
  }, [playAudioSequence, stopContinuousPlay]);


  const togglePlayPause = useCallback(() => {
    if (isPlayButtonDisabled) return; 

    setIsPlayButtonDisabled(true); 

    if (isAudioPlayingRef.current) {
      console.log("TogglePlayPause: Stopping audio.");
      stopAudio(); 
      if(isContinuousPlayingRef.current) { 
          stopContinuousPlay();
      }
      setIsPlayButtonDisabled(false); 
    } else {
      if (currentChunkSentencesRef.current.length > 0) {
        console.log("TogglePlayPause: Starting audio sequence.");
        playAudioSequence().finally(() => setIsPlayButtonDisabled(false));
      } else {
        showNotification("noSentenceToPlay", "destructive");
        setIsPlayButtonDisabled(false); 
      }
    }
  }, [isPlayButtonDisabled, playAudioSequence, stopAudio, showNotification, stopContinuousPlay]);


  const handlePrevSentence = () => {
    if (isContinuousPlayingRef.current) stopContinuousPlay();
    else stopAudio();

    if (currentSentenceIndexRef.current > 0) {
      const newIndex = currentSentenceIndexRef.current - 1;
      setCurrentSentenceIndex(newIndex);
      if (studyMode === StudyMode.ActiveRecall) setIsAnswerRevealed(false);
    }
  };

  const handleNextSentence = () => {
    if (isContinuousPlayingRef.current) stopContinuousPlay();
    else stopAudio();

    if (currentSentenceIndexRef.current < currentChunkSentencesRef.current.length - 1) {
      const newIndex = currentSentenceIndexRef.current + 1;
      setCurrentSentenceIndex(newIndex);
      if (studyMode === StudyMode.ActiveRecall) setIsAnswerRevealed(false);
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
    if (!isAudioPlayingRef.current && sentence) { 
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
      showNotification("startingContinuousPlay");
    } else {
      showNotification("noSentencesInChunkToPlay", "destructive");
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
        <h1 className="text-2xl font-bold mb-2">{t('errorLoadingAppData')}</h1>
        <p className="mb-6">{error}</p>
        <Button onClick={loadSentenceData} variant="destructive">
          {t('tryReloadingData')}
        </Button>
      </div>
    );
  }
  
  const mainContentLayout = "p-4 sm:p-6 lg:p-8";

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'config':
        return (
          <ControlsSection
            language={currentLanguage}
            studyMode={studyMode}
            onStudyModeChange={(newMode) => {
              if (isContinuousPlayingRef.current) stopContinuousPlay();
              else stopAudio();
              setStudyMode(newMode);
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
        );
      case 'study':
        return (
          <>
            <StudyArea
              language={currentLanguage}
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
              language={currentLanguage}
              isPlaying={isContinuousPlaying}
              onPlayAll={handlePlayAllChunkAudio}
              onStop={stopContinuousPlay} 
              disabled={currentChunkSentences.length === 0 || isChunkLoading || (isInitialLoading && allSentences.length === 0)}
              currentSentenceIndex={isContinuousPlaying ? continuousPlayCurrentIndexRef.current : -1} 
              totalSentencesInChunk={currentChunkSentences.length}
              isLoadingChunk={isChunkLoading || (isInitialLoading && allSentences.length === 0)} 
            />
          </>
        );
      case 'flashcards':
        return (
          <FlashcardGame
            language={currentLanguage}
            sentences={currentChunkSentences}
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)}
          />
        );
      case 'builder':
        return (
          <SentenceBuilderGame
            language={currentLanguage}
            sentence={currentSentenceData}
            isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)}
            onNextSentence={handleNextSentence}
            onPrevSentence={handlePrevSentence}
            currentSentenceIndex={currentSentenceIndex}
            totalSentencesInChunk={currentChunkSentences.length}
          />
        );
      case 'timer':
        return (
          <NativeContentSwitchSection
            language={currentLanguage}
            practiceTimeMinutes={practiceTimeMinutes}
            onPracticeTimeChange={setPracticeTimeMinutes}
            onStartTimer={startTimer}
            timerDisplay={formatTime(timerSeconds)}
            isTimerRunning={isTimerRunning}
            showSwitchToNativeAlert={showSwitchToNativeAlert}
            onHideAlert={resetTimerAlert}
          />
        );
      case 'grammar':
        return (
           <div className="max-w-2xl mx-auto"> {/* Optional: Constrain width for better readability */}
            <GrammarExplainer
              language={currentLanguage}
              sentence={currentSentenceData}
              disabled={!currentSentenceData || isChunkLoading || (isInitialLoading && allSentences.length === 0)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
             <img src="/logo.svg" alt="LinguaLeap Logo" className="h-8 w-8" data-ai-hint="logo" />
            <span className="text-lg font-semibold">{t('appTitle')}</span>
            <SidebarTrigger className="ml-auto md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('study')}
                isActive={activeSection === 'study'}
                tooltip={t('studyZoneTitle')}
              >
                <NotebookPen />
                <span>{t('studyZoneTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('config')}
                isActive={activeSection === 'config'}
                tooltip={t('studyConfigurationTitle')}
              >
                <Settings />
                <span>{t('studyConfigurationTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('flashcards')}
                isActive={activeSection === 'flashcards'}
                tooltip={t('flashcardGameTitle')}
              >
                <Zap />
                <span>{t('flashcardGameTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('builder')}
                isActive={activeSection === 'builder'}
                tooltip={t('sentenceBuilderTitle')}
              >
                <Dices />
                <span>{t('sentenceBuilderTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('grammar')}
                isActive={activeSection === 'grammar'}
                tooltip={t('grammarExplanationTitle')} 
              >
                <Lightbulb />
                <span>{t('grammarExplanationTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveSection('timer')}
                isActive={activeSection === 'timer'}
                tooltip={t('focusTimerTitle')}
              >
                <TimerIcon />
                <span>{t('focusTimerTitle')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="p-2">
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={(lang) => {
                stopAudio(); 
                setCurrentLanguage(lang);
              }} 
            />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
           <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm md:hidden">
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
            <span className="text-lg font-semibold">{t(
                activeSection === 'config' ? 'studyConfigurationTitle' :
                activeSection === 'study' ? 'studyZoneTitle' :
                activeSection === 'flashcards' ? 'flashcardGameTitle' :
                activeSection === 'builder' ? 'sentenceBuilderTitle' :
                activeSection === 'grammar' ? 'grammarExplanationTitle' :
                'focusTimerTitle' // Assuming 'timer' is the last default
            )}</span>
          </div>
          <div className={mainContentLayout}>
            <div className="space-y-6 md:space-y-8"> {/* Adjusted spacing for sections */}
              {renderActiveSection()}
              <Footer language={currentLanguage} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


    