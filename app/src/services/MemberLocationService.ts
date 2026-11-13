import { Linking } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  deleteField,
} from '@react-native-firebase/firestore';
import {
  LocationAccuracy,
  MemberLocationRecord,
  MemberVisitBadgeStatus,
  NearbyMemberMatch,
  VisitRoutePoint,
} from '../types/CareCellTypes';
import { encodeGeohash, haversineDistanceKm } from '../utils/geohash';

const CHURCHES_COLLECTION = 'churches';
const LOCATIONS_SUBCOLLECTION = 'memberLocations';
const PRIVATE_HOME_SUBCOLLECTION = 'privateHome';
const FUNCTIONS_REGION = 'asia-south1';

export type TravelMode = 'driving' | 'walking';

export interface MapMarkerGroup {
  id: string;
  latitude: number;
  longitude: number;
  isCluster: boolean;
  isSameVillageGroup: boolean;
  label: string;
  subtitle: string;
  members: MemberLocationRecord[];
  dominantBadgeStatus: MemberVisitBadgeStatus;
  hasVerifiedHome: boolean;
  allVerifiedHome: boolean;
}

export interface SyncLocationsResult {
  totalMembers: number;
  syncedCount: number;
  geocodedFromApi: number;
  reusedCache: number;
  needsReviewCount: number;
  failedCount: number;
  geocodingKeyConfigured: boolean;
}

const getRegionalCallable = (name: string) => {
  try {
    const regionalFns = getFunctions(getApp(), FUNCTIONS_REGION);
    return httpsCallable(regionalFns, name);
  } catch (_) {
    return httpsCallable(getFunctions(getApp()), name);
  }
};

/**
 * Removes undefined keys recursively before writing to Firestore.
 */
function sanitizePayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    clean[k] = v;
  }
  return clean as Partial<T>;
}

/**
 * Returns the coordinates authorized for map display & routing, strictly respecting member consent.
 */
export function getEffectiveCoordinates(
  loc: Partial<MemberLocationRecord> | null | undefined
): { latitude: number; longitude: number; accuracy: LocationAccuracy } | null {
  if (!loc) return null;

  const hasVerifiedPin =
    loc.locationSharingConsent === true &&
    loc.locationAccuracy === 'verified_home' &&
    typeof loc.confirmedLatitude === 'number' &&
    typeof loc.confirmedLongitude === 'number' &&
    Number.isFinite(loc.confirmedLatitude) &&
    Number.isFinite(loc.confirmedLongitude);

  if (hasVerifiedPin) {
    return {
      latitude: loc.confirmedLatitude as number,
      longitude: loc.confirmedLongitude as number,
      accuracy: 'verified_home',
    };
  }

  if (
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude)
  ) {
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: 'village_approximate',
    };
  }

  return null;
}

/**
 * Derives visit status badge color bucket for a member location pin.
 * Green: No pending visit | Blue: Confirmed/In Progress | Orange: Awaiting/Scheduled | Red: Requires follow-up
 */
export function getMemberVisitBadgeStatus(
  loc: Partial<MemberLocationRecord> | null | undefined
): MemberVisitBadgeStatus {
  if (!loc) return 'no_pending';
  const visitStatus = String(loc.upcomingVisitStatus || '');
  if (loc.requiresFollowup || visitStatus === 'Declined') {
    return 'requires_followup';
  }
  if (visitStatus === 'Awaiting Confirmation' || visitStatus === 'Scheduled') {
    return 'awaiting_confirmation';
  }
  if (visitStatus === 'Confirmed' || visitStatus === 'In Progress') {
    return 'scheduled';
  }
  return 'no_pending';
}

export function getVisitBadgeColor(status: MemberVisitBadgeStatus): string {
  switch (status) {
    case 'requires_followup':
      return '#DC2626'; // Red
    case 'awaiting_confirmation':
      return '#EA580C'; // Orange
    case 'scheduled':
      return '#2563EB'; // Blue
    case 'no_pending':
    default:
      return '#16A34A'; // Green
  }
}

