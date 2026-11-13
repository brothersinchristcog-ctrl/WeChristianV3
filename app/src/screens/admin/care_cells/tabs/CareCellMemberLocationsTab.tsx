import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import {
  Search,
  RefreshCw,
  MapPin,
  Compass,
  Route,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Calendar,
  ArrowUp,
  ArrowDown,
  Trash2,
  Car,
  Footprints,
  Sparkles,
  Check,
  X,
} from 'lucide-react-native';
import {
  CareCell,
  LocationAccuracy,
  MemberLocationRecord,
  MemberVisitBadgeStatus,
  NearbyMemberMatch,
  VisitRoutePoint,
} from '../../../../types/CareCellTypes';
import {
  MapMarkerGroup,
  MemberLocationService,
  TravelMode,
  formatMemberAreaText,
  getEffectiveCoordinates,
  getMemberVisitBadgeStatus,
  getVisitBadgeColor,
} from '../../../../services/MemberLocationService';
import LocationService from '../../../../services/LocationService';
import { useAuth } from '../../../../context/AuthContext';
import { useChurch } from '../../../../context/ChurchContext';
import { useAdminTheme, createAdminThemedStyles, formatCareCellLabel } from '../careCellTheme';
import MemberLocationDetailSheet from '../components/MemberLocationDetailSheet';
import CareCellVisitModal, { PreselectedVisitMember } from '../components/CareCellVisitModal';

interface CareCellMemberLocationsTabProps {
  cells: CareCell[];
  churchId?: string;
}

type PanelMode = 'map' | 'nearby' | 'plan' | 'unverified';
type AccuracyFilter = 'ALL' | LocationAccuracy;
type VisitStatusFilter = 'ALL' | MemberVisitBadgeStatus;

