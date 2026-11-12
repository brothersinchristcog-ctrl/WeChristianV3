import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Search,
  UserPlus,
  Users,
  Phone,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Check,
  AlertCircle,
  ChevronDown,
  User,
  Download,
  MapPin,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import CareCellService from '../../../../services/CareCellService';
import MemberLookupModal from '../components/MemberLookupModal';
import CareCellMapModal from '../components/CareCellMapModal';
import { formatDateDisplay } from '../../../../utils/DateUtils';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';
import { CareCell, CareCellMembership } from '../../../../types/CareCellTypes';

interface CareCellMembersTabProps {
  cells: CareCell[];
  selectedCellId?: string;
  onSelectCellId: (id: string) => void;
}

export default function CareCellMembersTab({
  cells,
  selectedCellId,
  onSelectCellId,
}: CareCellMembersTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';
  const dangerBtnBg = isDark ? 'rgba(220, 38, 38, 0.14)' : '#FEF2F2';
  const dangerBtnBorder = isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA';
  const dangerBtnText = isDark ? '#F87171' : '#DC2626';

  const activeCellId = selectedCellId || (cells[0]?.id || '');
  const activeCell = cells.find((c) => c.id === activeCellId) || cells[0];

  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<CareCellMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [membershipToTransfer, setMembershipToTransfer] = useState<CareCellMembership | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const loadMemberships = useCallback(async () => {
    if (!activeCellId) return;
    setLoading(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const list = await CareCellService.getActiveCellMemberships(churchId, activeCellId);
      setMemberships(list);
    } catch (e) {
      console.error('Error loading cell memberships:', e);
    } finally {
      setLoading(false);
    }
  }, [activeCellId]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  // Filtered members list
  const filteredMemberships = useMemo(() => {
    if (!searchQuery.trim()) return memberships;
    const q = searchQuery.toLowerCase().trim();
    return memberships.filter((m) => {
      const matchName = (m.memberName || '').toLowerCase().includes(q);
      const matchPhone = (m.memberPhone || '').includes(q);
      return matchName || matchPhone;
    });
  }, [memberships, searchQuery]);

  const handleAddMembersConfirm = async (
    selectedMembers: Array<{ id: string; name: string; phone?: string; photoUrl?: string }>,
    transferMemberIds: string[]
  ) => {
    if (selectedMembers.length === 0 || !activeCell) return;

    try {
      const churchId = await CareCellService.getChurchId();
      const res = await CareCellService.assignMembersToCell(
        churchId,
        activeCell.id,
        { cellCode: activeCell.cellCode, cellName: activeCell.name },
        selectedMembers,
        'Admin',
        true // Allow autoTransfer for confirmed items
      );

      let msg = `Successfully assigned ${res.assignedCount} member(s).`;
      if (res.transferredCount > 0) {
        msg += ` (${res.transferredCount} transferred from other cells)`;
      }
      if (res.skippedCount > 0) {
        msg += ` (${res.skippedCount} skipped as already enrolled)`;
      }

      Alert.alert('Roster Updated', msg);
      loadMemberships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign members.');
    }
  };

  const handleRemoveMember = (m: CareCellMembership) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${m.memberName} from ${activeCell?.cellCode || 'this cell'}?\n\nThis will safely update their cell membership without affecting their church member account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const churchId = await CareCellService.getChurchId();
              await CareCellService.removeMemberFromCell(churchId, m.id);
              loadMemberships();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleExecuteTransfer = async (targetCell: CareCell) => {
    if (!membershipToTransfer || !activeCell) return;

    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.assignMembersToCell(
        churchId,
        targetCell.id,
        { cellCode: targetCell.cellCode, cellName: targetCell.name },
        [{
          id: membershipToTransfer.memberId,
          name: membershipToTransfer.memberName,
          phone: membershipToTransfer.memberPhone,
          photoUrl: membershipToTransfer.memberPhoto,
        }],
        'Admin',
        true
      );

      Alert.alert(
        'Transferred',
        `${membershipToTransfer.memberName} has been transferred to ${targetCell.cellCode} (${targetCell.name}).`
      );
      setTransferModalVisible(false);
      setMembershipToTransfer(null);
      loadMemberships();
    } catch (err: any) {
      Alert.alert('Transfer Error', err.message || 'Failed to transfer member.');
    }
  };

  const renderMemberRow = ({ item }: { item: CareCellMembership }) => {
    const initials = item.memberName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'M';

    return (
      <View style={styles.memberCard}>
        {item.memberPhoto ? (
          <Image source={{ uri: item.memberPhoto }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.memberName}</Text>
          {item.memberPhone ? (
            <View style={styles.phoneRow}>
              <Phone size={11} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.memberPhone}>{item.memberPhone}</Text>
            </View>
          ) : null}
          {item.joinedAt ? (
            <View style={styles.dateRow}>
              <Calendar size={11} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.dateTxt}>Joined {formatDateDisplay(item.joinedAt)}</Text>
            </View>
          ) : null}
        </View>

        {/* Member Action Icons */}
        <View style={styles.actionsWrap}>
          {/* Transfer button */}
          <TouchableOpacity
            style={[styles.actionBtnTransfer, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
            onPress={() => {
              setMembershipToTransfer(item);
              setTransferModalVisible(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <ArrowRightLeft size={15} color={secondaryBtnText} />
          </TouchableOpacity>

          {/* Remove button */}
          <TouchableOpacity
            style={[styles.actionBtnRemove, { backgroundColor: dangerBtnBg, borderColor: dangerBtnBorder }]}
            onPress={() => handleRemoveMember(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Trash2 size={15} color={dangerBtnText} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleExportCSV = async () => {
    if (memberships.length === 0) {
      Alert.alert('Empty Roster', 'No members to export in this cell.');
      return;
    }
    try {
      const csvContent = CareCellService.generateMembersCSV(memberships, activeCell?.name);
      const filename = `${activeCell?.cellCode || 'CareCell'}_Roster_${Date.now()}.csv`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filepath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(filepath, { mimeType: 'text/csv', dialogTitle: 'Export Care Cell Roster' });
    } catch (e: any) {
      console.error('Export CSV error:', e);
      Alert.alert('Export Failed', e?.message || 'Could not export roster.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Cell Selector Scroll */}
      <View style={styles.cellSelectorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cellSelectorScroll}>
          {cells.map((c) => {
            const isSelected = activeCellId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.cellChip,
                  isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => onSelectCellId(c.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.cellChipTxt,
                    isSelected && { color: primaryBtnText, fontWeight: '800' },
                  ]}
                >
                  {c.cellCode} ({c.name})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cell Roster Header Banner */}
      {activeCell && (
        <View style={[styles.rosterBanner, { backgroundColor: cardSurface, borderColor }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.rosterBannerTitle, { color: primaryText }]}>
              {activeCell.cellCode} · {activeCell.name}
            </Text>
            <Text style={[styles.rosterBannerSub, { color: secondaryText }]}>
              Leader: <Text style={{ fontWeight: '700', color: primaryText }}>{activeCell.leaderName}</Text> · {memberships.length} of {activeCell.maximumMembers} members
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => setMapModalVisible(true)}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MapPin size={14} color={secondaryBtnText} style={{ marginRight: 4 }} />
              <Text style={[styles.mapBtnTxt, { color: secondaryBtnText }]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={handleExportCSV}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Download size={15} color={secondaryBtnText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addMembersBtn, { backgroundColor: primaryBtnBg }]}
              onPress={() => setAddMembersModalVisible(true)}
              activeOpacity={0.85}
            >
              <UserPlus size={15} color={primaryBtnText} style={{ marginRight: 5 }} />
              <Text style={[styles.addMembersBtnTxt, { color: primaryBtnText }]}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter assigned members by name or phone..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Member Roster List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1A2D5A" />
          <Text style={styles.loadingTxt}>Loading cell members...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMemberships}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Members Enrolled</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No members match "${searchQuery}".`
                  : 'Tap "Add Members" above to assign church members to this cell with zero duplication.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Member Lookup Modal for Adding Members (Multi-select) */}
      <MemberLookupModal
        visible={addMembersModalVisible}
        title={`Add Members to ${activeCell?.cellCode || 'Cell'}`}
        mode="multiple"
        currentCellId={activeCell?.id}
        currentCellName={activeCell?.cellCode}
        targetLocation={activeCell?.location || activeCell?.locality || activeCell?.meetingLocation}
        cellLatitude={activeCell?.meetingLatitude}
        cellLongitude={activeCell?.meetingLongitude}
        onClose={() => setAddMembersModalVisible(false)}
        onConfirmMultiple={handleAddMembersConfirm}
      />

      {/* Transfer Cell Selection Modal */}
      <Modal visible={transferModalVisible} transparent animationType="fade" onRequestClose={() => setTransferModalVisible(false)}>
        <TouchableOpacity style={styles.transferOverlay} activeOpacity={1} onPress={() => setTransferModalVisible(false)}>
          <View style={styles.transferContainer}>
            <Text style={[styles.transferTitle, { color: primaryText }]}>Transfer Member</Text>
            <Text style={styles.transferSub}>
              Move <Text style={{ fontWeight: '700', color: primaryText }}>{membershipToTransfer?.memberName}</Text> to another Care Cell.
            </Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {cells
                .filter((c) => c.id !== activeCellId)
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.transferCellItem}
                    onPress={() => handleExecuteTransfer(c)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transferCellTitle}>{c.cellCode} — {c.name}</Text>
                      <Text style={styles.transferCellSub}>Leader: {c.leaderName} · {c.location || 'Local'}</Text>
                    </View>
                    <Check size={16} color={primaryText} />
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Care Cell Google Maps Modal ── */}
      {activeCell && (
        <CareCellMapModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          cell={activeCell}
          members={memberships}
        />
      )}
    </View>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  cellSelectorRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  cellSelectorScroll: {
    flexDirection: 'row',
  },
  cellChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  cellChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  cellChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cellChipTxtActive: {
    color: '#FFFFFF',
  },
  rosterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rosterBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rosterBannerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  exportBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  addMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 13,
    paddingVertical: 8.5,
    borderRadius: 10,
  },
  addMembersBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateTxt: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnTransfer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnRemove: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 50,
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
  transferOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transferContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  transferTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  transferSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  transferCellItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  transferCellTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  transferCellSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
});

