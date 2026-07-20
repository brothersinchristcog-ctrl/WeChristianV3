import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  TextInput
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius, typography, shadow } from '../../../theme/Theme';
import { PastorEvent } from '../../../types/event';
import FirestoreService from '../../../services/FirestoreService';
import EventTypeBadge from '../../../components/EventTypeBadge';
import DistanceBadge from '../../../components/DistanceBadge';
import { getStartingLocation, saveStartingLocation, formatDuration } from '../../../utils/locationStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { openInMaps } from '../../../utils/maps';
import LiveJourneyTracker from '../../../components/LiveJourneyTracker';

export const PastorEventDashboard = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const [events, setEvents] = useState<PastorEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());
  const [enrichedEvents, setEnrichedEvents] = useState<PastorEvent[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const sfEvents = await FirestoreService.getPastorEvents();
      if (sfEvents && sfEvents.length > 0) {
        // Categorize into today, upcoming, past
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const categorized = sfEvents.map(evt => {
          let section: 'today' | 'upcoming' | 'past' = 'upcoming';
          if (evt.date === todayStr) {
            section = 'today';
          } else if (evt.date < todayStr) {
            section = 'past';
          }
          return { ...evt, section };
        });
        setEvents(categorized);
      } else {
        setEvents([]);
      }
    } catch (e) {
      console.warn('Error querying events:', e);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchEvents();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  // Helper to convert "9:00 AM" or "1:00 PM" into a sortable minutes-since-midnight integer
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

  const filteredEvents = (selectedDateFilter
    ? events.filter(evt => evt.date === selectedDateFilter)
    : events.filter(evt => evt.section === activeTab)
  ).sort((a, b) => {
    if (a.date !== b.date) {
      return activeTab === 'past'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    }
    return activeTab === 'past'
      ? timeToMins(b.startTime) - timeToMins(a.startTime)
      : timeToMins(a.startTime) - timeToMins(b.startTime);
  });

  const [dynamicStats, setDynamicStats] = useState({ km: 0, mins: 0, loading: false });
  const [currentLocName, setCurrentLocName] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        const saved = await getStartingLocation();
        if (saved && saved.name) {
          if (isMounted) setCurrentLocName(saved.name);
        } else {
          const ipResp = await fetch('http://ip-api.com/json/');
          const ipData = await ipResp.json();
          if (ipData && ipData.city) {
            if (isMounted) setCurrentLocName(ipData.city);
          }
        }
      } catch (e) {}
    };
    initLocation();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isActive = true;

    const calcStats = async () => {
      setDynamicStats({ km: 0, mins: 0, loading: true });
      
      let prevLat = 16.3067; // Fallback
      let prevLng = 80.4365;

      try {
        const saved = await getStartingLocation();
        if (saved && saved.lat && saved.lng && saved.name) {
          prevLat = saved.lat;
          prevLng = saved.lng;
        } else {
          const ipResp = await fetch('http://ip-api.com/json/');
          const ipData = await ipResp.json();
          if (ipData && ipData.lat && ipData.lon) {
            prevLat = ipData.lat;
            prevLng = ipData.lon;
          }
        }
      } catch (e) {
        // Fallback to Guntur if location fails
      }

      const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
      if (!GOOGLE_KEY || filteredEvents.length === 0) {
        if (isActive) {
          setDynamicStats({ km: 0, mins: 0, loading: false });
          setEnrichedEvents(filteredEvents);
        }
        return;
      }
      
      try {
        let totalKm = 0;
        let totalMins = 0;


        let currentOriginLat = prevLat;
        let currentOriginLng = prevLng;
        let currentOriginName = currentLocName || 'Home';
        
        const homeLat = prevLat;
        const homeLng = prevLng;
        const homeName = currentOriginName;
        
        let isFirstValidEvent = true;
        let currentDayStr = '';

        const newEnrichedEvents = [...filteredEvents];
        for (let i = 0; i < newEnrichedEvents.length; i++) {
          const evt = newEnrichedEvents[i];
          if (evt.lat && evt.lng) {
            if (evt.date !== currentDayStr) {
              currentDayStr = evt.date;
              isFirstValidEvent = true;
              currentOriginLat = homeLat;
              currentOriginLng = homeLng;
              currentOriginName = homeName;
            }
            
            // Calculate distance from last valid location to current event
            const originStr = `${currentOriginLat},${currentOriginLng}`;
            const destStr = `${evt.lat},${evt.lng}`;
            
            const fetchDist = async (orig: string, dest: string) => {
              const cacheKey = `dist_${orig}_${dest}`;
              try {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
              } catch (e) {}
              
              try {
                const distResp = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${orig}&destinations=${dest}&key=${GOOGLE_KEY}`);
                const distData = await distResp.json();
                if (distData.status === 'OK' && distData.rows[0].elements[0].status === 'OK') {
                  const el = distData.rows[0].elements[0];
                  const res = { distance: el.distance.value, duration: el.duration.value };
                  AsyncStorage.setItem(cacheKey, JSON.stringify(res)).catch(()=>{});
                  return res;
                }
              } catch (e) {}
              return { distance: 0, duration: 0 };
            };
            
            const routeResult = await fetchDist(originStr, destStr);
            let distanceValue = routeResult.distance;
            let durationValue = routeResult.duration;
            
            let homeDistanceValue = 0;
            let homeDurationValue = 0;
            
            if (!isFirstValidEvent) {
              const homeOriginStr = `${homeLat},${homeLng}`;
              const homeRouteResult = await fetchDist(homeOriginStr, destStr);
              homeDistanceValue = homeRouteResult.distance;
              homeDurationValue = homeRouteResult.duration;
            }

            if (distanceValue > 0) {
              const travelData: any = {
                ...evt.travel,
                distKm: distanceValue / 1000,
                car: Math.round(durationValue / 60),
                isHomeToEvent: isFirstValidEvent,
                originLat: currentOriginLat,
                originLng: currentOriginLng,
                originName: currentOriginName
              };
              
              if (!isFirstValidEvent && homeDistanceValue > 0) {
                travelData.homeDistKm = homeDistanceValue / 1000;
                travelData.homeCar = Math.round(homeDurationValue / 60);
                travelData.homeLat = homeLat;
                travelData.homeLng = homeLng;
                travelData.homeName = homeName;
              }
              
              newEnrichedEvents[i] = {
                ...evt,
                travel: travelData
              };
              isFirstValidEvent = false;
              currentOriginLat = evt.lat;
              currentOriginLng = evt.lng;
              currentOriginName = evt.city || evt.venue || evt.title || 'Previous Location';
            }
            
            totalKm += distanceValue / 1000;
            totalMins += Math.round(durationValue / 60);
          }
        }
        
        if (isActive) {
          setEnrichedEvents(newEnrichedEvents);
          setDynamicStats({ km: totalKm, mins: totalMins, loading: false });
        }
      } catch(e) {
        console.warn('Dashboard stats calc failed', e);
        if (isActive) {
          setDynamicStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    calcStats();
    
    return () => { isActive = false; };
  }, [activeTab, selectedDateFilter, events]);

  const handleAddressSubmit = async (newAddress: string) => {
    if (!newAddress.trim()) return;
    const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
    if (!GOOGLE_KEY) return;
    
    setIsGeocoding(true);
    try {
      const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(newAddress)}&key=${GOOGLE_KEY}`);
      const geoData = await geoResp.json();
      if (geoData.status === 'OK' && geoData.results.length > 0) {
        const { lat, lng } = geoData.results[0].geometry.location;
        await saveStartingLocation({ name: newAddress, lat, lng });
        
        // Force refresh by triggering calcStats via a dummy state change if needed, 
        // or just let currentLocName trigger it if we added it to deps. But wait, we didn't. 
        // Let's just fetchEvents() or we can just update the events state implicitly.
        fetchEvents();
      }
    } catch (e) {
      console.log('Geocoding failed');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Statistics summaries
  const totalEvents = filteredEvents.length;
  const totalDistance = dynamicStats.km;
  const totalTravelTimeCar = dynamicStats.mins;

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[dateObj.getDay()]} ${d}-${m}-${y}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const renderEventCard = ({ item, index }: { item: PastorEvent, index: number }) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        key={item.id}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('EventDetail', { event: item, allEvents: events })}
      >
        <Text style={[styles.titleText, { marginBottom: 12 }]}>{item.title}</Text>
        
        <View style={{ gap: 6, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.timeText, { marginLeft: 6 }]}>{formatEventDate(item.date)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[styles.timeText, { marginLeft: 6 }]}>
              Start: {item.startTime}{item.endTime ? ` | End: ${item.endTime}` : ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="hourglass-outline" size={14} color={colors.primary} />
            <Text style={[styles.timeText, { marginLeft: 6, color: colors.textSecondary }]}>
              Meeting length: {item.durationMins >= 60 ? `${Math.round(item.durationMins / 60 * 10) / 10} hours` : `${item.durationMins} mins`}
            </Text>
          </View>
        </View>

        {/* Venue & Location Section */}
        <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryDark, textTransform: 'uppercase', marginBottom: 4 }}>Venue & Location</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 }}>{item.venue || 'No venue provided'}</Text>
          {item.city && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 2 }}>{item.city}</Text>
          )}
          {item.address && item.address !== item.venue && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>{item.address}</Text>
          )}
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, alignSelf: 'flex-start', marginTop: 4, marginBottom: 12 }}
            onPress={() => openInMaps(item.lat || 0, item.lng || 0, item.title, [item.venue, item.address, item.city].filter(Boolean).join(', '))}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary, marginLeft: 6 }}>Get Directions</Text>
          </TouchableOpacity>
          
          {/* Travel Distance Info - Live Tracker */}
          {item.travel && item.travel.distKm > 0 && item.lat && item.lng && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryDark, textTransform: 'uppercase', marginBottom: 8 }}>Live Journey Tracker</Text>
              <LiveJourneyTracker
                home={{ 
                  lat: item.travel.originLat || 15.8281, 
                  lng: item.travel.originLng || 78.0373, 
                  name: item.travel.originName || (item.travel.isHomeToEvent ? 'Home' : 'Previous Location') 
                }}
                destination={{ lat: item.lat, lng: item.lng }}
                destinationName={item.city || (item.address || item.venue || 'Event').split(',')[0].trim()}
                initialDistanceKm={item.travel.distKm}
                initialDurationMins={item.travel.car}
                isDisabled={item.section !== 'today'}
                altHome={(!item.travel.isHomeToEvent && item.travel.homeLat && item.travel.homeLng) ? {
                  lat: item.travel.homeLat,
                  lng: item.travel.homeLng,
                  name: item.travel.homeName || 'Home'
                } : undefined}
                altInitialDistanceKm={item.travel.homeDistKm}
                altInitialDurationMins={item.travel.homeCar || 0}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgSecondary} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>Pastor's Itinerary</Text>
          <Text style={styles.subtitleText}>Manage schedule & travel routing</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionIconButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.primary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionIconButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.primary, marginLeft: spacing.sm }]}
            onPress={() => navigation.navigate('AIAssistant')}
          >
            <MaterialCommunityIcons name="robot-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionIconButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.primary, marginLeft: spacing.sm }]}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={tempPickerDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setTempPickerDate(selectedDate);
              const y = selectedDate.getFullYear();
              const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const d = String(selectedDate.getDate()).padStart(2, '0');
              setSelectedDateFilter(`${y}-${m}-${d}`);
            }
          }}
        />
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['today', 'upcoming', 'past'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab, 
              activeTab === tab && !selectedDateFilter && styles.activeTab,
              selectedDateFilter && styles.disabledTab
            ]}
            onPress={() => {
              setSelectedDateFilter(null);
              setActiveTab(tab);
            }}
            disabled={loading}
          >
            <Text style={[styles.tabText, activeTab === tab && !selectedDateFilter && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Filter Indicator Banner */}
      {selectedDateFilter && (
        <View style={styles.filterBanner}>
          <View style={styles.filterBannerLeft}>
            <Ionicons name="funnel-outline" size={14} color={colors.primary} />
            <Text style={styles.filterBannerText}>
              Filtered: {new Date(selectedDateFilter).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.clearFilterButton} 
            onPress={() => setSelectedDateFilter(null)}
          >
            <Text style={styles.clearFilterText}>Show All</Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Starting Location Bar */}
      <View style={{ backgroundColor: '#fff', padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, elevation: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
          STARTING FROM
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1, backgroundColor: colors.bgSecondary, padding: 8, borderRadius: radius.sm, fontSize: 14, color: colors.textPrimary }}
            value={currentLocName}
            onChangeText={setCurrentLocName}
            onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text)}
            placeholder="Type starting address..."
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity 
            style={{ marginLeft: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.sm }}
            onPress={() => handleAddressSubmit(currentLocName)}
            disabled={isGeocoding}
          >
            {isGeocoding ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>
          {isGeocoding ? 'Calculating new distances...' : 'Type address and press Update'}
        </Text>
      </View>

      {/* Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalEvents}</Text>
          <Text style={styles.statLbl}>Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{Math.round(totalDistance)} km</Text>
          <Text style={styles.statLbl}>Travel Dist</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{formatDuration(totalTravelTimeCar)}</Text>
          <Text style={styles.statLbl}>Travel Time</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : enrichedEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No events found for {activeTab}</Text>
        </View>
      ) : (
        <View style={{ padding: spacing.lg, paddingBottom: 40 }}>
          {enrichedEvents.map((item, index) => renderEventCard({ item, index }))}
        </View>
      )}
      </ScrollView>

      {/* Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.success }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RoutePlanner', { events: filteredEvents })}
        >
          <Ionicons name="trail-sign" size={24} color="#FFF" />
          <Text style={styles.floatingButtonText}>Route Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EventMap', { events: filteredEvents })}
        >
          <Ionicons name="map" size={24} color="#FFF" />
          <Text style={styles.floatingButtonText}>Map View</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm
  },
  welcomeText: {
    ...typography.h1,
    color: colors.primaryDark
  },
  subtitleText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 2,
    marginVertical: spacing.sm
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  activeTab: {
    backgroundColor: colors.bgPrimary,
    ...shadow.card
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600'
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.bgPrimary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadow.card
  },
  statBox: {
    alignItems: 'center',
    flex: 1
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  statLbl: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100
  },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  titleText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  venueText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm
  },
  addressText: {
    fontSize: 12,
    color: colors.textTertiary
  },
  travelContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  travelLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 12
  },
  floatingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 12,
    gap: 8,
    ...shadow.card
  },
  floatingButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionIconButton: {
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38
  },
  disabledTab: {
    opacity: 0.6
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginVertical: spacing.xs,
    ...shadow.card
  },
  filterBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  filterBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  }
});

export default PastorEventDashboard;
