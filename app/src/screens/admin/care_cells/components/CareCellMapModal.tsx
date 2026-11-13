import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
  Alert,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import {
  ArrowLeft,
  Navigation,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  List,
  Map as MapIcon,
  X,
  Plus,
  Route,
  Sparkles,
  Check,
  Car,
  Footprints,
} from 'lucide-react-native';
import {
  CareCell,
  CareCellMembership,
  MemberLocationRecord,
  VisitRoutePoint,
} from '../../../../types/CareCellTypes';
import { useChurch } from '../../../../context/ChurchContext';
import { MemberLocationService, TravelMode } from '../../../../services/MemberLocationService';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';

const { width, height } = Dimensions.get('window');

// Fallback coordinates only if both cell location & member coordinates fail to resolve
const DEFAULT_KURNOOL_LAT = 15.8281;
const DEFAULT_KURNOOL_LNG = 78.0373;

type EnrichedCellMembership = CareCellMembership & {
  isVerifiedPin?: boolean;
  isApproxPin?: boolean;
  resolvedAddress?: string;
};

interface CareCellMapModalProps {
  visible: boolean;
  onClose: () => void;
  churchId?: string;
  cell: CareCell;
  members: CareCellMembership[];
  inactiveMembers?: Array<{ memberId: string; missedCount: number; memberName?: string }>;
  onLogFollowup?: (member: CareCellMembership) => void;
  initialPlannedRouteIds?: string[];
  autoSelectRoute?: boolean;
  headerSubtitleOverride?: string;
  onConfirmRoute?: (stops: VisitRoutePoint[]) => void;
}

