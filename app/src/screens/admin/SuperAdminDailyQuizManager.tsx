import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
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
  ChevronDown,
  X,
  RotateCw,
  Search,
  Filter,
  Check,
  Bell,
  Building,
  Send,
  Settings,
  Trash2,
  Square,
  CheckSquare,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import firestore from '@react-native-firebase/firestore';
import DailyQuizNotificationService, { DailyQuizScheduleConfig } from '../../services/DailyQuizNotificationService';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { SupportedLanguage, LANGUAGES } from '../../locales';
import {
  getLocalizedDailyQuestion,
  getLocalizedDailyQuizTitle,
} from '../../constants/DailyQuizTranslations';
import { DailyBibleQuizBank } from '../../services/DailyBibleQuizBank';
import { QuizService } from '../../services/QuizService';
import { BibleQuiz } from '../../types/Quiz';

type SubTabType = 'daily_bank' | 'church_quizzes';

interface ChurchQuizItem extends BibleQuiz {
  churchName?: string;
}

const PRESET_TIMES = [
  { label: '5:00 AM', value: '05:00' },
  { label: '6:00 AM', value: '06:00' },
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
];

export default function SuperAdminDailyQuizManager({ searchQuery = '' }: { searchQuery?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('daily_bank');
  const [loading, setLoading] = useState<boolean>(true);

  // Daily Schedule Settings State
  const [scheduleConfig, setScheduleConfig] = useState<DailyQuizScheduleConfig>({
    enabled: true,
    scheduledTime: '05:00',
  });
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState<boolean>(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState<boolean>(false);

  // Church Quizzes State
  const [churchQuizzes, setChurchQuizzes] = useState<ChurchQuizItem[]>([]);
  const [churchesList, setChurchesList] = useState<ChurchDetails[]>([]);
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  // Multi-Selection & Bulk Delete State for Church Quizzes
  const [selectedQuizKeys, setSelectedQuizKeys] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Daily 365 Scripture Quizzes State
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

  // Inspect / Detail modal for a specific quiz
  const [inspectQuiz, setInspectQuiz] = useState<BibleQuiz | null>(null);
  const [inspectLang, setInspectLang] = useState<SupportedLanguage>('en');

  const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadScheduleConfig(),
      loadDailyQuizzes(),
      loadAllChurchQuizzes(),
    ]);
    setLoading(false);
  };

  const loadScheduleConfig = async () => {
    try {
      const cfg = await DailyQuizNotificationService.getScheduleConfig();
      setScheduleConfig(cfg);
    } catch (e) {
      console.warn('[SuperAdminDailyQuizManager] Load schedule config error:', e);
    }
  };

  const loadDailyQuizzes = async () => {
    try {
      await DailyBibleQuizBank.checkScheduleCoverage();

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
      console.error('[SuperAdminDailyQuizManager] Load daily quizzes error:', err);
    }
  };

  const loadAllChurchQuizzes = async () => {
    try {
      const churches = await ChurchService.getAllChurches();
      setChurchesList(churches);

      const allQuizzes: ChurchQuizItem[] = [];

      // Query quizzes across all churches concurrently
      await Promise.all(
        churches.map(async (church) => {
          try {
            const snap = await firestore()
              .collection('churches')
              .doc(church.id)
              .collection('bibleQuizzes')
              .limit(50)
              .get();

            snap.docs.forEach((doc) => {
              const data = doc.data() as BibleQuiz;
              allQuizzes.push({
                ...data,
                id: doc.id,
                churchId: church.id,
                churchName: church.name || 'Church',
              });
            });
          } catch (e) {
            // continue other churches
          }
        })
      );

      // Also fetch global quizzes
      try {
        const globalSnap = await firestore()
          .collection('churches')
          .doc('global')
          .collection('bibleQuizzes')
          .limit(50)
          .get();

        globalSnap.docs.forEach((doc) => {
          const data = doc.data() as BibleQuiz;
          allQuizzes.push({
            ...data,
            id: doc.id,
            churchId: 'global',
            churchName: 'Global Platform',
          });
        });
      } catch (e) {
        // continue
      }

      // Sort newest first
      allQuizzes.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setChurchQuizzes(allQuizzes);
    } catch (err) {
      console.error('[SuperAdminDailyQuizManager] Load church quizzes error:', err);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const ok = await DailyQuizNotificationService.saveScheduleConfig(scheduleConfig);
      if (ok) {
        Alert.alert(
          'Schedule Saved',
          `Daily Church Quiz notifications will now be automatically delivered to members daily at ${formatTimeTo12Hour(scheduleConfig.scheduledTime)}.`
        );
      } else {
        Alert.alert('Notice', 'Schedule updated locally.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleTriggerTestNotification = async () => {
    try {
      const ok = await DailyQuizNotificationService.sendTestQuizNotification(3);
      if (ok) {
        Alert.alert(
          'Notification Scheduled',
          `A test Daily Bible Quiz notification scheduled for ${formatTimeTo12Hour(scheduleConfig.scheduledTime)} will arrive on your device in 3 seconds.\n\nTap the notification to verify it opens today's quiz directly.`
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in device settings to receive Daily Quiz notifications.'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to trigger test notification');
    }
  };

  const handleBroadcastDailyQuizAllNow = async () => {
    Alert.alert(
      'Broadcast Daily Quiz to All Members',
      `Deliver today's Daily Bible Quiz push notification to all church members across the entire platform right now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send to All Now 🚀',
          onPress: async () => {
            try {
              const res = await DailyQuizNotificationService.broadcastDailyQuizPushNow();
              if (res.success) {
                Alert.alert('Broadcast Sent', res.message);
              } else {
                Alert.alert('Broadcast Notice', res.message);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to broadcast daily quiz');
            }
          },
        },
      ]
    );
  };

  const handleBroadcastQuizNow = async (quiz: ChurchQuizItem) => {
    Alert.alert(
      'Broadcast Quiz Notification',
      `Send instant push notification for "${quiz.title}" to members of ${quiz.churchName || 'the church'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Broadcast Now',
          onPress: async () => {
            setBroadcastingId(quiz.id);
            try {
              await QuizService.notifyMembersQuizPublished(quiz);
              Alert.alert(
                'Broadcast Sent',
                `Push notification for "${quiz.title}" has been successfully broadcast to church members.`
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to send broadcast');
            } finally {
              setBroadcastingId(null);
            }
          },
        },
      ]
    );
  };

  const handleStartBulkSchedule = async (totalDays: 365 | 730) => {
    const yearsLabel = totalDays === 365 ? '1 Year (365 Days)' : '2 Years (730 Days)';
    Alert.alert(
      `Prepare ${yearsLabel}`,
      `This will generate and schedule ${totalDays} days of intermediate Bible Quiz data in advance with 5 questions per day.\n\nConfigured Delivery Time:\n${formatTimeTo12Hour(scheduleConfig.scheduledTime)} every morning.`,
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
                'Schedule Complete',
                `Successfully prepared ${res.scheduledCount} daily quizzes!\nCoverage is locked in advance until ${res.endDateStr}.\nQuizzes will be delivered automatically at ${formatTimeTo12Hour(scheduleConfig.scheduledTime)} every morning.`
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

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '05:00 AM';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const onConfirmCustomTime = (selectedDate: Date) => {
    setTimePickerVisible(false);
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const mins = String(selectedDate.getMinutes()).padStart(2, '0');
    setScheduleConfig(prev => ({
      ...prev,
      scheduledTime: `${hours}:${mins}`,
    }));
  };

  // Filtered Church Quizzes
  const filteredChurchQuizzes = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return churchQuizzes.filter(q => {
      // Church filter
      if (selectedChurchFilter !== 'all' && q.churchId !== selectedChurchFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && q.status !== selectedStatusFilter) {
        return false;
      }

      // Search query
      if (query) {
        const titleMatch = (q.title || '').toLowerCase().includes(query);
        const churchMatch = (q.churchName || '').toLowerCase().includes(query);
        const catMatch = (q.category || '').toLowerCase().includes(query);
        const bookMatch = (q.book || '').toLowerCase().includes(query);
        return titleMatch || churchMatch || catMatch || bookMatch;
      }

      return true;
    });
  }, [churchQuizzes, selectedChurchFilter, selectedStatusFilter, searchQuery]);

  // Multi-Selection and Bulk Deletion Handlers for Church Quizzes
  const isAllSelected =
    filteredChurchQuizzes.length > 0 &&
    filteredChurchQuizzes.every(q => selectedQuizKeys.includes(`${q.churchId}:::${q.id}`));

  const toggleSelectQuiz = (quiz: ChurchQuizItem) => {
    const key = `${quiz.churchId}:::${quiz.id}`;
    setSelectedQuizKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuizKeys([]);
    } else {
      setSelectedQuizKeys(filteredChurchQuizzes.map(q => `${q.churchId}:::${q.id}`));
    }
  };

  const handleDeleteSingleQuiz = (quiz: ChurchQuizItem) => {
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to permanently delete "${quiz.title}" from ${quiz.churchName || 'the church'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QuizService.deleteQuiz(quiz.id, quiz.churchId);
              setChurchQuizzes(prev => prev.filter(q => !(q.id === quiz.id && q.churchId === quiz.churchId)));
              setSelectedQuizKeys(prev => prev.filter(k => k !== `${quiz.churchId}:::${quiz.id}`));
              Alert.alert('Deleted', `"${quiz.title}" has been permanently deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete quiz.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSelectedQuizzes = () => {
    if (selectedQuizKeys.length === 0) return;
    const count = selectedQuizKeys.length;

    Alert.alert(
      'Delete Selected Quizzes',
      `Are you sure you want to permanently delete ${count} selected quiz${count > 1 ? 'zes' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delete (${count})`,
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const deletePromises = selectedQuizKeys.map(key => {
                const [churchId, quizId] = key.split(':::');
                return QuizService.deleteQuiz(quizId, churchId);
              });
              await Promise.all(deletePromises);

              setChurchQuizzes(prev =>
                prev.filter(q => !selectedQuizKeys.includes(`${q.churchId}:::${q.id}`))
              );
              setSelectedQuizKeys([]);
              Alert.alert('Deleted', `Successfully deleted ${count} quiz${count > 1 ? 'zes' : ''}.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete some quizzes.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // KPIs for church quizzes
  const churchQuizKpis = useMemo(() => {
    const total = churchQuizzes.length;
    const published = churchQuizzes.filter(q => q.status === 'published').length;
    const scheduled = churchQuizzes.filter(q => q.status === 'scheduled').length;
    const drafts = churchQuizzes.filter(q => q.status === 'draft').length;
    return { total, published, scheduled, drafts };
  }, [churchQuizzes]);

  // Filtered Daily Scripture Bank Days
  const filteredDailyDays = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();

    return scheduledDays.filter(item => {
      if (selectedMonth !== 'All') {
        const monthIndex = parseInt(item.dateStr.split('-')[1], 10) - 1;
        if (MONTHS[monthIndex + 1] !== selectedMonth) return false;
      }

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

  // Render Daily Notification Scheduling Card (Collapsible)
  const renderScheduleConfigCard = () => (
    <View style={styles.scheduleCard}>
      <LinearGradient
        colors={['#1e1b4b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scheduleGradient}
      >
        <TouchableOpacity
          style={styles.scheduleHeaderRow}
          onPress={() => setIsScheduleExpanded(prev => !prev)}
          activeOpacity={0.8}
        >
          <View style={styles.scheduleIconWrap}>
            <Bell size={18} color="#38bdf8" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.scheduleCardTitle}>Daily Quiz Push Schedule</Text>
              <View style={[styles.statusDot, { backgroundColor: scheduleConfig.enabled ? '#10b981' : '#64748b' }]} />
            </View>
            <Text style={styles.scheduleCardSub}>
              {scheduleConfig.enabled
                ? `Delivering daily at ${formatTimeTo12Hour(scheduleConfig.scheduledTime)}`
                : 'Push notification alerts are disabled'}
            </Text>
          </View>
          <View style={styles.scheduleToggleWrap}>
            <Switch
              value={scheduleConfig.enabled}
              onValueChange={(val) => setScheduleConfig(prev => ({ ...prev, enabled: val }))}
              trackColor={{ false: '#334155', true: '#2563eb' }}
              thumbColor={scheduleConfig.enabled ? '#38bdf8' : '#94a3b8'}
            />
            <ChevronDown
              size={18}
              color="#38bdf8"
              style={[
                { marginLeft: 4 },
                isScheduleExpanded && { transform: [{ rotate: '180deg' }] },
              ]}
            />
          </View>
        </TouchableOpacity>

        {isScheduleExpanded && (
          <View style={styles.scheduleExpandedBody}>
            {/* Current Time Display Box */}
            <View style={styles.currentTimeBox}>
              <View>
                <Text style={styles.currentTimeLabel}>Scheduled Delivery Time</Text>
                <Text style={styles.currentTimeVal}>
                  {formatTimeTo12Hour(scheduleConfig.scheduledTime)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.customTimePickerBtn}
                onPress={() => setTimePickerVisible(true)}
                activeOpacity={0.8}
              >
                <Clock size={14} color="#38bdf8" />
                <Text style={styles.customTimePickerBtnTxt}>Pick Time</Text>
              </TouchableOpacity>
            </View>

            {/* Preset Time Chips */}
            <Text style={styles.presetLabel}>Quick Select Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {PRESET_TIMES.map((pt) => {
                const isSelected = scheduleConfig.scheduledTime === pt.value;
                return (
                  <TouchableOpacity
                    key={pt.value}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setScheduleConfig(prev => ({ ...prev, scheduledTime: pt.value }))}
                  >
                    <Text style={[styles.presetChipTxt, isSelected && styles.presetChipTxtActive]}>
                      {pt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons Row */}
            <View style={styles.scheduleActionsRow}>
              <TouchableOpacity
                style={[styles.saveScheduleBtn, savingSchedule && { opacity: 0.7 }]}
                onPress={handleSaveSchedule}
                disabled={savingSchedule}
                activeOpacity={0.8}
              >
                {savingSchedule ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.saveScheduleBtnTxt}>Save Schedule</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.testScheduleBtn}
                onPress={handleTriggerTestNotification}
                activeOpacity={0.8}
              >
                <Send size={14} color="#38bdf8" />
                <Text style={styles.testScheduleBtnTxt}>Device Test</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                borderWidth: 1,
                borderColor: '#38bdf8',
                borderRadius: 10,
                paddingVertical: 10,
                marginTop: 8,
                gap: 6,
              }}
              onPress={handleBroadcastDailyQuizAllNow}
              activeOpacity={0.8}
            >
              <Send size={15} color="#38bdf8" />
              <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: '700' }}>
                Broadcast Live Push to All Members Now 📢
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  // Render SubTab Switcher
  const renderSubTabSwitcher = () => (
    <View style={styles.subTabContainer}>
      <TouchableOpacity
        style={[styles.subTabButton, activeSubTab === 'daily_bank' && styles.subTabButtonActive]}
        onPress={() => setActiveSubTab('daily_bank')}
      >
        <Sparkles size={15} color={activeSubTab === 'daily_bank' ? '#38bdf8' : '#94a3b8'} />
        <Text style={[styles.subTabButtonTxt, activeSubTab === 'daily_bank' && styles.subTabButtonTxtActive]}>
          Daily Bank (365 Days)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.subTabButton, activeSubTab === 'church_quizzes' && styles.subTabButtonActive]}
        onPress={() => setActiveSubTab('church_quizzes')}
      >
        <Building size={15} color={activeSubTab === 'church_quizzes' ? '#38bdf8' : '#94a3b8'} />
        <Text style={[styles.subTabButtonTxt, activeSubTab === 'church_quizzes' && styles.subTabButtonTxtActive]}>
          Church Quizzes ({churchQuizzes.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render Church Quizzes Header
  const renderChurchQuizzesHeader = () => (
    <View style={styles.headerWrapper}>
      {renderSubTabSwitcher()}

      {/* Info Notice Box */}
      <View style={styles.churchQuizNoticeBox}>
        <View style={styles.churchQuizNoticeHeader}>
          <Building size={14} color="#38bdf8" />
          <Text style={styles.churchQuizNoticeTitle}>
            Church Quizzes ({churchQuizzes.length} Quizzes across {churchesList.length} Churches)
          </Text>
        </View>
        <Text style={styles.churchQuizNoticeSub}>
          Showing {churchQuizzes.length} total quizzes created by pastors and church admins across {churchesList.length} registered churches. Use checkboxes below to select multiple quizzes and delete them in bulk, or delete individually.
        </Text>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiCardsRow}>
        <View style={styles.kpiCardItem}>
          <Text style={styles.kpiCardCount}>{churchQuizKpis.total}</Text>
          <Text style={styles.kpiCardLabel}>Total Quizzes</Text>
        </View>
        <View style={[styles.kpiCardItem, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <Text style={[styles.kpiCardCount, { color: '#10b981' }]}>{churchQuizKpis.published}</Text>
          <Text style={styles.kpiCardLabel}>Published</Text>
        </View>
        <View style={[styles.kpiCardItem, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
          <Text style={[styles.kpiCardCount, { color: '#38bdf8' }]}>{churchQuizKpis.scheduled}</Text>
          <Text style={styles.kpiCardLabel}>Scheduled</Text>
        </View>
        <View style={[styles.kpiCardItem, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
          <Text style={[styles.kpiCardCount, { color: '#f59e0b' }]}>{churchQuizKpis.drafts}</Text>
          <Text style={styles.kpiCardLabel}>Drafts</Text>
        </View>
      </View>

      {/* Bulk Selection Toolbar */}
      <View style={styles.bulkToolbar}>
        <TouchableOpacity
          style={styles.bulkSelectAllBtn}
          onPress={handleToggleSelectAll}
          activeOpacity={0.7}
        >
          {isAllSelected ? (
            <CheckSquare size={16} color="#38bdf8" />
          ) : (
            <Square size={16} color="#94a3b8" />
          )}
          <Text style={[styles.bulkSelectAllTxt, isAllSelected && styles.bulkSelectAllTxtActive]}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
          <View style={styles.bulkCountBadge}>
            <Text style={styles.bulkCountBadgeTxt}>
              {selectedQuizKeys.length} / {filteredChurchQuizzes.length}
            </Text>
          </View>
        </TouchableOpacity>

        {selectedQuizKeys.length > 0 && (
          <TouchableOpacity
            style={styles.bulkDeleteBtn}
            onPress={handleDeleteSelectedQuizzes}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Trash2 size={13} color="#ffffff" />
                <Text style={styles.bulkDeleteBtnTxt}>
                  Delete ({selectedQuizKeys.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['all', 'published', 'scheduled', 'draft'].map((st) => {
            const isSelected = selectedStatusFilter === st;
            const label = st === 'all' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1);
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedStatusFilter(st)}
              >
                <Text style={[styles.filterChipTxt, isSelected && styles.filterChipTxtActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Church Filter Chips */}
      {churchesList.length > 0 && (
        <View style={[styles.filterBar, { paddingTop: 0 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              style={[styles.filterChip, selectedChurchFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedChurchFilter('all')}
            >
              <Text style={[styles.filterChipTxt, selectedChurchFilter === 'all' && styles.filterChipTxtActive]}>
                All Churches
              </Text>
            </TouchableOpacity>
            {churchesList.map((ch) => {
              const isSelected = selectedChurchFilter === ch.id;
              return (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedChurchFilter(ch.id)}
                >
                  <Text style={[styles.filterChipTxt, isSelected && styles.filterChipTxtActive]}>
                    {ch.name || 'Church'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // Render Daily Scripture Bank Header
  const renderDailyBankHeader = () => (
    <View style={styles.headerWrapper}>
      {renderSubTabSwitcher()}
      {renderScheduleConfigCard()}

      {/* 365-Day Scripture Bank Status & Extension Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBanner}>
          <View style={styles.kpiTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.kpiIconWrap}>
                <Sparkles size={16} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiTitle}>365-Day Scripture Bank</Text>
                <Text style={styles.kpiSub}>
                  {scheduledDays.length} Days pre-configured · Auto {formatTimeTo12Hour(scheduleConfig.scheduledTime)} delivery
                </Text>
              </View>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.liveBadgeTxt}>Active</Text>
            </View>
          </View>

          {/* Sleek Action Buttons Row */}
          <View style={styles.actionBtnsRow}>
            <TouchableOpacity
              style={styles.actionPillBtnBlue}
              onPress={() => handleStartBulkSchedule(365)}
              activeOpacity={0.75}
            >
              <Sparkles size={14} color="#38bdf8" />
              <Text style={styles.actionPillTxtBlue}>Extend 1 Year (365d)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillBtnAmber}
              onPress={() => handleStartBulkSchedule(730)}
              activeOpacity={0.75}
            >
              <Calendar size={14} color="#fbbf24" />
              <Text style={styles.actionPillTxtAmber}>Extend 2 Years (730d)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Month Filter Bar */}
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
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingTxt}>Loading church quizzes and daily schedules...</Text>
        </View>
      ) : activeSubTab === 'church_quizzes' ? (
        /* Church Quizzes List */
        <FlatList
          data={filteredChurchQuizzes}
          keyExtractor={(item) => `${item.churchId}_${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderChurchQuizzesHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={40} color="#64748b" />
              <Text style={styles.emptyTitle}>No Church Quizzes Found</Text>
              <Text style={styles.emptySub}>
                Quizzes published by church administrators will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const itemKey = `${item.churchId}:::${item.id}`;
            const isSelected = selectedQuizKeys.includes(itemKey);
            const isBroadcasting = broadcastingId === item.id;
            const statusColor =
              item.status === 'published' ? '#10b981' :
              item.status === 'scheduled' ? '#38bdf8' : '#f59e0b';

            return (
              <View style={[styles.churchQuizCard, isSelected && styles.churchQuizCardSelected]}>
                {/* Header: Checkbox + Church Name Badge + Status Pill */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <TouchableOpacity
                      style={styles.cardCheckboxTouch}
                      onPress={() => toggleSelectQuiz(item)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isSelected ? (
                        <CheckSquare size={19} color="#38bdf8" />
                      ) : (
                        <Square size={19} color="#64748b" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.churchNameBadge}>
                      <Building size={12} color="#38bdf8" />
                      <Text style={styles.churchNameBadgeTxt} numberOfLines={1}>
                        {item.churchName || 'Church'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
                    <Text style={[styles.statusPillTxt, { color: statusColor }]}>
                      {(item.status || 'draft').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Title & Category */}
                <Text style={styles.churchQuizTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.churchQuizCategory}>
                  {item.book ? `${item.book}${item.chapterStart ? ` · Ch. ${item.chapterStart}` : ''}` : (item.category || 'General')}
                  {item.difficulty ? ` · ${item.difficulty.toUpperCase()}` : ''}
                </Text>

                {/* Scheduled Info if applicable */}
                {item.status === 'scheduled' && (
                  <View style={styles.scheduledNoticeBox}>
                    <Clock size={13} color="#38bdf8" />
                    <Text style={styles.scheduledNoticeTxt}>
                      Scheduled for {item.scheduledDate || 'Upcoming'} at {item.scheduledTime || '05:00 AM'}
                    </Text>
                  </View>
                )}

                {/* Metadata Row */}
                <View style={styles.cardMetaRow}>
                  <View style={styles.metaChip}>
                    <BookOpen size={12} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>
                      {item.questions?.length || 0} Questions
                    </Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>
                      {item.timeLimitMinutes || 5} Mins
                    </Text>
                  </View>
                </View>

                {/* Actions: Inspect & Broadcast & Single Delete */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.cardInspectBtn}
                    onPress={() => setInspectQuiz(item)}
                    activeOpacity={0.7}
                  >
                    <Eye size={13} color="#38bdf8" />
                    <Text style={styles.cardInspectBtnTxt}>Inspect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardBroadcastBtn, isBroadcasting && { opacity: 0.6 }]}
                    onPress={() => handleBroadcastQuizNow(item)}
                    disabled={isBroadcasting}
                    activeOpacity={0.7}
                  >
                    {isBroadcasting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Send size={12} color="#ffffff" />
                        <Text style={styles.cardBroadcastBtnTxt}>Broadcast</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardDeleteSingleBtn}
                    onPress={() => handleDeleteSingleQuiz(item)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        /* Daily Scripture Bank 365 Days List */
        <FlatList
          data={filteredDailyDays}
          keyExtractor={(item) => item.dateStr}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderDailyBankHeader}
          renderItem={({ item }) => {
            const isToday = item.dateStr === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                style={[styles.dayCard, isToday && styles.dayCardToday]}
                onPress={() => setInspectQuiz(item.quiz)}
                activeOpacity={0.75}
              >
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

                <View style={styles.dayMetaRow}>
                  <View style={styles.metaChip}>
                    <Clock size={11} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>
                      {formatTimeTo12Hour(scheduleConfig.scheduledTime)}
                    </Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <Clock size={11} color="#fbbf24" />
                    <Text style={[styles.metaChipTxt, { color: '#fbbf24', fontWeight: '700' }]}>
                      5 Mins
                    </Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <BookOpen size={11} color="#94a3b8" />
                    <Text style={styles.metaChipTxt}>
                      {item.quiz.questions.length} Qs
                    </Text>
                  </View>
                  <View style={styles.metaDividerDot} />
                  <View style={styles.metaChip}>
                    <Text style={[styles.metaChipTxt, { color: '#38bdf8', fontWeight: '700' }]}>
                      Intermediate
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Date/Time Picker Modal for Custom Scheduling */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={onConfirmCustomTime}
        onCancel={() => setTimePickerVisible(false)}
      />

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
                  {inspectQuiz?.churchName ? `${inspectQuiz.churchName} · ` : ''}
                  {inspectQuiz?.questions?.length || 0} Questions
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
              {/* Language Switcher Bar for Preview */}
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
                  <Text style={styles.inspectPillTxt}>Difficulty: {inspectQuiz?.difficulty || 'Intermediate'}</Text>
                </View>
                <View style={[styles.inspectPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.inspectPillTxt, { color: '#f59e0b' }]}>⏱ Time Limit: {inspectQuiz?.timeLimitMinutes || 5} Mins</Text>
                </View>
                <View style={[styles.inspectPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.inspectPillTxt, { color: '#10b981' }]}>Status: {inspectQuiz?.status || 'Active'}</Text>
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
  subTabContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subTabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  subTabButtonTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  subTabButtonTxtActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  scheduleCard: {
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  scheduleGradient: {
    padding: 14,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  scheduleCardSub: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 2,
  },
  scheduleToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  scheduleExpandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  currentTimeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  currentTimeLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentTimeVal: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
  },
  customTimePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  customTimePickerBtnTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  presetLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  presetChipTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTxtActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  scheduleActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveScheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveScheduleBtnTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  testScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  testScheduleBtnTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiCardItem: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiCardCount: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiCardLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  filterBar: {
    paddingVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  filterChipTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  churchQuizNoticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.07)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  churchQuizNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  churchQuizNoticeTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  churchQuizNoticeSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
  bulkToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  bulkSelectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkSelectAllTxt: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  bulkSelectAllTxtActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  bulkCountBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  bulkCountBadgeTxt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bulkDeleteBtnTxt: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  churchQuizCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  churchQuizCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c1b33',
  },
  cardCheckboxTouch: {
    padding: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  churchNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '70%',
  },
  churchNameBadgeTxt: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  churchQuizTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  churchQuizCategory: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  scheduledNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  scheduledNoticeTxt: {
    color: '#38bdf8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInspectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  cardInspectBtnTxt: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBroadcastBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
  },
  cardBroadcastBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDeleteSingleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWrapper: {
    marginBottom: 4,
  },
  kpiContainer: {
    paddingTop: 2,
    paddingBottom: 8,
  },
  kpiBanner: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    color: '#f8fafc',
    fontSize: 14.5,
    fontWeight: '800',
  },
  kpiSub: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeTxt: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPillBtnBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  actionPillTxtBlue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  actionPillBtnAmber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  actionPillTxtAmber: {
    color: '#fbbf24',
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
    flexWrap: 'wrap',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
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
