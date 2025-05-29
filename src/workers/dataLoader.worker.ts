import { Sentence } from '@/types'; // Assuming Sentence type is defined in this path

// Define an interface for the raw data structure from JSON
interface RawSentenceData {
  id: string;
  verb: string; // This is the French verb
  targetSentence: string; // French sentence
  verbEnglish: string; // This is the English verb
  englishSentence: string; // English sentence
  verbAlbanian: string; // Albanian verb
  albanianSentence: string; // Albanian sentence
  audioSrcEn?: string;
  audioSrcFr?: string;
  // audioSrcAl?: string; // Optional: if you have Albanian audio source
}

// Ensure the global self is properly typed for a Web Worker
declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (event: MessageEvent<string>) => {
  if (event.data === 'load_data') {
    try {
      const response = await fetch('/data/data.json'); // Ensure this path is correct
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const rawData: RawSentenceData[] = await response.json();

      if (!Array.isArray(rawData)) {
        // Handle cases where rawData is not an array (e.g., it's an object with a property containing the array)
        // This depends on the actual structure of your data.json
        // For now, assuming rawData is directly the array or is an error.
        console.warn("Web Worker: Data is not in expected array format.", rawData);
        self.postMessage({ type: 'error', message: 'Data format error: Expected an array.' });
        return;
      }
      
      if (rawData.length === 0) {
        console.warn("Web Worker: No sentences found in the data.");
        self.postMessage({ type: 'data_loaded', data: [] });
      } else {
        const transformedSentences: Sentence[] = rawData.map(item => ({
          id: parseInt(item.id, 10),
          french: item.targetSentence,
          english: item.englishSentence,
          albanianSentence: item.albanianSentence, // Added this line
          verbFrench: item.verb,
          verbEnglish: item.verbEnglish,
          verbAlbanian: item.verbAlbanian,       // Added this line
          audioSrcFr: item.audioSrcFr,
          audioSrcEn: item.audioSrcEn,
          // audioSrcAl: item.audioSrcAl, // Uncomment if you add audioSrcAl to RawSentenceData and Sentence type
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

// This export is necessary to treat the file as a module, especially in TypeScript.
export {};
