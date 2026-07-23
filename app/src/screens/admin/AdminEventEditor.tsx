import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  Image,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  Bell,
  Eye,
  Save,
  ChevronDown,
  ChevronLeft,
  Info,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { AppAlert } from '../../components/CustomAlert';

import FirestoreService from '../../services/FirestoreService';

const { width, height } = Dimensions.get('window');

const EVENT_TYPES = [
  { label: 'Sunday Service · ఆదివారం సేవ', value: 'Sunday Service' },
  { label: 'Bible study · బైబిల్ అధ్యయనం', value: 'Bible study' },
  { label: "Women's Fasting Prayer · మహిళల ఉపవాస ప్రార్థన", value: "Women's Fasting Prayer" },
  { label: 'Prayer Meeting · ప్రార్థన సభ', value: 'Prayer Meeting' },
  { label: 'Youth Event · యువత కార్యక్రమం', value: 'Youth Event' },
  { label: 'Women\'s Ministry · స్త్రీల మంత్రిత్వం', value: 'Women\'s Ministry' },
  { label: 'Fasting Prayer · ఉపవాస ప్రార్థన', value: 'Fasting Prayer' },
  { label: 'Special Service · ప్రత్యేక సేవ', value: 'Special Service' },
  { label: 'Conference · సదస్సు', value: 'Conference' },
  { label: 'Outreach · సేవా కార్యక్రమం', value: 'Outreach' },
  { label: 'Other · ఇతర', value: 'Other' }
];

const RECURRING_OPTIONS = [
  { label: 'One time event', value: 'One-time event' },
  { label: 'Every Sunday', value: 'Every Sunday' },
  { label: 'Every week (specify day)', value: 'Every week' },
  { label: 'First Sunday of every month', value: 'First Sunday' },
  { label: 'Monthly (same date)', value: 'Monthly' }
];

const DURATION_OPTIONS = [
  { label: 'For 1 month', value: 1 },
  { label: 'For 2 months', value: 2 },
  { label: 'For 3 months', value: 3 },
  { label: 'For 6 months', value: 6 },
  { label: 'For 1 year', value: 12 }
];

const PUBLISH_STATUS_OPTIONS = [
  { label: 'Draft — not visible to members', value: 'Draft' },
  { label: 'Publish now — visible to all members', value: 'Published' },
  { label: 'Schedule — auto-publish on a specific date/time', value: 'Scheduled' }
];

