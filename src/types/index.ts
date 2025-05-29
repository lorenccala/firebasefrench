export interface Sentence {
  id: number;
  french: string;
  english: string;
  audioSrcFr?: string;
  audioSrcEn?: string;
  verbFrench?: string; // Added for French verb
  verbEnglish?: string; // Added for English verb
}

export enum StudyMode {
  ReadListen = "Read & Listen",
  ActiveRecall = "Active Recall",
  Pronunciation = "Pronunciation Practice", // Future mode placeholder
}
