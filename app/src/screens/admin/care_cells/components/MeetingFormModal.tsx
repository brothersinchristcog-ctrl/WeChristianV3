import React, { useState, useEffect, useMemo } from 'react';
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
import { X, Calendar, Clock, MapPin, BookOpen, ChevronDown, Check, Sparkles } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CareCellService from '../../../../services/CareCellService';
import PrayerVerseService, { BibleBookItem } from '../../../../services/PrayerVerseService';
import { formatDateDisplay } from '../../../../utils/DateUtils';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';
import { CareCell, CareCellMeeting, MeetingType, MeetingStatus } from '../../../../types/CareCellTypes';

const MEETING_TYPES: MeetingType[] = [
  'Bible Study',
  'Prayer Meeting',
  'Fellowship',
  'Worship',
  'Special Meeting',
  'Other',
];

interface MeetingFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  cells: CareCell[];
  defaultCellId?: string;
  meetingToEdit?: CareCellMeeting | null;
}

export default function MeetingFormModal({
  visible,
  onClose,
  onSaved,
  cells,
  defaultCellId,
  meetingToEdit,
}: MeetingFormModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';

  const isEditing = !!meetingToEdit;

  const [cellId, setCellId] = useState(defaultCellId || (cells[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [location, setLocation] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Bible Study');
  const [status, setStatus] = useState<MeetingStatus>('Upcoming');

  // Scripture Fields
  const [selectedBookIndex, setSelectedBookIndex] = useState(49); // Philippians default (index 49)
  const [selectedChapter, setSelectedChapter] = useState(4);
  const [selectedVerseInput, setSelectedVerseInput] = useState('6-7');
  const [scriptureTextEn, setScriptureTextEn] = useState('');
  const [scriptureTextTe, setScriptureTextTe] = useState('');
  const [loadingScripture, setLoadingScripture] = useState(false);

  // Sub-pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCellPicker, setShowCellPicker] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  const [saving, setSaving] = useState(false);

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return 'Select';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${period}`;
  };

  const getTimeDate = (timeStr: string) => {
    const d = new Date();
    if (!timeStr) return d;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h)) d.setHours(h);
      if (!isNaN(m)) d.setMinutes(m);
    }
    return d;
  };

  const allBooks = useMemo(() => PrayerVerseService.getBooksList(), []);
  const selectedBook = allBooks[selectedBookIndex] || allBooks[0];
  const maxChapters = PrayerVerseService.getChapterCount(selectedBookIndex);

  // Initialize or reset form
  useEffect(() => {
    if (!visible) return;

    if (meetingToEdit) {
      setCellId(meetingToEdit.cellId);
      setTitle(meetingToEdit.title || '');
      setDescription(meetingToEdit.description || '');
      setDate(meetingToEdit.date || new Date().toISOString().split('T')[0]);
      setStartTime(meetingToEdit.startTime || '19:00');
      setEndTime(meetingToEdit.endTime || '20:30');
      setLocation(meetingToEdit.location || '');
      setMeetingType(meetingToEdit.meetingType || 'Bible Study');
      setStatus(meetingToEdit.status || 'Upcoming');

      if (meetingToEdit.bibleBook) {
        const bIdx = allBooks.findIndex((b) => b.nameEn.toLowerCase() === meetingToEdit.bibleBook?.toLowerCase());
        if (bIdx !== -1) setSelectedBookIndex(bIdx);
      }
      if (meetingToEdit.bibleChapter) setSelectedChapter(meetingToEdit.bibleChapter);
      if (meetingToEdit.bibleVerse) setSelectedVerseInput(meetingToEdit.bibleVerse);
      setScriptureTextEn(meetingToEdit.scriptureTextEn || '');
      setScriptureTextTe(meetingToEdit.scriptureTextTe || '');
    } else {
      setCellId(defaultCellId || (cells[0]?.id || ''));
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('19:00');
      setEndTime('20:30');
      setLocation('');
      setMeetingType('Bible Study');
      setStatus('Upcoming');
      setSelectedBookIndex(49);
      setSelectedChapter(4);
      setSelectedVerseInput('6-7');

      // Pre-load default scripture
      loadScripture(49, 4, '6-7');
    }
  }, [visible, meetingToEdit, defaultCellId, cells]);

  const loadScripture = async (bIdx: number, ch: number, vStr: string) => {
    setLoadingScripture(true);
    try {
      const res = await PrayerVerseService.lookupScripture(bIdx, ch, vStr);
      setScriptureTextEn(res.textEn);
      setScriptureTextTe(res.textTe);
    } catch (e) {
      console.warn('Scripture fetch error:', e);
    } finally {
      setLoadingScripture(false);
    }
  };

  const handleSave = async () => {
    if (!cellId) {
      Alert.alert('Required Field', 'Please select a Care Cell.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a Meeting Title.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Required Field', 'Please select a Meeting Date.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const targetCell = cells.find((c) => c.id === cellId);

      const payload = {
        cellId,
        cellCode: targetCell?.cellCode || '',
        cellName: targetCell?.name || '',
        title: title.trim(),
        description: description.trim(),
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim() || targetCell?.meetingLocation || '',
        bibleBook: selectedBook?.nameEn || '',
        bibleChapter: selectedChapter,
        bibleVerse: selectedVerseInput.trim(),
        scriptureTextEn,
        scriptureTextTe,
        meetingType,
        status,
      };

      if (isEditing && meetingToEdit) {
        await CareCellService.updateMeeting(churchId, meetingToEdit.id, payload);
        Alert.alert('Updated', 'Meeting updated successfully!');
      } else {
        await CareCellService.createMeeting(churchId, payload);
        Alert.alert('Scheduled', 'Care Cell meeting scheduled successfully!');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      Alert.alert('Error', err.message || 'Failed to save meeting.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCell = cells.find((c) => c.id === cellId);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Meeting' : 'Schedule Fellowship Meeting'}</Text>
                <Text style={styles.headerSubtitle}>
                  Plan a gathering with Scripture and attendance roll-call
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form */}
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Care Cell Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Care Cell *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowCellPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnTxt}>
                    {selectedCell ? `${selectedCell.cellCode} — ${selectedCell.name}` : 'Select a Care Cell'}
                  </Text>
                  <ChevronDown size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Meeting Title */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meeting Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Weekly Fellowship & Prayer / Walking in Faith"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Meeting Type Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meeting Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {MEETING_TYPES.map((t) => {
                    const isSelected = meetingType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeChip,
                          isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                        ]}
                        onPress={() => setMeetingType(t)}
                      >
                        <Text
                          style={[
                            styles.typeChipTxt,
                            isSelected && { color: primaryBtnText, fontWeight: '800' },
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Date & Time Row */}
              <View style={styles.row}>
                {/* Date */}
                <View style={[styles.fieldGroup, { flex: 1.2, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Date *</Text>
                  <TouchableOpacity
                    style={styles.datePickerTrigger}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={16} color="#1A2D5A" style={{ marginRight: 6 }} />
                    <Text style={styles.datePickerTxt}>{formatDateDisplay(date)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Start Time */}
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Start Time *</Text>
                  <TouchableOpacity
                    style={styles.timePickerTrigger}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Clock size={15} color="#1A2D5A" style={{ marginRight: 5 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timePickerTxt} numberOfLines={1}>{formatTimeDisplay(startTime)}</Text>
                      <Text style={styles.timePickerSub}>{startTime}</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* End Time */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timePickerTrigger}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Clock size={15} color="#64748B" style={{ marginRight: 5 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timePickerTxt} numberOfLines={1}>{formatTimeDisplay(endTime)}</Text>
                      <Text style={styles.timePickerSub}>{endTime}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meeting Venue / Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location / Venue</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={selectedCell?.meetingLocation || "e.g. Leader's Home, Flat 402"}
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Scripture Passage Selection */}
              <View style={styles.scriptureSection}>
                <View style={styles.scriptureHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BookOpen size={16} color="#1A2D5A" style={{ marginRight: 6 }} />
                    <Text style={styles.scriptureSectionTitle}>Holy Scripture Reading</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => loadScripture(selectedBookIndex, selectedChapter, selectedVerseInput)}
                    style={styles.refreshScriptureBtn}
                  >
                    <Sparkles size={11} color="#1A2D5A" style={{ marginRight: 3 }} />
                    <Text style={styles.refreshScriptureBtnTxt}>Reload Verse</Text>
                  </TouchableOpacity>
                </View>

                {/* Book, Chapter, Verse Selector Row */}
                <View style={styles.bcvRow}>
                  {/* Book Picker Trigger */}
                  <TouchableOpacity
                    style={[styles.bcvBtn, { flex: 1.6, marginRight: 8 }]}
                    onPress={() => setShowBookPicker(true)}
                  >
                    <Text style={styles.bcvBtnLabel}>Book</Text>
                    <Text style={styles.bcvBtnVal} numberOfLines={1}>
                      {selectedBook?.nameEn}
                    </Text>
                    <ChevronDown size={14} color="#64748B" />
                  </TouchableOpacity>

                  {/* Chapter Picker Trigger */}
                  <TouchableOpacity
                    style={[styles.bcvBtn, { flex: 1, marginRight: 8 }]}
                    onPress={() => setShowChapterPicker(true)}
                  >
                    <Text style={styles.bcvBtnLabel}>Chapter</Text>
                    <Text style={styles.bcvBtnVal}>{selectedChapter}</Text>
                    <ChevronDown size={14} color="#64748B" />
                  </TouchableOpacity>

                  {/* Verse Range Input */}
                  <View style={[styles.bcvInputWrap, { flex: 1 }]}>
                    <Text style={styles.bcvBtnLabel}>Verse(s)</Text>
                    <TextInput
                      style={styles.bcvTextInput}
                      placeholder="e.g. 6-7"
                      placeholderTextColor="#94A3B8"
                      value={selectedVerseInput}
                      onChangeText={(t) => {
                        setSelectedVerseInput(t);
                        loadScripture(selectedBookIndex, selectedChapter, t);
                      }}
                    />
                  </View>
                </View>

                {/* Scripture Text Previews (English & Telugu) */}
                {loadingScripture ? (
                  <View style={styles.scriptureLoading}>
                    <ActivityIndicator size="small" color="#1A2D5A" />
                    <Text style={styles.scriptureLoadingTxt}>Fetching Scripture...</Text>
                  </View>
                ) : (
                  <View style={styles.scripturePreviewCard}>
                    {/* Reference Header */}
                    <Text style={styles.scriptureRefHeader}>
                      {selectedBook?.nameEn} {selectedChapter}:{selectedVerseInput} · {selectedBook?.nameTe} {selectedChapter}:{selectedVerseInput}
                    </Text>

                    {/* English */}
                    {scriptureTextEn ? (
                      <View style={styles.scriptureLangBox}>
                        <Text style={styles.langTag}>ENGLISH</Text>
                        <Text style={styles.scriptureBodyEn}>{scriptureTextEn}</Text>
                      </View>
                    ) : null}

                    {/* Telugu */}
                    {scriptureTextTe ? (
                      <View style={[styles.scriptureLangBox, { marginTop: 8 }]}>
                        <Text style={styles.langTagTe}>TELUGU (పరిశుద్ధ గ్రంథం)</Text>
                        <Text style={styles.scriptureBodyTe}>{scriptureTextTe}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Description / Prayer Focus */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meeting Summary & Focus</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Key discussion points, prayer topics, announcements..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: primaryBtnBg },
                  saving && styles.submitBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={primaryBtnText} />
                ) : (
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>
                    {isEditing ? 'UPDATE FELLOWSHIP MEETING' : 'SCHEDULE MEETING'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={new Date(date)}
        onConfirm={(d) => {
          setShowDatePicker(false);
          setDate(d.toISOString().split('T')[0]);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Start Time Picker Modal */}
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="time"
        date={getTimeDate(startTime)}
        onConfirm={(d) => {
          setShowStartTimePicker(false);
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setStartTime(`${hours}:${minutes}`);
        }}
        onCancel={() => setShowStartTimePicker(false)}
      />

      {/* End Time Picker Modal */}
      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="time"
        date={getTimeDate(endTime)}
        onConfirm={(d) => {
          setShowEndTimePicker(false);
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setEndTime(`${hours}:${minutes}`);
        }}
        onCancel={() => setShowEndTimePicker(false)}
      />

      {/* Cell Picker Modal */}
      <Modal visible={showCellPicker} transparent animationType="fade" onRequestClose={() => setShowCellPicker(false)}>
        <TouchableOpacity style={styles.subModalOverlay} activeOpacity={1} onPress={() => setShowCellPicker(false)}>
          <View style={styles.subModalContainer}>
            <Text style={styles.subModalTitle}>Select Care Cell</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {cells.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.subModalItem, cellId === c.id && styles.subModalItemActive]}
                  onPress={() => {
                    setCellId(c.id);
                    setShowCellPicker(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subModalItemTitle}>{c.name}</Text>
                    <Text style={styles.subModalItemSub}>{c.cellCode} · {c.location || 'Local'}</Text>
                  </View>
                  {cellId === c.id && <Check size={16} color="#1A2D5A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bible Book Picker Modal */}
      <Modal visible={showBookPicker} transparent animationType="fade" onRequestClose={() => setShowBookPicker(false)}>
        <TouchableOpacity style={styles.subModalOverlay} activeOpacity={1} onPress={() => setShowBookPicker(false)}>
          <View style={styles.subModalContainer}>
            <Text style={styles.subModalTitle}>Select Bible Book</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {allBooks.map((b) => (
                <TouchableOpacity
                  key={b.index}
                  style={[styles.subModalItem, selectedBookIndex === b.index && styles.subModalItemActive]}
                  onPress={() => {
                    setSelectedBookIndex(b.index);
                    setSelectedChapter(1);
                    setShowBookPicker(false);
                    loadScripture(b.index, 1, selectedVerseInput);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subModalItemTitle}>{b.nameEn}</Text>
                    <Text style={styles.subModalItemSub}>{b.nameTe} ({b.testament}) · {b.totalChapters} Ch</Text>
                  </View>
                  {selectedBookIndex === b.index && <Check size={16} color="#1A2D5A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bible Chapter Picker Modal */}
      <Modal visible={showChapterPicker} transparent animationType="fade" onRequestClose={() => setShowChapterPicker(false)}>
        <TouchableOpacity style={styles.subModalOverlay} activeOpacity={1} onPress={() => setShowChapterPicker(false)}>
          <View style={[styles.subModalContainer, { maxWidth: 320 }]}>
            <Text style={styles.subModalTitle}>{selectedBook?.nameEn} — Select Chapter</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              <View style={styles.chapterGrid}>
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.chapterGridBtn, selectedChapter === ch && styles.chapterGridBtnActive]}
                    onPress={() => {
                      setSelectedChapter(ch);
                      setShowChapterPicker(false);
                      loadScripture(selectedBookIndex, ch, selectedVerseInput);
                    }}
                  >
                    <Text style={[styles.chapterGridBtnTxt, selectedChapter === ch && styles.chapterGridBtnTxtActive]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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
  headerTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
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
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
  },
  dropdownBtnTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  horizontalChips: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  typeChipActive: {
    backgroundColor: '#1A2D5A',
  },
  typeChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  typeChipTxtActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
  },
  datePickerTxt: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    minHeight: 46,
  },
  timePickerTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timePickerSub: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  scriptureSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  scriptureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scriptureSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2D5A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  refreshScriptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refreshScriptureBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  bcvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bcvBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'column',
  },
  bcvBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bcvBtnVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2D5A',
    marginTop: 1,
  },
  bcvInputWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bcvTextInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2D5A',
    padding: 0,
    marginTop: 1,
  },
  scriptureLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  scriptureLoadingTxt: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  scripturePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  scriptureRefHeader: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A2D5A',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  scriptureLangBox: {
    paddingVertical: 2,
  },
  langTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 2,
  },
  langTagTe: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 2,
  },
  scriptureBodyEn: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    fontStyle: 'italic',
  },
  scriptureBodyTe: {
    fontSize: 12.5,
    lineHeight: 20,
    color: '#1E293B',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  subModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  subModalItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  subModalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subModalItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  chapterGridBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterGridBtnActive: {
    backgroundColor: '#1A2D5A',
  },
  chapterGridBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  chapterGridBtnTxtActive: {
    color: '#FFFFFF',
  },
});

