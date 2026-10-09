import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Clock,
  BookOpen,
  Calendar,
  Play,
  Award,
  CheckCircle,
  RotateCcw,
  SlidersHorizontal,
  Lock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';
import {
  getLocalizedDailyQuizTitle,
  getLocalizedDailyQuizDescription,
} from '../../constants/DailyQuizTranslations';
import { QuizService } from '../../services/QuizService';
import { BibleQuiz, QuizAttempt } from '../../types/Quiz';
import { isQuizScheduledLocked, formatQuizTime } from '../../utils/QuizScheduleUtils';
import QuizLanguageModal from './QuizLanguageModal';
import QuizAlertModal from './QuizAlertModal';

type QuizDateFilter = 'all' | 'daily' | 'today' | 'week' | 'month' | 'year';

function getQuizDateString(quiz: BibleQuiz): string {
  if (quiz.dailyDate) return quiz.dailyDate;
  if (quiz.scheduledDate) return quiz.scheduledDate;
  if (quiz.createdAt) {
    if (typeof (quiz.createdAt as any).toDate === 'function') {
      const d = (quiz.createdAt as any).toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const d = new Date(quiz.createdAt as any);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return '';
}

export default function ChurchQuizzesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const { isDark } = useTheme();
  const { activeChurch } = useChurch();

  const [quizzes, setQuizzes] = useState<BibleQuiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<QuizDateFilter>('all');
  const [now, setNow] = useState<Date>(() => new Date());

  const [scheduledAlertModal, setScheduledAlertModal] = useState<{
    visible: boolean;
    quiz: BibleQuiz | null;
    unlockTimeStr: string;
  }>({
    visible: false,
    quiz: null,
    unlockTimeStr: '',
  });

  const showScheduledQuizAlert = (quiz: BibleQuiz) => {
    const unlockTimeStr = formatQuizTime(quiz.scheduledTime, quiz.scheduledDate, now);
    setScheduledAlertModal({
      visible: true,
      quiz,
      unlockTimeStr,
    });
  };

  // Live timer so scheduled quizzes unlock reactively the exact minute arrives
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const ui = getQuizStrings(quizLanguage);
  const churchId = activeChurch?.id || 'global';

  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [churchId, user?.uid, quizLanguage])
  );

  const loadQuizzes = async (isManualRefresh = false) => {
    try {
      // If we don't have quizzes yet, show loader.
      // If we already have quizzes, load silently in background for instant responsiveness.
      if (quizzes.length === 0 && !isManualRefresh) {
        setLoading(true);
      }

      const [list, attempts] = await Promise.all([
        QuizService.getQuizzes(churchId, {
          isAdmin: false,
          forceRefresh: isManualRefresh,
          targetLanguage: quizLanguage,
        }),
        user?.uid
          ? QuizService.getUserAttemptsMap(user.uid, churchId, isManualRefresh)
          : Promise.resolve({} as Record<string, QuizAttempt>),
      ]);

      setQuizzes(list);
      setUserAttempts(attempts);

      // Register device notifications for upcoming scheduled quizzes so members get notified at start time
      list.forEach(q => {
        if (q.status === 'scheduled') {
          QuizService.scheduleDeviceQuizNotification(q).catch(() => {});
        }
      });
    } catch (err) {
      console.warn('[ChurchQuizzesScreen] Error loading quizzes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizzes(true);
  };

  // Date range computations for filter chips
  const dateRanges = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    return {
      todayStr,
      startOfWeekStr,
      endOfWeekStr,
      currentYearMonth,
      currentYear,
    };
  }, []);

  const filterCounts = useMemo(() => {
    const { todayStr, startOfWeekStr, endOfWeekStr, currentYearMonth, currentYear } = dateRanges;
    let dailyCount = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;

    quizzes.forEach(q => {
      const isDaily = Boolean(q.isDailyQuiz || q.id?.startsWith('daily_') || q.category?.toLowerCase() === 'daily quiz');
      if (isDaily) dailyCount++;

      const qDate = getQuizDateString(q);
      if (!qDate) {
        yearCount++;
        return;
      }
      if (qDate === todayStr) todayCount++;
      if (qDate >= startOfWeekStr && qDate <= endOfWeekStr) weekCount++;
      if (qDate.startsWith(currentYearMonth)) monthCount++;
      if (qDate.startsWith(currentYear)) yearCount++;
    });

    return {
      all: quizzes.length,
      daily: dailyCount,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      year: yearCount,
    };
  }, [quizzes, dateRanges]);

  const filteredQuizzes = useMemo(() => {
    if (selectedFilter === 'all') return quizzes;
    if (selectedFilter === 'daily') {
      return quizzes.filter(q => Boolean(q.isDailyQuiz || q.id?.startsWith('daily_') || q.category?.toLowerCase() === 'daily quiz'));
    }

    const { todayStr, startOfWeekStr, endOfWeekStr, currentYearMonth, currentYear } = dateRanges;

    return quizzes.filter(q => {
      const qDate = getQuizDateString(q);
      if (!qDate) return selectedFilter === 'year';
      if (selectedFilter === 'today') return qDate === todayStr;
      if (selectedFilter === 'week') return qDate >= startOfWeekStr && qDate <= endOfWeekStr;
      if (selectedFilter === 'month') return qDate.startsWith(currentYearMonth);
      if (selectedFilter === 'year') return qDate.startsWith(currentYear);
      return true;
    });
  }, [quizzes, selectedFilter, dateRanges]);

  const filterTabs: Array<{ id: QuizDateFilter; label: string; count: number }> = [
    { id: 'all', label: ui.filterAll, count: filterCounts.all },
    { id: 'daily', label: quizLanguage === 'te' ? 'రోజువారీ క్విజ్ 📅' : 'Daily Quiz 📅', count: filterCounts.daily },
    { id: 'today', label: ui.filterToday, count: filterCounts.today },
    { id: 'week', label: ui.filterThisWeek, count: filterCounts.week },
    { id: 'month', label: ui.filterThisMonth, count: filterCounts.month },
    { id: 'year', label: ui.filterThisYear, count: filterCounts.year },
  ];

  // Flow: Select Quiz → Detail → Start Quiz
  const handleSelectQuiz = (quiz: BibleQuiz) => {
    if (isQuizScheduledLocked(quiz, now)) {
      showScheduledQuizAlert(quiz);
      return;
    }
    navigation.navigate('BibleQuizDetail', { quiz });
  };

  // Direct Start / Retry Action
  const handleStartQuizDirect = (quiz: BibleQuiz) => {
    if (isQuizScheduledLocked(quiz, now)) {
      showScheduledQuizAlert(quiz);
      return;
    }
    navigation.navigate('BibleQuizPlayer', {
      quizId: quiz.id,
      category: quiz.category,
      difficulty: quiz.difficulty,
      categoryTitle: quiz.title,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Header */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {ui.churchQuizzes}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.8}
          >
            <Globe size={13} color="#ffffff" />
            <Text style={styles.langPillTxt}>{quizLanguageOption.nativeName}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Available Quizzes List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          const totalQuizzes = quizzes.length;
          const completedCount = quizzes.filter(q => Boolean(userAttempts[q.id])).length;
          const availableCount = Math.max(0, totalQuizzes - completedCount);
          const isAllDone = totalQuizzes > 0 && availableCount === 0;

          return (
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {isAllDone ? ui.churchQuizzes : ui.availableQuizzes}
              </Text>
              <View style={[styles.sectionBadgeWrap, isAllDone && styles.sectionBadgeWrapCompleted]}>
                <Text style={[styles.sectionSubBadge, isAllDone && styles.sectionSubBadgeCompleted]}>
                  {isAllDone ? `✓ ${ui.completed} (${completedCount})` : `${availableCount}`}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Date Filter Chips (All, Today, This Week, This Month, This Year) */}
        <View style={styles.filterBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterTabs.map(tab => {
              const isSelected = selectedFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.filterChip,
                    isDark && styles.filterChipDark,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isDark && styles.filterChipTextDark,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.filterBadge,
                      isDark && styles.filterBadgeDark,
                      isSelected && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        isSelected && styles.filterBadgeTextActive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2b52a1" />
          </View>
        ) : quizzes.length === 0 ? (
          <View style={[styles.emptyCard, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
            <BookOpen size={28} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {ui.noQuizzesAvailable}
            </Text>
            <Text style={styles.emptySub}>
              {ui.noQuizzesAvailableSub}
            </Text>
          </View>
        ) : filteredQuizzes.length === 0 ? (
          <View style={[styles.emptyCard, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
            <Calendar size={28} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {ui.noQuizzesAvailable}
            </Text>
            <Text style={styles.emptySub}>
              {ui.noQuizzesAvailableSub}
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={styles.resetFilterBtnTxt}>{ui.filterAll}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredQuizzes.map(quiz => {
            const isEasy = quiz.difficulty === 'easy';
            const isMedium = quiz.difficulty === 'medium';
            const diffColor = isEasy ? '#2563eb' : isMedium ? '#d97706' : '#059669';
            const attempt = userAttempts[quiz.id];

            const isScheduledLocked = isQuizScheduledLocked(quiz, now);

            return (
              <TouchableOpacity
                key={quiz.id}
                style={[
                  styles.quizCard,
                  isDark && { backgroundColor: '#131e36', borderColor: 'rgba(59, 130, 246, 0.22)' },
                ]}
                onPress={() => handleSelectQuiz(quiz)}
                activeOpacity={0.88}
              >
                {/* Top Badge Row: Clean & Uncluttered */}
                <View style={styles.quizCardTop}>
                  <View style={[styles.diffPill, { backgroundColor: `${diffColor}18` }]}>
                    <Text style={[styles.diffPillTxt, { color: diffColor }]}>
                      {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
                    </Text>
                  </View>

                  {isScheduledLocked && (
                    <View style={styles.scheduledPill}>
                      <Clock size={10} color="#2563eb" />
                      <Text style={styles.scheduledPillTxt}>
                        {quiz.scheduledDate}{quiz.scheduledTime ? ` · ${formatQuizTime(quiz.scheduledTime, quiz.scheduledDate, now)}` : ''}
                      </Text>
                    </View>
                  )}

                  {attempt ? (
                    <View style={styles.completedCardBadge}>
                      <CheckCircle size={10} color="#10b981" />
                      <Text style={styles.completedCardBadgeTxt}>
                        {attempt.percentage !== undefined ? `${ui.completed} · ${attempt.percentage}%` : ui.completed}
                      </Text>
                    </View>
                  ) : quiz.timeLimitMinutes > 0 ? (
                    <View style={styles.metaTimeChip}>
                      <Clock size={11} color="#64748b" />
                      <Text style={styles.metaTimeChipTxt}>{quiz.timeLimitMinutes}m</Text>
                    </View>
                  ) : null}
                </View>

                {/* Title & Description */}
                <Text style={[styles.quizTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={2}>
                  {quiz.isDailyQuiz && quiz.dailyDate
                    ? getLocalizedDailyQuizTitle(quiz.dailyDate, quizLanguage)
                    : (quiz.translations?.[quizLanguage]?.title || quiz.title)}
                </Text>
                {Boolean(quiz.description && quiz.description !== quiz.title) && (
                  <Text style={[styles.quizDesc, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>
                    {quiz.isDailyQuiz && quiz.dailyDate
                      ? getLocalizedDailyQuizDescription(quiz.dailyDate, quizLanguage)
                      : (quiz.translations?.[quizLanguage]?.description || quiz.description)}
                  </Text>
                )}

                {/* Footer Meta & Actions */}
                <View style={styles.quizCardFooter}>
                  <View style={styles.metaQCountRow}>
                    <BookOpen size={13} color="#64748b" />
                    <Text style={styles.metaQCountTxt}>
                      {ui.questionsCount(quiz.totalQuestions || quiz.questions?.length || 0)}
                    </Text>
                    {Boolean(quiz.scheduledDate) && (
                      <>
                        <Text style={styles.metaDot}>·</Text>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.metaQCountTxt}>{quiz.scheduledDate}</Text>
                      </>
                    )}
                  </View>

                  {attempt ? (
                    <View style={styles.completedActionsRow}>
                      <TouchableOpacity
                        style={[styles.resultsBtnCompact, isDark && { borderColor: 'rgba(255, 255, 255, 0.2)' }]}
                        onPress={() => navigation.navigate('BibleQuizResult', { attempt, quiz })}
                        activeOpacity={0.82}
                      >
                        <Award size={12} color={isDark ? '#93c5fd' : '#2563eb'} />
                        <Text style={[styles.resultsBtnTxt, { color: isDark ? '#93c5fd' : '#2563eb' }]}>{ui.results}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.retryBtnCompact}
                        onPress={() => handleStartQuizDirect(quiz)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={['#10b981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.retryBtnGradient}
                        >
                          <RotateCcw size={11} color="#ffffff" />
                          <Text style={styles.startBtnTxt}>{ui.retry}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ) : isScheduledLocked ? (
                    <TouchableOpacity
                      style={styles.scheduledLockBtnCompact}
                      onPress={() => showScheduledQuizAlert(quiz)}
                      activeOpacity={0.8}
                    >
                      <Lock size={11} color="#475569" />
                      <Text style={styles.scheduledLockBtnTxt}>Scheduled</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.startBtnCompact}
                      onPress={() => handleStartQuizDirect(quiz)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#2563eb', '#1d4ed8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.startBtnGradient}
                      >
                        <Play size={11} color="#ffffff" fill="#ffffff" />
                        <Text style={styles.startBtnTxt}>{ui.start}</Text>
                        <ChevronRight size={13} color="#ffffff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <QuizLanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <QuizAlertModal
        visible={scheduledAlertModal.visible}
        type="locked"
        badgeText="QUIZ SCHEDULED"
        title="Quiz Scheduled"
        message={`This quiz will start at ${scheduledAlertModal.unlockTimeStr} on ${scheduledAlertModal.quiz?.scheduledDate}.\n\nIt is currently locked and will become accessible to play from ${scheduledAlertModal.unlockTimeStr} onwards.`}
        highlightText={`Unlocks on ${scheduledAlertModal.quiz?.scheduledDate} at ${scheduledAlertModal.unlockTimeStr}`}
        highlightIcon="lock"
        primaryBtnText="View Details"
        secondaryBtnText="OK"
        onPrimary={() => {
          const q = scheduledAlertModal.quiz;
          setScheduledAlertModal({ visible: false, quiz: null, unlockTimeStr: '' });
          if (q) navigation.navigate('BibleQuizDetail', { quiz: q });
        }}
        onSecondary={() => {
          setScheduledAlertModal({ visible: false, quiz: null, unlockTimeStr: '' });
        }}
        onClose={() => {
          setScheduledAlertModal({ visible: false, quiz: null, unlockTimeStr: '' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  langPillTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionBadgeWrap: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionSubBadge: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quizCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  diffPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  diffPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  catPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catPillTxt: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
  langBadgePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
  },
  metaTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaTimeChipTxt: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  quizTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 24,
  },
  quizDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
  },
  quizCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
  },
  metaQCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaQCountTxt: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  metaDot: {
    color: '#94a3b8',
    fontSize: 12,
    marginHorizontal: 2,
  },
  startBtnCompact: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  startBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBadgeWrapCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 0.5,
  },
  sectionSubBadgeCompleted: {
    color: '#059669',
    fontWeight: '800',
  },
  completedCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  completedCardBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  completedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsBtnCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  resultsBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  retryBtnCompact: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
  },
  filterBarContainer: {
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingRight: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterChipDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextDark: {
    color: '#cbd5e1',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterBadgeDark: {
    backgroundColor: '#334155',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  resetFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignSelf: 'center',
  },
  resetFilterBtnTxt: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  scheduledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  scheduledPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  scheduledLockBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  scheduledLockBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
});
