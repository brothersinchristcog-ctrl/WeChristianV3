import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Modal
} from 'react-native';
import { 
  ChevronLeft,
  CheckCircle, 
  MessageCircle, 
  CheckCircle2,
  Trash2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FirestoreService, { AppMember } from '../services/FirestoreService';
import { PrayerRequest } from '../types/schema';

interface PrayerFormProps {
  prayerInput: string;
  setPrayerInput: (text: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  categories: any[];
  isSubmitting: boolean;
  handleSubmit: () => void;
}

const PrayerForm = ({ 
  prayerInput, 
  setPrayerInput, 
  category, 
  setCategory, 
  categories, 
  isSubmitting, 
  handleSubmit 
}: PrayerFormProps) => (
  <View style={styles.composeCard}>
    <View style={styles.composeHeader}>
      <CheckCircle size={16} color="#fff" />
      <Text style={styles.composeHeaderText}>SUBMIT PRAYER REQUEST</Text>
    </View>
    <View style={styles.composeBody}>
      <Text style={styles.inputLabel}>Select Category</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.catList}
      >
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat.label}
            style={[styles.catBtn, category === cat.label && styles.catBtnActive]}
            onPress={() => setCategory(cat.label)}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catLabel, category === cat.label && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.inputLabel}>Detailed Prayer Request</Text>
      <TextInput
        style={styles.composeInput}
        placeholder="Share your prayer request... తెలుగులో కూడా రాయవచ్చు…"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={4}
        value={prayerInput}
        onChangeText={setPrayerInput}
        blurOnSubmit={false}
      />
      <View style={styles.composeFooter}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request 🙏</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>

    {/* Section Header for the Prayer Wall Feed */}
    <View style={styles.wallSectionHeader}>
      <View style={styles.wallHeaderLine} />
      <Text style={styles.wallHeaderText}>COMMUNITY PRAYERS</Text>
      <View style={styles.wallHeaderLine} />
    </View>
  </View>
);

