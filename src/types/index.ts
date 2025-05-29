
export interface Sentence {
  id: number;
  french: string;
  english: string;
  albanianSentence: string; // Added for Albanian sentence
  audioSrcFr?: string;
  audioSrcEn?: string;
  verbFrench?: string;
  verbEnglish?: string;
  verbAlbanian?: string; // Added for Albanian verb
}

export enum StudyMode {
  ReadListen = "Read & Listen",
  ActiveRecall = "Active Recall",
  Pronunciation = "Pronunciation Practice", // Future mode placeholder
}
