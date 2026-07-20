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
  StatusBar,
  Platform,
  Alert,
  Image
} from 'react-native';
import { 
  ChevronLeft, 
  MapPin, 
  CalendarCheck,
  Calendar,
  Play
} from 'lucide-react-native';
import FirestoreService, { ScheduleEvent } from '../services/FirestoreService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function EventsScreen({ navigation }: any) {
  const { isDark, colors } = useTheme();
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'thisWeek' | 'upcoming' | 'past'>('upcoming');

  const fetchEvents = async () => {
    try {
      const [upcoming, past] = await Promise.all([
        FirestoreService.getUpcomingEvents(15),
        FirestoreService.getPastEvents(5)
      ]);
      console.log('📅 Mapped Upcoming Events:', JSON.stringify(upcoming, null, 2));
      console.log('📅 Mapped Past Events:', JSON.stringify(past, null, 2));
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getRelativeDayLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return null;
  };

  const getRelativeDayColor = (label: string | null) => {
    if (label === 'Today') return '#e11d48'; // Red
    if (label === 'Tomorrow') return '#0284c7'; // Blue
    if (label === 'Yesterday') return '#94a3b8'; // Slate
    return '#64748b';
  };

  const renderEvent = (item: ScheduleEvent, isPast: boolean = false) => {
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.eventBanner, isPast && { opacity: 0.8 }]} 
        onPress={() => navigation.navigate('EventDetails', { event: item })}
      >
        <View style={[styles.ebHd, isPast && { backgroundColor: '#475569' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color="#FCD34D" />
            <Text style={styles.ebHdLbl}>{isPast ? 'PAST EVENT · ముగిసినవి' : 'EVENT DETAILS · వివరాలు'}</Text>
          </View>
        </View>
        <View style={styles.ebBody}>
          <View style={styles.ebThumbnailContainer}>
            <Image 
              source={{ uri: item.image || item.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400' }}
              style={styles.ebThumbnail}
              resizeMode="cover"
            />
            {getRelativeDayLabel(item.date) && (
              <Text style={{ 
                fontSize: 10, 
                fontWeight: '800', 
                color: getRelativeDayColor(getRelativeDayLabel(item.date)), 
                marginTop: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {getRelativeDayLabel(item.date)}
              </Text>
            )}
          </View>
          <View style={styles.ebInfo}>
            <Text style={styles.ebTitle} numberOfLines={2}>
              {item.title || item.name || 'Event'}{item.titleTelugu ? ` · ${item.titleTelugu}` : ''}
            </Text>
            
            <View style={styles.highlightRow}>
              <View style={styles.dateBadge}>
                <Calendar size={11} color="#1a2d5a" />
                <Text style={styles.badgeTextMain}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} || {formatTeluguDate(item.date)}
                </Text>
              </View>
            </View>

            <View style={[styles.highlightRow, { marginTop: 6 }]}>
              <View style={styles.timeBadge}>
                <Play size={8} color="#c0392b" fill="#c0392b" style={{ transform: [{ rotate: '90deg' }] }} />
                <Text style={styles.timeBadgeText}>{formatTime(item.startTime)} – {formatTime(item.endTime)}</Text>
              </View>
            </View>

            <View style={[styles.ebMetaRow, { marginTop: 6, alignItems: 'flex-start' }]}>
              <MapPin size={11} color="#64748b" style={{ marginTop: 2 }} />
              <Text style={styles.ebMetaText}>{item.location || item.address || 'Church Main Hall'}</Text>
            </View>

            <Text style={styles.ebDetailsLink}>Details →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0f172a' : '#1a2d5a' }]}>
        <ActivityIndicator size="large" color="#FCD34D" />
        <Text style={styles.loadingText}>Loading Events... కార్యక్రమాలు లోడ్ అవుతున్నాయి...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Events Archive</Text>
          <Text style={styles.headerSub}>కార్యక్రమాల జాబితా</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['thisWeek', 'upcoming', 'past'] as const).map(tab => {
          const isActive = activeTab === tab;
          let label = tab === 'thisWeek' ? 'This Week' : tab === 'upcoming' ? 'Upcoming' : 'Past';
          return (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabTxt, isActive && styles.tabTxtActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={
          activeTab === 'thisWeek' 
            ? upcomingEvents.filter(e => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
                endOfWeek.setHours(23,59,59,999);
                const d = new Date(e.date);
                return d >= today && d <= endOfWeek;
              })
            : activeTab === 'upcoming' 
              ? upcomingEvents 
              : pastEvents
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderEvent(item, activeTab === 'past')}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <CalendarCheck size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptySub}>Check back later for new activities.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fbbf24', marginTop: 15, fontWeight: '600' },

  // Header
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 25,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 60 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 2 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    marginBottom: 5,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  tabBtnActive: {
    backgroundColor: '#1a2d5a',
  },
  tabTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTxtActive: {
    color: '#FCD34D',
  },

  listContainer: { paddingBottom: 40, paddingTop: 10 },

  // Event Card
  // Event Card (Sermon Style)
  eventBanner: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  ebHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ebHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  ebBody: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'flex-start', paddingVertical: 15 },
  ebThumbnailContainer: { width: 100, height: 56, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  ebThumbnail: { width: 100, height: 56, borderRadius: 8 },
  ebInfo: { flex: 1, paddingHorizontal: 15 },
  ebTitle: { fontSize: 13.5, fontWeight: '800', color: '#1a2d5a', marginBottom: 5 },
  ebDetailsLink: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', marginTop: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fffbeb', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 4
  },
  timeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4
  },
  badgeTextMain: { fontSize: 9.5, fontWeight: '700', color: '#1a2d5a' },
  timeBadgeText: { fontSize: 9, fontWeight: '700', color: '#c0392b' },
  ebMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ebMetaText: { fontSize: 10, color: '#64748b', fontWeight: '500', lineHeight: 14 },

  emptyState: { padding: 60, alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a2d5a', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});
