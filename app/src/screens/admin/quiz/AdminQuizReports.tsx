import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Users,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  X,
} from 'lucide-react-native';
import { QuizAnalyticsReport, QuizAttempt } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { useChurch } from '../../../context/ChurchContext';

interface Props {
  quizId: string;
  onBack: () => void;
}

export default function AdminQuizReports({ quizId, onBack }: Props) {
  const { activeChurch } = useChurch();
  const [report, setReport] = useState<QuizAnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [quizId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await QuizService.getQuizAnalyticsReport(quizId, activeChurch?.id);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingTxt}>Loading quiz report & insights...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTxt}>No report data available for this quiz.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <ChevronLeft size={22} color="#1e293b" />
          <Text style={styles.headerBackTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Analytics & Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* KPI Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#f5f3ff' }]}>
              <Users size={18} color="#7c3aed" />
            </View>
            <Text style={styles.metricVal}>{report.totalParticipants}</Text>
            <Text style={styles.metricLbl}>Participants</Text>
            <Text style={styles.metricSub}>{report.totalAttempts} total attempts</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#ecfdf5' }]}>
              <TrendingUp size={18} color="#059669" />
            </View>
            <Text style={styles.metricVal}>{report.averageScore}%</Text>
            <Text style={styles.metricLbl}>Avg Score</Text>
            <Text style={styles.metricSub}>{report.passRatePercentage}% pass rate</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Award size={18} color="#2563eb" />
            </View>
            <Text style={styles.metricVal}>{report.highestScore}%</Text>
            <Text style={styles.metricLbl}>Highest Score</Text>
            <Text style={styles.metricSub}>Min: {report.lowestScore}%</Text>
          </View>
        </View>

        {/* Question Performance Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Question-Wise Performance</Text>
          <Text style={styles.sectionSubtitle}>
            Identify difficult questions and common misconceptions
          </Text>

          {report.questionStats.map((qs, idx) => {
            const isDifficult = qs.accuracyPercent < 50;
            return (
              <View key={qs.questionId || idx} style={styles.qStatRow}>
                <View style={styles.qStatHeader}>
                  <View style={styles.qStatNumBadge}>
                    <Text style={styles.qStatNumTxt}>Q{idx + 1}</Text>
                  </View>
                  <Text style={styles.qStatQuestion} numberOfLines={2}>
                    {qs.question}
                  </Text>
                  <View
                    style={[
                      styles.accuracyBadge,
                      isDifficult ? styles.accuracyBadgeHard : styles.accuracyBadgeGood,
                    ]}
                  >
                    <Text
                      style={[
                        styles.accuracyBadgeTxt,
                        isDifficult ? { color: '#dc2626' } : { color: '#059669' },
                      ]}
                    >
                      {qs.accuracyPercent}%
                    </Text>
                  </View>
                </View>

                {qs.bibleReference ? (
                  <Text style={styles.qStatRef}>📖 {qs.bibleReference}</Text>
                ) : null}

                {/* Progress bar */}
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${qs.accuracyPercent}%` }]} />
                </View>

                <View style={styles.qStatFooter}>
                  <Text style={styles.qStatFooterTxt}>
                    ✓ {qs.correctCount} Correct · ✗ {qs.wrongCount} Wrong
                  </Text>
                  {qs.mostCommonWrongAnswer ? (
                    <Text style={styles.qStatFrequentWrong} numberOfLines={1}>
                      Common Mistake: {qs.mostCommonWrongAnswer}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Member Submissions List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Participant Results ({report.recentAttempts.length})</Text>
          <Text style={styles.sectionSubtitle}>Tap any member to inspect detailed answers</Text>

          {report.recentAttempts.length === 0 ? (
            <Text style={styles.noSubmissionsTxt}>No participant attempts yet.</Text>
          ) : (
            report.recentAttempts.map((att) => (
              <TouchableOpacity
                key={att.id}
                style={styles.memberAttemptRow}
                onPress={() => setSelectedAttempt(att)}
                activeOpacity={0.7}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarTxt}>
                    {att.memberName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.memberNameTxt}>{att.memberName}</Text>
                  <Text style={styles.memberPhoneTxt}>
                    {att.memberPhone || 'Member'} · {att.timeTakenSeconds}s
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.memberScorePill,
                      att.passed ? styles.memberScorePillPassed : styles.memberScorePillFailed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.memberScorePillTxt,
                        att.passed ? { color: '#059669' } : { color: '#dc2626' },
                      ]}
                    >
                      {att.score}/{att.totalMarks} ({att.percentage}%)
                    </Text>
                  </View>
                  <Text style={styles.attemptDateTxt}>
                    {att.submittedAt?.toDate
                      ? att.submittedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Member Details Modal */}
      {selectedAttempt && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeaderTitle}>{selectedAttempt.memberName}'s Answers</Text>
                  <Text style={styles.modalHeaderSub}>
                    Score: {selectedAttempt.score}/{selectedAttempt.totalMarks} ({selectedAttempt.percentage}%) · Time: {selectedAttempt.timeTakenSeconds}s
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedAttempt(null)} style={styles.modalCloseBtn}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 16 }}>
                {selectedAttempt.answers.map((ans, aIdx) => (
                  <View key={ans.questionId || aIdx} style={styles.modalAnswerCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {ans.isCorrect ? (
                        <CheckCircle size={16} color="#059669" />
                      ) : (
                        <XCircle size={16} color="#dc2626" />
                      )}
                      <Text style={styles.modalAnswerQNum}>Question #{aIdx + 1}</Text>
                      <Text style={styles.modalAnswerMarks}>
                        +{ans.marksAwarded}/{ans.possibleMarks} pts
                      </Text>
                    </View>

                    <Text style={styles.modalAnswerQuestionText}>{ans.question}</Text>

                    <View style={styles.modalAnswerBox}>
                      <Text style={styles.modalAnswerLine}>
                        <Text style={{ fontWeight: '700' }}>Member Answer: </Text>
                        <Text style={ans.isCorrect ? { color: '#059669', fontWeight: '600' } : { color: '#dc2626', fontWeight: '600' }}>
                          {Array.isArray(ans.selectedAnswer) ? ans.selectedAnswer.join(', ') : (ans.selectedAnswer || 'Skipped')}
                        </Text>
                      </Text>

                      {!ans.isCorrect && (
                        <Text style={[styles.modalAnswerLine, { marginTop: 4 }]}>
                          <Text style={{ fontWeight: '700' }}>Correct Answer: </Text>
                          <Text style={{ color: '#059669', fontWeight: '600' }}>
                            {Array.isArray(ans.correctAnswer) ? ans.correctAnswer.join(', ') : ans.correctAnswer}
                          </Text>
                        </Text>
                      )}
                    </View>

                    {ans.bibleReference ? (
                      <Text style={styles.modalRefText}>📖 Scripture: {ans.bibleReference}</Text>
                    ) : null}

                    {ans.explanation ? (
                      <Text style={styles.modalExplanationText}>💡 {ans.explanation}</Text>
                    ) : null}
                  </View>
                ))}
                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyTxt: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
  },
  backButtonTxt: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollArea: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
  },
  qStatRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  qStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qStatNumBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qStatNumTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  qStatQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  accuracyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  accuracyBadgeGood: {
    backgroundColor: '#ecfdf5',
  },
  accuracyBadgeHard: {
    backgroundColor: '#fef2f2',
  },
  accuracyBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  qStatRef: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
    marginTop: 4,
  },
  barContainer: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  qStatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qStatFooterTxt: {
    fontSize: 11,
    color: '#64748b',
  },
  qStatFrequentWrong: {
    fontSize: 11,
    color: '#dc2626',
    maxWidth: '50%',
  },
  noSubmissionsTxt: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14,
  },
  memberAttemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aed',
  },
  memberNameTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  memberPhoneTxt: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  memberScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  memberScorePillPassed: {
    backgroundColor: '#ecfdf5',
  },
  memberScorePillFailed: {
    backgroundColor: '#fef2f2',
  },
  memberScorePillTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  attemptDateTxt: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalHeaderSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  modalAnswerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalAnswerQNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalAnswerMarks: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 'auto',
  },
  modalAnswerQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginVertical: 4,
  },
  modalAnswerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modalAnswerLine: {
    fontSize: 12,
    color: '#334155',
  },
  modalRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
    marginTop: 6,
  },
  modalExplanationText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    lineHeight: 15,
  },
});
