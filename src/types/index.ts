
export interface Sentence {
  id: number;
  french: string;
  english: string;
  albanianSentence: string;
  verbFrench?: string;
  verbEnglish?: string;
  verbAlbanian?: string;
  audioSrcFr?: string;
  audioSrcEn?: string;
  audioSrcAl?: string;
}

export enum StudyMode {
  ReadListen = "Read & Listen",
  ActiveRecall = "Active Recall",
  Pronunciation = "Pronunciation Practice", // Future mode placeholder
}
