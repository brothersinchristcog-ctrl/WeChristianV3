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
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft,
  CheckCircle, 
  MessageCircle, 
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp
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
  isPublic: boolean;
  setIsPublic: (val: boolean) => void;
}

const PrayerForm = ({ 
  prayerInput, 
  setPrayerInput, 
  category, 
  setCategory, 
  categories, 
  isSubmitting, 
  handleSubmit,
  isPublic,
  setIsPublic
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

      <View style={[styles.composeFooter, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>Public</Text>
          <TouchableOpacity 
            style={[styles.toggleSwitch, isPublic && styles.toggleSwitchActive]}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

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

    {/* Section Header for the Prayer Wall Feed is handled dynamically via Tabs now */}
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
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_requests' | 'public_requests'>('my_requests');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories = [
    { label: 'Pray for me', icon: '👤' },
    { label: 'Pray for my family', icon: '🏠' },
    { label: 'Pray for healing', icon: '🏥' },
    { label: 'Pray for peace and strength', icon: '🕊️' },
    { label: 'Other (if necessary)', icon: '✨' }
  ];

  const fetchPrayers = async (contactId?: string, isRefreshing = false) => {
    try {
      const uid = user?.uid;
      const phone = user?.phoneNumber;
      const data = await FirestoreService.getPrayerRequests({ contactId });
      setPrayers(data);
      // Restore prayedSet from Firestore prayedBy array
      if (uid || phone) {
        const alreadyPrayed = new Set<string>();
        data.forEach((p: any) => {
          if (
            (uid && p.prayedBy?.includes(uid)) ||
            (phone && p.prayedBy?.includes(phone))
          ) {
            alreadyPrayed.add(p.id);
          }
        });
        setPrayedSet(alreadyPrayed);
      }
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
        type: 'public',
        isPublic: isPublic
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

  const handlePray = async (id: string) => {
    if (prayedSet.has(id)) return;
    const uid = user?.uid || user?.phoneNumber || 'anon';
    const memberName = member?.name || user?.displayName || 'A Member';
    // Optimistic update
    setPrayedSet(prev => new Set([...prev, id]));
    setPrayers(prev => prev.map(p =>
      p.id === id
        ? { ...p, prayCount: (p.prayCount || 0) + 1, prayedByNames: [...(p.prayedByNames || []), memberName] }
        : p
    ));
    try {
      await FirestoreService.incrementPrayCount(id, uid, memberName);
    } catch (err) {
      // Rollback on failure
      setPrayedSet(prev => { const s = new Set(prev); s.delete(id); return s; });
      setPrayers(prev => prev.map(p =>
        p.id === id
          ? { ...p, prayCount: Math.max(0, (p.prayCount || 0) - 1), prayedByNames: (p.prayedByNames || []).filter(n => n !== memberName) }
          : p
      ));
      Alert.alert('Error', 'Could not record your prayer. Try again.');
    }
  };

  const renderPrayerItem = ({ item }: { item: PrayerRequest }) => {
    const isAnswered = item.isAnswered;
    const initial = item.name.charAt(0).toUpperCase();
    const isOwner = !!(user?.phoneNumber && item.phone && user.phoneNumber === item.phone)
      || !!(member?.id && (item.contactId === member.id || item.authorId === member.id));
    const hasPrayed = prayedSet.has(item.id) || !!(user?.uid && item.prayedBy?.includes(user.uid))
      || !!(user?.phoneNumber && item.prayedBy?.includes(user.phoneNumber));
    const isPublicTab = activeTab === 'public_requests';
    const isExpanded = expandedItems.has(item.id);
    const prayedNames: string[] = Array.isArray(item.prayedByNames) ? item.prayedByNames : [];
    const prayCount = item.prayCount || 0;

    const toggleExpand = () => {
      setExpandedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
        return next;
      });
    };

    // ── PUBLIC PRAYERS TAB ─────────────────────────────────
    if (isPublicTab) {
      return (
        <View style={styles.prayerCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.metaText}>
                {getTimeAgo(item.createdAt)} · {item.category || 'General'}
              </Text>
            </View>
          </View>

          {/* Prayer Text */}
          <Text style={styles.prayerText}>{item.text}</Text>

          {/* Button Row: Pray btn + Chevron */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              style={[styles.prayBtnSmall, hasPrayed && styles.prayBtnActive]}
              onPress={() => handlePray(item.id)}
              disabled={hasPrayed}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={14} color={hasPrayed ? '#4ade80' : '#fff'} />
              <Text style={[styles.prayBtnText, hasPrayed && styles.prayBtnTextActive]}>
                {hasPrayed ? 'Praying' : 'I Will Pray for You'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              {isExpanded
                ? <ChevronUp size={18} color="#1a2d5a" />
                : <ChevronDown size={18} color="#1a2d5a" />}
            </TouchableOpacity>
          </View>

          {/* Dropdown: Members Praying List */}
          {isExpanded && prayedNames.length > 0 && (
            <View style={[styles.prayingNamesBox, { marginTop: 12 }]}>
              <Text style={styles.prayingNamesHeader}>MEMBERS PRAYING FOR YOU:</Text>
              {prayedNames.map((name, idx) => (
                <View key={idx} style={styles.prayingNameRow}>
                  <View style={styles.prayingNameDot} />
                  <Text style={styles.prayingNameText}>{name}</Text>
                </View>
              ))}
            </View>
          )}
          {isExpanded && prayedNames.length === 0 && (
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' }}>
              No one has prayed yet. Be the first! 🙏
            </Text>
          )}
        </View>
      );
    }

    // ── MY REQUESTS TAB ────────────────────────────────────
    return (
      <View style={[styles.prayerCard, item.isAnswered && { borderLeftWidth: 4, borderLeftColor: '#16a34a' }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: item.isAnswered ? '#16a34a' : '#7c3aed' }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.metaText}>
              {getTimeAgo(item.createdAt)} · {item.category || 'General'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {item.isAnswered && (
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>✨ Answered</Text>
              </View>
            )}
            {isOwner && (
              <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Prayer Text */}
        <Text style={styles.prayerText}>{item.text}</Text>

        {/* Admin Response */}
        {item.isAnswered && item.replies && item.replies.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {item.replies.map((reply: any, idx: number) => (
              <View key={reply.id || idx} style={{
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#16a34a'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#15803d' }}>
                    🙏 {reply.author}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#86efac' }}>
                    {new Date(reply.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#166534', lineHeight: 22 }}>{reply.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Comment Input — always visible for owner */}
        {isOwner && (
          <View style={[styles.addReplyContainer, { marginTop: 10 }]}>
            <TextInput
              style={styles.replyInput}
              placeholder={item.isAnswered ? 'Write a thank you or comment...' : 'Awaiting Admin response...'}
              placeholderTextColor="#94a3b8"
              value={replyInputs[item.id] || ''}
              onChangeText={(text) => setReplyInputs(prev => ({ ...prev, [item.id]: text }))}
              multiline
              editable={!!item.isAnswered}
            />
            <TouchableOpacity
              style={[styles.replySubmitBtn, (!replyInputs[item.id]?.trim() || !item.isAnswered) && styles.replySubmitBtnDisabled]}
              onPress={() => handleReplySubmit(item.id)}
              disabled={!replyInputs[item.id]?.trim() || !item.isAnswered || submittingReplyId === item.id}
            >
              {submittingReplyId === item.id
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.replySubmitText}>Post</Text>
              }
            </TouchableOpacity>
          </View>
        )}
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
      
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
            <Text style={styles.headerTitle}>Prayer Wall</Text>
          </View>
        </View>
        
        <View style={{ width: 24 }} />
      </LinearGradient>

      <FlatList
        data={activeTab === 'my_requests' 
          ? prayers.filter(p => 
              p.contactId === member?.id || p.authorId === member?.id
            ) 
          : prayers.filter(p => p.isPublic && p.isAnswered && !p.isClosed)}
        renderItem={renderPrayerItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
        ListHeaderComponent={
          <View>
            <View style={[styles.tabsContainer, { marginTop: 20 }]}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'my_requests' && styles.tabBtnActive]}
                onPress={() => setActiveTab('my_requests')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'my_requests' && styles.tabBtnTextActive]}>My Requests</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'public_requests' && styles.tabBtnActive]}
                onPress={() => setActiveTab('public_requests')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'public_requests' && styles.tabBtnTextActive]}>Public Prayers</Text>
              </TouchableOpacity>
            </View>
            {activeTab === 'my_requests' && (
              <PrayerForm 
                prayerInput={prayerInput}
                setPrayerInput={setPrayerInput}
                category={category}
                setCategory={setCategory}
                categories={categories}
                isSubmitting={isSubmitting}
                handleSubmit={handleSubmit}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
              />
            )}
          </View>
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },
  backBtn: { zIndex: 10, padding: 5 },
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
  
  toggleSwitch: {
    width: 50,
    height: 28,
    backgroundColor: '#cbd5e1',
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: { backgroundColor: '#1a2d5a' },
  toggleThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: { transform: [{ translateX: 22 }] },

  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: { 
    backgroundColor: '#1a2d5a', 
    shadowColor: '#1a2d5a', 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    elevation: 4 
  },
  tabBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  tabBtnTextActive: { color: '#fff', fontWeight: '800' },

  quickReplyBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickReplyText: { fontSize: 13, fontWeight: '600', color: '#475569' },

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
  cardAnswered: { borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 15 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  nameAnswered: { color: '#1e293b' },
  answeredBadge: { color: '#059669', fontWeight: '700', fontSize: 12 },
  countBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 11, color: '#16a34a', fontWeight: '700' },
  countTextAnswered: { color: '#059669', backgroundColor: '#f0fdf4' },
  metaText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  
  textContainer: { backgroundColor: '#f8fafc', padding: 18, borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9' },
  textContainerAnswered: { backgroundColor: '#f8fafc', borderLeftWidth: 3, borderLeftColor: '#10b981' },
  prayerText: { fontSize: 15, color: '#1e293b', lineHeight: 24, marginTop: 10, marginBottom: 16 },
  prayerTextAnswered: { color: '#334155', fontWeight: '500' },

  // Action Row
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
  },
  prayBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  prayBtnActive: { backgroundColor: '#15803d', borderWidth: 2, borderColor: '#4ade80' },
  prayBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  prayBtnTextActive: { color: '#bbf7d0' },
  chevronBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  chevronIcon: { fontSize: 16, color: '#1a2d5a', fontWeight: '700' },
  ownerBadge: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  ownerBadgeText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // Expanded section
  expandedSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  prayingNamesBox: { marginBottom: 12 },
  prayingNamesHeader: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  prayingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  prayingNameDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1a2d5a' },
  prayingNameText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

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
    backgroundColor: '#1a2d5a',
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
