import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { X, HeartHandshake, Shield, Globe } from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { PrayerRequestPrivacy } from '../../../../types/CareCellTypes';
import { useTheme } from '../../../../context/ThemeContext';

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
  const { isDark } = useTheme();

  const surfaceBg = isDark ? '#1e293b' : '#ffffff';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const accentColor = isDark ? '#38bdf8' : '#1a2d5a';
  const accentBg = isDark ? 'rgba(56, 189, 248, 0.14)' : '#eef2ff';
  const submitBg = isDark ? '#2b52a1' : '#1a2d5a';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrayerRequestPrivacy>('Cell');
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const titleYRef = useRef(0);
  const descYRef = useRef(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const scrollToField = (yPos: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, yPos - 16), animated: true });
    }, 120);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a prayer title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please describe your prayer request.');
      return;
    }

    Keyboard.dismiss();
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

      const confirmMsg =
        privacy === 'Public'
          ? 'Your prayer request has been sent to your Church leadership & Church Prayer Wall.'
          : 'Your prayer request has been shared privately with your Care Cell members and leaders.';

      Alert.alert('Prayer Submitted', confirmMsg);
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

  const windowHeight = Dimensions.get('window').height;
  const maxSheetHeight =
    keyboardHeight > 0
      ? Math.max(300, windowHeight - keyboardHeight - (Platform.OS === 'ios' ? 40 : 28))
      : Math.round(windowHeight * 0.88);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[
          styles.modalOverlay,
          Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: surfaceBg,
              maxHeight: maxSheetHeight,
              borderTopWidth: isDark ? 1 : 0,
              borderColor: borderCol,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.headerIcon, { backgroundColor: accentBg }]}>
                <HeartHandshake size={20} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: primaryText }]}>Care Cell Prayer Request</Text>
                <Text style={[styles.headerSubtitle, { color: secondaryText }]} numberOfLines={1}>
                  {cellCode ? `${cellCode} · ` : ''}{cellName || 'Fellowship Group'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: inputBg }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? 36 : 28 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {/* Prayer Title */}
            <View onLayout={(e) => { titleYRef.current = e.nativeEvent.layout.y; }}>
              <Text style={[styles.label, { color: secondaryText }]}>Prayer Need / Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: borderCol,
                    color: primaryText,
                  },
                ]}
                placeholder="e.g. Healing for mother, Job interview, Family peace"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                returnKeyType="next"
                onFocus={() => scrollToField(titleYRef.current)}
              />
            </View>

            {/* Description */}
            <View onLayout={(e) => { descYRef.current = e.nativeEvent.layout.y; }}>
              <Text style={[styles.label, { color: secondaryText }]}>Prayer Details *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: inputBg,
                    borderColor: borderCol,
                    color: primaryText,
                  },
                ]}
                placeholder="Share details so your care cell leader and members can intercede with faith..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => scrollToField(descYRef.current)}
              />
            </View>

            {/* Privacy Selection */}
            <Text style={[styles.label, { color: secondaryText }]}>Who can see this prayer?</Text>
            <View style={styles.privacyRow}>
              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  {
                    backgroundColor: privacy === 'Cell' ? accentBg : inputBg,
                    borderColor: privacy === 'Cell' ? accentColor : borderCol,
                  },
                ]}
                onPress={() => setPrivacy('Cell')}
                activeOpacity={0.8}
              >
                <Shield size={18} color={privacy === 'Cell' ? accentColor : secondaryText} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: privacy === 'Cell' ? accentColor : primaryText }]}>
                    Care Cell Only
                  </Text>
                  <Text style={[styles.privacyDesc, { color: secondaryText }]}>
                    Notifies only your Care Cell members & leaders
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  {
                    backgroundColor: privacy === 'Public' ? accentBg : inputBg,
                    borderColor: privacy === 'Public' ? accentColor : borderCol,
                  },
                ]}
                onPress={() => setPrivacy('Public')}
                activeOpacity={0.8}
              >
                <Globe size={18} color={privacy === 'Public' ? accentColor : secondaryText} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: privacy === 'Public' ? accentColor : primaryText }]}>
                    Church Prayer Wall
                  </Text>
                  <Text style={[styles.privacyDesc, { color: secondaryText }]}>
                    Submits to the Church Prayer Wall (after Admin review)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: inputBg, borderWidth: 1, borderColor: borderCol }]}
                onPress={handleClose}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnTxt, { color: secondaryText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: submitBg }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnTxt}>Submit Prayer</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingTop: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
  },
  privacyRow: {
    gap: 10,
    marginTop: 4,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  privacyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  privacyDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
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
    alignItems: 'center',
  },
  cancelBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
