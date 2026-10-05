import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from './firebaseConfig';
import {
  BibleQuiz,
  PublicQuizQuestion,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizQuestion,
  UserAnswerSubmission,
  QuizAnalyticsReport,
  QuizStatus,
} from '../types/Quiz';

export class QuizService {
  private static QUIZZES_COLLECTION = 'bibleQuizzes';
  private static ATTEMPTS_COLLECTION = 'quizAttempts';

  /**
   * Helper: Get active church ID from parameter or AsyncStorage.
   */
  private static async resolveChurchId(churchId?: string): Promise<string> {
    if (churchId && churchId !== 'global') return churchId;
    try {
      const stored = await AsyncStorage.getItem('@active_church_id');
      if (stored) return stored;
    } catch {
      // Ignore AsyncStorage error
    }
    return churchId || 'global';
  }

  /**
   * Fetch quizzes for a church (includes church-specific and global quizzes).
   * Automatically queries church-scoped collections first, with safe fallbacks.
   */
  static async getQuizzes(
    churchId?: string,
    options?: {
      status?: QuizStatus;
      category?: string;
      isDaily?: boolean;
      isAdmin?: boolean;
    }
  ): Promise<BibleQuiz[]> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const docsMap = new Map<string, BibleQuiz>();

      // 1. Fetch from church-specific subcollection (permitted by church rules)
      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const churchSnaps = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.QUIZZES_COLLECTION)
            .get();

          churchSnaps.docs.forEach((doc: any) => {
            docsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } catch (e: any) {
          console.warn('[QuizService] Notice: church quizzes query:', e?.message || e);
        }
      }

      // 2. Fetch from global church subcollection
      try {
        const globalSnaps = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .get();

        globalSnaps.docs.forEach((doc: any) => {
          if (!docsMap.has(doc.id)) {
            docsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch (e: any) {
        // Suppress if not found
      }

      // 3. Fallback: try top-level collection safely (in case deployed with root rules)
      try {
        const rootSnaps = await firestore()
          .collection(this.QUIZZES_COLLECTION)
          .get();

        rootSnaps.docs.forEach((doc: any) => {
          if (!docsMap.has(doc.id)) {
            docsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch (e: any) {
        // Silently catch permission-denied or missing collection at root
      }

      let list = Array.from(docsMap.values());

      // Filter by church: include church-specific AND global quizzes
      if (targetChurchId && targetChurchId !== 'global') {
        list = list.filter(q => q.churchId === targetChurchId || q.churchId === 'global' || !q.churchId);
      }

      // Filter by status (members only see 'published', admins can see all)
      if (options?.status) {
        list = list.filter(q => q.status === options.status);
      } else if (!options?.isAdmin) {
        list = list.filter(q => q.status === 'published');
      }

      // Filter by category
      if (options?.category && options.category !== 'All') {
        list = list.filter(q => q.category?.toLowerCase() === options.category!.toLowerCase());
      }

      // Filter by daily
      if (typeof options?.isDaily === 'boolean') {
        list = list.filter(q => Boolean(q.isDailyQuiz) === options.isDaily);
      }

      // Sort by newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      return list;
    } catch (err: any) {
      console.warn('[QuizService] Handled getQuizzes failure:', err?.message || err);
      return [];
    }
  }

  /**
   * Fetch a single quiz by ID (full details with answers for Admin / Scoring).
   */
  static async getQuizById(quizId: string, churchId?: string): Promise<BibleQuiz | null> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);

      // 1. Check church-scoped collection
      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const doc = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.QUIZZES_COLLECTION)
            .doc(quizId)
            .get();
          const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
          if (exists) return { id: doc.id, ...doc.data() } as BibleQuiz;
        } catch {
          // ignore
        }
      }

      // 2. Check global church subcollection
      try {
        const doc = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .get();
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
        if (exists) return { id: doc.id, ...doc.data() } as BibleQuiz;
      } catch {
        // ignore
      }

      // 3. Fallback to top-level collection
      try {
        const doc = await firestore().collection(this.QUIZZES_COLLECTION).doc(quizId).get();
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
        if (exists) return { id: doc.id, ...doc.data() } as BibleQuiz;
      } catch {
        // ignore
      }

      return null;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getQuizById:', err?.message || err);
      return null;
    }
  }

  /**
   * Fetch a sanitized quiz for members to take (correct answers & explanations removed).
   */
  static async getPublicQuizById(quizId: string, churchId?: string): Promise<{ quiz: Omit<BibleQuiz, 'questions'>; questions: PublicQuizQuestion[] } | null> {
    try {
      const quiz = await this.getQuizById(quizId, churchId);
      if (!quiz) return null;

      // Sanitize questions so correct answers are not exposed in client memory
      const sanitizedQuestions: PublicQuizQuestion[] = (quiz.questions || []).map(q => ({
        id: q.id,
        order: q.order,
        questionType: q.questionType,
        question: q.question,
        options: q.options || [],
        bibleReference: q.bibleReference || '',
        marks: q.marks || 1,
      }));

      const { questions, ...quizMeta } = quiz;

      return {
        quiz: quizMeta,
        questions: sanitizedQuestions,
      };
    } catch (err: any) {
      console.warn('[QuizService] Notice in getPublicQuizById:', err?.message || err);
      return null;
    }
  }

  /**
   * Get Today's Daily Quiz for a church.
   */
  static async getTodayDailyQuiz(churchId?: string): Promise<BibleQuiz | null> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Re-use resilient getQuizzes with isDaily filter
      const dailyQuizzes = await this.getQuizzes(churchId, {
        isDaily: true,
        status: 'published',
      });

      if (!dailyQuizzes || dailyQuizzes.length === 0) return null;

      // Check if one matches today's date
      const todayQuiz = dailyQuizzes.find(q => q.dailyDate === todayStr);
      if (todayQuiz) return todayQuiz;

      // Fallback: pick the latest published daily quiz
      return dailyQuizzes[0];
    } catch (err: any) {
      console.warn('[QuizService] Notice in getTodayDailyQuiz:', err?.message || err);
      return null;
    }
  }

  /**
   * Save (create or update) a quiz in Firestore.
   */
  static async saveQuiz(quizData: Partial<BibleQuiz>): Promise<string> {
    try {
      const now = firestore.Timestamp.now();
      const targetChurchId = await this.resolveChurchId(quizData.churchId);

      const totalQuestions = quizData.questions?.length || 0;
      const marksPerQ = quizData.marksPerQuestion || 1;
      const totalMarks = (quizData.questions || []).reduce((acc, q) => acc + (q.marks || marksPerQ), 0);

      // Generate question hashes to support duplicate detection
      const enrichedQuestions = (quizData.questions || []).map((q, idx) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${idx}`,
        order: idx + 1,
        marks: q.marks || marksPerQ,
        questionHash: q.questionHash || this.generateQuestionHash(q.question),
      }));

      const quizId = quizData.id || firestore().collection('churches').doc(targetChurchId).collection(this.QUIZZES_COLLECTION).doc().id;

      const payload: BibleQuiz = {
        id: quizId,
        churchId: targetChurchId,
        churchName: quizData.churchName || '',
        title: quizData.title || 'Bible Quiz',
        description: quizData.description || '',
        category: quizData.category || 'General',
        book: quizData.book || '',
        chapterStart: quizData.chapterStart || 0,
        chapterEnd: quizData.chapterEnd || 0,
        topic: quizData.topic || '',
        difficulty: quizData.difficulty || 'medium',
        language: quizData.language || 'en',
        bibleVersion: quizData.bibleVersion || 'NIV',
        isDailyQuiz: quizData.isDailyQuiz || false,
        dailyDate: quizData.dailyDate || (quizData.isDailyQuiz ? new Date().toISOString().split('T')[0] : ''),
        timeLimitMinutes: quizData.timeLimitMinutes || 0,
        passPercentage: quizData.passPercentage || 70,
        allowMultipleAttempts: quizData.allowMultipleAttempts ?? true,
        maxAttempts: quizData.maxAttempts || 1,
        status: quizData.status || 'draft',
        totalQuestions,
        totalMarks,
        marksPerQuestion: marksPerQ,
        quizImageUrl: quizData.quizImageUrl || '',
        questions: enrichedQuestions,
        createdBy: quizData.createdBy || 'Admin',
        createdAt: quizData.createdAt || now,
        updatedAt: now,
      };

      // 1. Save to church-scoped subcollection (primary)
      if (targetChurchId && targetChurchId !== 'global') {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .set(payload, { merge: true });
      } else {
        await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .set(payload, { merge: true });
      }

      // 2. Also try writing to root collection as safeguard
      firestore()
        .collection(this.QUIZZES_COLLECTION)
        .doc(quizId)
        .set(payload, { merge: true })
        .catch(() => {});

      return quizId;
    } catch (err: any) {
      console.error('[QuizService] Error saving quiz:', err);
      throw err;
    }
  }

  /**
   * Delete a quiz by ID.
   */
  static async deleteQuiz(quizId: string, churchId?: string): Promise<boolean> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);

      if (targetChurchId && targetChurchId !== 'global') {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .delete()
          .catch(() => {});
      }

      await firestore()
        .collection('churches')
        .doc('global')
        .collection(this.QUIZZES_COLLECTION)
        .doc(quizId)
        .delete()
        .catch(() => {});

      firestore()
        .collection(this.QUIZZES_COLLECTION)
        .doc(quizId)
        .delete()
        .catch(() => {});

      return true;
    } catch (err: any) {
      console.error('[QuizService] Error deleting quiz:', err);
      return false;
    }
  }

  /**
   * Securely evaluate and submit a quiz attempt.
   * Compares user submissions against the stored authoritative answers.
   */
  static async submitQuizAttempt(
    quizId: string,
    userId: string,
    memberInfo: {
      name: string;
      phone?: string;
      avatar?: string;
      churchId: string;
    },
    submissions: UserAnswerSubmission[],
    timeTakenSeconds: number
  ): Promise<QuizAttempt> {
    const quiz = await this.getQuizById(quizId, memberInfo.churchId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Check multiple attempt restriction if enabled
    if (!quiz.allowMultipleAttempts) {
      const priorAttempt = await this.getUserQuizAttempt(userId, quizId, memberInfo.churchId);
      if (priorAttempt) {
        throw new Error('Multiple attempts are not allowed for this quiz.');
      }
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const totalMarks = quiz.totalMarks || (quiz.questions.length * quiz.marksPerQuestion);

    const submissionMap = new Map<string, string | string[]>();
    submissions.forEach(s => submissionMap.set(s.questionId, s.selectedAnswer));

    const detailedAnswers: QuizAttemptAnswer[] = quiz.questions.map(q => {
      const selected = submissionMap.get(q.id) ?? '';
      let isCorrect = false;

      if (Array.isArray(q.correctAnswer)) {
        if (Array.isArray(selected)) {
          const sortedCorrect = [...q.correctAnswer].sort().join('|');
          const sortedSelected = [...selected].sort().join('|');
          isCorrect = sortedCorrect === sortedSelected;
        }
      } else {
        isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      }

      const qMarks = q.marks || quiz.marksPerQuestion || 1;
      const marksAwarded = isCorrect ? qMarks : 0;

      if (isCorrect) {
        score += marksAwarded;
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        bibleReference: q.bibleReference || '',
        explanation: q.explanation || '',
        isCorrect,
        marksAwarded,
        possibleMarks: qMarks,
      };
    });

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = percentage >= (quiz.passPercentage || 70);

    const targetChurchId = await this.resolveChurchId(memberInfo.churchId || quiz.churchId);
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const attempt: QuizAttempt = {
      id: attemptId,
      quizId,
      quizTitle: quiz.title,
      churchId: targetChurchId,
      userId,
      memberName: memberInfo.name || 'Member',
      memberPhone: memberInfo.phone || '',
      memberAvatar: memberInfo.avatar || '',
      score,
      totalMarks,
      percentage,
      correctCount,
      wrongCount,
      totalQuestions: quiz.questions.length,
      timeTakenSeconds,
      passed,
      answers: detailedAnswers,
      submittedAt: firestore.Timestamp.now(),
      isDaily: quiz.isDailyQuiz || false,
    };

    // 1. Save under church attempts subcollection
    if (targetChurchId && targetChurchId !== 'global') {
      try {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.ATTEMPTS_COLLECTION)
          .doc(attemptId)
          .set(attempt);
      } catch (err: any) {
        console.warn('[QuizService] Save attempt to church subcollection error:', err?.message || err);
      }
    }

    // 2. Also try global church and root collections
    firestore()
      .collection('churches')
      .doc('global')
      .collection(this.ATTEMPTS_COLLECTION)
      .doc(attemptId)
      .set(attempt)
      .catch(() => {});

    firestore()
      .collection(this.ATTEMPTS_COLLECTION)
      .doc(attemptId)
      .set(attempt)
      .catch(() => {});

    return attempt;
  }

  /**
   * Check if user has already taken a quiz.
   */
  static async getUserQuizAttempt(userId: string, quizId: string, churchId?: string): Promise<QuizAttempt | null> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);

      // Check church collection
      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const snaps = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.ATTEMPTS_COLLECTION)
            .where('userId', '==', userId)
            .where('quizId', '==', quizId)
            .limit(1)
            .get();

          if (!snaps.empty) {
            return { id: snaps.docs[0].id, ...snaps.docs[0].data() } as QuizAttempt;
          }
        } catch {
          // ignore
        }
      }

      // Check root attempts safely
      try {
        const snaps = await firestore()
          .collection(this.ATTEMPTS_COLLECTION)
          .where('userId', '==', userId)
          .where('quizId', '==', quizId)
          .limit(1)
          .get();

        if (!snaps.empty) {
          return { id: snaps.docs[0].id, ...snaps.docs[0].data() } as QuizAttempt;
        }
      } catch {
        // ignore
      }

      return null;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getUserQuizAttempt:', err?.message || err);
      return null;
    }
  }

  /**
   * Fetch all past attempts for a member.
   */
  static async getUserAttempts(userId: string, churchId?: string): Promise<QuizAttempt[]> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const attemptsMap = new Map<string, QuizAttempt>();

      // 1. Church attempts
      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const snaps = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.ATTEMPTS_COLLECTION)
            .where('userId', '==', userId)
            .get();

          snaps.docs.forEach((doc: any) => {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } catch {
          // ignore
        }
      }

      // 2. Global attempts
      try {
        const globalSnaps = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.ATTEMPTS_COLLECTION)
          .where('userId', '==', userId)
          .get();

        globalSnaps.docs.forEach((doc: any) => {
          if (!attemptsMap.has(doc.id)) {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch {
        // ignore
      }

      // 3. Root attempts (safe fallback)
      try {
        const rootSnaps = await firestore()
          .collection(this.ATTEMPTS_COLLECTION)
          .where('userId', '==', userId)
          .get();

        rootSnaps.docs.forEach((doc: any) => {
          if (!attemptsMap.has(doc.id)) {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch {
        // ignore
      }

      const list = Array.from(attemptsMap.values());

      list.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
        return timeB - timeA;
      });

      return list;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getUserAttempts:', err?.message || err);
      return [];
    }
  }

  /**
   * Fetch all attempts for a given quiz (for Admin analytics).
   */
  static async getQuizAttempts(quizId: string, churchId?: string): Promise<QuizAttempt[]> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const attemptsMap = new Map<string, QuizAttempt>();

      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const snaps = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.ATTEMPTS_COLLECTION)
            .where('quizId', '==', quizId)
            .get();

          snaps.docs.forEach((doc: any) => {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } catch {
          // ignore
        }
      }

      // Fallback check global/root
      try {
        const globalSnaps = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.ATTEMPTS_COLLECTION)
          .where('quizId', '==', quizId)
          .get();

        globalSnaps.docs.forEach((doc: any) => {
          if (!attemptsMap.has(doc.id)) {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch {
        // ignore
      }

      try {
        const rootSnaps = await firestore()
          .collection(this.ATTEMPTS_COLLECTION)
          .where('quizId', '==', quizId)
          .get();

        rootSnaps.docs.forEach((doc: any) => {
          if (!attemptsMap.has(doc.id)) {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch {
        // ignore
      }

      const list = Array.from(attemptsMap.values());

      list.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
        return timeB - timeA;
      });

      return list;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getQuizAttempts:', err?.message || err);
      return [];
    }
  }

  /**
   * Generate comprehensive analytics report for a quiz.
   */
  static async getQuizAnalyticsReport(quizId: string, churchId?: string): Promise<QuizAnalyticsReport | null> {
    try {
      const [quiz, attempts] = await Promise.all([
        this.getQuizById(quizId, churchId),
        this.getQuizAttempts(quizId, churchId),
      ]);

      if (!quiz) return null;

      const totalAttempts = attempts.length;
      const uniqueParticipants = new Set(attempts.map(a => a.userId)).size;

      if (totalAttempts === 0) {
        return {
          quizId,
          totalAttempts: 0,
          totalParticipants: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRatePercentage: 0,
          questionStats: (quiz.questions || []).map(q => ({
            questionId: q.id,
            question: q.question,
            bibleReference: q.bibleReference || '',
            correctCount: 0,
            wrongCount: 0,
            accuracyPercent: 0,
          })),
          recentAttempts: [],
        };
      }

      const scores = attempts.map(a => a.percentage);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts);
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const passedCount = attempts.filter(a => a.passed).length;
      const passRatePercentage = Math.round((passedCount / totalAttempts) * 100);

      // Question-wise statistics
      const qStatsMap = new Map<string, { correct: number; wrong: number; wrongAnswers: Map<string, number> }>();
      (quiz.questions || []).forEach(q => {
        qStatsMap.set(q.id, { correct: 0, wrong: 0, wrongAnswers: new Map() });
      });

      attempts.forEach(att => {
        (att.answers || []).forEach(ans => {
          const stat = qStatsMap.get(ans.questionId);
          if (stat) {
            if (ans.isCorrect) {
              stat.correct++;
            } else {
              stat.wrong++;
              const selectedStr = Array.isArray(ans.selectedAnswer) ? ans.selectedAnswer.join(', ') : String(ans.selectedAnswer);
              if (selectedStr) {
                stat.wrongAnswers.set(selectedStr, (stat.wrongAnswers.get(selectedStr) || 0) + 1);
              }
            }
          }
        });
      });

      const questionStats = (quiz.questions || []).map(q => {
        const stat = qStatsMap.get(q.id) || { correct: 0, wrong: 0, wrongAnswers: new Map() };
        const totalAnswers = stat.correct + stat.wrong;
        const accuracyPercent = totalAnswers > 0 ? Math.round((stat.correct / totalAnswers) * 100) : 0;

        let mostCommonWrong = '';
        let highestFreq = 0;
        stat.wrongAnswers.forEach((count, ans) => {
          if (count > highestFreq) {
            highestFreq = count;
            mostCommonWrong = ans;
          }
        });

        return {
          questionId: q.id,
          question: q.question,
          bibleReference: q.bibleReference || '',
          correctCount: stat.correct,
          wrongCount: stat.wrong,
          accuracyPercent,
          mostCommonWrongAnswer: mostCommonWrong || undefined,
        };
      });

      return {
        quizId,
        totalAttempts,
        totalParticipants: uniqueParticipants,
        averageScore: avgScore,
        highestScore,
        lowestScore,
        passRatePercentage,
        questionStats,
        recentAttempts: attempts.slice(0, 50),
      };
    } catch (err: any) {
      console.warn('[QuizService] Notice in getQuizAnalyticsReport:', err?.message || err);
      return null;
    }
  }

  /**
   * Get Leaderboard for a quiz or for the entire church.
   */
  static async getLeaderboard(churchId?: string, quizId?: string): Promise<QuizAttempt[]> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const attemptsMap = new Map<string, QuizAttempt>();

      if (targetChurchId && targetChurchId !== 'global') {
        try {
          let q: any = firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.ATTEMPTS_COLLECTION);

          if (quizId) {
            q = q.where('quizId', '==', quizId);
          }

          const snaps = await q.limit(100).get();
          snaps.docs.forEach((doc: any) => {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } catch {
          // ignore
        }
      }

      // Also global attempts
      try {
        let gq: any = firestore()
          .collection('churches')
          .doc('global')
          .collection(this.ATTEMPTS_COLLECTION);

        if (quizId) {
          gq = gq.where('quizId', '==', quizId);
        }

        const globalSnaps = await gq.limit(100).get();
        globalSnaps.docs.forEach((doc: any) => {
          if (!attemptsMap.has(doc.id)) {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch {
        // ignore
      }

      const attempts = Array.from(attemptsMap.values());
      if (attempts.length === 0) return [];

      // Keep only best score per user
      const bestAttemptsMap = new Map<string, QuizAttempt>();
      attempts.forEach(a => {
        const existing = bestAttemptsMap.get(a.userId);
        if (!existing || a.percentage > existing.percentage || (a.percentage === existing.percentage && a.timeTakenSeconds < existing.timeTakenSeconds)) {
          bestAttemptsMap.set(a.userId, a);
        }
      });

      const sorted = Array.from(bestAttemptsMap.values());
      sorted.sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return a.timeTakenSeconds - b.timeTakenSeconds;
      });

      return sorted.slice(0, 20);
    } catch (err: any) {
      console.warn('[QuizService] Notice in getLeaderboard:', err?.message || err);
      return [];
    }
  }

  /**
   * Normalize question text and compute a simple hash for duplicate checking.
   */
  static generateQuestionHash(text: string): string {
    if (!text) return '';
    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if a question already exists in previous quizzes for deduplication.
   */
  static async isDuplicateQuestion(questionText: string, currentQuizId?: string): Promise<boolean> {
    try {
      const targetHash = this.generateQuestionHash(questionText);
      const normalizedTarget = questionText.toLowerCase().replace(/[^a-z0-9]/g, '');

      const quizzes = await this.getQuizzes();
      if (!quizzes || quizzes.length === 0) return false;

      for (const quiz of quizzes.slice(0, 20)) {
        if (currentQuizId && quiz.id === currentQuizId) continue;
        const questions: QuizQuestion[] = quiz.questions || [];

        for (const q of questions) {
          if (q.questionHash && q.questionHash === targetHash) return true;
          const normQ = (q.question || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normQ === normalizedTarget) return true;
        }
      }

      return false;
    } catch (err) {
      console.warn('[QuizService] Duplicate check skipped on error:', err);
      return false;
    }
  }
}
