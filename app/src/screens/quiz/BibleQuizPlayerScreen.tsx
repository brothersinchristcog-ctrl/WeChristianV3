import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  BookOpen,
  Check,
  Globe,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  PublicQuizQuestion,
  QuizQuestion,
  QuizDifficulty,
  QuizAttempt,
  QuizAttemptAnswer,
  UserAnswerSubmission,
} from '../../types/Quiz';
import { QuizService } from '../../services/QuizService';
import { BibleQuizBank } from '../../services/BibleQuizBank';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getQuizStrings,
  localizeBibleReference,
} from '../../constants/BibleQuizTranslations';
import {
  getLocalizedDailyQuestion,
  getLocalizedDailyQuizTitle,
} from '../../constants/DailyQuizTranslations';
import QuizLanguageModal from './QuizLanguageModal';
import QuizAlertModal, { QuizAlertModalType } from './QuizAlertModal';
import { isQuizScheduledLocked, formatQuizTime } from '../../utils/QuizScheduleUtils';

export default function BibleQuizPlayerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const { isDark } = useTheme();

  // Navigation params: Either quizId (Admin conducted) or Category + Level
  const quizId: string | undefined = route?.params?.quizId;
  const paramChurchId: string | undefined = route?.params?.churchId;
  const category: string = route?.params?.category || 'Family';
  const difficulty: QuizDifficulty = route?.params?.difficulty || 'easy';
  const level: number = route?.params?.level || 1;
  const categoryTitleParam: string = route?.params?.categoryTitle || category;

  const [quizMeta, setQuizMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [rawQuestions, setRawQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type?: QuizAlertModalType;
    badgeText?: string;
    title: string;
    message: string;
    highlightText?: string;
    highlightIcon?: 'star' | 'lock' | 'alert' | 'award';
    primaryBtnText?: string;
    primaryBtnGradient?: [string, string];
    secondaryBtnText?: string;
    onPrimary?: () => void;
    onSecondary?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const ui = getQuizStrings(quizLanguage);
  const categoryDisplayName = ui.categories[category] || categoryTitleParam;

  useEffect(() => {
    loadQuiz();

    const backAction = () => {
      handleExitAttempt();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId, category, difficulty, level, quizLanguage]);

  const loadQuiz = async () => {
    try {
      if (questions.length === 0) {
        setLoading(true);
      }

      if (quizId) {
        // Mode A: Admin-conducted Quiz from Firestore (Localized to active Member View language)
        const data = await QuizService.getPublicQuizById(quizId, paramChurchId || activeChurch?.id, quizLanguage);
        if (!data || data.questions.length === 0) {
          setAlertModal({
            visible: true,
            type: 'error',
            title: 'Quiz Not Found',
            message: 'This quiz is either unavailable or has no questions configured.',
            primaryBtnText: 'Go Back',
            onPrimary: () => {
              setAlertModal((prev) => ({ ...prev, visible: false }));
              navigation.goBack();
            },
          });
          return;
        }

        // Enforce scheduled lock: accessible to members only from scheduledDate & scheduledTime onwards
        if (isQuizScheduledLocked(data.quiz)) {
          const unlockTimeFormatted = formatQuizTime(data.quiz.scheduledTime, data.quiz.scheduledDate);
          setAlertModal({
            visible: true,
            type: 'info',
            badgeText: `OPENS AT ${unlockTimeFormatted.toUpperCase()}`,
            title: 'Quiz Locked',
            message: `This quiz is scheduled and will be accessible to members starting from ${unlockTimeFormatted} on ${data.quiz.scheduledDate}. Please return once the scheduled time arrives!`,
            highlightText: `Unlocks on ${data.quiz.scheduledDate} at ${unlockTimeFormatted}`,
            highlightIcon: 'lock',
            primaryBtnText: 'Go Back',
            onPrimary: () => {
              setAlertModal((prev) => ({ ...prev, visible: false }));
              navigation.goBack();
            },
          });
          setLoading(false);
          return;
        }

        setQuizMeta(data.quiz);
        setQuestions(data.questions);

        if (data.quiz.timeLimitMinutes && data.quiz.timeLimitMinutes > 0) {
          startTimer(data.quiz.timeLimitMinutes * 60);
        } else {
          startTimeRef.current = Date.now();
        }
      } else {
        // Mode B: Level-Based Bible Quiz
        const levelData = await BibleQuizBank.getLevelQuiz(
          category,
          difficulty,
          level,
          activeChurch?.id
        );

        setRawQuestions(levelData.questions);
        setQuizMeta({
          title: levelData.title,
          category,
          difficulty,
          level,
          passPercentage: levelData.passPercentage,
        });

        // Map to public questions, preserving bilingual questions & options
        const publicQs: PublicQuizQuestion[] = levelData.questions.map((q) => ({
          id: q.id,
          order: q.order,
          questionType: q.questionType,
          question: q.question,
          questionTelugu: q.questionTelugu,
          options: q.options,
          optionsTelugu: q.optionsTelugu,
          bibleReference: q.bibleReference,
          marks: q.marks || 1,
        }));
        setQuestions(publicQs);
        startTimeRef.current = Date.now();
      }
    } catch (e) {
      console.warn('Error loading quiz questions:', e);
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Loading Failed',
        message: 'Unable to load quiz questions. Please check your network and try again.',
        primaryBtnText: 'Go Back',
        onPrimary: () => {
          setAlertModal((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (totalSec: number) => {
    setSecondsRemaining(totalSec);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeExpired = () => {
    const isTe = quizLanguage === 'te';
    setAlertModal({
      visible: true,
      type: 'timeup',
      badgeText: isTe ? 'సమయం ముగిసింది' : "TIME'S UP",
      title: isTe ? 'సమయం ముగిసింది!' : "Time's Up!",
      message: isTe
        ? 'మీ క్విజ్ సమయం ముగిసింది. మీ ప్రస్తుత సమాధానాలు ఇప్పుడు సమర్పించబడుతున్నాయి...'
        : 'Your quiz time limit has expired. Submitting your current answers now...',
      primaryBtnText: isTe ? 'ఫలితాలు చూడండి' : 'View Results',
      onPrimary: () => {
        setAlertModal((prev) => ({ ...prev, visible: false }));
        submitQuiz(true);
      },
    });
  };

  const handleSelectOption = (questionId: string, canonicalOption: string, isMulti: boolean) => {
    if (isMulti) {
      const current = (answers[questionId] as string[]) || [];
      const updated = current.includes(canonicalOption)
        ? current.filter((o) => o !== canonicalOption)
        : [...current, canonicalOption];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: canonicalOption });
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const handleExitAttempt = () => {
    const isTe = quizLanguage === 'te';
    setAlertModal({
      visible: true,
      type: 'exit',
      badgeText: isTe ? 'నిష్క్రమణ' : 'EXIT QUIZ',
      title: isTe ? 'క్విజ్ నుండి నిష్క్రమించాలా?' : 'Exit Quiz?',
      message: isTe
        ? 'మీరు ఖచ్చితంగా నిష్క్రమించాలనుకుంటున్నారా? ఈ స్థాయి కోసం మీ పురోగతి సేవ్ చేయబడదు.'
        : 'Are you sure you want to leave? Your progress for this level will not be saved.',
      secondaryBtnText: isTe ? 'కొనసాగించు' : 'Stay',
      primaryBtnText: isTe ? 'నిష్క్రమించు' : 'Leave',
      primaryBtnGradient: ['#EF4444', '#DC2626'],
      onSecondary: () => setAlertModal((prev) => ({ ...prev, visible: false })),
      onPrimary: () => {
        setAlertModal((prev) => ({ ...prev, visible: false }));
        if (timerRef.current) clearInterval(timerRef.current);
        navigation.goBack();
      },
    });
  };

  const submitQuiz = async (forced: boolean = false) => {
    if (isSubmitting) return;

    if (!forced) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < questions.length) {
        const unanswered = questions.length - answeredCount;
        const isTe = quizLanguage === 'te';
        setAlertModal({
          visible: true,
          type: 'unanswered',
          badgeText: isTe ? 'సమీక్ష అవసరం' : 'REVIEW REQUIRED',
          title: isTe ? 'సమాధానం ఇవ్వని ప్రశ్నలు' : 'Unanswered Questions',
          message: isTe
            ? `మీరు ఇంకా ${unanswered} ప్రశ్నలకు సమాధానం ఇవ్వలేదు. అయినా క్విజ్ సమర్పించాలనుకుంటున్నారా?`
            : `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Do you want to submit anyway?`,
          highlightText: isTe
            ? `⚠️ ${unanswered} ప్రశ్నలు మిగిలి ఉన్నాయి`
            : `⚠️ ${unanswered} Question${unanswered > 1 ? 's' : ''} Left Blank`,
          highlightIcon: 'alert',
          secondaryBtnText: isTe ? 'సమీక్షించండి' : 'Review',
          primaryBtnText: isTe ? 'సమర్పించు' : 'Submit Anyway',
          primaryBtnGradient: ['#2563EB', '#1D4ED8'],
          onSecondary: () => setAlertModal((prev) => ({ ...prev, visible: false })),
          onPrimary: () => {
            setAlertModal((prev) => ({ ...prev, visible: false }));
            doSubmit();
          },
        });
        return;
      }
    }

    doSubmit();
  };

  const doSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const timeTaken = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      if (quizId) {
        // Mode A: Submit to Firestore for Admin Quiz
        const submissions: UserAnswerSubmission[] = questions.map((q) => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] || '',
        }));

        const memberInfo = {
          name:
            (member as any)?.name ||
            (member as any)?.Name ||
            user?.displayName ||
            'Church Member',
          phone:
            (member as any)?.phone ||
            (member as any)?.MobilePhone ||
            user?.phoneNumber ||
            '',
          avatar: (member as any)?.avatar || '',
          churchId: activeChurch?.id || quizMeta?.churchId || 'global',
        };

        const result = await QuizService.submitQuizAttempt(
          quizId,
          user?.uid || 'guest_user',
          memberInfo,
          submissions,
          timeTaken
        );

        navigation.replace('BibleQuizResult', {
          attempt: result,
          quiz: quizMeta,
        });
      } else {
        // Mode B: Evaluate Level Quiz
        let earnedScore = 0;
        let totalPossible = 0;
        let correctCount = 0;

        const reviewAnswers: QuizAttemptAnswer[] = rawQuestions.map((q) => {
          const userAns = answers[q.id] || '';
          const isCorrect = Array.isArray(q.correctAnswer)
            ? Array.isArray(userAns) &&
              q.correctAnswer.sort().join() === userAns.sort().join()
            : q.correctAnswer === userAns;

          const qMarks = q.marks || 1;
          totalPossible += qMarks;

          if (isCorrect) {
            earnedScore += qMarks;
            correctCount += 1;
          }

          // Localize review question and explanation based on active language
          const localized = getLocalizedDailyQuestion(q, quizLanguage);
          const displayedQ = localized.question;
          const displayedRef = localized.bibleReference;
          const displayedExp = localized.explanation || q.explanation || '';

          // Resolve localized text for selected and correct answers
          let localizedUserAns = userAns;
          let localizedCorrectAns = q.correctAnswer;
          if (Array.isArray(q.options) && localized.options.length === q.options.length) {
            const userAnsIdx = q.options.indexOf(userAns as string);
            if (userAnsIdx >= 0) {
              localizedUserAns = localized.options[userAnsIdx];
            }
            const correctAnsIdx = q.options.indexOf(q.correctAnswer as string);
            if (correctAnsIdx >= 0) {
              localizedCorrectAns = localized.options[correctAnsIdx];
            }
          }

          return {
            questionId: q.id,
            question: displayedQ,
            selectedAnswer: localizedUserAns,
            correctAnswer: localizedCorrectAns,
            bibleReference: displayedRef,
            explanation: displayedExp,
            isCorrect,
            marksAwarded: isCorrect ? qMarks : 0,
            possibleMarks: qMarks,
          };
        });

        const percentage =
          totalPossible > 0 ? Math.round((earnedScore / totalPossible) * 100) : 0;
        const passThreshold = quizMeta?.passPercentage || 70;

        // Record level progression in BibleQuizBank
        const progResult = await BibleQuizBank.recordLevelResult(
          user?.uid || 'guest',
          category,
          difficulty,
          level,
          earnedScore,
          totalPossible,
          passThreshold
        );

        const attemptObj: QuizAttempt = {
          id: `att_${Date.now()}`,
          quizId: `${category}_${difficulty}_L${level}`,
          quizTitle: quizMeta?.title || `${categoryDisplayName} - ${ui.level} ${level}`,
          churchId: activeChurch?.id || 'global',
          userId: user?.uid || 'guest_user',
          memberName:
            (member as any)?.name ||
            (member as any)?.Name ||
            user?.displayName ||
            'Church Member',
          score: earnedScore,
          totalMarks: totalPossible,
          percentage,
          correctCount,
          wrongCount: rawQuestions.length - correctCount,
          totalQuestions: rawQuestions.length,
          timeTakenSeconds: timeTaken,
          passed: progResult.passed,
          answers: reviewAnswers,
          submittedAt: new Date(),
          isDaily: false,
        };

        navigation.replace('BibleQuizResult', {
          attempt: attemptObj,
          quiz: quizMeta,
          category,
          categoryTitle: categoryDisplayName,
          difficulty,
          level,
          nextLevelUnlocked: progResult.nextLevelUnlocked,
          newUnlockedLevel: progResult.newUnlockedLevel,
        });
      }
    } catch (err: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Submission Error',
        message: err?.message || 'Failed to submit quiz. Please check connection and try again.',
        primaryBtnText: 'OK',
        onPrimary: () => setAlertModal((prev) => ({ ...prev, visible: false })),
      });
      setIsSubmitting(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: isDark ? '#0b1120' : '#f8fafc' },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingTxt, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {quizLanguage === 'te'
            ? 'దేవుని వాక్య ప్రశ్నలు లోడ్ అవుతున్నాయి...'
            : 'Loading Scripture Questions...'}
        </Text>
      </View>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const formatTimeRemaining = () => {
    if (secondsRemaining === null) return null;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const safeBottomPadding =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 24) + 16
      : Math.max(insets.bottom, 16) + 12;

  // Render each swipeable Question Card + Options + Compact Navigator
  const renderQuestionItem = ({ item: currentQ, index: qIndex }: { item: PublicQuizQuestion; index: number }) => {
    const localized = getLocalizedDailyQuestion(currentQ, quizLanguage);
    const displayedQuestionText = localized.question;
    const localizedReference = localized.bibleReference;

    const isLastQuestion = qIndex === questions.length - 1;

    return (
      <View style={{ width: SCREEN_WIDTH }}>
        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={[styles.questionScrollContent, { paddingBottom: safeBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View
            style={[
              styles.questionCard,
              {
                backgroundColor: isDark ? '#141d2e' : '#ffffff',
                borderColor: isDark ? '#26354a' : '#e2e8f0',
              },
            ]}
          >
            {localizedReference ? (
              <View style={styles.qRefRow}>
                <View
                  style={[
                    styles.qRefBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(124, 58, 237, 0.2)'
                        : '#f5f3ff',
                    },
                  ]}
                >
                  <BookOpen size={13} color={isDark ? '#c4b5fd' : '#7c3aed'} />
                  <Text
                    style={[
                      styles.qRefBadgeTxt,
                      { color: isDark ? '#c4b5fd' : '#7c3aed' },
                    ]}
                  >
                    {localizedReference}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text
              style={[
                styles.questionText,
                { color: isDark ? '#f8fafc' : '#0f172a' },
              ]}
            >
              {displayedQuestionText}
            </Text>
          </View>

          {/* Options Prompt */}
          <Text
            style={[
              styles.optionsPrompt,
              { color: isDark ? '#94a3b8' : '#64748b' },
            ]}
          >
            {ui.selectYourAnswer}
          </Text>

          {/* Options List */}
          <View style={styles.optionsList}>
            {currentQ.options.map((canonicalOption, optIdx) => {
              const isSelected = Array.isArray(answers[currentQ.id])
                ? (answers[currentQ.id] as string[]).includes(canonicalOption)
                : answers[currentQ.id] === canonicalOption;

              const optionDisplayText =
                localized.options && localized.options[optIdx]
                  ? localized.options[optIdx]
                  : canonicalOption;

              return (
                <TouchableOpacity
                  key={optIdx}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isDark
                        ? isSelected
                          ? 'rgba(59, 130, 246, 0.16)'
                          : '#141d2e'
                        : isSelected
                        ? '#eff6ff'
                        : '#ffffff',
                      borderColor: isSelected
                        ? '#3b82f6'
                        : isDark
                        ? '#26354a'
                        : '#e2e8f0',
                    },
                  ]}
                  onPress={() =>
                    handleSelectOption(
                      currentQ.id,
                      canonicalOption,
                      currentQ.questionType === 'multiple_choice'
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionPrefixCircle,
                      {
                        backgroundColor: isDark
                          ? isSelected
                            ? '#3b82f6'
                            : '#1e293b'
                          : isSelected
                          ? '#3b82f6'
                          : '#f1f5f9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionPrefixTxt,
                        {
                          color: isSelected
                            ? '#ffffff'
                            : isDark
                            ? '#94a3b8'
                            : '#475569',
                        },
                      ]}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isDark
                          ? isSelected
                            ? '#ffffff'
                            : '#e2e8f0'
                          : isSelected
                          ? '#1e3a8a'
                          : '#1e293b',
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {optionDisplayText}
                  </Text>

                  {isSelected && (
                    <View style={styles.optionCheckCircle}>
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 6. Compact Question Navigator: ‹ X / Y › */}
          <View style={styles.compactNavRow}>
            <TouchableOpacity
              style={[
                styles.arrowNavBtn,
                qIndex === 0 && styles.arrowNavBtnDisabled,
                { backgroundColor: isDark ? '#141d2e' : '#ffffff' },
              ]}
              onPress={() => goToQuestion(qIndex - 1)}
              disabled={qIndex === 0}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.7}
            >
              <ChevronLeft
                size={24}
                color={
                  qIndex === 0
                    ? isDark
                      ? '#334155'
                      : '#cbd5e1'
                    : '#3B82F6'
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.navCounterPill,
                {
                  backgroundColor: isDark ? '#141d2e' : '#ffffff',
                  borderColor: isDark ? '#26354a' : '#e2e8f0',
                },
              ]}
            >
              <Text
                style={[
                  styles.navCounterTxt,
                  { color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
              >
                {qIndex + 1} / {questions.length}
              </Text>
            </View>

            {isLastQuestion ? (
              <TouchableOpacity
                style={styles.submitActionPill}
                onPress={() => submitQuiz(false)}
                activeOpacity={0.85}
              >
                <Check size={14} color="#ffffff" strokeWidth={3} />
                <Text style={styles.submitActionPillTxt}>
                  {ui.completeQuiz}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.arrowNavBtn,
                  { backgroundColor: isDark ? '#141d2e' : '#ffffff' },
                ]}
                onPress={() => goToQuestion(qIndex + 1)}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.7}
              >
                <ChevronRight size={24} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* 3 & 4. Clean, Distraction-Free Header (No "Bible Quiz", No "Question 1/5") */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}
      >
        <TouchableOpacity
          onPress={handleExitAttempt}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <X size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quizMeta?.isDailyQuiz && quizMeta?.dailyDate
              ? getLocalizedDailyQuizTitle(quizMeta.dailyDate, quizLanguage)
              : `${categoryDisplayName} · ${difficulty.toUpperCase()} · L${level}`}
          </Text>
        </View>

        {/* Right Header: Member View Language Selector Pill + Timer */}
        <View style={styles.headerRightCol}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.8}
          >
            <Globe size={11} color="#ffffff" />
            <Text style={styles.langPillTxt}>{quizLanguageOption.nativeName}</Text>
          </TouchableOpacity>

          {secondsRemaining !== null && (
            <View style={styles.timerPill}>
              <Clock size={11} color="#ffffff" />
              <Text style={styles.timerTxt}>{formatTimeRemaining()}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Progress Bar Track */}
      <View
        style={[
          styles.progressBarTrack,
          { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
        ]}
      >
        <LinearGradient
          colors={['#3B82F6', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
        />
      </View>

      {/* 7. Swipeable Questions FlatList */}
      <FlatList
        ref={flatListRef}
        data={questions}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestionItem}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (page !== currentIndex && page >= 0 && page < questions.length) {
            setCurrentIndex(page);
          }
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Language Selector Modal */}
      <QuizLanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      {/* Luxury Alert Modal for Unanswered, Exit, Time's Up, and Errors */}
      <QuizAlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        badgeText={alertModal.badgeText}
        title={alertModal.title}
        message={alertModal.message}
        highlightText={alertModal.highlightText}
        highlightIcon={alertModal.highlightIcon}
        primaryBtnText={alertModal.primaryBtnText}
        primaryBtnGradient={alertModal.primaryBtnGradient}
        secondaryBtnText={alertModal.secondaryBtnText}
        onPrimary={alertModal.onPrimary}
        onSecondary={alertModal.onSecondary}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  langPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  timerTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressBarTrack: {
    height: 6,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    padding: 16,
  },
  questionCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  qRefRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  qRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qRefBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  optionsPrompt: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  optionPrefixCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionPrefixTxt: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  optionCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  compactNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  arrowNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  arrowNavBtnDisabled: {
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  navCounterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  navCounterTxt: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  submitActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitActionPillTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
