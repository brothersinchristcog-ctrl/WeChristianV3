import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Clock,
  BarChart2,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Filter,
  ChevronLeft,
  X,
  Check,
  AlertTriangle,
  Trophy,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Phone,
  Eye,
  PauseCircle,
  Send,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BibleQuiz, QuizStatus, QuizAttempt } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { useChurch } from '../../../context/ChurchContext';
import { AdminTabContext } from '../../../context/AdminTabContext';
import AdminQuizEditor from './AdminQuizEditor';
import AdminQuizReports from './AdminQuizReports';
import { formatQuizTime } from '../../../utils/QuizScheduleUtils';

export default function AdminQuizList() {
  const navigation = useNavigation<any>();
  const adminTabCtx = useContext(AdminTabContext);
  const { activeChurch } = useChurch();
  const churchId = activeChurch?.id || 'global';
  const churchName = activeChurch?.name || 'WeChristian Church';

  const [quizzes, setQuizzes] = useState<BibleQuiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Reports State
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(false);
  const [reportSort, setReportSort] = useState<'rank' | 'recent'>('rank');
  const [reportQuizFilter, setReportQuizFilter] = useState<string>('All');
  const [inspectAttempt, setInspectAttempt] = useState<QuizAttempt | null>(null);

  // Navigation / View states
  const [currentView, setCurrentView] = useState<'list' | 'editor' | 'reports'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<BibleQuiz | null>(null);

  // Custom Delete Flow States
  const [quizToDelete, setQuizToDelete] = useState<BibleQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccessTitle, setDeleteSuccessTitle] = useState<string | null>(null);

  // Custom Delete Report / Attempt Flow States
  const [attemptToDelete, setAttemptToDelete] = useState<QuizAttempt | null>(null);
  const [isDeletingAttempt, setIsDeletingAttempt] = useState<boolean>(false);
  const [deleteAttemptSuccessName, setDeleteAttemptSuccessName] = useState<string | null>(null);

  const handleGoBack = () => {
    if (adminTabCtx?.goBack) {
      adminTabCtx.goBack();
    } else if (adminTabCtx?.setActiveTab) {
      adminTabCtx.setActiveTab(0);
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [churchId]);

  useEffect(() => {
    if (statusFilter === 'Reports') {
      loadAttempts();
    }
  }, [statusFilter, churchId]);

  const loadQuizzes = async (isManualRefresh = false) => {
    try {
      if (quizzes.length === 0 && !isManualRefresh) {
        setLoading(true);
      }
      QuizService.clearCache();
      const list = await QuizService.getQuizzes(churchId, { isAdmin: true, forceRefresh: true });
      setQuizzes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAttempts = async (isManualRefresh = false) => {
    try {
      if (attempts.length === 0 && !isManualRefresh) {
        setLoadingAttempts(true);
      }
      const list = await QuizService.getAllChurchQuizAttempts(churchId, isManualRefresh);
      setAttempts(list);
    } catch (err) {
      console.warn('[AdminQuizList] Error loading church quiz attempts:', err);
    } finally {
      setLoadingAttempts(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (statusFilter === 'Reports') {
      loadAttempts(true);
    } else {
      loadQuizzes(true);
    }
  };

  const handleDeleteQuiz = (quiz: BibleQuiz) => {
    setQuizToDelete(quiz);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const targetTitle = quizToDelete.title;
    const targetId = quizToDelete.id;
    setIsDeleting(true);
    try {
      await QuizService.deleteQuiz(targetId, churchId);
      setQuizzes(prev => prev.filter(q => q.id !== targetId));
      setQuizToDelete(null);
      setDeleteSuccessTitle(targetTitle);
    } catch {
      Alert.alert('Error', 'Failed to delete quiz. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAttempt = (attempt: QuizAttempt) => {
    setAttemptToDelete(attempt);
  };

  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;
    const memberName = attemptToDelete.memberName || 'Member';
    const targetId = attemptToDelete.id;
    setIsDeletingAttempt(true);
    try {
      await QuizService.deleteQuizAttempt(targetId, churchId);
      setAttempts(prev => prev.filter(a => a.id !== targetId));
      if (inspectAttempt?.id === targetId) {
        setInspectAttempt(null);
      }
      setAttemptToDelete(null);
      setDeleteAttemptSuccessName(memberName);
    } catch {
      Alert.alert('Error', 'Failed to delete quiz report. Please try again.');
    } finally {
      setIsDeletingAttempt(false);
    }
  };

  const handleTogglePublish = async (quiz: BibleQuiz) => {
    const newStatus: QuizStatus = quiz.status === 'published' ? 'draft' : 'published';
    const today = new Date().toISOString().split('T')[0];
    try {
      await QuizService.saveQuiz({
        ...quiz,
        id: quiz.id,
        churchId: quiz.churchId || churchId,
        status: newStatus,
        scheduledDate: quiz.scheduledDate || today,
      });
      setQuizzes(prev =>
        prev.map(q => (q.id === quiz.id ? { ...q, status: newStatus, scheduledDate: q.scheduledDate || today } : q))
      );
    } catch (err: any) {
      console.error('[AdminQuizList] handleTogglePublish error:', err);
      Alert.alert('Error', err?.message || 'Failed to update status.');
    }
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.book && q.book.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.category && q.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'Published') return q.status === 'published';
    if (statusFilter === 'Scheduled') return q.status === 'scheduled';
    if (statusFilter === 'Drafts') return q.status === 'draft';
    if (statusFilter === 'Daily') return q.isDailyQuiz;

    return true;
  });

  // Helper: format duration in minutes and seconds
  const formatCompletionTime = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Process & rank member quiz attempts
  const filteredAndRankedAttempts = useMemo(() => {
    let list = [...attempts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        a =>
          (a.memberName && a.memberName.toLowerCase().includes(q)) ||
          (a.quizTitle && a.quizTitle.toLowerCase().includes(q)) ||
          (a.memberPhone && a.memberPhone.includes(q))
      );
    }

    if (reportQuizFilter !== 'All') {
      list = list.filter(a => a.quizId === reportQuizFilter || a.quizTitle === reportQuizFilter);
    }

    if (reportSort === 'rank') {
      list.sort((a, b) => {
        const pctDiff = (b.percentage ?? 0) - (a.percentage ?? 0);
        if (pctDiff !== 0) return pctDiff;
        const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.timeTakenSeconds ?? 0) - (b.timeTakenSeconds ?? 0);
      });
    } else {
      list.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
        return timeB - timeA;
      });
    }

    return list;
  }, [attempts, searchQuery, reportQuizFilter, reportSort]);

  const attemptedQuizzes = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach(a => {
      if (a.quizId && a.quizTitle) {
        map.set(a.quizId, a.quizTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  // Calculate high-level metrics
  const totalCount = quizzes.length;
  const publishedCount = quizzes.filter(q => q.status === 'published' || !q.status).length;
  const scheduledCount = quizzes.filter(q => q.status === 'scheduled').length;
  const draftCount = quizzes.filter(q => q.status === 'draft').length;

  if (currentView === 'editor') {
    return (
      <AdminQuizEditor
        initialQuiz={selectedQuiz}
        churchId={churchId}
        churchName={churchName}
        onBack={() => {
          setSelectedQuiz(null);
          setCurrentView('list');
        }}
        onSaved={() => {
          setSelectedQuiz(null);
          setCurrentView('list');
          loadQuizzes(true);
        }}
      />
    );
  }

  if (currentView === 'reports' && selectedQuiz) {
    return (
      <AdminQuizReports
        quizId={selectedQuiz.id}
        onBack={() => {
          setSelectedQuiz(null);
          setCurrentView('list');
        }}
      />
    );
  }

  // ─── Delete Confirmation Modal ──────────────────────────────────────────
  const renderDeleteModal = () => {
    if (!quizToDelete) return null;

    return (
      <Modal visible={!!quizToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              onPress={() => !isDeleting && setQuizToDelete(null)}
              style={styles.deleteCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={isDeleting}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Crimson Danger Icon */}
            <View style={styles.deleteIconCircle}>
              <Trash2 size={24} color="#DC2626" />
            </View>

            <Text style={styles.deleteTitle}>Delete Bible Quiz?</Text>
            <Text style={styles.deleteSubtitle}>
              This quiz will be permanently removed from your church library.
            </Text>

            {/* Quiz Info Box */}
            <View style={styles.deleteQuizPreviewBox}>
              <Text style={styles.deleteQuizPreviewTitle} numberOfLines={2}>
                "{quizToDelete.title}"
              </Text>
              <View style={styles.deleteQuizBadgesRow}>
                <View style={styles.deleteQuizBadge}>
                  <BookOpen size={11} color="#1a2d5a" />
                  <Text style={styles.deleteQuizBadgeTxt}>
                    {quizToDelete.questions?.length || 0} Questions
                  </Text>
                </View>
                <View style={styles.deleteQuizBadge}>
                  <Text style={styles.deleteQuizBadgeTxt}>
                    {(quizToDelete.difficulty || 'MEDIUM').toUpperCase()}
                  </Text>
                </View>
                {Boolean(quizToDelete.category || quizToDelete.topic) && (
                  <View style={styles.deleteQuizBadge}>
                    <Text style={styles.deleteQuizBadgeTxt} numberOfLines={1}>
                      {quizToDelete.category || quizToDelete.topic}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Warning Note */}
            <View style={styles.deleteWarningBox}>
              <AlertTriangle size={13} color="#D97706" />
              <Text style={styles.deleteWarningTxt}>
                Member scores and attempt history will also be deleted.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.deleteActionsRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setQuizToDelete(null)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={confirmDeleteQuiz}
                disabled={isDeleting}
                activeOpacity={0.85}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Trash2 size={15} color="#ffffff" />
                    <Text style={styles.deleteConfirmBtnTxt}>Delete Quiz</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Delete Success Modal ───────────────────────────────────────────────
  const renderDeleteSuccessModal = () => {
    if (!deleteSuccessTitle) return null;

    return (
      <Modal visible={!!deleteSuccessTitle} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteSuccessIconCircle}>
              <CheckCircle size={30} color="#059669" />
            </View>

            <Text style={styles.deleteTitle}>Quiz Deleted</Text>
            <Text style={styles.deleteSubtitle}>
              "{deleteSuccessTitle}" has been removed from your church quiz library.
            </Text>

            <TouchableOpacity
              style={styles.deleteSuccessBtn}
              onPress={() => setDeleteSuccessTitle(null)}
              activeOpacity={0.85}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.deleteSuccessBtnTxt}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Delete Report Confirmation Modal ───────────────────────────────────────
  const renderDeleteAttemptModal = () => {
    if (!attemptToDelete) return null;

    return (
      <Modal visible={!!attemptToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            <TouchableOpacity
              onPress={() => !isDeletingAttempt && setAttemptToDelete(null)}
              style={styles.deleteCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={isDeletingAttempt}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.deleteIconCircle}>
              <Trash2 size={24} color="#DC2626" />
            </View>

            <Text style={styles.deleteTitle}>Delete Quiz Report?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure you want to delete this member's quiz report?
            </Text>

            <View style={styles.deleteQuizPreviewBox}>
              <Text style={styles.deleteQuizPreviewTitle} numberOfLines={2}>
                {attemptToDelete.memberName || 'Member'}
              </Text>
              <View style={styles.deleteQuizBadgesRow}>
                <View style={styles.deleteQuizBadge}>
                  <BookOpen size={11} color="#1a2d5a" />
                  <Text style={styles.deleteQuizBadgeTxt} numberOfLines={1}>
                    {attemptToDelete.quizTitle || 'Bible Quiz'}
                  </Text>
                </View>
                <View style={styles.deleteQuizBadge}>
                  <Text style={styles.deleteQuizBadgeTxt}>
                    {attemptToDelete.score}/{attemptToDelete.totalMarks} ({attemptToDelete.percentage}%)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.deleteWarningBox}>
              <AlertTriangle size={13} color="#D97706" />
              <Text style={styles.deleteWarningTxt}>
                This member's attempt record, answers, and ranking will be removed.
              </Text>
            </View>

            <View style={styles.deleteActionsRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setAttemptToDelete(null)}
                disabled={isDeletingAttempt}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={confirmDeleteAttempt}
                disabled={isDeletingAttempt}
                activeOpacity={0.8}
              >
                {isDeletingAttempt ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={styles.deleteConfirmBtnTxt}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Delete Report Success Modal ───────────────────────────────────────────
  const renderDeleteAttemptSuccessModal = () => {
    if (!deleteAttemptSuccessName) return null;

    return (
      <Modal visible={!!deleteAttemptSuccessName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteSuccessIconCircle}>
              <CheckCircle size={30} color="#059669" />
            </View>

            <Text style={styles.deleteTitle}>Report Deleted</Text>
            <Text style={styles.deleteSubtitle}>
              The quiz attempt report for "{deleteAttemptSuccessName}" has been removed.
            </Text>

            <TouchableOpacity
              style={styles.deleteSuccessBtn}
              onPress={() => setDeleteAttemptSuccessName(null)}
              activeOpacity={0.85}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.deleteSuccessBtnTxt}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Reports Section Rendering ──────────────────────────────────────────
  const renderReportsSection = () => {
    const totalAttemptsCount = attempts.length;
    const uniqueParticipantsCount = new Set(attempts.map(a => a.userId)).size;
    const avgScore = totalAttemptsCount > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttemptsCount)
      : 0;

    return (
      <View style={styles.reportsContainer}>
        {/* Reports Header Card & High-level Metrics */}
        <View style={styles.reportsHeaderCard}>
          <View style={styles.reportsHeaderTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.reportsHeaderTitle}>Quiz Results & Leaderboard</Text>
              <Text style={styles.reportsHeaderSubtitle}>
                Member participation, scores, and prize rankings
              </Text>
            </View>
            <View style={styles.reportsCounterBadge}>
              <Users size={13} color="#1a2d5a" />
              <Text style={styles.reportsCounterBadgeTxt}>{uniqueParticipantsCount} Members</Text>
            </View>
          </View>

          {/* Mini Stats Grid */}
          <View style={styles.reportsMiniStatsRow}>
            <View style={styles.reportsMiniStat}>
              <Text style={styles.reportsMiniStatNum}>{totalAttemptsCount}</Text>
              <Text style={styles.reportsMiniStatLbl}>Total Attempts</Text>
            </View>
            <View style={styles.reportsMiniStatDivider} />
            <View style={styles.reportsMiniStat}>
              <Text style={[styles.reportsMiniStatNum, { color: '#059669' }]}>{avgScore}%</Text>
              <Text style={styles.reportsMiniStatLbl}>Average Score</Text>
            </View>
            <View style={styles.reportsMiniStatDivider} />
            <View style={styles.reportsMiniStat}>
              <Text style={[styles.reportsMiniStatNum, { color: '#C9A84C' }]}>
                {filteredAndRankedAttempts[0] ? `${filteredAndRankedAttempts[0].percentage}%` : '0%'}
              </Text>
              <Text style={styles.reportsMiniStatLbl}>Top Score</Text>
            </View>
          </View>

          {/* Sort Switcher (Rank vs Recent) */}
          <View style={styles.sortToggleRow}>
            <Text style={styles.sortToggleLbl}>Sort by:</Text>
            <View style={styles.sortToggleButtons}>
              <TouchableOpacity
                style={[styles.sortBtn, reportSort === 'rank' && styles.sortBtnActive]}
                onPress={() => setReportSort('rank')}
                activeOpacity={0.8}
              >
                <Trophy size={13} color={reportSort === 'rank' ? '#ffffff' : '#475569'} />
                <Text style={[styles.sortBtnTxt, reportSort === 'rank' && styles.sortBtnTxtActive]}>
                  Rank (Winners)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, reportSort === 'recent' && styles.sortBtnActive]}
                onPress={() => setReportSort('recent')}
                activeOpacity={0.8}
              >
                <Clock size={13} color={reportSort === 'recent' ? '#ffffff' : '#475569'} />
                <Text style={[styles.sortBtnTxt, reportSort === 'recent' && styles.sortBtnTxtActive]}>
                  Recent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quiz Filter Chips if multiple quizzes */}
          {attemptedQuizzes.length > 1 && (
            <View style={{ marginTop: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  style={[styles.quizFilterChip, reportQuizFilter === 'All' && styles.quizFilterChipActive]}
                  onPress={() => setReportQuizFilter('All')}
                >
                  <Text style={[styles.quizFilterChipTxt, reportQuizFilter === 'All' && styles.quizFilterChipTxtActive]}>
                    All Quizzes ({attempts.length})
                  </Text>
                </TouchableOpacity>
                {attemptedQuizzes.map(q => {
                  const isSelected = reportQuizFilter === q.id || reportQuizFilter === q.title;
                  const qCount = attempts.filter(a => a.quizId === q.id || a.quizTitle === q.title).length;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[styles.quizFilterChip, isSelected && styles.quizFilterChipActive]}
                      onPress={() => setReportQuizFilter(q.id)}
                    >
                      <Text style={[styles.quizFilterChipTxt, isSelected && styles.quizFilterChipTxtActive]} numberOfLines={1}>
                        {q.title} ({qCount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 🏆 Top 3 Winners Podium Banner (when sorted by rank & attempts exist) */}
        {reportSort === 'rank' && filteredAndRankedAttempts.length > 0 && (
          <View style={styles.podiumCard}>
            <View style={styles.podiumHeaderRow}>
              <Trophy size={18} color="#C9A84C" />
              <Text style={styles.podiumHeaderTitle}>Top Performers & Prize Candidates</Text>
            </View>
            <View style={styles.podiumList}>
              {filteredAndRankedAttempts.slice(0, 3).map((item, idx) => {
                const medalIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                const prizeLabel = idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : '3rd Place';
                const badgeBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#E2E8F0' : '#FED7AA';
                const badgeBorder = idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#F97316';
                return (
                  <View key={`winner-${item.id || idx}`} style={styles.podiumItemRow}>
                    <View style={[styles.podiumMedalBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                      <Text style={styles.podiumMedalTxt}>{medalIcon} {prizeLabel}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.podiumMemberName} numberOfLines={1}>{item.memberName || 'Member'}</Text>
                      <Text style={styles.podiumQuizSub} numberOfLines={1}>{item.quizTitle}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.podiumScoreTxt}>{item.percentage}%</Text>
                      <Text style={styles.podiumTimeTxt}>⏱️ {formatCompletionTime(item.timeTakenSeconds)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* List of Member Attempt Results */}
        {loadingAttempts ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#1a2d5a" />
            <Text style={styles.loadingTxt}>Loading member attempt reports...</Text>
          </View>
        ) : filteredAndRankedAttempts.length === 0 ? (
          <View style={styles.emptyState}>
            <Award size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Quiz Attempts Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || reportQuizFilter !== 'All'
                ? 'No attempt results matched your filter criteria.'
                : 'When church members attempt Bible Quizzes, their results, scores, completion times, and answer details will appear here.'}
            </Text>
          </View>
        ) : (
          filteredAndRankedAttempts.map((attempt, index) => {
            const rank = index + 1;
            const isRank1 = reportSort === 'rank' && rank === 1;
            const isRank2 = reportSort === 'rank' && rank === 2;
            const isRank3 = reportSort === 'rank' && rank === 3;
            const rankBadgeColor = isRank1 ? '#FEF3C7' : isRank2 ? '#E2E8F0' : isRank3 ? '#FED7AA' : '#F1F5F9';
            const rankTextColor = isRank1 ? '#B45309' : isRank2 ? '#334155' : isRank3 ? '#C2410C' : '#64748B';
            const rankBorderColor = isRank1 ? '#FDE68A' : isRank2 ? '#CBD5E1' : isRank3 ? '#FDBA74' : '#E2E8F0';

            const submittedDateStr = attempt.submittedAt?.toDate
              ? attempt.submittedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Recent';

            return (
              <View key={attempt.id} style={styles.attemptCard}>
                {/* Top Row: Rank & Score */}
                <View style={styles.attemptCardHeader}>
                  <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor, borderColor: rankBorderColor }]}>
                    <Text style={[styles.rankBadgeTxt, { color: rankTextColor }]}>
                      {isRank1 ? '🥇 #1' : isRank2 ? '🥈 #2' : isRank3 ? '🥉 #3' : `#${rank}`}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.attemptPassBadge,
                      attempt.passed ? styles.attemptPassBadgeGood : styles.attemptPassBadgeFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.attemptPassBadgeTxt,
                        attempt.passed ? { color: '#059669' } : { color: '#DC2626' },
                      ]}
                    >
                      {attempt.passed ? '✓ Passed' : '✕ Needs Improvement'}
                    </Text>
                  </View>

                  <View style={styles.attemptScorePill}>
                    <Text style={styles.attemptScoreTxt}>{attempt.percentage}%</Text>
                    <Text style={styles.attemptScoreSub}>
                      ({attempt.score}/{attempt.totalMarks} pts)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.attemptTrashBtn}
                    onPress={() => handleDeleteAttempt(attempt)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Member Profile Row */}
                <View style={styles.attemptMemberRow}>
                  <View style={styles.attemptAvatarCircle}>
                    <Text style={styles.attemptAvatarTxt}>
                      {(attempt.memberName || 'M').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.attemptMemberName}>{attempt.memberName || 'Church Member'}</Text>
                    <View style={styles.attemptMetaRow}>
                      {Boolean(attempt.memberPhone) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 8 }}>
                          <Phone size={10} color="#64748B" />
                          <Text style={styles.attemptMetaTxt}>{attempt.memberPhone}</Text>
                        </View>
                      )}
                      <Text style={styles.attemptMetaTxt}>🕒 {submittedDateStr}</Text>
                    </View>
                  </View>
                </View>

                {/* Attempted Quiz Box */}
                <View style={styles.attemptQuizBox}>
                  <BookOpen size={13} color="#1a2d5a" />
                  <Text style={styles.attemptQuizTitle} numberOfLines={1}>
                    {attempt.quizTitle || 'Bible Quiz'}
                  </Text>
                </View>

                {/* Detailed Metrics Row */}
                <View style={styles.attemptMetricsRow}>
                  <View style={styles.metricPillCorrect}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={styles.metricPillCorrectTxt}>
                      {attempt.correctCount ?? 0} Correct
                    </Text>
                  </View>

                  <View style={styles.metricPillWrong}>
                    <XCircle size={12} color="#DC2626" />
                    <Text style={styles.metricPillWrongTxt}>
                      {attempt.wrongCount ?? 0} Incorrect
                    </Text>
                  </View>

                  <View style={styles.metricPillTime}>
                    <Clock size={12} color="#2563EB" />
                    <Text style={styles.metricPillTimeTxt}>
                      {formatCompletionTime(attempt.timeTakenSeconds)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row: Review Answers & Delete */}
                <View style={styles.attemptActionsRow}>
                  {Array.isArray(attempt.answers) && attempt.answers.length > 0 ? (
                    <TouchableOpacity
                      style={styles.reviewAnswersBtn}
                      onPress={() => setInspectAttempt(attempt)}
                      activeOpacity={0.82}
                    >
                      <FileText size={13} color="#1a2d5a" />
                      <Text style={styles.reviewAnswersBtnTxt}>
                        Review Answers ({attempt.answers.length} Qs)
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}

                  <TouchableOpacity
                    style={styles.deleteAttemptBtn}
                    onPress={() => handleDeleteAttempt(attempt)}
                    activeOpacity={0.82}
                  >
                    <Trash2 size={13} color="#DC2626" />
                    <Text style={styles.deleteAttemptBtnTxt}>Delete Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  // ─── Answer Review Modal ────────────────────────────────────────────────
  const renderAnswerReviewModal = () => {
    if (!inspectAttempt) return null;

    return (
      <Modal visible={!!inspectAttempt} transparent animationType="slide">
        <View style={styles.reviewModalOverlay}>
          <View style={styles.reviewModalCard}>
            {/* Modal Header */}
            <View style={styles.reviewModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.reviewModalTitle} numberOfLines={1}>
                  {inspectAttempt.memberName}'s Answers
                </Text>
                <Text style={styles.reviewModalSubtitle} numberOfLines={1}>
                  {inspectAttempt.quizTitle} · Score: {inspectAttempt.percentage}% · Time: {formatCompletionTime(inspectAttempt.timeTakenSeconds)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setInspectAttempt(null)}
                style={styles.reviewModalCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Questions List */}
            <ScrollView style={styles.reviewModalScroll} showsVerticalScrollIndicator={false}>
              {(inspectAttempt.answers || []).map((ans, idx) => {
                const isCorrect = ans.isCorrect;
                const memberSelectedStr = Array.isArray(ans.selectedAnswer)
                  ? ans.selectedAnswer.join(', ')
                  : String(ans.selectedAnswer || 'Not answered');
                const correctAnswerStr = Array.isArray(ans.correctAnswer)
                  ? ans.correctAnswer.join(', ')
                  : String(ans.correctAnswer || '');

                return (
                  <View key={ans.questionId || idx} style={styles.reviewQCard}>
                    <View style={styles.reviewQTopRow}>
                      <View style={styles.reviewQNumPill}>
                        <Text style={styles.reviewQNumPillTxt}>Q{idx + 1}</Text>
                      </View>
                      <View
                        style={[
                          styles.reviewQResultBadge,
                          isCorrect ? styles.reviewQResultBadgeCorrect : styles.reviewQResultBadgeWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewQResultBadgeTxt,
                            isCorrect ? { color: '#059669' } : { color: '#DC2626' },
                          ]}
                        >
                          {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.reviewQText}>{ans.question}</Text>

                    {/* Member's answer */}
                    <View
                      style={[
                        styles.reviewAnsBox,
                        isCorrect ? styles.reviewAnsBoxCorrect : styles.reviewAnsBoxWrong,
                      ]}
                    >
                      <Text style={styles.reviewAnsLbl}>Member Answer:</Text>
                      <Text
                        style={[
                          styles.reviewAnsVal,
                          isCorrect ? { color: '#065F46' } : { color: '#991B1B' },
                        ]}
                      >
                        {memberSelectedStr}
                      </Text>
                    </View>

                    {/* Correct answer if member answered wrong */}
                    {!isCorrect && Boolean(correctAnswerStr) && (
                      <View style={styles.reviewCorrectAnsBox}>
                        <Text style={styles.reviewAnsLbl}>Correct Answer:</Text>
                        <Text style={styles.reviewCorrectAnsVal}>{correctAnswerStr}</Text>
                      </View>
                    )}

                    {/* Scripture Reference */}
                    {Boolean(ans.bibleReference) && (
                      <Text style={styles.reviewScriptureRef}>
                        📖 Scripture: {ans.bibleReference}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Actions Row: Delete Report & Close Review */}
            <View style={styles.reviewModalActionsRow}>
              <TouchableOpacity
                style={styles.reviewModalDeleteBtn}
                onPress={() => {
                  const target = inspectAttempt;
                  setInspectAttempt(null);
                  handleDeleteAttempt(target);
                }}
                activeOpacity={0.85}
              >
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.reviewModalDeleteBtnTxt}>Delete Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewModalDoneBtn}
                onPress={() => setInspectAttempt(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.reviewModalDoneBtnTxt}>Close Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Signature Admin Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 6 }}>
            <TouchableOpacity onPress={handleGoBack} style={styles.heroBackBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -4, marginRight: 2 }} />
              <Text style={styles.heroBackTxt}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.heroDivider}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>Bible Quizzes</Text>
              <Text style={styles.heroSub} numberOfLines={1}>{churchName} · Manage & Create</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => {
              setSelectedQuiz(null);
              setCurrentView('editor');
            }}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#1a2d5a" strokeWidth={2.5} />
            <Text style={styles.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 3 Interactive Stats Cards ── */}
        <View style={styles.stats}>
          {/* 1. Total Card */}
          <TouchableOpacity
            style={[
              styles.statBox,
              statusFilter === 'All' && styles.statBoxActiveAll,
            ]}
            onPress={() => setStatusFilter('All')}
            activeOpacity={0.75}
          >
            <View style={[styles.statNotch, { backgroundColor: '#1a2d5a' }]} />
            <Text style={[styles.num, { color: '#1a2d5a' }]}>{totalCount}</Text>
            <View style={styles.statLabelRow}>
              <Text style={[styles.statLabel, statusFilter === 'All' && { color: '#1a2d5a' }]}>
                Total
              </Text>
              {statusFilter === 'All' && (
                <View style={[styles.activeIndicatorDot, { backgroundColor: '#1a2d5a' }]} />
              )}
            </View>
            <Text style={styles.statHintTxt}>
              {statusFilter === 'All' ? 'Active ✓' : 'Tap to view'}
            </Text>
          </TouchableOpacity>

          {/* 2. Published Card */}
          <TouchableOpacity
            style={[
              styles.statBox,
              statusFilter === 'Published' && styles.statBoxActivePublished,
            ]}
            onPress={() => setStatusFilter(prev => prev === 'Published' ? 'All' : 'Published')}
            activeOpacity={0.75}
          >
            <View style={[styles.statNotch, { backgroundColor: '#059669' }]} />
            <Text style={[styles.num, { color: '#059669' }]}>{publishedCount}</Text>
            <View style={styles.statLabelRow}>
              <Text style={[styles.statLabel, statusFilter === 'Published' && { color: '#059669' }]}>
                Published
              </Text>
              {statusFilter === 'Published' && (
                <View style={[styles.activeIndicatorDot, { backgroundColor: '#059669' }]} />
              )}
            </View>
            <Text style={styles.statHintTxt}>
              {statusFilter === 'Published' ? 'Active ✓' : 'Tap to view'}
            </Text>
          </TouchableOpacity>

          {/* 3. Scheduled Card */}
          <TouchableOpacity
            style={[
              styles.statBox,
              statusFilter === 'Scheduled' && styles.statBoxActiveScheduled,
            ]}
            onPress={() => setStatusFilter(prev => prev === 'Scheduled' ? 'All' : 'Scheduled')}
            activeOpacity={0.75}
          >
            <View style={[styles.statNotch, { backgroundColor: '#2563eb' }]} />
            <Text style={[styles.num, { color: '#2563eb' }]}>{scheduledCount}</Text>
            <View style={styles.statLabelRow}>
              <Text style={[styles.statLabel, statusFilter === 'Scheduled' && { color: '#2563eb' }]}>
                Scheduled
              </Text>
              {statusFilter === 'Scheduled' && (
                <View style={[styles.activeIndicatorDot, { backgroundColor: '#2563eb' }]} />
              )}
            </View>
            <Text style={styles.statHintTxt}>
              {statusFilter === 'Scheduled' ? 'Active ✓' : 'Tap to view'}
            </Text>
          </TouchableOpacity>

          {/* 3. Drafts Card */}
          <TouchableOpacity
            style={[
              styles.statBox,
              statusFilter === 'Drafts' && styles.statBoxActiveDraft,
            ]}
            onPress={() => setStatusFilter(prev => prev === 'Drafts' ? 'All' : 'Drafts')}
            activeOpacity={0.75}
          >
            <View style={[styles.statNotch, { backgroundColor: '#d97706' }]} />
            <Text style={[styles.num, { color: '#d97706' }]}>{draftCount}</Text>
            <View style={styles.statLabelRow}>
              <Text style={[styles.statLabel, statusFilter === 'Drafts' && { color: '#d97706' }]}>
                Drafts
              </Text>
              {statusFilter === 'Drafts' && (
                <View style={[styles.activeIndicatorDot, { backgroundColor: '#d97706' }]} />
              )}
            </View>
            <Text style={styles.statHintTxt}>
              {statusFilter === 'Drafts' ? 'Active ✓' : 'Tap to view'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              statusFilter === 'Reports'
                ? "Search by member name, quiz title, phone..."
                : "Search by title, book, category..."
            }
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterPillsScroll}
          contentContainerStyle={styles.filterPillsRow}
        >
          {['All Quizzes', 'Published', 'Scheduled', 'Drafts', 'Reports'].map(filter => {
            const isActive = (filter === 'All Quizzes' && statusFilter === 'All') || statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(filter === 'All Quizzes' ? 'All' : filter)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.filterPillTxt, isActive && styles.filterPillTxtActive]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content: Reports vs Quizzes */}
        {statusFilter === 'Reports' ? (
          renderReportsSection()
        ) : loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingTxt}>Loading quizzes...</Text>
          </View>
        ) : filteredQuizzes.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Bible Quizzes Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first Bible Quiz with questions, scripture references, and explanations!
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => {
                setSelectedQuiz(null);
                setCurrentView('editor');
              }}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyCreateBtnTxt}>Create New Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredQuizzes.map(quiz => {
            const isPublished = quiz.status === 'published';
            const isScheduled = quiz.status === 'scheduled';
            return (
              <View key={quiz.id} style={styles.quizCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.navigate('BibleQuizDetail', {
                      quiz,
                      quizId: quiz.id,
                      churchId: quiz.churchId || churchId,
                    });
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View
                          style={[
                            styles.statusBadge,
                            isPublished
                              ? styles.statusBadgePub
                              : isScheduled
                              ? { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }
                              : styles.statusBadgeDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeTxt,
                              isPublished
                                ? { color: '#059669' }
                                : isScheduled
                                ? { color: '#2563eb' }
                                : { color: '#64748b' },
                            ]}
                          >
                            {isScheduled && quiz.scheduledDate
                              ? `📅 ${quiz.scheduledDate}${quiz.scheduledTime ? ` · ⏰ ${formatQuizTime(quiz.scheduledTime, quiz.scheduledDate)}` : ''}`
                              : quiz.status.toUpperCase()}
                          </Text>
                        </View>

                        {quiz.isDailyQuiz && (
                          <View style={styles.dailyBadge}>
                            <Text style={styles.dailyBadgeTxt}>☀️ DAILY</Text>
                          </View>
                        )}

                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyBadgeTxt}>{quiz.difficulty.toUpperCase()}</Text>
                        </View>

                        {quiz.level ? (
                          <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeTxt}>LEVEL {quiz.level}</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.cardTitle}>{quiz.title}</Text>
                    </View>
                  </View>

                  {/* Sub details: Book / Category / Questions */}
                  <View style={styles.cardMetaRow}>
                    {quiz.book ? (
                      <Text style={styles.cardMetaItem}>
                        📖 {quiz.book} {quiz.chapterStart ? `Ch ${quiz.chapterStart}${quiz.chapterEnd ? `-${quiz.chapterEnd}` : ''}` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.cardMetaItem}>🏷️ {quiz.category || 'General'}</Text>
                    )}
                    <Text style={styles.cardMetaDot}>·</Text>
                    <Text style={styles.cardMetaItem}>{quiz.totalQuestions || quiz.questions?.length || 0} Questions</Text>
                    <Text style={styles.cardMetaDot}>·</Text>
                    <Text style={styles.cardMetaItem}>
                      <Clock size={12} color="#64748b" /> {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : 'Untimed'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  {/* Left Side: View, Report, Publish / Draft */}
                  <View style={styles.cardLeftActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        navigation.navigate('BibleQuizDetail', {
                          quiz,
                          quizId: quiz.id,
                          churchId: quiz.churchId || churchId,
                        });
                      }}
                    >
                      <Eye size={15} color="#0284c7" />
                      <Text style={[styles.cardActionBtnTxt, { color: '#0284c7', fontWeight: '700' }]}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setSelectedQuiz(quiz);
                        setCurrentView('reports');
                      }}
                    >
                      <BarChart2 size={15} color="#2563eb" />
                      <Text style={[styles.cardActionBtnTxt, { color: '#2563eb' }]}>Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleTogglePublish(quiz)}
                    >
                      {isPublished ? (
                        <>
                          <PauseCircle size={14} color="#d97706" />
                          <Text style={[styles.cardActionBtnTxt, { color: '#d97706' }]}>Move to Draft</Text>
                        </>
                      ) : (
                        <>
                          <Send size={14} color="#059669" />
                          <Text style={[styles.cardActionBtnTxt, { color: '#059669' }]}>Publish</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Right Side: Edit and Delete */}
                  <View style={styles.cardRightActions}>
                    <TouchableOpacity
                      style={styles.cardEditBtn}
                      onPress={() => {
                        setSelectedQuiz(quiz);
                        setCurrentView('editor');
                      }}
                    >
                      <Edit2 size={13} color="#475569" />
                      <Text style={styles.cardEditBtnTxt}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => handleDeleteQuiz(quiz)}
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderDeleteModal()}
      {renderDeleteSuccessModal()}
      {renderDeleteAttemptModal()}
      {renderDeleteAttemptSuccessModal()}
      {renderAnswerReviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DC',
  },
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingRight: 4,
  },
  heroBackTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroDivider: {
    color: '#ffffff',
    fontSize: 22,
    marginHorizontal: 12,
    opacity: 0.35,
    fontWeight: '300',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#AEB8D4',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  newBtn: {
    backgroundColor: '#C9A84C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  newBtnTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  contentArea: {
    padding: 16,
  },
  // ── Stats Cards ──
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1.5,
    borderColor: 'rgba(26, 45, 90, 0.08)',
    position: 'relative',
  },
  statBoxActiveAll: {
    borderColor: '#1a2d5a',
    borderWidth: 2,
    backgroundColor: '#f8fafc',
    elevation: 5,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.15,
  },
  statBoxActivePublished: {
    borderColor: '#059669',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    elevation: 5,
    shadowColor: '#059669',
    shadowOpacity: 0.18,
  },
  statBoxActiveScheduled: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
    elevation: 5,
    shadowColor: '#2563eb',
    shadowOpacity: 0.18,
  },
  statBoxActiveDraft: {
    borderColor: '#d97706',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
    elevation: 5,
    shadowColor: '#d97706',
    shadowOpacity: 0.18,
  },
  statNotch: {
    position: 'absolute',
    top: -1,
    width: 32,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  num: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 2,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748b',
    fontWeight: '700',
  },
  activeIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statHintTxt: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1a2d5a',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(26,45,90,0.1)',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  filterPillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterPillTxtActive: {
    color: '#ffffff',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingTxt: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    marginTop: 10,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2d5a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 10,
  },
  emptyCreateBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgePub: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgeDraft: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  dailyBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dailyBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
  },
  difficultyBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyBadgeTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  levelBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  cardMetaItem: {
    fontSize: 12,
    color: '#64748b',
  },
  cardMetaDot: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
  },
  cardLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  cardActionBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardEditBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cardDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Custom Delete Modals ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    paddingTop: 24,
    width: '92%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  deleteCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  deleteSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  deleteQuizPreviewBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  deleteQuizPreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  deleteQuizBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deleteQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteQuizBadgeTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  deleteWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 18,
  },
  deleteWarningTxt: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
    flex: 1,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteConfirmBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteConfirmBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteSuccessIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteSuccessBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a2d5a',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteSuccessBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Reports & Leaderboard Styles ──────────────────────────────────────────
  reportsContainer: {
    paddingTop: 4,
  },
  reportsHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportsHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2d5a',
  },
  reportsHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reportsCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  reportsCounterBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  reportsMiniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  reportsMiniStat: {
    alignItems: 'center',
    flex: 1,
  },
  reportsMiniStatNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a2d5a',
  },
  reportsMiniStatLbl: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  reportsMiniStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sortToggleLbl: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  sortToggleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortBtnActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  sortBtnTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  sortBtnTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  quizFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    maxWidth: 220,
  },
  quizFilterChipActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  quizFilterChipTxt: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  quizFilterChipTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  podiumCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  podiumHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  podiumHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.2,
  },
  podiumList: {
    gap: 8,
  },
  podiumItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  podiumMedalBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  podiumMedalTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
  },
  podiumMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  podiumQuizSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  podiumScoreTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
  },
  podiumTimeTxt: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  attemptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attemptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rankBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  rankBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  attemptPassBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  attemptPassBadgeGood: {
    backgroundColor: '#ecfdf5',
  },
  attemptPassBadgeFail: {
    backgroundColor: '#fef2f2',
  },
  attemptPassBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  attemptScorePill: {
    alignItems: 'flex-end',
  },
  attemptScoreTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2d5a',
  },
  attemptScoreSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  attemptMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attemptAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptAvatarTxt: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  attemptMemberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  attemptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  attemptMetaTxt: {
    fontSize: 11,
    color: '#64748b',
  },
  attemptQuizBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  attemptQuizTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2d5a',
    flex: 1,
  },
  attemptMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metricPillCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricPillCorrectTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  metricPillWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricPillWrongTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  metricPillTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  metricPillTimeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  reviewAnswersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewAnswersBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  filterPillsScroll: {
    marginBottom: 12,
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  reviewModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  reviewModalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reviewModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewModalScroll: {
    marginBottom: 14,
  },
  reviewQCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewQTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewQNumPill: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewQNumPillTxt: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reviewQResultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  reviewQResultBadgeCorrect: {
    backgroundColor: '#ecfdf5',
  },
  reviewQResultBadgeWrong: {
    backgroundColor: '#fef2f2',
  },
  reviewQResultBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewQText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 19,
  },
  reviewAnsBox: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  reviewAnsBoxCorrect: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  reviewAnsBoxWrong: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  reviewAnsLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  reviewAnsVal: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewCorrectAnsBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  reviewCorrectAnsVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  reviewScriptureRef: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  attemptTrashBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  attemptActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  deleteAttemptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteAttemptBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  reviewModalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  reviewModalDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  reviewModalDeleteBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  reviewModalDoneBtn: {
    flex: 1.3,
    backgroundColor: '#1a2d5a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewModalDoneBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
