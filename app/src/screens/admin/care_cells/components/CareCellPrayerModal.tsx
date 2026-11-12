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
import { X, HeartHandshake, Shield, Globe } from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { CareCellPrayerRequest, PrayerRequestPrivacy } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';

interface CareCellPrayerModalProps {
  visible: boolean;
  onClose: () => void;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  onSuccess?: () => void;
}

export default function CareCellPrayerModal({
  visible,
  onClose,
  cellId,
  cellCode,
  cellName,
  memberId,
  memberName,
  memberPhone,
  memberPhoto,
  onSuccess,
}: CareCellPrayerModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrayerRequestPrivacy>('Cell');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a prayer title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please describe your prayer request.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      await CareCellService.createPrayerRequest(churchId, {
        cellId,
        cellCode,
        cellName,
        memberId,
        memberName,
        memberPhone,
        memberPhoto,
        title: title.trim(),
        description: description.trim(),
        privacy,
        status: 'New',
      });

      Alert.alert('Prayer Submitted', 'Your prayer request has been shared with your Care Cell family.');
      setTitle('');
      setDescription('');
      setPrivacy('Cell');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error('Error submitting prayer request:', e);
      Alert.alert('Submission Failed', e?.message || 'Could not save prayer request.');
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
                <HeartHandshake size={20} color={primaryText} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Care Cell Prayer Request</Text>
                <Text style={styles.headerSubtitle}>
                  {cellCode ? `${cellCode} · ` : ''}{cellName || 'Fellowship Group'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Prayer Title */}
            <Text style={styles.label}>Prayer Need / Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Healing for mother, Job interview, Family peace"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />

            {/* Description */}
            <Text style={styles.label}>Prayer Details & Details *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share details so your care cell leader and members can intercede with faith..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Privacy Selection */}
            <Text style={styles.label}>Who can see this prayer?</Text>
            <View style={styles.privacyRow}>
              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  privacy === 'Cell' && { borderColor: primaryBtnBg, backgroundColor: secondaryBtnBg },
                ]}
                onPress={() => setPrivacy('Cell')}
                activeOpacity={0.8}
              >
                <Shield size={18} color={privacy === 'Cell' ? primaryText : secondaryText} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, privacy === 'Cell' && { color: primaryText, fontWeight: '800' }]}>
                    Care Cell Only
                  </Text>
                  <Text style={styles.privacyDesc}>Shared with members & leaders of your cell</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  privacy === 'Public' && { borderColor: primaryBtnBg, backgroundColor: secondaryBtnBg },
                ]}
                onPress={() => setPrivacy('Public')}
                activeOpacity={0.8}
              >
                <Globe size={18} color={privacy === 'Public' ? primaryText : secondaryText} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, privacy === 'Public' && { color: primaryText, fontWeight: '800' }]}>
                    Church Prayer Wall
                  </Text>
                  <Text style={styles.privacyDesc}>Share on community prayer wall</Text>
                </View>
              </TouchableOpacity>
            </View>

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
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>Submit Prayer</Text>
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
    backgroundColor: '#EEF2FF',
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
    fontWeight: '500',
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
    paddingTop: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 90,
  },
  privacyRow: {
    gap: 10,
    marginTop: 4,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  privacyCardSelected: {
    borderColor: '#1A2D5A',
    backgroundColor: '#F0F4FF',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  privacyTitleSelected: {
    color: '#1A2D5A',
  },
  privacyDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
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

