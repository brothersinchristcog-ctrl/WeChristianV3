import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { X, UserPlus, MapPin, Shield, Calendar, Clock, Users, CheckCircle2, ChevronDown, User, Sparkles, Check, AlertCircle, Building2, Trash2, AlertTriangle } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FirestoreService from '../../../../services/FirestoreService';
import CareCellService, { isMemberInLocation } from '../../../../services/CareCellService';
import { useAuth } from '../../../../context/AuthContext';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';
import MemberLookupModal from './MemberLookupModal';
import { CareCell, CareCellStatus } from '../../../../types/CareCellTypes';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STATUS_OPTIONS: CareCellStatus[] = ['Active', 'Inactive', 'Archived'];

interface CareCellFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  cellToEdit?: CareCell | null;
}

export default function CareCellFormModal({
  visible,
  onClose,
  onSaved,
  cellToEdit,
}: CareCellFormModalProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const isEditing = !!cellToEdit;

  // Form Fields
  const [name, setName] = useState('');
  const [cellCode, setCellCode] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  
  // Leader info
  const [leaderId, setLeaderId] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderPhoto, setLeaderPhoto] = useState<string | undefined>(undefined);

  // Assistant Leader info (Optional)
  const [assistantLeaderId, setAssistantLeaderId] = useState<string | undefined>(undefined);
  const [assistantLeaderName, setAssistantLeaderName] = useState<string | undefined>(undefined);
  const [assistantLeaderPhone, setAssistantLeaderPhone] = useState<string | undefined>(undefined);
  const [assistantLeaderPhoto, setAssistantLeaderPhoto] = useState<string | undefined>(undefined);

  const [meetingDay, setMeetingDay] = useState('Friday');
  const [meetingTime, setMeetingTime] = useState('19:00');
  const [meetingEndTime, setMeetingEndTime] = useState('20:30');
  const [activeTimePickerTarget, setActiveTimePickerTarget] = useState<'start' | 'end'>('start');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [maximumMembers, setMaximumMembers] = useState('20');
  const [status, setStatus] = useState<CareCellStatus>('Active');

  const [saving, setSaving] = useState(false);
  const { isPlatformSuperAdmin } = useAuth();
  const [assignedAdminIds, setAssignedAdminIds] = useState<string[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<any[]>([]);

  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Success Card Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCellSummary, setSavedCellSummary] = useState<{
    name: string;
    code: string;
    leaderName: string;
    leaderPhone: string;
    meetingDay: string;
    meetingTime: string;
    meetingEndTime?: string;
    meetingLocation: string;
    assignedCount: number;
    isEditing: boolean;
  } | null>(null);

  // Delete confirmation and success state in modal
  const [showDeleteConfirmInModal, setShowDeleteConfirmInModal] = useState(false);
  const [showDeleteSuccessInModal, setShowDeleteSuccessInModal] = useState(false);
  const [deletedSummaryInModal, setDeletedSummaryInModal] = useState<{
    name: string;
    code: string;
    leaderName?: string;
    location?: string;
  } | null>(null);

  const handleDelete = () => {
    if (!cellToEdit) return;
    setShowDeleteConfirmInModal(true);
  };

  const confirmDeleteInModal = async () => {
    if (!cellToEdit) return;
    try {
      setSaving(true);
      const churchId = await CareCellService.getChurchId();
      await CareCellService.deleteCareCell(churchId, cellToEdit.id);
      setDeletedSummaryInModal({
        name: cellToEdit.name,
        code: cellToEdit.cellCode,
        leaderName: cellToEdit.leaderName,
        location: cellToEdit.location || cellToEdit.meetingLocation,
      });
      setShowDeleteConfirmInModal(false);
      setShowDeleteSuccessInModal(true);
    } catch (err: any) {
      console.error('Error deleting Care Cell:', err);
      Alert.alert('Error', err.message || 'Failed to delete Care Cell.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSuccessDoneInModal = () => {
    setShowDeleteSuccessInModal(false);
    setDeletedSummaryInModal(null);
    onSaved();
    onClose();
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    setSavedCellSummary(null);
    onSaved();
    onClose();
  };

  // Church members pool for location matching
  const [allChurchMembers, setAllChurchMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Selected members to assign to this Care Cell
  const [selectedMembersMap, setSelectedMembersMap] = useState<Map<string, any>>(new Map());

  // Sub-modal for multiple members lookup
  const [membersLookupVisible, setMembersLookupVisible] = useState(false);

  // Member Lookup Sub-Modals
  const [leaderLookupVisible, setLeaderLookupVisible] = useState(false);
  const [asstLookupVisible, setAsstLookupVisible] = useState(false);

  // Format 24h string into 12h AM/PM
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return 'Select Time';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${period}`;
  };

  const getTimeDate = (timeStr: string) => {
    const d = new Date();
    if (!timeStr) return d;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h)) d.setHours(h);
      if (!isNaN(m)) d.setMinutes(m);
    }
    return d;
  };

  // Initialize or reset form
  useEffect(() => {
    if (!visible) return;

    if (cellToEdit) {
      setName(cellToEdit.name || '');
      setCellCode(cellToEdit.cellCode || '');
      setDescription(cellToEdit.description || '');
      setLocation(cellToEdit.location || '');
      setLeaderId(cellToEdit.leaderId || '');
      setLeaderName(cellToEdit.leaderName || '');
      setLeaderPhone(cellToEdit.leaderPhone || '');
      setLeaderPhoto(cellToEdit.leaderPhoto);
      setAssistantLeaderId(cellToEdit.assistantLeaderId);
      setAssistantLeaderName(cellToEdit.assistantLeaderName);
      setAssistantLeaderPhone(cellToEdit.assistantLeaderPhone);
      setAssistantLeaderPhoto(cellToEdit.assistantLeaderPhoto);
      setMeetingDay(cellToEdit.meetingDay || 'Friday');
      setMeetingTime(cellToEdit.meetingTime || '19:00');
      setMeetingEndTime(cellToEdit.meetingEndTime || '');
      setMeetingLocation(cellToEdit.meetingLocation || '');
      setMaximumMembers(String(cellToEdit.maximumMembers || 20));
      setStatus(cellToEdit.status || 'Active');
      setAssignedAdminIds(cellToEdit.assignedAdminIds || []);
    } else {
      // Auto-generate next code
      setName('');
      setDescription('');
      setLocation('');
      setLeaderId('');
      setLeaderName('');
      setLeaderPhone('');
      setLeaderPhoto(undefined);
      setAssistantLeaderId(undefined);
      setAssistantLeaderName(undefined);
      setAssistantLeaderPhone(undefined);
      setAssistantLeaderPhoto(undefined);
      setMeetingDay('Friday');
      setMeetingTime('19:00');
      setMeetingEndTime('20:30');
      setMeetingLocation('');
      setMaximumMembers('20');
      setStatus('Active');

      CareCellService.getNextCareCellCode().then((code) => {
        setCellCode(code);
      });
    }

    // Load existing church members for location matching
    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const raw = await FirestoreService.getAllMembers();
        const mapped = raw.map((m: any) => ({
          id: m.id,
          name: m.name || m.firstName || 'Member',
          phone: m.phone || m.phoneNumber || m.referencePhone || '',
          photoUrl: m.photoUrl || m.profilePicture || m.profilePhoto || '',
          userType: m.userType || 'Member',
          address: m.address || m.street || m.mailingStreet || '',
          locality: m.locality || m.area || m.village || m.city || m.mailingCity || '',
          city: m.city || m.mailingCity || '',
          village: m.village || '',
          mandal: m.mandal || '',
          district: m.district || '',
          state: m.state || '',
          mailingStreet: m.mailingStreet || '',
          mailingCity: m.mailingCity || '',
          latitude: typeof m.latitude === 'number' ? m.latitude : (m.lat ? Number(m.lat) : undefined),
          longitude: typeof m.longitude === 'number' ? m.longitude : (m.lng ? Number(m.lng) : undefined),
        }));
        setAllChurchMembers(mapped);
      } catch (e) {
        console.error('Error loading church members for care cell creation:', e);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
    if (visible) {
      CareCellService.getChurchAdmins().then(setChurchAdmins).catch(() => {});
    }
  }, [visible, cellToEdit]);

  // Compute members whose residential location matches the care cell location
  const locationMatchedMembers = useMemo(() => {
    if (!location || !location.trim() || location.trim().length < 2) {
      return [];
    }
    return allChurchMembers.filter((m) => {
      if (m.id === leaderId || m.id === assistantLeaderId) return false;
      return isMemberInLocation(m, location);
    });
  }, [allChurchMembers, location, leaderId, assistantLeaderId]);

  // When location changes and matches members, auto-select them
  const prevLocationRef = useRef<string>('');
  useEffect(() => {
    const loc = location.trim().toLowerCase();
    if (loc && loc !== prevLocationRef.current) {
      prevLocationRef.current = loc;
      const newMap = new Map<string, any>();
      locationMatchedMembers.forEach((m) => {
        newMap.set(m.id, m);
      });
      setSelectedMembersMap(newMap);
    }
  }, [location, locationMatchedMembers]);

  const toggleMemberSelection = (mem: any) => {
    setSelectedMembersMap((prev) => {
      const next = new Map(prev);
      if (next.has(mem.id)) {
        next.delete(mem.id);
      } else {
        next.set(mem.id, mem);
      }
      return next;
    });
  };

  const handleSelectAllMatched = () => {
    setSelectedMembersMap((prev) => {
      const next = new Map(prev);
      locationMatchedMembers.forEach((m) => {
        next.set(m.id, m);
      });
      return next;
    });
  };

  const handleDeselectAllMatched = () => {
    setSelectedMembersMap(new Map());
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a Care Cell Name.');
      return;
    }
    if (!cellCode.trim()) {
      Alert.alert('Required Field', 'Please enter or generate a Care Cell Code.');
      return;
    }
    if (!leaderId) {
      Alert.alert('Required Field', 'Please assign a Cell Leader from existing church members.');
      return;
    }
    if (!meetingDay.trim()) {
      Alert.alert('Required Field', 'Please select a Meeting Day.');
      return;
    }

    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const payload: any = {
        name: name.trim(),
        cellCode: cellCode.trim(),
        description: description.trim(),
        location: location.trim(),
        leaderId,
        leaderName,
        leaderPhone: leaderPhone || '',
        meetingDay,
        meetingTime: meetingTime.trim(),
        meetingEndTime: meetingEndTime ? meetingEndTime.trim() : '',
        meetingLocation: meetingLocation.trim(),
        maximumMembers: parseInt(maximumMembers, 10) || 20,
        status,
        churchId,
        assignedAdminIds: assignedAdminIds || [],
      };

      if (leaderPhoto) payload.leaderPhoto = leaderPhoto;
      if (assistantLeaderId) {
        payload.assistantLeaderId = assistantLeaderId;
        payload.assistantLeaderName = assistantLeaderName || '';
        payload.assistantLeaderPhone = assistantLeaderPhone || '';
        if (assistantLeaderPhoto) payload.assistantLeaderPhoto = assistantLeaderPhoto;
      }

      let savedCellId = '';
      if (isEditing && cellToEdit) {
        await CareCellService.updateCareCell(churchId, cellToEdit.id, payload);
        savedCellId = cellToEdit.id;
      } else {
        savedCellId = await CareCellService.createCareCell(churchId, payload);
      }

      // Automatically assign selected location-based members
      const assignedList = Array.from(selectedMembersMap.values());
      if (assignedList.length > 0 && savedCellId) {
        await CareCellService.assignMembersToCell(
          churchId,
          savedCellId,
          { cellCode: cellCode.trim(), cellName: name.trim() },
          assignedList,
          'Admin',
          true
        );
      }

      setSavedCellSummary({
        name: name.trim(),
        code: cellCode.trim(),
        leaderName,
        leaderPhone: leaderPhone || '',
        meetingDay,
        meetingTime: meetingTime.trim(),
        meetingEndTime: meetingEndTime ? meetingEndTime.trim() : '',
        meetingLocation: meetingLocation.trim() || location.trim(),
        assignedCount: assignedList.length,
        isEditing,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error saving Care Cell:', err);
      Alert.alert('Error', err.message || 'Failed to save Care Cell. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            style={styles.keyboardWrap}
          >
            <View style={styles.sheetContainer}>
              {/* Sheet Header */}
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>{isEditing ? 'Edit Care Cell' : 'Create Care Cell'}</Text>
                  <Text style={styles.headerSubtitle}>
                    {isEditing ? 'Modify fellowship group parameters' : 'Establish a new Care Cell fellowship group'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color="#1E293B" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Form */}
              <ScrollView
                style={styles.scrollFlex}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={true}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                bounces={true}
              >
              {/* Care Cell Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Care Cell Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Grace Fellowship / Hitech City Cell"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Care Cell Code */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Care Cell Code *</Text>
                  {!isEditing && (
                    <TouchableOpacity
                      onPress={async () => {
                        const next = await CareCellService.getNextCareCellCode();
                        setCellCode(next);
                      }}
                      style={styles.autoCodeBtn}
                    >
                      <Sparkles size={11} color="#1A2D5A" style={{ marginRight: 3 }} />
                      <Text style={styles.autoCodeBtnTxt}>Auto Generate</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.textInput, styles.codeField]}
                  placeholder="CareCell-001"
                  placeholderTextColor="#94A3B8"
                  value={cellCode}
                  onChangeText={setCellCode}
                  autoCapitalize="none"
                />
                <Text style={styles.helperText}>Standard format: CareCell-001, CareCell-002</Text>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Focus of this cell (e.g. Young Adults, Family Bible Study, Neighborhood Care)"
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* General Location / Area */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location / Area</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Madhapur, Kondapur, Jubilee Hills"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Cell Leader Selection (CRITICAL) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Cell Leader (Existing Church Member) *</Text>
                {leaderId ? (
                  <View style={styles.selectedLeaderCard}>
                    {leaderPhoto ? (
                      <Image source={{ uri: leaderPhoto }} style={styles.leaderAvatar} />
                    ) : (
                      <View style={styles.leaderAvatarFallback}>
                        <User size={18} color="#1A2D5A" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaderNameTxt}>{leaderName}</Text>
                      {leaderPhone ? <Text style={styles.leaderPhoneTxt}>{leaderPhone}</Text> : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => setLeaderLookupVisible(true)}
                      style={styles.changeLeaderBtn}
                    >
                      <Text style={styles.changeLeaderBtnTxt}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.lookupTriggerBtn}
                    onPress={() => setLeaderLookupVisible(true)}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={18} color="#1A2D5A" style={{ marginRight: 8 }} />
                    <Text style={styles.lookupTriggerBtnTxt}>Select Cell Leader from Members</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Assistant Leader Selection (Optional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Assistant Leader (Optional)</Text>
                {assistantLeaderId ? (
                  <View style={styles.selectedLeaderCard}>
                    {assistantLeaderPhoto ? (
                      <Image source={{ uri: assistantLeaderPhoto }} style={styles.leaderAvatar} />
                    ) : (
                      <View style={styles.leaderAvatarFallback}>
                        <User size={18} color="#1A2D5A" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaderNameTxt}>{assistantLeaderName}</Text>
                      {assistantLeaderPhone ? <Text style={styles.leaderPhoneTxt}>{assistantLeaderPhone}</Text> : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setAssistantLeaderId(undefined);
                        setAssistantLeaderName(undefined);
                        setAssistantLeaderPhone(undefined);
                        setAssistantLeaderPhoto(undefined);
                      }}
                      style={styles.removeAsstBtn}
                    >
                      <Text style={styles.removeAsstBtnTxt}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.lookupTriggerBtnSecondary}
                    onPress={() => setAsstLookupVisible(true)}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={styles.lookupTriggerBtnTxtSecondary}>Assign Assistant Leader</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Location-Based Assigned Members Section ── */}
              <View style={styles.assignedMembersBox}>
                <View style={styles.assignedMembersHeadRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MapPin size={15} color="#1A2D5A" style={{ marginRight: 5 }} />
                      <Text style={styles.assignedMembersTitle}>
                        Assigned Members {location.trim() ? `(${location.trim()})` : ''}
                      </Text>
                    </View>
                    <Text style={styles.assignedMembersDesc}>
                      {location.trim()
                        ? `Existing church members living within ${location.trim()} based on saved Google Maps locations.`
                        : 'Enter a Location / Area above to match members living in that locality.'}
                    </Text>
                  </View>

                  {locationMatchedMembers.length > 0 && (
                    <TouchableOpacity
                      style={styles.toggleAllBtn}
                      onPress={
                        selectedMembersMap.size === locationMatchedMembers.length
                          ? handleDeselectAllMatched
                          : handleSelectAllMatched
                      }
                    >
                      <Text style={styles.toggleAllBtnTxt}>
                        {selectedMembersMap.size === locationMatchedMembers.length ? 'Deselect' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Match Results */}
                {loadingMembers ? (
                  <View style={styles.membersLoadingRow}>
                    <ActivityIndicator size="small" color="#1A2D5A" />
                    <Text style={styles.membersLoadingTxt}>Checking church members in {location}...</Text>
                  </View>
                ) : location.trim().length >= 2 ? (
                  locationMatchedMembers.length === 0 ? (
                    <View style={styles.noMatchBox}>
                      <AlertCircle size={15} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.noMatchTxt}>
                        No members currently saved with residential address in "{location}".
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.matchedList}>
                      {locationMatchedMembers.map((mem) => {
                        const isSelected = selectedMembersMap.has(mem.id);
                        return (
                          <TouchableOpacity
                            key={mem.id}
                            style={[
                              styles.matchedMemberItem,
                              isSelected && styles.matchedMemberItemSelected,
                            ]}
                            onPress={() => toggleMemberSelection(mem)}
                            activeOpacity={0.8}
                          >
                            <View
                              style={[
                                styles.memberCheckbox,
                                isSelected && styles.memberCheckboxSelected,
                              ]}
                            >
                              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.matchedMemberName}>{mem.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                                <View style={styles.localityBadge}>
                                  <MapPin size={9} color="#1A2D5A" style={{ marginRight: 2 }} />
                                  <Text style={styles.localityBadgeTxt}>
                                    {mem.city || mem.village || mem.locality || location}
                                  </Text>
                                </View>
                                {mem.phone ? (
                                  <Text style={styles.matchedMemberPhone}>{mem.phone}</Text>
                                ) : null}
                              </View>
                              {mem.address ? (
                                <Text style={styles.matchedMemberAddr} numberOfLines={1}>
                                  {mem.address}
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )
                ) : null}

                {/* Open Full Member Lookup Modal Button */}
                <TouchableOpacity
                  style={styles.openLookupModalBtn}
                  onPress={() => setMembersLookupVisible(true)}
                  activeOpacity={0.8}
                >
                  <UserPlus size={14} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.openLookupModalBtnTxt}>
                    {location.trim()
                      ? `Browse / Filter Members in ${location.trim()} (${selectedMembersMap.size} selected)`
                      : `Select Members (${selectedMembersMap.size} selected)`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Meeting Day (Full Width Clean Selector) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meeting Day *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daySelectorScrollContainer}
                >
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = meetingDay === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dayChip,
                          isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                        ]}
                        onPress={() => setMeetingDay(d)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dayChipTxt,
                            isSelected && { color: primaryBtnText, fontWeight: '800' },
                          ]}
                        >
                          {d.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Meeting Starting Time & Ending Time (Clean 2-Column Row) */}
              <View style={styles.rowTwoCols}>
                {/* Meeting Start Time */}
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Starting Time *</Text>
                  <TouchableOpacity
                    style={styles.timePickerBtn}
                    onPress={() => {
                      setActiveTimePickerTarget('start');
                      setTimePickerVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Clock size={16} color="#1A2D5A" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timePickerTxt} numberOfLines={1}>
                        {formatTimeDisplay(meetingTime)}
                      </Text>
                      <Text style={styles.timePickerSub}>{meetingTime} (24h)</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Meeting End Time */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Ending Time</Text>
                  <TouchableOpacity
                    style={styles.timePickerBtn}
                    onPress={() => {
                      setActiveTimePickerTarget('end');
                      setTimePickerVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Clock size={16} color="#C9A84C" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timePickerTxt} numberOfLines={1}>
                        {meetingEndTime ? formatTimeDisplay(meetingEndTime) : 'Select End Time'}
                      </Text>
                      <Text style={styles.timePickerSub}>
                        {meetingEndTime ? `${meetingEndTime} (24h)` : 'Optional'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meeting Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Meeting Location / Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Leader's Home / Community Hall"
                  placeholderTextColor="#94A3B8"
                  value={meetingLocation}
                  onChangeText={setMeetingLocation}
                />
              </View>

              {/* Max Members & Status Row */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Max Members</Text>
                  <TextInput
                    style={[styles.textInput, { height: 46 }]}
                    placeholder="20"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={maximumMembers}
                    onChangeText={setMaximumMembers}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1.3 }]}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((st) => {
                      const isSelected = status === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.statusChip,
                            isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                          ]}
                          onPress={() => setStatus(st)}
                        >
                          <Text
                            style={[
                              styles.statusChipTxt,
                              isSelected && { color: primaryBtnText, fontWeight: '800' },
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: primaryBtnBg },
                  saving && styles.submitBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={primaryBtnText} />
                ) : (
                  <Text style={[styles.submitBtnTxt, { color: primaryBtnText }]}>
                    {isEditing ? 'SAVE CARE CELL CHANGES' : 'CREATE CARE CELL'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete Button (Only when editing) */}
              {isEditing && cellToEdit && (
                <TouchableOpacity
                  style={styles.deleteCellModalBtn}
                  onPress={handleDelete}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteCellModalBtnTxt}>Delete Care Cell</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Custom Delete Confirmation Modal (In Form) ── */}
      <Modal
        visible={showDeleteConfirmInModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setShowDeleteConfirmInModal(false);
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.deleteConfirmModalCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.successModalCloseBtn}
              onPress={() => setShowDeleteConfirmInModal(false)}
              disabled={saving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Warning Ring */}
            <View style={styles.deleteWarningRingOuter}>
              <View style={styles.deleteWarningRingInner}>
                <Trash2 size={26} color="#DC2626" strokeWidth={2.4} />
              </View>
            </View>

            <Text style={styles.deleteConfirmTitle}>Delete Care Cell?</Text>
            <Text style={styles.deleteConfirmSubtitle}>
              Are you sure you want to permanently delete this fellowship group?
            </Text>

            {cellToEdit && (
              <View style={styles.deleteCellPreviewBox}>
                <View style={styles.summaryHeaderRow}>
                  <Building2 size={15} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryCellName} numberOfLines={1}>
                    {cellToEdit.name}
                  </Text>
                  <View style={styles.summaryCodeBadge}>
                    <Text style={styles.summaryCodeTxt}>{cellToEdit.cellCode}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <User size={13} color="#1A2D5A" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Leader:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>
                    {cellToEdit.leaderName || 'Assigned Leader'}
                  </Text>
                </View>

                {cellToEdit.location ? (
                  <View style={styles.summaryRow}>
                    <MapPin size={13} color="#64748B" style={styles.summaryIcon} />
                    <Text style={styles.summaryLabel}>Location:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {cellToEdit.location}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.deletePermanentWarningBox}>
              <AlertTriangle size={15} color="#DC2626" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.deletePermanentWarningTxt}>
                This action is permanent. All assigned members will be unlinked.
              </Text>
            </View>

            <View style={styles.deleteActionsBtnRow}>
              <TouchableOpacity
                style={styles.deleteCancelActionBtn}
                onPress={() => setShowDeleteConfirmInModal(false)}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteCancelActionBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmActionBtn}
                onPress={confirmDeleteInModal}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteConfirmActionBtnTxt}>Delete Permanently</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Delete Success Card Modal (In Form) ── */}
      <Modal
        visible={showDeleteSuccessInModal}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteSuccessDoneInModal}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <TouchableOpacity
              style={styles.successModalCloseBtn}
              onPress={handleDeleteSuccessDoneInModal}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.successIconRingOuter}>
              <View style={styles.successIconRingInner}>
                <CheckCircle2 size={36} color="#059669" strokeWidth={2.5} />
              </View>
            </View>

            <View style={styles.successPill}>
              <Sparkles size={12} color="#059669" style={{ marginRight: 5 }} />
              <Text style={styles.successPillTxt}>CARE CELL PERMANENTLY REMOVED</Text>
            </View>

            <Text style={styles.successTitle}>Care Cell Deleted Successfully! 🗑️</Text>
            <Text style={styles.successSubtitle}>
              The fellowship group has been completely removed from the church roster and all linked members have been unlinked.
            </Text>

            {deletedSummaryInModal && (
              <View style={styles.successSummaryBox}>
                <View style={styles.summaryHeaderRow}>
                  <Building2 size={16} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryCellName} numberOfLines={1}>
                    {deletedSummaryInModal.name}
                  </Text>
                  <View style={styles.summaryCodeBadge}>
                    <Text style={styles.summaryCodeTxt}>{deletedSummaryInModal.code}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {deletedSummaryInModal.leaderName ? (
                  <View style={styles.summaryRow}>
                    <User size={13} color="#1A2D5A" style={styles.summaryIcon} />
                    <Text style={styles.summaryLabel}>Leader:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {deletedSummaryInModal.leaderName}
                    </Text>
                  </View>
                ) : null}

                {deletedSummaryInModal.location ? (
                  <View style={styles.summaryRow}>
                    <MapPin size={13} color="#64748B" style={styles.summaryIcon} />
                    <Text style={styles.summaryLabel}>Location:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {deletedSummaryInModal.location}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.summaryRow}>
                  <Users size={13} color="#059669" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Members:</Text>
                  <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '800' }]}>
                    All members safely unlinked
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={handleDeleteSuccessDoneInModal}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneBtnTxt}>Done & Return to Care Cells</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Redesigned Care Cell Creation / Update Success Card Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessDone}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.successModalCloseBtn}
              onPress={handleSuccessDone}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Concentric Success Indicator */}
            <View style={styles.successIconRingOuter}>
              <View style={styles.successIconRingInner}>
                <CheckCircle2 size={36} color="#059669" strokeWidth={2.5} />
              </View>
            </View>

            {/* Status Pill */}
            <View style={styles.successPill}>
              <Sparkles size={12} color="#059669" style={{ marginRight: 5 }} />
              <Text style={styles.successPillTxt}>
                {savedCellSummary?.isEditing ? 'CARE CELL UPDATED' : 'CARE CELL ESTABLISHED'}
              </Text>
            </View>

            {/* Main Title & Subtitle */}
            <Text style={styles.successTitle}>
              {savedCellSummary?.isEditing ? 'Care Cell Updated! 🎉' : 'Care Cell Created! 🎉'}
            </Text>
            <Text style={styles.successSubtitle}>
              {savedCellSummary?.isEditing
                ? 'Fellowship group configuration and schedule have been updated.'
                : 'Fellowship group is now active and ready for meetings and visits.'}
            </Text>

            {/* Confirmation Details Card (Material Design 3 Surface) */}
            {savedCellSummary && (
              <View style={styles.successSummaryBox}>
                {/* Cell Header Badge */}
                <View style={styles.summaryHeaderRow}>
                  <Building2 size={16} color="#1A2D5A" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryCellName} numberOfLines={1}>
                    {savedCellSummary.name}
                  </Text>
                  <View style={styles.summaryCodeBadge}>
                    <Text style={styles.summaryCodeTxt}>{savedCellSummary.code}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Leader */}
                <View style={styles.summaryRow}>
                  <User size={13} color="#1A2D5A" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Leader:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>
                    {savedCellSummary.leaderName || 'Assigned'}
                    {savedCellSummary.leaderPhone ? ` · ${savedCellSummary.leaderPhone}` : ''}
                  </Text>
                </View>

                {/* Schedule */}
                <View style={styles.summaryRow}>
                  <Calendar size={13} color="#C9A84C" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Gathering:</Text>
                  <Text style={styles.summaryVal}>
                    Every {savedCellSummary.meetingDay} at {formatTimeDisplay(savedCellSummary.meetingTime)}
                    {savedCellSummary.meetingEndTime ? ` – ${formatTimeDisplay(savedCellSummary.meetingEndTime)}` : ''}
                  </Text>
                </View>

                {/* Location */}
                {savedCellSummary.meetingLocation ? (
                  <View style={styles.summaryRow}>
                    <MapPin size={13} color="#64748B" style={styles.summaryIcon} />
                    <Text style={styles.summaryLabel}>Location:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {savedCellSummary.meetingLocation}
                    </Text>
                  </View>
                ) : null}

                {/* Assigned Members */}
                <View style={styles.summaryRow}>
                  <Users size={13} color="#059669" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Members:</Text>
                  <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '800' }]}>
                    {savedCellSummary.assignedCount > 0
                      ? `${savedCellSummary.assignedCount} member(s) linked from ${location.trim() || 'locality'}`
                      : 'No members assigned yet'}
                  </Text>
                </View>
              </View>
            )}

            {/* Done Action Button */}
            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={handleSuccessDone}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneBtnTxt}>Done & View Care Cells</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Lookup for Leader */}
      <MemberLookupModal
        visible={leaderLookupVisible}
        title="Select Cell Leader"
        mode="single"
        onClose={() => setLeaderLookupVisible(false)}
        onSelectSingle={(member) => {
          setLeaderId(member.id);
          setLeaderName(member.name);
          setLeaderPhone(member.phone || '');
          setLeaderPhoto(member.photoUrl);
        }}
      />

      {/* Member Lookup for Assistant Leader */}
      <MemberLookupModal
        visible={asstLookupVisible}
        title="Select Assistant Leader"
        mode="single"
        onClose={() => setAsstLookupVisible(false)}
        onSelectSingle={(member) => {
          setAssistantLeaderId(member.id);
          setAssistantLeaderName(member.name);
          setAssistantLeaderPhone(member.phone || '');
          setAssistantLeaderPhoto(member.photoUrl);
        }}
      />

      {/* Member Lookup for Assigning Cell Members (Filtered by Cell Location) */}
      <MemberLookupModal
        visible={membersLookupVisible}
        title={`Assign Members (${location.trim() || 'Cell'})`}
        mode="multiple"
        targetLocation={location.trim()}
        onClose={() => setMembersLookupVisible(false)}
        onConfirmMultiple={(selectedMembers) => {
          setSelectedMembersMap((prev) => {
            const next = new Map(prev);
            selectedMembers.forEach((m) => next.set(m.id, m));
            return next;
          });
          setMembersLookupVisible(false);
        }}
      />

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={timePickerVisible}
        mode="time"
        date={getTimeDate(activeTimePickerTarget === 'start' ? meetingTime : (meetingEndTime || '20:30'))}
        onConfirm={(date) => {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const formatted = `${hours}:${minutes}`;
          if (activeTimePickerTarget === 'start') {
            setMeetingTime(formatted);
          } else {
            setMeetingEndTime(formatted);
          }
          setTimePickerVisible(false);
        }}
        onCancel={() => setTimePickerVisible(false)}
      />
    </>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === 'ios' ? '90%' : '94%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollFlex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 70 : 140,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  autoCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoCodeBtnTxt: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontWeight: '500',
  },
  codeField: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0F172A',
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  lookupTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
  },
  lookupTriggerBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  lookupTriggerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  lookupTriggerBtnTxtSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedLeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  leaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  leaderAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leaderNameTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderPhoneTxt: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  changeLeaderBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  changeLeaderBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeAsstBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeAsstBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  daySelectorScrollContainer: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  daySelectorScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  dayChip: {
    minWidth: 46,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  dayChipTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  dayChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActive: {
    backgroundColor: '#1A2D5A',
  },
  statusChipTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statusChipTxtActive: {
    color: '#FFFFFF',
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 46,
  },
  timePickerTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  timePickerSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  assignedMembersBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  assignedMembersHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignedMembersTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  assignedMembersDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleAllBtn: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleAllBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  membersLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  membersLoadingTxt: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  noMatchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  noMatchTxt: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  matchedList: {
    gap: 8,
    marginBottom: 10,
  },
  matchedMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  matchedMemberItemSelected: {
    borderColor: '#1A2D5A',
    backgroundColor: '#F0F5FF',
  },
  memberCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  memberCheckboxSelected: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  matchedMemberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  localityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  localityBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  matchedMemberPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  matchedMemberAddr: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  openLookupModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  openLookupModalBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  submitBtn: {
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  deleteCellModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  deleteCellModalBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteConfirmModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  deleteWarningRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteWarningRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  deleteConfirmSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  deleteCellPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 12,
    width: '100%',
    marginBottom: 14,
  },
  deletePermanentWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
    marginBottom: 18,
  },
  deletePermanentWarningTxt: {
    flex: 1,
    fontSize: 11.5,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 16,
  },
  deleteActionsBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelActionBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  deleteConfirmActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  deleteConfirmActionBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* ── Success Card Styles (MD3 Themed) ── */
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  successModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successIconRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successIconRingInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  successPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2D5A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  successSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 14,
    width: '100%',
    marginBottom: 18,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCellName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2D5A',
    marginRight: 8,
  },
  summaryCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  summaryCodeTxt: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#1E3A8A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  summaryIcon: {
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    width: 72,
  },
  summaryVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  successDoneBtn: {
    width: '100%',
    backgroundColor: '#1A2D5A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2D5A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  successDoneBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

