/**
 * Pure Base-32 Geohash & Haversine distance utilities for Smart Member Locations.
 * Shared algorithm between Cloud Functions and mobile client.
 */
export interface LatLng {
    latitude: number;
    longitude: number;
}
export interface GeohashRange {
    start: string;
    end: string;
}
/**
 * Calculates great-circle distance in kilometers using the Haversine formula.
 */
export declare function haversineDistanceKm(a: LatLng, b: LatLng): number;
/**
 * Encodes (latitude, longitude) into a Base-32 geohash string of given precision.
 */
export declare function encodeGeohash(latitude: number, longitude: number, precision?: number): string;
/**
 * Decodes a Base-32 geohash into its bounding box center and deltas.
 */
export declare function decodeGeohashBounds(geohash: string): {
    latitude: number;
    longitude: number;
    latError: number;
    lonError: number;
};
/**
 * Selects an appropriate geohash prefix precision for a search radius in km.
 * Ensures each cell is roughly comparable to or slightly larger than the radius.
 */
export declare function precisionForRadiusKm(radiusKm: number): number;
/**
 * Returns lexicographical `[start, end]` prefix bounds for the 3x3 neighborhood
 * around `(latitude, longitude)` covering at least `radiusKm`.
 */
export declare function geohashQueryBoundsForRadius(latitude: number, longitude: number, radiusKm: number): GeohashRange[];
//# sourceMappingURL=geohash.d.ts.map