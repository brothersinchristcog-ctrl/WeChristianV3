import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  Eye,
  BookOpen,
  Award,
  ChevronRight,
  X,
  Play,
  RotateCw,
  Search,
  Filter,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DailyBibleQuizBank } from '../../services/DailyBibleQuizBank';
import { QuizService } from '../../services/QuizService';
import { BibleQuiz, QuizQuestion } from '../../types/Quiz';

export default function SuperAdminDailyQuizManager({ searchQuery = '' }: { searchQuery?: string }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [coverageInfo, setCoverageInfo] = useState<{
    todayReady: boolean;
    futureDaysCount: number;
    furthestDate: string;
  }>({
    todayReady: true,
    futureDaysCount: 365,
    furthestDate: '',
  });

  // Scheduled dates list (next 60-90 days dynamically or full year)
  const [scheduledDays, setScheduledDays] = useState<Array<{
    dateStr: string;
    quiz: BibleQuiz;
  }>>([]);

  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Bulk Generation progress modal
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateProgress, setGenerateProgress] = useState<{
    processed: number;
    total: number;
    currentDate: string;
  }>({
    processed: 0,
    total: 0,
    currentDate: '',
  });

  // Inspect / Detail modal for a specific day
  const [inspectQuiz, setInspectQuiz] = useState<BibleQuiz | null>(null);

  const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    loadDailyQuizzes();
  }, []);

  const loadDailyQuizzes = async () => {
    try {
      setLoading(true);
      const coverage = await DailyBibleQuizBank.checkScheduleCoverage();
      setCoverageInfo(coverage);

      // Generate visual schedule list for the next 90 days from today
      const today = new Date();
      const list: Array<{ dateStr: string; quiz: BibleQuiz }> = [];

      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const quiz = DailyBibleQuizBank.createDailyQuizEntity(dateStr, 'global');
        list.push({ dateStr, quiz });
      }

      setScheduledDays(list);
    } catch (err) {
      console.error('[SuperAdminDailyQuizManager] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBulkSchedule = async (totalDays: 365 | 730) => {
    const yearsLabel = totalDays === 365 ? '1 Year (365 Days)' : '2 Years (730 Days)';
    Alert.alert(
      `Prepare ${yearsLabel}`,
      `This will generate and schedule ${totalDays} days of intermediate Bible Quiz data in advance with 5 questions per day.\n\nAutomatic Delivery Window:\n5:00 AM – 7:00 AM every morning.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Schedule',
          onPress: async () => {
            setIsGenerating(true);
            setGenerateProgress({ processed: 0, total: totalDays, currentDate: 'Initializing...' });
            try {
              const res = await DailyBibleQuizBank.scheduleBatch(
                totalDays,
                undefined,
                (processed, total, currentDate) => {
                  setGenerateProgress({ processed, total, currentDate });
                }
              );

              setIsGenerating(false);
              Alert.alert(
                'Schedule Complete! 🎉',
                `Successfully prepared ${res.scheduledCount} daily quizzes!\nCoverage is locked in advance until ${res.endDateStr}.\nQuizzes will be delivered automatically at 5:00 AM every morning.`
              );
              loadDailyQuizzes();
            } catch (err: any) {
              setIsGenerating(false);
              Alert.alert('Error', err?.message || 'Failed to complete batch schedule.');
            }
          },
        },
      ]
    );
  };

  const filteredDays = useMemo(() => {
    const query = (localSearch || searchQuery || '').toLowerCase().trim();

    return scheduledDays.filter(item => {
      // Month filter
      if (selectedMonth !== 'All') {
        const monthIndex = parseInt(item.dateStr.split('-')[1], 10) - 1;
        if (MONTHS[monthIndex + 1] !== selectedMonth) return false;
      }

      // Query filter
      if (query) {
        const dateMatch = item.dateStr.includes(query);
        const titleMatch = item.quiz.title.toLowerCase().includes(query);
        const qMatch = item.quiz.questions.some(q =>
          q.question.toLowerCase().includes(query) ||
          q.bibleReference.toLowerCase().includes(query)
        );
        return dateMatch || titleMatch || qMatch;
      }

      return true;
    });
  }, [scheduledDays, selectedMonth, localSearch, searchQuery]);

  return (
    <View style={styles.container}>
      {/* KPI & Status Banner */}
      <View style={styles.kpiContainer}>
        <LinearGradient
          colors={['#1e1b4b', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.kpiBanner}
        >
          <View style={styles.kpiTopRow}>
            <View style={styles.kpiBadge}>
              <Award size={14} color="#f59e0b" />
              <Text style={styles.kpiBadgeTxt}>Super Admin · Daily Bible Quiz</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.liveBadgeTxt}>Auto-Deliver 5:00 AM – 7:00 AM</Text>
            </View>
          </View>

          <Text style={styles.kpiTitle}>
            Daily Scripture Knowledge Horizon
          </Text>
          <Text style={styles.kpiSub}>
            Questions: <Text style={{ color: '#38bdf8', fontWeight: '700' }}>Intermediate to Moderate</Text> Bible Knowledge. Content is fixed and automated in advance for early morning delivery to all church members.
          </Text>

          {/* 1 Year / 2 Years Action Buttons */}
          <View style={styles.actionBtnsRow}>
            <TouchableOpacity
              style={styles.oneYearBtn}
              onPress={() => handleStartBulkSchedule(365)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Sparkles size={16} color="#ffffff" />
                <Text style={styles.btnTxt}>Prepare 1 Year (365 Days)</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.twoYearBtn}
              onPress={() => handleStartBulkSchedule(730)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#d97706', '#b45309']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Calendar size={16} color="#ffffff" />
                <Text style={styles.btnTxt}>Prepare 2 Years (730 Days)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Search and Month Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={localSearch}
            onChangeText={setLocalSearch}
            placeholder="Search dates (YYYY-MM-DD), scriptures or questions..."
            placeholderTextColor="#64748b"
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={() => setLocalSearch('')}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {MONTHS.map(m => {
            const isSelected = selectedMonth === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, isSelected && styles.monthChipActive]}
                onPress={() => setSelectedMonth(m)}
              >
                <Text style={[styles.monthChipTxt, isSelected && styles.monthChipTxtActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scheduled Days List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingTxt}>Loading daily quiz schedule...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDays}
          keyExtractor={item => item.dateStr}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isToday = item.dateStr === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                style={[styles.dayCard, isToday && styles.dayCardToday]}
                onPress={() => setInspectQuiz(item.quiz)}
                activeOpacity={0.75}
              >
                <View style={styles.dayCardLeft}>
                  <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
                    <Text style={[styles.dateBadgeDay, isToday && styles.dateBadgeDayToday]}>
                      {item.dateStr.split('-')[2]}
                    </Text>
                    <Text style={[styles.dateBadgeMonth, isToday && styles.dateBadgeMonthToday]}>
                      {MONTHS[parseInt(item.dateStr.split('-')[1], 10)]}
                    </Text>
                  </View>

                  <View style={styles.dayInfoCol}>
                    <View style={styles.dayTitleRow}>
                      <Text style={styles.dayTitle} numberOfLines={1}>
                        {item.quiz.title}
                      </Text>
                      {isToday && (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillTxt}>ACTIVE TODAY</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.dayMetaRow}>
                      <View style={styles.metaChip}>
                        <Clock size={12} color="#94a3b8" />
                        <Text style={styles.metaChipTxt}>5:00 AM Delivery</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <BookOpen size={12} color="#94a3b8" />
                        <Text style={styles.metaChipTxt}>5 Questions · Intermediate</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.dayCardRight}>
                  <View style={styles.inspectBtn}>
                    <Eye size={16} color="#38bdf8" />
                    <Text style={styles.inspectBtnTxt}>Inspect</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Progress Modal during 1 Year / 2 Year generation */}
      <Modal visible={isGenerating} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color="#f59e0b" style={{ marginBottom: 16 }} />
            <Text style={styles.progressTitle}>Preparing Daily Quizzes</Text>
            <Text style={styles.progressSub}>
              Batch saving intermediate Bible knowledge quizzes for {generateProgress.total} days...
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(
                      (generateProgress.processed / (generateProgress.total || 1)) * 100
                    )}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressCounter}>
              {generateProgress.processed} / {generateProgress.total} Days Completed ({generateProgress.currentDate})
            </Text>
          </View>
        </View>
      </Modal>

      {/* Inspect Day's Quiz Modal */}
      <Modal visible={Boolean(inspectQuiz)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.inspectModalCard}>
            <View style={styles.inspectHeader}>
              <View>
                <Text style={styles.inspectTitle}>{inspectQuiz?.title}</Text>
                <Text style={styles.inspectSub}>
                  Scheduled Date: {inspectQuiz?.dailyDate} · Delivery Time: 5:00 AM
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setInspectQuiz(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.inspectScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inspectBadgeRow}>
                <View style={styles.inspectPill}>
                  <Text style={styles.inspectPillTxt}>Difficulty: Intermediate / Moderate</Text>
                </View>
                <View style={[styles.inspectPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.inspectPillTxt, { color: '#10b981' }]}>Status: Scheduled & Live</Text>
                </View>
              </View>

              <Text style={styles.inspectSectionHeading}>Questions ({inspectQuiz?.questions?.length || 0})</Text>

              {inspectQuiz?.questions?.map((q, idx) => (
                <View key={q.id || idx} style={styles.questionCard}>
                  <View style={styles.qIndexRow}>
                    <Text style={styles.qIndexTxt}>Q{idx + 1}</Text>
                    <Text style={styles.qRefTxt}>{q.bibleReference}</Text>
                  </View>

                  <Text style={styles.qQuestionTxt}>{q.question}</Text>

                  <View style={styles.optionsList}>
                    {q.options?.map((opt, optIdx) => {
                      const isCorrect = opt === q.correctAnswer;
                      return (
                        <View
                          key={optIdx}
                          style={[
                            styles.optionItem,
                            isCorrect && styles.optionItemCorrect,
                          ]}
                        >
                          <Text style={[styles.optionTxt, isCorrect && styles.optionTxtCorrect]}>
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </Text>
                          {isCorrect && <Check size={16} color="#10b981" />}
                        </View>
                      );
                    })}
                  </View>

                  {Boolean(q.explanation) && (
                    <View style={styles.expBox}>
                      <Text style={styles.expLabel}>Biblical Insight:</Text>
                      <Text style={styles.expTxt}>{q.explanation}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.inspectFooter}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setInspectQuiz(null)}
              >
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  kpiContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  kpiBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kpiBadgeTxt: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeTxt: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiSub: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  oneYearBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  twoYearBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  btnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 8,
    padding: 0,
  },
  monthScroll: {
    flexDirection: 'row',
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  monthChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  monthChipTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  monthChipTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingTxt: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayCardToday: {
    borderColor: '#3b82f6',
    backgroundColor: '#172554',
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBadgeToday: {
    backgroundColor: '#2563eb',
    borderColor: '#60a5fa',
  },
  dateBadgeDay: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  dateBadgeDayToday: {
    color: '#ffffff',
  },
  dateBadgeMonth: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateBadgeMonthToday: {
    color: '#dbeafe',
  },
  dayInfoCol: {
    flex: 1,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dayTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  todayPill: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayPillTxt: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  dayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipTxt: {
    color: '#94a3b8',
    fontSize: 11,
  },
  dayCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inspectBtnTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  progressSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
  },
  progressCounter: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  inspectModalCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  inspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  inspectTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  inspectSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inspectScroll: {
    padding: 20,
  },
  inspectBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  inspectPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  inspectPillTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  inspectSectionHeading: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  qIndexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qIndexTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  qRefTxt: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  qQuestionTxt: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  optionsList: {
    gap: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  optionTxt: {
    color: '#cbd5e1',
    fontSize: 13,
    flex: 1,
  },
  optionTxtCorrect: {
    color: '#10b981',
    fontWeight: '700',
  },
  expBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  expTxt: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 16,
  },
  inspectFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  doneBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
