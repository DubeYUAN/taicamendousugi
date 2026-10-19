export type SRSState = 'new' | 'learning' | 'review' | 'mastered';
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSRecord {
  reps: number;         // consecutive successful repetitions
  interval: number;     // interval in days
  easeFactor: number;   // default 2.5, min 1.3
  dueDate: number;      // timestamp in ms
  state: SRSState;
}

export interface MistakeHistoryItem {
  date: number;
  mode: string;
  userAnswer?: string;
  correctAnswer: string;
}

export interface MistakeRecord {
  wrongCount: number;
  correctCount: number;
  lastReviewedAt?: number;
  lastResult?: 'correct' | 'wrong';
  isMistakeMarked: boolean;
  history: MistakeHistoryItem[];
}

export interface Flashcard {
  id: string;
  term: string;               // Word or phrase in target language
  definition: string;         // Meaning or translation
  phonetic?: string;          // Pronunciation guide (IPA, Kana, Pinyin, Romaji)
  partOfSpeech?: string;      // n., v., adj., phrase, etc.
  example?: string;           // Example sentence in target language
  exampleTranslation?: string;// Example sentence translation
  notes?: string;             // Personal notes or mnemonic hints
  deckId: string;             // Associated Deck ID
  tags: string[];             // Custom tags
  lang: string;               // BCP-47 tag, e.g., 'en-US', 'ja-JP', 'ko-KR', 'es-ES'
  createdAt: number;
  updatedAt: number;
  srs: SRSRecord;
  mistakes: MistakeRecord;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  defaultLang: string;
  color?: string;
  icon?: string;
  createdAt: number;
}

export type QuizMode = 'multiple-choice' | 'spelling' | 'flashcard' | 'listening';
export type QuizSource = 'all' | 'due' | 'mistakes' | 'deck';
export type QuizDirection = 'term-to-def' | 'def-to-term' | 'mixed';

export interface QuizConfig {
  mode: QuizMode;
  source: QuizSource;
  deckId?: string;
  questionCount: number;
  direction: QuizDirection;
  autoPlayAudio: boolean;
  slowAudio: boolean;
}

export interface QuizQuestion {
  id: string;
  card: Flashcard;
  direction: 'term-to-def' | 'def-to-term';
  questionText: string;
  answerText: string;
  options?: string[]; // for multiple-choice
  audioText: string;
  audioLang: string;
}

export interface QuestionResult {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
  rating?: SRSRating;
  timestamp: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  sampleVoice?: string;
}
