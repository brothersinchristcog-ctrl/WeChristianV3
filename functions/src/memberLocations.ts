import { createHash } from 'crypto';
import axios from 'axios';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  encodeGeohash,
  geohashQueryBoundsForRadius,
  haversineDistanceKm,
} from './utils/geohash.js';

export const GOOGLE_MAPS_GEOCODING_KEY = defineSecret('GOOGLE_MAPS_GEOCODING_KEY');

const REGION = 'asia-south1';
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'Admin', 'Super Admin']);

export type LocationSource = 'profile_geocoding' | 'member_confirmed_pin';
export type LocationAccuracy =
  | 'verified_home'
  | 'village_approximate'
  | 'not_verified';
export type GeocodingStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'needs_review';

interface ProfileAddressParts {
  village: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  residentialAddress: string;
  queryString: string;
  fingerprint: string;
}

interface GeocodeCachePayload {
  status: GeocodingStatus;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  resolvedLocality: string;
  resolvedDistrict: string;
  resolvedState: string;
  resolvedCountry: string;
  googleResultType: string;
  googleLocationType: string;
  placeId: string;
  geohash: string;
  geocodingNote: string;
  ambiguousCount: number;
}

/**
 * Strips `undefined` values recursively before Firestore writes.
 */
function sanitizeFirestoreMap(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      if (typeof (v as any)._methodName === 'string') {
        out[k] = v;
      } else {
        out[k] = sanitizeFirestoreMap(v);
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

function cleanStr(val: unknown): string {
  return typeof val === 'string' ? val.trim() : val != null ? String(val).trim() : '';
}

function normalizeToken(val: string): string {
  return cleanStr(val)
    .toLowerCase()
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhoneLast10(val: unknown): string {
  const digits = cleanStr(val).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Builds deterministic normalized address parts and SHA-256 fingerprint from existing profile fields.
 * Reuses village, city/mailingCity, district, state/mailingState, postalCode, country, mailingStreet/address.
 */
export function extractProfileAddressParts(member: Record<string, any>): ProfileAddressParts {
  const village = cleanStr(member.village);
  const city = cleanStr(member.city || member.mailingCity);
  const district = cleanStr(member.district || member.county);
  const state = cleanStr(member.state || member.mailingState);
  const postalCode = cleanStr(member.postalCode || member.mailingPostalCode || member.pincode || member.zip);
  const country = cleanStr(member.country || member.mailingCountry) || 'India';
  const residentialAddress = cleanStr(
    member.residentialAddress || member.mailingStreet || member.address || member.street
  );

  // Use primary locality plus district, state, postalCode, and country.
  // Never geocode village-only when district/state exist.
  const querySegments: string[] = [];
  const seenNormalized = new Set<string>();
  const pushUnique = (segment: string) => {
    const trimmed = cleanStr(segment);
    const norm = normalizeToken(trimmed);
    if (!trimmed || seenNormalized.has(norm)) return;
    seenNormalized.add(norm);
    querySegments.push(trimmed);
  };

  if (village) pushUnique(village);
  if (city) pushUnique(city);
  if (district) pushUnique(district);
  if (state) pushUnique(state);
  if (postalCode) pushUnique(postalCode);
  if (querySegments.length > 0) {
    pushUnique(country);
  }

  const queryString = querySegments.join(', ');
  const fingerprintInput = [
    normalizeToken(village),
    normalizeToken(city),
    normalizeToken(district),
    normalizeToken(state),
    normalizeToken(postalCode),
    normalizeToken(country),
  ].join('|');

  const fingerprint = queryString
    ? createHash('sha256').update(fingerprintInput).digest('hex').slice(0, 32)
    : '';

  return {
    village,
    city,
    district,
    state,
    country,
    postalCode,
    residentialAddress,
    queryString,
    fingerprint,
  };
}

function getComponentByTypes(components: any[], types: string[]): string {
  if (!Array.isArray(components)) return '';
  for (const t of types) {
    const found = components.find((c) => Array.isArray(c.types) && c.types.includes(t));
    if (found?.long_name) return String(found.long_name).trim();
  }
  return '';
}

/**
 * Evaluates whether a Google Geocoding result matches expected district/state to prevent wrong-region pins.
 */
function scoreGeocodeCandidate(
  candidate: any,
  parts: ProfileAddressParts
): {
  score: number;
  resolvedLocality: string;
  resolvedDistrict: string;
  resolvedState: string;
  resolvedCountry: string;
  isTooBroad: boolean;
  districtMismatch: boolean;
  stateMismatch: boolean;
} {
  const comps = candidate?.address_components || [];
  const types: string[] = Array.isArray(candidate?.types) ? candidate.types : [];

  const resolvedLocality =
    getComponentByTypes(comps, [
      'sublocality_level_1',
      'sublocality',
      'locality',
      'administrative_area_level_3',
    ]) || parts.village || parts.city;

  const resolvedDistrict = getComponentByTypes(comps, [
    'administrative_area_level_2',
    'administrative_area_level_3',
  ]);
  const resolvedState = getComponentByTypes(comps, ['administrative_area_level_1']);
  const resolvedCountry = getComponentByTypes(comps, ['country']) || parts.country;

  // Reject purely country or state level coordinates if user gave village/city
  const specificTypes = new Set([
    'street_address',
    'premise',
    'subpremise',
    'route',
    'neighborhood',
    'sublocality',
    'sublocality_level_1',
    'sublocality_level_2',
    'locality',
    'postal_code',
    'administrative_area_level_3',
    'administrative_area_level_2',
    'political',
  ]);
  const isOnlyBroadArea =
    (types.includes('country') || types.includes('administrative_area_level_1')) &&
    !types.some((t) => specificTypes.has(t) && t !== 'political');

  let stateMismatch = false;
  if (parts.state && resolvedState) {
    const expState = normalizeToken(parts.state);
    const gotState = normalizeToken(resolvedState);
    if (!gotState.includes(expState) && !expState.includes(gotState)) {
      stateMismatch = true;
    }
  }

  let districtMismatch = false;
  if (parts.district && resolvedDistrict) {
    const expDist = normalizeToken(parts.district).replace(/\s+district$/i, '');
    const gotDist = normalizeToken(resolvedDistrict).replace(/\s+district$/i, '');
    if (!gotDist.includes(expDist) && !expDist.includes(gotDist)) {
      districtMismatch = true;
    }
  }

  let score = 0;
  if (!isOnlyBroadArea) score += 10;
  if (!stateMismatch) score += 20;
  if (!districtMismatch) score += 15;
  const expectedPlace = normalizeToken(parts.village || parts.city);
  if (
    expectedPlace &&
    normalizeToken(resolvedLocality).includes(expectedPlace)
  ) {
    score += 10;
  }

  return {
    score,
    resolvedLocality,
    resolvedDistrict,
    resolvedState,
    resolvedCountry,
    isTooBroad: isOnlyBroadArea,
    districtMismatch,
    stateMismatch,
  };
}

/**
 * Resolves profile locality/city/district/state using Google Maps Geocoding API + Firestore cache.
 * Never invents coordinates when resolution fails or is unreliable.
 */
async function resolveProfileCoordinates(
  db: FirebaseFirestore.Firestore,
  churchId: string,
  parts: ProfileAddressParts,
  apiKey: string
): Promise<{ payload: GeocodeCachePayload; fromCache: boolean }> {
  if (!parts.queryString || !parts.fingerprint) {
    return {
      fromCache: false,
      payload: {
        status: 'failed',
        latitude: null,
        longitude: null,
        formattedAddress: '',
        resolvedLocality: parts.village || parts.city,
        resolvedDistrict: parts.district,
        resolvedState: parts.state,
        resolvedCountry: parts.country,
        googleResultType: '',
        googleLocationType: '',
        placeId: '',
        geohash: '',
        geocodingNote: 'No village, city, district, or postal code present on profile.',
        ambiguousCount: 0,
      },
    };
  }

  const cacheRef = db
    .collection('churches')
    .doc(churchId)
    .collection('geocodeCache')
    .doc(parts.fingerprint);

  try {
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const c = cacheSnap.data() || {};
      if (c.status && c.status !== 'pending') {
        return {
          fromCache: true,
          payload: {
            status: c.status as GeocodingStatus,
            latitude: typeof c.latitude === 'number' ? c.latitude : null,
            longitude: typeof c.longitude === 'number' ? c.longitude : null,
            formattedAddress: cleanStr(c.formattedAddress),
            resolvedLocality: cleanStr(c.resolvedLocality),
            resolvedDistrict: cleanStr(c.resolvedDistrict),
            resolvedState: cleanStr(c.resolvedState),
            resolvedCountry: cleanStr(c.resolvedCountry),
            googleResultType: cleanStr(c.googleResultType),
            googleLocationType: cleanStr(c.googleLocationType),
            placeId: cleanStr(c.placeId),
            geohash: cleanStr(c.geohash),
            geocodingNote: cleanStr(c.geocodingNote),
            ambiguousCount: Number(c.ambiguousCount || 0),
          },
        };
      }
    }
  } catch (cacheReadErr) {
    console.warn('Geocode cache read warning:', cacheReadErr);
  }

  if (!apiKey) {
    return {
      fromCache: false,
      payload: {
        status: 'pending',
        latitude: null,
        longitude: null,
        formattedAddress: parts.queryString,
        resolvedLocality: parts.village || parts.city,
        resolvedDistrict: parts.district,
        resolvedState: parts.state,
        resolvedCountry: parts.country,
        googleResultType: '',
        googleLocationType: '',
        placeId: '',
        geohash: '',
        geocodingNote: 'GOOGLE_MAPS_GEOCODING_KEY secret is not configured yet.',
        ambiguousCount: 0,
      },
    };
  }

  try {
    const params: Record<string, string> = {
      address: parts.queryString,
      key: apiKey,
    };
    if (parts.country.toLowerCase() === 'india') {
      params.region = 'in';
    }

    const resp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params,
      timeout: 8000,
    });

    const data = resp.data || {};
    const apiStatus = String(data.status || '');
    const results: any[] = Array.isArray(data.results) ? data.results : [];

    if (apiStatus !== 'OK' || results.length === 0) {
      const failedPayload: GeocodeCachePayload = {
        status: 'failed',
        latitude: null,
        longitude: null,
        formattedAddress: '',
        resolvedLocality: parts.village || parts.city,
        resolvedDistrict: parts.district,
        resolvedState: parts.state,
        resolvedCountry: parts.country,
        googleResultType: apiStatus,
        googleLocationType: '',
        placeId: '',
        geohash: '',
        geocodingNote:
          apiStatus === 'ZERO_RESULTS'
            ? `Google Maps found no match for "${parts.queryString}".`
            : `Geocoding returned status ${apiStatus || 'UNKNOWN'}.`,
        ambiguousCount: 0,
      };
      await cacheRef.set(
        sanitizeFirestoreMap({
          ...failedPayload,
          queryString: parts.queryString,
          fingerprint: parts.fingerprint,
          updatedAt: FieldValue.serverTimestamp(),
        }),
        { merge: true }
      );
      return { fromCache: false, payload: failedPayload };
    }

    const scored = results
      .map((candidate) => ({
        candidate,
        eval: scoreGeocodeCandidate(candidate, parts),
      }))
      .sort((a, b) => b.eval.score - a.eval.score);

    const best = scored[0];
    if (!best) {
      return {
        fromCache: false,
        payload: {
          status: 'failed',
          latitude: null,
          longitude: null,
          formattedAddress: '',
          resolvedLocality: parts.village || parts.city,
          resolvedDistrict: parts.district,
          resolvedState: parts.state,
          resolvedCountry: parts.country,
          googleResultType: '',
          googleLocationType: '',
          placeId: '',
          geohash: '',
          geocodingNote: 'No geocoding candidates returned.',
          ambiguousCount: 0,
        },
      };
    }
    const lat = best.candidate?.geometry?.location?.lat;
    const lng = best.candidate?.geometry?.location?.lng;
    const locType = cleanStr(best.candidate?.geometry?.location_type);
    const resultTypes = Array.isArray(best.candidate?.types)
      ? best.candidate.types.join(',')
      : '';

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      best.eval.isTooBroad ||
      best.eval.stateMismatch
    ) {
      const reason = best.eval.stateMismatch
        ? `Resolved state (${best.eval.resolvedState}) did not match profile state (${parts.state}).`
        : 'Google Maps returned only a broad state/country match.';
      const failedPayload: GeocodeCachePayload = {
        status: 'failed',
        latitude: null,
        longitude: null,
        formattedAddress: cleanStr(best.candidate?.formatted_address),
        resolvedLocality: best.eval.resolvedLocality,
        resolvedDistrict: best.eval.resolvedDistrict,
        resolvedState: best.eval.resolvedState,
        resolvedCountry: best.eval.resolvedCountry,
        googleResultType: resultTypes,
        googleLocationType: locType,
        placeId: cleanStr(best.candidate?.place_id),
        geohash: '',
        geocodingNote: reason,
        ambiguousCount: results.length,
      };
      await cacheRef.set(
        sanitizeFirestoreMap({
          ...failedPayload,
          queryString: parts.queryString,
          fingerprint: parts.fingerprint,
          updatedAt: FieldValue.serverTimestamp(),
        }),
        { merge: true }
      );
      return { fromCache: false, payload: failedPayload };
    }

    const hasVillageWithoutDistrict = Boolean(parts.village && !parts.district && results.length > 1);
    const status: GeocodingStatus =
      best.eval.districtMismatch || hasVillageWithoutDistrict
        ? 'needs_review'
        : 'completed';

    const noteParts: string[] = [];
    if (best.eval.districtMismatch) {
      noteParts.push(
        `Matched "${best.eval.resolvedDistrict}" while profile states district "${parts.district}".`
      );
    } else if (hasVillageWithoutDistrict) {
      noteParts.push(
        `Multiple locations matched "${parts.village}"; verify district.`
      );
    }

    const resolvedPayload: GeocodeCachePayload = {
      status,
      latitude: lat,
      longitude: lng,
      formattedAddress: cleanStr(best.candidate?.formatted_address),
      resolvedLocality: best.eval.resolvedLocality,
      resolvedDistrict: best.eval.resolvedDistrict,
      resolvedState: best.eval.resolvedState,
      resolvedCountry: best.eval.resolvedCountry,
      googleResultType: resultTypes,
      googleLocationType: locType,
      placeId: cleanStr(best.candidate?.place_id),
      geohash: encodeGeohash(lat, lng, 9),
      geocodingNote: noteParts.join(' '),
      ambiguousCount: results.length,
    };

    await cacheRef.set(
      sanitizeFirestoreMap({
        ...resolvedPayload,
        queryString: parts.queryString,
        fingerprint: parts.fingerprint,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      { merge: true }
    );

    return { fromCache: false, payload: resolvedPayload };
  } catch (err: any) {
    console.error('Google Maps geocoding error:', err?.message || err);
    return {
      fromCache: false,
      payload: {
        status: 'failed',
        latitude: null,
        longitude: null,
        formattedAddress: '',
        resolvedLocality: parts.village || parts.city,
        resolvedDistrict: parts.district,
        resolvedState: parts.state,
        resolvedCountry: parts.country,
        googleResultType: '',
        googleLocationType: '',
        placeId: '',
        geohash: '',
        geocodingNote: 'Geocoding request failed; please retry sync later.',
        ambiguousCount: 0,
      },
    };
  }
}

/**
 * Checks whether caller UID is an authorized Church Admin or Care Cell Leader for `churchId`.
 */
async function assertAdminOrLeader(
  db: FirebaseFirestore.Firestore,
  churchId: string,
  uid: string
): Promise<{ isAdmin: boolean; leaderCellIds: Set<string> }> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  let isAdmin = false;
  const platformSnap = await db.collection('platform_admins').doc(uid).get();
  if (platformSnap.exists) {
    isAdmin = true;
  }

  if (!isAdmin) {
    const memberSnap = await db
      .collection('churches')
      .doc(churchId)
      .collection('members')
      .doc(uid)
      .get();
    if (memberSnap.exists && ADMIN_ROLES.has(cleanStr(memberSnap.data()?.userType))) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    const userSnap = await db.collection('users').doc(uid).get();
    if (userSnap.exists) {
      const uData = userSnap.data() || {};
      const uRole = cleanStr(uData.userType);
      const uChurch = cleanStr(uData.churchId || uData.primaryChurchId);
      if (
        ADMIN_ROLES.has(uRole) &&
        (uChurch === churchId || uRole.toLowerCase() === 'super_admin' || uRole === 'Super Admin')
      ) {
        isAdmin = true;
      }
    }
  }

  if (!isAdmin) {
    const churchSnap = await db.collection('churches').doc(churchId).get();
    const parentChurchId = cleanStr(churchSnap.data()?.parentChurchId);
    if (parentChurchId) {
      const parentMemberSnap = await db
        .collection('churches')
        .doc(parentChurchId)
        .collection('members')
        .doc(uid)
        .get();
      if (
        parentMemberSnap.exists &&
        ADMIN_ROLES.has(cleanStr(parentMemberSnap.data()?.userType))
      ) {
        isAdmin = true;
      }
    }
  }

  const leaderCellIds = new Set<string>();
  if (!isAdmin) {
    const [leaderCells, assistantCells] = await Promise.all([
      db
        .collection('churches')
        .doc(churchId)
        .collection('careCells')
        .where('leaderId', '==', uid)
        .get(),
      db
        .collection('churches')
        .doc(churchId)
        .collection('careCells')
        .where('assistantLeaderId', '==', uid)
        .get(),
    ]);
    leaderCells.docs.forEach((d) => leaderCellIds.add(d.id));
    assistantCells.docs.forEach((d) => leaderCellIds.add(d.id));
  }

  if (!isAdmin && leaderCellIds.size === 0) {
    throw new HttpsError(
      'permission-denied',
      'Only authorized Church Admins or Care Cell Leaders of this church can access member locations.'
    );
  }

  return { isAdmin, leaderCellIds };
}

/**
 * Syncs a single member document's location record while preserving verified member home pin.
 */
async function syncSingleMemberLocationDoc(
  db: FirebaseFirestore.Firestore,
  churchId: string,
  memberId: string,
  memberData: Record<string, any>,
  apiKey: string,
  careCellMeta?: {
    careCellId?: string;
    careCellName?: string;
    careCellLeaderId?: string;
    careCellLeaderName?: string;
    careCellLeaderPhone?: string;
  }
): Promise<{ geocoded: boolean; fromCache: boolean; status: GeocodingStatus }> {
  const locRef = db
    .collection('churches')
    .doc(churchId)
    .collection('memberLocations')
    .doc(memberId);

  const existingSnap = await locRef.get();
  const existing = existingSnap.exists ? existingSnap.data() || {} : {};
  const parts = extractProfileAddressParts(memberData);

  const memberName =
    cleanStr(memberData.name) ||
    `${cleanStr(memberData.firstName)} ${cleanStr(memberData.lastName)}`.trim() ||
    'Member';

  const existingFingerprint = cleanStr(existing.addressFingerprint);
  const existingHasCoords =
    typeof existing.latitude === 'number' && typeof existing.longitude === 'number';
  const needsGeocode =
    !existingSnap.exists ||
    existingFingerprint !== parts.fingerprint ||
    (parts.fingerprint !== '' && !existingHasCoords && existing.geocodingStatus !== 'failed') ||
    (parts.fingerprint !== '' && existing.geocodingStatus === 'pending' && apiKey !== '');

  let geocodeStatus: GeocodingStatus = (existing.geocodingStatus as GeocodingStatus) || 'pending';
  let latitude: number | null =
    typeof existing.latitude === 'number' ? existing.latitude : null;
  let longitude: number | null =
    typeof existing.longitude === 'number' ? existing.longitude : null;
  let formattedAddress = cleanStr(existing.formattedAddress);
  let resolvedLocality = cleanStr(existing.resolvedLocality);
  let resolvedDistrict = cleanStr(existing.resolvedDistrict);
  let resolvedState = cleanStr(existing.resolvedState);
  let resolvedCountry = cleanStr(existing.resolvedCountry);
  let googleResultType = cleanStr(existing.googleResultType);
  let googleLocationType = cleanStr(existing.googleLocationType);
  let placeId = cleanStr(existing.placeId);
  let geohash = cleanStr(existing.geohash);
  let geocodingNote = cleanStr(existing.geocodingNote);
  let fromCache = false;
  let geocodedNow = false;

  if (needsGeocode) {
    const resolved = await resolveProfileCoordinates(db, churchId, parts, apiKey);
    fromCache = resolved.fromCache;
    geocodedNow = true;
    geocodeStatus = resolved.payload.status;
    latitude = resolved.payload.latitude;
    longitude = resolved.payload.longitude;
    formattedAddress = resolved.payload.formattedAddress;
    resolvedLocality = resolved.payload.resolvedLocality;
    resolvedDistrict = resolved.payload.resolvedDistrict;
    resolvedState = resolved.payload.resolvedState;
    resolvedCountry = resolved.payload.resolvedCountry;
    googleResultType = resolved.payload.googleResultType;
    googleLocationType = resolved.payload.googleLocationType;
    placeId = resolved.payload.placeId;
    geohash = resolved.payload.geohash;
    geocodingNote = resolved.payload.geocodingNote;
  }

  // Preserve verified pin if member already confirmed home location with consent
  const hasConfirmedPin =
    existing.locationSharingConsent === true &&
    typeof existing.confirmedLatitude === 'number' &&
    typeof existing.confirmedLongitude === 'number';

  const effectiveAccuracy: LocationAccuracy = hasConfirmedPin
    ? 'verified_home'
    : typeof latitude === 'number' && typeof longitude === 'number'
      ? 'village_approximate'
      : 'not_verified';

  const effectiveSource: LocationSource = hasConfirmedPin
    ? 'member_confirmed_pin'
    : 'profile_geocoding';

  // Effective geohash prefers verified home pin when consented, otherwise geocoded village/city
  const effectiveGeohash = hasConfirmedPin
    ? cleanStr(existing.confirmedGeohash) ||
      encodeGeohash(existing.confirmedLatitude, existing.confirmedLongitude, 9)
    : geohash;

  const updatePayload: Record<string, any> = {
    memberId,
    uid: cleanStr(memberData.uid) || undefined,
    churchId,
    memberName,
    profileImage: cleanStr(memberData.profileImage || memberData.photoUrl || memberData.avatarUrl) || undefined,
    phone: cleanStr(memberData.phone || memberData.phoneNumber) || undefined,
    village: parts.village || undefined,
    city: parts.city || undefined,
    district: parts.district || undefined,
    state: parts.state || undefined,
    country: parts.country,
    postalCode: parts.postalCode || undefined,
    residentialAddress: parts.residentialAddress || undefined,
    addressFingerprint: parts.fingerprint,
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
    formattedAddress: formattedAddress || undefined,
    resolvedLocality: resolvedLocality || undefined,
    resolvedDistrict: resolvedDistrict || undefined,
    resolvedState: resolvedState || undefined,
    resolvedCountry: resolvedCountry || undefined,
    googleResultType: googleResultType || undefined,
    googleLocationType: googleLocationType || undefined,
    placeId: placeId || undefined,
    geohash: effectiveGeohash || undefined,
    geocodingStatus: geocodeStatus,
    geocodingNote: geocodingNote || undefined,
    locationSource: effectiveSource,
    locationAccuracy: effectiveAccuracy,
    locationSharingConsent: Boolean(existing.locationSharingConsent === true),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (geocodedNow && geocodeStatus !== 'pending') {
    updatePayload.geocodedAt = FieldValue.serverTimestamp();
  }

  if (careCellMeta) {
    updatePayload.careCellId = careCellMeta.careCellId || null;
    updatePayload.careCellName = careCellMeta.careCellName || null;
    updatePayload.careCellLeaderId = careCellMeta.careCellLeaderId || null;
    updatePayload.careCellLeaderName = careCellMeta.careCellLeaderName || null;
    updatePayload.careCellLeaderPhone = careCellMeta.careCellLeaderPhone || null;
  }

  await locRef.set(sanitizeFirestoreMap(updatePayload), { merge: true });
  return { geocoded: geocodedNow, fromCache, status: geocodeStatus };
}

/**
 * Trigger: Auto-syncs and geocodes member location when a Member profile is created/updated/deleted.
 */
export const onChurchMemberLocationWrite = onDocumentWritten(
  {
    document: 'churches/{churchId}/members/{memberId}',
    region: REGION,
    secrets: [GOOGLE_MAPS_GEOCODING_KEY],
  },
  async (event) => {
    const churchId = event.params.churchId;
    const memberId = event.params.memberId;
    const db = getFirestore();

    const afterSnap = event.data?.after;
    if (!afterSnap || !afterSnap.exists) {
      await Promise.allSettled([
        db.collection('churches').doc(churchId).collection('memberLocations').doc(memberId).delete(),
        db
          .collection('churches')
          .doc(churchId)
          .collection('memberLocations')
          .doc(memberId)
          .collection('privateHome')
          .doc('pin')
          .delete(),
      ]);
      return;
    }

    const apiKey = GOOGLE_MAPS_GEOCODING_KEY.value() || '';
    const memberData = afterSnap.data() || {};

    // Look up active care cell membership so care cell link is preserved cleanly
    let careCellMeta:
      | {
          careCellId?: string;
          careCellName?: string;
          careCellLeaderId?: string;
          careCellLeaderName?: string;
          careCellLeaderPhone?: string;
        }
      | undefined;

    try {
      const memSnap = await db
        .collection('churches')
        .doc(churchId)
        .collection('careCellMemberships')
        .where('memberId', '==', memberId)
        .where('membershipStatus', '==', 'Active')
        .limit(1)
        .get();
      if (!memSnap.empty) {
        const md = memSnap.docs[0]?.data() || {};
        const cellId = cleanStr(md.cellId);
        if (cellId) {
          const cellDoc = await db
            .collection('churches')
            .doc(churchId)
            .collection('careCells')
            .doc(cellId)
            .get();
          const cd = cellDoc.exists ? cellDoc.data() || {} : {};
          careCellMeta = {
            careCellId: cellId,
            careCellName: cleanStr(cd.name || md.cellName),
            careCellLeaderId: cleanStr(cd.leaderId),
            careCellLeaderName: cleanStr(cd.leaderName),
            careCellLeaderPhone: cleanStr(cd.leaderPhone),
          };
        }
      }
    } catch (_) {
      // Non-fatal
    }

    await syncSingleMemberLocationDoc(db, churchId, memberId, memberData, apiKey, careCellMeta);
  }
);

/**
 * Trigger: Syncs Care Cell assignment & leader metadata onto memberLocations/{memberId}.
 */
export const onCareCellMembershipLocationSync = onDocumentWritten(
  {
    document: 'churches/{churchId}/careCellMemberships/{membershipId}',
    region: REGION,
  },
  async (event) => {
    const churchId = event.params.churchId;
    const afterData = event.data?.after?.data();
    const beforeData = event.data?.before?.data();
    const memberId = cleanStr(afterData?.memberId || beforeData?.memberId);
    if (!memberId) return;

    const db = getFirestore();
    const locRef = db
      .collection('churches')
      .doc(churchId)
      .collection('memberLocations')
      .doc(memberId);

    const activeSnap = await db
      .collection('churches')
      .doc(churchId)
      .collection('careCellMemberships')
      .where('memberId', '==', memberId)
      .where('membershipStatus', '==', 'Active')
      .limit(1)
      .get();

    if (activeSnap.empty) {
      await locRef.set(
        {
          careCellId: null,
          careCellName: null,
          careCellLeaderId: null,
          careCellLeaderName: null,
          careCellLeaderPhone: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const membership = activeSnap.docs[0]?.data() || {};
    const cellId = cleanStr(membership.cellId);
    let cellData: Record<string, any> = {};
    if (cellId) {
      const cellDoc = await db
        .collection('churches')
        .doc(churchId)
        .collection('careCells')
        .doc(cellId)
        .get();
      if (cellDoc.exists) cellData = cellDoc.data() || {};
    }

    await locRef.set(
      {
        careCellId: cellId || null,
        careCellName: cleanStr(cellData.name || membership.cellName) || null,
        careCellLeaderId: cleanStr(cellData.leaderId) || null,
        careCellLeaderName: cleanStr(cellData.leaderName) || null,
        careCellLeaderPhone: cleanStr(cellData.leaderPhone) || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);

/**
 * Trigger: Updates visit status badges (lastVisitDate, upcomingVisitStatus) on memberLocations/{memberId}.
 */
export const onCareCellVisitLocationSync = onDocumentWritten(
  {
    document: 'churches/{churchId}/careCellVisits/{visitId}',
    region: REGION,
  },
  async (event) => {
    const churchId = event.params.churchId;
    const visitId = event.params.visitId;
    const afterSnap = event.data?.after;
    const beforeData = event.data?.before?.data() || {};
    const afterData = afterSnap?.exists ? afterSnap.data() || {} : null;

    const affectedIds = new Set<string>();
    const collectIds = (docData: Record<string, any> | null) => {
      if (!docData) return;
      if (Array.isArray(docData.targetMemberIds)) {
        docData.targetMemberIds.forEach((id: any) => {
          const val = cleanStr(id);
          if (val) affectedIds.add(val);
        });
      }
      if (docData.responses && typeof docData.responses === 'object') {
        Object.keys(docData.responses).forEach((k) => {
          const val = cleanStr(docData.responses[k]?.memberId || k);
          if (val) affectedIds.add(val);
        });
      }
    };
    collectIds(beforeData);
    collectIds(afterData);

    if (affectedIds.size === 0) return;

    const db = getFirestore();
    const visitDate = cleanStr(afterData?.visitDate);
    const visitTime = cleanStr(afterData?.visitTime);
    const status = cleanStr(afterData?.status);

    await Promise.allSettled(
      Array.from(affectedIds).map(async (memberId) => {
        const locRef = db
          .collection('churches')
          .doc(churchId)
          .collection('memberLocations')
          .doc(memberId);

        if (!afterData || status === 'Cancelled') {
          await locRef.set(
            {
              upcomingVisitId: null,
              upcomingVisitDate: null,
              upcomingVisitTime: null,
              upcomingVisitStatus: status === 'Cancelled' ? null : undefined,
              requiresFollowup: false,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return;
        }

        if (status === 'Completed') {
          await locRef.set(
            {
              lastVisitDate: visitDate || new Date().toISOString().slice(0, 10),
              upcomingVisitId: null,
              upcomingVisitDate: null,
              upcomingVisitTime: null,
              upcomingVisitStatus: null,
              requiresFollowup: false,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return;
        }

        const memberResp = afterData.responses?.[memberId]?.response;
        const effectiveVisitStatus =
          status === 'Declined' || memberResp === 'Declined'
            ? 'Declined'
            : status === 'Confirmed' || memberResp === 'Accepted'
              ? 'Confirmed'
              : status || 'Scheduled';

        await locRef.set(
          sanitizeFirestoreMap({
            upcomingVisitId: visitId,
            upcomingVisitDate: visitDate || undefined,
            upcomingVisitTime: visitTime || undefined,
            upcomingVisitStatus: effectiveVisitStatus,
            requiresFollowup: effectiveVisitStatus === 'Declined',
            updatedAt: FieldValue.serverTimestamp(),
          }),
          { merge: true }
        );
      })
    );
  }
);

/**
 * Callable: Batch syncs & geocodes existing church member profiles into memberLocations.
 */
export const syncChurchMemberLocations = onCall(
  {
    region: REGION,
    secrets: [GOOGLE_MAPS_GEOCODING_KEY],
    timeoutSeconds: 180,
  },
  async (request) => {
    const uid = request.auth?.uid || '';
    const churchId = cleanStr(request.data?.churchId);
    const forceRefresh = Boolean(request.data?.forceRefresh);

    if (!churchId) {
      throw new HttpsError('invalid-argument', 'churchId is required.');
    }

    const db = getFirestore();
    const { isAdmin, leaderCellIds } = await assertAdminOrLeader(db, churchId, uid);
    const apiKey = GOOGLE_MAPS_GEOCODING_KEY.value() || '';

    const [membersSnap, membershipsSnap, cellsSnap, existingLocsSnap] = await Promise.all([
      db.collection('churches').doc(churchId).collection('members').get(),
      db
        .collection('churches')
        .doc(churchId)
        .collection('careCellMemberships')
        .where('membershipStatus', '==', 'Active')
        .get(),
      db.collection('churches').doc(churchId).collection('careCells').get(),
      db.collection('churches').doc(churchId).collection('memberLocations').get(),
    ]);

    const cellMap = new Map<string, Record<string, any>>();
    cellsSnap.docs.forEach((d) => cellMap.set(d.id, d.data() || {}));

    const membershipByMemberId = new Map<
      string,
      {
        careCellId?: string;
        careCellName?: string;
        careCellLeaderId?: string;
        careCellLeaderName?: string;
        careCellLeaderPhone?: string;
      }
    >();

    membershipsSnap.docs.forEach((d) => {
      const md = d.data() || {};
      const mId = cleanStr(md.memberId);
      const cId = cleanStr(md.cellId);
      if (!mId || !cId) return;
      const cell = cellMap.get(cId) || {};
      membershipByMemberId.set(mId, {
        careCellId: cId,
        careCellName: cleanStr(cell.name || md.cellName),
        careCellLeaderId: cleanStr(cell.leaderId),
        careCellLeaderName: cleanStr(cell.leaderName),
        careCellLeaderPhone: cleanStr(cell.leaderPhone),
      });
    });

    const existingLocMap = new Map<string, Record<string, any>>();
    existingLocsSnap.docs.forEach((d) => existingLocMap.set(d.id, d.data() || {}));

    let syncedCount = 0;
    let geocodedFromApi = 0;
    let reusedCache = 0;
    let needsReviewCount = 0;
    let failedCount = 0;

    for (const mDoc of membersSnap.docs) {
      const memberData = mDoc.data() || {};
      const cellMeta = membershipByMemberId.get(mDoc.id);

      // Leaders can sync members belonging to their own care cells
      if (!isAdmin && (!cellMeta?.careCellId || !leaderCellIds.has(cellMeta.careCellId))) {
        continue;
      }

      if (forceRefresh && existingLocMap.has(mDoc.id)) {
        await db
          .collection('churches')
          .doc(churchId)
          .collection('memberLocations')
          .doc(mDoc.id)
          .set({ addressFingerprint: '__force_refresh__' }, { merge: true });
      }

      const res = await syncSingleMemberLocationDoc(
        db,
        churchId,
        mDoc.id,
        memberData,
        apiKey,
        cellMeta
      );

      syncedCount += 1;
      if (res.geocoded) {
        if (res.fromCache) reusedCache += 1;
        else if (apiKey) geocodedFromApi += 1;
      }
      if (res.status === 'needs_review') needsReviewCount += 1;
      if (res.status === 'failed') failedCount += 1;
    }

    return {
      totalMembers: membersSnap.size,
      syncedCount,
      geocodedFromApi,
      reusedCache,
      needsReviewCount,
      failedCount,
      geocodingKeyConfigured: Boolean(apiKey),
    };
  }
);

/**
 * Callable: Allows a member (or church admin) to confirm, edit, or revoke their exact home location pin.
 */
export const saveMemberHomeLocationPin = onCall(
  { region: REGION },
  async (request) => {
    const uid = request.auth?.uid || '';
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const churchId = cleanStr(request.data?.churchId);
    const memberId = cleanStr(request.data?.memberId);
    const action = cleanStr(request.data?.action || 'save'); // 'save' | 'revoke'

    if (!churchId || !memberId) {
      throw new HttpsError('invalid-argument', 'churchId and memberId are required.');
    }

    const db = getFirestore();
    const memberRef = db
      .collection('churches')
      .doc(churchId)
      .collection('members')
      .doc(memberId);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      throw new HttpsError('not-found', 'Member profile not found.');
    }

    const memberData = memberSnap.data() || {};
    const authPhoneLast10 = normalizePhoneLast10(request.auth?.token?.phone_number);
    const memberPhoneLast10 = normalizePhoneLast10(memberData.phone || memberData.phoneNumber);

    const isSelfOwner =
      uid === memberId ||
      cleanStr(memberData.uid) === uid ||
      Boolean(authPhoneLast10 && memberPhoneLast10 && authPhoneLast10 === memberPhoneLast10);

    if (!isSelfOwner) {
      const { isAdmin } = await assertAdminOrLeader(db, churchId, uid);
      if (!isAdmin) {
        throw new HttpsError('permission-denied', 'Not authorized to update this member home pin.');
      }
    }

    const locRef = db
      .collection('churches')
      .doc(churchId)
      .collection('memberLocations')
      .doc(memberId);
    const privateRef = locRef.collection('privateHome').doc('pin');
    const existingLoc = (await locRef.get()).data() || {};

    if (action === 'revoke' || request.data?.locationSharingConsent === false) {
      const hasProfileCoords =
        typeof existingLoc.latitude === 'number' && typeof existingLoc.longitude === 'number';
      const fallbackGeohash = hasProfileCoords
        ? encodeGeohash(existingLoc.latitude, existingLoc.longitude, 9)
        : FieldValue.delete();

      await Promise.all([
        locRef.set(
          {
            locationSharingConsent: false,
            locationSource: 'profile_geocoding',
            locationAccuracy: hasProfileCoords ? 'village_approximate' : 'not_verified',
            geohash: fallbackGeohash,
            confirmedLatitude: FieldValue.delete(),
            confirmedLongitude: FieldValue.delete(),
            confirmedGeohash: FieldValue.delete(),
            completeAddress: FieldValue.delete(),
            landmark: FieldValue.delete(),
            confirmedAt: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
        privateRef.delete().catch(() => {}),
      ]);

      return { ok: true, revoked: true };
    }

    const latitude = Number(request.data?.latitude);
    const longitude = Number(request.data?.longitude);
    const completeAddress = cleanStr(request.data?.completeAddress);
    const landmark = cleanStr(request.data?.landmark);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new HttpsError('invalid-argument', 'Valid latitude and longitude are required.');
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new HttpsError('invalid-argument', 'Coordinates out of valid range.');
    }

    const confirmedGeohash = encodeGeohash(latitude, longitude, 9);
    const parts = extractProfileAddressParts(memberData);

    await Promise.all([
      locRef.set(
        sanitizeFirestoreMap({
          memberId,
          uid: cleanStr(memberData.uid || uid),
          churchId,
          memberName:
            cleanStr(memberData.name) ||
            `${cleanStr(memberData.firstName)} ${cleanStr(memberData.lastName)}`.trim() ||
            'Member',
          phone: cleanStr(memberData.phone || memberData.phoneNumber) || undefined,
          village: parts.village || undefined,
          city: parts.city || undefined,
          district: parts.district || undefined,
          state: parts.state || undefined,
          country: parts.country,
          locationSource: 'member_confirmed_pin',
          locationAccuracy: 'verified_home',
          locationSharingConsent: true,
          confirmedLatitude: latitude,
          confirmedLongitude: longitude,
          confirmedGeohash,
          geohash: confirmedGeohash,
          completeAddress: completeAddress || undefined,
          landmark: landmark || undefined,
          confirmedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        { merge: true }
      ),
      privateRef.set(
        sanitizeFirestoreMap({
          memberId,
          churchId,
          latitude,
          longitude,
          completeAddress,
          landmark,
          locationSharingConsent: true,
          locationAccuracy: 'verified_home',
          updatedAt: FieldValue.serverTimestamp(),
        }),
        { merge: true }
      ),
    ]);

    return {
      ok: true,
      confirmedGeohash,
      locationAccuracy: 'verified_home',
    };
  }
);

/**
 * Callable: Finds nearby church members within radiusKm (1, 2, 5, 10 km) using Geohash bounds + Haversine.
 * Marks village-level coordinates as approximate area matches and enforces consent/church boundaries.
 */
export const findNearbyChurchMembers = onCall(
  { region: REGION },
  async (request) => {
    const uid = request.auth?.uid || '';
    const churchId = cleanStr(request.data?.churchId);
    const centerLat = Number(request.data?.centerLatitude);
    const centerLng = Number(request.data?.centerLongitude);
    const radiusKm = Math.max(0.5, Math.min(50, Number(request.data?.radiusKm || 5)));
    const excludeMemberId = cleanStr(request.data?.excludeMemberId);

    if (!churchId || !Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
      throw new HttpsError(
        'invalid-argument',
        'churchId, centerLatitude, and centerLongitude are required.'
      );
    }

    const db = getFirestore();
    const { isAdmin, leaderCellIds } = await assertAdminOrLeader(db, churchId, uid);

    const bounds = geohashQueryBoundsForRadius(centerLat, centerLng, radiusKm);
    const baseQuery = db.collection('churches').doc(churchId).collection('memberLocations');

    const snapshots = await Promise.all(
      bounds.map((b) =>
        baseQuery.orderBy('geohash').startAt(b.start).endAt(b.end).get()
      )
    );

    const dedupDocs = new Map<string, Record<string, any>>();
    snapshots.forEach((snap) => {
      snap.docs.forEach((d) => dedupDocs.set(d.id, d.data() || {}));
    });

    const matches: Array<Record<string, any>> = [];
    dedupDocs.forEach((loc, docId) => {
      if (excludeMemberId && docId === excludeMemberId) return;

      const cellId = cleanStr(loc.careCellId);
      if (!isAdmin && (!cellId || !leaderCellIds.has(cellId))) {
        return;
      }

      const isConsentedHome =
        loc.locationSharingConsent === true &&
        loc.locationAccuracy === 'verified_home' &&
        typeof loc.confirmedLatitude === 'number' &&
        typeof loc.confirmedLongitude === 'number';

      const lat = isConsentedHome ? loc.confirmedLatitude : loc.latitude;
      const lng = isConsentedHome ? loc.confirmedLongitude : loc.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const distKm = haversineDistanceKm(
        { latitude: centerLat, longitude: centerLng },
        { latitude: lat, longitude: lng }
      );
      if (distKm > radiusKm) return;

      const safeLocation: Record<string, any> = {
        ...loc,
        memberId: docId,
      };
      if (!isConsentedHome) {
        delete safeLocation.confirmedLatitude;
        delete safeLocation.confirmedLongitude;
        delete safeLocation.completeAddress;
        delete safeLocation.landmark;
      }

      matches.push({
        location: safeLocation,
        distanceKm: Number(distKm.toFixed(2)),
        isApproximateDistance: !isConsentedHome,
        effectiveLatitude: lat,
        effectiveLongitude: lng,
      });
    });

    matches.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      radiusKm,
      count: matches.length,
      matches,
    };
  }
);
