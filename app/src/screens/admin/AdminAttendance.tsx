import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, Clock, Calendar, Users, Send, ChevronLeft, Plus, History } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';

const COLORS = {
  ink: '#1a2d5a',
  paper: '#FFFCF5',
  gold: '#C9A84C',
  rule: '#DED0AC',
  bg: '#EDE8DC',
  inkSoft: '#6B7593',
  green: '#15803D',
};

const EVENT_TYPES = [
  { label: 'Sunday Service', value: 'Sunday Service' },
  { label: 'Bible Study', value: 'Bible Study' },
  { label: "Women's Fasting Prayer", value: "Women's Fasting Prayer" },
  { label: 'Prayer Meeting', value: 'Prayer Meeting' },
  { label: 'Youth Event', value: 'Youth Event' },
  { label: "Women's Ministry", value: "Women's Ministry" },
  { label: 'Fasting Prayer', value: 'Fasting Prayer' },
  { label: 'Special Service', value: 'Special Service' },
  { label: 'Conference', value: 'Conference' },
  { label: 'Outreach', value: 'Outreach' },
  { label: 'Other', value: 'Other' },
];

export default function AdminAttendance() {
  const { setActiveTab } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form
  const [showNewForm, setShowNewForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubActive: any = null;
    let unsubResponses: any = null;

    const setupListeners = async () => {
      setLoading(true);
      try {
        const members = await FirestoreService.searchMembers('');
        setAllMembers(members);

        unsubActive = await FirestoreService.listenActiveAttendanceRequest(async (request) => {
          setActiveRequest(request);
          if (request) {
            if (unsubResponses) unsubResponses();
            unsubResponses = await FirestoreService.listenAttendanceResponses(request.id, (resps) => {
              setResponses(resps);
            });
          } else {
            setResponses([]);
          }
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    setupListeners();
    loadHistory();

    return () => {
      if (typeof unsubActive === 'function') unsubActive();
      if (typeof unsubResponses === 'function') unsubResponses();
    };
  }, [activeChurch]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const all = await FirestoreService.getAttendanceRequests();
      // Fetch responses for each to calculate accurate statistics
      const historyWithStats = await Promise.all(all.map(async (req) => {
        const resps = await FirestoreService.getAttendanceResponses(req.id);
        const yesCount = resps.filter((r: any) => r.response === 'Yes').length;
        const noCount = resps.filter((r: any) => r.response === 'No').length;
        return { ...req, yesCount, noCount, responses: resps };
      }));
      setHistory(historyWithStats);
    } catch (e) {
      console.error('History load error:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistoryExpand = (id: string) => {
    setHistory(prev => prev.map(req => 
      req.id === id ? { ...req, _expanded: !req._expanded } : req
    ));
  };

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please select an event type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await FirestoreService.createAttendanceRequest({
        title: title.trim(),
        description: description.trim(),
        date: todayStr,
      });

      await FirestoreService.createNotificationBroadcast({
        title: 'Attendance Request',
        content: `Are you attending ${title.trim()} today?`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type: 'attendance',
        targetUrl: 'AttendanceScreen',
      });

      Alert.alert('Success', 'Attendance request sent to all members.');
      setShowNewForm(false);
      setTitle('');
      setDescription('');
      loadHistory(); // Refresh history after creating
    } catch (e) {
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const yesCount = responses.filter(r => r.response === 'Yes').length;
  const noCount = responses.filter(r => r.response === 'No').length;
  const noResponses = responses.filter(r => r.response === 'No');
  const yesResponses = responses.filter(r => r.response === 'Yes');
  const pendingMembers = allMembers.filter(m => !responses.find(r => r.memberId === m.id));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Hero (fixed top, curved bottom) ── */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => setActiveTab(0)} style={styles.heroBackBtn}>
            <ChevronLeft size={20} color="#fff" />
            <Text style={styles.heroBackTxt}>Back</Text>
          </TouchableOpacity>
          <View style={styles.heroDivider} />
          <View>
            <Text style={styles.heroTitle}>Attendance</Text>
            <Text style={styles.heroSub}>
              {responses.length} responses · {pendingMembers.length} pending
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── New Request Form ── */}
        {(!activeRequest || showNewForm) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar color={COLORS.ink} size={22} />
              <Text style={styles.cardTitle}>New Attendance Request</Text>
            </View>

            <Text style={styles.inputLabel}>Select Event Type *</Text>
            <View style={styles.typeChipsRow}>
              {EVENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeChip, title === type.value && styles.typeChipActive]}
                  onPress={() => setTitle(type.value)}
                >
                  <Text style={[styles.typeChipTxt, title === type.value && styles.typeChipTxtActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Special guest speaker today..."
              placeholderTextColor={COLORS.inkSoft}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <View style={styles.formActions}>
              {activeRequest && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewForm(false)}>
                  <Text style={styles.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sendBtn, { opacity: (isSubmitting || !title) ? 0.6 : 1 }]}
                onPress={handleCreateRequest}
                disabled={isSubmitting || !title}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Send color="#fff" size={15} />
                    <Text style={styles.sendBtnTxt}>Send Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Active Request Dashboard ── */}
        {activeRequest && !showNewForm && (
          <>
            <LinearGradient 
              colors={['#1a2d5a', '#2c478a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeHeader}
            >
              <View style={styles.activeHeaderIconWrap}>
                <Calendar color="#FCD34D" size={24} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.activeHeaderLabel}>ACTIVE EVENT</Text>
                <Text style={styles.activeTitle}>{activeRequest.title}</Text>
                <Text style={styles.activeDate}>
                  {new Date(activeRequest.createdAt?.toDate?.() || Date.now())
                    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.newBtnSolid} onPress={() => setShowNewForm(true)}>
                <Plus size={14} color={COLORS.ink} />
                <Text style={styles.newBtnSolidTxt}>New</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: '#a7f3d0' }]}>
                <CheckCircle color="#10b981" size={22} />
                <Text style={[styles.statNum, { color: '#10b981' }]}>{yesCount}</Text>
                <Text style={styles.statLbl}>Attending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#fecaca' }]}>
                <XCircle color="#ef4444" size={22} />
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{noCount}</Text>
                <Text style={styles.statLbl}>Not Attending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#fde68a' }]}>
                <Clock color="#f59e0b" size={22} />
                <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingMembers.length}</Text>
                <Text style={styles.statLbl}>Pending</Text>
              </View>
            </View>

            {/* Attending */}
            {yesResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attending ({yesResponses.length})</Text>
                <View style={styles.listCard}>
                  {yesResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < yesResponses.length - 1 && styles.listItemBorder]}>
                      <View style={[styles.avatar, { backgroundColor: '#dbeafe' }]}>
                        <Text style={[styles.avatarTxt, { color: COLORS.ink }]}>{r.memberName?.charAt(0) || 'U'}</Text>
                      </View>
                      <Text style={styles.listName}>{r.memberName}</Text>
                      <CheckCircle size={16} color="#10b981" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Not Attending */}
            {noResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Not Attending ({noResponses.length})</Text>
                <View style={styles.listCard}>
                  {noResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < noResponses.length - 1 && styles.listItemBorder]}>
                      <View style={[styles.avatar, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.avatarTxt, { color: '#dc2626' }]}>{r.memberName?.charAt(0) || 'U'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{r.memberName}</Text>
                        {r.reason ? <Text style={styles.reasonTxt}>"{r.reason}"</Text> : null}
                      </View>
                      <XCircle size={16} color="#ef4444" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pending */}
            {pendingMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending ({pendingMembers.length})</Text>
                <View style={styles.listCard}>
                  {pendingMembers.map((m, i) => (
                    <View key={m.id} style={[styles.listItem, i < pendingMembers.length - 1 && styles.listItemBorder]}>
                      <View style={[styles.avatar, { backgroundColor: '#f3f4f6' }]}>
                        <Text style={[styles.avatarTxt, { color: COLORS.inkSoft }]}>
                          {m.name?.charAt(0) || m.firstName?.charAt(0) || 'U'}
                        </Text>
                      </View>
                      <Text style={styles.listName}>{m.name || m.firstName || 'Unknown Member'}</Text>
                      <Clock size={16} color="#f59e0b" />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Attendance History ── */}
        {!showNewForm && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
            <History size={18} color={COLORS.ink} />
            <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Attendance History</Text>
          </View>
          <Text style={styles.sectionSub}>All previously created attendance requests</Text>

          {historyLoading ? (
            <ActivityIndicator color={COLORS.ink} style={{ marginTop: 16 }} />
          ) : history.length === 0 ? (
            <View style={[styles.listCard, { padding: 24, alignItems: 'center' }]}>
              <Calendar size={36} color={COLORS.inkSoft} style={{ marginBottom: 8 }} />
              <Text style={{ color: COLORS.inkSoft, fontSize: 14, textAlign: 'center' }}>
                No attendance requests yet. Create your first one above!
              </Text>
            </View>
          ) : (
            history.map((req) => {
              const pendingCount = allMembers.filter(m => !req.responses?.find((r: any) => r.memberId === m.id)).length;
              const totalResp = (req.yesCount || 0) + (req.noCount || 0);
              const date = req.date
                ? new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A';
              const isActive = req.status === 'Active';
              
              const yesList = req.responses?.filter((r: any) => r.response === 'Yes') || [];
              const noList = req.responses?.filter((r: any) => r.response === 'No') || [];
              const pendingList = allMembers.filter(m => !req.responses?.find((r: any) => r.memberId === m.id));

              return (
                <TouchableOpacity 
                  key={req.id} 
                  style={styles.historyCard}
                  onPress={() => toggleHistoryExpand(req.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>{req.title}</Text>
                      <Text style={styles.historyDate}>{date}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isActive ? '#dcfce7' : '#f1f5f9' }]}>
                      <Text style={[styles.statusBadgeTxt, { color: isActive ? '#15803d' : COLORS.inkSoft }]}>
                        {isActive ? 'Active' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyStats}>
                    <View style={styles.historyStatItem}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={[styles.historyStatTxt, { color: '#10b981' }]}>Yes: {req.yesCount || 0}</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <XCircle size={14} color="#ef4444" />
                      <Text style={[styles.historyStatTxt, { color: '#ef4444' }]}>No: {req.noCount || 0}</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <Clock size={14} color="#f59e0b" />
                      <Text style={[styles.historyStatTxt, { color: '#f59e0b' }]}>Pending: {pendingCount}</Text>
                    </View>
                  </View>

                  {/* ── Expandable Detail Section ── */}
                  {req._expanded && (
                    <View style={styles.historyDetails}>
                      <View style={{ height: 1, backgroundColor: COLORS.rule, marginVertical: 16 }} />
                      
                      {/* Yes List */}
                      {yesList.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={styles.detailTitle}>Attending ({yesList.length})</Text>
                          {yesList.map((r: any) => (
                            <Text key={r.memberId} style={styles.detailName}>• {r.memberName}</Text>
                          ))}
                        </View>
                      )}
                      
                      {/* No List */}
                      {noList.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={styles.detailTitle}>Not Attending ({noList.length})</Text>
                          {noList.map((r: any) => (
                            <Text key={r.memberId} style={styles.detailName}>
                              • {r.memberName} {r.reason ? <Text style={styles.detailReason}>({r.reason})</Text> : null}
                            </Text>
                          ))}
                        </View>
                      )}

                      {/* Pending List */}
                      {pendingList.length > 0 && (
                        <View>
                          <Text style={styles.detailTitle}>Pending ({pendingList.length})</Text>
                          <Text style={styles.detailName} numberOfLines={2}>
                            {pendingList.map(m => m.name || m.firstName).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12,
    marginBottom: 4,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroBackBtn: { flexDirection: 'row', alignItems: 'center' },
  heroBackTxt: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 14 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: -0.3 },
  heroSub: { color: '#AEB8D4', fontSize: 12, marginTop: 2 },

  // ── Cards ──
  card: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.paper, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.rule,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // ── Form ──
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.ink, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F3EAD9' },
  typeChipActive: { backgroundColor: COLORS.ink },
  typeChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  typeChipTxtActive: { color: COLORS.gold },
  input: {
    borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: COLORS.ink, height: 80, textAlignVertical: 'top',
    backgroundColor: '#F9F5ED', marginBottom: 20,
  },
  formActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnTxt: { color: COLORS.inkSoft, fontSize: 14, fontWeight: '600' },
  sendBtn: {
    backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sendBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Active Dashboard ──
  activeHeader: {
    marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20, marginBottom: 18,
    elevation: 6, shadowColor: COLORS.ink, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  activeHeaderIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center'
  },
  activeHeaderLabel: { fontSize: 10, fontWeight: '800', color: COLORS.gold, letterSpacing: 1, marginBottom: 4 },
  activeTitle: { fontSize: 22, fontWeight: '800', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  activeDate: { fontSize: 13, color: '#aac4e8', marginTop: 2 },
  newBtnSolid: {
    backgroundColor: COLORS.gold, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  newBtnSolidTxt: { color: COLORS.ink, fontWeight: '800', fontSize: 13 },

  statsRow: { marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.paper, borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: 'center', elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: '800', marginVertical: 6 },
  statLbl: { fontSize: 11, fontWeight: '600', color: COLORS.inkSoft, textAlign: 'center' },

  section: { marginHorizontal: 16, marginBottom: 24, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 12 },
  sectionSub: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 },
  listCard: { backgroundColor: COLORS.paper, borderRadius: 14, borderWidth: 1, borderColor: COLORS.rule, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { fontWeight: '700', fontSize: 15 },
  listName: { fontSize: 15, fontWeight: '600', color: COLORS.ink, flex: 1 },
  reasonTxt: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2, fontStyle: 'italic' },

  // ── History Cards ──
  historyCard: {
    backgroundColor: COLORS.paper, borderRadius: 14, borderWidth: 1, borderColor: COLORS.rule,
    padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  historyCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  historyDate: { fontSize: 12, color: COLORS.inkSoft },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusBadgeTxt: { fontSize: 11, fontWeight: '700' },
  historyStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  historyStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatTxt: { fontSize: 12, fontWeight: '600' },
  
  historyDetails: { marginTop: 4 },
  detailTitle: { fontSize: 13, fontWeight: '700', color: COLORS.inkSoft, marginBottom: 4 },
  detailName: { fontSize: 14, color: COLORS.ink, marginBottom: 2, lineHeight: 20 },
  detailReason: { fontStyle: 'italic', color: '#be185d' }
});
