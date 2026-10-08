import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Check,
  Globe,
  Lock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { BibleQuiz, QuizAttempt } from '../../types/Quiz';
import { QuizService } from '../../services/QuizService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import QuizLanguageModal from './QuizLanguageModal';
import {
  getLocalizedDailyQuizTitle,
  getLocalizedDailyQuizDescription,
} from '../../constants/DailyQuizTranslations';
import {
  isQuizScheduledLocked,
  formatQuizTime,
  getQuizUnlockStatusText,
} from '../../utils/QuizScheduleUtils';
import QuizAlertModal from './QuizAlertModal';

export default function BibleQuizDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { churchId: contextChurchId, activeChurch } = useChurch();
  const { isDark } = useTheme();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  const [lockedAlertVisible, setLockedAlertVisible] = useState<boolean>(false);

  const passedQuiz: BibleQuiz | undefined = route?.params?.quiz;
  const targetQuizId: string | undefined = route?.params?.quizId || passedQuiz?.id;
  const targetChurchId: string | undefined =
    route?.params?.churchId ||
    passedQuiz?.churchId ||
    activeChurch?.id ||
    contextChurchId ||
    undefined;
  const [loadedQuiz, setLoadedQuiz] = useState<BibleQuiz | null>(passedQuiz || null);
  const quiz = loadedQuiz || passedQuiz;
  const [priorAttempt, setPriorAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(!passedQuiz && Boolean(targetQuizId));
  const [notFound, setNotFound] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // Live timer so the screen dynamically unlocks the moment the scheduled time arrives (e.g. 2:35 PM)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Strict lock check: Locked until scheduledDate & scheduledTime arrives
  const isScheduledLocked = isQuizScheduledLocked(quiz, now);

  useEffect(() => {
    if (passedQuiz) {
      setLoadedQuiz(passedQuiz);
      setNotFound(false);
      setLoading(false);
    } else if (targetQuizId) {
      setNotFound(false);
      if (!loadedQuiz && !quiz) {
        setLoading(true);
      }
      loadQuizDetail();
    }
  }, [targetQuizId, targetChurchId, quizLanguage, passedQuiz]);

  useFocusEffect(
    useCallback(() => {
      if (passedQuiz) {
        setLoadedQuiz(passedQuiz);
        setNotFound(false);
        setLoading(false);
      } else if (targetQuizId) {
        loadQuizDetail();
      }
    }, [targetQuizId, targetChurchId, user?.uid, quizLanguage, passedQuiz])
  );

  const loadQuizDetail = async () => {
    try {
      if (!targetQuizId) {
        if (!quiz && !passedQuiz) setNotFound(true);
        setLoading(false);
        return;
      }
      setNotFound(false);
      if (!quiz && !passedQuiz) setLoading(true);

      let q = await QuizService.getQuizById(targetQuizId, targetChurchId, quizLanguage);
      // Fallback: If not found with targetChurchId, attempt searching without church restriction
      if (!q) {
        q = await QuizService.getQuizById(targetQuizId, undefined, quizLanguage);
      }

      if (q) {
        setLoadedQuiz(q);
        setNotFound(false);
        if (user?.uid) {
          const attempt = await QuizService.getUserQuizAttempt(user.uid, targetQuizId, targetChurchId || q?.churchId);
          setPriorAttempt(attempt);
        }
      } else if (!quiz && !passedQuiz) {
        setNotFound(true);
      }
    } catch (e) {
      console.error('[BibleQuizDetailScreen] Error loading quiz:', e);
      if (!quiz && !passedQuiz) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={[styles.loadingTxt, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Loading quiz details...
        </Text>
      </View>
    );
  }

  if (notFound || !quiz) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
        <View style={styles.errorIconBox}>
          <AlertCircle size={36} color="#DC2626" />
        </View>
        <Text style={[styles.errorTitle, { color: isDark ? '#f8fafc' : '#0F172A' }]}>
          Quiz Unavailable
        </Text>
        <Text style={[styles.errorSubtitle, { color: isDark ? '#94a3b8' : '#64748B' }]}>
          This quiz could not be loaded or may have been removed.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.errorBtn, { backgroundColor: '#2563eb', paddingHorizontal: 20 }]}
            onPress={() => {
              setNotFound(false);
              setLoading(true);
              loadQuizDetail();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.errorBtnTxt}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ChurchQuizzes');
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.errorBtnTxt}>Back to Quizzes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Difficulty style config (clean & modern, zero emojis)
  const isEasy = quiz.difficulty === 'easy';
  const isMedium = quiz.difficulty === 'medium';
  const diffColor = isEasy ? '#10b981' : isMedium ? '#f59e0b' : '#3b82f6';
  const diffLabel = quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM';

  const totalQuestionsCount = quiz.totalQuestions || quiz.questions?.length || 10;
  const marksPerQuestion = quiz.marksPerQuestion || 1;
  const passingScore = quiz.passPercentage || 70;
  const isTimed = quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0;

  const handleStartQuiz = () => {
    if (isScheduledLocked) {
      setLockedAlertVisible(true);
      return;
    }
    navigation.navigate('BibleQuizPlayer', {
      quizId: quiz.id,
      churchId: quiz.churchId || targetChurchId,
      category: quiz.category,
      difficulty: quiz.difficulty,
      categoryTitle: quiz.title,
    });
  };

  const handleViewResults = () => {
    if (priorAttempt) {
      navigation.navigate('BibleQuizResult', { attempt: priorAttempt, quiz });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Signature Gradient Header */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 44) : (StatusBar.currentHeight ?? 24) + 10 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.75}
        >
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Quiz Details
        </Text>
        <TouchableOpacity
          style={styles.langPill}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.8}
        >
          <Globe size={13} color="#ffffff" />
          <Text style={styles.langPillTxt}>{quizLanguageOption.nativeName}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Overview Card ─────────────────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#141d2e' : '#ffffff',
              borderColor: isDark ? '#26354a' : '#e2e8f0',
            },
          ]}
        >
          {/* Top Badge Row */}
          <View style={styles.badgeRow}>
            {Boolean(quiz.category) && (
              <View style={[styles.categoryBadge, isDark && { backgroundColor: '#1e293b' }]}>
                <Text style={[styles.categoryBadgeTxt, isDark && { color: '#cbd5e1' }]}>
                  {quiz.category}
                </Text>
              </View>
            )}
            <View style={[styles.diffBadge, { backgroundColor: `${diffColor}18` }]}>
              <Text style={[styles.diffBadgeTxt, { color: diffColor }]}>{diffLabel}</Text>
            </View>
            {quiz.language && quiz.language !== 'en' && (
              <View style={[styles.langBadge, isDark && { backgroundColor: '#1e293b' }]}>
                <Text style={styles.langBadgeTxt}>{quiz.language.toUpperCase()}</Text>
              </View>
            )}
            {Boolean(priorAttempt) && (
              <View style={styles.completedHeroBadge}>
                <CheckCircle size={11} color="#10b981" />
                <Text style={styles.completedHeroBadgeTxt}>Completed</Text>
              </View>
            )}
            {isScheduledLocked && (
              <View style={[styles.langBadge, { backgroundColor: '#DBEAFE' }]}>
                <Clock size={11} color="#2563eb" />
                <Text style={[styles.langBadgeTxt, { color: '#2563eb' }]}>SCHEDULED</Text>
              </View>
            )}
          </View>

          {/* Quiz Title */}
          <Text style={[styles.quizTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {quiz.isDailyQuiz && quiz.dailyDate
              ? getLocalizedDailyQuizTitle(quiz.dailyDate, quizLanguage)
              : (quiz.translations?.[quizLanguage]?.title || quiz.title)}
          </Text>

          {/* Description */}
          <Text style={[styles.quizDesc, { color: isDark ? '#94a3b8' : '#475569' }]}>
            {quiz.isDailyQuiz && quiz.dailyDate
              ? getLocalizedDailyQuizDescription(quiz.dailyDate, quizLanguage)
              : (quiz.translations?.[quizLanguage]?.description ||
                quiz.description ||
                'Test and deepen your understanding of scripture with this curated Bible quiz. Study with prayer and devotion.')}
          </Text>

          {/* Scripture Focus Pill if configured */}
          {Boolean(quiz.book) && (
            <View style={[styles.scriptureFocusRow, isDark && { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.3)' }]}>
              <BookOpen size={15} color="#8b5cf6" />
              <Text style={styles.scriptureFocusTxt}>
                Focus: {quiz.book}{' '}
                {quiz.chapterStart
                  ? `Chapters ${quiz.chapterStart}${quiz.chapterEnd ? `–${quiz.chapterEnd}` : ''}`
                  : ''}
              </Text>
            </View>
          )}

          {/* Scheduled Availability Alert Box */}
          {isScheduledLocked && (
            <View style={styles.scheduledBannerBox}>
              <Clock size={16} color="#2563eb" />
              <Text style={styles.scheduledBannerTxt}>
                Scheduled Quiz: Automatically unlocks for congregation members on{' '}
                <Text style={{ fontWeight: '700' }}>{quiz.scheduledDate}</Text>
                {quiz.scheduledTime ? ` at ${formatQuizTime(quiz.scheduledTime, quiz.scheduledDate, now)}` : ''}.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Celebratory Completion Summary (if taken) ──────────── */}
        {priorAttempt && (
          <View
            style={[
              styles.attemptCard,
              {
                backgroundColor: priorAttempt.passed
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : '#ecfdf5'
                  : isDark
                  ? 'rgba(245, 158, 11, 0.12)'
                  : '#fffbeb',
                borderColor: priorAttempt.passed
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.3)'
                    : '#a7f3d0'
                  : isDark
                  ? 'rgba(245, 158, 11, 0.3)'
                  : '#fde68a',
              },
            ]}
          >
            <View style={styles.attemptTopRow}>
              <View
                style={[
                  styles.attemptIconBox,
                  { backgroundColor: priorAttempt.passed ? '#10b981' : '#f59e0b' },
                ]}
              >
                <Award size={18} color="#ffffff" />
              </View>

              <View style={styles.attemptInfoCol}>
                <View style={styles.attemptHeadingRow}>
                  <Text style={[styles.attemptTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Previous Score: {priorAttempt.score}/{priorAttempt.totalMarks} ({priorAttempt.percentage}%)
                  </Text>
                  <View
                    style={[
                      styles.passStatusPill,
                      { backgroundColor: priorAttempt.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.passStatusTxt,
                        { color: priorAttempt.passed ? '#059669' : '#d97706' },
                      ]}
                    >
                      {priorAttempt.passed ? 'Passed' : 'Completed'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.attemptSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {priorAttempt.passed
                    ? 'Excellent job! You successfully passed this quiz.'
                    : 'Quiz completed. Feel free to retry to improve your score!'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.attemptResultAction,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              ]}
              onPress={handleViewResults}
              activeOpacity={0.8}
            >
              <Text style={[styles.attemptResultActionTxt, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                View Detailed Answers & Results
              </Text>
              <ChevronRight size={14} color={isDark ? '#93c5fd' : '#1d4ed8'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Quiz Specifications & Rules Card ───────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Quiz Overview & Rules
          </Text>
        </View>

        <View
          style={[
            styles.specCard,
            {
              backgroundColor: isDark ? '#141d2e' : '#ffffff',
              borderColor: isDark ? '#26354a' : '#e2e8f0',
            },
          ]}
        >
          {/* 2x2 Metric Grid */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Total Questions */}
            <View style={styles.metricItem}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
                <HelpCircle size={18} color="#2563eb" />
              </View>
              <Text style={[styles.metricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {totalQuestionsCount} Questions
              </Text>
              <Text style={[styles.metricLbl, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Total Questions
              </Text>
            </View>

            {/* Metric 2: Time Limit */}
            <View style={styles.metricItem}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#1e293b' : '#fef3c7' }]}>
                <Clock size={18} color="#d97706" />
              </View>
              <Text style={[styles.metricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {isTimed ? `${quiz.timeLimitMinutes} Mins` : 'Untimed'}
              </Text>
              <Text style={[styles.metricLbl, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {isTimed ? 'Time Limit' : 'Self-Paced'}
              </Text>
            </View>

            {/* Metric 3: Passing Score */}
            <View style={styles.metricItem}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5' }]}>
                <CheckCircle size={18} color="#059669" />
              </View>
              <Text style={[styles.metricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {passingScore}%
              </Text>
              <Text style={[styles.metricLbl, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Passing Score
              </Text>
            </View>

            {/* Metric 4: Marks per Question */}
            <View style={styles.metricItem}>
              <View style={[styles.metricIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f5f3ff' }]}>
                <Award size={18} color="#7c3aed" />
              </View>
              <Text style={[styles.metricVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {marksPerQuestion} pt each
              </Text>
              <Text style={[styles.metricLbl, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Score Per Question
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.specDivider, { backgroundColor: isDark ? '#26354a' : '#f1f5f9' }]} />

          {/* Helpful Guidance Bullets */}
          <View style={styles.guidanceWrap}>
            <Text style={[styles.guidanceTitle, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
              Tips & Participation Guidelines
            </Text>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot}>
                <Check size={11} color="#2563eb" strokeWidth={3} />
              </View>
              <Text style={[styles.bulletTxt, { color: isDark ? '#94a3b8' : '#475569' }]}>
                Read each question and all 4 options thoroughly before submitting.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot}>
                <Check size={11} color="#2563eb" strokeWidth={3} />
              </View>
              <Text style={[styles.bulletTxt, { color: isDark ? '#94a3b8' : '#475569' }]}>
                Full scripture references and biblical context are revealed upon quiz completion.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot}>
                <Check size={11} color="#2563eb" strokeWidth={3} />
              </View>
              <Text style={[styles.bulletTxt, { color: isDark ? '#94a3b8' : '#475569' }]}>
                Your answers are saved automatically and recorded for church fellowship progress.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── Modern Floating Bottom Bar ─────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        {priorAttempt ? (
          <View style={styles.dualActionRow}>
            {/* Secondary Action: View Results */}
            <TouchableOpacity
              style={[
                styles.resultsSecondaryBtn,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                },
              ]}
              onPress={handleViewResults}
              activeOpacity={0.85}
            >
              <Award size={16} color={isDark ? '#93c5fd' : '#2563eb'} />
              <Text style={[styles.resultsSecondaryBtnTxt, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                View Results
              </Text>
            </TouchableOpacity>

            {/* Primary Action: Retry Quiz */}
            <TouchableOpacity
              style={styles.retryPrimaryBtn}
              onPress={handleStartQuiz}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientInner}
              >
                <RotateCcw size={16} color="#ffffff" />
                <Text style={styles.primaryActionTxt}>Retry Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : isScheduledLocked ? (
          <TouchableOpacity
            style={styles.startSingleBtn}
            onPress={() => setLockedAlertVisible(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#475569', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradientInner}
            >
              <Lock size={16} color="#ffffff" />
              <Text style={styles.primaryActionTxt}>
                {getQuizUnlockStatusText(quiz?.scheduledDate, quiz?.scheduledTime, now)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.startSingleBtn}
            onPress={handleStartQuiz}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradientInner}
            >
              <Play size={16} color="#ffffff" fill="#ffffff" />
              <Text style={styles.primaryActionTxt}>Start Bible Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <QuizLanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <QuizAlertModal
        visible={lockedAlertVisible}
        type="locked"
        badgeText="QUIZ SCHEDULED"
        title="Quiz Scheduled"
        message={`This quiz will start at ${formatQuizTime(quiz?.scheduledTime, quiz?.scheduledDate, now)} on ${quiz?.scheduledDate}.\n\nIt is currently locked and will become accessible to play from ${formatQuizTime(quiz?.scheduledTime, quiz?.scheduledDate, now)} onwards.`}
        highlightText={`Unlocks on ${quiz?.scheduledDate} at ${formatQuizTime(quiz?.scheduledTime, quiz?.scheduledDate, now)}`}
        highlightIcon="lock"
        primaryBtnText="Understood"
        onPrimary={() => setLockedAlertVisible(false)}
        onClose={() => setLockedAlertVisible(false)}
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
    padding: 20,
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  scrollArea: {
    flex: 1,
  },

  // ── Hero Card ─────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  categoryBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  diffBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  diffBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  langBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  langBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  completedHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedHeroBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginBottom: 6,
  },
  quizDesc: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  scriptureFocusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  scriptureFocusTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },

  // ── Completion / Attempt Summary ───────────────────────────────────────────
  attemptCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  attemptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attemptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attemptInfoCol: {
    flex: 1,
  },
  attemptHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  attemptTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  passStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  passStatusTxt: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  attemptSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  attemptResultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  attemptResultActionTxt: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Quiz Specifications & Rules ───────────────────────────────────────────
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  specCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    width: '47.5%',
    padding: 10,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLbl: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  specDivider: {
    height: 1,
    marginVertical: 14,
  },
  guidanceWrap: {
    paddingHorizontal: 4,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bulletDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletTxt: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // ── Bottom Action Bar ──────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  dualActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultsSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultsSecondaryBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  retryPrimaryBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  startSingleBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryActionTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Error State ────────────────────────────────────────────────────────────
  errorIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  errorBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  errorBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  langPillTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scheduledBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginTop: 12,
  },
  scheduledBannerTxt: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 17,
  },
  scheduledLockedBar: {
    borderRadius: 14,
    overflow: 'hidden',
  },
});
