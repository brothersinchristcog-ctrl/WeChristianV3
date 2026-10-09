import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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
import { QuizAIService, QuizTranslationResult } from './QuizAIService';

export class QuizService {
  private static QUIZZES_COLLECTION = 'bibleQuizzes';
  private static ATTEMPTS_COLLECTION = 'quizAttempts';
  private static quizzesCache: Map<string, { data: BibleQuiz[]; timestamp: number }> = new Map();
  private static baseQuizzesCache: Map<string, { data: BibleQuiz[]; timestamp: number }> = new Map();
  private static localizedQuizCache: Map<string, BibleQuiz> = new Map();
  private static attemptsCache: Map<string, { data: Record<string, QuizAttempt>; timestamp: number }> = new Map();
  private static singleQuizCache: Map<string, BibleQuiz> = new Map();
  private static broadcastToQuizMap: Map<string, string> = new Map();

  /**
   * Clear in-memory caches when new quizzes are added or attempts are made.
   */
  static clearCache(): void {
    this.quizzesCache.clear();
    this.baseQuizzesCache.clear();
    this.localizedQuizCache.clear();
    this.attemptsCache.clear();
    this.singleQuizCache.clear();
    this.broadcastToQuizMap.clear();
  }

  /**
   * Helper: Get active church ID from parameter or AsyncStorage.
   */
  private static async resolveChurchId(churchId?: string): Promise<string> {
    if (churchId && churchId !== 'global') return churchId;
    try {
      const cached = await AsyncStorage.getItem('@cached_church_id');
      if (cached && cached !== 'global') return cached;
      const active = await AsyncStorage.getItem('@active_church_id');
      if (active && active !== 'global') return active;
      const church = await AsyncStorage.getItem('church_id');
      if (church && church !== 'global') return church;
    } catch {
      // Ignore AsyncStorage error
    }
    return churchId || 'global';
  }