export default function AdminEventEditor() {
  const { setActiveTab, editingData, setEditingData } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [eventType, setEventType] = useState('Sunday Service');
  const [descEn, setDescEn] = useState('');
  const [descTe, setDescTe] = useState('');

  const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [recurring, setRecurring] = useState('One-time event');
  const [recurrenceDuration, setRecurrenceDuration] = useState(1);
  const [publishStatus, setPublishStatus] = useState('Published');

  const [venueEn, setVenueEn] = useState('');
  const [venueTe, setVenueTe] = useState('');
  const [address, setAddress] = useState('');
  const [mode, setMode] = useState('In person');

  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [rsvpPublic, setRsvpPublic] = useState(true);
  const [capAttendance, setCapAttendance] = useState(false);
  const [audience, setAudience] = useState('All members');

  const [bannerColor, setBannerColor] = useState('#c0392b');
  const [bannerUrl, setBannerUrl] = useState('');
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [reminder1Day, setReminder1Day] = useState(true);
  const [reminder1Hour, setReminder1Hour] = useState(false);

  // UI State
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimeVisible, setStartTimeVisibility] = useState(false);
  const [isEndTimeVisible, setEndTimeVisibility] = useState(false);

  // JS Picker Temp State
  const [tempDate, setTempDate] = useState({ d: '20', m: '04', y: '2026' });
  const [tempTime, setTempTime] = useState({ h: '09', m: '00', p: 'AM' });

  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    const discoverMetadata = async () => {
      try {
        const meta = await FirestoreService.getEventMetadata('');
        if (meta) {
          console.log('📖 [AdminEventEditor] Metadata Loaded:', JSON.stringify(meta, null, 2));
          setMetadata(meta);

          // 🛠️ FIX: If creating NEW event, set defaults from metadata if current is invalid
          if (!editingData) {
            if (meta.types?.length > 0) setEventType(meta.types[0].value);
            if (meta.modes?.length > 0) setMode(meta.modes[0].value);
            if (meta.audiences?.length > 0) setAudience(meta.audiences[0].value);

            // 🛠️ FIX Status Picklist: Ensure 'Published' is a valid value, otherwise use metadata
            if (meta.statuses?.length > 0) {
              const hasPublished = meta.statuses.some((s: any) => s.value === 'Published');
              if (!hasPublished) setPublishStatus(meta.statuses[0].value);
            }

            // 🛠️ FIX Recurring Picklist:
            if (meta.recurring?.length > 0) {
              const hasOneTime = meta.recurring.some((s: any) => s.value === 'One-time event');
              if (!hasOneTime) setRecurring(meta.recurring[0].value);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ [AdminEventEditor] Metadata Discovery Failed:', err);
      }
    };

    discoverMetadata();

    const formatFromSFTime = (sfTime: string) => {
      if (!sfTime || typeof sfTime !== 'string') return '09:00 AM';
      if (sfTime.includes('AM') || sfTime.includes('PM')) return sfTime;
      try {
        const timePart = sfTime.split('.')[0];
        const [hours, minutes] = timePart.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
      } catch (e) { return sfTime; }
    };

    const formatFromSFDate = (sfDate: string) => {
      if (!sfDate || typeof sfDate !== 'string') return '20-04-2026';
      if (sfDate.includes('-') && sfDate.split('-')[0].length === 2) return sfDate; // Already DD-MM-YYYY
      try {
        const dateOnly = sfDate.split('T')[0];
        const [y, m, d] = dateOnly.split('-');
        return `${d}-${m}-${y}`;
      } catch (e) { return sfDate; }
    };

    if (editingData) {
      setTitleEn(editingData.name || '');
      setTitleTe(editingData.titleTe || '');
      setDate(formatFromSFDate(editingData.date));
      setVenueEn(editingData.location || '');
      setVenueTe(editingData.locationTe || '');
      setAddress(editingData.address || '');
      setStartTime(formatFromSFTime(editingData.startTime));
      setEndTime(formatFromSFTime(editingData.endTime || '10:00 AM'));
      setEventType(editingData.type || 'Sunday Service');
      setMode(editingData.mode || 'In person');
      setRsvpEnabled(editingData.rsvpEnabled ?? true);
      setRsvpPublic(editingData.rsvpPublic ?? true);
      setAudience(editingData.audience || 'All members');
      setPublishStatus(editingData.status || 'Published');
      setRecurring(editingData.recurring || 'One-time event');
      setRecurrenceDuration(editingData.recurrenceDuration || 1);
      setBannerUrl(editingData.bannerUrl || '');
      setBannerColor(editingData.bannerColor || '#c0392b');
    }
  }, [editingData]);

  const confirmJSDate = () => {
    setDate(`${tempDate.d}-${tempDate.m}-${tempDate.y}`);
    setDatePickerVisibility(false);
  };

  const uploadImageToCloud = async (localUri: string): Promise<string> => {
    try {
      const storage = require('@react-native-firebase/storage').default;
      const ext = localUri.substring(localUri.lastIndexOf('.') + 1) || 'jpg';
      const storagePath = `events/posters/event_${Date.now()}.${ext}`;
      
      const reference = storage().ref(storagePath);
      await reference.putFile(localUri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Storage upload failed:', error);
      throw new Error('Cloud upload failed');
    }
  };

  const confirmJSTime = (target: 'start' | 'end') => {
    const formatted = `${tempTime.h}:${tempTime.m} ${tempTime.p}`;
    if (target === 'start') setStartTime(formatted);
    else setEndTime(formatted);
    setStartTimeVisibility(false);
    setEndTimeVisibility(false);
  };
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setLoading(true);
        try {
          const cloudUrl = await uploadImageToCloud(localUri);
          setBannerUrl(cloudUrl);
          AppAlert.alert('Success · విజయం', 'Banner uploaded to cloud successfully! all members will be able to see it.', undefined, 'success');
        } catch (err) {
          console.error('Cloud upload error:', err);
          setBannerUrl(localUri);
          AppAlert.alert('Upload Failed · అప్‌లోడ్ విఫలమైంది', 'Failed to upload banner to the cloud. You can still save it or manually paste a public web link in the text box.', undefined, 'error');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      AppAlert.alert('Picker Error', 'Native module not ready yet. Please use the URL field for now.', undefined, 'error');
    }
  };

  const [showDatePickerNative, setShowDatePickerNative] = useState(false);
  const [showStartTimeNative, setShowStartTimeNative] = useState(false);
  const [showEndTimeNative, setShowEndTimeNative] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (status: 'Published' | 'Draft') => {
    const executeSave = async (updateMode?: 'single' | 'future') => {
      setPublishStatus(status);
      setLoading(true);
    // 🛠️ FIX: Re-format date for Salesforce (wants YYYY-MM-DD)
    const dateParts = date.split('-');
    const sfDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    const formatToSFTime = (timeStr: string) => {
      if (!timeStr) return null;
      try {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
      } catch (e) {
        return timeStr; // Fallback to original if format is unexpected
      }
    };

    const resolveStatus = (requested: string) => {
      if (!metadata?.statuses || metadata.statuses.length === 0) return requested;
      
      // Try to find a flexible match (Published, Active, etc.)
      const match = metadata.statuses.find((s: any) =>
        s.value === requested ||
        s.label === requested ||
        s.value.toLowerCase().includes('pub') ||
        s.value.toLowerCase().includes('act') ||
        s.label.toLowerCase().includes('pub') ||
        s.label.toLowerCase().includes('act')
      );

      // If we are looking for Draft
      if (requested.toLowerCase() === 'draft') {
        const draftMatch = metadata.statuses.find((s: any) => 
          s.value.toLowerCase().includes('dra') || s.label.toLowerCase().includes('dra')
        );
        if (draftMatch) return draftMatch.value;
      }

      // If we found a match for Published/Active, use it. 
      // Otherwise, use the first status in the list to avoid "Bad Value" errors.
      return match ? match.value : metadata.statuses[0].value;
    };

    const resolveValue = (field: string, val: string) => {
      if (!metadata?.[field] || metadata[field].length === 0) {
        console.warn(`⚠️ [AdminEventEditor] No metadata found for field: ${field}. Available metadata keys:`, Object.keys(metadata || {}));
        return val;
      }
      
      const list = metadata[field];
      // 🛠️ FIX: Strip out Telugu/hyphens from old values (e.g. "Sunday Service - ఆదివారం సేవ" -> "Sunday Service")
      const cleanVal = val.split(' - ')[0].split(' · ')[0].trim();
      const normalizedVal = cleanVal.toLowerCase();
      
      const match = list.find((m: any) => {
        const mVal = m.value.trim().toLowerCase();
        const mLbl = m.label.trim().toLowerCase();
        return mVal === normalizedVal || mLbl === normalizedVal || mVal.includes(normalizedVal) || normalizedVal.includes(mVal);
      });
      
      const finalVal = match ? match.value : cleanVal;
      console.log(`🔍 [AdminEventEditor] Resolving ${field}: "${val}" -> "${finalVal}"`);
      return finalVal;
    };

    const payload = {
      id: editingData?.id,
      // Save under BOTH field names so all screens (admin + member) can read them
      titleEn, titleTe,
      name: titleEn,          // AdminEventList reads event.name
      title: titleEn,         // EventsScreen reads item.title
      titleTelugu: titleTe,   // EventsScreen reads item.titleTelugu
      date: sfDate,
      startTime: formatToSFTime(startTime),
      endTime: formatToSFTime(endTime),
      descEn, descTe, venueEn, venueTe, address,
      location: venueEn,      // EventsScreen reads item.location
      eventType: resolveValue('types', eventType),
      type: resolveValue('types', eventType),
      mode: resolveValue('modes', mode),
      rsvpEnabled, rsvpPublic,
      audience: resolveValue('audiences', audience),
      publishStatus: resolveStatus(status),
      status: resolveStatus(status),
      bannerColor,
      bannerUrl,
      image: bannerUrl,
      recurring: resolveValue('recurring', recurring),
      recurrenceDuration,
      notifyOnPublish, reminder1Day, reminder1Hour,
      rsvpCap: capAttendance ? 100 : 0,
      updateMode
    };

    console.log('📤 [AdminEventEditor] Saving Payload:', JSON.stringify(payload, null, 2));

    try {
      await FirestoreService.createEvent(payload);

      // 🔔 Push notification to all members when publishing
      if (notifyOnPublish && status === 'Published') {
        try {
          const { getFirestore, collection, addDoc, serverTimestamp } = require('@react-native-firebase/firestore');
          const churchId = await FirestoreService.getChurchId();
          const db = getFirestore();
          await FirestoreService.createNotificationBroadcast({
            title: `📅 New Event: ${titleEn}`,
            content: `Join us for "${titleEn}" on ${sfDate} at ${startTime}${venueEn ? ` · ${venueEn}` : ''}. ${descEn ? descEn.substring(0, 100) : ''}`,
            date: sfDate,
            type: 'event',
            targetChurchId: churchId,
          });
          console.log('🔔 Event push notification queued.');
        } catch (notifErr) {
          console.warn('⚠️ Event push notification failed (non-critical):', notifErr);
        }
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('❌ [AdminEventEditor] Save Failed:', err);
      const errorMsg = String(err);
      
      // 🛠️ SMART HELP: If it's a picklist error, show the user the available options
      if (errorMsg.includes('bad value for restricted picklist field')) {
        const availableTypes = metadata?.types?.map((t: any) => t.value).join('\n') || 'None found';
        alert(`Salesforce Error: ${errorMsg}\n\nAvailable types in your Org:\n${availableTypes}`);
      } else {
        alert(`Error saving event: ${err}`);
      }
      } finally {
        setLoading(false);
      }
    };

    if (editingData?.recurringGroupId) {
      Alert.alert(
        'Recurring Event',
        'You are editing a recurring event. Do you want to update only this specific occurrence, or this and all future occurrences?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Only this event', onPress: () => executeSave('single') },
          { text: 'This and future events', onPress: () => executeSave('future') }
        ]
      );
    } else {
      executeSave();
    }
  };

  const resetForm = () => {
    setTitleEn(''); setTitleTe(''); setDescEn(''); setDescTe('');
    setVenueEn(''); setVenueTe(''); setAddress('');
    setBannerUrl('');
    setDate(new Date().toLocaleDateString('en-GB').replace(/\//g, '-')); 
    setStartTime('09:00 AM'); setEndTime('12:00 PM');
    setNotifyOnPublish(true); setReminder1Day(true); setReminder1Hour(false);
    setEditingData(null);
  };

  const SuccessModal = () => (
    <Modal visible={showSuccess} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <CheckCircle2 size={40} color="#fff" />
            </View>
          </View>
          <Text style={styles.successTitle}>Event {publishStatus === 'Published' ? 'Published' : 'Saved'}!</Text>
          <Text style={styles.successSub}>
            Your event "{titleEn}" has been successfully {publishStatus === 'Published' ? 'published to all members' : 'saved as a draft'}.
          </Text>

          <TouchableOpacity style={styles.successBtnPrimary} onPress={() => { setShowSuccess(false); resetForm(); setActiveTab(7); }}>
            <Text style={styles.successBtnPrimaryTxt}>View Event List</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.successBtnSecondary} onPress={() => { setShowSuccess(false); resetForm(); }}>
            <Text style={styles.successBtnSecondaryTxt}>Create Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SectionHeader = ({ icon: Icon, title, color }: any) => (
    <View style={[styles.sectionHeader, { backgroundColor: color + '10' }]}>
      <Icon size={16} color={color} />
      <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
    </View>
  );

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const JSPickerModal = ({ visible, onClose, onConfirm, type }: any) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{type === 'date' ? 'Select Event Date' : 'Select Time'}</Text>

          <View style={styles.pickerRow}>
            {type === 'date' ? (
              <>
                <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                    <TouchableOpacity key={d} onPress={() => setTempDate({ ...tempDate, d })}>
                      <Text style={[styles.pickerItem, tempDate.d === d && styles.pickerItemActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                  {MONTH_NAMES.map((m, idx) => {
                    const mVal = (idx + 1).toString().padStart(2, '0');
                    return (
                      <TouchableOpacity key={m} onPress={() => setTempDate({ ...tempDate, m: mVal })}>
                        <Text style={[styles.pickerItem, tempDate.m === mVal && styles.pickerItemActive]}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 11 }, (_, i) => (2025 + i).toString()).map(y => (
                    <TouchableOpacity key={y} onPress={() => setTempDate({ ...tempDate, y })}>
                      <Text style={[styles.pickerItem, tempDate.y === y && styles.pickerItemActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                    <TouchableOpacity key={h} onPress={() => setTempTime({ ...tempTime, h })}>
                      <Text style={[styles.pickerItem, tempTime.h === h && styles.pickerItemActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                  {['00', '15', '30', '45'].map(m => (
                    <TouchableOpacity key={m} onPress={() => setTempTime({ ...tempTime, m })}>
                      <Text style={[styles.pickerItem, tempTime.m === m && styles.pickerItemActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.pickerCol}>
                  {['AM', 'PM'].map(p => (
                    <TouchableOpacity key={p} onPress={() => setTempTime({ ...tempTime, p })}>
                      <Text style={[styles.pickerItem, tempTime.p === p && styles.pickerItemActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
              <Text style={styles.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.modalConfirm}>
              <Text style={styles.modalConfirmTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SuccessModal />

      {/* ── Page Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity onPress={() => setActiveTab(7)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <ChevronLeft size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 4 }}>Back</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16 }} />
          <Text style={styles.heroTitle}>{editingData ? 'Edit Event' : 'New Event'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── SECTION 1: EVENT INFO ── */}
        <SectionHeader icon={Info} title="Event Info" color="#1a2d5a" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event title — English *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Easter Sunday Service 2026"
            value={titleEn}
            onChangeText={setTitleEn}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event title — Telugu</Text>
          <TextInput
            style={styles.input}
            placeholder="తెలుగులో కార్యక్రమం పేరు..."
            value={titleTe}
            onChangeText={setTitleTe}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event type</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
            <Text style={styles.dropdownTxt}>
              {EVENT_TYPES.find((t: any) => t.value === eventType)?.label || eventType}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>
          {showTypeDropdown && (
            <View style={styles.dropdownMenu}>
              {/* Prioritize metadata-verified types discovered from Salesforce */}
              {(metadata?.types || EVENT_TYPES).map((t: any) => (
                <TouchableOpacity
                  key={`${t.value}-${t.label}`}
                  style={[styles.dropdownItem, eventType === t.value && styles.dropdownItemActive]}
                  onPress={() => { setEventType(t.value); setShowTypeDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemTxt, eventType === t.value && styles.dropdownItemTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description — English</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell members what this event is about..."
            multiline
            numberOfLines={4}
            value={descEn}
            onChangeText={setDescEn}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description — Telugu</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="తెలుగులో వివరణ..."
            multiline
            numberOfLines={4}
            value={descTe}
            onChangeText={setDescTe}
          />
        </View>

        {/* ── SECTION 2: DATE & TIME ── */}
        <SectionHeader icon={Clock} title="Date & Time" color="#c0392b" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event date *</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePickerNative(true)}>
            <Text style={styles.dropdownTxt}>{date}</Text>
            <Calendar size={16} color="#64748b" />
          </TouchableOpacity>
          {showDatePickerNative && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePickerNative(false);
                if (selectedDate) {
                  const d = selectedDate.getDate();
                  const m = selectedDate.getMonth() + 1;
                  const y = selectedDate.getFullYear();
                  setDate(`${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`);
                }
              }}
            />
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Start time *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowStartTimeNative(true)}>
              <Text style={styles.dropdownTxt}>{startTime}</Text>
              <Clock size={16} color="#64748b" />
            </TouchableOpacity>
            {showStartTimeNative && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowStartTimeNative(false);
                  if (selectedTime) {
                    let h = selectedTime.getHours();
                    const m = selectedTime.getMinutes();
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12 || 12;
                    setStartTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`);
                  }
                }}
              />
            )}
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>End time</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowEndTimeNative(true)}>
              <Text style={styles.dropdownTxt}>{endTime}</Text>
              <Clock size={16} color="#64748b" />
            </TouchableOpacity>
            {showEndTimeNative && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEndTimeNative(false);
                  if (selectedTime) {
                    let h = selectedTime.getHours();
                    const m = selectedTime.getMinutes();
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12 || 12;
                    setEndTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`);
                  }
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Is this a recurring event?</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowRecurringDropdown(!showRecurringDropdown)}>
            <Text style={styles.dropdownTxt}>
              {(metadata?.recurring || RECURRING_OPTIONS).find((o: any) => o.value === recurring)?.label || recurring}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>
          {showRecurringDropdown && (
            <View style={styles.dropdownMenuStatic}>
              {(metadata?.recurring || RECURRING_OPTIONS).map((o: any) => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.dropdownItem, recurring === o.value && styles.dropdownItemActive]}
                  onPress={() => { setRecurring(o.value); setShowRecurringDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemTxt, recurring === o.value && styles.dropdownItemTxtActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {recurring !== 'One-time event' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repeat for how long?</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDurationDropdown(!showDurationDropdown)}>
              <Text style={styles.dropdownTxt}>
                {DURATION_OPTIONS.find((o: any) => o.value === recurrenceDuration)?.label || `For ${recurrenceDuration} months`}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showDurationDropdown && (
              <View style={styles.dropdownMenuStatic}>
                {DURATION_OPTIONS.map((o: any) => (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.dropdownItem, recurrenceDuration === o.value && styles.dropdownItemActive]}
                    onPress={() => { setRecurrenceDuration(o.value); setShowDurationDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemTxt, recurrenceDuration === o.value && styles.dropdownItemTxtActive]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── SECTION 3: LOCATION ── */}
        <SectionHeader icon={MapPin} title="Location" color="#15803D" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue name — English *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Main Auditorium"
            value={venueEn}
            onChangeText={setVenueEn}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue name — Telugu</Text>
          <TextInput
            style={styles.input}
            placeholder="ఆవరణ పేరు తెలుగులో..."
            value={venueTe}
            onChangeText={setVenueTe}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full address <Text style={styles.labelSub}>Shown on Google Maps link</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Street, area, city — shown on map in app"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event mode</Text>
          <View style={styles.modeRow}>
            {(metadata?.modes?.length > 0 ? metadata.modes : [
              { label: 'In person', value: 'In person' },
              { label: 'Online', value: 'Online' },
              { label: 'Hybrid', value: 'Hybrid' }
            ]).map((m: any) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.modeBtn, mode === m.value && styles.modeBtnActive]}
                onPress={() => setMode(m.value)}
              >
                <Text style={[styles.modeBtnTxt, mode === m.value && styles.modeBtnTxtActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SECTION 4: RSVP & AUDIENCE ── */}
        <SectionHeader icon={Users} title="RSVP & Audience" color="#D97706" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable RSVP from members</Text>
          <Switch value={rsvpEnabled} onValueChange={setRsvpEnabled} trackColor={{ true: '#1a2d5a' }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Show RSVP count publicly</Text>
          <Switch value={rsvpPublic} onValueChange={setRsvpPublic} trackColor={{ true: '#1a2d5a' }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Cap attendance (set max)</Text>
          <Switch value={capAttendance} onValueChange={setCapAttendance} trackColor={{ true: '#1a2d5a' }} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Audience</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {(metadata?.audiences?.length > 0 ? metadata.audiences : [
              { label: 'All members', value: 'All members' },
              { label: 'Youth', value: 'Youth' },
              { label: 'Women', value: 'Women' },
              { label: 'Men', value: 'Men' },
              { label: 'Leaders', value: 'Leaders' },
              { label: 'Children', value: 'Children' },
              { label: 'New visitors', value: 'New visitors' }
            ]).map((a: any) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.chip, audience === a.value && styles.chipActive]}
                onPress={() => setAudience(a.value)}
              >
                <Text style={[styles.chipTxt, audience === a.value && styles.chipTxtActive]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── SECTION 5: EVENT BANNER ── */}
        <SectionHeader icon={ImageIcon} title="Event Banner" color="#7C3AED" />

        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.uploadPreview} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <ImageIcon size={24} color="#7C3AED" />
              </View>
              <Text style={styles.uploadTitle}>Pick from Gallery / Files</Text>
              <Text style={styles.uploadSub}>Select a high-quality banner</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Or paste Image URL</Text>
          <TextInput
            style={styles.input}
            value={bannerUrl}
            onChangeText={setBannerUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Banner colour <Text style={styles.labelSub}>(if no image)</Text></Text>
          <View style={styles.colorRow}>
            {['#c0392b', '#1a2d5a', '#15803D', '#7C3AED', '#D97706', '#dc2626'].map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, bannerColor === c && styles.colorCircleActive]}
                onPress={() => setBannerColor(c)}
              />
            ))}
          </View>
        </View>

        {/* ── SECTION 6: NOTIFICATION ── */}
        <SectionHeader icon={Bell} title="Notification" color="#D97706" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notify members when published</Text>
          <Switch 
            value={notifyOnPublish} 
            onValueChange={(val) => setNotifyOnPublish(val)} 
            trackColor={{ false: '#d1d5db', true: '#1a2d5a' }}
            thumbColor={Platform.OS === 'android' ? (notifyOnPublish ? '#fff' : '#f4f3f4') : ''}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Send reminder 1 day before</Text>
          <Switch 
            value={reminder1Day} 
            onValueChange={(val) => setReminder1Day(val)} 
            trackColor={{ false: '#d1d5db', true: '#1a2d5a' }}
            thumbColor={Platform.OS === 'android' ? (reminder1Day ? '#fff' : '#f4f3f4') : ''}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Send reminder 1 hour before</Text>
          <Switch 
            value={reminder1Hour} 
            onValueChange={(val) => setReminder1Hour(val)} 
            trackColor={{ false: '#d1d5db', true: '#1a2d5a' }}
            thumbColor={Platform.OS === 'android' ? (reminder1Hour ? '#fff' : '#f4f3f4') : ''}
          />
        </View>

        {/* ── SECTION 7: EVENT PREVIEW ── */}
        <SectionHeader icon={Eye} title="Event card preview" color="#16a34a" />

        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <View style={styles.previewChurchIcon} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.previewChurchName}>Your Church · Now</Text>
              <Text style={styles.previewNotifyTitle}>New Event — {titleEn || 'Event Title'}</Text>
              <Text style={styles.previewNotifySub}>{date} · {startTime} · {venueEn || 'Venue'} · Tap to RSVP</Text>
            </View>
          </View>

          <View style={[styles.cardPreview, { backgroundColor: bannerColor }]}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.cardBannerImg} />
            ) : null}
            <View style={styles.cardOverlay}>
              <View style={styles.cardTypeRow}>
                <Text style={styles.cardType}>● {(metadata?.types || EVENT_TYPES).find((t: any) => t.value === eventType)?.label.split(' · ')[0] || eventType}</Text>
                <View ><Text >{mode}</Text></View>
              </View>
              <Text style={styles.cardTitle}>{titleEn || 'Event title...'}</Text>
              <Text style={styles.cardTitleTe}>{titleTe || 'తెలుగు పేరు...'}</Text>
              <View style={styles.cardInfoRow}>
                <Calendar size={12} color="#fff" />
                <Text style={styles.cardInfoTxt}>{date} · {startTime} — {endTime}</Text>
              </View>
              <View style={styles.cardInfoRow}>
                <MapPin size={12} color="#fff" />
                <Text style={styles.cardInfoTxt}>{venueEn || 'Main Auditorium'}</Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Users size={12} color="#fff" />
                <Text style={styles.cardInfoTxt}>{rsvpEnabled ? 'RSVP enabled' : 'No RSVP required'} · 0 attending</Text>
              </View>

              <TouchableOpacity style={styles.previewRsvpBtn}>
                <CheckCircle2 size={14} color="#1a2d5a" />
                <Text style={styles.previewRsvpBtnTxt}>I'll be there - హాజరవుతాను</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── FOOTER BUTTONS ── */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Publish status</Text>
          <TouchableOpacity style={styles.statusBox} onPress={() => setShowStatusDropdown(!showStatusDropdown)}>
            <Text style={styles.statusTxt}>
              {(metadata?.statuses || PUBLISH_STATUS_OPTIONS).find((o: any) => o.value === publishStatus)?.label || publishStatus}
            </Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>
          {showStatusDropdown && (
            <View style={[styles.dropdownMenuStatic, { marginBottom: 15 }]}>
              {(metadata?.statuses || PUBLISH_STATUS_OPTIONS).map((o: any) => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.dropdownItem, publishStatus === o.value && styles.dropdownItemActive]}
                  onPress={() => { setPublishStatus(o.value); setShowStatusDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemTxt, publishStatus === o.value && styles.dropdownItemTxtActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.publishBtn} onPress={() => handleSave('Published')} disabled={loading}>
            {loading && publishStatus === 'Published' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.publishBtnTxt}>Publish Event</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.draftBtn} onPress={() => handleSave('Draft')} disabled={loading}>
            {loading && publishStatus === 'Draft' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.draftBtnTxt}>Save as Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => { resetForm(); setActiveTab(7); }}>
            <ArrowLeft size={14} color="#1a2d5a" />
            <Text style={styles.backBtnTxt}>Back to events</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { paddingBottom: 40 },

  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 46,
    paddingBottom: 24,
    marginBottom: 16,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#1a2d5a' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 20, marginTop: 15, marginBottom: 15 },
  sectionHeaderText: { fontSize: 12, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputGroup: { paddingHorizontal: 20, marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  labelSub: { fontWeight: '400', color: '#94a3b8' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e293b' },
  textArea: { textAlignVertical: 'top', minHeight: 80 },

  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownTxt: { fontSize: 14, color: '#1e293b' },
  dropdownMenu: { position: 'absolute', top: 75, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, zIndex: 1000 },
  dropdownMenuStatic: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#f0f7ff' },
  dropdownItemTxt: { fontSize: 13, color: '#475569' },
  dropdownItemTxtActive: { color: '#1a2d5a', fontWeight: '700' },

  row: { flexDirection: 'row', paddingHorizontal: 20 },

  modeRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#1a2d5a' },
  modeBtnTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  modeBtnTxtActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  switchLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },

  chipRow: { paddingLeft: 20, marginBottom: 5 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  chipTxt: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  chipTxtActive: { color: '#fff' },

  uploadBox: { marginHorizontal: 20, height: (width - 40) * 9 / 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadTitle: { fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 10 },
  uploadSub: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  uploadPreview: { width: '100%', height: '100%', borderRadius: 10 },

  imagePreviewContainer: { marginHorizontal: 20, height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9', marginBottom: 15 },
  removeImgBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(220, 38, 38, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  removeImgBtnTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  cardOverlay: { padding: 15, width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  cardBannerImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', borderRadius: 12 },
  cardTypeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  colorRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },

  previewContainer: { marginHorizontal: 20, padding: 15, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  previewHeader: { flexDirection: 'row', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  previewChurchIcon: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#1a2d5a' },
  previewChurchName: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
  previewNotifyTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  previewNotifySub: { fontSize: 10, color: '#64748b', marginTop: 2 },

  cardPreview: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cardBanner: { padding: 15, minHeight: 100, justifyContent: 'flex-end' },
  cardType: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardTitleTe: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 2 },
  cardContent: { backgroundColor: '#fff', padding: 15 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardInfoTxt: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  previewRsvpBtn: { backgroundColor: '#c0392b', height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  previewRsvpBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  footer: { paddingHorizontal: 20, marginTop: 30 },
  footerLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 10 },
  statusBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTxt: { fontSize: 13, color: '#475569' },
  publishBtn: { backgroundColor: '#c0392b', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  publishBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  draftBtn: { backgroundColor: '#1a2d5a', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  draftBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },


  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },

  // JS Picker Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: width * 0.85, borderRadius: 16, padding: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 20, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', height: 180, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  pickerCol: { flex: 1 },
  pickerItem: { paddingVertical: 12, textAlign: 'center', fontSize: 15, color: '#64748b' },
  pickerItemActive: { color: '#1a2d5a', fontWeight: '800', backgroundColor: '#f0f7ff' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  modalConfirm: { flex: 1, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a2d5a' },
  modalConfirmTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Success Card Styles
  successCard: { backgroundColor: '#fff', width: width * 0.85, borderRadius: 24, padding: 30, alignItems: 'center', elevation: 25, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#c0392b20', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a2d5a', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 14, color: '#64748b', lineHeight: 20, textAlign: 'center', marginBottom: 30 },
  successBtnPrimary: { backgroundColor: '#1a2d5a', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  successBtnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successBtnSecondary: { backgroundColor: '#f1f5f9', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  successBtnSecondaryTxt: { color: '#475569', fontSize: 15, fontWeight: '700' }
});