export function getVisitBadgeLabel(status: MemberVisitBadgeStatus): string {
  switch (status) {
    case 'requires_followup':
      return 'Follow-up';
    case 'awaiting_confirmation':
      return 'Awaiting Confirmation';
    case 'scheduled':
      return 'Visit Scheduled';
    case 'no_pending':
    default:
      return 'No Pending Visit';
  }
}

function getBadgePriority(status: MemberVisitBadgeStatus): number {
  switch (status) {
    case 'requires_followup':
      return 4;
    case 'awaiting_confirmation':
      return 3;
    case 'scheduled':
      return 2;
    case 'no_pending':
    default:
      return 1;
  }
}

/**
 * Formats a concise human-readable locality line from existing profile fields.
 */
export function formatMemberAreaText(loc: Partial<MemberLocationRecord>): string {
  const parts = [
    loc.village,
    loc.city && loc.city !== loc.village ? loc.city : undefined,
    loc.district,
    loc.state,
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

export class MemberLocationService {
  /**
   * Real-time single-collection listener on churches/{churchId}/memberLocations.
   */
  static subscribeMemberLocations(
    churchId: string,
    onUpdate: (records: MemberLocationRecord[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!churchId) {
      onUpdate([]);
      return () => {};
    }

    const firestoreDb = getFirestore();
    const locationsColRef = collection(
      firestoreDb,
      CHURCHES_COLLECTION,
      churchId,
      LOCATIONS_SUBCOLLECTION
    );

    return onSnapshot(
      locationsColRef,
      (snapshot) => {
        const list: MemberLocationRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() || {};
          const hasConsent = d.locationSharingConsent === true;
          return {
            ...d,
            memberId: d.memberId || docSnap.id,
            churchId: d.churchId || churchId,
            memberName: d.memberName || 'Member',
            locationSource: d.locationSource || 'profile_geocoding',
            locationAccuracy:
              hasConsent && d.locationAccuracy === 'verified_home'
                ? 'verified_home'
                : typeof d.latitude === 'number' && typeof d.longitude === 'number'
                  ? 'village_approximate'
                  : 'not_verified',
            geocodingStatus: d.geocodingStatus || 'pending',
            locationSharingConsent: hasConsent,
            confirmedLatitude: hasConsent ? d.confirmedLatitude : undefined,
            confirmedLongitude: hasConsent ? d.confirmedLongitude : undefined,
            completeAddress: hasConsent ? d.completeAddress : undefined,
            landmark: hasConsent ? d.landmark : undefined,
          } as MemberLocationRecord;
        });
        list.sort((a, b) => a.memberName.localeCompare(b.memberName));
        onUpdate(list);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  }

  /**
   * Fetches all member locations once for a church.
   */
  static async getMemberLocations(churchId: string): Promise<MemberLocationRecord[]> {
    if (!churchId) return [];
    const firestoreDb = getFirestore();
    const snap = await getDocs(
      collection(firestoreDb, CHURCHES_COLLECTION, churchId, LOCATIONS_SUBCOLLECTION)
    );
    return snap.docs.map((docSnap) => {
      const d = docSnap.data() || {};
      const hasConsent = d.locationSharingConsent === true;
      return {
        ...d,
        memberId: d.memberId || docSnap.id,
        churchId: d.churchId || churchId,
        memberName: d.memberName || 'Member',
        locationSource: d.locationSource || 'profile_geocoding',
        locationAccuracy:
          hasConsent && d.locationAccuracy === 'verified_home'
            ? 'verified_home'
            : typeof d.latitude === 'number' && typeof d.longitude === 'number'
              ? 'village_approximate'
              : 'not_verified',
        geocodingStatus: d.geocodingStatus || 'pending',
        locationSharingConsent: hasConsent,
        confirmedLatitude: hasConsent ? d.confirmedLatitude : undefined,
        confirmedLongitude: hasConsent ? d.confirmedLongitude : undefined,
        completeAddress: hasConsent ? d.completeAddress : undefined,
        landmark: hasConsent ? d.landmark : undefined,
      } as MemberLocationRecord;
    });
  }

  /**
   * Fetches a single member's location doc for their My Home Location screen.
   */
  static async getMyHomeLocation(
    churchId: string,
    memberId: string
  ): Promise<MemberLocationRecord | null> {
    if (!churchId || !memberId) return null;
    try {
      const firestoreDb = getFirestore();
      const snap = await getDoc(
        doc(firestoreDb, CHURCHES_COLLECTION, churchId, LOCATIONS_SUBCOLLECTION, memberId)
      );
      if (!snap.exists()) return null;
      const d = snap.data() || {};
      return {
        ...d,
        memberId: d.memberId || snap.id,
        churchId: d.churchId || churchId,
        memberName: d.memberName || 'Member',
        locationSource: d.locationSource || 'profile_geocoding',
        locationAccuracy: d.locationAccuracy || 'not_verified',
        geocodingStatus: d.geocodingStatus || 'pending',
        locationSharingConsent: d.locationSharingConsent === true,
      } as MemberLocationRecord;
    } catch (_) {
      return null;
    }
  }

  /**
   * Triggers server-side batch sync & cached Google Maps geocoding for church members.
   */
  static async syncChurchMemberLocations(
    churchId: string,
    forceRefresh = false
  ): Promise<SyncLocationsResult> {
    const callable = getRegionalCallable('syncChurchMemberLocations');
    const result = await callable({ churchId, forceRefresh });
    return (result.data || {}) as SyncLocationsResult;
  }

  /**
   * Saves or updates a member's confirmed Google Maps home pin with explicit consent.
   */
  static async saveMyHomeLocation(params: {
    churchId: string;
    memberId: string;
    memberName?: string;
    latitude: number;
    longitude: number;
    completeAddress: string;
    landmark?: string;
    village?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  }): Promise<void> {
    const {
      churchId,
      memberId,
      latitude,
      longitude,
      completeAddress,
      landmark = '',
    } = params;

    try {
      const callable = getRegionalCallable('saveMemberHomeLocationPin');
      await callable({
        churchId,
        memberId,
        latitude,
        longitude,
        completeAddress: completeAddress.trim(),
        landmark: landmark.trim(),
        action: 'save',
        locationSharingConsent: true,
      });
      return;
    } catch (fnErr: any) {
      // Fallback to direct consent-protected Firestore write if callable isn't deployed yet
      const code = String(fnErr?.code || '').toLowerCase();
      if (!code.includes('not-found') && !code.includes('unimplemented') && !code.includes('unavailable')) {
        throw fnErr;
      }
    }

    const geohash = encodeGeohash(latitude, longitude, 9);
    const firestoreDb = getFirestore();
    const locRef = doc(
      firestoreDb,
      CHURCHES_COLLECTION,
      churchId,
      LOCATIONS_SUBCOLLECTION,
      memberId
    );
    const pinRef = doc(
      firestoreDb,
      CHURCHES_COLLECTION,
      churchId,
      LOCATIONS_SUBCOLLECTION,
      memberId,
      PRIVATE_HOME_SUBCOLLECTION,
      'pin'
    );

    await Promise.all([
      setDoc(
        locRef,
        sanitizePayload({
          memberId,
          churchId,
          memberName: params.memberName || 'Member',
          village: params.village,
          city: params.city,
          district: params.district,
          state: params.state,
          country: params.country || 'India',
          locationSource: 'member_confirmed_pin',
          locationAccuracy: 'verified_home',
          locationSharingConsent: true,
          confirmedLatitude: latitude,
          confirmedLongitude: longitude,
          confirmedGeohash: geohash,
          geohash,
          completeAddress: completeAddress.trim(),
          landmark: landmark.trim() || undefined,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      ),
      setDoc(
        pinRef,
        sanitizePayload({
          memberId,
          churchId,
          latitude,
          longitude,
          completeAddress: completeAddress.trim(),
          landmark: landmark.trim() || undefined,
          locationSharingConsent: true,
          locationAccuracy: 'verified_home',
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      ),
    ]);
  }

  /**
   * Revokes member consent for exact home coordinates and removes pin data.
   * Existing village/city profile coordinates continue to work automatically.
   */
  static async revokeMyHomeLocationSharing(
    churchId: string,
    memberId: string
  ): Promise<void> {
    try {
      const callable = getRegionalCallable('saveMemberHomeLocationPin');
      await callable({
        churchId,
        memberId,
        action: 'revoke',
        locationSharingConsent: false,
      });
      return;
    } catch (fnErr: any) {
      const code = String(fnErr?.code || '').toLowerCase();
      if (!code.includes('not-found') && !code.includes('unimplemented') && !code.includes('unavailable')) {
        throw fnErr;
      }
    }

    const firestoreDb = getFirestore();
    const locRef = doc(
      firestoreDb,
      CHURCHES_COLLECTION,
      churchId,
      LOCATIONS_SUBCOLLECTION,
      memberId
    );
    const pinRef = doc(
      firestoreDb,
      CHURCHES_COLLECTION,
      churchId,
      LOCATIONS_SUBCOLLECTION,
      memberId,
      PRIVATE_HOME_SUBCOLLECTION,
      'pin'
    );
    const snap = await getDoc(locRef);
    const d = snap.data() || {};
    const hasApprox =
      typeof d.latitude === 'number' && typeof d.longitude === 'number';

    await Promise.all([
      setDoc(
        locRef,
        {
          locationSharingConsent: false,
          locationSource: 'profile_geocoding',
          locationAccuracy: hasApprox ? 'village_approximate' : 'not_verified',
          geohash: hasApprox
            ? encodeGeohash(d.latitude, d.longitude, 9)
            : deleteField(),
          confirmedLatitude: deleteField(),
          confirmedLongitude: deleteField(),
          confirmedGeohash: deleteField(),
          completeAddress: deleteField(),
          landmark: deleteField(),
          confirmedAt: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ),
      deleteDoc(pinRef).catch(() => {}),
    ]);
  }

  /**
   * Finds members within radiusKm (1, 2, 5, 10 km) using server geohash query with local Haversine fallback.
   */
  static async findNearbyMembers(params: {
    churchId: string;
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
    excludeMemberId?: string;
    localFallbackRecords?: MemberLocationRecord[];
  }): Promise<NearbyMemberMatch[]> {
    const {
      churchId,
      centerLatitude,
      centerLongitude,
      radiusKm,
      excludeMemberId,
      localFallbackRecords,
    } = params;

    try {
      const callable = getRegionalCallable('findNearbyChurchMembers');
      const res = await callable({
        churchId,
        centerLatitude,
        centerLongitude,
        radiusKm,
        excludeMemberId,
      });
      const matches = ((res.data as any)?.matches || []) as NearbyMemberMatch[];
      if (Array.isArray(matches)) return matches;
    } catch (_) {
      // Fallback gracefully below if offline or callable unavailable
    }

    const pool =
      localFallbackRecords || (await MemberLocationService.getMemberLocations(churchId));
    const results: NearbyMemberMatch[] = [];
    for (const loc of pool) {
      if (excludeMemberId && loc.memberId === excludeMemberId) continue;
      const coords = getEffectiveCoordinates(loc);
      if (!coords) continue;
      const distKm = haversineDistanceKm(
        { latitude: centerLatitude, longitude: centerLongitude },
        { latitude: coords.latitude, longitude: coords.longitude }
      );
      if (distKm <= radiusKm) {
        results.push({
          location: loc,
          distanceKm: Number(distKm.toFixed(2)),
          isApproximateDistance: coords.accuracy !== 'verified_home',
          effectiveLatitude: coords.latitude,
          effectiveLongitude: coords.longitude,
        });
      }
    }
    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Groups co-located members (same village/area) and clusters zoomed-out regions.
   * Ensures clicking a village marker reveals all members sharing that village area.
   */
  static groupLocationsForMap(
    records: MemberLocationRecord[],
    latitudeDelta: number
  ): MapMarkerGroup[] {
    // 1. Exact co-location grouping (~11m bucket) so same-village geocodes stack together cleanly
    const samePointBuckets = new Map<string, MemberLocationRecord[]>();
    for (const r of records) {
      const coords = getEffectiveCoordinates(r);
      if (!coords) continue;
      const latKey = coords.latitude.toFixed(4);
      const lngKey = coords.longitude.toFixed(4);
      const key = `${latKey},${lngKey}`;
      const existing = samePointBuckets.get(key);
      if (existing) existing.push(r);
      else samePointBuckets.set(key, [r]);
    }

    const areaGroups: MapMarkerGroup[] = [];
    samePointBuckets.forEach((groupMembers, key) => {
      const first = groupMembers[0];
      const coords = getEffectiveCoordinates(first)!;
      let dominant: MemberVisitBadgeStatus = 'no_pending';
      let verifiedCount = 0;

      for (const m of groupMembers) {
        const badge = getMemberVisitBadgeStatus(m);
        if (getBadgePriority(badge) > getBadgePriority(dominant)) {
          dominant = badge;
        }
        if (m.locationAccuracy === 'verified_home' && m.locationSharingConsent) {
          verifiedCount += 1;
        }
      }

      const areaName =
        first.village ||
        first.city ||
        first.resolvedLocality ||
        first.district ||
        'Area';

      areaGroups.push({
        id: `area_${key}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isCluster: groupMembers.length > 1,
        isSameVillageGroup: groupMembers.length > 1,
        label:
          groupMembers.length === 1
            ? first.memberName
            : `${areaName} (${groupMembers.length} members)`,
        subtitle:
          groupMembers.length === 1
            ? formatMemberAreaText(first)
            : `${groupMembers.length} members in ${areaName}`,
        members: groupMembers,
        dominantBadgeStatus: dominant,
        hasVerifiedHome: verifiedCount > 0,
        allVerifiedHome: verifiedCount === groupMembers.length,
      });
    });

    // 2. When zoomed out (delta > 0.14), merge nearby village pins into spatial clusters
    if (latitudeDelta <= 0.14 || areaGroups.length <= 12) {
      return areaGroups;
    }

    const cellDeg = Math.max(0.02, latitudeDelta * 0.14);
    const gridBuckets = new Map<string, MapMarkerGroup[]>();
    for (const g of areaGroups) {
      const row = Math.round(g.latitude / cellDeg);
      const col = Math.round(g.longitude / cellDeg);
      const key = `${row}_${col}`;
      const arr = gridBuckets.get(key);
      if (arr) arr.push(g);
      else gridBuckets.set(key, [g]);
    }

    const clustered: MapMarkerGroup[] = [];
    gridBuckets.forEach((bucket, key) => {
      if (bucket.length === 1) {
        clustered.push(bucket[0]);
        return;
      }

      const allMembers = bucket.flatMap((b) => b.members);
      let latSum = 0;
      let lngSum = 0;
      let dominant: MemberVisitBadgeStatus = 'no_pending';
      let verifiedCount = 0;

      for (const m of allMembers) {
        const c = getEffectiveCoordinates(m)!;
        latSum += c.latitude;
        lngSum += c.longitude;
        const badge = getMemberVisitBadgeStatus(m);
        if (getBadgePriority(badge) > getBadgePriority(dominant)) {
          dominant = badge;
        }
        if (m.locationAccuracy === 'verified_home' && m.locationSharingConsent) {
          verifiedCount += 1;
        }
      }

      clustered.push({
        id: `cluster_${key}`,
        latitude: latSum / allMembers.length,
        longitude: lngSum / allMembers.length,
        isCluster: true,
        isSameVillageGroup: false,
        label: `${allMembers.length} Members`,
        subtitle: `${bucket.length} areas • Tap to view or zoom in`,
        members: allMembers,
        dominantBadgeStatus: dominant,
        hasVerifiedHome: verifiedCount > 0,
        allVerifiedHome: verifiedCount === allMembers.length,
      });
    });

    return clustered;
  }

  /**
   * Computes an efficient nearest-neighbor multi-stop visiting order from an optional starting coordinate.
   */
  static suggestOptimalVisitOrder(
    members: MemberLocationRecord[],
    startPoint?: { latitude: number; longitude: number }
  ): VisitRoutePoint[] {
    const valid = members
      .map((m) => {
        const coords = getEffectiveCoordinates(m);
        if (!coords) return null;
        return { m, coords };
      })
      .filter(Boolean) as Array<{
      m: MemberLocationRecord;
      coords: { latitude: number; longitude: number; accuracy: LocationAccuracy };
    }>;

    if (valid.length === 0) return [];

    const remaining = [...valid];
    const ordered: VisitRoutePoint[] = [];
    let currentPos = startPoint || remaining[0].coords;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineDistanceKm(currentPos, remaining[i].coords);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      const [chosen] = remaining.splice(bestIdx, 1);
      const isConsent = chosen.coords.accuracy === 'verified_home';
      ordered.push({
        memberId: chosen.m.memberId,
        memberName: chosen.m.memberName,
        memberPhone: chosen.m.phone,
        address: isConsent
          ? chosen.m.completeAddress || formatMemberAreaText(chosen.m)
          : formatMemberAreaText(chosen.m),
        locality: chosen.m.village || chosen.m.city || chosen.m.district,
        latitude: chosen.coords.latitude,
        longitude: chosen.coords.longitude,
        order: ordered.length + 1,
        accuracy: chosen.coords.accuracy,
        distanceFromPreviousKm:
          ordered.length === 0 && !startPoint ? 0 : Number(bestDist.toFixed(2)),
        isApproximateDistance: !isConsent,
        consent: isConsent,
      });
      currentPos = chosen.coords;
    }

    return ordered;
  }

  /**
   * Opens Google Maps single-destination directions with optional explicit origin and travel mode.
   */
  static async openGoogleMapsDirections(params: {
    destinationLat: number;
    destinationLng: number;
    originLat?: number;
    originLng?: number;
    travelMode?: TravelMode;
  }): Promise<void> {
    const mode = params.travelMode || 'driving';
    let url = `https://www.google.com/maps/dir/?api=1&destination=${params.destinationLat},${params.destinationLng}&travelmode=${mode}`;
    if (
      typeof params.originLat === 'number' &&
      typeof params.originLng === 'number'
    ) {
      url += `&origin=${params.originLat},${params.originLng}`;
    }
    await Linking.openURL(url);
  }

  /**
   * Opens Google Maps multi-stop route in driving or walking mode (supports up to 10 total stops).
   */
  static async openGoogleMapsMultiStopRoute(params: {
    stops: VisitRoutePoint[];
    originLat?: number;
    originLng?: number;
    travelMode?: TravelMode;
  }): Promise<void> {
    if (!params.stops || params.stops.length === 0) return;
    if (params.stops.length === 1) {
      await MemberLocationService.openGoogleMapsDirections({
        destinationLat: params.stops[0].latitude,
        destinationLng: params.stops[0].longitude,
        originLat: params.originLat,
        originLng: params.originLng,
        travelMode: params.travelMode,
      });
      return;
    }

    const mode = params.travelMode || 'driving';
    const limited = params.stops.slice(0, 10);
    const destination = limited[limited.length - 1];
    const waypoints = limited
      .slice(0, -1)
      .map((s) => `${s.latitude},${s.longitude}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&waypoints=${encodeURIComponent(waypoints)}&travelmode=${mode}`;
    if (
      typeof params.originLat === 'number' &&
      typeof params.originLng === 'number'
    ) {
      url += `&origin=${params.originLat},${params.originLng}`;
    }
    await Linking.openURL(url);
  }
}
