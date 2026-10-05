import { Timestamp } from '@react-native-firebase/firestore';

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface QuizQuestion {
  id: string;
  order: number;
  questionType: QuizQuestionType;
  question: string;
  questionTelugu?: string;
  options: string[];
  optionsTelugu?: string[];
  correctAnswer: string | string[]; // Single string or array of strings for multiple_choice
  bibleReference: string; // e.g. "John 1:1"
  book?: string; // Canonical book name e.g. "John"
  chapter?: number;
  verse?: number | string;
  explanation: string;
  explanationTelugu?: string;
  marks: number;
  questionHash?: string; // Normalized string hash for duplicate checking
}

// Client-sanitized question for members taking the quiz (No correct answers or explanations)
export interface PublicQuizQuestion {
  id: string;
  order: number;
  questionType: QuizQuestionType;
  question: string;
  questionTelugu?: string;
  options: string[];
  optionsTelugu?: string[];
  bibleReference?: string;
  marks: number;
}

export interface BibleQuiz {
  id: string;
  churchId: string; // 'global' or churchId
  churchName?: string;
  title: string;
  description: string;
  category: string; // e.g. 'Family', 'Friends', 'Mother', 'Father', 'Love', etc.
  level?: number; // 1 to 30 for Level-Based Quizzes
  book?: string;
  chapterStart?: number;
  chapterEnd?: number;
  topic?: string;
  difficulty: QuizDifficulty;
  language: string; // 'en' | 'te' | 'ta' | 'hi' | 'kn' | 'ml' | 'mr'
  bibleVersion?: string; // 'NIV', 'KJV', 'BSI'
  isDailyQuiz: boolean;
  dailyDate?: string; // 'YYYY-MM-DD'
  timeLimitMinutes: number; // 0 = untimed, >0 = timed
  passPercentage: number; // e.g. 70
  allowMultipleAttempts: boolean;
  maxAttempts: number; // default 1 for daily quiz
  status: QuizStatus;
  startAt?: any;
  endAt?: any;
  totalQuestions: number;
  totalMarks: number;
  marksPerQuestion: number;
  quizImageUrl?: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface MemberCategoryProgress {
  category: string;
  difficulty: QuizDifficulty;
  unlockedLevel: number; // 1 to 30 (starts at 1)
  completedLevels: Record<number, {
    score: number;
    total: number;
    percentage: number;
    stars: number;
    completedAt: string;
  }>;
}

export interface UserAnswerSubmission {
  questionId: string;
  selectedAnswer: string | string[];
}

export interface QuizAttemptAnswer {
  questionId: string;
  question: string;
  selectedAnswer: string | string[];
  correctAnswer: string | string[];
  bibleReference: string;
  explanation: string;
  isCorrect: boolean;
  marksAwarded: number;
  possibleMarks: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  churchId: string;
  userId: string;
  memberName: string;
  memberPhone?: string;
  memberAvatar?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  passed: boolean;
  answers: QuizAttemptAnswer[];
  submittedAt: any;
  isDaily: boolean;
}

export interface QuizAnalyticsReport {
  quizId: string;
  totalAttempts: number;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRatePercentage: number;
  questionStats: Array<{
    questionId: string;
    question: string;
    bibleReference: string;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    mostCommonWrongAnswer?: string;
  }>;
  recentAttempts: QuizAttempt[];
}
