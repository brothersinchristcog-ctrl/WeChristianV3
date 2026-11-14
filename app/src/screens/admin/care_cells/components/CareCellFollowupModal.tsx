import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { X, Heart, Phone, MessageCircle, Home, UserCheck, Calendar } from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { CareCellFollowup, FollowupStatus, FollowupType } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';

interface CareCellFollowupModalProps {
  visible: boolean;
  onClose: () => void;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  assignedLeaderId: string;
  assignedLeaderName?: string;
  initialReason?: string;
  onSuccess?: () => void;
}

const FOLLOWUP_TYPES: { type: FollowupType; label: string; icon: any }[] = [
  { type: 'Phone Call', label: 'Phone Call', icon: Phone },
  { type: 'WhatsApp Message', label: 'WhatsApp', icon: MessageCircle },
  { type: 'Home Visit', label: 'Home Visit', icon: Home },
  { type: 'Personal Meeting', label: 'In-Person', icon: UserCheck },
  { type: 'Prayer Visit', label: 'Prayer Visit', icon: Heart },
];

const FOLLOWUP_STATUSES: FollowupStatus[] = [
  'Pending',
  'Contacted',
  'Completed',
  'Needs Further Follow-up',
];

export default function CareCellFollowupModal({
  visible,
  onClose,
  cellId,
  cellCode,
  cellName,
  memberId,
  memberName,
  memberPhone,
  memberPhoto,
  assignedLeaderId,
  assignedLeaderName,
  initialReason,
  onSuccess,
}: CareCellFollowupModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [followupType, setFollowupType] = useState<FollowupType>('Phone Call');
  const [status, setStatus] = useState<FollowupStatus>('Contacted');
  const [reason, setReason] = useState(initialReason || 'Missed recent care cell fellowship');
  const [notes, setNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleOpenWhatsApp = () => {
    if (!memberPhone) {
      Alert.alert('No Phone', 'No phone number available for this member.');
      return;
    }
    const clean = memberPhone.replace(/[^0-9]/g, '');
    const msg = `Praise the Lord ${memberName}! Greetings from our Care Cell fellowship. We missed you at our meeting and are praying for your family. Please let us know if there is anything we can intercede for.`;
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Please ensure WhatsApp is installed on your device.');
    });
  };

  const handleSave = async () => {
    if (!notes.trim()) {
      Alert.alert('Notes Required', 'Please enter pastoral follow-up notes or outcomes.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.createFollowup(churchId, {
        cellId,
        cellCode,
        cellName,
        memberId,
        memberName,
        memberPhone,
        memberPhoto,
        assignedLeaderId,
        assignedLeaderName,
        followupType,
        followupDate: todayStr,
        reason: reason.trim(),
        notes: notes.trim(),
        nextFollowupDate: nextFollowupDate.trim() || undefined,
        status,
      });

      Alert.alert('Follow-up Logged', 'Pastoral care record has been saved successfully.');
      setNotes('');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error('Error logging follow-up:', e);
      Alert.alert('Error', e?.message || 'Failed to save follow-up log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIcon}>
                <Heart size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Pastoral Follow-up</Text>
                <Text style={styles.headerSubtitle}>
                  Member: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{memberName}</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Quick Contact Bar */}
            {memberPhone ? (
              <View style={styles.quickContactBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickContactPhone}>{memberPhone}</Text>
                  <Text style={styles.quickContactSub}>Direct member phone contact</Text>
                </View>
                <TouchableOpacity style={styles.whatsAppQuickBtn} onPress={handleOpenWhatsApp}>
                  <MessageCircle size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.whatsAppQuickBtnTxt}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Follow-up Type Selector */}
            <Text style={styles.label}>Follow-up Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {FOLLOWUP_TYPES.map((t) => {
                const isSelected = followupType === t.type;
                const IconComponent = t.icon;
                return (
                  <TouchableOpacity
                    key={t.type}
                    style={[
                      styles.typeChip,
                      isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                    ]}
                    onPress={() => setFollowupType(t.type)}
                  >
                    <IconComponent size={14} color={isSelected ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                    <Text style={[styles.typeChipTxt, isSelected && { color: primaryBtnText, fontWeight: '700' }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Reason */}
            <Text style={styles.label}>Reason for Follow-up</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Absent 2+ meetings, Bereavement, Hospital recovery"
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
            />

            {/* Pastoral Notes */}
            <Text style={styles.label}>Pastoral Notes & Feedback *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe conversation, spiritual state, prayer points discussed..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Status Selector */}
            <Text style={styles.label}>Current Outcome / Status</Text>
            <View style={styles.statusRow}>
              {FOLLOWUP_STATUSES.map((s) => {
                const isSelected = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusChipTxt, isSelected && { color: primaryBtnText, fontWeight: '700' }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Next Followup Date (Optional) */}
            <Text style={styles.label}>Next Follow-up Date (Optional, YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-11-15"
              placeholderTextColor="#94A3B8"
              value={nextFollowupDate}
              onChangeText={setNextFollowupDate}
            />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnTxt, { color: secondaryBtnText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: primaryBtnBg }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={primaryBtnText} />
                ) : (
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>Save Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingTop: 14,
  },
  quickContactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  quickContactPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  quickContactSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  whatsAppQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  whatsAppQuickBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  typeChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#1A2D5A',
  },
  typeChipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTxtSelected: {
    color: '#1A2D5A',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 85,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipSelected: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  statusChipTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  statusChipTxtSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

