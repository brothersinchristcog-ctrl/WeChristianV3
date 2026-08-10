import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Animated
} from 'react-native';
import {
  Heart,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Trash2,
  AlertCircle,
  Plus,
  Send,
  MoreVertical,
  Megaphone,
  ChevronLeft
} from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import Theme from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { AdminTabContext } from '../../context/AdminTabContext';

const { width } = Dimensions.get('window');

const COLORS = {
  ink: '#151C33',
  ink2: '#22304F',
  inkSoft: '#6B7593',
  parchment: '#F3EAD9',
  paper: '#FFFCF5',
  gold: '#A67C3D',
  goldDeep: '#8C6428',
  goldBright: '#D8B369',
  clay: '#A24B34',
  clayBg: '#F3E1D6',
  clayLine: '#E3C3B2',
  moss: '#3E6B52',
  mossBg: '#E6EFE7',
  rule: '#DED0AC',
};

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};


export default function AdminPrayerModeration() {
  const { member } = useAuth();
  const { setActiveTab } = React.useContext(AdminTabContext);
  const adminName = member?.name || 'Administrator';

  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showPostAs, setShowPostAs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const successAnim = React.useRef(new Animated.Value(0)).current;

  const triggerSuccess = () => {
    setShowSuccessModal(true);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const closeSuccess = () => {
    Animated.timing(successAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => setShowSuccessModal(false));
  };

  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.length < 3) {
      setMemberSearchResults([]);
      return;
    }
    setSearchingMembers(true);
    try {
      const results = await FirestoreService.searchMembers(query);
      setMemberSearchResults(results);
    } catch (error) {
      console.error('Member search error:', error);
    } finally {
      setSearchingMembers(false);
    }
  };

  const prayerCategories = [
    'Pray for me',
    'Pray for my family',
    'Pray for healing',
    'Pray for peace and strength',
    'Other (if necessary)'
  ];

  const [pastorRequest, setPastorRequest] = useState({
    en: '',
    te: '',
    category: 'Pray for me',
    postAs: adminName
  });

  // Update default postAs when member info loads
  useEffect(() => {
    if (member?.name) {
      setPastorRequest(prev => ({ ...prev, postAs: member.name }));
    }
  }, [member]);

  const postAsOptions = [
    adminName,
    'Church — Corporate',
    'Anonymous'
  ];

  const fetchPrayers = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const data = await FirestoreService.getPrayerRequests({ isAdmin: true });
      setPrayers(data);
    } catch (error) {
      console.error('Error fetching admin prayers:', error);
      Alert.alert('Error', 'Failed to load prayer requests from Salesforce.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayers(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await FirestoreService.markAsAnswered(id);
      fetchPrayers(true);
      Alert.alert('Success', 'Prayer request status updated.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleRemove = async (id: string) => {
    Alert.alert(
      'Remove Request',
      'Are you sure you want to permanently delete this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deletePrayerRequest(id);
              fetchPrayers(true);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete request');
            }
          }
        }
      ]
    );
  };

  const handlePublish = async () => {
    if (!pastorRequest.en.trim()) {
      Alert.alert('Error', 'Please enter the prayer request text.');
      return;
    }

    setSubmitting(true);
    try {
      await FirestoreService.submitPrayerRequest({
        name: selectedMember ? selectedMember.name : pastorRequest.postAs,
        phone: selectedMember ? selectedMember.phone : null,
        contactId: selectedMember ? selectedMember.id : null,
        requestEn: pastorRequest.en,
        requestTe: pastorRequest.te,
        category: pastorRequest.category
      });
      setPastorRequest({ ...pastorRequest, en: '', te: '' });
      setSelectedMember(null);
      setMemberSearchQuery('');
      setShowCreateModal(false);
      triggerSuccess();
      fetchPrayers(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to publish request.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingPrayers = prayers.filter(p => !p.isAnswered);
  const answeredPrayers = prayers.filter(p => p.isAnswered);

  const getTimeAgo = (rawDate: any) => {
    try {
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

  const renderPrayerCard = (item: any, isAnswered = false) => (
    <View key={item.id} style={[styles.pCard, isAnswered && styles.pCardAnswered]}>
      <View style={styles.pCardHd}>
        <View style={[styles.pAvatar, { backgroundColor: isAnswered ? '#059669' : '#7C3AED' }]}>
          <Text style={styles.pAvatarTxt}>{(item.name || 'F').charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <Text style={styles.pUserName}>{item.name}</Text>
            {isAnswered && (
              <View style={styles.ansBadge}>
                <CheckCircle2 size={10} color={COLORS.moss} />
                <Text style={styles.ansBadgeTxt}>Processed</Text>
              </View>
            )}
          </View>
          <Text style={styles.pTime}>{getTimeAgo(item.createdAt)}{item.phone ? ` · ${item.phone}` : ''}</Text>
        </View>
        {!isAnswered && (
          <TouchableOpacity onPress={() => handleRemove(item.id)}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pTextContainer}>
        <Text style={styles.pText}>{item.text}</Text>
        {item.textTe && item.textTe.trim() !== (item.text || '').trim() && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' }}>
            <Text style={[styles.pText, { fontStyle: 'italic', color: '#475569' }]}>
              {item.textTe}
            </Text>
          </View>
        )}
      </View>

      {/* REPLIES / COMMENTS SECTION */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          <Text style={styles.repliesHeader}>Comments</Text>
          {item.replies.map((reply: any) => (
            <View key={reply.id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyAuthor}>{reply.author}</Text>
                <Text style={styles.replyDate}>{getTimeAgo(reply.date)}</Text>
              </View>
              <Text style={styles.replyBody}>{reply.body}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.pFooter}>
        <View style={styles.catBadge}>
          <View style={styles.catDot} />
          <Text style={styles.catTxt}>{item.category || 'General'}</Text>
        </View>

        {!isAnswered && (
          <View style={styles.pActions}>
            <TouchableOpacity
              style={[styles.pActionBtn, { backgroundColor: '#F0FDF4' }]}
              onPress={() => handleApprove(item.id)}
            >
              <CheckCircle2 size={12} color="#15803D" />
              <Text style={[styles.pActionBtnTxt, { color: '#15803D' }]}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading Prayer Wall...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Prayers</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]}>{pendingPrayers.length} new · {answeredPrayers.length} processed</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreateModal(true)}>
            <Plus size={16} color="#1a2d5a" />
            <Text style={styles.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >


        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: COLORS.clay }]}>{pendingPrayers.length}</Text>
            <Text style={styles.statLbl}>New Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: COLORS.moss }]}>{answeredPrayers.length}</Text>
            <Text style={styles.statLbl}>Processed</Text>
          </View>
        </View>

        {/* ── Pending Review ── */}
        {pendingPrayers.length > 0 && (
          <>
            <View style={styles.listHd}>
              <Text style={[styles.listHdTitle, { color: COLORS.goldDeep }]}>Requests for Review ({pendingPrayers.length})</Text>
            </View>
            {pendingPrayers.map(p => renderPrayerCard(p))}
          </>
        )}

        {/* ── Answered Section ── */}
        {answeredPrayers.length > 0 && (
          <>
            <View style={[styles.listHd, { marginTop: 20 }]}>
              <Text style={styles.listHdTitle}>Recent History</Text>
            </View>
            {answeredPrayers.slice(0, 5).map(p => renderPrayerCard(p, true))}
          </>
        )}

      </ScrollView>

      {/* ── Create Prayer Request Modal ── */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.createModalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Create New Prayer Request</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <XCircle size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              {/* Member Lookup */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Church Member</Text>
                <View style={styles.searchBox}>
                  <TextInput
                    placeholder="Search by name or phone..."
                    style={styles.searchInput}
                    value={memberSearchQuery}
                    onChangeText={handleMemberSearch}
                  />
                  {searchingMembers && <ActivityIndicator size="small" color={COLORS.ink} />}
                </View>

                {memberSearchResults.length > 0 && !selectedMember && (
                  <View style={styles.searchResults}>
                    {memberSearchResults.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.searchItem}
                        onPress={() => {
                          setSelectedMember(m);
                          setMemberSearchResults([]);
                          setMemberSearchQuery(m.name);
                        }}
                      >
                        <View>
                          <Text style={styles.searchItemName}>{m.name}</Text>
                          <Text style={styles.searchItemPhone}>{m.phone || 'No Phone'}</Text>
                        </View>
                        <Plus size={14} color={COLORS.ink} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedMember && (
                  <View style={styles.selectedBadge}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                      <User size={14} color="#fff" />
                      <Text style={styles.selectedBadgeTxt}>{selectedMember.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedMember(null)}>
                      <XCircle size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prayer Category</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPicker(!showPicker)}
                >
                  <Text style={styles.pickerTxt}>
                    {pastorRequest.category || 'Select Category'}
                  </Text>
                  <MoreVertical size={14} color="#64748b" />
                </TouchableOpacity>

                {showPicker && (
                  <View style={styles.categoryList}>
                    {prayerCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catOption, pastorRequest.category === cat && styles.catOptionActive]}
                        onPress={() => {
                          setPastorRequest({ ...pastorRequest, category: cat });
                          setShowPicker(false);
                        }}
                      >
                        <Text style={[styles.catOptionTxt, pastorRequest.category === cat && { color: '#fff' }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prayer request text — English</Text>
                <View style={styles.textArea}>
                  <TextInput
                    placeholder="Type the prayer request details..."
                    multiline
                    numberOfLines={4}
                    style={styles.textInput}
                    value={pastorRequest.en}
                    onChangeText={t => setPastorRequest({ ...pastorRequest, en: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Prayer Request</Text>
                <View style={styles.textArea}>
                  <TextInput
                    placeholder="తెలుగులో ప్రార్థన విజ్ఞాపన..."
                    multiline
                    numberOfLines={4}
                    style={[styles.textInput, { fontStyle: 'italic' }]}
                    value={pastorRequest.te}
                    onChangeText={t => setPastorRequest({ ...pastorRequest, te: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Post as</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPostAs(!showPostAs)}
                >
                  <Text style={styles.pickerTxt}>{pastorRequest.postAs}</Text>
                  <MoreVertical size={14} color="#64748b" />
                </TouchableOpacity>

                {showPostAs && (
                  <View style={styles.categoryList}>
                    {postAsOptions.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.catOption, pastorRequest.postAs === opt && styles.catOptionActive]}
                        onPress={() => {
                          setPastorRequest({ ...pastorRequest, postAs: opt });
                          setShowPostAs(false);
                        }}
                      >
                        <Text style={[styles.catOptionTxt, pastorRequest.postAs === opt && { color: '#fff' }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.publishBtn, submitting && { opacity: 0.7 }, { marginTop: 10, marginBottom: 40 }]}
                onPress={handlePublish}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Megaphone size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.publishBtnTxt}>Submit Prayer Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.successCard,
              {
                transform: [
                  { scale: successAnim },
                  { translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
                ],
                opacity: successAnim
              }
            ]}
          >
            <View style={styles.successIconBox}>
              <CheckCircle2 size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Request Published!</Text>
            <Text style={styles.successSub}>
              The prayer request has been successfully created and published.
            </Text>
            
            <TouchableOpacity style={styles.successBtn} onPress={closeSuccess}>
              <Text style={styles.successBtnTxt}>Great, Thank you!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { padding: 16, paddingBottom: 100 },

  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  
  newBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  newBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: COLORS.paper, borderRadius: 16, paddingVertical: 18, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: COLORS.rule },
  statVal: { fontSize: 24, fontWeight: '900', fontFamily: FONTS.serif },
  statLbl: { fontSize: 11, color: COLORS.inkSoft, marginTop: 4, fontWeight: '600' },

  listHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listHdTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.5 },

  pCard: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.rule },
  pCardAnswered: { backgroundColor: COLORS.mossBg, borderColor: '#C8E6C9' },
  pCardHd: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pAvatarTxt: { color: '#fff', fontSize: 14, fontWeight: '800', fontFamily: FONTS.serif },
  pUserName: { fontSize: 14, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  pTime: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2, fontWeight: '500' },

  ansBadge: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ansBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#15803D' },

  pTextContainer: { backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  pText: { fontSize: 14, color: COLORS.ink, lineHeight: 22, fontFamily: FONTS.serif },

  pFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.goldDeep },
  catTxt: { fontSize: 11, fontWeight: '700', color: COLORS.inkSoft },

  pActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pActionBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pActionBtnTxt: { fontSize: 11, fontWeight: '800', color: '#15803D' },

  pastorSection: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: COLORS.rule },
  pastorSecTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink, marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, minHeight: 80, paddingHorizontal: 12, marginBottom: 10 },
  textInput: { fontSize: 13, color: COLORS.ink, paddingVertical: 12, textAlignVertical: 'top', fontFamily: FONTS.serif },
  pickerBtn: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  pickerTxt: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  categoryList: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, padding: 4, marginTop: 4, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  catOption: { paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 0.5, borderBottomColor: COLORS.rule },
  catOptionActive: { backgroundColor: COLORS.goldBright },
  catOptionTxt: { fontSize: 14, color: COLORS.ink, fontWeight: '500' },
  publishBtn: { height: 56, backgroundColor: COLORS.ink, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  publishBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: FONTS.serif },

  // Search Styles
  searchBox: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink, fontFamily: FONTS.serif },
  searchResults: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, marginTop: 4, maxHeight: 200, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  searchItem: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.rule, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchItemName: { fontSize: 14, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  searchItemPhone: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.ink, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  selectedBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  createModalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'flex-end' },
  createModalContent: { backgroundColor: COLORS.parchment, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
  createModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: COLORS.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  createModalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, fontFamily: FONTS.serif },
  closeBtn: { padding: 4, backgroundColor: COLORS.clayBg, borderRadius: 20 },

  // Success Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: COLORS.paper, borderRadius: 24, padding: 32, width: '92%', maxWidth: 400, alignItems: 'center', elevation: 10, borderWidth: 1, borderColor: COLORS.rule },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.mossBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.moss, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.serif },
  successSub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 22, marginBottom: 30, fontFamily: FONTS.serif },
  successBtn: { backgroundColor: COLORS.goldBright, height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 },
  successBtnTxt: { color: COLORS.ink, fontSize: 14, fontWeight: '800', fontFamily: FONTS.serif },

  // Replies Styles
  repliesContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.rule },
  repliesHeader: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  replyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.rule },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  replyAuthor: { fontSize: 12, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  replyDate: { fontSize: 11, color: COLORS.inkSoft, fontWeight: '600' },

  replyBody: { fontSize: 14, color: COLORS.ink2, lineHeight: 22, fontFamily: FONTS.serif }
});
