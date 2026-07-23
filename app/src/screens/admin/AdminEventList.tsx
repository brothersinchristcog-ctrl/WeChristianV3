import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { MapPin, Clock, Calendar, Trash2, ChevronLeft } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { Alert } from 'react-native';

import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

const COLORS = {
  ink: '#151C33',
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
};

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export default function AdminEventList() {
  const { setActiveTab, setEditingData } = useContext(AdminTabContext);
  const [events, setEvents] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getEvents();
      console.log('📊 [AdminEventList] Fetched Events:', JSON.stringify(data.slice(0, 2), null, 2));
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = events.filter(e => e.date >= today).length;
  const pastCount = events.filter(e => e.date < today).length;

  const formatDate = (sfDate: string) => {
    if (!sfDate) return '';
    try {
      const d = new Date(sfDate);
      if (isNaN(d.getTime())) return sfDate;
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return sfDate;
    }
  };

  const formatDisplayTime = (sfTime: string) => {
    if (!sfTime || typeof sfTime !== 'string') return '';
    // If it's already formatted (e.g. "10:00 AM"), return as is
    if (sfTime.includes('AM') || sfTime.includes('PM')) return sfTime;
    
    try {
      // Salesforce Time field returns HH:mm:ss.SSSZ
      const timePart = sfTime.split('.')[0]; // Get HH:mm:ss
      const [hours, minutes] = timePart.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
    } catch (e) {
      return sfTime;
    }
  };

  const handleEdit = (event: any) => {
    setEditingData(event);
    setActiveTab(8); // Switch to Event Editor tab
  };

  const handleDelete = (event: any) => {
    const executeDelete = async (deleteMode?: 'single' | 'future') => {
      try {
        setLoading(true);
        await FirestoreService.deleteEvent(event.id, deleteMode);
        await fetchEvents();
      } catch (err) {
        Alert.alert('Error', 'Failed to delete event');
        setLoading(false);
      }
    };

    if (event.recurringGroupId) {
      Alert.alert(
        'Delete Recurring Event',
        `You are deleting a recurring event. Do you want to delete only this specific occurrence, or this and all future occurrences?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Only this event', style: 'destructive', onPress: () => executeDelete('single') },
          { text: 'This and future events', style: 'destructive', onPress: () => executeDelete('future') }
        ]
      );
    } else {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${event.name || 'this event'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => executeDelete('single')
          }
        ]
      );
    }
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCD34D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Section Heading ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>📅 Event Manager</Text>
            <Text style={styles.headerSub}>Church Gatherings · కూటములు</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(8); }}>
            <Text style={styles.newBtnTxt}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#15803D' }]}>
              {events.filter(e => 
                !e.status || 
                e.status.toLowerCase().includes('pub') || 
                e.status.toLowerCase().includes('act')
              ).length}
            </Text>
            <Text style={styles.statLbl}>Published</Text>
          </View>
          <TouchableOpacity style={[styles.statCard, filterType === 'Upcoming' && { borderColor: '#c0392b', borderWidth: 1.5 }]} onPress={() => setFilterType('Upcoming')}>
            <Text style={[styles.statNum, { color: '#c0392b' }]}>{upcomingCount}</Text>
            <Text style={styles.statLbl}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, filterType === 'Past' && { borderColor: '#1a2d5a', borderWidth: 1.5 }]} onPress={() => setFilterType('Past')}>
            <Text style={[styles.statNum, { color: '#1a2d5a' }]}>{pastCount}</Text>
            <Text style={styles.statLbl}>Past Events</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listLabel}>{filterType === 'Upcoming' ? 'Upcoming events' : 'Past events'}</Text>

        {events
          .filter(e => filterType === 'Upcoming' ? e.date >= today : e.date < today)
          .sort((a, b) => filterType === 'Upcoming' 
             ? new Date(a.date).getTime() - new Date(b.date).getTime() 
             : new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((event, idx) => (
          <View key={event.id} style={[styles.eventItem, idx === 0 && styles.featuredItem]}>
            <TouchableOpacity style={[styles.eiThumb, { backgroundColor: event.bannerColor || '#1a2d5a' }]} onPress={() => handleEdit(event)}>
              {event.bannerUrl ? (
                <Image source={{ uri: event.bannerUrl }} style={styles.eiThumbImg} resizeMode="cover" />
              ) : (
                <Text style={styles.eiThumbTxt}>IMG</Text>
              )}
            </TouchableOpacity>
            <View style={styles.eiBody}>
              <Text style={styles.eiTitle} numberOfLines={1}>{event.name || 'No Title'}</Text>
              <Text style={styles.eiTe} numberOfLines={1}>{event.titleTe || ''}</Text>
              <View style={styles.eiMetaRow}>
                <Calendar size={10} color="#c0392b" />
                <Text style={[styles.eiMetaTxt, { color: '#c0392b', fontWeight: '600' }]}>{formatDate(event.date)}</Text>
                
                <Clock size={10} color="#6B7280" style={{ marginLeft: 8 }} />
                <Text style={styles.eiMetaTxt}>
                  {formatDisplayTime(event.startTime)}
                  {event.endTime ? ` — ${formatDisplayTime(event.endTime)}` : ''}
                </Text>
              </View>
              <View style={styles.eiMetaRow}>
                <MapPin size={10} color="#6B7280" />
                <Text style={styles.eiMetaTxt} numberOfLines={1}>{event.venueEn || event.location || 'No Venue'}</Text>
              </View>
              <View style={styles.eiFoot}>
                <View style={[event.status?.toLowerCase().includes('dra') ? styles.badgeDraft : styles.badgePub, { flexShrink: 1 }]}>
                  <Text style={event.status?.toLowerCase().includes('dra') ? styles.badgeDraftTxt : styles.badgePubTxt} numberOfLines={1}>
                    {(event.status || 'Published').toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(event)} style={{ padding: 4 }}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleEdit(event)} style={styles.eiEdit}>
                <Text style={{ color: '#1a2d5a', fontSize: 10, fontWeight: '800' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.paper },
  scroll: { paddingBottom: 80 },

  header: { 
    backgroundColor: COLORS.ink, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 46,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.goldDeep,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    position: 'relative'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: FONTS.sans },
  heroTitles: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: FONTS.serif },
  headerSub: { fontSize: 11, color: COLORS.parchment, fontFamily: FONTS.sans, marginTop: 2 },
  
  newBtn: { position: 'absolute', bottom: -16, right: 24, backgroundColor: COLORS.clay, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  newBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800', fontFamily: FONTS.serif, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.rule, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: FONTS.serif },
  statLbl: { fontSize: 9, color: COLORS.inkSoft, marginTop: 2, textTransform: 'uppercase', fontWeight: '700', fontFamily: FONTS.sans },

  listLabel: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 12, marginTop: 4, paddingHorizontal: 20, textTransform: 'uppercase', fontFamily: FONTS.serif },

  eventItem: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.rule, padding: 14, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 14, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  featuredItem: { borderWidth: 2, borderColor: COLORS.ink, backgroundColor: '#FAFBFC' },
  eiThumb: { width: 90, height: 60, backgroundColor: COLORS.ink2, borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  eiThumbImg: { width: '100%', height: '100%' },
  eiThumbTxt: { color: COLORS.parchment, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  
  eiBody: { flex: 1 },
  eiTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink, fontFamily: FONTS.serif, marginBottom: 2 },
  eiTe: { fontSize: 11, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 4, fontFamily: FONTS.serif },
  eiMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  eiMetaTxt: { fontSize: 11, color: COLORS.inkSoft, marginLeft: 4, fontFamily: FONTS.sans, fontWeight: '500' },
  
  eiFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  eiEdit: { backgroundColor: COLORS.paper, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: COLORS.rule },
  
  badgePub: { backgroundColor: COLORS.mossBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgePubTxt: { color: COLORS.moss, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  badgeDraft: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeDraftTxt: { color: COLORS.inkSoft, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  
  actionsContainer: { borderLeftWidth: 1, borderLeftColor: COLORS.rule, paddingLeft: 8, justifyContent: 'center', gap: 0 },
  editAction: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 10 },
  editActionTxt: { fontSize: 9, fontWeight: '700', color: COLORS.ink, textTransform: 'uppercase' },
  deleteAction: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.rule },
  deleteActionTxt: { fontSize: 9, fontWeight: '700', color: COLORS.clay, textTransform: 'uppercase' },
  
  eiLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eiLocTxt: { fontSize: 11, color: COLORS.inkSoft, flexShrink: 1 },
  eiStatusRow: { marginTop: 7 },
});
