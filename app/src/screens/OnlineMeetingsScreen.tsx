import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Linking,
  Platform,
  StatusBar
} from 'react-native';
import { 
  Video, 
  ChevronLeft,
  Calendar,
  Clock,
  User,
  BookOpen
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';

const { width } = Dimensions.get('window');

export default function OnlineMeetingsScreen({ navigation }: any) {
  const { activeChurch } = useChurch();
  const { user, member } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed'>('upcoming');

  const fetchMeetings = async () => {
    if (!activeChurch?.id) return;
    try {
      const snapshot = await firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('online_meetings')
        .orderBy('startTime', 'desc')
        .get();

      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [activeChurch?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeetings();
  };

  const now = new Date();
  
  const liveMeetings: any[] = [];
  const upcomingMeetings: any[] = [];
  const pastMeetings: any[] = [];

  meetings.forEach(m => {
    if (m.status === 'cancelled') return;

    if (m.startTime && m.endTime && m.startTime.seconds && m.endTime.seconds) {
      const start = new Date(m.startTime.seconds * 1000);
      const end = new Date(m.endTime.seconds * 1000);
      
      if (end < now) {
        pastMeetings.push(m);
      } else if (start <= now && end >= now) {
        liveMeetings.push(m);
      } else {
        upcomingMeetings.push(m);
      }
    } else {
      if (m.status === 'live') liveMeetings.push(m);
      else if (m.status === 'past') pastMeetings.push(m);
      else upcomingMeetings.push(m);
    }
  });

  let displayList = upcomingMeetings;
  if (activeTab === 'live') displayList = liveMeetings;
  if (activeTab === 'completed') displayList = pastMeetings;

  const renderMeeting = ({ item }: { item: any }) => {
    const isLive = activeTab === 'live' || item.status === 'live' || (
      item.startTime && item.endTime && 
      new Date(item.startTime.seconds * 1000) <= now && 
      new Date(item.endTime.seconds * 1000) >= now
    );

    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}>
        
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={[styles.iconBox, isLive && { backgroundColor: '#ef4444' }]}>
              <Video size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1e293b' }]} numberOfLines={2}>
                {item.title || 'Online Meeting'}
              </Text>
              {isLive && (
                <Text style={styles.liveBadge}>LIVE NOW</Text>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

        {/* Date & Time Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#64748b" />
            <Text style={[styles.detailText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {item.startTime ? new Date(item.startTime.seconds * 1000).toLocaleDateString('en-GB').replace(/\//g, '-') : 'TBA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color="#64748b" />
            <Text style={[styles.detailText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {item.startTime ? new Date(item.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
            </Text>
          </View>
        </View>

        {/* Highlights / Meta Box */}
        {(item.subtitle || item.topic || item.bibleBook || item.teacher) && (
          <View style={[styles.metaBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            {(item.subtitle || item.topic || item.bibleBook) ? (
              <View style={styles.metaItem}>
                <BookOpen size={14} color="#1a2d5a" />
                <Text style={[styles.metaText, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>
                  {item.subtitle || item.topic || item.bibleBook}
                </Text>
              </View>
            ) : null}
            {item.teacher ? (
              <View style={styles.metaItem}>
                <User size={14} color="#1a2d5a" />
                <Text style={[styles.metaText, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>
                  {item.teacher}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Join Button */}
        {item.meetingLink && (
          <TouchableOpacity 
            style={[styles.joinBtn, isLive && styles.joinBtnLive]}
            onPress={async () => {
              if (activeChurch?.id && member) {
                try {
                  await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').doc(item.id).collection('attendees').doc(member.id).set({
                    name: member.name || user?.displayName || 'Unknown Member',
                    profilePhoto: (member as any).profilePhoto || (member as any).photoURL || user?.photoURL || null,
                    joinedAt: firestore.FieldValue.serverTimestamp()
                  }, { merge: true });
                } catch (e) {
                  console.log('Attendance log error:', e);
                }
              }
              Linking.openURL(item.meetingLink);
            }}
          >
            <Video size={18} color="#fff" />
            <Text style={styles.joinBtnText}>{isLive ? 'Join Live Stream' : 'Join Meeting Room'}</Text>
          </TouchableOpacity>
        )}

      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Online Bible Classes</Text>
        </View>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'live' && styles.activeTab]} 
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>Live</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]} 
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.center}>
          <Video size={48} color="#4B5563" style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={styles.emptyText}>
            No {activeTab} meetings found
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => item.id}
          renderItem={renderMeeting}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
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
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  themeToggle: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  themeToggleText: { color: '#fff', fontSize: 16 },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 25,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#1a2d5a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },

  listContent: { padding: 16, paddingBottom: 100 },
  
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: { marginBottom: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  liveBadge: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  separator: {
    height: 1,
    marginBottom: 12,
  },
  
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },

  metaBox: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
  },

  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a2d5a',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%'
  },
  joinBtnLive: {
    backgroundColor: '#ef4444',
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16, fontWeight: '500' }
});
