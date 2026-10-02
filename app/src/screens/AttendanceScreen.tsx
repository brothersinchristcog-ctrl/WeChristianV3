import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  StatusBar, 
  TextInput, 
  Alert, 
  Platform, 
  Modal, 
  ToastAndroid, 
  Image,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  Vibration
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  QrCode, 
  Eye,
  X, 
  Share2, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Clock, 
  Award, 
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Keyboard,
  MapPin,
  MapPinOff,
  AlertCircle,
  Users,
  UserPlus,
  Plus,
  Trash2
} from 'lucide-react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import AttendanceService, { AttendanceRecord } from '../services/AttendanceService';
import LocationService, { Coordinates } from '../services/LocationService';
import QRDecoderService from '../services/QRDecoderService';
import FirestoreService from '../services/FirestoreService';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const BARCODE_SCANNER_SETTINGS: { barcodeTypes: BarcodeType[] } = { barcodeTypes: ['qr'] };

type MainTab = 'Home' | 'My attendance' | 'Events';
type PeriodFilter = 'This month' | '3 months' | 'This year';
type TimelineFilter = 'Upcoming' | 'Past';
type AttendeesFilter = 'All' | 'Present' | 'Absent';

interface EventItem {
  id: string;
  title: string;
  dateStr: string;
  timeStr: string;
  dateObj: Date;
  location?: string;
  status?: 'Open' | 'Closed';
  presentCount?: number;
  myStatus?: 'Present' | 'Absent' | 'Upcoming';
  myTimestamp?: any;
}

interface UnifiedMember {
  id: string;
  name: string;
  status: 'Present' | 'Absent';
  timestamp?: any;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  isGuest?: boolean;
  guestOf?: string;
}

interface FamilyMemberItem {
  id: string;
  name: string;
  phone?: string;
  relation?: string;
  checked: boolean;
  alreadyMarked: boolean;
  loading?: boolean;
}

interface GuestItem {
  id: string;
  name: string;
  invitedByName?: string;
  loading?: boolean;
}

