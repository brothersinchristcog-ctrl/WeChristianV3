import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Play,
  Calendar,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BibleQuiz, QuizAttempt } from '../../types/Quiz';
import { QuizService } from '../../services/QuizService';
import { useAuth } from '../../context/AuthContext';

export default function BibleQuizDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const passedQuiz: BibleQuiz = route?.params?.quiz;
  const [quiz, setQuiz] = useState<BibleQuiz | null>(passedQuiz || null);
  const [priorAttempt, setPriorAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(!passedQuiz);

  useEffect(() => {
    loadQuizDetail();
  }, [passedQuiz?.id]);

  const loadQuizDetail = async () => {
    try {
      if (!passedQuiz?.id) return;
      const q = await QuizService.getQuizById(passedQuiz.id, passedQuiz.churchId);
      if (q) setQuiz(q);

      if (user?.uid) {
        const attempt = await QuizService.getUserQuizAttempt(user.uid, passedQuiz.id, passedQuiz.churchId);
        setPriorAttempt(attempt);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quiz) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1a2d5a" />
        <Text style={styles.loadingTxt}>Loading quiz details...</Text>
      </View>
    );
  }

  const isBlockedByAttempts = !quiz.allowMultipleAttempts && Boolean(priorAttempt);

  const handleStartQuiz = () => {
    if (isBlockedByAttempts && priorAttempt) {
      Alert.alert(
        'Quiz Completed',
        `You have already completed this quiz with a score of ${priorAttempt.percentage}%. Multiple attempts are not allowed.`,
        [
          { text: 'View Results', onPress: () => navigation.navigate('BibleQuizResult', { attempt: priorAttempt, quiz }) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    navigation.navigate('BibleQuizPlayer', { quizId: quiz.id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#ffffff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Quiz Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title & Category Hero */}
        <View style={styles.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeTxt}>{quiz.category || 'General'}</Text>
            </View>
            <View style={styles.diffBadge}>
              <Text style={styles.diffBadgeTxt}>{quiz.difficulty.toUpperCase()}</Text>
            </View>
            {quiz.isDailyQuiz && (
              <View style={styles.dailyBadge}>
                <Text style={styles.dailyBadgeTxt}>☀️ DAILY QUIZ</Text>
              </View>
            )}
          </View>

          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.quizDesc}>
            {quiz.description || 'Welcome to this Bible Quiz. Test your knowledge of scripture and learn new insights from God’s Word!'}
          </Text>

          {quiz.book && (
            <View style={styles.scriptureFocusRow}>
              <BookOpen size={16} color="#7c3aed" />
              <Text style={styles.scriptureFocusTxt}>
                Focus: {quiz.book} {quiz.chapterStart ? `Chapters ${quiz.chapterStart}${quiz.chapterEnd ? `–${quiz.chapterEnd}` : ''}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Prior Attempt Alert if applicable */}
        {priorAttempt && (
          <View style={[styles.attemptAlert, priorAttempt.passed ? styles.attemptAlertPass : styles.attemptAlertFail]}>
            <Award size={18} color={priorAttempt.passed ? '#059669' : '#dc2626'} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.attemptAlertTitle}>
                Previous Score: {priorAttempt.score}/{priorAttempt.totalMarks} ({priorAttempt.percentage}%)
              </Text>
              <Text style={styles.attemptAlertSub}>
                {priorAttempt.passed ? '✓ You passed this quiz!' : 'Keep practicing God’s Word!'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('BibleQuizResult', { attempt: priorAttempt, quiz })}
              style={styles.viewResultBtn}
            >
              <Text style={styles.viewResultBtnTxt}>Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rules & Structure Grid */}
        <Text style={styles.sectionHeader}>Quiz Rules & Information</Text>

        <View style={styles.rulesGrid}>
          <View style={styles.ruleItem}>
            <View style={styles.ruleIconWrap}>
              <HelpCircle size={18} color="#1a2d5a" />
            </View>
            <Text style={styles.ruleVal}>{quiz.totalQuestions || quiz.questions?.length || 10}</Text>
            <Text style={styles.ruleLbl}>Total Questions</Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconWrap}>
              <Clock size={18} color="#1a2d5a" />
            </View>
            <Text style={styles.ruleVal}>
              {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} Mins` : 'Untimed'}
            </Text>
            <Text style={styles.ruleLbl}>Time Limit</Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconWrap}>
              <CheckCircle size={18} color="#1a2d5a" />
            </View>
            <Text style={styles.ruleVal}>{quiz.passPercentage || 70}%</Text>
            <Text style={styles.ruleLbl}>Passing Score</Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconWrap}>
              <Award size={18} color="#1a2d5a" />
            </View>
            <Text style={styles.ruleVal}>{quiz.marksPerQuestion || 1} pt</Text>
            <Text style={styles.ruleLbl}>Per Question</Text>
          </View>
        </View>

        {/* Biblical Guidance Callout */}
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitle}>Tips for this Quiz</Text>
          <Text style={styles.guidanceBullet}>• Read each question and all 4 options carefully before answering.</Text>
          <Text style={styles.guidanceBullet}>• When the countdown timer reaches zero, answers will be auto-submitted.</Text>
          <Text style={styles.guidanceBullet}>• Every question includes full scripture references and biblical explanations upon completion.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Start Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={[styles.startQuizBtn, isBlockedByAttempts && { backgroundColor: '#475569' }]}
          onPress={handleStartQuiz}
          activeOpacity={0.88}
        >
          <Play size={18} color="#ffffff" fill="#ffffff" />
          <Text style={styles.startQuizBtnTxt}>
            {isBlockedByAttempts ? 'View My Past Results' : 'Start Bible Quiz'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTxt: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnTxt: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  diffBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  dailyBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dailyBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 26,
  },
  quizDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 12,
  },
  scriptureFocusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  scriptureFocusTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
  },
  attemptAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  attemptAlertPass: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  attemptAlertFail: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  attemptAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  attemptAlertSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  viewResultBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  viewResultBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  ruleItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  ruleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ruleVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  ruleLbl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  guidanceBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  guidanceBullet: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  startQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2d5a',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  startQuizBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