const DEFAULT_MAP_REGION: Region = {
  latitude: 15.8281,
  longitude: 78.0373,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

const RADIUS_OPTIONS = [1, 2, 5, 10] as const;

export default function CareCellMemberLocationsTab({
  cells,
  churchId: propChurchId,
}: CareCellMemberLocationsTabProps) {
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const churchId = propChurchId || activeChurch?.id || (member as any)?.churchId || (member as any)?.primaryChurchId || '';

  const mapRef = useRef<MapView | null>(null);
  const autoSyncedRef = useRef(false);

  const [records, setRecords] = useState<MemberLocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [careCellFilter, setCareCellFilter] = useState<string>('ALL');
  const [accuracyFilter, setAccuracyFilter] = useState<AccuracyFilter>('ALL');
  const [visitStatusFilter, setVisitStatusFilter] = useState<VisitStatusFilter>('ALL');
  const [panelMode, setPanelMode] = useState<PanelMode>('map');

  // Map region & selection
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [selectedGroup, setSelectedGroup] = useState<MapMarkerGroup | null>(null);
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);

  // Nearby search state
  const [nearbyAnchor, setNearbyAnchor] = useState<MemberLocationRecord | null>(null);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(5);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyMatches, setNearbyMatches] = useState<NearbyMemberMatch[]>([]);

  // Multi-stop Visit Plan Builder state
  const [plannedStops, setPlannedStops] = useState<VisitRoutePoint[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');

  // Schedule Visit Modal integration
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitModalMembers, setVisitModalMembers] = useState<PreselectedVisitMember[]>([]);
  const [visitModalMemberIds, setVisitModalMemberIds] = useState<string[]>([]);
  const [visitModalCellId, setVisitModalCellId] = useState<string | undefined>(undefined);
  const [visitModalStops, setVisitModalStops] = useState<VisitRoutePoint[] | undefined>(undefined);

  // Subscribe to church memberLocations
  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = MemberLocationService.subscribeMemberLocations(
      churchId,
      (list) => {
        setRecords(list);
        setLoading(false);

        if (list.length === 0 && !autoSyncedRef.current) {
          autoSyncedRef.current = true;
          handleSyncLocations(true);
        }
      },
      (err) => {
        console.warn('Member locations listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [churchId]);

  const handleSyncLocations = useCallback(
    async (silent = false) => {
      if (!churchId || syncing) return;
      setSyncing(true);
      try {
        const res = await MemberLocationService.syncChurchMemberLocations(churchId, false);
        if (!silent) {
          const msg = res.geocodingKeyConfigured
            ? `Synced ${res.syncedCount} profiles (${res.geocodedFromApi} geocoded via Google Maps, ${res.reusedCache} cached).`
            : `Synced ${res.syncedCount} member profiles. Configure GOOGLE_MAPS_GEOCODING_KEY secret to geocode pending locations.`;
          Alert.alert('Location Sync Complete', msg);
        }
      } catch (err: any) {
        if (!silent) {
          Alert.alert(
            'Sync Notice',
            err?.message || 'Could not reach Cloud Functions right now. Showing loaded locations.'
          );
        }
      } finally {
        setSyncing(false);
      }
    },
    [churchId, syncing]
  );

  // Center map once records with coords load
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (hasCenteredRef.current || records.length === 0) return;
    const coordsList = records
      .map((r) => getEffectiveCoordinates(r))
      .filter(Boolean) as Array<{ latitude: number; longitude: number }>;

    if (coordsList.length > 0) {
      const avgLat = coordsList.reduce((s, c) => s + c.latitude, 0) / coordsList.length;
      const avgLng = coordsList.reduce((s, c) => s + c.longitude, 0) / coordsList.length;
      const initial: Region = {
        latitude: avgLat,
        longitude: avgLng,
        latitudeDelta: coordsList.length === 1 ? 0.05 : 0.45,
        longitudeDelta: coordsList.length === 1 ? 0.05 : 0.45,
      };
      hasCenteredRef.current = true;
      setMapRegion(initial);
      mapRef.current?.animateToRegion(initial, 450);
    } else {
      const c = LocationService.getChurchCoordinates(activeChurch);
      if (c && !hasCenteredRef.current) {
        hasCenteredRef.current = true;
        setMapRegion({
          latitude: c.latitude,
          longitude: c.longitude,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        });
      }
    }
  }, [records, activeChurch]);

  // Apply search + filters
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (careCellFilter !== 'ALL' && r.careCellId !== careCellFilter) {
        return false;
      }
      if (accuracyFilter !== 'ALL' && r.locationAccuracy !== accuracyFilter) {
        return false;
      }
      if (visitStatusFilter !== 'ALL' && getMemberVisitBadgeStatus(r) !== visitStatusFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          r.memberName,
          r.village,
          r.city,
          r.district,
          r.state,
          r.careCellName,
          r.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, careCellFilter, accuracyFilter, visitStatusFilter]);

  const unverifiedRecords = useMemo(
    () => filteredRecords.filter((r) => !getEffectiveCoordinates(r)),
    [filteredRecords]
  );

  const verifiedHomeRecords = useMemo(
    () =>
      filteredRecords.filter(
        (r) => r.locationAccuracy === 'verified_home' && r.locationSharingConsent
      ),
    [filteredRecords]
  );

  const markerGroups = useMemo(
    () => MemberLocationService.groupLocationsForMap(filteredRecords, mapRegion.latitudeDelta),
    [filteredRecords, mapRegion.latitudeDelta]
  );

  // Trigger Nearby Search when anchor or radius changes
  const runNearbySearch = useCallback(
    async (anchor: MemberLocationRecord, radiusKm: number) => {
      const coords = getEffectiveCoordinates(anchor);
      if (!coords) {
        Alert.alert(
          'Location Not Verified',
          `${anchor.memberName} does not have resolved coordinates yet for nearby matching.`
        );
        return;
      }

      setNearbyAnchor(anchor);
      setNearbyRadiusKm(radiusKm);
      setPanelMode('nearby');
      setNearbyLoading(true);

      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: Math.max(0.02, radiusKm * 0.025),
          longitudeDelta: Math.max(0.02, radiusKm * 0.025),
        },
        400
      );

      try {
        const matches = await MemberLocationService.findNearbyMembers({
          churchId,
          centerLatitude: coords.latitude,
          centerLongitude: coords.longitude,
          radiusKm,
          excludeMemberId: anchor.memberId,
          localFallbackRecords: records,
        });
        setNearbyMatches(matches);
      } catch (err) {
        console.warn('Nearby search error:', err);
        setNearbyMatches([]);
      } finally {
        setNearbyLoading(false);
      }
    },
    [churchId, records]
  );

  const addMembersToVisitPlan = useCallback((membersToAdd: MemberLocationRecord[]) => {
    const validToAdd = membersToAdd.filter((m) => Boolean(getEffectiveCoordinates(m)));
    if (validToAdd.length === 0) {
      Alert.alert(
        'No Coordinates',
        'Selected members do not have verified or village coordinates for route planning yet.'
      );
      return;
    }

    setPlannedStops((prev) => {
      const existingIds = new Set(prev.map((p) => p.memberId));
      const newPoints: VisitRoutePoint[] = [];
      let nextOrder = prev.length + 1;

      for (const m of validToAdd) {
        if (existingIds.has(m.memberId)) continue;
        const c = getEffectiveCoordinates(m)!;
        const isConsent = c.accuracy === 'verified_home';
        newPoints.push({
          memberId: m.memberId,
          memberName: m.memberName,
          memberPhone: m.phone,
          address: isConsent
            ? m.completeAddress || formatMemberAreaText(m)
            : formatMemberAreaText(m),
          locality: m.village || m.city || m.district,
          latitude: c.latitude,
          longitude: c.longitude,
          order: nextOrder++,
          accuracy: c.accuracy,
          isApproximateDistance: !isConsent,
          consent: isConsent,
        });
      }
      return [...prev, ...newPoints];
    });
    setPanelMode('plan');
  }, []);

  const optimizeVisitPlan = async () => {
    if (plannedStops.length < 2) return;
    let startPoint: { latitude: number; longitude: number } | undefined;
    try {
      const perm = await ExpoLocation.getForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await ExpoLocation.getLastKnownPositionAsync();
        if (pos?.coords) {
          startPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      }
    } catch (_) {}

    const plannedRecordObjects = plannedStops
      .map((s) => records.find((r) => r.memberId === s.memberId))
      .filter(Boolean) as MemberLocationRecord[];
    const optimized = MemberLocationService.suggestOptimalVisitOrder(
      plannedRecordObjects,
      startPoint
    );
    setPlannedStops(optimized);
  };

  const movePlanStop = (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= plannedStops.length) return;
    setPlannedStops((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const openScheduleModalForMembers = (
    targetMembers: MemberLocationRecord[],
    stops?: VisitRoutePoint[]
  ) => {
    if (targetMembers.length === 0) return;
    const preselected: PreselectedVisitMember[] = targetMembers.map((m) => ({
      memberId: m.memberId,
      memberName: m.memberName,
      memberPhone: m.phone,
      memberPhoto: m.profileImage,
    }));

    const uniqueCells = new Set(targetMembers.map((m) => m.careCellId).filter(Boolean));
    const singleCellId = uniqueCells.size === 1 ? Array.from(uniqueCells)[0] : 'DIRECT';

    setVisitModalMembers(preselected);
    setVisitModalMemberIds(targetMembers.map((m) => m.memberId));
    setVisitModalCellId(singleCellId);
    setVisitModalStops(stops);
    setVisitModalVisible(true);
  };

  const anchorCoords = nearbyAnchor ? getEffectiveCoordinates(nearbyAnchor) : null;

  return (
    <View style={styles.container}>
      {/* Top Toolbar: Search + Sync */}
      <View style={styles.topControls}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, village, city or district..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.syncBtn, syncing && { opacity: 0.65 }]}
            onPress={() => handleSyncLocations(false)}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={15} color="#FFFFFF" />
            )}
            <Text style={styles.syncBtnTxt}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-Mode Pills: Map | Nearby | Plan | Unverified */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, panelMode === 'map' && styles.modeTabActive]}
            onPress={() => setPanelMode('map')}
          >
            <MapPin size={13} color={panelMode === 'map' ? '#FFFFFF' : '#334155'} />
            <Text style={[styles.modeTabTxt, panelMode === 'map' && styles.modeTabTxtActive]}>
              Map ({filteredRecords.length - unverifiedRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, panelMode === 'nearby' && styles.modeTabActive]}
            onPress={() => {
              if (!nearbyAnchor) {
                const firstValid = filteredRecords.find((r) => Boolean(getEffectiveCoordinates(r)));
                if (firstValid) runNearbySearch(firstValid, nearbyRadiusKm);
                else setPanelMode('nearby');
              } else {
                setPanelMode('nearby');
              }
            }}
          >
            <Compass size={13} color={panelMode === 'nearby' ? '#FFFFFF' : '#334155'} />
            <Text style={[styles.modeTabTxt, panelMode === 'nearby' && styles.modeTabTxtActive]}>
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, panelMode === 'plan' && styles.modeTabActive]}
            onPress={() => setPanelMode('plan')}
          >
            <Route size={13} color={panelMode === 'plan' ? '#FFFFFF' : '#334155'} />
            <Text style={[styles.modeTabTxt, panelMode === 'plan' && styles.modeTabTxtActive]}>
              Visit Plan ({plannedStops.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, panelMode === 'unverified' && styles.modeTabActive]}
            onPress={() => setPanelMode('unverified')}
          >
            <AlertTriangle size={13} color={panelMode === 'unverified' ? '#FFFFFF' : '#DC2626'} />
            <Text style={[styles.modeTabTxt, panelMode === 'unverified' && styles.modeTabTxtActive]}>
              Not Verified ({unverifiedRecords.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Compact Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip
            label="All Cells"
            active={careCellFilter === 'ALL'}
            onPress={() => setCareCellFilter('ALL')}
          />
          {cells.map((c) => (
            <FilterChip
              key={c.id}
              label={formatCareCellLabel(c.cellCode, c.name)}
              active={careCellFilter === c.id}
              onPress={() => setCareCellFilter(careCellFilter === c.id ? 'ALL' : c.id)}
            />
          ))}
          <FilterChip
            label="Verified Pin"
            active={accuracyFilter === 'verified_home'}
            onPress={() =>
              setAccuracyFilter(accuracyFilter === 'verified_home' ? 'ALL' : 'verified_home')
            }
          />
          <FilterChip
            label="Village Area"
            active={accuracyFilter === 'village_approximate'}
            onPress={() =>
              setAccuracyFilter(
                accuracyFilter === 'village_approximate' ? 'ALL' : 'village_approximate'
              )
            }
          />
          <FilterChip
            label="🟢 Clear"
            active={visitStatusFilter === 'no_pending'}
            onPress={() =>
              setVisitStatusFilter(visitStatusFilter === 'no_pending' ? 'ALL' : 'no_pending')
            }
          />
          <FilterChip
            label="🔵 Scheduled"
            active={visitStatusFilter === 'scheduled'}
            onPress={() =>
              setVisitStatusFilter(visitStatusFilter === 'scheduled' ? 'ALL' : 'scheduled')
            }
          />
          <FilterChip
            label="🟠 Awaiting"
            active={visitStatusFilter === 'awaiting_confirmation'}
            onPress={() =>
              setVisitStatusFilter(
                visitStatusFilter === 'awaiting_confirmation' ? 'ALL' : 'awaiting_confirmation'
              )
            }
          />
          <FilterChip
            label="🔴 Follow-up"
            active={visitStatusFilter === 'requires_followup'}
            onPress={() =>
              setVisitStatusFilter(
                visitStatusFilter === 'requires_followup' ? 'ALL' : 'requires_followup'
              )
            }
          />
        </ScrollView>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Loading church member locations...</Text>
        </View>
      ) : panelMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={mapRegion}
            onRegionChangeComplete={(r) => setMapRegion(r)}
          >
            {/* Subtle highlight ring under Verified Home locations */}
            {verifiedHomeRecords.map((r) => {
              const c = getEffectiveCoordinates(r);
              if (!c) return null;
              return (
                <Circle
                  key={`ring_${r.memberId}`}
                  center={{ latitude: c.latitude, longitude: c.longitude }}
                  radius={90}
                  strokeColor="rgba(13, 148, 136, 0.75)"
                  fillColor="rgba(13, 148, 136, 0.16)"
                />
              );
            })}

            {/* Nearby search radius overlay */}
            {anchorCoords && nearbyAnchor && (
              <Circle
                center={anchorCoords}
                radius={nearbyRadiusKm * 1000}
                strokeColor="rgba(37, 99, 235, 0.7)"
                fillColor="rgba(37, 99, 235, 0.10)"
              />
            )}

            {/* Planned Multi-Stop Route Polyline */}
            {plannedStops.length > 1 && (
              <Polyline
                coordinates={plannedStops.map((s) => ({
                  latitude: s.latitude,
                  longitude: s.longitude,
                }))}
                strokeColor="#1A2D5A"
                strokeWidth={3}
              />
            )}

            {/* Fabric-safe native Markers (tracksViewChanges={false}) */}
            {markerGroups.map((grp) => {
              const pinColor = getVisitBadgeColor(grp.dominantBadgeStatus);
              const titleText = grp.isCluster
                ? grp.label
                : `${grp.members[0].memberName}${grp.allVerifiedHome ? ' ★' : ''}`;
              const descText = grp.isCluster
                ? `${grp.subtitle} • Tap to view members`
                : `${formatMemberAreaText(grp.members[0]) || 'Area'} (${
                    grp.allVerifiedHome ? 'Verified Home' : 'Village Approx'
                  })`;

              return (
                <Marker
                  key={grp.id}
                  coordinate={{ latitude: grp.latitude, longitude: grp.longitude }}
                  pinColor={pinColor}
                  tracksViewChanges={false}
                  title={titleText}
                  description={descText}
                  onPress={() => {
                    setSelectedGroup(grp);
                    setDetailSheetVisible(true);
                  }}
                />
              );
            })}
          </MapView>

          {/* Compact Legend Overlay */}
          <View style={styles.legendBar}>
            <Text style={styles.legendText}>
              🟢 Clear   🔵 Scheduled   🟠 Awaiting   🔴 Follow-up   |   Ring = Verified Home
            </Text>
          </View>
        </View>
      ) : panelMode === 'nearby' ? (
        <ScrollView style={styles.panelScroll} contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>
              {nearbyAnchor
                ? `Nearby Members around ${nearbyAnchor.memberName}`
                : 'Select any member on the map to find nearby members'}
            </Text>
            {nearbyAnchor ? (
              <Text style={styles.panelSub}>
                Origin: {formatMemberAreaText(nearbyAnchor)} (
                {nearbyAnchor.locationAccuracy === 'verified_home' && nearbyAnchor.locationSharingConsent
                  ? 'Exact Home Pin'
                  : 'Village/City Center — distances below are area-level estimates'}
                )
              </Text>
            ) : null}

            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusBtn, nearbyRadiusKm === km && styles.radiusBtnActive]}
                  onPress={() => {
                    setNearbyRadiusKm(km);
                    if (nearbyAnchor) runNearbySearch(nearbyAnchor, km);
                  }}
                >
                  <Text
                    style={[styles.radiusTxt, nearbyRadiusKm === km && styles.radiusTxtActive]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {nearbyLoading ? (
            <ActivityIndicator size="large" color={primaryText} style={{ marginTop: 24 }} />
          ) : nearbyMatches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No nearby members within {nearbyRadiusKm} km</Text>
              <Text style={styles.emptySub}>Try expanding the radius to 5 km or 10 km.</Text>
            </View>
          ) : (
            nearbyMatches.map((m) => {
              const inPlan = plannedStops.some((p) => p.memberId === m.location.memberId);
              return (
                <View key={m.location.memberId} style={styles.matchRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSelectedGroup({
                        id: m.location.memberId,
                        latitude: m.effectiveLatitude,
                        longitude: m.effectiveLongitude,
                        isCluster: false,
                        isSameVillageGroup: false,
                        label: m.location.memberName,
                        subtitle: formatMemberAreaText(m.location),
                        members: [m.location],
                        dominantBadgeStatus: getMemberVisitBadgeStatus(m.location),
                        hasVerifiedHome: m.location.locationAccuracy === 'verified_home',
                        allVerifiedHome: m.location.locationAccuracy === 'verified_home',
                      });
                      setDetailSheetVisible(true);
                    }}
                  >
                    <Text style={styles.matchName}>{m.location.memberName}</Text>
                    <Text style={styles.matchMeta}>
                      {m.distanceKm} km away
                      {m.isApproximateDistance ? ' (~Approx Area Match)' : ' (Exact Home Distance)'}
                    </Text>
                    <Text style={styles.matchArea}>
                      {formatMemberAreaText(m.location) || 'Location loaded'}
                      {m.location.careCellName ? ` • ${m.location.careCellName}` : ''}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.planToggleBtn, inPlan && styles.planToggleBtnActive]}
                    onPress={() => {
                      if (inPlan) {
                        setPlannedStops((prev) =>
                          prev
                            .filter((p) => p.memberId !== m.location.memberId)
                            .map((p, idx) => ({ ...p, order: idx + 1 }))
                        );
                      } else {
                        addMembersToVisitPlan([m.location]);
                      }
                    }}
                  >
                    {inPlan ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.planToggleTxt}>+ Plan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : panelMode === 'plan' ? (
        <ScrollView style={styles.panelScroll} contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
          <View style={styles.panelCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.panelTitle}>Combined Visiting Plan ({plannedStops.length})</Text>
              {plannedStops.length > 1 && (
                <TouchableOpacity style={styles.optBtn} onPress={optimizeVisitPlan}>
                  <Sparkles size={13} color="#FFFFFF" />
                  <Text style={styles.optBtnTxt}>Suggest Order</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.panelSub}>
              Reorder stops manually or tap Suggest Order, then open Google Maps multi-stop directions or schedule an official Care Cell visit.
            </Text>

            <View style={styles.planModeRow}>
              <TouchableOpacity
                style={[styles.modePill, travelMode === 'driving' && styles.modePillActive]}
                onPress={() => setTravelMode('driving')}
              >
                <Car size={13} color={travelMode === 'driving' ? '#FFFFFF' : '#334155'} />
                <Text style={[styles.modePillTxt, travelMode === 'driving' && styles.modePillTxtActive]}>
                  Driving
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePill, travelMode === 'walking' && styles.modePillActive]}
                onPress={() => setTravelMode('walking')}
              >
                <Footprints size={13} color={travelMode === 'walking' ? '#FFFFFF' : '#334155'} />
                <Text style={[styles.modePillTxt, travelMode === 'walking' && styles.modePillTxtActive]}>
                  Walking
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {plannedStops.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Members Added to Visit Plan Yet</Text>
              <Text style={styles.emptySub}>
                Tap a marker on the Map or use Find Nearby to add members to a multi-stop visiting route.
              </Text>
            </View>
          ) : (
            <>
              {plannedStops.map((stop, idx) => (
                <View key={stop.memberId} style={styles.stopRow}>
                  <View style={styles.stopOrderBadge}>
                    <Text style={styles.stopOrderTxt}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchName}>{stop.memberName}</Text>
                    <Text style={styles.matchArea}>{stop.address || stop.locality || 'Coordinates ready'}</Text>
                    {stop.distanceFromPreviousKm ? (
                      <Text style={styles.matchMeta}>
                        {stop.distanceFromPreviousKm} km from previous stop
                        {stop.isApproximateDistance ? ' (Area estimate)' : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => movePlanStop(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp size={14} color={idx === 0 ? '#CBD5E1' : '#334155'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => movePlanStop(idx, 1)}
                      disabled={idx === plannedStops.length - 1}
                    >
                      <ArrowDown
                        size={14}
                        color={idx === plannedStops.length - 1 ? '#CBD5E1' : '#334155'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderBtn, { backgroundColor: '#FEF2F2' }]}
                      onPress={() =>
                        setPlannedStops((prev) =>
                          prev
                            .filter((p) => p.memberId !== stop.memberId)
                            .map((p, i) => ({ ...p, order: i + 1 }))
                        )
                      }
                    >
                      <Trash2 size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.routeMapsBtn}
                onPress={async () => {
                  let originLat: number | undefined;
                  let originLng: number | undefined;
                  try {
                    const perm = await ExpoLocation.getForegroundPermissionsAsync();
                    if (perm.status === 'granted') {
                      const pos = await ExpoLocation.getLastKnownPositionAsync();
                      if (pos?.coords) {
                        originLat = pos.coords.latitude;
                        originLng = pos.coords.longitude;
                      }
                    }
                  } catch (_) {}
                  MemberLocationService.openGoogleMapsMultiStopRoute({
                    stops: plannedStops,
                    originLat,
                    originLng,
                    travelMode,
                  });
                }}
              >
                <Navigation size={16} color="#FFFFFF" />
                <Text style={styles.routeMapsBtnTxt}>Open Multi-Stop Route in Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assignVisitBtn}
                onPress={() => {
                  const matched = plannedStops
                    .map((s) => records.find((r) => r.memberId === s.memberId))
                    .filter(Boolean) as MemberLocationRecord[];
                  openScheduleModalForMembers(matched, plannedStops);
                }}
              >
                <Calendar size={16} color="#FFFFFF" />
                <Text style={styles.routeMapsBtnTxt}>Schedule & Assign Visiting Plan</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        /* Unverified Panel */
        <ScrollView style={styles.panelScroll} contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>Location Not Verified ({unverifiedRecords.length})</Text>
            <Text style={styles.panelSub}>
              These member addresses could not be geocoded reliably yet or need Village/District info. They are never given invented coordinates.
            </Text>
          </View>
          {unverifiedRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle2 size={28} color="#059669" />
              <Text style={[styles.emptyTitle, { marginTop: 8 }]}>All Filtered Members Verified!</Text>
            </View>
          ) : (
            unverifiedRecords.map((m) => (
              <TouchableOpacity
                key={m.memberId}
                style={styles.matchRow}
                onPress={() => {
                  setSelectedGroup({
                    id: m.memberId,
                    latitude: 0,
                    longitude: 0,
                    isCluster: false,
                    isSameVillageGroup: false,
                    label: m.memberName,
                    subtitle: formatMemberAreaText(m),
                    members: [m],
                    dominantBadgeStatus: getMemberVisitBadgeStatus(m),
                    hasVerifiedHome: false,
                    allVerifiedHome: false,
                  });
                  setDetailSheetVisible(true);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{m.memberName}</Text>
                  <Text style={styles.matchArea}>
                    {formatMemberAreaText(m) || 'No City / Village on profile'}
                  </Text>
                  {m.geocodingNote ? (
                    <Text style={[styles.matchMeta, { color: '#DC2626' }]}>{m.geocodingNote}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Member Info & Actions Bottom Sheet */}
      <MemberLocationDetailSheet
        visible={detailSheetVisible}
        onClose={() => setDetailSheetVisible(false)}
        churchId={churchId}
        members={selectedGroup?.members || []}
        groupTitle={selectedGroup?.label}
        onScheduleVisit={(sel) => openScheduleModalForMembers(sel)}
        onFindNearby={(anchor) => runNearbySearch(anchor, nearbyRadiusKm)}
        onAddToPlan={addMembersToVisitPlan}
      />

      {/* Visiting Schedule Integration Modal */}
      <CareCellVisitModal
        visible={visitModalVisible}
        onClose={() => setVisitModalVisible(false)}
        cells={cells}
        churchId={churchId}
        initialCellId={visitModalCellId}
        initialMemberIds={visitModalMemberIds}
        initialPreselectedMembers={visitModalMembers}
        initialRouteStops={visitModalStops}
        createdBy={user?.uid || (member as any)?.id || ''}
        createdByName={(member as any)?.name || user?.displayName || 'Church Admin'}
      />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterChipTxt, active && styles.filterChipTxtActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = createAdminThemedStyles({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  topControls: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
  },
  syncBtnTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  modeTabsRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTabActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  modeTabTxt: { fontSize: 12, fontWeight: '700', color: '#334155' },
  modeTabTxtActive: { color: '#FFFFFF' },
  filterRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipTxt: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterChipTxtActive: { color: '#FFFFFF' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingTxt: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  mapContainer: { flex: 1, position: 'relative' },
  legendBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  legendText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  panelScroll: { flex: 1 },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  panelTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  panelSub: { fontSize: 12, color: '#64748B', marginTop: 4 },
  radiusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  radiusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusBtnActive: { backgroundColor: '#1A2D5A', borderColor: '#1A2D5A' },
  radiusTxt: { fontSize: 12, fontWeight: '800', color: '#334155' },
  radiusTxtActive: { color: '#FFFFFF' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  matchName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  matchMeta: { fontSize: 12, fontWeight: '700', color: '#2563EB', marginTop: 2 },
  matchArea: { fontSize: 12, color: '#64748B', marginTop: 2 },
  planToggleBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  planToggleBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  planToggleTxt: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optBtnTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  planModeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modePillActive: { backgroundColor: '#1A2D5A', borderColor: '#1A2D5A' },
  modePillTxt: { fontSize: 12, fontWeight: '700', color: '#334155' },
  modePillTxtActive: { color: '#FFFFFF' },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stopOrderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopOrderTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  reorderBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  assignVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A2D5A',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
  },
  routeMapsBtnTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
