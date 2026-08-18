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
  Platform,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { 
  Video, 
  ChevronLeft,
  Calendar,
  Clock,
  User,
  BookOpen,
  Radio,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';

const { width } = Dimensions.get('window');
const BRAND = '#1a2d5a';
const LIVE_COLOR = '#ef4444';

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

  const parseDate = (val: any) => {
    if (!val) return null;
    if (val.seconds) return new Date(val.seconds * 1000);
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    if (val instanceof Date) return val;
    return null;
  };

  const now = new Date();
  
  const liveMeetings: any[] = [];
  const upcomingMeetings: any[] = [];
  const pastMeetings: any[] = [];

  meetings.forEach(m => {
    if (m.status === 'cancelled') return;

    const startDt = parseDate(m.startTime);
    const endDt = parseDate(m.endTime);

    if (startDt && endDt) {
      if (endDt < now) {
        pastMeetings.push(m);
      } else if (startDt <= now && endDt >= now) {
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

  const bg = isDark ? '#0f172a' : '#f1f5f9';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const pillBg = isDark ? '#0f172a' : '#f8fafc';

  const formatDate = (dt: Date) =>
    dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (dt: Date) =>
    dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMeeting = ({ item }: { item: any }) => {
    const startDt = parseDate(item.startTime);
    const endDt = parseDate(item.endTime);
    const isLive =
      activeTab === 'live' ||
      item.status === 'live' ||
      (startDt && endDt && startDt <= now && endDt >= now);
    const isCompleted = activeTab === 'completed';

    // App brand colors per status
    const gradStart = isLive ? '#c0392b' : isCompleted ? '#374151' : '#1a2d5a';
    const gradEnd   = isLive ? '#991b1b' : isCompleted ? '#1f2937' : '#0f1e3d';

    const dateStr = startDt ? startDt.toLocaleDateString('en-GB').replace(/\//g, '-') : 'TBA';
    const timeStr = startDt && endDt
      ? `${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : startDt
      ? startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'TBA';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OnlineMeetingDetail', { meeting: item })}
      >
        <View style={[styles.gradCard, { backgroundColor: gradStart }]}>
          {/* Decorative circle */}
          <View style={[styles.gradCircle, { backgroundColor: gradEnd }]} />

          {/* Title */}
          <Text style={styles.gradTitle} numberOfLines={2}>
            {item.title || 'Online Meeting'}
          </Text>

          {/* Subtitle / Topic */}
          {(item.subtitle || item.topic || item.bibleBook) ? (
            <Text style={styles.gradSubtitle} numberOfLines={1}>
              {item.subtitle || item.topic || item.bibleBook}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={styles.gradDivider} />

          {/* Info rows */}
          <View style={styles.gradInfoRow}>
            <Calendar size={16} color="rgba(255,255,255,0.75)" />
            <Text style={styles.gradInfoText}>{dateStr}</Text>
          </View>

          <View style={styles.gradInfoRow}>
            <Clock size={16} color="rgba(255,255,255,0.75)" />
            <Text style={styles.gradInfoText}>{timeStr}</Text>
          </View>

          {(item.subtitle || item.topic || item.bibleBook) && (
            <View style={styles.gradInfoRow}>
              <BookOpen size={16} color="rgba(255,255,255,0.75)" />
              <Text style={styles.gradInfoText} numberOfLines={1}>
                {item.subtitle || item.topic || item.bibleBook}
              </Text>
            </View>
          )}

          {item.teacher && (
            <View style={styles.gradInfoRow}>
              <User size={16} color="rgba(255,255,255,0.75)" />
              <Text style={styles.gradInfoText} numberOfLines={1}>
                Host: {item.teacher}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.gradActions}>
            <TouchableOpacity
              style={styles.gradJoinBtn}
              onPress={() => navigation.navigate('OnlineMeetingDetail', { meeting: item })}
            >
              <Video size={15} color={gradStart} />
              <Text style={[styles.gradJoinText, { color: gradStart }]}>
                {isLive ? 'Join Live' : 'Join'}
              </Text>
            </TouchableOpacity>

            {isCompleted ? null : (
              <TouchableOpacity
                style={styles.gradLeaveBtn}
                onPress={() => navigation.navigate('OnlineMeetingDetail', { meeting: item })}
              >
                <Text style={styles.gradLeaveText}>Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs: { key: 'live' | 'upcoming' | 'completed'; label: string; count: number; color: string }[] = [
    { key: 'live', label: 'Live', count: liveMeetings.length, color: LIVE_COLOR },
    { key: 'upcoming', label: 'Upcoming', count: upcomingMeetings.length, color: BRAND },
    { key: 'completed', label: 'Completed', count: pastMeetings.length, color: '#64748b' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Bible Classes</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar — pill style */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderColor: border }]}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, isActive && { backgroundColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, { color: isActive ? '#fff' : textMuted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.center}>
          <Video size={52} color={textMuted} style={{ opacity: 0.35, marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No {activeTab} meetings</Text>
          <Text style={[styles.emptySubtitle, { color: textMuted }]}>
            {activeTab === 'live'
              ? 'No meetings are currently live.'
              : activeTab === 'upcoming'
              ? 'No upcoming meetings scheduled yet.'
              : 'No completed meetings to show.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => item.id}
          renderItem={renderMeeting}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    backgroundColor: BRAND,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  themeToggle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  themeToggleText: { fontSize: 14 },

  // Tab bar — pill style like screenshot
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Gradient card
  gradCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  gradCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -40,
    opacity: 0.4,
  },
  gradTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 30,
    marginBottom: 4,
  },
  gradSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  gradDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  gradInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gradInfoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  gradActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  gradJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  gradJoinText: {
    fontSize: 14,
    fontWeight: '800',
  },
  gradLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  gradLeaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});



