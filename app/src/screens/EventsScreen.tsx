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
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  MapPin, 
  CalendarCheck,
  Calendar,
  Clock,
  Play
} from 'lucide-react-native';
import FirestoreService, { ScheduleEvent } from '../services/FirestoreService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function EventsScreen({ navigation }: any) {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
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

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    try {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        } else if (parts[0].length === 2) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
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

  const getRelativeDayBg = (label: string | null) => {
    if (label === 'Today') return '#ffe4e6';
    if (label === 'Tomorrow') return '#e0f2fe';
    if (label === 'Yesterday') return '#f1f5f9';
    return '#f1f5f9';
  };

  const formatEventDateRange = (startDateStr?: string, endDateStr?: string) => {
    const startFormatted = formatDate(startDateStr);
    if (!endDateStr || startDateStr === endDateStr) {
      return { isMultiDay: false, text: startFormatted };
    }
    const endFormatted = formatDate(endDateStr);
    if (startFormatted === endFormatted) {
      return { isMultiDay: false, text: startFormatted };
    }
    return { isMultiDay: true, text: `${startFormatted} – ${endFormatted}` };
  };

  const formatEventTimeRange = (startTimeStr?: string, endTimeStr?: string) => {
    const start = formatTime(startTimeStr);
    const end = formatTime(endTimeStr);
    if (!startTimeStr && !endTimeStr) return '--';
    if (startTimeStr && !endTimeStr) return start;
    if (!startTimeStr && endTimeStr) return end;
    return `${start} – ${end}`;
  };

  const renderEvent = (item: ScheduleEvent, isPast: boolean = false) => {
    const relDay = getRelativeDayLabel(item.date);
    const dateInfo = formatEventDateRange(item.date, item.endDate);
    const timeText = formatEventTimeRange(item.startTime, item.endTime);

    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.88}
        style={[
          styles.eventBanner, 
          isPast && { opacity: 0.85 },
          isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }
        ]} 
        onPress={() => navigation.navigate('EventDetails', { event: item })}
      >
        <View style={[styles.ebHd, isPast && { backgroundColor: '#475569' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color="#FCD34D" />
            <Text style={styles.ebHdLbl}>
              {isPast ? t('events.pastEvents').toUpperCase() : t('events.eventDetails').toUpperCase()}
            </Text>
          </View>
          {(item.type || item.eventType) && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeTxt} numberOfLines={1}>
                {item.type || item.eventType}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.ebBody, isDark && { backgroundColor: '#1e293b' }]}>
          {/* Left Thumbnail Column */}
          <View style={styles.ebLeftCol}>
            <Image 
              source={{ uri: item.image || item.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400' }}
              style={styles.ebThumbnail}
              resizeMode="cover"
            />
            {relDay && (
              <View style={[styles.dayChip, { backgroundColor: isDark ? '#334155' : getRelativeDayBg(relDay) }]}>
                <Text style={[styles.dayChipTxt, { color: getRelativeDayColor(relDay) }]}>
                  {relDay}
                </Text>
              </View>
            )}
          </View>

          {/* Right Info Column */}
          <View style={styles.ebInfo}>
            <Text 
              style={[styles.ebTitle, isDark && { color: '#f8fafc' }]} 
              numberOfLines={2}
            >
              {item.title || item.name || 'Event'}{item.titleTelugu ? ` · ${item.titleTelugu}` : ''}
            </Text>
            
            {/* Unified Date Badge */}
            <View style={[styles.compactBadge, styles.dateBadge, isDark && { backgroundColor: '#1e3a5f', borderColor: '#2563eb' }]}>
              <Calendar size={11} color={isDark ? '#93c5fd' : '#1d4ed8'} />
              <Text style={[styles.badgeLabel, isDark && { color: '#bfdbfe' }]}>
                {dateInfo.isMultiDay ? 'Dates: ' : 'Date: '}
              </Text>
              <Text style={[styles.badgeTextMain, isDark && { color: '#eff6ff' }]} numberOfLines={1}>
                {dateInfo.text}
              </Text>
            </View>

            {/* Unified Time Badge */}
            <View style={[styles.compactBadge, styles.timeBadge, isDark && { backgroundColor: '#3b1c24', borderColor: '#9f1239' }]}>
              <Clock size={11} color={isDark ? '#fca5a5' : '#b91c1c'} />
              <Text style={[styles.timeLabel, isDark && { color: '#fecdd3' }]}>Time: </Text>
              <Text style={[styles.timeBadgeText, isDark && { color: '#fff1f2' }]} numberOfLines={1}>
                {timeText}
              </Text>
            </View>

            {/* Bottom Row: Location & Details link side-by-side */}
            <View style={styles.ebFooterRow}>
              <View style={styles.locationWrap}>
                <MapPin size={11} color="#64748b" style={{ marginRight: 3, flexShrink: 0 }} />
                <Text style={[styles.ebLocationText, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                  {item.location || item.address || 'Church Main Hall'}
                </Text>
              </View>

              <Text style={[styles.ebDetailsLink, isDark && { color: '#60a5fa' }]}>Details →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0f172a' : '#1a2d5a' }]}>
        <ActivityIndicator size="large" color="#FCD34D" />
        <Text style={styles.loadingText}>{t('events.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
            <Text style={styles.headerTitle}>{t('events.title')}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['thisWeek', 'upcoming', 'past'] as const).map(tab => {
          const isActive = activeTab === tab;
          let label = tab === 'thisWeek' ? t('events.thisWeek') : tab === 'upcoming' ? t('events.upcoming') : t('events.past');
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
              <Text style={styles.emptyTitle}>
                {activeTab === 'past' ? t('events.noPastEvents') : t('events.noUpcomingEvents')}
              </Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },
  backBtn: { zIndex: 10, padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 2 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
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

  listContainer: { paddingBottom: 40, paddingTop: 10, flexGrow: 1 },

  // Event Card (Compact, Proportional Design)
  eventBanner: { 
    marginHorizontal: 16, 
    marginVertical: 6, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  ebHd: { 
    backgroundColor: '#1a2d5a', 
    paddingVertical: 7, 
    paddingHorizontal: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  ebHdLbl: { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  typeBadgeTxt: { fontSize: 9.5, color: '#FCD34D', fontWeight: '700' },
  ebBody: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    gap: 12 
  },
  ebLeftCol: { 
    width: 96, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  ebThumbnail: { 
    width: 96, 
    height: 64, 
    borderRadius: 8,
    backgroundColor: '#f1f5f9' 
  },
  dayChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
    alignSelf: 'center',
  },
  dayChipTxt: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  ebInfo: { 
    flex: 1, 
    justifyContent: 'center',
    gap: 4 
  },
  ebTitle: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#0f172a', 
    lineHeight: 17 
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 4,
  },
  dateBadge: { 
    backgroundColor: '#eff6ff', 
    borderColor: '#dbeafe' 
  },
  timeBadge: { 
    backgroundColor: '#fff1f2', 
    borderColor: '#ffe4e6' 
  },
  badgeLabel: { fontSize: 9, fontWeight: '800', color: '#1d4ed8' },
  badgeTextMain: { fontSize: 9.5, fontWeight: '700', color: '#1e3a8a', flexShrink: 1 },
  timeLabel: { fontSize: 9, fontWeight: '800', color: '#b91c1c' },
  timeBadgeText: { fontSize: 9.5, fontWeight: '700', color: '#881337', flexShrink: 1 },
  ebFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 2,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  ebLocationText: { 
    fontSize: 10, 
    color: '#64748b', 
    fontWeight: '500', 
    flexShrink: 1 
  },
  ebDetailsLink: { 
    fontSize: 10.5, 
    fontWeight: '800', 
    color: '#1a2d5a', 
    flexShrink: 0 
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a2d5a', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});
