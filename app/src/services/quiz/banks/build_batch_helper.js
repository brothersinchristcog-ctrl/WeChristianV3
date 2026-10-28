const fs = require('fs');
const path = require('path');

function assembleBank(topicName, prefix, factList) {
  console.log(`Generating 450 unique questions for ${topicName}...`);
  const stages = [
    { key: 'foundation', num: 1 },
    { key: 'growth', num: 2 },
    { key: 'mastery', num: 3 }
  ];
  const diffs = ['easy', 'medium', 'hard'];

  const results = {
    easy: { foundation: [], growth: [], mastery: [] },
    medium: { foundation: [], growth: [], mastery: [] },
    hard: { foundation: [], growth: [], mastery: [] }
  };

  let factIdx = 0;

  for (const diff of diffs) {
    for (const stg of stages) {
      for (let i = 0; i < 50; i++) {
        const fact = factList[factIdx % factList.length];
        factIdx++;

        const qNum = i + 1;
        const qId = `${prefix}_${diff[0]}_s${stg.num}_q${qNum < 10 ? '0' + qNum : qNum}`;

        let qText = '';
        let qTextTe = '';
        if (diff === 'easy') {
          qText = fact.easyQ(qNum);
          qTextTe = fact.easyQTe(qNum);
        } else if (diff === 'medium') {
          qText = fact.medQ(qNum);
          qTextTe = fact.medQTe(qNum);
        } else {
          qText = fact.hardQ(qNum);
          qTextTe = fact.hardQTe(qNum);
        }

        results[diff][stg.key].push({
          id: qId,
          order: qNum,
          questionType: 'single_choice',
          question: qText,
          questionTelugu: qTextTe,
          options: fact.options,
          optionsTelugu: fact.optionsTelugu,
          correctAnswer: fact.correctAnswer,
          bibleReference: fact.bibleReference,
          explanation: fact.explanation,
          explanationTelugu: fact.explanationTelugu,
          marks: 1
        });
      }
    }
  }

  // Generate File
  const upper = topicName.toUpperCase();
  const pascal = topicName;
  let code = `import { QuizQuestion, QuizDifficulty } from '../../../types/Quiz';\n\n`;

  for (const diff of diffs) {
    for (const stg of stages) {
      code += `export const ${upper}_${diff.toUpperCase()}_${stg.key.toUpperCase()}: QuizQuestion[] = ${JSON.stringify(results[diff][stg.key], null, 2)};\n\n`;
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
  console.log(`Saved ${dest} (450 questions, ${fs.statSync(dest).size} bytes)`);
}

module.exports = { assembleBank };
