import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ToastAndroid,
  Linking,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import {
  ChevronLeft,
  Calendar,
  Users,
  QrCode,
  Download,
  Share2,
  X,
  Building2,
  Search,
  MessageCircle,
  Phone,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  UserX,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  MapPin,
  Eye,
  Check,
  AlertCircle,
  Sparkles,
  PieChart,
} from 'lucide-react-native';

import AttendanceService, { AttendanceRecord } from '../../services/AttendanceService';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

const COLORS = {
  ink: '#1A2D5A',
  inkDark: '#0F172A',
  inkSoft: '#64748B',
  inkLight: '#94A3B8',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  green: '#10B981',
  greenDark: '#047857',
  greenSoft: '#ECFDF5',
  blue: '#3B82F6',
  blueSoft: '#EFF6FF',
  purple: '#8B5CF6',
  purpleSoft: '#F5F3FF',
  red: '#EF4444',
  redSoft: '#FEF2F2',
  gold: '#F59E0B',
  goldSoft: '#FFFBEB',
  whatsapp: '#25D366',
  whatsappSoft: '#E8FBF0',
};

interface EventItemWithStats {
  id: string;
  title: string;
  date: string;
  dateObj: Date;
  dateStr: string;
  timeStr: string;
  location?: string;
  description?: string;
  presentCount: number;
  familyCount: number;
  guestCount: number;
  totalExpected: number;
  absentCount: number;
  turnoutPercent: number;
  status: 'Today' | 'Upcoming' | 'Past';
}

type TimelineFilter = 'All' | 'Upcoming' | 'Past';
type MemberReportFilter = 'Absent' | 'Present' | 'Guests' | 'All';

