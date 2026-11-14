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
} from 'react-native';
import { X, Megaphone, Users, Globe } from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { useAdminTheme, createAdminThemedStyles, formatCareCellLabel } from '../careCellTheme';

interface CareCellAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  cellId?: string; // Optional if church-wide
  cellCode?: string;
  cellName?: string;
  createdBy: string;
  createdByName?: string;
  onSuccess?: () => void;
}

export default function CareCellAnnouncementModal({
  visible,
  onClose,
  cellId,
  cellCode,
  cellName,
  createdBy,
  createdByName,
  onSuccess,
}: CareCellAnnouncementModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetScope, setTargetScope] = useState<'cell' | 'all'>(cellId ? 'cell' : 'all');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an announcement title.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter the announcement message.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const targetCellId = targetScope === 'cell' && cellId ? cellId : 'ALL';
      const targetCellCode = targetScope === 'cell' ? cellCode : 'ALL';
      const targetCellName = targetScope === 'cell' ? cellName : 'All Care Cells';

      await CareCellService.createAnnouncement(churchId, {
        cellId: targetCellId,
        cellCode: targetCellCode,
        cellName: targetCellName,
        title: title.trim(),
        message: message.trim(),
        createdBy,
        createdByName: createdByName || 'Leader',
        expiryDate: expiryDate.trim() || undefined,
        status: 'Active',
      });

      Alert.alert('Broadcast Sent', 'Your Care Cell announcement has been posted successfully.');
      setTitle('');
      setMessage('');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error('Error posting announcement:', e);
      Alert.alert('Error', e?.message || 'Failed to post announcement.');
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
                <Megaphone size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Post Announcement</Text>
                <Text style={styles.headerSubtitle}>Broadcast notice to fellowship members</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Scope Selection */}
            {cellId ? (
              <>
                <Text style={styles.label}>Broadcast Target</Text>
                <View style={styles.scopeRow}>
                  <TouchableOpacity
                    style={[
                      styles.scopeBtn,
                      targetScope === 'cell' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                    ]}
                    onPress={() => setTargetScope('cell')}
                  >
                    <Users size={15} color={targetScope === 'cell' ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                    <Text style={[styles.scopeBtnTxt, targetScope === 'cell' && { color: primaryBtnText, fontWeight: '700' }]}>
                      This Cell ({formatCareCellLabel(cellCode, cellName, 'Current')})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.scopeBtn,
                      targetScope === 'all' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                    ]}
                    onPress={() => setTargetScope('all')}
                  >
                    <Globe size={15} color={targetScope === 'all' ? primaryBtnText : secondaryText} style={{ marginRight: 6 }} />
                    <Text style={[styles.scopeBtnTxt, targetScope === 'all' && { color: primaryBtnText, fontWeight: '700' }]}>
                      All Cells (Church-wide)
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {/* Title */}
            <Text style={styles.label}>Announcement Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Venue Change for Friday Gathering, Fasting Notice"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />

            {/* Message Body */}
            <Text style={styles.label}>Notice Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write the complete announcement details for the cell family..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Expiry Date (Optional) */}
            <Text style={styles.label}>Expiry Date (Optional, YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-11-20"
              placeholderTextColor="#94A3B8"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />

            {/* Action Buttons */}
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
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>Publish Notice</Text>
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
    maxHeight: '90%',
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
    backgroundColor: '#FEF3C7',
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  scopeBtnSelected: {
    borderColor: '#1A2D5A',
    backgroundColor: '#EEF2FF',
  },
  scopeBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scopeBtnTxtSelected: {
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

