import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Alert,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
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
} from 'lucide-react-native';
import { CareCell, CareCellMembership } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';

const { width, height } = Dimensions.get('window');

// Default Kurnool coordinates if cell doesn't have coordinates
const DEFAULT_KURNOOL_LAT = 15.8281;
const DEFAULT_KURNOOL_LNG = 78.0373;

interface CareCellMapModalProps {
  visible: boolean;
  onClose: () => void;
  cell: CareCell;
  members: CareCellMembership[];
  inactiveMembers?: Array<{ memberId: string; missedCount: number; memberName?: string }>;
  onLogFollowup?: (member: CareCellMembership) => void;
}

export default function CareCellMapModal({
  visible,
  onClose,
  cell,
  members,
  inactiveMembers = [],
  onLogFollowup,
}: CareCellMapModalProps) {
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
  const [selectedMember, setSelectedMember] = useState<CareCellMembership | null>(null);

  // Route Planning: list of member IDs in visit order
  const [plannedRouteMemberIds, setPlannedRouteMemberIds] = useState<string[]>([]);

  // Inactive Member IDs set for fast lookup
  const inactiveMemberIdSet = useMemo(() => {
    return new Set(inactiveMembers.map((im) => im.memberId));
  }, [inactiveMembers]);

  // Center coordinate: Cell Meeting coordinate or Kurnool center
  const centerCoord = useMemo(() => {
    const lat = cell.meetingLatitude || DEFAULT_KURNOOL_LAT;
    const lng = cell.meetingLongitude || DEFAULT_KURNOOL_LNG;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [cell]);

  // Compute distinct localities from members
  const localities = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.locality && m.locality.trim()) {
        set.add(m.locality.trim());
      }
    });
    return Array.from(set).sort();
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    let list = members;
    if (filterNeedsVisitOnly) {
      list = list.filter((m) => inactiveMemberIdSet.has(m.memberId));
    }
    if (selectedLocality !== 'ALL') {
      list = list.filter((m) => (m.locality || '').trim().toLowerCase() === selectedLocality.toLowerCase());
    }
    return list;
  }, [members, filterNeedsVisitOnly, selectedLocality, inactiveMemberIdSet]);

  // Members with valid GPS coordinates for map plotting
  const membersWithCoords = useMemo(() => {
    return filteredMembers.filter(
      (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude)
    );
  }, [filteredMembers]);

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
      const query = encodeURIComponent(`${m.address || ''}, ${m.locality || ''}, Kurnool`);
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
    setPlannedRouteMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Open multi-stop route in Google Maps
  const handleOpenMultiStopRoute = () => {
    if (plannedRouteMemberIds.length === 0) return;

    const routeMembers = plannedRouteMemberIds
      .map((id) => members.find((m) => m.memberId === id))
      .filter((m): m is CareCellMembership => !!m && typeof m.latitude === 'number' && typeof m.longitude === 'number');

    if (routeMembers.length === 0) {
      Alert.alert('Missing Coordinates', 'The selected members for the visit route do not have GPS coordinates.');
      return;
    }

    if (routeMembers.length === 1) {
      handleNavigateToMember(routeMembers[0]);
      return;
    }

    // Build Google Maps Multi-Stop URL
    const destination = `${routeMembers[routeMembers.length - 1].latitude},${routeMembers[routeMembers.length - 1].longitude}`;
    const midWaypoints = routeMembers
      .slice(0, routeMembers.length - 1)
      .map((m) => `${m.latitude},${m.longitude}`)
      .join('|');

    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${midWaypoints}&travelmode=driving`;

    Linking.openURL(routeUrl).catch(() => {
      Alert.alert('Route Error', 'Unable to open Google Maps route navigation.');
    });
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
            <Text style={styles.headerTitle}>{cell.name}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {cell.cellCode} · {cell.location || 'Kurnool'} · {members.length} Members
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
              {cell.meetingLatitude && cell.meetingLongitude ? (
                <Marker
                  coordinate={{
                    latitude: cell.meetingLatitude,
                    longitude: cell.meetingLongitude,
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

              {/* Member Residence Markers */}
              {membersWithCoords.map((m, idx) => {
                const isInactive = inactiveMemberIdSet.has(m.memberId);
                const isSelected = selectedMember?.memberId === m.memberId;
                const inRouteIndex = plannedRouteMemberIds.indexOf(m.memberId);

                return (
                  <Marker
                    key={m.id || m.memberId}
                    coordinate={{
                      latitude: m.latitude!,
                      longitude: m.longitude!,
                    }}
                    onPress={() => setSelectedMember(m)}
                  >
                    <View
                      style={[
                        styles.memberMarkerBubble,
                        isInactive ? styles.memberMarkerAlert : styles.memberMarkerNormal,
                        isSelected && styles.memberMarkerSelected,
                      ]}
                    >
                      {inRouteIndex >= 0 ? (
                        <View style={styles.routeOrderBadge}>
                          <Text style={styles.routeOrderBadgeTxt}>{inRouteIndex + 1}</Text>
                        </View>
                      ) : (
                        <Text style={styles.markerInitialsTxt}>
                          {m.memberName.slice(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </Marker>
                );
              })}
            </MapView>

            {/* Floating Top Route Summary Bar */}
            {plannedRouteMemberIds.length > 0 && (
              <View style={styles.floatingRouteBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.floatingRouteTitle}>
                    {plannedRouteMemberIds.length} House Visits Planned
                  </Text>
                  <Text style={styles.floatingRouteSub}>
                    Sequential pastoral route optimized for nearby houses
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.floatingNavigateRouteBtn}
                  onPress={handleOpenMultiStopRoute}
                  activeOpacity={0.85}
                >
                  <Navigation size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.floatingNavigateRouteBtnTxt}>Start Route</Text>
                </TouchableOpacity>
              </View>
            )}

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
                    <View style={styles.itemAvatarFallback}>
                      <Text style={styles.itemAvatarInitials}>{item.memberName.slice(0, 2).toUpperCase()}</Text>
                    </View>
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

                  {item.address ? (
                    <Text style={styles.itemAddressTxt} numberOfLines={2}>
                      {item.address}
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
                        {inRoute ? 'In Route' : '+ Route'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
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
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
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
  markerInitialsTxt: {
    fontSize: 10,
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
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
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
    paddingVertical: 8,
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

