import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Music,
  BookOpen,
  ChevronRight,
  CalendarX,
  Plus,
  Trash2,
  X,
  Volume2,
  Smile,
  Sparkles,
  Users,
  ListChecks,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import ServiceRosterService from '../services/ServiceRosterService';
import {
  MemberServiceDuty,
  SetlistItem,
  ServicePlan,
  RunSheetItem,
  ActivityCategoryDef,
} from '../types/serviceRoster';
import { formatDateMonthYear, formatTimeTo12Hour } from '../utils/DateUtils';

const DECLINE_REASONS = [
  'Out of town / Traveling',
  'Work / Business commitment',
  'Family engagement / Function',
  'Health / Not feeling well',
  'Academic exams / Studies',
  'Other personal reason',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  preparation: { bg: '#F3F4F6', text: '#4B5563' },
  starting_prayer: { bg: '#FEF3C7', text: '#92400E' },
  opening_song: { bg: '#EDE9FE', text: '#5B21B6' },
  worship_songs: { bg: '#FCE7F3', text: '#9D174D' },
  music: { bg: '#E0E7FF', text: '#1a2d5a' },
  bible_reading: { bg: '#E0F2FE', text: '#0369A1' },
  offering: { bg: '#ECFDF5', text: '#065F46' },
  announcements: { bg: '#FFFBEB', text: '#B45309' },
  sermon: { bg: '#FEF3C7', text: '#92400E' },
  communion: { bg: '#FCE7F3', text: '#831843' },
  special_performance: { bg: '#F5F3FF', text: '#6D28D9' },
  closing_prayer: { bg: '#FEF2F2', text: '#c0392b' },
  benediction: { bg: '#F0FDF4', text: '#166534' },
  break: { bg: '#F3F4F6', text: '#6B7280' },
  other: { bg: '#F1F5F9', text: '#334155' },
};

const getCategoryStyle = (
  category: string,
  isDark: boolean,
  customCategories: ActivityCategoryDef[] = []
) => {
  const custom = customCategories.find(
    c => c.id === category || c.label.toLowerCase() === category.toLowerCase()
  );
  if (custom) {
    if (!isDark) return { bg: custom.bg, text: custom.text };
    return {
      bg: custom.text.startsWith('#') && custom.text.length === 7 ? `${custom.text}40` : 'rgba(255,255,255,0.10)',
      text: custom.bg.startsWith('#') ? custom.bg : '#E2E8F0',
    };
  }
  const base = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  if (!isDark) return base;
  const darkMap: Record<string, { bg: string; text: string }> = {
    preparation: { bg: 'rgba(107, 114, 128, 0.25)', text: '#E5E7EB' },
    starting_prayer: { bg: 'rgba(217, 119, 6, 0.25)', text: '#FDE68A' },
    opening_song: { bg: 'rgba(124, 58, 237, 0.25)', text: '#DDD6FE' },
    worship_songs: { bg: 'rgba(236, 72, 153, 0.25)', text: '#FBCFE8' },
    music: { bg: 'rgba(59, 130, 246, 0.25)', text: '#BFDBFE' },
    bible_reading: { bg: 'rgba(14, 165, 233, 0.25)', text: '#BAE6FD' },
    offering: { bg: 'rgba(16, 185, 129, 0.25)', text: '#A7F3D0' },
    announcements: { bg: 'rgba(245, 158, 11, 0.25)', text: '#FDE68A' },
    sermon: { bg: 'rgba(234, 88, 12, 0.25)', text: '#FED7AA' },
    communion: { bg: 'rgba(219, 39, 119, 0.25)', text: '#FBCFE8' },
    closing_prayer: { bg: 'rgba(239, 68, 68, 0.25)', text: '#FECACA' },
    benediction: { bg: 'rgba(16, 185, 129, 0.25)', text: '#A7F3D0' },
  };
  return darkMap[category] || { bg: 'rgba(255,255,255,0.08)', text: '#E2E8F0' };
};

