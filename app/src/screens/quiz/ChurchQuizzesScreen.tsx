import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';
import { QuizService } from '../../services/QuizService';
import { BibleQuiz, QuizAttempt } from '../../types/Quiz';
import QuizLanguageModal from './QuizLanguageModal';

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

  const ui = getQuizStrings(quizLanguage);
  const churchId = activeChurch?.id || 'global';

  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [churchId, user?.uid])
  );

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch all published/scheduled quizzes available to this member
      const list = await QuizService.getQuizzes(churchId, {
        isAdmin: false,
      });
      setQuizzes(list);

      // Fetch member's past attempts to show Completed badges and scores
      if (user?.uid) {
        const attempts = await QuizService.getUserAttemptsMap(user.uid, churchId);
        setUserAttempts(attempts);
      }
    } catch (err) {
      console.warn('[ChurchQuizzesScreen] Error loading quizzes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizzes();
  };

  // Flow: Select Quiz → Detail → Start Quiz
  const handleSelectQuiz = (quiz: BibleQuiz) => {
    navigation.navigate('BibleQuizDetail', { quiz });
  };

  // Direct Start / Retry Action
  const handleStartQuizDirect = (quiz: BibleQuiz) => {
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
              Church Quizzes
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
                {isAllDone ? 'Church Quizzes' : 'Available Quizzes'}
              </Text>
              <View style={[styles.sectionBadgeWrap, isAllDone && styles.sectionBadgeWrapCompleted]}>
                <Text style={[styles.sectionSubBadge, isAllDone && styles.sectionSubBadgeCompleted]}>
                  {isAllDone ? `✓ Completed (${completedCount})` : `${availableCount}`}
                </Text>
              </View>
            </View>
          );
        })()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2b52a1" />
          </View>
        ) : quizzes.length === 0 ? (
          <View style={[styles.emptyCard, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
            <BookOpen size={28} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              No Quizzes Available
            </Text>
            <Text style={styles.emptySub}>
              There are currently no scheduled church quizzes. Please check back soon!
            </Text>
          </View>
        ) : (
          quizzes.map(quiz => {
            const isEasy = quiz.difficulty === 'easy';
            const isMedium = quiz.difficulty === 'medium';
            const diffColor = isEasy ? '#2563eb' : isMedium ? '#d97706' : '#059669';
            const attempt = userAttempts[quiz.id];

            return (
              <TouchableOpacity
                key={quiz.id}
                style={[
                  styles.quizCard,
                  isDark && { backgroundColor: '#111827', borderColor: '#1f2937' },
                ]}
                onPress={() => handleSelectQuiz(quiz)}
                activeOpacity={0.88}
              >
                {/* Top Badge Row */}
                <View style={styles.quizCardTop}>
                  <View style={styles.quizBadgeRow}>
                    <View style={[styles.diffPill, { backgroundColor: `${diffColor}15` }]}>
                      <Text style={[styles.diffPillTxt, { color: diffColor }]}>
                        {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
                      </Text>
                    </View>
                    {Boolean(quiz.category) && (
                      <View style={styles.catPill}>
                        <Text style={styles.catPillTxt}>{quiz.category}</Text>
                      </View>
                    )}
                    {Boolean(quiz.language && quiz.language !== 'en') && (
                      <View style={styles.langBadgePill}>
                        <Text style={styles.langBadgeTxt}>{quiz.language.toUpperCase()}</Text>
                      </View>
                    )}
                    {attempt && (
                      <View style={styles.completedCardBadge}>
                        <CheckCircle size={10} color="#10b981" />
                        <Text style={styles.completedCardBadgeTxt}>
                          {attempt.percentage !== undefined ? `Completed · ${attempt.percentage}%` : 'Completed'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaTimeChip}>
                    <Clock size={11} color="#64748b" />
                    <Text style={styles.metaTimeChipTxt}>
                      {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : 'Untimed'}
                    </Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={[styles.quizTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {quiz.title}
                </Text>
                {Boolean(quiz.description) && (
                  <Text style={styles.quizDesc} numberOfLines={2}>
                    {quiz.description}
                  </Text>
                )}

                {/* Footer Meta & Actions */}
                <View style={styles.quizCardFooter}>
                  <View style={styles.metaQCountRow}>
                    <BookOpen size={13} color="#64748b" />
                    <Text style={styles.metaQCountTxt}>
                      {quiz.totalQuestions || quiz.questions?.length || 0} Questions
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
                        <Text style={[styles.resultsBtnTxt, { color: isDark ? '#93c5fd' : '#2563eb' }]}>Results</Text>
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
                          <Text style={styles.startBtnTxt}>Retry</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
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
                        <Text style={styles.startBtnTxt}>Start</Text>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quizCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  diffPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffPillTxt: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  quizDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 6,
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
});