export default function AdminAttendance() {
  const { setActiveTab } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  const churchId = activeChurch?.id || '';
  const churchName = activeChurch?.name || 'Church of God';
  const churchCode = (activeChurch as any)?.code || (activeChurch as any)?.churchCode || '';

  // Navigation State
  const [selectedEvent, setSelectedEvent] = useState<EventItemWithStats | null>(null);

  // Data Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventDetailLoading, setEventDetailLoading] = useState(false);

  // Events & Members
  const [eventsList, setEventsList] = useState<EventItemWithStats[]>([]);
  const [churchMembers, setChurchMembers] = useState<any[]>([]);

  // Selected Event Details Data
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [reportFilter, setReportFilter] = useState<MemberReportFilter>('Absent');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Event List Search & Filter
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('All');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  // Official Church QR Code Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<any>(null);

  // ─── Initial Load ────────────────────────────────────────────────────────
  useEffect(() => {
    loadAllAttendanceData();
  }, [churchId]);

  const loadAllAttendanceData = async () => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Church Members Roster
      const members = await AttendanceService.getChurchMembers(churchId);
      setChurchMembers(members);

      // 2. Fetch Events from churches/{churchId}/events and attendanceRequests concurrently
      const [eventsSnap, reqsSnap] = await Promise.allSettled([
        firestore()
          .collection('churches')
          .doc(churchId)
          .collection('events')
          .get(),
        firestore()
          .collection('churches')
          .doc(churchId)
          .collection('attendanceRequests')
          .get(),
      ]);

      const rawEventsMap = new Map<string, any>();

      if (eventsSnap.status === 'fulfilled' && !eventsSnap.value.empty) {
        eventsSnap.value.forEach(doc => {
          rawEventsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }

      if (reqsSnap.status === 'fulfilled' && !reqsSnap.value.empty) {
        reqsSnap.value.forEach(doc => {
          const d = doc.data();
          if (!rawEventsMap.has(doc.id)) {
            rawEventsMap.set(doc.id, {
              id: doc.id,
              title: d.title || 'Church Service',
              name: d.title || 'Church Service',
              date: d.date || '',
              startTime: d.startTime || '',
              endTime: d.endTime || '',
              description: d.description || '',
              location: activeChurch?.address || churchName,
            });
          }
        });
      }

      const totalExpected = members.length;
      const todayStr = new Date().toISOString().split('T')[0];
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // 3. Enrich events with attendance counts
      const enrichedEvents: EventItemWithStats[] = await Promise.all(
        Array.from(rawEventsMap.values()).map(async (ev) => {
          let dateObj = new Date();
          let dateStr = 'Upcoming';
          let timeStr = 'Service Time';

          if (ev.date) {
            const parsed = new Date(ev.date);
            if (!isNaN(parsed.getTime())) dateObj = parsed;
          } else if (ev.startTime) {
            const parsed = new Date(ev.startTime);
            if (!isNaN(parsed.getTime())) dateObj = parsed;
          } else if (ev.createdAt?.toDate) {
            dateObj = ev.createdAt.toDate();
          }

          try {
            dateStr = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } catch {}

          if (ev.startTime || ev.time) {
            try {
              const s = ev.startTime ? new Date(ev.startTime) : dateObj;
              const sFormatted = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              if (ev.endTime) {
                const e = new Date(ev.endTime);
                const eFormatted = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                timeStr = `${sFormatted} - ${eFormatted}`;
              } else {
                timeStr = sFormatted;
              }
            } catch {
              timeStr = ev.time || 'All Day';
            }
          }

          // Pre-fetch count of attendees
          let presentCount = 0;
          let guestCount = 0;
          let familyCount = 0;

          try {
            const attendeesSnap = await firestore()
              .collection('churches')
              .doc(churchId)
              .collection('events')
              .doc(ev.id)
              .collection('attendees')
              .get();

            presentCount = attendeesSnap.size;

            attendeesSnap.forEach(doc => {
              const d = doc.data();
              const isGuest = Boolean(d.isGuest || doc.id.startsWith('guest_') || (d.memberName && d.memberName.includes('(Guest)')));
              const isFamily = !isGuest && (d.method === 'FAMILY_CHECKIN' || doc.id.startsWith('fam_') || (d.memberName && d.memberName.includes('Family')));
              if (isGuest) guestCount++;
              if (isFamily) familyCount++;
            });
          } catch {
            presentCount = 0;
          }

          const evDateOnly = dateObj.toISOString().split('T')[0];
          let status: 'Today' | 'Upcoming' | 'Past' = 'Past';
          if (evDateOnly === todayStr) {
            status = 'Today';
          } else if (dateObj >= startOfToday) {
            status = 'Upcoming';
          }

          const absentCount = Math.max(0, totalExpected - Math.max(0, presentCount - guestCount));
          const turnoutPercent = totalExpected > 0 ? Math.min(100, Math.round((presentCount / totalExpected) * 100)) : 0;

          return {
            id: ev.id,
            title: ev.title || ev.name || 'Church Service',
            date: ev.date || evDateOnly,
            dateObj,
            dateStr,
            timeStr,
            location: ev.location || activeChurch?.address || churchName,
            description: ev.description || '',
            presentCount,
            familyCount,
            guestCount,
            totalExpected,
            absentCount,
            turnoutPercent,
            status,
          };
        })
      );

      // Sort: Today first, then Upcoming (asc), then Past (desc)
      enrichedEvents.sort((a, b) => {
        if (a.status === 'Today' && b.status !== 'Today') return -1;
        if (b.status === 'Today' && a.status !== 'Today') return 1;
        if (a.status === 'Upcoming' && b.status === 'Past') return -1;
        if (b.status === 'Upcoming' && a.status === 'Past') return 1;
        return b.dateObj.getTime() - a.dateObj.getTime();
      });

      setEventsList(enrichedEvents);
    } catch (error) {
      console.error('[AdminAttendance] Error loading attendance events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── Select Event to View Report ─────────────────────────────────────────
  const handleSelectEvent = async (event: EventItemWithStats) => {
    setSelectedEvent(event);
    setEventDetailLoading(true);
    setReportFilter('Absent');
    setSearchMemberQuery('');

    try {
      const records = await AttendanceService.getEventAttendees(churchId, event.id);
      setAttendees(records);
    } catch (e) {
      console.error('[AdminAttendance] Error loading attendees for event:', e);
      setAttendees([]);
    } finally {
      setEventDetailLoading(false);
    }
  };

  const handleRefreshSelectedEvent = async () => {
    if (!selectedEvent) return;
    setEventDetailLoading(true);
    try {
      const records = await AttendanceService.getEventAttendees(churchId, selectedEvent.id);
      setAttendees(records);

      // Update event stats in state
      let presentCount = records.length;
      let guestCount = 0;
      let familyCount = 0;

      records.forEach(r => {
        const isGuest = Boolean(r.isGuest || r.id?.startsWith('guest_') || (r.memberName && r.memberName.includes('(Guest)')));
        const isFamily = !isGuest && (r.method === 'FAMILY_CHECKIN' || r.id?.startsWith('fam_') || (r.memberName && r.memberName.includes('Family')));
        if (isGuest) guestCount++;
        if (isFamily) familyCount++;
      });

      const totalExpected = churchMembers.length;
      const absentCount = Math.max(0, totalExpected - Math.max(0, presentCount - guestCount));
      const turnoutPercent = totalExpected > 0 ? Math.min(100, Math.round((presentCount / totalExpected) * 100)) : 0;

      setSelectedEvent(prev => prev ? {
        ...prev,
        presentCount,
        familyCount,
        guestCount,
        absentCount,
        turnoutPercent,
      } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setEventDetailLoading(false);
    }
  };

  // ─── Compute Absent, Present & Guests for Selected Event ─────────────────
  const reportData = useMemo(() => {
    if (!selectedEvent) {
      return {
        presentList: [],
        absentList: [],
        guestsList: [],
        totalExpected: 0,
        presentCount: 0,
        absentCount: 0,
        familyCount: 0,
        guestCount: 0,
        turnoutPercent: 0,
      };
    }

    const presentList: any[] = [];
    const guestsList: any[] = [];
    const attendedMemberIds = new Set<string>();
    const attendedPhones = new Set<string>();

    attendees.forEach(a => {
      const isGuest = Boolean(
        a.isGuest ||
        a.id?.startsWith('guest_') ||
        a.memberId?.startsWith('guest_') ||
        (a.memberName && a.memberName.includes('(Guest)'))
      );

      const mId = a.memberId || a.id;
      if (mId) attendedMemberIds.add(mId);

      const cleanPhone = a.memberPhone ? String(a.memberPhone).replace(/\D/g, '').slice(-10) : '';
      if (cleanPhone) attendedPhones.add(cleanPhone);

      if (isGuest) {
        guestsList.push(a);
      } else {
        presentList.push(a);
      }
    });

    // Absent members = Registered church members who did NOT attend
    const absentList = churchMembers.filter(m => {
      const mId = m.id || m.Id;
      const cleanPhone = (m.phone || m.MobilePhone || '').replace(/\D/g, '').slice(-10);

      const attendedById = mId ? attendedMemberIds.has(mId) : false;
      const attendedByPhone = cleanPhone ? attendedPhones.has(cleanPhone) : false;

      return !attendedById && !attendedByPhone;
    });

    const totalExpected = churchMembers.length;
    const presentCount = attendees.length;
    const guestCount = guestsList.length;
    const familyCount = presentList.filter(
      p => p.method === 'FAMILY_CHECKIN' || p.id?.startsWith('fam_') || (p.memberName && p.memberName.includes('Family'))
    ).length;
    const absentCount = absentList.length;
    const turnoutPercent = totalExpected > 0 ? Math.min(100, Math.round((presentList.length / totalExpected) * 100)) : 0;

    return {
      presentList,
      absentList,
      guestsList,
      totalExpected,
      presentCount,
      absentCount,
      familyCount,
      guestCount,
      turnoutPercent,
    };
  }, [selectedEvent, attendees, churchMembers]);

  // Filtered Member List in Report
  const filteredReportMembers = useMemo(() => {
    let list: any[] = [];

    if (reportFilter === 'Absent') {
      list = reportData.absentList;
    } else if (reportFilter === 'Present') {
      list = reportData.presentList;
    } else if (reportFilter === 'Guests') {
      list = reportData.guestsList;
    } else {
      // All
      list = [...reportData.presentList, ...reportData.guestsList, ...reportData.absentList];
    }

    if (!searchMemberQuery.trim()) return list;

    const q = searchMemberQuery.trim().toLowerCase();
    return list.filter(m => {
      const name = (m.name || m.Name || m.memberName || '').toLowerCase();
      const phone = (m.phone || m.MobilePhone || m.memberPhone || '').replace(/\D/g, '');
      return name.includes(q) || phone.includes(q);
    });
  }, [reportData, reportFilter, searchMemberQuery]);

  // Filtered Events List
  const filteredEvents = useMemo(() => {
    let list = eventsList;

    if (timelineFilter === 'Upcoming') {
      list = list.filter(e => e.status === 'Today' || e.status === 'Upcoming');
    } else if (timelineFilter === 'Past') {
      list = list.filter(e => e.status === 'Past');
    }

    if (!searchEventQuery.trim()) return list;

    const q = searchEventQuery.trim().toLowerCase();
    return list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.dateStr.toLowerCase().includes(q) ||
      (e.location && e.location.toLowerCase().includes(q))
    );
  }, [eventsList, timelineFilter, searchEventQuery]);

  // ─── WhatsApp Deeplink Action ─────────────────────────────────────────────
  const handleWhatsApp = (memberPhone?: string, memberName?: string, eventTitle?: string) => {
    if (!memberPhone) {
      Alert.alert(
        'Phone Number Not Found',
        `${memberName || 'This member'} does not have a registered mobile phone number in church records.`
      );
      return;
    }

    const clean = String(memberPhone).replace(/\D/g, '');
    if (!clean || clean.length < 8) {
      Alert.alert('Invalid Phone Number', 'The phone number format is invalid.');
      return;
    }

    // Default to country code 91 if standard 10 digit Indian number without prefix
    const cleanPhone = clean.length === 10 ? `91${clean}` : clean;
    const message = `Hello ${memberName || 'Brother/Sister'}, greetings from ${churchName}! We missed you today at ${eventTitle || 'church'}. We hope everything is well with you and your family. Please let us know if you need any prayers. God bless you! 🙏`;
    const encoded = encodeURIComponent(message);

    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    Linking.openURL(appUrl).catch(() => {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert(
          'WhatsApp Not Available',
          'Could not open WhatsApp. Please check if WhatsApp is installed on your device.'
        );
      });
    });
  };

  // ─── Phone Call Action ────────────────────────────────────────────────────
  const handleCall = (memberPhone?: string) => {
    if (!memberPhone) {
      Alert.alert('Phone Number Not Found', 'No phone number is registered for this member.');
      return;
    }
    Linking.openURL(`tel:${memberPhone}`).catch(() => {
      Alert.alert('Call Error', 'Could not open phone dialer.');
    });
  };

  // ─── Church QR Code Save & Share ──────────────────────────────────────────
  const handleSaveQR = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (data: string) => {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant gallery permissions to save the QR code.');
            return;
          }

          const filename = `church-${(churchCode || 'attendance').toLowerCase()}-qr.png`;
          const filepath = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(filepath, data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await MediaLibrary.saveToLibraryAsync(filepath);

          if (Platform.OS === 'android') {
            ToastAndroid.show('Church QR Code saved to gallery', ToastAndroid.SHORT);
          } else {
            Alert.alert('Saved', 'Church QR Code saved to gallery successfully.');
          }
        } catch {
          Alert.alert('Error', 'Failed to save QR Code.');
        }
      });
    }
  };

  const handleShareQR = () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (data: string) => {
        try {
          const filename = `church-${(churchCode || 'attendance').toLowerCase()}-qr.png`;
          const filepath = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(filepath, data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filepath, {
              mimeType: 'image/png',
              dialogTitle: `${churchName} Attendance QR Code`,
            });
          }
        } catch {
          Alert.alert('Error', 'Failed to share QR Code.');
        }
      });
    }
  };

  // ─── SVG Donut Chart Renderer ─────────────────────────────────────────────
  const renderDonutChart = () => {
    const size = 170;
    const strokeWidth = 18;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    const total = Math.max(1, reportData.totalExpected + reportData.guestCount);
    const presentReg = Math.max(0, reportData.presentList.length - reportData.familyCount);
    const family = reportData.familyCount;
    const guests = reportData.guestCount;
    const absent = reportData.absentCount;

    const presentRegPct = presentReg / total;
    const familyPct = family / total;
    const guestsPct = guests / total;
    const absentPct = absent / total;

    const presentRegStroke = presentRegPct * circumference;
    const familyStroke = familyPct * circumference;
    const guestsStroke = guestsPct * circumference;
    const absentStroke = absentPct * circumference;

    let offset = 0;
    const seg1Offset = offset;
    offset += presentRegStroke;
    const seg2Offset = offset;
    offset += familyStroke;
    const seg3Offset = offset;
    offset += guestsStroke;
    const seg4Offset = offset;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartRingWrap}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Background Base Ring */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Segment 1: Present Members (Green) */}
              {presentRegStroke > 0 && (
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={COLORS.green}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${presentRegStroke} ${circumference}`}
                  strokeDashoffset={-seg1Offset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Segment 2: Family Members (Blue) */}
              {familyStroke > 0 && (
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={COLORS.blue}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${familyStroke} ${circumference}`}
                  strokeDashoffset={-seg2Offset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Segment 3: Guests & Visitors (Purple) */}
              {guestsStroke > 0 && (
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={COLORS.purple}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${guestsStroke} ${circumference}`}
                  strokeDashoffset={-seg3Offset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Segment 4: Absent Members (Red) */}
              {absentStroke > 0 && (
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={COLORS.red}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${absentStroke} ${circumference}`}
                  strokeDashoffset={-seg4Offset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </G>
          </Svg>

          {/* Center Callout */}
          <View style={styles.chartCenterCallout}>
            <Text style={styles.chartCenterNumber}>{reportData.turnoutPercent}%</Text>
            <Text style={styles.chartCenterLabel}>Turnout</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.chartLegendWrap}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
            <Text style={styles.legendLabel}>Present Members</Text>
            <Text style={styles.legendValue}>{presentReg}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.blue }]} />
            <Text style={styles.legendLabel}>Household Family</Text>
            <Text style={styles.legendValue}>{family}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.purple }]} />
            <Text style={styles.legendLabel}>Guests & Visitors</Text>
            <Text style={styles.legendValue}>{guests}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.legendLabel}>Absent Members</Text>
            <Text style={styles.legendValue}>{absent}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── Render Loading Screen ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
        <Text style={styles.loadingTxt}>Loading attendance reports...</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW B: EVENT ATTENDANCE REPORT & ABSENTEE FOLLOW-UP
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedEvent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />

        {/* Top Header */}
        <LinearGradient colors={['#1A2D5A', '#253B73']} style={styles.headerGradient}>
          <View style={styles.reportNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedEvent(null)}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color="#FFFFFF" />
              <Text style={styles.backBtnTxt}>All Events</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={handleRefreshSelectedEvent}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.reportEventTitle} numberOfLines={2}>
            {selectedEvent.title}
          </Text>

          <View style={styles.reportMetaRow}>
            <View style={styles.reportMetaItem}>
              <Calendar size={13} color="#FCD34D" style={{ marginRight: 5 }} />
              <Text style={styles.reportMetaTxt}>{selectedEvent.dateStr}</Text>
            </View>
            <View style={styles.reportMetaItem}>
              <Clock size={13} color="#FCD34D" style={{ marginRight: 5 }} />
              <Text style={styles.reportMetaTxt}>{selectedEvent.timeStr}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {eventDetailLoading ? (
            <View style={styles.centerLoaderWrap}>
              <ActivityIndicator size="small" color={COLORS.ink} />
              <Text style={styles.smallLoadingTxt}>Updating event statistics...</Text>
            </View>
          ) : null}

          {/* ── 5 Key Statistics Cards (Requirement 3) ── */}
          <Text style={styles.sectionHeading}>EVENT ATTENDANCE BREAKDOWN</Text>

          <View style={styles.kpiGrid}>
            {/* 1. Expected Members */}
            <View style={[styles.kpiCard, { borderColor: '#CBD5E1' }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Users size={17} color="#475569" strokeWidth={2.2} />
              </View>
              <Text style={styles.kpiNumber}>{reportData.totalExpected}</Text>
              <Text style={styles.kpiLabel}>Expected</Text>
              <Text style={styles.kpiSub}>Registered Roster</Text>
            </View>

            {/* 2. Total Present */}
            <View style={[styles.kpiCard, { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <UserCheck size={17} color={COLORS.greenDark} strokeWidth={2.2} />
              </View>
              <Text style={[styles.kpiNumber, { color: COLORS.greenDark }]}>{reportData.presentCount}</Text>
              <Text style={[styles.kpiLabel, { color: COLORS.greenDark }]}>Present</Text>
              <Text style={styles.kpiSub}>{reportData.turnoutPercent}% Turnout</Text>
            </View>

            {/* 3. Absent Members */}
            <View style={[styles.kpiCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <UserX size={17} color="#DC2626" strokeWidth={2.2} />
              </View>
              <Text style={[styles.kpiNumber, { color: '#DC2626' }]}>{reportData.absentCount}</Text>
              <Text style={[styles.kpiLabel, { color: '#DC2626' }]}>Absent</Text>
              <Text style={styles.kpiSub}>Needs Follow-up</Text>
            </View>

            {/* 4. Family Members */}
            <View style={[styles.kpiCard, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Users size={17} color="#1D4ED8" strokeWidth={2.2} />
              </View>
              <Text style={[styles.kpiNumber, { color: '#1D4ED8' }]}>{reportData.familyCount}</Text>
              <Text style={[styles.kpiLabel, { color: '#1D4ED8' }]}>Family</Text>
              <Text style={styles.kpiSub}>Household Attendees</Text>
            </View>

            {/* 5. Guests & Visitors */}
            <View style={[styles.kpiCard, { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <UserPlus size={17} color="#6D28D9" strokeWidth={2.2} />
              </View>
              <Text style={[styles.kpiNumber, { color: '#6D28D9' }]}>{reportData.guestCount}</Text>
              <Text style={[styles.kpiLabel, { color: '#6D28D9' }]}>Guests</Text>
              <Text style={styles.kpiSub}>Visitors Brought</Text>
            </View>
          </View>

          {/* ── Attendance Chart (Requirement 2) ── */}
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <PieChart size={18} color={COLORS.ink} style={{ marginRight: 8 }} />
              <Text style={styles.chartCardTitle}>Attendance Distribution Chart</Text>
            </View>
            {renderDonutChart()}
          </View>

          {/* ── Absent Members & Follow-up Section (Requirements 4 & 5) ── */}
          <View style={styles.rosterSectionHeader}>
            <Text style={styles.sectionHeading}>MEMBER ROSTER & PASTORAL OUTREACH</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.rosterFilterRow}>
            <TouchableOpacity
              style={[styles.rosterFilterTab, reportFilter === 'Absent' && styles.rosterFilterTabActiveRed]}
              onPress={() => setReportFilter('Absent')}
            >
              <Text style={[styles.rosterFilterTabTxt, reportFilter === 'Absent' && styles.rosterFilterTabTxtActiveRed]}>
                Absent ({reportData.absentCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rosterFilterTab, reportFilter === 'Present' && styles.rosterFilterTabActiveGreen]}
              onPress={() => setReportFilter('Present')}
            >
              <Text style={[styles.rosterFilterTabTxt, reportFilter === 'Present' && styles.rosterFilterTabTxtActiveGreen]}>
                Present ({reportData.presentList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rosterFilterTab, reportFilter === 'Guests' && styles.rosterFilterTabActivePurple]}
              onPress={() => setReportFilter('Guests')}
            >
              <Text style={[styles.rosterFilterTabTxt, reportFilter === 'Guests' && styles.rosterFilterTabTxtActivePurple]}>
                Guests ({reportData.guestCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rosterFilterTab, reportFilter === 'All' && styles.rosterFilterTabActive]}
              onPress={() => setReportFilter('All')}
            >
              <Text style={[styles.rosterFilterTabTxt, reportFilter === 'All' && styles.rosterFilterTabTxtActive]}>
                All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${reportFilter.toLowerCase()} members...`}
              placeholderTextColor="#94A3B8"
              value={searchMemberQuery}
              onChangeText={setSearchMemberQuery}
            />
            {searchMemberQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchMemberQuery('')}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Member Rows */}
          {filteredReportMembers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <CheckCircle2 size={32} color="#10B981" />
              <Text style={styles.emptyTitle}>
                {reportFilter === 'Absent'
                  ? 'No Absent Members Found'
                  : `No ${reportFilter} records match your search`}
              </Text>
              <Text style={styles.emptySub}>
                {reportFilter === 'Absent'
                  ? 'Great turnout! Everyone attended this service.'
                  : 'Try searching with a different name or number.'}
              </Text>
            </View>
          ) : (
            <View style={styles.memberListWrap}>
              {filteredReportMembers.map((item, idx) => {
                const name = item.name || item.Name || item.memberName || 'Member';
                const phone = item.phone || item.MobilePhone || item.memberPhone || '';
                const isAbsent = reportFilter === 'Absent' || reportData.absentList.some(a => (a.id && a.id === item.id) || (a.phone && a.phone === phone));
                const isGuest = Boolean(item.isGuest || item.id?.startsWith('guest_') || item.memberName?.includes('(Guest)'));

                return (
                  <View key={item.id || idx} style={styles.memberRowCard}>
                    <View style={styles.memberRowTop}>
                      {/* Initials Avatar */}
                      <View style={[
                        styles.memberAvatar,
                        isAbsent ? styles.memberAvatarAbsent : isGuest ? styles.memberAvatarGuest : styles.memberAvatarPresent
                      ]}>
                        <Text style={[
                          styles.memberAvatarTxt,
                          isAbsent ? styles.memberAvatarTxtAbsent : isGuest ? styles.memberAvatarTxtGuest : styles.memberAvatarTxtPresent
                        ]}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      {/* Name & Phone */}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.memberNameTxt} numberOfLines={1}>{name}</Text>
                          {isAbsent ? (
                            <View style={styles.absentPill}>
                              <Text style={styles.absentPillTxt}>Absent</Text>
                            </View>
                          ) : isGuest ? (
                            <View style={styles.guestPill}>
                              <Text style={styles.guestPillTxt}>Guest</Text>
                            </View>
                          ) : (
                            <View style={styles.presentPill}>
                              <Text style={styles.presentPillTxt}>Present</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.memberPhoneTxt}>
                          {phone ? phone : 'No phone number registered'}
                        </Text>

                        {isGuest && item.invitedByMemberName ? (
                          <Text style={styles.guestInviterTxt}>
                            Brought by {item.invitedByMemberName}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Actions Row: WhatsApp Deeplink & Call for Absent Members */}
                    {isAbsent ? (
                      <View style={styles.absentActionsRow}>
                        <TouchableOpacity
                          style={styles.whatsappBtn}
                          onPress={() => handleWhatsApp(phone, name, selectedEvent.title)}
                          activeOpacity={0.8}
                        >
                          <MessageCircle size={15} color="#15803D" strokeWidth={2.4} style={{ marginRight: 6 }} />
                          <Text style={styles.whatsappBtnTxt}>WhatsApp</Text>
                        </TouchableOpacity>

                        {phone ? (
                          <TouchableOpacity
                            style={styles.callBtn}
                            onPress={() => handleCall(phone)}
                            activeOpacity={0.8}
                          >
                            <Phone size={14} color="#1E3A8A" strokeWidth={2.2} style={{ marginRight: 5 }} />
                            <Text style={styles.callBtnTxt}>Call</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW A: EVENTS ATTENDANCE LIST & SELECTOR
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />

      {/* ── Hero Header ── */}
      <LinearGradient colors={['#1A2D5A', '#253B73']} style={styles.heroGradient}>
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity
            onPress={() => setActiveTab(0)}
            style={styles.heroBackBtn}
            activeOpacity={0.8}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
            <Text style={styles.heroBackTxt}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroQrBtn}
            onPress={() => setShowQRModal(true)}
            activeOpacity={0.85}
          >
            <QrCode size={15} color="#1A2D5A" />
            <Text style={styles.heroQrBtnTxt}>Church QR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroMainTitle}>Attendance Reports</Text>
        <Text style={styles.heroSubTitle}>
          Event-wise statistics, charts & absentee pastoral follow-up
        </Text>
      </LinearGradient>

      {/* ── Church QR Code Modal ── */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrModalTitle}>{churchName}</Text>
                <Text style={styles.qrModalSub}>Official Attendance QR Code</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQRModal(false)} style={styles.qrModalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrWrapper}>
              <QRCode
                value={AttendanceService.generateAttendanceQRPayload(churchId, churchName, churchCode)}
                size={210}
                getRef={(ref: any) => {
                  qrRef.current = ref;
                }}
              />
            </View>

            <Text style={styles.qrHintTxt}>
              Members can scan this QR code with the WeChristian app to check in.
            </Text>

            <View style={styles.qrActionButtons}>
              <TouchableOpacity style={styles.qrSaveBtn} onPress={handleSaveQR}>
                <Download size={16} color="#1A2D5A" />
                <Text style={styles.qrSaveBtnTxt}>Save to Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.qrShareBtn} onPress={handleShareQR}>
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.qrShareBtnTxt}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Main Content ── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeline Filter Pills: All | Upcoming | Past */}
        <View style={styles.filterPillRow}>
          {(['All', 'Upcoming', 'Past'] as TimelineFilter[]).map(tf => {
            const isActive = timelineFilter === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setTimelineFilter(tf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillTxt, isActive && styles.filterPillTxtActive]}>
                  {tf} Events
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title or date..."
            placeholderTextColor="#94A3B8"
            value={searchEventQuery}
            onChangeText={setSearchEventQuery}
          />
          {searchEventQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchEventQuery('')}>
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* List of Events */}
        <View style={styles.eventsListHeaderRow}>
          <Text style={styles.sectionHeading}>SELECT AN EVENT TO VIEW REPORT</Text>
          <Text style={styles.eventsCountTxt}>{filteredEvents.length} events</Text>
        </View>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Calendar size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptySub}>
              {searchEventQuery
                ? 'No events match your search query.'
                : 'No church events have been scheduled yet.'}
            </Text>
          </View>
        ) : (
          <View style={styles.eventsCardList}>
            {filteredEvents.map(event => {
              const isToday = event.status === 'Today';

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventReportCard, isToday && styles.eventReportCardToday]}
                  onPress={() => handleSelectEvent(event)}
                  activeOpacity={0.85}
                >
                  {/* Top Badge & Date */}
                  <View style={styles.eventCardTop}>
                    <View style={[
                      styles.statusPill,
                      isToday ? styles.statusPillToday : event.status === 'Upcoming' ? styles.statusPillUpcoming : styles.statusPillPast
                    ]}>
                      <Text style={[
                        styles.statusPillTxt,
                        isToday ? styles.statusPillTxtToday : event.status === 'Upcoming' ? styles.statusPillTxtUpcoming : styles.statusPillTxtPast
                      ]}>
                        {event.status}
                      </Text>
                    </View>

                    <Text style={styles.eventCardDate}>{event.dateStr}</Text>
                  </View>

                  {/* Title & Time */}
                  <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.eventCardTime}>{event.timeStr}</Text>

                  {/* Mini Metrics Row */}
                  <View style={styles.eventMetricsRow}>
                    <View style={styles.miniMetric}>
                      <UserCheck size={14} color={COLORS.greenDark} style={{ marginRight: 4 }} />
                      <Text style={styles.miniMetricVal}>{event.presentCount}</Text>
                      <Text style={styles.miniMetricLbl}>Present</Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <TrendingUp size={14} color={COLORS.blue} style={{ marginRight: 4 }} />
                      <Text style={styles.miniMetricVal}>{event.turnoutPercent}%</Text>
                      <Text style={styles.miniMetricLbl}>Turnout</Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <UserX size={14} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={[styles.miniMetricVal, { color: '#DC2626' }]}>{event.absentCount}</Text>
                      <Text style={styles.miniMetricLbl}>Absent</Text>
                    </View>
                  </View>

                  {/* View Report Link */}
                  <View style={styles.viewReportAction}>
                    <Text style={styles.viewReportActionTxt}>View Report & Charts</Text>
                    <ChevronLeft size={16} color={COLORS.ink} style={{ transform: [{ rotate: '180deg' }] }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTxt: {
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ── Hero Header ──
  heroGradient: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 22,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBackTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  heroQrBtnTxt: {
    color: '#1A2D5A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },
  heroSubTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },

  // ── Report Detail Header ──
  headerGradient: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 20,
  },
  reportNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  backBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportEventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  reportMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportMetaTxt: {
    color: '#FCD34D',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // ── Filters & Search ──
  filterPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  filterPillTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTxtActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eventsListHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  eventsCountTxt: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ── Events List Cards ──
  eventsCardList: {
    gap: 12,
  },
  eventReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  eventReportCardToday: {
    borderColor: '#86EFAC',
    backgroundColor: '#FAFDF9',
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillToday: {
    backgroundColor: '#DCFCE7',
  },
  statusPillUpcoming: {
    backgroundColor: '#EFF6FF',
  },
  statusPillPast: {
    backgroundColor: '#F1F5F9',
  },
  statusPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPillTxtToday: {
    color: '#15803D',
  },
  statusPillTxtUpcoming: {
    color: '#1D4ED8',
  },
  statusPillTxtPast: {
    color: '#64748B',
  },
  eventCardDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  eventCardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  eventCardTime: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 12,
  },
  eventMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  miniMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMetricVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 4,
  },
  miniMetricLbl: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  viewReportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewReportActionTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A2D5A',
  },

  // ── 5 KPI Cards Grid ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  kpiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 1,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Donut Chart Card ──
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartRingWrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chartCenterCallout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartCenterLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  chartLegendWrap: {
    width: '100%',
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  // ── Roster & Absentee List ──
  rosterSectionHeader: {
    marginBottom: 10,
  },
  rosterFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rosterFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rosterFilterTabActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  rosterFilterTabActiveRed: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  rosterFilterTabActiveGreen: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  rosterFilterTabActivePurple: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  rosterFilterTabTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  rosterFilterTabTxtActive: {
    color: '#FFFFFF',
  },
  rosterFilterTabTxtActiveRed: {
    color: '#FFFFFF',
  },
  rosterFilterTabTxtActiveGreen: {
    color: '#FFFFFF',
  },
  rosterFilterTabTxtActivePurple: {
    color: '#FFFFFF',
  },
  memberListWrap: {
    gap: 10,
  },
  memberRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  memberRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarAbsent: {
    backgroundColor: '#FEE2E2',
  },
  memberAvatarPresent: {
    backgroundColor: '#DCFCE7',
  },
  memberAvatarGuest: {
    backgroundColor: '#EDE9FE',
  },
  memberAvatarTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
  memberAvatarTxtAbsent: {
    color: '#DC2626',
  },
  memberAvatarTxtPresent: {
    color: '#15803D',
  },
  memberAvatarTxtGuest: {
    color: '#6D28D9',
  },
  memberNameTxt: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberPhoneTxt: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  guestInviterTxt: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 2,
    fontStyle: 'italic',
  },
  absentPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  absentPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  presentPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  presentPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  guestPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  guestPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // ── Absent Follow-up Actions ──
  absentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  whatsappBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803D',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // ── Empty State ──
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  centerLoaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  smallLoadingTxt: {
    fontSize: 12,
    color: '#64748B',
  },

  // ── QR Modal Styles ──
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
  },
  qrModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  qrModalCloseBtn: {
    padding: 4,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrHintTxt: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  qrActionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  qrSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
  },
  qrSaveBtnTxt: {
    color: '#1A2D5A',
    fontSize: 13,
    fontWeight: '700',
  },
  qrShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    borderRadius: 12,
    paddingVertical: 12,
  },
  qrShareBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
