import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Lock,
  Check,
  Play,
  Star,
  Award,
  Globe,
  Sparkles,
  Crown,
  BookOpen,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { QuizDifficulty, MemberCategoryProgress } from '../../types/Quiz';
import { BibleQuizBank } from '../../services/BibleQuizBank';
import { QUIZ_CATEGORIES } from '../../constants/BibleQuizCategories';
import { useAuth } from '../../context/AuthContext';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';
import QuizLanguageModal from './QuizLanguageModal';
import QuizAlertModal from './QuizAlertModal';

export default function BibleQuizStagesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const { isDark } = useTheme();

  const category: string = route?.params?.category || 'Family';
  const categoryTitleParam: string = route?.params?.categoryTitle || category;
  const routeImage: string = route?.params?.categoryImage || '';
  const categoryObj = QUIZ_CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
  );
  const categoryImage: string = routeImage || categoryObj?.imageUrl || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800';
  const difficulty: QuizDifficulty = route?.params?.difficulty || 'easy';

  const [progress, setProgress] = useState<MemberCategoryProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  const [lockedModal, setLockedModal] = useState<{
    visible: boolean;
    levelNumber: number;
  }>({
    visible: false,
    levelNumber: 1,
  });

  const totalLevels = 30;
  const ui = getQuizStrings(quizLanguage);
  const categoryDisplayName = ui.categories[category] || categoryTitleParam;

  // Difficulty display config
  const difficultyConfig = {
    easy:   { label: ui.easy,   color: '#3b82f6', gradientColors: ['#1d4ed8', '#3b82f6'] as [string, string] },
    medium: { label: ui.medium, color: '#f59e0b', gradientColors: ['#b45309', '#f59e0b'] as [string, string] },
    hard:   { label: ui.hard,   color: '#10b981', gradientColors: ['#064e3b', '#10b981'] as [string, string] },
  };
  const diffCfg = difficultyConfig[difficulty];

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, [category, difficulty, user?.uid])
  );

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await BibleQuizBank.getMemberCategoryProgress(
        user?.uid || 'guest',
        category,
        difficulty
      );
      setProgress(data);
    } catch (e) {
      console.warn('Error loading level progress:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLevel = (lvlNum: number) => {
    const isUnlocked = BibleQuizBank.isLevelUnlocked(lvlNum, progress);
    if (!isUnlocked) {
      setLockedModal({ visible: true, levelNumber: lvlNum });
      return;
    }
    navigation.navigate('BibleQuizPlayer', {
      category,
      difficulty,
      level: lvlNum,
      categoryTitle: categoryDisplayName,
    });
  };

  const unlockedLevel = progress?.unlockedLevel || 1;
  const completedCount = Object.keys(progress?.completedLevels || {}).length;
  const completionPercent = Math.round((completedCount / totalLevels) * 100);

  const stages = [
    {
      id: 'foundation',
      title: ui.stage1,
      subTitle: quizLanguage === 'te' ? 'ప్రాథమిక వాక్య సత్యాలు' : 'Scripture Foundations',
      range: '01 - 10',
      start: 1,
      end: 10,
      icon: BookOpen,
    },
    {
      id: 'growth',
      title: ui.stage2,
      subTitle: quizLanguage === 'te' ? 'ఆత్మీయ జ్ఞానాభివృద్ధి' : 'Spiritual Growth',
      range: '11 - 20',
      start: 11,
      end: 20,
      icon: Sparkles,
    },
    {
      id: 'mastery',
      title: ui.stage3,
      subTitle: quizLanguage === 'te' ? 'పరిపూర్ణ లేఖన సాధన' : 'Scripture Mastery',
      range: '21 - 30',
      start: 21,
      end: 30,
      icon: Crown,
    },
  ];

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryDisplayName}
            </Text>
            <View style={[styles.headerDiffBadge, { backgroundColor: `${diffCfg.color}30` }]}>
              <View style={[styles.headerDiffDot, { backgroundColor: diffCfg.color }]} />
              <Text style={[styles.headerDiffTxt, { color: diffCfg.color }]}>
                {diffCfg.label.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

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
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero with progress */}
        <View style={styles.curvedHeroWrapper}>
          <ImageBackground
            source={{
              uri: categoryImage || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
            }}
            style={styles.curvedHeroImageBg}
            imageStyle={styles.curvedHeroImage}
          >
            <LinearGradient
              colors={['rgba(11, 17, 32, 0.15)', 'rgba(11, 17, 32, 0.75)', 'rgba(11, 17, 32, 0.96)']}
              locations={[0, 0.45, 1]}
              style={styles.curvedHeroOverlay}
            >
              {/* Category Name & Difficulty & Completion Badge on the SAME LINE */}
              <View style={styles.heroTitleLineRow}>
                <View style={styles.heroTitleWithBadge}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {categoryDisplayName}
                  </Text>
                  <LinearGradient
                    colors={diffCfg.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.heroDiffPillInline}
                  >
                    <Text style={styles.heroDiffTxt}>{diffCfg.label.toUpperCase()}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.heroPillTrophy}>
                  <Award size={12} color="#fbbf24" />
                  <Text style={styles.heroPillTrophyTxt}>{completionPercent}% {ui.completed}</Text>
                </View>
              </View>

              <Text style={styles.heroSub}>
                {quizLanguage === 'te'
                  ? '30 స్థాయిల ద్వారా దేవుని వాక్యాన్ని ధ్యానిస్తూ ముందుకు సాగండి.'
                  : 'Journey through 30 levels of faith & Scripture knowledge.'}
              </Text>

              {/* Progress bar */}
              <View style={styles.heroProgressTrack}>
                <LinearGradient
                  colors={diffCfg.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.heroProgressFill, { width: `${Math.max(4, completionPercent)}%` }]}
                />
              </View>
              <View style={styles.heroProgressMetaRow}>
                <Text style={styles.heroProgressTxt}>
                  {ui.level} {unlockedLevel} / {totalLevels}
                </Text>
                <Text style={styles.heroProgressSubTxt}>
                  {completedCount}/{totalLevels} {ui.passed}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Stage section label */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            {quizLanguage === 'te' ? 'దశలు ఎంచుకోండి' : 'Select Stage'}
          </Text>
          <View style={[styles.totalBadge, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <Text style={[styles.totalBadgeTxt, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {completedCount}/{totalLevels} {ui.done}
            </Text>
          </View>
        </View>

        {/* Loading or Stages Grid */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={diffCfg.color} />
            <Text style={[styles.loadingTxt, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {quizLanguage === 'te' ? 'స్థాయిలు లోడ్ అవుతున్నాయి...' : 'Loading levels...'}
            </Text>
          </View>
        ) : (
          <View style={styles.stagesWrap}>
            {stages.map((stage, stageIdx) => {
              const stageLevels = Array.from(
                { length: stage.end - stage.start + 1 },
                (_, i) => stage.start + i
              );
              const stageCompletedCount = stageLevels.filter(
                (lNum) => Boolean(progress?.completedLevels?.[lNum])
              ).length;
              const stageAllDone = stageCompletedCount === stageLevels.length;
              const stagePercent = Math.round((stageCompletedCount / stageLevels.length) * 100);
              const StageIcon = stage.icon;

              // The next playable level in this stage (first unlocked level that is not completed)
              const stageActiveLevel = stageLevels.find(
                (lNum) => BibleQuizBank.isLevelUnlocked(lNum, progress) && !progress?.completedLevels?.[lNum]
              );

              // Per-stage accent styling
              const stageAccent = stageIdx === 0
                ? {
                    glow: '#3b82f6',
                    glowSub: '#60a5fa',
                    gradient: ['#1e40af', '#2563eb', '#3b82f6'] as [string, string, string],
                    headerTint: isDark ? 'rgba(37, 99, 235, 0.14)' : 'rgba(37, 99, 235, 0.08)',
                  }
                : stageIdx === 1
                ? {
                    glow: '#10b981',
                    glowSub: '#34d399',
                    gradient: ['#065f46', '#059669', '#10b981'] as [string, string, string],
                    headerTint: isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)',
                  }
                : {
                    glow: '#f59e0b',
                    glowSub: '#fbbf24',
                    gradient: ['#854d0e', '#d97706', '#f59e0b'] as [string, string, string],
                    headerTint: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.08)',
                  };

              return (
                <View
                  key={stage.id}
                  style={[
                    styles.stageCard,
                    {
                      backgroundColor: isDark ? '#111927' : '#ffffff',
                      borderColor: stageAllDone
                        ? (isDark ? 'rgba(16, 185, 129, 0.5)' : '#10b981')
                        : (isDark ? stageAccent.glow + '40' : stageAccent.glow + '55'),
                    },
                  ]}
                >
                  {/* Stage Card Header — Refined & Cohesive */}
                  <View
                    style={[
                      styles.stageHeaderClean,
                      { backgroundColor: stageAccent.headerTint },
                    ]}
                  >
                    {/* Left: Stage Icon Squircle */}
                    <LinearGradient
                      colors={stageAccent.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.stageIconSquircle}
                    >
                      <StageIcon size={18} color="#ffffff" />
                    </LinearGradient>

                    {/* Center: Stage Info */}
                    <View style={styles.stageInfoCol}>
                      <Text style={[styles.stageTagMini, { color: stageAccent.glowSub }]}>
                        STAGE {String(stageIdx + 1).padStart(2, '0')}
                      </Text>
                      <Text style={[styles.stageTitleTxt, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                        {stage.title}
                      </Text>
                      <Text style={[styles.stageSubTxt, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                        {`${stage.subTitle} · ${stage.range}`}
                      </Text>
                    </View>

                    {/* Right: Progress Badge */}
                    <View
                      style={[
                        styles.stageStatusBadge,
                        stageAllDone
                          ? { backgroundColor: 'rgba(16, 185, 129, 0.18)', borderColor: '#10b981' }
                          : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9', borderColor: stageAccent.glow + '40' },
                      ]}
                    >
                      {stageAllDone ? (
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      ) : null}
                      <Text
                        style={[
                          styles.stageStatusBadgeTxt,
                          {
                            color: stageAllDone
                              ? '#10b981'
                              : (isDark ? '#e2e8f0' : '#1e293b'),
                          },
                        ]}
                      >
                        {stageAllDone
                          ? (quizLanguage === 'te' ? 'పూర్తయింది' : 'Completed')
                          : `${stageCompletedCount}/${stageLevels.length}`}
                      </Text>
                    </View>
                  </View>

                  {/* Slim Glowing Progress Divider */}
                  <View style={[styles.stageProgressDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0' }]}>
                    <View
                      style={[
                        styles.stageProgressDividerFill,
                        {
                          width: `${Math.max(stagePercent > 0 ? 5 : 0, stagePercent)}%`,
                          backgroundColor: stageAllDone ? '#10b981' : stageAccent.glow,
                        },
                      ]}
                    />
                  </View>

                  {/* Card Body: 5x2 Levels Grid */}
                  <View style={styles.stageBody}>
                    <View style={styles.levelsGrid}>
                      {stageLevels.map((levelNum) => {
                        const isUnlocked = BibleQuizBank.isLevelUnlocked(levelNum, progress);
                        const completedData = progress?.completedLevels?.[levelNum];
                        const isCompleted = Boolean(completedData);
                        const isCurrent = isUnlocked && !isCompleted && levelNum === stageActiveLevel;
                        const paddedNum = levelNum < 10 ? `0${levelNum}` : `${levelNum}`;

                        return (
                          <TouchableOpacity
                            key={levelNum}
                            style={[
                              styles.levelCard,
                              isCompleted && [
                                styles.levelCardCompleted,
                                {
                                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
                                  borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#10B981',
                                },
                              ],
                              isCurrent && [
                                styles.levelCardCurrent,
                                {
                                  backgroundColor: isDark
                                    ? `${stageAccent.glow}26`
                                    : `${stageAccent.glow}18`,
                                  borderColor: stageAccent.glow,
                                  shadowColor: stageAccent.glow,
                                },
                              ],
                              !isUnlocked && [
                                styles.levelCardLocked,
                                {
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
                                },
                              ],
                            ]}
                            onPress={() => handleSelectLevel(levelNum)}
                            activeOpacity={isUnlocked ? 0.75 : 0.85}
                          >
                            {isCompleted ? (
                              <View style={styles.levelCardInner}>
                                <View style={styles.completedBadgeWrap}>
                                  <Check size={10} color="#10B981" strokeWidth={3} />
                                </View>
                                <Text style={[styles.levelNumTxt, { color: isDark ? '#34d399' : '#059669' }]}>
                                  {paddedNum}
                                </Text>
                                <View style={styles.starRow}>
                                  {Array.from({ length: completedData?.stars || 1 }).map((_, sIdx) => (
                                    <Star key={sIdx} size={6} color="#fbbf24" fill="#fbbf24" />
                                  ))}
                                </View>
                              </View>
                            ) : isCurrent ? (
                              <View style={styles.levelCardInner}>
                                <View style={[styles.currentPlayIconCircle, { backgroundColor: stageAccent.glow }]}>
                                  <Play size={9} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
                                </View>
                                <Text style={[styles.levelNumTxt, { color: stageAccent.glow, fontWeight: '900' }]}>
                                  {paddedNum}
                                </Text>
                                <View style={[styles.playBadgePill, { backgroundColor: stageAccent.glow }]}>
                                  <Text style={styles.playBadgeTxt}>{ui.play}</Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.levelCardInner}>
                                <Lock size={12} color={isDark ? '#475569' : '#94a3b8'} strokeWidth={2.2} />
                                <Text style={[styles.lockedNumTxt, { color: isDark ? '#475569' : '#94a3b8' }]}>
                                  {paddedNum}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Language Modal */}
      <QuizLanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      {/* Level Locked Alert */}
      <QuizAlertModal
        visible={lockedModal.visible}
        type="locked"
        badgeText={ui.locked.toUpperCase()}
        title={`${ui.level} ${lockedModal.levelNumber} ${ui.locked}`}
        message={ui.levelLockedMsg(lockedModal.levelNumber - 1, lockedModal.levelNumber)}
        highlightText={ui.passRequirement}
        highlightIcon="star"
        primaryBtnText="OK"
        onPrimary={() => setLockedModal((prev) => ({ ...prev, visible: false }))}
        onClose={() => setLockedModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 116 : 96,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: {
    zIndex: 10,
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
    marginHorizontal: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerDiffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  headerDiffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerDiffTxt: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  langPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollArea: {
    flex: 1,
  },
  curvedHeroWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#141d2e',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  curvedHeroImageBg: {
    width: '100%',
    minHeight: 185,
  },
  curvedHeroImage: {
    borderRadius: 22,
  },
  curvedHeroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 16,
  },
  heroTitleLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  heroDiffPillInline: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroDiffTxt: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  heroPillTrophy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  heroPillTrophyTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 12,
    lineHeight: 17,
  },
  heroProgressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2.5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  heroProgressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  heroProgressSubTxt: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalBadgeTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingTxt: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  stagesWrap: {
    marginHorizontal: 16,
    gap: 16,
  },
  stageCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  stageHeaderClean: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stageIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  stageInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  stageTagMini: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  stageTitleTxt: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stageSubTxt: {
    fontSize: 11,
    marginTop: 2,
  },
  stageStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  stageStatusBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stageProgressDivider: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  stageProgressDividerFill: {
    height: '100%',
  },
  stageBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  levelCard: {
    width: '18%',
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCardCompleted: {
    borderWidth: 1.5,
  },
  levelCardCurrent: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  levelCardLocked: {
    borderWidth: 1,
  },
  levelCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  completedBadgeWrap: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  currentPlayIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  levelNumTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  playBadgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  playBadgeTxt: {
    fontSize: 7,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  lockedNumTxt: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
});
