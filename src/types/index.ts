export interface Sentence {
  id: number;
  french: string;
  english: string;
  audioSrcFr?: string;
  audioSrcEn?: string;
}

export enum StudyMode {
  ReadListen = "Read & Listen",
  ActiveRecall = "Active Recall",
  Pronunciation = "Pronunciation Practice", // Future mode placeholder
}
