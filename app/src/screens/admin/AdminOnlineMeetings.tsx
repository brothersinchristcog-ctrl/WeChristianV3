import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Linking, Alert, Modal, TouchableWithoutFeedback, ActivityIndicator, Image } from 'react-native';
import { ChevronLeft, Video, Calendar, Clock, Activity, CheckCircle, Edit, ArrowLeft, Play, XCircle, Trash2, User, BookOpen, X, Sparkles, Key, Radio, ExternalLink, RefreshCw, Tv, Unlink } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';
import { openZoomMeeting } from '../../utils/ZoomLauncher';
import { YouTubeLiveService, YouTubeChannelStatus } from '../../services/YouTubeLiveService';

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
const SHOW_YOUTUBE_LIVE = false;

export default function AdminOnlineMeetings() {
  const { setActiveTab, setTabByName, setEditingData } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();
  const [activeBottomTab, setActiveBottomTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [ytStatus, setYtStatus] = useState<YouTubeChannelStatus | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [checkingYtLive, setCheckingYtLive] = useState(false);
  const [startingYtStream, setStartingYtStream] = useState(false);

  useEffect(() => {
    if (!activeChurch?.id) return;
    const unsub = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('settings')
      .doc('youtube_channel')
      .onSnapshot(doc => {
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
        if (doc && exists) {
          const data = doc.data();
          setYtStatus({
            isConnected: Boolean(data?.isConnected),
            channelId: data?.channelId,
            channelTitle: data?.channelTitle,
            channelThumbnail: data?.channelThumbnail,
          });
        } else {
          setYtStatus({ isConnected: false });
        }
      });
    return () => unsub();
  }, [activeChurch?.id]);

  const handleConnectYouTube = async () => {
    if (!activeChurch?.id) {
      Alert.alert('Error', 'Please select an active church.');
      return;
    }
    setYtLoading(true);
    try {
      await YouTubeLiveService.connectYouTubeChannel(activeChurch.id);
    } catch (e: any) {
      Alert.alert('Connection Failed', e?.message || 'Could not initiate YouTube authorization.');
    } finally {
      setYtLoading(false);
    }
  };

  const handleDisconnectYouTube = () => {
    Alert.alert(
      'Disconnect Channel',
      'Are you sure you want to disconnect this YouTube channel from live streaming?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (!activeChurch?.id) return;
            try {
              await YouTubeLiveService.disconnectChannel(activeChurch.id);
              setYtStatus({ isConnected: false });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to disconnect channel.');
            }
          },
        },
      ]
    );
  };

  const handleCheckYouTubeStatus = async (meeting: any) => {
    if (!activeChurch?.id || !meeting?.youtubeLive?.broadcastId) return;
    setCheckingYtLive(true);
    try {
      const res = await YouTubeLiveService.checkLiveStatus(activeChurch.id, meeting.youtubeLive.broadcastId, meeting.id);
      Alert.alert('YouTube Status', `Current status: ${res.status.toUpperCase()}`);
      setSelectedMeeting((prev: any) => (prev ? { ...prev, youtubeLive: { ...prev.youtubeLive, status: res.status } } : null));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to check status');
    } finally {
      setCheckingYtLive(false);
    }
  };

  const handleStartZoomStream = async (meeting: any) => {
    if (!meeting?.meetingId) {
      Alert.alert('Notice', 'Zoom meeting ID is missing.');
      return;
    }
    setStartingYtStream(true);
    try {
      const res = await YouTubeLiveService.startZoomLiveStream(meeting.meetingId);
      if (res.success) {
        Alert.alert('Streaming Started', 'Zoom has started streaming to YouTube! It will appear live in a moment.');
      } else {
        Alert.alert('Notice', res.message || 'Make sure the host has started the Zoom meeting first.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not start livestream');
    } finally {
      setStartingYtStream(false);
    }
  };

  const handleOpenScheduleForm = (platform: 'google_meet' | 'zoom') => {
    setEditingData({ provider: platform, meetingType: platform });
    if (setTabByName) setTabByName('New Online Meeting');
  };

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
          <TouchableOpacity 
            onPress={() => {
              if (selectedMeeting) {
                setSelectedMeeting(null);
              } else {
                setActiveTab(0);
              }
            }} 
            style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
          >
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -4, marginRight: 2 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>Online Meetings</Text>
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
                {selectedMeeting.password ? (
                  <View style={styles.detailRow}>
                    <Key size={18} color="#FCD34D" />
                    <Text style={[styles.detailRowText, { color: '#FCD34D', fontWeight: '700' }]}>Passcode: {selectedMeeting.password}</Text>
                  </View>
                ) : null}

                {/* YouTube Live Stream Info & Controls */}
                {SHOW_YOUTUBE_LIVE && selectedMeeting.youtubeLive?.enabled && (
                  <View style={styles.ytMeetingDetailBox}>
                    <View style={styles.ytDetailHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Tv size={18} color="#FF0000" style={{ marginRight: 6 }} />
                        <Text style={styles.ytDetailBoxTitle}>YouTube Live Stream</Text>
                      </View>
                      <View style={[
                        styles.ytStatusBadge, 
                        selectedMeeting.youtubeLive.status === 'live' && styles.ytStatusBadgeLive,
                        selectedMeeting.youtubeLive.status === 'ended' && styles.ytStatusBadgeEnded,
                      ]}>
                        <Text style={styles.ytStatusBadgeText}>
                          {selectedMeeting.youtubeLive.status === 'live' ? '🔴 LIVE' : (selectedMeeting.youtubeLive.status || 'SCHEDULED').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {selectedMeeting.youtubeLive.watchUrl ? (
                      <TouchableOpacity 
                        style={styles.ytWatchLinkRow}
                        onPress={() => Linking.openURL(selectedMeeting.youtubeLive.watchUrl)}
                      >
                        <ExternalLink size={14} color="#3B82F6" />
                        <Text style={styles.ytWatchLinkText} numberOfLines={1}>
                          {selectedMeeting.youtubeLive.watchUrl}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity
                        style={styles.ytSmallActionBtn}
                        onPress={() => handleCheckYouTubeStatus(selectedMeeting)}
                        disabled={checkingYtLive}
                      >
                        {checkingYtLive ? (
                          <ActivityIndicator size="small" color="#64748B" />
                        ) : (
                          <>
                            <RefreshCw size={13} color="#64748B" style={{ marginRight: 4 }} />
                            <Text style={styles.ytSmallActionText}>Check Status</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {selectedMeeting.youtubeLive.status !== 'ended' && (
                        <TouchableOpacity
                          style={[styles.ytSmallActionBtn, { backgroundColor: '#DC2626' }]}
                          onPress={() => handleStartZoomStream(selectedMeeting)}
                          disabled={startingYtStream}
                        >
                          {startingYtStream ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Radio size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={[styles.ytSmallActionText, { color: '#FFFFFF' }]}>Start Stream in Zoom</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
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
                          url: selectedMeeting.meetingLink || '',
                          password: selectedMeeting.password || '',
                          silent: true
                        });
                      } catch(e) { console.warn(e); }
                      
                      const isZoom = selectedMeeting.provider === 'zoom' || selectedMeeting.meetingType === 'zoom' || selectedMeeting.meetingLink.includes('zoom.us');
                      if (isZoom) {
                        openZoomMeeting({
                          meetingLink: selectedMeeting.meetingLink,
                          meetingId: selectedMeeting.meetingId,
                          password: selectedMeeting.password,
                          userName: selectedMeeting.teacher || 'Host'
                        });
                      } else {
                        Linking.openURL(selectedMeeting.meetingLink);
                      }
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
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.meetingCardTitle}>{meeting.title || 'Untitled'}</Text>
                        {SHOW_YOUTUBE_LIVE && meeting.youtubeLive?.enabled && (
                          <View style={[
                            styles.ytCardBadge,
                            meeting.youtubeLive.status === 'live' ? styles.ytCardBadgeLive : styles.ytCardBadgeScheduled
                          ]}>
                            <Radio size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.ytCardBadgeText}>
                              {meeting.youtubeLive.status === 'live' ? 'LIVE ON YOUTUBE' : 'YOUTUBE STREAM'}
                            </Text>
                          </View>
                        )}
                      </View>
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

              {/* 1. Google Meet Card */}
              <TouchableOpacity 
                style={styles.googleMeetCard}
                onPress={() => handleOpenScheduleForm('google_meet')}
                activeOpacity={0.88}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={styles.scheduleIconBg}>
                    <Video size={22} color="#059669" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Google Meet</Text>
                </View>
                <Text style={styles.scheduleCardDesc}>
                  Schedule a new Bible class, automatically generate a Google Meet link, and invite members to join in fellowship and study.
                </Text>
              </TouchableOpacity>

              {/* 2. Zoom Meeting Card */}
              <TouchableOpacity 
                style={styles.zoomMeetingCard}
                onPress={() => handleOpenScheduleForm('zoom')}
                activeOpacity={0.88}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={styles.scheduleIconBg}>
                    <Video size={22} color="#2563EB" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Zoom Meeting</Text>
                </View>
                <Text style={styles.scheduleCardDesc}>
                  Schedule a new Bible class, automatically generate a Zoom meeting link via Zoom API, and invite members to join in fellowship and study.
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
            activeOpacity={0.85}
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
    paddingTop: 32,
    paddingBottom: 32,
    minHeight: 96,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative'
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 0 },
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
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 40,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  clockTime: {
    color: '#fff',
    fontSize: 34,
    fontFamily: serifFont,
    fontWeight: '300',
    marginBottom: 2,
  },
  clockDate: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: '#F97316',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  scheduleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scheduleCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  scheduleCardDesc: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
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

  // Google Meet & Zoom Platform Cards
  googleMeetCard: {
    backgroundColor: '#059669',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    marginBottom: 14,
  },
  zoomMeetingCard: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    marginBottom: 14,
  },

  // YouTube Live Channel Card
  ytCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.25)',
  },
  ytCardConnected: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ytCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  ytCardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  ytConnectBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  ytConnectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  ytConnectedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ytActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ytActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  ytActivePillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  ytDisconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ytDisconnectBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  },

  // YouTube Meeting Details Box
  ytMeetingDetailBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ytDetailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ytDetailBoxTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  ytStatusBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ytStatusBadgeLive: {
    backgroundColor: '#DC2626',
  },
  ytStatusBadgeEnded: {
    backgroundColor: '#64748B',
  },
  ytStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  ytWatchLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  ytWatchLinkText: {
    color: '#60A5FA',
    fontSize: 12,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  ytSmallActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  ytSmallActionText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },

  // Meeting Card Badges
  ytCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  ytCardBadgeScheduled: {
    backgroundColor: '#2563EB',
  },
  ytCardBadgeLive: {
    backgroundColor: '#DC2626',
  },
  ytCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
