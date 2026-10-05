import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Unlock,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { QuizAttempt, BibleQuiz, QuizDifficulty } from '../../types/Quiz';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';

export default function BibleQuizResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizLanguage } = useQuizLanguage();
  const { isDark } = useTheme();

  const attempt: QuizAttempt = route?.params?.attempt;
  const quiz: BibleQuiz = route?.params?.quiz;
  const category: string | undefined = route?.params?.category;
  const categoryTitleParam: string = route?.params?.categoryTitle || category || 'Bible Quiz';
  const categoryImage: string | undefined = route?.params?.categoryImage;
  const difficulty: QuizDifficulty = route?.params?.difficulty || 'easy';
  const level: number | undefined = route?.params?.level;

  const ui = getQuizStrings(quizLanguage);
  const categoryDisplayName =
    category && ui.categories[category] ? ui.categories[category] : categoryTitleParam;

  // Theme tokens
  const bg = isDark ? '#0b1120' : '#f8fafc';
  const cardBg = isDark ? '#111d31' : '#ffffff';
  const cardBorder = isDark ? '#1f2e47' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const divider = isDark ? '#1f2e47' : '#e2e8f0';

  const isPassed = attempt?.passed;
  const hasNextLevel = Boolean(isPassed && level && level < 30);
  const nextLevel = level ? level + 1 : 2;

  // Bulletproof back navigation:
  // Prefer BibleQuizStages in the stack (new flow: Levels → Stages → Player → Result).
  // Fall back to BibleQuizLevels if Stages isn't present (legacy deep links).
  const handleBackToLevels = () => {
    const state = navigation.getState();
    const routes = state?.routes || [];

    // Try BibleQuizStages first (new flow)
    const stagesIndex = routes.findLastIndex
      ? routes.findLastIndex((r: any) => r.name === 'BibleQuizStages')
      : routes.map((r: any) => r.name).lastIndexOf('BibleQuizStages');

    if (stagesIndex >= 0) {
      const currentIndex = state.index ?? routes.length - 1;
      const popCount = currentIndex - stagesIndex;
      if (popCount > 0) {
        navigation.pop(popCount);
        return;
      }
    }

    // Fallback: try BibleQuizLevels
    const levelsIndex = routes.findLastIndex
      ? routes.findLastIndex((r: any) => r.name === 'BibleQuizLevels')
      : routes.map((r: any) => r.name).lastIndexOf('BibleQuizLevels');

    if (levelsIndex >= 0) {
      const currentIndex = state.index ?? routes.length - 1;
      const popCount = currentIndex - levelsIndex;
      if (popCount > 0) {
        navigation.pop(popCount);
        return;
      }
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (category) {
      navigation.replace('BibleQuizStages', {
        category,
        difficulty,
        categoryTitle: categoryTitleParam,
        categoryImage,
      });
    } else {
      navigation.replace('BibleQuizHome');
    }
  };

  // Intercept Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      handleBackToLevels();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [category, categoryTitleParam, categoryImage]);

  if (!attempt) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: bg }]}>
        <Text style={[styles.errorTxt, { color: textMuted }]}>No attempt data found.</Text>
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.navigate('BibleQuizHome')}
        >
          <Text style={styles.backHomeBtnTxt}>{ui.viewAllLevels}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const goToPlayer = (lvl: number) => {
    navigation.replace('BibleQuizPlayer', {
      category,
      categoryTitle: categoryTitleParam,
      categoryImage,
      difficulty,
      level: lvl,
    });
  };

  const handlePrimary = () => {
    if (!category || !level) return handleBackToLevels();
    goToPlayer(hasNextLevel ? nextLevel : level);
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.round(secs || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${r < 10 ? '0' : ''}${r}s`;
  };

  const safeBottomPadding =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 24) + 40
      : Math.max(insets.bottom, 20) + 30;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Signature WeChristian Curved Topper Card */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, { paddingTop: Math.max(insets.top, 14) + 8 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackToLevels}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {level ? `${categoryDisplayName} · ${ui.level} ${level}` : ui.quizCompleted}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Main Celebration Card */}
        <View style={[styles.celebrationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Heading */}
          <Text style={[styles.congratsTitle, { color: textPrimary }]}>
            {isPassed ? ui.wellDone : ui.goodEffort}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.congratsSubtitle, { color: textMuted }]}>
            {isPassed ? ui.passedLevelMsg(level || 1) : ui.failedLevelMsg}
          </Text>

          {/* Score Container */}
          <View style={styles.scoreContainer}>
            <Text
              style={[
                styles.scorePercentage,
                { color: isPassed ? '#10B981' : '#EF4444' },
              ]}
            >
              {attempt.percentage}%
            </Text>
            <Text style={[styles.scoreFraction, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
              {attempt.score} / {attempt.totalMarks} {ui.pointsEarned}
            </Text>
          </View>

          {/* Next Level Unlocked Banner */}
          {hasNextLevel ? (
            <View
              style={[
                styles.unlockedBanner,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
                },
              ]}
            >
              <Unlock size={15} color="#10B981" />
              <Text style={styles.unlockedBannerTxt}>{ui.levelUnlocked(nextLevel)}</Text>
            </View>
          ) : null}
        </View>

        {/* 2. Unified 3-Column Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.statCell}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' },
              ]}
            >
              <CheckCircle size={18} color="#10B981" />
            </View>
            <Text style={[styles.statVal, { color: textPrimary }]}>{attempt.correctCount}</Text>
            <Text style={[styles.statLbl, { color: textMuted }]} numberOfLines={1}>
              {ui.correct}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: divider }]} />

          <View style={styles.statCell}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2' },
              ]}
            >
              <XCircle size={18} color="#EF4444" />
            </View>
            <Text style={[styles.statVal, { color: textPrimary }]}>{attempt.wrongCount}</Text>
            <Text style={[styles.statLbl, { color: textMuted }]} numberOfLines={1}>
              {ui.incorrect}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: divider }]} />

          <View style={styles.statCell}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF' },
              ]}
            >
              <Clock size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.statVal, { color: textPrimary }]}>
              {formatTime(attempt.timeTakenSeconds)}
            </Text>
            <Text style={[styles.statLbl, { color: textMuted }]} numberOfLines={1}>
              {ui.time}
            </Text>
          </View>
        </View>

        {/* 3. Encouraging Scripture Card */}
        <View style={[styles.verseCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.verseAccent} />
          <Text style={[styles.verseTxt, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
            {ui.scriptureQuote}
          </Text>
        </View>

        {/* 4. Action Buttons Stack */}
        <View style={styles.actionsStack}>
          {/* Primary CTA: Continue or Retry */}
          <TouchableOpacity
            style={styles.primaryBtnWrap}
            onPress={handlePrimary}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={hasNextLevel ? ['#10B981', '#059669'] : ['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              {hasNextLevel ? null : <RotateCcw size={19} color="#ffffff" strokeWidth={2.4} />}
              <Text style={styles.primaryBtnTxt} numberOfLines={1}>
                {hasNextLevel ? ui.continueToLevel(nextLevel) : ui.retryLevel}
              </Text>
              {hasNextLevel ? <ArrowRight size={19} color="#ffffff" strokeWidth={2.4} /> : null}
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary CTA: Review Answers */}
          <TouchableOpacity
            style={[styles.actionCardBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={() => navigation.navigate('BibleQuizReview', { attempt, quiz })}
            activeOpacity={0.85}
          >
            <View style={styles.actionCardLeft}>
              <View
                style={[
                  styles.actionIconBubble,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF' },
                ]}
              >
                <BookOpen size={19} color="#3B82F6" strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionCardTxt, { color: textPrimary }]} numberOfLines={1}>
                {ui.reviewAnswers}
              </Text>
            </View>
            <ChevronRight size={18} color={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Tertiary CTA: View All Levels */}
          <TouchableOpacity
            style={[styles.actionCardBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={handleBackToLevels}
            activeOpacity={0.85}
          >
            <View style={styles.actionCardLeft}>
              <View
                style={[
                  styles.actionIconBubble,
                  { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#F5F3FF' },
                ]}
              >
                <LayoutGrid size={19} color="#8B5CF6" strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionCardTxt, { color: textPrimary }]} numberOfLines={1}>
                {ui.viewAllLevels}
              </Text>
            </View>
            <ChevronRight size={18} color={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTxt: { fontSize: 15, marginBottom: 14 },
  backHomeBtn: {
    backgroundColor: '#2b52a1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backHomeBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Signature WeChristian Header with Bottom Curves
  headerHero: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // 1. Celebration Card
  celebrationCard: {
    borderRadius: 22,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
  },
  congratsTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  congratsSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreFraction: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    marginTop: 14,
    borderWidth: 1,
  },
  unlockedBannerTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },

  // 2. Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    height: 38,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // 3. Verse Card
  verseCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  verseAccent: {
    width: 4,
    backgroundColor: '#3B82F6',
  },
  verseTxt: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  // 4. Action Buttons Stack
  actionsStack: {
    gap: 12,
    marginBottom: 8,
  },
  primaryBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryBtnTxt: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionCardBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  actionIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTxt: {
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
  },
});
