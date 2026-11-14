import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import {
  X,
  Search,
  Share2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import EventRsvpService, {
  EventRsvpRecord,
  MemberRsvpListItem,
} from '../../services/EventRsvpService';
import FirestoreService from '../../services/FirestoreService';
import { useAdminTheme } from '../../utils/adminThemeHelper';

const { width } = Dimensions.get('window');

export interface EventRsvpAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  churchId?: string;
  isDark?: boolean;
}

type FilterOption = 'All' | 'Going' | 'Interested' | 'Not Going' | 'Not Responded';

const formatTimestamp = (ts: any): string => {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
};

export const EventRsvpAnalyticsModal: React.FC<EventRsvpAnalyticsModalProps> = ({
  visible,
  onClose,
  eventId,
  eventTitle,
  eventDate,
  churchId,
  isDark: propIsDark,
}) => {
  const theme = useAdminTheme();
  const isDark = propIsDark !== undefined ? propIsDark : theme.isDark;

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvpRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('All');
  const [exporting, setExporting] = useState(false);

  // Load church members and subscribe to RSVPs
  useEffect(() => {
    if (!visible || !eventId) return;

    let isMounted = true;
    setLoading(true);

    const initData = async () => {
      try {
        const cId = churchId || (await FirestoreService.getChurchId()) || 'default';
        const churchMembers = await EventRsvpService.getChurchMembersForRsvp(cId);
        if (isMounted) {
          setMembers(churchMembers);
        }
      } catch (err) {
        console.warn('[EventRsvpAnalyticsModal] Failed to load church members:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();

    // Subscribe to all RSVPs for this event in real-time
    const unsub = EventRsvpService.listenToAllEventRsvps(
      churchId,
      eventId,
      (records) => {
        if (isMounted) {
          setRsvps(records);
        }
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [visible, eventId, churchId]);

  // Combine members and RSVP responses into a comprehensive roster
  const combinedRoster = useMemo<MemberRsvpListItem[]>(() => {
    const rsvpMap = new Map<string, EventRsvpRecord>();
    rsvps.forEach((r) => {
      rsvpMap.set(r.memberId || r.id, r);
    });

    // Start with all church members
    const roster: MemberRsvpListItem[] = members.map((m) => {
      const r = rsvpMap.get(m.id);
      return {
        id: m.id,
        name: m.name || m.fullName || 'Member',
        phone: m.phone || m.phoneNumber || '',
        photo: m.photoUrl || m.profilePicture || '',
        status: r ? r.status : 'Not Responded',
        respondedAt: r?.updatedAt || r?.createdAt || null,
      };
    });

    // Include any RSVPs that might not be in the church member collection
    rsvps.forEach((r) => {
      if (!roster.some((item) => item.id === (r.memberId || r.id))) {
        roster.push({
          id: r.memberId || r.id,
          name: r.memberName || 'Member',
          phone: r.memberPhone || '',
          photo: r.memberPhoto || '',
          status: r.status,
          respondedAt: r.updatedAt || r.createdAt,
        });
      }
    });

    return roster;
  }, [members, rsvps]);

  // Compute live participation stats
  const stats = useMemo(() => {
    const totalInvited = combinedRoster.length;
    let goingCount = 0;
    let interestedCount = 0;
    let notGoingCount = 0;
    let notRespondedCount = 0;

    combinedRoster.forEach((m) => {
      if (m.status === 'Going') goingCount++;
      else if (m.status === 'Interested' || (m.status as string) === 'Not Interested') interestedCount++;
      else if (m.status === 'Not Going') notGoingCount++;
      else notRespondedCount++;
    });

    const totalResponses = goingCount + interestedCount + notGoingCount;
    const responseRate = totalInvited > 0 ? Math.round((totalResponses / totalInvited) * 100) : 0;
    const goingRate = totalInvited > 0 ? Math.round((goingCount / totalInvited) * 100) : 0;
    const interestedRate = totalInvited > 0 ? Math.round((interestedCount / totalInvited) * 100) : 0;
    const notGoingRate = totalInvited > 0 ? Math.round((notGoingCount / totalInvited) * 100) : 0;

    return {
      totalInvited,
      totalResponses,
      goingCount,
      interestedCount,
      notGoingCount,
      notRespondedCount,
      responseRate,
      goingRate,
      interestedRate,
      notGoingRate,
    };
  }, [combinedRoster]);

  // Filter roster by search query and selected status pill
  const filteredRoster = useMemo(() => {
    let result = combinedRoster;

    if (selectedFilter !== 'All') {
      result = result.filter((item) => item.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const phoneMatch = item.phone?.toLowerCase().includes(query);
        return nameMatch || phoneMatch;
      });
    }

    // Sort: Going first, then Interested/Not Interested, then Not Going, then Not Responded
    const order: Record<string, number> = {
      Going: 1,
      Interested: 2,
      'Not Interested': 2,
      'Not Going': 3,
      'Not Responded': 4,
    };

    return [...result].sort((a, b) => {
      const rankA = order[a.status] || 5;
      const rankB = order[b.status] || 5;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });
  }, [combinedRoster, selectedFilter, searchQuery]);

  // Handle CSV Export & Share
  const handleExport = async () => {
    try {
      setExporting(true);
      await EventRsvpService.exportParticipationReport({
        eventTitle,
        eventDate: eventDate || 'Upcoming',
        stats: {
          goingCount: stats.goingCount,
          interestedCount: stats.interestedCount,
          notGoingCount: stats.notGoingCount,
          totalResponses: stats.totalResponses,
        },
        rsvps,
        members: combinedRoster,
      });
    } catch (err: any) {
      console.error('[EventRsvpAnalyticsModal] Export error:', err);
      Alert.alert('Export Failed', err.message || 'Could not export participation report.');
    } finally {
      setExporting(false);
    }
  };

  // Direct Phone Call
  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number registered for this member.');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  // Direct WhatsApp Message
  const handleWhatsApp = (name: string, phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No mobile number registered for this member.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    const intl = clean.startsWith('91') ? clean : `91${clean.slice(-10)}`;
    const msg = encodeURIComponent(
      `Hello ${name}, regarding "${eventTitle}" on ${eventDate || 'our upcoming service'}, we look forward to having you! Please let us know if you need any assistance.`
    );
    Linking.openURL(`https://wa.me/${intl}?text=${msg}`);
  };

  // Status Badge Component
  const renderStatusBadge = (status: MemberRsvpListItem['status']) => {
    switch (status) {
      case 'Going':
        return (
          <View style={[styles.badge, styles.badgeGoing, isDark && styles.badgeGoingDark]}>
            <CheckCircle2 size={11} color="#059669" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, styles.badgeTxtGoing]}>Going</Text>
          </View>
        );
      case 'Interested':
      case 'Not Interested' as any:
        return (
          <View style={[styles.badge, styles.badgeInterested, isDark && styles.badgeInterestedDark]}>
            <Clock size={11} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, styles.badgeTxtInterested]}>
              {(status as string) === 'Not Interested' ? 'Not Interested' : 'Interested'}
            </Text>
          </View>
        );
      case 'Not Going':
        return (
          <View style={[styles.badge, styles.badgeNotGoing, isDark && styles.badgeNotGoingDark]}>
            <XCircle size={11} color="#DC2626" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, styles.badgeTxtNotGoing]}>Not Going</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgeNoResponse, isDark && styles.badgeNoResponseDark]}>
            <HelpCircle size={11} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, isDark ? styles.badgeTxtNoResponseDark : styles.badgeTxtNoResponse]}>
              Pending
            </Text>
          </View>
        );
    }
  };

  // Dynamic avatar ring color
  const getAvatarBorder = (status: MemberRsvpListItem['status']) => {
    switch (status) {
      case 'Going':
        return isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0';
      case 'Interested':
        return isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A';
      case 'Not Going':
        return isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA';
      default:
        return isDark ? '#334155' : '#E2E8F0';
    }
  };

  const getAvatarBg = (status: MemberRsvpListItem['status']) => {
    switch (status) {
      case 'Going':
        return isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
      case 'Interested':
        return isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB';
      case 'Not Going':
        return isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2';
      default:
        return isDark ? '#1E293B' : '#F1F5F9';
    }
  };

  const getAvatarColor = (status: MemberRsvpListItem['status']) => {
    switch (status) {
      case 'Going':
        return '#059669';
      case 'Interested':
        return '#D97706';
      case 'Not Going':
        return '#DC2626';
      default:
        return isDark ? '#94A3B8' : '#64748B';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#0F172A' : '#FFFFFF'}
        />

        {/* ── Top Header with Safe Area Inset ── */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <TouchableOpacity
            style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={18} color={isDark ? '#F1F5F9' : '#1A2D5A'} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.headerEyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.headerEyebrow}>EVENT PARTICIPATION</Text>
            </View>
            <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
              {eventTitle}
            </Text>
            {!!eventDate && (
              <View style={styles.headerDateRow}>
                <Calendar size={11} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text style={[styles.headerSub, isDark ? styles.subDark : styles.subLight]}>
                  {eventDate}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Share2 size={13} color="#FFFFFF" />
                <Text style={styles.exportBtnTxt}>Export</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={[styles.loadingTxt, isDark ? styles.subDark : styles.subLight]}>
              Loading participation records...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRoster}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* ── Overall Participation Hero Card ── */}
                <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
                  <View style={styles.heroHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.heroSubTitle, isDark ? styles.subDark : styles.subLight]}>
                        PARTICIPATION RATE
                      </Text>
                      <View style={styles.heroRateRow}>
                        <Text style={[styles.heroRateNum, isDark ? styles.textDark : styles.textLight]}>
                          {stats.responseRate}%
                        </Text>
                        <View style={[styles.heroBadge, isDark ? styles.heroBadgeDark : styles.heroBadgeLight]}>
                          <TrendingUp size={12} color="#059669" />
                          <Text style={styles.heroBadgeTxt}>
                            {stats.goingCount} Going ({stats.goingRate}%)
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.heroDesc, isDark ? styles.subDark : styles.subLight]}>
                        {stats.totalResponses} of {stats.totalInvited} members have submitted their response
                      </Text>
                    </View>
                  </View>

                  {/* Multi-Segmented Progress Bar */}
                  <View style={[styles.progressBarTrack, isDark && { backgroundColor: '#334155' }]}>
                    {stats.goingRate > 0 && (
                      <View
                        style={[
                          styles.progressSegment,
                          { width: `${stats.goingRate}%`, backgroundColor: '#10B981' },
                        ]}
                      />
                    )}
                    {stats.interestedRate > 0 && (
                      <View
                        style={[
                          styles.progressSegment,
                          { width: `${stats.interestedRate}%`, backgroundColor: '#F59E0B' },
                        ]}
                      />
                    )}
                    {stats.notGoingRate > 0 && (
                      <View
                        style={[
                          styles.progressSegment,
                          { width: `${stats.notGoingRate}%`, backgroundColor: '#EF4444' },
                        ]}
                      />
                    )}
                  </View>

                  {/* Live Legend */}
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.legendTxt, isDark ? styles.subDark : styles.subLight]}>
                        Going ({stats.goingCount})
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.legendTxt, isDark ? styles.subDark : styles.subLight]}>
                        Interested ({stats.interestedCount})
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={[styles.legendTxt, isDark ? styles.subDark : styles.subLight]}>
                        Not Going ({stats.notGoingCount})
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: isDark ? '#64748B' : '#94A3B8' }]} />
                      <Text style={[styles.legendTxt, isDark ? styles.subDark : styles.subLight]}>
                        Pending ({stats.notRespondedCount})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── 2x2 Symmetrical KPI Grid ── */}
                <View style={styles.kpiGrid}>
                  {/* Going */}
                  <View style={[styles.kpiCard, styles.kpiCardGoing, isDark && styles.kpiCardGoingDark]}>
                    <View style={styles.kpiTopRow}>
                      <Text style={[styles.kpiLabel, { color: '#047857' }]}>GOING</Text>
                      <View style={[styles.kpiIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                        <CheckCircle2 size={13} color="#059669" />
                      </View>
                    </View>
                    <Text style={[styles.kpiValue, { color: '#059669' }]}>
                      {stats.goingCount}
                    </Text>
                    <Text style={[styles.kpiSub, { color: '#047857' }]}>
                      {stats.goingRate}% of {stats.totalInvited} invited
                    </Text>
                  </View>

                  {/* Interested */}
                  <View style={[styles.kpiCard, styles.kpiCardInterested, isDark && styles.kpiCardInterestedDark]}>
                    <View style={styles.kpiTopRow}>
                      <Text style={[styles.kpiLabel, { color: '#B45309' }]}>INTERESTED</Text>
                      <View style={[styles.kpiIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                        <Clock size={13} color="#D97706" />
                      </View>
                    </View>
                    <Text style={[styles.kpiValue, { color: '#D97706' }]}>
                      {stats.interestedCount}
                    </Text>
                    <Text style={[styles.kpiSub, { color: '#B45309' }]}>
                      May attend service
                    </Text>
                  </View>

                  {/* Not Going */}
                  <View style={[styles.kpiCard, styles.kpiCardNotGoing, isDark && styles.kpiCardNotGoingDark]}>
                    <View style={styles.kpiTopRow}>
                      <Text style={[styles.kpiLabel, { color: '#B91C1C' }]}>NOT GOING</Text>
                      <View style={[styles.kpiIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                        <XCircle size={13} color="#DC2626" />
                      </View>
                    </View>
                    <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
                      {stats.notGoingCount}
                    </Text>
                    <Text style={[styles.kpiSub, { color: '#B91C1C' }]}>
                      Cannot attend
                    </Text>
                  </View>

                  {/* Pending / No Response */}
                  <View style={[styles.kpiCard, styles.kpiCardPending, isDark && styles.kpiCardPendingDark]}>
                    <View style={styles.kpiTopRow}>
                      <Text style={[styles.kpiLabel, isDark ? styles.subDark : styles.subLight]}>PENDING</Text>
                      <View style={[styles.kpiIconCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                        <HelpCircle size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                      </View>
                    </View>
                    <Text style={[styles.kpiValue, isDark ? styles.textDark : styles.textLight]}>
                      {stats.notRespondedCount}
                    </Text>
                    <Text style={[styles.kpiSub, isDark ? styles.subDark : styles.subLight]}>
                      Awaiting member response
                    </Text>
                  </View>
                </View>

                {/* ── Search Bar ── */}
                <View style={[styles.searchBox, isDark ? styles.searchBoxDark : styles.searchBoxLight]}>
                  <Search size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <TextInput
                    style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                    placeholder="Search by member name or phone..."
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Filter Tabs (Smooth Horizontal Scroll) ── */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                >
                  {(
                    [
                      { key: 'All', label: `All (${combinedRoster.length})` },
                      { key: 'Going', label: `Going (${stats.goingCount})` },
                      { key: 'Interested', label: `Interested (${stats.interestedCount})` },
                      { key: 'Not Going', label: `Not Going (${stats.notGoingCount})` },
                      { key: 'Not Responded', label: `Pending (${stats.notRespondedCount})` },
                    ] as { key: FilterOption; label: string }[]
                  ).map((f) => {
                    const isSelected = selectedFilter === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[
                          styles.filterPill,
                          isDark ? styles.filterPillDark : styles.filterPillLight,
                          isSelected && (isDark ? styles.filterPillActiveDark : styles.filterPillActiveLight),
                        ]}
                        onPress={() => setSelectedFilter(f.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.filterPillTxt,
                            isDark ? styles.subDark : styles.subLight,
                            isSelected && styles.filterPillTxtActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* ── Roster Section Header ── */}
                <View style={styles.rosterHeader}>
                  <Text style={[styles.rosterTitle, isDark ? styles.textDark : styles.textLight]}>
                    Member Response Roster
                  </Text>
                  <View style={[styles.rosterCountBadge, isDark ? styles.rosterCountBadgeDark : styles.rosterCountBadgeLight]}>
                    <Text style={[styles.rosterCountTxt, isDark ? styles.textDark : styles.textLight]}>
                      {filteredRoster.length}
                    </Text>
                  </View>
                </View>
              </>
            }
            renderItem={({ item }) => {
              const avatarBorder = getAvatarBorder(item.status);
              const avatarBg = getAvatarBg(item.status);
              const avatarColor = getAvatarColor(item.status);
              const formattedTime = formatTimestamp(item.respondedAt);

              return (
                <View
                  style={[
                    styles.rosterCard,
                    isDark ? styles.rosterCardDark : styles.rosterCardLight,
                  ]}
                >
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: avatarBg, borderColor: avatarBorder },
                    ]}
                  >
                    {item.photo ? (
                      <Image source={{ uri: item.photo }} style={styles.avatarImg} />
                    ) : (
                      <Text style={[styles.avatarTxt, { color: avatarColor }]}>
                        {item.name ? item.name.charAt(0).toUpperCase() : '#'}
                      </Text>
                    )}
                  </View>

                  {/* Details */}
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.memberPhone, isDark ? styles.subDark : styles.subLight]}>
                      {item.phone || 'No phone registered'}
                    </Text>
                    <Text style={[styles.memberTime, isDark ? styles.subDark : styles.subLight]}>
                      {formattedTime ? `Responded ${formattedTime}` : 'Awaiting response'}
                    </Text>
                  </View>

                  {/* Status Badge & Actions */}
                  <View style={styles.memberRight}>
                    {renderStatusBadge(item.status)}

                    {/* Quick Contact Actions: Call & WhatsApp */}
                    {!!item.phone && (
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            isDark ? styles.actionBtnDark : styles.actionBtnCallLight,
                          ]}
                          onPress={() => handleCall(item.phone)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Phone size={12} color="#059669" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            isDark ? styles.actionBtnDark : styles.actionBtnWaLight,
                          ]}
                          onPress={() => handleWhatsApp(item.name, item.phone)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <MessageCircle size={12} color="#10B981" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, isDark && { backgroundColor: '#1E293B' }]}>
                  <Users size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                </View>
                <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                  No Members Found
                </Text>
                <Text style={[styles.emptySub, isDark ? styles.subDark : styles.subLight]}>
                  {searchQuery
                    ? `No matching results for "${searchQuery}"`
                    : 'No members match the selected filter.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

export default EventRsvpAnalyticsModal;

const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: topInset,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E2E8F0',
  },
  headerDark: {
    backgroundColor: '#1E293B',
    borderBottomColor: '#334155',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtnLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  closeBtnDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C9A84C',
  },
  headerEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 11.5,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#1A2D5A',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  exportBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Global Typography Colors ──
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  subLight: {
    color: '#64748B',
  },
  subDark: {
    color: '#94A3B8',
  },

  // ── Loading ──
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTxt: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Content ──
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  heroCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroSubTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  heroRateNum: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeLight: {
    backgroundColor: '#ECFDF5',
  },
  heroBadgeDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  heroBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  heroDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Multi-Segmented Progress Bar
  progressBarTrack: {
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 12,
  },
  progressSegment: {
    height: '100%',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendTxt: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // ── 2x2 KPI Grid ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },

  kpiCardGoing: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiCardGoingDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  kpiCardInterested: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiCardInterestedDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  kpiCardNotGoing: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  kpiCardNotGoingDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  kpiCardPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  kpiCardPendingDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },

  // ── Search Bar ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  searchBoxDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },

  // ── Filter Tabs ──
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  filterPillActiveLight: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  filterPillActiveDark: {
    backgroundColor: '#C9A84C',
    borderColor: '#C9A84C',
  },
  filterPillTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Roster Section ──
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  rosterTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rosterCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rosterCountBadgeLight: {
    backgroundColor: '#E2E8F0',
  },
  rosterCountBadgeDark: {
    backgroundColor: '#334155',
  },
  rosterCountTxt: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Roster Card ──
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rosterCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  rosterCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  memberPhone: {
    fontSize: 11.5,
    marginTop: 2,
  },
  memberTime: {
    fontSize: 10,
    marginTop: 2,
  },

  memberRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  badgeGoing: {
    backgroundColor: '#ECFDF5',
  },
  badgeGoingDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeInterested: {
    backgroundColor: '#FFFBEB',
  },
  badgeInterestedDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeNotGoing: {
    backgroundColor: '#FEF2F2',
  },
  badgeNotGoingDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeNoResponse: {
    backgroundColor: '#F1F5F9',
  },
  badgeNoResponseDark: {
    backgroundColor: '#334155',
  },

  badgeTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTxtGoing: {
    color: '#059669',
  },
  badgeTxtInterested: {
    color: '#D97706',
  },
  badgeTxtNotGoing: {
    color: '#DC2626',
  },
  badgeTxtNoResponse: {
    color: '#64748B',
  },
  badgeTxtNoResponseDark: {
    color: '#94A3B8',
  },

  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnCallLight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  actionBtnWaLight: {
    backgroundColor: '#E8FBF0',
    borderColor: '#86EFAC',
  },
  actionBtnDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },

  // ── Empty State ──
  emptyContainer: {
    paddingVertical: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
});
