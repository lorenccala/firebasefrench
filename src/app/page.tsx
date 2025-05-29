
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, StudyMode } from '@/types';
import { PLAYBACK_SPEEDS, DEFAULT_CHUNK_SIZE, MIN_CHUNK_SIZE, MAX_CHUNK_SIZE, DEFAULT_PRACTICE_TIME_MINUTES } from '@/lib/constants';
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';
import { translations, type Language } from '@/lib/translations';

import Header from '@/components/app/Header';
import ControlsSection from '@/components/app/ControlsSection';
import StudyArea from '@/components/app/StudyArea';
import ContinuousListeningSection from '@/components/app/ContinuousListeningSection';
import NativeContentSwitchSection from '@/components/app/NativeContentSwitchSection';
import Footer from '@/components/app/Footer';
import { LoadingSpinner } from '@/components/app/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface RawSentenceDataFromFile {
  id: string;
  verb: string;
  targetSentence: string;
  verbEnglish: string;
  englishSentence: string;
  verbAlbanian: string;
  albanianSentence: string;
}

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

  const { toast } = useToast();

  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentAudioSrcType, setCurrentAudioSrcType] = useState<'fr' | 'en' | 'al' | null>(null); 

  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(studyMode !== StudyMode.ActiveRecall);
  const [isContinuousPlaying, setIsContinuousPlaying] = useState<boolean>(false);

  const continuousPlayCurrentIndexRef = useRef<number>(0);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

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
  const currentLanguageRef = useRef(currentLanguage);

  const audioSequenceDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSequenceEndLogicRef = useRef<(() => void) | null>(null);
  const playRequestCounterRef = useRef<number>(0); 

  const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => { currentSentenceIndexRef.current = currentSentenceIndex; }, [currentSentenceIndex]);
  useEffect(() => { currentChunkSentencesRef.current = currentChunkSentences; }, [currentChunkSentences]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { currentAudioSrcTypeRef.current = currentAudioSrcType; }, [currentAudioSrcType]);
  useEffect(() => { isAudioPlayingRef.current = isAudioPlaying; }, [isAudioPlaying]);
  useEffect(() => { isContinuousPlayingRef.current = isContinuousPlaying; }, [isContinuousPlaying]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { currentLanguageRef.current = currentLanguage; }, [currentLanguage]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setSpeechSynthesisVoices(voices);
      }
    };
    loadVoices(); 
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      window.speechSynthesis.cancel(); 
    };
  }, []);


  useEffect(() => {
    if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
      setIsAnswerRevealed(false);
    } else {
      setIsAnswerRevealed(true);
    }
  }, [studyMode]);

  const showNotification = useCallback((messageKey: keyof typeof translations, variant: "default" | "destructive" = "default", params?: Record<string, string | number>) => {
    let message = translations[messageKey] ? translations[messageKey][currentLanguageRef.current] : String(messageKey);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, String(value));
      });
    }
    toast({
      title: variant === "destructive" ? translations.errorTitle[currentLanguageRef.current] : translations.notificationTitle[currentLanguageRef.current],
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
      const rawData: RawSentenceDataFromFile[] = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setAllSentences([]);
      } else {
        const transformedSentences: Sentence[] = rawData.map(item => ({
          id: parseInt(item.id, 10),
          french: item.targetSentence,
          english: item.englishSentence,
          albanianSentence: item.albanianSentence,
          verbFrench: item.verb,
          verbEnglish: item.verbEnglish,
          verbAlbanian: item.verbAlbanian,
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
      setSelectedChunkNum(0);
    }
  }, [allSentences, chunkSize, selectedChunkNum]);

  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      playRequestCounterRef.current++; 
      window.speechSynthesis.cancel();
    }
    if (audioSequenceDelayTimeoutRef.current) {
      clearTimeout(audioSequenceDelayTimeoutRef.current);
      audioSequenceDelayTimeoutRef.current = null;
    }
    setIsAudioPlaying(false);
    setCurrentAudioSrcType(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChunkNum, chunkSize, isInitialLoading, allSentences.length]);

  const getVoiceForLang = useCallback((targetLang: 'fr' | 'en' | 'al'): SpeechSynthesisVoice | undefined => {
    if (speechSynthesisVoices.length === 0) {
      console.warn("TTS voices not loaded yet for getVoiceForLang.");
      const currentVoices = window.speechSynthesis.getVoices();
      if (currentVoices.length > 0) {
        setSpeechSynthesisVoices(currentVoices);
      } else {
        return undefined; 
      }
    }

    let langCodePrefix = '';
    let fullLangCode = ''; 
    let langVariations: string[] = []; 

    if (targetLang === 'fr') { langCodePrefix = 'fr'; fullLangCode = 'fr-FR'; langVariations = ['fr-CA', 'fr-BE', 'fr-CH']; }
    else if (targetLang === 'en') { langCodePrefix = 'en'; fullLangCode = 'en-US'; langVariations = ['en-GB', 'en-AU', 'en-CA']; }
    else if (targetLang === 'al') { langCodePrefix = 'sq'; fullLangCode = 'sq-AL'; langVariations = [];}

    let voice = speechSynthesisVoices.find(v => v.lang === fullLangCode);
    if (voice) return voice;

    for (const variation of langVariations) {
      voice = speechSynthesisVoices.find(v => v.lang === variation);
      if (voice) return voice;
    }
    
    voice = speechSynthesisVoices.find(v => v.lang.startsWith(langCodePrefix + '-'));
    if (voice) return voice;

    voice = speechSynthesisVoices.find(v => v.lang === langCodePrefix);
    if (voice) return voice;
    
    console.warn(`No specific voice found for language: ${targetLang} (${fullLangCode}). Utterance will use browser default if available.`);
    return undefined; 
  }, [speechSynthesisVoices]);


  const playTTS = useCallback((text: string, lang: 'fr' | 'en' | 'al', playId: number, onEndCallback: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || playRequestCounterRef.current !== playId) {
      if (playRequestCounterRef.current !== playId) console.log("TTS request invalidated");
      else console.log("Speech synthesis not available or request invalidated.");
      onEndCallback(); 
      return;
    }

    if (speechSynthesisVoices.length === 0) {
        showNotification("ttsVoicesNotReady", "destructive");
        onEndCallback();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLang(lang);

    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'sq-AL';
    utterance.rate = playbackSpeedRef.current;

    utterance.onstart = () => {
      if (playRequestCounterRef.current === playId) {
        setIsAudioPlaying(true);
        setCurrentAudioSrcType(lang);
      }
    };

    utterance.onend = () => {
      if (playRequestCounterRef.current === playId) {
        onEndCallback();
      }
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      showNotification("errorPlayingAudio", "destructive", { source: `TTS for ${lang}` });
      if (playRequestCounterRef.current === playId) {
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
        onEndCallback(); 
      }
    };
    
    window.speechSynthesis.speak(utterance);

  }, [getVoiceForLang, showNotification, speechSynthesisVoices]);


  const playAudioSequence = useCallback(async (
    sentenceToPlay?: Sentence,
    isPartOfContinuousSequence: boolean = false
  ) => {
    const currentPlayId = ++playRequestCounterRef.current;

    if (isPartOfContinuousSequence && !isContinuousPlayingRef.current) return;

    stopAudio(); 

    await new Promise(resolve => setTimeout(resolve, 50)); 
    if (playRequestCounterRef.current !== currentPlayId) return; 


    const sentence = sentenceToPlay || currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    if (!sentence) {
      if (isPartOfContinuousSequence && isContinuousPlayingRef.current) {
        setTimeout(() => handleSequenceEndLogicRef.current?.(), 50);
      }
      return;
    }

    let primaryText: string;
    let primaryLang: 'fr' | 'al';
    let secondaryText: string | null;
    let secondaryLang: 'en' | 'al';

    if (currentLanguageRef.current === 'al') {
      primaryText = sentence.french; // French first
      primaryLang = 'fr';
      secondaryText = sentence.albanianSentence; // Albanian second
      secondaryLang = 'al';
    } else { // Default to English UI: French first, English second
      primaryText = sentence.french;
      primaryLang = 'fr';
      secondaryText = sentence.english;
      secondaryLang = 'en';
    }

    const playPrimary = () => {
      playTTS(primaryText, primaryLang, currentPlayId, () => {
        if (playRequestCounterRef.current !== currentPlayId) return;
        if (secondaryText) {
          audioSequenceDelayTimeoutRef.current = setTimeout(() => {
            if (playRequestCounterRef.current !== currentPlayId) return;
            playTTS(secondaryText!, secondaryLang, currentPlayId, () => {
              if (playRequestCounterRef.current !== currentPlayId) return;
              setIsAudioPlaying(false);
              setCurrentAudioSrcType(null);
              handleSequenceEndLogicRef.current?.();
            });
          }, 500);
        } else {
          setIsAudioPlaying(false);
          setCurrentAudioSrcType(null);
          handleSequenceEndLogicRef.current?.();
        }
      });
    };

    playPrimary();

  }, [stopAudio, playTTS]);


  useEffect(() => {
    const handleSequenceEndLogicInternal = () => {
      const currentGlobalPlayId = playRequestCounterRef.current; 

      if (isLoopingRef.current && !isContinuousPlayingRef.current) {
        setTimeout(() => {
          if (playRequestCounterRef.current === currentGlobalPlayId && isLoopingRef.current) { 
            playAudioSequence();
          }
        }, 200);
      } else if (isContinuousPlayingRef.current) {
        const nextIndex = continuousPlayCurrentIndexRef.current + 1;
        if (nextIndex < currentChunkSentencesRef.current.length) {
          setCurrentSentenceIndex(nextIndex);
          continuousPlayCurrentIndexRef.current = nextIndex;
          setTimeout(() => {
            if (playRequestCounterRef.current === currentGlobalPlayId && isContinuousPlayingRef.current) {
              playAudioSequence(currentChunkSentencesRef.current[nextIndex], true);
            }
          }, 200);
        } else {
          stopContinuousPlay();
        }
      } else {
         if (playRequestCounterRef.current === currentGlobalPlayId) { 
            setIsAudioPlaying(false);
            setCurrentAudioSrcType(null);
        }
      }
    };

    handleSequenceEndLogicRef.current = handleSequenceEndLogicInternal;

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioSequenceDelayTimeoutRef.current) {
        clearTimeout(audioSequenceDelayTimeoutRef.current);
      }
    };
  }, [playAudioSequence, stopContinuousPlay]); 


  const togglePlayPause = useCallback(() => {
    if (isAudioPlayingRef.current) {
      stopAudio();
    } else {
      if (currentChunkSentencesRef.current.length > 0) {
        playAudioSequence();
      } else {
        showNotification("noSentenceToPlay", "destructive");
      }
    }
  }, [playAudioSequence, stopAudio, showNotification]);


  const handlePrevSentence = () => {
    if (currentSentenceIndexRef.current > 0) {
      stopAudio();
      const newIndex = currentSentenceIndexRef.current - 1;
      setCurrentSentenceIndex(newIndex);
      if (isContinuousPlayingRef.current) continuousPlayCurrentIndexRef.current = newIndex;
      if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) setIsAnswerRevealed(false);
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndexRef.current < currentChunkSentencesRef.current.length - 1) {
      stopAudio();
      const newIndex = currentSentenceIndexRef.current + 1;
      setCurrentSentenceIndex(newIndex);
      if (isContinuousPlayingRef.current) continuousPlayCurrentIndexRef.current = newIndex;
      if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) setIsAnswerRevealed(false);
    }
  };

  useEffect(() => {
    if (studyMode === StudyMode.ActiveRecall && !isContinuousPlayingRef.current) {
      setIsAnswerRevealed(false);
    } else if (studyMode !== StudyMode.ActiveRecall) {
      setIsAnswerRevealed(true);
    }
    if (isContinuousPlayingRef.current) setIsAnswerRevealed(true);
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
        <h1 className="text-2xl font-bold mb-2">{translations.errorLoadingAppData[currentLanguage]}</h1>
        <p className="mb-6">{error}</p>
        <Button onClick={loadSentenceData} variant="destructive">
          {translations.tryReloadingData[currentLanguage]}
        </Button>
      </div>
    );
  }

  const mainContentLayout = "mt-8 space-y-10 md:space-y-12";

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="container mx-auto max-w-screen-xl bg-card shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 ring-1 ring-border/50">
        <Header language={currentLanguage} onLanguageChange={(lang) => {
          stopAudio(); 
          setCurrentLanguage(lang);
        }} />

        <div className={mainContentLayout}>
          <ControlsSection
            language={currentLanguage}
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
          <Footer language={currentLanguage} />
        </div>
      </div>
    </div>
  );
}
