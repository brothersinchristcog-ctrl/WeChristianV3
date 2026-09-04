import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Linking, Alert } from 'react-native';
import { ChevronLeft, Video, Calendar, Clock, Activity, CheckCircle, Edit, ArrowLeft, Play, XCircle, Trash2, User, BookOpen } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';

const colors = {
  ink: '#1a2d5a',
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
  blue: '#2D8CFF'
};

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AdminOnlineMeetings() {
  const { setActiveTab, setTabByName, setEditingData } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();
  const [activeBottomTab, setActiveBottomTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [attendees, setAttendees] = useState<any[]>([]);

  const filteredMeetings = meetings.filter(meeting => {
    if (listFilter === 'all') return true;
    if (!meeting.startTime || !meeting.endTime) return false;
    
    const start = meeting.startTime.toDate();
    const end = meeting.endTime.toDate();
    const now = new Date();
    
    if (listFilter === 'completed') return end < now;
    if (listFilter === 'live') return start <= now && end >= now;
    if (listFilter === 'upcoming') return start > now;
    return true;
  });

  const handleDeleteMeeting = () => {
    Alert.alert('Delete Class', 'Are you sure you want to permanently delete this class record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          if (!activeChurch?.id || !selectedMeeting?.id) return;
          try {
            await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').doc(selectedMeeting.id).delete();
            setSelectedMeeting(null);
          } catch (e) {
            console.error(e);
          }
      }}
    ]);
  };

  const handleCancelMeeting = async () => {
    Alert.alert('Cancel Class', 'Are you sure you want to cancel this class?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
          if (!activeChurch?.id || !selectedMeeting?.id) return;
          try {
            await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').doc(selectedMeeting.id).update({ status: 'cancelled' });
            setSelectedMeeting(null);
          } catch (e) {
            console.error(e);
          }
      }}
    ]);
  };

  
  useEffect(() => {
    if (!activeChurch?.id || !selectedMeeting?.id) {
      setAttendees([]);
      return;
    }
    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('online_meetings')
      .doc(selectedMeeting.id)
      .collection('attendees')
      .onSnapshot(snapshot => {
        if (!snapshot) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAttendees(list);
      });
    return () => unsubscribe();
  }, [activeChurch?.id, selectedMeeting?.id]);

  const [stats, setStats] = useState({
    upcoming: 0,
    live: 0,
    completed: 0,
    total: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeChurch?.id) return;

    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('online_meetings')
      .onSnapshot(snapshot => {
        if (!snapshot) return;

        let upcoming = 0;
        let live = 0;
        let completed = 0;
        let total = snapshot.docs.length;
        const fetchedMeetings: any[] = [];

        const now = new Date();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.startTime || !data.endTime) return;

          fetchedMeetings.push({ id: doc.id, ...data });

          const start = data.startTime.toDate();
          const end = data.endTime.toDate();

          if (end < now) {
            completed++;
          } else if (start <= now && end >= now) {
            live++;
          } else if (start > now) {
            upcoming++;
          }
        });

        fetchedMeetings.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
        setMeetings(fetchedMeetings);
        setStats({ upcoming, live, completed, total });
      });

    return () => unsubscribe();
  }, [activeChurch?.id]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 }}>
            <TouchableOpacity 
              onPress={() => {
                if (selectedMeeting) {
                  setSelectedMeeting(null);
                } else {
                  setActiveTab(0);
                }
              }} 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexShrink: 0 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4, flexShrink: 0 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Online Meetings</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          
          {selectedMeeting ? (
            <View style={{ marginTop: 10 }}>
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>{selectedMeeting.title || 'Untitled'}</Text>
                <Text style={styles.detailSubtitle}>{selectedMeeting.description || 'No description provided.'}</Text>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <Calendar size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailRowText}>{selectedMeeting.startTime ? formatDate(selectedMeeting.startTime.toDate()) : 'TBD'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailRowText}>
                    {selectedMeeting.startTime ? formatTime(selectedMeeting.startTime.toDate()) : 'TBD'} - {selectedMeeting.endTime ? formatTime(selectedMeeting.endTime.toDate()) : 'TBD'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <BookOpen size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailRowText}>{selectedMeeting.bibleBook || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <User size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.detailRowText}>Host: {selectedMeeting.teacher || 'TBA'}</Text>
                </View>
              </View>

              {(!selectedMeeting.endTime || selectedMeeting.endTime.toDate() >= new Date()) && (
                <TouchableOpacity 
                  style={styles.actionBtnGreen}
                  onPress={async () => {
                    if (selectedMeeting.meetingLink) {
                      try {
                        await firestore().collection('churches').doc(activeChurch!.id).collection('broadcasts').add({
                          title: `🔴 Live Now: ${selectedMeeting.title}`,
                          content: `The online meeting has started. Tap to join!`,
                          type: 'online_meeting',
                          targetChurchId: activeChurch!.id,
                          createdAt: firestore.FieldValue.serverTimestamp(),
                          meetingId: selectedMeeting.id,
                          url: selectedMeeting.meetingLink || ''
                        });
                      } catch(e) { console.warn(e); }
                      Linking.openURL(selectedMeeting.meetingLink);
                    } else {
                      Alert.alert('No link', 'No meeting link provided for this class.');
                    }
                  }}
                >
                  <Play size={20} color="#fff" />
                  <Text style={styles.actionBtnTxt}>Start Class & Open Meet</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionBtnRedOutline} onPress={handleCancelMeeting}>
                <XCircle size={20} color={colors.clay} />
                <Text style={styles.actionBtnTxtRed}>Cancel Class</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnGhost} onPress={handleDeleteMeeting}>
                <Trash2 size={16} color={colors.clay} />
                <Text style={styles.actionBtnGhostTxt}>Delete Class Record</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 20, alignItems: 'flex-start', paddingHorizontal: 4, paddingBottom: 20 }}>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800', fontFamily: serifFont }}>Live Attendance ({attendees.length})</Text>
                {attendees.map(a => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>{a.name?.charAt(0) || '?'}</Text>
                    </View>
                    <Text style={{ marginLeft: 10, color: '#334155', fontWeight: '500' }}>{a.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <>
              {activeBottomTab === 'dashboard' && (
            <>
              {/* 4 Stat Cards */}
              <View style={styles.statsRow}>
                <TouchableOpacity style={[styles.statBox, listFilter === 'upcoming' && { borderColor: colors.goldDeep, borderWidth: 1.5 }]} onPress={() => setListFilter('upcoming')}>
                  <View style={[styles.statNotch, { backgroundColor: colors.gold }]} />
                  <Calendar size={16} color={colors.goldDeep} style={styles.statIcon} />
                  <Text style={[styles.num, { color: colors.goldDeep }]}>{stats.upcoming}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statBox, listFilter === 'live' && { borderColor: colors.clay, borderWidth: 1.5 }]} onPress={() => setListFilter('live')}>
                  <View style={[styles.statNotch, { backgroundColor: colors.clay }]} />
                  <Activity size={16} color={colors.clay} style={styles.statIcon} />
                  <Text style={[styles.num, { color: colors.clay }]}>{stats.live}</Text>
                  <Text style={styles.statLabel}>Live Now</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRow}>
                <TouchableOpacity style={[styles.statBox, listFilter === 'completed' && { borderColor: colors.moss, borderWidth: 1.5 }]} onPress={() => setListFilter('completed')}>
                  <View style={[styles.statNotch, { backgroundColor: colors.moss }]} />
                  <CheckCircle size={16} color={colors.moss} style={styles.statIcon} />
                  <Text style={[styles.num, { color: colors.moss }]}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statBox, listFilter === 'all' && { borderColor: colors.blue, borderWidth: 1.5 }]} onPress={() => setListFilter('all')}>
                  <View style={[styles.statNotch, { backgroundColor: colors.blue }]} />
                  <Video size={16} color={colors.blue} style={styles.statIcon} />
                  <Text style={[styles.num, { color: colors.blue }]}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Classes Section */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {listFilter === 'all' ? 'Recent Classes' : `${listFilter.charAt(0).toUpperCase() + listFilter.slice(1)} Classes`}
                </Text>
                {listFilter !== 'all' && (
                  <TouchableOpacity onPress={() => setListFilter('all')} style={{ marginLeft: 'auto' }}>
                    <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '600', marginRight: 8 }}>Clear Filter</Text>
                  </TouchableOpacity>
                )}
                <View style={[styles.sectionTitleLine, { marginLeft: listFilter !== 'all' ? 8 : 0 }]} />
              </View>

              {filteredMeetings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No classes found for this filter.</Text>
                </View>
              ) : (
                filteredMeetings.slice(0, 5).map((meeting) => (
                  <TouchableOpacity key={meeting.id} style={styles.meetingCard} onPress={() => setSelectedMeeting(meeting)}>
                    <View style={styles.meetingCardHeader}>
                      <Text style={styles.meetingCardTitle}>{meeting.title || 'Untitled'}</Text>
                      {(!meeting.endTime || meeting.endTime.toDate() >= new Date()) && (
                        <TouchableOpacity 
                          style={styles.editBtn}
                          onPress={() => {
                            setEditingData(meeting);
                            if (setTabByName) setTabByName('New Online Meeting');
                          }}
                        >
                          <Edit size={14} color={colors.blue} />
                          <Text style={styles.editBtnTxt}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.meetingCardBody}>
                      <View style={styles.meetingCardRow}>
                        <Calendar size={14} color={colors.inkSoft} />
                        <Text style={styles.meetingCardText}>
                          {meeting.startTime ? formatDate(meeting.startTime.toDate()) : 'TBD'} • {meeting.startTime ? formatTime(meeting.startTime.toDate()) : 'TBD'}
                        </Text>
                      </View>
                      <View style={styles.meetingCardRow}>
                        <Activity size={14} color={colors.inkSoft} />
                        <Text style={styles.meetingCardText}>
                          {`Teacher: ${meeting.teacher || 'TBA'}${meeting.bibleBook ? ` • ${meeting.bibleBook}` : ''}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeBottomTab === 'create' && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <View style={styles.clockContainer}>
                <Text style={styles.clockTime}>{formatTime(currentTime)}</Text>
                <Text style={styles.clockDate}>{formatDate(currentTime)}</Text>
              </View>

              <TouchableOpacity 
                style={styles.scheduleCard}
                onPress={() => {
                  setEditingData(null); 
                  if (setTabByName) setTabByName('New Online Meeting');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.scheduleIconBg}>
                    <Video size={24} color="#F97316" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Schedule New{'\n'}Class</Text>
                </View>
                <Text style={styles.scheduleCardDesc}>
                  Guide your congregation deeper into the Word. Tap here to schedule a new Bible class, automatically generate a Google Meet link, and invite members to join in fellowship and study.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeBottomTab === 'all' && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {listFilter === 'all' ? 'All Scheduled Meetings' : `Filtered: ${listFilter.charAt(0).toUpperCase() + listFilter.slice(1)} Classes`}
                </Text>
                <View style={styles.sectionTitleLine} />
              </View>

              {filteredMeetings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No classes found for this filter.</Text>
                </View>
              ) : (
                filteredMeetings.map((meeting) => (
                  <TouchableOpacity key={meeting.id} style={styles.meetingCard} onPress={() => setSelectedMeeting(meeting)}>
                    <View style={styles.meetingCardHeader}>
                      <Text style={styles.meetingCardTitle}>{meeting.title || 'Untitled'}</Text>
                      {(!meeting.endTime || meeting.endTime.toDate() >= new Date()) && (
                        <TouchableOpacity 
                          style={styles.editBtn}
                          onPress={() => {
                            setEditingData(meeting);
                            if (setTabByName) setTabByName('New Online Meeting');
                          }}
                        >
                          <Edit size={14} color={colors.blue} />
                          <Text style={styles.editBtnTxt}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.meetingCardBody}>
                      <View style={styles.meetingCardRow}>
                        <Calendar size={14} color={colors.inkSoft} />
                        <Text style={styles.meetingCardText}>
                          {meeting.startTime ? formatDate(meeting.startTime.toDate()) : 'TBD'} • {meeting.startTime ? formatTime(meeting.startTime.toDate()) : 'TBD'}
                        </Text>
                      </View>
                      <View style={styles.meetingCardRow}>
                        <Activity size={14} color={colors.inkSoft} />
                        <Text style={styles.meetingCardText}>
                          {`Teacher: ${meeting.teacher || 'TBA'}${meeting.bibleBook ? ` • ${meeting.bibleBook}` : ''}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Custom Bottom Bar */}
      {!selectedMeeting && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.bottomBarBtn, activeBottomTab === 'dashboard' && styles.bottomBarBtnActiveDashboard]}
            onPress={() => setActiveBottomTab('dashboard')}
          >
            <Video size={18} color={activeBottomTab === 'dashboard' ? '#fff' : '#6B7593'} />
            {activeBottomTab === 'dashboard' && <Text style={styles.bottomBarTextActive}>Dashboard</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.bottomBarBtnCenter, activeBottomTab === 'create' && styles.bottomBarBtnActiveCreate]}
            onPress={() => setActiveBottomTab('create')}
          >
            {activeBottomTab === 'create' ? null : <Text style={{ color: '#fff', fontSize: 18, marginTop: -2 }}>+</Text>}
            {activeBottomTab === 'create' && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, marginTop: -2, marginRight: 4 }}>+</Text>
                <Text style={styles.bottomBarTextActive}>Create Schedule</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.bottomBarBtn, activeBottomTab === 'all' && styles.bottomBarBtnActiveAll]}
            onPress={() => setActiveBottomTab('all')}
          >
            <Calendar size={18} color={activeBottomTab === 'all' ? '#fff' : '#6B7593'} />
            {activeBottomTab === 'all' && <Text style={styles.bottomBarTextActive}>All Meetings</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  scroll: { paddingBottom: 140 },
  
  // Hero
  hero: { 
    backgroundColor: colors.ink, 
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 16,
    overflow: 'visible',
    position: 'relative'
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: serifFont, fontWeight: '600', letterSpacing: -0.5, marginBottom: 0 },
  newBtn: { backgroundColor: '#FCD34D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  newBtnTxt: { color: colors.ink, fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: 16 },

  // Stats Grid
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8, marginTop: 8 },
  statBox: { flex: 1, backgroundColor: colors.paper, borderRadius: 10, paddingVertical: 8, alignItems: 'center', elevation: 2, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: 'rgba(21,28,51,0.05)', position: 'relative' },
  statNotch: { position: 'absolute', top: -1, width: 20, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  statIcon: { marginBottom: 2, opacity: 0.8 },
  num: { fontFamily: serifFont, fontSize: 20, fontWeight: '600', marginBottom: 0 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.inkSoft, fontWeight: '600' },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 20 },
  sectionTitle: { fontFamily: serifFont, fontSize: 14, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.inkSoft, marginRight: 8 },
  sectionTitleLine: { flex: 1, height: 1, backgroundColor: colors.rule },

  // Meeting Cards
  meetingCard: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: 'rgba(21,28,51,0.05)' },
  meetingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  meetingCardTitle: { flex: 1, fontFamily: serifFont, fontSize: 18, fontWeight: '600', color: colors.ink, marginRight: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(45, 140, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editBtnTxt: { color: colors.blue, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  meetingCardBody: { gap: 8 },
  meetingCardRow: { flexDirection: 'row', alignItems: 'center' },
  meetingCardText: { color: colors.inkSoft, fontSize: 13, marginLeft: 8 },
  emptyCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.gold, borderRadius: 16, backgroundColor: colors.paper, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyText: { fontSize: 14, color: colors.inkSoft, lineHeight: 21, textAlign: 'center' },

  // Create Schedule View
  clockContainer: {
    backgroundColor: '#1E2B4D',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 60,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  clockTime: {
    color: '#fff',
    fontSize: 42,
    fontFamily: serifFont,
    fontWeight: '300',
    marginBottom: 4,
  },
  clockDate: {
    color: '#6B7593',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  scheduleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scheduleCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  scheduleCardDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Details View
  detailCard: {
    backgroundColor: colors.blue,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    fontFamily: serifFont,
    marginBottom: 8,
  },
  detailSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginBottom: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailRowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionBtnGreen: {
    backgroundColor: colors.moss,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  actionBtnRedOutline: {
    borderColor: colors.clay,
    borderWidth: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 30,
  },
  actionBtnTxtRed: {
    color: colors.clay,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  actionBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionBtnGhostTxt: {
    color: colors.clay,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151C33', // Deep ink color
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bottomBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  bottomBarBtnCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  bottomBarBtnActiveDashboard: {
    backgroundColor: '#3B82F6', // Blue
  },
  bottomBarBtnActiveCreate: {
    width: 'auto',
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: '#F97316', // Orange
    borderColor: '#F97316'
  },
  bottomBarBtnActiveAll: {
    backgroundColor: '#10B981', // Green
  },
  bottomBarTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
