
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
  verb: string; // French verb
  targetSentence: string; // French sentence
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
        console.log("Speech synthesis voices loaded:", voices);
      } else {
        console.warn("Speech synthesis voices array is empty.");
      }
    };
    
    // Attempt to load voices immediately
    loadVoices();
    
    // Listen for changes in available voices
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      // Cancel any ongoing speech synthesis when the component unmounts
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
         showNotification("noSentencesLoadedTitle", "destructive");
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
    playRequestCounterRef.current++; // Invalidate previous/ongoing requests
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log(`Stopping audio. New playId counter: ${playRequestCounterRef.current}`);
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
    isContinuousPlayingRef.current = false; // Ensure ref is updated immediately
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
    if (!speechSynthesisVoices || speechSynthesisVoices.length === 0) {
      console.warn("TTS voices not available or not loaded yet for getVoiceForLang.");
      // Attempt to get them now, though this might be too late if called mid-render
      const currentVoices = window.speechSynthesis.getVoices();
      if (currentVoices.length > 0) {
        setSpeechSynthesisVoices(currentVoices); // This will trigger a re-render, be careful
        // Re-check with the potentially updated voices
        if (currentVoices.length === 0) return undefined;
      } else {
        return undefined;
      }
    }

    let langCodePrefix = '';
    let fullLangCode = '';
    let langVariations: string[] = [];

    if (targetLang === 'fr') { langCodePrefix = 'fr'; fullLangCode = 'fr-FR'; langVariations = ['fr-CA', 'fr-BE', 'fr-CH']; }
    else if (targetLang === 'en') { langCodePrefix = 'en'; fullLangCode = 'en-US'; langVariations = ['en-GB', 'en-AU', 'en-CA']; }
    else if (targetLang === 'al') { langCodePrefix = 'sq'; fullLangCode = 'sq-AL'; langVariations = []; } // Assuming 'sq-AL' for Albanian

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

    console.warn(`No specific voice found for language: ${targetLang} (tried ${fullLangCode}, variations, prefix ${langCodePrefix}). Utterance will use browser default if available.`);
    return undefined;
  }, [speechSynthesisVoices]);


