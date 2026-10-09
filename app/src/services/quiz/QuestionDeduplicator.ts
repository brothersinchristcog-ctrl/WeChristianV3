import { QuizQuestion } from '../../types/Quiz';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'to', 'from', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now', 'said', 'according', 'bible',
  'chapter', 'verse', 'book', 'testament'
]);

export class QuestionDeduplicator {
  /**
   * Normalizes a text string: lowercased, stripped punctuation, and trimmed.
   */
  static normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .replace(/['’"“”]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts meaningful keyword tokens excluding common stopwords.
   */
  static getKeywords(text: string): Set<string> {
    const norm = this.normalize(text);
    const tokens = norm.split(' ');
    const set = new Set<string>();
    for (const t of tokens) {
      if (t.length > 2 && !STOP_WORDS.has(t)) {
        set.add(t);
      }
    }
    return set;
  }

  /**
   * Calculates Jaccard token similarity between two text strings (0.0 to 1.0).
   */
  static calculateJaccardSimilarity(textA: string, textB: string): number {
    const setA = this.getKeywords(textA);
    const setB = this.getKeywords(textB);

    if (setA.size === 0 && setB.size === 0) return 1.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const word of setA) {
      if (setB.has(word)) {
        intersectionCount++;
      }
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }

  /**
   * Normalizes a Bible reference (e.g., "1 Samuel 18:1", "1sam 18:1").
   */
  static normalizeBibleRef(ref?: string): string {
    if (!ref) return '';
    return ref.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9:]/g, '');
  }

  /**
   * Checks if a candidate question is a duplicate against an array of existing questions.
   * Compares:
   * 1. Exact normalized question string match
   * 2. High keyword Jaccard similarity (> 0.55)
   * 3. Same normalized Bible reference AND substantial similarity (> 0.35)
   * 4. Telugu question text exact match (if present)
   */
  static isDuplicate(
    candidate: QuizQuestion,
    existingList: QuizQuestion[],
    similarityThreshold = 0.55
  ): { isDuplicate: boolean; reason?: string; match?: QuizQuestion } {
    const candNorm = this.normalize(candidate.question);
    const candRef = this.normalizeBibleRef(candidate.bibleReference);
    const candTeNorm = candidate.questionTelugu
      ? candidate.questionTelugu.replace(/\s+/g, ' ').trim()
      : '';

    for (const existing of existingList) {
      // Don't compare with itself if candidate has same id
      if (existing.id && candidate.id && existing.id === candidate.id) {
        continue;
      }

      // 1. Exact English text match
      const existNorm = this.normalize(existing.question);
      if (candNorm.length > 0 && candNorm === existNorm) {
        return {
          isDuplicate: true,
          reason: `Exact question text match: "${candidate.question}"`,
          match: existing,
        };
      }

      // 2. Exact Telugu text match
      if (candTeNorm && existing.questionTelugu) {
        const existTeNorm = existing.questionTelugu.replace(/\s+/g, ' ').trim();
        if (candTeNorm === existTeNorm) {
          return {
            isDuplicate: true,
            reason: `Exact Telugu question text match: "${candidate.questionTelugu}"`,
            match: existing,
          };
        }
      }

      // 3. Jaccard similarity threshold
      const sim = this.calculateJaccardSimilarity(candidate.question, existing.question);
      if (sim >= similarityThreshold) {
        return {
          isDuplicate: true,
          reason: `High semantic similarity (${Math.round(sim * 100)}%): "${candidate.question}" vs "${existing.question}"`,
          match: existing,
        };
      }

      // 4. Same Bible reference + moderate semantic overlap (meaning they ask the same verse detail)
      if (candRef && existing.bibleReference) {
        const existRef = this.normalizeBibleRef(existing.bibleReference);
        if (candRef === existRef && sim >= 0.35) {
          return {
            isDuplicate: true,
            reason: `Same Bible reference (${candidate.bibleReference}) and high question overlap`,
            match: existing,
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Filters an array of candidate questions to ensure every question is 100% unique,
   * both among themselves and against an optional existing question pool.
   */
  static filterUnique(
    candidates: QuizQuestion[],
    existingPool: QuizQuestion[] = [],
    similarityThreshold = 0.55
  ): QuizQuestion[] {
    const accepted: QuizQuestion[] = [];
    const fullPool = [...existingPool];

    for (const q of candidates) {
      const check = this.isDuplicate(q, fullPool, similarityThreshold);
      if (!check.isDuplicate) {
        accepted.push(q);
        fullPool.push(q);
      } else {
        // Duplicate detected, discard candidate
        console.warn(`[QuestionDeduplicator] Discarded duplicate question: ${check.reason}`);
      }
    }

    return accepted;
  }

  /**
   * Verifies that two or more question pools have zero mutual duplicates.
   */
  static validatePoolsMutualUniqueness(
    poolNames: string[],
    pools: QuizQuestion[][]
  ): { valid: boolean; duplicatePairs: Array<{ poolA: string; poolB: string; qA: string; qB: string; reason: string }> } {
    const duplicatePairs: Array<{ poolA: string; poolB: string; qA: string; qB: string; reason: string }> = [];

    for (let i = 0; i < pools.length; i++) {
      for (let j = i + 1; j < pools.length; j++) {
        const poolA = pools[i];
        const poolB = pools[j];
        const nameA = poolNames[i] || `Pool_${i + 1}`;
        const nameB = poolNames[j] || `Pool_${j + 1}`;

        for (const qA of poolA) {
          const check = this.isDuplicate(qA, poolB);
          if (check.isDuplicate && check.match) {
            duplicatePairs.push({
              poolA: nameA,
              poolB: nameB,
              qA: qA.question,
              qB: check.match.question,
              reason: check.reason || 'Similarity threshold exceeded',
            });
          }
        }
      }
    }

    return {
      valid: duplicatePairs.length === 0,
      duplicatePairs,
    };
  }
}
