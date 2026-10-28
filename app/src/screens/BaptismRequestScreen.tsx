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
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
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
  Send,
  History,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
  MessageSquare
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import FirestoreService, { BaptismRequest, BaptismHistoryItem } from '../services/FirestoreService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDateDisplay, formatDateTimeDisplay, formatDatesInText } from '../utils/DateUtils';
import { CustomAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

interface FamilyCandidate {
  id: string;
  name: string;
  relation: string;
  phone?: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  address?: string;
  isSelf?: boolean;
}

export default function BaptismRequestScreen({ navigation }: any) {
  const { user, member: authMember } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark } = useTheme();

  const [requests, setRequests] = useState<BaptismRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<FamilyCandidate | null>(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Form State
  const [memberName, setMemberName] = useState(
    authMember?.name || `${authMember?.firstName || ''} ${authMember?.lastName || ''}`.trim() || user?.displayName || ''
  );
  const churchName = activeChurch?.name || 'WeChristian Church';

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
  const calculateAgeFromDob = (dobInput: any): string => {
    if (!dobInput) return '';
    try {
      const dobString = String(dobInput).trim();
      const parts = dobString.split(/[-/]/);
      let birth: Date;
      if (parts.length === 3 && parts[2].length === 4) {
        // DD-MM-YYYY
        birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD
        birth = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        birth = new Date(dobString);
      }
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

  // Fetch Requests for this Member / Family
  const fetchMyRequests = async (isRefresh = false): Promise<BaptismRequest[]> => {
    if (!activeChurch?.id) {
      return [];
    }

    try {
      const mId = authMember?.id || user?.uid || '';
      const phone = authMember?.phone || user?.phoneNumber || '';
      const list = await FirestoreService.getMemberBaptismRequests(activeChurch.id, mId, phone);
      setRequests(list);
      if (list.length > 0 && !expandedRequestId) {
        setExpandedRequestId(list[0].id);
      }
      return list;
    } catch (err) {
      console.error('Error fetching baptism requests:', err);
      return [];
    }
  };

  // Fetch Family / Household Members
  const fetchFamilyMembers = async (currentRequests: BaptismRequest[] = requests) => {
    if (!activeChurch?.id) return;

    const selfCandidate: FamilyCandidate = {
      id: authMember?.id || user?.uid || 'self',
      name: authMember?.name || `${authMember?.firstName || ''} ${authMember?.lastName || ''}`.trim() || user?.displayName || 'Self',
      relation: 'Self',
      phone: authMember?.phone || user?.phoneNumber || '',
      dob: authMember?.dob || '',
      gender: ((authMember as any)?.gender === 'Female' ? 'Female' : 'Male'),
      address: authMember?.mailingStreet || authMember?.city || authMember?.village || authMember?.mailingCity || '',
      isSelf: true
    };

    const candidates: FamilyCandidate[] = [selfCandidate];

    try {
      const churchId = activeChurch.id;
      const targetAccountId = authMember?.accountId || authMember?.id;
      const relatedDocs: any[] = [];

      // 1. Query by accountId in church members
      if (targetAccountId) {
        const snap1 = await firestore()
          .collection('churches')
          .doc(churchId)
          .collection('members')
          .where('accountId', '==', targetAccountId)
          .get()
          .catch(() => null);
        if (snap1 && !snap1.empty) {
          snap1.forEach(d => relatedDocs.push({ id: d.id, ...d.data() }));
        }
      }

      // 2. Query where accountId is authMember.id (if different)
      if (authMember?.id && authMember.id !== targetAccountId) {
        const snap2 = await firestore()
          .collection('churches')
          .doc(churchId)
          .collection('members')
          .where('accountId', '==', authMember.id)
          .get()
          .catch(() => null);
        if (snap2 && !snap2.empty) {
          snap2.forEach(d => {
            if (!relatedDocs.some(r => r.id === d.id)) {
              relatedDocs.push({ id: d.id, ...d.data() });
            }
          });
        }
      }

      // Add related family members (spouse, kids, etc.)
      relatedDocs.forEach(d => {
        if (d.id === authMember?.id || d.id === user?.uid) return;

        const candidateName = (
          `${d.firstName || ''} ${d.lastName || ''}`.trim() ||
          d.name ||
          d.Name ||
          'Family Member'
        );

        if (!candidates.some(c => c.id === d.id || c.name.toLowerCase() === candidateName.toLowerCase())) {
          candidates.push({
            id: d.id,
            name: candidateName,
            relation: d.relation || d.Relation || (d.isKidMember ? 'Child' : 'Family Member'),
            phone: d.phone || d.Phone || d.mobile || selfCandidate.phone,
            dob: d.dob || d.birthdate || d.dateOfBirth || '',
            gender: (d.gender === 'Female' || d.Gender === 'Female') ? 'Female' : 'Male',
            address: d.address || d.mailingStreet || d.city || selfCandidate.address,
            isSelf: false
          });
        }
      });

      // Also include any family members from prior submitted requests
      currentRequests.forEach(r => {
        if (r.memberName && !candidates.some(c => c.name.trim().toLowerCase() === r.memberName.trim().toLowerCase())) {
          candidates.push({
            id: r.memberId || r.id,
            name: r.memberName,
            relation: 'Family Member',
            phone: r.memberPhone || selfCandidate.phone,
            dob: r.dob || '',
            gender: (r.gender === 'Female' ? 'Female' : 'Male'),
            address: r.address || selfCandidate.address,
            isSelf: false
          });
        }
      });
    } catch (e) {
      console.warn('Error fetching family candidates:', e);
    }

    setFamilyMembers(candidates);

    // Initial candidate selection if not set
    if (!selectedCandidate && candidates.length > 0) {
      const initial = candidates[0];
      setSelectedCandidate(initial);
      setMemberName(initial.name);
      setMemberPhone(initial.phone || '');
      setDob(initial.dob || '');
      setGender(initial.gender || 'Male');
      setAddress(initial.address || '');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const reqList = await fetchMyRequests();
      await fetchFamilyMembers(reqList);
      setLoading(false);
    };
    init();
  }, [activeChurch?.id, user?.uid]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const reqList = await fetchMyRequests(true);
    await fetchFamilyMembers(reqList);
    setRefreshing(false);
  };

  // Switch selected family candidate
  const handleSelectCandidate = (candidate: FamilyCandidate) => {
    setIsOtherSelected(false);
    setSelectedCandidate(candidate);
    setMemberName(candidate.name);
    setMemberPhone(candidate.phone || authMember?.phone || user?.phoneNumber || '');
    setDob(candidate.dob || '');
    setGender(candidate.gender || 'Male');
    setAddress(candidate.address || authMember?.mailingStreet || authMember?.city || authMember?.village || '');
    setReason('');
    setPreferredDate('');
    setAdditionalNotes('');
  };

  // Select "Other Member / Kid" to enter custom name
  const handleSelectOther = () => {
    setIsOtherSelected(true);
    setSelectedCandidate(null);
    setMemberName('');
    setMemberPhone(authMember?.phone || user?.phoneNumber || '');
    setDob('');
    setAge('');
    setGender('Male');
    setAddress(authMember?.mailingStreet || authMember?.city || authMember?.village || '');
    setReason('');
    setPreferredDate('');
    setAdditionalNotes('');
  };

  // Find if a candidate has an existing baptism request
  const getCandidateRequest = (candidate: FamilyCandidate | null): BaptismRequest | undefined => {
    if (!candidate || isOtherSelected) return undefined;
    const cleanCandName = candidate.name.trim().toLowerCase();
    return requests.find(r => {
      const reqName = (r.memberName || '').trim().toLowerCase();
      const matchName = reqName === cleanCandName;
      const matchId = candidate.id && r.memberId === candidate.id;
      return matchName || matchId;
    });
  };

  const currentCandidateRequest = getCandidateRequest(selectedCandidate);

  const handleSubmitRequest = async () => {
    if (!memberName.trim()) {
      setAlertConfig({
        visible: true,
        title: 'Candidate Name Required',
        message: 'Please enter or select the member name for baptism.',
        type: 'warning'
      });
      return;
    }

    // Check if this specific candidate already has a request
    if (currentCandidateRequest) {
      setAlertConfig({
        visible: true,
        title: 'Request Already Submitted',
        message: `A baptism request for ${memberName} has already been submitted and is on file.`,
        type: 'info'
      });
      return;
    }

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
      const targetMemberId = (!isOtherSelected && selectedCandidate?.id)
        ? selectedCandidate.id
        : (authMember?.id || user?.uid || 'family_member');

      const res = await FirestoreService.createBaptismRequest(activeChurch.id, {
        memberId: targetMemberId,
        memberName: memberName.trim(),
        memberPhone: memberPhone || authMember?.phone || user?.phoneNumber || 'No Phone',
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
          message: `The baptism request for ${memberName} has been submitted to the pastoral leadership. You will be notified once reviewed.`,
          type: 'success',
          onConfirm: async () => {
            setReason('');
            setAdditionalNotes('');
            const updated = await fetchMyRequests();
            await fetchFamilyMembers(updated);
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
          icon: CheckCircle2,
          desc: 'Congratulations! This baptism request has been approved. Please review the confirmed schedule below.'
        };
      case 'completed':
        return {
          bg: '#EEF2FF',
          border: '#C7D2FE',
          text: '#4338CA',
          label: 'Completed',
          icon: Award,
          desc: 'Praise the Lord! This baptism is completed. May God richly bless their Christian walk!'
        };
      case 'under_review':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          text: '#1D4ED8',
          label: 'Under Review',
          icon: AlertCircle,
          desc: 'This baptism request is currently being reviewed by the pastoral leadership team.'
        };
      case 'rejected':
        return {
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#B91C1C',
          label: 'Declined',
          icon: XCircle,
          desc: 'This baptism request has been declined. Please review any pastoral remarks below or consult church leadership.'
        };
      case 'pending':
      default:
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          label: 'Pending',
          icon: Clock,
          desc: 'This baptism request has been received and is waiting for pastoral review.'
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C5C" />

      {/* Header - Simple and clean */}
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
              <Text style={styles.headerTitle}>Baptism</Text>
            </View>
            <Text style={styles.headerSub}>Request & Status</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content - Single Section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0F4C5C" />
            <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Loading baptism details...</Text>
          </View>
        ) : (
          <View>
            {/* Intro Card */}
            <View style={styles.formIntroCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Droplets size={22} color="#0F4C5C" style={{ marginRight: 8 }} />
                <Text style={styles.formIntroTitle}>Baptism Application</Text>
              </View>
              <Text style={styles.formIntroText}>
                Baptism is an essential biblical step of faith and obedience, identifying with Christ's death, burial, and resurrection (Romans 6:4).
              </Text>
            </View>

            {/* Candidate / Family Member Selector */}
            <View style={styles.candidateSelectorContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Users size={15} color="#0F4C5C" style={{ marginRight: 6 }} />
                  <Text style={styles.candidateSectionLabel}>SELECT CANDIDATE / FAMILY MEMBER</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.candidateChipsScroll}
              >
                {familyMembers.map((cand) => {
                  const req = getCandidateRequest(cand);
                  const isSelected = !isOtherSelected && selectedCandidate?.id === cand.id;
                  const statusBadge = req ? getStatusBadge(req.status) : null;

                  return (
                    <TouchableOpacity
                      key={cand.id}
                      activeOpacity={0.7}
                      style={[styles.candidateChip, isSelected && styles.candidateChipActive]}
                      onPress={() => handleSelectCandidate(cand)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <User size={14} color={isSelected ? '#0F4C5C' : '#64748B'} style={{ marginRight: 6 }} />
                        <Text
                          style={[styles.candidateChipName, isSelected && styles.candidateChipNameActive]}
                          numberOfLines={1}
                        >
                          {cand.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={[styles.candidateChipRelation, isSelected && styles.candidateChipRelationActive]}>
                          {cand.relation || (cand.isSelf ? 'Self' : 'Family')}
                        </Text>
                        {req && statusBadge && (
                          <View style={[styles.chipMiniBadge, { backgroundColor: statusBadge.bg, borderColor: statusBadge.border }]}>
                            <Text style={[styles.chipMiniBadgeTxt, { color: statusBadge.text }]}>
                              {statusBadge.label}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Option to submit for another family member or child */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.candidateChip, styles.candidateChipOther, isOtherSelected && styles.candidateChipActive]}
                  onPress={handleSelectOther}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Plus size={14} color={isOtherSelected ? '#0F4C5C' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.candidateChipName, isOtherSelected && styles.candidateChipNameActive]}>
                      Other Member / Kid
                    </Text>
                  </View>
                  <Text style={[styles.candidateChipRelation, isOtherSelected && styles.candidateChipRelationActive, { marginTop: 4 }]}>
                    Add New Candidate
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* IF THE SELECTED CANDIDATE HAS AN EXISTING REQUEST -> SHOW STATUS VIEW */}
            {currentCandidateRequest ? (
              <View>
                <View style={styles.requestCard}>
                  {(() => {
                    const badge = getStatusBadge(currentCandidateRequest.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <>
                        {/* Candidate Hero Card Header */}
                        <View style={styles.candidateHeaderCard}>
                          <View style={styles.candidateAvatar}>
                            <Text style={styles.candidateAvatarTxt}>
                              {(currentCandidateRequest.memberName || 'C')[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.candidateNameTxt} numberOfLines={1}>
                              {currentCandidateRequest.memberName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                              <View style={styles.relationBadge}>
                                <Text style={styles.relationBadgeTxt}>
                                  {selectedCandidate?.relation || (selectedCandidate?.isSelf ? 'Self' : 'Family')}
                                </Text>
                              </View>
                              {currentCandidateRequest.memberPhone ? (
                                <Text style={styles.candidatePhoneTxt}>
                                  • {currentCandidateRequest.memberPhone}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                            <BadgeIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                            <Text style={[styles.statusBadgeTxt, { color: badge.text }]}>{badge.label}</Text>
                          </View>
                        </View>

                        {/* Submission Date Header */}
                        <View style={styles.submissionDateBar}>
                          <Clock size={12} color="#64748B" style={{ marginRight: 5 }} />
                          <Text style={styles.submissionDateTxt}>
                            Request Submitted: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{formatDateTimeDisplay(currentCandidateRequest.createdAt)}</Text>
                          </Text>
                        </View>

                        {/* Status Description Banner */}
                        <View style={[styles.statusBanner, { backgroundColor: badge.bg, borderColor: badge.border, borderLeftColor: badge.text }]}>
                          <BadgeIcon size={18} color={badge.text} style={{ marginRight: 10, marginTop: 1 }} />
                          <Text style={[styles.statusBannerTxt, { color: badge.text }]}>
                            {badge.desc}
                          </Text>
                        </View>
                      </>
                    );
                  })()}

                  {/* Confirmed Schedule Banner (If Approved or Completed) */}
                  {(currentCandidateRequest.status === 'approved' || currentCandidateRequest.status === 'completed') &&
                    (currentCandidateRequest.confirmedDate || currentCandidateRequest.confirmedLocation) && (
                      <View style={styles.confirmedScheduleBox}>
                        <View style={styles.confirmedHeaderRow}>
                          <Sparkles size={16} color="#047857" style={{ marginRight: 6 }} />
                          <Text style={styles.confirmedTitle}>CONFIRMED BAPTISM SCHEDULE</Text>
                        </View>
                        <View style={styles.scheduleGrid}>
                          <View style={styles.scheduleItem}>
                            <View style={styles.scheduleIconWrap}>
                              <Calendar size={15} color="#065F46" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.scheduleItemLabel}>BAPTISM DATE</Text>
                              <Text style={styles.scheduleItemVal}>
                                {formatDateDisplay(currentCandidateRequest.confirmedDate)}
                              </Text>
                            </View>
                          </View>

                          {currentCandidateRequest.confirmedTime ? (
                            <View style={styles.scheduleItem}>
                              <View style={styles.scheduleIconWrap}>
                                <Clock size={15} color="#065F46" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.scheduleItemLabel}>TIME</Text>
                                <Text style={styles.scheduleItemVal}>
                                  {currentCandidateRequest.confirmedTime}
                                </Text>
                              </View>
                            </View>
                          ) : null}

                          {currentCandidateRequest.confirmedLocation ? (
                            <View style={[styles.scheduleItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                              <View style={styles.scheduleIconWrap}>
                                <MapPin size={15} color="#065F46" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.scheduleItemLabel}>VENUE</Text>
                                <Text style={styles.scheduleItemVal}>
                                  {currentCandidateRequest.confirmedLocation}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                  {/* Admin Remarks Notice */}
                  {currentCandidateRequest.adminRemarks ? (
                    <View style={styles.adminRemarkBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Info size={14} color="#1E40AF" style={{ marginRight: 6 }} />
                        <Text style={styles.adminRemarkTitle}>Pastoral Remarks / Guidance:</Text>
                      </View>
                      <Text style={styles.adminRemarkTxt}>{currentCandidateRequest.adminRemarks}</Text>
                    </View>
                  ) : null}

                  {/* Summary Metric Tiles */}
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Calendar size={12} color="#64748B" style={{ marginRight: 5 }} />
                        <Text style={styles.metricLabel}>PREFERRED DATE</Text>
                      </View>
                      <Text style={styles.metricVal}>
                        {formatDateDisplay(currentCandidateRequest.preferredDate) || 'Flexible'}
                      </Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Droplets size={12} color="#64748B" style={{ marginRight: 5 }} />
                        <Text style={styles.metricLabel}>PREVIOUS BAPTISM</Text>
                      </View>
                      <Text style={styles.metricVal}>
                        {currentCandidateRequest.previousBaptism ? 'Yes (Earlier)' : 'No (First Time)'}
                      </Text>
                    </View>
                  </View>

                  {/* Reason for Baptism */}
                  {currentCandidateRequest.reason ? (
                    <View style={styles.reasonCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MessageSquare size={13} color="#0F4C5C" style={{ marginRight: 6 }} />
                        <Text style={styles.reasonCardTitle}>REASON FOR BAPTISM</Text>
                      </View>
                      <Text style={styles.reasonCardText}>"{currentCandidateRequest.reason}"</Text>
                    </View>
                  ) : null}

                  {currentCandidateRequest.additionalNotes ? (
                    <View style={[styles.reasonCard, { marginTop: 8 }]}>
                      <Text style={styles.reasonCardTitle}>ADDITIONAL NOTES</Text>
                      <Text style={styles.reasonCardText}>{currentCandidateRequest.additionalNotes}</Text>
                    </View>
                  ) : null}

                  {/* Candidate Information Details Card */}
                  <View style={styles.candidateDetailsCard}>
                    <Text style={styles.cardSectionTitle}>CANDIDATE DETAILS</Text>

                    <View style={styles.detailRow}>
                      <User size={14} color="#64748B" style={styles.detailRowIcon} />
                      <Text style={styles.detailRowLabel}>Name:</Text>
                      <Text style={styles.detailRowVal}>{currentCandidateRequest.memberName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Phone size={14} color="#64748B" style={styles.detailRowIcon} />
                      <Text style={styles.detailRowLabel}>Phone:</Text>
                      <Text style={styles.detailRowVal}>{currentCandidateRequest.memberPhone}</Text>
                    </View>

                    {currentCandidateRequest.gender ? (
                      <View style={styles.detailRow}>
                        <User size={14} color="#64748B" style={styles.detailRowIcon} />
                        <Text style={styles.detailRowLabel}>Gender:</Text>
                        <Text style={styles.detailRowVal}>{currentCandidateRequest.gender}</Text>
                      </View>
                    ) : null}

                    {currentCandidateRequest.age ? (
                      <View style={styles.detailRow}>
                        <User size={14} color="#64748B" style={styles.detailRowIcon} />
                        <Text style={styles.detailRowLabel}>Age:</Text>
                        <Text style={styles.detailRowVal}>{currentCandidateRequest.age} yrs</Text>
                      </View>
                    ) : null}

                    {currentCandidateRequest.dob ? (
                      <View style={styles.detailRow}>
                        <Calendar size={14} color="#64748B" style={styles.detailRowIcon} />
                        <Text style={styles.detailRowLabel}>DOB:</Text>
                        <Text style={styles.detailRowVal}>{formatDateDisplay(currentCandidateRequest.dob)}</Text>
                      </View>
                    ) : null}

                    {currentCandidateRequest.address ? (
                      <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                        <MapPin size={14} color="#64748B" style={styles.detailRowIcon} />
                        <Text style={styles.detailRowLabel}>Address:</Text>
                        <Text style={[styles.detailRowVal, { flex: 1 }]}>{currentCandidateRequest.address}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Status History Timeline */}
                  {currentCandidateRequest.history && currentCandidateRequest.history.length > 0 && (
                    <View style={styles.timelineContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <History size={15} color="#0F4C5C" style={{ marginRight: 6 }} />
                        <Text style={styles.timelineHeaderTitle}>STATUS HISTORY</Text>
                      </View>

                      <View style={styles.timelineList}>
                        {currentCandidateRequest.history.map((h, hIdx) => {
                          const isLast = hIdx === (currentCandidateRequest.history?.length || 0) - 1;
                          const hBadge = getStatusBadge(h.status || 'pending');
                          const HIcon = hBadge.icon;

                          return (
                            <View key={hIdx} style={styles.timelineRow}>
                              {/* Left track: Icon node + connecting line */}
                              <View style={styles.timelineTrack}>
                                <View style={[styles.timelineNode, { backgroundColor: hBadge.bg, borderColor: hBadge.border }]}>
                                  <HIcon size={12} color={hBadge.text} />
                                </View>
                                {!isLast && <View style={styles.timelineConnector} />}
                              </View>

                              {/* Right body: Badge, note, timestamp */}
                              <View style={[styles.timelineBody, isLast && { paddingBottom: 4 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <View style={[styles.timelineBadge, { backgroundColor: hBadge.bg, borderColor: hBadge.border }]}>
                                    <Text style={[styles.timelineBadgeTxt, { color: hBadge.text }]}>
                                      {h.status?.toUpperCase().replace('_', ' ')}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.timelineNoteTxt}>
                                  {formatDatesInText(h.note || 'Status updated')}
                                </Text>
                                <View style={styles.timelineDateRow}>
                                  <Clock size={11} color="#94A3B8" style={{ marginRight: 4 }} />
                                  <Text style={styles.timelineDateTxt}>
                                    {formatDateTimeDisplay(h.timestamp)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* Pastoral Help note */}
                <View style={styles.helpCard}>
                  <Info size={16} color="#0F4C5C" style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.helpCardText}>
                    To update schedule or ask questions about this baptism request, please reach out to the church pastoral office.
                  </Text>
                </View>
              </View>
            ) : (
              /* IF CANDIDATE HAS NOT SUBMITTED -> SHOW APPLICATION FORM */
              <View>
                <Text style={styles.sectionHeader}>
                  {isOtherSelected ? 'APPLY FOR FAMILY MEMBER / KID' : `APPLY FOR ${memberName.toUpperCase() || 'BAPTISM'}`}
                </Text>

                {/* Member Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Member / Candidate Name *</Text>
                  <View style={styles.inputBox}>
                    <User size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.inputText}
                      value={memberName}
                      onChangeText={setMemberName}
                      placeholder="Enter Candidate Full Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contact Phone Number</Text>
                  <View style={styles.inputBox}>
                    <Phone size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.inputText}
                      value={memberPhone}
                      onChangeText={setMemberPhone}
                      keyboardType="phone-pad"
                      placeholder="Contact Mobile Number"
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
                    placeholder="Tell us about faith in Jesus Christ and why baptism is desired..."
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
              </View>
            )}
          </View>
        )}
      </ScrollView>

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
    alignItems: 'center'
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
    marginLeft: 2,
    marginTop: 4
  },
  candidateSelectorContainer: {
    marginBottom: 16
  },
  candidateSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: 0.6
  },
  candidateChipsScroll: {
    paddingVertical: 4
  },
  candidateChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  candidateChipActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#F0FDFA'
  },
  candidateChipOther: {
    borderStyle: 'dashed'
  },
  candidateChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  candidateChipNameActive: {
    color: '#0F4C5C',
    fontWeight: '800'
  },
  candidateChipRelation: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  candidateChipRelationActive: {
    color: '#0F4C5C'
  },
  chipMiniBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.8
  },
  chipMiniBadgeTxt: {
    fontSize: 9,
    fontWeight: '800'
  },
  // Request Card Styles
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  candidateHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F4C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  candidateAvatarTxt: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  candidateNameTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  relationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6
  },
  relationBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  candidatePhoneTxt: {
    fontSize: 12,
    color: '#64748B'
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
  submissionDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  submissionDateTxt: {
    fontSize: 11,
    color: '#64748B'
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 14
  },
  statusBannerTxt: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18
  },
  confirmedScheduleBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 14
  },
  confirmedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  confirmedTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6
  },
  scheduleGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4'
  },
  scheduleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  scheduleItemLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.4
  },
  scheduleItemVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 1
  },
  adminRemarkBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14
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
    lineHeight: 18,
    marginTop: 2
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  reasonCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  reasonCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: 0.5
  },
  reasonCardText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 2
  },
  candidateDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  cardSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  detailRowIcon: {
    marginRight: 8
  },
  detailRowLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 80,
    fontWeight: '500'
  },
  detailRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1
  },
  timelineContainer: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  timelineHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: 0.6
  },
  timelineList: {
    paddingLeft: 2
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  timelineTrack: {
    alignItems: 'center',
    width: 24,
    marginRight: 10
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 3
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 16
  },
  timelineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  timelineBadgeTxt: {
    fontSize: 10,
    fontWeight: '800'
  },
  timelineNoteTxt: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
    marginTop: 2
  },
  timelineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  timelineDateTxt: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500'
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  helpCardText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17
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
