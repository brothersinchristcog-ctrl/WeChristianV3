import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Alert,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ClipboardCheck,
  Sparkles,
  User,
  HeartHandshake,
  Megaphone,
  Plus,
  AlertTriangle,
  Heart,
  Navigation,
  Map as MapIcon,
  Home,
  X,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import CareCellService from '../../services/CareCellService';
import { formatDateDisplay } from '../../utils/DateUtils';
import { useAdminTheme, createAdminThemedStyles } from '../../utils/adminThemeHelper';
import {
  CareCell,
  CareCellMembership,
  CareCellMeeting,
  CareCellAttendance,
  CareCellPrayerRequest,
  CareCellAnnouncement,
  CareCellFollowup,
  CareCellVisit,
  CareCellVisitMemberResponse,
  MemberVisitResponseStatus,
} from '../../types/CareCellTypes';
import CareCellPrayerModal from '../admin/care_cells/components/CareCellPrayerModal';
import CareCellFollowupModal from '../admin/care_cells/components/CareCellFollowupModal';
import CareCellAnnouncementModal from '../admin/care_cells/components/CareCellAnnouncementModal';
import CareCellMapModal from '../admin/care_cells/components/CareCellMapModal';

const { width } = Dimensions.get('window');

export default function CareCellScreen({ navigation, route }: any) {
  const { isDark, screenBg, cardSurface, secondarySurface, primaryText, secondaryText, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const insets = useSafeAreaInsets();
  const { member, user } = useAuth();
  const { activeChurch } = useChurch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cell & Membership Data
  const [careCell, setCareCell] = useState<CareCell | null>(null);
  const [membership, setMembership] = useState<CareCellMembership | null>(null);
  const [fellowMembers, setFellowMembers] = useState<CareCellMembership[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<CareCellMeeting[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<CareCellAttendance[]>([]);

  // Phase 2: Prayers, Notices, Followups
  const [cellPrayers, setCellPrayers] = useState<CareCellPrayerRequest[]>([]);
  const [cellAnnouncements, setCellAnnouncements] = useState<CareCellAnnouncement[]>([]);
  const [cellFollowups, setCellFollowups] = useState<CareCellFollowup[]>([]);
  const [inactiveMembers, setInactiveMembers] = useState<any[]>([]);

  // Care Cell Visits
  const [cellVisits, setCellVisits] = useState<(CareCellVisit & { myResponse?: CareCellVisitMemberResponse })[]>([]);
  const [respondingVisitId, setRespondingVisitId] = useState<string | null>(null);

  // Preferred Visit Time Modal State
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [selectedVisitForResponse, setSelectedVisitForResponse] = useState<(CareCellVisit & { myResponse?: CareCellVisitMemberResponse }) | null>(null);
  const [visitResponseStatus, setVisitResponseStatus] = useState<MemberVisitResponseStatus>('Accepted');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('scheduled');
  const [customTimeSlotText, setCustomTimeSlotText] = useState<string>('');
  const [visitNotesText, setVisitNotesText] = useState<string>('');

  const openVisitResponseModal = (
    visit: CareCellVisit & { myResponse?: CareCellVisitMemberResponse },
    initialStatus: MemberVisitResponseStatus = 'Accepted'
  ) => {
    setSelectedVisitForResponse(visit);
    setVisitResponseStatus(initialStatus);

    const prevPref = visit.myResponse?.preferredTime || (memberId && visit.responses?.[memberId]?.preferredTime) || '';
    if (prevPref) {
      if (['Morning (10:00 AM – 12:00 PM)', 'Afternoon (2:00 PM – 4:00 PM)', 'Evening (5:00 PM – 7:00 PM)', 'Night (7:00 PM – 9:00 PM)'].includes(prevPref)) {
        setSelectedTimeSlot(prevPref);
        setCustomTimeSlotText('');
      } else if (prevPref === `Scheduled Time (${visit.visitTime})` || prevPref === visit.visitTime) {
        setSelectedTimeSlot('scheduled');
        setCustomTimeSlotText('');
      } else {
        setSelectedTimeSlot('custom');
        setCustomTimeSlotText(prevPref);
      }
    } else {
      setSelectedTimeSlot('scheduled');
      setCustomTimeSlotText('');
    }

    setVisitNotesText(visit.myResponse?.notes || (memberId && visit.responses?.[memberId]?.notes) || '');
    setVisitModalVisible(true);
  };

  const handleConfirmVisitResponse = async () => {
    if (!selectedVisitForResponse || !memberId) return;

    let finalPreferredTime = '';
    if (visitResponseStatus === 'Accepted') {
      if (selectedTimeSlot === 'scheduled') {
        finalPreferredTime = `Scheduled Time (${selectedVisitForResponse.visitTime})`;
      } else if (selectedTimeSlot === 'custom') {
        finalPreferredTime = customTimeSlotText.trim() || `Scheduled Time (${selectedVisitForResponse.visitTime})`;
      } else {
        finalPreferredTime = selectedTimeSlot;
      }
    }

    try {
      setRespondingVisitId(selectedVisitForResponse.id);
      const churchId = await CareCellService.getChurchId();
      await CareCellService.respondToVisit(
        churchId,
        selectedVisitForResponse.id,
        memberId,
        visitResponseStatus,
        visitNotesText.trim() || undefined,
        finalPreferredTime || undefined,
        memberPhone
      );

      // Optimistic local state update
      setCellVisits((prev) =>
        prev.map((v) => {
          if (v.id === selectedVisitForResponse.id) {
            return {
              ...v,
              myResponse: {
                memberId,
                memberName: member?.name || '',
                response: visitResponseStatus,
                respondedAt: new Date().toISOString(),
                notes: visitNotesText.trim() || undefined,
                preferredTime: finalPreferredTime || undefined,
              },
            };
          }
          return v;
        })
      );

      setVisitModalVisible(false);

      Alert.alert(
        visitResponseStatus === 'Accepted' ? 'Availability Confirmed! 🎉' : 'Response Recorded',
        visitResponseStatus === 'Accepted'
          ? `Thank you! Your Pastor and Cell Leader have been notified that your preferred visit time is "${finalPreferredTime}".`
          : 'Thank you for letting us know. Your Cell Leader has been updated.'
      );
    } catch (e: any) {
      console.error('Error confirming visit response:', e);
      Alert.alert('Error', e.message || 'Failed to submit response.');
    } finally {
      setRespondingVisitId(null);
    }
  };

  // Tab State
  const [isLeader, setIsLeader] = useState(false);
  const [activeTab, setActiveTab] = useState<'gatherings' | 'visits' | 'prayers' | 'notices' | 'leader'>('gatherings');

  // Modals
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);
  const [followupModalVisible, setFollowupModalVisible] = useState(false);
  const [targetFollowupMember, setTargetFollowupMember] = useState<any | null>(null);
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const memberId = member?.id || user?.uid;
  const memberPhone = member?.phone || (member as any)?.phoneNumber || user?.phoneNumber || undefined;

  useEffect(() => {
    if (route?.params?.initialTab === 'visits' || route?.params?.visitId) {
      setActiveTab('visits');
    }
  }, [route?.params]);

  const loadMemberCellData = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    try {
      const churchId = await CareCellService.getChurchId();
      const { cell, membership: mem } = await CareCellService.getMemberActiveCareCell(
        churchId,
        memberId,
        memberPhone
      );

      setCareCell(cell);
      setMembership(mem);

      if (cell) {
        // Detect leader status dynamically
        const isLead = cell.leaderId === memberId || cell.assistantLeaderId === memberId;
        setIsLeader(isLead);

        // Fetch fellow members, meetings, personal attendance, prayers, announcements, and visits in parallel
        const [fellows, meetingsList, myAttendance, prayersList, announceList, visitsList] = await Promise.all([
          CareCellService.getActiveCellMemberships(churchId, cell.id),
          CareCellService.getMeetings(churchId, cell.id, { status: 'Upcoming' }),
          CareCellService.getMemberAttendanceHistory(churchId, memberId),
          CareCellService.getCellPrayerRequests(churchId, cell.id),
          CareCellService.getCellAnnouncements(churchId, cell.id),
          CareCellService.getMemberUpcomingVisits(churchId, cell.id, memberId, memberPhone),
        ]);

        setFellowMembers(fellows);
        setUpcomingMeetings(meetingsList);
        setAttendanceHistory(myAttendance);
        setCellPrayers(prayersList);
        setCellAnnouncements(announceList);
        setCellVisits(visitsList);

        if (isLead) {
          const [inactives, followupsList] = await Promise.all([
            CareCellService.detectInactiveMembers(churchId, cell.id),
            CareCellService.getCellFollowups(churchId, cell.id),
          ]);
          setInactiveMembers(inactives);
          setCellFollowups(followupsList);
        }
      }
    } catch (e) {
      console.error('Error loading member Care Cell:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId, memberPhone]);

  useEffect(() => {
    loadMemberCellData();
  }, [loadMemberCellData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMemberCellData();
  };

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('No Phone', 'No phone number is available.');
      return;
    }
    const clean = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (phoneNumber?: string, name?: string) => {
    if (!phoneNumber) {
      Alert.alert('No WhatsApp', 'No phone number available.');
      return;
    }
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${clean}&text=${encodeURIComponent(
      `Praise the Lord ${name || 'Brother/Sister'}, greetings from our Care Cell fellowship!`
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Please ensure WhatsApp is installed on your device.');
    });
  };

  // Personal Attendance Stats
  const personalAttendanceStats = useMemo(() => {
    if (!attendanceHistory.length) return { present: 0, total: 0, rate: 0 };
    const present = attendanceHistory.filter(
      (a) => a.attendanceStatus === 'Present' || a.attendanceStatus === 'Late'
    ).length;
    const total = attendanceHistory.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, rate };
  }, [attendanceHistory]);

  const handleRespondToVisit = async (visitId: string, response: MemberVisitResponseStatus) => {
    if (!memberId) {
      Alert.alert('Sign In Required', 'Please sign in to respond to Care Cell visit notifications.');
      return;
    }

    try {
      setRespondingVisitId(visitId);
      const churchId = await CareCellService.getChurchId();
      await CareCellService.respondToVisit(
        churchId,
        visitId,
        memberId,
        response,
        `Member responded ${response} in mobile app`,
        undefined,
        memberPhone
      );

      // Optimistic local state update
      setCellVisits((prev) =>
        prev.map((v) => {
          if (v.id === visitId) {
            return {
              ...v,
              myResponse: {
                memberId,
                memberName: member?.name || '',
                response,
                respondedAt: new Date().toISOString(),
              },
            };
          }
          return v;
        })
      );

      Alert.alert(
        response === 'Accepted' ? 'Availability Confirmed! 🎉' : 'Response Recorded',
        response === 'Accepted'
          ? 'Thank you! Your Pastor and Cell Leader have been notified that you will be available for this visit.'
          : 'Thank you for letting us know. Your Cell Leader has been updated.'
      );
    } catch (e: any) {
      console.error('Error responding to visit:', e);
      Alert.alert('Error', e.message || 'Failed to submit response.');
    } finally {
      setRespondingVisitId(null);
    }
  };

  const pendingVisits = useMemo(() => {
    return cellVisits.filter((v) => (v.myResponse?.response || 'Pending') === 'Pending');
  }, [cellVisits]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={screenBg} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.circularBackBtn, { backgroundColor: cardSurface, borderColor }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={primaryText} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Care Cell</Text>
          <Text style={styles.headerSubtitle}>
            {careCell ? `${careCell.cellCode} · Fellowship Group` : 'Fellowship Ministry'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Fetching your Care Cell fellowship...</Text>
        </View>
      ) : !careCell ? (
        /* Empty State: Unassigned Member */
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
        >
          <View style={[styles.emptyIllustrationBox, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder, borderWidth: 1 }]}>
            <Users size={52} color={secondaryText} />
          </View>
          <Text style={styles.emptyTitle}>No Care Cell Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You are not currently assigned to a Care Cell. Please contact your Church Admin or Pastor to be enrolled in a fellowship group in your neighborhood.
          </Text>

          <View style={styles.contactChurchCard}>
            <Text style={[styles.contactChurchCardTitle, { color: primaryText }]}>Want to join a Care Cell?</Text>
            <Text style={styles.contactChurchCardDesc}>
              Care Cells meet weekly for prayer, biblical encouragement, and mutual fellowship. Reach out to the pastoral team to find the nearest fellowship group.
            </Text>
            <TouchableOpacity
              style={[styles.contactAdminBtn, { backgroundColor: primaryBtnBg }]}
              onPress={() => navigation.navigate('ContactUs')}
              activeOpacity={0.85}
            >
              <Phone size={15} color={primaryBtnText} style={{ marginRight: 6 }} />
              <Text style={[styles.contactAdminBtnTxt, { color: primaryBtnText }]}>Contact Church Office</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Assigned Member Care Cell View */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
        >
          {/* Care Cell Hero Card */}
          <View style={[styles.heroCard, isDark && { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCodeBadge}>
                <Text style={styles.heroCodeBadgeTxt}>{careCell.cellCode}</Text>
              </View>
              {isLeader && (
                <View style={styles.leaderPill}>
                  <ShieldCheck size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.leaderPillTxt}>Leader Workspace</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroName}>{careCell.name}</Text>
            {careCell.description ? (
              <Text style={styles.heroDesc}>{careCell.description}</Text>
            ) : null}

            {/* Quick Meta Row */}
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Calendar size={14} color="#CBD5E1" style={{ marginRight: 5 }} />
                <Text style={styles.heroMetaTxt}>Every {careCell.meetingDay}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Clock size={14} color="#CBD5E1" style={{ marginRight: 5 }} />
                <Text style={styles.heroMetaTxt}>{careCell.meetingTime || '19:00'}{careCell.meetingEndTime ? ` – ${careCell.meetingEndTime}` : ''}</Text>
              </View>
              {careCell.location ? (
                <View style={[styles.heroMetaItem, { flex: 1 }]}>
                  <MapPin size={14} color="#CBD5E1" style={{ marginRight: 5 }} />
                  <Text style={styles.heroMetaTxt} numberOfLines={1}>{careCell.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Horizontal Tabs Selection */}
          <View style={styles.memberTabsRow}>
            {(
              [
                { key: 'gatherings' as const, label: 'Gatherings', icon: Calendar },
                { key: 'visits' as const, label: `Visits${cellVisits.length > 0 ? ` (${cellVisits.length})` : ''}`, icon: Home },
                { key: 'prayers' as const, label: `Prayers${cellPrayers.length > 0 ? ` (${cellPrayers.length})` : ''}`, icon: HeartHandshake },
                { key: 'notices' as const, label: `Notices${cellAnnouncements.length > 0 ? ` (${cellAnnouncements.length})` : ''}`, icon: Megaphone },
                ...(isLeader ? [{ key: 'leader' as const, label: 'Leader Tools', icon: ShieldCheck }] : []),
              ]
            ).map((tab) => {
              const isSelected = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.memberTabPill,
                    isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <Icon
                    size={13}
                    color={isSelected ? primaryBtnText : tab.key === 'leader' ? '#059669' : secondaryText}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.memberTabPillTxt,
                      isSelected && { color: primaryBtnText, fontWeight: '800' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* ── TAB 1: GATHERINGS & INFO ─────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'gatherings' && (
            <>
              {/* Pending Visit Action Required Banner */}
              {pendingVisits.length > 0 && (
                <View style={styles.visitActionCard}>
                  <View style={styles.visitActionBadge}>
                    <Home size={12} color="#1A2D5A" style={{ marginRight: 4 }} />
                    <Text style={styles.visitActionBadgeTxt}>ACTION REQUIRED · VISIT NOTIFICATION</Text>
                  </View>
                  <Text style={styles.visitActionTitle}>{pendingVisits[0].title}</Text>
                  <Text style={styles.visitActionMeta}>
                    📅 {formatDateDisplay(pendingVisits[0].visitDate)} at {pendingVisits[0].visitTime} · 👥 {pendingVisits[0].visitors}
                  </Text>
                  {pendingVisits[0].purpose ? (
                    <Text style={styles.visitActionPurpose}>"{pendingVisits[0].purpose}"</Text>
                  ) : null}
                  <Text style={styles.visitActionPrompt}>
                    Will you be available to host or attend this visit?
                  </Text>

                  <View style={styles.visitActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.visitAcceptBtn}
                      onPress={() => openVisitResponseModal(pendingVisits[0], 'Accepted')}
                      disabled={respondingVisitId === pendingVisits[0].id}
                      activeOpacity={0.85}
                    >
                      {respondingVisitId === pendingVisits[0].id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.visitAcceptBtnTxt}>Accept & Choose Time</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.visitDeclineBtn}
                      onPress={() => openVisitResponseModal(pendingVisits[0], 'Declined')}
                      disabled={respondingVisitId === pendingVisits[0].id}
                      activeOpacity={0.85}
                    >
                      <XCircle size={14} color="#E11D48" style={{ marginRight: 6 }} />
                      <Text style={styles.visitDeclineBtnTxt}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Cell Leader Contact Card */}
              <View style={styles.leaderCard}>
                <View style={styles.leaderCardHeader}>
                  <Text style={styles.sectionHeaderTitle}>CELL LEADER</Text>
                </View>
                <View style={styles.leaderMainRow}>
                  {careCell.leaderPhoto ? (
                    <Image source={{ uri: careCell.leaderPhoto }} style={styles.leaderImg} />
                  ) : (
                    <View style={styles.leaderFallback}>
                      <User size={22} color="#1A2D5A" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderCardName}>{careCell.leaderName}</Text>
                    <Text style={styles.leaderCardRole}>Care Cell Spiritual Leader</Text>
                    {careCell.leaderPhone ? (
                      <Text style={styles.leaderCardPhone}>{careCell.leaderPhone}</Text>
                    ) : null}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.leaderActionBtnsRow}>
                    {careCell.leaderPhone ? (
                      <>
                        <TouchableOpacity
                          style={[styles.callLeaderBtn, { backgroundColor: primaryBtnBg }]}
                          onPress={() => handleCall(careCell.leaderPhone)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Phone size={16} color={primaryBtnText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.whatsAppLeaderBtn}
                          onPress={() => handleWhatsApp(careCell.leaderPhone, careCell.leaderName)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MessageCircle size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Assistant Leader Row (if present) */}
                {careCell.assistantLeaderName ? (
                  <View style={styles.asstRow}>
                    <Text style={styles.asstTxt}>
                      Assistant Leader: <Text style={{ fontWeight: '700', color: '#1A2D5A' }}>{careCell.assistantLeaderName}</Text>
                    </Text>
                    {careCell.assistantLeaderPhone ? (
                      <TouchableOpacity onPress={() => handleCall(careCell.assistantLeaderPhone)}>
                        <Text style={styles.asstCallLink}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* Personal Attendance Rate Card */}
              <View style={styles.attendanceSummaryCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attCardTitle}>My Fellowship Attendance</Text>
                  <Text style={styles.attCardSub}>
                    {personalAttendanceStats.present} of {personalAttendanceStats.total} meetings attended
                  </Text>
                </View>
                <View style={styles.attScoreCircle}>
                  <Text style={styles.attScoreTxt}>{personalAttendanceStats.rate}%</Text>
                </View>
              </View>

              {/* Upcoming Gatherings */}
              <View style={styles.meetingsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>UPCOMING GATHERINGS</Text>
                  <Text style={styles.sectionHeaderBadge}>{upcomingMeetings.length} Scheduled</Text>
                </View>

                {upcomingMeetings.length === 0 ? (
                  <View style={styles.noMeetingsBox}>
                    <Calendar size={28} color="#94A3B8" />
                    <Text style={styles.noMeetingsTxt}>No upcoming meetings scheduled this week.</Text>
                  </View>
                ) : (
                  upcomingMeetings.map((m) => (
                    <View key={m.id} style={styles.meetingCard}>
                      <View style={styles.meetingCardTop}>
                        <Text style={styles.meetingCardTitle}>{m.title}</Text>
                        <View style={styles.meetingTypeChip}>
                          <Text style={styles.meetingTypeChipTxt}>{m.meetingType || 'Fellowship'}</Text>
                        </View>
                      </View>

                      <View style={styles.meetingMetaRow}>
                        <View style={styles.meetingMetaItem}>
                          <Calendar size={13} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.meetingMetaTxt}>{formatDateDisplay(m.date)}</Text>
                        </View>
                        <View style={styles.meetingMetaItem}>
                          <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.meetingMetaTxt}>{m.startTime}</Text>
                        </View>
                      </View>

                      {m.location ? (
                        <View style={styles.meetingLocRow}>
                          <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.meetingLocTxt}>{m.location}</Text>
                        </View>
                      ) : null}

                      {/* Holy Scripture Reading */}
                      {m.bibleBook ? (
                        <View style={styles.scriptureReadingBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <BookOpen size={12} color="#1A2D5A" style={{ marginRight: 4 }} />
                            <Text style={styles.scriptureRefTxt}>
                              {m.bibleBook} {m.bibleChapter}:{m.bibleVerse}
                            </Text>
                          </View>
                          {m.scriptureTextEn ? (
                            <Text style={styles.scripturePreviewEn} numberOfLines={2}>
                              "{m.scriptureTextEn}"
                            </Text>
                          ) : null}
                          {m.scriptureTextTe ? (
                            <Text style={styles.scripturePreviewTe} numberOfLines={2}>
                              "{m.scriptureTextTe}"
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* Fellowship Members Roster */}
              <View style={styles.fellowshipSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>FELLOWSHIP MEMBERS</Text>
                  <Text style={styles.sectionHeaderBadge}>{fellowMembers.length} Members</Text>
                </View>

                <View style={styles.membersGrid}>
                  {fellowMembers.map((fm) => {
                    const initials = fm.memberName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('') || 'M';

                    return (
                      <View key={fm.id} style={styles.memberGridItem}>
                        {fm.memberPhoto ? (
                          <Image source={{ uri: fm.memberPhoto }} style={styles.gridAvatar} />
                        ) : (
                          <View style={styles.gridAvatarFallback}>
                            <Text style={styles.gridAvatarInitials}>{initials}</Text>
                          </View>
                        )}
                        <Text style={styles.gridMemberName} numberOfLines={1}>
                          {fm.memberName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* ── TAB: CARE CELL VISITS & CONFIRMATIONS ────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'visits' && (
            <View style={styles.tabSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>CARE CELL VISITS & NOTIFICATIONS</Text>
              </View>

              {cellVisits.length === 0 ? (
                <View style={styles.emptyVisitsBox}>
                  <Home size={38} color="#CBD5E1" strokeWidth={1.8} />
                  <Text style={styles.emptyVisitsTitle}>No Upcoming Visits Scheduled</Text>
                  <Text style={styles.emptyVisitsSub}>
                    When your Pastor or Cell Leader schedules a pastoral or fellowship visit for your Care Cell, it will appear here with Accept and Decline buttons so you can confirm your availability.
                  </Text>
                </View>
              ) : (
                cellVisits.map((v) => {
                  const resp = v.myResponse?.response || 'Pending';
                  const isAccepted = resp === 'Accepted';
                  const isDeclined = resp === 'Declined';
                  const isPending = resp === 'Pending';
                  const isResponding = respondingVisitId === v.id;

                  return (
                    <View key={v.id} style={styles.memberVisitCard}>
                      <View style={styles.memberVisitCardHeader}>
                        <View style={styles.memberVisitIconWrap}>
                          <Home size={18} color="#1A2D5A" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberVisitTitle}>{v.title}</Text>
                          <Text style={styles.memberVisitCellName}>{v.cellName}</Text>
                        </View>
                      </View>

                      <View style={styles.memberVisitMetaRow}>
                        <Calendar size={13} color="#64748B" style={{ marginRight: 5 }} />
                        <Text style={styles.memberVisitMetaTxt}>
                          {formatDateDisplay(v.visitDate)} at {v.visitTime}
                        </Text>
                      </View>

                      {v.visitors ? (
                        <View style={styles.memberVisitMetaRow}>
                          <Users size={13} color="#64748B" style={{ marginRight: 5 }} />
                          <Text style={styles.memberVisitMetaTxt}>Visiting Team: {v.visitors}</Text>
                        </View>
                      ) : null}

                      {v.purpose ? (
                        <Text style={styles.memberVisitPurpose}>"{v.purpose}"</Text>
                      ) : null}

                      {/* Member Response Action / Status Section */}
                      <View style={styles.memberResponseSection}>
                        {isPending && (
                          <>
                            <Text style={styles.confirmPromptTxt}>
                              Please confirm your availability & preferred visit time:
                            </Text>
                            <View style={styles.memberResponseActionsRow}>
                              <TouchableOpacity
                                style={styles.visitAcceptBtn}
                                onPress={() => openVisitResponseModal(v, 'Accepted')}
                                disabled={isResponding}
                                activeOpacity={0.85}
                              >
                                {isResponding ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <>
                                    <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.visitAcceptBtnTxt}>Accept & Choose Time</Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.visitDeclineBtn}
                                onPress={() => openVisitResponseModal(v, 'Declined')}
                                disabled={isResponding}
                                activeOpacity={0.85}
                              >
                                <XCircle size={15} color="#E11D48" style={{ marginRight: 6 }} />
                                <Text style={styles.visitDeclineBtnTxt}>Decline</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}

                        {isAccepted && (
                          <View style={styles.responseConfirmedBoxAccepted}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <CheckCircle2 size={16} color="#059669" style={{ marginRight: 6 }} />
                              <Text style={styles.responseConfirmedTitleAccepted}>
                                You accepted this visit (Available)
                              </Text>
                            </View>
                            {v.myResponse?.preferredTime ? (
                              <View style={styles.myPreferredTimeBadge}>
                                <Clock size={12} color="#1A2D5A" style={{ marginRight: 5 }} />
                                <Text style={styles.myPreferredTimeLabel}>Preferred Visit Time:</Text>
                                <Text style={styles.myPreferredTimeVal}>{v.myResponse.preferredTime}</Text>
                              </View>
                            ) : null}
                            <Text style={styles.responseConfirmedSub}>
                              Your Pastor and Cell Leader have been notified that you will be available.
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                              <TouchableOpacity
                                onPress={() => openVisitResponseModal(v, 'Accepted')}
                                style={styles.changeResponseBtn}
                              >
                                <Text style={styles.changeResponseBtnTxtPreferred}>Change Preferred Time</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => openVisitResponseModal(v, 'Declined')}
                                style={styles.changeResponseBtn}
                              >
                                <Text style={styles.changeResponseBtnTxt}>Mark Unavailable (Decline)</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {isDeclined && (
                          <View style={styles.responseConfirmedBoxDeclined}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <XCircle size={16} color="#E11D48" style={{ marginRight: 6 }} />
                              <Text style={styles.responseConfirmedTitleDeclined}>
                                You marked unavailable (Declined)
                              </Text>
                            </View>
                            <Text style={styles.responseConfirmedSub}>
                              Your Cell Leader has been updated that you cannot attend.
                            </Text>
                            <TouchableOpacity
                              onPress={() => openVisitResponseModal(v, 'Accepted')}
                              style={styles.changeResponseBtn}
                            >
                              <Text style={styles.changeResponseBtnTxtAccepted}>Change to Available (Accept & Set Time)</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* ── TAB 2: PRAYER WALL ───────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'prayers' && (
            <View style={styles.tabSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>CELL PRAYER WALL</Text>
                <TouchableOpacity
                  style={[styles.addSectionBtn, { backgroundColor: primaryBtnBg }]}
                  onPress={() => setPrayerModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={14} color={primaryBtnText} style={{ marginRight: 4 }} />
                  <Text style={[styles.addSectionBtnTxt, { color: primaryBtnText }]}>New Request</Text>
                </TouchableOpacity>
              </View>

              {cellPrayers.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <HeartHandshake size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTabTitle}>No Prayer Requests Yet</Text>
                  <Text style={styles.emptyTabSub}>
                    Share your prayer needs with your Care Cell family. Tap 'New Request' above to submit.
                  </Text>
                </View>
              ) : (
                cellPrayers.map((p) => {
                  const isAnswered = p.status === 'Answered';
                  const isPraying = p.status === 'Praying';
                  return (
                    <View key={p.id} style={styles.memberPrayerCard}>
                      <View style={styles.prayerTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prayerTitleTxt}>{p.title}</Text>
                          <Text style={styles.prayerAuthorTxt}>By {p.memberName}</Text>
                        </View>
                        <View style={[styles.prayerStatusChip, isAnswered ? styles.chipAnswered : isPraying ? styles.chipPraying : styles.chipNew]}>
                          <Text style={[styles.prayerStatusChipTxt, isAnswered ? styles.chipAnsweredTxt : isPraying ? styles.chipPrayingTxt : styles.chipNewTxt]}>
                            {p.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.prayerBodyTxt}>{p.description}</Text>

                      {p.pastoralResponse ? (
                        <View style={styles.pastoralEncouragementBox}>
                          <Text style={styles.pastoralEncouragementLabel}>Pastoral Guidance:</Text>
                          <Text style={styles.pastoralEncouragementTxt}>"{p.pastoralResponse}"</Text>
                        </View>
                      ) : null}

                      <View style={styles.prayerFooterRow}>
                        <Text style={styles.privacyBadge}>{p.privacy === 'Public' ? '🌐 Public Wall' : '🔒 Cell Only'}</Text>
                        {p.memberPhone ? (
                          <TouchableOpacity
                            style={styles.prayerWhatsAppBtn}
                            onPress={() => handleWhatsApp(p.memberPhone, p.memberName)}
                          >
                            <MessageCircle size={13} color="#16A34A" style={{ marginRight: 4 }} />
                            <Text style={styles.prayerWhatsAppBtnTxt}>Pray Together</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* ── TAB 3: NOTICES & ANNOUNCEMENTS ───────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'notices' && (
            <View style={styles.tabSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>CELL NOTICES</Text>
                {isLeader && (
                  <TouchableOpacity
                    style={[styles.addSectionBtn, { backgroundColor: primaryBtnBg }]}
                    onPress={() => setAnnounceModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={14} color={primaryBtnText} style={{ marginRight: 4 }} />
                    <Text style={[styles.addSectionBtnTxt, { color: primaryBtnText }]}>Post Notice</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cellAnnouncements.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Megaphone size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTabTitle}>No Announcements</Text>
                  <Text style={styles.emptyTabSub}>
                    There are no active notices for your fellowship group at this time.
                  </Text>
                </View>
              ) : (
                cellAnnouncements.map((a) => (
                  <View key={a.id} style={styles.memberNoticeCard}>
                    <View style={styles.noticeTopRow}>
                      <Text style={styles.noticeTitleTxt}>{a.title}</Text>
                      <Text style={styles.noticeAuthorTxt}>By {a.createdByName || 'Leader'}</Text>
                    </View>
                    <Text style={styles.noticeMsgTxt}>{a.message}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* ── TAB 4: LEADER TOOLS (FOR CELL LEADERS ONLY) ──────────────── */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'leader' && isLeader && (
            <View style={styles.tabSectionWrap}>
              <View style={styles.leaderWorkspaceCard}>
                <View style={styles.leaderWorkspaceHeader}>
                  <ShieldCheck size={20} color="#1A2D5A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderWorkspaceTitle}>Cell Leader Dashboard</Text>
                    <Text style={styles.leaderWorkspaceSub}>
                      Manage fellowship pastoral care, roll-calls, and member check-ins.
                    </Text>
                  </View>
                </View>

                {/* Direct Action Buttons */}
                <View style={styles.leaderActionRow}>
                  <TouchableOpacity
                    style={[styles.leaderActionBtnPrimary, { backgroundColor: primaryBtnBg }]}
                    onPress={() => setAnnounceModalVisible(true)}
                  >
                    <Megaphone size={14} color={primaryBtnText} style={{ marginRight: 6 }} />
                    <Text style={[styles.leaderActionBtnPrimaryTxt, { color: primaryBtnText }]}>Post Notice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.leaderActionBtnSecondary, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                    onPress={() => {
                      setTargetFollowupMember(null);
                      setFollowupModalVisible(true);
                    }}
                  >
                    <Heart size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
                    <Text style={[styles.leaderActionBtnSecondaryTxt, { color: secondaryBtnText }]}>Log Follow-up</Text>
                  </TouchableOpacity>
                </View>

                {/* Google Maps & House Visit Planner Trigger */}
                <TouchableOpacity
                  style={[styles.leaderMapBannerBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                  onPress={() => setMapModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.mapIconCircle, { backgroundColor: primaryBtnBg }]}>
                    <Navigation size={18} color={primaryBtnText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.leaderMapBannerTitle, { color: primaryText }]}>Member Map & House Visits</Text>
                    <Text style={styles.leaderMapBannerSub}>
                      Google Maps navigation, member houses & route planning
                    </Text>
                  </View>
                  <ChevronRight size={18} color={primaryText} />
                </TouchableOpacity>
              </View>

              {/* Inactive Members Detection (Phase 3 Automation) */}
              {inactiveMembers.length > 0 && (
                <View style={styles.inactiveMembersBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text style={styles.inactiveBoxTitle}>
                      {inactiveMembers.length} Members Needing Pastoral Care
                    </Text>
                  </View>
                  <Text style={styles.inactiveBoxSub}>
                    Missed 2+ consecutive care cell gatherings. Check on their well-being:
                  </Text>

                  {inactiveMembers.map((im) => (
                    <View key={im.memberId} style={styles.inactiveMemberItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inactiveItemName}>{im.memberName}</Text>
                        <Text style={styles.inactiveItemMeta}>Missed {im.missedCount} meetings</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {im.memberPhone ? (
                          <>
                            <TouchableOpacity
                              style={styles.quickCallCircle}
                              onPress={() => handleCall(im.memberPhone)}
                            >
                              <Phone size={13} color="#1A2D5A" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickCallCircle, { backgroundColor: '#25D366' }]}
                              onPress={() => handleWhatsApp(im.memberPhone, im.memberName)}
                            >
                              <MessageCircle size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                          </>
                        ) : null}
                        <TouchableOpacity
                          style={styles.quickLogBtn}
                          onPress={() => {
                            setTargetFollowupMember(im);
                            setFollowupModalVisible(true);
                          }}
                        >
                          <Text style={styles.quickLogBtnTxt}>Log</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Recent Follow-up Records */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionHeaderTitle}>RECENT PASTORAL RECORDS</Text>
                {cellFollowups.length === 0 ? (
                  <View style={styles.emptyTabCard}>
                    <Heart size={36} color="#CBD5E1" />
                    <Text style={styles.emptyTabTitle}>No Follow-ups Logged Yet</Text>
                    <Text style={styles.emptyTabSub}>
                      Record visits or calls when you reach out to fellow members.
                    </Text>
                  </View>
                ) : (
                  cellFollowups.slice(0, 10).map((f) => (
                    <View key={f.id} style={styles.memberFollowupCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.followupMemberName}>{f.memberName}</Text>
                        <View style={styles.followupStatusPill}>
                          <Text style={styles.followupStatusPillTxt}>{f.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.followupReasonTxt}>{f.followupType} · {f.followupDate}</Text>
                      <Text style={styles.followupNotesTxt}>"{f.notes}"</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Prayer Modal ── */}
      {careCell && (
        <CareCellPrayerModal
          visible={prayerModalVisible}
          onClose={() => setPrayerModalVisible(false)}
          cellId={careCell.id}
          cellCode={careCell.cellCode}
          cellName={careCell.name}
          memberId={memberId || 'member'}
          memberName={member?.name || user?.displayName || 'Member'}
          memberPhone={member?.phone || (member as any)?.phoneNumber}
          onSuccess={loadMemberCellData}
        />
      )}

      {/* ── Follow-up Modal ── */}
      {careCell && (
        <CareCellFollowupModal
          visible={followupModalVisible}
          onClose={() => setFollowupModalVisible(false)}
          cellId={careCell.id}
          cellCode={careCell.cellCode}
          cellName={careCell.name}
          memberId={targetFollowupMember?.memberId || careCell.leaderId}
          memberName={targetFollowupMember?.memberName || careCell.leaderName}
          memberPhone={targetFollowupMember?.memberPhone}
          assignedLeaderId={careCell.leaderId}
          assignedLeaderName={careCell.leaderName}
          initialReason={targetFollowupMember?.reason}
          onSuccess={loadMemberCellData}
        />
      )}

      {/* ── Announcement Modal ── */}
      {careCell && (
        <CareCellAnnouncementModal
          visible={announceModalVisible}
          onClose={() => setAnnounceModalVisible(false)}
          cellId={careCell.id}
          cellCode={careCell.cellCode}
          cellName={careCell.name}
          createdBy={memberId || 'leader'}
          createdByName={member?.name || user?.displayName || 'Cell Leader'}
          onSuccess={loadMemberCellData}
        />
      )}

      {/* ── Google Maps & House Visit Planner Modal ── */}
      {careCell && (
        <CareCellMapModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          cell={careCell}
          members={fellowMembers}
          inactiveMembers={inactiveMembers}
          onLogFollowup={(m) => {
            setMapModalVisible(false);
            setTargetFollowupMember({
              memberId: m.memberId,
              memberName: m.memberName,
              memberPhone: m.memberPhone,
              reason: 'Pastoral House Visit',
            });
            setFollowupModalVisible(true);
          }}
        />
      )}
      {/* ── Preferred Visit Time & Availability Modal ── */}
      <Modal
        visible={visitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisitModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.timeModalBackdrop}
        >
          <View style={styles.timeModalSheet}>
            {/* Header */}
            <View style={styles.timeModalHeader}>
              <View>
                <Text style={styles.timeModalTitle}>House Visit Response</Text>
                <Text style={styles.timeModalSubtitle}>Set your preferred visit window</Text>
              </View>
              <TouchableOpacity
                onPress={() => setVisitModalVisible(false)}
                style={styles.timeModalCloseBtn}
              >
                <XCircle size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.75 }}>
              {/* Visit Details Card */}
              {selectedVisitForResponse && (
                <View style={styles.timeModalVisitCard}>
                  <Text style={styles.timeModalVisitTitle}>{selectedVisitForResponse.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Calendar size={13} color="#1A2D5A" style={{ marginRight: 4 }} />
                      <Text style={styles.timeModalVisitMeta}>
                        {formatDateDisplay(selectedVisitForResponse.visitDate)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Clock size={13} color="#C9A84C" style={{ marginRight: 4 }} />
                      <Text style={styles.timeModalVisitMeta}>
                        Default: {selectedVisitForResponse.visitTime}
                      </Text>
                    </View>
                  </View>
                  {selectedVisitForResponse.visitors ? (
                    <Text style={styles.timeModalVisitorsTxt}>
                      Visitors: {selectedVisitForResponse.visitors}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Status Toggle */}
              <Text style={styles.timeModalSectionLabel}>YOUR AVAILABILITY</Text>
              <View style={styles.availToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.availToggleBtn,
                    visitResponseStatus === 'Accepted' && styles.availToggleBtnActiveAccepted,
                  ]}
                  onPress={() => setVisitResponseStatus('Accepted')}
                  activeOpacity={0.85}
                >
                  <CheckCircle2
                    size={16}
                    color={visitResponseStatus === 'Accepted' ? '#FFFFFF' : '#059669'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.availToggleBtnTxt,
                      visitResponseStatus === 'Accepted' && styles.availToggleBtnTxtActive,
                    ]}
                  >
                    I am Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.availToggleBtn,
                    visitResponseStatus === 'Declined' && styles.availToggleBtnActiveDeclined,
                  ]}
                  onPress={() => setVisitResponseStatus('Declined')}
                  activeOpacity={0.85}
                >
                  <XCircle
                    size={16}
                    color={visitResponseStatus === 'Declined' ? '#FFFFFF' : '#DC2626'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.availToggleBtnTxt,
                      visitResponseStatus === 'Declined' && styles.availToggleBtnTxtActive,
                    ]}
                  >
                    Unavailable
                  </Text>
                </TouchableOpacity>
              </View>

              {/* If Accepted: Preferred Time Slot Selector */}
              {visitResponseStatus === 'Accepted' && selectedVisitForResponse && (
                <>
                  <View style={styles.preferredTimeHeaderWrap}>
                    <Text style={styles.timeModalSectionLabel}>PREFERRED VISIT TIME</Text>
                    <Text style={styles.timeModalSectionSub}>
                      Select the time slot that is most convenient for your family:
                    </Text>
                  </View>

                  <View style={styles.timeSlotsGrid}>
                    {[
                      {
                        key: 'scheduled',
                        label: `Scheduled Time (${selectedVisitForResponse.visitTime})`,
                        sub: 'As planned by Cell Leader',
                      },
                      {
                        key: 'Morning (10:00 AM – 12:00 PM)',
                        label: 'Morning (10:00 AM – 12:00 PM)',
                        sub: 'Best for morning visits',
                      },
                      {
                        key: 'Afternoon (2:00 PM – 4:00 PM)',
                        label: 'Afternoon (2:00 PM – 4:00 PM)',
                        sub: 'Post-lunch quiet window',
                      },
                      {
                        key: 'Evening (5:00 PM – 7:00 PM)',
                        label: 'Evening (5:00 PM – 7:00 PM)',
                        sub: 'Standard fellowship hours',
                      },
                      {
                        key: 'Night (7:00 PM – 9:00 PM)',
                        label: 'Night (7:00 PM – 9:00 PM)',
                        sub: 'After office / dinner',
                      },
                      {
                        key: 'custom',
                        label: 'Custom Specific Time...',
                        sub: 'Specify your exact available time',
                      },
                    ].map((slot) => {
                      const isSelected = selectedTimeSlot === slot.key;
                      return (
                        <TouchableOpacity
                          key={slot.key}
                          style={[
                            styles.timeSlotPill,
                            isSelected && styles.timeSlotPillSelected,
                          ]}
                          onPress={() => setSelectedTimeSlot(slot.key)}
                          activeOpacity={0.8}
                        >
                          <Clock
                            size={14}
                            color={isSelected ? '#4338CA' : '#64748B'}
                            style={{ marginRight: 8 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.timeSlotPillTxt,
                                isSelected && styles.timeSlotPillTxtSelected,
                              ]}
                            >
                              {slot.label}
                            </Text>
                            <Text style={styles.timeSlotPillSub}>{slot.sub}</Text>
                          </View>
                          {isSelected && (
                            <CheckCircle2 size={16} color="#4338CA" style={{ marginLeft: 6 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Time Slot Input */}
                  {selectedTimeSlot === 'custom' && (
                    <View style={styles.customTimeInputWrap}>
                      <Clock size={16} color="#4338CA" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.customTimeInput}
                        placeholder="e.g. 6:30 PM to 7:30 PM, or Saturday 11 AM"
                        placeholderTextColor="#94A3B8"
                        value={customTimeSlotText}
                        onChangeText={setCustomTimeSlotText}
                        autoFocus
                      />
                    </View>
                  )}

                  {/* Optional Note / Prayer Request for the visit */}
                  <Text style={styles.timeModalSectionLabel}>SPECIAL NOTES OR PRAYER REQUEST (OPTIONAL)</Text>
                  <TextInput
                    style={styles.visitNotesInput}
                    placeholder="e.g. Please pray for healing / Please visit after children finish study..."
                    placeholderTextColor="#94A3B8"
                    value={visitNotesText}
                    onChangeText={setVisitNotesText}
                    multiline
                  />
                </>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.confirmVisitResponseBtn, { backgroundColor: primaryBtnBg }]}
                onPress={handleConfirmVisitResponse}
                disabled={respondingVisitId !== null}
                activeOpacity={0.85}
              >
                {respondingVisitId ? (
                  <ActivityIndicator size="small" color={primaryBtnText} />
                ) : (
                  <>
                    <CheckCircle2 size={16} color={primaryBtnText} style={{ marginRight: 8 }} />
                    <Text style={[styles.confirmVisitResponseBtnTxt, { color: primaryBtnText }]}>
                      {visitResponseStatus === 'Accepted'
                        ? 'Confirm Visit & Preferred Time'
                        : 'Submit Unavailable Response'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = createAdminThemedStyles({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  circularBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyIllustrationBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  contactChurchCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    alignItems: 'center',
  },
  contactChurchCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1A2D5A',
    marginBottom: 4,
  },
  contactChurchCardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  contactAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactAdminBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroCodeBadgeTxt: {
    fontFamily: 'monospace',
    fontSize: 11.5,
    fontWeight: '800',
    color: '#93C5FD',
  },
  leaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaderPillTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 12.5,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaTxt: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  leaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  leaderCardHeader: {
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  leaderMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  leaderFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaderCardRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  leaderCardPhone: {
    fontSize: 11.5,
    color: '#1A2D5A',
    fontWeight: '600',
    marginTop: 1,
  },
  leaderActionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callLeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1A2D5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsAppLeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  asstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  asstTxt: {
    fontSize: 12,
    color: '#64748B',
  },
  asstCallLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  attendanceSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  attCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  attCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  attScoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attScoreTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  meetingsSection: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  noMeetingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
  },
  noMeetingsTxt: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  meetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  meetingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meetingCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  meetingTypeChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meetingTypeChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  meetingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meetingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingMetaTxt: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  meetingLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  meetingLocTxt: {
    fontSize: 11.5,
    color: '#64748B',
  },
  scriptureReadingBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 8,
  },
  scriptureRefTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  scripturePreviewEn: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 16,
  },
  scripturePreviewTe: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 17,
    marginTop: 2,
  },
  fellowshipSection: {
    marginBottom: 20,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberGridItem: {
    width: (width - 54) / 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  gridAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  gridAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
  },
  gridMemberName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  memberTabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  memberTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  memberTabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  memberTabPillTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  memberTabPillTxtActive: {
    color: '#FFFFFF',
  },
  tabSectionWrap: {
    marginBottom: 20,
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 10,
  },
  addSectionBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyTabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyTabTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyTabSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  memberPrayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  prayerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  prayerTitleTxt: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  prayerAuthorTxt: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  prayerStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  chipAnswered: {
    backgroundColor: '#DCFCE7',
  },
  chipAnsweredTxt: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '800',
  },
  chipPraying: {
    backgroundColor: '#FEF3C7',
  },
  chipPrayingTxt: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  chipNew: {
    backgroundColor: '#EFF6FF',
  },
  chipNewTxt: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  prayerStatusChipTxt: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  prayerBodyTxt: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
  },
  pastoralEncouragementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1A2D5A',
    padding: 8,
    marginTop: 8,
  },
  pastoralEncouragementLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1A2D5A',
    textTransform: 'uppercase',
  },
  pastoralEncouragementTxt: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  prayerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  privacyBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  prayerWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prayerWhatsAppBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  memberNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  noticeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitleTxt: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  noticeAuthorTxt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  noticeMsgTxt: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  leaderWorkspaceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  leaderWorkspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  leaderWorkspaceTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  leaderWorkspaceSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  leaderActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  leaderActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D5A',
    paddingVertical: 9,
    borderRadius: 8,
  },
  leaderActionBtnPrimaryTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 8,
  },
  leaderActionBtnSecondaryTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  leaderMapBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  mapIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A2D5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderMapBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  leaderMapBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  inactiveMembersBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 14,
  },
  inactiveBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  inactiveBoxSub: {
    fontSize: 11.5,
    color: '#7F1D1D',
    marginBottom: 10,
  },
  inactiveMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 8,
    marginBottom: 6,
  },
  inactiveItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  inactiveItemMeta: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  quickCallCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLogBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    justifyContent: 'center',
  },
  quickLogBtnTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberFollowupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  followupMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  followupStatusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followupStatusPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  followupReasonTxt: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  followupNotesTxt: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#334155',
    marginTop: 4,
  },
  // ── Care Cell Visits Styles ──
  visitActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  visitActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  visitActionBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  visitActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  visitActionMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  visitActionPurpose: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  visitActionPrompt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 10,
  },
  visitActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visitAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  visitAcceptBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  visitDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  visitDeclineBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#E11D48',
  },
  visitsTabContainer: {
    marginTop: 4,
    marginBottom: 20,
  },
  emptyVisitsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyVisitsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyVisitsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  memberVisitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  memberVisitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberVisitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberVisitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  memberVisitCellName: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  memberVisitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberVisitMetaTxt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  memberVisitPurpose: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 16,
  },
  memberResponseSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  confirmPromptTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  memberResponseActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  responseConfirmedBoxAccepted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
  },
  responseConfirmedTitleAccepted: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  responseConfirmedBoxDeclined: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 10,
  },
  responseConfirmedTitleDeclined: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  responseConfirmedSub: {
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 6,
  },
  changeResponseBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  changeResponseBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
    textDecorationLine: 'underline',
  },
  changeResponseBtnTxtAccepted: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  changeResponseBtnTxtPreferred: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    textDecorationLine: 'underline',
  },
  myPreferredTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  myPreferredTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
    marginRight: 4,
  },
  myPreferredTimeVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  timeModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  timeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  timeModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  timeModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timeModalCloseBtn: {
    padding: 4,
  },
  timeModalVisitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  timeModalVisitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  timeModalVisitMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  timeModalVisitorsTxt: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 6,
  },
  timeModalSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  timeModalSectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
  },
  availToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  availToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  availToggleBtnActiveAccepted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  availToggleBtnActiveDeclined: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  availToggleBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  availToggleBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  preferredTimeHeaderWrap: {
    marginBottom: 4,
  },
  timeSlotsGrid: {
    gap: 8,
    marginBottom: 10,
  },
  timeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  timeSlotPillSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  timeSlotPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  timeSlotPillTxtSelected: {
    color: '#312E81',
    fontWeight: '800',
  },
  timeSlotPillSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  customTimeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  customTimeInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A2D5A',
    fontWeight: '600',
  },
  visitNotesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: '#1A2D5A',
    minHeight: 52,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  confirmVisitResponseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#1A2D5A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  confirmVisitResponseBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

