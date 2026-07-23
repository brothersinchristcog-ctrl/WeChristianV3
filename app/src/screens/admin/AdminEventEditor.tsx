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
  const [eventType, setEventType] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTe, setDescTe] = useState('');

  const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurring, setRecurring] = useState('');
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
          <TouchableOpacity onPress={() => setActiveTab(7)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle}>{editingData ? 'Edit Event' : 'New Event'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* 1. Event Details */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Info size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Event Details</Text>
          </View>
          
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Event Title — English <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={styles.input} value={titleEn} onChangeText={setTitleEn} placeholder="e.g. Easter Sunday Service 2026" />
          </View>
          
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Event Title — Telugu</Text>
            <TextInput style={[styles.input, styles.teIn]} value={titleTe} onChangeText={setTitleTe} placeholder="తెలుగులో కార్యక్రమం పేరు..." />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Event Type</Text>
            <TouchableOpacity style={styles.inputWrap} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
              <Text style={styles.inputText}>{EVENT_TYPES.find((t: any) => t.value === eventType)?.label || eventType || 'Select Type'}</Text>
              <ChevronDown size={14} color="#374151" />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {EVENT_TYPES.map(t => (
                  <TouchableOpacity key={t.value} style={[styles.dropdownItem, eventType === t.value && styles.dropdownItemActive]} onPress={() => { setEventType(t.value); setShowTypeDropdown(false); }}>
                    <Text style={[styles.dropdownItemTxt, eventType === t.value && styles.dropdownItemTxtActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Description — English</Text>
            <TextInput style={[styles.input, styles.textarea]} multiline value={descEn} onChangeText={setDescEn} placeholder="Tell your members what to expect..." />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Description — Telugu</Text>
            <TextInput style={[styles.input, styles.textarea, styles.teIn]} multiline value={descTe} onChangeText={setDescTe} placeholder="కార్యక్రమం గురించి వివరించండి..." />
          </View>
        </View>

        {/* 2. Date & Schedule */}
        <View style={[styles.section, styles.secRed]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Calendar size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Date & Schedule</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Date <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TouchableOpacity style={styles.inputWrap} onPress={() => setDatePickerVisibility(true)}>
              <Text style={styles.inputText}>{date || 'DD-MM-YYYY'}</Text>
              <Calendar size={14} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.fGroup, { flex: 1 }]}>
              <Text style={styles.fLabel}>Start Time <Text style={{color:'#c0392b'}}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setStartTimeVisibility(true)}>
                <Text style={styles.inputText}>{startTime || '09:00 AM'}</Text>
                <Clock size={14} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={[styles.fGroup, { flex: 1 }]}>
              <Text style={styles.fLabel}>End Time</Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setEndTimeVisibility(true)}>
                <Text style={styles.inputText}>{endTime || '12:00 PM'}</Text>
                <Clock size={14} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Recurring</Text>
            <TouchableOpacity style={styles.inputWrap} onPress={() => setShowRecurringDropdown(!showRecurringDropdown)}>
              <Text style={styles.inputText}>{RECURRING_OPTIONS.find((t: any) => t.value === recurring)?.label || recurring || 'One-time event'}</Text>
              <ChevronDown size={14} color="#374151" />
            </TouchableOpacity>
            {showRecurringDropdown && (
              <View style={styles.dropdownMenu}>
                {RECURRING_OPTIONS.map(r => (
                  <TouchableOpacity key={r.value} style={[styles.dropdownItem, recurring === r.value && styles.dropdownItemActive]} onPress={() => { setRecurring(r.value); setShowRecurringDropdown(false); }}>
                    <Text style={[styles.dropdownItemTxt, recurring === r.value && styles.dropdownItemTxtActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {recurring !== 'One-time event' && (
            <View style={styles.fGroup}>
              <Text style={styles.fLabel}>Recurrence Duration</Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setShowDurationDropdown(!showDurationDropdown)}>
                <Text style={styles.inputText}>{DURATION_OPTIONS.find((t: any) => t.value === recurrenceDuration)?.label || `For ${recurrenceDuration} month(s)`}</Text>
                <ChevronDown size={14} color="#374151" />
              </TouchableOpacity>
              {showDurationDropdown && (
                <View style={styles.dropdownMenu}>
                  {DURATION_OPTIONS.map(o => (
                    <TouchableOpacity key={o.value} style={[styles.dropdownItem, recurrenceDuration === o.value && styles.dropdownItemActive]} onPress={() => { setRecurrenceDuration(o.value); setShowDurationDropdown(false); }}>
                      <Text style={[styles.dropdownItemTxt, recurrenceDuration === o.value && styles.dropdownItemTxtActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 3. Venue & Location */}
        <View style={[styles.section, styles.secGreen]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <MapPin size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Venue & Location</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Venue Name — English <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={styles.input} placeholder="e.g. Main Auditorium" value={venueEn} onChangeText={setVenueEn} />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Venue Name — Telugu</Text>
            <TextInput style={[styles.input, styles.teIn]} placeholder="ఆవరణ పేరు తెలుగులో..." value={venueTe} onChangeText={setVenueTe} />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Full Address <Text style={styles.fHint}>Shown on Google Maps link</Text></Text>
            <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Street, area, city..." value={address} onChangeText={setAddress} />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Event Mode</Text>
            <View style={styles.modeRow}>
              {(metadata?.modes?.length > 0 ? metadata.modes : [
                { label: 'In person', value: 'In person' },
                { label: 'Online', value: 'Online' },
                { label: 'Hybrid', value: 'Hybrid' }
              ]).map((m: any) => (
                <TouchableOpacity key={m.value} style={[styles.modeBtn, mode === m.value && styles.modeBtnActive]} onPress={() => setMode(m.value)}>
                  <Text style={[styles.modeBtnTxt, mode === m.value && styles.modeBtnTxtActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 4. RSVP & Audience */}
        <View style={[styles.section, styles.secAmber]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Users size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>RSVP & Audience</Text>
          </View>

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

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Audience</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(metadata?.audiences?.length > 0 ? metadata.audiences : [
                { label: 'All members', value: 'All members' },
                { label: 'Youth', value: 'Youth' },
                { label: 'Women', value: 'Women' },
                { label: 'Men', value: 'Men' },
                { label: 'Leaders', value: 'Leaders' }
              ]).map((a: any) => (
                <TouchableOpacity key={a.value} style={[styles.chip, audience === a.value && styles.chipActive]} onPress={() => setAudience(a.value)}>
                  <Text style={[styles.chipTxt, audience === a.value && styles.chipTxtActive]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 5. Banner & Media */}
        <View style={[styles.section, styles.secPurple]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <ImageIcon size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Event Banner</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Upload Banner Image</Text>
            {bannerUrl ? (
              <View style={styles.thumbnailPreviewContainer}>
                <Image source={{ uri: bannerUrl }} style={styles.thumbnailImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removeThumbnailBtn} onPress={() => setBannerUrl('')}>
                  <Text style={styles.btnChangeThumbTxt}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnUploadThumb} onPress={pickImage}>
                <ImageIcon size={24} color="#7C3AED" style={{ marginBottom: 8 }} />
                <Text style={styles.btnUploadThumbTxt}>Pick from Gallery / Files</Text>
                <Text style={styles.fHint}>Select a high-quality banner</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Or Paste Image URL</Text>
            <TextInput style={styles.input} value={bannerUrl} onChangeText={setBannerUrl} placeholder="https://example.com/image.jpg" />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Fallback Banner Color</Text>
            <View style={styles.themeRow}>
              {['#c0392b', '#1a2d5a', '#15803D', '#7C3AED', '#D97706', '#dc2626'].map(c => (
                <TouchableOpacity key={c} style={[styles.themeChip, { backgroundColor: c }, bannerColor === c && styles.themeActive]} onPress={() => setBannerColor(c)} />
              ))}
            </View>
          </View>
        </View>

        {/* 6. Notifications */}
        <View style={[styles.section, styles.secBlue]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Bell size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Notifications</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Notify members when published</Text>
            <Switch value={notifyOnPublish} onValueChange={setNotifyOnPublish} trackColor={{ true: '#1a2d5a' }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Send reminder 1 day before</Text>
            <Switch value={reminder1Day} onValueChange={setReminder1Day} trackColor={{ true: '#1a2d5a' }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Send reminder 1 hour before</Text>
            <Switch value={reminder1Hour} onValueChange={setReminder1Hour} trackColor={{ true: '#1a2d5a' }} />
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerBtnRow}>
          <TouchableOpacity style={styles.btnDraft} onPress={() => handleSave('Draft')} disabled={loading}>
            {loading && publishStatus === 'Draft' ? (
              <ActivityIndicator color="#1a2d5a" size="small" />
            ) : (
              <Text style={styles.btnDraftTxt}>Save as Draft</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('Published')} disabled={loading}>
            {loading && publishStatus === 'Published' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnSaveTxt}>Publish Event</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnBack} onPress={() => { resetForm(); setActiveTab(7); }}>
          <Text style={styles.btnBackTxt}>← Back to list</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {isDatePickerVisible && <JSPickerModal type="date" visible={isDatePickerVisible} onClose={() => setDatePickerVisibility(false)} onConfirm={() => { setDate(`${tempDate.d}-${tempDate.m}-${tempDate.y}`); setDatePickerVisibility(false); }} />}
      {isStartTimeVisible && <JSPickerModal type="time" visible={isStartTimeVisible} onClose={() => setStartTimeVisibility(false)} onConfirm={() => { setStartTime(`${tempTime.h}:${tempTime.m} ${tempTime.p}`); setStartTimeVisibility(false); }} />}
      {isEndTimeVisible && <JSPickerModal type="time" visible={isEndTimeVisible} onClose={() => setEndTimeVisibility(false)} onConfirm={() => { setEndTime(`${tempTime.h}:${tempTime.m} ${tempTime.p}`); setEndTimeVisibility(false); }} />}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },

  hero: { 
    backgroundColor: '#1a2d5a', 
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  secNavy: { borderTopColor: '#1a2d5a' },
  secBlue: { borderTopColor: '#0891B2' },
  secRed: { borderTopColor: '#c0392b' },
  secGreen: { borderTopColor: '#15803D' },
  secPurple: { borderTopColor: '#7C3AED' },
  secAmber: { borderTopColor: '#D97706' },

  secHd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,90,0.07)',
    paddingBottom: 10,
  },
  secHdPill: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secHdTXT: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a2d5a',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    flex: 1,
  },

  fGroup: { marginBottom: 12 },
  fLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  fHint: { fontWeight: '500', color: '#9CA3AF', fontSize: 11, textTransform: 'none', letterSpacing: 0 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E2DDD5',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inputText: { flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '500' },
  input: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E2DDD5',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: '#1a2d5a',
    fontWeight: '500',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 11 },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1a2d5a', fontSize: 14, lineHeight: 22 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  switchLabel: { fontSize: 13, color: '#1a2d5a', fontWeight: '500' },

  dropdownMenu: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 4, elevation: 3 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#1a2d5a' },
  dropdownItemTxt: { fontSize: 13, color: '#1e293b' },
  dropdownItemTxtActive: { color: '#fff', fontWeight: '700' },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  modeBtnActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  modeBtnTxt: { fontSize: 12, color: '#475569', fontWeight: '600' },
  modeBtnTxtActive: { color: '#fff' },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  chipTxt: { fontSize: 12, color: '#475569', fontWeight: '600' },
  chipTxtActive: { color: '#fff' },

  themeRow: { flexDirection: 'row', marginTop: 6, gap: 10, paddingVertical: 4 },
  themeChip: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderColor: 'transparent' },
  themeActive: { borderColor: '#C9A84C', transform: [{ scale: 1.1 }] },

  btnUploadThumb: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D9D3C7',
    borderStyle: 'dashed',
  },
  btnUploadThumbTxt: { color: '#4B5563', fontSize: 14, fontWeight: '700' },
  thumbnailPreviewContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  thumbnailImg: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: '#D9D3C7' },
  removeThumbnailBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  btnChangeThumbTxt: { color: '#991B1B', fontSize: 13, fontWeight: '700' },

  footerBtnRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSave: {
    flex: 1, backgroundColor: '#2E6B4F', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#2E6B4F', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  btnSaveTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  btnDraft: {
    flex: 1, backgroundColor: '#F5F0E8', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.30)',
  },
  btnDraftTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  btnBack: { alignItems: 'center', paddingVertical: 10 },
  btnBackTxt: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

  // JSPicker Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 20, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', height: 200 },
  pickerCol: { flex: 1, borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  pickerItem: { paddingVertical: 12, textAlign: 'center', color: '#475569', fontSize: 15 },
  pickerItemActive: { color: '#1a2d5a', fontWeight: '800', backgroundColor: '#f1f5f9' },
  modalFooter: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  modalCancel: { flex: 1, padding: 10, alignItems: 'center' },
  modalCancelTxt: { color: '#94a3b8', fontWeight: '700', fontSize: 15 },
  modalConfirm: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#1a2d5a', borderRadius: 8 },
  modalConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Success Modal
  successCard: { backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 25, alignItems: 'center' },
  successIconOuter: { backgroundColor: '#F0FDF4', borderRadius: 50, padding: 10, marginBottom: 20 },
  successIconInner: { backgroundColor: '#22c55e', borderRadius: 40, padding: 15 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a2d5a', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  successBtnPrimary: { backgroundColor: '#1a2d5a', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  successBtnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successBtnSecondary: { width: '100%', paddingVertical: 15, alignItems: 'center' },
  successBtnSecondaryTxt: { color: '#1a2d5a', fontWeight: '700', fontSize: 15 }
});
