import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Users,
  Edit2,
  Archive,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  User,
  Shield,
  ArrowRight,
  CheckCircle2,
  X,
  AlertTriangle,
  Building2,
  Sparkles,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { useAuth } from '../../../../context/AuthContext';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';
import GrantAdminAccessModal from '../components/GrantAdminAccessModal';
import { CareCell, CareCellStatus } from '../../../../types/CareCellTypes';

const { width } = Dimensions.get('window');

interface CareCellsManageTabProps {
  cells: CareCell[];
  onRefreshCells: () => void;
  onOpenCreateCell: () => void;
  onEditCell: (cell: CareCell) => void;
  onManageMembers: (cell: CareCell) => void;
  onViewMeetings: (cell: CareCell) => void;
}

export default function CareCellsManageTab({
  cells,
  onRefreshCells,
  onOpenCreateCell,
  onEditCell,
  onManageMembers,
  onViewMeetings,
}: CareCellsManageTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';
  const dangerBtnBg = isDark ? 'rgba(220, 38, 38, 0.14)' : '#FEF2F2';
  const dangerBtnBorder = isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA';
  const dangerBtnText = isDark ? '#F87171' : '#DC2626';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Archived'>('All');

  const { isPlatformSuperAdmin } = useAuth();
  const [grantAccessCell, setGrantAccessCell] = useState<CareCell | null>(null);
  const [grantAccessModalVisible, setGrantAccessModalVisible] = useState(false);

  // Custom Delete Confirmation & Success Modal States
  const [cellToDelete, setCellToDelete] = useState<CareCell | null>(null);
  const [isDeletingCell, setIsDeletingCell] = useState(false);
  const [deletedCellSummary, setDeletedCellSummary] = useState<{
    name: string;
    code: string;
    leaderName?: string;
    location?: string;
  } | null>(null);
  const [deleteSuccessModalVisible, setDeleteSuccessModalVisible] = useState(false);


  // Status counts
  const statusCounts = useMemo(() => {
    return {
      All: cells.length,
      Active: cells.filter(c => c.status === 'Active').length,
      Inactive: cells.filter(c => c.status === 'Inactive').length,
      Archived: cells.filter(c => c.status === 'Archived').length,
    };
  }, [cells]);

  // Filtered cells list
  const filteredCells = useMemo(() => {
    return cells.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (c.cellCode || '').toLowerCase().includes(q);
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchLeader = (c.leaderName || '').toLowerCase().includes(q);
        const matchLoc = (c.location || '').toLowerCase().includes(q);
        return matchCode || matchName || matchLeader || matchLoc;
      }
      return true;
    });
  }, [cells, searchQuery, statusFilter]);

  const handleToggleStatus = (cell: CareCell) => {
    const nextStatus: CareCellStatus = cell.status === 'Active' ? 'Inactive' : 'Active';
    Alert.alert(
      `${nextStatus === 'Active' ? 'Activate' : 'Deactivate'} Care Cell`,
      `Are you sure you want to mark ${cell.cellCode} (${cell.name}) as ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Mark ${nextStatus}`,
          onPress: async () => {
            try {
              const churchId = await CareCellService.getChurchId();
              await CareCellService.updateCareCell(churchId, cell.id, { status: nextStatus });
              onRefreshCells();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCell = (cell: CareCell) => {
    setCellToDelete(cell);
  };

  const confirmDeleteCell = async () => {
    if (!cellToDelete) return;
    setIsDeletingCell(true);
    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.deleteCareCell(churchId, cellToDelete.id);
      const summary = {
        name: cellToDelete.name,
        code: cellToDelete.cellCode,
        leaderName: cellToDelete.leaderName,
        location: cellToDelete.location || cellToDelete.meetingLocation,
      };
      setCellToDelete(null);
      setDeletedCellSummary(summary);
      setDeleteSuccessModalVisible(true);
      onRefreshCells();
    } catch (err: any) {
      console.error('Error deleting Care Cell:', err);
      Alert.alert('Error', err.message || 'Failed to delete Care Cell.');
    } finally {
      setIsDeletingCell(false);
    }
  };

  const handleArchiveCell = (cell: CareCell) => {
    Alert.alert(
      'Archive Care Cell',
      `Archiving ${cell.cellCode} will hide it from the active roster. Historical attendance and meeting records will be safely preserved.\n\nDo you want to archive this cell?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive Cell',
          style: 'destructive',
          onPress: async () => {
            try {
              const churchId = await CareCellService.getChurchId();
              await CareCellService.archiveCareCell(churchId, cell.id);
              onRefreshCells();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to archive cell.');
            }
          },
        },
      ]
    );
  };

  const renderCellCard = ({ item }: { item: CareCell }) => {
    const isActive = item.status === 'Active';
    const isArchived = item.status === 'Archived';

    return (
      <View style={[styles.cellCard, !isActive && styles.cellCardInactive]}>
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeTxt}>{item.cellCode || 'CareCell'}</Text>
          </View>
          <View
            style={[
              styles.statusChip,
              isActive && styles.statusActive,
              !isActive && !isArchived && styles.statusInactive,
              isArchived && styles.statusArchived,
            ]}
          >
            <Text
              style={[
                styles.statusChipTxt,
                isActive && styles.statusActiveTxt,
                !isActive && !isArchived && styles.statusInactiveTxt,
                isArchived && styles.statusArchivedTxt,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Name & Description */}
        <Text style={styles.cellName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.cellDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Leader Info Row */}
        <View style={styles.leaderRow}>
          {item.leaderPhoto ? (
            <Image source={{ uri: item.leaderPhoto }} style={styles.leaderAvatar} />
          ) : (
            <View style={[styles.leaderAvatarFallback, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder, borderWidth: 1 }]}>
              <User size={16} color={primaryText} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.leaderName}>{item.leaderName || 'Unassigned Leader'}</Text>
              <View style={[styles.leaderRoleBadge, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder, borderWidth: 1 }]}>
                <Text style={[styles.leaderRoleBadgeTxt, { color: secondaryBtnText }]}>Leader</Text>
              </View>
            </View>
            {item.leaderPhone ? <Text style={styles.leaderPhone}>{item.leaderPhone}</Text> : null}
          </View>
        </View>

        {/* Assistant Leader Row (if present) */}
        {item.assistantLeaderName ? (
          <View style={styles.asstLeaderRow}>
            <Text style={styles.asstLeaderTxt}>
              Assistant: <Text style={{ fontWeight: '700', color: primaryText }}>{item.assistantLeaderName}</Text>
            </Text>
          </View>
        ) : null}

        {/* Schedule & Venue Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={secondaryText} style={{ marginRight: 4 }} />
            <Text style={styles.metaTxt}>{item.meetingDay || 'Friday'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={13} color={secondaryText} style={{ marginRight: 4 }} />
            <Text style={styles.metaTxt}>{item.meetingTime || '19:00'}{item.meetingEndTime ? ` – ${item.meetingEndTime}` : ''}</Text>
          </View>
          {item.location ? (
            <View style={[styles.metaItem, { flex: 1 }]}>
              <MapPin size={13} color={secondaryText} style={{ marginRight: 4 }} />
              <Text style={styles.metaTxt} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
        </View>

        {isPlatformSuperAdmin && item.assignedAdminIds && item.assignedAdminIds.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
            <Shield size={12} color={isDark ? '#818CF8' : '#4338CA'} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11.5, color: isDark ? '#818CF8' : '#4338CA', fontWeight: '600' }}>
              Assigned to {item.assignedAdminIds.length} Admin(s)
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons Row */}
        <View style={styles.cardActionsContainer}>
          <View style={styles.cardActionsRow}>
            {/* Manage Members */}
            <TouchableOpacity
              style={[styles.cardActionBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => onManageMembers(item)}
              activeOpacity={0.8}
            >
              <Users size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
              <Text style={[styles.cardActionBtnTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                Members
              </Text>
            </TouchableOpacity>

            {/* View Meetings */}
            <TouchableOpacity
              style={[styles.cardActionBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => onViewMeetings(item)}
              activeOpacity={0.8}
            >
              <Calendar size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
              <Text style={[styles.cardActionBtnTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                Meetings
              </Text>
            </TouchableOpacity>

            {/* Grant Admin Access (Super Admin Only) */}
            {isPlatformSuperAdmin && (
              <TouchableOpacity
                style={[styles.cardActionBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                onPress={() => {
                  setGrantAccessCell(item);
                  setGrantAccessModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Shield size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
                <Text style={[styles.cardActionBtnTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                  Access
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.cardUtilityRow}>
            {/* Edit Button */}
            <TouchableOpacity
              style={[styles.cardActionBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => onEditCell(item)}
              activeOpacity={0.8}
            >
              <Edit2 size={13.5} color={secondaryBtnText} style={{ marginRight: 5 }} />
              <Text style={[styles.cardActionBtnTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                Edit
              </Text>
            </TouchableOpacity>

            {/* Toggle Active / Inactive (Super Admin Only) */}
            {isPlatformSuperAdmin && (
              <TouchableOpacity
                style={[styles.cardActionBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                onPress={() => handleToggleStatus(item)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <XCircle size={14} color="#D97706" style={{ marginRight: 5 }} />
                ) : (
                  <CheckCircle size={14} color="#059669" style={{ marginRight: 5 }} />
                )}
                <Text style={[styles.cardActionBtnTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                  {isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Archive (Super Admin Only) */}
            {isPlatformSuperAdmin && !isArchived && (
              <TouchableOpacity
                style={[styles.cardIconBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                onPress={() => handleArchiveCell(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
              >
                <Archive size={15} color={secondaryBtnText} />
              </TouchableOpacity>
            )}

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.cardIconBtn, { backgroundColor: dangerBtnBg, borderColor: dangerBtnBorder }]}
              onPress={() => handleDeleteCell(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Trash2 size={15} color={dangerBtnText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Clean Full-Width Search Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search care cells by code, name, leader, location..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearSearchBtn}
            >
              <Text style={styles.clearSearchTxt}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Clean Status Filter Chips */}
      <View style={styles.statusFilterRow}>
        {(['All', 'Active', 'Inactive', 'Archived'] as const).map((st) => {
          const isSelected = statusFilter === st;
          return (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusFilterChip,
                isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => setStatusFilter(st)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.statusFilterChipTxt,
                  isSelected && { color: primaryBtnText, fontWeight: '800' },
                ]}
              >
                {st} ({statusCounts[st]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filteredCells}
        keyExtractor={(item) => item.id}
        renderItem={renderCellCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Care Cells Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No cells match "${searchQuery}".`
                : 'No care cells found in this category.'}
            </Text>
          </View>
        }
      />
      <GrantAdminAccessModal
        visible={grantAccessModalVisible}
        cell={grantAccessCell}
        onClose={() => {
          setGrantAccessModalVisible(false);
          setGrantAccessCell(null);
        }}
        onSaved={onRefreshCells}
      />

      {/* ── Custom Delete Confirmation Modal ── */}
      <Modal
        visible={!!cellToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingCell) setCellToDelete(null);
        }}
      >
        <View style={styles.modalOverlayScrim}>
          <View style={styles.customConfirmCard}>
            <TouchableOpacity
              style={styles.modalCloseIconBtn}
              onPress={() => setCellToDelete(null)}
              disabled={isDeletingCell}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.deleteWarningRingOuter}>
              <View style={styles.deleteWarningRingInner}>
                <Trash2 size={26} color="#DC2626" strokeWidth={2.4} />
              </View>
            </View>

            <Text style={styles.deleteConfirmTitle}>Delete Care Cell?</Text>
            <Text style={styles.deleteConfirmSubtitle}>
              Are you sure you want to permanently delete this fellowship group?
            </Text>

            {cellToDelete && (
              <View style={styles.deleteCellPreviewBox}>
                <View style={styles.deleteCellHeaderRow}>
                  <Building2 size={15} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteCellNameTxt} numberOfLines={1}>
                    {cellToDelete.name}
                  </Text>
                  <View style={styles.deleteCellCodeBadge}>
                    <Text style={styles.deleteCellCodeTxt}>{cellToDelete.cellCode}</Text>
                  </View>
                </View>

                <View style={styles.deleteDivider} />

                <View style={styles.deleteMetaRow}>
                  <User size={13} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteMetaLabel}>Leader:</Text>
                  <Text style={styles.deleteMetaVal} numberOfLines={1}>
                    {cellToDelete.leaderName || 'Assigned Leader'}
                  </Text>
                </View>

                {(cellToDelete.location || cellToDelete.meetingLocation) ? (
                  <View style={styles.deleteMetaRow}>
                    <MapPin size={13} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteMetaLabel}>Location:</Text>
                    <Text style={styles.deleteMetaVal} numberOfLines={1}>
                      {cellToDelete.location || cellToDelete.meetingLocation}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.deletePermanentWarningBox}>
              <AlertTriangle size={15} color="#DC2626" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.deletePermanentWarningTxt}>
                This action is permanent. All assigned members will be unlinked.
              </Text>
            </View>

            <View style={styles.deleteActionsBtnRow}>
              <TouchableOpacity
                style={styles.deleteCancelActionBtn}
                onPress={() => setCellToDelete(null)}
                disabled={isDeletingCell}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteCancelActionBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmActionBtn}
                onPress={confirmDeleteCell}
                disabled={isDeletingCell}
                activeOpacity={0.85}
              >
                {isDeletingCell ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteConfirmActionBtnTxt}>Delete Permanently</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Delete Success Card Modal ── */}
      <Modal
        visible={deleteSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteSuccessModalVisible(false);
          setDeletedCellSummary(null);
        }}
      >
        <View style={styles.modalOverlayScrim}>
          <View style={styles.deleteSuccessCard}>
            <TouchableOpacity
              style={styles.modalCloseIconBtn}
              onPress={() => {
                setDeleteSuccessModalVisible(false);
                setDeletedCellSummary(null);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.deleteSuccessRingOuter}>
              <View style={styles.deleteSuccessRingInner}>
                <CheckCircle2 size={36} color="#059669" strokeWidth={2.5} />
              </View>
            </View>

            <View style={styles.deleteSuccessPill}>
              <Sparkles size={12} color="#059669" style={{ marginRight: 5 }} />
              <Text style={styles.deleteSuccessPillTxt}>CARE CELL PERMANENTLY REMOVED</Text>
            </View>

            <Text style={styles.deleteSuccessMainTitle}>Care Cell Deleted Successfully! 🗑️</Text>
            <Text style={styles.deleteSuccessMainSubtitle}>
              The fellowship group has been completely removed from the church roster and all linked members have been unlinked.
            </Text>

            {deletedCellSummary && (
              <View style={styles.deleteSuccessDetailsBox}>
                <View style={styles.deleteCellHeaderRow}>
                  <Building2 size={16} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteCellNameTxt} numberOfLines={1}>
                    {deletedCellSummary.name}
                  </Text>
                  <View style={styles.deleteCellCodeBadge}>
                    <Text style={styles.deleteCellCodeTxt}>{deletedCellSummary.code}</Text>
                  </View>
                </View>

                <View style={styles.deleteDivider} />

                {deletedCellSummary.leaderName ? (
                  <View style={styles.deleteMetaRow}>
                    <User size={13} color="#1A2D5A" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteMetaLabel}>Leader:</Text>
                    <Text style={styles.deleteMetaVal} numberOfLines={1}>
                      {deletedCellSummary.leaderName}
                    </Text>
                  </View>
                ) : null}

                {deletedCellSummary.location ? (
                  <View style={styles.deleteMetaRow}>
                    <MapPin size={13} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteMetaLabel}>Location:</Text>
                    <Text style={styles.deleteMetaVal} numberOfLines={1}>
                      {deletedCellSummary.location}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.deleteMetaRow}>
                  <Users size={13} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteMetaLabel}>Members:</Text>
                  <Text style={[styles.deleteMetaVal, { color: '#059669', fontWeight: '800' }]}>
                    All members safely unlinked
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.deleteSuccessDoneBtn, { backgroundColor: primaryBtnBg }]}
              onPress={() => {
                setDeleteSuccessModalVisible(false);
                setDeletedCellSummary(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.deleteSuccessDoneBtnTxt, { color: primaryBtnText }]}>
                Done & Return to Care Cells
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchTxt: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginTop: -2,
  },
  statusFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusFilterChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusFilterChipTxtActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  cellCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cellCardInactive: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  codeBadgeTxt: {
    fontFamily: 'monospace',
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusChipTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  statusInactive: {
    backgroundColor: '#FFFBEB',
  },
  statusInactiveTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  statusArchived: {
    backgroundColor: '#FEE2E2',
  },
  statusArchivedTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  cellName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  cellDesc: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  leaderAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leaderName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderRoleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  leaderRoleBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  leaderPhone: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  asstLeaderRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  asstLeaderTxt: {
    fontSize: 12,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTxt: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardActionsContainer: {
    gap: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  cardActionBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  deleteCardIconBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cardIconBtn: {
    width: 38,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
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

  /* ── Custom Delete Confirmation & Success Styles ── */
  modalOverlayScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  customConfirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalCloseIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteWarningRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteWarningRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  deleteConfirmSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  deleteCellPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 12,
    width: '100%',
    marginBottom: 14,
  },
  deleteCellHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteCellNameTxt: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2D5A',
    marginRight: 6,
  },
  deleteCellCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteCellCodeTxt: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#1E3A8A',
  },
  deleteDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  deleteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  deleteMetaLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    width: 62,
  },
  deleteMetaVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  deletePermanentWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
    marginBottom: 18,
  },
  deletePermanentWarningTxt: {
    flex: 1,
    fontSize: 11.5,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 16,
  },
  deleteActionsBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelActionBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  deleteConfirmActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  deleteConfirmActionBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Delete Success Card */
  deleteSuccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  deleteSuccessRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteSuccessRingInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  deleteSuccessPillTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  deleteSuccessMainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A2D5A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  deleteSuccessMainSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  deleteSuccessDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 12,
    width: '100%',
    marginBottom: 18,
  },
  deleteSuccessDoneBtn: {
    width: '100%',
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2D5A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  deleteSuccessDoneBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
