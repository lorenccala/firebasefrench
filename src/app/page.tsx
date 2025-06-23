"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, StudyMode } from '@/types';
import { PLAYBACK_SPEEDS, DEFAULT_CHUNK_SIZE, DEFAULT_PRACTICE_TIME_MINUTES } from '@/lib/constants';
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';
import { translations, type Language } from '@/lib/translations';

import ControlsSection from '@/components/app/ControlsSection';
import StudyArea from '@/components/app/StudyArea';
import ContinuousListeningSection from '@/components/app/ContinuousListeningSection';
import FlashcardGame from '@/components/app/FlashcardGame';
import SentenceBuilderGame from '@/components/app/SentenceBuilderGame';
import FillInTheBlanksGame from '@/components/app/FillInTheBlanksGame';
import NativeContentSwitchSection from '@/components/app/NativeContentSwitchSection';
import Footer from '@/components/app/Footer';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import AISentenceGenerator from '@/components/app/AISentenceGenerator';
import AIProgressDashboard from '@/components/app/AIProgressDashboard';
import { LoadingSpinner } from '@/components/app/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Settings, NotebookPen, Radio, Zap, Dices, TimerIcon, PanelLeft, Lightbulb, UserCircle, PencilLine, BookOpen, Sparkles, Brain, Wand2, Languages, User, Moon, Sun, Home } from 'lucide-react'; 
import GrammarExplainer from '@/components/app/GrammarExplainer';

interface RawSentenceDataFromFile {
  id: string;
  verb: string; 
  targetSentence: string; 
  verbEnglish: string;
  englishSentence: string;
  verbAlbanian?: string; 
  albanianSentence?: string; 
  audioSrcFr?: string;
  audioSrcEn?: string;
  audioSrcAl?: string;
}

type ActiveSection = 'study' | 'games' | 'ai' | 'settings' | 'profile';

export default function ProntoLingoPage() {
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
  const [gameMode, setGameMode] = useState<'flashcards' | 'builder' | 'fillblanks' | 'grammar'>('flashcards');

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

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

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
  }, [showNotification, t]); 

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
    let primaryLang: 'fr';
    let secondaryAudioSrc: string | undefined;
    let secondaryLang: 'en' | 'al' | null = null;

    primaryAudioSrc = sentence.audioSrcFr;
    primaryLang = 'fr';

    if (currentLanguage === 'al') {
      secondaryAudioSrc = sentence.audioSrcAl;
      secondaryLang = 'al';
    } else { 
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'study':
        return (
          <div className="space-y-6">
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
                onToggleLoop: () => setIsLooping(!isLooping),
                playbackSpeed: playbackSpeed,
                onPlaybackSpeedChange: setPlaybackSpeed,
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
          </div>
        );
      case 'games':
        if (gameMode === 'flashcards') {
          return (
            <FlashcardGame
              language={currentLanguage}
              sentences={currentChunkSentences}
              isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)}
            />
          );
        } else if (gameMode === 'builder') {
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
        } else if (gameMode === 'fillblanks') {
          return (
            <FillInTheBlanksGame
              language={currentLanguage}
              sentence={currentSentenceData}
              isLoading={isChunkLoading || (isInitialLoading && allSentences.length === 0)}
              onNextSentence={handleNextSentence}
              onPrevSentence={handlePrevSentence}
              currentSentenceIndex={currentSentenceIndex}
              totalSentencesInChunk={currentChunkSentences.length}
            />
          );
        } else if (gameMode === 'grammar') {
          return (
            <div className="max-w-2xl mx-auto">
              <GrammarExplainer
                language={currentLanguage}
                sentence={currentSentenceData}
                disabled={!currentSentenceData || isChunkLoading || (isInitialLoading && allSentences.length === 0)}
              />
            </div>
          );
        }
        break;
      case 'ai':
        return (
          <div className="space-y-8">
            <AISentenceGenerator
              language={currentLanguage}
              onSentencesGenerated={(sentences) => {
                console.log('Generated sentences:', sentences);
              }}
            />
            <AIProgressDashboard
              language={currentLanguage}
              userProgress={{
                correctAnswers: 0,
                totalAttempts: 0,
                strugglingVerbs: [],
                strongVerbs: [],
                studyTimeMinutes: timerSeconds / 60,
                preferredDifficulty: 'beginner' as const,
              }}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
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
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-secondary to-accent rounded-full mx-auto flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{t('userProfile')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                <span className="font-medium">{t('language')}</span>
                <LanguageSwitcher
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                <span className="font-medium">{t('theme')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-8 w-8 p-0"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </div>
              
              <div className="p-4 bg-card rounded-xl border space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('totalSentences')}</span>
                  <span className="font-medium">{allSentences.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('currentProgress')}</span>
                  <span className="font-medium">{Math.round((currentSentenceIndex + 1) / Math.max(currentChunkSentences.length, 1) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-20">
      {/* App Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t('appTitle')}
              </h1>
              {allSentences.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                    <Languages className="h-3 w-3 mr-1" />
                    {allSentences.length} Sentences
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={(lang) => {
                stopAudio(); 
                setCurrentLanguage(lang);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Game Mode Selector for Games Section */}
      {activeSection === 'games' && (
        <div className="sticky top-[73px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex gap-2 p-4 overflow-x-auto">
            <Button
              variant={gameMode === 'flashcards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('flashcards')}
              className="whitespace-nowrap"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t('flashcardGameTitle')}
            </Button>
            <Button
              variant={gameMode === 'builder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('builder')}
              className="whitespace-nowrap"
            >
              <Dices className="h-4 w-4 mr-2" />
              {t('sentenceBuilderTitle')}
            </Button>
            <Button
              variant={gameMode === 'fillblanks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('fillblanks')}
              className="whitespace-nowrap"
            >
              <PencilLine className="h-4 w-4 mr-2" />
              {t('fillInTheBlanksTitle')}
            </Button>
            <Button
              variant={gameMode === 'grammar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('grammar')}
              className="whitespace-nowrap"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {t('grammarExplanationTitle')}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {renderActiveSection()}
        <Footer language={currentLanguage} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/40">
        <div className="flex items-center justify-around p-2">
          <Button
            variant={activeSection === 'study' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('study')}
            className="flex-col h-auto py-2 px-3"
          >
            <NotebookPen className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('studyZoneTitle')}</span>
          </Button>
          
          <Button
            variant={activeSection === 'games' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('games')}
            className="flex-col h-auto py-2 px-3"
          >
            <Zap className="h-5 w-5 mb-1" />
            <span className="text-xs">Games</span>
          </Button>
          
          <Button
            variant={activeSection === 'ai' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('ai')}
            className="flex-col h-auto py-2 px-3"
          >
            <Brain className="h-5 w-5 mb-1" />
            <span className="text-xs">AI</span>
          </Button>
          
          <Button
            variant={activeSection === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('settings')}
            className="flex-col h-auto py-2 px-3"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('studyConfigurationTitle')}</span>
          </Button>
          
          <Button
            variant={activeSection === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('profile')}
            className="flex-col h-auto py-2 px-3"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

    