const resolveActivityAssignment = (
  item: RunSheetItem,
  plan: ServicePlan,
  memberId?: string,
  memberName?: string
) => {
  const pLower = (item.program || '').toLowerCase();
  const cat = item.category;

  const isWorship =
    cat === 'worship_songs' ||
    cat === 'music' ||
    cat === 'opening_song' ||
    cat === 'special_performance' ||
    pLower.includes('worship') ||
    pLower.includes('praise') ||
    pLower.includes('setlist');

  const isSermon = cat === 'sermon' || pLower.includes('sermon') || pLower.includes('message');
  const isPrep = cat === 'preparation' || pLower.includes('sound check') || pLower.includes('preparation');

  if (isWorship) {
    const bandRoster = [
      { role: 'Worship Leader', name: plan.assignments?.role_worship_leader || plan.assignments?.worship_leader || '', emoji: '🎤', key: 'role_worship_leader' },
      { role: 'Keyboard / Piano', name: plan.assignments?.role_keyboard || plan.assignments?.keyboard || '', emoji: '🎹', key: 'role_keyboard' },
      { role: 'Drums', name: plan.assignments?.role_drums || plan.assignments?.drums || '', emoji: '🥁', key: 'role_drums' },
      { role: 'Bass Guitar', name: plan.assignments?.role_bass || plan.assignments?.bass || '', emoji: '🎸', key: 'role_bass' },
      { role: 'Acoustic Guitar', name: plan.assignments?.role_acoustic || plan.assignments?.acoustic || '', emoji: '🎸', key: 'role_acoustic' },
      { role: 'Electric Guitar', name: plan.assignments?.role_electric || plan.assignments?.electric || '', emoji: '⚡', key: 'role_electric' },
      { role: 'Sound / Audio', name: plan.assignments?.role_sound || plan.assignments?.sound || '', emoji: '🎧', key: 'role_sound' },
    ];

    const activeBand = bandRoster
      .filter(b => b.name && b.name.trim().length > 0)
      .map(b => {
        const isYou =
          (plan.assignmentMemberIds?.[b.key] === memberId) ||
          (memberName && b.name && memberName.toLowerCase().trim() === b.name.toLowerCase().trim());
        return { ...b, isYou: Boolean(isYou) };
      });

    const isMyServing =
      activeBand.some(b => b.isYou) ||
      (item.responsibleMemberId && item.responsibleMemberId === memberId) ||
      (memberName && item.responsiblePerson && memberName.toLowerCase().trim() === item.responsiblePerson.toLowerCase().trim());

    return {
      roleTitle: 'Worship Team & Musicians',
      assignedName: activeBand.length > 0 ? `${activeBand.length} Musicians Assigned` : 'Not Assigned',
      isAssigned: activeBand.length > 0,
      isMyServing: Boolean(isMyServing),
      myRoleName: activeBand.find(b => b.isYou)?.role || 'Worship Musician',
      bandMusicians: activeBand,
      prepTeamSlots: [] as Array<{ role: string; name: string; emoji: string; key: string; isYou: boolean; isAssigned: boolean }>,
    };
  }

  if (isSermon) {
    const preacher =
      plan.preacher && plan.preacher.trim()
        ? plan.preacher.trim()
        : (plan.assignments?.duty_preacher || plan.assignments?.role_preacher || null);

    const assigned = preacher || (item.responsibleMemberId ? item.responsiblePerson : null);
    const isAssigned = Boolean(assigned && assigned.trim().length > 0);
    const assignedName = isAssigned ? assigned!.trim() : 'Not Assigned';
    const isMyServing = Boolean(
      (memberName && assigned && memberName.toLowerCase().trim() === assigned.toLowerCase().trim()) ||
      (item.responsibleMemberId && item.responsibleMemberId === memberId)
    );

    return {
      roleTitle: 'Preacher / Speaker',
      assignedName,
      isAssigned,
      isMyServing,
      myRoleName: 'Preacher / Speaker',
      bandMusicians: [],
      prepTeamSlots: [] as Array<{ role: string; name: string; emoji: string; key: string; isYou: boolean; isAssigned: boolean }>,
    };
  }

  if (isPrep) {
    const prepPlaceholders = [
      'sound & media team',
      'sound team',
      'media team',
      'unassigned',
    ];
    const soundName = (plan.assignments?.role_sound || plan.assignments?.sound || '').trim();
    const soundId = plan.assignmentMemberIds?.role_sound || plan.assignmentMemberIds?.sound;
    const mediaName = (plan.assignments?.role_media || plan.assignments?.media || '').trim();
    const mediaId = plan.assignmentMemberIds?.role_media || plan.assignmentMemberIds?.media;

    const directActName = (
      plan.assignments?.[item.id] ||
      plan.assignments?.[item.id.replace('act_', '')] ||
      plan.assignments?.[`act_${item.id}`] ||
      ''
    ).trim();
    const directActId =
      plan.assignmentMemberIds?.[item.id] ||
      plan.assignmentMemberIds?.[item.id.replace('act_', '')] ||
      plan.assignmentMemberIds?.[`act_${item.id}`] ||
      item.responsibleMemberId;
    const itemPersonClean = (item.responsiblePerson || '').trim();
    const fallbackLead =
      item.responsibleMemberId ||
      (itemPersonClean && !prepPlaceholders.includes(itemPersonClean.toLowerCase()))
        ? itemPersonClean
        : '';
    const leadName = directActName || fallbackLead;

    const isPersonYou = (id?: string, name?: string) =>
      Boolean(
        (id && memberId && id === memberId) ||
          (name && memberName && name.toLowerCase().trim() === memberName.toLowerCase().trim())
      );

    const prepTeamSlots = [
      {
        role: 'Sound Check',
        name: soundName || 'Not Assigned',
        emoji: '🎧',
        key: 'role_sound',
        isAssigned: Boolean(soundName),
        isYou: isPersonYou(soundId, soundName),
      },
      {
        role: 'Media / Slides',
        name: mediaName || 'Not Assigned',
        emoji: '📽️',
        key: 'role_media',
        isAssigned: Boolean(mediaName),
        isYou: isPersonYou(mediaId, mediaName),
      },
    ];

    if (
      leadName &&
      leadName.toLowerCase() !== soundName.toLowerCase() &&
      leadName.toLowerCase() !== mediaName.toLowerCase()
    ) {
      prepTeamSlots.unshift({
        role: 'Prep Lead',
        name: leadName,
        emoji: '🎛️',
        key: item.id || 'prep_lead',
        isAssigned: true,
        isYou: isPersonYou(directActId, leadName),
      });
    }

    const uniqueAssignedNames: string[] = [];
    for (const candidate of [leadName, soundName, mediaName]) {
      if (candidate && !uniqueAssignedNames.some(n => n.toLowerCase() === candidate.toLowerCase())) {
        uniqueAssignedNames.push(candidate);
      }
    }

    const isAssigned = uniqueAssignedNames.length > 0;
    const mySlots = prepTeamSlots.filter(s => s.isYou);
    const isMyServing = mySlots.length > 0;
    const myRoleName = mySlots.length > 0
      ? mySlots.map(s => s.role).join(' & ')
      : 'Sound & Preparation Team';

    return {
      roleTitle: 'Sound & Media Team',
      assignedName: isAssigned ? uniqueAssignedNames.join(', ') : 'Not Assigned',
      isAssigned,
      isMyServing,
      myRoleName,
      bandMusicians: [],
      prepTeamSlots,
    };
  }

  const roleTitle = item.program;
  const placeholderPatterns = [
    'elder / associate pastor',
    'elder',
    'service host',
    'assigned reader',
    'reader',
    'offering team',
    'church secretary',
    'pastor / speaker',
    'pastor',
    'lead pastor',
    'unassigned',
  ];

  const directAssignment =
    plan.assignments?.[item.id] ||
    plan.assignments?.[item.id.replace('act_', '')] ||
    plan.assignments?.[`act_${item.id}`];

  let resolvedPerson: string | null = null;
  if (directAssignment && directAssignment.trim()) {
    resolvedPerson = directAssignment.trim();
  } else if (item.responsibleMemberId && item.responsiblePerson && item.responsiblePerson.trim()) {
    resolvedPerson = item.responsiblePerson.trim();
  } else if (
    item.responsiblePerson &&
    item.responsiblePerson.trim() &&
    !placeholderPatterns.includes(item.responsiblePerson.toLowerCase().trim())
  ) {
    resolvedPerson = item.responsiblePerson.trim();
  }

  const isAssigned = Boolean(resolvedPerson && resolvedPerson.length > 0);
  const assignedName = isAssigned ? resolvedPerson! : 'Not Assigned';
  const isMyServing = Boolean(
    (item.responsibleMemberId && item.responsibleMemberId === memberId) ||
    (memberName && resolvedPerson && memberName.toLowerCase().trim() === resolvedPerson.toLowerCase().trim())
  );

  return {
    roleTitle,
    assignedName,
    isAssigned,
    isMyServing,
    myRoleName: roleTitle,
    bandMusicians: [],
    prepTeamSlots: [] as Array<{ role: string; name: string; emoji: string; key: string; isYou: boolean; isAssigned: boolean }>,
  };
};

