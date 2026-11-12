import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Home,
  Calendar,
  Clock,
  Users,
  FileText,
  Send,
  Sparkles,
  ChevronDown,
  Building2,
  CheckCircle2,
  Check,
  UserCheck,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { CareCell, CareCellMembership } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';

interface CareCellVisitModalProps {
  visible: boolean;
  onClose: () => void;
  cells: CareCell[];
  initialCellId?: string;
  createdBy: string;
  createdByName?: string;
  onSuccess?: () => void;
}

const TITLE_PRESETS = [
  'Pastoral Home Visit',
  'Care & Prayer',
  'Family Fellowship',
  'Healing Prayer',
  'Welcome Visit',
];

export default function CareCellVisitModal({
  visible,
  onClose,
  cells,
  initialCellId,
  createdBy,
  createdByName,
  onSuccess,
}: CareCellVisitModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [selectedCellId, setSelectedCellId] = useState<string>('');
  const [title, setTitle] = useState('Pastoral Home Visit');
  const [purpose, setPurpose] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('17:00');
  const [visitors, setVisitors] = useState('Pastor & Cell Leader');
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Specific member selection state
  const [cellMembers, setCellMembers] = useState<CareCellMembership[]>([]);
  const [visitScope, setVisitScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Set default cell and date when opened
  useEffect(() => {
    if (visible) {
      const defaultId = initialCellId && initialCellId !== 'ALL'
        ? initialCellId
        : cells[0]?.id || '';
      setSelectedCellId(defaultId);

      // Default date to tomorrow in YYYY-MM-DD
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setVisitDate(`${yyyy}-${mm}-${dd}`);
      setVisitTime('17:00');
      setVisitors('Pastor & Cell Leader');
      setTitle('Pastoral Home Visit');
      setPurpose('');
    }
  }, [visible, initialCellId, cells]);

  // Fetch count of active members for selected cell
  useEffect(() => {
    if (visible && selectedCellId) {
      let isMounted = true;
      setLoadingMembers(true);
      (async () => {
        try {
          const churchId = await CareCellService.getChurchId();
          const members = await CareCellService.getActiveCellMemberships(churchId, selectedCellId);
          if (isMounted) {
            setCellMembers(members);
            setMemberCount(members.length);
          }
        } catch (e) {
          if (isMounted) setMemberCount(null);
        } finally {
          if (isMounted) setLoadingMembers(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [visible, selectedCellId]);

  const activeCell = cells.find((c) => c.id === selectedCellId) || cells[0];

  const handleSave = async () => {
    if (!selectedCellId) {
      Alert.alert('Select Cell', 'Please select a Care Cell for this visit.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a visit title.');
      return;
    }
    if (!visitDate.trim()) {
      Alert.alert('Required', 'Please enter the visit date (YYYY-MM-DD).');
      return;
    }
    if (!visitTime.trim()) {
      Alert.alert('Required', 'Please enter the visit time (e.g. 17:00 or 5:00 PM).');
      return;
    }
    if (!visitors.trim()) {
      Alert.alert('Required', 'Please specify the visiting team (e.g. Pastor & Cell Leader).');
      return;
    }
    if (visitScope === 'SPECIFIC' && selectedMemberIds.length === 0) {
      Alert.alert('Select Member', 'Please select at least one specific cell member to visit.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.createVisitNotification(churchId, {
        cellId: selectedCellId,
        cellCode: activeCell?.cellCode || '',
        cellName: activeCell?.name || 'Care Cell',
        title: title.trim(),
        purpose: purpose.trim(),
        visitDate: visitDate.trim(),
        visitTime: visitTime.trim(),
        visitors: visitors.trim(),
        createdBy,
        createdByName: createdByName || 'Leader',
        targetMemberIds: visitScope === 'SPECIFIC' ? selectedMemberIds : undefined,
      });

      const recipientMsg = visitScope === 'SPECIFIC'
        ? `delivered to the ${selectedMemberIds.length} selected member(s)`
        : `delivered to all assigned members of ${activeCell?.name || 'this Care Cell'}`;
      Alert.alert(
        'Visit Notification Sent!',
        `Notification successfully ${recipientMsg}. Members can now respond with Accept or Decline and specify their preferred visit time.`
      );

      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error('Error creating visit notification:', e);
      Alert.alert('Error', e.message || 'Failed to create visit notification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDateShortcut = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setVisitDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconBadge}>
              <Home size={20} color={primaryText} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Schedule Care Cell Visit</Text>
              <Text style={styles.headerSubtitle}>
                Sends visit notification with Accept & Decline confirmation to all members
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Target Care Cell Selector */}
            <Text style={styles.fieldLabel}>TARGET CARE CELL *</Text>
            {cells.length <= 1 ? (
              <View style={styles.singleCellBanner}>
                <Building2 size={16} color={primaryText} />
                <Text style={styles.singleCellTxt}>
                  {activeCell ? `${activeCell.cellCode} · ${activeCell.name}` : 'Care Cell'}
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cellsChipScroll}>
                {cells.map((c) => {
                  const isSel = c.id === selectedCellId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.cellChip,
                        isSel && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                      ]}
                      onPress={() => setSelectedCellId(c.id)}
                      activeOpacity={0.8}
                    >
                      <Building2 size={13} color={isSel ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                      <Text style={[styles.cellChipTxt, isSel && { color: primaryBtnText }]}>
                        {c.cellCode} ({c.name})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Visit Recipient Target (All Members vs Specific Member) */}
            <Text style={styles.fieldLabel}>VISIT RECIPIENTS / TARGET *</Text>
            <View style={styles.scopeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.scopeBtn,
                  visitScope === 'ALL' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => setVisitScope('ALL')}
                activeOpacity={0.8}
              >
                <Users size={14} color={visitScope === 'ALL' ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                <Text style={[styles.scopeBtnTxt, visitScope === 'ALL' && { color: primaryBtnText, fontWeight: '800' }]}>
                  All Members ({memberCount || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeBtn,
                  visitScope === 'SPECIFIC' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => setVisitScope('SPECIFIC')}
                activeOpacity={0.8}
              >
                <UserCheck size={14} color={visitScope === 'SPECIFIC' ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                <Text style={[styles.scopeBtnTxt, visitScope === 'SPECIFIC' && { color: primaryBtnText, fontWeight: '800' }]}>
                  Specific Member{selectedMemberIds.length > 0 ? ` (${selectedMemberIds.length})` : 's'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* If Specific: Member Picker Chips */}
            {visitScope === 'SPECIFIC' && (
              <View style={styles.specificMembersBox}>
                <Text style={styles.specificMembersHelper}>
                  Tap members to select who should receive this house visit notification:
                </Text>
                {loadingMembers ? (
                  <ActivityIndicator size="small" color={primaryText} style={{ marginVertical: 8 }} />
                ) : cellMembers.length === 0 ? (
                  <Text style={styles.noMembersInCellTxt}>No active members in this cell yet.</Text>
                ) : (
                  <View style={styles.memberChipsWrap}>
                    {cellMembers.map((m) => {
                      const isSelected = selectedMemberIds.includes(m.memberId);
                      return (
                        <TouchableOpacity
                          key={m.memberId}
                          style={[
                            styles.memberSelectChip,
                            isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                          ]}
                          onPress={() => {
                            setSelectedMemberIds((prev) =>
                              prev.includes(m.memberId)
                                ? prev.filter((id) => id !== m.memberId)
                                : [...prev, m.memberId]
                            );
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.miniCheck, isSelected && { backgroundColor: primaryBtnText, borderColor: primaryBtnText }]}>
                            {isSelected && <Check size={10} color={primaryBtnBg} strokeWidth={3} />}
                          </View>
                          <Text style={[styles.memberSelectChipName, isSelected && { color: primaryBtnText, fontWeight: '700' }]}>
                            {m.memberName}
                          </Text>
                          {m.memberPhone ? (
                            <Text style={[styles.memberSelectChipPhone, isSelected && { color: primaryBtnText, opacity: 0.75 }]}>
                              ({m.memberPhone.slice(-4)})
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Title & Quick Presets */}
            <Text style={styles.fieldLabel}>VISIT TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pastoral Home Visit"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {TITLE_PRESETS.map((preset) => {
                const isActive = title === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      isActive && { backgroundColor: primaryBtnBg, borderWidth: 1, borderColor: primaryBtnBg },
                    ]}
                    onPress={() => setTitle(preset)}
                  >
                    <Text style={[styles.presetChipTxt, isActive && { color: primaryBtnText, fontWeight: '800' }]}>
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Date & Time Row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>VISIT DATE *</Text>
                <View style={styles.iconInputWrap}>
                  <Calendar size={16} color={secondaryText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={visitDate}
                    onChangeText={setVisitDate}
                  />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>VISIT TIME *</Text>
                <View style={styles.iconInputWrap}>
                  <Clock size={16} color={secondaryText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="e.g. 17:00 / 5 PM"
                    placeholderTextColor="#94A3B8"
                    value={visitTime}
                    onChangeText={setVisitTime}
                  />
                </View>
              </View>
            </View>

            {/* Quick Date Shortcuts below Date & Time */}
            <View style={styles.shortcutRow}>
              <Text style={styles.shortcutMiniLbl}>QUICK DATE:</Text>
              <TouchableOpacity
                onPress={() => handleDateShortcut(0)}
                style={[styles.dateShortcutBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              >
                <Text style={[styles.dateShortcutTxt, { color: secondaryBtnText }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDateShortcut(1)}
                style={[styles.dateShortcutBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              >
                <Text style={[styles.dateShortcutTxt, { color: secondaryBtnText }]}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDateShortcut(2)}
                style={[styles.dateShortcutBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
              >
                <Text style={[styles.dateShortcutTxt, { color: secondaryBtnText }]}>In 2 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Visiting Team */}
            <Text style={styles.fieldLabel}>VISITING TEAM / VISITORS *</Text>
            <View style={styles.iconInputWrap}>
              <Users size={16} color={secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="e.g. Pastor & Cell Leader"
                placeholderTextColor="#94A3B8"
                value={visitors}
                onChangeText={setVisitors}
              />
            </View>

            {/* Purpose / Pastoral Notes */}
            <Text style={styles.fieldLabel}>PURPOSE / PASTORAL INSTRUCTIONS</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Pastoral encouragement, family blessing prayer, and fellowship check-in..."
              placeholderTextColor="#94A3B8"
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Live Delivery Preview Banner */}
            <View style={styles.previewBanner}>
              <Sparkles size={18} color="#059669" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle}>Live Member Notification Delivery</Text>
                <Text style={styles.previewBody}>
                  {loadingMembers ? (
                    'Calculating recipient members...'
                  ) : (
                    `Notification will be sent exclusively to all ${memberCount ?? 0} assigned members of ${
                      activeCell?.name || 'this cell'
                    }. Each member will see Accept and Decline buttons in their app to confirm their availability.`
                  )}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
              disabled={saving}
            >
              <Text style={[styles.cancelBtnTxt, { color: secondaryBtnText }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.submitBtn, { backgroundColor: primaryBtnBg }]}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={primaryBtnText} />
              ) : (
                <>
                  <Send size={16} color={primaryBtnText} style={{ marginRight: 8 }} />
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>Send Visit Notification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },
  singleCellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  singleCellTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cellsChipScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cellChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  cellChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  cellChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cellChipTxtActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  iconInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 38,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
  },
  presetScroll: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  presetChipActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  presetChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTxtActive: {
    color: '#3730A3',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  shortcutMiniLbl: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dateShortcutBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  dateShortcutTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  previewBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  previewBody: {
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scopeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  scopeBtnActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  scopeBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scopeBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  specificMembersBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  specificMembersHelper: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 8,
  },
  noMembersInCellTxt: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  memberChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
  },
  memberSelectChipActive: {
    backgroundColor: '#3730A3',
    borderColor: '#3730A3',
  },
  miniCheck: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#FFFFFF',
  },
  miniCheckActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  memberSelectChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  memberSelectChipNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  memberSelectChipPhone: {
    fontSize: 10.5,
    color: '#64748B',
    marginLeft: 3,
  },
});

