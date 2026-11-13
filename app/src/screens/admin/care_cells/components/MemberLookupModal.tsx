import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Search, X, Check, CheckCircle2, UserCheck, AlertCircle, Phone, ArrowRight, MapPin } from 'lucide-react-native';
import FirestoreService from '../../../../services/FirestoreService';
import CareCellService, { isMemberInLocation } from '../../../../services/CareCellService';
import { CareCellMembership } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';

interface MemberItem {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  userType?: string;
  address?: string;
  locality?: string;
  city?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  mailingStreet?: string;
  mailingCity?: string;
  latitude?: number;
  longitude?: number;
}

interface MemberLookupModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  mode?: 'single' | 'multiple'; // 'single' for Leader/Assistant, 'multiple' for Cell Members
  currentCellId?: string; // Cell ID currently being managed
  currentCellName?: string;
  targetLocation?: string; // Locality or region to filter by (e.g. "Koilakuntla")
  cellLatitude?: number;
  cellLongitude?: number;
  onSelectSingle?: (member: MemberItem) => void;
  onConfirmMultiple?: (selectedMembers: MemberItem[], transferMemberIds: string[]) => void;
}

export default function MemberLookupModal({
  visible,
  onClose,
  title = 'Select Church Member',
  mode = 'single',
  currentCellId,
  currentCellName,
  targetLocation,
  cellLatitude,
  cellLongitude,
  onSelectSingle,
  onConfirmMultiple,
}: MemberLookupModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');
  const [filterByLocation, setFilterByLocation] = useState<boolean>(true);
  
  // Membership maps for deduplication
  const [currentCellMemberIds, setCurrentCellMemberIds] = useState<Set<string>>(new Set());
  const [otherCellMembershipsMap, setOtherCellMembershipsMap] = useState<Map<string, CareCellMembership>>(new Map());

  // Multiple selection state
  const [selectedMap, setSelectedMap] = useState<Map<string, MemberItem>>(new Map());
  const [transferIdsSet, setTransferIdsSet] = useState<Set<string>>(new Set());

  // Load members and deduplication state when modal opens
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedMap(new Map());
      setTransferIdsSet(new Set());
      return;
    }

    setFilterByLocation(!!(targetLocation && targetLocation.trim()));

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const churchId = await CareCellService.getChurchId();
        const [allMembers, allActiveMap, cellActive] = await Promise.all([
          FirestoreService.getAllMembers(),
          CareCellService.getAllActiveMembershipsMap(churchId),
          currentCellId ? CareCellService.getActiveCellMemberships(churchId, currentCellId) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setMembers(
            allMembers.map((m: any) => ({
              id: m.id,
              name: m.name || m.firstName || 'Member',
              phone: m.phone || m.phoneNumber || m.referencePhone || '',
              photoUrl: m.photoUrl || m.profilePicture || m.profilePhoto || '',
              userType: m.userType || 'Member',
              address: m.address || m.street || m.mailingStreet || '',
              locality: m.locality || m.area || m.village || m.city || m.mailingCity || '',
              city: m.city || m.mailingCity || '',
              village: m.village || '',
              mandal: m.mandal || '',
              district: m.district || '',
              state: m.state || '',
              mailingStreet: m.mailingStreet || '',
              mailingCity: m.mailingCity || '',
              latitude: typeof m.latitude === 'number' ? m.latitude : (m.lat ? Number(m.lat) : undefined),
              longitude: typeof m.longitude === 'number' ? m.longitude : (m.lng ? Number(m.lng) : undefined),
            }))
          );

          // Build intra-cell set
          const intraSet = new Set<string>();
          cellActive.forEach((c) => intraSet.add(c.memberId));
          setCurrentCellMemberIds(intraSet);

          // Build other-cell map
          setOtherCellMembershipsMap(allActiveMap);
        }
      } catch (err) {
        console.error('Error loading members for lookup modal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [visible, currentCellId, targetLocation]);

  const uniqueLocalities = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.locality && m.locality.trim()) {
        set.add(m.locality.trim());
      }
    });
    return Array.from(set).sort();
  }, [members]);

  // Filter members by location, locality, name, phone or address
  const filteredMembers = useMemo(() => {
    let result = members;

    // Strict location-based filtering when targetLocation is provided
    if (filterByLocation && targetLocation && targetLocation.trim()) {
      result = result.filter((m) =>
        isMemberInLocation(m, targetLocation, cellLatitude, cellLongitude)
      );
    } else if (selectedLocality !== 'ALL') {
      result = result.filter(
        (m) => (m.locality || '').trim().toLowerCase() === selectedLocality.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const rawDigits = q.replace(/\D/g, '');

      result = result.filter((m) => {
        const matchName = m.name.toLowerCase().includes(q);
        const matchPhone = rawDigits && m.phone ? m.phone.replace(/\D/g, '').includes(rawDigits) : false;
        const matchLoc = m.locality ? m.locality.toLowerCase().includes(q) : false;
        const matchAddr = m.address ? m.address.toLowerCase().includes(q) : false;
        const matchCity = m.city ? m.city.toLowerCase().includes(q) : false;
        const matchVill = m.village ? m.village.toLowerCase().includes(q) : false;
        return matchName || matchPhone || matchLoc || matchAddr || matchCity || matchVill;
      });
    }
    return result;
  }, [members, searchQuery, selectedLocality, filterByLocation, targetLocation, cellLatitude, cellLongitude]);

  const handleToggleMultiple = (member: MemberItem) => {
    // 1. Intra-cell deduplication: never allow selecting if already in this cell
    if (currentCellId && currentCellMemberIds.has(member.id)) {
      Alert.alert('Already Assigned', `${member.name} is already an active member of this Care Cell.`);
      return;
    }

    // 2. Inter-cell deduplication check
    const otherMembership = otherCellMembershipsMap.get(member.id);
    const isCurrentlySelected = selectedMap.has(member.id);

    if (!isCurrentlySelected && otherMembership && otherMembership.cellId !== currentCellId) {
      // Member is in another cell -> prompt transfer confirmation
      const otherCellLabel = otherMembership.cellCode || otherMembership.cellName || 'another Care Cell';
      Alert.alert(
        'Member Transfer Required',
        `${member.name} is currently enrolled in ${otherCellLabel}.\n\nAdding them here will transfer them from ${otherCellLabel} to ${currentCellName || 'this cell'}. Previous attendance records will remain preserved.\n\nDo you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Transfer',
            onPress: () => {
              setSelectedMap((prev) => {
                const next = new Map(prev);
                next.set(member.id, member);
                return next;
              });
              setTransferIdsSet((prev) => new Set(prev).add(member.id));
            },
          },
        ]
      );
      return;
    }

    // Normal toggle
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
        setTransferIdsSet((tPrev) => {
          const tNext = new Set(tPrev);
          tNext.delete(member.id);
          return tNext;
        });
      } else {
        next.set(member.id, member);
      }
      return next;
    });
  };

  const handleSelectSingle = (member: MemberItem) => {
    if (onSelectSingle) {
      onSelectSingle(member);
      onClose();
    }
  };

  const handleConfirmMultiple = () => {
    if (onConfirmMultiple) {
      const selectedList = Array.from(selectedMap.values());
      const transferList = Array.from(transferIdsSet);
      onConfirmMultiple(selectedList, transferList);
      onClose();
    }
  };

  const renderMemberItem = ({ item }: { item: MemberItem }) => {
    const isAlreadyInThisCell = currentCellId ? currentCellMemberIds.has(item.id) : false;
    const otherMembership = otherCellMembershipsMap.get(item.id);
    const isInOtherCell = otherMembership && otherMembership.cellId !== currentCellId;
    const isSelected = selectedMap.has(item.id);

    // Initials for avatar fallback
    const initials = item.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'M';

    return (
      <TouchableOpacity
        style={[
          styles.memberCard,
          isAlreadyInThisCell && styles.memberCardDisabled,
          isSelected && styles.memberCardSelected,
        ]}
        activeOpacity={isAlreadyInThisCell ? 1 : 0.75}
        onPress={() => {
          if (mode === 'single') {
            handleSelectSingle(item);
          } else {
            handleToggleMultiple(item);
          }
        }}
      >
        {/* Avatar */}
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarFallback, isAlreadyInThisCell && { backgroundColor: '#E2E8F0' }]}>
            <Text style={[styles.avatarInitials, isAlreadyInThisCell && { color: '#94A3B8' }]}>{initials}</Text>
          </View>
        )}

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.memberName, isAlreadyInThisCell && styles.textDisabled]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.userType && item.userType.toUpperCase().includes('ADMIN') && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeTxt}>Admin</Text>
              </View>
            )}
          </View>

          {item.phone ? (
            <View style={styles.phoneRow}>
              <Phone size={11} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.memberPhone}>{item.phone}</Text>
            </View>
          ) : null}

          {/* Locality & Address */}
          {item.locality ? (
            <View style={styles.localityTagRow}>
              <MapPin size={10} color="#1A2D5A" style={{ marginRight: 3 }} />
              <Text style={styles.localityTagRowTxt}>{item.locality}</Text>
            </View>
          ) : null}

          {item.address ? (
            <Text style={styles.memberAddressTxt} numberOfLines={1}>
              {item.address}
            </Text>
          ) : null}

          {/* Status Badges */}
          {isAlreadyInThisCell ? (
            <View style={styles.statusBadgeAlready}>
              <UserCheck size={11} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.statusBadgeAlreadyTxt}>Already in this Cell</Text>
            </View>
          ) : isInOtherCell ? (
            <View style={styles.statusBadgeOther}>
              <AlertCircle size={11} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={styles.statusBadgeOtherTxt} numberOfLines={1}>
                In {otherMembership.cellCode || otherMembership.cellName || 'Other Cell'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Mode Actions */}
        {mode === 'single' ? (
          <View style={[styles.selectSingleBtn, { backgroundColor: primaryBtnBg }]}>
            <Text style={[styles.selectSingleBtnTxt, { color: primaryBtnText }]}>Select</Text>
          </View>
        ) : (
          <View
            style={[
              styles.checkboxBox,
              isAlreadyInThisCell && styles.checkboxDisabled,
              isSelected && { borderColor: primaryBtnBg, backgroundColor: primaryBtnBg },
            ]}
          >
            {isSelected && <Check size={14} color={primaryBtnText} strokeWidth={3} />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {mode === 'multiple'
                  ? 'Select members to assign. Duplicates are strictly blocked.'
                  : 'Search and choose an existing church member.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={primaryText} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone or locality..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Location-Based Filter Banner */}
          {targetLocation && targetLocation.trim().length > 0 && (
            <View style={styles.targetLocationBanner}>
              <View style={styles.targetLocationLeft}>
                <MapPin size={16} color={primaryText} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.targetLocationTitle}>
                    Showing members in: {targetLocation}
                  </Text>
                  <Text style={styles.targetLocationSub}>
                    {filterByLocation
                      ? `Matching saved residential locations (${filteredMembers.length} found)`
                      : 'Showing all church members regardless of location'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.locationToggleBtn,
                  filterByLocation ? { backgroundColor: primaryBtnBg } : styles.locationToggleBtnInactive,
                ]}
                onPress={() => setFilterByLocation(!filterByLocation)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.locationToggleTxt,
                    filterByLocation ? { color: primaryBtnText } : styles.locationToggleTxtInactive,
                  ]}
                >
                  {filterByLocation ? 'Location: ON' : 'Show All'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Locality Filter Pills Bar */}
          {uniqueLocalities.length > 0 && (
            <View style={styles.localityFilterWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.localityScroll}>
                <TouchableOpacity
                  style={[
                    styles.localityPill,
                    selectedLocality === 'ALL' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                  ]}
                  onPress={() => setSelectedLocality('ALL')}
                >
                  <Text style={[styles.localityPillTxt, selectedLocality === 'ALL' && { color: primaryBtnText, fontWeight: '700' }]}>
                    All Localities
                  </Text>
                </TouchableOpacity>
                {uniqueLocalities.map((loc) => {
                  const isSel = selectedLocality.toLowerCase() === loc.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.localityPill,
                        isSel && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                      ]}
                      onPress={() => setSelectedLocality(loc)}
                    >
                      <MapPin size={10} color={isSel ? primaryBtnText : secondaryText} style={{ marginRight: 3 }} />
                      <Text style={[styles.localityPillTxt, isSel && { color: primaryBtnText, fontWeight: '700' }]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Member List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryText} />
              <Text style={styles.loadingText}>Fetching church members...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                {targetLocation && filterByLocation
                  ? `No Members Found in ${targetLocation}`
                  : 'No Members Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {targetLocation && filterByLocation
                  ? `No existing church members have their saved residential address or Google Maps location matching "${targetLocation}". Check Member profiles in Church Directory to ensure addresses are saved.`
                  : searchQuery
                  ? `No members matched "${searchQuery}".`
                  : 'No church members available.'}
              </Text>
              {targetLocation && filterByLocation && (
                <TouchableOpacity
                  style={[styles.showAllEmptyBtn, { backgroundColor: primaryBtnBg }]}
                  onPress={() => setFilterByLocation(false)}
                >
                  <Text style={[styles.showAllEmptyBtnTxt, { color: primaryBtnText }]}>Show All Church Members</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              renderItem={renderMemberItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={15}
              maxToRenderPerBatch={20}
            />
          )}

          {/* Multiple Selection Action Footer */}
          {mode === 'multiple' && (
            <View style={styles.footer}>
              <View style={styles.footerInfo}>
                <Text style={[styles.footerCountTxt, { color: primaryText }]}>
                  {selectedMap.size} {selectedMap.size === 1 ? 'member' : 'members'} selected
                </Text>
                {transferIdsSet.size > 0 && (
                  <Text style={styles.footerTransferTxt}>
                    ({transferIdsSet.size} will be transferred)
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: primaryBtnBg },
                  selectedMap.size === 0 && styles.confirmBtnDisabled,
                ]}
                disabled={selectedMap.size === 0}
                onPress={handleConfirmMultiple}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmBtnTxt, { color: selectedMap.size === 0 ? '#FFFFFF' : primaryBtnText }]}>
                  Assign Selected
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2D5A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  memberCardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  memberCardSelected: {
    borderColor: '#1A2D5A',
    backgroundColor: '#F0F5FF',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3730A3',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  textDisabled: {
    color: '#64748B',
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadgeAlready: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeAlreadyTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadgeOther: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: '90%',
  },
  statusBadgeOtherTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  selectSingleBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectSingleBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  checkboxSelected: {
    borderColor: '#1A2D5A',
    backgroundColor: '#1A2D5A',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerInfo: {
    flex: 1,
  },
  footerCountTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  footerTransferTxt: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  localityFilterWrap: {
    paddingBottom: 8,
  },
  localityScroll: {
    paddingHorizontal: 20,
    gap: 6,
  },
  localityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  localityPillActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  localityPillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  localityPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  localityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  localityTagRowTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  memberAddressTxt: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  targetLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  targetLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  targetLocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  targetLocationSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1.5,
  },
  locationToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationToggleBtnActive: {
    backgroundColor: '#1A2D5A',
  },
  locationToggleBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
  locationToggleTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationToggleTxtActive: {
    color: '#FFFFFF',
  },
  locationToggleTxtInactive: {
    color: '#475569',
  },
  showAllEmptyBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#1A2D5A',
    borderRadius: 10,
  },
  showAllEmptyBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

