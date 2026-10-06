import React, { useEffect, useState, useContext } from 'react';
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BibleQuiz, QuizStatus } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { useChurch } from '../../../context/ChurchContext';
import { AdminTabContext } from '../../../context/AdminTabContext';
import AdminQuizEditor from './AdminQuizEditor';
import AdminQuizReports from './AdminQuizReports';

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

  // Navigation / View states
  const [currentView, setCurrentView] = useState<'list' | 'editor' | 'reports'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<BibleQuiz | null>(null);

  // Custom Delete Flow States
  const [quizToDelete, setQuizToDelete] = useState<BibleQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccessTitle, setDeleteSuccessTitle] = useState<string | null>(null);

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

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const list = await QuizService.getQuizzes(churchId, { isAdmin: true });
      setQuizzes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizzes();
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

  const handleTogglePublish = async (quiz: BibleQuiz) => {
    const newStatus: QuizStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await QuizService.saveQuiz({ ...quiz, id: quiz.id, churchId: quiz.churchId || churchId, status: newStatus });
      setQuizzes(prev =>
        prev.map(q => (q.id === quiz.id ? { ...q, status: newStatus } : q))
      );
    } catch {
      Alert.alert('Error', 'Failed to update status.');
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
          loadQuizzes();
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
            placeholder="Search by title, book, category..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {['All Quizzes', 'Published', 'Scheduled', 'Drafts'].map(filter => {
            const isActive = (filter === 'All Quizzes' && statusFilter === 'All') || statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(filter === 'All Quizzes' ? 'All' : filter)}
              >
                <Text
                  style={[styles.filterPillTxt, isActive && styles.filterPillTxtActive]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quizzes List */}
        {loading ? (
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
                            ? `📅 ${quiz.scheduledDate}`
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

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
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
                    onPress={() => {
                      setSelectedQuiz(quiz);
                      setCurrentView('editor');
                    }}
                  >
                    <Edit2 size={14} color="#475569" />
                    <Text style={styles.cardActionBtnTxt}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleTogglePublish(quiz)}
                  >
                    <CheckCircle size={14} color={isPublished ? '#059669' : '#64748b'} />
                    <Text style={styles.cardActionBtnTxt}>
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { marginLeft: 'auto' }]}
                    onPress={() => handleDeleteQuiz(quiz)}
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderDeleteModal()}
      {renderDeleteSuccessModal()}
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
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
    gap: 12,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cardActionBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
});
