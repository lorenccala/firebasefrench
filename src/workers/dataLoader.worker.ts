import { Sentence } from '@/types';

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

self.onmessage = async (event) => {
  if (event.data === 'load_data') {
    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const rawData: RawSentenceData[] = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.warn("Web Worker: No sentences found or data is not in expected format.");
        self.postMessage({ type: 'data_loaded', data: [] });
      } else {
        const transformedSentences: Sentence[] = rawData.map(item => ({
          id: parseInt(item.id, 10),
          french: item.targetSentence,
          english: item.englishSentence,
          verbFrench: item.verb,
          verbEnglish: item.verbEnglish,
          audioSrcFr: item.audioSrcFr,
          audioSrcEn: item.audioSrcEn,
        }));
        self.postMessage({ type: 'data_loaded', data: transformedSentences });
      }
    } catch (err) {
      console.error('Web Worker: Error loading sentence data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: 'error', message: `Error loading data: ${errorMessage}` });
    }
  }
};

export {}; // Treat the file as a module