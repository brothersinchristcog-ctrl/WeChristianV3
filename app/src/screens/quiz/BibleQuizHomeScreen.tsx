import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  BookOpen,
  Award,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { QUIZ_CATEGORIES } from '../../constants/BibleQuizCategories';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';
import { QuizService } from '../../services/QuizService';
import { BibleQuiz, QuizAttempt } from '../../types/Quiz';
import QuizLanguageModal from './QuizLanguageModal';

export default function BibleQuizHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const { isDark } = useTheme();
  const { activeChurch } = useChurch();

  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);
  const [quizzes, setQuizzes] = useState<BibleQuiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<Record<string, QuizAttempt>>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const ui = getQuizStrings(quizLanguage);
  const churchId = activeChurch?.id || 'global';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [churchId, user?.uid])
  );

  const loadData = async () => {
    try {
      // Fetch available quizzes (both Church Admin and Super Admin created)
      const list = await QuizService.getQuizzes(churchId, {
        isAdmin: false,
      });
      setQuizzes(list);

      // Fetch user attempts to compute true availability and completion status
      if (user?.uid) {
        const attempts = await QuizService.getUserAttemptsMap(user.uid, churchId);
        setUserAttempts(attempts);
      }
    } catch (err) {
      console.warn('[BibleQuizHomeScreen] Error loading quiz count:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Flow: Bible Quiz → Category → Difficulty → Stages → Levels → Questions
  const handleSelectCategory = (cat: typeof QUIZ_CATEGORIES[0]) => {
    navigation.navigate('BibleQuizLevels', {
      category: cat.id,
      categoryTitle: cat.name,
      categoryTelugu: cat.teluguName,
      categoryImage: cat.imageUrl,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Clean Hero Header */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerHero}
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
            <Text style={styles.headerTitle}>
              {ui.quizTitle}
            </Text>
          </View>

          {/* Quiz Language Selector Pill */}
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

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── ENTRY POINT CARD: CHURCH QUIZZES (POLISHED & MODERN) ────────────────── */}
        {(() => {
          const totalCount = quizzes.length;
          const completedCount = quizzes.filter(q => Boolean(userAttempts[q.id])).length;
          const availableCount = Math.max(0, totalCount - completedCount);
          const isAllCompleted = totalCount > 0 && availableCount === 0;

          return (
            <TouchableOpacity
              style={[
                styles.churchQuizzesEntryCard,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(30, 58, 138, 0.22)' },
              ]}
              onPress={() => navigation.navigate('ChurchQuizzes')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={isDark ? ['#1e3a8a', '#0f2452'] : ['#1d4ed8', '#1e3a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.churchQuizzesInner}
              >
                {/* Left Icon Pill */}
                <View style={styles.churchIconSquircle}>
                  {isAllCompleted ? (
                    <Award size={22} color="#fef08a" />
                  ) : (
                    <BookOpen size={22} color="#ffffff" />
                  )}
                </View>

                {/* Content */}
                <View style={styles.churchEntryContent}>
                  <View style={styles.churchEntryTitleRow}>
                    <Text style={styles.churchEntryTitle} numberOfLines={1}>Church Quizzes</Text>
                    {isAllCompleted ? (
                      <View style={styles.entryBadgeCompleted}>
                        <CheckCircle size={10} color="#10b981" />
                        <Text style={styles.entryBadgeCompletedTxt}>Completed</Text>
                      </View>
                    ) : availableCount > 0 ? (
                      <View style={styles.entryBadge}>
                        <Text style={styles.entryBadgeTxt}>{availableCount} Available</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.churchEntrySub} numberOfLines={2}>
                    {isAllCompleted
                      ? 'All quizzes completed! Tap to review results or retry.'
                      : 'Browse and participate in all available quizzes'}
                  </Text>
                </View>

                {/* Right Action Button */}
                <View style={styles.arrowCircle}>
                  <ArrowRight size={17} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* ─── FAITH CATEGORIES SECTION (CLEAN & MINIMALIST) ────────────────── */}
        <View style={[styles.sectionHeadingRow, { marginTop: 20 }]}>
          <Text style={[styles.sectionHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Faith Categories
          </Text>
          <View style={styles.sectionBadgeWrap}>
            <Text style={styles.sectionSubBadge}>
              12 Themes
            </Text>
          </View>
        </View>

        {/* Clean Category Cards */}
        {QUIZ_CATEGORIES.map(cat => {
          const localizedName = ui.categories[cat.id] || cat.name;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                isDark && {
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
              onPress={() => handleSelectCategory(cat)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={{ uri: cat.imageUrl }}
                style={styles.cardImageBg}
                imageStyle={styles.cardImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.82)']}
                  locations={[0.25, 0.6, 1]}
                  style={styles.cardOverlay}
                >
                  <View style={styles.cardContentRow}>
                    <Text style={styles.categoryTitle} numberOfLines={1}>
                      {localizedName}
                    </Text>
                    <View style={styles.arrowCircle}>
                      <ArrowRight size={16} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Local Quiz Language Selector Modal */}
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
  headerHero: {
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

  // ── Single Entry Point: Church Quizzes Card ────────────────────────────────
  churchQuizzesEntryCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#0a1945',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  churchQuizzesInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  churchIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  churchEntryContent: {
    flex: 1,
    marginRight: 10,
  },
  churchEntryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  churchEntryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  entryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  entryBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#bfdbfe',
  },
  entryBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  entryBadgeCompletedTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6ee7b7',
  },
  churchEntrySub: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },

  // ── Faith Categories ────────────────────────────────────────────────────────
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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

  categoryCard: {
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImageBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardImage: {
    borderRadius: 16,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
    marginRight: 10,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});