export default function AttendanceScreen({ navigation, route }: any) {
  const { member, user } = useAuth();
  const { activeChurch } = useChurch();

  const churchId = activeChurch?.id || route?.params?.churchId || '';
  const churchName = activeChurch?.name || route?.params?.churchName || 'Church of God';
  const churchCode = (activeChurch as any)?.code || (activeChurch as any)?.churchCode || '';
  const memberId = member?.id || user?.uid || '';
  const memberName = member?.name || member?.firstName || user?.displayName || 'Member';
  const memberPhone = member?.phone || (member as any)?.MobilePhone || user?.phoneNumber || '';

  // Main navigation tabs: Home | My attendance | Events
  const [activeTab, setActiveTab] = useState<MainTab>(
    (route?.params?.initialTab as MainTab) || 'Home'
  );

  // Sub-filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('This month');
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('Upcoming');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Events & Attendance data
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // "View list" Attendees Roster Modal State
  const [selectedEventForList, setSelectedEventForList] = useState<EventItem | null>(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendeesList, setAttendeesList] = useState<UnifiedMember[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesFilter, setAttendeesFilter] = useState<AttendeesFilter>('All');
  const [attendeesSearch, setAttendeesSearch] = useState('');
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});

  // QR Scanning State
  const insets = useSafeAreaInsets();
  const [selectedEventForScan, setSelectedEventForScan] = useState<EventItem | null>(null);
  const [showScanOptionsModal, setShowScanOptionsModal] = useState(false);
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanAnim = useRef(new Animated.Value(0)).current;
  const SCAN_FRAME_SIZE = Math.min(width * 0.72, 270);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodingMessage, setDecodingMessage] = useState('Analyzing QR Code...');
  const [manualCodeModal, setManualCodeModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showInvalidQrModal, setShowInvalidQrModal] = useState(false);
  const [invalidQrMessage, setInvalidQrMessage] = useState('');

  // 100-Meter Geofence Location Verification State
  const [userLocation, setUserLocation] = useState<{ coords: Coordinates; timestamp: number } | null>(null);
  const [locationErrorModal, setLocationErrorModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    distanceText?: string;
  }>({
    visible: false,
    title: 'Outside Church Location',
    message: '',
    distanceText: undefined,
  });

  // Immediately-marked event IDs (local set for instant UI response after scan)
  const [markedEventIds, setMarkedEventIds] = useState<Set<string>>(new Set());

  // QR Code View Modal (for admin/sharing)
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<any>(null);

  // Success Celebration Modal
  const [scanResultModal, setScanResultModal] = useState<{
    visible: boolean;
    churchName: string;
    eventName: string;
    eventId?: string;
    date: string;
    time: string;
    alreadyMarked?: boolean;
    scannedMemberId?: string;
    scannedMemberName?: string;
    familyMembers: FamilyMemberItem[];
    familyLoading: boolean;
    guests: GuestItem[];
  }>({
    visible: false,
    churchName: '',
    eventName: '',
    eventId: '',
    date: '',
    time: '',
    scannedMemberId: '',
    scannedMemberName: '',
    familyMembers: [],
    familyLoading: false,
    guests: [],
  });

  // Guest Attendance States
  const [guestNameInput, setGuestNameInput] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [showRosterGuestInput, setShowRosterGuestInput] = useState(false);
  const [rosterGuestNameInput, setRosterGuestNameInput] = useState('');

  // Custom Church Toast Notification (Shows current church logo & message)
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<any>(null);

  const churchLogoUrl = activeChurch?.theme?.logoUrl || 
    (activeChurch as any)?.logoUrl || 
    (activeChurch as any)?.profilePhoto || 
    null;

  const showChurchToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastConfig({ visible: true, message });

    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastConfig(prev => ({ ...prev, visible: false }));
      });
    }, 3200);
  };

  // Scanner laser line animation
  useEffect(() => {
    if (showLiveScanner) {
      setHasScanned(false);
      setIsTorchOn(false);
      scanAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [showLiveScanner]);

  // Warm up device GPS location when scanner is opened
  useEffect(() => {
    if (showLiveScanner) {
      LocationService.getCurrentLocation()
        .then(res => {
          if (res.success && res.coords) {
            setUserLocation({ coords: res.coords, timestamp: Date.now() });
          }
        })
        .catch(() => {});
    }
  }, [showLiveScanner]);

  // Load all data
  useEffect(() => {
    loadScreenData();
  }, [churchId, memberId]);

  const loadScreenData = async () => {
    setLoading(true);
    try {
      // Parallel fetch of events and member attendance
      await Promise.all([
        fetchChurchEvents(),
        fetchMemberAttendance()
      ]);
    } catch (err) {
      console.error('[AttendanceScreen] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Fetch user photos in background without blocking screen render
      fetchUserPhotos().catch(() => {});
    }
  };

  const fetchUserPhotos = async (): Promise<Record<string, string>> => {
    try {
      const snap = await firestore().collection('users').limit(200).get();
      const photos: Record<string, string> = {};
      snap.forEach(doc => {
        const data = doc.data();
        const photo = data.photoURL || data.photoUrl || data.profilePhoto || data.profileImageUrl || data.avatarUrl || data.photo || data.picture;
        if (photo && typeof photo === 'string' && photo.trim() !== '') {
          const ph = data.phone || data.MobilePhone || data.phoneNumber || data.mobile;
          if (ph) {
            const cleanPhone = String(ph).replace(/\D/g, '').slice(-10);
            if (cleanPhone) photos[cleanPhone] = photo;
          }
          if (data.sfContactId) photos[data.sfContactId] = photo;
          if (data.contactId) photos[data.contactId] = photo;
          if (data.memberId) photos[data.memberId] = photo;
          photos[doc.id] = photo;
        }
      });
      setUserPhotos(photos);
      return photos;
    } catch (error) {
      return {};
    }
  };

  const fetchMemberAttendance = async () => {
    if (!churchId || !memberId) return;
    try {
      const records = await AttendanceService.getMemberAttendanceHistory(churchId, memberId);
      const cleanRecords = (records || []).filter(r => 
        (r.memberId === memberId || (user?.uid && r.memberId === user.uid)) &&
        r.status !== 'Absent'
      );

      // Also check recent attendanceRequests responses for this member
      try {
        const reqSnap = await firestore()
          .collection('churches')
          .doc(churchId)
          .collection('attendanceRequests')
          .limit(10)
          .get();

        for (const reqDoc of reqSnap.docs) {
          const respDoc = await firestore()
            .collection('churches')
            .doc(churchId)
            .collection('attendanceRequests')
            .doc(reqDoc.id)
            .collection('responses')
            .doc(memberId)
            .get()
            .catch(() => null);

          const isDocExisting = respDoc && (typeof (respDoc as any).exists === 'function' ? (respDoc as any).exists() : Boolean((respDoc as any).exists));
          if (isDocExisting && respDoc) {
            const respData = respDoc.data();
            if (respData?.status === 'Present' || respData?.response === 'Yes') {
              if (!cleanRecords.some(r => r.eventId === reqDoc.id)) {
                cleanRecords.push({
                  id: respDoc.id,
                  eventId: reqDoc.id,
                  eventName: respData.eventName || reqDoc.data()?.title || 'Church Service',
                  memberId,
                  memberName: respData.memberName || memberName,
                  status: 'Present',
                  timestamp: respData.respondedAt || respData.submittedAt || new Date(),
                  churchId,
                } as AttendanceRecord);
              }
            }
          }
        }
      } catch (e) {}

      setAttendanceRecords(cleanRecords);
    } catch (e) {
      console.error('[AttendanceScreen] Error fetching attendance history:', e);
    }
  };

  // Robust Date & Time Parser for events
  const parseEventDateTime = (ev: any): Date | null => {
    if (!ev) return null;
    const rawDate = ev.date ?? ev.eventDate ?? ev.startDate ?? ev.dateTime ?? ev.createdAt;
    if (!rawDate) return null;

    let parsedDate: Date | null = null;

    if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
      parsedDate = rawDate.toDate();
    } else if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
      parsedDate = new Date(rawDate.seconds * 1000);
    } else if (rawDate instanceof Date) {
      parsedDate = new Date(rawDate.getTime());
    } else if (typeof rawDate === 'number') {
      parsedDate = new Date(rawDate);
    } else if (typeof rawDate === 'string') {
      const trimmed = rawDate.trim();
      if (trimmed.includes('T')) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) parsedDate = d;
      }
      if (!parsedDate && (trimmed.includes('-') || trimmed.includes('/'))) {
        const delim = trimmed.includes('-') ? '-' : '/';
        const parts = trimmed.split(delim);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) parsedDate = new Date(y, m, d);
          } else if (parts[2].length === 4) {
            // DD-MM-YYYY or MM-DD-YYYY
            const y = parseInt(parts[2], 10);
            const p0 = parseInt(parts[0], 10);
            const p1 = parseInt(parts[1], 10);
            let d = p0;
            let m = p1 - 1;
            if (p1 > 12 && p0 <= 12) {
              m = p0 - 1;
              d = p1;
            }
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) parsedDate = new Date(y, m, d);
          }
        }
      }
      if (!parsedDate) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) parsedDate = d;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) return null;

    // Apply time if present
    const rawTime = ev.startTime || ev.time;
    if (rawTime) {
      if (typeof rawTime === 'string') {
        const cleanTime = rawTime.trim();
        if (cleanTime.includes('T')) {
          const t = new Date(cleanTime);
          if (!isNaN(t.getTime())) parsedDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
        } else if (cleanTime.includes(':')) {
          const isPM = /PM/i.test(cleanTime);
          const isAM = /AM/i.test(cleanTime);
          const parts = cleanTime.replace(/AM|PM/gi, '').trim().split(':');
          let h = parseInt(parts[0], 10);
          const min = parseInt(parts[1], 10) || 0;
          if (!isNaN(h)) {
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;
            parsedDate.setHours(h, min, 0, 0);
          }
        }
      } else if (typeof rawTime === 'object' && typeof rawTime.toDate === 'function') {
        const t = rawTime.toDate();
        parsedDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
      }
    }

    return parsedDate;
  };

  const formatSimpleTime = (d: any): string => {
    if (!d) return '';

    // Handle Firestore Timestamp
    if (d?.toDate && typeof d.toDate === 'function') {
      d = d.toDate();
    } else if (typeof d === 'object' && typeof d.seconds === 'number') {
      d = new Date(d.seconds * 1000);
    }

    if (d instanceof Date && !isNaN(d.getTime())) {
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    if (typeof d === 'string') {
      const trimmed = d.trim();
      if (!trimmed) return '';

      // Already formatted like "7:30 PM"
      if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
        return trimmed.toUpperCase();
      }
      if (/AM|PM/i.test(trimmed)) return trimmed;

      // Handle raw times like "19:30:00.000Z", "18:00:00", "19:30Z", "09:30"
      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2];
        if (!isNaN(h)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h}:${m} ${ampm}`;
        }
      }

      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        let h = parsed.getHours();
        const m = parsed.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
      }

      return trimmed;
    }

    return '';
  };

  const formatEventTimeString = (timeRaw?: string, startTime?: any, endTime?: any): string => {
    const sFormatted = formatSimpleTime(startTime);
    const eFormatted = formatSimpleTime(endTime);
    if (sFormatted && eFormatted && !sFormatted.includes('NaN') && !eFormatted.includes('NaN')) {
      return `${sFormatted} to ${eFormatted}`;
    }
    if (sFormatted && !sFormatted.includes('NaN')) {
      return sFormatted;
    }

    if (timeRaw && typeof timeRaw === 'string') {
      const trimmed = timeRaw.trim();
      if (trimmed.includes('to')) {
        const [p1, p2] = trimmed.split('to');
        const f1 = formatSimpleTime(p1.trim());
        const f2 = formatSimpleTime(p2.trim());
        if (f1 && f2 && !f1.includes('NaN') && !f2.includes('NaN')) return `${f1} to ${f2}`;
        if (f1 && !f1.includes('NaN')) return f1;
      }
      if (trimmed.includes(' - ')) {
        const [p1, p2] = trimmed.split(' - ');
        const f1 = formatSimpleTime(p1.trim());
        const f2 = formatSimpleTime(p2.trim());
        if (f1 && f2 && !f1.includes('NaN') && !f2.includes('NaN')) return `${f1} to ${f2}`;
        if (f1 && !f1.includes('NaN')) return f1;
      }
      const formatted = formatSimpleTime(trimmed);
      if (formatted && !formatted.includes('NaN')) return formatted;
      return trimmed;
    }

    return 'Scheduled Service';
  };

  const fetchChurchEvents = async () => {
    try {
      const items: EventItem[] = [];

      // 1. Fetch church events & attendance requests concurrently for fast loading
      const [eventsSnap, fsEvents, attRequestsSnap] = await Promise.all([
        churchId 
          ? firestore().collection('churches').doc(churchId).collection('events').get().catch(() => ({ docs: [] }))
          : Promise.resolve({ docs: [] }),
        FirestoreService.getEvents().catch(() => []),
        churchId
          ? firestore().collection('churches').doc(churchId).collection('attendanceRequests').get().catch(() => ({ docs: [] }))
          : Promise.resolve({ docs: [] })
      ]);

      const rawEvents: any[] = [];
      if (eventsSnap && 'docs' in eventsSnap) {
        eventsSnap.docs.forEach((doc: any) => rawEvents.push({ id: doc.id, ...doc.data() }));
      }
      (fsEvents || []).forEach(fe => {
        if (!rawEvents.some(r => r.id === fe.id)) {
          rawEvents.push(fe);
        }
      });

      // Include Attendance Requests so any attendance request created in Admin Dashboard
      // is immediately visible as an event for members to scan and mark attendance!
      if (attRequestsSnap && 'docs' in attRequestsSnap) {
        attRequestsSnap.docs.forEach((doc: any) => {
          const reqData = doc.data();
          const existing = rawEvents.find(r => 
            r.id === doc.id || 
            ((r.title || r.name)?.trim().toLowerCase() === (reqData.title)?.trim().toLowerCase() && r.date === reqData.date)
          );
          if (existing) {
            existing.attendanceRequestId = doc.id;
          } else {
            rawEvents.push({
              id: doc.id,
              isAttendanceRequest: true,
              ...reqData,
              location: reqData.location || (activeChurch as any)?.address || churchName,
            });
          }
        });
      }

      // 2. Process events
      (rawEvents || []).forEach(ev => {
        const dateObj = parseEventDateTime(ev);
        if (!dateObj) return;

        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = formatEventTimeString(ev.time, ev.startTime, ev.endTime);

        items.push({
          id: ev.id,
          title: ev.title || ev.name || 'Church Service',
          dateStr,
          timeStr,
          dateObj,
          location: (ev as any).venueEn || ev.location || (activeChurch as any)?.address || churchName,
          status: 'Open',
          presentCount: ev.presentCount || ev.attendeeCount || 0,
        });
      });

      // Sort by date ascending
      items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      // Set events immediately so UI displays without delay!
      setAllEvents(items);

      // Fast background live count fetch for today's active events (never blocks UI)
      const now = new Date();
      const todayY = now.getFullYear();
      const todayM = now.getMonth();
      const todayD = now.getDate();
      const todayItems = items.filter(i => {
        return (
          i.dateObj.getFullYear() === todayY &&
          i.dateObj.getMonth() === todayM &&
          i.dateObj.getDate() === todayD
        );
      });

      if (churchId && todayItems.length > 0) {
        Promise.all(
          todayItems.map(async (item) => {
            try {
              const [snap, respSnap] = await Promise.all([
                firestore()
                  .collection('churches')
                  .doc(churchId)
                  .collection('events')
                  .doc(item.id)
                  .collection('attendees')
                  .get()
                  .catch(() => ({ size: 0 })),
                firestore()
                  .collection('churches')
                  .doc(churchId)
                  .collection('attendanceRequests')
                  .doc(item.id)
                  .collection('responses')
                  .where('status', '==', 'Present')
                  .get()
                  .catch(() => ({ size: 0 }))
              ]);
              return { id: item.id, count: Math.max(snap.size, respSnap.size) };
            } catch (e) {
              return null;
            }
          })
        ).then(counts => {
          const countMap = new Map<string, number>();
          counts.forEach(c => {
            if (c) countMap.set(c.id, c.count);
          });
          if (countMap.size > 0) {
            setAllEvents(prev =>
              prev.map(ev => {
                if (countMap.has(ev.id)) {
                  return { ...ev, presentCount: countMap.get(ev.id)! };
                }
                return ev;
              })
            );
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.error('[AttendanceScreen] Error fetching church events:', e);
    }
  };

  // Check if member has been SCANNED and marked Present for a specific event
  const isEventAttendanceMarked = (event: EventItem) => {
    if (!event || !event.id) return false;

    // 1. Instant check — marked after a scan in the current session
    if (markedEventIds.has(event.id)) return true;

    // 2. Strict check: MUST match a verified record for THIS member and THIS exact eventId
    return attendanceRecords.some(r => {
      // Must be present
      if (r.status === 'Absent') return false;

      // Must belong to this member
      if (r.memberId && r.memberId !== memberId && r.memberId !== user?.uid) return false;

      // Check specific eventId strictly: MUST match this event's unique ID
      return Boolean(r.eventId && r.eventId === event.id);
    });
  };

  // Associate member check-ins with events
  const enrichedEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return allEvents.map(ev => {
      const isMarked = isEventAttendanceMarked(ev);

      let myStatus: 'Present' | 'Absent' | 'Upcoming' = 'Upcoming';
      if (isMarked) {
        myStatus = 'Present';
      } else if (ev.dateObj < startOfToday) {
        myStatus = 'Absent';
      }

      const matchedRecord = attendanceRecords.find(r => {
        if (r.status === 'Absent') return false;
        if (r.memberId && r.memberId !== memberId && r.memberId !== user?.uid) return false;
        return r.eventId && ev.id && r.eventId === ev.id;
      });

      return {
        ...ev,
        myStatus,
        myTimestamp: matchedRecord?.timestamp || matchedRecord?.scannedAt,
      };
    });
  }, [allEvents, attendanceRecords, markedEventIds]);

  // Today's events: ONLY events happening today, sorted with PENDING events FIRST!
  const todayEvents = useMemo(() => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const list = enrichedEvents.filter(e => {
      if (!e.dateObj) return false;
      return e.dateObj.getFullYear() === todayY &&
        e.dateObj.getMonth() === todayM &&
        e.dateObj.getDate() === todayD;
    });

    // Sort: Pending events FIRST so member sees the pending event right away in the carousel!
    return list.sort((a, b) => {
      const aMarked = isEventAttendanceMarked(a);
      const bMarked = isEventAttendanceMarked(b);
      if (aMarked !== bMarked) {
        return aMarked ? 1 : -1; // pending first
      }
      return a.dateObj.getTime() - b.dateObj.getTime();
    });
  }, [enrichedEvents, attendanceRecords]);

  // Count of today's events that are still pending
  const pendingEventsCount = useMemo(() => {
    return todayEvents.filter(e => !isEventAttendanceMarked(e)).length;
  }, [todayEvents, attendanceRecords]);

  // Next upcoming event for preview if no events today
  const nextUpcomingEvent = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return allEvents
      .filter(e => e.dateObj >= startOfToday && !(
        e.dateObj.getFullYear() === now.getFullYear() &&
        e.dateObj.getMonth() === now.getMonth() &&
        e.dateObj.getDate() === now.getDate()
      ))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0] || null;
  }, [allEvents]);

  const activeEvent = todayEvents[0] || nextUpcomingEvent || {
    id: 'general_service',
    title: 'Church Service',
    dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timeStr: 'General Service',
    dateObj: new Date(),
    location: '',
    status: 'Open' as const,
    presentCount: 0,
    myStatus: 'Upcoming' as const,
  };

  // Carousel state
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    if (activeCarouselIndex >= todayEvents.length && todayEvents.length > 0) {
      setActiveCarouselIndex(0);
    }
  }, [todayEvents.length]);

  // Auto carousel: automatically advances cards every 3.5s when multiple events exist
  useEffect(() => {
    if (todayEvents.length <= 1) return;

    const autoTimer = setInterval(() => {
      setActiveCarouselIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % todayEvents.length;
        carouselRef.current?.scrollToOffset({
          offset: nextIndex * (width - 40 + 12),
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(autoTimer);
  }, [todayEvents.length]);

  const handlePrevCarousel = () => {
    if (todayEvents.length <= 1) return;
    const prevIndex = (activeCarouselIndex - 1 + todayEvents.length) % todayEvents.length;
    setActiveCarouselIndex(prevIndex);
    carouselRef.current?.scrollToOffset({
      offset: prevIndex * (width - 40 + 12),
      animated: true,
    });
  };

  const handleNextCarousel = () => {
    if (todayEvents.length <= 1) return;
    const nextIndex = (activeCarouselIndex + 1) % todayEvents.length;
    setActiveCarouselIndex(nextIndex);
    carouselRef.current?.scrollToOffset({
      offset: nextIndex * (width - 40 + 12),
      animated: true,
    });
  };

  // Attendance Statistics for Current Month ("Your Monthly Progress" on Home Tab)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // All events in current calendar month
    const monthEvents = enrichedEvents.filter(e => {
      return e.dateObj.getFullYear() === currentYear && e.dateObj.getMonth() === currentMonth;
    });

    const attendedCount = monthEvents.filter(e => e.myStatus === 'Present').length;
    const totalEventsCount = Math.max(monthEvents.length, attendedCount);
    const percentage = totalEventsCount > 0 ? Math.min(100, Math.round((attendedCount / totalEventsCount) * 100)) : 0;

    return {
      totalAttended: attendedCount,
      totalEvents: totalEventsCount,
      percentage,
    };
  }, [enrichedEvents]);

  // "This Week" list for Home tab
  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Sunday

    return enrichedEvents
      .filter(e => e.dateObj >= startOfWeek && e.dateObj < endOfWeek)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [enrichedEvents]);

  // "My Attendance" tab data dynamically filtered by period (This month | 3 months | This year)
  const periodData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (periodFilter === 'This month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (periodFilter === '3 months') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 'This year'
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    }

    const list = enrichedEvents
      .filter(e => {
        const t = e.dateObj.getTime();
        return t >= startDate.getTime() && t <= endDate.getTime();
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    const totalAttended = list.filter(e => e.myStatus === 'Present').length;
    const totalEvents = Math.max(list.length, totalAttended);
    const percentage = totalEvents > 0 ? Math.min(100, Math.round((totalAttended / totalEvents) * 100)) : 0;

    return {
      list,
      totalAttended,
      totalEvents,
      percentage,
    };
  }, [enrichedEvents, periodFilter]);

  // "Events" tab list (filtered by Upcoming or Past - keeps all events scheduled for today visible in Upcoming)
  const filteredEventsList = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (timelineFilter === 'Upcoming') {
      return allEvents
        .filter(e => e.dateObj >= startOfToday)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    } else {
      return allEvents
        .filter(e => e.dateObj < startOfToday)
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    }
  }, [allEvents, timelineFilter]);

  // Greeting (e.g. "Good afternoon")
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Format Helper: "Tuesday, Sep 22, 6:00 PM"
  const formatFullDate = (d: Date) => {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${weekday}, ${month} ${day}, ${time}`;
  };

  // Format Helper: "Sun, Sep 20, 10:30 AM"
  const formatShortDateTime = (d: Date) => {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${weekday}, ${month} ${day}, ${time}`;
  };

  // Format Helper: "Starts in 2h 42m"
  const getStartsInText = (d: Date) => {
    const diffMs = d.getTime() - Date.now();
    if (diffMs <= 0) return 'In progress';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Starts in ${hours}h ${minutes}m`;
  };

  // ─── Open Attendees Modal for an Event ("View list") ────────────────────────
  const handleOpenAttendeesList = async (event: EventItem) => {
    setSelectedEventForList(event);
    setShowAttendeesModal(true);
    setAttendeesLoading(true);
    setAttendeesFilter('All');
    setAttendeesSearch('');

    try {
      const [attendees, churchMembers] = await Promise.all([
        AttendanceService.getEventAttendees(churchId, event.id),
        AttendanceService.getChurchMembers(churchId)
      ]);

      const attendedMap = new Map<string, any>();
      attendees.forEach(a => {
        const id = a.memberId || a.id;
        if (id) attendedMap.set(id, a.timestamp);
      });

      const unified: UnifiedMember[] = [];
      churchMembers.forEach((m: any) => {
        const mId = m.id || m.Id;
        if (mId) {
          const isMe = mId === memberId || (user?.uid && mId === user.uid);
          const phoneToUse = m.MobilePhone || m.phone || m.phoneNumber || (isMe ? (user?.phoneNumber || member?.phone) : '');
          const cleanPhone = phoneToUse ? String(phoneToUse).replace(/\D/g, '').slice(-10) : '';

          const possiblePhotos = [
            m.profilePhoto,
            m.photoURL,
            m.photoUrl,
            m.profileImageUrl,
            m.PhotoUrl,
            m.profilePicture,
            m.avatarUrl,
            m.photo,
            cleanPhone ? userPhotos[cleanPhone] : null,
            userPhotos[mId],
            m.sfContactId ? userPhotos[m.sfContactId] : null,
            isMe ? (user?.photoURL || (member as any)?.photoURL || (member as any)?.photoUrl || (member as any)?.profilePhoto) : null
          ];

          const resolvedPhoto = possiblePhotos.find(
            p => typeof p === 'string' && p.trim() !== '' && p !== 'null' && p !== 'undefined'
          );

          const rawName = (m.name || m.Name || `${m.firstName || m.FirstName || ''} ${m.lastName || m.LastName || ''}`).trim();
          const cleanName = rawName.replace(/\s+/g, ' ') || 'Member';

          unified.push({
            id: mId,
            name: cleanName,
            status: attendedMap.has(mId) ? 'Present' : 'Absent',
            timestamp: attendedMap.get(mId),
            profilePicture: resolvedPhoto,
            firstName: m.firstName || m.FirstName,
            lastName: m.lastName || m.LastName,
          });
        }
      });

      // Add attendees not in roster (including guests and visitors)
      attendees.forEach(a => {
        const mId = a.memberId || a.id;
        if (mId && !unified.some(u => u.id === mId)) {
          const isMe = mId === memberId || (user?.uid && mId === user.uid);
          const isGuest = Boolean(
            (a as any).isGuest || 
            mId.startsWith('guest_') || 
            (a.memberName && a.memberName.includes('(Guest)'))
          );
          const phoneToUse = a.memberPhone || (isMe ? (user?.phoneNumber || member?.phone) : '');
          const cleanPhone = phoneToUse ? String(phoneToUse).replace(/\D/g, '').slice(-10) : '';

          const possiblePhotos = [
            a.photoUrl,
            (a as any).photoURL,
            (a as any).profilePicture,
            cleanPhone ? userPhotos[cleanPhone] : null,
            userPhotos[mId],
            isMe ? (user?.photoURL || (member as any)?.photoURL || (member as any)?.photoUrl) : null
          ];

          const resolvedPhoto = possiblePhotos.find(
            p => typeof p === 'string' && p.trim() !== '' && p !== 'null' && p !== 'undefined'
          );

          const rawName = (a.memberName || 'Member').trim();
          const cleanName = rawName.replace(/\s+/g, ' ') || 'Member';

          unified.push({
            id: mId,
            name: cleanName,
            status: 'Present',
            timestamp: a.timestamp,
            profilePicture: isGuest ? undefined : resolvedPhoto,
            isGuest,
            guestOf: (a as any).invitedByMemberName,
          });
        }
      });

      // Sort: Present first (time desc), then Absent (name asc)
      unified.sort((a, b) => {
        if (a.status === 'Present' && b.status === 'Present') {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        }
        if (a.status === 'Present') return -1;
        if (b.status === 'Present') return 1;
        return a.name.localeCompare(b.name);
      });

      setAttendeesList(unified);
    } catch (e) {
      console.error('[AttendanceScreen] Error fetching event attendees:', e);
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Filtered Attendees list inside "View list" modal
  const filteredAttendees = useMemo(() => {
    let list = attendeesList;
    if (attendeesFilter === 'Present') list = list.filter(m => m.status === 'Present');
    if (attendeesFilter === 'Absent') list = list.filter(m => m.status === 'Absent');
    if (attendeesSearch.trim().length > 0) {
      const q = attendeesSearch.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [attendeesList, attendeesFilter, attendeesSearch]);

  const presentCountInModal = attendeesList.filter(m => m.status === 'Present').length;
  const absentCountInModal = attendeesList.filter(m => m.status === 'Absent').length;

  // ─── Real-time Live Camera QR Detector ─────────────────────────────────────
  const handleQrDetected = (result: BarcodeScanningResult) => {
    if (hasScanned || isDecoding || showInvalidQrModal) return;
    const data = result?.data;
    if (!data) return;

    const expectedId = selectedEventForScan?.id;
    const expectedTitle = selectedEventForScan?.title;

    // Validate QR payload strictly: correct church AND specific event
    const parsed = AttendanceService.parseAttendanceQRPayload(
      data, 
      churchId, 
      churchName, 
      churchCode,
      expectedId,
      expectedTitle
    );

    if (!parsed.valid || !parsed.payload) {
      try {
        Vibration.vibrate(400);
      } catch {}
      setInvalidQrMessage(
        parsed.error || `Please scan the official ${churchName || 'Church of God'} attendance QR code.`
      );
      setShowInvalidQrModal(true);
      return;
    }

    const payload = parsed.payload;

    // Verify event exists in church schedule if no specific event was pre-selected
    if (!expectedId && payload.eventId && payload.eventId !== 'general_service') {
      const existsInChurch = allEvents.some(e => e.id === payload.eventId) || todayEvents.some(e => e.id === payload.eventId);
      if (!existsInChurch && allEvents.length > 0) {
        try {
          Vibration.vibrate(400);
        } catch {}
        setInvalidQrMessage(
          `This event ("${payload.eventName || payload.eventId}") does not exist in your church's event list.`
        );
        setShowInvalidQrModal(true);
        return;
      }
    }

    // Only set hasScanned to true once the QR is confirmed valid!
    setHasScanned(true);

    // Immediately close scanner and record attendance without any delay
    setShowLiveScanner(false);
    handleBarcodeScanned({ data, preParsed: payload });
  };

  // ─── Fetch Family / Household Members for Scanned Member ─────────────────
  const fetchFamilyMembersForScannedMember = async (
    targetChurchId: string,
    targetEventId: string,
    scannedMId: string,
    scannedAccId?: string
  ): Promise<FamilyMemberItem[]> => {
    try {
      if (!targetChurchId || !scannedMId) return [];

      let householdId = scannedAccId;
      if (!householdId) {
        try {
          const memDoc = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection('members')
            .doc(scannedMId)
            .get();
          if (memDoc && (memDoc.data() !== undefined || (typeof (memDoc as any).exists === 'function' ? (memDoc as any).exists() : (memDoc as any).exists === true))) {
            householdId = memDoc.data()?.accountId || scannedMId;
          } else {
            householdId = scannedMId;
          }
        } catch {
          householdId = scannedMId;
        }
      }

      const rawContacts: any[] = [];

      // 1. Query by household accountId
      if (householdId) {
        const snap1 = await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('members')
          .where('accountId', '==', householdId)
          .get()
          .catch(() => null);
        if (snap1 && !snap1.empty) {
          snap1.forEach(d => rawContacts.push({ id: d.id, ...d.data() }));
        }
      }

      // 2. Query where accountId is the scanned member's ID if different
      if (scannedMId && scannedMId !== householdId) {
        const snap2 = await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('members')
          .where('accountId', '==', scannedMId)
          .get()
          .catch(() => null);
        if (snap2 && !snap2.empty) {
          snap2.forEach(d => {
            if (!rawContacts.some(c => c.id === d.id)) {
              rawContacts.push({ id: d.id, ...d.data() });
            }
          });
        }
      }

      // Filter out the scanned member themselves
      const familyOnly = rawContacts.filter(c => c.id !== scannedMId && (c as any).Id !== scannedMId);

      // Check current attendance status for each family member under targetEventId
      const familyWithStatus: FamilyMemberItem[] = await Promise.all(
        familyOnly.map(async (f) => {
          const fId = f.id || (f as any).Id;
          const fName = f.name || (f as any).Name || `${f.firstName || (f as any).FirstName || ''} ${f.lastName || (f as any).LastName || ''}`.trim() || 'Family Member';
          const fPhone = f.phone || (f as any).MobilePhone || '';
          const fRelation = f.relation || f.relationship || (f as any).User_Type__c || 'Family Member';

          let isMarked = false;
          if (targetEventId && targetEventId !== 'general_service') {
            try {
              const attDoc = await firestore()
                .collection('churches')
                .doc(targetChurchId)
                .collection('events')
                .doc(targetEventId)
                .collection('attendees')
                .doc(fId)
                .get();
              if (attDoc && (attDoc.data() !== undefined || (typeof (attDoc as any).exists === 'function' ? (attDoc as any).exists() : (attDoc as any).exists === true))) {
                if (attDoc.data()?.status !== 'Absent') {
                  isMarked = true;
                }
              }
            } catch {}
          }

          if (!isMarked) {
            const rec = attendanceRecords.find(r => r.memberId === fId && r.eventId === targetEventId && r.status !== 'Absent');
            if (rec) isMarked = true;
          }

          return {
            id: fId,
            name: fName,
            phone: fPhone,
            relation: fRelation,
            checked: isMarked,
            alreadyMarked: isMarked,
            loading: false,
          };
        })
      );

      return familyWithStatus;
    } catch (e) {
      console.error('[AttendanceScreen] Error fetching family members:', e);
      return [];
    }
  };

  // ─── Toggle Family Member Attendance (Checkbox handler) ───────────────────
  const handleToggleFamilyAttendance = async (famId: string) => {
    const fam = scanResultModal.familyMembers.find(f => f.id === famId);
    if (!fam || fam.loading) return;

    const willCheck = !fam.checked;
    const targetChurchId = churchId || activeChurch?.id || '';
    const targetEventId = scanResultModal.eventId || activeEvent?.id || todayEvents[0]?.id || 'general_service';
    const targetEventName = scanResultModal.eventName || 'Church Service';

    // Optimistically update checkbox state in modal
    setScanResultModal(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(f =>
        f.id === famId ? { ...f, checked: willCheck, loading: true } : f
      ),
    }));

    // Optimistically update total present count across events
    setAllEvents(prev =>
      prev.map(ev => {
        if (ev.id === targetEventId) {
          const curr = ev.presentCount || 0;
          return {
            ...ev,
            presentCount: willCheck ? curr + 1 : Math.max(0, curr - 1),
          };
        }
        return ev;
      })
    );

    // Optimistically update attendanceRecords list
    if (willCheck) {
      setAttendanceRecords(prev => [
        {
          id: `rec_fam_${famId}_${Date.now()}`,
          memberId: famId,
          memberName: fam.name,
          churchId: targetChurchId,
          eventId: targetEventId,
          eventName: targetEventName,
          status: 'Present',
          timestamp: new Date(),
          method: 'QR_SCAN',
        },
        ...prev,
      ]);
    } else {
      setAttendanceRecords(prev =>
        prev.filter(r => !(r.memberId === famId && (r.eventId === targetEventId || !r.eventId)))
      );
    }

    try {
      if (willCheck) {
        // Record presence in Firestore
        await AttendanceService.recordAttendance({
          churchId: targetChurchId,
          eventId: targetEventId,
          eventName: targetEventName,
          memberId: famId,
          memberName: fam.name,
          memberPhone: fam.phone,
          method: 'QR_SCAN',
        });
      } else {
        // Unmark presence in Firestore
        if (targetChurchId && targetEventId) {
          await Promise.allSettled([
            firestore()
              .collection('churches')
              .doc(targetChurchId)
              .collection('events')
              .doc(targetEventId)
              .collection('attendees')
              .doc(famId)
              .delete(),
            firestore()
              .collection('churches')
              .doc(targetChurchId)
              .collection('attendanceRequests')
              .doc(targetEventId)
              .collection('responses')
              .doc(famId)
              .delete(),
          ]);
        }
      }
    } catch (err) {
      console.warn('[AttendanceScreen] Error toggling family attendance:', err);
      // Revert state on error
      setScanResultModal(prev => ({
        ...prev,
        familyMembers: prev.familyMembers.map(f =>
          f.id === famId ? { ...f, checked: !willCheck, loading: false } : f
        ),
      }));
      setAllEvents(prev =>
        prev.map(ev => {
          if (ev.id === targetEventId) {
            const curr = ev.presentCount || 0;
            return {
              ...ev,
              presentCount: willCheck ? Math.max(0, curr - 1) : curr + 1,
            };
          }
          return ev;
        })
      );
      return;
    }

    // Stop loading indicator on success
    setScanResultModal(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(f =>
        f.id === famId ? { ...f, loading: false } : f
      ),
    }));
  };

  // ─── Fetch Guests & Visitors for an Event ─────────────────────────────────
  const fetchGuestsForEvent = async (
    targetChurchId: string,
    targetEventId: string,
    hostMemberId: string
  ): Promise<GuestItem[]> => {
    try {
      if (!targetChurchId || !targetEventId) return [];
      const snap = await firestore()
        .collection('churches')
        .doc(targetChurchId)
        .collection('events')
        .doc(targetEventId)
        .collection('attendees')
        .get();

      const guests: GuestItem[] = [];
      snap.forEach(d => {
        const data = d.data();
        const isGuest = Boolean(data.isGuest || d.id.startsWith('guest_') || (data.memberName && data.memberName.includes('(Guest)')));
        const isMyGuest = data.invitedByMemberId === hostMemberId || !data.invitedByMemberId;
        if (isGuest && (isMyGuest || !hostMemberId)) {
          guests.push({
            id: d.id,
            name: data.guestName || (data.memberName ? data.memberName.replace(' (Guest)', '').trim() : 'Guest'),
            invitedByName: data.invitedByMemberName || memberName,
          });
        }
      });
      return guests;
    } catch (e) {
      console.warn('[AttendanceScreen] Error fetching guests:', e);
      return [];
    }
  };

  // ─── Add Guest Check-in Handler ───────────────────────────────────────────
  const handleAddGuest = async (customGuestName?: string, overrideEventId?: string, overrideEventName?: string) => {
    const rawName = (customGuestName || guestNameInput).trim();
    if (!rawName) {
      Alert.alert('Guest Name Required', 'Please enter your guest\'s full name.');
      return;
    }

    const targetChurchId = churchId || activeChurch?.id || '';
    const targetEventId = overrideEventId || scanResultModal.eventId || selectedEventForList?.id || activeEvent?.id || todayEvents[0]?.id || 'general_service';
    const targetEventName = overrideEventName || scanResultModal.eventName || selectedEventForList?.title || 'Church Service';
    const hostMemberId = memberId || user?.uid || 'guest_host';
    const hostMemberName = memberName || 'Member';

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const guestDisplayName = `${rawName} (Guest)`;

    setIsAddingGuest(true);
    setGuestNameInput('');
    setRosterGuestNameInput('');
    setShowRosterGuestInput(false);

    // 1. Optimistically update modal guest list
    setScanResultModal(prev => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          id: guestId,
          name: rawName,
          invitedByName: hostMemberName,
        }
      ]
    }));

    // 2. Optimistically update total present count across events
    setAllEvents(prev =>
      prev.map(ev => {
        if (ev.id === targetEventId) {
          const curr = ev.presentCount || 0;
          return {
            ...ev,
            presentCount: curr + 1,
          };
        }
        return ev;
      })
    );

    // 3. Optimistically add to attendanceRecords
    setAttendanceRecords(prev => [
      {
        id: guestId,
        memberId: guestId,
        memberName: guestDisplayName,
        churchId: targetChurchId,
        eventId: targetEventId,
        eventName: targetEventName,
        status: 'Present',
        timestamp: new Date(),
        method: 'GUEST_CHECKIN',
        isGuest: true,
        guestName: rawName,
        invitedByMemberId: hostMemberId,
        invitedByMemberName: hostMemberName,
      },
      ...prev,
    ]);

    // 4. Optimistically add to attendeesList if attendees modal is open
    setAttendeesList(prev => [
      {
        id: guestId,
        name: guestDisplayName,
        status: 'Present',
        timestamp: new Date(),
        isGuest: true,
        guestOf: hostMemberName,
      },
      ...prev,
    ]);

    try {
      await AttendanceService.recordAttendance({
        churchId: targetChurchId,
        eventId: targetEventId,
        eventName: targetEventName,
        memberId: guestId,
        memberName: guestDisplayName,
        method: 'GUEST_CHECKIN',
        isGuest: true,
        guestName: rawName,
        invitedByMemberId: hostMemberId,
        invitedByMemberName: hostMemberName,
      });

      showChurchToast(`Guest "${rawName}" added to attendance!`);
    } catch (err) {
      console.warn('[AttendanceScreen] Error recording guest attendance:', err);
      // Revert optimistic updates
      setScanResultModal(prev => ({
        ...prev,
        guests: prev.guests.filter(g => g.id !== guestId)
      }));
      setAllEvents(prev =>
        prev.map(ev => {
          if (ev.id === targetEventId) {
            const curr = ev.presentCount || 0;
            return {
              ...ev,
              presentCount: Math.max(0, curr - 1),
            };
          }
          return ev;
        })
      );
      setAttendeesList(prev => prev.filter(a => a.id !== guestId));
      Alert.alert('Error', 'Unable to add guest. Please try again.');
    } finally {
      setIsAddingGuest(false);
    }
  };

  // ─── Remove Guest Handler ─────────────────────────────────────────────────
  const handleRemoveGuest = async (guestId: string, guestName: string) => {
    const targetChurchId = churchId || activeChurch?.id || '';
    const targetEventId = scanResultModal.eventId || selectedEventForList?.id || activeEvent?.id || todayEvents[0]?.id || 'general_service';

    // Optimistically update
    setScanResultModal(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== guestId)
    }));
    setAllEvents(prev =>
      prev.map(ev => {
        if (ev.id === targetEventId) {
          const curr = ev.presentCount || 0;
          return {
            ...ev,
            presentCount: Math.max(0, curr - 1),
          };
        }
        return ev;
      })
    );
    setAttendeesList(prev => prev.filter(a => a.id !== guestId));
    setAttendanceRecords(prev => prev.filter(r => r.id !== guestId && r.memberId !== guestId));

    try {
      await AttendanceService.removeAttendee({
        churchId: targetChurchId,
        eventId: targetEventId,
        memberId: guestId,
      });
      showChurchToast(`Guest "${guestName}" removed`);
    } catch (err) {
      console.warn('[AttendanceScreen] Error removing guest:', err);
    }
  };

  // ─── Open Guest & Household Manager for Any Event ────────────────────────
  const handleOpenGuestModalForEvent = async (eventItem: EventItem) => {
    const targetChurchId = churchId || activeChurch?.id || '';
    const targetEventId = eventItem.id;
    const formattedDate = eventItem.dateStr || formatFullDate(eventItem.dateObj);
    const formattedTime = eventItem.timeStr || formatShortDateTime(eventItem.dateObj);

    setScanResultModal({
      visible: true,
      churchName: churchName,
      eventName: eventItem.title,
      eventId: targetEventId,
      date: formattedDate,
      time: formattedTime,
      alreadyMarked: true,
      scannedMemberId: memberId,
      scannedMemberName: memberName,
      familyMembers: [],
      familyLoading: true,
      guests: [],
    });

    try {
      const [famsRes, guestsRes] = await Promise.allSettled([
        fetchFamilyMembersForScannedMember(targetChurchId, targetEventId, memberId, (member as any)?.accountId),
        fetchGuestsForEvent(targetChurchId, targetEventId, memberId)
      ]);
      const fams = famsRes.status === 'fulfilled' ? famsRes.value : [];
      const guests = guestsRes.status === 'fulfilled' ? guestsRes.value : [];
      setScanResultModal(prev => ({
        ...prev,
        familyMembers: fams,
        familyLoading: false,
        guests,
      }));
    } catch {
      setScanResultModal(prev => ({ ...prev, familyLoading: false }));
    }
  };

  // ─── QR Code Scanner & Check-in Execution ──────────────────────────────────
  const handleBarcodeScanned = async ({ data, preParsed }: { data: string; preParsed?: any }) => {
    try {
      const expectedId = selectedEventForScan?.id;
      const expectedTitle = selectedEventForScan?.title;

      const parsed = preParsed 
        ? { valid: true, payload: preParsed, error: undefined } 
        : AttendanceService.parseAttendanceQRPayload(data, churchId, churchName, churchCode, expectedId, expectedTitle);

      if (!parsed.valid || !parsed.payload) {
        setIsDecoding(false);
        try {
          Vibration.vibrate(400);
        } catch {}
        setInvalidQrMessage(
          parsed.error || `Please scan the official ${churchName || 'Church of God'} attendance QR code.`
        );
        setShowInvalidQrModal(true);
        return;
      }

      const qr = parsed.payload;

      // Determine if this is a Church QR (generic) or Event QR (specific)
      const GENERIC_EVENT_IDS = ['general_service', 'church_qr', 'general', ''];
      const scannedIsChurchQR = (parsed as any).isChurchQR ||
        GENERIC_EVENT_IDS.includes((qr.eventId || '').trim().toLowerCase()) ||
        (qr.eventName || '').toLowerCase() === 'general church attendance' ||
        (qr.eventName || '').toLowerCase() === 'general service' ||
        (qr.eventName || '').toLowerCase() === 'church service';

      // Strict Event Matching: only applies to Event QRs scanning for a specific event
      // Church QR is ALWAYS accepted for any event of the correct church
      if (!scannedIsChurchQR && expectedId) {
        const qrEventId = (qr.eventId || '').trim().toLowerCase();
        const expId = expectedId.trim().toLowerCase();
        const qrEventTitle = (qr.eventName || '').trim().toLowerCase();
        const expTitle = (expectedTitle || '').trim().toLowerCase();

        const idMatches = qrEventId && qrEventId === expId;
        const titleMatches = expTitle && qrEventTitle && (
          qrEventTitle === expTitle ||
          qrEventTitle.includes(expTitle) ||
          expTitle.includes(qrEventTitle)
        );

        if (!idMatches && !titleMatches) {
          setIsDecoding(false);
          try {
            Vibration.vibrate(400);
          } catch {}
          setInvalidQrMessage(
            `This QR code is for "${qr.eventName || 'another event'}", not for "${expectedTitle}". Please scan the correct event QR code.`
          );
          setShowInvalidQrModal(true);
          return;
        }
      }

      const targetChurchId = qr.churchId || churchId;
      const targetChurchName = qr.churchName || churchName;

      // ─── 100-METER CHURCH LOCATION VALIDATION ────────────────────────────
      setIsDecoding(true);
      setDecodingMessage('Verifying church location...');

      // 1. Resolve church document to retrieve registered latitude and longitude
      let churchToValidate: any = activeChurch;
      if (!LocationService.getChurchCoordinates(churchToValidate) && targetChurchId) {
        try {
          const churchSnap = await firestore().collection('churches').doc(targetChurchId).get();
          if (churchSnap.exists()) {
            churchToValidate = { id: churchSnap.id, ...churchSnap.data() };
          }
        } catch {}
      }

      const churchCoords = LocationService.getChurchCoordinates(churchToValidate);

      if (!churchCoords) {
        setIsDecoding(false);
        setHasScanned(false);
        try { Vibration.vibrate(500); } catch {}
        setLocationErrorModal({
          visible: true,
          title: 'Church Location Not Registered',
          message: `The church "${targetChurchName}" has not registered its GPS coordinates yet.\n\nPlease ask your church administrator or pastor to set the church location in Church Settings to enable location-based attendance.`,
          distanceText: undefined,
        });
        return;
      }

      // 2. Obtain member's current GPS location
      let memberCoords = (userLocation && Date.now() - userLocation.timestamp < 12000)
        ? userLocation.coords
        : null;

      if (!memberCoords) {
        const locResult = await LocationService.getCurrentLocation();
        if (!locResult.success || !locResult.coords) {
          setIsDecoding(false);
          setHasScanned(false);
          try { Vibration.vibrate(500); } catch {}
          setLocationErrorModal({
            visible: true,
            title: 'Location Verification Required',
            message: locResult.error || 'Please enable GPS / Location services on your phone to verify that you are within 100 meters of the church.',
            distanceText: undefined,
          });
          return;
        }
        memberCoords = locResult.coords;
        setUserLocation({ coords: memberCoords, timestamp: Date.now() });
      }

      // 3. Compute distance between member and church
      const distanceMeters = LocationService.calculateDistanceInMeters(
        memberCoords.latitude,
        memberCoords.longitude,
        churchCoords.latitude,
        churchCoords.longitude
      );

      const roundedDist = Math.round(distanceMeters);

      // 4. Strict 100-meter radius validation
      if (roundedDist > 100) {
        setIsDecoding(false);
        setHasScanned(false);
        try { Vibration.vibrate(600); } catch {}

        const displayDist = roundedDist >= 1000
          ? `${(roundedDist / 1000).toFixed(1)} km`
          : `${roundedDist} meters`;

        setLocationErrorModal({
          visible: true,
          title: 'Outside Church Location',
          message: `You are approximately ${displayDist} away from ${targetChurchName}.\n\nTo mark attendance, you must be physically within 100 meters of the registered church location.`,
          distanceText: displayDist,
        });
        return;
      }

      // Determine target event:
      // - If user tapped on a specific event card → always use that event (whether Church QR or Event QR)
      // - If Event QR with specific eventId → use the QR's event
      // - If Church QR with no pre-selected event → fallback to active/today's event
      let targetEventId: string;
      let targetEventName: string;

      if (expectedId) {
        // User selected a specific event to check into
        targetEventId = expectedId;
        targetEventName = expectedTitle || '';
      } else if (!scannedIsChurchQR && qr.eventId && qr.eventId !== 'general_service') {
        // Event QR with specific event embedded
        targetEventId = qr.eventId;
        targetEventName = qr.eventName || '';
      } else {
        // Church QR fallback: use the active event or first today event
        targetEventId = activeEvent?.id || todayEvents[0]?.id || 'general_service';
        targetEventName = activeEvent?.title || todayEvents[0]?.title || qr.eventName || 'Church Service';
      }

      // Resolve event name from local events if missing
      if (!targetEventName || targetEventName === 'Church Service') {
        const matched = allEvents.find(e => e.id === targetEventId) || todayEvents.find(e => e.id === targetEventId);
        if (matched?.title) targetEventName = matched.title;
      }

      // For Event QR (non-generic): verify it belongs to this church's event list
      if (!scannedIsChurchQR && allEvents.length > 0 && targetEventId !== 'general_service') {
        const exists = allEvents.some(e => e.id === targetEventId) || todayEvents.some(e => e.id === targetEventId);
        if (!exists) {
          setIsDecoding(false);
          try {
            Vibration.vibrate(400);
          } catch {}
          setInvalidQrMessage(
            `This event "${targetEventName}" is not in your church's schedule.`
          );
          setShowInvalidQrModal(true);
          return;
        }
      }

      const nowObj = new Date();
      const formattedDate = nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const formattedTime = nowObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      // Instantly mark the event in local state so UI reflects check-in without waiting
      if (targetEventId) {
        setMarkedEventIds(prev => new Set([...prev, targetEventId]));
      }
      if (selectedEventForScan?.id) {
        setMarkedEventIds(prev => new Set([...prev, selectedEventForScan.id]));
      }

      const scannedMemberId = qr.memberId || memberId;
      const scannedMemberName = qr.memberName || qr.name || (qr.memberId ? 'Member' : memberName);
      const scannedMemberPhone = qr.memberPhone || qr.phone || memberPhone;
      const scannedAccountId = qr.accountId || (member as any)?.accountId || (member as any)?.id || scannedMemberId;

      // Optimistically update attendance records in state so UI reflects check-in instantly
      setAttendanceRecords(prev => [
        {
          id: `rec_${Date.now()}`,
          memberId: scannedMemberId,
          memberName: scannedMemberName,
          churchId: targetChurchId,
          eventId: targetEventId,
          eventName: targetEventName,
          status: 'Present',
          timestamp: new Date(),
          method: 'QR_SCAN',
        },
        ...prev,
      ]);

      // Optimistically update event presentCount across all events
      setAllEvents(prev =>
        prev.map(ev => {
          if (ev.id === targetEventId) {
            return {
              ...ev,
              presentCount: (ev.presentCount || 0) + 1,
            };
          }
          return ev;
        })
      );

      // Turn off any decoding overlay immediately
      setIsDecoding(false);

      // Instantly show Success Confirmation Modal with family members & guests loading
      setScanResultModal({
        visible: true,
        churchName: targetChurchName,
        eventName: targetEventName,
        eventId: targetEventId,
        date: formattedDate,
        time: formattedTime,
        alreadyMarked: false,
        scannedMemberId,
        scannedMemberName,
        familyMembers: [],
        familyLoading: true,
        guests: [],
      });

      // Fetch family members & guests in background
      Promise.allSettled([
        fetchFamilyMembersForScannedMember(targetChurchId, targetEventId, scannedMemberId, scannedAccountId),
        fetchGuestsForEvent(targetChurchId, targetEventId, scannedMemberId)
      ]).then(([famsRes, guestsRes]) => {
        const fams = famsRes.status === 'fulfilled' ? famsRes.value : [];
        const loadedGuests = guestsRes.status === 'fulfilled' ? guestsRes.value : [];
        setScanResultModal(prev => ({
          ...prev,
          familyMembers: fams,
          familyLoading: false,
          guests: loadedGuests,
        }));
      }).catch(err => {
        console.warn('[AttendanceScreen] Error fetching family members or guests:', err);
        setScanResultModal(prev => ({
          ...prev,
          familyLoading: false,
        }));
      });

      // Record attendance in Firestore in background without blocking the UI
      AttendanceService.recordAttendance({
        churchId: targetChurchId,
        eventId: targetEventId,
        eventName: targetEventName,
        memberId: scannedMemberId,
        memberName: scannedMemberName,
        memberPhone: scannedMemberPhone,
        method: 'QR_SCAN',
      }).then(recordResult => {
        if (recordResult?.alreadyMarked) {
          setScanResultModal(prev => ({ ...prev, alreadyMarked: true }));
        }
        loadScreenData();
      }).catch(err => {
        console.warn('[AttendanceScreen] Background attendance record warning:', err);
      });

    } catch (err: any) {
      setIsDecoding(false);
      setHasScanned(false);
      console.error('[AttendanceScreen] Scan error:', err);
      Alert.alert('Scan Error', 'An unexpected error occurred while processing the QR code.');
    }
  };

  // Launch Camera / Live Scanner
  const handleLaunchCamera = async () => {
    setShowScanOptionsModal(false);
    setHasScanned(false);
    setShowLiveScanner(true);
  };

  // Launch Gallery
  const handleLaunchGallery = async () => {
    setShowScanOptionsModal(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsDecoding(true);
        setDecodingMessage('Scanning QR code from gallery image...');
        await processCapturedImage(result.assets[0]);
      }
    } catch (e: any) {
      setIsDecoding(false);
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  // Process and decode QR image
  const processCapturedImage = async (asset: any) => {
    setIsDecoding(true);
    setDecodingMessage('Scanning QR code from image...');
    try {
      let qrData: string | null = null;
      if (asset.base64) {
        qrData = QRDecoderService.decodeBase64(asset.base64);
      }
      if (!qrData && asset.uri) {
        qrData = await QRDecoderService.decodeFromUri(asset.uri);
      }

      if (!qrData) {
        setIsDecoding(false);
        Alert.alert(
          'No QR Code Detected',
          'Could not detect a clear attendance QR code in this image. Please ensure the QR code is centered and well-lit.',
          [
            { text: 'Try Again', onPress: () => setShowScanOptionsModal(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const expectedId = selectedEventForScan?.id;
      const expectedTitle = selectedEventForScan?.title;

      const parsed = AttendanceService.parseAttendanceQRPayload(
        qrData, 
        churchId, 
        churchName, 
        churchCode,
        expectedId,
        expectedTitle
      );

      if (!parsed.valid || !parsed.payload) {
        setIsDecoding(false);
        try {
          Vibration.vibrate(400);
        } catch {}
        setInvalidQrMessage(
          parsed.error || `Please scan the official ${churchName || 'Church of God'} attendance QR code.`
        );
        setShowInvalidQrModal(true);
        return;
      }

      setDecodingMessage('Recording attendance under your church...');
      await handleBarcodeScanned({ data: qrData, preParsed: parsed.payload });
    } catch (err) {
      setIsDecoding(false);
      Alert.alert('Decode Error', 'Failed to read image. Please try again.');
    }
  };

  // 1-Tap Check-In
  const handleDirectChurchCheckin = async () => {
    setShowScanOptionsModal(false);
    if (!churchId) {
      Alert.alert('No Church Selected', 'Please join or select your church first.');
      return;
    }

    const payload = AttendanceService.generateAttendanceQRPayload(
      churchId, 
      churchName, 
      churchCode,
      activeEvent.id,
      activeEvent.title
    );
    await handleBarcodeScanned({ data: payload });
  };

  // Manual code check-in
  const handleManualCodeSubmit = async () => {
    const code = manualCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Missing Code', 'Please enter your church code.');
      return;
    }
    setManualCodeModal(false);
    setManualCodeInput('');

    const payload = AttendanceService.generateAttendanceQRPayload(
      churchId, 
      churchName, 
      code,
      activeEvent.id,
      activeEvent.title
    );
    await handleBarcodeScanned({ data: payload });
  };

  // QR Code payload for download/sharing
  const activeQrPayload = useMemo(() => {
    return AttendanceService.generateAttendanceQRPayload(
      churchId,
      churchName,
      churchCode,
      activeEvent.id,
      activeEvent.title
    );
  }, [churchId, churchName, churchCode, activeEvent]);

  // Circular Progress Ring Component
  const renderCircularProgress = (percent: number) => {
    const size = 68;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0D9488"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.circlePercentTxt}>{percent}%</Text>
        </View>
      </View>
    );
  };

  const getInitials = (name: string, firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      const f = firstName.trim().charAt(0);
      const l = lastName.trim().charAt(0);
      if (f && l) return `${f}${l}`.toUpperCase();
    }
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const AttendeeAvatar = ({
    profilePicture,
    name,
    firstName,
    lastName,
  }: {
    profilePicture?: string;
    name: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const [imgError, setImgError] = useState(false);
    const initials = getInitials(name, firstName, lastName);

    if (profilePicture && !imgError) {
      return (
        <Image
          source={{ uri: profilePicture }}
          style={styles.avatarImg}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <View style={styles.avatarInitials}>
        <Text style={styles.avatarInitialsTxt}>{initials}</Text>
      </View>
    );
  };

  const renderEventCard = (eventItem: EventItem, isCarousel = false) => {
    const isMarked = isEventAttendanceMarked(eventItem);
    const eventLocation = eventItem.location || (eventItem as any).venueEn || (eventItem as any).venue || (eventItem as any).address || churchName;

    return (
      <View 
        key={eventItem.id} 
        style={[
          styles.featuredCard, 
          isCarousel && { width: width - 40, marginBottom: 0 },
          !isMarked && styles.featuredCardPendingBorder
        ]}
      >
        {/* Top row badge: Only shown when pending */}
        {!isMarked && (
          <View style={styles.cardBadgeRow}>
            <View style={styles.attendanceOpenBadge}>
              <View style={styles.orangeDot} />
              <Text style={styles.attendanceOpenTxt}>Attendance open · Pending</Text>
            </View>
          </View>
        )}

        {/* Title & Info */}
        <Text style={styles.featuredCardTitle} numberOfLines={2}>{eventItem.title}</Text>
        <Text style={styles.featuredCardTime}>
          {formatFullDate(eventItem.dateObj)}
        </Text>

        {/* Location Row */}
        {Boolean(eventLocation) && (
          <View style={styles.featuredCardChurch}>
            <MapPin size={13.5} color="#64748B" strokeWidth={2} style={{ marginRight: 5 }} />
            <Text style={styles.featuredCardChurchTxt} numberOfLines={1}>{eventLocation}</Text>
          </View>
        )}

        {/* Action Row */}
        <View style={styles.featuredCardActions}>
          {isMarked ? (
            <>
              <View style={styles.attendanceCompletedBtn}>
                <CheckCircle2 size={17} color="#15803D" strokeWidth={2.5} />
                <Text style={styles.attendanceCompletedBtnTxt}>Attended</Text>
              </View>

              <TouchableOpacity
                style={styles.guestActionBtn}
                onPress={() => handleOpenGuestModalForEvent(eventItem)}
                activeOpacity={0.75}
              >
                <UserPlus size={15} color="#6D28D9" strokeWidth={2.2} />
                <Text style={styles.guestActionBtnTxt}>+ Guest</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => handleOpenAttendeesList(eventItem)}
                activeOpacity={0.75}
              >
                <Eye size={20} color="#64748B" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.scanAttendanceBtn}
                onPress={() => {
                  setSelectedEventForScan(eventItem);
                  setHasScanned(false);
                  setShowLiveScanner(true);
                }}
                activeOpacity={0.85}
              >
                <QrCode size={18} color="#0f172a" strokeWidth={2.4} />
                <Text style={styles.scanAttendanceBtnTxt}>Scan QR to mark attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => handleOpenAttendeesList(eventItem)}
                activeOpacity={0.75}
              >
                <Eye size={20} color="#64748B" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            {activeTab === 'Home' ? (
              <>
                <Text style={styles.greetingSub}>{greeting}</Text>
                <Text style={styles.screenMainTitle} numberOfLines={1}>{memberName}</Text>
              </>
            ) : activeTab === 'My attendance' ? (
              <Text style={styles.screenMainTitle}>My attendance</Text>
            ) : (
              <Text style={styles.screenMainTitle}>Events</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.backCircleBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Segmented Navigation Pill Bar: Home | My attendance | Events ── */}
      <View style={styles.tabTrack}>
        {(['Home', 'My attendance', 'Events'] as MainTab[]).map(tabKey => {
          const isActive = activeTab === tabKey;
          return (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveTab(tabKey)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillTxt, isActive && styles.tabPillTxtActive]}>
                {tabKey}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: HOME
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'Home' && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadScreenData(); }} />
          }
        >
          {/* Today's Events Section */}
          {todayEvents.length === 0 ? (
            /* No Events Scheduled for Today Card */
            <View style={styles.noEventsTodayCard}>
              <View style={styles.noEventsIconCircle}>
                <Calendar size={22} color="#1E3A8A" />
              </View>
              <Text style={styles.noEventsTitle}>No Events Today</Text>
              <Text style={styles.noEventsSub}>
                {nextUpcomingEvent 
                  ? `Next event: "${nextUpcomingEvent.title}" on ${nextUpcomingEvent.dateStr} (${nextUpcomingEvent.timeStr})`
                  : 'There are no church services or events scheduled for today.'}
              </Text>
            </View>

          ) : todayEvents.length === 1 ? (
            /* Single Event Today Card */
            <View style={styles.carouselContainer}>
              <View style={styles.carouselHeaderRow}>
                <View style={styles.carouselTitleWrap}>
                  <Text style={styles.carouselSectionTitle}>Today's Event</Text>
                </View>
              </View>

              {renderEventCard(todayEvents[0], false)}
            </View>
          ) : (
            /* Multiple Events Today: HORIZONTAL CAROUSEL (with middle arrows) */
            <View style={styles.carouselContainer}>
              <View style={styles.carouselHeaderRow}>
                <View style={styles.carouselTitleWrap}>
                  <Text style={styles.carouselSectionTitle}>Today's Events</Text>
                  <View style={styles.eventCountBadge}>
                    <Text style={styles.eventCountBadgeTxt}>{todayEvents.length}</Text>
                  </View>
                </View>
              </View>

              {/* Card Track */}
              <View style={styles.carouselTrackWrapper}>
                <FlatList
                  ref={carouselRef}
                  data={todayEvents}
                  keyExtractor={item => item.id}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width - 40 + 12}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  contentContainerStyle={{ gap: 12 }}
                  onMomentumScrollEnd={ev => {
                    const idx = Math.round(ev.nativeEvent.contentOffset.x / (width - 40 + 12));
                    if (idx >= 0 && idx < todayEvents.length) {
                      setActiveCarouselIndex(idx);
                    }
                  }}
                  renderItem={({ item }) => renderEventCard(item, true)}
                />
              </View>

              {/* Line Type Carousel Indicators */}
              <View style={styles.carouselLinesContainer}>
                {todayEvents.map((item, idx) => {
                  const isActive = idx === activeCarouselIndex;
                  const isMarked = isEventAttendanceMarked(item);
                  const lineColor = isActive
                    ? (isMarked ? '#16A34A' : '#2563EB')
                    : (isMarked ? '#86EFAC' : '#93C5FD');

                  return (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => {
                        setActiveCarouselIndex(idx);
                        carouselRef.current?.scrollToOffset({
                          offset: idx * (width - 40 + 12),
                          animated: true,
                        });
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      style={[
                        styles.carouselLine,
                        isActive ? styles.carouselLineActive : styles.carouselLineInactive,
                        { backgroundColor: lineColor },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* Your Monthly Progress */}
          <Text style={styles.sectionHeaderTitle}>Your Monthly Progress</Text>
          <View style={styles.progressCard}>
            {renderCircularProgress(monthlyStats.percentage)}
            <View style={{ flex: 1 }}>
              <Text style={styles.progressEventCountTxt}>
                {monthlyStats.totalAttended} of {monthlyStats.totalEvents} events
              </Text>
              <Text style={styles.progressSubTxt}>Total attended</Text>
            </View>
          </View>

          {/* This Week Section */}
          <View style={styles.thisWeekHeaderRow}>
            <Text style={styles.thisWeekTitle}>This Week</Text>
            <TouchableOpacity onPress={() => setActiveTab('My attendance')} activeOpacity={0.7}>
              <Text style={styles.seeAllTxt}>See all</Text>
            </TouchableOpacity>
          </View>

          {thisWeekEvents.length === 0 ? (
            <View style={styles.emptyListWrap}>
              <Text style={styles.emptyListTxt}>No events scheduled for this week</Text>
            </View>
          ) : (
            <View style={styles.eventsListWrap}>
              {thisWeekEvents.map((item, idx) => {
                const isPast = item.dateObj < new Date();
                const isPresent = item.myStatus === 'Present';
                const startsIn = !isPast ? getStartsInText(item.dateObj) : null;

                return (
                  <View key={item.id || idx} style={[styles.eventRowItem, idx < thisWeekEvents.length - 1 && styles.eventRowBorder]}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.eventRowTitle}>{item.title}</Text>
                      <Text style={styles.eventRowSubtitle}>{formatShortDateTime(item.dateObj)}</Text>
                    </View>

                    {isPast ? (
                      <View style={[styles.statusBadge, isPresent ? styles.presentBadge : styles.absentBadge]}>
                        <Text style={[styles.statusBadgeTxt, isPresent ? styles.presentBadgeTxt : styles.absentBadgeTxt]}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.startsInTxt}>{startsIn}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: MY ATTENDANCE
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'My attendance' && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadScreenData(); }} />
          }
        >
          {/* Time Filter Pills: This month | 3 months | This year */}
          <View style={styles.subFilterRow}>
            {(['This month', '3 months', 'This year'] as PeriodFilter[]).map(p => {
              const isSelected = periodFilter === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodPill, isSelected && styles.periodPillActive]}
                  onPress={() => setPeriodFilter(p)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.periodPillTxt, isSelected && styles.periodPillTxtActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Progress Card (Dynamically computed for selected period) */}
          <View style={[styles.progressCard, { marginTop: 4, marginBottom: 20 }]}>
            {renderCircularProgress(periodData.percentage)}
            <View style={{ flex: 1 }}>
              <Text style={styles.progressEventCountTxt}>
                {periodData.totalAttended} of {periodData.totalEvents} events
              </Text>
              <Text style={styles.progressSubTxt}>Total attended</Text>
            </View>
          </View>

          {/* Full Attendance Event List (Dynamically filtered by selected period) */}
          {periodData.list.length === 0 ? (
            <View style={styles.emptyListWrap}>
              <Text style={styles.emptyListTxt}>No attendance records found for this period</Text>
            </View>
          ) : (
            <View style={styles.eventsListWrap}>
              {periodData.list.map((item, idx) => {
                const isPast = item.dateObj < new Date();
                const isPresent = item.myStatus === 'Present';
                const startsIn = !isPast ? getStartsInText(item.dateObj) : null;

                return (
                  <View key={item.id || idx} style={[styles.eventRowItem, idx < periodData.list.length - 1 && styles.eventRowBorder]}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.eventRowTitle}>{item.title}</Text>
                      <Text style={styles.eventRowSubtitle}>{formatShortDateTime(item.dateObj)}</Text>
                    </View>

                    {isPast ? (
                      <View style={[styles.statusBadge, isPresent ? styles.presentBadge : styles.absentBadge]}>
                        <Text style={[styles.statusBadgeTxt, isPresent ? styles.presentBadgeTxt : styles.absentBadgeTxt]}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.startsInTxt}>{startsIn}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 3: EVENTS
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'Events' && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadScreenData(); }} />
          }
        >
          {/* Filter Pills: Upcoming | Past */}
          <View style={styles.subFilterRow}>
            {(['Upcoming', 'Past'] as TimelineFilter[]).map(tf => {
              const isSelected = timelineFilter === tf;
              return (
                <TouchableOpacity
                  key={tf}
                  style={[styles.periodPill, isSelected && styles.periodPillActive]}
                  onPress={() => setTimelineFilter(tf)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.periodPillTxt, isSelected && styles.periodPillTxtActive]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List of Event Cards */}
          {filteredEventsList.length === 0 ? (
            <View style={styles.emptyListWrap}>
              <Text style={styles.emptyListTxt}>
                {timelineFilter === 'Upcoming' ? 'No upcoming events scheduled' : 'No past events found'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {filteredEventsList.map(ev => {
                return (
                  <View key={ev.id} style={styles.eventCardItem}>
                    {/* Top row: Open badge & Date */}
                    <View style={styles.eventCardTopRow}>
                      <View style={styles.openBadge}>
                        <Text style={styles.openBadgeTxt}>Open</Text>
                      </View>
                      <Text style={styles.eventCardDateTxt}>{ev.dateStr}</Text>
                    </View>

                    {/* Title & Time */}
                    <Text style={styles.eventCardTitle}>{ev.title}</Text>
                    <Text style={styles.eventCardTime}>{ev.timeStr}</Text>

                    {/* Bottom Row: X present & View list button */}
                    <View style={styles.eventCardBottomRow}>
                      <Text style={styles.presentCountTxt}>{ev.presentCount || 0} present</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.guestSmallBtn}
                          onPress={() => handleOpenGuestModalForEvent(ev)}
                          activeOpacity={0.75}
                        >
                          <UserPlus size={13} color="#6D28D9" strokeWidth={2.2} />
                          <Text style={styles.guestSmallBtnTxt}>+ Guest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.viewListBtn}
                          onPress={() => handleOpenAttendeesList(ev)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.viewListBtnTxt}>View list</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          ATTENDEES ROSTER MODAL ("View list")
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showAttendeesModal} animationType="slide" onRequestClose={() => setShowAttendeesModal(false)}>
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          
          {/* Header */}
          <View style={styles.rosterHeader}>
            <TouchableOpacity 
              style={styles.backCircleBtn} 
              onPress={() => setShowAttendeesModal(false)}
            >
              <ArrowLeft size={20} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.rosterHeaderInfo}>
              <Text style={styles.rosterHeaderTitle} numberOfLines={1}>
                {selectedEventForList?.title || 'Attendees'}
              </Text>
              <Text style={styles.rosterHeaderSub}>
                {selectedEventForList?.dateStr || ''}
              </Text>
            </View>

            {!(selectedEventForList && isEventAttendanceMarked(selectedEventForList)) && (
              <TouchableOpacity 
                style={styles.rosterQrBtn}
                onPress={() => {
                  setShowAttendeesModal(false);
                  setSelectedEventForScan(selectedEventForList);
                  setHasScanned(false);
                  setShowLiveScanner(true);
                }}
              >
                <QrCode size={22} color="#0f172a" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar & Add Guest */}
          <View style={styles.rosterSearchWrap}>
            <View style={styles.searchBox}>
              <Search size={18} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members"
                placeholderTextColor="#94a3b8"
                value={attendeesSearch}
                onChangeText={setAttendeesSearch}
              />
            </View>
            <TouchableOpacity
              style={styles.rosterAddGuestBtn}
              onPress={() => setShowRosterGuestInput(prev => !prev)}
              activeOpacity={0.8}
            >
              <UserPlus size={15} color="#6D28D9" strokeWidth={2.2} />
              <Text style={styles.rosterAddGuestBtnTxt}>+ Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Add Guest input banner in roster */}
          {showRosterGuestInput && (
            <View style={styles.rosterGuestInputBanner}>
              <View style={styles.addGuestInputWrap}>
                <UserPlus size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.addGuestInput}
                  placeholder="Guest's full name..."
                  placeholderTextColor="#94A3B8"
                  value={rosterGuestNameInput}
                  onChangeText={setRosterGuestNameInput}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (rosterGuestNameInput.trim() && selectedEventForList) {
                      handleAddGuest(rosterGuestNameInput, selectedEventForList.id, selectedEventForList.title);
                    }
                  }}
                  editable={!isAddingGuest}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.addGuestBtn,
                  (!rosterGuestNameInput.trim() || isAddingGuest) && styles.addGuestBtnDisabled
                ]}
                onPress={() => {
                  if (rosterGuestNameInput.trim() && selectedEventForList) {
                    handleAddGuest(rosterGuestNameInput, selectedEventForList.id, selectedEventForList.title);
                  }
                }}
                disabled={!rosterGuestNameInput.trim() || isAddingGuest}
                activeOpacity={0.8}
              >
                {isAddingGuest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addGuestBtnTxt}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Pills: All | Present | Absent */}
          <View style={styles.rosterPillRow}>
            {(['All', 'Present', 'Absent'] as AttendeesFilter[]).map(f => {
              const isActive = attendeesFilter === f;
              let count = attendeesList.length;
              if (f === 'Present') count = presentCountInModal;
              if (f === 'Absent') count = absentCountInModal;

              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.rosterPill, isActive && styles.rosterPillActive]}
                  onPress={() => setAttendeesFilter(f)}
                >
                  <Text style={[styles.rosterPillTxt, isActive && styles.rosterPillTxtActive]}>
                    {f} {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Attendees List */}
          {attendeesLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#1a2d5a" />
            </View>
          ) : (
            <FlatList
              data={filteredAttendees}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              renderItem={({ item }) => {
                const isMe = item.id === memberId;
                const isPresent = item.status === 'Present';
                const time = item.timestamp 
                  ? (item.timestamp.toDate ? formatSimpleTime(item.timestamp.toDate()) : formatSimpleTime(new Date(item.timestamp)))
                  : '';

                return (
                  <View style={styles.attendeeRow}>
                    <AttendeeAvatar
                      profilePicture={item.profilePicture}
                      name={item.name}
                      firstName={item.firstName}
                      lastName={item.lastName}
                    />

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.attendeeName} numberOfLines={1}>{item.name}</Text>
                        {isMe && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeTxt}>You</Text>
                          </View>
                        )}
                        {item.isGuest && (
                          <View style={styles.guestPillBadge}>
                            <Text style={styles.guestPillBadgeTxt}>Guest</Text>
                          </View>
                        )}
                      </View>
                      {item.isGuest && item.guestOf ? (
                        <Text style={styles.guestOfTxt}>Brought by {item.guestOf}</Text>
                      ) : null}
                      {isPresent && time ? (
                        <Text style={styles.attendeeTime}>{time}</Text>
                      ) : null}
                    </View>

                    {item.isGuest ? (
                      <View style={[styles.statusBadge, styles.guestStatusBadge]}>
                        <Check size={11} color="#6D28D9" strokeWidth={2.5} style={{ marginRight: 3 }} />
                        <Text style={[styles.statusBadgeTxt, styles.guestStatusBadgeTxt]}>Present</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, isPresent ? styles.presentBadge : styles.absentBadge]}>
                        <Text style={[styles.statusBadgeTxt, isPresent ? styles.presentBadgeTxt : styles.absentBadgeTxt]}>
                          {item.status}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          LIVE QR SCANNER MODAL (Standard Viewfinder Reticle & Auto-Detection)
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={showLiveScanner}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setShowLiveScanner(false);
          setHasScanned(false);
          setIsTorchOn(false);
        }}
      >
        <View style={styles.liveScannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {!cameraPermission?.granted ? (
            // Permission Request State
            <View style={[styles.scannerPermissionWrap, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity 
                style={styles.scannerPermCloseBtn} 
                onPress={() => setShowLiveScanner(false)}
                activeOpacity={0.8}
              >
                <X size={22} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.scannerPermCard}>
                <View style={styles.scannerPermIconBox}>
                  <Camera size={38} color="#E2A925" strokeWidth={2.2} />
                </View>
                <Text style={styles.scannerPermTitle}>Camera Access Required</Text>
                <Text style={styles.scannerPermSub}>
                  To scan the attendance QR code displayed at your church service, please allow camera access.
                </Text>

                <TouchableOpacity 
                  style={styles.scannerPermGrantBtn}
                  onPress={requestCameraPermission}
                  activeOpacity={0.85}
                >
                  <Text style={styles.scannerPermGrantBtnTxt}>Grant Permission</Text>
                </TouchableOpacity>

                <View style={styles.scannerPermDividerRow}>
                  <View style={styles.scannerPermLine} />
                  <Text style={styles.scannerPermOrTxt}>or</Text>
                  <View style={styles.scannerPermLine} />
                </View>

                <View style={{ flexDirection: 'row', width: '100%' }}>
                  <TouchableOpacity 
                    style={styles.scannerPermAltBtn}
                    onPress={() => { setShowLiveScanner(false); handleLaunchGallery(); }}
                    activeOpacity={0.8}
                  >
                    <ImageIcon size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.scannerPermAltBtnTxt}>Upload from Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // Camera Stream with Viewfinder & Reticle
            <View style={StyleSheet.absoluteFillObject}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={isTorchOn}
                barcodeScannerSettings={BARCODE_SCANNER_SETTINGS}
                onBarcodeScanned={hasScanned ? undefined : handleQrDetected}
              />

              {/* Viewfinder Dark Mask Overlay */}
              <View style={StyleSheet.absoluteFillObject}>
                {/* Top Mask with Header */}
                <View style={[styles.scannerOverlayTop, { paddingTop: insets.top + 8 }]}>
                  <View style={styles.scannerHeaderRow}>
                    <TouchableOpacity 
                      style={styles.scannerHeaderCircleBtn}
                      onPress={() => {
                        setShowLiveScanner(false);
                        setHasScanned(false);
                        setIsTorchOn(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <ArrowLeft size={22} color="#ffffff" strokeWidth={2.4} />
                    </TouchableOpacity>

                    <Text style={styles.scannerHeaderTitle}>Scan QR Code</Text>

                    <TouchableOpacity 
                      style={[
                        styles.scannerHeaderCircleBtn,
                        isTorchOn && styles.scannerHeaderCircleBtnActive
                      ]}
                      onPress={() => setIsTorchOn(!isTorchOn)}
                      activeOpacity={0.75}
                    >
                      <Zap 
                        size={19} 
                        color={isTorchOn ? '#FBBF24' : '#ffffff'} 
                        fill={isTorchOn ? '#FBBF24' : 'transparent'} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Target Event Prompt (matches Screenshot 1) */}
                  <View style={styles.scannerTargetPromptWrap}>
                    <Text style={styles.scannerTargetPromptSmall}>Scan the Attendance QR Code for</Text>
                    <Text style={styles.scannerTargetPromptEvent} numberOfLines={1}>
                      {selectedEventForScan?.title || activeEvent?.title || 'Church Service'}
                    </Text>
                  </View>
                </View>

                {/* Middle Viewfinder Row */}
                <View style={styles.scannerMiddleRow}>
                  {/* Left Side Mask */}
                  <View style={styles.scannerSideMask} />

                  {/* Viewfinder Target Window */}
                  <View 
                    style={[
                      styles.scannerReticleBox,
                      { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE },
                      hasScanned && styles.scannerReticleBoxScanned
                    ]}
                  >
                    {/* 4 Colored Corner Reticles (Red, Blue, Green, Yellow) */}
                    <View style={[styles.cornerReticle, styles.cornerTL, hasScanned && styles.cornerScanned]} />
                    <View style={[styles.cornerReticle, styles.cornerTR, hasScanned && styles.cornerScanned]} />
                    <View style={[styles.cornerReticle, styles.cornerBL, hasScanned && styles.cornerScanned]} />
                    <View style={[styles.cornerReticle, styles.cornerBR, hasScanned && styles.cornerScanned]} />

                    {/* Laser Sweep Animation */}
                    {!hasScanned && (
                      <Animated.View 
                        style={[
                          styles.scannerLaserLine,
                          {
                            transform: [{
                              translateY: scanAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, SCAN_FRAME_SIZE - 14],
                              })
                            }]
                          }
                        ]} 
                      />
                    )}

                    {hasScanned && (
                      <View style={styles.scannerScannedIndicator}>
                        <CheckCircle2 size={36} color="#10B981" strokeWidth={2.5} />
                        <Text style={styles.scannerScannedTxt}>QR Detected!</Text>
                      </View>
                    )}
                  </View>

                  {/* Right Side Mask */}
                  <View style={styles.scannerSideMask} />
                </View>

                {/* Bottom Mask with Instructions & Quick Actions */}
                <View style={[styles.scannerOverlayBottom, { paddingBottom: insets.bottom + 24 }]}>
                  {/* Geofence Indicator Pill */}
                  <View style={styles.scannerGeofencePill}>
                    <MapPin size={13} color="#60A5FA" strokeWidth={2.4} style={{ marginRight: 5 }} />
                    <Text style={styles.scannerGeofenceTxt}>100m Church Geofence Active</Text>
                  </View>

                  <View style={styles.scannerInstructionWrap}>
                    <Text style={styles.scannerInstructionMain}>
                      {hasScanned 
                        ? 'Recording your attendance...' 
                        : 'Center the QR code inside the frame to\nrecord your attendance.'}
                    </Text>
                  </View>
                </View>

              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          LOCATION / GEOFENCE ERROR MODAL (100-meter Radius Restriction)
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={locationErrorModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setLocationErrorModal(prev => ({ ...prev, visible: false }));
          setHasScanned(false);
          setIsDecoding(false);
        }}
      >
        <View style={styles.invalidQrOverlay}>
          <View style={styles.invalidQrCard}>
            {/* Amber/Red Circular Icon with MapPinOff */}
            <View style={[styles.invalidQrIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <MapPinOff size={34} color="#EF4444" strokeWidth={2.4} />
            </View>

            {/* Title */}
            <Text style={styles.invalidQrTitle}>{locationErrorModal.title}</Text>

            {/* Distance badge if outside radius */}
            {Boolean(locationErrorModal.distanceText) && (
              <View style={styles.geofenceDistanceBadge}>
                <MapPin size={13} color="#DC2626" strokeWidth={2.4} style={{ marginRight: 5 }} />
                <Text style={styles.geofenceDistanceBadgeTxt}>
                  {locationErrorModal.distanceText} from church
                </Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.invalidQrMsg}>
              {locationErrorModal.message}
            </Text>

            {/* Geofence Rule Notice */}
            <View style={styles.geofenceRuleBox}>
              <Text style={styles.geofenceRuleTxt}>
                ⚠️ Scanning Rule: Attendance can only be marked when you are physically within 100 meters of the registered church location.
              </Text>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={styles.invalidQrBtn}
              onPress={() => {
                setLocationErrorModal(prev => ({ ...prev, visible: false }));
                setHasScanned(false);
                setIsDecoding(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.invalidQrBtnTxt}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          INVALID QR MODAL (Dedicated root modal for 100% visibility over Camera & Screens)
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={showInvalidQrModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setShowInvalidQrModal(false);
          setHasScanned(false);
          setIsDecoding(false);
        }}
      >
        <View style={styles.invalidQrOverlay}>
          <View style={styles.invalidQrCard}>
            {/* Red Circular Icon with Exclamation */}
            <View style={styles.invalidQrIconWrap}>
              <AlertCircle size={36} color="#EF4444" strokeWidth={2.4} />
            </View>

            {/* Title */}
            <Text style={styles.invalidQrTitle}>Invalid QR Code</Text>

            {/* Description */}
            <Text style={styles.invalidQrMsg}>
              {invalidQrMessage || `Please scan the official ${churchName || 'Church of God'} attendance QR code.`}
            </Text>

            {/* Try Again Button */}
            <TouchableOpacity
              style={styles.invalidQrBtn}
              onPress={() => {
                setShowInvalidQrModal(false);
                setHasScanned(false);
                setIsDecoding(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.invalidQrBtnTxt}>Try Again</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.invalidQrCancelBtn}
              onPress={() => {
                setShowInvalidQrModal(false);
                setShowLiveScanner(false);
                setHasScanned(false);
                setIsDecoding(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.invalidQrCancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          SCAN OPTIONS MODAL (Camera / Gallery / Code / 1-Tap)
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showScanOptionsModal} transparent animationType="slide">
        <View style={styles.optionsModalOverlay}>
          <View style={styles.optionsModalCard}>
            <View style={styles.optionsModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionsModalTitle}>Record Attendance</Text>
                <Text style={styles.optionsModalSub}>{selectedEventForScan?.title || activeEvent.title}</Text>
              </View>
              <TouchableOpacity 
                style={styles.optionsCloseBtn}
                onPress={() => setShowScanOptionsModal(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              {/* Option 1: Native Camera QR Scan */}
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleLaunchCamera}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <Camera size={22} color="#1E3A8A" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionItemTitle}>Scan QR with Camera</Text>
                  <Text style={styles.optionItemSub}>Capture the QR code displayed at church</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Gallery Image QR */}
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleLaunchGallery}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' }]}>
                  <ImageIcon size={22} color="#7C3AED" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionItemTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionItemSub}>Select a saved church QR image or photo</Text>
                </View>
              </TouchableOpacity>


            </View>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          MANUAL CODE MODAL
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal visible={manualCodeModal} transparent animationType="fade">
        <View style={styles.manualModalOverlay}>
          <View style={styles.manualModalCard}>
            <View style={styles.manualIconCircle}>
              <QrCode size={28} color="#1E3A8A" strokeWidth={2.2} />
            </View>
            <Text style={styles.manualModalTitle}>Enter Church Code</Text>
            <Text style={styles.manualModalSub}>
              Enter your church code or ID to mark your attendance.
            </Text>

            <TextInput
              style={styles.manualInput}
              placeholder={churchCode ? `e.g. ${churchCode}` : "Enter church code..."}
              placeholderTextColor="#94a3b8"
              value={manualCodeInput}
              onChangeText={setManualCodeInput}
              autoCapitalize="characters"
            />

            <View style={styles.manualBtnRow}>
              <TouchableOpacity 
                style={styles.manualCancelBtn}
                onPress={() => { setManualCodeModal(false); setManualCodeInput(''); }}
              >
                <Text style={styles.manualCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.manualConfirmBtn}
                onPress={handleManualCodeSubmit}
              >
                <Text style={styles.manualConfirmTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          DECODING LOADING OVERLAY
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal visible={isDecoding} transparent animationType="fade">
        <View style={styles.decodingOverlay}>
          <View style={styles.decodingCard}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.decodingTxt}>{decodingMessage}</Text>
            <Text style={styles.decodingSubTxt}>Please wait a moment...</Text>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          ATTENDANCE MARKED CONFIRMATION SCREEN (Matches Screenshot 2)
          ──────────────────────────────────────────────────────────────────────── */}
      <Modal visible={scanResultModal.visible} animationType="slide" statusBarTranslucent onRequestClose={() => setScanResultModal(prev => ({ ...prev, visible: false }))}>
        <View style={styles.confirmScreenContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

          <ScrollView 
            contentContainerStyle={[
              styles.confirmScrollWrap, 
              { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Big Green Circle with Checkmark */}
            <View style={styles.confirmIconCircle}>
              <Check size={42} color="#16A34A" strokeWidth={3} />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.confirmMainTitle}>
              {scanResultModal.scannedMemberName && scanResultModal.scannedMemberName !== memberName
                ? `${scanResultModal.scannedMemberName} is marked present`
                : "You're marked present"}
            </Text>
            <Text style={styles.confirmSubTitle}>
              {scanResultModal.alreadyMarked 
                ? 'Thank you! Attendance was already recorded.'
                : 'Thank you! Attendance has been recorded.'}
            </Text>

            {/* Details Card */}
            <View style={styles.confirmDetailsCard}>
              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmDetailLabel}>Event</Text>
                <Text style={styles.confirmDetailValue} numberOfLines={1}>{scanResultModal.eventName}</Text>
              </View>

              <View style={styles.confirmDivider} />

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmDetailLabel}>Date</Text>
                <Text style={styles.confirmDetailValue}>{scanResultModal.date}</Text>
              </View>

              <View style={styles.confirmDivider} />

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmDetailLabel}>Time</Text>
                <Text style={styles.confirmDetailValue}>{scanResultModal.time}</Text>
              </View>
            </View>

            {/* Household & Family Members Attendance Card */}
            <View style={styles.confirmFamilyCard}>
              <View style={styles.confirmFamilyHeaderRow}>
                <View style={styles.confirmFamilyIconWrap}>
                  <Users size={18} color="#1E3A8A" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmFamilyTitle}>Household Attendance</Text>
                  <Text style={styles.confirmFamilySub}>Select family members to mark present</Text>
                </View>
              </View>

              {/* Scanned Member */}
              <Text style={styles.confirmSectionLabel}>SCANNED MEMBER</Text>
              <View style={styles.scannedMemberRow}>
                <View style={styles.scannedMemberLeft}>
                  <View style={styles.famCheckboxChecked}>
                    <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.scannedMemberNameTxt} numberOfLines={1}>
                      {scanResultModal.scannedMemberName || memberName}
                    </Text>
                    <Text style={styles.scannedMemberTag}>Present · Checked In</Text>
                  </View>
                </View>
                <View style={styles.famPresentBadge}>
                  <Check size={11} color="#15803D" strokeWidth={2.5} style={{ marginRight: 3 }} />
                  <Text style={styles.famPresentBadgeTxt}>Present</Text>
                </View>
              </View>

              {/* Family Members Section */}
              <View style={styles.confirmDivider} />
              <View style={styles.confirmFamilyHeaderRow}>
                <Text style={styles.confirmSectionLabel}>FAMILY MEMBERS</Text>
                {scanResultModal.familyMembers.length > 0 && (
                  <Text style={styles.confirmFamilyCountTxt}>
                    {scanResultModal.familyMembers.filter(f => f.checked).length} of {scanResultModal.familyMembers.length} present
                  </Text>
                )}
              </View>

              {scanResultModal.familyLoading ? (
                <View style={styles.famLoadingWrap}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.famLoadingTxt}>Checking for family members...</Text>
                </View>
              ) : scanResultModal.familyMembers.length === 0 ? (
                <View style={styles.famEmptyWrap}>
                  <Text style={styles.famEmptyTxt}>No registered family members for this household.</Text>
                </View>
              ) : (
                <View style={styles.famListWrap}>
                  {scanResultModal.familyMembers.map((fam) => (
                    <TouchableOpacity
                      key={fam.id}
                      style={[styles.famRowItem, fam.checked && styles.famRowItemChecked]}
                      onPress={() => handleToggleFamilyAttendance(fam.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.famRowLeft}>
                        {fam.checked ? (
                          <View style={styles.famCheckboxChecked}>
                            <Check size={13} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        ) : (
                          <View style={styles.famCheckboxUnchecked} />
                        )}
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={[styles.famNameTxt, fam.checked && styles.famNameTxtChecked]} numberOfLines={1}>
                            {fam.name}
                          </Text>
                          <Text style={styles.famRelationTxt}>
                            {fam.relation ? `${fam.relation} · Family Member` : 'Family Member'}
                          </Text>
                        </View>
                      </View>

                      {fam.loading ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : fam.checked ? (
                        <View style={styles.famPresentBadge}>
                          <Check size={11} color="#15803D" strokeWidth={2.5} style={{ marginRight: 3 }} />
                          <Text style={styles.famPresentBadgeTxt}>Present</Text>
                        </View>
                      ) : (
                        <View style={styles.famAbsentBadge}>
                          <Text style={styles.famAbsentBadgeTxt}>Tap to mark</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Guest & Visitor Attendance Card ── */}
            <View style={styles.confirmGuestCard}>
              <View style={styles.confirmFamilyHeaderRow}>
                <View style={styles.confirmGuestIconWrap}>
                  <UserPlus size={18} color="#6D28D9" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmGuestTitle}>Guests & Visitors</Text>
                  <Text style={styles.confirmFamilySub}>Add friends or family visiting with you</Text>
                </View>
                {scanResultModal.guests && scanResultModal.guests.length > 0 && (
                  <View style={styles.guestCountBadge}>
                    <Text style={styles.guestCountBadgeTxt}>
                      {scanResultModal.guests.length} {scanResultModal.guests.length === 1 ? 'Guest' : 'Guests'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Add Guest Input Row */}
              <View style={styles.addGuestInputRow}>
                <View style={styles.addGuestInputWrap}>
                  <UserPlus size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.addGuestInput}
                    placeholder="Enter guest's full name..."
                    placeholderTextColor="#94A3B8"
                    value={guestNameInput}
                    onChangeText={setGuestNameInput}
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddGuest()}
                    editable={!isAddingGuest}
                  />
                  {guestNameInput.length > 0 && (
                    <TouchableOpacity onPress={() => setGuestNameInput('')} style={{ padding: 4 }}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.addGuestBtn,
                    (!guestNameInput.trim() || isAddingGuest) && styles.addGuestBtnDisabled
                  ]}
                  onPress={() => handleAddGuest()}
                  disabled={!guestNameInput.trim() || isAddingGuest}
                  activeOpacity={0.8}
                >
                  {isAddingGuest ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Plus size={15} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                      <Text style={styles.addGuestBtnTxt}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* List of Added Guests */}
              {scanResultModal.guests && scanResultModal.guests.length > 0 ? (
                <View style={styles.guestListWrap}>
                  {scanResultModal.guests.map((g) => (
                    <View key={g.id} style={styles.guestRowItem}>
                      <View style={styles.guestRowLeft}>
                        <View style={styles.guestAvatar}>
                          <Text style={styles.guestAvatarTxt}>
                            {g.name?.charAt(0)?.toUpperCase() || 'G'}
                          </Text>
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.guestNameTxt} numberOfLines={1}>
                            {g.name} (Guest)
                          </Text>
                          <Text style={styles.guestSubTxt}>
                            Present · Guest of {scanResultModal.scannedMemberName || memberName}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.guestPresentBadge}>
                          <Check size={11} color="#059669" strokeWidth={2.5} style={{ marginRight: 3 }} />
                          <Text style={styles.guestPresentBadgeTxt}>Present</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.guestRemoveBtn}
                          onPress={() => handleRemoveGuest(g.id, g.name)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.confirmButtonsWrap}>
              <TouchableOpacity 
                style={styles.confirmDoneBtn}
                onPress={() => setScanResultModal(prev => ({ ...prev, visible: false }))}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmDoneBtnTxt}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmViewBtn}
                onPress={() => {
                  setScanResultModal(prev => ({ ...prev, visible: false }));
                  setActiveTab('My attendance');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmViewBtnTxt}>View my attendance</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────
          CUSTOM CHURCH TOAST NOTIFICATION (Shows current church logo & message)
          ──────────────────────────────────────────────────────────────────────── */}
      {toastConfig.visible && (
        <Animated.View
          style={[
            styles.churchToastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Current Church Logo */}
          <View style={styles.churchToastLogoWrap}>
            {churchLogoUrl ? (
              <Image
                source={{ uri: churchLogoUrl }}
                style={styles.churchToastLogoImg}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.churchToastFallbackLogo}>
                <Building2 size={18} color="#ffffff" strokeWidth={2.2} />
              </View>
            )}
          </View>

          {/* Toast Message */}
          <Text style={styles.churchToastText} numberOfLines={2}>
            {toastConfig.message}
          </Text>

          {/* Green Checkmark */}
          <View style={styles.churchToastCheckWrap}>
            <CheckCircle2 size={19} color="#22C55E" strokeWidth={2.5} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 48,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSub: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 2,
    fontWeight: '500',
  },
  screenMainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Pill Track: Home | My attendance | Events
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#EAEFF5',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabPillTxt: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTxtActive: {
    color: '#0f172a',
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ── Today's Events Carousel & Header ──
  carouselContainer: {
    marginBottom: 24,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  carouselTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carouselSectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  eventCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  eventCountBadgeTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  pendingStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingStatusPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  allDoneStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  allDoneStatusPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  featuredCardPendingBorder: {
    borderColor: '#FCD34D',
    borderWidth: 1.5,
  },
  carouselTrackWrapper: {
    marginBottom: 4,
  },
  carouselLinesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
    gap: 8,
  },
  carouselLine: {
    height: 4.5,
    borderRadius: 3,
  },
  carouselLineActive: {
    width: 32,
  },
  carouselLineInactive: {
    width: 14,
  },

  // ── No Events Today Card ──
  noEventsTodayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  noEventsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  noEventsSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  noEventsActionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  viewEventsTabBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  viewEventsTabBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  quickCheckinPillBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2A925',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  quickCheckinPillTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },

  // ── Custom Church Toast ──
  churchToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 54,
    left: 20,
    right: 20,
    backgroundColor: '#18181B',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 99,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  churchToastLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  churchToastLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  churchToastFallbackLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchToastText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  churchToastCheckWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 4,
  },

  // ── Featured Card (Home Tab) ──
  featuredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  attendanceOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  attendanceCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  attendanceCompletedBadgeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  attendanceOpenTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  closesTxt: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  featuredCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0f172a',
    marginBottom: 6,
  },
  featuredCardTime: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 2,
  },
  featuredCardChurch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 3,
  },
  featuredCardChurchTxt: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
  },
  featuredCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanAttendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2A925',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  scanAttendanceBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  attendanceCompletedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  attendanceCompletedBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  topSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  topSuccessBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topSuccessIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSuccessBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  topSuccessBannerSub: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '500',
    marginTop: 1,
  },
  topSuccessVerifiedBadge: {
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topSuccessVerifiedTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewAttendeesFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  viewAttendeesFullBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  eyeBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Monthly Progress Card ──
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 18,
    marginBottom: 24,
  },
  circlePercentTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressEventCountTxt: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  progressSubTxt: {
    fontSize: 13,
    color: '#64748B',
  },

  // ── This Week Section ──
  thisWeekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thisWeekTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0f172a',
  },
  seeAllTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#B45309',
  },
  eventsListWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyListWrap: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyListTxt: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  eventRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 3,
  },
  eventRowSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
  },
  startsInTxt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Sub Filter Row (My Attendance & Events) ──
  subFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodPillActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  periodPillTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  periodPillTxtActive: {
    color: '#ffffff',
  },

  // ── Event Cards in "Events" Tab ──
  eventCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  openBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  openBadgeTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  eventCardDateTxt: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  eventCardTitle: {
    fontSize: 19,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0f172a',
    marginBottom: 4,
  },
  eventCardTime: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  eventCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  presentCountTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewListBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  viewListBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },

  // ── Status Badges ──
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentBadge: {
    backgroundColor: '#DCFCE7',
  },
  absentBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  presentBadgeTxt: {
    color: '#15803D',
  },
  absentBadgeTxt: {
    color: '#DC2626',
  },

  // ── "View list" Attendees Roster Modal ──
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rosterHeaderInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  rosterHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0f172a',
  },
  rosterHeaderSub: {
    fontSize: 12.5,
    color: '#64748B',
  },
  rosterQrBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterSearchWrap: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  rosterPillRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  rosterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  rosterPillActive: {
    backgroundColor: '#1e293b',
  },
  rosterPillTxt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  rosterPillTxtActive: {
    color: '#ffffff',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  avatarInitials: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitialsTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  youBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  attendeeTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },

  // ── Scan Options Modal ──
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  optionsModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  optionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  optionsModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionsModalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  optionsCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 14,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionItemSub: {
    fontSize: 12,
    color: '#64748b',
  },

  // ── Manual Code Modal ──
  manualModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  manualModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  manualIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  manualModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  manualModalSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  manualInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  manualBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  manualCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  manualCancelTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  manualConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  manualConfirmTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ── Decoding Overlay ──
  decodingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decodingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 260,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  decodingTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
    textAlign: 'center',
  },
  decodingSubTxt: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Success Modal ──
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 26,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  successModalSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  successDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    width: 60,
  },
  successDetailVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  successDoneBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  successDoneBtnTxt: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Live QR Scanner UI Styles ──
  liveScannerContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  scannerOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.65)',
    justifyContent: 'flex-start',
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scannerHeaderCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeaderCircleBtnActive: {
    backgroundColor: 'rgba(226, 169, 37, 0.25)',
    borderColor: '#E2A925',
  },
  scannerHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scannerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  scannerTargetPromptWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scannerTargetPromptSmall: {
    fontSize: 14.5,
    color: '#E2E8F0',
    textAlign: 'center',
    fontWeight: '400',
  },
  scannerTargetPromptEvent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FBBF24',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  scannerMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerSideMask: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(5, 10, 20, 0.65)',
  },
  scannerReticleBox: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  scannerReticleBoxScanned: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  cornerReticle: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerScanned: {
    borderColor: '#10B981 !important',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#EF4444',
    borderTopLeftRadius: 20,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3B82F6',
    borderTopRightRadius: 20,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#F59E0B',
    borderBottomRightRadius: 20,
  },
  scannerLaserLine: {
    height: 2.5,
    backgroundColor: '#F59E0B',
    marginHorizontal: 12,
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 4,
  },
  scannerScannedIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  scannerScannedTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  scannerOverlayBottom: {
    flex: 1.4,
    backgroundColor: 'rgba(5, 10, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  scannerInstructionWrap: {
    alignItems: 'center',
  },
  scannerInstructionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  scannerInstructionSub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  scannerBottomActionsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  scannerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  scannerActionPillTxt: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Permission view
  scannerPermissionWrap: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  scannerPermCloseBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerPermCard: {
    backgroundColor: '#131c2e',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scannerPermIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(226, 169, 37, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  scannerPermTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  scannerPermSub: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  scannerPermGrantBtn: {
    backgroundColor: '#E2A925',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  scannerPermGrantBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  scannerPermDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    width: '100%',
  },
  scannerPermLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scannerPermOrTxt: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  scannerPermAltBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scannerPermAltBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // ── Attendance Confirmation Screen Styles (Matches Screenshot 2) ──
  confirmScreenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  confirmContentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  confirmMainTitle: {
    fontSize: 29,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  confirmSubTitle: {
    fontSize: 15.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 36,
  },
  confirmDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  confirmDetailLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmDetailValue: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    textAlign: 'right',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  confirmButtonsWrap: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
  },
  confirmDoneBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 17,
    width: '100%',
    alignItems: 'center',
  },
  confirmDoneBtnTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmViewBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 17,
    width: '100%',
    alignItems: 'center',
  },
  confirmViewBtnTxt: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmScrollWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmFamilyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
    maxWidth: 380,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmFamilyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  confirmFamilyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmFamilyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmFamilySub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 1,
  },
  confirmSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    flex: 1,
  },
  confirmFamilyCountTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#15803D',
  },
  scannedMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  scannedMemberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scannedMemberNameTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scannedMemberTag: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 1,
  },
  famListWrap: {
    gap: 8,
    marginTop: 4,
  },
  famRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  famRowItemChecked: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  famRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  famCheckboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  famCheckboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  famNameTxt: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  famNameTxtChecked: {
    color: '#0F172A',
    fontWeight: '700',
  },
  famRelationTxt: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  famPresentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  famPresentBadgeTxt: {
    color: '#15803D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  famAbsentBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  famAbsentBadgeTxt: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  famLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  famLoadingTxt: {
    fontSize: 13,
    color: '#64748B',
  },
  famEmptyWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  famEmptyTxt: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // ── Guest & Visitor Attendance Styles ──
  confirmGuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
    maxWidth: 380,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmGuestIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmGuestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  guestCountBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  guestCountBadgeTxt: {
    color: '#6D28D9',
    fontSize: 11.5,
    fontWeight: '700',
  },
  addGuestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  addGuestInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  addGuestInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  addGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  addGuestBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  addGuestBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  guestListWrap: {
    gap: 8,
    marginTop: 10,
  },
  guestRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FAF5FF',
  },
  guestRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guestAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  guestNameTxt: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  guestSubTxt: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '500',
    marginTop: 1,
  },
  guestPresentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestPresentBadgeTxt: {
    color: '#15803D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  guestRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  guestActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  guestActionBtnTxt: {
    color: '#6D28D9',
    fontSize: 12.5,
    fontWeight: '700',
  },
  guestSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  guestSmallBtnTxt: {
    color: '#6D28D9',
    fontSize: 11.5,
    fontWeight: '700',
  },
  guestPillBadge: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestPillBadgeTxt: {
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  guestOfTxt: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 2,
    fontStyle: 'italic',
  },
  guestStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
  },
  guestStatusBadgeTxt: {
    color: '#6D28D9',
    fontWeight: '700',
  },
  rosterAddGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
  },
  rosterAddGuestBtnTxt: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '700',
  },
  rosterGuestInputBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },

  // ── Invalid QR Modal (matches Screenshot 2) ──
  invalidQrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    paddingHorizontal: 24,
  },
  invalidQrCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  invalidQrIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  invalidQrTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  invalidQrMsg: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  invalidQrBtn: {
    width: '100%',
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  invalidQrBtnTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  invalidQrCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  invalidQrCancelBtnTxt: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  scannerGeofencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  scannerGeofenceTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#BFDBFE',
  },
  geofenceDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  geofenceDistanceBadgeTxt: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
  },
  geofenceRuleBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 20,
    width: '100%',
  },
  geofenceRuleTxt: {
    color: '#B45309',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