const playTTS = useCallback((text: string, lang: 'fr' | 'en' | 'al', playId: number, onEndCallback: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.log("Speech synthesis not available.");
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
        // Do not call onEndCallback if synth is not available, let the sequence halt.
        return;
    }

    if (speechSynthesisVoices.length === 0) {
        showNotification("ttsVoicesNotReady", "destructive");
        console.warn("playTTS called but no voices loaded.");
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
        // Do not call onEndCallback if voices aren't ready.
        return;
    }

    // If this specific play request ID is no longer the active one, abort.
    if (playRequestCounterRef.current !== playId) {
        console.log(`TTS playId ${playId} for "${text.substring(0, 20)}..." [${lang}] is stale. Active playId: ${playRequestCounterRef.current}. Aborting speak.`);
        return; // Do not proceed with speaking this stale request. Don't call onEndCallback.
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLang(lang);

    if (voice) {
        utterance.voice = voice;
        console.log(`Using voice: ${voice.name} for lang ${lang}`);
    } else {
        console.warn(`No specific voice found for ${lang}. Browser default will be used if available.`);
    }
    utterance.lang = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'sq-AL';
    utterance.rate = playbackSpeedRef.current;

    utterance.onstart = () => {
        if (playRequestCounterRef.current === playId) {
            console.log(`TTS onstart for playId ${playId} ("${text.substring(0, 20)}...")`);
            setIsAudioPlaying(true);
            setCurrentAudioSrcType(lang);
        } else {
            console.log(`TTS onstart: playId ${playId} for "${text.substring(0, 20)}..." [${lang}] is stale. Active playId: ${playRequestCounterRef.current}. Not setting playing state.`);
        }
    };

    utterance.onend = () => {
        console.log(`TTS onend for playId ${playId} ("${text.substring(0, 20)}...")`);
        if (playRequestCounterRef.current === playId) {
            onEndCallback();
        } else {
            console.log(`TTS onend: playId ${playId} for "${text.substring(0, 20)}..." [${lang}] is stale. Active playId: ${playRequestCounterRef.current}. Not calling onEndCallback.`);
        }
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event, `Text: "${text.substring(0, 20)}..."`, `Lang: ${lang}`);
        showNotification("errorPlayingAudio", "destructive", { source: `TTS for ${lang} (${event.error || 'unknown error'})` });
        if (playRequestCounterRef.current === playId) {
            setIsAudioPlaying(false);
            setCurrentAudioSrcType(null);
            onEndCallback(); // Allow sequence to attempt to continue or terminate
        }
    };

    // Before speaking, one final check
    if (playRequestCounterRef.current !== playId) {
        console.log(`TTS playId ${playId} for "${text.substring(0, 20)}..." [${lang}] is stale just before speak. Active playId: ${playRequestCounterRef.current}. Aborting.`);
        return;
    }

    console.log(`Attempting to speak (Play ID ${playId}): "${text.substring(0, 20)}..." [${lang}]`);
    window.speechSynthesis.speak(utterance);

}, [getVoiceForLang, showNotification, speechSynthesisVoices]);


  const playAudioSequence = useCallback(async (
    sentenceToPlay?: Sentence,
    isPartOfContinuousSequence: boolean = false
  ) => {
    stopAudio(); // This increments playRequestCounterRef.current and cancels any ongoing speech.
    const currentPlayId = playRequestCounterRef.current; // This is the ID for this new play attempt.

    // Short delay to allow `speechSynthesis.cancel()` to fully process.
    await new Promise(resolve => setTimeout(resolve, 50));

    if (playRequestCounterRef.current !== currentPlayId) {
      console.log(`Audio sequence ${currentPlayId} became stale before starting. Active: ${playRequestCounterRef.current}.`);
      return;
    }

    const sentence = sentenceToPlay || currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    if (!sentence) {
      console.log(`PlayAudioSequence (ID ${currentPlayId}): No sentence to play.`);
      if (isPartOfContinuousSequence && isContinuousPlayingRef.current) {
        // If continuous play was meant to run but no sentence, end it.
        setTimeout(() => {
          if(playRequestCounterRef.current === currentPlayId) { // Ensure this ID is still active
             handleSequenceEndLogicRef.current?.()
          }
        }, 50);
      } else {
        // For single play, if no sentence, ensure audio state is reset. stopAudio() should handle this.
        setIsAudioPlaying(false);
        setCurrentAudioSrcType(null);
      }
      return;
    }

    console.log(`PlayAudioSequence (ID ${currentPlayId}): Starting for sentence ID ${sentence.id}`);

    let primaryText: string;
    let primaryLang: 'fr' | 'al';
    let secondaryText: string | null = null; // Initialize to null
    let secondaryLang: 'en' | 'al' | null = null; // Initialize to null

    if (currentLanguageRef.current === 'al') {
      primaryText = sentence.french;
      primaryLang = 'fr';
      secondaryText = sentence.albanianSentence;
      secondaryLang = 'al';
    } else { // Default to English UI: French first, English second
      primaryText = sentence.french;
      primaryLang = 'fr';
      secondaryText = sentence.english;
      secondaryLang = 'en';
    }

    const playPrimary = () => {
      console.log(`PlayAudioSequence (ID ${currentPlayId}): Playing primary - ${primaryLang}`);
      playTTS(primaryText, primaryLang, currentPlayId, () => {
        // This is the onEndCallback for the primary TTS
        if (playRequestCounterRef.current !== currentPlayId) {
            console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary TTS ended but sequence is stale. Not playing secondary.`);
            return;
        }
        if (secondaryText && secondaryLang) {
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary ended. Delaying for secondary - ${secondaryLang}`);
          audioSequenceDelayTimeoutRef.current = setTimeout(() => {
            if (playRequestCounterRef.current !== currentPlayId) {
                console.log(`PlayAudioSequence (ID ${currentPlayId}): Delay for secondary ended but sequence is stale.`);
                return;
            }
            console.log(`PlayAudioSequence (ID ${currentPlayId}): Playing secondary - ${secondaryLang}`);
            playTTS(secondaryText, secondaryLang, currentPlayId, () => {
              // This is the onEndCallback for the secondary TTS
              if (playRequestCounterRef.current !== currentPlayId) {
                console.log(`PlayAudioSequence (ID ${currentPlayId}): Secondary TTS ended but sequence is stale.`);
                return;
              }
              console.log(`PlayAudioSequence (ID ${currentPlayId}): Secondary ended. Setting audio to not playing.`);
              setIsAudioPlaying(false);
              setCurrentAudioSrcType(null);
              handleSequenceEndLogicRef.current?.();
            });
          }, 500); // Delay between primary and secondary
        } else {
          // No secondary text, sequence ends after primary
          console.log(`PlayAudioSequence (ID ${currentPlayId}): Primary ended, no secondary. Setting audio to not playing.`);
          setIsAudioPlaying(false);
          setCurrentAudioSrcType(null);
          handleSequenceEndLogicRef.current?.();
        }
      });
    };

    playPrimary();

  }, [stopAudio, playTTS, currentLanguageRef, currentChunkSentencesRef, currentSentenceIndexRef]);


  useEffect(() => {
    const handleSequenceEndLogicInternal = () => {
      const currentTriggeringPlayId = playRequestCounterRef.current; // ID that led to this sequence end
      console.log(`handleSequenceEndLogicInternal called, triggered by playId completion related to ${currentTriggeringPlayId}`);

      if (isLoopingRef.current && !isContinuousPlayingRef.current) {
        setTimeout(() => {
          if (playRequestCounterRef.current === currentTriggeringPlayId && isLoopingRef.current && !isContinuousPlayingRef.current) {
            console.log(`Looping: Replay for original playId ${currentTriggeringPlayId}. Calling playAudioSequence.`);
            playAudioSequence(); // This will generate a new playId.
          } else {
             console.log(`Looping: Replay skipped. currentRef: ${playRequestCounterRef.current} vs trigger: ${currentTriggeringPlayId}, isLooping: ${isLoopingRef.current}`);
          }
        }, 200);
      } else if (isContinuousPlayingRef.current) {
        const nextIndex = continuousPlayCurrentIndexRef.current + 1;
        if (nextIndex < currentChunkSentencesRef.current.length) {
          setCurrentSentenceIndex(nextIndex); // Update UI immediately
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
        // Normal end of single play, or loop/continuous was turned off.
        // isAudioPlaying and currentAudioSrcType are already reset by the final playTTS callback.
        console.log(`Sequence ended (not looping/continuous) for playId ${currentTriggeringPlayId}.`);
        // No need to set isAudioPlaying false here, it's done by the playTTS chain.
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
      console.log("TogglePlayPause: Stopping audio.");
      stopAudio();
      if(isContinuousPlayingRef.current) {
        // If it was continuous play, user pausing should stop it fully.
        stopContinuousPlay();
      }
    } else {
      if (currentChunkSentencesRef.current.length > 0) {
        console.log("TogglePlayPause: Starting audio sequence.");
        playAudioSequence();
      } else {
        showNotification("noSentenceToPlay", "destructive");
      }
    }
  }, [playAudioSequence, stopAudio, showNotification, stopContinuousPlay]);


  const handlePrevSentence = () => {
    if (isContinuousPlayingRef.current) stopContinuousPlay(); // Stop continuous if navigating manually
    else stopAudio();

    if (currentSentenceIndexRef.current > 0) {
      const newIndex = currentSentenceIndexRef.current - 1;
      setCurrentSentenceIndex(newIndex);
      if (studyMode === StudyMode.ActiveRecall) setIsAnswerRevealed(false);
    }
  };

  const handleNextSentence = () => {
     if (isContinuousPlayingRef.current) stopContinuousPlay(); // Stop continuous if navigating manually
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
    // If continuous play starts, answer should be revealed.
    if (isContinuousPlayingRef.current) {
        setIsAnswerRevealed(true);
    }
  }, [currentSentenceIndex, studyMode]); // Removed isContinuousPlaying from deps to avoid loop, handle it in start/stop


  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    const sentence = currentChunkSentencesRef.current[currentSentenceIndexRef.current];
    if (!isAudioPlayingRef.current && sentence) {
      playAudioSequence(); // Play audio when answer is revealed (if not already playing)
    }
  };

  const handlePlayAllChunkAudio = () => {
    if (currentChunkSentencesRef.current.length > 0) {
      stopAudio(); // Ensure any single play is stopped
      setIsContinuousPlaying(true);
      isContinuousPlayingRef.current = true; // Update ref immediately
      continuousPlayCurrentIndexRef.current = 0;
      setCurrentSentenceIndex(0); // Start from the beginning
      setIsAnswerRevealed(true); // Reveal answers during continuous play
      // A short delay before starting the sequence to allow state updates
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
                // If audio is playing, stop and restart with new speed (optional)
                // For simplicity, new speed will apply to next playback.
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
