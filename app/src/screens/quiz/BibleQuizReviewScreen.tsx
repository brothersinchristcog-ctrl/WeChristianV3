import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  BookOpen,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { QuizAttempt, BibleQuiz } from '../../types/Quiz';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getQuizStrings,
  localizeBibleReference,
} from '../../constants/BibleQuizTranslations';
import { getLocalizedDailyQuestion } from '../../constants/DailyQuizTranslations';

export default function BibleQuizReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizLanguage } = useQuizLanguage();
  const { isDark } = useTheme();

  const attempt: QuizAttempt = route?.params?.attempt;
  const quiz: BibleQuiz = route?.params?.quiz;
  const ui = getQuizStrings(quizLanguage);

  if (!attempt || !attempt.answers) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: isDark ? '#0b1120' : '#f8fafc' },
        ]}
      >
        <Text style={[styles.errorTxt, { color: isDark ? '#94a3b8' : '#64748B' }]}>
          No review data found.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnTxt}>{ui.results}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeBottomPadding =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 24) + 24
      : Math.max(insets.bottom, 16) + 20;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Signature WeChristian Gradient Header */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#ffffff" />
          <Text style={styles.headerBackTxt}>{ui.results}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{ui.questionReview}</Text>

        <View style={styles.scorePill}>
          <Text style={styles.scorePillTxt}>{attempt.percentage}%</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ padding: 16, paddingBottom: safeBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Bar */}
        <View
          style={[
            styles.summaryBar,
            {
              backgroundColor: isDark ? '#141d2e' : '#ffffff',
              borderColor: isDark ? '#26354a' : '#E2E8F0',
            },
          ]}
        >
          <Text
            style={[
              styles.summaryBarTxt,
              { color: isDark ? '#f8fafc' : '#1E293B' },
            ]}
          >
            {ui.summaryBar(
              attempt.score,
              attempt.totalMarks,
              attempt.correctCount,
              attempt.wrongCount
            )}
          </Text>
        </View>

        {attempt.answers.map((ans, idx) => {
          const localized = getLocalizedDailyQuestion(
            {
              question: ans.question,
              bibleReference: ans.bibleReference,
              explanation: ans.explanation,
            },
            quizLanguage
          );
          const locRef = localized.bibleReference || localizeBibleReference(ans.bibleReference || '', quizLanguage);
          const displayedQuestion = localized.question || ans.question;
          const displayedExp = localized.explanation || ans.explanation;

          return (
            <View
              key={ans.questionId || idx}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: isDark ? '#141d2e' : '#ffffff',
                  borderColor: isDark ? '#26354a' : '#E2E8F0',
                },
              ]}
            >
              {/* Question Header */}
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.statusIconWrap,
                    ans.isCorrect
                      ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }
                      : { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' },
                  ]}
                >
                  {ans.isCorrect ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <XCircle size={16} color="#EF4444" />
                  )}
                  <Text
                    style={[
                      styles.statusTxt,
                      ans.isCorrect ? { color: '#10B981' } : { color: '#EF4444' },
                    ]}
                  >
                    {ans.isCorrect ? ui.correct : ui.incorrect}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.marksEarned,
                    { color: isDark ? '#94a3b8' : '#64748B' },
                  ]}
                >
                  +{ans.marksAwarded} / {ans.possibleMarks} pt
                </Text>
              </View>

              <Text
                style={[
                  styles.questionText,
                  { color: isDark ? '#f8fafc' : '#0F172A' },
                ]}
              >
                Q{idx + 1}. {displayedQuestion}
              </Text>

              {/* Member's Answer */}
              <View
                style={[
                  styles.answerRow,
                  ans.isCorrect
                    ? {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.14)'
                          : '#ECFDF5',
                        borderColor: isDark ? '#065F46' : '#A7F3D0',
                      }
                    : {
                        backgroundColor: isDark
                          ? 'rgba(239, 68, 68, 0.14)'
                          : '#FEF2F2',
                        borderColor: isDark ? '#991B1B' : '#FECACA',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.answerLabel,
                    { color: isDark ? '#cbd5e1' : '#475569' },
                  ]}
                >
                  {ui.yourAnswer}
                </Text>
                <Text
                  style={[
                    styles.answerValue,
                    ans.isCorrect
                      ? { color: isDark ? '#34D399' : '#065F46' }
                      : { color: isDark ? '#F87171' : '#991B1B' },
                  ]}
                >
                  {Array.isArray(ans.selectedAnswer)
                    ? ans.selectedAnswer.join(', ')
                    : ans.selectedAnswer || ui.notAnswered}
                </Text>
              </View>

              {/* Correct Answer (if member was wrong) */}
              {!ans.isCorrect && (
                <View
                  style={[
                    styles.answerRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.14)'
                        : '#ECFDF5',
                      borderColor: isDark ? '#065F46' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.answerLabel,
                      { color: isDark ? '#cbd5e1' : '#475569' },
                    ]}
                  >
                    {ui.correctAnswer}
                  </Text>
                  <Text
                    style={[
                      styles.answerValue,
                      {
                        color: isDark ? '#34D399' : '#065F46',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {Array.isArray(ans.correctAnswer)
                      ? ans.correctAnswer.join(', ')
                      : ans.correctAnswer}
                  </Text>
                </View>
              )}

              {/* Scripture Reference Link */}
              {locRef ? (
                <View
                  style={[
                    styles.scriptureRefRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(124, 58, 237, 0.18)'
                        : '#f5f3ff',
                    },
                  ]}
                >
                  <BookOpen size={14} color={isDark ? '#c4b5fd' : '#7c3aed'} />
                  <Text
                    style={[
                      styles.scriptureRefTxt,
                      { color: isDark ? '#c4b5fd' : '#7c3aed' },
                    ]}
                  >
                    {ui.scriptureReference}: {locRef}
                  </Text>
                </View>
              ) : null}

              {/* Detailed Explanation */}
              {displayedExp ? (
                <View
                  style={[
                    styles.explanationBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 41, 59, 0.7)'
                        : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.explanationTitle,
                      { color: isDark ? '#60A5FA' : '#2563EB' },
                    ]}
                  >
                    {ui.biblicalInsight}:
                  </Text>
                  <Text
                    style={[
                      styles.explanationTxt,
                      { color: isDark ? '#cbd5e1' : '#475569' },
                    ]}
                  >
                    {displayedExp}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
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
  errorTxt: {
    fontSize: 15,
    marginBottom: 14,
  },
  backBtn: {
    backgroundColor: '#2b52a1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnTxt: {
    color: '#ffffff',
    fontWeight: '700',
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
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  headerBackTxt: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  scorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scorePillTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  summaryBar: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  summaryBarTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
  marksEarned: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
  },
  answerRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  scriptureRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  scriptureRefTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  explanationBox: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    marginTop: 4,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  explanationTxt: {
    fontSize: 13,
    lineHeight: 18,
  },
});
