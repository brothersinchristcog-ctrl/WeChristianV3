const fs = require('fs');
const path = require('path');

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

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getKeywords(text) {
  const norm = normalize(text);
  const tokens = norm.split(' ');
  const set = new Set();
  for (const t of tokens) {
    if (t.length > 2 && !STOP_WORDS.has(t)) {
      set.add(t);
    }
  }
  return set;
}

function calculateJaccardSimilarity(textA, textB) {
  const setA = getKeywords(textA);
  const setB = getKeywords(textB);
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let inter = 0;
  for (const w of setA) {
    if (setB.has(w)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Builds and validates a 450-question bank for a topic.
 * @param {string} topicName e.g. "Friends"
 * @param {string} prefix e.g. "frn"
 * @param {Array} foundationFacts 50 distinct facts
 * @param {Array} growthFacts 50 distinct facts
 * @param {Array} masteryFacts 50 distinct facts
 */
function buildBank(topicName, prefix, foundationFacts, growthFacts, masteryFacts) {
  console.log(`\n========================================`);
  console.log(`Building Bank for: ${topicName} (prefix: ${prefix})`);
  console.log(`========================================`);

  if (!Array.isArray(foundationFacts) || foundationFacts.length < 50) {
    throw new Error(`foundationFacts must have at least 50 items (got ${foundationFacts ? foundationFacts.length : 0})`);
  }
  if (!Array.isArray(growthFacts) || growthFacts.length < 50) {
    throw new Error(`growthFacts must have at least 50 items (got ${growthFacts ? growthFacts.length : 0})`);
  }
  if (!Array.isArray(masteryFacts) || masteryFacts.length < 50) {
    throw new Error(`masteryFacts must have at least 50 items (got ${masteryFacts ? masteryFacts.length : 0})`);
  }

  const stageFactsMap = {
    foundation: { num: 1, facts: foundationFacts.slice(0, 50) },
    growth: { num: 2, facts: growthFacts.slice(0, 50) },
    mastery: { num: 3, facts: masteryFacts.slice(0, 50) }
  };

  const diffs = ['easy', 'medium', 'hard'];
  const stages = ['foundation', 'growth', 'mastery'];

  const results = {
    easy: { foundation: [], growth: [], mastery: [] },
    medium: { foundation: [], growth: [], mastery: [] },
    hard: { foundation: [], growth: [], mastery: [] }
  };

  const allQuestions = [];
  const questionTextSet = new Set();

  for (const stg of stages) {
    const { num: stgNum, facts } = stageFactsMap[stg];

    for (let i = 0; i < 50; i++) {
      const fact = facts[i];
      const qNum = i + 1;
      const numStr = qNum < 10 ? '0' + qNum : '' + qNum;

      for (const diff of diffs) {
        const diffLetter = diff[0];
        const qId = `${prefix}_${diffLetter}_s${stgNum}_q${numStr}`;

        let qText = '';
        let qTextTe = '';
        let opts = fact.options;
        let optsTe = fact.optionsTelugu;
        let ans = fact.correctAnswer;
        let ref = fact.bibleReference;
        let exp = fact.explanation;
        let expTe = fact.explanationTelugu;

        if (diff === 'easy') {
          qText = typeof fact.easyQ === 'function' ? fact.easyQ(qNum) : fact.easyQ;
          qTextTe = typeof fact.easyQTe === 'function' ? fact.easyQTe(qNum) : fact.easyQTe;
          if (fact.easyOptions) opts = fact.easyOptions;
          if (fact.easyOptionsTe) optsTe = fact.easyOptionsTe;
          if (fact.easyAnswer) ans = fact.easyAnswer;
          if (fact.easyRef) ref = fact.easyRef;
          if (fact.easyExp) exp = fact.easyExp;
          if (fact.easyExpTe) expTe = fact.easyExpTe;
        } else if (diff === 'medium') {
          qText = typeof fact.medQ === 'function' ? fact.medQ(qNum) : fact.medQ;
          qTextTe = typeof fact.medQTe === 'function' ? fact.medQTe(qNum) : fact.medQTe;
          if (fact.medOptions) opts = fact.medOptions;
          if (fact.medOptionsTe) optsTe = fact.medOptionsTe;
          if (fact.medAnswer) ans = fact.medAnswer;
          if (fact.medRef) ref = fact.medRef;
          if (fact.medExp) exp = fact.medExp;
          if (fact.medExpTe) expTe = fact.medExpTe;
        } else {
          qText = typeof fact.hardQ === 'function' ? fact.hardQ(qNum) : fact.hardQ;
          qTextTe = typeof fact.hardQTe === 'function' ? fact.hardQTe(qNum) : fact.hardQTe;
          if (fact.hardOptions) opts = fact.hardOptions;
          if (fact.hardOptionsTe) optsTe = fact.hardOptionsTe;
          if (fact.hardAnswer) ans = fact.hardAnswer;
          if (fact.hardRef) ref = fact.hardRef;
          if (fact.hardExp) exp = fact.hardExp;
          if (fact.hardExpTe) expTe = fact.hardExpTe;
        }

        // Validate basic integrity
        if (!qText || qText.length < 10) {
          throw new Error(`Invalid question text at ${qId}: "${qText}"`);
        }
        if (!qTextTe || qTextTe.length < 5) {
          throw new Error(`Invalid Telugu question text at ${qId}: "${qTextTe}"`);
        }
        if (/Level Item/i.test(qText) || /\(Item \d+\)/i.test(qText)) {
          throw new Error(`Prohibited placeholder detected at ${qId}: "${qText}"`);
        }
        if (!Array.isArray(opts) || opts.length !== 4) {
          throw new Error(`Options must have exactly 4 items at ${qId} (got ${opts ? opts.length : 0})`);
        }
        if (!Array.isArray(optsTe) || optsTe.length !== 4) {
          throw new Error(`Telugu options must have exactly 4 items at ${qId}`);
        }
        if (!opts.includes(ans)) {
          throw new Error(`correctAnswer "${ans}" not found in options [${opts.join(', ')}] at ${qId}`);
        }
        if (!ref || ref.trim().length === 0) {
          throw new Error(`Missing bibleReference at ${qId}`);
        }

        // Check exact duplicate question text
        const normQ = normalize(qText);
        if (questionTextSet.has(normQ)) {
          throw new Error(`Duplicate question text detected at ${qId}: "${qText}"`);
        }
        questionTextSet.add(normQ);

        const qObj = {
          id: qId,
          order: qNum,
          questionType: 'single_choice',
          question: qText,
          questionTelugu: qTextTe,
          options: opts,
          optionsTelugu: optsTe,
          correctAnswer: ans,
          bibleReference: ref,
          explanation: exp,
          explanationTelugu: expTe,
          marks: 1
        };

        results[diff][stg].push(qObj);
        allQuestions.push(qObj);
      }
    }
  }

  // Deduplication check across all 450 questions
  console.log(`Verifying 450 questions for duplicate and semantic collisions...`);
  let dupCount = 0;
  for (let a = 0; a < allQuestions.length; a++) {
    for (let b = a + 1; b < allQuestions.length; b++) {
      const qA = allQuestions[a];
      const qB = allQuestions[b];

      // Exact match check
      if (normalize(qA.question) === normalize(qB.question)) {
        console.error(`Collision: Exact text between ${qA.id} and ${qB.id}`);
        dupCount++;
      }

      // Semantic Jaccard similarity check
      const sim = calculateJaccardSimilarity(qA.question, qB.question);
      if (sim > 0.65 && qA.correctAnswer === qB.correctAnswer) {
        console.error(`Collision: Semantic duplicate between ${qA.id} and ${qB.id} (sim: ${sim.toFixed(2)}, same answer: "${qA.correctAnswer}")`);
        dupCount++;
      }
    }
  }

  if (dupCount > 0) {
    throw new Error(`Found ${dupCount} collisions in ${topicName}! Fix facts before building.`);
  }

  console.log(`Validation PASSED! 450 unique questions, 0 duplicates.`);

  // Write TypeScript file
  const upper = topicName.toUpperCase();
  const pascal = topicName;
  let code = `import { QuizQuestion, QuizDifficulty } from '../../../types/Quiz';\n\n`;

  for (const diff of diffs) {
    for (const stg of stages) {
      code += `export const ${upper}_${diff.toUpperCase()}_${stg.key ? stg.key.toUpperCase() : stg.toUpperCase()}: QuizQuestion[] = ${JSON.stringify(results[diff][stg], null, 2)};\n\n`;
    }
  }

  code += `export const ${upper}_QUESTION_REGISTRY: Record<QuizDifficulty, { foundation: QuizQuestion[]; growth: QuizQuestion[]; mastery: QuizQuestion[]; }> = {\n`;
  for (const diff of diffs) {
    code += `  ${diff}: {\n`;
    code += `    foundation: ${upper}_${diff.toUpperCase()}_FOUNDATION,\n`;
    code += `    growth: ${upper}_${diff.toUpperCase()}_GROWTH,\n`;
    code += `    mastery: ${upper}_${diff.toUpperCase()}_MASTERY\n`;
    code += `  },\n`;
  }
  code += `};\n\n`;

  code += `export function get${pascal}StageQuestions(difficulty: QuizDifficulty, stage: 1 | 2 | 3): QuizQuestion[] {\n`;
  code += `  const diffKey = (difficulty || 'easy').toLowerCase() as QuizDifficulty;\n`;
  code += `  const stageMap = ${upper}_QUESTION_REGISTRY[diffKey] || ${upper}_QUESTION_REGISTRY.easy;\n`;
  code += `  if (stage === 1) return stageMap.foundation;\n`;
  code += `  if (stage === 2) return stageMap.growth;\n`;
  code += `  return stageMap.mastery;\n`;
  code += `}\n\n`;

  code += `export function get${pascal}LevelQuestions(difficulty: QuizDifficulty, level: number): QuizQuestion[] {\n`;
  code += `  const stage = level <= 10 ? 1 : level <= 20 ? 2 : 3;\n`;
  code += `  const stagePool = get${pascal}StageQuestions(difficulty, stage);\n`;
  code += `  const offset = (level - 1) % 10;\n`;
  code += `  const startIndex = offset * 5;\n`;
  code += `  return stagePool.slice(startIndex, startIndex + 5);\n`;
  code += `}\n`;

  const dest = path.join(__dirname, `${pascal}QuestionBank.ts`);
  fs.writeFileSync(dest, code, 'utf8');
  console.log(`Saved ${dest} (${fs.statSync(dest).size} bytes, 450 questions)`);
  return { topicName, totalQuestions: allQuestions.length, file: dest };
}

module.exports = { buildBank, normalize, calculateJaccardSimilarity };
