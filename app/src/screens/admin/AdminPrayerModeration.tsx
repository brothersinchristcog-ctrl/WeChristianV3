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
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  ChevronLeft,
  FileDown
} from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import Theme from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, copyAsync } from 'expo-file-system/legacy';

const { width } = Dimensions.get('window');

const COLORS = {
  ink: '#151C33',
  ink2: '#22304F',
  inkSoft: '#6B7593',
  parchment: '#F3EAD9',
  paper: '#FFFCF5',
  gold: '#A67C3D',
  goldDeep: '#8C6428',
  goldBright: '#F4C430',
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
  const { activeChurch } = useChurch();
  const { setActiveTab } = React.useContext(AdminTabContext);
  const adminName = member?.name || 'Administrator';
  const churchName = activeChurch?.name || 'Church';
  const churchLogo = activeChurch?.theme?.logoUrl || null;

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
  const [adminResponses, setAdminResponses] = useState<{[key: string]: string}>({});
  const [successModalData, setSuccessModalData] = useState<{ visible: boolean; title: string; sub: string }>({ visible: false, title: '', sub: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const successAnim = React.useRef(new Animated.Value(0)).current;

  const triggerSuccess = (title: string, sub: string) => {
    setSuccessModalData({ visible: true, title, sub });
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
    }).start(() => setSuccessModalData(prev => ({ ...prev, visible: false })));
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

  const handleApprove = async (id: string, responseText?: string) => {
    try {
      if (responseText && responseText.trim()) {
        await FirestoreService.addPrayerComment(id, responseText.trim(), adminName);
      }
      await FirestoreService.markAsAnswered(id);
      
      setAdminResponses(prev => {
        const next = {...prev};
        delete next[id];
        return next;
      });
      
      // Immediately update local state to move to 'Processed'
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, isAnswered: true, isPublic: true } : p));
      
      triggerSuccess('Approved!', 'Prayer request approved and made public.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleRespondPrivately = async (id: string, responseText?: string) => {
    try {
      if (responseText && responseText.trim()) {
        await FirestoreService.addPrayerComment(id, responseText.trim(), adminName);
      }
      await FirestoreService.markAsAnswered(id);
      
      setAdminResponses(prev => {
        const next = {...prev};
        delete next[id];
        return next;
      });
      
      // Mark answered but keep private (isPublic stays false)
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, isAnswered: true } : p));
      
      triggerSuccess('Responded! 🙏', 'Your private response has been sent to the member.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send response.');
    }
  };

  const handleClose = (id: string) => {
    setCloseConfirmId(id);
  };

  const handleAdminPray = async (id: string) => {
    if (!member) return;
    const uid = member.id || 'admin';
    const name = member.name || adminName;
    // Prevent double-pray
    if (prayers.find(p => p.id === id)?.prayedBy?.includes(uid)) {
      triggerSuccess('Already Prayed', 'You have already prayed for this request.');
      return;
    }
    try {
      await FirestoreService.incrementPrayCount(id, uid, name);
      setPrayers(prev => prev.map(p => p.id === id
        ? {
            ...p,
            prayCount: (p.prayCount || 0) + 1,
            prayedBy: [...(p.prayedBy || []), uid],
            prayedByNames: [...(p.prayedByNames || []), name]
          }
        : p
      ));
      triggerSuccess('Amen! 🙏', 'Your prayer has been recorded for this request.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record your prayer.');
    }
  };

  const confirmClose = async () => {
    if (!closeConfirmId) return;
    const id = closeConfirmId;
    setCloseConfirmId(null);
    try {
      await FirestoreService.closePrayerRequest(id);
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, isClosed: true } : p));
      triggerSuccess('Closed', 'Prayer request closed successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to close prayer request.');
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
      triggerSuccess('Request Published!', 'The prayer request has been successfully created and published.');
      fetchPrayers(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to publish request.');
    } finally {
      setSubmitting(false);
    }
  };

  const [pdfFilter, setPdfFilter] = useState<'all' | 'pending' | 'answered'>('all');

  const exportPrayersToPDF = async (filter: 'all' | 'pending' | 'answered' = pdfFilter) => {
    try {
      const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      const logoHtml = churchLogo
        ? `<img src="${churchLogo}" style="width:80px; height:80px; object-fit:contain; border-radius:10px; margin-bottom:8px;" />`
        : `<div style="font-size:40px;">⛪</div>`;

      let filteredPrayers = prayers;
      let filterLabel = 'All Prayer Requests';
      if (filter === 'pending') {
        filteredPrayers = pendingPrayers;
        filterLabel = 'Pending Prayer Requests';
      } else if (filter === 'answered') {
        filteredPrayers = answeredPrayers;
        filterLabel = 'Processed Prayer Requests';
      }

      // Sort by latest first
      filteredPrayers = [...filteredPrayers].sort((a, b) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t2 - t1;
      });

      if (filteredPrayers.length === 0) {
        Alert.alert('No Requests', 'No prayer requests found for this filter.');
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, sans-serif; padding: 24px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; padding-bottom: 16px; border-bottom: 2px solid #1a2d5a; }
              h1 { color: #1a2d5a; font-size: 20px; margin: 6px 0 2px 0; }
              .subtitle { color: #666; font-size: 12px; }
              .filter-label { color: #1a2d5a; font-size: 11px; font-weight: bold; margin-top: 4px; }
              .prayer-box { border-bottom: 1px solid #ddd; padding: 12px 0; margin-bottom: 6px; }
              .row { display: flex; justify-content: space-between; align-items: center; }
              .author { font-weight: bold; color: #b91c1c; font-size: 14px; }
              .phone { color: #666; font-size: 11px; }
              .date { color: #999; font-size: 11px; }
              .text { margin-top: 6px; font-size: 13px; line-height: 1.6; color: #222; }
              .status-approved { font-style: italic; font-size: 11px; color: #059669; margin-top: 4px; }
              .status-pending { font-style: italic; font-size: 11px; color: #d97706; margin-top: 4px; }
              .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoHtml}
              <h1>${churchName}</h1>
              <div class="subtitle">Generated on ${today}</div>
              <div class="filter-label">${filterLabel} (${filteredPrayers.length})</div>
            </div>
            ${filteredPrayers.map(p => `
              <div class="prayer-box">
                <div class="row">
                  <span class="author">${p.name || p.authorName || 'Member'}</span>
                  <span class="date">${p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('en-IN') : ''}</span>
                </div>
                ${p.phone ? `<div class="phone">📱 ${p.phone}</div>` : ''}
                <div class="text">${p.text || ''}</div>
                ${p.isAnswered
                  ? '<div class="status-approved">✓ Answered / Approved</div>'
                  : '<div class="status-pending">⏳ Pending Review</div>'
                }
              </div>
            `).join('')}
            <div class="footer">${churchName} · ${today}</div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const safeName = churchName.replace(/[^a-zA-Z0-9]/g, '_');
      const dateTag = new Date().toISOString().split('T')[0];
      const filterTag = filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : 'Answered';
      const fileName = `${safeName}_Prayers_${filterTag}_${dateTag}.pdf`;
      const newPath = `${documentDirectory}${fileName}`;
      await copyAsync({ from: uri, to: newPath });
      
      setShowDownloadModal(false);
      
      await Sharing.shareAsync(newPath, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: fileName,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const pendingPrayers = prayers.filter(p => !p.isAnswered && !p.isClosed);
  const answeredPrayers = prayers.filter(p => p.isAnswered && !p.isClosed);

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
        <View style={styles.pActions}>
          {/* Pray button */}
          <TouchableOpacity
            style={[styles.pActionBtn, { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, gap: 5 }]}
            onPress={() => handleAdminPray(item.id)}
          >
            <Heart size={14} color="#2563EB" />
            <Text style={[styles.pActionBtnTxt, { color: '#2563EB' }]}>Pray</Text>
          </TouchableOpacity>
          {/* Close button */}
          <TouchableOpacity
            style={[styles.pActionBtn, { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6 }]}
            onPress={() => handleClose(item.id)}
          >
            <Text style={[styles.pActionBtnTxt, { color: '#EF4444' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isAnswered && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
          {item.isPublic && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Megaphone size={14} color="#d97706" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#d97706' }}>User requested this to be PUBLIC</Text>
            </View>
          )}
          <TextInput
            style={styles.adminReplyInput}
            placeholder="Write a prayer response (optional)..."
            placeholderTextColor="#94a3b8"
            value={adminResponses[item.id] || ''}
            onChangeText={(txt) => setAdminResponses(prev => ({ ...prev, [item.id]: txt }))}
            multiline
          />
          <View style={[styles.pActions, { marginTop: 12, justifyContent: 'flex-end' }]}>
            {item.isPublic ? (
              // Public request → Approve & Make Public
              <TouchableOpacity
                style={[styles.pActionBtn, { backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 10 }]}
                onPress={() => handleApprove(item.id, adminResponses[item.id])}
              >
                <CheckCircle2 size={16} color="#15803D" />
                <Text style={[styles.pActionBtnTxt, { color: '#15803D', fontWeight: '800', fontSize: 13 }]}>Approve & Make Public</Text>
              </TouchableOpacity>
            ) : (
              // Personal request → Respond Privately only
              <TouchableOpacity
                style={[styles.pActionBtn, { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10 }]}
                onPress={() => handleRespondPrivately(item.id, adminResponses[item.id])}
              >
                <CheckCircle2 size={16} color="#2563EB" />
                <Text style={[styles.pActionBtnTxt, { color: '#2563EB', fontWeight: '800', fontSize: 13 }]}>Respond Privately</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ padding: 8 }} onPress={() => setShowTopMenu(true)}>
              <MoreVertical size={24} color="#fff" />
            </TouchableOpacity>
          </View>
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
      {showCreateModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: COLORS.paper }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <View style={[styles.createModalContent, { flex: 1, height: undefined, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                <View style={[styles.createModalHeader, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
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
                    style={[styles.textInput, { minHeight: 120 }]}
                    multiline
                    scrollEnabled={false}
                    value={pastorRequest.en}
                    onChangeText={t => setPastorRequest({ ...pastorRequest, en: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Prayer Request</Text>
                <View style={styles.textArea}>
                  <TextInput
                    placeholder="ప్రార్థన మనవి వివరాలను టైప్ చేయండి..."
                    style={[styles.textInput, { minHeight: 120, fontStyle: 'italic' }]}
                    multiline
                    scrollEnabled={false}
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
              <View style={{ height: 400 }} />
            </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      )}

      {/* ── Success Modal ── */}
      <Modal visible={successModalData.visible} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
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
            <Text style={styles.successTitle}>{successModalData.title}</Text>
            <Text style={styles.successSub}>
              {successModalData.sub}
            </Text>
            
            <TouchableOpacity style={styles.successBtn} onPress={closeSuccess}>
              <Text style={styles.successBtnTxt}>Great, Thank you!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Close Confirmation Modal */}
      <Modal visible={!!closeConfirmId} transparent animationType="fade">
        <View style={styles.createModalOverlay}>
          <View style={styles.closeConfirmCard}>
            <View style={styles.closeConfirmIconBox}>
              <XCircle size={40} color="#ef4444" />
            </View>
            <Text style={styles.successTitle}>Close Prayer Request?</Text>
            <Text style={styles.successSub}>This will hide the prayer request from the public view and remove it from the admin dashboard.</Text>
            
            <View style={styles.closeConfirmActions}>
              <TouchableOpacity style={styles.closeCancelBtn} onPress={() => setCloseConfirmId(null)}>
                <Text style={styles.closeCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeConfirmBtn} onPress={confirmClose}>
                <Text style={styles.closeConfirmTxt}>Close Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ── Top Menu Modal ── */}
      <Modal transparent visible={showTopMenu} animationType="fade" onRequestClose={() => setShowTopMenu(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowTopMenu(false)}>
          <View style={{ position: 'absolute', top: 90, right: 20, backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, width: 220 }}>
            <TouchableOpacity 
              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => { setShowTopMenu(false); setShowCreateModal(true); }}
            >
              <Plus size={18} color={COLORS.ink} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>New Prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => { setShowTopMenu(false); setShowDownloadModal(true); }}
            >
              <FileDown size={18} color={COLORS.ink} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>Download Requests</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Download PDF Modal ── */}
      <Modal transparent visible={showDownloadModal} animationType="slide" onRequestClose={() => setShowDownloadModal(false)}>
        <View style={styles.createModalOverlay}>
          <View style={[styles.createModalContent, { height: 'auto', paddingBottom: 40 }]}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Download Report</Text>
              <TouchableOpacity onPress={() => setShowDownloadModal(false)} style={styles.closeBtn}>
                <XCircle size={24} color={COLORS.inkSoft} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 12 }}>Select Filter</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {(['all', 'pending', 'answered'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setPdfFilter(f)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: pdfFilter === f ? COLORS.ink : COLORS.parchment,
                      borderWidth: 1,
                      borderColor: pdfFilter === f ? COLORS.ink : COLORS.rule,
                    }}
                  >
                    <Text style={{ color: pdfFilter === f ? '#fff' : COLORS.inkSoft, fontWeight: '700', fontSize: 13 }}>
                      {f === 'all' ? `All (${prayers.length})` : f === 'pending' ? `Pending (${pendingPrayers.length})` : `Answered (${answeredPrayers.length})`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => exportPrayersToPDF(pdfFilter)}
                style={{ backgroundColor: COLORS.goldDeep, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <FileDown size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Download Prayer Requests</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  
  adminReplyInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: COLORS.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  createModalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'flex-end' },
  createModalContent: { backgroundColor: COLORS.parchment, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
  createModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: COLORS.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  createModalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, fontFamily: FONTS.serif },
  closeBtn: { padding: 4, backgroundColor: COLORS.clayBg, borderRadius: 20 },

  // Success Modal Styles
  successModalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20 },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.moss, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: COLORS.moss, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  successTitle: { fontSize: 22, fontWeight: '900', color: COLORS.ink, fontFamily: FONTS.serif, marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  successBtn: { width: '100%', height: 54, backgroundColor: COLORS.ink, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.ink, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  successBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Close Confirmation Styles
  closeConfirmCard: { width: '85%', alignSelf: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, marginBottom: '50%' },
  closeConfirmIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  closeConfirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  closeCancelBtn: { flex: 1, height: 50, backgroundColor: '#f1f5f9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  closeCancelTxt: { color: '#475569', fontSize: 14, fontWeight: '700' },
  closeConfirmBtn: { flex: 1, height: 50, backgroundColor: '#ef4444', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  closeConfirmTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Replies Styles
  repliesContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.rule },
  repliesHeader: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  replyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.rule },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  replyAuthor: { fontSize: 12, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  replyDate: { fontSize: 11, color: COLORS.inkSoft, fontWeight: '600' },

  replyBody: { fontSize: 14, color: COLORS.ink2, lineHeight: 22, fontFamily: FONTS.serif }
});
