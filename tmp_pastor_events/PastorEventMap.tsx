import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, typography, shadow } from '../../../theme/Theme';
import { PastorEvent } from '../../../types/event';
import EventTypeBadge from '../../../components/EventTypeBadge';

// Try to safely load react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Callout: any = null;
let isMapsAvailable = false;

// Force disabled on Android due to Fabric (New Architecture) crashes with MapMarker.addView
isMapsAvailable = false;

// Try to safely load react-native-svg
let Svg: any = null;
let SvgPolyline: any = null;
try {
  const RNSvg = require('react-native-svg');
  Svg = RNSvg.default || RNSvg.Svg;
  SvgPolyline = RNSvg.Polyline;
} catch (e) {
  // Svg not available
}

const MockMapView = React.forwardRef(({
  sortedEvents,
  groupedEventsList,
  selectedEventId,
  onMarkerPress,
  style
}: any, ref) => {
  const [layout, setLayout] = useState({ width: 300, height: 400 });

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coords: any, options: any) => {
      console.log('MockMapView: fitToCoordinates', coords);
    },
    animateToRegion: (region: any, duration: any) => {
      console.log('MockMapView: animateToRegion', region);
    }
  }));

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) {
      setLayout({ width, height });
    }
  };

  const lats = sortedEvents.map((e: any) => e.lat);
  const lngs = sortedEvents.map((e: any) => e.lng);
  
  const minLat = lats.length > 0 ? Math.min(...lats) : 16.30;
  const maxLat = lats.length > 0 ? Math.max(...lats) : 16.31;
  const minLng = lngs.length > 0 ? Math.min(...lngs) : 80.43;
  const maxLng = lngs.length > 0 ? Math.max(...lngs) : 80.44;

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const getPosition = (lat: number, lng: number) => {
    const x = ((lng - minLng) / lngRange) * (layout.width * 0.7) + (layout.width * 0.15);
    const y = (1 - (lat - minLat) / latRange) * (layout.height * 0.5) + (layout.height * 0.15);
    return { x, y };
  };

  // Generate path points
  const points = sortedEvents.map((evt: any) => {
    const { x, y } = getPosition(evt.lat, evt.lng);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={[style, styles.mockMapContainer]} onLayout={onLayout}>
      {/* Grid Lines for Aesthetic Map Feel */}
      <View style={styles.gridLinesContainer}>
        {[1, 2, 3, 4].map(i => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 20}%` }]} />
        ))}
        {[1, 2, 3, 4].map(i => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 20}%` }]} />
        ))}
      </View>

      {/* Warning Alert Banner */}
      <View style={styles.mapAlertBanner}>
        <Ionicons name="map-outline" size={14} color={colors.warning} />
        <Text style={styles.mapAlertText}>
          Schematic Route Map (Native Map Module Unavailable)
        </Text>
      </View>

      {/* SVG Polyline Route */}
      {Svg && SvgPolyline && sortedEvents.length > 1 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={layout.width} height={layout.height}>
            <SvgPolyline
              points={points}
              fill="none"
              stroke={colors.primary}
              strokeWidth="4"
              strokeDasharray="5,5"
            />
          </Svg>
        </View>
      )}

      {/* Custom Schematic Markers */}
      {groupedEventsList.map((group: any) => {
        const firstEvt = group[0].event;
        const { x, y } = getPosition(firstEvt.lat, firstEvt.lng);
        const isGroupSelected = group.some((e: any) => e.event.id === selectedEventId);

        return (
          <View
            key={`group_${firstEvt.id}`}
            style={{
              position: 'absolute',
              left: x - 18,
              top: y - 18,
              flexDirection: 'row',
              gap: 6,
              elevation: isGroupSelected ? 8 : 3,
              zIndex: isGroupSelected ? 10 : 1
            }}
          >
            {group.map((item: any) => {
              const evt = item.event;
              const idx = item.originalIndex;
              const color = markerColors[evt.type as keyof typeof markerColors] || markerColors.worship;
              const isSelected = selectedEventId === evt.id;

              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[
                    styles.numberedMarker,
                    {
                      backgroundColor: color,
                      borderColor: isSelected ? '#FFFFFF' : color,
                      borderWidth: isSelected ? 3 : 1,
                      transform: [{ scale: isSelected ? 1.25 : 1 }],
                      shadowColor: isSelected ? '#000' : 'transparent',
                    }
                  ]}
                  onPress={() => onMarkerPress(evt, idx)}
                >
                  <Text style={styles.numberedMarkerText}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      {/* Directions Indicator */}
      <View style={styles.compassContainer}>
        <Ionicons name="compass-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.compassText}>N</Text>
      </View>
    </View>
  );
});

const { width } = Dimensions.get('window');

const markerColors = {
  worship:  '#185FA5', // blue
  prayer:   '#1D9E75', // green
  meeting:  '#BA7517', // warning / orange
  outreach: '#C2185B', // deep pink
  funeral:  '#444441'  // charcoal
};

export const PastorEventMap = ({ route, navigation }: { route: any; navigation: any }) => {
  const { events = [] } = route.params as { events: PastorEvent[] };
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

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

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

  // Group events by location to show them side-by-side
  const groupedEventsList = React.useMemo(() => {
    const groups: { [key: string]: { event: PastorEvent, originalIndex: number }[] } = {};
    sortedEvents.forEach((evt, idx) => {
      const key = `${evt.lat.toFixed(4)}_${evt.lng.toFixed(4)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ event: evt, originalIndex: idx });
    });
    return Object.values(groups);
  }, [sortedEvents]);

  // Determine initial region
  const defaultRegion = {
    latitude: 16.3067,
    longitude: 80.4365,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  };

  const initialRegion = sortedEvents.length > 0
    ? {
        latitude: sortedEvents[0].lat,
        longitude: sortedEvents[0].lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      }
    : defaultRegion;

  useEffect(() => {
    if (sortedEvents.length > 0 && mapRef.current) {
      // Fit map to include all marker coordinates
      const coordinates = sortedEvents.map(e => ({
        latitude: e.lat,
        longitude: e.lng
      }));
      
      // Add a slight delay for component mounting
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
          animated: true
        });
      }, 500);
    }
  }, [events]);

  const selectEvent = (item: PastorEvent, index: number) => {
    setSelectedEventId(item.id);
    
    // Center map on the selected event coordinates
    mapRef.current?.animateToRegion({
      latitude: item.lat,
      longitude: item.lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012
    }, 400);

    // Scroll list to the active card
    flatListRef.current?.scrollToIndex({
      index: index,
      animated: true,
      viewPosition: 0.5
    });
  };

  const handleMarkerPress = (item: PastorEvent) => {
    const idx = sortedEvents.findIndex(e => e.id === item.id);
    if (idx !== -1) {
      selectEvent(item, idx);
    }
  };

  const renderBottomCard = ({ item, index }: { item: PastorEvent; index: number }) => {
    const isSelected = selectedEventId === item.id;
    return (
      <TouchableOpacity
        style={[styles.bottomCard, isSelected && styles.bottomCardSelected]}
        activeOpacity={0.9}
        onPress={() => selectEvent(item, index)}
      >
        <View style={styles.cardHeader}>
          <EventTypeBadge type={item.type} />
          <Text style={styles.cardTime}>{item.startTime}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardVenueRow}>
          <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardVenue} numberOfLines={1}>{item.venue}</Text>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('EventDetail', { event: item, allEvents: sortedEvents })}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={12} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Convert points for polyline
  const routePoints = sortedEvents.map(e => ({
    latitude: e.lat,
    longitude: e.lng
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgPrimary} />
      
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Interactive Map Route</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Map */}
      {isMapsAvailable ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Route Polyline connecting events in sequence */}
          {routePoints.length > 1 && (
            <Polyline
              coordinates={routePoints}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          )}

          {/* Custom Marker Pins */}
          {groupedEventsList.map((group) => {
            const firstEvt = group[0].event;
            const isGroupSelected = group.some(e => e.event.id === selectedEventId);
            const titles = group.map(e => e.event.title).join(' & ');
            const times = group.map(e => `${e.event.startTime} (Stop #${e.originalIndex + 1})`).join('\n');

            return (
              <Marker
                key={`group_${firstEvt.id}`}
                coordinate={{ latitude: firstEvt.lat, longitude: firstEvt.lng }}
                onPress={() => handleMarkerPress(firstEvt)}
                tracksViewChanges={false}
                zIndex={isGroupSelected ? 10 : 1}
              >
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  {group.map((item) => {
                    const evt = item.event;
                    const idx = item.originalIndex;
                    const color = markerColors[evt.type as keyof typeof markerColors] || markerColors.worship;
                    const isSelected = selectedEventId === evt.id;

                    return (
                      <View style={[
                        styles.numberedMarker,
                        {
                          backgroundColor: color,
                          borderColor: isSelected ? '#FFFFFF' : color,
                          borderWidth: isSelected ? 3 : 1,
                          transform: [{ scale: isSelected ? 1.25 : 1 }],
                          shadowColor: isSelected ? '#000' : 'transparent',
                        }
                      ]} key={evt.id}>
                        <Text style={styles.numberedMarkerText}>{idx + 1}</Text>
                      </View>
                    );
                  })}
                </View>
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{titles}</Text>
                    <Text style={styles.calloutTime}>{times}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <MockMapView
          ref={mapRef}
          style={styles.map}
          sortedEvents={sortedEvents}
          groupedEventsList={groupedEventsList}
          selectedEventId={selectedEventId}
          onMarkerPress={selectEvent}
        />
      )}

      {/* Bottom Swipeable List */}
      <View style={styles.bottomListWrapper}>
        <FlatList
          ref={flatListRef}
          data={sortedEvents}
          renderItem={renderBottomCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.75 + 16}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.bottomListContent}
          getItemLayout={(data, index) => (
            { length: width * 0.75 + 16, offset: (width * 0.75 + 16) * index, index }
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10
  },
  backButton: {
    padding: spacing.xs
  },
  navTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center'
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  calloutContainer: {
    backgroundColor: '#FFF',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    width: 200,
    ...shadow.card
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  calloutTime: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  bottomListWrapper: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    backgroundColor: 'transparent'
  },
  bottomListContent: {
    paddingHorizontal: spacing.lg,
    gap: 16
  },
  bottomCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    width: width * 0.75,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card
  },
  bottomCardSelected: {
    borderColor: colors.primaryMid,
    borderWidth: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4
  },
  cardVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm
  },
  cardVenue: {
    fontSize: 11,
    color: colors.textSecondary
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  mockMapContainer: {
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden'
  },
  gridLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#0F172A'
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#0F172A'
  },
  mapAlertBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warningLight,
    borderColor: '#F3D299',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
    ...shadow.card
  },
  mapAlertText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
    flex: 1
  },
  numberedMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  numberedMarkerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  compassContainer: {
    position: 'absolute',
    top: spacing.md + 40,
    right: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radius.full,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10
  },
  compassText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: -2
  }
});

export default PastorEventMap;
