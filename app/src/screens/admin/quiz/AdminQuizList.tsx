import React, { useEffect, useState } from 'react';
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
} from 'lucide-react-native';
import { BibleQuiz, QuizStatus } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { useChurch } from '../../../context/ChurchContext';
import AdminQuizEditor from './AdminQuizEditor';
import AdminQuizReports from './AdminQuizReports';

export default function AdminQuizList() {
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
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete "${quiz.title}"? This will also remove associated participant attempts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QuizService.deleteQuiz(quiz.id, churchId);
              setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
            } catch {
              Alert.alert('Error', 'Failed to delete quiz.');
            }
          },
        },
      ]
    );
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
    if (statusFilter === 'Drafts') return q.status === 'draft';
    if (statusFilter === 'Daily') return q.isDailyQuiz;

    return true;
  });

  // Calculate high-level metrics
  const totalCount = quizzes.length;
  const publishedCount = quizzes.filter(q => q.status === 'published').length;
  const dailyQuiz = quizzes.find(q => q.isDailyQuiz && q.status === 'published');

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

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.pageTitle}>Bible Quiz Studio</Text>
          <Text style={styles.pageSubtitle}>{churchName} · Manage & Create</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setSelectedQuiz(null);
            setCurrentView('editor');
          }}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.createBtnTxt}>Create Quiz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{totalCount}</Text>
            <Text style={styles.kpiLabel}>Total Quizzes</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#059669' }]}>{publishedCount}</Text>
            <Text style={styles.kpiLabel}>Active Published</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: dailyQuiz ? '#7c3aed' : '#94a3b8' }]}>
              {dailyQuiz ? 'Active' : 'None'}
            </Text>
            <Text style={styles.kpiLabel}>Daily Quiz</Text>
          </View>
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
          {['All Quizzes', 'Published', 'Drafts'].map(filter => {
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
            return (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View
                        style={[
                          styles.statusBadge,
                          isPublished ? styles.statusBadgePub : styles.statusBadgeDraft,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeTxt,
                            isPublished ? { color: '#059669' } : { color: '#64748b' },
                          ]}
                        >
                          {quiz.status.toUpperCase()}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  createBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  contentArea: {
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
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
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
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
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
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
    borderColor: '#e2e8f0',
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
});
