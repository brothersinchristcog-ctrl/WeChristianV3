import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadow } from '../../../theme/Theme';
import FirestoreService from '../../../services/FirestoreService';
import { CustomAlert, AlertButton } from '../../../components/CustomAlert';
import { PastorEvent } from '../../../types/event';
import { openInMaps } from '../../../utils/maps';
import EventTypeBadge from '../../../components/EventTypeBadge';
import DistanceBadge from '../../../components/DistanceBadge';
import { getStartingLocation } from '../../../utils/locationStore';
import MapView from 'react-native-maps';
import * as Speech from 'expo-speech';
import { SavedLocation } from '../../../utils/locationStore';

export const PastorEventDetail = ({ route, navigation }: { route: any; navigation: any }) => {
  const { event, allEvents = [] } = route.params as { event: PastorEvent; allEvents: PastorEvent[] };
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = React.useState(false);

  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
  }>({ visible: false, title: '', message: '', type: 'info' });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [homeLocation, setHomeLocation] = React.useState<SavedLocation | null>(null);

  const handleSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    const speechText = `You have an upcoming event: ${event.title}. It is scheduled for ${formatDate(event.date)} at ${event.startTime}. The venue is ${event.venue || event.address || 'Unknown'}. Do you have any questions?`;
    
    Speech.speak(speechText, {
      language: 'en',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  React.useEffect(() => {
    const fetchHome = async () => {
      const loc = await getStartingLocation();
      if (loc) setHomeLocation(loc);
    };
    fetchHome();

    return () => {
      Speech.stop();
    };
  }, []);

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch {
      return dateStr;
    }
  };

  // Helper to convert time strings like "9:00 AM" to sortable minutes
  const timeToMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    let m = parseInt(minutes || '0', 10);
    if (h === 12) h = 0;
    if (modifier.toUpperCase() === 'PM') h += 12;
    return h * 60 + m;
  };

  // Find next event for route planner link
  const sameDayEvents = allEvents
    .filter(e => e.date === event.date)
    .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  
  const eventIndex = sameDayEvents.findIndex(e => e.id === event.id);
  const nextEvent = sameDayEvents[eventIndex + 1];

  // Global Next Event for Distance calculations
  const globalEventIndex = allEvents.findIndex(e => e.id === event.id);
  const globalNextEvent = globalEventIndex >= 0 && globalEventIndex < allEvents.length - 1 ? allEvents[globalEventIndex + 1] : undefined;

  const [nextEventTravel, setNextEventTravel] = React.useState<{
    loading: boolean;
    currentToNextKm: number;
    currentToNextMins: number;
    homeToNextKm: number;
    homeToNextMins: number;
  }>({ loading: false, currentToNextKm: 0, currentToNextMins: 0, homeToNextKm: 0, homeToNextMins: 0 });

  React.useEffect(() => {
    if (!globalNextEvent || !globalNextEvent.lat || !globalNextEvent.lng) return;

    const calculateTravel = async () => {
      setNextEventTravel(prev => ({ ...prev, loading: true }));
      try {
        const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
        if (!GOOGLE_KEY) {
          setNextEventTravel(prev => ({ ...prev, loading: false }));
          return;
        }

        const destLat = globalNextEvent.lat;
        const destLng = globalNextEvent.lng;

        // 1. Current Event -> Next Event
        let curToNextKm = 0;
        let curToNextMins = 0;
        if (event.lat && event.lng) {
          const res1 = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${event.lat},${event.lng}&destinations=${destLat},${destLng}&key=${GOOGLE_KEY}`);
          const data1 = await res1.json();
          if (data1.status === 'OK' && data1.rows[0].elements[0].status === 'OK') {
            const element = data1.rows[0].elements[0];
            curToNextKm = element.distance.value / 1000;
            curToNextMins = Math.round(element.duration.value / 60);
          }
        }

        // 2. Home -> Next Event
        let homeToNextKm = 0;
        let homeToNextMins = 0;
        const home = await getStartingLocation();
        if (home && home.lat && home.lng) {
          const res2 = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${home.lat},${home.lng}&destinations=${destLat},${destLng}&key=${GOOGLE_KEY}`);
          const data2 = await res2.json();
          if (data2.status === 'OK' && data2.rows[0].elements[0].status === 'OK') {
            const element = data2.rows[0].elements[0];
            homeToNextKm = element.distance.value / 1000;
            homeToNextMins = Math.round(element.duration.value / 60);
          }
        }

        setNextEventTravel({
          loading: false,
          currentToNextKm: curToNextKm,
          currentToNextMins: curToNextMins,
          homeToNextKm: homeToNextKm,
          homeToNextMins: homeToNextMins
        });
      } catch (e) {
        console.warn('Failed to calculate travel for next event:', e);
        setNextEventTravel(prev => ({ ...prev, loading: false }));
      }
    };

    calculateTravel();
  }, [globalNextEvent]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = () => {
    openInMaps(event.lat || 0, event.lng || 0, event.title, [event.venue, event.address, event.city].filter(Boolean).join(', '));
  };

  const handleEdit = () => {
    navigation.navigate('CreateEvent', { editEvent: event });
  };

  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Delete Event',
      message: 'Are you sure you want to permanently delete this event?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeAlert },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            closeAlert();
            try {
              setDeleting(true);
              await FirestoreService.deletePastorEvent(event.id);
              
              // Slight delay so the previous modal can unmount fully before showing success
              setTimeout(() => {
                setAlertConfig({
                  visible: true,
                  title: 'Deleted',
                  message: 'Event has been deleted.',
                  type: 'success',
                  buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.goBack(); } }]
                });
              }, 300);
            } catch (err: any) {
              setDeleting(false);
              setTimeout(() => {
                setAlertConfig({
                  visible: true,
                  title: 'Delete Failed',
                  message: err?.message || 'Could not delete event.',
                  type: 'error',
                  buttons: [{ text: 'OK', onPress: closeAlert }]
                });
              }, 300);
            }
          }
        }
      ]
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
      
      {/* ── Hero Section ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => requestAnimationFrame(() => navigation.goBack())} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Event Details</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]}>{event.title}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Unified Main Event Info Card */}
        <View style={styles.card}>
          {/* 1. Header Info */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.mainTitle, { flex: 1, marginBottom: 16 }]}>{event.title}</Text>

          </View>

          <View style={{ gap: 12, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8 }]}>{formatDate(event.date)}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8 }]}>
                Start: {event.startTime}{event.endTime ? ` | End: ${event.endTime}` : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8, color: colors.textSecondary }]}>
                Meeting length: {event.durationMins >= 60 ? `${Math.round(event.durationMins / 60 * 10) / 10} hours` : `${event.durationMins} mins`}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 2. Venue & Location */}
          <Text style={[styles.cardLabel, { marginTop: spacing.md }]}>Venue & Location</Text>
          <Text style={styles.venueTitle}>{event.venue}</Text>
          {event.city && (
            <Text style={[styles.addressText, { fontWeight: '600', color: colors.primary, marginTop: 2 }]}>
              {event.city}
            </Text>
          )}
          {event.address && event.address !== event.venue && (
            <Text style={styles.addressText}>{event.address}</Text>
          )}

          {(event.lat && event.lng) ? (
            <TouchableOpacity style={{ height: 160, width: '100%', borderRadius: radius.md, overflow: 'hidden', marginVertical: spacing.md }} onPress={handleDirections} activeOpacity={0.8}>
              <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: event.lat,
                    longitude: event.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                />
                {/* Custom Marker */}
                <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -16, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="location" size={32} color={colors.error} />
                </View>
              </View>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Tap to open in External Maps</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.mapsButton, { marginVertical: spacing.md }]} onPress={handleDirections}>
              <Ionicons name="navigate-outline" size={18} color="#FFF" />
              <Text style={styles.mapsButtonText}>Get Directions (External Maps)</Text>
            </TouchableOpacity>
          )}

          {/* 3. Description (if any) */}
          {event.description && event.description.replace(/--- Travel Estimation ---[\s\S]*/, '').trim() ? (
            <>
              <View style={styles.divider} />
              <Text style={[styles.cardLabel, { marginTop: spacing.md }]}>Description</Text>
              <Text style={styles.bodyText}>
                {event.description.replace(/--- Travel Estimation ---[\s\S]*/, '').trim()}
              </Text>
            </>
          ) : null}
        </View>

        {/* Notes Card */}
        {event.notes ? (
          <View style={[styles.card, styles.notesCard]}>
            <Text style={[styles.cardLabel, { color: colors.warning }]}>Special Notes</Text>
            <Text style={styles.bodyText}>{event.notes}</Text>
          </View>
        ) : null}

        {/* Contact Details Card */}
        {event.contactName ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Contact Person</Text>
            <View style={styles.contactRow}>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{event.contactName}</Text>
                {event.contactPhone && <Text style={styles.contactPhone}>{event.contactPhone}</Text>}
              </View>
              {event.contactPhone && (
                <TouchableOpacity style={styles.callButton} onPress={() => handleCall(event.contactPhone!)}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}


        {/* Next Chronological Event Distance Planning Card */}
        {globalNextEvent && (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.push('EventDetail', { event: globalNextEvent, allEvents })}
            activeOpacity={0.7}
          >
            <Text style={styles.cardLabel}>Next Scheduled Event</Text>
            
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.venueTitle}>{globalNextEvent.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.timeVal, { marginLeft: 6, fontSize: 13, color: colors.textSecondary }]}>
                  {formatDate(globalNextEvent.date)} • {globalNextEvent.startTime}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.timeVal, { marginLeft: 6, fontSize: 13, color: colors.textSecondary }]}>
                  {globalNextEvent.city ? `${globalNextEvent.city} • ` : ''}{globalNextEvent.venue || globalNextEvent.address || 'Location TBD'}
                </Text>
              </View>
            </View>

            {nextEventTravel.loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 4 }}>
                      {event.city ? `${event.city} (${event.venue || 'Event'})` : event.venue || 'Current'} <Ionicons name="arrow-forward" size={10} /> {globalNextEvent.city ? `${globalNextEvent.city} (${globalNextEvent.venue || 'Event'})` : globalNextEvent.venue || 'Next'}
                    </Text>
                    <View style={[styles.travelBadge, { justifyContent: 'flex-start', paddingHorizontal: 12 }]}>
                      <Ionicons name="car" size={16} color={colors.primary} />
                      <Text style={[styles.travelBadgeText, { fontSize: 13, marginLeft: 8 }]}>
                        {nextEventTravel.currentToNextKm.toFixed(1)} km • {nextEventTravel.currentToNextMins >= 60 ? `${Math.floor(nextEventTravel.currentToNextMins / 60)}h ${nextEventTravel.currentToNextMins % 60}m` : `${nextEventTravel.currentToNextMins}m`} travel
                      </Text>
                    </View>
                  </View>
                
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 4 }}>
                      {homeLocation?.name || 'Home'} <Ionicons name="arrow-forward" size={10} /> {globalNextEvent.city ? `${globalNextEvent.city} (${globalNextEvent.venue || 'Event'})` : globalNextEvent.venue || 'Next'}
                    </Text>
                    <View style={[styles.travelBadge, { justifyContent: 'flex-start', paddingHorizontal: 12 }]}>
                      <Ionicons name="home" size={16} color={colors.primary} />
                      <Text style={[styles.travelBadgeText, { fontSize: 13, marginLeft: 8 }]}>
                        {nextEventTravel.homeToNextKm.toFixed(1)} km • {nextEventTravel.homeToNextMins >= 60 ? `${Math.floor(nextEventTravel.homeToNextMins / 60)}h ${nextEventTravel.homeToNextMins % 60}m` : `${nextEventTravel.homeToNextMins}m`} travel
                      </Text>
                    </View>
                  </View>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'center' }}>
          <TouchableOpacity 
            style={styles.editBadge}
            onPress={handleEdit}
            disabled={deleting}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={styles.editBadgeText}>Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBadge}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color={colors.error} />
                <Text style={styles.deleteBadgeText}>Delete Event</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  hero: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  heroSub: { color: '#aac4e8', fontSize: 13, fontWeight: '500' },
  scrollContent: { padding: 20, paddingTop: 10, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  mainTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timeVal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  travelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'uppercase'
  },
  travelText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginTop: 2
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs
  },
  venueTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  mapsButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    marginTop: spacing.sm
  },
  mapsButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8
  },
  travelBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}30`
  },
  travelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 4
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary
  },
  notesCard: {
    borderColor: colors.primaryMid,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contactDetails: {
    flex: 1
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  nextEventTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm
  },
  plannerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  plannerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  editBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}1A`, // 10% opacity primary
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBadgeText: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}1A`, // 10% opacity error
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBadgeText: {
    marginLeft: 6,
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  }
});

export default PastorEventDetail;
