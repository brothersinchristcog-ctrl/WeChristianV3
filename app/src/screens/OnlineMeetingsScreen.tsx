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
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnlineMeetingsScreen({ navigation }: any) {
  const { activeChurch } = useChurch();
  const { isDark } = useTheme();
  
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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
  
  const upcomingMeetings = meetings.filter(m => {
    if (m.status === 'upcoming' || m.status === 'live') return true;
    if (m.startTime && m.startTime.seconds) {
      return new Date(m.startTime.seconds * 1000) >= now;
    }
    return false;
  }).reverse(); 

  const pastMeetings = meetings.filter(m => {
    if (m.status === 'past') return true;
    if (m.status === 'upcoming' || m.status === 'live') return false;
    if (m.startTime && m.startTime.seconds) {
      return new Date(m.startTime.seconds * 1000) < now;
    }
    return true;
  });

  const displayList = activeTab === 'upcoming' ? upcomingMeetings : pastMeetings;

  const renderMeeting = ({ item }: { item: any }) => {
    const isLive = item.status === 'live' || (activeTab === 'upcoming' && item.startTime && new Date(item.startTime.seconds * 1000) <= new Date(new Date().getTime() + 15 * 60 * 1000));
    
    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={[styles.iconBox, isLive && { backgroundColor: '#ef4444' }]}>
              <Video size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, isDark && { color: '#fff' }]} numberOfLines={2}>
                {item.title || 'Online Meeting'}
              </Text>
              {isLive && activeTab === 'upcoming' && (
                <Text style={styles.liveBadge}>LIVE NOW</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.startTime ? new Date(item.startTime.seconds * 1000).toLocaleDateString() : 'TBA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.startTime ? new Date(item.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
            </Text>
          </View>
        </View>

        {(item.teacher || item.bibleBook) && (
          <View style={styles.metaBox}>
            {item.teacher ? (
              <View style={styles.metaItem}>
                <User size={14} color="#4F46E5" />
                <Text style={styles.metaText}>{item.teacher}</Text>
              </View>
            ) : null}
            {item.bibleBook ? (
              <View style={styles.metaItem}>
                <BookOpen size={14} color="#4F46E5" />
                <Text style={styles.metaText}>{item.bibleBook}</Text>
              </View>
            ) : null}
          </View>
        )}

        {activeTab === 'upcoming' && item.meetingLink && (
          <TouchableOpacity 
            style={[styles.joinBtn, isLive && styles.joinBtnLive]}
            onPress={() => Linking.openURL(item.meetingLink)}
          >
            <Text style={styles.joinBtnText}>Join Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Meetings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Live & Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past Meetings</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a2d5a" />
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.center}>
          <Video size={48} color="#9CA3AF" style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>
            No {activeTab} meetings found
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => item.id}
          renderItem={renderMeeting}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  containerDark: { backgroundColor: '#111827' },
  
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 60 : 20, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1a2d5a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1a2d5a',
    fontWeight: '800',
  },

  listContent: { padding: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardDark: { backgroundColor: '#1F2937' },
  
  cardHeader: { marginBottom: 16 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  liveBadge: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
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
    color: '#6B7280',
    fontWeight: '500',
  },

  metaBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },

  joinBtn: {
    backgroundColor: '#1a2d5a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtnLive: {
    backgroundColor: '#2563EB',
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16, fontWeight: '500' }
});
