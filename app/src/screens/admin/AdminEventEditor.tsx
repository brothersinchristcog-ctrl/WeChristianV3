import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Bell,
  Eye,
  Save,
  ChevronDown,
  ChevronLeft,
  Info,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  AlertCircle,
  Trash2,
  X,
  Plus,
  Sparkles,
  QrCode
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminTabContext } from '../../context/AdminTabContext';
import { AppAlert } from '../../components/CustomAlert';

import FirestoreService from '../../services/FirestoreService';

const { width, height } = Dimensions.get('window');

const DEFAULT_EVENT_TYPES = [
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
  const { setActiveTab, editingData, setEditingData, setTabByName } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [requireEventQR, setRequireEventQR] = useState(false);

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [eventType, setEventType] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTe, setDescTe] = useState('');

  // Custom Event Types State
  const [customTypes, setCustomTypes] = useState<{ label: string; value: string }[]>([]);
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeNameEn, setNewTypeNameEn] = useState('');
  const [newTypeNameTe, setNewTypeNameTe] = useState('');

  const allEventTypes = React.useMemo(() => {
    const list = [...DEFAULT_EVENT_TYPES];
    customTypes.forEach(ct => {
      if (!list.some(item => item.value.toLowerCase() === ct.value.toLowerCase())) {
        list.push(ct);
      }
    });
    if (editingData?.type && !list.some(t => t.value.toLowerCase() === editingData.type.toLowerCase())) {
      list.push({ label: editingData.type, value: editingData.type });
    } else if (editingData?.eventType && !list.some(t => t.value.toLowerCase() === editingData.eventType.toLowerCase())) {
      list.push({ label: editingData.eventType, value: editingData.eventType });
    }
    return list;
  }, [customTypes, editingData]);

  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  const [date, setDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    titleEn: string;
    titleTe?: string;
    messageEn: string;
    messageTe?: string;
    hintEn?: string;
    hintTe?: string;
    timeDetails?: {
      date: string;
      startTime: string;
      endTime: string;
    };
  } | null>(null);

  const isSameDayTimeIssue = useMemo(() => {
    if (!date || !endDate || !startTime || !endTime) return false;
    if (date.trim() !== endDate.trim()) return false;
    const parseMins = (t: string) => {
      try {
        const c = t.toUpperCase().replace(/\s+/g, '').replace(/[\u202F\u00A0]/g, '');
        const isPM = c.includes('PM');
        const isAM = c.includes('AM');
        let [h, m] = c.replace('AM', '').replace('PM', '').split(':').map(Number);
        if (isNaN(h)) h = 0;
        if (isNaN(m)) m = 0;
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m;
      } catch {
        return 0;
      }
    };
    return parseMins(endTime) <= parseMins(startTime);
  }, [date, endDate, startTime, endTime]);

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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [reminder1Day, setReminder1Day] = useState(true);
  const [reminder1Hour, setReminder1Hour] = useState(false);

  // UI State
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isStartTimeVisible, setStartTimeVisibility] = useState(false);
  const [isEndTimeVisible, setEndTimeVisibility] = useState(false);

  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    const discoverMetadata = async () => {
      try {
        const meta = await FirestoreService.getEventMetadata('');
        if (meta) {
          console.log('📖 [AdminEventEditor] Metadata Loaded:', JSON.stringify(meta, null, 2));
          setMetadata(meta);

          if (!editingData) {
            if (meta.types?.length > 0) setEventType(meta.types[0].value);
            if (meta.modes?.length > 0) setMode(meta.modes[0].value);
            if (meta.audiences?.length > 0) setAudience(meta.audiences[0].value);

            if (meta.statuses?.length > 0) {
              const hasPublished = meta.statuses.some((s: any) => s.value === 'Published');
              if (!hasPublished) setPublishStatus(meta.statuses[0].value);
            }

            if (meta.recurring?.length > 0) {
              const hasOneTime = meta.recurring.some((s: any) => s.value === 'One-time event');
              if (!hasOneTime) setRecurring(meta.recurring[0].value);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ [AdminEventEditor] Metadata Discovery Failed:', err);
      }

      // Load custom event types from storage & Firestore
      try {
        const local = await AsyncStorage.getItem('@church_custom_event_types');
        let combined: { label: string; value: string }[] = [];
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) combined = parsed;
        }
        try {
          const remote = await FirestoreService.getCustomEventTypes();
          if (Array.isArray(remote) && remote.length > 0) {
            remote.forEach(r => {
              if (!combined.some(c => c.value.toLowerCase() === r.value.toLowerCase())) {
                combined.push(r);
              }
            });
          }
        } catch (_) {}
        if (combined.length > 0) {
          setCustomTypes(combined);
        }
      } catch (err) {
        console.warn('⚠️ [AdminEventEditor] Custom Event Types Load Failed:', err);
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
      if (sfDate.includes('-') && sfDate.split('-')[0].length === 2) return sfDate;
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
      setEndDate(editingData.endDate ? formatFromSFDate(editingData.endDate) : formatFromSFDate(editingData.date));
      setVenueEn(editingData.location || '');
      setVenueTe(editingData.locationTe || '');
      setAddress(editingData.address || '');
      setStartTime(formatFromSFTime(editingData.startTime || '09:00 AM'));
      setEndTime(formatFromSFTime(editingData.endTime || '12:00 PM'));
      setEventType(editingData.type || editingData.eventType || 'Sunday Service');
      setMode(editingData.mode || 'In person');
      setRsvpEnabled(editingData.rsvpEnabled ?? true);
      setRsvpPublic(editingData.rsvpPublic ?? true);
      setAudience(editingData.audience || 'All members');
      setPublishStatus(editingData.status || 'Published');
      setRecurring(editingData.recurring || 'One-time event');
      setRecurrenceDuration(editingData.recurrenceDuration || 1);
      setRequireEventQR(editingData.requireEventQR === true || editingData.requireEventQr === true);
      setBannerUrl(editingData.bannerUrl || '');
      setBannerColor(editingData.bannerColor || '#c0392b');
    }
  }, [editingData]);

  const handleAddNewEventType = async () => {
    const trimmedEn = newTypeNameEn.trim();
    const trimmedTe = newTypeNameTe.trim();
    if (!trimmedEn) {
      AppAlert.alert('Required Field · అవసరమైన వివరాలు', 'Please enter a name for the new Event Type.\nదయచేసి ఈవెంట్ రకం పేరును నమోదు చేయండి.', undefined, 'error');
      return;
    }

    const newLabel = trimmedTe ? `${trimmedEn} · ${trimmedTe}` : trimmedEn;
    const newEntry = { label: newLabel, value: trimmedEn };

    const exists = allEventTypes.some(t => t.value.toLowerCase() === trimmedEn.toLowerCase());
    if (exists) {
      setEventType(trimmedEn);
      setShowNewTypeModal(false);
      setNewTypeNameEn('');
      setNewTypeNameTe('');
      return;
    }

    const updatedCustom = [...customTypes, newEntry];
    setCustomTypes(updatedCustom);
    setEventType(trimmedEn);
    setShowNewTypeModal(false);
    setNewTypeNameEn('');
    setNewTypeNameTe('');

    try {
      await AsyncStorage.setItem('@church_custom_event_types', JSON.stringify(updatedCustom));
      await FirestoreService.saveCustomEventType(newEntry);
    } catch (e) {
      console.warn('Failed saving custom event type:', e);
    }
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
        setIsUploadingBanner(true);
        try {
          const cloudUrl = await uploadImageToCloud(localUri);
          setBannerUrl(cloudUrl);
          setImageLoadError(false);
          AppAlert.alert('Success · విజయం', 'Banner uploaded to cloud successfully! all members will be able to see it.', undefined, 'success');
        } catch (err) {
          console.error('Cloud upload error:', err);
          setBannerUrl(localUri);
          setImageLoadError(false);
          AppAlert.alert('Upload Failed · అప్‌లోడ్ విఫలమైంది', 'Failed to upload banner to the cloud. You can still save it or manually paste a public web link in the text box.', undefined, 'error');
        } finally {
          setIsUploadingBanner(false);
        }
      }
    } catch (err) {
      AppAlert.alert('Picker Error', 'Native module not ready yet. Please use the URL field for now.', undefined, 'error');
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const reportError = (
    titleEn: string,
    titleTe: string,
    messageEn: string,
    messageTe?: string,
    hintEn?: string,
    hintTe?: string,
    timeDetails?: { date: string; startTime: string; endTime: string }
  ) => {
    setValidationError(messageEn);
    setErrorModal({
      visible: true,
      titleEn,
      titleTe,
      messageEn,
      messageTe,
      hintEn,
      hintTe,
      timeDetails
    });
  };

  const handleSave = async (status: 'Published' | 'Draft') => {
    if (!titleEn || !titleEn.trim()) {
      reportError('Required Field', 'అవసరమైన వివరాలు', 'Please enter an event title in English.', 'దయచేసి కార్యక్రమం పేరును నమోదు చేయండి.');
      return;
    }
    if (!date || !date.trim()) {
      reportError('Required Field', 'అవసరమైన వివరాలు', 'Please select a Start Date.', 'దయచేసి ప్రారంభ తేదీని ఎంచుకోండి.');
      return;
    }
    if (!endDate || !endDate.trim()) {
      reportError('Required Field', 'అవసరమైన వివరాలు', 'Please select an End Date.', 'దయచేసి ముగింపు తేదీని ఎంచుకోండి.');
      return;
    }
    if (!startTime || !startTime.trim()) {
      reportError('Required Field', 'అవసరమైన వివరాలు', 'Please select a Start Time.', 'దయచేసి ప్రారంభ సమయాన్ని ఎంచుకోండి.');
      return;
    }
    if (!endTime || !endTime.trim()) {
      reportError('Required Field', 'అవసరమైన వివరాలు', 'Please select an End Time.', 'దయచేసి ముగింపు సమయాన్ని ఎంచుకోండి.');
      return;
    }

    const cleanDate = (date || '').trim();
    const cleanEndDate = (endDate || '').trim();

    let sfDate = cleanDate;
    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-');
      if (parts[0].length === 2) {
        sfDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    let sfEndDate = cleanEndDate;
    if (cleanEndDate.includes('-')) {
      const parts = cleanEndDate.split('-');
      if (parts[0].length === 2) {
        sfEndDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    if (sfEndDate < sfDate) {
      reportError('Invalid Date Range', 'చెల్లని తేదీ పరిధి', 'End Date cannot be before Start Date.', 'ముగింపు తేదీ ప్రారంభ తేదీ కంటే ముందు ఉండకూడదు.');
      return;
    }

    const parseTimeToMinutes = (timeStr: string): number => {
      if (!timeStr) return 0;
      try {
        const cleanStr = timeStr.toUpperCase().replace(/\s+/g, '').replace(/[\u202F\u00A0]/g, '');
        const isPM = cleanStr.includes('PM');
        const isAM = cleanStr.includes('AM');
        const timePart = cleanStr.replace('AM', '').replace('PM', '');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(hours)) hours = 0;
        if (isNaN(minutes)) minutes = 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60 + minutes;
      } catch {
        return 0;
      }
    };

    if (sfEndDate === sfDate) {
      const startMins = parseTimeToMinutes(startTime);
      const endMins = parseTimeToMinutes(endTime);
      if (endMins <= startMins) {
        reportError(
          'Adjust Event End Time',
          'ఈవెంట్ ముగింపు సమయాన్ని సర్దుబాటు చేయండి',
          `End Time (${endTime}) is earlier than Start Time (${startTime}) on the same date (${cleanDate}).`,
          'ఒకే రోజున ముగింపు సమయం ప్రారంభ సమయం కంటే ముందు ఉండకూడదు.',
          'If this event continues past midnight into tomorrow morning, please change the End Date to the next day.',
          'ఈవెంట్ అర్ధరాత్రి దాటితే, దయచేసి ముగింపు తేదీని మరుసటి రోజుకు మార్చండి.',
          { date: cleanDate, startTime, endTime }
        );
        return;
      }
    }

    setValidationError(null);
    setErrorModal(null);

    const executeSave = async (updateMode?: 'single' | 'future') => {
      setPublishStatus(status);
      setLoading(true);

    const formatToSFTime = (timeStr: string) => {
      if (!timeStr) return null;
      try {
        const cleanStr = timeStr.toUpperCase().replace(/\s+/g, '').replace(/[\u202F\u00A0]/g, '');
        const isPM = cleanStr.includes('PM');
        const isAM = cleanStr.includes('AM');
        const timePart = cleanStr.replace('AM', '').replace('PM', '');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(minutes)) minutes = 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
      } catch (e) {
        return timeStr;
      }
    };

    const resolveStatus = (requested: string) => {
      if (!metadata?.statuses || metadata.statuses.length === 0) return requested;
      const match = metadata.statuses.find((s: any) =>
        s.value === requested ||
        s.label === requested ||
        s.value.toLowerCase().includes('pub') ||
        s.value.toLowerCase().includes('act') ||
        s.label.toLowerCase().includes('pub') ||
        s.label.toLowerCase().includes('act')
      );
      if (requested.toLowerCase() === 'draft') {
        const draftMatch = metadata.statuses.find((s: any) => 
          s.value.toLowerCase().includes('dra') || s.label.toLowerCase().includes('dra')
        );
        if (draftMatch) return draftMatch.value;
      }
      return match ? match.value : metadata.statuses[0].value;
    };

    const resolveValue = (field: string, val: string) => {
      if (!metadata?.[field] || metadata[field].length === 0) return val;
      const list = metadata[field];
      const cleanVal = val.split(' - ')[0].split(' · ')[0].trim();
      const normalizedVal = cleanVal.toLowerCase();
      const match = list.find((m: any) => {
        const mVal = m.value.trim().toLowerCase();
        const mLbl = m.label.trim().toLowerCase();
        return mVal === normalizedVal || mLbl === normalizedVal || mVal.includes(normalizedVal) || normalizedVal.includes(mVal);
      });
      return match ? match.value : cleanVal;
    };

    const payload = {
      id: editingData?.id,
      titleEn, titleTe,
      name: titleEn,
      title: titleEn,
      titleTelugu: titleTe,
      date: sfDate,
      endDate: sfEndDate,
      startTime: formatToSFTime(startTime),
      endTime: formatToSFTime(endTime),
      descEn, descTe, venueEn, venueTe, address,
      location: venueEn,
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
      requireEventQR,
      notifyOnPublish, reminder1Day, reminder1Hour,
      rsvpCap: capAttendance ? 100 : 0,
      updateMode
    };

    try {
      await FirestoreService.createEvent(payload);

      if (notifyOnPublish && status === 'Published') {
        try {
          const { getFirestore } = require('@react-native-firebase/firestore');
          const churchId = await FirestoreService.getChurchId();
           const formatDisplayDate = (d: string) => {
              try {
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const parts = d.split('-');
                if (parts.length === 3 && parts[0].length === 4) {
                  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
                }
                return d;
              } catch { return d; }
            };
            const displayDate = formatDisplayDate(sfDate);
            const displayEndDate = formatDisplayDate(sfEndDate);
           await FirestoreService.createNotificationBroadcast({
            title: `📅 New Event: ${titleEn}`,
            content: `Join us for "${titleEn}" from ${displayDate} to ${displayEndDate} at ${startTime}${venueEn ? ` · ${venueEn}` : ''}. ${descEn ? descEn.substring(0, 100) : ''}`,
            type: eventType,
            date: sfDate,
            endDate: sfEndDate,
            startTime: startTime || undefined,
            targetChurchId: churchId,
          });
        } catch (notifErr) {
          console.warn('⚠️ Event push notification failed (non-critical):', notifErr);
        }
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('❌ [AdminEventEditor] Save Failed:', err);
      alert(`Error saving event: ${err}`);
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
    setImageLoadError(false);
    setImageLoading(false);
    const d = new Date();
    const ds = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    setDate(ds); setEndDate(ds);
    setStartTime('09:00 AM'); setEndTime('12:00 PM');
    setNotifyOnPublish(true); setReminder1Day(true); setReminder1Hour(false);
    setRequireEventQR(false);
    setEditingData(null);
  };

  const SuccessModal = () => {
    const isPublished = publishStatus === 'Published';
    return (
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            {/* Top Close Button */}
            <TouchableOpacity 
              style={styles.successCloseBtn} 
              onPress={() => { setShowSuccess(false); resetForm(); setTabByName?.('Events'); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>

            {/* Status Pill */}
            <View style={[styles.successPill, { backgroundColor: isPublished ? '#ecfdf5' : '#eff6ff', borderColor: isPublished ? '#a7f3d0' : '#bfdbfe', marginTop: 10 }]}>
              <Sparkles size={13} color={isPublished ? '#059669' : '#1d4ed8'} style={{ marginRight: 6 }} />
              <Text style={[styles.successPillTxt, { color: isPublished ? '#065f46' : '#1e40af' }]}>
                {isPublished ? 'PUBLISHED TO CHURCH APP' : 'SAVED AS DRAFT'}
              </Text>
            </View>

            {/* Title & Bilingual Subtitle */}
            <Text style={styles.successTitle}>
              {isPublished ? 'Event Published! 🎉' : 'Event Saved! 📝'}
            </Text>
            <Text style={styles.successTeluguTitle}>
              {isPublished ? 'కార్యక్రమం విజయవంతంగా ప్రచురించబడింది!' : 'ఈవెంట్ డ్రాఫ్ట్‌గా సేవ్ చేయబడింది!'}
            </Text>

            {/* Event Summary Card */}
            <View style={styles.successSummaryBox}>
              <Text style={styles.successEventTitle} numberOfLines={2}>
                {titleEn}{titleTe ? ` · ${titleTe}` : ''}
              </Text>
              
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Calendar size={13} color="#1a2d5a" style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryVal}>
                  {date === endDate || !endDate ? date : `${date} → ${endDate}`}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Clock size={13} color="#b91c1c" style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryVal}>{startTime} – {endTime}</Text>
              </View>

              {venueEn ? (
                <View style={styles.summaryRow}>
                  <MapPin size={13} color="#059669" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Venue:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>{venueEn}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity 
              activeOpacity={0.88}
              style={styles.successBtnPrimary} 
              onPress={() => { setShowSuccess(false); resetForm(); setTabByName?.('Events'); }}
            >
              <LinearGradient
                colors={['#1a2d5a', '#2b4c8c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successBtnGradient}
              >
                <Text style={styles.successBtnPrimaryTxt}>View Church Events →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.successBtnSecondary} 
              onPress={() => { setShowSuccess(false); resetForm(); }}
            >
              <Plus size={15} color="#1a2d5a" style={{ marginRight: 6 }} />
              <Text style={styles.successBtnSecondaryTxt}>Create Another Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const ValidationErrorModal = () => {
    if (!errorModal || !errorModal.visible) return null;

    return (
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorCard}>
            {/* Top Close Button */}
            <TouchableOpacity 
              style={styles.errorCloseBtn} 
              onPress={() => setErrorModal(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* Clean, Refined Icon */}
            <View style={styles.errorIconCircle}>
              <AlertCircle size={26} color="#d97706" />
            </View>

            {/* Clear Single Title */}
            <Text style={styles.errorTitle}>{errorModal.titleEn}</Text>

            {/* Crisp Message */}
            <Text style={styles.errorMessageText}>{errorModal.messageEn}</Text>

            {/* Optional Clean Hint */}
            {errorModal.hintEn ? (
              <View style={styles.errorHintBox}>
                <Text style={styles.errorHintText}>💡 {errorModal.hintEn}</Text>
              </View>
            ) : null}

            {/* Action Button */}
            <TouchableOpacity 
              activeOpacity={0.88}
              style={styles.errorActionBtn} 
              onPress={() => setErrorModal(null)}
            >
              <LinearGradient
                colors={['#1a2d5a', '#2b4c8c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.errorBtnGradient}
              >
                <Text style={styles.errorActionBtnTxt}>Got It</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SuccessModal />
      <ValidationErrorModal />

      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity onPress={() => setTabByName?.('Events')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle}>{editingData ? 'Edit Event' : 'New Event'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
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
              <Text style={styles.inputText}>{allEventTypes.find((t: any) => t.value === eventType)?.label || eventType || 'Select Type'}</Text>
              <ChevronDown size={14} color="#374151" />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 260 }}>
                  {allEventTypes.map(t => (
                    <TouchableOpacity key={t.value} style={[styles.dropdownItem, eventType === t.value && styles.dropdownItemActive]} onPress={() => { setEventType(t.value); setShowTypeDropdown(false); }}>
                      <Text style={[styles.dropdownItemTxt, eventType === t.value && styles.dropdownItemTxtActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[styles.dropdownItem, styles.dropdownItemNew]} 
                    onPress={() => { 
                      setShowTypeDropdown(false); 
                      setNewTypeNameEn('');
                      setNewTypeNameTe('');
                      setShowNewTypeModal(true); 
                    }}
                  >
                    <Plus size={16} color="#A67C3D" style={{ marginRight: 8 }} />
                    <Text style={styles.dropdownItemNewTxt}>New Event Type...</Text>
                  </TouchableOpacity>
                </ScrollView>
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

        <View style={[styles.section, styles.secRed]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Calendar size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Date & Schedule</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fLabel}>Start Date <Text style={{color:'#c0392b'}}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setDatePickerVisibility(true)}>
                <CalendarDays size={18} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.inputText}>{date || 'DD-MM-YYYY'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fLabel}>End Date <Text style={{color:'#c0392b'}}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setEndDatePickerVisibility(true)}>
                <CalendarDays size={18} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.inputText}>{endDate || 'DD-MM-YYYY'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={[styles.fGroup, { flex: 1 }]}>
              <Text style={styles.fLabel}>Start Time <Text style={{color:'#c0392b'}}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setStartTimeVisibility(true)}>
                <Text style={styles.inputText}>{startTime || '09:00 AM'}</Text>
                <Clock size={14} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={[styles.fGroup, { flex: 1 }]}>
              <Text style={styles.fLabel}>End Time <Text style={{color:'#c0392b'}}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setEndTimeVisibility(true)}>
                <Text style={styles.inputText}>{endTime || '12:00 PM'}</Text>
                <Clock size={14} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {isSameDayTimeIssue && (
            <View style={styles.scheduleTipBox}>
              <Info size={14} color="#0369a1" style={{ marginTop: 2, marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTipTxt}>
                  💡 <Text style={{ fontWeight: '700' }}>Schedule Guidance:</Text> End Time ({endTime}) is earlier than Start Time ({startTime}) on the same date. If this event runs past midnight, please set the <Text style={{ fontWeight: '700' }}>End Date</Text> to the next day.
                </Text>
                <Text style={styles.scheduleTipTe}>
                  ఈవెంట్ అర్ధరాత్రి దాటి జరిగితే, దయచేసి ముగింపు తేదీని మరుసటి రోజుగా ఎంచుకోండి.
                </Text>
              </View>
            </View>
          )}

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

        <View style={[styles.section, styles.secGreen]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <MapPin size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Venue & Location</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Venue Name — English</Text>
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


        <View style={[styles.section, styles.secPurple]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <ImageIcon size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Event Banner & Poster</Text>
          </View>

          {isUploadingBanner ? (
            <View style={styles.btnUploadThumb}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.btnUploadThumbTxt}>Uploading poster to cloud...</Text>
            </View>
          ) : bannerUrl && bannerUrl.trim().length > 0 ? (
            <View style={styles.fGroup}>
              <View style={styles.bannerPreviewCard}>
                <Image 
                  source={{ uri: bannerUrl.trim() }} 
                  style={styles.bannerPreviewImg} 
                  resizeMode="cover" 
                  onLoadStart={() => { setImageLoading(true); setImageLoadError(false); }}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => { setImageLoading(false); setImageLoadError(true); }}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                  </View>
                )}
                {imageLoadError && (
                  <View style={styles.imageErrorOverlay}>
                    <AlertCircle size={28} color="#DC2626" style={{ marginBottom: 6 }} />
                    <Text style={styles.imageErrorTxt}>Unable to load image preview</Text>
                    <Text style={styles.imageErrorSub}>Please verify this is a direct, public image link (jpg, png, webp).</Text>
                  </View>
                )}
                <View style={styles.bannerOverlayBar}>
                  <TouchableOpacity style={styles.bannerBtnEdit} onPress={pickImage}>
                    <ImageIcon size={14} color="#fff" />
                    <Text style={styles.bannerBtnTxt}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bannerBtnDelete} onPress={() => { setBannerUrl(''); setImageLoadError(false); }}>
                    <Trash2 size={14} color="#fff" />
                    <Text style={styles.bannerBtnTxt}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnUploadThumb} onPress={pickImage}>
              <ImageIcon size={32} color="#7C3AED" style={{ marginBottom: 10 }} />
              <Text style={styles.btnUploadThumbTxt}>Upload Poster from Gallery</Text>
              <Text style={styles.fHint}>Recommended aspect ratio: 16:9 widescreen</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.fGroup, { marginTop: 14 }]}>
            <Text style={styles.fLabel}>Or Paste Image URL</Text>
            <View style={styles.urlInputWrap}>
              <TextInput 
                style={[styles.input, { flex: 1, paddingRight: bannerUrl ? 36 : 12 }]} 
                value={bannerUrl} 
                onChangeText={(val) => {
                  setBannerUrl(val.trim());
                  setImageLoadError(false);
                }} 
                placeholder="https://example.com/poster.jpg" 
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {bannerUrl.length > 0 && (
                <TouchableOpacity 
                  style={styles.urlClearBtn} 
                  onPress={() => { setBannerUrl(''); setImageLoadError(false); }}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.fHint}>Supports JPG, PNG, WEBP, and direct cloud image URLs.</Text>
          </View>
        </View>

        {/* ── Attendance & QR Check-In Settings ── */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={[styles.secHdPill, { backgroundColor: '#1a2d5a' }]}>
              <QrCode size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Attendance Check-In Settings</Text>
          </View>

          <View style={[styles.switchRow, { alignItems: 'flex-start' }]}>
            <View style={{ flex: 1, paddingRight: 14 }}>
              <Text style={styles.switchLabel}>Event QR Code Required</Text>
              <Text style={[styles.fHint, { marginTop: 4, lineHeight: 16 }]}>
                {requireEventQR
                  ? 'Attendance for this event is allowed ONLY through its specific Event QR Code. The Church QR Code will NOT work.'
                  : 'Church QR Code is allowed. Members can scan either the permanent Church QR or this Event QR to mark attendance.'}
              </Text>
            </View>
            <Switch
              value={requireEventQR}
              onValueChange={setRequireEventQR}
              trackColor={{ false: '#CBD5E1', true: '#1a2d5a' }}
              thumbColor={requireEventQR ? '#C9A84C' : '#FFFFFF'}
            />
          </View>
        </View>

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

        <TouchableOpacity style={styles.btnBack} onPress={() => { resetForm(); setTabByName?.('Events'); }}>
          <Text style={styles.btnBackTxt}>← Back to list</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(d) => {
          setDate(`${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
          setDatePickerVisibility(false);
          setValidationError(null);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={(d) => {
          setEndDate(`${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
          setEndDatePickerVisibility(false);
          setValidationError(null);
        }}
        onCancel={() => setEndDatePickerVisibility(false)}
      />

      <DateTimePickerModal
        isVisible={isStartTimeVisible}
        mode="time"
        onConfirm={(t) => {
          let h = t.getHours();
          const m = String(t.getMinutes()).padStart(2, '0');
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          setStartTime(`${String(h).padStart(2, '0')}:${m} ${ampm}`);
          setStartTimeVisibility(false);
          setValidationError(null);
        }}
        onCancel={() => setStartTimeVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isEndTimeVisible}
        mode="time"
        onConfirm={(t) => {
          let h = t.getHours();
          const m = String(t.getMinutes()).padStart(2, '0');
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          setEndTime(`${String(h).padStart(2, '0')}:${m} ${ampm}`);
          setEndTimeVisibility(false);
          setValidationError(null);
        }}
        onCancel={() => setEndTimeVisibility(false)}
      />

      {/* Modal for Creating New Event Type */}
      <Modal visible={showNewTypeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.newTypeCard}>
            <View style={styles.newTypeHeader}>
              <View style={styles.newTypeIconWrap}>
                <Plus size={20} color="#1a2d5a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.newTypeTitle}>Create New Event Type</Text>
                <Text style={styles.newTypeSub}>కొత్త ఈవెంట్ రకాన్ని జోడించండి</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setShowNewTypeModal(false);
                  setNewTypeNameEn('');
                  setNewTypeNameTe('');
                }} 
                style={styles.newTypeCloseBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.newTypeBody}>
              <View style={styles.newTypeField}>
                <Text style={styles.newTypeLabel}>Event Type Name (English) <Text style={{ color: '#c0392b' }}>*</Text></Text>
                <TextInput
                  style={styles.newTypeInput}
                  placeholder="e.g. Youth Camp, VBS, Fellowship"
                  placeholderTextColor="#9ca3af"
                  value={newTypeNameEn}
                  onChangeText={setNewTypeNameEn}
                  autoFocus
                />
              </View>

              <View style={styles.newTypeField}>
                <Text style={styles.newTypeLabel}>Event Type Name (Telugu — Optional)</Text>
                <TextInput
                  style={[styles.newTypeInput, styles.teIn]}
                  placeholder="ఉదా: వేసవి బైబిల్ పాఠశాల"
                  placeholderTextColor="#9ca3af"
                  value={newTypeNameTe}
                  onChangeText={setNewTypeNameTe}
                />
              </View>
            </View>

            <View style={styles.newTypeActions}>
              <TouchableOpacity 
                style={styles.newTypeCancelBtn} 
                onPress={() => {
                  setShowNewTypeModal(false);
                  setNewTypeNameEn('');
                  setNewTypeNameTe('');
                }}
              >
                <Text style={styles.newTypeCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.newTypeSubmitBtn} 
                onPress={handleAddNewEventType}
              >
                <Text style={styles.newTypeSubmitTxt}>Add & Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },

  validationErrorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  validationErrorTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 4,
  },
  validationErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
    lineHeight: 17,
  },

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
  dropdownItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf5',
    borderTopWidth: 1.5,
    borderTopColor: '#f1e6cf',
    paddingVertical: 12,
  },
  dropdownItemNewTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8C6428',
  },

  // New Type Modal
  newTypeCard: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  newTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  newTypeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTypeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2d5a',
  },
  newTypeSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  newTypeCloseBtn: {
    padding: 4,
  },
  newTypeBody: {
    marginVertical: 16,
    gap: 14,
  },
  newTypeField: {
    gap: 6,
  },
  newTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  newTypeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  newTypeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  newTypeCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  newTypeCancelTxt: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  newTypeSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#1a2d5a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  newTypeSubmitTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  modeBtnActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  modeBtnTxt: { fontSize: 12, color: '#475569', fontWeight: '600' },
  modeBtnTxtActive: { color: '#fff' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  chipTxt: { fontSize: 12, color: '#475569', fontWeight: '600' },
  chipTxtActive: { color: '#fff' },

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
  bannerPreviewCard: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  bannerPreviewImg: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageErrorTxt: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  imageErrorSub: {
    color: '#991B1B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  bannerOverlayBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  bannerBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26,45,90,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bannerBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220,38,38,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bannerBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  urlInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  urlClearBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },

  footerBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
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

  // Success Modal (Premium & Beautiful)
  successCard: { 
    backgroundColor: '#fff', 
    width: '90%', 
    maxWidth: 380,
    borderRadius: 28, 
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 22, 
    alignItems: 'center',
    position: 'relative',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
  },
  successCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successIconPulse: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 6,
    borderColor: '#d1fae5',
  },
  successIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  successIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  successPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successTitle: { 
    fontSize: 21, 
    fontWeight: '800', 
    color: '#0f172a', 
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successTeluguTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginTop: 3,
    marginBottom: 16,
    textAlign: 'center',
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  successEventTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1a2d5a',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  summaryIcon: {
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    width: 48,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  successBtnPrimary: { 
    width: '100%', 
    borderRadius: 14, 
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 10,
  },
  successBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnPrimaryTxt: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 14.5,
    letterSpacing: 0.3,
  },
  successBtnSecondary: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', 
    paddingVertical: 12, 
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  successBtnSecondaryTxt: { 
    color: '#1a2d5a', 
    fontWeight: '700', 
    fontSize: 13.5,
  },

  // Validation Error Modal (Custom & Beautiful)
  errorModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.65)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 16,
  },
  errorCard: { 
    backgroundColor: '#fff', 
    width: '88%', 
    maxWidth: 340,
    borderRadius: 22, 
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 22, 
    alignItems: 'center',
    position: 'relative',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  errorCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0f172a', 
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  errorMessageText: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorHintBox: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  errorHintText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 17,
    fontWeight: '500',
  },
  errorActionBtn: { 
    width: '100%', 
    borderRadius: 12, 
    overflow: 'hidden',
  },
  errorBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorActionBtnTxt: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 14,
    letterSpacing: 0.2,
  },

  scheduleTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  scheduleTipTxt: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
    fontWeight: '500',
  },
  scheduleTipTe: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 3,
    lineHeight: 16,
    fontWeight: '600',
  },

  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
  sectionHeaderText: { fontFamily: 'Outfit-Bold', fontSize: 14, fontWeight: '700' }
});