export default function PrayerWallScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const [member, setMember] = useState<AppMember | null>(null);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [prayedSet, setPrayedSet] = useState(new Set<string>());
  const [replyInputs, setReplyInputs] = useState<{[key: string]: string}>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);
  
  // Form State
  const [prayerInput, setPrayerInput] = useState('');
  const [category, setCategory] = useState('Pray for me');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    { label: 'Pray for me', icon: '👤' },
    { label: 'Pray for my family', icon: '🏠' },
    { label: 'Pray for healing', icon: '🏥' },
    { label: 'Pray for peace and strength', icon: '🕊️' },
    { label: 'Other (if necessary)', icon: '✨' }
  ];

  const fetchPrayers = async (contactId?: string, isRefreshing = false) => {
    // Only set loading to true if we really want a full-screen block, but we want a smooth transition so skip it here.
    try {
      const data = await FirestoreService.getPrayerRequests({ contactId });
      setPrayers(data);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      let contactId = undefined;
      if (user?.phoneNumber) {
        const result = await FirestoreService.checkContactExists(user.phoneNumber);
        if (result?.exists && result.member) {
          setMember(result.member);
          contactId = result.member.id;
        }
      }
      fetchPrayers(contactId, false);
    };
    init();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayers(member?.id || undefined, true);
  };

  const handleSubmit = async () => {
    if (!prayerInput.trim()) {
      Alert.alert('Missing Info', 'Please share your prayer request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await FirestoreService.submitPrayerRequest({
        name: member?.name || user?.displayName || 'Faithful Member',
        phone: user?.phoneNumber || '',
        contactId: member?.id || null,
        request: prayerInput,
        category: category,
        isAnonymous: false,
        uid: user?.uid || null,
        type: 'public'
      });
      
      setShowSuccess(true);
      setPrayerInput('');
      fetchPrayers(member?.id || undefined, true);
    } catch (err) {
      Alert.alert('Error', 'Unable to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (rawDate: any) => {
    try {
      // Firestore Timestamp has a .toDate() method
      const date: Date = rawDate?.toDate ? rawDate.toDate() 
        : rawDate instanceof Date ? rawDate 
        : new Date(rawDate);

      if (!date || isNaN(date.getTime())) return 'Recently';

      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const handlePray = (id: string, isOwner: boolean) => {
    if (isOwner || prayedSet.has(id)) return;
    
    setPrayedSet(prev => new Set(prev).add(id));
    setPrayers(prevPrayers => 
      prevPrayers.map(p => p.id === id ? { ...p, prayCount: (p.prayCount || 0) + 1 } : p)
    );
  };

  const handleReplySubmit = async (caseId: string) => {
    const comment = replyInputs[caseId]?.trim();
    if (!comment) return;
    
    setSubmittingReplyId(caseId);
    try {
      const authorName = member?.name || user?.displayName || 'Member';
      await FirestoreService.addPrayerComment(caseId, comment, authorName);
      setReplyInputs(prev => ({ ...prev, [caseId]: '' }));
      fetchPrayers(member?.id || undefined, true);
    } catch (err) {
      Alert.alert('Error', 'Unable to post comment. Please try again.');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to remove this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deletePrayerRequest(id);
              fetchPrayers(member?.id || undefined, true);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete request');
            }
          }
        }
      ]
    );
  };

  const renderPrayerItem = ({ item }: { item: PrayerRequest }) => {
    const isAnswered = item.isAnswered;
    const initial = item.name.charAt(0).toUpperCase();
    const isOwner = !!(user?.phoneNumber && item.phone && user.phoneNumber === item.phone);
    
    return (
      <View style={[styles.prayerCard, isAnswered && styles.cardAnswered]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isAnswered ? '#166534' : '#7c3aed' }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, isAnswered && styles.nameAnswered]}>
                {item.name}
                {isAnswered && <Text style={styles.answeredBadge}> ✨ Answered!</Text>}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {getTimeAgo(item.createdAt)} · {item.category || 'General'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.textContainer, isAnswered && styles.textContainerAnswered]}>
          <Text style={[styles.prayerText, isAnswered && styles.prayerTextAnswered]}>
            {item.text}
          </Text>
        </View>

        {/* REPLIES SECTION */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            <Text style={styles.repliesHeader}>Comments & Replies</Text>
            {item.replies.map((reply: any) => (
              <View key={reply.id} style={styles.replyCard}>
                <View style={styles.replyHeader}>
                  <Text style={styles.replyAuthor}>{reply.author}</Text>
                  <Text style={styles.replyDate}>{new Date(reply.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                </View>
                <Text style={styles.replyBody}>{reply.body}</Text>
              </View>
            ))}
          </View>
        )}

        {isOwner && isAnswered && (
          <View style={styles.addReplyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Add a comment or thank you note..."
              placeholderTextColor="#94a3b8"
              value={replyInputs[item.id] || ''}
              onChangeText={(text) => setReplyInputs(prev => ({ ...prev, [item.id]: text }))}
              multiline
            />
            <TouchableOpacity 
              style={[styles.replySubmitBtn, !replyInputs[item.id]?.trim() && styles.replySubmitBtnDisabled]}
              onPress={() => handleReplySubmit(item.id)}
              disabled={!replyInputs[item.id]?.trim() || submittingReplyId === item.id}
            >
              {submittingReplyId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.replySubmitText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardFooter}>
          {isOwner ? (
            isAnswered ? (
              <View style={[styles.iprayedBtn, styles.iprayedBtnActive, { backgroundColor: '#dcfce7', borderColor: '#dcfce7' }]}>
                <CheckCircle2 size={14} color="#16a34a" />
                <Text style={[styles.iprayedText, { color: '#16a34a' }]}>Answered</Text>
              </View>
            ) : (
              <View style={[styles.iprayedBtn, { backgroundColor: '#f1f5f9', opacity: 0.7 }]}>
                <Text style={[styles.iprayedText, { color: '#94a3b8' }]}>My Request</Text>
              </View>
            )
          ) : (
            <TouchableOpacity 
              style={[styles.iprayedBtn, (prayedSet.has(item.id) || isAnswered) && styles.iprayedBtnActive]}
              onPress={() => handlePray(item.id, isOwner)}
              disabled={prayedSet.has(item.id) || isAnswered}
            >
              <CheckCircle2 size={14} color={prayedSet.has(item.id) || isAnswered ? '#16a34a' : '#7c3aed'} />
              <Text style={[styles.iprayedText, (prayedSet.has(item.id) || isAnswered) && styles.iprayedTextAnswered]}>
                {prayedSet.has(item.id) || isAnswered ? `We Prayed (${item.prayCount})` : `I prayed (${item.prayCount})`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            {isOwner && (
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
            <Text style={styles.footerDate}>
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Connecting to Prayer Wall...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Prayer Wall</Text>
          <Text style={styles.headerSub}>{prayers.length} requests · Share your prayer</Text>
        </View>

        <View style={{ width: 70 }} />
      </View>

      <FlatList
        data={prayers}
        renderItem={renderPrayerItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
        ListHeaderComponent={
          <PrayerForm 
            prayerInput={prayerInput}
            setPrayerInput={setPrayerInput}
            category={category}
            setCategory={setCategory}
            categories={categories}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={50} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No prayer requests yet</Text>
            <Text style={styles.emptySub}>Be the first to share your burden with the community.</Text>
          </View>
        }
      />

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBox}><CheckCircle size={40} color="#fff" /></View>
            <Text style={styles.successTitle}>Request Submitted!</Text>
            <Text style={styles.successSub}>May God answer your prayers according to His will.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowSuccess(false)}>
              <Text style={styles.doneBtnTxt}>Amen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#1a2d5a', marginTop: 15, fontWeight: '600' },

  // Header
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { color: '#aac4e8', fontSize: 12, marginTop: 2 },
  themeToggle: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  themeToggleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  listContainer: { paddingBottom: 150 },

  // Compose Card
  composeCard: { 
    margin: 20, 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  composeHeader: { 
    backgroundColor: '#1a2d5a', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  composeHeaderText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  composeBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  catList: { gap: 12, paddingBottom: 15 },
  catBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 8
  },
  catBtnActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: 13, color: '#475569', fontWeight: '700' },
  catLabelActive: { color: '#fff' },

  composeInput: { 
    width: '100%', 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 18, 
    fontSize: 15, 
    lineHeight: 24,
    color: '#1e293b', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0',
    minHeight: 140, 
    textAlignVertical: 'top',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  composeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  submitBtn: { 
    backgroundColor: '#1a2d5a', 
    paddingHorizontal: 25, 
    paddingVertical: 12, 
    borderRadius: 15, 
    elevation: 4,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Prayer Card
  prayerCard: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    padding: 18, 
    marginHorizontal: 20, 
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardAnswered: { borderColor: '#bbf7d0', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 15 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  nameAnswered: { color: '#166534' },
  answeredBadge: { color: '#16a34a', fontWeight: '800', fontSize: 13 },
  countBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 11, color: '#16a34a', fontWeight: '700' },
  countTextAnswered: { color: '#166534', backgroundColor: '#dcfce7' },
  metaText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  
  textContainer: { backgroundColor: '#f8fafc', padding: 18, borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9' },
  textContainerAnswered: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  prayerText: { fontSize: 15, color: '#334155', lineHeight: 24, fontStyle: 'italic' },
  prayerTextAnswered: { color: '#166534', fontWeight: '600' },

  repliesContainer: { marginBottom: 15, marginLeft: 15, paddingLeft: 15, borderLeftWidth: 2, borderLeftColor: '#e2e8f0' },
  repliesHeader: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  replyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  replyAuthor: { fontSize: 13, fontWeight: '700', color: '#1a2d5a' },
  replyDate: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  replyBody: { fontSize: 14, color: '#475569', lineHeight: 22 },

  addReplyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 5,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end'
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 44,
    maxHeight: 100
  },
  replySubmitBtn: {
    backgroundColor: '#c13b2d',
    paddingHorizontal: 15,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  replySubmitBtnDisabled: {
    backgroundColor: '#94a3b8'
  },
  replySubmitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iprayedBtn: { 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  iprayedBtnActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  iprayedText: { fontSize: 13, color: '#fff', fontWeight: '800' },
  iprayedTextAnswered: { color: '#16a34a' },
  footerDate: { fontSize: 12, color: '#94a3b8' },

  // Empty State
  emptyState: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a2d5a', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 20 },

  // Success Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 45, 90, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  successCard: { backgroundColor: '#fff', width: '100%', borderRadius: 32, padding: 35, alignItems: 'center', elevation: 25 },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1a2d5a', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  doneBtn: { backgroundColor: '#c13b2d', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 18, width: '100%', alignItems: 'center' },
  doneBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 },

  // Wall Section Header
  wallSectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 15, 
    paddingHorizontal: 20 
  },
  wallHeaderLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#e2e8f0' 
  },
  wallHeaderText: { 
    marginHorizontal: 15, 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#1a2d5a', 
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  }
});
