import React, { useState, useEffect, useMemo } from 'react';
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
  KeyboardAvoidingView
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
  Edit2,
  MessageSquare,
  Sparkles,
  History,
  Info,
  Check
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import FirestoreService, { BaptismRequest, BaptismHistoryItem } from '../../services/FirestoreService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDateDisplay } from '../../utils/DateUtils';
import { CustomAlert } from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

type StatusType = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';

export default function AdminBaptism({ navigation }: any) {
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();

  const [requests, setRequests] = useState<BaptismRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');

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
    type: 'success' | 'info' | 'error' | 'warning';
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
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconCircle}>
            <Droplets size={22} color="#0F4C5C" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.topHeaderTitle}>Baptism Management</Text>
            <Text style={styles.topHeaderSub}>
              {activeChurch?.name || 'WeChristian Church'} • {requests.length} Total Requests
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards Row */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'all' && styles.statCardActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={styles.statCount}>{stats.total}</Text>
            <Text style={styles.statLabel}>ALL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'pending' && styles.statCardActive, { borderLeftColor: '#F59E0B' }]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.statCount, { color: '#B45309' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'under_review' && styles.statCardActive, { borderLeftColor: '#2563EB' }]}
            onPress={() => setStatusFilter('under_review')}
          >
            <Text style={[styles.statCount, { color: '#1D4ED8' }]}>{stats.underReview}</Text>
            <Text style={styles.statLabel}>REVIEW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'approved' && styles.statCardActive, { borderLeftColor: '#10B981' }]}
            onPress={() => setStatusFilter('approved')}
          >
            <Text style={[styles.statCount, { color: '#047857' }]}>{stats.approved}</Text>
            <Text style={styles.statLabel}>APPROVED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'completed' && styles.statCardActive, { borderLeftColor: '#6366F1' }]}
            onPress={() => setStatusFilter('completed')}
          >
            <Text style={[styles.statCount, { color: '#4338CA' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, statusFilter === 'rejected' && styles.statCardActive, { borderLeftColor: '#EF4444' }]}
            onPress={() => setStatusFilter('rejected')}
          >
            <Text style={[styles.statCount, { color: '#B91C1C' }]}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>DECLINED</Text>
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
          filteredRequests.map(req => {
            const badge = getStatusBadge(req.status);
            const BadgeIcon = badge.icon;

            return (
              <TouchableOpacity
                key={req.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => openRequestDetail(req)}
              >
                {/* Top Info */}
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarTxt}>
                      {(req.memberName || 'M')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.memberName}>{req.memberName}</Text>
                    <Text style={styles.memberMeta}>
                      Phone: {req.memberPhone} {req.gender ? `• ${req.gender}` : ''} {req.age ? `• ${req.age} yrs` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <BadgeIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeTxt, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Preferred Date & Previous Status */}
                <View style={styles.cardMiddle}>
                  <View style={styles.cardDataCol}>
                    <Text style={styles.cardDataLabel}>PREFERRED DATE</Text>
                    <Text style={styles.cardDataVal}>
                      {formatDateDisplay(req.preferredDate) || 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.cardDataCol}>
                    <Text style={styles.cardDataLabel}>PREVIOUS BAPTISM</Text>
                    <Text style={styles.cardDataVal}>
                      {req.previousBaptism ? 'Yes' : 'No (First Time)'}
                    </Text>
                  </View>
                  <View style={styles.cardDataCol}>
                    <Text style={styles.cardDataLabel}>REQUEST DATE</Text>
                    <Text style={styles.cardDataVal}>
                      {formatDateDisplay(req.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Confirmed Schedule Pill (if scheduled) */}
                {(req.status === 'approved' || req.status === 'completed') && req.confirmedDate ? (
                  <View style={styles.confirmedPill}>
                    <Calendar size={13} color="#047857" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmedPillTxt}>
                      Scheduled: {formatDateDisplay(req.confirmedDate)} {req.confirmedTime ? `@ ${req.confirmedTime}` : ''} {req.confirmedLocation ? `(${req.confirmedLocation})` : ''}
                    </Text>
                  </View>
                ) : null}

                {/* Reason Preview */}
                {req.reason ? (
                  <Text style={styles.reasonExcerpt} numberOfLines={2}>
                    "{req.reason}"
                  </Text>
                ) : null}

                {/* Bottom Action Hint */}
                <View style={styles.cardBottom}>
                  <Text style={styles.cardBottomHint}>Tap to view details, update status & schedule</Text>
                  <ChevronRight size={16} color="#0F4C5C" />
                </View>
              </TouchableOpacity>
            );
          })
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
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonBoxLabel}>REASON FOR BAPTISM:</Text>
                      <Text style={styles.reasonBoxText}>{selectedRequest.reason || 'None provided'}</Text>
                    </View>

                    {/* Additional Notes Box */}
                    {selectedRequest.additionalNotes ? (
                      <View style={[styles.reasonBox, { backgroundColor: '#F8FAFC', marginTop: 8 }]}>
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
                              By: {h.changedBy || 'Admin'} • {formatDateDisplay(h.timestamp)}
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
        buttons={[
          {
            text: 'OK',
            onPress: () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
              if (alertConfig.onConfirm) alertConfig.onConfirm();
            }
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  topHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  statCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#0F4C5C',
    minWidth: 80,
    alignItems: 'center'
  },
  statCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F4C5C'
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  memberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  memberMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1
  },
  statusBadgeTxt: {
    fontSize: 11,
    fontWeight: '700'
  },
  cardMiddle: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  cardDataCol: {
    flex: 1
  },
  cardDataLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5
  },
  cardDataVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2
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
    marginBottom: 8
  },
  confirmedPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  reasonExcerpt: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 10
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10
  },
  cardBottomHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F4C5C'
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
  reasonBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12
  },
  reasonBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  reasonBoxText: {
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
  }
});
