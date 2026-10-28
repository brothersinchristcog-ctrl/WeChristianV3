import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationValidationResult {
  allowed: boolean;
  distanceMeters?: number;
  reason?: string;
  memberCoords?: Coordinates;
  churchCoords?: Coordinates;
}

class LocationService {
  /**
   * Request foreground location permission and fetch current device position
   */
  async getCurrentLocation(): Promise<{ success: boolean; coords?: Coordinates; error?: string }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Location permission is required to verify that you are at the church.',
        };
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          success: false,
          error: 'Please enable Location / GPS services on your device.',
        };
      }

      let location: Location.LocationObject | null = null;
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 7000)
          ),
        ]) as Location.LocationObject;
      } catch (timeoutErr) {
        // Fallback to last known position for quick response
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location || !location.coords) {
        return {
          success: false,
          error: 'Could not determine your current location. Please ensure GPS is enabled.',
        };
      }

      return {
        success: true,
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };
    } catch (err: any) {
      console.warn('[LocationService] Error fetching location:', err);
      return {
        success: false,
        error: err?.message || 'Failed to retrieve location.',
      };
    }
  }

  /**
   * Haversine formula to compute distance in meters between two lat/lng coordinates
   */
  calculateDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Extract registered coordinates from a church object
   */
  getChurchCoordinates(church: any): Coordinates | null {
    if (!church) return null;
    const lat =
      church.latitude ??
      church.lat ??
      church.location?.latitude ??
      church.location?.lat ??
      church.coordinates?.latitude;
    const lng =
      church.longitude ??
      church.lng ??
      church.location?.longitude ??
      church.location?.lng ??
      church.coordinates?.longitude;

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (!isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0) {
      return { latitude: numLat, longitude: numLng };
    }
    return null;
  }

  /**
   * Validates if a member is within the allowed radius (default 100 meters) of the registered church.
   */
  async validateAttendanceLocation(
    church: any,
    allowedRadiusMeters: number = 100
  ): Promise<LocationValidationResult> {
    const churchCoords = this.getChurchCoordinates(church);

    if (!churchCoords) {
      return {
        allowed: false,
        reason: 'CHURCH_NO_COORDINATES',
      };
    }

    const memberLocation = await this.getCurrentLocation();
    if (!memberLocation.success || !memberLocation.coords) {
      return {
        allowed: false,
        reason: memberLocation.error || 'LOCATION_UNAVAILABLE',
        churchCoords,
      };
    }

    const distance = this.calculateDistanceInMeters(
      memberLocation.coords.latitude,
      memberLocation.coords.longitude,
      churchCoords.latitude,
      churchCoords.longitude
    );

    if (distance > allowedRadiusMeters) {
      return {
        allowed: false,
        distanceMeters: Math.round(distance),
        reason: 'OUTSIDE_RADIUS',
        memberCoords: memberLocation.coords,
        churchCoords,
      };
    }

    return {
      allowed: true,
      distanceMeters: Math.round(distance),
      memberCoords: memberLocation.coords,
      churchCoords,
    };
  }
}

export default new LocationService();
