import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Save,
  Check,
  ChevronDown,
  UserCheck,
  Users,
  Download,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import CareCellService from '../../../../services/CareCellService';
import { formatDateDisplay } from '../../../../utils/DateUtils';
import { useAdminTheme, createAdminThemedStyles, formatCareCellLabel } from '../careCellTheme';
import {
  CareCell,
  CareCellMeeting,
  CareCellMembership,
  CareCellAttendance,
  AttendanceStatus,
} from '../../../../types/CareCellTypes';

interface MemberAttendanceRowState {
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  status: AttendanceStatus;
  notes?: string;
}

interface CareCellAttendanceTabProps {
  cells: CareCell[];
  selectedMeeting?: CareCellMeeting | null;
  onClearSelectedMeeting: () => void;
}

export default function CareCellAttendanceTab({
  cells,
  selectedMeeting,
  onClearSelectedMeeting,
}: CareCellAttendanceTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [selectedCellId, setSelectedCellId] = useState<string>(
    selectedMeeting?.cellId || cells[0]?.id || ''
  );
  const [meetings, setMeetings] = useState<CareCellMeeting[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<CareCellMeeting | null>(selectedMeeting || null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rosterRows, setRosterRows] = useState<MemberAttendanceRowState[]>([]);

  // Meeting Picker Modal
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);

  // Load meetings when cell changes
  useEffect(() => {
    if (!selectedCellId) return;
    let isMounted = true;
    CareCellService.getMeetings(undefined, selectedCellId).then((list) => {
      if (!isMounted) return;
      setMeetings(list);
      // If we don't have a current meeting or the current meeting belongs to a different cell
      if (!currentMeeting || currentMeeting.cellId !== selectedCellId) {
        setCurrentMeeting(list[0] || null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCellId]);

  // Sync when selectedMeeting prop changes externally
  useEffect(() => {
    if (selectedMeeting) {
      setSelectedCellId(selectedMeeting.cellId);
      setCurrentMeeting(selectedMeeting);
    }
  }, [selectedMeeting]);

  // Load cell roster and existing attendance when currentMeeting changes
  const loadAttendanceRoster = useCallback(async () => {
    if (!currentMeeting) {
      setRosterRows([]);
      return;
    }

    setLoading(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const [memberships, existingAttendance] = await Promise.all([
        CareCellService.getActiveCellMemberships(churchId, currentMeeting.cellId),
        CareCellService.getMeetingAttendance(churchId, currentMeeting.id),
      ]);

      const attendanceMap = new Map<string, CareCellAttendance>();
      existingAttendance.forEach((a) => attendanceMap.set(a.memberId, a));

      // Build rows for all active cell members
      const rows: MemberAttendanceRowState[] = memberships.map((m) => {
        const existing = attendanceMap.get(m.memberId);
        return {
          memberId: m.memberId,
          memberName: m.memberName,
          memberPhone: m.memberPhone,
          memberPhoto: m.memberPhoto,
          status: existing ? existing.attendanceStatus : 'Present', // Default to Present for quick roll-call
          notes: existing?.notes || '',
        };
      });

      setRosterRows(rows);
    } catch (e) {
      console.error('Error loading attendance roster:', e);
    } finally {
      setLoading(false);
    }
  }, [currentMeeting]);

  useEffect(() => {
    loadAttendanceRoster();
  }, [loadAttendanceRoster]);

  // Attendance Counts Summary
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    rosterRows.forEach((r) => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Late') late++;
      else if (r.status === 'Excused') excused++;
    });
    const total = rosterRows.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, absent, late, excused, total, rate };
  }, [rosterRows]);

  const setAllStatus = (newStatus: AttendanceStatus) => {
    setRosterRows((prev) =>
      prev.map((r) => ({
        ...r,
        status: newStatus,
      }))
    );
  };

  const updateMemberStatus = (memberId: string, newStatus: AttendanceStatus) => {
    setRosterRows((prev) =>
      prev.map((r) => (r.memberId === memberId ? { ...r, status: newStatus } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (!currentMeeting) {
      Alert.alert('No Meeting', 'Please select a meeting first.');
      return;
    }
    if (rosterRows.length === 0) {
      Alert.alert('Empty Roster', 'There are no active members assigned to this Care Cell.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.recordMeetingAttendance(
        churchId,
        currentMeeting.id,
        currentMeeting.cellId,
        rosterRows.map((r) => ({
          memberId: r.memberId,
          memberName: r.memberName,
          memberPhone: r.memberPhone,
          memberPhoto: r.memberPhoto,
          attendanceStatus: r.status,
          notes: r.notes,
        })),
        'Admin'
      );

      Alert.alert('Attendance Saved!', `Successfully recorded attendance for ${rosterRows.length} members.`);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      Alert.alert('Error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const renderMemberRow = ({ item }: { item: MemberAttendanceRowState }) => {
    const initials = item.memberName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'M';

    return (
      <View style={styles.memberCard}>
        {/* Avatar */}
        {item.memberPhoto ? (
          <Image source={{ uri: item.memberPhoto }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        {/* Member Name */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.memberName}
          </Text>
          {item.memberPhone ? <Text style={styles.memberPhone}>{item.memberPhone}</Text> : null}
        </View>

        {/* Status Toggle Chips */}
        <View style={styles.statusChipsWrap}>
          {/* Present */}
          <TouchableOpacity
            style={[styles.statusChip, item.status === 'Present' && styles.statusChipPresentActive]}
            onPress={() => updateMemberStatus(item.memberId, 'Present')}
          >
            <Text
              style={[
                styles.statusChipTxt,
                item.status === 'Present' && styles.statusChipTxtActive,
              ]}
            >
              P
            </Text>
          </TouchableOpacity>

          {/* Late */}
          <TouchableOpacity
            style={[styles.statusChip, item.status === 'Late' && styles.statusChipLateActive]}
            onPress={() => updateMemberStatus(item.memberId, 'Late')}
          >
            <Text
              style={[
                styles.statusChipTxt,
                item.status === 'Late' && styles.statusChipTxtActive,
              ]}
            >
              L
            </Text>
          </TouchableOpacity>

          {/* Excused */}
          <TouchableOpacity
            style={[styles.statusChip, item.status === 'Excused' && styles.statusChipExcusedActive]}
            onPress={() => updateMemberStatus(item.memberId, 'Excused')}
          >
            <Text
              style={[
                styles.statusChipTxt,
                item.status === 'Excused' && styles.statusChipTxtActive,
              ]}
            >
              E
            </Text>
          </TouchableOpacity>

          {/* Absent */}
          <TouchableOpacity
            style={[styles.statusChip, item.status === 'Absent' && styles.statusChipAbsentActive]}
            onPress={() => updateMemberStatus(item.memberId, 'Absent')}
          >
            <Text
              style={[
                styles.statusChipTxt,
                item.status === 'Absent' && styles.statusChipTxtActive,
              ]}
            >
              A
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleExportAttendanceCSV = async () => {
    if (!currentMeeting || rosterRows.length === 0) {
      Alert.alert('No Attendance', 'Select a meeting with members to export.');
      return;
    }
    try {
      const attendanceData = rosterRows.map((r) => ({
        id: `${currentMeeting.id}_${r.memberId}`,
        meetingId: currentMeeting.id,
        cellId: selectedCellId,
        memberId: r.memberId,
        memberName: r.memberName,
        memberPhone: r.memberPhone,
        attendanceStatus: r.status,
        notes: r.notes,
        markedBy: 'Admin',
        markedAt: new Date(),
      }));

      const csvContent = CareCellService.generateAttendanceCSV(
        attendanceData,
        currentMeeting.title,
        currentMeeting.date
      );
      const filename = `Attendance_${(currentMeeting.title || 'Meeting').replace(/[^a-zA-Z0-9]/g, '_')}_${currentMeeting.date}.csv`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filepath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(filepath, { mimeType: 'text/csv', dialogTitle: 'Export Attendance Sheet' });
    } catch (e: any) {
      console.error('Export attendance error:', e);
      Alert.alert('Export Failed', e?.message || 'Could not export attendance.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Cell Selector Scroll */}
      <View style={styles.cellSelectorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cellSelectorScroll}>
          {cells.map((c) => {
            const isSelected = selectedCellId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.cellChip,
                  isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => {
                  setSelectedCellId(c.id);
                  onClearSelectedMeeting();
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.cellChipTxt,
                    isSelected && { color: primaryBtnText, fontWeight: '800' },
                  ]}
                >
                  {formatCareCellLabel(c.cellCode, c.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Meeting Picker Trigger Banner */}
      <View style={styles.meetingHeaderBox}>
        <TouchableOpacity
          style={[styles.meetingDropdown, { backgroundColor: cardSurface, borderColor: secondaryBtnBorder }]}
          onPress={() => setShowMeetingPicker(true)}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.meetingLabel, { color: secondaryText }]}>CURRENT MEETING ROLL-CALL</Text>
            <Text style={[styles.meetingTitleTxt, { color: primaryText }]} numberOfLines={1}>
              {currentMeeting
                ? `${currentMeeting.title} (${formatDateDisplay(currentMeeting.date)})`
                : 'Select a Meeting to Mark Attendance'}
            </Text>
          </View>
          <ChevronDown size={18} color={primaryText} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary & Quick Bulk Actions */}
      {currentMeeting && (
        <View style={styles.summaryBar}>
          <View style={styles.statsBadgesRow}>
            <View style={[styles.miniBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.miniBadgeTxt, { color: '#059669' }]}>P: {counts.present}</Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.miniBadgeTxt, { color: '#D97706' }]}>L: {counts.late}</Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.miniBadgeTxt, { color: '#2563EB' }]}>E: {counts.excused}</Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.miniBadgeTxt, { color: '#DC2626' }]}>A: {counts.absent}</Text>
            </View>
            <View style={[styles.rateBadge, { backgroundColor: primaryBtnBg }]}>
              <Text style={[styles.rateBadgeTxt, { color: primaryBtnText }]}>{counts.rate}%</Text>
            </View>
          </View>

          {/* Quick Mark All & Export */}
          <View style={styles.quickMarkRow}>
            <TouchableOpacity
              style={[styles.quickMarkBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => setAllStatus('Present')}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickMarkBtnTxt, { color: secondaryBtnText }]}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickMarkBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={() => setAllStatus('Absent')}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickMarkBtnTxt, { color: secondaryBtnText }]}>All Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportAttBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              onPress={handleExportAttendanceCSV}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Download size={13} color={secondaryBtnText} style={{ marginRight: 4 }} />
              <Text style={[styles.exportAttBtnTxt, { color: secondaryBtnText }]}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Roster List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1A2D5A" />
          <Text style={styles.loadingTxt}>Loading meeting attendance...</Text>
        </View>
      ) : !currentMeeting ? (
        <View style={styles.emptyContainer}>
          <Calendar size={44} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Meeting Selected</Text>
          <Text style={styles.emptySubtitle}>Select a meeting above to start recording attendance.</Text>
        </View>
      ) : (
        <FlatList
          data={rosterRows}
          keyExtractor={(item) => item.memberId}
          renderItem={renderMemberRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Members in Cell</Text>
              <Text style={styles.emptySubtitle}>
                Add members to this Care Cell under the "Cell Members" tab to take roll-call.
              </Text>
            </View>
          }
        />
      )}

      {/* Save Button Fixed Footer */}
      {currentMeeting && rosterRows.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: primaryBtnBg },
              saving && styles.saveBtnDisabled,
            ]}
            onPress={handleSaveAttendance}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={primaryBtnText} />
            ) : (
              <>
                <Save size={18} color={primaryBtnText} style={{ marginRight: 8 }} />
                <Text style={[styles.saveBtnTxt, { color: primaryBtnText }]}>SAVE ATTENDANCE ROLL-CALL</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Meeting Picker Modal */}
      <Modal visible={showMeetingPicker} transparent animationType="fade" onRequestClose={() => setShowMeetingPicker(false)}>
        <TouchableOpacity style={styles.subModalOverlay} activeOpacity={1} onPress={() => setShowMeetingPicker(false)}>
          <View style={styles.subModalContainer}>
            <Text style={[styles.subModalTitle, { color: primaryText }]}>Select Meeting</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {meetings.length === 0 ? (
                <Text style={styles.noMeetingsTxt}>No meetings scheduled for this cell.</Text>
              ) : (
                meetings.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.meetingPickerItem, currentMeeting?.id === m.id && styles.meetingPickerItemActive]}
                    onPress={() => {
                      setCurrentMeeting(m);
                      setShowMeetingPicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.meetingPickerTitle}>{m.title}</Text>
                      <Text style={styles.meetingPickerDate}>
                        {formatDateDisplay(m.date)} · {m.startTime} · {m.status}
                      </Text>
                    </View>
                    {currentMeeting?.id === m.id && <Check size={16} color={primaryText} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 6,
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
  meetingHeaderBox: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  meetingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  meetingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  meetingTitleTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
  rateBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickMarkRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickMarkBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickMarkBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  exportAttBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exportAttBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 80,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  memberInfo: {
    flex: 1,
    marginRight: 8,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusChipsWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  statusChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  statusChipTxtActive: {
    color: '#FFFFFF',
  },
  statusChipPresentActive: {
    backgroundColor: '#059669',
  },
  statusChipLateActive: {
    backgroundColor: '#D97706',
  },
  statusChipExcusedActive: {
    backgroundColor: '#2563EB',
  },
  statusChipAbsentActive: {
    backgroundColor: '#DC2626',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D5A',
    paddingVertical: 13,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalContainer: {
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
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2D5A',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  meetingPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  meetingPickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  meetingPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  meetingPickerDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  noMeetingsTxt: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

