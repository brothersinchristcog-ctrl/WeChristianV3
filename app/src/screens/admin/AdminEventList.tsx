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
  Image,
  Modal,
  Alert
} from 'react-native';
import { MapPin, Clock, Calendar, Trash2, ChevronLeft, Plus } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

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
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

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

  const confirmDeleteEvent = async (deleteMode?: 'single' | 'future') => {
    if (!eventToDelete?.id) return;
    try {
      setLoading(true);
      await FirestoreService.deleteEvent(eventToDelete.id, deleteMode);
      await fetchEvents();
      setEventToDelete(null);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Could not delete event.');
      setEventToDelete(null);
      setLoading(false);
    }
  };

  const handleDelete = (event: any) => {
    setEventToDelete(event);
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
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
              <View>
                <Text style={styles.heroTitle}>Events</Text>
                <Text style={[styles.heroSub, { marginTop: 2 }]}>{events.length} total · {upcomingCount} upcoming</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(8); }}>
              <Plus size={16} color="#1a2d5a" />
              <Text style={styles.newBtnTxt}>New</Text>
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity style={[styles.statCard, filterType === 'Upcoming' && styles.activeStatCard]} onPress={() => setFilterType('Upcoming')}>
            <Text style={[styles.statNum, { color: '#c0392b' }]}>{upcomingCount}</Text>
            <Text style={styles.statLbl}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, filterType === 'Past' && styles.activeStatCard]} onPress={() => setFilterType('Past')}>
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
                <Calendar size={11} color="#c0392b" />
                <Text style={[styles.eiMetaTxt, { color: '#c0392b', fontWeight: '700' }]}>{formatDate(event.date)}</Text>
              </View>
              <View style={styles.eiMetaRow}>
                <Clock size={11} color="#6B7280" />
                <Text style={styles.eiMetaTxt} numberOfLines={1}>
                  {formatDisplayTime(event.startTime)}
                  {event.endTime ? ` — ${formatDisplayTime(event.endTime)}` : ''}
                </Text>
              </View>
              <View style={styles.eiMetaRow}>
                <MapPin size={11} color="#6B7280" />
                <Text style={styles.eiMetaTxt} numberOfLines={1}>{event.venueEn || event.location || 'No Venue'}</Text>
              </View>
              <View style={styles.eiFoot}>
                <View style={[event.status?.toLowerCase().includes('dra') ? styles.badgeDraft : styles.badgePub, { flexShrink: 1 }]}>
                  <Text style={event.status?.toLowerCase().includes('dra') ? styles.badgeDraftTxt : styles.badgePubTxt} numberOfLines={1}>
                    {(event.status || 'Published').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={() => handleEdit(event)} style={styles.editAction}>
                <Text style={styles.editActionTxt}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(event)} style={styles.deleteAction}>
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.deleteActionTxt}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Delete Confirmation Modal ── */}
      {eventToDelete && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={[styles.successIconOuter, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.successIconInner, { backgroundColor: '#DC2626' }]}>
                  <Trash2 size={28} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Delete Event?</Text>
              <Text style={styles.successDesc}>
                {eventToDelete.recurringGroupId 
                  ? `You are deleting a recurring event. Do you want to delete only this specific occurrence, or this and all future occurrences?`
                  : `Are you sure you want to delete "${eventToDelete.name || 'this event'}"? This action cannot be undone.`}
              </Text>
              {eventToDelete.recurringGroupId ? (
                <View style={{ gap: 10, width: '100%' }}>
                  <TouchableOpacity style={[styles.successActionBtn, { backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={() => confirmDeleteEvent('single')}>
                    <Text style={styles.successActionTxt}>Only this event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.successActionBtn, { backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={() => confirmDeleteEvent('future')}>
                    <Text style={styles.successActionTxt}>This and future events</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.successSecBtn} onPress={() => setEventToDelete(null)}>
                    <Text style={styles.successSecTxt}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                  <TouchableOpacity style={[styles.successSecBtn, { flex: 1 }]} onPress={() => setEventToDelete(null)}>
                    <Text style={styles.successSecTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.successActionBtn, { flex: 1, backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={() => confirmDeleteEvent('single')}>
                    <Text style={styles.successActionTxt}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastIconBox}>
              <Trash2 size={24} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.toastTitle}>Event Deleted</Text>
              <Text style={styles.toastSub}>The event has been permanently removed.</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE8DC' },
  scroll: { paddingBottom: 80 },

  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  
  newBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  newBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)', shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  activeStatCard: { borderColor: '#1a2d5a', borderWidth: 1.5, backgroundColor: '#F8FAFC' },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  statLbl: { fontSize: 9, color: '#64748B', marginTop: 2, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.5 },

  listLabel: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', marginBottom: 12, marginTop: 4, paddingHorizontal: 20, textTransform: 'uppercase', letterSpacing: 0.5 },

  eventItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 14, alignItems: 'flex-start', shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  featuredItem: { borderWidth: 1.5, borderColor: '#1a2d5a' },
  eiThumb: { width: 90, height: 60, backgroundColor: '#1a2d5a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  eiThumbImg: { width: '100%', height: '100%' },
  eiThumbTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  
  eiBody: { flex: 1, paddingRight: 10 },
  eiTitle: { fontSize: 14, fontWeight: '700', color: '#1a2d5a', marginBottom: 2 },
  eiTe: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  
  eiMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  eiMetaTxt: { fontSize: 11.5, color: '#64748B', marginLeft: 6, flexShrink: 1 },
  
  eiFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  badgePub: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePubTxt: { color: '#15803D', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeDraft: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeDraftTxt: { color: '#64748B', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  eiEdit: { position: 'absolute', top: 0, right: 0, padding: 4 },
  
  actionsContainer: { borderLeftWidth: 1.5, borderLeftColor: '#E2E8F0', paddingLeft: 12, marginLeft: 6, justifyContent: 'center', width: 56 },
  editAction: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1 },
  editActionTxt: { fontSize: 9, fontWeight: '800', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteAction: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1, borderTopWidth: 1.5, borderTopColor: '#E2E8F0' },
  deleteActionTxt: { fontSize: 9, fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  eiLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eiLocTxt: { fontSize: 11, color: COLORS.inkSoft, flexShrink: 1 },
  eiStatusRow: { marginTop: 7 },

  // Toast
  toastOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  toastCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, paddingRight: 24, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#1a2d5a', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)', width: '100%' },
  toastIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  toastTitle: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  toastSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  // Confirmation Modal
  successBg: { flex: 1, backgroundColor: 'rgba(15,23,42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 28, padding: 30, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  successIconOuter: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#DC2626', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  successIconInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1a2d5a', marginBottom: 12, textAlign: 'center', letterSpacing: -0.3 },
  successDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 26, paddingHorizontal: 10 },
  successActionBtn: { backgroundColor: '#DC2626', height: 52, borderRadius: 14, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#DC2626', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  successActionTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  successSecBtn: { height: 52, borderRadius: 14, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  successSecTxt: { color: '#475569', fontSize: 14, fontWeight: '800' }
});

