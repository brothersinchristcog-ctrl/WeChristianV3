import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Clock, ChevronRight, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react-native';
import Theme from '../theme/Theme';
import FirestoreService, { ScheduleEvent } from '../services/FirestoreService';

const { width } = Dimensions.get('window');

export default function EventsCalendarScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [dates, setDates] = useState<{ day: string, date: number, full: Date }[]>([]);

  useEffect(() => {
    // Generate dates for the current week
    const now = new Date();
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        weekDates.push({
            day: d.toLocaleString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            full: d
        });
    }
    setDates(weekDates);
    setSelectedDate(now.getDate());

    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const sfEvents = await FirestoreService.getUpcomingEvents(15);
      setEvents(sfEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return { day: '--', month: '---' };
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const getCategoryColor = (name?: string) => {
    if (!name) return '#2c3e50';
    const n = name.toLowerCase();
    if (n.includes('service')) return '#1565c0';
    if (n.includes('youth')) return '#f39c12';
    if (n.includes('fasting')) return '#e74c3c';
    if (n.includes('women')) return '#9b59b6';
    return '#2c3e50';
  };

  const renderEventCard = ({ item }: { item: ScheduleEvent }) => {
    const { day, month } = formatEventDate(item.date);
    const color = getCategoryColor(item.name);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
      >
        <View style={styles.cardMain}>
          {/* Date Box */}
          <View style={[styles.dateBox, { backgroundColor: Theme.Colors.primary }]}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>
  
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.eventTitle}>{item.name}</Text>
            <View style={styles.infoRow}>
              <Clock size={12} color="#6c757d" style={{ marginRight: 6 }} />
              <Text style={styles.infoText}>{item.time || '10:00 AM'}</Text>
            </View>
            <View style={[styles.metaRow, { marginTop: 2 }]}>
            <MapPin size={14} color="#6c757d" />
            <Text style={styles.metaText}>
              {item.location || 'Church Main Campus'}
            </Text>
          </View>
            
            <View style={styles.footerRow}>
              <View style={[styles.tag, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.tagText, { color: color }]}>Meeting</Text>
              </View>
              <TouchableOpacity style={styles.rsvpBtn}>
                <Text style={[styles.rsvpText, { color: Theme.Colors.primary }]}>RSVP →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: Theme.Colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
             <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logoImage}
             />
          </View>
          <View>
            <Text style={styles.title}>Events</Text>
            <Text style={styles.subTitle}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* ── Horizontal Date Strip ── */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dateStrip}
          contentContainerStyle={styles.dateStripContent}
        >
          {dates.map((item) => (
            <TouchableOpacity 
              key={`${item.day}-${item.date}`} 
              style={[styles.dateItem, selectedDate === item.date && styles.activeDateItem]}
              onPress={() => setSelectedDate(item.date)}
            >
              <Text style={[styles.dateDayName, selectedDate === item.date && styles.activeDateText]}>
                {item.day}
              </Text>
              <View style={[styles.dateCircle, selectedDate === item.date && styles.activeDateCircle]}>
                <Text style={[styles.dateNumber, selectedDate === item.date && styles.activeDateCircleText]}>
                  {item.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Events List ── */}
      {loading ? (
        <ActivityIndicator size="large" color={Theme.Colors.primary} style={{ marginTop: 50 }} />
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
           <Text style={styles.emptyText}>No events scheduled for this period.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#0a1a3b',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    padding: 2
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  backButton: {
    marginRight: 10,
    marginLeft: -5
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  dateStrip: {
    marginTop: 10,
  },
  dateStripContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  dateItem: {
    alignItems: 'center',
    width: 45,
  },
  dateDayName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDateCircle: {
    backgroundColor: '#fff',
  },
  dateNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeDateCircleText: {
    color: '#0a1a3b',
  },
  activeDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeDateItem: {
    opacity: 1,
  },

  listContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  cardMain: {
    flexDirection: 'row',
    padding: 16,
  },
  dateBox: {
    width: 50,
    height: 60,
    backgroundColor: '#0a1a3b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateDay: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  dateMonth: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
  
  content: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 12, color: '#6c757d', flex: 1 },
  infoDot: { color: '#adb5bd' },
  
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  rsvpBtn: {
    paddingVertical: 4,
  },
  rsvpText: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    color: '#6c757d',
    textAlign: 'center',
    fontSize: 16
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  metaText: { fontSize: 11, color: '#666', fontWeight: '500' },
});
