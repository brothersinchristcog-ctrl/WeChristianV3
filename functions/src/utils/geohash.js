/**
 * Pure Base-32 Geohash & Haversine distance utilities for Smart Member Locations.
 * Shared algorithm between Cloud Functions and mobile client.
 */
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const EARTH_RADIUS_KM = 6371.0088;
const toRadians = (degrees) => (degrees * Math.PI) / 180;
/**
 * Calculates great-circle distance in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(a, b) {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);
    const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
/**
 * Encodes (latitude, longitude) into a Base-32 geohash string of given precision.
 */
export function encodeGeohash(latitude, longitude, precision = 9) {
    let latMin = -90.0;
    let latMax = 90.0;
    let lonMin = -180.0;
    let lonMax = 180.0;
    let bit = 0;
    let ch = 0;
    let isEven = true;
    let hash = '';
    while (hash.length < precision) {
        if (isEven) {
            const mid = (lonMin + lonMax) / 2;
            if (longitude >= mid) {
                ch = (ch << 1) | 1;
                lonMin = mid;
            }
            else {
                ch = ch << 1;
                lonMax = mid;
            }
        }
        else {
            const mid = (latMin + latMax) / 2;
            if (latitude >= mid) {
                ch = (ch << 1) | 1;
                latMin = mid;
            }
            else {
                ch = ch << 1;
                latMax = mid;
            }
        }
        isEven = !isEven;
        bit += 1;
        if (bit === 5) {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    return hash;
}
/**
 * Decodes a Base-32 geohash into its bounding box center and deltas.
 */
export function decodeGeohashBounds(geohash) {
    let latMin = -90.0;
    let latMax = 90.0;
    let lonMin = -180.0;
    let lonMax = 180.0;
    let isEven = true;
    for (const char of geohash) {
        const idx = BASE32.indexOf(char);
        if (idx === -1) {
            throw new Error(`Invalid geohash character: ${char}`);
        }
        for (let mask = 16; mask >= 1; mask >>= 1) {
            if (isEven) {
                const mid = (lonMin + lonMax) / 2;
                if (idx & mask) {
                    lonMin = mid;
                }
                else {
                    lonMax = mid;
                }
            }
            else {
                const mid = (latMin + latMax) / 2;
                if (idx & mask) {
                    latMin = mid;
                }
                else {
                    latMax = mid;
                }
            }
            isEven = !isEven;
        }
    }
    return {
        latitude: (latMin + latMax) / 2,
        longitude: (lonMin + lonMax) / 2,
        latError: (latMax - latMin) / 2,
        lonError: (lonMax - lonMin) / 2,
    };
}
/**
 * Selects an appropriate geohash prefix precision for a search radius in km.
 * Ensures each cell is roughly comparable to or slightly larger than the radius.
 */
export function precisionForRadiusKm(radiusKm) {
    if (radiusKm <= 1.5)
        return 6; // ~1.22km x 0.61km
    if (radiusKm <= 6)
        return 5; // ~4.89km x 4.89km
    if (radiusKm <= 25)
        return 4; // ~39.1km x 19.5km
    return 3;
}
/**
 * Returns lexicographical `[start, end]` prefix bounds for the 3x3 neighborhood
 * around `(latitude, longitude)` covering at least `radiusKm`.
 */
export function geohashQueryBoundsForRadius(latitude, longitude, radiusKm) {
    const precision = precisionForRadiusKm(radiusKm);
    const centerHash = encodeGeohash(latitude, longitude, precision);
    const decoded = decodeGeohashBounds(centerHash);
    const stepLat = decoded.latError * 2;
    const stepLon = decoded.lonError * 2;
    const latSteps = Math.max(1, Math.ceil(radiusKm / (stepLat * 111.32)));
    const lonKmPerDeg = Math.max(10, Math.cos(toRadians(latitude)) * 111.32);
    const lonSteps = Math.max(1, Math.ceil(radiusKm / (stepLon * lonKmPerDeg)));
    // Cap grid expansion so extreme inputs remain fast
    const clampedLatSteps = Math.min(latSteps, 3);
    const clampedLonSteps = Math.min(lonSteps, 3);
    const uniquePrefixes = new Set();
    for (let dy = -clampedLatSteps; dy <= clampedLatSteps; dy++) {
        const sampleLat = Math.max(-89.9, Math.min(89.9, latitude + dy * stepLat));
        for (let dx = -clampedLonSteps; dx <= clampedLonSteps; dx++) {
            let sampleLon = longitude + dx * stepLon;
            if (sampleLon > 180)
                sampleLon -= 360;
            if (sampleLon < -180)
                sampleLon += 360;
            uniquePrefixes.add(encodeGeohash(sampleLat, sampleLon, precision));
        }
    }
    return Array.from(uniquePrefixes)
        .sort()
        .map((prefix) => ({
        start: prefix,
        end: `${prefix}~`,
    }));
}
//# sourceMappingURL=geohash.js.map