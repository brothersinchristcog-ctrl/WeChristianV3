import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  HeartHandshake,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Phone,
  User,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Briefcase,
  Layers,
  Send,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useAdminTheme, createAdminThemedStyles } from '../../utils/adminThemeHelper';
import VolunteerService from '../../services/VolunteerService';
import { VolunteerApplication, VolunteerStatus, VolunteerType } from '../../types/volunteer';
import { formatDateMonthYear, formatTimeTo12Hour } from '../../utils/DateUtils';
import { CustomAlert } from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

type TabType = 'general' | 'event';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminVolunteerManagement({ navigation, route, routeParams }: any) {
  const {
    isDark,
    colors: adminColors,
    screenBg,
    cardSurface,
    primaryText,
    secondaryText,
    borderColor: adminBorderColor,
  } = useAdminTheme();

  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const { setActiveTab } = useContext(AdminTabContext) || {};

  const targetAppId = routeParams?.applicationId || route?.params?.applicationId;
  const initialSubtype = routeParams?.subType || route?.params?.subType;

  const [activeSegment, setActiveSegment] = useState<TabType>(initialSubtype === 'event' ? 'event' : 'general');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = useState<VolunteerApplication | null>(null);

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states for approval/assignment
  const [assignedRole, setAssignedRole] = useState('');
  const [assignedTimeSlot, setAssignedTimeSlot] = useState('');
  const [assignedLocation, setAssignedLocation] = useState('');
  const [assignedResponsibility, setAssignedResponsibility] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({ visible: false, title: '', message: '' });

  const churchId = activeChurch?.id || 'default';

  const fetchApplications = () => {
    setRefreshing(true);
    // Trigger snapshot listener reload
    const unsubscribe = VolunteerService.subscribeApplications(
      churchId,
      (list) => {
        setApplications(list);
        setLoading(false);
        setRefreshing(false);
        if (targetAppId) {
          const match = list.find((a) => a.id === targetAppId);
          if (match) {
            setSelectedApp(match);
            setExpandedId(match.id);
            if (match.volunteerType === 'event') setActiveSegment('event');
            else setActiveSegment('general');
          }
        }
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      }
    );
    return unsubscribe;
  };

  useEffect(() => {
    setLoading(true);
    const unsub = fetchApplications();
    return () => unsub();
  }, [churchId, targetAppId]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const generalTotal = applications.filter((a) => a.volunteerType === 'general').length;
    const eventTotal = applications.filter((a) => a.volunteerType === 'event').length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;

    const activeList = applications.filter((a) => a.volunteerType === activeSegment);
    const categoryPending = activeList.filter((a) => a.status === 'pending').length;
    const categoryApproved = activeList.filter((a) => a.status === 'approved').length;
    const categoryRejected = activeList.filter((a) => a.status === 'rejected').length;

    return {
      total,
      generalTotal,
      eventTotal,
      pending,
      approved,
      rejected,
      categoryPending,
      categoryApproved,
      categoryRejected,
    };
  }, [applications, activeSegment]);

  const promptDeleteApplication = (app: VolunteerApplication) => {
    Alert.alert(
      'Delete Volunteer Application?',
      `Are you sure you want to permanently delete the volunteer application for ${app.memberName || 'this member'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await VolunteerService.deleteApplication(churchId, app.id);
              if (expandedId === app.id) setExpandedId(null);
              if (selectedApp?.id === app.id) setSelectedApp(null);
              setAlertConfig({
                visible: true,
                title: 'Application Deleted',
                message: `Volunteer application for ${app.memberName || 'member'} has been deleted.`,
                type: 'info',
              });
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                title: 'Delete Failed',
                message: err.message || 'Could not delete application.',
                type: 'error',
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (app.volunteerType !== activeSegment) return false;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (app.memberName || '').toLowerCase().includes(q);
        const phoneMatch = (app.memberPhone || '').includes(q);
        const roleMatch = (app.preferredRole || app.assignedRole || '').toLowerCase().includes(q);
        const eventMatch = (app.eventTitle || '').toLowerCase().includes(q);
        const ministryMatch = (app.preferredMinistries || []).some((m) => m.toLowerCase().includes(q));
        if (!nameMatch && !phoneMatch && !roleMatch && !eventMatch && !ministryMatch) {
          return false;
        }
      }
      return true;
    });
  }, [applications, activeSegment, statusFilter, searchQuery]);

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenApprove = (app: VolunteerApplication) => {
    setSelectedApp(app);
    if (app.volunteerType === 'event') {
      setAssignedRole(app.assignedRole || app.preferredRole || 'Event Volunteer');
      setAssignedTimeSlot(formatTimeTo12Hour(app.assignedTimeSlot || app.eventTime || ''));
      setAssignedLocation(app.assignedLocation || app.eventLocation || '');
      setAssignedResponsibility(app.assignedResponsibility || '');
      setShowApprovalModal(true);
    } else {
      Alert.alert(
        'Approve Volunteer Application',
        `Approve general volunteer application for ${app.memberName}? A push notification will be sent immediately to the member.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            style: 'default',
            onPress: async () => {
              try {
                setActionLoading(true);
                await VolunteerService.approveApplication(churchId, app.id, {
                  id: user?.uid || 'admin',
                  name: member?.name || user?.displayName || 'Church Admin',
                });
                setAlertConfig({
                  visible: true,
                  title: 'Application Approved',
                  message: `Volunteer application for ${app.memberName} has been approved and notified.`,
                  type: 'success',
                });
              } catch (err: any) {
                setAlertConfig({
                  visible: true,
                  title: 'Action Failed',
                  message: err.message || 'Could not approve application.',
                  type: 'error',
                });
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleConfirmEventApproval = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await VolunteerService.approveApplication(
        churchId,
        selectedApp.id,
        { id: user?.uid || 'admin', name: member?.name || user?.displayName || 'Church Admin' },
        {
          assignedRole: assignedRole.trim() || selectedApp.preferredRole || 'Event Volunteer',
          assignedDate: selectedApp.eventDate,
          assignedTimeSlot: assignedTimeSlot.trim(),
          assignedLocation: assignedLocation.trim(),
          assignedResponsibility: assignedResponsibility.trim(),
        }
      );
      setShowApprovalModal(false);
      setAlertConfig({
        visible: true,
        title: 'Event Volunteer Approved',
        message: `${selectedApp.memberName} has been approved and assigned as ${assignedRole.trim() || 'Volunteer'}. Notification sent!`,
        type: 'success',
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to approve application',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (app: VolunteerApplication) => {
    setSelectedApp(app);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await VolunteerService.rejectApplication(
        churchId,
        selectedApp.id,
        { id: user?.uid || 'admin', name: member?.name || user?.displayName || 'Church Admin' },
        rejectionReason.trim()
      );
      setShowRejectModal(false);
      setAlertConfig({
        visible: true,
        title: 'Application Update Saved',
        message: `Volunteer application for ${selectedApp.memberName} marked as not approved. Notification sent.`,
        type: 'info',
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to reject application',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssignDuty = (app: VolunteerApplication) => {
    setSelectedApp(app);
    setAssignedRole(app.assignedRole || app.preferredRole || '');
    setAssignedTimeSlot(formatTimeTo12Hour(app.assignedTimeSlot || app.eventTime || ''));
    setAssignedLocation(app.assignedLocation || app.eventLocation || '');
    setAssignedResponsibility(app.assignedResponsibility || '');
    setShowAssignModal(true);
  };

  const handleConfirmDutyAssignment = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await VolunteerService.assignVolunteerDuty(churchId, selectedApp.id, {
        assignedRole: assignedRole.trim() || 'Volunteer',
        assignedDate: selectedApp.eventDate,
        assignedTimeSlot: assignedTimeSlot.trim(),
        assignedLocation: assignedLocation.trim(),
        assignedResponsibility: assignedResponsibility.trim(),
      });
      setShowAssignModal(false);
      setAlertConfig({
        visible: true,
        title: 'Assignment Updated',
        message: `Updated volunteer assignment sent to ${selectedApp.memberName}.`,
        type: 'success',
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to update assignment',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status: VolunteerStatus) => {
    switch (status) {
      case 'approved':
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0',
              },
            ]}
          >
            <CheckCircle2 size={11} color={isDark ? '#34D399' : '#15803D'} style={{ marginRight: 3 }} />
            <Text style={[styles.statusTxt, { color: isDark ? '#34D399' : '#15803D' }]}>APPROVED</Text>
          </View>
        );
      case 'rejected':
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
              },
            ]}
          >
            <XCircle size={11} color={isDark ? '#F87171' : '#B91C1C'} style={{ marginRight: 3 }} />
            <Text style={[styles.statusTxt, { color: isDark ? '#F87171' : '#B91C1C' }]}>DECLINED</Text>
          </View>
        );
      case 'withdrawn':
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
                borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : '#E2E8F0',
              },
            ]}
          >
            <AlertCircle size={11} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 3 }} />
            <Text style={[styles.statusTxt, { color: isDark ? '#94A3B8' : '#64748B' }]}>WITHDRAWN</Text>
          </View>
        );
      default:
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
              },
            ]}
          >
            <Clock size={11} color={isDark ? '#FBBF24' : '#D97706'} style={{ marginRight: 3 }} />
            <Text style={[styles.statusTxt, { color: isDark ? '#FBBF24' : '#D97706' }]}>PENDING</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#f0f2f7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Hero Section (Standardized with WeChristian Admin Dashboard tabs) ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 }}>
            <TouchableOpacity
              onPress={() => (setActiveTab ? setActiveTab(0) : navigation?.goBack?.())}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#fff" style={{ marginLeft: -4, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>Volunteer Management</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]} numberOfLines={1}>
                {applications.length} total · {stats.pending} pending review
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshHeroBtn}
            onPress={() => fetchApplications()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── HIGH-END CATEGORY TABS: GENERAL vs EVENT VOLUNTEERS ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? '#27272A' : '#E2E8F0',
              borderWidth: 1,
            },
          ]}
        >
          {/* General Church Tab */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'general' && [
                styles.segmentBtnActive,
                { backgroundColor: isDark ? '#065F46' : '#059669' },
              ],
            ]}
            onPress={() => setActiveSegment('general')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnTxt,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                activeSegment === 'general' && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              General Church
            </Text>
            <View
              style={[
                styles.segmentBadge,
                {
                  backgroundColor:
                    activeSegment === 'general'
                      ? 'rgba(255, 255, 255, 0.25)'
                      : isDark
                      ? '#27272A'
                      : '#F1F5F9',
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentBadgeTxt,
                  {
                    color:
                      activeSegment === 'general'
                        ? '#FFFFFF'
                        : isDark
                        ? '#CBD5E1'
                        : '#475569',
                  },
                ]}
              >
                {stats.generalTotal}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Event Volunteers Tab */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'event' && [
                styles.segmentBtnActive,
                { backgroundColor: isDark ? '#065F46' : '#059669' },
              ],
            ]}
            onPress={() => setActiveSegment('event')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnTxt,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                activeSegment === 'event' && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              Event Volunteers
            </Text>
            <View
              style={[
                styles.segmentBadge,
                {
                  backgroundColor:
                    activeSegment === 'event'
                      ? 'rgba(255, 255, 255, 0.25)'
                      : isDark
                      ? '#27272A'
                      : '#F1F5F9',
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentBadgeTxt,
                  {
                    color:
                      activeSegment === 'event'
                        ? '#FFFFFF'
                        : isDark
                        ? '#CBD5E1'
                        : '#475569',
                  },
                ]}
              >
                {stats.eventTotal}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── STATS FILTER ROW (CATEGORY-AWARE STATUS PILLS) ── */}
      <View style={{ marginBottom: 6 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
              statusFilter === 'all' && [
                styles.activeStatCard,
                {
                  backgroundColor: isDark ? '#0B2920' : '#ECFDF5',
                  borderColor: isDark ? '#10B981' : '#059669',
                },
              ],
            ]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.statNum,
                { color: isDark ? '#60A5FA' : '#1a2d5a' },
                statusFilter === 'all' && { color: isDark ? '#34D399' : '#059669' },
              ]}
            >
              {activeSegment === 'general' ? stats.generalTotal : stats.eventTotal}
            </Text>
            <Text
              style={[
                styles.statLbl,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                statusFilter === 'all' && { color: isDark ? '#E4E4E7' : '#047857' },
              ]}
            >
              ALL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
              statusFilter === 'pending' && [
                styles.activeStatCard,
                {
                  backgroundColor: isDark ? '#261D0B' : '#FFFBEB',
                  borderColor: isDark ? '#F59E0B' : '#D97706',
                },
              ],
            ]}
            onPress={() => setStatusFilter('pending')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.statNum,
                { color: isDark ? '#FBBF24' : '#D97706' },
                statusFilter === 'pending' && { color: isDark ? '#FBBF24' : '#B45309' },
              ]}
            >
              {stats.categoryPending}
            </Text>
            <Text
              style={[
                styles.statLbl,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                statusFilter === 'pending' && { color: isDark ? '#FDE68A' : '#B45309' },
              ]}
            >
              PENDING
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
              statusFilter === 'approved' && [
                styles.activeStatCard,
                {
                  backgroundColor: isDark ? '#0B2920' : '#ECFDF5',
                  borderColor: isDark ? '#10B981' : '#059669',
                },
              ],
            ]}
            onPress={() => setStatusFilter('approved')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.statNum,
                { color: isDark ? '#34D399' : '#059669' },
                statusFilter === 'approved' && { color: isDark ? '#34D399' : '#047857' },
              ]}
            >
              {stats.categoryApproved}
            </Text>
            <Text
              style={[
                styles.statLbl,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                statusFilter === 'approved' && { color: isDark ? '#A7F3D0' : '#047857' },
              ]}
            >
              APPROVED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
              statusFilter === 'rejected' && [
                styles.activeStatCard,
                {
                  backgroundColor: isDark ? '#2A1215' : '#FEF2F2',
                  borderColor: isDark ? '#EF4444' : '#DC2626',
                },
              ],
            ]}
            onPress={() => setStatusFilter('rejected')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.statNum,
                { color: isDark ? '#F87171' : '#DC2626' },
                statusFilter === 'rejected' && { color: isDark ? '#F87171' : '#B91C1C' },
              ]}
            >
              {stats.categoryRejected}
            </Text>
            <Text
              style={[
                styles.statLbl,
                { color: isDark ? '#A1A1AA' : '#64748B' },
                statusFilter === 'rejected' && { color: isDark ? '#FECACA' : '#991B1B' },
              ]}
            >
              DECLINED
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── SEARCH INPUT BAR ── */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? '#18181B' : '#FFFFFF',
            borderColor: isDark ? '#27272A' : '#E2E8F0',
          },
        ]}
      >
        <Search size={18} color={isDark ? '#71717A' : '#94A3B8'} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={
            activeSegment === 'general'
              ? 'Search by member name, mobile, ministry...'
              : 'Search by member name, event, role...'
          }
          placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#1E293B' }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={isDark ? '#71717A' : '#94A3B8'} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── APPLICATIONS LIST ── */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchApplications()} />}
      >
        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={{ marginTop: 12, color: isDark ? '#A1A1AA' : '#64748B', fontSize: 13 }}>
              Loading volunteer applications...
            </Text>
          </View>
        ) : filteredApps.length === 0 ? (
          <View
            style={[
              styles.emptyView,
              { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
            ]}
          >
            <HeartHandshake size={44} color={isDark ? '#3F3F46' : '#CBD5E1'} />
            <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              No volunteer applications match the filter.
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#A1A1AA' : '#64748B', textAlign: 'center', marginTop: 4 }}>
              {activeSegment === 'general'
                ? 'Applications submitted for general church volunteering will appear here.'
                : 'Applications submitted for specific church events will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredApps.map((app) => {
              const isEvent = app.volunteerType === 'event';
              const isApproved = app.status === 'approved';
              const isPending = app.status === 'pending';
              const isExpanded = expandedId === app.id;
              const initials = getInitials(app.memberName);

              return (
                <View
                  key={app.id}
                  style={[
                    styles.memberCard,
                    {
                      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                      borderColor: isDark ? '#27272A' : 'rgba(26,45,90,0.08)',
                    },
                    isExpanded && {
                      borderColor: '#059669',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  {/* CARD HEADER & SUMMARY */}
                  {isEvent ? (
                    <TouchableOpacity
                      style={styles.cardHeader}
                      onPress={() => setExpandedId(isExpanded ? null : app.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        {/* 1. Event Name at top + Status Badge & Expand Chevron (no Trash icon) */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#E0F2FE',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(56, 189, 248, 0.32)' : '#BAE6FD',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Calendar size={16} color={isDark ? '#38BDF8' : '#0284C7'} />
                            </View>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 15.5,
                                fontWeight: '800',
                                color: isDark ? '#FFFFFF' : '#1a2d5a',
                                lineHeight: 20,
                              }}
                              numberOfLines={2}
                            >
                              {app.eventTitle || 'Church Event'}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                            {renderStatusBadge(app.status)}
                            <View style={styles.chevronWrap}>
                              {isExpanded ? (
                                <ChevronUp size={16} color={isDark ? '#A1A1AA' : '#64748B'} />
                              ) : (
                                <ChevronDown size={16} color={isDark ? '#A1A1AA' : '#64748B'} />
                              )}
                            </View>
                          </View>
                        </View>

                        {/* 2. Volunteer Name & Submitted Date below Event Name */}
                        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
                            <User size={14} color={isDark ? '#A1A1AA' : '#64748B'} />
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 14,
                                fontWeight: '700',
                                color: isDark ? '#F4F4F5' : '#0F172A',
                              }}
                              numberOfLines={1}
                            >
                              {app.memberName || 'Church Member'}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: isDark ? '#71717A' : '#94A3B8',
                              flexShrink: 0,
                            }}
                          >
                            {app.createdAt?.toDate ? formatDateMonthYear(app.createdAt.toDate()) : 'Recent'}
                          </Text>
                        </View>

                        {/* 3. Applied for the Role: [Role Name] */}
                        <View
                          style={{
                            marginTop: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: isDark ? 'rgba(39, 39, 42, 0.85)' : '#F8FAFC',
                            borderWidth: 1,
                            borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: '600',
                              color: isDark ? '#A1A1AA' : '#475569',
                            }}
                          >
                            Applied for the Role:{' '}
                            <Text style={{ fontWeight: '800', color: isDark ? '#60A5FA' : '#0369A1' }}>
                              {app.preferredRole || 'Event Volunteer'}
                            </Text>
                          </Text>
                        </View>

                        {/* 4. Clickable Mobile Number */}
                        {!!app.memberPhone && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              const cleanPhone = String(app.memberPhone).replace(/[^\d+]/g, '');
                              if (cleanPhone) {
                                Linking.openURL(`tel:${cleanPhone}`);
                              }
                            }}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 4, right: 12 }}
                            style={{
                              marginTop: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 7,
                              alignSelf: 'flex-start',
                              paddingVertical: 2,
                            }}
                          >
                            <Phone size={13} color={isDark ? '#34D399' : '#059669'} />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: isDark ? '#34D399' : '#059669',
                                textDecorationLine: 'underline',
                              }}
                            >
                              {app.memberPhone}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => setExpandedId(isExpanded ? null : app.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.profileSection}>
                          <View
                            style={[
                              styles.avatar,
                              { backgroundColor: isDark ? '#047857' : '#059669' },
                            ]}
                          >
                            <Text style={styles.avatarTxt}>{initials}</Text>
                          </View>

                          <View style={styles.nameSection}>
                            <View style={styles.nameRow}>
                              <Text
                                style={[
                                  styles.name,
                                  { color: isDark ? '#FFFFFF' : '#1a2d5a' },
                                ]}
                                numberOfLines={1}
                              >
                                {app.memberName}
                              </Text>
                              {renderStatusBadge(app.status)}
                            </View>

                            <View style={styles.badgeRow}>
                              <View
                                style={[
                                  styles.roleBadge,
                                  {
                                    backgroundColor: isDark ? '#27272A' : '#F9F6F0',
                                    borderColor: isDark ? '#3F3F46' : '#E2DDD5',
                                  },
                                ]}
                              >
                                <Text style={[styles.roleTxt, { color: isDark ? '#60A5FA' : '#1a2d5a' }]}>
                                  GENERAL CHURCH
                                </Text>
                              </View>
                              <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#94A3B8' }}>
                                {app.createdAt?.toDate ? formatDateMonthYear(app.createdAt.toDate()) : 'Recent'}
                              </Text>
                              <View style={{ flex: 1 }} />
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  promptDeleteApplication(app);
                                }}
                                style={[
                                  styles.cardDeleteBtn,
                                  {
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA',
                                  },
                                ]}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={13} color={isDark ? '#F87171' : '#DC2626'} />
                              </TouchableOpacity>
                              <View style={styles.chevronWrap}>
                                {isExpanded ? (
                                  <ChevronUp size={16} color={isDark ? '#A1A1AA' : '#64748B'} />
                                ) : (
                                  <ChevronDown size={16} color={isDark ? '#A1A1AA' : '#64748B'} />
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* CONTACT SNIPPET */}
                      <View style={styles.contactDetails}>
                        {!!app.memberPhone && (
                          <View style={styles.contactRow}>
                            <Phone size={12} color={isDark ? '#71717A' : '#6B7280'} />
                            <Text style={[styles.contactTxt, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>
                              {app.memberPhone}
                            </Text>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(`tel:${app.memberPhone}`)}
                              style={{
                                marginLeft: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor: '#E0F2FE',
                              }}
                            >
                              <Text style={{ fontSize: 10, color: '#0369A1', fontWeight: '800' }}>CALL</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  {/* EXPANDED CONTENT DETAILS */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {isEvent && (
                        <View
                          style={{
                            backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                            borderRadius: 10,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                            {!!app.eventDate && (
                              <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155' }}>
                                📅 Date: <Text style={{ fontWeight: '700' }}>{formatDateMonthYear(app.eventDate)}</Text>
                              </Text>
                            )}
                            {!!app.eventTime && (
                              <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155' }}>
                                ⏰ Time: <Text style={{ fontWeight: '700' }}>{formatTimeTo12Hour(app.eventTime)}</Text>
                              </Text>
                            )}
                            {!!app.eventLocation && (
                              <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155' }}>
                                📍 Venue: <Text style={{ fontWeight: '700' }}>{app.eventLocation}</Text>
                              </Text>
                            )}
                          </View>
                        </View>
                      )}

                      {!isEvent && (
                        <View style={{ marginBottom: 10 }}>
                          {Array.isArray(app.preferredMinistries) && app.preferredMinistries.length > 0 && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={styles.sectionHeading}>PREFERRED MINISTRIES</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {app.preferredMinistries.map((min, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#FFFFFF' : '#1E293B' }}>
                                      {min}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}

                          {Array.isArray(app.skills) && app.skills.length > 0 && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={styles.sectionHeading}>SKILLS & TALENTS</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {app.skills.map((sk, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor: '#E0F2FE',
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0369A1' }}>{sk}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      )}

                      {!!app.availabilityNotes && (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesBoxLabel}>APPLICANT NOTES</Text>
                          <Text style={styles.notesBoxText}>"{app.availabilityNotes}"</Text>
                        </View>
                      )}

                      {/* APPROVED ASSIGNMENT BOX */}
                      {isApproved && (
                        <View
                          style={{
                            backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                            borderRadius: 10,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#A7F3D0',
                            marginBottom: 10,
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                              ACTIVE ASSIGNMENT
                            </Text>
                            <TouchableOpacity onPress={() => handleOpenAssignDuty(app)}>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>Edit Duties</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0F172A', marginTop: 3 }}>
                            Role: {app.assignedRole || app.preferredRole || 'Assigned Volunteer'}
                          </Text>
                          {!!app.assignedTimeSlot && (
                            <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155', marginTop: 1 }}>
                              ⏰ Reporting Time: {formatTimeTo12Hour(app.assignedTimeSlot)}
                            </Text>
                          )}
                          {!!app.assignedLocation && (
                            <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155', marginTop: 1 }}>
                              📍 Duty Station: {app.assignedLocation}
                            </Text>
                          )}
                          {!!app.assignedResponsibility && (
                            <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#334155', marginTop: 2, fontStyle: 'italic' }}>
                              Duties: {app.assignedResponsibility}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* REJECTION REASON */}
                      {app.status === 'rejected' && !!app.rejectionReason && (
                        <View style={styles.reasonBox}>
                          <Text style={styles.reasonBoxLabel}>REJECTION REASON</Text>
                          <Text style={styles.reasonBoxText}>{app.rejectionReason}</Text>
                        </View>
                      )}

                      {/* ACTION BUTTONS (WHEN PENDING) */}
                      {isPending && (
                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={[
                              styles.btnReject,
                              actionLoading && { opacity: 0.6 },
                            ]}
                            onPress={() => handleOpenReject(app)}
                            disabled={actionLoading}
                          >
                            <XCircle size={14} color="#B91C1C" />
                            <Text style={styles.btnRejectTxt}>Decline</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.btnApprove,
                              actionLoading && { opacity: 0.6 },
                            ]}
                            onPress={() => handleOpenApprove(app)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 size={14} color="#FFFFFF" />
                            <Text style={styles.btnApproveTxt}>
                              {isEvent ? 'Approve & Assign' : 'Approve Application'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* DELETE OPTION IN EXPANDED VIEW */}
                      <View
                        style={[
                          styles.expandedDeleteRow,
                          { borderTopColor: isDark ? '#27272A' : 'rgba(26,45,90,0.06)' },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.btnDeleteApp,
                            {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                              borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FCA5A5',
                            },
                          ]}
                          onPress={() => promptDeleteApplication(app)}
                          disabled={actionLoading}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={13} color={isDark ? '#F87171' : '#DC2626'} />
                          <Text style={[styles.btnDeleteAppTxt, { color: isDark ? '#F87171' : '#B91C1C' }]}>
                            Delete Application
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── MODAL 1: APPROVE & ASSIGN ROLE (EVENT VOLUNTEER) ── */}
      <Modal visible={showApprovalModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Approve Event Volunteer
                </Text>
                <Text style={styles.modalSub}>
                  For: {selectedApp?.memberName} · {selectedApp?.eventTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApprovalModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.fieldLabel}>ASSIGNED ROLE *</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedRole}
                onChangeText={setAssignedRole}
                placeholder="e.g. Ushering Lead, Sound Engineer"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>REPORTING TIME / TIME SLOT</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedTimeSlot}
                onChangeText={setAssignedTimeSlot}
                placeholder="e.g. 8:30 AM – 11:30 AM (Please arrive 30 mins early)"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>DUTY STATION / LOCATION</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedLocation}
                onChangeText={setAssignedLocation}
                placeholder="e.g. Main Auditorium Entrance"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>SPECIFIC TASKS & RESPONSIBILITIES</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1', height: 75, textAlignVertical: 'top' },
                ]}
                value={assignedResponsibility}
                onChangeText={setAssignedResponsibility}
                placeholder="e.g. Welcome guests, hand out song booklets, guide families to seating."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                onPress={() => setShowApprovalModal(false)}
                disabled={actionLoading}
              >
                <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleConfirmEventApproval}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Approve & Notify</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 2: REJECT APPLICATION ── */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Decline Application
                </Text>
                <Text style={styles.modalSub}>
                  Applicant: {selectedApp?.memberName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRejectModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Text style={styles.fieldLabel}>REASON FOR NOT APPROVING (OPTIONAL)</Text>
              <Text style={{ fontSize: 11, color: isDark ? '#A1A1AA' : '#64748B', marginBottom: 6 }}>
                This reason will be included in the push notification sent to the member.
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1', minHeight: 90, textAlignVertical: 'top' },
                ]}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="e.g. Volunteer capacity reached for this event. Thank you for your willingness to serve!"
                placeholderTextColor="#94A3B8"
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                onPress={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalRejectBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleConfirmRejection}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 3: ASSIGN / UPDATE DUTY ── */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Assign Volunteer Duties
                </Text>
                <Text style={styles.modalSub}>
                  Volunteer: {selectedApp?.memberName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.fieldLabel}>ASSIGNED ROLE *</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedRole}
                onChangeText={setAssignedRole}
                placeholder="e.g. Head Usher"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>TIME SLOT</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedTimeSlot}
                onChangeText={setAssignedTimeSlot}
                placeholder="e.g. 9:00 AM – 12:00 PM"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>LOCATION</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                value={assignedLocation}
                onChangeText={setAssignedLocation}
                placeholder="e.g. Front Gate / Welcome Desk"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>SPECIFIC RESPONSIBILITIES</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? '#27272A' : '#CBD5E1', height: 75, textAlignVertical: 'top' },
                ]}
                value={assignedResponsibility}
                onChangeText={setAssignedResponsibility}
                placeholder="Tasks and duties for this volunteer..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: isDark ? '#27272A' : '#CBD5E1' }]}
                onPress={() => setShowAssignModal(false)}
                disabled={actionLoading}
              >
                <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleConfirmDutyAssignment}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save & Notify Volunteer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = createAdminThemedStyles(
  StyleSheet.create({
    container: {
      flex: 1,
    },
    circularBackBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    hero: {
      backgroundColor: '#1a2d5a',
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 14,
      marginBottom: 10,
      overflow: 'visible',
      position: 'relative',
    },
    heroTitle: {
      color: '#fff',
      fontSize: 20,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      fontWeight: '600',
      letterSpacing: -0.5,
    },
    heroSub: {
      color: '#AEB8D4',
      fontSize: 13,
    },
    refreshHeroBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 2,
    },
    statCard: {
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      minWidth: 84,
    },
    activeStatCard: {
      borderColor: '#059669',
      borderWidth: 1.5,
      backgroundColor: '#ECFDF5',
    },
    statNum: {
      fontSize: 20,
      fontWeight: '800',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    statLbl: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 2,
      letterSpacing: 0.5,
    },
    segmentContainer: {
      flexDirection: 'row',
      borderRadius: 14,
      padding: 4,
      shadowColor: '#1a2d5a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      flexDirection: 'row',
      gap: 6,
    },
    segmentBtnActive: {
      elevation: 3,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    segmentBtnTxt: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    segmentBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentBadgeTxt: {
      fontSize: 11,
      fontWeight: '800',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      height: 44,
      borderWidth: 1.5,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      padding: 0,
    },
    listContainer: {
      flex: 1,
    },
    emptyView: {
      paddingVertical: 60,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 10,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 10,
      textAlign: 'center',
    },
    membersList: {
      gap: 12,
      paddingBottom: 20,
    },
    memberCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      shadowColor: '#1a2d5a',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    profileSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarTxt: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    nameSection: {
      flex: 1,
      flexDirection: 'column',
      gap: 3,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 15,
      fontWeight: '800',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      marginTop: 2,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    roleTxt: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusTxt: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    cardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardDeleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    chevronWrap: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 10,
      alignItems: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    contactTxt: {
      fontSize: 12,
      fontWeight: '600',
    },
    expandedContent: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(26,45,90,0.08)',
      paddingTop: 12,
    },
    sectionHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: '#64748B',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    notesBox: {
      backgroundColor: '#F8FAFC',
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginBottom: 10,
    },
    notesBoxLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748B',
      marginBottom: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    notesBoxText: {
      fontSize: 12,
      color: '#334155',
      lineHeight: 17,
      fontStyle: 'italic',
    },
    reasonBox: {
      backgroundColor: '#FEF2F2',
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      marginBottom: 10,
    },
    reasonBoxLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#991B1B',
      marginBottom: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    reasonBoxText: {
      fontSize: 12,
      color: '#991B1B',
      lineHeight: 17,
    },
    actionBtnRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    btnReject: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      backgroundColor: '#FEF2F2',
    },
    btnRejectTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: '#B91C1C',
    },
    btnApprove: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#059669',
    },
    btnApproveTxt: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    expandedDeleteRow: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(26,45,90,0.06)',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    btnDeleteApp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    btnDeleteAppTxt: {
      fontSize: 11,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalBox: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 18,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
    },
    modalSub: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#64748B',
      marginTop: 10,
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
    },
    modalFooterRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      paddingTop: 12,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalConfirmBtn: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#059669',
    },
    modalRejectBtn: {
      flex: 2,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#B91C1C',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
);
