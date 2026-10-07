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
  Bell,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DailyQuizNotificationService from '../../services/DailyQuizNotificationService';
import { SupportedLanguage, LANGUAGES } from '../../locales';
import {
  getLocalizedDailyQuestion,
  getLocalizedDailyQuizTitle,
} from '../../constants/DailyQuizTranslations';
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
  const [inspectLang, setInspectLang] = useState<SupportedLanguage>('en');

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

  const handleTriggerTestNotification = async () => {
    try {
      const ok = await DailyQuizNotificationService.sendTestQuizNotification(3);
      if (ok) {
        Alert.alert(
          'Notification Scheduled! 🔔',
          "A test 5:00 AM Daily Bible Quiz notification will arrive on your phone in 3 seconds!\n\nPull down your notification bar and tap it to verify that it opens today's quiz directly."
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your phone settings to receive 5:00 AM Daily Quiz notifications.'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to trigger test notification');
    }
  };

  const filteredDays = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

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
  }, [scheduledDays, selectedMonth, searchQuery]);

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
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
              <Award size={13} color="#f59e0b" />
              <Text style={styles.kpiBadgeTxt}>Daily Bible Quiz</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.liveBadgeTxt}>Auto 5:00 AM Delivery</Text>
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

          {/* Instant 5:00 AM Notification Test Button */}
          <TouchableOpacity
            style={styles.testNotifBtn}
            onPress={handleTriggerTestNotification}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Bell size={16} color="#ffffff" />
              <Text style={styles.btnTxt}>🔔 Test 5:00 AM Notification Now (In 3s)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Month Filter Bar (Uses top dashboard search bar for searching) */}
      <View style={styles.filterSection}>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Scheduled Days List with Unified Full-Page Scroll */}
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
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index }) => {
            const isToday = item.dateStr === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                style={[styles.dayCard, isToday && styles.dayCardToday]}
                onPress={() => setInspectQuiz(item.quiz)}
                activeOpacity={0.75}
              >
                {/* Header Row: Date Badge + Title/Sub + Inspect Button */}
                <View style={styles.dayCardHeaderRow}>
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
                        Daily Bible Quiz
                      </Text>
                      {isToday && (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillTxt}>ACTIVE TODAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dayDateSub}>{item.dateStr}</Text>
                  </View>

                  <View style={styles.inspectBtn}>
                    <Eye size={13} color="#38bdf8" />
                    <Text style={styles.inspectBtnTxt}>Inspect</Text>
                  </View>
                </View>

                {/* Bottom Row: Full-width metadata info chips */}
                <View style={styles.dayMetaRow}>
                  <View style={styles.metaChip}>
                    <Clock size={11} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>5:00 AM Delivery</Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <Clock size={11} color="#f59e0b" />
                    <Text style={[styles.metaChipTxt, { color: '#fbbf24', fontWeight: '600' }]}>5 Mins Limit</Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <BookOpen size={11} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>{item.quiz.questions.length} Questions</Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <Text style={[styles.metaChipTxt, { color: '#38bdf8', fontWeight: '600' }]}>
                      Intermediate
                    </Text>
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
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.inspectTitle}>
                  {inspectQuiz?.dailyDate
                    ? getLocalizedDailyQuizTitle(inspectQuiz.dailyDate, inspectLang)
                    : inspectQuiz?.title}
                </Text>
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
              {/* Language Switcher Bar for Admin Preview */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 6 }}>
                  Preview Language:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {LANGUAGES.map((lang) => {
                    const isSelected = inspectLang === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => setInspectLang(lang.code)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          backgroundColor: isSelected ? '#2563eb' : '#1e293b',
                          borderWidth: 1,
                          borderColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#ffffff' : '#94a3b8' }}>
                          {lang.nativeName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inspectBadgeRow}>
                <View style={styles.inspectPill}>
                  <Text style={styles.inspectPillTxt}>Difficulty: Intermediate</Text>
                </View>
                <View style={[styles.inspectPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.inspectPillTxt, { color: '#f59e0b' }]}>⏱ Time Limit: 5 Mins</Text>
                </View>
                <View style={[styles.inspectPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.inspectPillTxt, { color: '#10b981' }]}>Status: Scheduled & Live</Text>
                </View>
              </View>

              <Text style={styles.inspectSectionHeading}>Questions ({inspectQuiz?.questions?.length || 0})</Text>

              {inspectQuiz?.questions?.map((q, idx) => {
                const localized = getLocalizedDailyQuestion(q, inspectLang);
                return (
                  <View key={q.id || idx} style={styles.questionCard}>
                    <View style={styles.qIndexRow}>
                      <Text style={styles.qIndexTxt}>Q{idx + 1}</Text>
                      <Text style={styles.qRefTxt}>{localized.bibleReference}</Text>
                    </View>

                    <Text style={styles.qQuestionTxt}>{localized.question}</Text>

                    <View style={styles.optionsList}>
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        const optText = localized.options[optIdx] || opt;
                        return (
                          <View
                            key={optIdx}
                            style={[
                              styles.optionItem,
                              isCorrect && styles.optionItemCorrect,
                            ]}
                          >
                            <Text style={[styles.optionTxt, isCorrect && styles.optionTxtCorrect]}>
                              {String.fromCharCode(65 + optIdx)}. {optText}
                            </Text>
                            {isCorrect && <Check size={16} color="#10b981" />}
                          </View>
                        );
                      })}
                    </View>

                    {Boolean(localized.explanation) && (
                      <View style={styles.expBox}>
                        <Text style={styles.expLabel}>Biblical Insight:</Text>
                        <Text style={styles.expTxt}>{localized.explanation}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
  headerWrapper: {
    marginBottom: 4,
  },
  kpiContainer: {
    paddingTop: 10,
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
  testNotifBtn: {
    marginTop: 10,
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
    paddingTop: 2,
    paddingBottom: 10,
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
  dayCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBadgeToday: {
    backgroundColor: '#2563eb',
    borderColor: '#60a5fa',
  },
  dateBadgeDay: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  dateBadgeDayToday: {
    color: '#ffffff',
  },
  dateBadgeMonth: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateBadgeMonthToday: {
    color: '#dbeafe',
  },
  dayInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  dayTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  dayDateSub: {
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: '500',
  },
  todayPill: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayPillTxt: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
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
  dayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
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
  metaDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#475569',
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
