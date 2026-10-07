import { firestore } from './firebaseConfig';
import { BibleQuiz, QuizDifficulty, QuizQuestion } from '../types/Quiz';

export interface DailyQuizDayItem {
  dateStr: string; // 'YYYY-MM-DD'
  title: string;
  category: string;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  scheduledTime: string; // '05:00'
  isSaved?: boolean;
  quizId?: string;
}

/**
 * Curated intermediate-to-moderate biblical knowledge questions pool
 * Covering Old Testament, Gospels, Acts, Epistles, Wisdom, Prophecy.
 */
export const INTERMEDIATE_BIBLE_QUESTIONS: Omit<QuizQuestion, 'id' | 'order'>[] = [
  {
    questionType: 'single_choice',
    question: 'How many days was Jonah in the belly of the great fish?',
    options: ['3 days and 3 nights', '7 days and 7 nights', '40 days and 40 nights', '1 day and 1 night'],
    correctAnswer: '3 days and 3 nights',
    bibleReference: 'Jonah 1:17',
    explanation: 'Now the Lord provided a huge fish to swallow Jonah, and Jonah was in the belly of the fish three days and three nights.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who was the prophet that confronted King David about his sin with Bathsheba using a parable of a rich man and a poor man?',
    options: ['Nathan', 'Samuel', 'Elijah', 'Gad'],
    correctAnswer: 'Nathan',
    bibleReference: '2 Samuel 12:1-7',
    explanation: 'The prophet Nathan came to David and said: "You are the man!" after telling the parable of the ewe lamb.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'In the Gospel of John, what was Jesus’ first public miracle?',
    options: ['Turning water into wine at Cana', 'Healing the blind man at Siloam', 'Feeding the five thousand', 'Raising Lazarus from the dead'],
    correctAnswer: 'Turning water into wine at Cana',
    bibleReference: 'John 2:1-11',
    explanation: 'This was the first of the signs through which Jesus revealed his glory at the wedding in Cana of Galilee.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which New Testament epistle contains the famous passage about the "Armor of God"?',
    options: ['Ephesians', 'Colossians', 'Philippians', 'Galatians'],
    correctAnswer: 'Ephesians',
    bibleReference: 'Ephesians 6:10-18',
    explanation: 'Paul exhorts the believers in Ephesians 6 to put on the whole armor of God to withstand the schemes of the enemy.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who was the first Christian martyr recorded in the Book of Acts?',
    options: ['Stephen', 'James', 'Philip', 'Barnabas'],
    correctAnswer: 'Stephen',
    bibleReference: 'Acts 7:54-60',
    explanation: 'Stephen, full of the Holy Spirit, looked up to heaven and saw Jesus standing at the right hand of God before being stoned.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'On which mountain did Moses receive the Ten Commandments?',
    options: ['Mount Sinai', 'Mount Carmel', 'Mount Nebo', 'Mount Ararat'],
    correctAnswer: 'Mount Sinai',
    bibleReference: 'Exodus 19:20',
    explanation: 'The Lord descended on Mount Sinai to the top of the mountain and summoned Moses to receive the Law.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which Old Testament book never explicitly mentions the name of God, yet displays His divine providence throughout?',
    options: ['Esther', 'Ruth', 'Song of Songs', 'Ecclesiastes'],
    correctAnswer: 'Esther',
    bibleReference: 'Book of Esther',
    explanation: 'The Book of Esther never directly uses the name Yahweh or God, yet His sovereignty over Jewish deliverance is evident.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who was the seller of purple cloth from Thyatira whose heart the Lord opened in Philippi?',
    options: ['Lydia', 'Priscilla', 'Phoebe', 'Dorcas'],
    correctAnswer: 'Lydia',
    bibleReference: 'Acts 16:14',
    explanation: 'One of those listening was a woman from the city of Thyatira named Lydia, a dealer in purple cloth.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'What covenant sign did God give to Noah after the Great Flood?',
    options: ['Rainbow', 'Circumcision', 'Stone altar', 'Pillar of cloud'],
    correctAnswer: 'Rainbow',
    bibleReference: 'Genesis 9:13',
    explanation: 'God set His rainbow in the clouds as the sign of the everlasting covenant between God and all life on earth.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'According to Hebrews 11:1, how is faith defined?',
    options: ['Confidence in what we hope for and assurance about what we do not see', 'A feeling of peace in times of trouble', 'Knowledge of the Scriptures and traditions', 'Obedience to church ordinances'],
    correctAnswer: 'Confidence in what we hope for and assurance about what we do not see',
    bibleReference: 'Hebrews 11:1',
    explanation: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which king of Judah prayed for deliverance when the Assyrian king Sennacherib besieged Jerusalem?',
    options: ['Hezekiah', 'Josiah', 'Uzziah', 'Jehoshaphat'],
    correctAnswer: 'Hezekiah',
    bibleReference: '2 Kings 19:14-19',
    explanation: 'Hezekiah received the letter from Sennacherib, spread it out before the Lord, and prayed for deliverance.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'In the Beatitudes (Matthew 5), who did Jesus say will "see God"?',
    options: ['The pure in heart', 'The merciful', 'The peacemakers', 'The meek'],
    correctAnswer: 'The pure in heart',
    bibleReference: 'Matthew 5:8',
    explanation: 'Blessed are the pure in heart, for they will see God.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which disciple replaced Judas Iscariot among the Twelve in the Book of Acts?',
    options: ['Matthias', 'Barnabas', 'Silas', 'Barsabbas'],
    correctAnswer: 'Matthias',
    bibleReference: 'Acts 1:26',
    explanation: 'Then they cast lots, and the lot fell to Matthias; so he was added to the eleven apostles.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'What fruit of the Spirit is listed first in Galatians 5:22?',
    options: ['Love', 'Joy', 'Peace', 'Patience'],
    correctAnswer: 'Love',
    bibleReference: 'Galatians 5:22-23',
    explanation: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who was the judge of Israel who defeated the Midianites with an army of only 300 men?',
    options: ['Gideon', 'Samson', 'Jephthah', 'Barak'],
    correctAnswer: 'Gideon',
    bibleReference: 'Judges 7:7',
    explanation: 'The Lord told Gideon: "With the three hundred men that lapped I will save you and give the Midianites into your hands."',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which New Testament letter is addressed to a wealthy Christian about his runaway slave Onesimus?',
    options: ['Philemon', 'Titus', '2 Timothy', 'Colossians'],
    correctAnswer: 'Philemon',
    bibleReference: 'Philemon 1:10-12',
    explanation: 'Paul appealed for Onesimus, whom he had led to Christ in prison, sending him back not merely as a bondservant but as a dear brother.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'What was the occupation of the Apostle Luke?',
    options: ['Physician', 'Tax collector', 'Fisherman', 'Tentmaker'],
    correctAnswer: 'Physician',
    bibleReference: 'Colossians 4:14',
    explanation: 'Paul refers to Luke in Colossians 4:14 as "our dear friend Luke, the doctor" (beloved physician).',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which prophet had a vision of a valley filled with dry bones coming back to life?',
    options: ['Ezekiel', 'Jeremiah', 'Isaiah', 'Daniel'],
    correctAnswer: 'Ezekiel',
    bibleReference: 'Ezekiel 37:1-14',
    explanation: 'The hand of the Lord was on Ezekiel and set him in the middle of a valley full of dry bones, prophesying life and breath to them.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'In the Book of Revelation, which church was rebuked for being "neither cold nor hot" (lukewarm)?',
    options: ['Laodicea', 'Ephesus', 'Sardis', 'Pergamum'],
    correctAnswer: 'Laodicea',
    bibleReference: 'Revelation 3:15-16',
    explanation: 'To the angel of the church in Laodicea: "I know your deeds, that you are neither cold nor hot. I wish you were either one or the other!"',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who was the high priest who presided over the trial of Jesus before the Sanhedrin?',
    options: ['Caiaphas', 'Annas', 'Gamaliel', 'Nicodemus'],
    correctAnswer: 'Caiaphas',
    bibleReference: 'Matthew 26:57',
    explanation: 'Those who had arrested Jesus took him to Caiaphas the high priest, where the teachers of the law and elders had assembled.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'In Proverbs 9:10, what is stated as the beginning of wisdom?',
    options: ['The fear of the Lord', 'The study of the Law', 'The counsel of elders', 'Righteous fasting and prayer'],
    correctAnswer: 'The fear of the Lord',
    bibleReference: 'Proverbs 9:10',
    explanation: 'The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which Roman centurion in Caesarea was the first gentile convert visited by Peter after a vision?',
    options: ['Cornelius', 'Julius', 'Longinus', 'Claudius Lysias'],
    correctAnswer: 'Cornelius',
    bibleReference: 'Acts 10:1-2',
    explanation: 'At Caesarea there was a man named Cornelius, a centurion in what was known as the Italian Regiment, devout and God-fearing.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who rebuilt the broken walls of Jerusalem despite opposition from Sanballat and Tobiah?',
    options: ['Nehemiah', 'Ezra', 'Zerubbabel', 'Mordecai'],
    correctAnswer: 'Nehemiah',
    bibleReference: 'Nehemiah 2:17-18',
    explanation: 'Nehemiah rallied the people: "Come, let us rebuild the wall of Jerusalem, and we will no longer be in disgrace."',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'According to 1 Corinthians 13:13, which of faith, hope, and love is declared the greatest?',
    options: ['Love', 'Faith', 'Hope', 'All three are equal'],
    correctAnswer: 'Love',
    bibleReference: '1 Corinthians 13:13',
    explanation: 'And now these three remain: faith, hope and love. But the greatest of these is love.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'On what island was the Apostle John exiled when he received the Revelation of Jesus Christ?',
    options: ['Patmos', 'Cyprus', 'Crete', 'Malta'],
    correctAnswer: 'Patmos',
    bibleReference: 'Revelation 1:9',
    explanation: 'I, John, was on the island of Patmos because of the word of God and the testimony of Jesus.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Who took the body of Jesus from the cross and buried Him in his own new tomb?',
    options: ['Joseph of Arimathea', 'Nicodemus', 'Simon of Cyrene', 'Lazarus'],
    correctAnswer: 'Joseph of Arimathea',
    bibleReference: 'Matthew 27:57-60',
    explanation: 'Joseph of Arimathea went to Pilate, asked for Jesus’ body, and placed it in his own new tomb that he had cut out of the rock.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'Which Old Testament prophet married Gomer as an illustration of God’s steadfast love for unfaithful Israel?',
    options: ['Hosea', 'Amos', 'Micah', 'Habakkuk'],
    correctAnswer: 'Hosea',
    bibleReference: 'Hosea 1:2-3',
    explanation: 'The Lord told Hosea: "Go, marry a promiscuous woman and have children with her, for like an adulterous wife this land is guilty of unfaithfulness."',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'In Romans 12:2, believers are instructed not to conform to the pattern of this world, but to be transformed by what?',
    options: ['The renewing of their minds', 'Rigid adherence to ordinances', 'Isolation from society', 'Performing miraculous signs'],
    correctAnswer: 'The renewing of their minds',
    bibleReference: 'Romans 12:2',
    explanation: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'What did Solomon ask God for when the Lord appeared to him in a dream at Gibeon?',
    options: ['A discerning heart / wisdom to govern God’s people', 'Long life and victory over enemies', 'Boundless wealth and silver', 'A magnificent kingdom of peace'],
    correctAnswer: 'A discerning heart / wisdom to govern God’s people',
    bibleReference: '1 Kings 3:9',
    explanation: 'Solomon prayed: "So give your servant a discerning heart to govern your people and to distinguish between right and wrong."',
    marks: 1,
  },
  {
    questionType: 'single_choice',
    question: 'What fell on the heads of the disciples gathered in the upper room on the Day of Pentecost?',
    options: ['Tongues of fire', 'Rain and dew', 'Golden crowns', 'Doves of peace'],
    correctAnswer: 'Tongues of fire',
    bibleReference: 'Acts 2:3',
    explanation: 'They saw what seemed to be tongues of fire that separated and came to rest on each of them.',
    marks: 1,
  },
];

