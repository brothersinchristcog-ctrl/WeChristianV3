import React, { useState, useEffect } from 'react';
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
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Droplets,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  User,
  Phone,
  Building2,
  Send,
  History,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import FirestoreService, { BaptismRequest, BaptismHistoryItem } from '../services/FirestoreService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDateDisplay } from '../utils/DateUtils';
import { CustomAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function BaptismRequestScreen({ navigation }: any) {
  const { user, member: authMember } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'requests' | 'new'>('requests');
  const [requests, setRequests] = useState<BaptismRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Form State
  const [memberName, setMemberName] = useState(
    authMember?.name || `${authMember?.firstName || ''} ${authMember?.lastName || ''}`.trim() || user?.displayName || ''
  );
  const [memberId, setMemberId] = useState(authMember?.id || user?.uid || '');
  const [churchName, setChurchName] = useState(activeChurch?.name || 'WeChristian Church');
  const [memberPhone, setMemberPhone] = useState(
    authMember?.phone || user?.phoneNumber || ''
  );
  const [dob, setDob] = useState(authMember?.dob || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [address, setAddress] = useState(
    authMember?.mailingStreet || authMember?.city || authMember?.village || authMember?.mailingCity || ''
  );
  const [previousBaptism, setPreviousBaptism] = useState<'No' | 'Yes'>('No');
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Date Pickers
  const [isDobPickerVisible, setDobPickerVisible] = useState(false);
  const [isPreferredDatePickerVisible, setPreferredDatePickerVisible] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Calculate age when DOB is set
  const calculateAgeFromDob = (dobString: string): string => {
    if (!dobString) return '';
    try {
      const birth = new Date(dobString);
      if (isNaN(birth.getTime())) return '';
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      return calculatedAge > 0 ? String(calculatedAge) : '0';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (dob) {
      const computed = calculateAgeFromDob(dob);
      if (computed) setAge(computed);
    }
  }, [dob]);

  const fetchMyRequests = async (isRefresh = false) => {
    if (!activeChurch?.id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const mId = authMember?.id || user?.uid || '';
      const phone = memberPhone || user?.phoneNumber || '';
      const list = await FirestoreService.getMemberBaptismRequests(activeChurch.id, mId, phone);
      setRequests(list);

      // If user has no requests yet, default to 'new' tab
      if (list.length === 0 && !isRefresh) {
        setActiveTab('new');
      }
    } catch (err) {
      console.error('Error fetching baptism requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [activeChurch?.id, user?.uid]);

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      setAlertConfig({
        visible: true,
        title: 'Reason Required',
        message: 'Please provide the reason why you desire to take baptism.',
        type: 'warning'
      });
      return;
    }

    if (!preferredDate) {
      setAlertConfig({
        visible: true,
        title: 'Preferred Date Required',
        message: 'Please select your preferred baptism date.',
        type: 'warning'
      });
      return;
    }

    // Check if an existing pending/under_review request exists
    const hasActive = requests.some(r => r.status === 'pending' || r.status === 'under_review');
    if (hasActive) {
      setAlertConfig({
        visible: true,
        title: 'Existing Request In Progress',
        message: 'You already have a baptism request under pastoral review. Do you still wish to submit an additional request?',
        type: 'confirm',
        onConfirm: () => doSubmit()
      });
      return;
    }

    doSubmit();
  };

  const doSubmit = async () => {
    if (!activeChurch?.id) {
      setAlertConfig({
        visible: true,
        title: 'No Church Selected',
        message: 'Please ensure you are connected to a valid church.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await FirestoreService.createBaptismRequest(activeChurch.id, {
        memberId: memberId || user?.uid || 'anonymous',
        memberName: memberName || 'Church Member',
        memberPhone: memberPhone || 'No Phone',
        churchName: churchName,
        dob: dob || '',
        age: age || '',
        gender: gender || 'Male',
        address: address || '',
        previousBaptism: previousBaptism === 'Yes',
        reason: reason.trim(),
        preferredDate: preferredDate || '',
        additionalNotes: additionalNotes.trim()
      });

      if (res.success) {
        setAlertConfig({
          visible: true,
          title: 'Request Submitted!',
          message: 'Your baptism request has been submitted to the pastoral leadership. You will be notified once reviewed and scheduled.',
          type: 'success',
          onConfirm: () => {
            // Reset form fields
            setReason('');
            setAdditionalNotes('');
            setActiveTab('requests');
            fetchMyRequests();
          }
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Submission Failed',
          message: res.error || 'Could not submit your request. Please try again.',
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
      setSubmitting(false);
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C5C" />

      {/* Header */}
      <LinearGradient colors={['#0F4C5C', '#1A365D']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Droplets size={20} color="#67E8F9" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Water Baptism</Text>
            </View>
            <Text style={styles.headerSub}>Request & Approval Management</Text>
          </View>
        </View>

        {/* Tab Segment Controls */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabBtnTxt, activeTab === 'requests' && styles.tabBtnTxtActive]}>
              My Requests {requests.length > 0 ? `(${requests.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabBtnTxt, activeTab === 'new' && styles.tabBtnTxtActive]}>
              + Request Baptism
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      {activeTab === 'requests' ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMyRequests(true)} />}
        >
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0F4C5C" />
              <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Loading your requests...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Droplets size={44} color="#0F4C5C" />
              </View>
              <Text style={styles.emptyTitle}>No Baptism Requests Yet</Text>
              <Text style={styles.emptyText}>
                Water baptism is an essential biblical step of faith and obedience, identifying with Christ's death, burial, and resurrection (Romans 6:4).
              </Text>
              <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setActiveTab('new')}>
                <Text style={styles.emptyActionBtnTxt}>Submit Baptism Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              <Text style={styles.sectionHeader}>YOUR BAPTISM REQUESTS ({requests.length})</Text>

              {requests.map(req => {
                const badge = getStatusBadge(req.status);
                const BadgeIcon = badge.icon;
                const isExpanded = expandedRequestId === req.id;

                return (
                  <View key={req.id} style={styles.requestCard}>
                    {/* Card Top */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.requestCardHeader}
                      onPress={() => setExpandedRequestId(isExpanded ? null : req.id)}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.reqCardTitle}>Baptism Request</Text>
                        <Text style={styles.reqCardDate}>
                          Submitted on {formatDateDisplay(req.createdAt)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <BadgeIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusBadgeTxt, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Confirmed Schedule Banner (If Approved or Completed) */}
                    {(req.status === 'approved' || req.status === 'completed') && (req.confirmedDate || req.confirmedLocation) && (
                      <View style={styles.confirmedScheduleBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Sparkles size={16} color="#047857" style={{ marginRight: 6 }} />
                          <Text style={styles.confirmedTitle}>CONFIRMED BAPTISM SCHEDULE</Text>
                        </View>
                        <View style={styles.scheduleRow}>
                          <Calendar size={14} color="#065F46" style={{ marginRight: 8 }} />
                          <Text style={styles.scheduleTxt}>
                            Date: <Text style={{ fontWeight: '700' }}>{formatDateDisplay(req.confirmedDate)}</Text>
                          </Text>
                        </View>
                        {req.confirmedTime ? (
                          <View style={styles.scheduleRow}>
                            <Clock size={14} color="#065F46" style={{ marginRight: 8 }} />
                            <Text style={styles.scheduleTxt}>
                              Time: <Text style={{ fontWeight: '700' }}>{req.confirmedTime}</Text>
                            </Text>
                          </View>
                        ) : null}
                        {req.confirmedLocation ? (
                          <View style={styles.scheduleRow}>
                            <MapPin size={14} color="#065F46" style={{ marginRight: 8 }} />
                            <Text style={styles.scheduleTxt}>
                              Venue: <Text style={{ fontWeight: '700' }}>{req.confirmedLocation}</Text>
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* Admin Remarks Notice */}
                    {req.adminRemarks ? (
                      <View style={styles.adminRemarkBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Info size={14} color="#1E40AF" style={{ marginRight: 6 }} />
                          <Text style={styles.adminRemarkTitle}>Pastoral Remarks / Guidance:</Text>
                        </View>
                        <Text style={styles.adminRemarkTxt}>{req.adminRemarks}</Text>
                      </View>
                    ) : null}

                    {/* Summary row */}
                    <View style={styles.summaryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryLabel}>PREFERRED DATE</Text>
                        <Text style={styles.summaryVal}>{formatDateDisplay(req.preferredDate) || 'Not specified'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryLabel}>PREVIOUS BAPTISM</Text>
                        <Text style={styles.summaryVal}>{req.previousBaptism ? 'Yes' : 'No (First Time)'}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.expandToggleBtn}
                        onPress={() => setExpandedRequestId(isExpanded ? null : req.id)}
                      >
                        <Text style={styles.expandToggleTxt}>{isExpanded ? 'Hide' : 'Details'}</Text>
                        {isExpanded ? <ChevronUp size={14} color="#0F4C5C" /> : <ChevronDown size={14} color="#0F4C5C" />}
                      </TouchableOpacity>
                    </View>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>REASON FOR BAPTISM:</Text>
                          <Text style={styles.detailText}>{req.reason || 'None provided'}</Text>
                        </View>

                        {req.additionalNotes ? (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>ADDITIONAL NOTES:</Text>
                            <Text style={styles.detailText}>{req.additionalNotes}</Text>
                          </View>
                        ) : null}

                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>MEMBER DETAILS:</Text>
                          <Text style={styles.detailSub}>Name: {req.memberName}</Text>
                          <Text style={styles.detailSub}>Phone: {req.memberPhone}</Text>
                          {req.gender ? <Text style={styles.detailSub}>Gender: {req.gender}</Text> : null}
                          {req.age ? <Text style={styles.detailSub}>Age: {req.age} yrs</Text> : null}
                          {req.dob ? <Text style={styles.detailSub}>DOB: {formatDateDisplay(req.dob)}</Text> : null}
                          {req.address ? <Text style={styles.detailSub}>Address: {req.address}</Text> : null}
                        </View>

                        {/* Status History Timeline */}
                        {req.history && req.history.length > 0 && (
                          <View style={{ marginTop: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                              <History size={14} color="#64748B" style={{ marginRight: 6 }} />
                              <Text style={styles.historySectionTitle}>STATUS HISTORY</Text>
                            </View>
                            {req.history.map((h, hIdx) => (
                              <View key={hIdx} style={styles.historyItemRow}>
                                <View style={styles.historyDot} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.historyStatus}>
                                    {h.status?.toUpperCase().replace('_', ' ')}
                                  </Text>
                                  <Text style={styles.historyNote}>{h.note || 'Status updated'}</Text>
                                  <Text style={styles.historyTime}>
                                    {formatDateDisplay(h.timestamp)}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Header Intro */}
          <View style={styles.formIntroCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Droplets size={22} color="#0F4C5C" style={{ marginRight: 8 }} />
              <Text style={styles.formIntroTitle}>Baptism Application Form</Text>
            </View>
            <Text style={styles.formIntroText}>
              Please verify your personal details and share your spiritual decision for water baptism.
            </Text>
          </View>

          {/* Member Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Member Name</Text>
            <View style={[styles.inputBox, styles.readOnlyBox]}>
              <User size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputText}
                value={memberName}
                onChangeText={setMemberName}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Member ID & Church Name */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Member ID</Text>
              <View style={[styles.inputBox, styles.readOnlyBox]}>
                <TextInput
                  style={[styles.inputText, { color: '#64748B' }]}
                  value={memberId ? memberId.slice(0, 10) : 'N/A'}
                  editable={false}
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1.3 }]}>
              <Text style={styles.label}>Church Name</Text>
              <View style={[styles.inputBox, styles.readOnlyBox]}>
                <Building2 size={16} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.inputText, { color: '#64748B' }]}
                  value={churchName}
                  editable={false}
                  numberOfLines={1}
                />
              </View>
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputBox}>
              <Phone size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputText}
                value={memberPhone}
                onChangeText={setMemberPhone}
                keyboardType="phone-pad"
                placeholder="Mobile number"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Date of Birth & Age */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1.4, marginRight: 8 }]}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.inputBox, { justifyContent: 'space-between' }]}
                onPress={() => setDobPickerVisible(true)}
              >
                <Text style={{ fontSize: 14, color: dob ? '#1E293B' : '#94A3B8', fontWeight: dob ? '600' : '400' }}>
                  {dob ? formatDateDisplay(dob) : 'Select DOB'}
                </Text>
                <Calendar size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { flex: 0.8 }]}>
              <Text style={styles.label}>Age (Years)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.inputText, { textAlign: 'center' }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="Age"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['Male', 'Female'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderBtnTxt, gender === g && styles.genderBtnTxtActive]}>
                    {g === 'Male' ? '👨 Male' : '👩 Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address / Village / City</Text>
            <View style={styles.inputBox}>
              <MapPin size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputText}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter street, village or city"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Previous Baptism Status */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Have you been baptized before?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.genderBtn, previousBaptism === 'No' && styles.genderBtnActive]}
                onPress={() => setPreviousBaptism('No')}
              >
                <Text style={[styles.genderBtnTxt, previousBaptism === 'No' && styles.genderBtnTxtActive]}>
                  No (First Time Baptism)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, previousBaptism === 'Yes' && styles.genderBtnActive]}
                onPress={() => setPreviousBaptism('Yes')}
              >
                <Text style={[styles.genderBtnTxt, previousBaptism === 'Yes' && styles.genderBtnTxtActive]}>
                  Yes (Previously Baptized)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason for Baptism */}
          <View style={styles.formGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Reason for Baptism *</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>Required</Text>
            </View>
            <TextInput
              style={[styles.inputBox, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Tell us about your faith in Jesus Christ and why you desire to take water baptism..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Preferred Baptism Date */}
          <View style={styles.formGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Preferred Baptism Date *</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>Required</Text>
            </View>
            <TouchableOpacity
              style={[styles.inputBox, { justifyContent: 'space-between' }]}
              onPress={() => setPreferredDatePickerVisible(true)}
            >
              <Text style={{ fontSize: 14, color: preferredDate ? '#1E293B' : '#94A3B8', fontWeight: preferredDate ? '600' : '400' }}>
                {preferredDate ? formatDateDisplay(preferredDate) : 'Select Preferred Date'}
              </Text>
              <Calendar size={18} color="#0F4C5C" />
            </TouchableOpacity>
          </View>

          {/* Additional Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Notes / Prayer Needs (Optional)</Text>
            <TextInput
              style={[styles.inputBox, styles.textArea, { height: 75 }]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Any health considerations, specific questions, or notes for the pastoral team..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmitRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnTxt}>Submit Baptism Request</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* DOB Date Picker */}
      <DateTimePickerModal
        isVisible={isDobPickerVisible}
        mode="date"
        maximumDate={new Date()}
        onConfirm={date => {
          setDob(date.toISOString().split('T')[0]);
          setDobPickerVisible(false);
        }}
        onCancel={() => setDobPickerVisible(false)}
      />

      {/* Preferred Date Picker */}
      <DateTimePickerModal
        isVisible={isPreferredDatePickerVisible}
        mode="date"
        minimumDate={new Date()}
        onConfirm={date => {
          setPreferredDate(date.toISOString().split('T')[0]);
          setPreferredDatePickerVisible(false);
        }}
        onCancel={() => setPreferredDatePickerVisible(false)}
      />

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type === 'confirm' ? 'info' : alertConfig.type}
        buttons={
          alertConfig.type === 'confirm'
            ? [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                },
                {
                  text: 'Yes, Submit',
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F4C5C'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  headerSub: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '500',
    marginTop: 2
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 4
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  tabBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)'
  },
  tabBtnTxtActive: {
    color: '#0F4C5C'
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 2
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  emptyActionBtn: {
    backgroundColor: '#0F4C5C',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14
  },
  emptyActionBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  reqCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  reqCardDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  statusBadgeTxt: {
    fontSize: 11,
    fontWeight: '700'
  },
  confirmedScheduleBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12
  },
  confirmedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  scheduleTxt: {
    fontSize: 13,
    color: '#065F46'
  },
  adminRemarkBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12
  },
  adminRemarkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.3
  },
  adminRemarkTxt: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  expandToggleTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F4C5C',
    marginRight: 4
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  detailItem: {
    marginBottom: 10
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  detailSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2
  },
  historySectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 6
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F4C5C',
    marginTop: 5,
    marginRight: 10
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  historyNote: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1
  },
  historyTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2
  },
  // Form Styles
  formIntroCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  formIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1'
  },
  formIntroText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 17
  },
  formGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.3
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  readOnlyBox: {
    backgroundColor: '#F8FAFC'
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0
  },
  textArea: {
    height: 90,
    alignItems: 'flex-start'
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  genderBtnActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#F0FDFA'
  },
  genderBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  genderBtnTxtActive: {
    color: '#0F4C5C',
    fontWeight: '800'
  },
  submitBtn: {
    backgroundColor: '#0F4C5C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0F4C5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
