import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, Calendar, Users, Send, ChevronLeft, Plus } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';

const { width } = Dimensions.get('window');

const COLORS = {
  ink: '#1a2d5a',
  paper: '#FFFCF5',
  gold: '#C9A84C',
  rule: '#DED0AC',
  bg: '#EDE8DC',
  inkSoft: '#6B7593',
};

export default function AdminAttendance() {
  const { setActiveTab } = React.useContext(AdminTabContext);
  const { activeChurch } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  
  // New Request Form
  const [showNewForm, setShowNewForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const EVENT_TYPES = [
    { label: 'Sunday Service', value: 'Sunday Service' },
    { label: 'Bible study', value: 'Bible study' },
    { label: "Women's Fasting Prayer", value: "Women's Fasting Prayer" },
    { label: 'Prayer Meeting', value: 'Prayer Meeting' },
    { label: 'Youth Event', value: 'Youth Event' },
    { label: 'Women\'s Ministry', value: 'Women\'s Ministry' },
    { label: 'Fasting Prayer', value: 'Fasting Prayer' },
    { label: 'Special Service', value: 'Special Service' },
    { label: 'Conference', value: 'Conference' },
    { label: 'Outreach', value: 'Outreach' },
    { label: 'Other', value: 'Other' }
  ];
  
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

    return () => {
      if (typeof unsubActive === 'function') unsubActive();
      if (typeof unsubResponses === 'function') unsubResponses();
    };
  }, [activeChurch]);

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const requestId = await FirestoreService.createAttendanceRequest({
        title: title.trim(),
        description: description.trim(),
        date: todayStr
      });
      
      // Trigger Notification
      await FirestoreService.createNotificationBroadcast({
        title: 'Attendance Request',
        content: `Are you attending ${title.trim()} today?`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type: 'attendance', 
        targetUrl: 'AttendanceScreen' // deep link hint
      });
      
      Alert.alert('Success', 'Attendance request created and notifications sent to all members.');
      setShowNewForm(false);
      setTitle('');
      setDescription('');
    } catch (e) {
      Alert.alert('Error', 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute counts
  const yesResponses = responses.filter(r => r.response === 'Yes');
  const noResponses = responses.filter(r => r.response === 'No');
  const pendingMembers = allMembers.filter(m => !responses.find(r => r.memberId === m.id));
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      {/* ── Hero Section (Fixed at Top) ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Attendance</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]}>{responses.length} responses · {pendingMembers.length} pending</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {!activeRequest || showNewForm ? (
          <View style={[styles.card, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
            <View style={styles.cardHeader}>
              <Calendar color={COLORS.ink} size={24} />
              <Text style={[styles.cardTitle, { color: COLORS.ink }]}>New Attendance Request</Text>
            </View>
            <Text style={[styles.cardDesc, { color: COLORS.inkSoft }]}>
              Create a new request for today's service or event. This will notify all members in the church.
            </Text>
            
            <Text style={[styles.inputLabel, { color: COLORS.ink }]}>Select Event Type *</Text>
            <View style={styles.typeChipsRow}>
              {EVENT_TYPES.map(type => (
                <TouchableOpacity 
                  key={type.value} 
                  style={[styles.typeChip, title === type.value && { backgroundColor: COLORS.ink, borderColor: COLORS.ink }]}
                  onPress={() => setTitle(type.value)}
                >
                  <Text style={[styles.typeChipTxt, title === type.value && { color: COLORS.gold }]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.inputLabel, { color: COLORS.ink, marginTop: 16 }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { color: COLORS.ink, borderColor: COLORS.rule, height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g., Special guest speaker today..."
              placeholderTextColor={COLORS.inkSoft}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            
            <TouchableOpacity 
              style={[styles.btnPrimary, { opacity: (isSubmitting || !title) ? 0.7 : 1 }]} 
              onPress={handleCreateRequest}
              disabled={isSubmitting || !title}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Send color="#fff" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.btnPrimaryText}>Send Request</Text>
                </>
              )}
            </TouchableOpacity>
            
            {activeRequest && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowNewForm(false)}>
                <Text style={[styles.btnSecondaryText, { color: COLORS.inkSoft }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Dashboard Header */}
            <View style={[styles.activeHeader, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeTitle, { color: COLORS.ink }]}>{activeRequest.title}</Text>
                <Text style={[styles.activeDate, { color: COLORS.inkSoft }]}>
                  {new Date(activeRequest.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.newBtnSolid} onPress={() => setShowNewForm(true)}>
                <Plus size={16} color={COLORS.ink} />
                <Text style={styles.newBtnSolidTxt}>Create New Request</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                <CheckCircle color="#10b981" size={24} />
                <Text style={[styles.statNum, { color: '#10b981' }]}>{yesResponses.length}</Text>
                <Text style={[styles.statLbl, { color: COLORS.inkSoft }]}>Attending</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                <XCircle color="#ef4444" size={24} />
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{noResponses.length}</Text>
                <Text style={[styles.statLbl, { color: COLORS.inkSoft }]}>Not Attending</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                <Clock color="#f59e0b" size={24} />
                <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingMembers.length}</Text>
                <Text style={[styles.statLbl, { color: COLORS.inkSoft }]}>Pending</Text>
              </View>
            </View>

            {/* Response Lists */}
            
            {/* YES */}
            {yesResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.ink }]}>Attending ({yesResponses.length})</Text>
                <View style={[styles.listCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                  {yesResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < yesResponses.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.rule }]}>
                      <View style={styles.avatarMock}><Text style={styles.avatarTxt}>{r.memberName?.charAt(0) || 'U'}</Text></View>
                      <Text style={[styles.listItemName, { color: COLORS.ink }]}>{r.memberName}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* NO */}
            {noResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.ink }]}>Not Attending ({noResponses.length})</Text>
                <View style={[styles.listCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                  {noResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < noResponses.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.rule }]}>
                      <View style={[styles.avatarMock, { backgroundColor: '#fee2e2' }]}><Text style={[styles.avatarTxt, { color: '#ef4444' }]}>{r.memberName?.charAt(0) || 'U'}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listItemName, { color: COLORS.ink }]}>{r.memberName}</Text>
                        {r.reason && <Text style={[styles.reasonTxt, { color: COLORS.inkSoft }]}>Reason: {r.reason}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PENDING */}
            {pendingMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.ink }]}>Pending ({pendingMembers.length})</Text>
                <View style={[styles.listCard, { backgroundColor: COLORS.paper, borderColor: COLORS.rule }]}>
                  {pendingMembers.map((m, i) => (
                    <View key={m.id} style={[styles.listItem, i < pendingMembers.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.rule }]}>
                      <View style={[styles.avatarMock, { backgroundColor: '#f3f4f6' }]}><Text style={[styles.avatarTxt, { color: COLORS.inkSoft }]}>{m.name?.charAt(0) || m.firstName?.charAt(0) || 'U'}</Text></View>
                      <Text style={[styles.listItemName, { color: COLORS.ink }]}>{m.name || m.firstName || 'Unknown Member'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  hero: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    marginBottom: 0,
    zIndex: 10,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginLeft: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  
  typeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, marginBottom: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.rule, backgroundColor: 'transparent' },
  typeChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.inkSoft },

  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginLeft: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 24 },
  
  btnPrimary: { backgroundColor: '#15803D', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  btnSecondary: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnSecondaryText: { fontSize: 15, fontWeight: '600' },

  activeHeader: { marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  activeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  activeDate: { fontSize: 13 },
  
  newBtnSolid: { backgroundColor: COLORS.gold, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  newBtnSolidTxt: { color: COLORS.ink, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },

  statsRow: { marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800', marginVertical: 8 },
  statLbl: { fontSize: 12, fontWeight: '500' },

  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarMock: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#1e3a8a', fontWeight: '700', fontSize: 16 },
  listItemName: { fontSize: 15, fontWeight: '600' },
  reasonTxt: { fontSize: 13, marginTop: 4, fontStyle: 'italic' }
});