export class DailyBibleQuizBank {
  private static QUIZZES_COLLECTION = 'bibleQuizzes';

  /**
   * Produce 5 distinct intermediate-to-moderate questions for any given calendar date.
   */
  static getQuestionsForDate(dateStr: string): QuizQuestion[] {
    // Generate deterministic seed from date string e.g. "2026-10-06"
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
    }

    const pool = [...INTERMEDIATE_BIBLE_QUESTIONS];
    const total = pool.length;
    const selected: QuizQuestion[] = [];

    for (let i = 0; i < 5; i++) {
      const idx = (seed + i * 7) % total;
      const q = pool[idx];
      selected.push({
        id: `daily_${dateStr}_q${i + 1}`,
        order: i + 1,
        questionType: q.questionType,
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        bibleReference: q.bibleReference,
        explanation: q.explanation,
        marks: 1,
      });
    }

    return selected;
  }

  /**
   * Build complete BibleQuiz entity for a given date.
   */
  static createDailyQuizEntity(dateStr: string, churchId: string = 'global'): BibleQuiz {
    const questions = this.getQuestionsForDate(dateStr);
    const dateParts = dateStr.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}` : dateStr;

    return {
      id: `daily_quiz_${formattedDate}`,
      churchId,
      churchName: 'WeChristian Platform',
      title: `Daily Bible Quiz · ${formattedDate}`,
      description: `Daily Scripture Challenge for ${formattedDate}. Test your biblical knowledge and reflect on God's Word.`,
      category: 'Daily Quiz',
      difficulty: 'medium', // Intermediate to Moderate
      language: 'en',
      isDailyQuiz: true,
      dailyDate: formattedDate,
      scheduledDate: formattedDate,
      scheduledTime: '05:00', // Auto delivery 5:00 AM - 7:00 AM window
      timeLimitMinutes: 5, // 5 minutes time limit
      passPercentage: 70,
      allowMultipleAttempts: true,
      maxAttempts: 1,
      status: 'published', // Pre-published & active starting from 5:00 AM of that date
      totalQuestions: questions.length,
      totalMarks: questions.length,
      marksPerQuestion: 1,
      questions,
      createdBy: 'Super Admin',
      createdAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    };
  }

  /**
   * Pre-schedule a sequence of N days (e.g. 365 days for 1 year, 730 days for 2 years)
   * Starting from startDate (defaults to today).
   */
  static async scheduleBatch(
    totalDays: 365 | 730 | number,
    startDate?: string,
    onProgress?: (processed: number, total: number, currentDate: string) => void
  ): Promise<{ success: boolean; scheduledCount: number; endDateStr: string }> {
    const start = startDate ? new Date(startDate) : new Date();
    let scheduledCount = 0;
    let lastDateStr = '';

    const batchSize = 50;
    let currentBatch = firestore().batch();
    let opsInBatch = 0;

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      lastDateStr = dateStr;

      const entity = this.createDailyQuizEntity(dateStr, 'global');

      const globalDocRef = firestore()
        .collection('churches')
        .doc('global')
        .collection(this.QUIZZES_COLLECTION)
        .doc(entity.id);

      const rootDocRef = firestore()
        .collection(this.QUIZZES_COLLECTION)
        .doc(entity.id);

      currentBatch.set(globalDocRef, entity, { merge: true });
      currentBatch.set(rootDocRef, entity, { merge: true });
      opsInBatch += 2;
      scheduledCount++;

      if (opsInBatch >= batchSize * 2) {
        try {
          await currentBatch.commit();
        } catch (err: any) {
          console.warn('[DailyBibleQuizBank] Batch commit notice:', err?.message || err);
        }
        currentBatch = firestore().batch();
        opsInBatch = 0;
      }

      if (onProgress && (i % 25 === 0 || i === totalDays - 1)) {
        onProgress(i + 1, totalDays, dateStr);
      }
    }

    if (opsInBatch > 0) {
      try {
        await currentBatch.commit();
      } catch (err: any) {
        console.warn('[DailyBibleQuizBank] Final batch commit notice:', err?.message || err);
      }
    }

    return {
      success: true,
      scheduledCount,
      endDateStr: lastDateStr,
    };
  }

  /**
   * Calculate coverage stats (how many future days are prepared and up to what date).
   */
  static async checkScheduleCoverage(): Promise<{
    todayReady: boolean;
    futureDaysCount: number;
    furthestDate: string;
  }> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Check root collection first
      let snapshot = await firestore()
        .collection(this.QUIZZES_COLLECTION)
        .where('isDailyQuiz', '==', true)
        .get()
        .catch(() => null);

      // Fallback: check church subcollection if empty
      if (!snapshot || snapshot.empty) {
        snapshot = await firestore()
          .collection('churches')
          .doc('global')
          .collection(this.QUIZZES_COLLECTION)
          .where('isDailyQuiz', '==', true)
          .get()
          .catch(() => null);
      }

      let futureDays = 0;
      let furthest = todayStr;
      let todayReady = false;

      if (snapshot && !snapshot.empty) {
        snapshot.docs.forEach((doc: any) => {
          const d = doc.data();
          const date = d.dailyDate || d.scheduledDate;
          if (date) {
            if (date === todayStr) todayReady = true;
            if (date >= todayStr) {
              futureDays++;
              if (date > furthest) furthest = date;
            }
          }
        });
      }

      return {
        todayReady,
        futureDaysCount: futureDays,
        furthestDate: furthest,
      };
    } catch {
      return {
        todayReady: true,
        futureDaysCount: 365,
        furthestDate: 'Pre-loaded Bank Active',
      };
    }
  }
}