export default function CareCellMapModal({
  visible,
  onClose,
  churchId,
  cell,
  members,
  inactiveMembers = [],
  onLogFollowup,
  initialPlannedRouteIds,
  autoSelectRoute = false,
  headerSubtitleOverride,
  onConfirmRoute,
}: CareCellMapModalProps) {
  const { activeChurch } = useChurch();
  const effectiveChurchId = churchId || cell?.churchId || activeChurch?.id || '';
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const mapRef = useRef<MapView | null>(null);

  // View mode: 'map' or 'list'
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');
  const [filterNeedsVisitOnly, setFilterNeedsVisitOnly] = useState<boolean>(false);

  // Selected member card on map
  const [selectedMember, setSelectedMember] = useState<EnrichedCellMembership | null>(null);

  // Route Planning: list of member IDs in visit order + travel mode
  const [plannedRouteMemberIds, setPlannedRouteMemberIds] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [routeOptimizedFlag, setRouteOptimizedFlag] = useState<boolean>(false);

  // Sync planned route IDs whenever the modal opens with preselected/visit stops
  useEffect(() => {
    if (!visible) return;
    setSelectedMember(null);
    setSelectedLocality('ALL');
    setFilterNeedsVisitOnly(false);
    setRouteOptimizedFlag(false);
    if (initialPlannedRouteIds && initialPlannedRouteIds.length > 0) {
      setPlannedRouteMemberIds([...initialPlannedRouteIds]);
    } else if (autoSelectRoute && members.length > 0) {
      setPlannedRouteMemberIds(members.map((m) => m.memberId));
    } else {
      setPlannedRouteMemberIds([]);
    }
  }, [visible, initialPlannedRouteIds, autoSelectRoute, members]);

  // Live member locations, profile photos & fallback client geocoded coordinates
  const [memberLocMap, setMemberLocMap] = useState<Record<string, MemberLocationRecord>>({});
  const [memberPhotoMap, setMemberPhotoMap] = useState<Record<string, string>>({});
  const [loadedMarkerPhotos, setLoadedMarkerPhotos] = useState<Record<string, boolean>>({});
  const [geocodedCellCoords, setGeocodedCellCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodedMemberCoords, setGeocodedMemberCoords] = useState<Record<string, { latitude: number; longitude: number }>>({});

  useEffect(() => {
    if (!visible) return;
    let active = true;

    const loadLocationData = async () => {
      let locById: Record<string, MemberLocationRecord> = {};
      if (effectiveChurchId) {
        try {
          const allLocs = await MemberLocationService.getMemberLocations(effectiveChurchId);
          if (!active) return;
          allLocs.forEach((rec) => {
            if (rec.memberId) locById[rec.memberId] = rec;
          });
          setMemberLocMap(locById);
        } catch (_) {
          // Continue with client-side geocoding fallback
        }

        // Resolve member profile photos from church members docs for pins that lack memberPhoto on membership
        try {
          const firestoreDb = getFirestore();
          const photoEntries: Record<string, string> = {};
          await Promise.all(
            members.map(async (m) => {
              const existing =
                m.memberPhoto ||
                locById[m.memberId]?.profileImage ||
                '';
              if (existing) {
                photoEntries[m.memberId] = existing;
                return;
              }
              if (!m.memberId) return;
              try {
                const mSnap = await getDoc(
                  doc(firestoreDb, 'churches', effectiveChurchId, 'members', m.memberId)
                );
                if (mSnap.exists()) {
                  const md = mSnap.data() || {};
                  const url =
                    md.memberPhoto ||
                    md.photoUrl ||
                    md.photoURL ||
                    md.photo ||
                    md.profilePicture ||
                    md.profileImage ||
                    md.imageUrl ||
                    md.avatar ||
                    '';
                  if (typeof url === 'string' && url.trim()) {
                    photoEntries[m.memberId] = url.trim();
                  }
                }
              } catch (_) {
                // Ignore individual member photo fetch error
              }
            })
          );
          if (active && Object.keys(photoEntries).length > 0) {
            setMemberPhotoMap((prev) => ({ ...prev, ...photoEntries }));
          }
        } catch (_) {
          // Non-fatal
        }
      }

      // Resolve Care Cell center coordinates if cell doesn't have meetingLatitude/meetingLongitude
      let cellFallback: { latitude: number; longitude: number } | null = null;
      if (typeof cell.meetingLatitude === 'number' && typeof cell.meetingLongitude === 'number') {
        cellFallback = { latitude: cell.meetingLatitude, longitude: cell.meetingLongitude };
      } else {
        const cellQuery = [cell.meetingLocation || cell.location, cell.location && cell.meetingLocation !== cell.location ? cell.location : '']
          .filter(Boolean)
          .join(', ');
        if (cellQuery) {
          cellFallback =
            (await MemberLocationService.geocodePlaceCached(`${cellQuery}, Andhra Pradesh, India`)) ||
            (await MemberLocationService.geocodePlaceCached(`${cell.location || cell.meetingLocation}, India`));
          if (active && cellFallback) {
            setGeocodedCellCoords(cellFallback);
          }
        }
      }

      // Resolve missing coordinates for any member with address/locality (or cell locality)
      const resolvedMap: Record<string, { latitude: number; longitude: number }> = {};
      for (const m of members) {
        const locRec = locById[m.memberId];
        const hasVerified =
          locRec?.locationSharingConsent === true &&
          typeof locRec?.confirmedLatitude === 'number' &&
          typeof locRec?.confirmedLongitude === 'number';
        const hasLocCoords = typeof locRec?.latitude === 'number' && typeof locRec?.longitude === 'number';
        const hasMemCoords = typeof m.latitude === 'number' && typeof m.longitude === 'number';
        if (hasVerified || hasLocCoords || hasMemCoords) continue;

        const localityPart = (m.locality || m.city || cell.location || '').trim();
        const addressPart = (m.address || '').trim();
        if (!localityPart && !addressPart) continue;

        let coords: { latitude: number; longitude: number } | null = null;
        if (addressPart && localityPart) {
          coords = await MemberLocationService.geocodePlaceCached(`${addressPart}, ${localityPart}, India`);
        }
        if (!coords && localityPart) {
          coords =
            (await MemberLocationService.geocodePlaceCached(`${localityPart}, Andhra Pradesh, India`)) ||
            (await MemberLocationService.geocodePlaceCached(`${localityPart}, India`));
        }
        if (!coords && cellFallback) {
          coords = cellFallback;
        }
        if (coords) {
          resolvedMap[m.memberId] = coords;
        }
      }
      if (active && Object.keys(resolvedMap).length > 0) {
        setGeocodedMemberCoords(resolvedMap);
      }
    };

    loadLocationData();
    return () => {
      active = false;
    };
  }, [visible, effectiveChurchId, cell?.id, cell?.location, cell?.meetingLocation, members]);

  // Merge CareCellMembership with live memberLocations + fallback geocoding + micro-spread for overlapping village pins
  const enrichedMembers = useMemo<EnrichedCellMembership[]>(() => {
    const rawList = members.map((m) => {
      const locRec = memberLocMap[m.memberId];
      const hasVerified =
        locRec?.locationSharingConsent === true &&
        typeof locRec?.confirmedLatitude === 'number' &&
        typeof locRec?.confirmedLongitude === 'number';
      const hasProfileLoc =
        typeof locRec?.latitude === 'number' && typeof locRec?.longitude === 'number';
      const hasMemCoords =
        typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude);
      const fallbackCoords = geocodedMemberCoords[m.memberId];

      const lat = hasVerified
        ? locRec!.confirmedLatitude!
        : hasProfileLoc
          ? locRec!.latitude!
          : hasMemCoords
            ? m.latitude!
            : fallbackCoords?.latitude;
      const lng = hasVerified
        ? locRec!.confirmedLongitude!
        : hasProfileLoc
          ? locRec!.longitude!
          : hasMemCoords
            ? m.longitude!
            : fallbackCoords?.longitude;

      const resolvedAddress =
        (hasVerified ? locRec?.completeAddress : undefined) ||
        locRec?.completeAddress ||
        m.address ||
        '';

      return {
        ...m,
        memberPhoto:
          m.memberPhoto ||
          locRec?.profileImage ||
          memberPhotoMap[m.memberId] ||
          undefined,
        locality: m.locality || locRec?.village || locRec?.city || '',
        address: resolvedAddress,
        resolvedAddress,
        latitude: lat,
        longitude: lng,
        isVerifiedPin: hasVerified,
        isApproxPin: !hasVerified && typeof lat === 'number' && typeof lng === 'number',
      } as EnrichedCellMembership;
    });

    // Spread pins that share identical approximate village coordinates so every member marker is clickable
    const coordGroups = new Map<string, number[]>();
    rawList.forEach((item, idx) => {
      if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
        const key = `${item.latitude.toFixed(4)}_${item.longitude.toFixed(4)}`;
        const arr = coordGroups.get(key) || [];
        arr.push(idx);
        coordGroups.set(key, arr);
      }
    });

    coordGroups.forEach((indices) => {
      if (indices.length <= 1) return;
      indices.forEach((idx, pos) => {
        const item = rawList[idx];
        if (item.isVerifiedPin) return;
        const angle = (2 * Math.PI * pos) / indices.length;
        const radiusDeg = 0.00075; // ~80m visual offset
        rawList[idx] = {
          ...item,
          latitude: item.latitude! + radiusDeg * Math.cos(angle),
          longitude: item.longitude! + radiusDeg * Math.sin(angle),
        };
      });
    });

    return rawList;
  }, [members, memberLocMap, memberPhotoMap, geocodedMemberCoords]);

  // Inactive Member IDs set for fast lookup
  const inactiveMemberIdSet = useMemo(() => {
    return new Set(inactiveMembers.map((im) => im.memberId));
  }, [inactiveMembers]);

  // Center coordinate: Cell Meeting coordinate, resolved cell location, first member pin, or Kurnool fallback
  const centerCoord = useMemo(() => {
    const firstWithCoords = enrichedMembers.find(
      (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number'
    );
    const lat =
      cell.meetingLatitude ||
      geocodedCellCoords?.latitude ||
      firstWithCoords?.latitude ||
      DEFAULT_KURNOOL_LAT;
    const lng =
      cell.meetingLongitude ||
      geocodedCellCoords?.longitude ||
      firstWithCoords?.longitude ||
      DEFAULT_KURNOOL_LNG;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };
  }, [cell, geocodedCellCoords, enrichedMembers]);

  // Compute distinct localities from enriched members
  const localities = useMemo(() => {
    const set = new Set<string>();
    enrichedMembers.forEach((m) => {
      if (m.locality && m.locality.trim()) {
        set.add(m.locality.trim());
      }
    });
    return Array.from(set).sort();
  }, [enrichedMembers]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    let list = enrichedMembers;
    if (filterNeedsVisitOnly) {
      list = list.filter((m) => inactiveMemberIdSet.has(m.memberId));
    }
    if (selectedLocality !== 'ALL') {
      list = list.filter((m) => (m.locality || '').trim().toLowerCase() === selectedLocality.toLowerCase());
    }
    return list;
  }, [enrichedMembers, filterNeedsVisitOnly, selectedLocality, inactiveMemberIdSet]);

  // Members with valid GPS coordinates for map plotting
  const membersWithCoords = useMemo(() => {
    return filteredMembers.filter(
      (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude)
    );
  }, [filteredMembers]);

  // Auto-focus map onto Koilakuntla / cell members when coordinates load or view switches to Map
  useEffect(() => {
    if (!visible || viewMode !== 'map' || !mapRef.current) return;
    const points: Array<{ latitude: number; longitude: number }> = [];
    const cellLat = cell.meetingLatitude || geocodedCellCoords?.latitude;
    const cellLng = cell.meetingLongitude || geocodedCellCoords?.longitude;
    if (typeof cellLat === 'number' && typeof cellLng === 'number') {
      points.push({ latitude: cellLat, longitude: cellLng });
    }
    membersWithCoords.forEach((m) => {
      if (typeof m.latitude === 'number' && typeof m.longitude === 'number') {
        points.push({ latitude: m.latitude, longitude: m.longitude });
      }
    });

    if (points.length === 0) return;
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      if (points.length === 1) {
        mapRef.current.animateToRegion(
          {
            latitude: points[0].latitude,
            longitude: points[0].longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          },
          450
        );
      } else {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 90, right: 50, bottom: 90, left: 50 },
          animated: true,
        });
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [visible, viewMode, cell.meetingLatitude, cell.meetingLongitude, geocodedCellCoords, membersWithCoords]);

  // Navigation: Open Google Maps directions to a single member
  const handleNavigateToMember = (m: CareCellMembership) => {
    if (typeof m.latitude === 'number' && typeof m.longitude === 'number') {
      const lat = m.latitude;
      const lng = m.longitude;
      const label = encodeURIComponent(`${m.memberName}'s House`);
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}(${label})`,
        android: `google.navigation:q=${lat},${lng}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      });

      Linking.openURL(url!).catch(() => {
        const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(webFallback).catch(() => {
          Alert.alert('Navigation Error', 'Could not open Google Maps.');
        });
      });
    } else if (m.address || m.locality) {
      const fallbackCity = cell?.location || 'India';
      const query = encodeURIComponent(`${m.address || ''}, ${m.locality || fallbackCity}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Navigation Error', 'Could not open Google Maps.');
      });
    } else {
      Alert.alert('No Address', 'Member does not have GPS coordinates or an address saved.');
    }
  };

  // Phone call trigger
  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number available.');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call.');
    });
  };

  // WhatsApp trigger
  const handleWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available for WhatsApp.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Praise the Lord ${name || 'brother/sister'}! Grace and peace to you from our Care Cell.`);
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${text}`).catch(() => {
      Alert.alert('WhatsApp Required', 'WhatsApp is not installed on this device.');
    });
  };

  // Toggle member into planned route
  const handleToggleRouteMember = (memberId: string) => {
    setRouteOptimizedFlag(false);
    setPlannedRouteMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Ordered stops derived from plannedRouteMemberIds + enriched coordinates
  const plannedStops = useMemo<VisitRoutePoint[]>(() => {
    if (plannedRouteMemberIds.length === 0) return [];
    const stops: VisitRoutePoint[] = [];
    let prevLat: number | undefined;
    let prevLng: number | undefined;

    plannedRouteMemberIds.forEach((id) => {
      const m = enrichedMembers.find((em) => em.memberId === id);
      if (!m || typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return;
      const locRec = memberLocMap[m.memberId];
      const exactLat =
        m.isVerifiedPin && typeof locRec?.confirmedLatitude === 'number'
          ? locRec.confirmedLatitude
          : m.latitude;
      const exactLng =
        m.isVerifiedPin && typeof locRec?.confirmedLongitude === 'number'
          ? locRec.confirmedLongitude
          : m.longitude;

      let dist = 0;
      if (typeof prevLat === 'number' && typeof prevLng === 'number') {
        const dLat = ((exactLat - prevLat) * Math.PI) / 180;
        const dLng = ((exactLng - prevLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prevLat * Math.PI) / 180) *
            Math.cos((exactLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        dist = Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
      }

      stops.push({
        memberId: m.memberId,
        memberName: m.memberName,
        memberPhone: m.memberPhone,
        address: m.resolvedAddress || m.address || m.locality || '',
        locality: m.locality || locRec?.village || locRec?.city || cell?.location || '',
        latitude: exactLat,
        longitude: exactLng,
        order: stops.length + 1,
        accuracy: m.isVerifiedPin ? 'verified_home' : 'village_approximate',
        distanceFromPreviousKm: dist,
        isApproximateDistance: !m.isVerifiedPin,
        consent: Boolean(m.isVerifiedPin),
      });
      prevLat = exactLat;
      prevLng = exactLng;
    });

    return stops;
  }, [plannedRouteMemberIds, enrichedMembers, memberLocMap, cell?.location]);

  const plannedTotalKm = useMemo(
    () => MemberLocationService.computeRouteDistanceKm(plannedStops),
    [plannedStops]
  );

  // Nearest-neighbor TSP route optimization across planned (or all visible) members
  const handleOptimizeRoute = () => {
    const candidateIds =
      plannedRouteMemberIds.length >= 2
        ? plannedRouteMemberIds
        : filteredMembers.map((m) => m.memberId);

    const candidateMembers = candidateIds
      .map((id) => enrichedMembers.find((m) => m.memberId === id))
      .filter((m): m is EnrichedCellMembership => !!m && typeof m.latitude === 'number' && typeof m.longitude === 'number');

    if (candidateMembers.length === 0) {
      Alert.alert(
        'Missing Coordinates',
        'None of the selected members have mappable GPS or locality coordinates yet.'
      );
      return;
    }

    const locRecords: MemberLocationRecord[] = candidateMembers.map((m) => {
      const existing = memberLocMap[m.memberId];
      if (existing && (typeof existing.confirmedLatitude === 'number' || typeof existing.latitude === 'number')) {
        return existing;
      }
      return {
        memberId: m.memberId,
        churchId: effectiveChurchId,
        memberName: m.memberName,
        phone: m.memberPhone,
        village: m.locality,
        city: m.city || cell?.location,
        residentialAddress: m.address,
        latitude: m.latitude,
        longitude: m.longitude,
        locationSource: 'profile_geocoding',
        locationAccuracy: 'village_approximate',
        geocodingStatus: 'completed',
        locationSharingConsent: false,
      };
    });

    const cellStart =
      typeof cell.meetingLatitude === 'number' && typeof cell.meetingLongitude === 'number'
        ? { latitude: cell.meetingLatitude, longitude: cell.meetingLongitude }
        : geocodedCellCoords || undefined;

    const optimized = MemberLocationService.suggestOptimalVisitOrder(locRecords, cellStart);
    if (optimized.length > 0) {
      setPlannedRouteMemberIds(optimized.map((s) => s.memberId));
      setRouteOptimizedFlag(true);
    }
  };

  // Open multi-stop route in Google Maps using MemberLocationService
  const handleOpenMultiStopRoute = async () => {
    if (plannedRouteMemberIds.length === 0) return;

    if (plannedStops.length > 0) {
      try {
        await MemberLocationService.openGoogleMapsMultiStopRoute({
          stops: plannedStops,
          travelMode,
        });
      } catch (_) {
        Alert.alert('Route Error', 'Unable to open Google Maps route navigation.');
      }
      return;
    }

    const firstFallback = plannedRouteMemberIds
      .map((id) => enrichedMembers.find((m) => m.memberId === id))
      .find(Boolean);
    if (firstFallback) {
      handleNavigateToMember(firstFallback);
      return;
    }
    Alert.alert('Missing Coordinates', 'The selected members for the visit route do not have GPS coordinates.');
  };

  const handleConfirmAndSaveRoute = () => {
    if (!onConfirmRoute) return;
    if (plannedStops.length === 0) {
      Alert.alert(
        'No Route Stops',
        'Select at least one member with a location or tap Optimize to generate a route.'
      );
      return;
    }
    onConfirmRoute(plannedStops);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.circularBackBtn} onPress={onClose} activeOpacity={0.8}>
            <ArrowLeft size={20} color={primaryText} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{cell.name}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {headerSubtitleOverride ||
                `${cell.cellCode} · ${cell.location || 'Care Cell'} · ${members.length} Members`}
            </Text>
          </View>
          <View style={styles.viewModeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, viewMode === 'map' && { backgroundColor: primaryBtnBg }]}
              onPress={() => setViewMode('map')}
            >
              <MapIcon size={14} color={viewMode === 'map' ? primaryBtnText : secondaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, viewMode === 'list' && { backgroundColor: primaryBtnBg }]}
              onPress={() => setViewMode('list')}
            >
              <List size={14} color={viewMode === 'list' ? primaryBtnText : secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Pills Bar */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedLocality === 'ALL' && !filterNeedsVisitOnly && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => {
                setSelectedLocality('ALL');
                setFilterNeedsVisitOnly(false);
              }}
            >
              <Text
                style={[
                  styles.filterPillTxt,
                  selectedLocality === 'ALL' && !filterNeedsVisitOnly && { color: primaryBtnText, fontWeight: '700' },
                ]}
              >
                All Members ({members.length})
              </Text>
            </TouchableOpacity>

            {inactiveMembers.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterNeedsVisitOnly && styles.filterPillAlertActive,
                ]}
                onPress={() => setFilterNeedsVisitOnly(!filterNeedsVisitOnly)}
              >
                <AlertTriangle size={12} color={filterNeedsVisitOnly ? '#FFFFFF' : '#DC2626'} style={{ marginRight: 4 }} />
                <Text
                  style={[
                    styles.filterPillTxt,
                    { color: filterNeedsVisitOnly ? '#FFFFFF' : '#DC2626', fontWeight: '700' },
                  ]}
                >
                  Needs Pastoral Visit ({inactiveMembers.length})
                </Text>
              </TouchableOpacity>
            )}

            {localities.map((loc) => {
              const isSelected = selectedLocality === loc && !filterNeedsVisitOnly;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterPill, isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg }]}
                  onPress={() => {
                    setFilterNeedsVisitOnly(false);
                    setSelectedLocality(loc);
                  }}
                >
                  <MapPin size={11} color={isSelected ? primaryBtnText : secondaryText} style={{ marginRight: 4 }} />
                  <Text style={[styles.filterPillTxt, isSelected && { color: primaryBtnText, fontWeight: '700' }]}>{loc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content: Map or List */}
        {viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={StyleSheet.absoluteFillObject}
              initialRegion={centerCoord}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
            >
              {/* Care Cell Meeting Marker */}
              {(cell.meetingLatitude && cell.meetingLongitude) || geocodedCellCoords ? (
                <Marker
                  coordinate={{
                    latitude: cell.meetingLatitude || geocodedCellCoords!.latitude,
                    longitude: cell.meetingLongitude || geocodedCellCoords!.longitude,
                  }}
                  title={cell.name}
                  description={`Care Cell Center: ${cell.meetingLocation || cell.location}`}
                  pinColor="#D97706"
                >
                  <View style={styles.churchMarkerBubble}>
                    <MapPin size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              ) : null}

              {/* Member Residence Profile Photo Pins */}
              {membersWithCoords.map((m) => {
                const isInactive = inactiveMemberIdSet.has(m.memberId);
                const isSelected = selectedMember?.memberId === m.memberId;
                const inRouteIndex = plannedRouteMemberIds.indexOf(m.memberId);
                const markerKey = m.id || m.memberId;
                const photoUri = typeof m.memberPhoto === 'string' ? m.memberPhoto.trim() : '';
                const hasPhoto = photoUri.length > 0;
                const accentColor = isSelected
                  ? '#F59E0B'
                  : inRouteIndex >= 0
                    ? '#059669'
                    : isInactive
                      ? '#DC2626'
                      : '#1A2D5A';

                return (
                  <Marker
                    key={markerKey}
                    coordinate={{
                      latitude: m.latitude!,
                      longitude: m.longitude!,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={Boolean((hasPhoto && !loadedMarkerPhotos[markerKey]) || isSelected)}
                    onPress={() => setSelectedMember(m)}
                  >
                    <View style={[styles.photoPinWrapper, isSelected && styles.photoPinWrapperSelected]}>
                      <View
                        style={[
                          styles.photoPinHead,
                          { borderColor: accentColor },
                          !hasPhoto && { backgroundColor: accentColor },
                        ]}
                      >
                        {hasPhoto ? (
                          <Image
                            source={{ uri: photoUri }}
                            style={styles.photoPinImage}
                            resizeMode="cover"
                            onLoad={() => {
                              setTimeout(() => {
                                setLoadedMarkerPhotos((prev) =>
                                  prev[markerKey] ? prev : { ...prev, [markerKey]: true }
                                );
                              }, 150);
                            }}
                            onError={() => {
                              setLoadedMarkerPhotos((prev) =>
                                prev[markerKey] ? prev : { ...prev, [markerKey]: true }
                              );
                            }}
                          />
                        ) : (
                          <Text style={styles.markerInitialsTxt}>
                            {m.memberName.slice(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      {inRouteIndex >= 0 ? (
                        <View style={styles.routeOrderCornerBadge}>
                          <Text style={styles.routeOrderCornerTxt}>{inRouteIndex + 1}</Text>
                        </View>
                      ) : null}
                      <View style={[styles.photoPinPointer, { borderTopColor: accentColor }]} />
                    </View>
                  </Marker>
                );
              })}

              {/* Planned Multi-Stop Route Path */}
              {plannedStops.length >= 2 && (
                <Polyline
                  coordinates={plannedStops.map((s) => ({
                    latitude: s.latitude,
                    longitude: s.longitude,
                  }))}
                  strokeColor="#059669"
                  strokeWidth={3.5}
                  lineDashPattern={[8, 5]}
                />
              )}
            </MapView>

            {/* Floating Top Route Summary & Optimization Bar */}
            {plannedRouteMemberIds.length > 0 ? (
              <View style={styles.floatingRouteBar}>
                <View style={styles.floatingRouteHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.floatingRouteTitle}>
                      {plannedRouteMemberIds.length} House Visit{plannedRouteMemberIds.length === 1 ? '' : 's'} Planned
                    </Text>
                    <Text style={styles.floatingRouteSub} numberOfLines={1}>
                      {plannedStops.length > 0
                        ? `${plannedStops.length} mapped · ~${plannedTotalKm} km${routeOptimizedFlag ? ' · Optimized' : ''}`
                        : 'Resolving member coordinates...'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.travelModeChip}
                    onPress={() => setTravelMode((m) => (m === 'driving' ? 'walking' : 'driving'))}
                    activeOpacity={0.8}
                  >
                    {travelMode === 'driving' ? (
                      <Car size={12} color="#E2E8F0" />
                    ) : (
                      <Footprints size={12} color="#E2E8F0" />
                    )}
                    <Text style={styles.travelModeChipTxt}>
                      {travelMode === 'driving' ? 'Drive' : 'Walk'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.floatingRouteActionsRow}>
                  {plannedStops.length >= 2 && (
                    <TouchableOpacity
                      style={styles.floatingOptimizeBtn}
                      onPress={handleOptimizeRoute}
                      activeOpacity={0.85}
                    >
                      <Sparkles size={13} color="#1A2D5A" style={{ marginRight: 5 }} />
                      <Text style={styles.floatingOptimizeBtnTxt}>Optimize</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.floatingNavigateRouteBtn}
                    onPress={handleOpenMultiStopRoute}
                    activeOpacity={0.85}
                  >
                    <Navigation size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.floatingNavigateRouteBtnTxt}>Start Route</Text>
                  </TouchableOpacity>

                  {onConfirmRoute && (
                    <TouchableOpacity
                      style={styles.floatingApplyRouteBtn}
                      onPress={handleConfirmAndSaveRoute}
                      activeOpacity={0.85}
                    >
                      <Check size={13} color="#065F46" strokeWidth={2.5} style={{ marginRight: 4 }} />
                      <Text style={styles.floatingApplyRouteBtnTxt}>Save Route</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : filteredMembers.length > 0 ? (
              <View style={styles.floatingQuickOptimizeWrap}>
                <TouchableOpacity
                  style={styles.floatingQuickOptimizePill}
                  onPress={handleOptimizeRoute}
                  activeOpacity={0.85}
                >
                  <Sparkles size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.floatingQuickOptimizeTxt}>
                    Optimize Visit Route ({filteredMembers.length})
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Selected Member Detail Callout Card */}
            {selectedMember ? (
              <View style={styles.selectedMemberCard}>
                <View style={styles.selectedCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    {selectedMember.memberPhoto ? (
                      <Image source={{ uri: selectedMember.memberPhoto }} style={styles.selectedMemberAvatar} />
                    ) : (
                      <View style={styles.selectedMemberAvatarFallback}>
                        <Text style={styles.selectedMemberAvatarInitials}>
                          {selectedMember.memberName.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedMemberName} numberOfLines={1}>
                        {selectedMember.memberName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {selectedMember.locality ? (
                          <View style={styles.localityTag}>
                            <MapPin size={10} color="#1A2D5A" />
                            <Text style={styles.localityTagTxt}>{selectedMember.locality}</Text>
                          </View>
                        ) : null}
                        {inactiveMemberIdSet.has(selectedMember.memberId) && (
                          <View style={styles.needsVisitTag}>
                            <Text style={styles.needsVisitTagTxt}>Needs Visit</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedMember(null)} style={{ padding: 4 }}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {selectedMember.address ? (
                  <Text style={styles.selectedMemberAddress} numberOfLines={2}>
                    {selectedMember.address}
                  </Text>
                ) : null}

                {/* Quick Action Buttons */}
                <View style={styles.selectedActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionNavigateBtn, { backgroundColor: primaryBtnBg }]}
                    onPress={() => handleNavigateToMember(selectedMember)}
                    activeOpacity={0.85}
                  >
                    <Navigation size={14} color={primaryBtnText} style={{ marginRight: 6 }} />
                    <Text style={[styles.actionNavigateBtnTxt, { color: primaryBtnText }]}>Directions</Text>
                  </TouchableOpacity>

                  {selectedMember.memberPhone ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionCircleBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
                        onPress={() => handleCall(selectedMember.memberPhone)}
                      >
                        <Phone size={15} color={secondaryBtnText} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionCircleBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => handleWhatsApp(selectedMember.memberPhone, selectedMember.memberName)}
                      >
                        <MessageCircle size={15} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {onLogFollowup && (
                    <TouchableOpacity
                      style={[styles.actionLogVisitBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                      onPress={() => {
                        onLogFollowup(selectedMember);
                      }}
                    >
                      <Heart size={13} color={secondaryBtnText} style={{ marginRight: 4 }} />
                      <Text style={[styles.actionLogVisitBtnTxt, { color: secondaryBtnText }]}>Log Visit</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionRouteBtn,
                      { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder },
                      plannedRouteMemberIds.includes(selectedMember.memberId) && styles.actionRouteBtnActive,
                    ]}
                    onPress={() => handleToggleRouteMember(selectedMember.memberId)}
                  >
                    <Route
                      size={13}
                      color={plannedRouteMemberIds.includes(selectedMember.memberId) ? '#FFFFFF' : secondaryBtnText}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.actionRouteBtnTxt,
                        { color: secondaryBtnText },
                        plannedRouteMemberIds.includes(selectedMember.memberId) && styles.actionRouteBtnTxtActive,
                      ]}
                    >
                      {plannedRouteMemberIds.includes(selectedMember.memberId) ? 'In Route' : '+ Route'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          /* List View Mode */
          <View style={{ flex: 1 }}>
            <View style={styles.listRouteToolbar}>
              <TouchableOpacity
                style={styles.listOptimizeBtn}
                onPress={handleOptimizeRoute}
                activeOpacity={0.85}
              >
                <Sparkles size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.listOptimizeBtnTxt}>
                  {plannedRouteMemberIds.length > 0
                    ? `Optimize (${plannedStops.length} stops · ~${plannedTotalKm} km)`
                    : `Plan & Optimize Route (${filteredMembers.length})`}
                </Text>
              </TouchableOpacity>

              {plannedRouteMemberIds.length > 0 && (
                <TouchableOpacity
                  style={styles.listStartRouteBtn}
                  onPress={handleOpenMultiStopRoute}
                  activeOpacity={0.85}
                >
                  <Navigation size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.listStartRouteBtnTxt}>Start</Text>
                </TouchableOpacity>
              )}

              {onConfirmRoute && plannedStops.length > 0 && (
                <TouchableOpacity
                  style={styles.listSaveRouteBtn}
                  onPress={handleConfirmAndSaveRoute}
                  activeOpacity={0.85}
                >
                  <Check size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                  <Text style={styles.listSaveRouteBtnTxt}>Save</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id || item.memberId}
              contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isInactive = inactiveMemberIdSet.has(item.memberId);
              const inRoute = plannedRouteMemberIds.includes(item.memberId);

              return (
                <View style={styles.memberListItem}>
                  <View style={styles.listItemTopRow}>
                    {item.memberPhoto ? (
                      <Image source={{ uri: item.memberPhoto }} style={styles.itemAvatarImg} />
                    ) : (
                      <View style={styles.itemAvatarFallback}>
                        <Text style={styles.itemAvatarInitials}>{item.memberName.slice(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemMemberName}>{item.memberName}</Text>
                      {item.locality ? (
                        <View style={styles.localityTag}>
                          <MapPin size={10} color="#1A2D5A" />
                          <Text style={styles.localityTagTxt}>{item.locality}</Text>
                        </View>
                      ) : null}
                    </View>
                    {isInactive && (
                      <View style={styles.needsVisitTag}>
                        <Text style={styles.needsVisitTagTxt}>Needs Visit</Text>
                      </View>
                    )}
                  </View>

                  {item.resolvedAddress || item.address ? (
                    <Text style={styles.itemAddressTxt} numberOfLines={2}>
                      {item.isVerifiedPin ? '📍 Exact Home Pin: ' : ''}
                      {item.resolvedAddress || item.address}
                    </Text>
                  ) : item.locality ? (
                    <Text style={styles.itemNoAddressTxt}>
                      {item.locality} (Approximate area pin — no street address saved)
                    </Text>
                  ) : (
                    <Text style={styles.itemNoAddressTxt}>No residential address on file</Text>
                  )}

                  <View style={styles.listItemActionsRow}>
                    <TouchableOpacity
                      style={[styles.itemDirectionsBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                      onPress={() => handleNavigateToMember(item)}
                    >
                      <Navigation size={13} color={secondaryBtnText} style={{ marginRight: 4 }} />
                      <Text style={[styles.itemDirectionsBtnTxt, { color: secondaryBtnText }]}>Directions</Text>
                    </TouchableOpacity>

                    {item.memberPhone ? (
                      <>
                        <TouchableOpacity
                          style={[styles.itemCallBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
                          onPress={() => handleCall(item.memberPhone)}
                        >
                          <Phone size={13} color={secondaryBtnText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.itemCallBtn, { backgroundColor: '#25D366' }]}
                          onPress={() => handleWhatsApp(item.memberPhone, item.memberName)}
                        >
                          <MessageCircle size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      </>
                    ) : null}

                    {onLogFollowup && (
                      <TouchableOpacity
                        style={[styles.itemLogBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                        onPress={() => onLogFollowup(item)}
                      >
                        <Text style={[styles.itemLogBtnTxt, { color: secondaryBtnText }]}>Log Visit</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.itemRouteBtn,
                        { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder },
                        inRoute && styles.itemRouteBtnActive,
                      ]}
                      onPress={() => handleToggleRouteMember(item.memberId)}
                    >
                      <Text style={[styles.itemRouteBtnTxt, { color: secondaryBtnText }, inRoute && styles.itemRouteBtnTxtActive]}>
                        {inRoute ? `#${plannedRouteMemberIds.indexOf(item.memberId) + 1} In Route` : '+ Route'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  circularBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  modeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeToggleBtnActive: {
    backgroundColor: '#1A2D5A',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  filterPillAlertActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterPillTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
  },
  churchMarkerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  memberMarkerBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A2D5A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  memberMarkerNormal: {
    backgroundColor: '#1A2D5A',
  },
  memberMarkerAlert: {
    backgroundColor: '#DC2626',
  },
  memberMarkerSelected: {
    borderColor: '#F59E0B',
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  photoPinWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  photoPinWrapperSelected: {
    transform: [{ scale: 1.15 }],
  },
  photoPinHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 5,
  },
  photoPinImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  photoPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  routeOrderCornerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  routeOrderCornerTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markerInitialsTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeOrderBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeOrderBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingRouteBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingRouteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingRouteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  travelModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  travelModeChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  floatingOptimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  floatingOptimizeBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  floatingApplyRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  floatingApplyRouteBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  floatingQuickOptimizeWrap: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 60,
    alignItems: 'flex-start',
  },
  floatingQuickOptimizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingQuickOptimizeTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listRouteToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listOptimizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  listOptimizeBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listStartRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  listStartRouteBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listSaveRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  listSaveRouteBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingRouteTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingRouteSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  floatingNavigateRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  floatingNavigateRouteBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedMemberCard: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  selectedMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedMemberAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedMemberAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  selectedMemberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  localityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  localityTagTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  needsVisitTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  needsVisitTagTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  selectedMemberAddress: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginTop: 6,
  },
  selectedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionNavigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D5A',
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionNavigateBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLogVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionLogVisitBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  actionRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionRouteBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  actionRouteBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  actionRouteBtnTxtActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    paddingBottom: 30,
  },
  memberListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  itemAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemMemberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemAddressTxt: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  itemNoAddressTxt: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  listItemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 7,
    borderRadius: 8,
  },
  itemDirectionsBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLogBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
  },
  itemLogBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  itemRouteBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
  },
  itemRouteBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  itemRouteBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  itemRouteBtnTxtActive: {
    color: '#FFFFFF',
  },
});

