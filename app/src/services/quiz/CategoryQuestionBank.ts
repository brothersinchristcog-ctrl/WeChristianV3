import { QuizQuestion, QuizDifficulty } from '../../types/Quiz';
import {
  FAMILY_QUESTION_REGISTRY,
  getFamilyStageQuestions,
  getFamilyLevelQuestions
} from './FamilyQuestionBank';
import {
  FRIENDS_QUESTION_REGISTRY,
  getFriendsStageQuestions,
  getFriendsLevelQuestions
} from './banks/FriendsQuestionBank';
import {
  MOTHER_QUESTION_REGISTRY,
  getMotherStageQuestions,
  getMotherLevelQuestions
} from './banks/MotherQuestionBank';
import {
  FATHER_QUESTION_REGISTRY,
  getFatherStageQuestions,
  getFatherLevelQuestions
} from './banks/FatherQuestionBank';
import {
  LOVE_QUESTION_REGISTRY,
  getLoveStageQuestions,
  getLoveLevelQuestions
} from './banks/LoveQuestionBank';
import {
  CARE_QUESTION_REGISTRY,
  getCareStageQuestions,
  getCareLevelQuestions
} from './banks/CareQuestionBank';
import {
  HOPE_QUESTION_REGISTRY,
  getHopeStageQuestions,
  getHopeLevelQuestions
} from './banks/HopeQuestionBank';
import {
  FAILURE_QUESTION_REGISTRY,
  getFailureStageQuestions,
  getFailureLevelQuestions
} from './banks/FailureQuestionBank';
import {
  FEAR_QUESTION_REGISTRY,
  getFearStageQuestions,
  getFearLevelQuestions
} from './banks/FearQuestionBank';
import {
  PEACE_QUESTION_REGISTRY,
  getPeaceStageQuestions,
  getPeaceLevelQuestions
} from './banks/PeaceQuestionBank';
import {
  LIFE_QUESTION_REGISTRY,
  getLifeStageQuestions,
  getLifeLevelQuestions
} from './banks/LifeQuestionBank';
import {
  WISDOM_QUESTION_REGISTRY,
  getWisdomStageQuestions,
  getWisdomLevelQuestions
} from './banks/WisdomQuestionBank';

export interface StageQuestions {
  foundation: QuizQuestion[];
  growth: QuizQuestion[];
  mastery: QuizQuestion[];
}

export interface CategoryHandler {
  getStageQuestions: (difficulty: QuizDifficulty, stage: 1 | 2 | 3) => QuizQuestion[];
  getLevelQuestions: (difficulty: QuizDifficulty, level: number) => QuizQuestion[];
  registry?: Record<QuizDifficulty, StageQuestions>;
}

const CATEGORY_DISPATCH: Record<string, CategoryHandler> = {
  family: { getStageQuestions: getFamilyStageQuestions, getLevelQuestions: getFamilyLevelQuestions, registry: FAMILY_QUESTION_REGISTRY },
  friends: { getStageQuestions: getFriendsStageQuestions, getLevelQuestions: getFriendsLevelQuestions, registry: FRIENDS_QUESTION_REGISTRY },
  mother: { getStageQuestions: getMotherStageQuestions, getLevelQuestions: getMotherLevelQuestions, registry: MOTHER_QUESTION_REGISTRY },
  father: { getStageQuestions: getFatherStageQuestions, getLevelQuestions: getFatherLevelQuestions, registry: FATHER_QUESTION_REGISTRY },
  love: { getStageQuestions: getLoveStageQuestions, getLevelQuestions: getLoveLevelQuestions, registry: LOVE_QUESTION_REGISTRY },
  care: { getStageQuestions: getCareStageQuestions, getLevelQuestions: getCareLevelQuestions, registry: CARE_QUESTION_REGISTRY },
  hope: { getStageQuestions: getHopeStageQuestions, getLevelQuestions: getHopeLevelQuestions, registry: HOPE_QUESTION_REGISTRY },
  failure: { getStageQuestions: getFailureStageQuestions, getLevelQuestions: getFailureLevelQuestions, registry: FAILURE_QUESTION_REGISTRY },
  fear: { getStageQuestions: getFearStageQuestions, getLevelQuestions: getFearLevelQuestions, registry: FEAR_QUESTION_REGISTRY },
  peace: { getStageQuestions: getPeaceStageQuestions, getLevelQuestions: getPeaceLevelQuestions, registry: PEACE_QUESTION_REGISTRY },
  life: { getStageQuestions: getLifeStageQuestions, getLevelQuestions: getLifeLevelQuestions, registry: LIFE_QUESTION_REGISTRY },
  wisdom: { getStageQuestions: getWisdomStageQuestions, getLevelQuestions: getWisdomLevelQuestions, registry: WISDOM_QUESTION_REGISTRY }
};

export class CategoryQuestionBank {
  /**
   * Returns all 12 supported category keys
   */
  static getSupportedCategories(): string[] {
    return Object.keys(CATEGORY_DISPATCH);
  }

  /**
   * Checks if a category is supported
   */
  static isSupportedCategory(category: string): boolean {
    const cat = (category || '').trim().toLowerCase();
    return cat in CATEGORY_DISPATCH;
  }

  /**
   * Retrieves the exact 50 unique questions for a specific Topic, Difficulty, and Stage.
   * Guarantees:
   * - 50 unique questions per stage
   * - No duplicates within the stage
   * - No duplicates across stages
   * - No duplicates across difficulties
   * - Zero cross-topic overlap (12 dedicated 450-question banks = 5,400 unique questions)
   */
  static getStageQuestions(
    category: string,
    difficulty: QuizDifficulty = 'easy',
    stage: 1 | 2 | 3 = 1
  ): QuizQuestion[] {
    const catNormalized = (category || 'Family').trim().toLowerCase();
    const diff = (difficulty || 'easy').toLowerCase() as QuizDifficulty;

    const handler = CATEGORY_DISPATCH[catNormalized];
    if (handler) {
      return handler.getStageQuestions(diff, stage);
    }

    // Default to family if unknown category
    return getFamilyStageQuestions(diff, stage);
  }

  /**
   * Retrieves the exact 5 unique questions for a specific Level (1-30).
   * Level 1-10: Foundation (5 questions per level from stage 1)
   * Level 11-20: Growth (5 questions per level from stage 2)
   * Level 21-30: Mastery / Stage 3 (5 questions per level from stage 3)
   */
  static getLevelQuestions(
    category: string,
    difficulty: QuizDifficulty = 'easy',
    level: number = 1
  ): QuizQuestion[] {
    const catNormalized = (category || 'Family').trim().toLowerCase();
    const diff = (difficulty || 'easy').toLowerCase() as QuizDifficulty;

    const handler = CATEGORY_DISPATCH[catNormalized];
    if (handler) {
      return handler.getLevelQuestions(diff, level);
    }

    return getFamilyLevelQuestions(diff, level);
  }
}
