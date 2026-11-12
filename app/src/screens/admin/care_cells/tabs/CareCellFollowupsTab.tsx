import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import {
  Heart,
  Search,
  Phone,
  MessageCircle,
  Home,
  UserCheck,
  Calendar,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';
import { CareCell, CareCellFollowup, FollowupStatus } from '../../../../types/CareCellTypes';
import CareCellFollowupModal from '../components/CareCellFollowupModal';

interface CareCellFollowupsTabProps {
  churchId?: string;
  selectedCellId?: string;
  onSelectCell?: (cellId: string) => void;
}

export default function CareCellFollowupsTab({
  churchId,
  selectedCellId,
  onSelectCell,
}: CareCellFollowupsTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [cells, setCells] = useState<CareCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<string>(selectedCellId || 'ALL');
  const [followups, setFollowups] = useState<CareCellFollowup[]>([]);
  const [inactiveMembers, setInactiveMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [targetMember, setTargetMember] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      const [cellsList, followupsList] = await Promise.all([
        CareCellService.getCareCells(activeChurchId),
        CareCellService.getCellFollowups(activeChurchId, selectedCell === 'ALL' ? undefined : selectedCell, statusFilter),
      ]);

      setCells(cellsList);
      setFollowups(followupsList);

      // Automated Detection for inactive members across selected cell (or first active cell)
      const targetCellId = selectedCell !== 'ALL' ? selectedCell : cellsList[0]?.id;
      if (targetCellId) {
        const inactives = await CareCellService.detectInactiveMembers(activeChurchId, targetCellId);
        setInactiveMembers(inactives);
      } else {
        setInactiveMembers([]);
      }
    } catch (e) {
      console.error('Error loading Care Cell follow-ups tab:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [churchId, selectedCell, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedCellId && selectedCellId !== selectedCell) {
      setSelectedCell(selectedCellId);
    }
  }, [selectedCellId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    const msg = `Praise the Lord ${name || 'Brother/Sister'}! Greetings from your Care Cell leader. We are praying for you.`;
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Please ensure WhatsApp is installed.');
    });
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available.');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call.');
    });
  };

  const handleStatusChange = async (followupId: string, currentStatus: FollowupStatus) => {
    const nextStatusMap: Record<FollowupStatus, FollowupStatus> = {
      Pending: 'Contacted',
      Contacted: 'Completed',
      Completed: 'Needs Further Follow-up',
      'Needs Further Follow-up': 'Completed',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'Completed';

    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      await CareCellService.updateFollowupStatus(activeChurchId, followupId, nextStatus);
      setFollowups((prev) =>
        prev.map((f) => (f.id === followupId ? { ...f, status: nextStatus } : f))
      );
    } catch (e) {
      console.error('Error updating follow-up status:', e);
      Alert.alert('Error', 'Could not update status.');
    }
  };

  const filteredFollowups = followups.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.memberName || '').toLowerCase().includes(q) ||
      (f.reason || '').toLowerCase().includes(q) ||
      (f.cellCode || '').toLowerCase().includes(q) ||
      (f.notes || '').toLowerCase().includes(q)
    );
  });

  const activeCellObj = cells.find((c) => c.id === selectedCell) || cells[0];

  return (
    <View style={styles.container}>
      {/* Cell Selector Bar */}
      <View style={styles.cellSelectorRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'ALL', cellCode: 'ALL CELLS', name: 'All Care Cells' }, ...cells]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCell === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.cellChip,
                  isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => {
                  setSelectedCell(item.id);
                  if (item.id !== 'ALL') onSelectCell?.(item.id);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.cellChipTxt,
                    isSelected && { color: primaryBtnText, fontWeight: '800' },
                  ]}
                >
                  {item.cellCode || item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Top Automated Inactive Members Alert Banner (Phase 3 Automation) */}
      {inactiveMembers.length > 0 && (
        <View style={styles.inactiveAlertBanner}>
          <View style={styles.inactiveAlertHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.inactiveAlertTitle}>
                {inactiveMembers.length} Members Missed 2+ Meetings
              </Text>
            </View>
            <Text style={styles.inactiveAlertBadge}>Action Required</Text>
          </View>
          <Text style={styles.inactiveAlertSub}>
            These members have missed multiple consecutive care cell gatherings. Reach out via call or WhatsApp:
          </Text>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={inactiveMembers}
            keyExtractor={(item) => item.memberId}
            style={{ marginTop: 8 }}
            renderItem={({ item }) => (
              <View style={styles.inactiveMemberCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inactiveMemberName} numberOfLines={1}>
                    {item.memberName}
                  </Text>
                  <Text style={styles.inactiveMemberMeta}>
                    Missed {item.missedCount} meetings
                  </Text>
                </View>
                <View style={styles.inactiveMemberActions}>
                  {item.memberPhone ? (
                    <>
                      <TouchableOpacity
                        style={[styles.inactiveIconBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder, borderWidth: 1 }]}
                        onPress={() => handleCall(item.memberPhone)}
                      >
                        <Phone size={13} color={secondaryBtnText} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inactiveIconBtn, { backgroundColor: '#16A34A' }]}
                        onPress={() => handleOpenWhatsApp(item.memberPhone, item.memberName)}
                      >
                        <MessageCircle size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.logFollowupBtn, { backgroundColor: primaryBtnBg }]}
                    onPress={() => {
                      setTargetMember({
                        memberId: item.memberId,
                        memberName: item.memberName,
                        memberPhone: item.memberPhone,
                        reason: `Missed ${item.missedCount} consecutive care cell meetings`,
                      });
                      setModalVisible(true);
                    }}
                  >
                    <Text style={[styles.logFollowupBtnTxt, { color: primaryBtnText }]}>Log</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Search & Filter Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member, notes, or reason..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.newFollowupBtn, { backgroundColor: primaryBtnBg }]}
          onPress={() => {
            setTargetMember(null);
            setModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={16} color={primaryBtnText} style={{ marginRight: 5 }} />
          <Text style={[styles.newFollowupBtnTxt, { color: primaryBtnText }]}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.statusFilterRow}>
        {['ALL', 'Pending', 'Contacted', 'Completed', 'Needs Further Follow-up'].map((st) => {
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
                {st}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Follow-ups List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Loading pastoral follow-ups...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFollowups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Heart size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Follow-ups Logged</Text>
              <Text style={styles.emptySubtitle}>
                {statusFilter !== 'ALL'
                  ? `No records found under '${statusFilter}'.`
                  : 'Tap "+ Log" above to record pastoral visits, phone calls, or spiritual check-ins.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === 'Completed';
            const isPending = item.status === 'Pending';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardMemberName}>{item.memberName}</Text>
                    <Text style={styles.cardCellCode}>
                      {item.cellCode || 'Care Cell'} · {item.followupDate}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      isCompleted ? styles.statusBadgeCompleted : isPending ? styles.statusBadgePending : styles.statusBadgeContacted,
                    ]}
                    onPress={() => handleStatusChange(item.id, item.status)}
                  >
                    <Text
                      style={[
                        styles.statusBadgeTxt,
                        isCompleted ? styles.statusBadgeCompletedTxt : isPending ? styles.statusBadgePendingTxt : styles.statusBadgeContactedTxt,
                      ]}
                    >
                      {item.status} ▾
                    </Text>
                  </TouchableOpacity>
                </View>

                {item.reason ? (
                  <View style={styles.reasonRow}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonTxt}>{item.reason}</Text>
                  </View>
                ) : null}

                <Text style={styles.notesTxt}>"{item.notes}"</Text>

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={13} color="#64748B" />
                    <Text style={styles.leaderMeta}>
                      Logged by {item.assignedLeaderName || 'Leader'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {item.memberPhone ? (
                      <>
                        <TouchableOpacity
                          style={[styles.cardContactBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                          onPress={() => handleCall(item.memberPhone)}
                        >
                          <Phone size={13} color={secondaryBtnText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardContactBtn, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.16)' : '#F0FDF4', borderColor: isDark ? 'rgba(34, 197, 94, 0.35)' : '#BBF7D0' }]}
                          onPress={() => handleOpenWhatsApp(item.memberPhone, item.memberName)}
                        >
                          <MessageCircle size={13} color={isDark ? '#4ADE80' : '#16A34A'} />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal */}
      {modalVisible && (
        <CareCellFollowupModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          cellId={activeCellObj?.id || ''}
          cellCode={activeCellObj?.cellCode}
          cellName={activeCellObj?.name}
          memberId={targetMember?.memberId || ''}
          memberName={targetMember?.memberName || ''}
          memberPhone={targetMember?.memberPhone}
          assignedLeaderId={activeCellObj?.leaderId || ''}
          assignedLeaderName={activeCellObj?.leaderName || 'Admin'}
          initialReason={targetMember?.reason}
          onSuccess={loadData}
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
    paddingTop: 10,
    paddingBottom: 8,
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
  cellChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  cellChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cellChipTxtSelected: {
    color: '#FFFFFF',
  },
  inactiveAlertBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
  },
  inactiveAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inactiveAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  inactiveAlertBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveAlertSub: {
    fontSize: 11.5,
    color: '#B91C1C',
    marginTop: 4,
    lineHeight: 16,
  },
  inactiveMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    width: 210,
    gap: 8,
  },
  inactiveMemberName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inactiveMemberMeta: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 1,
  },
  inactiveMemberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inactiveIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logFollowupBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logFollowupBtnTxt: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  newFollowupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
  },
  newFollowupBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusFilterChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusFilterChipTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statusFilterChipTxtSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardMemberName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardCellCode: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCompletedTxt: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgePendingTxt: {
    color: '#D97706',
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgeContacted: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeContactedTxt: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  reasonLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  reasonTxt: {
    fontSize: 11.5,
    color: '#1A2D5A',
    fontWeight: '600',
  },
  notesTxt: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  leaderMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  cardContactBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
  },
});
