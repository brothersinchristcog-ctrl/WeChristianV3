export declare const GOOGLE_MAPS_GEOCODING_KEY: import("firebase-functions/params").SecretParam;
export type LocationSource = 'profile_geocoding' | 'member_confirmed_pin';
export type LocationAccuracy = 'verified_home' | 'village_approximate' | 'not_verified';
export type GeocodingStatus = 'pending' | 'completed' | 'failed' | 'needs_review';
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
/**
 * Builds deterministic normalized address parts and SHA-256 fingerprint from existing profile fields.
 * Reuses village, city/mailingCity, district, state/mailingState, postalCode, country, mailingStreet/address.
 */
export declare function extractProfileAddressParts(member: Record<string, any>): ProfileAddressParts;
/**
 * Trigger: Auto-syncs and geocodes member location when a Member profile is created/updated/deleted.
 */
export declare const onChurchMemberLocationWrite: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    churchId: string;
    memberId: string;
}>>;
/**
 * Trigger: Syncs Care Cell assignment & leader metadata onto memberLocations/{memberId}.
 */
export declare const onCareCellMembershipLocationSync: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    churchId: string;
    membershipId: string;
}>>;
/**
 * Trigger: Updates visit status badges (lastVisitDate, upcomingVisitStatus) on memberLocations/{memberId}.
 */
export declare const onCareCellVisitLocationSync: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    churchId: string;
    visitId: string;
}>>;
/**
 * Callable: Batch syncs & geocodes existing church member profiles into memberLocations.
 */
export declare const syncChurchMemberLocations: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    totalMembers: number;
    syncedCount: number;
    geocodedFromApi: number;
    reusedCache: number;
    needsReviewCount: number;
    failedCount: number;
    geocodingKeyConfigured: boolean;
}>, unknown>;
/**
 * Callable: Allows a member (or church admin) to confirm, edit, or revoke their exact home location pin.
 */
export declare const saveMemberHomeLocationPin: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    revoked: boolean;
    confirmedGeohash?: never;
    locationAccuracy?: never;
} | {
    ok: boolean;
    confirmedGeohash: string;
    locationAccuracy: string;
    revoked?: never;
}>, unknown>;
/**
 * Callable: Finds nearby church members within radiusKm (1, 2, 5, 10 km) using Geohash bounds + Haversine.
 * Marks village-level coordinates as approximate area matches and enforces consent/church boundaries.
 */
export declare const findNearbyChurchMembers: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    radiusKm: number;
    count: number;
    matches: Record<string, any>[];
}>, unknown>;
export {};
//# sourceMappingURL=memberLocations.d.ts.map