import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import { auth } from '../services/firebaseConfig';
import {
  MapPin,
  X,
  Crosshair,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { MemberLocationRecord } from '../types/CareCellTypes';
import {
  MemberLocationService,
  formatMemberAreaText,
} from '../services/MemberLocationService';
import LocationService from '../services/LocationService';

interface MemberHomeLocationModalProps {
  visible: boolean;
  onClose: () => void;
  churchId: string;
  church?: any;
  member: any;
  onUpdated?: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: 15.8281,
  longitude: 78.0373,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/**
 * Optional "My Home Location" modal inside Member Profile.
 * Displays existing Village/City profile data without re-entry and lets the member
 * drop/adjust an exact home pin with explicit sharing consent or revoke it anytime.
 */
export default function MemberHomeLocationModal({
  visible,
  onClose,
  churchId,
  church,
  member,
  onUpdated,
}: MemberHomeLocationModalProps) {
  const mapRef = useRef<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  const [existingRecord, setExistingRecord] = useState<MemberLocationRecord | null>(null);
  const [pinCoords, setPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [completeAddress, setCompleteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [consent, setConsent] = useState(true);

  const memberId = member?.id || member?.uid || auth().currentUser?.uid || '';
  const profileAreaSummary = [
    member?.village,
    member?.city || member?.mailingCity,
    member?.district,
    member?.state || member?.mailingState,
    member?.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    if (!visible || !churchId || !memberId) return;

    let mounted = true;
    const loadExisting = async () => {
      setLoading(true);
      try {
        const rec = await MemberLocationService.getMyHomeLocation(churchId, memberId);
        if (!mounted) return;
        setExistingRecord(rec);

        const initialAddr =
          rec?.completeAddress ||
          member?.residentialAddress ||
          member?.mailingStreet ||
          '';
        setCompleteAddress(initialAddr);
        setLandmark(rec?.landmark || '');

        if (
          rec?.locationSharingConsent &&
          typeof rec.confirmedLatitude === 'number' &&
          typeof rec.confirmedLongitude === 'number'
        ) {
          setConsent(true);
          const coords = {
            latitude: rec.confirmedLatitude,
            longitude: rec.confirmedLongitude,
          };
          setPinCoords(coords);
          setRegion({
            ...coords,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          });
        } else if (
          typeof rec?.latitude === 'number' &&
          typeof rec?.longitude === 'number'
        ) {
          setConsent(rec?.locationSharingConsent ?? true);
          const coords = { latitude: rec.latitude, longitude: rec.longitude };
          setPinCoords(coords);
          setRegion({
            ...coords,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          });
        } else {
          setConsent(true);
          const churchCoords = LocationService.getChurchCoordinates(church || { id: churchId });
          if (churchCoords && mounted) {
            setRegion({
              latitude: churchCoords.latitude,
              longitude: churchCoords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } catch (err) {
        console.warn('Error loading member home location:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadExisting();
    return () => {
      mounted = false;
    };
  }, [visible, churchId, memberId]);

  const handleUseCurrentGps = async () => {
    setLocatingGps(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to center the pin on your current home location, or tap/drag directly on the map.'
        );
        return;
      }

      const current = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setPinCoords(coords);
      const nextRegion: Region = {
        ...coords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 450);
    } catch (err: any) {
      Alert.alert(
        'GPS Unavailable',
        'Could not get exact GPS fix right now. You can tap anywhere on the map to place your pin.'
      );
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSave = async () => {
    if (!churchId || !memberId) return;

    if (!consent) {
      await handleRevokeConfirmed();
      return;
    }

    if (!pinCoords) {
      Alert.alert(
        'Select Home Pin',
        'Please tap on the map or use GPS to place your home pin.'
      );
      return;
    }

    setSaving(true);
    try {
      await MemberLocationService.saveMyHomeLocation({
        churchId,
        memberId,
        memberName:
          member?.name ||
          `${member?.firstName || ''} ${member?.lastName || ''}`.trim() ||
          'Member',
        latitude: pinCoords.latitude,
        longitude: pinCoords.longitude,
        completeAddress,
        landmark,
        village: member?.village,
        city: member?.city || member?.mailingCity,
        district: member?.district,
        state: member?.state || member?.mailingState,
        country: member?.country || 'India',
      });
      Alert.alert(
        'Home Location Saved',
        'Your exact home location has been confirmed for Church Admins and your Care Cell leader.'
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save home location.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeConfirmed = async () => {
    if (!churchId || !memberId) return;
    setSaving(true);
    try {
      await MemberLocationService.revokeMyHomeLocationSharing(churchId, memberId);
      Alert.alert(
        'Home Pin Removed',
        'Exact home location sharing has been revoked. Your existing City/Village profile info will still continue to work.'
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not revoke location sharing.');
    } finally {
      setSaving(false);
    }
  };

  const promptRevoke = () => {
    Alert.alert(
      'Revoke Exact Home Location?',
      'Your exact home pin and residential address will be removed from pastor/leader maps. Your existing City/Village profile info will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Sharing',
          style: 'destructive',
          onPress: handleRevokeConfirmed,
        },
      ]
    );
  };

  const approxCoords =
    typeof existingRecord?.latitude === 'number' &&
    typeof existingRecord?.longitude === 'number'
      ? {
          latitude: existingRecord.latitude,
          longitude: existingRecord.longitude,
        }
      : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIcon}>
                <MapPin size={20} color="#0D9488" />
              </View>
              <View>
                <Text style={styles.headerTitle}>My Home Location</Text>
                <Text style={styles.headerSub}>Optional exact pin for pastoral visits</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#0D9488" />
              <Text style={styles.loadingText}>Loading your saved location...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            >
              {/* Existing Profile Area Card */}
              <View style={styles.profileAreaCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Info size={16} color="#1D4ED8" />
                  <Text style={styles.profileAreaTitle}>Existing Profile Area (Auto-Detected)</Text>
                </View>
                <Text style={styles.profileAreaText}>
                  {profileAreaSummary ||
                    formatMemberAreaText(existingRecord || {}) ||
                    'No Village/City found on profile yet.'}
                </Text>
                <Text style={styles.profileAreaHint}>
                  Even without an exact home pin, Care Cell leaders can locate your general area from your profile.
                </Text>
              </View>

              {/* Map Picker */}
              <View style={styles.mapHeaderRow}>
                <Text style={styles.sectionLabel}>Tap map or drag pin to your home</Text>
                <TouchableOpacity
                  style={styles.gpsBtn}
                  onPress={handleUseCurrentGps}
                  disabled={locatingGps}
                >
                  {locatingGps ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Crosshair size={14} color="#FFFFFF" />
                      <Text style={styles.gpsBtnText}>Use GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.mapBox}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={region}
                  onPress={(e) => {
                    setPinCoords(e.nativeEvent.coordinate);
                  }}
                >
                  {approxCoords && (
                    <Circle
                      center={approxCoords}
                      radius={600}
                      strokeColor="rgba(37,99,235,0.45)"
                      fillColor="rgba(37,99,235,0.10)"
                    />
                  )}
                  {pinCoords && (
                    <Marker
                      coordinate={pinCoords}
                      draggable
                      tracksViewChanges={false}
                      pinColor="#0D9488"
                      title="My Home Pin"
                      description="Hold and drag to adjust"
                      onDragEnd={(e) => {
                        setPinCoords(e.nativeEvent.coordinate);
                      }}
                    />
                  )}
                </MapView>
              </View>

              {pinCoords && (
                <Text style={styles.coordsCaption}>
                  Selected Pin: {pinCoords.latitude.toFixed(5)}, {pinCoords.longitude.toFixed(5)}
                </Text>
              )}

              {/* Address & Landmark Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Complete Residential Address (Optional)</Text>
                <TextInput
                  style={[styles.input, { minHeight: 68, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="House/Door No, Street Name, Colony..."
                  placeholderTextColor="#94A3B8"
                  value={completeAddress}
                  onChangeText={setCompleteAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Water Tank, Opposite Govt School"
                  placeholderTextColor="#94A3B8"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>

              {/* Consent Card */}
              <View style={styles.consentCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color={consent ? '#059669' : '#64748B'} />
                    <Text style={styles.consentTitle}>Share Exact Home Pin</Text>
                  </View>
                  <Text style={styles.consentSub}>
                    Only authorized Church Admins & your assigned Care Cell leaders can view your exact home coordinates.
                  </Text>
                </View>
                <Switch
                  value={consent}
                  onValueChange={setConsent}
                  trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
                />
              </View>

              {/* Save / Revoke Buttons */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>
                      {consent ? 'Confirm & Save Home Location' : 'Save Without Exact Pin'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {existingRecord?.locationSharingConsent && (
                <TouchableOpacity
                  style={styles.revokeBtn}
                  onPress={promptRevoke}
                  disabled={saving}
                >
                  <ShieldOff size={16} color="#DC2626" />
                  <Text style={styles.revokeBtnText}>Revoke Location Sharing</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Platform.OS === 'ios' ? '92%' : '94%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  profileAreaCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  profileAreaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  profileAreaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  profileAreaHint: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mapBox: {
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
  },
  coordsCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  consentSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  revokeBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
