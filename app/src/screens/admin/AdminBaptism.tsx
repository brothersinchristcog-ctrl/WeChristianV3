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
  StatusBar
} from 'react-native';
import {
  Droplets,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  Calendar,
  MapPin,
  Phone,
  User,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  MessageSquare,
  Sparkles,
  History,
  Info,
  Check,
  Trash2,
  ChevronLeft,
  RefreshCw
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { BaptismRequest, BaptismHistoryItem } from '../../services/FirestoreService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDateDisplay, formatDateTimeDisplay } from '../../utils/DateUtils';
import { CustomAlert } from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

type StatusType = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';

export default function AdminBaptism({ navigation }: any) {
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const { setActiveTab } = useContext(AdminTabContext) || {};

  const [requests, setRequests] = useState<BaptismRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'B';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Detail & Approval Modal State
  const [selectedRequest, setSelectedRequest] = useState<BaptismRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  // Edit / Workflow Form State (within modal)
  const [editStatus, setEditStatus] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | 'completed'>('pending');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedTime, setConfirmedTime] = useState('');
  const [confirmedLocation, setConfirmedLocation] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'info' });

  const fetchRequests = async (isRefresh = false) => {
    if (!activeChurch?.id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await FirestoreService.getChurchBaptismRequests(activeChurch.id);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching church baptism requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeChurch?.id]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const underReview = requests.filter(r => r.status === 'under_review').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { total, pending, underReview, approved, completed, rejected };
  }, [requests]);

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const query = searchQuery.trim().toLowerCase();
      const nameMatch = (req.memberName || '').toLowerCase().includes(query);
      const phoneMatch = (req.memberPhone || '').includes(query);
      const addressMatch = (req.address || '').toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || phoneMatch || addressMatch;

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const openRequestDetail = (req: BaptismRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status || 'pending');
    setAdminRemarks(req.adminRemarks || '');
    setConfirmedDate(req.confirmedDate || req.preferredDate || '');
    setConfirmedTime(req.confirmedTime || '10:30 AM');
    setConfirmedLocation(req.confirmedLocation || 'Main Sanctuary Baptistry');
    setDetailModalVisible(true);
  };

  const handleSaveAction = async () => {
    if (!selectedRequest || !activeChurch?.id) return;

    if (editStatus === 'approved' && !confirmedDate) {
      setAlertConfig({
        visible: true,
        title: 'Schedule Date Needed',
        message: 'Please confirm the scheduled baptism date before approving.',
        type: 'warning'
      });
      return;
    }

    setSavingAction(true);
    try {
      const adminName = member?.name || user?.displayName || 'Church Pastor';
      const res = await FirestoreService.updateBaptismRequest(
        activeChurch.id,
        selectedRequest.id,
        {
          status: editStatus,
          adminRemarks: adminRemarks.trim(),
          confirmedDate: editStatus === 'approved' || editStatus === 'completed' ? confirmedDate : (selectedRequest.confirmedDate || ''),
          confirmedTime: editStatus === 'approved' || editStatus === 'completed' ? confirmedTime : (selectedRequest.confirmedTime || ''),
          confirmedLocation: editStatus === 'approved' || editStatus === 'completed' ? confirmedLocation.trim() : (selectedRequest.confirmedLocation || '')
        },
        adminName
      );

      if (res.success) {
        setDetailModalVisible(false);
        setAlertConfig({
          visible: true,
          title: 'Status Updated!',
          message: `Baptism request status updated to ${editStatus.toUpperCase().replace('_', ' ')}. The member has been notified.`,
          type: 'success',
          onConfirm: () => fetchRequests()
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Update Error',
          message: res.error || 'Could not update the request.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: err.message || 'Something went wrong.',
        type: 'error'
      });
    } finally {
      setSavingAction(false);
    }
  };

  const promptDeleteRequest = (req: BaptismRequest) => {
    setAlertConfig({
      visible: true,
      title: 'Delete Baptism Request?',
      message: `Are you sure you want to delete the baptism request for ${req.memberName || 'this member'}? This cannot be undone.`,
      type: 'confirm',
      onConfirm: () => executeDeleteRequest(req.id)
    });
  };

  const executeDeleteRequest = async (requestId: string) => {
    if (!activeChurch?.id || !requestId) return;
    try {
      const res = await FirestoreService.deleteBaptismRequest(activeChurch.id, requestId);
      if (res.success) {
        setDetailModalVisible(false);
        setSelectedRequest(null);
        fetchRequests(true);
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: res.error || 'Failed to delete request',
          type: 'error'
        });
      }
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: err.message || 'Failed to delete request',
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: '#DCFCE7',
          border: '#86EFAC',
          text: '#15803D',
          label: 'Approved',
          icon: CheckCircle2
        };
      case 'completed':
        return {
          bg: '#EEF2FF',
          border: '#C7D2FE',
          text: '#4338CA',
          label: 'Completed',
          icon: Award
        };
      case 'under_review':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          text: '#1D4ED8',
          label: 'Under Review',
          icon: AlertCircle
        };
      case 'rejected':
        return {
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#B91C1C',
          label: 'Declined',
          icon: XCircle
        };
      case 'pending':
      default:
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          label: 'Pending',
          icon: Clock
        };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 }}>
            <TouchableOpacity
              onPress={() => (setActiveTab ? setActiveTab(0) : navigation?.goBack?.())}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>Baptism</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]} numberOfLines={1}>
                {requests.length} total · {stats.pending} pending
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshHeroBtn}
            onPress={() => fetchRequests(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Filter Row ── */}
      <View style={{ marginBottom: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'all' && styles.activeStatCard]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#1a2d5a' }]}>{stats.total}</Text>
            <Text style={styles.statLbl}>ALL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'pending' && styles.activeStatCard]}
            onPress={() => setStatusFilter('pending')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={styles.statLbl}>PENDING</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'under_review' && styles.activeStatCard]}
            onPress={() => setStatusFilter('under_review')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.underReview}</Text>
            <Text style={styles.statLbl}>REVIEW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'approved' && styles.activeStatCard]}
            onPress={() => setStatusFilter('approved')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#059669' }]}>{stats.approved}</Text>
            <Text style={styles.statLbl}>APPROVED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'completed' && styles.activeStatCard]}
            onPress={() => setStatusFilter('completed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#6366F1' }]}>{stats.completed}</Text>
            <Text style={styles.statLbl}>COMPLETED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'rejected' && styles.activeStatCard]}
            onPress={() => setStatusFilter('rejected')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNum, { color: '#DC2626' }]}>{stats.rejected}</Text>
            <Text style={styles.statLbl}>DECLINED</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by member name, mobile, address..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Request List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} />}
      >
        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0F4C5C" />
            <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Loading baptism requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyView}>
            <Droplets size={44} color="#CBD5E1" />
            <Text style={styles.emptyText}>No baptism requests match the filter.</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredRequests.map(req => {
              const isExpanded = expandedId === req.id;
              const badge = getStatusBadge(req.status);
              const BadgeIcon = badge.icon;
              const initials = getInitials(req.memberName);
              const isScheduled = (req.status === 'approved' || req.status === 'completed') && Boolean(req.confirmedDate);

              return (
                <View
                  key={req.id}
                  style={[styles.memberCard, isExpanded && styles.memberCardExpanded]}
                >
                  {/* Card Header (Expand / Collapse) */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    activeOpacity={0.7}
                    onPress={() => handleToggleExpand(req.id)}
                  >
                    <View style={styles.profileSection}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{initials}</Text>
                      </View>
                      <View style={styles.nameSection}>
                        <Text style={styles.name}>{req.memberName}</Text>
                        {req.address ? (
                          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 4 }} numberOfLines={1}>
                            📍 {req.address.trim()}
                          </Text>
                        ) : null}
                        <View style={styles.badgeRow}>
                          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                            <BadgeIcon size={11} color={badge.text} style={{ marginRight: 4 }} />
                            <Text style={[styles.statusTxt, { color: badge.text }]}>{badge.label.toUpperCase()}</Text>
                          </View>
                          <View style={styles.roleBadge}>
                            <Text style={styles.roleTxt}>
                              {req.previousBaptism ? 'PREVIOUS BAPTISM' : 'FIRST TIME'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          openRequestDetail(req);
                        }}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Edit2 size={18} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          promptDeleteRequest(req);
                        }}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={18} color="#DC2626" />
                      </TouchableOpacity>
                      <View style={styles.chevronWrap}>
                        {isExpanded ? (
                          <ChevronUp size={18} color="#6B7280" />
                        ) : (
                          <ChevronDown size={18} color="#6B7280" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Contact Details Row */}
                  <View style={styles.contactDetails}>
                    <TouchableOpacity
                      style={styles.contactRow}
                      onPress={() => req.memberPhone && Linking.openURL(`tel:${req.memberPhone.replace(/[^0-9+]/g, '')}`)}
                    >
                      <Phone size={12} color="#6B7280" />
                      <Text style={styles.contactTxt}>{req.memberPhone || 'No Phone'}</Text>
                    </TouchableOpacity>
                    <View style={styles.contactRow}>
                      <Calendar size={12} color="#6B7280" />
                      <Text style={styles.contactTxt}>Pref: {formatDateDisplay(req.preferredDate) || 'TBD'}</Text>
                    </View>
                    {(req.gender || req.age) ? (
                      <View style={styles.contactRow}>
                        <User size={12} color="#6B7280" />
                        <Text style={styles.contactTxt}>
                          {req.gender ? req.gender : ''}{req.gender && req.age ? ' • ' : ''}{req.age ? `${req.age} yrs` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Confirmed Schedule Pill (if scheduled) */}
                  {isScheduled ? (
                    <View style={styles.confirmedPill}>
                      <Calendar size={13} color="#047857" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmedPillTxt} numberOfLines={1}>
                        Scheduled: {formatDateDisplay(req.confirmedDate)} {req.confirmedTime ? `@ ${req.confirmedTime}` : ''} {req.confirmedLocation ? `(${req.confirmedLocation})` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* In-Place Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Activity Stats SubGrid */}
                      <View style={styles.statsSubGrid}>
                        <View style={styles.subStatBox}>
                          <View style={styles.subStatLabelRow}>
                            <Clock size={12} color="#c0392b" />
                            <Text style={styles.subStatLabel}>Requested On</Text>
                          </View>
                          <Text style={styles.subStatValue}>{formatDateDisplay(req.createdAt)}</Text>
                        </View>
                        <View style={styles.subStatBox}>
                          <View style={styles.subStatLabelRow}>
                            <Award size={12} color="#15803D" />
                            <Text style={styles.subStatLabel}>Previous Baptism</Text>
                          </View>
                          <Text style={styles.subStatValue}>
                            {req.previousBaptism ? 'Yes (Has Baptized)' : 'No (First Time)'}
                          </Text>
                        </View>
                      </View>

                      {/* Schedule Details if available */}
                      {isScheduled && (
                        <View style={styles.scheduleInfoBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Calendar size={14} color="#047857" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#047857' }}>Confirmed Baptism Service</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: '#065F46', marginBottom: 2 }}>
                            📅 Date: <Text style={{ fontWeight: '700' }}>{formatDateDisplay(req.confirmedDate)}</Text>
                            {req.confirmedTime ? `  ⏰ Time: ${req.confirmedTime}` : ''}
                          </Text>
                          {req.confirmedLocation ? (
                            <Text style={{ fontSize: 12, color: '#065F46' }}>
                              📍 Location: <Text style={{ fontWeight: '600' }}>{req.confirmedLocation}</Text>
                            </Text>
                          ) : null}
                        </View>
                      )}

                      {/* Reason / Statement */}
                      {req.reason ? (
                        <View style={styles.modalReasonBox}>
                          <Text style={styles.reasonBoxLabel}>Reason / Testimony for Baptism:</Text>
                          <Text style={styles.reasonBoxText}>"{req.reason}"</Text>
                        </View>
                      ) : null}

                      {/* Additional Notes / Admin Remarks */}
                      {req.additionalNotes ? (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesBoxLabel}>Candidate Notes:</Text>
                          <Text style={styles.notesBoxText}>{req.additionalNotes}</Text>
                        </View>
                      ) : null}

                      {req.adminRemarks ? (
                        <View style={[styles.notesBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                          <Text style={[styles.notesBoxLabel, { color: '#0369A1' }]}>Pastoral / Admin Remarks:</Text>
                          <Text style={[styles.notesBoxText, { color: '#0C4A6E' }]}>{req.adminRemarks}</Text>
                        </View>
                      ) : null}

                      {/* Action Buttons */}
                      <View style={styles.actionBtnRow}>
                        <TouchableOpacity
                          style={styles.reviewBtn}
                          activeOpacity={0.7}
                          onPress={() => openRequestDetail(req)}
                        >
                          <Edit2 size={14} color="#fff" />
                          <Text style={styles.reviewBtnTxt}>Review & Update Status</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteActionBtn}
                          activeOpacity={0.7}
                          onPress={() => promptDeleteRequest(req)}
                        >
                          <Trash2 size={14} color="#fff" />
                          <Text style={styles.deleteActionBtnTxt}>Delete</Text>
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

      {/* ── Detail, Approval & Scheduling Modal ── */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Droplets size={22} color="#0F4C5C" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.modalTitle}>Baptism Request Review</Text>
                  <Text style={styles.modalSub}>{selectedRequest?.memberName}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: '82%' }}
              contentContainerStyle={{ padding: 18 }}
              keyboardShouldPersistTaps="handled"
            >
              {selectedRequest && (
                <>
                  {/* Member Quick Contact Bar */}
                  <View style={styles.memberBar}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberBarName}>{selectedRequest.memberName}</Text>
                      <Text style={styles.memberBarPhone}>{selectedRequest.memberPhone}</Text>
                      {selectedRequest.address ? (
                        <Text style={styles.memberBarAddr}>{selectedRequest.address}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${selectedRequest.memberPhone.replace(/[^0-9+]/g, '')}`)}
                    >
                      <Phone size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.callBtnTxt}>Call</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Personal & Spiritual Details Grid */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>APPLICATION DETAILS</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoCellLabel}>GENDER</Text>
                        <Text style={styles.infoCellVal}>{selectedRequest.gender || 'Not specified'}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoCellLabel}>AGE</Text>
                        <Text style={styles.infoCellVal}>{selectedRequest.age ? `${selectedRequest.age} yrs` : 'N/A'}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoCellLabel}>DATE OF BIRTH</Text>
                        <Text style={styles.infoCellVal}>{formatDateDisplay(selectedRequest.dob) || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoCellLabel}>PREV. BAPTISM</Text>
                        <Text style={styles.infoCellVal}>{selectedRequest.previousBaptism ? 'Yes' : 'No (First Time)'}</Text>
                      </View>
                    </View>

                    {/* Reason for Baptism Box */}
                    <View style={styles.modalReasonBox}>
                      <Text style={styles.reasonBoxLabel}>REASON FOR BAPTISM:</Text>
                      <Text style={styles.reasonBoxText}>{selectedRequest.reason || 'None provided'}</Text>
                    </View>

                    {/* Additional Notes Box */}
                    {selectedRequest.additionalNotes ? (
                      <View style={[styles.modalReasonBox, { backgroundColor: '#F8FAFC', marginTop: 8 }]}>
                        <Text style={styles.reasonBoxLabel}>MEMBER NOTES:</Text>
                        <Text style={styles.reasonBoxText}>{selectedRequest.additionalNotes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* ── Workflow Action & Scheduling ── */}
                  <View style={styles.actionSection}>
                    <Text style={styles.sectionHeading}>APPROVAL & SCHEDULE WORKFLOW</Text>

                    {/* Status Picker Buttons */}
                    <Text style={styles.fieldLabel}>Set Request Status:</Text>
                    <View style={styles.statusRow}>
                      {(['pending', 'under_review', 'approved', 'rejected', 'completed'] as const).map(st => {
                        const isSel = editStatus === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            style={[
                              styles.statusSelectBtn,
                              isSel && styles.statusSelectBtnActive,
                              st === 'approved' && isSel && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                              st === 'rejected' && isSel && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                              st === 'completed' && isSel && { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
                              st === 'under_review' && isSel && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                            ]}
                            onPress={() => setEditStatus(st)}
                          >
                            <Text
                              style={[
                                styles.statusSelectTxt,
                                isSel && styles.statusSelectTxtActive,
                                st === 'approved' && isSel && { color: '#15803D' },
                                st === 'rejected' && isSel && { color: '#B91C1C' },
                                st === 'completed' && isSel && { color: '#4338CA' },
                                st === 'under_review' && isSel && { color: '#1D4ED8' }
                              ]}
                            >
                              {st === 'under_review' ? 'Review' : st.charAt(0).toUpperCase() + st.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Scheduling Fields (shown for all, highlighted on approved/completed) */}
                    <View style={styles.scheduleBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Calendar size={16} color="#0F4C5C" style={{ marginRight: 6 }} />
                        <Text style={styles.scheduleBoxTitle}>CONFIRMED BAPTISM SCHEDULE</Text>
                      </View>

                      {/* Confirmed Date */}
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Confirmed Date</Text>
                        <TouchableOpacity
                          style={[styles.inputBox, { justifyContent: 'space-between' }]}
                          onPress={() => setDatePickerVisible(true)}
                        >
                          <Text style={{ fontSize: 14, color: confirmedDate ? '#1E293B' : '#94A3B8', fontWeight: confirmedDate ? '700' : '400' }}>
                            {confirmedDate ? formatDateDisplay(confirmedDate) : 'Select Baptism Date'}
                          </Text>
                          <Calendar size={18} color="#0F4C5C" />
                        </TouchableOpacity>
                      </View>

                      {/* Confirmed Time & Location in 2 cols */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Time</Text>
                          <View style={styles.inputBox}>
                            <TextInput
                              style={styles.inputText}
                              placeholder="e.g. 10:30 AM"
                              placeholderTextColor="#94A3B8"
                              value={confirmedTime}
                              onChangeText={setConfirmedTime}
                            />
                          </View>
                        </View>
                        <View style={[styles.formGroup, { flex: 1.5 }]}>
                          <Text style={styles.fieldLabel}>Venue / Location</Text>
                          <View style={styles.inputBox}>
                            <TextInput
                              style={styles.inputText}
                              placeholder="e.g. Main Baptistry"
                              placeholderTextColor="#94A3B8"
                              value={confirmedLocation}
                              onChangeText={setConfirmedLocation}
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Admin Remarks / Pastoral Notes */}
                    <View style={[styles.formGroup, { marginTop: 12 }]}>
                      <Text style={styles.fieldLabel}>Pastoral Remarks / Guidance (Sent to Member)</Text>
                      <TextInput
                        style={[styles.inputBox, styles.textArea]}
                        placeholder="Add pastoral notes, requirements, or reason if rejected..."
                        placeholderTextColor="#94A3B8"
                        value={adminRemarks}
                        onChangeText={setAdminRemarks}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Save & Notify Button */}
                    <TouchableOpacity
                      style={[styles.saveActionBtn, savingAction && { opacity: 0.7 }]}
                      onPress={handleSaveAction}
                      disabled={savingAction}
                    >
                      {savingAction ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.saveActionBtnTxt}>
                            Save Changes & Notify Member
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Delete Request Button */}
                    <TouchableOpacity
                      style={styles.deleteModalBtn}
                      onPress={() => promptDeleteRequest(selectedRequest)}
                    >
                      <Trash2 size={16} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.deleteModalBtnTxt}>Delete This Request</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Complete History Timeline */}
                  {selectedRequest.history && selectedRequest.history.length > 0 && (
                    <View style={styles.historyBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <History size={16} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.sectionHeading}>REQUEST HISTORY AUDIT</Text>
                      </View>
                      {selectedRequest.history.map((h: BaptismHistoryItem, idx: number) => (
                        <View key={idx} style={styles.historyRow}>
                          <View style={styles.historyBullet} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyStatusTxt}>
                              {h.status?.toUpperCase().replace('_', ' ')}
                            </Text>
                            <Text style={styles.historyNoteTxt}>{h.note}</Text>
                            <Text style={styles.historyByTxt}>
                              By: {h.changedBy || 'Admin'} • {formatDateTimeDisplay(h.timestamp)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={date => {
          setConfirmedDate(date.toISOString().split('T')[0]);
          setDatePickerVisible(false);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={
          alertConfig.type === 'confirm'
            ? [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }
                }
              ]
            : [
                {
                  text: 'OK',
                  onPress: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }
                }
              ]
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f7'
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
    position: 'relative'
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    letterSpacing: -0.5
  },
  heroSub: {
    color: '#AEB8D4',
    fontSize: 13
  },
  refreshHeroBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 4
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    minWidth: 84
  },
  activeStatCard: {
    borderColor: '#1a2d5a',
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC'
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0
  },
  listContainer: {
    flex: 1
  },
  emptyView: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 10
  },
  membersList: {
    gap: 12,
    paddingBottom: 20
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    padding: 14,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12
  },
  memberCardExpanded: {
    borderColor: '#C9A84C',
    borderWidth: 1.5,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
  nameSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    marginTop: 2
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2d5a'
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 4
  },
  roleBadge: {
    backgroundColor: '#F9F6F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2DDD5'
  },
  roleTxt: {
    color: '#1a2d5a',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  statusTxt: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  chevronWrap: {
    padding: 2
  },
  contactDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    alignItems: 'center'
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  contactTxt: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600'
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10
  },
  confirmedPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    flex: 1
  },
  expandedContent: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,45,90,0.08)',
    paddingTop: 14
  },
  statsSubGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  subStatBox: {
    flex: 1,
    backgroundColor: '#F9F6F0',
    borderRadius: 10,
    padding: 10
  },
  subStatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4
  },
  subStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  subStatValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a2d5a'
  },
  scheduleInfoBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  reasonBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  reasonBoxText: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  notesBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  notesBoxText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2d5a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6
  },
  reviewBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6
  },
  deleteActionBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  memberBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  memberBarName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F4C5C'
  },
  memberBarPhone: {
    fontSize: 13,
    color: '#134E4A',
    marginTop: 2
  },
  memberBarAddr: {
    fontSize: 11,
    color: '#0D9488',
    marginTop: 2
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4C5C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  callBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  infoSection: {
    marginBottom: 16
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  infoCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  infoCellLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5
  },
  infoCellVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2
  },
  modalReasonBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12
  },
  modalReasonBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  modalReasonBoxText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  statusSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  statusSelectBtnActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#F0FDFA'
  },
  statusSelectTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  statusSelectTxtActive: {
    color: '#0F4C5C'
  },
  scheduleBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 12
  },
  scheduleBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: 0.5
  },
  formGroup: {
    marginBottom: 10
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0
  },
  textArea: {
    height: 75,
    alignItems: 'flex-start'
  },
  saveActionBtn: {
    backgroundColor: '#0F4C5C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0F4C5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  saveActionBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  historyBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4
  },
  historyBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F4C5C',
    marginTop: 5,
    marginRight: 10
  },
  historyStatusTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  historyNoteTxt: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1
  },
  historyByTxt: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2
  },
  cardDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    marginTop: 10
  },
  deleteModalBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626'
  }
});