export default function MyServiceScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { member, user } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark, colors } = useTheme();

  const screenBg = colors.background;
  const cardSurface = colors.surface;
  const primaryText = colors.text;
  const secondaryText = colors.textSecondary;
  const borderColor = colors.border;

  const navyPrimary = '#1a2d5a';
  const crimsonAccent = '#c0392b';
  const goldAccent = '#fbbf24';
  const confirmBtnBg = '#059669';
  const activeAccentText = isDark ? goldAccent : '#1a2d5a';

  const churchId = route?.params?.churchId || activeChurch?.id || (member as any)?.churchId || '';
  const memberId = member?.id || user?.uid || '';

  const [activeTab, setActiveTab] = useState<'roster' | 'responsibilities'>(
    (route?.params?.initialTab as any) || 'roster'
  );

  const [duties, setDuties] = useState<MemberServiceDuty[]>([]);
  const [publishedPlans, setPublishedPlans] = useState<ServicePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(route?.params?.serviceId || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [customCategories, setCustomCategories] = useState<ActivityCategoryDef[]>([]);

  // Decline Modal state
  const [selectedDutyForDecline, setSelectedDutyForDecline] = useState<MemberServiceDuty | null>(null);
  const [declineReason, setDeclineReason] = useState<string>(DECLINE_REASONS[0]);
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');
  const [submittingResponse, setSubmittingResponse] = useState<boolean>(false);

  // Lyrics Sheet Modal state
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<SetlistItem | null>(null);

  // Availability state
  const [blockouts, setBlockouts] = useState<Array<{ date: string; reason?: string }>>([]);
  const [showAddBlockoutModal, setShowAddBlockoutModal] = useState<boolean>(false);
  const [newBlockoutDate, setNewBlockoutDate] = useState<string>('');
  const [newBlockoutReason, setNewBlockoutReason] = useState<string>('Traveling / Family commitment');
  const [savingBlockout, setSavingBlockout] = useState<boolean>(false);

  const fetchDuties = useCallback(async () => {
    if (!churchId) {
      setLoading(false);
      return;
    }
    try {
      const list = memberId
        ? await ServiceRosterService.getMemberUpcomingDuties(churchId, memberId, member?.name)
        : [];
      setDuties(list);
      if (route?.params?.initialTab) {
        setActiveTab(route.params.initialTab);
      } else if (list.length === 0) {
        setActiveTab('roster');
      }

      const allPlans = await ServiceRosterService.getServicePlans(churchId);
      const today = new Date().toISOString().split('T')[0];
      const allPublished = (allPlans || []).filter(p => p.status === 'published' || p.status === 'live');
      const upcoming = allPublished
        .filter(p => p.date >= today)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const published = upcoming.length > 0
        ? upcoming
        : allPublished.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setPublishedPlans(published);
      if (published.length > 0) {
        setSelectedPlanId(prev =>
          prev && published.some(p => p.id === prev)
            ? prev
            : (route?.params?.serviceId || published[0].id)
        );
      }

      if (memberId) {
        const avail = await ServiceRosterService.getMemberAvailability(churchId, memberId);
        setBlockouts(
          avail?.blockouts ||
            (avail?.unavailableDates || []).map((d: string) => ({ date: d, reason: 'Unavailable' }))
        );
      }

      const customCats = await ServiceRosterService.getCustomActivityCategories(churchId);
      setCustomCategories(customCats);
    } catch (err) {
      console.error('[MyServiceScreen] fetchDuties error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [churchId, memberId, member?.name]);

  useEffect(() => {
    fetchDuties();
    if (!churchId || !memberId) return;

    const unsubscribe = ServiceRosterService.listenMemberUpcomingDuties(
      churchId,
      memberId,
      (updatedList) => {
        setDuties(updatedList);
      },
      member?.name
    );

    return () => unsubscribe();
  }, [churchId, memberId, member?.name, fetchDuties]);

  useEffect(() => {
    if (route?.params?.serviceId) {
      setSelectedPlanId(route.params.serviceId);
    }
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.serviceId, route?.params?.initialTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDuties();
  };

  // ── 1-Tap Accept Responsibility ──
  const handleAcceptDuty = async (duty: MemberServiceDuty) => {
    Alert.alert(
      'Accept Responsibility',
      `Confirm your responsibility as "${duty.roleTitle}" for "${duty.serviceTitle}" on ${formatDateMonthYear(duty.date)}? First to accept gets booked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Accept Responsibility',
          style: 'default',
          onPress: async () => {
            try {
              setSubmittingResponse(true);
              await ServiceRosterService.respondToAssignment(
                churchId,
                duty.serviceId,
                duty.roleId,
                memberId,
                'accept',
                undefined,
                member?.name
              );
              Alert.alert(
                'Responsibility Booked!',
                `Thank you for your service! Your role as "${duty.roleTitle}" is confirmed. Reporting call time is ${formatTimeTo12Hour(duty.callTime)}.`
              );
              fetchDuties();
            } catch (err: any) {
              const msg = err.message || 'Failed to accept responsibility.';
              if (msg.includes('already been booked')) {
                Alert.alert('Slot Already Booked', msg);
              } else {
                Alert.alert('Error', msg);
              }
            } finally {
              setSubmittingResponse(false);
            }
          },
        },
      ]
    );
  };

  // ── Decline Responsibility with Reason Modal ──
  const handleConfirmDecline = async () => {
    if (!selectedDutyForDecline) return;
    const finalReason =
      declineReason === 'Other personal reason' && customDeclineReason.trim()
        ? customDeclineReason.trim()
        : declineReason;

    try {
      setSubmittingResponse(true);
      await ServiceRosterService.respondToAssignment(
        churchId,
        selectedDutyForDecline.serviceId,
        selectedDutyForDecline.roleId,
        memberId,
        'decline',
        finalReason,
        member?.name
      );

      setSelectedDutyForDecline(null);
      Alert.alert(
        'Response Recorded',
        'Thank you for informing us. The slot is available for other eligible volunteers.'
      );
      fetchDuties();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record response.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // ── Delete / Cancel Responsibility Assignment ──
  const handleDeleteOrCancelDuty = (duty: MemberServiceDuty) => {
    Alert.alert(
      'Cancel Responsibility',
      `Are you sure you want to cancel your responsibility for "${duty.roleTitle}" on ${formatDateMonthYear(duty.date)}? This will make the slot available for other eligible members.`,
      [
        { text: 'Keep Responsibility', style: 'cancel' },
        {
          text: 'Cancel Responsibility',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmittingResponse(true);
              await ServiceRosterService.cancelOrDeleteDutyAssignment(
                churchId,
                duty.serviceId,
                duty.roleId,
                memberId,
                member?.name,
                'Canceled by member'
              );
              setDuties(prev =>
                prev.filter(
                  d => d.id !== duty.id && !(d.serviceId === duty.serviceId && d.roleId === duty.roleId)
                )
              );
              Alert.alert('Responsibility Cancelled', 'Your responsibility has been removed and reopened for other members.');
              fetchDuties();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel responsibility.');
            } finally {
              setSubmittingResponse(false);
            }
          },
        },
      ]
    );
  };

  // ── Blockout Dates Handlers ──
  const handleSaveBlockout = async () => {
    if (!newBlockoutDate.trim()) {
      Alert.alert('Required', 'Please enter unavailable date (YYYY-MM-DD).');
      return;
    }
    try {
      setSavingBlockout(true);
      const memberName = member?.name || 'Church Volunteer';
      await ServiceRosterService.addMemberBlockoutDate(
        churchId,
        memberId,
        memberName,
        newBlockoutDate.trim(),
        newBlockoutReason.trim()
      );
      setShowAddBlockoutModal(false);
      setNewBlockoutDate('');
      fetchDuties();
      Alert.alert('Blockout Added', 'Admins will see that you are unavailable on this date.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add blockout date.');
    } finally {
      setSavingBlockout(false);
    }
  };

  const handleRemoveBlockout = async (date: string) => {
    Alert.alert('Remove Blockout', `Mark yourself as available again on ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await ServiceRosterService.removeMemberBlockoutDate(churchId, memberId, date);
            fetchDuties();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove blockout.');
          }
        },
      },
    ]);
  };

  const pendingInvitations = duties.filter((d) => d.status === 'pending');
  const confirmedDuties = duties.filter(
    (d) => d.status === 'confirmed' || d.status === 'accepted'
  );

  const selectedPlan = publishedPlans.find(p => p.id === selectedPlanId) || publishedPlans[0] || null;

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={navyPrimary} />

      {/* ── WECHRISTIAN NAVY HEADER BAR ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: navyPrimary,
            paddingTop: insets.top + 10,
            borderBottomColor: 'rgba(251, 191, 36, 0.25)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Service Roster
          </Text>
          {activeChurch?.name ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {activeChurch.name}
            </Text>
          ) : null}
        </View>

        {pendingInvitations.length > 0 && (
          <View style={styles.pendingBadgeHeader}>
            <Text style={styles.pendingBadgeHeaderTxt}>
              {pendingInvitations.length} Pending
            </Text>
          </View>
        )}
      </View>

      {/* ── COMBINED SEGMENTED TABS: SERVICE ROSTER vs MY RESPONSIBILITIES ── */}
      {duties.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 6 }}>
          <View
            style={[
              styles.segmentContainer,
              {
                backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                borderColor: borderColor,
                borderWidth: 1,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'roster' && [
                  styles.segmentBtnActive,
                  { backgroundColor: isDark ? '#fbbf24' : navyPrimary },
                ],
              ]}
              onPress={() => setActiveTab('roster')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnTxt,
                  { color: secondaryText },
                  activeTab === 'roster' && {
                    color: isDark ? '#0f172a' : '#FFFFFF',
                    fontWeight: '800',
                  },
                ]}
              >
                Service Roster
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'responsibilities' && [
                  styles.segmentBtnActive,
                  { backgroundColor: isDark ? '#fbbf24' : navyPrimary },
                ],
              ]}
              onPress={() => setActiveTab('responsibilities')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnTxt,
                  { color: secondaryText },
                  activeTab === 'responsibilities' && {
                    color: isDark ? '#0f172a' : '#FFFFFF',
                    fontWeight: '800',
                  },
                ]}
              >
                My Responsibilities
              </Text>
              <View
                style={[
                  styles.segmentBadge,
                  {
                    backgroundColor:
                      activeTab === 'responsibilities'
                        ? isDark ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.22)'
                        : isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentBadgeTxt,
                    {
                      color:
                        activeTab === 'responsibilities'
                          ? isDark ? '#0f172a' : '#FFFFFF'
                          : primaryText,
                    },
                  ]}
                >
                  {duties.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={isDark ? goldAccent : navyPrimary} />
          <Text style={[styles.loadingTxt, { color: secondaryText }]}>
            Loading your ministry duties...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[navyPrimary, goldAccent]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================================
              TAB 0: FULL CHURCH SERVICE ROSTER (ACCESSIBLE TO ALL MEMBERS)
              ========================================================================= */}
          {activeTab === 'roster' && (
            <View>
              {publishedPlans.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Smile size={38} color={secondaryText} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>
                    No Published Service Roster Yet
                  </Text>
                  <Text style={[styles.emptySub, { color: secondaryText }]}>
                    The church worship team and coordinators have not published the upcoming service roster yet. Check back soon!
                  </Text>
                </View>
              ) : (
                <View>
                  {publishedPlans.length > 1 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.sectionTitle, { color: secondaryText, fontSize: 11, marginBottom: 6 }]}>
                        UPCOMING SERVICES ({publishedPlans.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {publishedPlans.map((p) => {
                          const isSel = selectedPlan?.id === p.id;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={[
                                styles.servicePickerChip,
                                {
                                  backgroundColor: isSel ? navyPrimary : cardSurface,
                                  borderColor: isSel ? goldAccent : borderColor,
                                },
                              ]}
                              onPress={() => setSelectedPlanId(p.id)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.servicePickerChipTitle, { color: isSel ? '#FFFFFF' : primaryText }]}>
                                {p.serviceTitle}
                              </Text>
                              <Text style={[styles.servicePickerChipDate, { color: isSel ? goldAccent : secondaryText }]}>
                                {formatDateMonthYear(p.date)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {selectedPlan && (
                    <View>
                      {/* SERVICE OVERVIEW BANNER */}
                      <View style={[styles.rosterServiceBanner, { backgroundColor: cardSurface, borderColor }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
                              paddingHorizontal: 8,
                              paddingVertical: 3.5,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                            }}
                          >
                            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' }} />
                            <Text style={[styles.rosterBannerTag, { fontSize: 9.5 }]}>
                              {selectedPlan.status === 'live'
                                ? 'LIVE SERVICE NOW'
                                : selectedPlan.status === 'published'
                                ? 'PUBLISHED CHURCH SERVICE'
                                : 'DRAFT SERVICE'}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : '#F1F5F9',
                              paddingHorizontal: 8,
                              paddingVertical: 3.5,
                              borderRadius: 12,
                            }}
                          >
                            <Calendar size={11} color={activeAccentText} />
                            <Text style={[styles.rosterBannerDate, { color: activeAccentText, fontSize: 11 }]}>
                              {formatDateMonthYear(selectedPlan.date)}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.rosterBannerTitle, { color: primaryText }]}>
                          {selectedPlan.serviceTitle}
                        </Text>

                        <View style={{ marginTop: 8, gap: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} color={secondaryText} />
                            <Text style={{ fontSize: 12.5, color: primaryText, fontWeight: '600' }}>
                              {formatTimeTo12Hour(selectedPlan.startTime)} - {formatTimeTo12Hour(selectedPlan.endTime)}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MapPin size={13} color={secondaryText} />
                            <Text style={{ fontSize: 12.5, color: secondaryText }}>
                              {selectedPlan.location || 'Church Sanctuary'}
                            </Text>
                          </View>
                          {selectedPlan.preacher && selectedPlan.preacher.trim() ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <BookOpen size={13} color={secondaryText} />
                              <Text style={{ fontSize: 12.5, color: secondaryText }}>
                                Preacher / Speaker:{' '}
                                <Text style={{ fontWeight: '700', color: primaryText }}>
                                  {selectedPlan.preacher.trim()}
                                </Text>
                              </Text>
                            </View>
                          ) : null}
                          {selectedPlan.theme ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Sparkles size={13} color="#D97706" />
                              <Text style={{ fontSize: 12.5, color: '#D97706', fontWeight: '600' }}>
                                Theme: {selectedPlan.theme}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Personal Duty Pass if member is serving */}
                        {(() => {
                          const myDutyInThisService = duties.find(d => d.serviceId === selectedPlan.id);
                          if (!myDutyInThisService) return null;
                          const isPending = myDutyInThisService.status === 'pending';

                          const rLower = (myDutyInThisService.roleTitle || '').toLowerCase();
                          let roleIconEmoji = '✝️';
                          if (rLower.includes('keyboard') || rLower.includes('piano')) roleIconEmoji = '🎹';
                          else if (rLower.includes('drum')) roleIconEmoji = '🥁';
                          else if (rLower.includes('bass')) roleIconEmoji = '🎸';
                          else if (rLower.includes('guitar')) roleIconEmoji = '🎸';
                          else if (rLower.includes('sound') || rLower.includes('audio')) roleIconEmoji = '🎧';
                          else if (rLower.includes('worship') || rLower.includes('lead') || rLower.includes('sing')) roleIconEmoji = '🎤';
                          else if (rLower.includes('usher') || rLower.includes('greet')) roleIconEmoji = '🤝';
                          else if (rLower.includes('media') || rLower.includes('camera') || rLower.includes('stream')) roleIconEmoji = '📹';
                          else if (rLower.includes('prayer')) roleIconEmoji = '🙏';

                          return (
                            <View
                              style={[
                                styles.personalCalloutBox,
                                {
                                  backgroundColor: isPending
                                    ? isDark ? 'rgba(217, 119, 6, 0.14)' : '#FFFBEB'
                                    : isDark ? 'rgba(5, 150, 105, 0.14)' : '#F0FDF4',
                                  borderColor: isPending ? '#D97706' : confirmBtnBg,
                                  borderWidth: 1.2,
                                  borderRadius: 14,
                                  padding: 13,
                                  marginTop: 14,
                                },
                              ]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                    backgroundColor: isPending
                                      ? isDark ? 'rgba(217, 119, 6, 0.22)' : '#FEF3C7'
                                      : isDark ? 'rgba(16, 185, 129, 0.22)' : '#DCFCE7',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3.5,
                                    borderRadius: 20,
                                  }}
                                >
                                  {isPending ? (
                                    <AlertCircle size={12} color="#D97706" />
                                  ) : (
                                    <CheckCircle2 size={12} color="#10B981" />
                                  )}
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: '800',
                                      color: isPending ? '#D97706' : confirmBtnBg,
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    {isPending ? 'INVITATION · ACTION REQUIRED' : 'CONFIRMED DUTY'}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 20,
                                  }}
                                >
                                  <Clock size={11} color={isDark ? goldAccent : '#D97706'} />
                                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? '#FDE68A' : '#92400E' }}>
                                    Call: {formatTimeTo12Hour(myDutyInThisService.callTime)}
                                  </Text>
                                </View>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: isPending
                                      ? isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7'
                                      : isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7',
                                    borderWidth: 1.5,
                                    borderColor: isPending ? '#D97706' : '#10B981',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ fontSize: 20 }}>{roleIconEmoji}</Text>
                                </View>

                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: secondaryText, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                    Your Assigned Role
                                  </Text>
                                  <Text style={{ fontSize: 15, fontWeight: '800', color: primaryText, marginTop: 1 }} numberOfLines={1}>
                                    {myDutyInThisService.roleTitle}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: isPending ? '#D97706' : isDark ? '#34D399' : confirmBtnBg, marginTop: 2, fontWeight: '600' }} numberOfLines={1}>
                                    {isPending ? 'Tap below to accept or decline' : '✓ Active on service roster · You are serving this service'}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 10,
                                  paddingTop: 8,
                                  borderTopWidth: 1,
                                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                }}
                              >
                                <Clock size={12} color={isDark ? '#34D399' : confirmBtnBg} />
                                <Text style={{ fontSize: 11.5, color: secondaryText }}>
                                  Reporting Call Time:{' '}
                                  <Text style={{ fontWeight: '800', color: primaryText }}>
                                    {formatTimeTo12Hour(myDutyInThisService.callTime)}
                                  </Text>
                                </Text>
                              </View>

                              {isPending && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                  <TouchableOpacity
                                    style={[styles.dutyAcceptBtn, { flex: 1, paddingVertical: 9, backgroundColor: confirmBtnBg, borderRadius: 10 }]}
                                    onPress={() => handleAcceptDuty(myDutyInThisService)}
                                  >
                                    <CheckCircle2 size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                                    <Text style={[styles.dutyAcceptBtnTxt, { fontSize: 12.5, fontWeight: '700' }]}>Accept Duty</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.dutyDeclineBtn, { flex: 1, paddingVertical: 9, borderRadius: 10, borderColor: crimsonAccent }]}
                                    onPress={() => setSelectedDutyForDecline(myDutyInThisService)}
                                  >
                                    <XCircle size={14} color={crimsonAccent} style={{ marginRight: 5 }} />
                                    <Text style={[styles.dutyDeclineBtnTxt, { fontSize: 12.5, fontWeight: '700', color: crimsonAccent }]}>Decline</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })()}
                      </View>

                      {/* 1. SERVICE WORSHIP BAND & MUSICIANS ROSTER */}
                      <View style={[styles.rosterSectionCard, { backgroundColor: cardSurface, borderColor }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                          <Music size={16} color={activeAccentText} />
                          <View>
                            <Text style={[styles.sectionTitle, { color: primaryText, marginBottom: 0 }]}>
                              SERVICE WORSHIP BAND & MUSICIANS
                            </Text>
                            <Text style={{ fontSize: 10.5, color: secondaryText }}>
                              Assigned for the entire service and all setlist songs
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                          {[
                            { emoji: '🎹', role: 'KEYBOARD', key: 'role_keyboard' },
                            { emoji: '🥁', role: 'DRUMS', key: 'role_drums' },
                            { emoji: '🎸', role: 'BASS GUITAR', key: 'role_bass' },
                            { emoji: '🎸', role: 'ACOUSTIC GUITAR', key: 'role_acoustic' },
                            { emoji: '⚡', role: 'ELECTRIC GUITAR', key: 'role_electric' },
                            { emoji: '🎧', role: 'SOUND / AUDIO', key: 'role_sound' },
                          ].map((inst) => {
                            const assignedName =
                              selectedPlan.assignments?.[inst.key] ||
                              selectedPlan.assignments?.[inst.key.replace('role_', '')] ||
                              '';
                            const assignedId =
                              selectedPlan.assignmentMemberIds?.[inst.key] ||
                              selectedPlan.assignmentMemberIds?.[inst.key.replace('role_', '')];
                            const isMyRole =
                              (assignedId && assignedId === memberId) ||
                              (member?.name && assignedName && member.name.toLowerCase().trim() === assignedName.toLowerCase().trim());
                            return (
                              <View
                                key={inst.role}
                                style={[
                                  styles.bandMemberPill,
                                  {
                                    backgroundColor: isMyRole
                                      ? isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'
                                      : isDark ? '#0f172a' : '#F8FAFC',
                                    borderColor: isMyRole ? '#10B981' : borderColor,
                                    borderWidth: isMyRole ? 1.5 : 1,
                                  },
                                ]}
                              >
                                <View
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,45,90,0.06)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ fontSize: 14 }}>{inst.emoji}</Text>
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>
                                      {inst.role}
                                    </Text>
                                    {isMyRole && (
                                      <Text style={{ fontSize: 8.5, color: '#10B981', fontWeight: '800' }}>YOU</Text>
                                    )}
                                  </View>
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: '700',
                                      color: assignedName ? primaryText : secondaryText,
                                      lineHeight: 16,
                                      marginTop: 2,
                                    }}
                                    numberOfLines={2}
                                  >
                                    {assignedName || 'Not Assigned'}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}

                          {(selectedPlan.assignments?.role_worship_leader || selectedPlan.assignments?.worship_leader) ? (
                            <View
                              style={[
                                styles.bandMemberPill,
                                {
                                  width: '100%',
                                  backgroundColor:
                                    selectedPlan.assignmentMemberIds?.role_worship_leader === memberId ||
                                    (member?.name &&
                                      selectedPlan.assignments.role_worship_leader &&
                                      member.name.toLowerCase().trim() ===
                                        selectedPlan.assignments.role_worship_leader.toLowerCase().trim())
                                      ? isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'
                                      : isDark ? '#0f172a' : '#F8FAFC',
                                  borderColor:
                                    selectedPlan.assignmentMemberIds?.role_worship_leader === memberId ||
                                    (member?.name &&
                                      selectedPlan.assignments.role_worship_leader &&
                                      member.name.toLowerCase().trim() ===
                                        selectedPlan.assignments.role_worship_leader.toLowerCase().trim())
                                      ? '#10B981'
                                      : borderColor,
                                  borderWidth: 1,
                                },
                              ]}
                            >
                              <View
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,45,90,0.06)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ fontSize: 14 }}>🎤</Text>
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>
                                    WORSHIP LEADER
                                  </Text>
                                  {(selectedPlan.assignmentMemberIds?.role_worship_leader === memberId ||
                                    (member?.name &&
                                      selectedPlan.assignments.role_worship_leader &&
                                      member.name.toLowerCase().trim() ===
                                        selectedPlan.assignments.role_worship_leader.toLowerCase().trim())) && (
                                    <Text style={{ fontSize: 8.5, color: '#10B981', fontWeight: '800' }}>YOU</Text>
                                  )}
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: primaryText, lineHeight: 16, marginTop: 2 }} numberOfLines={2}>
                                  {selectedPlan.assignments.role_worship_leader || selectedPlan.assignments.worship_leader}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* 2. ORDER OF SERVICE TIMELINE & ROSTER */}
                      <View style={[styles.rosterSectionCard, { backgroundColor: cardSurface, borderColor }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: isDark ? 'rgba(251, 191, 36, 0.14)' : 'rgba(26, 45, 90, 0.08)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ListChecks size={18} color={activeAccentText} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.sectionTitle, { color: primaryText, marginBottom: 2, fontSize: 13.5, letterSpacing: 0.3 }]} numberOfLines={1}>
                              ORDER OF SERVICE & RESPONSIBILITIES
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={{ fontSize: 11, color: secondaryText }}>
                                {selectedPlan.runSheet?.length || 0} Scheduled items
                              </Text>
                              <Text style={{ fontSize: 11, color: secondaryText }}>•</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3.5 }}>
                                <Clock size={11} color={activeAccentText} />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: activeAccentText }}>
                                  {formatTimeTo12Hour(selectedPlan.startTime)} – {formatTimeTo12Hour(selectedPlan.endTime)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {!selectedPlan.runSheet || selectedPlan.runSheet.length === 0 ? (
                          <Text style={{ fontSize: 12, color: secondaryText, fontStyle: 'italic', paddingVertical: 8 }}>
                            Order of service details will appear here once finalized by coordinators.
                          </Text>
                        ) : (
                          selectedPlan.runSheet.map((item, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === selectedPlan.runSheet.length - 1;
                            const catStyle = getCategoryStyle(item.category, isDark, customCategories);

                            const assignment = resolveActivityAssignment(
                              item,
                              selectedPlan,
                              memberId,
                              member?.name
                            );

                            const isHighlighted = assignment.isMyServing;
                            const myDutyInThisService = duties.find(d => d.serviceId === selectedPlan.id);

                            return (
                              <View key={item.id || `run_${idx}`} style={{ flexDirection: 'row', minHeight: 74 }}>
                                {/* Timeline connector */}
                                <View style={{ width: 28, alignItems: 'center' }}>
                                  <View
                                    style={{
                                      width: 2,
                                      height: 12,
                                      backgroundColor: isFirst ? 'transparent' : borderColor,
                                    }}
                                  />
                                  <View
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 12,
                                      backgroundColor: isHighlighted ? '#10B981' : isDark ? '#0f172a' : '#F1F5F9',
                                      borderWidth: 1.5,
                                      borderColor: isHighlighted ? '#059669' : borderColor,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 2,
                                    }}
                                  >
                                    {isHighlighted ? (
                                      <Sparkles size={12} color="#FFFFFF" />
                                    ) : (
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: secondaryText }}>
                                        {idx + 1}
                                      </Text>
                                    )}
                                  </View>
                                  <View
                                    style={{
                                      width: 2,
                                      flex: 1,
                                      backgroundColor: isLast ? 'transparent' : borderColor,
                                    }}
                                  />
                                </View>

                                {/* Timeline Card */}
                                <View
                                  style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    marginBottom: 10,
                                    backgroundColor: isHighlighted
                                      ? isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4'
                                      : isDark ? '#0f172a' : '#F8FAFC',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: isHighlighted ? '#10B981' : borderColor,
                                    padding: 12,
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                      <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
                                        <Text style={[styles.categoryBadgeTxt, { color: catStyle.text }]}>
                                          {(
                                            customCategories.find(c => c.id === item.category)?.label ||
                                            item.category.replace(/_/g, ' ')
                                          ).toUpperCase()}
                                        </Text>
                                      </View>
                                      {isHighlighted && (
                                        <View style={{ backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                                          <Text style={{ fontSize: 8.5, color: '#FFFFFF', fontWeight: '800' }}>YOU'RE SERVING</Text>
                                        </View>
                                      )}
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <Clock size={11} color={secondaryText} />
                                      <Text style={{ fontSize: 11, fontWeight: '700', color: primaryText }}>
                                        {formatTimeTo12Hour(item.startTime)} - {formatTimeTo12Hour(item.endTime)}
                                      </Text>
                                      <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,45,90,0.06)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }}>{item.durationMinutes}m</Text>
                                      </View>
                                    </View>
                                  </View>

                                  <Text style={[styles.runSheetProgramTitle, { color: primaryText, marginTop: 1, fontSize: 14.5 }]}>
                                    {item.program}
                                  </Text>

                                  <View style={{ marginTop: 6, gap: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                      <Users size={12} color={secondaryText} />
                                      <Text style={{ fontSize: 12, color: secondaryText }}>
                                        Assigned:{' '}
                                        {assignment.isAssigned ? (
                                          <Text style={{ fontWeight: '700', color: isHighlighted ? (isDark ? '#34D399' : confirmBtnBg) : primaryText }}>
                                            {assignment.assignedName}
                                          </Text>
                                        ) : (
                                          <Text style={{ fontStyle: 'italic', color: secondaryText }}>
                                            Not Assigned
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  </View>

                                  {assignment.bandMusicians && assignment.bandMusicians.length > 0 && (
                                    <View
                                      style={{
                                        marginTop: 8,
                                        padding: 8,
                                        borderRadius: 8,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                        borderWidth: 1,
                                        borderColor,
                                      }}
                                    >
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                        <Music size={11} color={activeAccentText} />
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: activeAccentText, letterSpacing: 0.4 }}>
                                          WORSHIP TEAM & MUSICIANS
                                        </Text>
                                      </View>
                                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                        {assignment.bandMusicians.map(b => (
                                          <View
                                            key={b.key}
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 4,
                                              backgroundColor: b.isYou
                                                ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7'
                                                : isDark ? '#1e293b' : '#F1F5F9',
                                              borderColor: b.isYou ? '#10B981' : borderColor,
                                              borderWidth: b.isYou ? 1.5 : 1,
                                              paddingHorizontal: 7,
                                              paddingVertical: 3.5,
                                              borderRadius: 6,
                                            }}
                                          >
                                            <Text style={{ fontSize: 11 }}>{b.emoji}</Text>
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                fontWeight: '700',
                                                color: b.isYou ? (isDark ? '#34D399' : confirmBtnBg) : primaryText,
                                              }}
                                            >
                                              {b.role.split(' ')[0]}: {b.name}
                                            </Text>
                                            {b.isYou && (
                                              <View style={{ backgroundColor: '#10B981', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                                                <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '800' }}>YOU</Text>
                                              </View>
                                            )}
                                          </View>
                                        ))}
                                      </View>

                                      {isHighlighted && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                          <Sparkles size={11} color="#10B981" />
                                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? '#34D399' : confirmBtnBg }}>
                                            You are actively serving on {assignment.myRoleName} for this worship segment
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  )}

                                  {assignment.prepTeamSlots && assignment.prepTeamSlots.length > 0 && assignment.isAssigned && (
                                    <View
                                      style={{
                                        marginTop: 8,
                                        padding: 8,
                                        borderRadius: 8,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                        borderWidth: 1,
                                        borderColor,
                                      }}
                                    >
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                        <Users size={11} color={activeAccentText} />
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: activeAccentText, letterSpacing: 0.4 }}>
                                          SOUND & MEDIA PREP TEAM
                                        </Text>
                                      </View>
                                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                        {assignment.prepTeamSlots.map(slot => (
                                          <View
                                            key={slot.key}
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 4,
                                              backgroundColor: slot.isYou
                                                ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7'
                                                : isDark ? '#1e293b' : '#F1F5F9',
                                              borderColor: slot.isYou ? '#10B981' : borderColor,
                                              borderWidth: slot.isYou ? 1.5 : 1,
                                              paddingHorizontal: 7,
                                              paddingVertical: 3.5,
                                              borderRadius: 6,
                                            }}
                                          >
                                            <Text style={{ fontSize: 11 }}>{slot.emoji}</Text>
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                fontWeight: '700',
                                                color: slot.isYou
                                                  ? isDark ? '#34D399' : confirmBtnBg
                                                  : slot.isAssigned ? primaryText : secondaryText,
                                                fontStyle: slot.isAssigned ? 'normal' : 'italic',
                                              }}
                                            >
                                              {slot.role}: {slot.name}
                                            </Text>
                                            {slot.isYou && (
                                              <View style={{ backgroundColor: '#10B981', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                                                <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '800' }}>YOU</Text>
                                              </View>
                                            )}
                                          </View>
                                        ))}
                                      </View>

                                      {isHighlighted && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                          <Sparkles size={11} color="#10B981" />
                                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? '#34D399' : confirmBtnBg }}>
                                            You are serving in {assignment.myRoleName}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  )}

                                  {item.category === 'preparation' && myDutyInThisService && (
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                        paddingHorizontal: 7,
                                        paddingVertical: 3.5,
                                        borderRadius: 6,
                                        marginTop: 6,
                                      }}
                                    >
                                      <Clock size={11} color="#D97706" />
                                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? goldAccent : '#92400E' }}>
                                        Sound Check Call: Please arrive by {formatTimeTo12Hour(myDutyInThisService.callTime)}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          })
                        )}
                      </View>

                      {/* 3. WORSHIP SETLIST SONGS */}
                      {selectedPlan.setlist && selectedPlan.setlist.length > 0 && (
                        <View style={[styles.rosterSectionCard, { backgroundColor: cardSurface, borderColor }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                            <Music size={16} color={activeAccentText} />
                            <View>
                              <Text style={[styles.sectionTitle, { color: primaryText, marginBottom: 0 }]}>
                                WORSHIP SETLIST ({selectedPlan.setlist.length} Songs)
                              </Text>
                              <Text style={{ fontSize: 10.5, color: secondaryText }}>
                                Praise & worship songs selected for this service
                              </Text>
                            </View>
                          </View>

                          {selectedPlan.setlist.map((song, sIdx) => (
                            <View
                              key={song.id || `set_${sIdx}`}
                              style={[styles.setlistSongCard, { backgroundColor: isDark ? '#0f172a' : '#F8FAFC', borderColor }]}
                            >
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <View style={styles.songKeyPill}>
                                    <Text style={styles.songKeyPillTxt}>Key {song.key || 'G'}</Text>
                                  </View>
                                  {song.tempo ? (
                                    <View style={styles.songBpmPill}>
                                      <Text style={styles.songBpmPillTxt}>{song.tempo} BPM</Text>
                                    </View>
                                  ) : null}
                                  {song.timeSignature ? (
                                    <View style={styles.songBpmPill}>
                                      <Text style={styles.songBpmPillTxt}>{song.timeSignature}</Text>
                                    </View>
                                  ) : null}
                                </View>

                                <Text style={[styles.songTitleTxt, { color: primaryText }]}>
                                  {sIdx + 1}. {song.title}
                                </Text>
                                {song.titleTe ? (
                                  <Text style={[styles.songSubTxt, { color: '#D97706' }]}>
                                    {song.titleTe}
                                  </Text>
                                ) : null}
                                <Text style={{ fontSize: 11, color: secondaryText, marginTop: 2 }}>
                                  Lead:{' '}
                                  <Text style={{ fontWeight: '700', color: primaryText }}>
                                    {song.ledBy || selectedPlan.assignments?.role_worship_leader || 'Worship Team'}
                                  </Text>
                                </Text>
                              </View>

                              {(song.lyricsTe || song.lyricsEn) && (
                                <TouchableOpacity
                                  style={[styles.viewLyricsBtn, { backgroundColor: navyPrimary }]}
                                  onPress={() => {
                                    setSelectedSongForLyrics(song);
                                    setShowLyricsModal(true);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <BookOpen size={12} color={goldAccent} style={{ marginRight: 4 }} />
                                  <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>Lyrics</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* =========================================================================
              TAB 1: UPCOMING RESPONSIBILITIES & PENDING INVITATIONS
              ========================================================================= */}
          {activeTab === 'responsibilities' && (
            <View>
              {pendingInvitations.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeadingRow}>
                    <AlertCircle size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={styles.pendingSectionTitle}>
                      ACTION REQUIRED ({pendingInvitations.length})
                    </Text>
                  </View>
                  <Text style={[styles.pendingSectionSub, { color: secondaryText }]}>
                    Please accept or decline your assigned responsibility so coordinators can finalize the roster.
                  </Text>

                  {pendingInvitations.map((duty) => (
                    <View
                      key={duty.id}
                      style={[styles.pendingDutyCard, { backgroundColor: cardSurface, borderColor: '#F59E0B' }]}
                    >
                      <View style={styles.pendingDutyHeader}>
                        <View style={styles.pendingPill}>
                          <Clock size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.pendingPillTxt}>
                            {duty.instructions?.includes('First-come') ? 'OPEN RESPONSIBILITY · FIRST-COME' : 'INVITATION PENDING'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.dutyDateTxt, { color: secondaryText }]}>
                            {formatDateMonthYear(duty.date)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteOrCancelDuty(duty)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                            style={{ padding: 2 }}
                          >
                            <Trash2 size={15} color={crimsonAccent} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={[styles.dutyRoleTitle, { color: primaryText }]}>
                        {duty.roleTitle}
                      </Text>
                      <Text style={[styles.dutyServiceTitle, { color: activeAccentText }]}>
                        {duty.serviceTitle}
                      </Text>

                      <View style={[styles.dutyMetaBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                          <Clock size={13} color="#D97706" style={{ marginTop: 2 }} />
                          <Text style={{ fontSize: 12, color: secondaryText, flex: 1, lineHeight: 18 }}>
                            Reporting / Call Time:{' '}
                            <Text style={{ fontWeight: '700', color: isDark ? goldAccent : '#D97706' }}>
                              {formatTimeTo12Hour(duty.callTime)}
                            </Text>
                            {duty.startTime ? ` (Service starts ${formatTimeTo12Hour(duty.startTime)})` : ''}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 4 }}>
                          <MapPin size={13} color={confirmBtnBg} style={{ marginTop: 2 }} />
                          <Text style={{ fontSize: 12, color: secondaryText, flex: 1, lineHeight: 18 }}>
                            Sanctuary:{' '}
                            <Text style={{ fontWeight: '700', color: primaryText }}>
                              {duty.location || 'Church Sanctuary'}
                            </Text>
                            {duty.preacher && duty.preacher.trim() ? ` · Preacher: ${duty.preacher.trim()}` : ''}
                          </Text>
                        </View>

                        {duty.instructions ? (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 4 }}>
                            <Volume2 size={13} color="#7C3AED" style={{ marginTop: 2 }} />
                            <Text style={{ fontSize: 12, color: secondaryText, flex: 1, lineHeight: 18 }}>
                              Notes: <Text style={{ fontWeight: '600', color: primaryText }}>{duty.instructions}</Text>
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.dutyActionRow}>
                        <TouchableOpacity
                          style={[styles.dutyDeclineBtn, { borderColor }]}
                          onPress={() => setSelectedDutyForDecline(duty)}
                          activeOpacity={0.8}
                          disabled={submittingResponse}
                        >
                          <XCircle size={15} color={crimsonAccent} style={{ marginRight: 6 }} />
                          <Text style={styles.dutyDeclineBtnTxt}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.dutyAcceptBtn}
                          onPress={() => handleAcceptDuty(duty)}
                          activeOpacity={0.85}
                          disabled={submittingResponse}
                        >
                          <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.dutyAcceptBtnTxt}>Accept Responsibility</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* CONFIRMED UPCOMING SERVICES */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  CONFIRMED UPCOMING SERVICES ({confirmedDuties.length})
                </Text>

                {confirmedDuties.length === 0 && pendingInvitations.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor }]}>
                    <Smile size={38} color={secondaryText} style={{ marginBottom: 10 }} />
                    <Text style={[styles.emptyTitle, { color: primaryText }]}>
                      No Upcoming Responsibilities Scheduled
                    </Text>
                    <Text style={[styles.emptySub, { color: secondaryText }]}>
                      You currently have no scheduled service responsibilities. You will automatically receive a notification when coordinators publish a service with matching skills.
                    </Text>
                  </View>
                ) : (
                  confirmedDuties.map((duty) => (
                    <View
                      key={duty.id}
                      style={[styles.confirmedDutyCard, { backgroundColor: cardSurface, borderColor }]}
                    >
                      <View style={styles.confirmedTopRow}>
                        <View style={styles.confirmedTag}>
                          <CheckCircle2 size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.confirmedTagTxt}>CONFIRMED</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.dutyDateTxt, { color: secondaryText }]}>
                            {formatDateMonthYear(duty.date)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteOrCancelDuty(duty)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                            style={{ padding: 2 }}
                          >
                            <Trash2 size={15} color={crimsonAccent} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={[styles.dutyRoleTitle, { color: primaryText }]}>
                        {duty.roleTitle}
                      </Text>
                      <Text style={[styles.dutyServiceTitle, { color: activeAccentText }]}>
                        {duty.serviceTitle}
                      </Text>

                      <View style={[styles.dutyMetaBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                          <Clock size={13} color={confirmBtnBg} style={{ marginTop: 2 }} />
                          <Text style={{ fontSize: 12, color: secondaryText, flex: 1, lineHeight: 18 }}>
                            Reporting Call Time:{' '}
                            <Text style={{ fontWeight: '700', color: isDark ? '#34D399' : confirmBtnBg }}>
                              {formatTimeTo12Hour(duty.callTime)}
                            </Text>
                            {duty.startTime ? ` (Service: ${formatTimeTo12Hour(duty.startTime)}${duty.endTime ? ` - ${formatTimeTo12Hour(duty.endTime)}` : ''})` : ''}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 4 }}>
                          <MapPin size={13} color={secondaryText} style={{ marginTop: 2 }} />
                          <Text style={{ fontSize: 12, color: secondaryText, flex: 1, lineHeight: 18 }}>
                            Location:{' '}
                            <Text style={{ fontWeight: '700', color: primaryText }}>
                              {duty.location || 'Church Sanctuary'}
                            </Text>
                            {duty.preacher && duty.preacher.trim() ? ` · Preacher: ${duty.preacher.trim()}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        {duty.setlist?.length > 0 && (
                          <TouchableOpacity
                            style={[styles.viewSetlistBtn, { flex: 1, marginTop: 0 }]}
                            onPress={() => {
                              setSelectedPlanId(duty.serviceId);
                              setActiveTab('roster');
                            }}
                            activeOpacity={0.8}
                          >
                            <Music size={13} color={activeAccentText} style={{ marginRight: 6 }} />
                            <Text style={[styles.viewSetlistBtnTxt, { color: activeAccentText }]}>
                              {duty.setlist.length} Songs in Roster
                            </Text>
                            <ChevronRight size={14} color={activeAccentText} />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.cancelDutyBtn,
                            {
                              borderColor: isDark ? 'rgba(192, 57, 43, 0.45)' : '#FCA5A5',
                              backgroundColor: isDark ? 'rgba(192, 57, 43, 0.14)' : '#FEF2F2',
                              flex: duty.setlist?.length > 0 ? 0.9 : 1,
                            },
                          ]}
                          onPress={() => handleDeleteOrCancelDuty(duty)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={13} color={crimsonAccent} style={{ marginRight: 5 }} />
                          <Text style={styles.cancelDutyBtnTxt}>Cancel Responsibility</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* SECTION: BLOCKOUT / UNAVAILABILITY DATES */}
              <View style={[styles.sectionWrap, { marginTop: 24 }]}>
                <View style={styles.availTopRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.sectionTitle, { color: primaryText }]}>
                      MY BLOCKOUT DATES ({blockouts.length})
                    </Text>
                    <Text style={[styles.pendingSectionSub, { color: secondaryText }]}>
                      Mark dates when you are traveling or unavailable so coordinators don't schedule you.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addBlockoutBtn,
                      { backgroundColor: isDark ? goldAccent : navyPrimary },
                    ]}
                    onPress={() => setShowAddBlockoutModal(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={14} color={isDark ? '#0f172a' : '#FFFFFF'} style={{ marginRight: 4 }} />
                    <Text style={[styles.addBlockoutBtnTxt, { color: isDark ? '#0f172a' : '#FFFFFF' }]}>
                      Add Date
                    </Text>
                  </TouchableOpacity>
                </View>

                {blockouts.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor, paddingVertical: 18 }]}>
                    <CalendarX size={28} color={secondaryText} style={{ marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, { color: primaryText, fontSize: 14 }]}>
                      No Blockout Dates Set
                    </Text>
                    <Text style={[styles.emptySub, { color: secondaryText, fontSize: 11 }]}>
                      You are currently marked as available for upcoming services.
                    </Text>
                  </View>
                ) : (
                  blockouts.map((b, idx) => (
                    <View
                      key={`${b.date}_${idx}`}
                      style={[styles.blockoutCard, { backgroundColor: cardSurface, borderColor }]}
                    >
                      <View style={styles.blockoutDateBox}>
                        <CalendarX size={16} color={crimsonAccent} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.blockoutDateTxt, { color: primaryText }]}>
                            {b.date}
                          </Text>
                          <Text style={[styles.blockoutReasonTxt, { color: secondaryText }]}>
                            {b.reason || 'Personal blockout'}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteBlockoutBtn}
                        onPress={() => handleRemoveBlockout(b.date)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={16} color={crimsonAccent} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── MODAL: DECLINE REASON SELECTOR ── */}
      <Modal visible={!!selectedDutyForDecline} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  Decline Service Responsibility
                </Text>
                <Text style={[styles.modalSub, { color: secondaryText }]}>
                  {selectedDutyForDecline?.roleTitle} · {selectedDutyForDecline?.date}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDutyForDecline(null)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>
              Please select a reason:
            </Text>

            {DECLINE_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  declineReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setDeclineReason(reason)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioCircle,
                    declineReason === reason && styles.radioCircleActive,
                  ]}
                />
                <Text
                  style={[
                    styles.reasonTxt,
                    { color: primaryText },
                    declineReason === reason && { fontWeight: '700' },
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            {declineReason === 'Other personal reason' && (
              <TextInput
                style={[styles.customReasonInput, { borderColor, color: primaryText }]}
                placeholder="Explain reason briefly..."
                placeholderTextColor={secondaryText}
                value={customDeclineReason}
                onChangeText={setCustomDeclineReason}
              />
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor }]}
                onPress={() => setSelectedDutyForDecline(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelBtnTxt, { color: primaryText }]}>Keep Responsibility</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmDeclineBtn}
                onPress={handleConfirmDecline}
                activeOpacity={0.85}
                disabled={submittingResponse}
              >
                {submittingResponse ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmDeclineBtnTxt}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: LYRICS & PRACTICE SHEET ── */}
      <Modal visible={showLyricsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.lyricsSheet, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                  <View style={styles.songKeyPill}>
                    <Text style={styles.songKeyPillTxt}>Key {selectedSongForLyrics?.key || 'G'}</Text>
                  </View>
                  <View style={styles.songBpmPill}>
                    <Text style={styles.songBpmPillTxt}>
                      {selectedSongForLyrics?.tempo ? `${selectedSongForLyrics.tempo} BPM` : '120 BPM'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.lyricsModalTitle, { color: primaryText }]}>
                  {selectedSongForLyrics?.title}
                </Text>
                {selectedSongForLyrics?.titleTe ? (
                  <Text style={[styles.lyricsModalSub, { color: secondaryText }]}>
                    {selectedSongForLyrics.titleTe}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity onPress={() => setShowLyricsModal(false)}>
                <X size={22} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {selectedSongForLyrics?.lyricsTe ? (
                <View style={styles.lyricsBlock}>
                  <Text style={[styles.lyricsBlockHeading, { color: activeAccentText }]}>
                    REGIONAL / TELUGU LYRICS
                  </Text>
                  <Text style={[styles.lyricsTeTxt, { color: primaryText }]}>
                    {selectedSongForLyrics.lyricsTe}
                  </Text>
                </View>
              ) : null}

              {selectedSongForLyrics?.lyricsEn ? (
                <View style={styles.lyricsBlock}>
                  <Text style={[styles.lyricsBlockHeading, { color: activeAccentText }]}>
                    ENGLISH / TRANSLITERATION
                  </Text>
                  <Text style={[styles.lyricsEnTxt, { color: primaryText }]}>
                    {selectedSongForLyrics.lyricsEn}
                  </Text>
                </View>
              ) : null}

              {!selectedSongForLyrics?.lyricsTe && !selectedSongForLyrics?.lyricsEn && (
                <View style={styles.noLyricsWrap}>
                  <BookOpen size={36} color={secondaryText} style={{ marginBottom: 10 }} />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>
                    No Lyrics Uploaded
                  </Text>
                  <Text style={[styles.emptySub, { color: secondaryText }]}>
                    Lyrics have not been uploaded for this song yet.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ADD BLOCKOUT DATE ── */}
      <Modal visible={showAddBlockoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>Add Blockout Date</Text>
              <TouchableOpacity onPress={() => setShowAddBlockoutModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>
              Unavailable Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[styles.inputBox, { borderColor, color: primaryText }]}
              placeholder="e.g. 2026-11-15"
              placeholderTextColor={secondaryText}
              value={newBlockoutDate}
              onChangeText={setNewBlockoutDate}
            />

            <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 10 }]}>
              Reason (Optional)
            </Text>
            <TextInput
              style={[styles.inputBox, { borderColor, color: primaryText }]}
              placeholder="e.g. Family wedding / Traveling"
              placeholderTextColor={secondaryText}
              value={newBlockoutReason}
              onChangeText={setNewBlockoutReason}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor }]}
                onPress={() => setShowAddBlockoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelBtnTxt, { color: primaryText }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveBlockout}
                activeOpacity={0.85}
                disabled={savingBlockout}
              >
                {savingBlockout ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveBtnTxt}>Save Blockout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    color: 'rgba(251, 191, 36, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pendingBadgeHeader: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeHeaderTxt: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  segmentBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  segmentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  segmentBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTxt: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  scrollContent: {
    padding: 16,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingSectionTitle: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pendingSectionSub: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  pendingDutyCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pendingDutyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingPillTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dutyDateTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  dutyRoleTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  dutyServiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  dutyMetaBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  dutyActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dutyDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  dutyDeclineBtnTxt: {
    color: '#c0392b',
    fontSize: 13,
    fontWeight: '800',
  },
  dutyAcceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
  },
  dutyAcceptBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmedDutyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  confirmedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confirmedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedTagTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  viewSetlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 45, 90, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  viewSetlistBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  cancelDutyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelDutyBtnTxt: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '700',
  },
  songKeyPill: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  songKeyPillTxt: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  songBpmPill: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  songBpmPillTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  availTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addBlockoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBlockoutBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
  blockoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  blockoutDateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockoutDateTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
  blockoutReasonTxt: {
    fontSize: 11.5,
    marginTop: 1,
  },
  deleteBlockoutBtn: {
    padding: 8,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  lyricsSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  reasonOptionSelected: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: '#c0392b',
    backgroundColor: '#c0392b',
  },
  reasonTxt: {
    fontSize: 13,
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 10,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmDeclineBtn: {
    flex: 1.2,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalConfirmDeclineBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalSaveBtn: {
    flex: 1.2,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalSaveBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  lyricsModalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  lyricsModalSub: {
    fontSize: 13,
    marginTop: 2,
  },
  lyricsBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
  },
  lyricsBlockHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lyricsTeTxt: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '600',
  },
  lyricsEnTxt: {
    fontSize: 14.5,
    lineHeight: 24,
    fontWeight: '500',
  },
  noLyricsWrap: {
    padding: 30,
    alignItems: 'center',
  },
  servicePickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  servicePickerChipTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  servicePickerChipDate: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '600',
  },
  rosterServiceBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  rosterBannerTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#10B981',
  },
  rosterBannerDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  rosterBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  personalCalloutBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  rosterSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  bandMemberPill: {
    width: '48.5%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  runSheetProgramTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  setlistSongCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  songTitleTxt: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  songSubTxt: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  viewLyricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
