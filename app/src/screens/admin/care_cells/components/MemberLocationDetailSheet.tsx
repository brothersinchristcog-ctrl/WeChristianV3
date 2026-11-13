import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  MapPin,
  Phone,
  Building2,
  User,
  Calendar,
  Navigation,
  Compass,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  UserCheck,
  Car,
  Footprints,
  PlusCircle,
} from 'lucide-react-native';
import * as ExpoLocation from 'expo-location';
import { db } from '../../../../services/firebaseConfig';
import CareCellService from '../../../../services/CareCellService';
import {
  CareCellVisit,
  MemberLocationRecord,
} from '../../../../types/CareCellTypes';
import {
  MemberLocationService,
  TravelMode,
  formatMemberAreaText,
  getEffectiveCoordinates,
  getMemberVisitBadgeStatus,
  getVisitBadgeColor,
  getVisitBadgeLabel,
} from '../../../../services/MemberLocationService';

interface MemberLocationDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  churchId: string;
  members: MemberLocationRecord[];
  groupTitle?: string;
  onScheduleVisit: (selected: MemberLocationRecord[]) => void;
  onFindNearby: (anchor: MemberLocationRecord) => void;
  onAddToPlan: (membersToAdd: MemberLocationRecord[]) => void;
}

type SheetSubView = 'details' | 'profile' | 'history';

