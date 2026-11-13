import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Home,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Building2,
  Check,
  Trash2,
  Ban,
  Share2,
  Navigation,
  Route,
  MapPin,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { MemberLocationService } from '../../../../services/MemberLocationService';
import { formatDateDisplay } from '../../../../utils/DateUtils';
import { useAuth } from '../../../../context/AuthContext';
import { useAdminTheme, createAdminThemedStyles, formatCareCellLabel } from '../careCellTheme';
import {
  CareCell,
  CareCellMembership,
  CareCellVisit,
  VisitRoutePoint,
  VisitStatus,
} from '../../../../types/CareCellTypes';
import CareCellVisitModal from '../components/CareCellVisitModal';
import CareCellVisitResponsesModal from '../components/CareCellVisitResponsesModal';
import CareCellMapModal from '../components/CareCellMapModal';

const { width } = Dimensions.get('window');

interface CareCellVisitsTabProps {
  cells: CareCell[];
  selectedCellId?: string;
  onSelectCellId?: (id: string) => void;
  churchId?: string;
}

export default function CareCellVisitsTab({
  cells,
  selectedCellId,
  onSelectCellId,
  churchId,
}: CareCellVisitsTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';
  const dangerBtnBg = isDark ? 'rgba(220, 38, 38, 0.14)' : '#FEF2F2';
  const dangerBtnBorder = isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA';
  const dangerBtnText = isDark ? '#F87171' : '#DC2626';

  const { user, member, isPlatformSuperAdmin } = useAuth();
  const [activeCellId, setActiveCellId] = useState<string>(selectedCellId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VisitStatus>('ALL');
  const [visits, setVisits] = useState<CareCellVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedVisitForResponses, setSelectedVisitForResponses] = useState<CareCellVisit | null>(null);
  const [routeMapState, setRouteMapState] = useState<{
    visible: boolean;
    visit: CareCellVisit | null;
    cell: CareCell | null;
    members: CareCellMembership[];
    initialRouteIds: string[];
  }>({
    visible: false,
    visit: null,
    cell: null,
    members: [],
    initialRouteIds: [],
  });
  const [loadingRouteVisitId, setLoadingRouteVisitId] = useState<string | null>(null);
  const [launchingDirectionsVisitId, setLaunchingDirectionsVisitId] = useState<string | null>(null);

  const loadVisits = useCallback(async () => {
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      const list = await CareCellService.getVisits(
        activeChurchId,
        activeCellId === 'ALL' ? undefined : activeCellId,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setVisits(list);

      // Refresh selected visit modal if open
      if (selectedVisitForResponses) {
        const fresh = list.find((v) => v.id === selectedVisitForResponses.id);
        if (fresh) setSelectedVisitForResponses(fresh);
      }
    } catch (e) {
      console.error('Error loading Care Cell visits:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [churchId, activeCellId, statusFilter, selectedVisitForResponses?.id]);

  useEffect(() => {
    setLoading(true);
    loadVisits();
  }, [loadVisits]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVisits();
  };

  const handleCellSelect = (id: string) => {
    setActiveCellId(id);
    onSelectCellId?.(id);
  };

  const handleStatusChange = async (visit: CareCellVisit, newStatus: VisitStatus) => {
    Alert.alert(
      `Mark as ${newStatus}`,
      `Are you sure you want to change the status of "${visit.title}" to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const activeChurchId = churchId || (await CareCellService.getChurchId());
              await CareCellService.updateVisitStatus(activeChurchId, visit.id, newStatus);
              loadVisits();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update visit status.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (visit: CareCellVisit) => {
    Alert.alert(
      'Delete Visit Notification',
      `Are you sure you want to delete "${visit.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const activeChurchId = churchId || (await CareCellService.getChurchId());
              await CareCellService.deleteVisit(activeChurchId, visit.id);
              loadVisits();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete visit.');
            }
          },
        },
      ]
    );
  };

  // High-level metrics
  const metrics = useMemo(() => {
    const totalVisits = visits.length;
    let totalAccepted = 0;
    let totalPending = 0;
    visits.forEach((v) => {
      totalAccepted += v.acceptedCount || 0;
      totalPending += v.pendingCount || 0;
    });
    return { totalVisits, totalAccepted, totalPending };
  }, [visits]);

  // Resolves CareCell context + target CareCellMembership[] list for an existing visit
  const resolveVisitRoutingContext = async (
    visit: CareCellVisit
  ): Promise<{ activeChurchId: string; cell: CareCell; members: CareCellMembership[] }> => {
    const activeChurchId = churchId || (await CareCellService.getChurchId());
    const matchedCell = cells.find((c) => c.id === visit.cellId);
    const activeMembers =
      visit.cellId && visit.cellId !== 'DIRECT'
        ? await CareCellService.getActiveCellMemberships(activeChurchId, visit.cellId).catch(() => [])
        : [];

    const memberMap = new Map<string, CareCellMembership>();
    activeMembers.forEach((m) => memberMap.set(m.memberId, m));

    const stopById = new Map<string, VisitRoutePoint>();
    (visit.routeStops || []).forEach((s) => {
      if (s.memberId) stopById.set(s.memberId, s);
    });

    // Ensure every member present in visit.responses or targetMemberIds or routeStops is included
    const responseEntries = Object.values(visit.responses || {});
    responseEntries.forEach((r) => {
      if (!r.memberId) return;
      const existing = memberMap.get(r.memberId);
      const stop = stopById.get(r.memberId);
      if (existing) {
        memberMap.set(r.memberId, {
          ...existing,
          memberPhoto: existing.memberPhoto || r.memberPhoto,
          locality: existing.locality || stop?.locality,
          address: existing.address || stop?.address,
          latitude: existing.latitude ?? stop?.latitude,
          longitude: existing.longitude ?? stop?.longitude,
        });
      } else {
        memberMap.set(r.memberId, {
          id: r.memberId,
          cellId: visit.cellId,
          memberId: r.memberId,
          memberName: r.memberName,
          memberPhone: r.memberPhone,
          memberPhoto: r.memberPhoto,
          locality: stop?.locality || matchedCell?.location || '',
          address: stop?.address || '',
          latitude: stop?.latitude,
          longitude: stop?.longitude,
          membershipStatus: 'Active',
        });
      }
    });

    (visit.routeStops || []).forEach((s) => {
      if (!s.memberId || memberMap.has(s.memberId)) return;
      memberMap.set(s.memberId, {
        id: s.memberId,
        cellId: visit.cellId,
        memberId: s.memberId,
        memberName: s.memberName,
        memberPhone: s.memberPhone,
        locality: s.locality || matchedCell?.location || '',
        address: s.address || '',
        latitude: s.latitude,
        longitude: s.longitude,
        membershipStatus: 'Active',
      });
    });

    let targetList: CareCellMembership[];
    if (Array.isArray(visit.targetMemberIds) && visit.targetMemberIds.length > 0) {
      targetList = visit.targetMemberIds
        .map((id) => memberMap.get(id))
        .filter(Boolean) as CareCellMembership[];
    } else if (responseEntries.length > 0) {
      const respIds = new Set(responseEntries.map((r) => r.memberId));
      targetList = Array.from(memberMap.values()).filter((m) => respIds.has(m.memberId));
    } else {
      targetList = Array.from(memberMap.values());
    }

    const fallbackCell: CareCell = matchedCell || {
      id: visit.cellId || 'DIRECT',
      churchId: activeChurchId,
      cellCode: visit.cellCode || 'MAP',
      name: visit.cellName || visit.title || 'Care Cell Visit',
      description: '',
      location: targetList[0]?.locality || targetList[0]?.city || '',
      meetingLocation: '',
      meetingDay: '',
      meetingTime: '',
      leaderId: visit.assignedLeaderId || visit.createdBy,
      leaderName: visit.assignedLeaderName || visit.createdByName || 'Leader',
      leaderPhone: '',
      status: 'Active',
    };

    return { activeChurchId, cell: fallbackCell, members: targetList };
  };

  const handleOpenVisitRouteMap = async (visit: CareCellVisit) => {
    setLoadingRouteVisitId(visit.id);
    try {
      const { cell, members } = await resolveVisitRoutingContext(visit);
      if (members.length === 0) {
        Alert.alert('No Target Members', 'This visit does not have any assigned members to display on the map.');
        return;
      }
      const initialRouteIds =
        visit.routeStops && visit.routeStops.length > 0
          ? visit.routeStops.map((s) => s.memberId)
          : members.map((m) => m.memberId);
      setRouteMapState({
        visible: true,
        visit,
        cell,
        members,
        initialRouteIds,
      });
    } catch (e: any) {
      Alert.alert('Map Error', e?.message || 'Unable to load member locations for this visit.');
    } finally {
      setLoadingRouteVisitId(null);
    }
  };

  const handleSaveOptimizedVisitRoute = async (stops: VisitRoutePoint[]) => {
    const targetVisit = routeMapState.visit;
    if (!targetVisit) return;
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      await CareCellService.updateVisitRouteStops(activeChurchId, targetVisit.id, stops);
      setVisits((prev) =>
        prev.map((v) => (v.id === targetVisit.id ? { ...v, routeStops: stops } : v))
      );
      Alert.alert(
        'Visit Route Saved',
        `Updated ${stops.length}-stop optimized Google Maps route for "${targetVisit.title}".`
      );
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message || 'Could not save visit route.');
    }
  };

  const handleDirectionsForVisit = async (visit: CareCellVisit) => {
    setLaunchingDirectionsVisitId(visit.id);
    try {
      if (visit.routeStops && visit.routeStops.length > 0) {
        await MemberLocationService.openGoogleMapsMultiStopRoute({
          stops: visit.routeStops,
          travelMode: 'driving',
        });
        return;
      }

      const { activeChurchId, cell, members } = await resolveVisitRoutingContext(visit);
      if (members.length === 0) {
        Alert.alert('No Targets', 'This visit has no target members to route to.');
        return;
      }

      const startPoint =
        typeof cell.meetingLatitude === 'number' && typeof cell.meetingLongitude === 'number'
          ? { latitude: cell.meetingLatitude, longitude: cell.meetingLongitude }
          : undefined;

      const stops = await MemberLocationService.buildOptimizedVisitRoute({
        churchId: activeChurchId,
        members: members.map((m) => ({
          memberId: m.memberId,
          memberName: m.memberName,
          memberPhone: m.memberPhone,
          locality: m.locality,
          city: m.city,
          address: m.address,
          latitude: m.latitude,
          longitude: m.longitude,
        })),
        fallbackLocationHint: cell.location || cell.meetingLocation,
        startPoint,
      });

      if (stops.length === 0) {
        Alert.alert(
          'Missing Locations',
          'Selected members do not have GPS pins or geocodable localities yet.'
        );
        return;
      }

      // Persist resolved optimized route onto visit for instant reuse next time
      CareCellService.updateVisitRouteStops(activeChurchId, visit.id, stops).catch(() => {});
      setVisits((prev) =>
        prev.map((v) => (v.id === visit.id ? { ...v, routeStops: stops } : v))
      );

      await MemberLocationService.openGoogleMapsMultiStopRoute({
        stops,
        travelMode: 'driving',
      });
    } catch (e: any) {
      Alert.alert('Navigation Error', e?.message || 'Unable to launch Google Maps directions.');
    } finally {
      setLaunchingDirectionsVisitId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Filter & Actions Row */}
      <View style={styles.topBar}>
        <View style={styles.topActionsHeaderRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cellFilterScroll} contentContainerStyle={{ paddingRight: 8 }}>
            <TouchableOpacity
              style={[
                styles.cellChip,
                activeCellId === 'ALL' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => handleCellSelect('ALL')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cellChipTxt,
                  activeCellId === 'ALL' && { color: primaryBtnText, fontWeight: '800' },
                ]}
              >
                All Cells ({cells.length})
              </Text>
            </TouchableOpacity>

            {cells.map((c) => {
              const isSel = c.id === activeCellId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.cellChip,
                    isSel && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                  ]}
                  onPress={() => handleCellSelect(c.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cellChipTxt,
                      isSel && { color: primaryBtnText, fontWeight: '800' },
                    ]}
                  >
                    {formatCareCellLabel(c.cellCode, c.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.scheduleVisitBtn, { backgroundColor: primaryBtnBg }]}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.85}
          >
            <Plus size={15} color={primaryBtnText} strokeWidth={2.5} style={{ marginRight: 5 }} />
            <Text style={[styles.scheduleVisitBtnTxt, { color: primaryBtnText }]}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Spacious KPI Metrics Cards */}
      <View style={styles.kpiCardsRow}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardTop}>
            <Home size={14} color={primaryText} />
            <Text style={styles.kpiCardVal}>{metrics.totalVisits}</Text>
          </View>
          <Text style={styles.kpiCardLbl}>Total Visits</Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            styles.kpiCardAccepted,
            isDark && { backgroundColor: 'rgba(5, 150, 105, 0.14)', borderColor: 'rgba(16, 185, 129, 0.35)' },
          ]}
        >
          <View style={styles.kpiCardTop}>
            <CheckCircle2 size={14} color={isDark ? '#34D399' : '#059669'} />
            <Text style={[styles.kpiCardVal, { color: isDark ? '#34D399' : '#059669' }]}>{metrics.totalAccepted}</Text>
          </View>
          <Text style={[styles.kpiCardLbl, { color: isDark ? '#34D399' : '#065F46' }]}>Accepted</Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            styles.kpiCardPending,
            isDark && { backgroundColor: 'rgba(217, 119, 6, 0.14)', borderColor: 'rgba(245, 158, 11, 0.35)' },
          ]}
        >
          <View style={styles.kpiCardTop}>
            <Clock size={14} color={isDark ? '#FBBF24' : '#D97706'} />
            <Text style={[styles.kpiCardVal, { color: isDark ? '#FBBF24' : '#D97706' }]}>{metrics.totalPending}</Text>
          </View>
          <Text style={[styles.kpiCardLbl, { color: isDark ? '#FBBF24' : '#92400E' }]}>Pending</Text>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 40, marginBottom: 8 }}
        contentContainerStyle={[styles.statusTabsRow, { paddingRight: 16 }]}
      >
        {(
          [
            'ALL',
            'Scheduled',
            'Awaiting Confirmation',
            'Confirmed',
            'Declined',
            'In Progress',
            'Completed',
            'Cancelled',
          ] as const
        ).map((st) => {
          const isActive = statusFilter === st;
          return (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusTabBtn,
                isActive && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => setStatusFilter(st)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusTabBtnTxt,
                  isActive && { color: primaryBtnText, fontWeight: '800' },
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Visits List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Loading Care Cell visits...</Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder, borderWidth: 1 }]}>
                <Home size={34} color={primaryText} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>No Visit Notifications Found</Text>
              <Text style={styles.emptySubtitle}>
                Schedule a pastoral or fellowship visit to send instant in-app & push notifications to all assigned members with Accept & Decline confirmation.
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: primaryBtnBg }]}
                onPress={() => setCreateModalVisible(true)}
                activeOpacity={0.85}
              >
                <Plus size={16} color={primaryBtnText} style={{ marginRight: 6 }} />
                <Text style={[styles.emptyActionBtnTxt, { color: primaryBtnText }]}>Schedule First Visit</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === 'Completed';
            const isCancelled = item.status === 'Cancelled';
            const isScheduled = !isCompleted && !isCancelled;

            const total = item.totalMembersCount || Object.keys(item.responses || {}).length || 0;
            const accepted = item.acceptedCount || 0;
            const declined = item.declinedCount || 0;
            const pending = item.pendingCount !== undefined ? item.pendingCount : Math.max(0, total - accepted - declined);
            const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

            return (
              <View style={styles.visitCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.cellBadgeRow}>
                      <View style={styles.cellBadge}>
                        <Building2 size={11} color="#1A2D5A" style={{ marginRight: 4 }} />
                        <Text style={styles.cellBadgeTxt}>{item.cellCode || item.cellName}</Text>
                      </View>
                      <Text style={styles.cellSubName} numberOfLines={1}>
                        {item.cellName}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted && styles.statusPillCompleted,
                      isCancelled && styles.statusPillCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillTxt,
                        isCompleted && styles.statusPillTxtCompleted,
                        isCancelled && styles.statusPillTxtCancelled,
                      ]}
                    >
                      {item.status || 'Scheduled'}
                    </Text>
                  </View>
                </View>

                {/* Date & Time and Visitors */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Calendar size={13} color="#64748B" style={{ marginRight: 5 }} />
                    <Text style={styles.detailTxt}>{formatDateDisplay(item.visitDate)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock size={13} color="#64748B" style={{ marginRight: 5 }} />
                    <Text style={styles.detailTxt}>{item.visitTime}</Text>
                  </View>
                </View>

                {item.visitors ? (
                  <View style={styles.visitorsRow}>
                    <Users size={13} color="#1A2D5A" style={{ marginRight: 6 }} />
                    <Text style={styles.visitorsTxt}>Visiting: {item.visitors}</Text>
                  </View>
                ) : null}

                {item.purpose ? (
                  <Text style={styles.purposeTxt} numberOfLines={2}>
                    "{item.purpose}"
                  </Text>
                ) : null}

                {/* Live Member Responses Summary Bar */}
                <View style={styles.responseSummaryBox}>
                  <View style={styles.responseCountsRow}>
                    <View style={styles.responseCountItem}>
                      <Text style={styles.responseValAccepted}>{accepted}</Text>
                      <Text style={styles.responseLbl}>Accepted</Text>
                    </View>
                    <View style={styles.responseCountItem}>
                      <Text style={styles.responseValDeclined}>{declined}</Text>
                      <Text style={styles.responseLbl}>Declined</Text>
                    </View>
                    <View style={styles.responseCountItem}>
                      <Text style={styles.responseValPending}>{pending}</Text>
                      <Text style={styles.responseLbl}>Pending</Text>
                    </View>
                    <View style={styles.responseCountItem}>
                      <Text style={styles.responseValTotal}>{total}</Text>
                      <Text style={styles.responseLbl}>Total</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarAccepted, { width: `${acceptRate}%` }]} />
                  </View>
                </View>

                {/* Optimized Google Maps Route Summary Strip */}
                {item.routeStops && item.routeStops.length > 0 ? (
                  <View
                    style={[
                      styles.visitRouteStrip,
                      isDark && {
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                      },
                    ]}
                  >
                    <Route size={13} color={isDark ? '#34D399' : '#059669'} style={{ marginRight: 6 }} />
                    <Text
                      style={[styles.visitRouteStripTxt, isDark && { color: '#6EE7B7' }]}
                      numberOfLines={1}
                    >
                      {item.routeStops.length} Stop Route (~
                      {MemberLocationService.computeRouteDistanceKm(item.routeStops)} km):{' '}
                      {item.routeStops.map((s) => `${s.order}. ${s.memberName}`).join(' → ')}
                    </Text>
                  </View>
                ) : null}

                {/* Routing Actions Row (View Map / Optimize + Directions) */}
                <View style={styles.visitRoutingRow}>
                  <TouchableOpacity
                    style={[
                      styles.visitRouteActionBtn,
                      { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder },
                    ]}
                    onPress={() => handleOpenVisitRouteMap(item)}
                    disabled={loadingRouteVisitId === item.id}
                    activeOpacity={0.8}
                  >
                    {loadingRouteVisitId === item.id ? (
                      <ActivityIndicator size="small" color={secondaryBtnText} style={{ marginRight: 5 }} />
                    ) : (
                      <MapPin size={13} color={secondaryBtnText} style={{ marginRight: 5 }} />
                    )}
                    <Text style={[styles.visitRouteActionTxt, { color: secondaryBtnText }]}>
                      Map & Optimize Route
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.visitDirectionsBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleDirectionsForVisit(item)}
                    disabled={launchingDirectionsVisitId === item.id}
                    activeOpacity={0.85}
                  >
                    {launchingDirectionsVisitId === item.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 5 }} />
                    ) : (
                      <Navigation size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                    )}
                    <Text style={styles.visitDirectionsBtnTxt}>Directions</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Card Actions */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={[styles.viewResponsesBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                    onPress={() => setSelectedVisitForResponses(item)}
                    activeOpacity={0.8}
                  >
                    <Users size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
                    <Text style={[styles.viewResponsesBtnTxt, { color: secondaryBtnText }]}>
                      View Member Responses ({total})
                    </Text>
                    <ChevronRight size={14} color={secondaryBtnText} />
                  </TouchableOpacity>

                  <View style={styles.quickOpsRow}>
                    {isScheduled && (
                      <TouchableOpacity
                        onPress={() => handleStatusChange(item, 'Completed')}
                        style={[styles.quickOpIconBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Check size={15} color="#059669" />
                      </TouchableOpacity>
                    )}

                    {isScheduled && (
                      <TouchableOpacity
                        onPress={() => handleStatusChange(item, 'Cancelled')}
                        style={[styles.quickOpIconBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ban size={14} color="#D97706" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={[styles.quickOpIconBtn, { backgroundColor: dangerBtnBg, borderColor: dangerBtnBorder }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={14} color={dangerBtnText} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Visit Modal */}
      <CareCellVisitModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        cells={cells}
        initialCellId={activeCellId}
        churchId={churchId}
        createdBy={user?.uid || member?.id || ''}
        createdByName={member?.name || user?.displayName || 'Super Admin'}
        onSuccess={loadVisits}
      />

      {/* Member Responses Breakdown Modal */}
      <CareCellVisitResponsesModal
        visible={!!selectedVisitForResponses}
        onClose={() => setSelectedVisitForResponses(null)}
        visit={selectedVisitForResponses}
        churchId={churchId}
        onResponseUpdated={loadVisits}
      />

      {/* Visit Map & Route Optimization Modal */}
      {routeMapState.cell && (
        <CareCellMapModal
          visible={routeMapState.visible}
          onClose={() =>
            setRouteMapState((prev) => ({ ...prev, visible: false }))
          }
          churchId={churchId || routeMapState.visit?.churchId}
          cell={routeMapState.cell}
          members={routeMapState.members}
          initialPlannedRouteIds={routeMapState.initialRouteIds}
          autoSelectRoute={true}
          headerSubtitleOverride={
            routeMapState.visit
              ? `${routeMapState.visit.title} · ${routeMapState.members.length} Target${
                  routeMapState.members.length === 1 ? '' : 's'
                }`
              : undefined
          }
          onConfirmRoute={handleSaveOptimizedVisitRoute}
        />
      )}
    </View>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topActionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellFilterScroll: {
    flex: 1,
  },
  cellChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  cellChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  cellChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cellChipTxtActive: {
    color: '#FFFFFF',
  },
  scheduleVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: 10,
  },
  scheduleVisitBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiCardsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiCardAccepted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  kpiCardVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiCardLbl: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  statusTabBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusTabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusTabBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTabBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cellBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cellBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  cellSubName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusPillCancelled: {
    backgroundColor: '#FFF1F2',
  },
  statusPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#3730A3',
  },
  statusPillTxtCompleted: {
    color: '#065F46',
  },
  statusPillTxtCancelled: {
    color: '#9F1239',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  visitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  visitorsTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  purposeTxt: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 16,
  },
  responseSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  responseCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  responseCountItem: {
    alignItems: 'center',
  },
  responseValAccepted: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  responseValDeclined: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E11D48',
  },
  responseValPending: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D97706',
  },
  responseValTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  responseLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarAccepted: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewResponsesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewResponsesBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginRight: 4,
  },
  quickOpsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickOpIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  visitRouteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  visitRouteStripTxt: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  visitRoutingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  visitRouteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  visitRouteActionTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  visitDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  visitDirectionsBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