  /**
   * Fetch quizzes for a church (includes church-specific and global quizzes).
   * High performance: reads from in-memory cache if available and avoids fetching hundreds of unreleased future daily quizzes.
   */
  static async getQuizzes(
    churchId?: string,
    options?: {
      status?: QuizStatus;
      category?: string;
      isDaily?: boolean;
      isAdmin?: boolean;
      scope?: 'church' | 'wechristian' | 'all';
      forceRefresh?: boolean;
      targetLanguage?: string;
    }
  ): Promise<BibleQuiz[]> {
    const baseCacheKey = `${churchId || 'global'}_${JSON.stringify({
      status: options?.status,
      category: options?.category,
      isDaily: options?.isDaily,
      isAdmin: options?.isAdmin,
      scope: options?.scope,
    })}`;

    if (!options?.forceRefresh) {
      const cachedBase = this.baseQuizzesCache.get(baseCacheKey);
      if (cachedBase && Date.now() - cachedBase.timestamp < 60000) {
        return this.applyLocalizationToList(cachedBase.data, options?.targetLanguage);
      }
    }

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

      // 2. Fetch from global church subcollection (only for members, never for church admin dashboard)
      if (!options?.isAdmin || targetChurchId === 'global') {
        try {
          if (!options?.isAdmin) {
            // OPTIMIZATION: For regular church members, do NOT download 700+ future scheduled daily quizzes!
            // Only fetch released daily quizzes (up to today, limit 60) and non-daily global quizzes
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            try {
              const dailySnaps = await firestore()
                .collection('churches')
                .doc('global')
                .collection(this.QUIZZES_COLLECTION)
                .where('dailyDate', '<=', todayStr)
                .limit(60)
                .get();

              dailySnaps.docs.forEach((doc: any) => {
                if (!docsMap.has(doc.id)) {
                  docsMap.set(doc.id, { id: doc.id, ...doc.data() });
                }
              });
            } catch {
              // where filter fallback
            }

            try {
              const generalSnaps = await firestore()
                .collection('churches')
                .doc('global')
                .collection(this.QUIZZES_COLLECTION)
                .where('isDailyQuiz', '==', false)
                .limit(50)
                .get();

              generalSnaps.docs.forEach((doc: any) => {
                if (!docsMap.has(doc.id)) {
                  docsMap.set(doc.id, { id: doc.id, ...doc.data() });
                }
              });
            } catch {
              // where filter fallback
            }

            // If targeted queries yielded no docs, fallback safely with limit 60
            if (docsMap.size === 0) {
              const globalSnaps = await firestore()
                .collection('churches')
                .doc('global')
                .collection(this.QUIZZES_COLLECTION)
                .limit(60)
                .get();

              globalSnaps.docs.forEach((doc: any) => {
                if (!docsMap.has(doc.id)) {
                  docsMap.set(doc.id, { id: doc.id, ...doc.data() });
                }
              });
            }
          }
        } catch (e: any) {
          // Suppress if not found
        }
      }

      // 3. Fallback: ONLY try top-level collection for non-admin if docsMap is STILL empty
      if (!options?.isAdmin && docsMap.size === 0) {
        try {
          const rootSnaps = await firestore()
            .collection(this.QUIZZES_COLLECTION)
            .limit(50)
            .get();

          rootSnaps.docs.forEach((doc: any) => {
            if (!docsMap.has(doc.id)) {
              docsMap.set(doc.id, { id: doc.id, ...doc.data() });
            }
          });
        } catch (e: any) {
          // Silently catch permission-denied or missing collection at root
        }
      }

      let list = Array.from(docsMap.values());

      // Filter by church: include church-specific AND global quizzes
      if (targetChurchId && targetChurchId !== 'global') {
        list = list.filter(q => q.churchId === targetChurchId || q.churchId === 'global' || !q.churchId);
      }

      // Filter by Scope: 'church' (Church Admin only) vs 'wechristian' (Platform Super Admin only)
      if (options?.scope === 'church') {
        list = list.filter(q => targetChurchId && q.churchId === targetChurchId && q.churchId !== 'global');
      } else if (options?.scope === 'wechristian') {
        list = list.filter(q => q.churchId === 'global' || !q.churchId);
      }

      // Filter by status (members only see 'published' or active 'scheduled', admins can see all)
      if (options?.status) {
        list = list.filter(q => q.status === options.status);
      } else if (!options?.isAdmin) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        list = list.filter(q => {
          // If it's a platform daily quiz, enforce release date and 5:00 AM release
          if (q.isDailyQuiz) {
            const schedDate = q.dailyDate || q.scheduledDate;
            if (!schedDate) return false;
            if (schedDate < todayStr) return true; // Past days are available
            if (schedDate === todayStr) {
              const schedTime = q.scheduledTime || '05:00';
              return currentTimeStr >= schedTime;
            }
            return false; // Future daily quizzes remain hidden
          }
          // For Church Quizzes: Members receive all published AND scheduled quizzes
          if (q.status === 'published' || q.status === 'scheduled') return true;
          return false;
        });
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

      this.baseQuizzesCache.set(baseCacheKey, { data: list, timestamp: Date.now() });
      return this.applyLocalizationToList(list, options?.targetLanguage);
    } catch (err: any) {
      console.warn('[QuizService] Handled getQuizzes failure:', err?.message || err);
      return [];
    }
  }

  /**
   * Helper: Synchronously localizes quiz titles and descriptions in memory (0ms latency).
   */
  private static applyLocalizationToList(list: BibleQuiz[], targetLanguage?: string): BibleQuiz[] {
    if (!targetLanguage || targetLanguage === 'en') return list;
    try {
      const { getLocalizedDailyQuizTitle, getLocalizedDailyQuizDescription } = require('../constants/DailyQuizTranslations');
      return list.map(q => {
        let title = q.title;
        let description = q.description;
        if (q.isDailyQuiz && q.dailyDate) {
          title = getLocalizedDailyQuizTitle(q.dailyDate, targetLanguage as any) || title;
          description = getLocalizedDailyQuizDescription(q.dailyDate, targetLanguage as any) || description;
        } else if (q.translations?.[targetLanguage]?.title) {
          title = q.translations[targetLanguage].title;
          description = q.translations[targetLanguage].description || description;
        }
        if (title !== q.title || description !== q.description) {
          return { ...q, title, description };
        }
        return q;
      });
    } catch {
      return list;
    }
  }

  /**
   * Fetch a single quiz by ID (full details with answers for Admin / Scoring).
   * Fully resilient: supports resolving broadcast message IDs, in-memory caches,
   * collectionGroup searches, and recent church quizzes to guarantee zero "Quiz Unavailable" errors.
   */
  static async getQuizById(quizId: string, churchId?: string, targetLanguage?: string): Promise<BibleQuiz | null> {
    try {
      if (!quizId) return null;

      // 0a. Check broadcast/notification ID mapping
      let effectiveQuizId = quizId;
      if (this.broadcastToQuizMap.has(quizId)) {
        effectiveQuizId = this.broadcastToQuizMap.get(quizId) || quizId;
      }

      // 0b. Check singleQuizCache
      if (this.singleQuizCache.has(effectiveQuizId)) {
        const cached = this.singleQuizCache.get(effectiveQuizId)!;
        if (targetLanguage && targetLanguage !== 'en') {
          return await this.localizeQuiz(cached, targetLanguage);
        }
        return cached;
      }
      if (this.singleQuizCache.has(quizId)) {
        const cached = this.singleQuizCache.get(quizId)!;
        if (targetLanguage && targetLanguage !== 'en') {
          return await this.localizeQuiz(cached, targetLanguage);
        }
        return cached;
      }

      // 0c. Check in-memory baseQuizzesCache & quizzesCache
      for (const entry of this.baseQuizzesCache.values()) {
        const found = entry.data.find(q => q.id === effectiveQuizId || q.id === quizId);
        if (found) {
          if (targetLanguage && targetLanguage !== 'en') {
            return await this.localizeQuiz(found, targetLanguage);
          }
          return found;
        }
      }
      for (const entry of this.quizzesCache.values()) {
        const found = entry.data.find(q => q.id === effectiveQuizId || q.id === quizId);
        if (found) {
          if (targetLanguage && targetLanguage !== 'en') {
            return await this.localizeQuiz(found, targetLanguage);
          }
          return found;
        }
      }

      let foundQuiz: BibleQuiz | null = null;

      // Collect all candidate church IDs to check
      const candidateChurchIds: string[] = [];
      if (churchId && churchId !== 'global') {
        candidateChurchIds.push(churchId);
      }
      try {
        const cached = await AsyncStorage.getItem('@cached_church_id');
        if (cached && cached !== 'global' && !candidateChurchIds.includes(cached)) {
          candidateChurchIds.push(cached);
        }
        const active = await AsyncStorage.getItem('@active_church_id');
        if (active && active !== 'global' && !candidateChurchIds.includes(active)) {
          candidateChurchIds.push(active);
        }
        const storedChurch = await AsyncStorage.getItem('church_id');
        if (storedChurch && storedChurch !== 'global' && !candidateChurchIds.includes(storedChurch)) {
          candidateChurchIds.push(storedChurch);
        }
      } catch {
        // ignore storage read errors
      }

      // 1. Check each candidate church subcollection
      for (const cId of candidateChurchIds) {
        try {
          const doc = await firestore()
            .collection('churches')
            .doc(cId)
            .collection(this.QUIZZES_COLLECTION)
            .doc(effectiveQuizId)
            .get();
          const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
          if (exists) {
            foundQuiz = { id: doc.id, churchId: cId, ...doc.data() } as BibleQuiz;
            break;
          }
        } catch {
          // ignore error for this candidate
        }
      }

      // 2. Check global church subcollection
      if (!foundQuiz) {
        try {
          const doc = await firestore()
            .collection('churches')
            .doc('global')
            .collection(this.QUIZZES_COLLECTION)
            .doc(effectiveQuizId)
            .get();
          const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
          if (exists) {
            foundQuiz = { id: doc.id, churchId: 'global', ...doc.data() } as BibleQuiz;
          }
        } catch {
          // ignore
        }
      }

      // 3. Fallback: If effectiveQuizId is a broadcast doc ID, check broadcasts collection across churches
      if (!foundQuiz) {
        for (const cId of [...candidateChurchIds, 'global']) {
          try {
            const bDoc = await firestore()
              .collection('churches')
              .doc(cId)
              .collection('broadcasts')
              .doc(effectiveQuizId)
              .get();
            const exists = typeof (bDoc as any).exists === 'function' ? (bDoc as any).exists() : Boolean((bDoc as any).exists);
            if (exists) {
              const bData: any = bDoc.data();
              const resolvedQuizId = bData?.quizId || bData?.relatedId || (bData?.type === 'quiz' ? bData?.id : null);
              if (resolvedQuizId && resolvedQuizId !== effectiveQuizId) {
                this.broadcastToQuizMap.set(effectiveQuizId, resolvedQuizId);
                const resolved = await this.getQuizById(resolvedQuizId, cId, targetLanguage);
                if (resolved) {
                  return resolved;
                }
              }
            }
          } catch {}
        }
      }

      // 4. Fallback: Check notifications collection across churches
      if (!foundQuiz) {
        for (const cId of [...candidateChurchIds, 'global']) {
          try {
            const nDoc = await firestore()
              .collection('churches')
              .doc(cId)
              .collection('notifications')
              .doc(effectiveQuizId)
              .get();
            const exists = typeof (nDoc as any).exists === 'function' ? (nDoc as any).exists() : Boolean((nDoc as any).exists);
            if (exists) {
              const nData: any = nDoc.data();
              const resolvedQuizId = nData?.quizId || nData?.relatedId;
              if (resolvedQuizId && resolvedQuizId !== effectiveQuizId) {
                this.broadcastToQuizMap.set(effectiveQuizId, resolvedQuizId);
                const resolved = await this.getQuizById(resolvedQuizId, cId, targetLanguage);
                if (resolved) {
                  return resolved;
                }
              }
            }
          } catch {}
        }
      }

      // 5. Fallback search across churches list if churchId was unspecified or mismatched
      if (!foundQuiz) {
        try {
          const churchesSnap = await firestore().collection('churches').limit(25).get();
          for (const churchDoc of churchesSnap.docs) {
            if (candidateChurchIds.includes(churchDoc.id) || churchDoc.id === 'global') continue;
            try {
              const doc = await firestore()
                .collection('churches')
                .doc(churchDoc.id)
                .collection(this.QUIZZES_COLLECTION)
                .doc(effectiveQuizId)
                .get();
              const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
              if (exists) {
                foundQuiz = { id: doc.id, churchId: churchDoc.id, ...doc.data() } as BibleQuiz;
                break;
              }
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }

      // 6. Fallback to top-level collection (safeguard)
      if (!foundQuiz) {
        try {
          const doc = await firestore().collection(this.QUIZZES_COLLECTION).doc(effectiveQuizId).get();
          const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
          if (exists) foundQuiz = { id: doc.id, ...doc.data() } as BibleQuiz;
        } catch {
          // ignore
        }
      }

      // 7. Deterministic fallback for Daily Bible Quiz IDs (guarantees instant load on notification tap)
      if (!foundQuiz && (effectiveQuizId.startsWith('daily_quiz_') || effectiveQuizId.startsWith('daily_'))) {
        try {
          const { DailyBibleQuizBank } = require('./DailyBibleQuizBank');
          const dateStr = effectiveQuizId.replace('daily_quiz_', '').replace('daily_', '');
          foundQuiz = DailyBibleQuizBank.createDailyQuizEntity(dateStr, churchId || 'global');
        } catch {
          // ignore
        }
      }

      // 8. Emergency fallback: If still not found, check the most recent quiz created in the candidate church (e.g. created in the last 15 minutes)
      if (!foundQuiz) {
        for (const cId of candidateChurchIds) {
          try {
            const recentSnap = await firestore()
              .collection('churches')
              .doc(cId)
              .collection(this.QUIZZES_COLLECTION)
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();
            if (!recentSnap.empty) {
              const latestDoc = recentSnap.docs[0];
              const lData = latestDoc.data();
              const createdMs = lData.createdAt?.toMillis ? lData.createdAt.toMillis() : new Date(lData.createdAt || 0).getTime();
              // If created in the last 15 minutes, this is almost certainly the quiz just created
              if (Date.now() - createdMs < 15 * 60 * 1000) {
                foundQuiz = { id: latestDoc.id, churchId: cId, ...lData } as BibleQuiz;
                break;
              }
            }
          } catch {}
        }
      }

      if (!foundQuiz) return null;

      // Cache the found quiz for future instant reads
      this.singleQuizCache.set(foundQuiz.id, foundQuiz);
      if (effectiveQuizId !== foundQuiz.id) {
        this.singleQuizCache.set(effectiveQuizId, foundQuiz);
      }

      // Apply on-the-fly and cached localization if member requested non-English language
      if (targetLanguage && targetLanguage !== 'en') {
        return await this.localizeQuiz(foundQuiz, targetLanguage);
      }

      return foundQuiz;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getQuizById:', err?.message || err);
      return null;
    }
  }

  /**
   * Fetch a sanitized quiz for members to take (correct answers & explanations removed).
   * Localizes content into target language (e.g. for uploaded documents in Member View).
   */
  static async getPublicQuizById(
    quizId: string,
    churchId?: string,
    targetLanguage?: string
  ): Promise<{ quiz: Omit<BibleQuiz, 'questions'>; questions: PublicQuizQuestion[] } | null> {
    try {
      const quiz = await this.getQuizById(quizId, churchId, targetLanguage);
      if (!quiz) return null;

      // Sanitize questions so correct answers are not exposed in client memory
      const sanitizedQuestions: PublicQuizQuestion[] = (quiz.questions || []).map(q => ({
        id: q.id,
        order: q.order,
        questionType: q.questionType,
        question: q.question,
        questionTelugu: q.questionTelugu,
        options: q.options || [],
        optionsTelugu: q.optionsTelugu,
        bibleReference: q.bibleReference || '',
        marks: q.marks || 1,
        translations: q.translations,
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
   * Localize quiz metadata and questions into target language (e.g. te, ta, hi, kn, ml, mr).
   * Prioritizes Firestore document translations, then local AsyncStorage cache, then high-speed AI translation.
   */
  static async localizeQuiz(quiz: BibleQuiz, targetLanguage: string): Promise<BibleQuiz> {
    if (!targetLanguage || targetLanguage === 'en' || !quiz) {
      return quiz;
    }

    if (quiz.language === targetLanguage && !quiz.sourceFile) {
      return quiz;
    }

    const memKey = `${quiz.id}_${targetLanguage}`;
    if (this.localizedQuizCache.has(memKey)) {
      return this.localizedQuizCache.get(memKey)!;
    }

    // FAST-PATH: Platform Daily Bible Quizzes are translated synchronously (0ms, zero network latency)
    if (quiz.isDailyQuiz || quiz.id?.startsWith('daily_quiz_') || quiz.id?.startsWith('daily_')) {
      try {
        const {
          getLocalizedDailyQuestion,
          getLocalizedDailyQuizTitle,
          getLocalizedDailyQuizDescription,
        } = require('../constants/DailyQuizTranslations');
        const localizedTitle = quiz.dailyDate
          ? getLocalizedDailyQuizTitle(quiz.dailyDate, targetLanguage as any)
          : (quiz.translations?.[targetLanguage]?.title || quiz.title);
        const localizedDescription = quiz.dailyDate
          ? getLocalizedDailyQuizDescription(quiz.dailyDate, targetLanguage as any)
          : (quiz.translations?.[targetLanguage]?.description || quiz.description);
        const localizedQuestions = (quiz.questions || []).map((q: any) => {
          const locQ = getLocalizedDailyQuestion(q, targetLanguage as any);
          return {
            ...q,
            question: locQ.question,
            options: locQ.options,
            explanation: locQ.explanation || q.explanation,
            bibleReference: locQ.bibleReference || q.bibleReference,
            correctAnswer: locQ.correctAnswer || q.correctAnswer,
          };
        });

        const localizedResult: BibleQuiz = {
          ...quiz,
          title: localizedTitle,
          description: localizedDescription,
          questions: localizedQuestions,
        };
        this.localizedQuizCache.set(memKey, localizedResult);
        return localizedResult;
      } catch (e) {
        console.warn('[QuizService] Notice in daily quiz translation:', e);
      }
    }

    // 1. Check if Firestore already has translations for targetLanguage
    const hasDocTitle = Boolean(quiz.translations?.[targetLanguage]?.title);
    const hasQuestionTranslations = (quiz.questions || []).length > 0 && (quiz.questions || []).every(
      q => Boolean(q.translations?.[targetLanguage]?.question) || (targetLanguage === 'te' && Boolean(q.questionTelugu))
    );

    if (hasDocTitle || hasQuestionTranslations) {
      const translatedData: QuizTranslationResult = {
        title: quiz.translations?.[targetLanguage]?.title || quiz.title,
        description: quiz.translations?.[targetLanguage]?.description || quiz.description,
        questions: (quiz.questions || []).map(q => {
          const tq = q.translations?.[targetLanguage];
          if (tq) {
            return {
              id: q.id,
              question: tq.question || q.question,
              options: tq.options || q.options,
              correctAnswer: tq.correctAnswer || q.correctAnswer,
              explanation: tq.explanation || q.explanation,
            };
          }
          if (targetLanguage === 'te' && q.questionTelugu) {
            return {
              id: q.id,
              question: q.questionTelugu,
              options: q.optionsTelugu || q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanationTelugu || q.explanation,
            };
          }
          return {
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          };
        }),
      };
      return this.applyTranslationsToQuiz(quiz, targetLanguage, translatedData);
    }

    // 2. Check local persistent AsyncStorage cache
    const cacheKey = `@quiz_trans_${quiz.id}_${targetLanguage}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed: QuizTranslationResult = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          console.log(`[QuizService] Loaded cached translation for quiz "${quiz.id}" in ${targetLanguage}`);
          return this.applyTranslationsToQuiz(quiz, targetLanguage, parsed);
        }
      }
    } catch {}

    // 3. Perform AI Translation via QuizAIService
    try {
      console.log(`[QuizService] Translating uploaded document quiz "${quiz.id}" into ${targetLanguage}...`);
      const translated = await QuizAIService.translateQuiz(
        {
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions || [],
        },
        targetLanguage
      );

      if (translated && Array.isArray(translated.questions) && translated.questions.length > 0) {
        // Cache persistently in AsyncStorage for instantaneous offline reuse
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(translated));
        } catch {}

        // Asynchronously persist to Firestore (fire-and-forget)
        this.saveQuizTranslations(quiz.id, quiz.churchId, targetLanguage, translated).catch(() => {});

        return this.applyTranslationsToQuiz(quiz, targetLanguage, translated);
      }
    } catch (err: any) {
      console.warn(`[QuizService] Translation of quiz ${quiz.id} into ${targetLanguage} failed:`, err?.message || err);
    }

    return quiz;
  }

  /**
   * Standardize and merge translations into the BibleQuiz object.
   */
  static applyTranslationsToQuiz(
    quiz: BibleQuiz,
    targetLanguage: string,
    translatedData: QuizTranslationResult
  ): BibleQuiz {
    const qMap = new Map<string, any>();
    (translatedData.questions || []).forEach((tq, idx) => {
      if (tq.id) qMap.set(tq.id, tq);
      qMap.set(String(idx), tq);
    });

    const updatedQuestions: QuizQuestion[] = (quiz.questions || []).map((q, idx) => {
      const tq = qMap.get(q.id) || qMap.get(String(idx));
      if (!tq) return q;

      const newTranslations = {
        ...(q.translations || {}),
        [targetLanguage]: {
          question: tq.question || q.question,
          options: Array.isArray(tq.options) && tq.options.length > 0 ? tq.options : q.options,
          explanation: tq.explanation || q.explanation,
          correctAnswer: tq.correctAnswer || q.correctAnswer,
        },
      };

      const isTe = targetLanguage === 'te';

      return {
        ...q,
        question: tq.question || q.question,
        options: Array.isArray(tq.options) && tq.options.length > 0 ? tq.options : q.options,
        explanation: tq.explanation || q.explanation,
        questionTelugu: isTe ? (tq.question || q.questionTelugu || q.question) : q.questionTelugu,
        optionsTelugu: isTe ? (Array.isArray(tq.options) && tq.options.length > 0 ? tq.options : (q.optionsTelugu || q.options)) : q.optionsTelugu,
        explanationTelugu: isTe ? (tq.explanation || q.explanationTelugu || q.explanation) : q.explanationTelugu,
        translations: newTranslations,
      };
    });

    const newDocTranslations = {
      ...(quiz.translations || {}),
      [targetLanguage]: {
        title: translatedData.title || quiz.title,
        description: translatedData.description || quiz.description,
      },
    };

    const result: BibleQuiz = {
      ...quiz,
      title: translatedData.title || quiz.title,
      description: translatedData.description || quiz.description,
      translations: newDocTranslations,
      questions: updatedQuestions,
    };
    this.localizedQuizCache.set(`${quiz.id}_${targetLanguage}`, result);
    return result;
  }

  /**
   * Persist translated title and description to Firestore for future member visits.
   */
  static async saveQuizTranslations(
    quizId: string,
    churchId: string | undefined,
    targetLanguage: string,
    translatedData: QuizTranslationResult
  ): Promise<void> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const updateData: any = {
        [`translations.${targetLanguage}.title`]: translatedData.title,
        [`translations.${targetLanguage}.description`]: translatedData.description,
      };

      if (targetChurchId && targetChurchId !== 'global') {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .update(updateData);
      } else {
        await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .update(updateData);
      }
    } catch {
      // Non-critical background save
    }
  }

  /**
   * Get Today's Daily Quiz for a church.
   */
  static async getTodayDailyQuiz(churchId?: string): Promise<BibleQuiz | null> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Re-use resilient getQuizzes with isDaily filter (members see published or active scheduled)
      const dailyQuizzes = await this.getQuizzes(churchId, {
        isDaily: true,
        isAdmin: false,
      });

      if (!dailyQuizzes || dailyQuizzes.length === 0) return null;

      // Check if one matches today's date
      const todayQuiz = dailyQuizzes.find(q => q.dailyDate === todayStr || q.scheduledDate === todayStr);
      if (todayQuiz) return todayQuiz;

      // Fallback: pick the latest published daily quiz
      return dailyQuizzes[0];
    } catch (err: any) {
      console.warn('[QuizService] Notice in getTodayDailyQuiz:', err?.message || err);
      return null;
    }
  }

  /**
   * Deep sanitizer: removes all undefined values and ensures timestamps/dates
   * are valid Firestore Timestamps so Firestore.set() never throws errors.
   */
  static sanitizeForFirestore<T = any>(data: T): T {
    if (data === undefined) return null as any;
    if (data === null) return null as any;
    if (typeof data !== 'object') return data;

    // Convert Date to Firestore Timestamp
    if (data instanceof Date) {
      return firestore.Timestamp.fromDate(data) as any;
    }

    // Convert serialized Timestamp or objects with toMillis / toDate
    if (typeof (data as any).toMillis === 'function') {
      try {
        return firestore.Timestamp.fromMillis((data as any).toMillis()) as any;
      } catch {
        return firestore.Timestamp.now() as any;
      }
    }
    if (typeof (data as any).toDate === 'function') {
      try {
        return firestore.Timestamp.fromDate((data as any).toDate()) as any;
      } catch {
        return firestore.Timestamp.now() as any;
      }
    }
    if (typeof (data as any)._seconds === 'number') {
      return new firestore.Timestamp((data as any)._seconds, (data as any)._nanoseconds || 0) as any;
    }
    if (typeof (data as any).seconds === 'number' && typeof (data as any).nanoseconds === 'number') {
      return new firestore.Timestamp((data as any).seconds, (data as any).nanoseconds) as any;
    }

    // Arrays
    if (Array.isArray(data)) {
      return data
        .filter(item => item !== undefined)
        .map(item => this.sanitizeForFirestore(item)) as any;
    }

    // Plain Objects
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = this.sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }

  /**
   * Schedules a local notification on this device for the exact scheduled date and time
   * so the member receives it at the scheduled quiz time (e.g. 2:35 PM), NOT immediately.
   */
  static async scheduleDeviceQuizNotification(quiz: BibleQuiz): Promise<void> {
    try {
      if (!quiz?.scheduledDate) return;
      const [y, m, d] = quiz.scheduledDate.split('-').map(Number);
      if (!y || !m || !d) return;

      const [hStr, mStr] = (quiz.scheduledTime || '06:00').split(':');
      const hour = parseInt(hStr, 10) || 6;
      const minute = parseInt(mStr, 10) || 0;

      const targetDate = new Date(y, m - 1, d, hour, minute, 0, 0);
      if (targetDate.getTime() <= Date.now()) {
        // Scheduled time has already arrived or passed; trigger live notification now
        await this.notifyMembersQuizPublished(quiz);
        return;
      }

      const notifId = `quiz_sched_${quiz.id}`;
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: `📖 Bible Quiz is Now Live: ${quiz.title || 'Scripture Quiz'}`,
          body: `The scheduled quiz is now unlocked and available to play! Tap to test your knowledge.`,
          sound: true,
          data: {
            type: 'quiz',
            screen: 'BibleQuizDetail',
            quizId: quiz.id,
            id: quiz.id,
            churchId: quiz.churchId || 'global',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });
      console.log(`[QuizService] Local quiz notification scheduled for ${targetDate.toISOString()} (ID: ${notifId})`);
    } catch (e: any) {
      console.warn('[QuizService] Failed to schedule device quiz notification:', e?.message || e);
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

      const todayIso = new Date().toISOString().split('T')[0];
      const finalScheduledDate = quizData.scheduledDate || (quizData.status === 'published' ? todayIso : '');

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
        dailyDate: quizData.dailyDate || (quizData.isDailyQuiz ? todayIso : ''),
        scheduledDate: finalScheduledDate,
        scheduledTime: quizData.scheduledTime || '',
        scheduledAt: quizData.scheduledAt || null,
        sourceFile: quizData.sourceFile || '',
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
        createdAt: quizData.createdAt ? this.sanitizeForFirestore(quizData.createdAt) : now,
        updatedAt: now,
      };

      // Sanitize payload recursively to prevent ANY undefined or unsupported values
      const cleanPayload = this.sanitizeForFirestore(payload);

      // 1. Save to church-scoped subcollection (primary)
      if (targetChurchId && targetChurchId !== 'global') {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .set(cleanPayload, { merge: true });
      } else {
        await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .doc(quizId)
          .set(cleanPayload, { merge: true });
      }

      // 2. Also try writing to root collection as safeguard
      firestore()
        .collection(this.QUIZZES_COLLECTION)
        .doc(quizId)
        .set(cleanPayload, { merge: true })
        .catch(() => {});

      // 3. Notification dispatch:
      // - If PUBLISHED (Live now): notify church members immediately
      // - If SCHEDULED: schedule notification for the exact release time (e.g. 2:35 PM), NOT immediately!
      if (payload.status === 'published') {
        this.notifyMembersQuizPublished(payload).catch((e: any) => {
          console.warn('[QuizService] Post-save notification warning:', e);
        });
      } else if (payload.status === 'scheduled') {
        this.scheduleDeviceQuizNotification(payload).catch((e: any) => {
          console.warn('[QuizService] Schedule notification warning:', e);
        });
      }

      // Invalidate memory caches and seed with the freshly saved quiz
      this.clearCache();
      this.singleQuizCache.set(quizId, cleanPayload);
      this.baseQuizzesCache.set(`recent_${quizId}`, { data: [cleanPayload], timestamp: Date.now() });

      return quizId;
    } catch (err: any) {
      console.error('[QuizService] Error saving quiz:', err);
      throw err;
    }
  }

  /**
   * Dispatches push broadcast and in-app notifications when a quiz is published live.
   * Creates a broadcast record in churches/{churchId}/broadcasts (triggers Cloud Functions)
   * and logs in churches/{churchId}/notifications for the member notification center.
   */
  static async notifyMembersQuizPublished(quiz: BibleQuiz): Promise<void> {
    try {
      if (!quiz || !quiz.churchId || quiz.churchId === 'global') return;
      const targetChurchId = quiz.churchId;
      const quizTitle = (quiz.title || 'Bible Quiz').trim();
      const topicInfo = quiz.book
        ? `${quiz.book}${quiz.chapterStart ? ` Ch. ${quiz.chapterStart}${quiz.chapterEnd && quiz.chapterEnd !== quiz.chapterStart ? `-${quiz.chapterEnd}` : ''}` : ''}`
        : (quiz.topic || quiz.category || 'Holy Scripture');

      const pushTitle = `📖 New Bible Quiz: ${quizTitle}`;
      const pushBody = `A new Bible quiz is now live on ${topicInfo}! Tap to test your knowledge and see your score.`;

      // 1. Write to churches/{churchId}/broadcasts to trigger Cloud Function broadcast push
      try {
        const broadcastDocRef = await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('broadcasts')
          .add({
            title: pushTitle,
            content: pushBody,
            type: 'quiz',
            id: quiz.id,
            quizId: quiz.id,
            relatedId: quiz.id,
            screen: 'BibleQuizDetail',
            churchId: targetChurchId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        if (broadcastDocRef?.id) {
          this.broadcastToQuizMap.set(broadcastDocRef.id, quiz.id);
          this.singleQuizCache.set(broadcastDocRef.id, quiz);
        }
      } catch (e: any) {
        console.warn('[QuizService] Broadcast creation warning:', e);
      }

      // 2. Also write in-app notification to churches/{churchId}/notifications
      try {
        const notifDocRef = await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('notifications')
          .add({
            type: 'quiz',
            title: pushTitle,
            body: pushBody,
            id: quiz.id,
            quizId: quiz.id,
            relatedId: quiz.id,
            screen: 'BibleQuizDetail',
            churchId: targetChurchId,
            quizTitle: quizTitle,
            category: quiz.category || '',
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        if (notifDocRef?.id) {
          this.broadcastToQuizMap.set(notifDocRef.id, quiz.id);
          this.singleQuizCache.set(notifDocRef.id, quiz);
        }
      } catch (e: any) {
        console.warn('[QuizService] Notification doc creation warning:', e);
      }
    } catch (err: any) {
      console.warn('[QuizService] Failed to notify members of quiz:', err);
    }
  }

  /**
   * Dispatches push broadcast and in-app notifications when a quiz is scheduled.
   * Notifies church members in advance so they anticipate the scheduled release.
   */
  static async notifyMembersQuizScheduled(quiz: BibleQuiz): Promise<void> {
    try {
      if (!quiz || !quiz.churchId) return;
      const targetChurchId = quiz.churchId;
      const quizTitle = (quiz.title || 'Bible Quiz').trim();
      const schedTimeFormatted = quiz.scheduledTime ? ` at ${quiz.scheduledTime}` : '';
      const schedDateFormatted = quiz.scheduledDate || 'Upcoming';

      const pushTitle = `📖 Quiz Scheduled: ${quizTitle}`;
      const pushBody = `A new Bible quiz "${quizTitle}" has been scheduled for ${schedDateFormatted}${schedTimeFormatted}. Get ready to participate!`;

      // 1. Write to churches/{churchId}/broadcasts to trigger Cloud Function broadcast push
      if (targetChurchId) {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('broadcasts')
          .add({
            title: pushTitle,
            content: pushBody,
            type: 'quiz_scheduled',
            id: quiz.id,
            quizId: quiz.id,
            relatedId: quiz.id,
            screen: 'BibleQuizDetail',
            churchId: targetChurchId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          })
          .catch((e: any) => console.warn('[QuizService] Scheduled broadcast creation warning:', e));
      }

      // 2. Also write in-app notification to churches/{churchId}/notifications
      if (targetChurchId) {
        firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('notifications')
          .add({
            type: 'quiz_scheduled',
            title: pushTitle,
            body: pushBody,
            id: quiz.id,
            quizId: quiz.id,
            relatedId: quiz.id,
            screen: 'BibleQuizDetail',
            churchId: targetChurchId,
            quizTitle: quizTitle,
            scheduledDate: quiz.scheduledDate,
            scheduledTime: quiz.scheduledTime,
            category: quiz.category || '',
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.warn('[QuizService] Failed to notify members of scheduled quiz:', err);
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

      // Invalidate memory cache so changes reflect immediately
      this.quizzesCache.clear();

      return true;
    } catch (err: any) {
      console.error('[QuizService] Error deleting quiz:', err);
      return false;
    }
  }

  /**
   * Delete a quiz attempt / member report.
   */
  static async deleteQuizAttempt(attemptId: string, churchId?: string): Promise<boolean> {
    try {
      const targetChurchId = await this.resolveChurchId(churchId);

      if (targetChurchId && targetChurchId !== 'global') {
        await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection(this.ATTEMPTS_COLLECTION)
          .doc(attemptId)
          .delete()
          .catch(() => {});
      }

      await firestore()
        .collection('churches')
        .doc('global')
        .collection(this.ATTEMPTS_COLLECTION)
        .doc(attemptId)
        .delete()
        .catch(() => {});

      firestore()
        .collection(this.ATTEMPTS_COLLECTION)
        .doc(attemptId)
        .delete()
        .catch(() => {});

      // Invalidate attempt cache so UI updates immediately
      this.attemptsCache.clear();
      return true;
    } catch (err: any) {
      console.error('[QuizService] Error deleting quiz attempt:', err);
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

    // Invalidate user attempts cache so results update immediately
    this.attemptsCache.clear();

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
   * Fetch all past attempts for a member keyed by quizId for quick lookups.
   * Cached in-memory for instant 0ms responses across screen visits.
   */
  static async getUserAttemptsMap(userId: string, churchId?: string, forceRefresh: boolean = false): Promise<Record<string, QuizAttempt>> {
    const cacheKey = `${userId}_${churchId || 'global'}`;
    if (!forceRefresh) {
      const cached = this.attemptsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }

    try {
      const attempts = await this.getUserAttempts(userId, churchId);
      const map: Record<string, QuizAttempt> = {};
      attempts.forEach((att) => {
        if (att.quizId) {
          // Keep the latest or best score attempt
          const existing = map[att.quizId];
          if (!existing || (att.percentage || 0) >= (existing.percentage || 0)) {
            map[att.quizId] = att;
          }
        }
      });
      this.attemptsCache.set(cacheKey, { data: map, timestamp: Date.now() });
      return map;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getUserAttemptsMap:', err?.message || err);
      return {};
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
   * Fetch all quiz attempts for the church members across all quizzes.
   * Used by Admin Dashboard -> Bible Quiz -> Reports tab.
   */
  static async getAllChurchQuizAttempts(churchId?: string, forceRefresh: boolean = false): Promise<QuizAttempt[]> {
    const cacheKey = `all_attempts_${churchId || 'global'}`;
    if (!forceRefresh) {
      const cached = this.attemptsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return (cached as any).list || [];
      }
    }

    try {
      const targetChurchId = await this.resolveChurchId(churchId);
      const attemptsMap = new Map<string, QuizAttempt>();

      // 1. Church-specific attempts subcollection
      if (targetChurchId && targetChurchId !== 'global') {
        try {
          const snaps = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection(this.ATTEMPTS_COLLECTION)
            .limit(200)
            .get();

          snaps.docs.forEach((doc: any) => {
            attemptsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        } catch {
          // ignore
        }
      }

      // 2. Global attempts subcollection (filtered by churchId if applicable)
      try {
        const globalSnaps = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.ATTEMPTS_COLLECTION)
          .limit(200)
          .get();

        globalSnaps.docs.forEach((doc: any) => {
          const data = doc.data();
          if (!targetChurchId || targetChurchId === 'global' || data.churchId === targetChurchId) {
            if (!attemptsMap.has(doc.id)) {
              attemptsMap.set(doc.id, { id: doc.id, ...data });
            }
          }
        });
      } catch {
        // ignore
      }

      // 3. Fallback to root collection if needed
      if (attemptsMap.size === 0) {
        try {
          const rootSnaps = await firestore()
            .collection(this.ATTEMPTS_COLLECTION)
            .limit(200)
            .get();

          rootSnaps.docs.forEach((doc: any) => {
            const data = doc.data();
            if (!targetChurchId || targetChurchId === 'global' || data.churchId === targetChurchId) {
              if (!attemptsMap.has(doc.id)) {
                attemptsMap.set(doc.id, { id: doc.id, ...data });
              }
            }
          });
        } catch {
          // ignore
        }
      }

      const list = Array.from(attemptsMap.values());
      list.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
        return timeB - timeA;
      });

      this.attemptsCache.set(cacheKey, { list, timestamp: Date.now() } as any);
      return list;
    } catch (err: any) {
      console.warn('[QuizService] Notice in getAllChurchQuizAttempts:', err?.message || err);
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