export default function MemberLocationDetailSheet({
  visible,
  onClose,
  churchId,
  members,
  groupTitle,
  onScheduleVisit,
  onFindNearby,
  onAddToPlan,
}: MemberLocationDetailSheetProps) {
  const [selectedMember, setSelectedMember] = useState<MemberLocationRecord | null>(null);
  const [subView, setSubView] = useState<SheetSubView>('details');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');

  // Extra profile & history states
  const [fullProfileDoc, setFullProfileDoc] = useState<Record<string, any> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [visitHistory, setVisitHistory] = useState<CareCellVisit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSubView('details');
    setFullProfileDoc(null);
    setVisitHistory([]);
    if (members.length === 1) {
      setSelectedMember(members[0]);
    } else {
      setSelectedMember(null);
    }
  }, [visible, members]);

  const handleOpenProfile = async (mem: MemberLocationRecord) => {
    setSubView('profile');
    setLoadingProfile(true);
    try {
      const snap = await db
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .doc(mem.memberId)
        .get();
      const exists = typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
      setFullProfileDoc(exists ? snap.data() || {} : {});
    } catch (_) {
      setFullProfileDoc({});
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOpenHistory = async (mem: MemberLocationRecord) => {
    setSubView('history');
    setLoadingHistory(true);
    try {
      const list = await CareCellService.getMemberVisitHistory(
        churchId,
        mem.memberId,
        mem.phone
      );
      setVisitHistory(list);
    } catch (_) {
      setVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDirections = async (mem: MemberLocationRecord) => {
    const coords = getEffectiveCoordinates(mem);
    if (!coords) {
      Alert.alert(
        'Location Not Verified',
        'This member does not have verified or resolved map coordinates yet.'
      );
      return;
    }

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
    } catch (_) {
      // Proceed cleanly using Google Maps current device origin
    }

    await MemberLocationService.openGoogleMapsDirections({
      destinationLat: coords.latitude,
      destinationLng: coords.longitude,
      originLat,
      originLng,
      travelMode,
    });
  };

  const renderAccuracyBanner = (mem: MemberLocationRecord) => {
    if (mem.locationAccuracy === 'verified_home' && mem.locationSharingConsent) {
      return (
        <View style={[styles.accBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <CheckCircle2 size={15} color="#059669" />
          <Text style={[styles.accBannerTxt, { color: '#065F46' }]}>
            Verified Home Location (Member Confirmed Pin)
          </Text>
        </View>
      );
    }
    if (mem.locationAccuracy === 'village_approximate') {
      return (
        <View style={[styles.accBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Compass size={15} color="#2563EB" />
          <Text style={[styles.accBannerTxt, { color: '#1E40AF' }]}>
            Village / City Approximate Location (Profile Geocoded)
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.accBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
        <AlertTriangle size={15} color="#DC2626" />
        <Text style={[styles.accBannerTxt, { color: '#991B1B' }]}>
          Location Not Verified{mem.geocodingNote ? ` • ${mem.geocodingNote}` : ''}
        </Text>
      </View>
    );
  };

  const renderVillageList = () => (
    <View style={{ padding: 16 }}>
      <View style={styles.groupBanner}>
        <Text style={styles.groupBannerTitle}>
          {members.length} Members in {groupTitle || formatMemberAreaText(members[0]) || 'this area'}
        </Text>
        <Text style={styles.groupBannerSub}>
          Tap a member to inspect details, or add everyone in this area to a combined visit plan.
        </Text>
        <TouchableOpacity
          style={styles.addAllBtn}
          onPress={() => {
            onAddToPlan(members);
            onClose();
          }}
        >
          <PlusCircle size={15} color="#FFFFFF" />
          <Text style={styles.addAllBtnTxt}>Add All {members.length} to Visit Plan</Text>
        </TouchableOpacity>
      </View>

      {members.map((m) => {
        const badgeStatus = getMemberVisitBadgeStatus(m);
        const badgeColor = getVisitBadgeColor(badgeStatus);
        return (
          <TouchableOpacity
            key={m.memberId}
            style={styles.memberRowCard}
            onPress={() => {
              setSelectedMember(m);
              setSubView('details');
            }}
          >
            {m.profileImage ? (
              <Image source={{ uri: m.profileImage }} style={styles.rowAvatar} />
            ) : (
              <View style={styles.rowAvatarFallback}>
                <Text style={styles.rowAvatarInitial}>
                  {(m.memberName || 'M').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{m.memberName}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {m.careCellName ? `${m.careCellName} • ` : ''}
                {formatMemberAreaText(m) || 'No village info'}
              </Text>
            </View>
            <View style={[styles.statusDotPill, { backgroundColor: `${badgeColor}18` }]}>
              <View style={[styles.dot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.statusDotTxt, { color: badgeColor }]}>
                {m.locationAccuracy === 'verified_home' ? 'Exact' : m.locationAccuracy === 'village_approximate' ? 'Area' : 'N/A'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSingleMember = (mem: MemberLocationRecord) => {
    const badgeStatus = getMemberVisitBadgeStatus(mem);
    const badgeColor = getVisitBadgeColor(badgeStatus);
    const badgeLabel = getVisitBadgeLabel(badgeStatus);
    const canShowExactHome =
      mem.locationAccuracy === 'verified_home' && mem.locationSharingConsent === true;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {members.length > 1 && (
          <TouchableOpacity
            style={styles.backToGroupBtn}
            onPress={() => {
              setSelectedMember(null);
              setSubView('details');
            }}
          >
            <Text style={styles.backToGroupTxt}>← All {members.length} members in area</Text>
          </TouchableOpacity>
        )}

        {/* Top Identity Header */}
        <View style={styles.identityCard}>
          {mem.profileImage ? (
            <Image source={{ uri: mem.profileImage }} style={styles.avatarLg} />
          ) : (
            <View style={styles.avatarLgFallback}>
              <Text style={styles.avatarLgInitial}>
                {(mem.memberName || 'M').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{mem.memberName}</Text>
            {mem.phone ? (
              <TouchableOpacity
                style={styles.phoneRow}
                onPress={() => Linking.openURL(`tel:${mem.phone}`)}
              >
                <Phone size={13} color="#0284C7" />
                <Text style={styles.phoneTxt}>{mem.phone}</Text>
              </TouchableOpacity>
            ) : null}
            <View style={[styles.visitStatusPill, { backgroundColor: `${badgeColor}18`, borderColor: `${badgeColor}44` }]}>
              <View style={[styles.dot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.visitStatusTxt, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>
        </View>

        {renderAccuracyBanner(mem)}

        {/* Navigation Subview Switch */}
        {subView !== 'details' && (
          <TouchableOpacity
            style={styles.backSubBtn}
            onPress={() => setSubView('details')}
          >
            <Text style={styles.backSubTxt}>← Back to Location Summary</Text>
          </TouchableOpacity>
        )}

        {subView === 'profile' ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoSectionTitle}>Full Member Profile</Text>
            {loadingProfile ? (
              <ActivityIndicator size="small" color="#1A2D5A" style={{ marginVertical: 16 }} />
            ) : (
              <>
                <InfoRow label="Full Name" value={fullProfileDoc?.name || mem.memberName} />
                <InfoRow label="Mobile" value={fullProfileDoc?.phone || mem.phone || '—'} />
                <InfoRow label="Email" value={fullProfileDoc?.email || '—'} />
                <InfoRow label="Village" value={mem.village || fullProfileDoc?.village || '—'} />
                <InfoRow label="City" value={mem.city || fullProfileDoc?.city || fullProfileDoc?.mailingCity || '—'} />
                <InfoRow label="District" value={mem.district || fullProfileDoc?.district || '—'} />
                <InfoRow label="State" value={mem.state || fullProfileDoc?.mailingState || '—'} />
                <InfoRow label="Care Cell" value={mem.careCellName || 'Not Assigned'} />
                <InfoRow label="Cell Leader" value={mem.careCellLeaderName || '—'} />
                <InfoRow label="Role" value={fullProfileDoc?.userType || 'Member'} />
              </>
            )}
          </View>
        ) : subView === 'history' ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoSectionTitle}>Pastel & Care Visit History</Text>
            {loadingHistory ? (
              <ActivityIndicator size="small" color="#1A2D5A" style={{ marginVertical: 16 }} />
            ) : visitHistory.length === 0 ? (
              <Text style={styles.emptyHistoryTxt}>No visit records found for this member yet.</Text>
            ) : (
              visitHistory.map((v) => (
                <View key={v.id} style={styles.historyItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.historyTitle}>{v.title}</Text>
                    <Text style={styles.historyStatus}>{v.status}</Text>
                  </View>
                  <Text style={styles.historyMeta}>
                    {v.visitDate} at {v.visitTime} • {v.visitors}
                  </Text>
                  {v.purpose ? <Text style={styles.historyNote}>{v.purpose}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            {/* Address & Care Cell Details */}
            <View style={styles.infoBox}>
              <Text style={styles.infoSectionTitle}>Location & Fellowship Info</Text>
              <InfoRow label="Village" value={mem.village || '—'} />
              <InfoRow label="City" value={mem.city || '—'} />
              <InfoRow label="District" value={mem.district || '—'} />
              <InfoRow label="State" value={mem.state || '—'} />
              {canShowExactHome ? (
                <>
                  <InfoRow
                    label="Home Address"
                    value={mem.completeAddress || mem.residentialAddress || 'Pin confirmed on map'}
                  />
                  {mem.landmark ? <InfoRow label="Landmark" value={mem.landmark} /> : null}
                </>
              ) : (
                <InfoRow
                  label="Address Privacy"
                  value="Exact house address hidden until member shares home pin"
                />
              )}
              <InfoRow label="Care Cell" value={mem.careCellName || 'Unassigned'} />
              <InfoRow label="Cell Leader" value={mem.careCellLeaderName || '—'} />
              <InfoRow label="Last Visit" value={mem.lastVisitDate || 'No completed visit yet'} />
              <InfoRow
                label="Upcoming Visit"
                value={
                  mem.upcomingVisitDate
                    ? `${mem.upcomingVisitDate}${mem.upcomingVisitTime ? ` at ${mem.upcomingVisitTime}` : ''} (${mem.upcomingVisitStatus || 'Scheduled'})`
                    : 'None scheduled'
                }
              />
            </View>

            {/* Directions Mode Toggle */}
            <View style={styles.travelModeRow}>
              <Text style={styles.travelLabel}>Directions Mode:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.modeChip, travelMode === 'driving' && styles.modeChipActive]}
                  onPress={() => setTravelMode('driving')}
                >
                  <Car size={13} color={travelMode === 'driving' ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.modeTxt, travelMode === 'driving' && styles.modeTxtActive]}>
                    Drive
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeChip, travelMode === 'walking' && styles.modeChipActive]}
                  onPress={() => setTravelMode('walking')}
                >
                  <Footprints size={13} color={travelMode === 'walking' ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.modeTxt, travelMode === 'walking' && styles.modeTxtActive]}>
                    Walk
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* All 5 Required Actions + Add to Visit Plan */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpenProfile(mem)}
              >
                <User size={16} color="#1A2D5A" />
                <Text style={styles.actionBtnTxt}>1. View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => {
                  onClose();
                  onScheduleVisit([mem]);
                }}
              >
                <Calendar size={16} color="#FFFFFF" />
                <Text style={[styles.actionBtnTxt, { color: '#FFFFFF' }]}>2. Schedule Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpenHistory(mem)}
              >
                <History size={16} color="#1A2D5A" />
                <Text style={styles.actionBtnTxt}>3. Visit History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDirections(mem)}
              >
                <Navigation size={16} color="#0D9488" />
                <Text style={styles.actionBtnTxt}>4. Get Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { flexBasis: '48%' }]}
                onPress={() => {
                  onClose();
                  onFindNearby(mem);
                }}
              >
                <Compass size={16} color="#EA580C" />
                <Text style={styles.actionBtnTxt}>5. Find Nearby</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { flexBasis: '48%', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => {
                  onAddToPlan([mem]);
                  onClose();
                }}
              >
                <PlusCircle size={16} color="#15803D" />
                <Text style={[styles.actionBtnTxt, { color: '#15803D' }]}>+ Multi-Stop Plan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIcon}>
                <MapPin size={18} color="#1A2D5A" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {selectedMember ? selectedMember.memberName : groupTitle || 'Area Members'}
                </Text>
                <Text style={styles.headerSub}>
                  {selectedMember
                    ? formatMemberAreaText(selectedMember) || 'Member Location Info'
                    : `${members.length} church members in this area`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {selectedMember ? (
            renderSingleMember(selectedMember)
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderVillageList()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Platform.OS === 'ios' ? '90%' : '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
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
  groupBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  groupBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  groupBannerSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
    marginBottom: 10,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    paddingVertical: 9,
    borderRadius: 10,
  },
  addAllBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  memberRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  rowAvatar: { width: 40, height: 40, borderRadius: 20 },
  rowAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarInitial: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusDotTxt: { fontSize: 11, fontWeight: '700' },
  backToGroupBtn: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  backToGroupTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarLg: { width: 56, height: 56, borderRadius: 28 },
  avatarLgFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgInitial: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  memberName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  phoneTxt: { fontSize: 13, color: '#0284C7', fontWeight: '600' },
  visitStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: 6,
  },
  visitStatusTxt: { fontSize: 11, fontWeight: '800' },
  accBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  accBannerTxt: { flex: 1, fontSize: 12, fontWeight: '700' },
  backSubBtn: { marginBottom: 8 },
  backSubTxt: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  infoSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  infoValue: { flex: 1, fontSize: 12, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  emptyHistoryTxt: { fontSize: 13, color: '#64748B', paddingVertical: 8 },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  historyStatus: { fontSize: 11, fontWeight: '800', color: '#2563EB' },
  historyMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  historyNote: { fontSize: 12, color: '#334155', marginTop: 4 },
  travelModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  travelLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  modeChip: {
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
  modeChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  modeTxt: { fontSize: 12, fontWeight: '700', color: '#475569' },
  modeTxtActive: { color: '#FFFFFF' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionBtnPrimary: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  actionBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
});
