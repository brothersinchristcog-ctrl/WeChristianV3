import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Share,
  Platform,
  Dimensions,
  Alert,
  StatusBar
} from 'react-native';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Share2,
  Clock,
  Music,
  Users,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  X,
  Copy,
  BookOpen,
  Mic,
  Video,
  Sparkles,
  AlertTriangle,
  Check,
  MapPin,
  RefreshCw,
  MessageCircle,
  Radio,
  Tv,
  Heart,
  Baby
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService from '../../services/FirestoreService';
import ServiceRosterService, {
  ServicePlan,
  DEFAULT_DEPARTMENTS,
  SetlistItem,
  RunSheetItem,
  ServiceDepartment,
  TimetableCategory,
  TimetableTemplateMeta
} from '../../services/ServiceRosterService';

const { width } = Dimensions.get('window');

const PRELUDE_SUGGESTIONS = [
  'Acoustic + Drum',
  'Keys',
  'Elec',
  'Acoustic',
  'Keys + Acoustic',
  'Full Band',
  'Pads',
  'Drums Only',
  'None'
];

const INTERLUDE_SUGGESTIONS = [
  'Keys + Elec (Alt)',
  'Keys/ Elec Alt',
  'Elec + Keys (Alt)',
  '(Elec + Keys)',
  'Acoustic Solo',
  'Elec Lead',
  'Full Band Dynamics',
  'None'
];

const NOTES_SUGGESTIONS = [
  "Celebrate God's power, strength, and salvation",
  "Prep for 2nd Coming",
  "God just wants our heart",
  "You washed us clean with your Blood",
  "Call to Worship & Praise",
  "Intimate Surrender & Holy Spirit",
  "Maintain purity and be Holy",
  "Giving our best to God (Offertory)"
];

export default function AdminServicePlanner({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { activeChurch } = useChurch();
  const { setActiveTab } = useContext(AdminTabContext);
  const { member } = useAuth();

  // State: Plans list & loading
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<'roster' | 'setlist' | 'runSheet' | 'export'>('roster');

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return plans.filter(p => !p.date || p.date >= today).length;
  }, [plans]);

  // State: Church Events for quick planning
  const [churchEvents, setChurchEvents] = useState<any[]>([]);

  // State: Church Members for assignment picker
  const [churchMembers, setChurchMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);
  const [assigningRoleName, setAssigningRoleName] = useState<string>('');
  const [customAssigneeName, setCustomAssigneeName] = useState('');
  const [showMemberPickerModal, setShowMemberPickerModal] = useState(false);

  // State: Create / Edit Plan Modal & Detailed Timetable
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('sunday');
  const [planFormDate, setPlanFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [planFormTitle, setPlanFormTitle] = useState('');
  const [planFormType, setPlanFormType] = useState<'sunday_service' | 'special_event' | 'conference'>('sunday_service');
  const [planFormStartTime, setPlanFormStartTime] = useState('09:00');
  const [planFormEndTime, setPlanFormEndTime] = useState('11:00');
  const [planFormLocation, setPlanFormLocation] = useState('');
  const [planFormTimetable, setPlanFormTimetable] = useState<RunSheetItem[]>([]);
  const [editingTimetableItemIndex, setEditingTimetableItemIndex] = useState<number | null>(null);
  const [showActivityEditorModal, setShowActivityEditorModal] = useState(false);
  const [activityEditorForm, setActivityEditorForm] = useState<RunSheetItem>({
    id: '',
    time: '09:00 to 09:20',
    startTime: '09:00',
    endTime: '09:20',
    durationMinutes: 20,
    program: '',
    category: 'starting_prayer',
    assignedTo: '',
    songTitle: '',
    musicians: '',
    passage: '',
    place: '',
    notes: '',
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // State: Setlist Song Modal
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [songForm, setSongForm] = useState<SetlistItem>({
    id: '',
    title: '',
    ledBy: '',
    key: 'F',
    timeSignature: '4/4',
    tempo: '100',
    verses: '',
    prelude: '',
    interlude: '',
    notes: '',
    isOffertory: false,
  });

  // Load church data
  useEffect(() => {
    loadData();
  }, [activeChurch]);

  const loadData = async () => {
    if (!activeChurch?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedPlans, members, eventsSnap] = await Promise.all([
        ServiceRosterService.getServicePlans(activeChurch.id),
        FirestoreService.getAllMembers(),
        firestore()
          .collection('churches')
          .doc(activeChurch.id)
          .collection('events')
          .orderBy('date', 'desc')
          .limit(30)
          .get()
          .catch(() => null)
      ]);
      setPlans(fetchedPlans);
      setChurchMembers(members);
      if (eventsSnap && !eventsSnap.empty) {
        const evList = eventsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setChurchEvents(evList);
      }
      if (fetchedPlans.length > 0) {
        setSelectedPlan(fetchedPlans[0]);
      } else {
        setSelectedPlan(null);
      }
    } catch (e) {
      console.error('Error loading service planner data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Open Service Timetable Modal (New or Edit)
  const openServiceTimetableModal = (planToEdit?: ServicePlan | null) => {
    if (planToEdit) {
      setSelectedPlan(planToEdit);
      setPlanFormTitle(planToEdit.serviceTitle || '');
      setPlanFormDate(planToEdit.date || new Date().toISOString().split('T')[0]);
      setPlanFormType(planToEdit.serviceType || 'sunday_service');
      setPlanFormStartTime(planToEdit.startTime || '09:00');
      setPlanFormEndTime(planToEdit.endTime || '11:00');
      setPlanFormLocation(planToEdit.location || activeChurch?.name || '');
      setPlanFormTimetable(
        planToEdit.runSheet && planToEdit.runSheet.length > 0
          ? [...planToEdit.runSheet]
          : []
      );
      const titleLower = (planToEdit.serviceTitle || '').toLowerCase();
      if (titleLower.includes('night') || titleLower.includes('vigil')) {
        setSelectedTemplateId('all_night');
      } else if (titleLower.includes('communion') || titleLower.includes('fasting')) {
        setSelectedTemplateId('communion');
      } else if (titleLower.includes('midweek') || titleLower.includes('wednesday') || titleLower.includes('study')) {
        setSelectedTemplateId('midweek');
      } else if (titleLower.includes('youth')) {
        setSelectedTemplateId('youth');
      } else if (titleLower.includes('conference') || titleLower.includes('revival')) {
        setSelectedTemplateId('conference');
      } else {
        setSelectedTemplateId('sunday');
      }
    } else {
      setSelectedPlan(null);
      setPlanFormTitle('Sunday Morning Worship Service');
      setPlanFormDate(new Date().toISOString().split('T')[0]);
      setPlanFormType('sunday_service');
      setPlanFormStartTime('09:00');
      setPlanFormEndTime('11:15');
      setPlanFormLocation(activeChurch?.name || 'Sanctuary');
      setSelectedTemplateId('sunday');
      setPlanFormTimetable(ServiceRosterService.getStandardSundayServiceSample());
    }
    setShowCreatePlanModal(true);
  };

  // Apply a pre-built timetable template
  const handleApplyTemplate = (tmpl: TimetableTemplateMeta) => {
    const doApply = () => {
      setSelectedTemplateId(tmpl.id);
      setPlanFormTimetable(tmpl.getItems());
      setPlanFormStartTime(tmpl.defaultStartTime);
      setPlanFormEndTime(tmpl.defaultEndTime);
      setPlanFormType(tmpl.serviceType);
      if (
        !planFormTitle.trim() ||
        planFormTitle.includes('Sunday') ||
        planFormTitle.includes('Service') ||
        planFormTitle.includes('Prayer') ||
        planFormTitle.includes('Bible')
      ) {
        setPlanFormTitle(tmpl.defaultTitle);
      }
    };

    if (planFormTimetable.length > 0) {
      Alert.alert(
        `Load "${tmpl.name}" Timetable?`,
        `This will load the standard ${tmpl.name} schedule (${tmpl.getItems().length} activities from ${tmpl.defaultStartTime} to ${tmpl.defaultEndTime}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Load Template', onPress: doApply }
        ]
      );
    } else {
      doApply();
    }
  };

  // Add a new activity into the timetable builder
  const handleAddActivity = (category: TimetableCategory = 'additional') => {
    let nextStart = planFormStartTime || '09:00';
    if (planFormTimetable.length > 0) {
      const last = planFormTimetable[planFormTimetable.length - 1];
      if (last.endTime) {
        nextStart = last.endTime;
      }
    }
    const defaultDurations: Record<TimetableCategory, number> = {
      starting_prayer: 10,
      opening_song: 10,
      worship_songs: 30,
      bible_reading: 10,
      sermon: 40,
      closing_prayer: 5,
      break: 15,
      communion: 20,
      offertory: 10,
      announcements: 10,
      testimony: 15,
      intercession: 25,
      additional: 15,
    };
    const dur = defaultDurations[category] || 15;
    const startMin = ServiceRosterService.parseTimeToMinutes(nextStart);
    const endMin = Math.min(1439, startMin + dur);
    const nextEnd = ServiceRosterService.minutesToTimeString(endMin);

    const defaultPrograms: Record<TimetableCategory, string> = {
      starting_prayer: 'Starting Prayer / Invocation',
      opening_song: 'Opening Praise Song',
      worship_songs: 'Praise & Worship',
      bible_reading: 'Scripture / Bible Reading',
      sermon: 'Sermon / Message',
      closing_prayer: 'Closing Prayer & Benediction',
      break: 'Tea / Fellowship Break',
      communion: 'Holy Communion (Bread & Wine)',
      offertory: 'Tithes & Thanksgiving Offertory',
      announcements: 'Welcome & Church Announcements',
      testimony: 'Praise Reports & Testimonies',
      intercession: 'Intercessory Prayer for Church & World',
      additional: 'Special Activity',
    };

    setActivityEditorForm({
      id: Math.random().toString(36).substring(7),
      time: ServiceRosterService.formatTimeRange(nextStart, nextEnd),
      startTime: nextStart,
      endTime: nextEnd,
      durationMinutes: dur,
      program: defaultPrograms[category] || 'Church Activity',
      category,
      assignedTo: '',
      songTitle: '',
      musicians: category === 'worship_songs' || category === 'opening_song' ? 'Keys, Guitars & Drums' : '',
      passage: category === 'communion' ? '1 Cor 11:23-26' : '',
      place: planFormLocation || 'Sanctuary',
      notes: '',
    });
    setEditingTimetableItemIndex(null);
    setShowActivityEditorModal(true);
  };

  // Edit an existing activity in the timetable builder
  const handleEditActivity = (index: number) => {
    const item = planFormTimetable[index];
    if (!item) return;
    setActivityEditorForm({
      ...item,
      startTime: item.startTime || (item.time ? item.time.split(/to|-/i)[0]?.trim() : '09:00'),
      endTime: item.endTime || (item.time ? item.time.split(/to|-/i)[1]?.trim() : '09:20'),
      durationMinutes: item.durationMinutes || 20,
      category: item.category || 'additional',
    });
    setEditingTimetableItemIndex(index);
    setShowActivityEditorModal(true);
  };

  // Save activity from editor modal into planFormTimetable
  const handleSaveActivityFromEditor = () => {
    if (!activityEditorForm.program.trim()) {
      Alert.alert('Required', 'Please specify the activity or program title.');
      return;
    }
    const dur = ServiceRosterService.calculateDuration(
      activityEditorForm.startTime || '09:00',
      activityEditorForm.endTime || '09:20'
    );
    const updatedItem: RunSheetItem = {
      ...activityEditorForm,
      durationMinutes: Math.max(1, dur),
      time: ServiceRosterService.formatTimeRange(
        activityEditorForm.startTime || '09:00',
        activityEditorForm.endTime || '09:20'
      ),
    };

    let updatedList = [...planFormTimetable];
    if (editingTimetableItemIndex !== null) {
      updatedList[editingTimetableItemIndex] = updatedItem;
    } else {
      updatedList.push(updatedItem);
    }
    setPlanFormTimetable(updatedList);
    setShowActivityEditorModal(false);
  };

  // Delete activity from timetable builder
  const handleDeleteTimetableActivity = (index: number) => {
    setPlanFormTimetable(prev => prev.filter((_, i) => i !== index));
  };

  // Move activity up or down
  const handleMoveTimetableActivity = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= planFormTimetable.length) return;
    const updated = [...planFormTimetable];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPlanFormTimetable(updated);
  };

  // Save Complete Service Schedule and Timetable
  const handleSavePlanDetails = async () => {
    if (!activeChurch?.id) return;
    if (!planFormTitle.trim() || !planFormDate.trim()) {
      Alert.alert('Required', 'Please specify a service title and date.');
      return;
    }

    const validation = ServiceRosterService.validateSchedule(
      planFormStartTime,
      planFormEndTime,
      planFormTimetable
    );

    if (validation.hasOverlaps) {
      Alert.alert(
        'Time Overlap Warning',
        `Warning: There are overlapping activities in your timetable:\n\n• ${validation.overlapMessages.slice(0, 3).join('\n• ')}\n\nDo you want to save anyway?`,
        [
          { text: 'Adjust Timetable', style: 'cancel' },
          { text: 'Save Anyway', onPress: () => executeSavePlan(validation) }
        ]
      );
      return;
    }

    await executeSavePlan(validation);
  };

  const executeSavePlan = async (validation: any) => {
    if (!activeChurch?.id) return;
    setSavingPlan(true);
    try {
      const isNew = !selectedPlan?.id;

      // Extract specific anchors if present in timetable
      const spItem = planFormTimetable.find(r => r.category === 'starting_prayer');
      const osItem = planFormTimetable.find(r => r.category === 'opening_song');
      const brItem = planFormTimetable.find(r => r.category === 'bible_reading');
      const sItem = planFormTimetable.find(r => r.category === 'sermon');
      const cpItem = planFormTimetable.find(r => r.category === 'closing_prayer');

      const updatedAssignments = {
        ...(selectedPlan?.assignments || {}),
        ...(spItem?.assignedTo ? { op_prayer: spItem.assignedTo } : {}),
        ...(osItem?.assignedTo ? { singer_1: osItem.assignedTo } : {}),
        ...(cpItem?.assignedTo ? { cl_prayer: cpItem.assignedTo } : {}),
        ...(sItem?.assignedTo ? { devotion: sItem.assignedTo } : {}),
      };

      const planPayload: Partial<ServicePlan> = {
        ...(selectedPlan?.id ? { id: selectedPlan.id } : {}),
        churchId: activeChurch.id,
        churchName: activeChurch.name || 'We Christian',
        date: planFormDate.trim(),
        serviceTitle: planFormTitle.trim(),
        serviceType: planFormType,
        status: selectedPlan?.status || 'published',
        startTime: planFormStartTime.trim(),
        endTime: planFormEndTime.trim(),
        location: planFormLocation.trim() || 'Sanctuary',
        totalDurationMinutes: validation?.totalServiceMinutes || 120,
        runSheet: planFormTimetable,
        assignments: updatedAssignments,
        startingPrayer: spItem ? {
          person: spItem.assignedTo || '',
          startTime: spItem.startTime || '',
          endTime: spItem.endTime || ''
        } : undefined,
        openingSong: osItem ? {
          songTitle: osItem.songTitle || '',
          leader: osItem.assignedTo || '',
          musicians: osItem.musicians || '',
          startTime: osItem.startTime || '',
          endTime: osItem.endTime || ''
        } : undefined,
        bibleReading: brItem ? {
          person: brItem.assignedTo || '',
          passage: brItem.passage || '',
          startTime: brItem.startTime || '',
          endTime: brItem.endTime || ''
        } : undefined,
        closingPrayer: cpItem ? {
          person: cpItem.assignedTo || '',
          startTime: cpItem.startTime || '',
          endTime: cpItem.endTime || ''
        } : undefined,
        sermon: {
          title: sItem?.program || selectedPlan?.sermon?.title || '',
          code: selectedPlan?.sermon?.code || '',
          keyVerses: sItem?.passage || selectedPlan?.sermon?.keyVerses || '',
          speaker: sItem?.assignedTo || selectedPlan?.sermon?.speaker || '',
          translation: selectedPlan?.sermon?.translation || '',
          startTime: sItem?.startTime || '10:00',
          endTime: sItem?.endTime || '10:45'
        },
        setlist: selectedPlan?.setlist || []
      };

      const savedId = await ServiceRosterService.saveServicePlan(activeChurch.id, planPayload);
      setShowCreatePlanModal(false);

      const refreshed = await ServiceRosterService.getServicePlans(activeChurch.id);
      setPlans(refreshed);
      const updated = await ServiceRosterService.getServicePlanById(activeChurch.id, savedId);
      if (updated) setSelectedPlan(updated);
      Alert.alert('Success', isNew ? 'Service schedule & timetable created successfully!' : 'Service timetable updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save service.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Delete Service Plan
  const handleDeletePlan = (planToDelete?: ServicePlan | null) => {
    const plan = planToDelete || selectedPlan;
    if (!plan?.id || !activeChurch?.id) {
      Alert.alert('Notice', 'No service plan selected to delete.');
      return;
    }
    Alert.alert(
      'Delete Service Plan',
      `Are you sure you want to delete "${plan.serviceTitle}"? This will permanently delete the timetable and team assignments for this service.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ServiceRosterService.deleteServicePlan(activeChurch.id, plan.id);
              const remaining = plans.filter(p => p.id !== plan.id);
              setPlans(remaining);
              setSelectedPlan(remaining.length > 0 ? remaining[0] : null);
              setShowCreatePlanModal(false);
              Alert.alert('Deleted', 'Service plan deleted successfully.');
            } catch (e) {
              console.error('Error deleting service plan:', e);
              Alert.alert('Error', 'Failed to delete service plan. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Save Assignment update
  const handleAssignRole = async (personName: string) => {
    if (!selectedPlan || !assigningRoleId || !activeChurch?.id) return;
    const updatedAssignments = {
      ...selectedPlan.assignments,
      [assigningRoleId]: personName
    };
    const updatedPlan: ServicePlan = {
      ...selectedPlan,
      assignments: updatedAssignments
    };
    setSelectedPlan(updatedPlan);
    setShowMemberPickerModal(false);
    setCustomAssigneeName('');
    await ServiceRosterService.saveServicePlan(activeChurch.id, {
      id: selectedPlan.id,
      assignments: updatedAssignments
    });
  };

  // Save Setlist Song
  const handleSaveSong = async () => {
    if (!selectedPlan || !activeChurch?.id) return;
    if (!songForm.title.trim()) {
      Alert.alert('Required', 'Please enter a song title');
      return;
    }
    let updatedSetlist = [...(selectedPlan.setlist || [])];
    if (editingSongIndex !== null) {
      updatedSetlist[editingSongIndex] = { ...songForm };
    } else {
      updatedSetlist.push({ ...songForm, id: Math.random().toString(36).substring(7) });
    }
    const updatedPlan = { ...selectedPlan, setlist: updatedSetlist };
    setSelectedPlan(updatedPlan);
    setShowSongModal(false);
    await ServiceRosterService.saveServicePlan(activeChurch.id, {
      id: selectedPlan.id,
      setlist: updatedSetlist
    });
  };

  // Remove Song
  const handleDeleteSong = async (index: number) => {
    if (!selectedPlan || !activeChurch?.id) return;
    const updated = selectedPlan.setlist.filter((_, i) => i !== index);
    setSelectedPlan({ ...selectedPlan, setlist: updated });
    await ServiceRosterService.saveServicePlan(activeChurch.id, {
      id: selectedPlan.id,
      setlist: updated
    });
  };

  // WhatsApp Share
  const handleShareToWhatsApp = async () => {
    if (!selectedPlan) return;
    const text = ServiceRosterService.generateWhatsAppShareText(selectedPlan);
    try {
      await Share.share({
        message: text,
        title: `${selectedPlan.churchName || 'Church'} - ${selectedPlan.serviceTitle}`
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered members for assignment
  const filteredMembers = churchMembers.filter(m => {
    const name = (m.name || m.firstName || '').toLowerCase();
    const phone = (m.phone || '').toLowerCase();
    const q = memberSearchQuery.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  // Category Colors
  const getCategoryTheme = (cat?: TimetableCategory) => {
    switch (cat) {
      case 'starting_prayer':
      case 'closing_prayer':
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', label: 'Prayer' };
      case 'opening_song':
      case 'worship_songs':
        return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', label: 'Worship' };
      case 'bible_reading':
        return { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', label: 'Scripture' };
      case 'sermon':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', label: 'Message' };
      case 'communion':
        return { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C', label: 'Communion' };
      case 'offertory':
        return { bg: '#ECFDF5', border: '#BBF7D0', text: '#15803D', label: 'Offertory' };
      case 'announcements':
        return { bg: '#FEF9C3', border: '#FEF08A', text: '#A16207', label: 'Announce' };
      case 'testimony':
        return { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', label: 'Testimony' };
      case 'intercession':
        return { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', label: 'Intercession' };
      case 'break':
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#475569', label: 'Break' };
      default:
        return { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E', label: 'Activity' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />

      {/* ── Top Hero Header (Identical to AdminEventList & other admin tabs) ── */}
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Service Operations</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]}>
                {plans.length} total · {upcomingCount} upcoming
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              style={styles.heroRefreshBtn}
              onPress={loadData}
              activeOpacity={0.8}
            >
              <RefreshCw size={15} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => openServiceTimetableModal(null)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#1a2d5a" />
              <Text style={styles.newBtnTxt}>New</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Main Content Area ──────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#1A2D5A" />
          <Text style={styles.loadingTxt}>Loading church service schedules...</Text>
        </View>
      ) : !selectedPlan ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <CalendarDays size={38} color="#1A2D5A" />
          </View>
          <Text style={styles.emptyTitle}>No Service Plan Found</Text>
          <Text style={styles.emptySub}>
            Create your service timetable, run-sheets, and assign church team rosters.
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={() => openServiceTimetableModal(null)}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.emptyCreateBtnTxt}>Create First Service Schedule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Scheduled Services Switcher (if multiple services) ── */}
          {plans.length > 1 && (
            <View style={styles.serviceSelectorBar}>
              <View style={styles.serviceSelectorTop}>
                <CalendarDays size={13} color="#1A2D5A" />
                <Text style={styles.serviceSelectorHeading}>SCHEDULED SERVICES ({plans.length})</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.serviceSelectorScroll}
              >
                {plans.map((p, pIdx) => {
                  const isSelected = selectedPlan?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={`plan_chip_${p.id || ''}_${pIdx}`}
                      style={[styles.serviceSelectPill, isSelected && styles.serviceSelectPillActive]}
                      onPress={() => setSelectedPlan(p)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.serviceSelectPillDot, isSelected && styles.serviceSelectPillDotActive]} />
                      <Text
                        style={[styles.serviceSelectPillTitle, isSelected && styles.serviceSelectPillTitleActive]}
                        numberOfLines={1}
                      >
                        {p.serviceTitle}
                      </Text>
                      <View style={[styles.serviceSelectPillDate, isSelected && styles.serviceSelectPillDateActive]}>
                        <Text style={[styles.serviceSelectPillDateTxt, isSelected && styles.serviceSelectPillDateTxtActive]}>
                          {p.date}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Active Service Banner Card ─────────────────────── */}
          <View style={styles.activeServiceCard}>
            <View style={styles.activeServiceTop}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.dateBadge}>
                    <CalendarDays size={12} color="#1A2D5A" />
                    <Text style={styles.dateBadgeTxt}>{selectedPlan.date}</Text>
                  </View>
                  {selectedPlan.startTime && (
                    <View style={styles.timeBadge}>
                      <Clock size={12} color="#059669" />
                      <Text style={styles.timeBadgeTxt}>
                        {selectedPlan.startTime} {selectedPlan.endTime ? `- ${selectedPlan.endTime}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.activeServiceTitle} numberOfLines={2}>
                  {selectedPlan.serviceTitle}
                </Text>
                {selectedPlan.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.locationTxt} numberOfLines={1}>
                      {selectedPlan.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Actions Row */}
            <View style={styles.activeServiceActionsRow}>
              <TouchableOpacity
                style={styles.actionBtnEdit}
                onPress={() => openServiceTimetableModal(selectedPlan)}
                activeOpacity={0.8}
              >
                <Edit2 size={13} color="#FFFFFF" />
                <Text style={styles.actionBtnEditTxt}>Edit Timetable</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnShare}
                onPress={handleShareToWhatsApp}
                activeOpacity={0.8}
              >
                <MessageCircle size={14} color="#059669" />
                <Text style={styles.actionBtnShareTxt}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnDelete}
                onPress={() => handleDeletePlan(selectedPlan)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Modern Segmented Navigation Tabs ───────────────── */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activePlanTab === 'roster' && styles.tabItemActive]}
              onPress={() => setActivePlanTab('roster')}
              activeOpacity={0.85}
            >
              <Users size={15} color={activePlanTab === 'roster' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabItemTxt, activePlanTab === 'roster' && styles.tabItemTxtActive]}>
                Team Roster
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activePlanTab === 'setlist' && styles.tabItemActive]}
              onPress={() => setActivePlanTab('setlist')}
              activeOpacity={0.85}
            >
              <Music size={15} color={activePlanTab === 'setlist' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabItemTxt, activePlanTab === 'setlist' && styles.tabItemTxtActive]}>
                Setlist Flow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activePlanTab === 'runSheet' && styles.tabItemActive]}
              onPress={() => setActivePlanTab('runSheet')}
              activeOpacity={0.85}
            >
              <Clock size={15} color={activePlanTab === 'runSheet' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabItemTxt, activePlanTab === 'runSheet' && styles.tabItemTxtActive]}>
                Run Sheet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activePlanTab === 'export' && styles.tabItemActive]}
              onPress={() => setActivePlanTab('export')}
              activeOpacity={0.85}
            >
              <Share2 size={15} color={activePlanTab === 'export' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabItemTxt, activePlanTab === 'export' && styles.tabItemTxtActive]}>
                Bulletin
              </Text>
            </TouchableOpacity>
          </View>

          {/* ═════════════════════════════════════════════════════
              TAB 1: TEAM ROSTER (VISUAL MINISTRY CARDS)
             ═════════════════════════════════════════════════════ */}
          {activePlanTab === 'roster' && (
            <View style={{ gap: 14 }}>
              {/* 1. Worship & Music Department: Clearly separated Worship Team & Band */}
              <View style={styles.sectionCard}>
                <View style={[styles.sectionCardHeader, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <View style={styles.sectionCardHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#E0E7FF' }]}>
                      <Music size={16} color="#4338CA" />
                    </View>
                    <View>
                      <Text style={[styles.sectionCardTitle, { color: '#312E81' }]}>Worship Team & Band</Text>
                      <Text style={styles.sectionCardSub}>Vocalists, Keyboardists & Instrumentalists</Text>
                    </View>
                  </View>
                </View>

                {/* 1A. Worship Team (Vocalists) */}
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionEmoji}>🎤</Text>
                  <Text style={styles.subSectionTitle}>Worship Team (Vocalists)</Text>
                  <View style={styles.subSectionLine} />
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'singer_1', label: 'Singer #1 (Lead / Center)', icon: '🎤', isLead: true },
                    { id: 'singer_2', label: 'Singer #2 (Left)', icon: '🎤' },
                    { id: 'singer_3', label: 'Singer #3 (Right)', icon: '🎤' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[
                          styles.roleTile,
                          role.isLead && styles.roleTileLead,
                          assigned ? styles.roleTileAssigned : styles.roleTileUnassigned
                        ]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#4338CA' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#6366F1" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#6366F1' }]}>Assign Vocalist</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 1B. The Band (Instrumentalists) */}
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionEmoji}>🎸</Text>
                  <Text style={styles.subSectionTitle}>The Band (Instrumentalists)</Text>
                  <View style={styles.subSectionLine} />
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'keyboard', label: 'Keyboard / Piano', icon: '🎹' },
                    { id: 'acoustic', label: 'Acoustic Guitar', icon: '🎸' },
                    { id: 'electric', label: 'Electric Guitar', icon: '🎸' },
                    { id: 'bass', label: 'Bass Guitar', icon: '🎸' },
                    { id: 'drums', label: 'Drums / Percussion', icon: '🥁' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#0284C7' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#0284C7" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#0284C7' }]}>Assign Musician</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Mini Song Preview */}
                {selectedPlan.setlist && selectedPlan.setlist.length > 0 && (
                  <View style={styles.rosterSongPreviewWrap}>
                    <View style={styles.rosterSongPreviewHeader}>
                      <Text style={styles.rosterSongPreviewTitle}>
                        Scheduled Songs ({selectedPlan.setlist.length})
                      </Text>
                      <TouchableOpacity onPress={() => setActivePlanTab('setlist')}>
                        <Text style={styles.viewDetailsLink}>View Setlist →</Text>
                      </TouchableOpacity>
                    </View>
                    {selectedPlan.setlist.map((song, sIdx) => (
                      <View key={`mini_${song.id || sIdx}`} style={styles.miniSongRow}>
                        <Text style={styles.miniSongIdx}>{sIdx + 1}.</Text>
                        <Text style={styles.miniSongName} numberOfLines={1}>{song.title}</Text>
                        {song.key ? (
                          <View style={styles.miniKeyPill}>
                            <Text style={styles.miniKeyPillTxt}>{song.key}</Text>
                          </View>
                        ) : null}
                        {song.ledBy ? (
                          <Text style={styles.miniSongLeader} numberOfLines={1}>
                            Led by {song.ledBy}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 2. Media & AV Team (BMW) */}
              <View style={styles.sectionCard}>
                <View style={[styles.sectionCardHeader, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <View style={styles.sectionCardHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#D1FAE5' }]}>
                      <Tv size={16} color="#059669" />
                    </View>
                    <View>
                      <Text style={[styles.sectionCardTitle, { color: '#065F46' }]}>Team BMW (Audio, Media & Visuals)</Text>
                      <Text style={styles.sectionCardSub}>Sound Engineers, Live Stream & Cameras</Text>
                    </View>
                  </View>
                </View>

                {/* 2A. Audio */}
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionEmoji}>🎛️</Text>
                  <Text style={styles.subSectionTitle}>Audio & Sound Engineering</Text>
                  <View style={styles.subSectionLine} />
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'sound_foh', label: 'Sound (FOH / Mix)', icon: '🎛️' },
                    { id: 'sound_stage', label: 'Sound (Stage Monitors)', icon: '🔊' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#059669' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#059669" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#059669' }]}>Assign Sound</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2B. Broadcast & Cameras */}
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionEmoji}>📹</Text>
                  <Text style={styles.subSectionTitle}>Broadcast & Camera Operators</Text>
                  <View style={styles.subSectionLine} />
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'video_dir', label: 'Video Director', icon: '🎬' },
                    { id: 'cam_main', label: 'Camera (Main / Center)', icon: '📹' },
                    { id: 'cam_left', label: 'Camera (Left)', icon: '📹' },
                    { id: 'cam_right', label: 'Camera (Right)', icon: '📹' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#059669' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#059669" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#059669' }]}>Assign Camera</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2C. Media & Displays */}
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionEmoji}>💻</Text>
                  <Text style={styles.subSectionTitle}>Media, Presentation & Displays</Text>
                  <View style={styles.subSectionLine} />
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'media_pc1', label: 'Live Stream PC', icon: '💻' },
                    { id: 'media_pc3', label: 'Lyrics Presentation PC', icon: '📽️' },
                    { id: 'media_pc4', label: 'Stage Displays', icon: '🖥️' },
                    { id: 'photo_cam', label: 'Photographer', icon: '📸' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#059669' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#059669" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#059669' }]}>Assign Media</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3. Platform Ministers & Liturgy */}
              <View style={styles.sectionCard}>
                <View style={[styles.sectionCardHeader, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}>
                  <View style={styles.sectionCardHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                      <Heart size={16} color="#0D9488" />
                    </View>
                    <View>
                      <Text style={[styles.sectionCardTitle, { color: '#115E59' }]}>Platform Ministers & Hospitality</Text>
                      <Text style={styles.sectionCardSub}>Prayer Leaders, Ushers & Hospitality</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'op_prayer', label: 'Starting Prayer', icon: '🙏' },
                    { id: 'cl_prayer', label: 'Closing Prayer', icon: '🙏' },
                    { id: 'devotion', label: 'Devotion / Exhortation', icon: '📖' },
                    { id: 'announcements', label: 'Announcements', icon: '📢' },
                    { id: 'ushering', label: 'Ushering Team', icon: '🤝' },
                    { id: 'fmh', label: 'Hospitality (FMH)', icon: '☕' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#0D9488' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#0D9488" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#0D9488' }]}>Assign Leader</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. Sunday School / Kids Ministry */}
              <View style={styles.sectionCard}>
                <View style={[styles.sectionCardHeader, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <View style={styles.sectionCardHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#FDE68A' }]}>
                      <Baby size={16} color="#B45309" />
                    </View>
                    <View>
                      <Text style={[styles.sectionCardTitle, { color: '#78350F' }]}>Sunday School & Kids Ministry</Text>
                      <Text style={styles.sectionCardSub}>Teachers, Lessons & Classes</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rolesGrid}>
                  {[
                    { id: 'ss_beginners', label: 'Beginners Class', icon: '👶' },
                    { id: 'ss_primary', label: 'Primary Class', icon: '🧒' },
                    { id: 'ss_juniors', label: 'Juniors Class', icon: '👦' },
                    { id: 'ss_seniors', label: 'Seniors Class', icon: '🧑' },
                  ].map(role => {
                    const assigned = selectedPlan.assignments[role.id];
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleTile, assigned ? styles.roleTileAssigned : styles.roleTileUnassigned]}
                        onPress={() => {
                          setAssigningRoleId(role.id);
                          setAssigningRoleName(role.label);
                          setShowMemberPickerModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleTileTop}>
                          <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                          <Text style={styles.roleLabelTxt} numberOfLines={1}>{role.label}</Text>
                        </View>
                        {assigned ? (
                          <View style={styles.assignedPersonRow}>
                            <View style={[styles.avatarBubble, { backgroundColor: '#B45309' }]}>
                              <Text style={styles.avatarBubbleTxt}>
                                {assigned.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.assignedPersonName} numberOfLines={1}>
                              {assigned}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unassignedPromptRow}>
                            <Plus size={12} color="#B45309" />
                            <Text style={[styles.unassignedPromptTxt, { color: '#B45309' }]}>Assign Teacher</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Sermon Details Card */}
              <View style={styles.sectionCard}>
                <View style={[styles.sectionCardHeader, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <View style={styles.sectionCardHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#DBEAFE' }]}>
                      <BookOpen size={16} color="#1D4ED8" />
                    </View>
                    <View>
                      <Text style={[styles.sectionCardTitle, { color: '#1E3A8A' }]}>Sermon & Word Ministry</Text>
                      <Text style={styles.sectionCardSub}>Speaker, Scripture Reading & Message</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sermonCardBody}>
                  <View style={styles.sermonFieldRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.sermonFieldLabel}>Sermon Title</Text>
                      <TextInput
                        style={styles.sermonFieldInput}
                        value={selectedPlan.sermon?.title || ''}
                        placeholder="e.g. Walking in the Spirit"
                        placeholderTextColor="#94A3B8"
                        onChangeText={t => {
                          setSelectedPlan(prev => prev ? {
                            ...prev,
                            sermon: { ...(prev.sermon || {}), title: t }
                          } : null);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.sermonFieldLabel}>Code</Text>
                      <TextInput
                        style={styles.sermonFieldInput}
                        value={selectedPlan.sermon?.code || ''}
                        placeholder="e.g. A101"
                        placeholderTextColor="#94A3B8"
                        onChangeText={t => {
                          setSelectedPlan(prev => prev ? {
                            ...prev,
                            sermon: { ...(prev.sermon || {}), code: t }
                          } : null);
                        }}
                      />
                    </View>
                  </View>

                  <View style={[styles.sermonFieldRow, { marginTop: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sermonFieldLabel}>Preacher / Speaker</Text>
                      <TextInput
                        style={styles.sermonFieldInput}
                        value={selectedPlan.sermon?.speaker || ''}
                        placeholder="e.g. Pastor / Guest Speaker"
                        placeholderTextColor="#94A3B8"
                        onChangeText={t => {
                          setSelectedPlan(prev => prev ? {
                            ...prev,
                            sermon: { ...(prev.sermon || {}), speaker: t }
                          } : null);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.sermonFieldLabel}>Key Scripture Verses</Text>
                      <TextInput
                        style={styles.sermonFieldInput}
                        value={selectedPlan.sermon?.keyVerses || ''}
                        placeholder="e.g. Rom 8:1-14"
                        placeholderTextColor="#94A3B8"
                        onChangeText={t => {
                          setSelectedPlan(prev => prev ? {
                            ...prev,
                            sermon: { ...(prev.sermon || {}), keyVerses: t }
                          } : null);
                        }}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveSermonBtn}
                    onPress={async () => {
                      if (!activeChurch?.id || !selectedPlan?.id) return;
                      await ServiceRosterService.saveServicePlan(activeChurch.id, {
                        id: selectedPlan.id,
                        sermon: selectedPlan.sermon
                      });
                      Alert.alert('Saved', 'Sermon details updated.');
                    }}
                    activeOpacity={0.85}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.saveSermonBtnTxt}>Save Sermon Information</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════
              TAB 2: SETLIST FLOW (WORSHIP SONGS)
             ═════════════════════════════════════════════════════ */}
          {activePlanTab === 'setlist' && (
            <View style={{ gap: 12 }}>
              <View style={styles.tabSectionHeaderRow}>
                <View>
                  <Text style={styles.tabSectionTitle}>Worship Songs & Chords</Text>
                  <Text style={styles.tabSectionSubtitle}>
                    {selectedPlan.setlist?.length || 0} Songs Scheduled
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  onPress={() => {
                    setEditingSongIndex(null);
                    setSongForm({
                      id: '',
                      title: '',
                      ledBy: '',
                      key: 'F',
                      timeSignature: '4/4',
                      tempo: '100',
                      verses: '',
                      prelude: '',
                      interlude: '',
                      notes: '',
                      isOffertory: false,
                    });
                    setShowSongModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.primaryAddBtnTxt}>Add Song</Text>
                </TouchableOpacity>
              </View>

              {(!selectedPlan.setlist || selectedPlan.setlist.length === 0) ? (
                <View style={styles.emptyCard}>
                  <Music size={36} color="#CBD5E1" />
                  <Text style={styles.emptyCardTitle}>No Songs in this Setlist</Text>
                  <Text style={styles.emptyCardSub}>Add your songs with musical keys, tempo BPM, and band arrangements.</Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => {
                      setEditingSongIndex(null);
                      setSongForm({
                        id: '',
                        title: '',
                        ledBy: '',
                        key: 'F',
                        timeSignature: '4/4',
                        tempo: '100',
                        verses: '',
                        prelude: '',
                        interlude: '',
                        notes: '',
                        isOffertory: false,
                      });
                      setShowSongModal(true);
                    }}
                  >
                    <Plus size={15} color="#1A2D5A" />
                    <Text style={styles.emptyAddBtnTxt}>Add First Song</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                selectedPlan.setlist.map((song, index) => (
                  <View key={`song_${song.id || index}`} style={styles.songCard}>
                    <View style={styles.songCardTop}>
                      <View style={styles.songIndexCircle}>
                        <Text style={styles.songIndexTxt}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.songCardTitle}>{song.title}</Text>
                        <Text style={styles.songCardLeader}>
                          {song.ledBy ? `👤 Led by ${song.ledBy}` : 'Unassigned Song Leader'}
                        </Text>
                      </View>
                      <View style={styles.songActionsRow}>
                        <TouchableOpacity
                          style={styles.songActionBtn}
                          onPress={() => {
                            setEditingSongIndex(index);
                            setSongForm({ ...song });
                            setShowSongModal(true);
                          }}
                        >
                          <Edit2 size={14} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.songActionBtn}
                          onPress={() => handleDeleteSong(index)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Chips Row */}
                    <View style={styles.songChipsRow}>
                      <View style={[styles.musicChip, { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }]}>
                        <Text style={[styles.musicChipTxt, { color: '#7E22CE' }]}>Key: {song.key || 'F'}</Text>
                      </View>
                      <View style={[styles.musicChip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <Text style={[styles.musicChipTxt, { color: '#1D4ED8' }]}>{song.timeSignature || '4/4'}</Text>
                      </View>
                      <View style={[styles.musicChip, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <Text style={[styles.musicChipTxt, { color: '#15803D' }]}>{song.tempo || '100'} BPM</Text>
                      </View>
                      {song.isOffertory && (
                        <View style={[styles.musicChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                          <Text style={[styles.musicChipTxt, { color: '#B45309' }]}>💰 Offertory</Text>
                        </View>
                      )}
                    </View>

                    {/* Arrangements Box */}
                    {(song.prelude || song.interlude || song.notes) && (
                      <View style={styles.arrangementWrap}>
                        {song.prelude ? (
                          <Text style={styles.arrTxt}>
                            <Text style={styles.arrLabel}>Prelude: </Text>{song.prelude}
                          </Text>
                        ) : null}
                        {song.interlude ? (
                          <Text style={styles.arrTxt}>
                            <Text style={styles.arrLabel}>Interlude: </Text>{song.interlude}
                          </Text>
                        ) : null}
                        {song.notes ? (
                          <Text style={styles.arrTxt}>
                            <Text style={styles.arrLabel}>Notes: </Text>{song.notes}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ═════════════════════════════════════════════════════
              TAB 3: RUN SHEET (VERTICAL TIMELINE TIMETABLE)
             ═════════════════════════════════════════════════════ */}
          {activePlanTab === 'runSheet' && (
            <View style={{ gap: 12 }}>
              <View style={styles.tabSectionHeaderRow}>
                <View>
                  <Text style={styles.tabSectionTitle}>Service Timetable & Run-Sheet</Text>
                  <Text style={styles.tabSectionSubtitle}>
                    {selectedPlan.startTime || '09:00'} - {selectedPlan.endTime || '11:00'} · Chronological Order
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  onPress={() => handleAddActivity('additional')}
                  activeOpacity={0.85}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={styles.primaryAddBtnTxt}>Add Activity</Text>
                </TouchableOpacity>
              </View>

              {(!selectedPlan.runSheet || selectedPlan.runSheet.length === 0) ? (
                <View style={styles.emptyCard}>
                  <Clock size={36} color="#CBD5E1" />
                  <Text style={styles.emptyCardTitle}>No Timetable Defined Yet</Text>
                  <Text style={styles.emptyCardSub}>Create the step-by-step timetable of this service from start to finish.</Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => openServiceTimetableModal(selectedPlan)}
                  >
                    <Plus size={15} color="#1A2D5A" />
                    <Text style={styles.emptyAddBtnTxt}>Build Service Timetable</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {selectedPlan.runSheet.map((item, idx) => {
                    const theme = getCategoryTheme(item.category);
                    return (
                      <View key={`timeline_${item.id || idx}`} style={styles.timelineRow}>
                        {/* Time Column */}
                        <View style={styles.timeColumn}>
                          <Text style={styles.timeStartTxt}>{item.startTime || item.time?.split(/to|-/i)[0]?.trim() || '09:00'}</Text>
                          <Text style={styles.timeEndTxt}>{item.endTime || item.time?.split(/to|-/i)[1]?.trim() || '09:15'}</Text>
                          <View style={styles.durationPill}>
                            <Text style={styles.durationPillTxt}>{item.durationMinutes || 15}m</Text>
                          </View>
                        </View>

                        {/* Node Dot & Line */}
                        <View style={styles.nodeColumn}>
                          <View style={[styles.nodeDot, { backgroundColor: theme.text }]} />
                          {idx < selectedPlan.runSheet.length - 1 && <View style={styles.nodeLine} />}
                        </View>

                        {/* Activity Card */}
                        <View style={[styles.activityCard, { borderLeftColor: theme.text }]}>
                          <View style={styles.activityCardTop}>
                            <View style={[styles.categoryPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                              <Text style={[styles.categoryPillTxt, { color: theme.text }]}>{theme.label}</Text>
                            </View>
                            <View style={styles.activityActions}>
                              <TouchableOpacity
                                style={styles.activityActionBtn}
                                onPress={() => openServiceTimetableModal(selectedPlan)}
                              >
                                <Edit2 size={13} color="#475569" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <Text style={styles.activityProgramTitle}>{item.program}</Text>
                          {item.assignedTo ? (
                            <Text style={styles.activityAssignedTxt}>👤 {item.assignedTo}</Text>
                          ) : null}
                          {item.songTitle ? (
                            <Text style={styles.activitySongTxt}>🎵 {item.songTitle}</Text>
                          ) : null}
                          {item.passage ? (
                            <Text style={styles.activityPassageTxt}>📖 {item.passage}</Text>
                          ) : null}
                          {item.place ? (
                            <Text style={styles.activityPlaceTxt}>📍 {item.place}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ═════════════════════════════════════════════════════
              TAB 4: BULLETIN / SHARE CARD
             ═════════════════════════════════════════════════════ */}
          {activePlanTab === 'export' && (
            <View style={{ gap: 14 }}>
              <View style={styles.bulletinPreviewCard}>
                <View style={styles.bulletinHeader}>
                  <Text style={styles.bulletinChurchName}>{(activeChurch?.name || 'WE CHRISTIAN').toUpperCase()}</Text>
                  <Text style={styles.bulletinServiceTitle}>{selectedPlan.serviceTitle}</Text>
                  <Text style={styles.bulletinDate}>📅 {selectedPlan.date} · ⏰ {selectedPlan.startTime || '09:00'} - {selectedPlan.endTime || '11:00'}</Text>
                </View>

                {/* Worship Summary */}
                <View style={styles.bulletinSection}>
                  <Text style={styles.bulletinSectionTitle}>🎵 WORSHIP TEAM & BAND</Text>
                  {selectedPlan.assignments.singer_1 && <Text style={styles.bulletinItemTxt}>• Lead Vocal: {selectedPlan.assignments.singer_1}</Text>}
                  {selectedPlan.assignments.keyboard && <Text style={styles.bulletinItemTxt}>• Keyboard: {selectedPlan.assignments.keyboard}</Text>}
                  {selectedPlan.assignments.electric && <Text style={styles.bulletinItemTxt}>• Electric Guitar: {selectedPlan.assignments.electric}</Text>}
                  {selectedPlan.assignments.bass && <Text style={styles.bulletinItemTxt}>• Bass: {selectedPlan.assignments.bass}</Text>}
                  {selectedPlan.assignments.drums && <Text style={styles.bulletinItemTxt}>• Drums: {selectedPlan.assignments.drums}</Text>}
                </View>

                {/* Setlist Summary */}
                {selectedPlan.setlist && selectedPlan.setlist.length > 0 && (
                  <View style={styles.bulletinSection}>
                    <Text style={styles.bulletinSectionTitle}>🎶 WORSHIP SETLIST</Text>
                    {selectedPlan.setlist.map((s, idx) => (
                      <Text key={`b_song_${idx}`} style={styles.bulletinItemTxt}>
                        {idx + 1}. {s.title} [Key: {s.key || 'F'}] {s.ledBy ? `- Led by ${s.ledBy}` : ''}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Media Summary */}
                <View style={styles.bulletinSection}>
                  <Text style={styles.bulletinSectionTitle}>🎛️ MEDIA & BROADCAST (TEAM BMW)</Text>
                  {selectedPlan.assignments.sound_foh && <Text style={styles.bulletinItemTxt}>• Sound (FOH): {selectedPlan.assignments.sound_foh}</Text>}
                  {selectedPlan.assignments.media_pc1 && <Text style={styles.bulletinItemTxt}>• Live PC: {selectedPlan.assignments.media_pc1}</Text>}
                  {selectedPlan.assignments.media_pc3 && <Text style={styles.bulletinItemTxt}>• Lyrics: {selectedPlan.assignments.media_pc3}</Text>}
                  {selectedPlan.assignments.cam_main && <Text style={styles.bulletinItemTxt}>• Main Camera: {selectedPlan.assignments.cam_main}</Text>}
                  {selectedPlan.assignments.video_dir && <Text style={styles.bulletinItemTxt}>• Director: {selectedPlan.assignments.video_dir}</Text>}
                </View>

                {/* Sermon Summary */}
                {selectedPlan.sermon?.title && (
                  <View style={styles.bulletinSection}>
                    <Text style={styles.bulletinSectionTitle}>📖 SERMON MESSAGE</Text>
                    <Text style={styles.bulletinItemTxt}>• Title: {selectedPlan.sermon.title}</Text>
                    {selectedPlan.sermon.speaker && <Text style={styles.bulletinItemTxt}>• Speaker: {selectedPlan.sermon.speaker}</Text>}
                    {selectedPlan.sermon.keyVerses && <Text style={styles.bulletinItemTxt}>• Scripture: {selectedPlan.sermon.keyVerses}</Text>}
                  </View>
                )}
              </View>

              {/* Share Action Buttons */}
              <TouchableOpacity
                style={styles.whatsAppShareBtn}
                onPress={handleShareToWhatsApp}
                activeOpacity={0.85}
              >
                <MessageCircle size={18} color="#FFFFFF" />
                <Text style={styles.whatsAppShareBtnTxt}>Share Bulletin via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── MODAL 1: ASSIGN REGISTERED MEMBER ─────────────────── */}
      <Modal
        visible={showMemberPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalCardTitle}>Assign Team Member</Text>
                <Text style={styles.modalCardSubtitle}>{assigningRoleName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMemberPickerModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Custom Name Input */}
            <View style={styles.customAssignRow}>
              <TextInput
                style={styles.customAssignInput}
                placeholder="Or type custom name..."
                placeholderTextColor="#94A3B8"
                value={customAssigneeName}
                onChangeText={setCustomAssigneeName}
              />
              <TouchableOpacity
                style={styles.customAssignSubmitBtn}
                onPress={() => {
                  if (customAssigneeName.trim()) {
                    handleAssignRole(customAssigneeName.trim());
                  }
                }}
              >
                <Text style={styles.customAssignSubmitTxt}>Set</Text>
              </TouchableOpacity>
            </View>

            {/* Member Search */}
            <View style={styles.memberSearchBox}>
              <Search size={15} color="#94A3B8" />
              <TextInput
                style={styles.memberSearchInput}
                placeholder="Search registered members..."
                placeholderTextColor="#94A3B8"
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {filteredMembers.map((m, mIdx) => {
                const name = m.name || m.firstName || 'Member';
                return (
                  <TouchableOpacity
                    key={`mem_${m.id || mIdx}`}
                    style={styles.memberPickerRow}
                    onPress={() => handleAssignRole(name)}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarTxt}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberPickerName}>{name}</Text>
                      {m.phone ? <Text style={styles.memberPickerPhone}>{m.phone}</Text> : null}
                    </View>
                    <Check size={16} color="#059669" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: ADD / EDIT SETLIST SONG ─────────────────── */}
      <Modal
        visible={showSongModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSongModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalCardTitle}>
                  {editingSongIndex !== null ? 'Edit Worship Song' : 'Add Song to Setlist'}
                </Text>
                <Text style={styles.modalCardSubtitle}>Keys, BPM, Prelude & Arrangements</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSongModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Song Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Yee pata padenu yesayya"
                placeholderTextColor="#94A3B8"
                value={songForm.title}
                onChangeText={t => setSongForm(prev => ({ ...prev, title: t }))}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Song Leader</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Prabhakar Yeddula"
                    placeholderTextColor="#94A3B8"
                    value={songForm.ledBy}
                    onChangeText={t => setSongForm(prev => ({ ...prev, ledBy: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Key</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. F, D, G, F#m"
                    placeholderTextColor="#94A3B8"
                    value={songForm.key}
                    onChangeText={t => setSongForm(prev => ({ ...prev, key: t }))}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Time Signature</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="4/4, 3/4"
                    placeholderTextColor="#94A3B8"
                    value={songForm.timeSignature}
                    onChangeText={t => setSongForm(prev => ({ ...prev, timeSignature: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Tempo (BPM)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                    value={songForm.tempo}
                    onChangeText={t => setSongForm(prev => ({ ...prev, tempo: t }))}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Prelude Suggestion</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Acoustic + Drum"
                placeholderTextColor="#94A3B8"
                value={songForm.prelude}
                onChangeText={t => setSongForm(prev => ({ ...prev, prelude: t }))}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Arrangement / Theme Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Call to Worship & Praise"
                placeholderTextColor="#94A3B8"
                value={songForm.notes}
                onChangeText={t => setSongForm(prev => ({ ...prev, notes: t }))}
              />

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveSong}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnTxt}>
                  {editingSongIndex !== null ? 'Save Changes' : 'Add to Setlist'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: MASTER SERVICE & TIMETABLE BUILDER ───────── */}
      <Modal
        visible={showCreatePlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePlanModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '92%', width: '96%', padding: 0 }]}>
            <View style={styles.builderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalCardTitle}>
                  {selectedPlan?.id ? 'Edit Service Timetable' : 'New Service Schedule & Timetable'}
                </Text>
                <Text style={styles.modalCardSubtitle}>Define complete service schedule from start to finish</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  style={styles.saveHeaderBtn}
                  disabled={savingPlan}
                  onPress={handleSavePlanDetails}
                >
                  {savingPlan ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveHeaderBtnTxt}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCreatePlanModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
              {/* Quick Select from Church Events */}
              {churchEvents.length > 0 && !selectedPlan?.id && (
                <View style={styles.quickEventWrap}>
                  <Text style={styles.quickEventLabel}>📅 Pick from Scheduled Church Events:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    {churchEvents.map((ev, evIdx) => {
                      const title = ev.title || ev.name || 'Event';
                      const isMatch = planFormTitle === title;
                      return (
                        <TouchableOpacity
                          key={`ev_${ev.id || evIdx}`}
                          style={[styles.quickEventChip, isMatch && styles.quickEventChipActive]}
                          onPress={() => {
                            setPlanFormTitle(title);
                            if (ev.date) {
                              const d = ev.date.includes('T') ? ev.date.split('T')[0] : ev.date;
                              setPlanFormDate(d);
                            }
                            if (ev.startTime) {
                              const cleanStart = ev.startTime.includes('T') ? ev.startTime.split('T')[1].substring(0, 5) : ev.startTime;
                              setPlanFormStartTime(cleanStart);
                            }
                            if (ev.endTime) {
                              const cleanEnd = ev.endTime.includes('T') ? ev.endTime.split('T')[1].substring(0, 5) : ev.endTime;
                              setPlanFormEndTime(cleanEnd);
                            }
                            if (ev.location) {
                              setPlanFormLocation(ev.location);
                            }
                          }}
                        >
                          <Text style={[styles.quickEventChipTxt, isMatch && styles.quickEventChipTxtActive]}>
                            {title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Service Details */}
              <Text style={styles.inputLabel}>Service Name / Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sunday Morning Worship Service"
                placeholderTextColor="#94A3B8"
                value={planFormTitle}
                onChangeText={setPlanFormTitle}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-10-25"
                    placeholderTextColor="#94A3B8"
                    value={planFormDate}
                    onChangeText={setPlanFormDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="09:00"
                    placeholderTextColor="#94A3B8"
                    value={planFormStartTime}
                    onChangeText={setPlanFormStartTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="11:00"
                    placeholderTextColor="#94A3B8"
                    value={planFormEndTime}
                    onChangeText={setPlanFormEndTime}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Location / Sanctuary</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sanctuary / Church Hall"
                placeholderTextColor="#94A3B8"
                value={planFormLocation}
                onChangeText={setPlanFormLocation}
              />

              {/* ── Pre-Built Timetable Format Templates ────────── */}
              <View style={styles.templatePickerContainer}>
                <View style={styles.templatePickerHeader}>
                  <Sparkles size={14} color="#C9A84C" />
                  <Text style={styles.templatePickerTitle}>Pre-Built Timetable Formats</Text>
                </View>
                <Text style={styles.templatePickerSub}>
                  Tap any format below to instantly populate church schedule & timings:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateChipsRow}>
                  {ServiceRosterService.getAvailableTemplates().map(tmpl => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <TouchableOpacity
                        key={tmpl.id}
                        style={[styles.templateCardChip, isSelected && styles.templateCardChipActive]}
                        onPress={() => handleApplyTemplate(tmpl)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.templateCardChipTop}>
                          <Text style={styles.templateCardChipIcon}>{tmpl.icon}</Text>
                          <Text style={[styles.templateCardChipName, isSelected && styles.templateCardChipNameActive]}>
                            {tmpl.name}
                          </Text>
                        </View>
                        <Text style={[styles.templateCardChipSub, isSelected && styles.templateCardChipSubActive]}>
                          {tmpl.subtitle}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── Timetable Activities List ────────────────────── */}
              <View style={styles.builderSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.builderSectionTitle}>Service Timetable & Activities ({planFormTimetable.length})</Text>
                  <Text style={styles.builderSectionSub}>Chronological run-sheet for pastors, worship team, and AV media</Text>
                </View>
              </View>

              {planFormTimetable.length === 0 ? (
                <View style={styles.emptyTimetableBox}>
                  <CalendarDays size={30} color="#94A3B8" />
                  <Text style={styles.emptyTimetableTxt}>
                    No activities yet. Choose a format template above or use the quick buttons below.
                  </Text>
                </View>
              ) : (
                planFormTimetable.map((act, aIdx) => {
                  const theme = getCategoryTheme(act.category);
                  const isFirst = aIdx === 0;
                  const isLast = aIdx === planFormTimetable.length - 1;
                  return (
                    <View key={`act_${act.id || aIdx}`} style={styles.actBuilderRow}>
                      {/* Move Up/Down Controls */}
                      <View style={styles.actReorderCol}>
                        <TouchableOpacity
                          disabled={isFirst}
                          onPress={() => handleMoveTimetableActivity(aIdx, 'up')}
                          style={[styles.reorderBtn, isFirst && { opacity: 0.25 }]}
                        >
                          <ChevronUp size={14} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={isLast}
                          onPress={() => handleMoveTimetableActivity(aIdx, 'down')}
                          style={[styles.reorderBtn, isLast && { opacity: 0.25 }]}
                        >
                          <ChevronDown size={14} color="#475569" />
                        </TouchableOpacity>
                      </View>

                      {/* Time Pill */}
                      <View style={styles.actBuilderTime}>
                        <Text style={styles.actBuilderTimeTxt}>
                          {act.startTime || act.time?.split(/to|-/i)[0]?.trim() || '09:00'}
                        </Text>
                        <View style={styles.actBuilderDurBadge}>
                          <Text style={styles.actBuilderDurTxt}>{act.durationMinutes || 15}m</Text>
                        </View>
                      </View>

                      {/* Program Details & Category Badge */}
                      <View style={{ flex: 1, marginHorizontal: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <View style={[styles.catBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <Text style={[styles.catBadgeTxt, { color: theme.text }]}>{theme.label}</Text>
                          </View>
                          {act.passage ? (
                            <Text style={styles.actPassageTxt} numberOfLines={1}>{act.passage}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.actBuilderProgram} numberOfLines={1}>{act.program}</Text>
                        <Text style={styles.actBuilderSub} numberOfLines={1}>
                          {act.assignedTo ? `👤 ${act.assignedTo}` : 'Tap edit to assign leader'}
                        </Text>
                      </View>

                      {/* Action Buttons: Edit and Delete */}
                      <View style={styles.actBuilderActions}>
                        <TouchableOpacity onPress={() => handleEditActivity(aIdx)} style={styles.iconBtnSmall}>
                          <Edit2 size={13} color="#1E293B" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteTimetableActivity(aIdx)} style={[styles.iconBtnSmall, { backgroundColor: '#FEE2E2' }]}>
                          <Trash2 size={13} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* ── Quick Add Action Pills ───────────────────────── */}
              <View style={styles.quickAddSection}>
                <Text style={styles.quickAddHeaderTitle}>+ Quick Add Service Activity:</Text>
                <View style={styles.quickAddRow}>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('starting_prayer')}>
                    <Text style={styles.quickAddPillTxt}>+ Starting Prayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('opening_song')}>
                    <Text style={styles.quickAddPillTxt}>+ Opening Praise</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('worship_songs')}>
                    <Text style={styles.quickAddPillTxt}>+ Praise & Worship</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('bible_reading')}>
                    <Text style={styles.quickAddPillTxt}>+ Bible Reading</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('announcements')}>
                    <Text style={styles.quickAddPillTxt}>+ Announcements</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('offertory')}>
                    <Text style={styles.quickAddPillTxt}>+ Offertory</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('sermon')}>
                    <Text style={styles.quickAddPillTxt}>+ Sermon</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('communion')}>
                    <Text style={styles.quickAddPillTxt}>+ Holy Communion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('intercession')}>
                    <Text style={styles.quickAddPillTxt}>+ Intercession</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('testimony')}>
                    <Text style={styles.quickAddPillTxt}>+ Testimony</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('closing_prayer')}>
                    <Text style={styles.quickAddPillTxt}>+ Benediction</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('break')}>
                    <Text style={styles.quickAddPillTxt}>+ Break</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddPill} onPress={() => handleAddActivity('additional')}>
                    <Text style={styles.quickAddPillTxt}>+ Custom Activity</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 4: ACTIVITY EDITOR MODAL ───────────────────── */}
      <Modal
        visible={showActivityEditorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivityEditorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>
                {editingTimetableItemIndex !== null ? 'Edit Timetable Activity' : 'Add Activity'}
              </Text>
              <TouchableOpacity onPress={() => setShowActivityEditorModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Activity Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {[
                  { id: 'starting_prayer', label: 'Prayer' },
                  { id: 'opening_song', label: 'Opening Praise' },
                  { id: 'worship_songs', label: 'Worship' },
                  { id: 'bible_reading', label: 'Scripture' },
                  { id: 'sermon', label: 'Sermon' },
                  { id: 'communion', label: 'Communion' },
                  { id: 'offertory', label: 'Offertory' },
                  { id: 'announcements', label: 'Announcements' },
                  { id: 'intercession', label: 'Intercession' },
                  { id: 'testimony', label: 'Testimony' },
                  { id: 'closing_prayer', label: 'Benediction' },
                  { id: 'break', label: 'Break' },
                  { id: 'additional', label: 'Other' },
                ].map(c => {
                  const isCat = activityEditorForm.category === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catPickChip, isCat && styles.catPickChipActive]}
                      onPress={() => setActivityEditorForm(prev => ({ ...prev, category: c.id as TimetableCategory }))}
                    >
                      <Text style={[styles.catPickChipTxt, isCat && styles.catPickChipTxtActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Program / Activity Name</Text>
              <TextInput
                style={styles.textInput}
                value={activityEditorForm.program}
                placeholder="e.g. Starting Prayer / Scripture Reading"
                placeholderTextColor="#94A3B8"
                onChangeText={t => setActivityEditorForm(prev => ({ ...prev, program: t }))}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activityEditorForm.startTime}
                    placeholder="09:00"
                    placeholderTextColor="#94A3B8"
                    onChangeText={t => setActivityEditorForm(prev => ({ ...prev, startTime: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.textInput}
                    value={activityEditorForm.endTime}
                    placeholder="09:20"
                    placeholderTextColor="#94A3B8"
                    onChangeText={t => setActivityEditorForm(prev => ({ ...prev, endTime: t }))}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Person Assigned / Speaker</Text>
              <TextInput
                style={styles.textInput}
                value={activityEditorForm.assignedTo}
                placeholder="e.g. Pastor / Brother / Sister"
                placeholderTextColor="#94A3B8"
                onChangeText={t => setActivityEditorForm(prev => ({ ...prev, assignedTo: t }))}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Songs / Passage / Notes</Text>
              <TextInput
                style={styles.textInput}
                value={activityEditorForm.songTitle || activityEditorForm.passage || ''}
                placeholder="e.g. Song title or Scripture verse"
                placeholderTextColor="#94A3B8"
                onChangeText={t => setActivityEditorForm(prev => ({ ...prev, songTitle: t, passage: t }))}
              />

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveActivityFromEditor}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnTxt}>Save Activity</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTxt: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '600',
  },

  // ── Hero Header (Matches AdminEventList & other admin tabs) ───
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
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
  heroRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtn: {
    backgroundColor: '#C9A84C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  newBtnTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Scheduled Services Switcher Bar (Content Area) ───────────
  serviceSelectorBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceSelectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  serviceSelectorHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A2D5A',
    letterSpacing: 0.5,
  },
  serviceSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  serviceSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceSelectPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  serviceSelectPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  serviceSelectPillDotActive: {
    backgroundColor: '#2563EB',
  },
  serviceSelectPillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    maxWidth: 160,
  },
  serviceSelectPillTitleActive: {
    color: '#1E3A8A',
  },
  serviceSelectPillDate: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceSelectPillDateActive: {
    backgroundColor: '#DBEAFE',
  },
  serviceSelectPillDateTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  serviceSelectPillDateTxtActive: {
    color: '#1D4ED8',
  },

  // ── Scroll Body ────────────────────────────────────────────────
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Active Service Banner Card ─────────────────────────────────
  activeServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  activeServiceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dateBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  timeBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  activeServiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationTxt: {
    fontSize: 12,
    color: '#64748B',
  },
  activeServiceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    paddingVertical: 8.5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnEditTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnShare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 8.5,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnShareTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnDelete: {
    paddingVertical: 8.5,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Segmented Tab Bar ──────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#1A2D5A',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabItemTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabItemTxtActive: {
    color: '#FFFFFF',
  },

  // ── Section Department Cards (Clean & Modern) ──────────────────
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  sectionCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Subsection Headers inside cards ────────────────────────────
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  subSectionEmoji: {
    fontSize: 13,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 6,
  },

  // ── Roles Grid ─────────────────────────────────────────────────
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'space-between',
  },
  roleTile: {
    width: '48.5%',
    minHeight: 68,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  roleTileLead: {
    width: '100%',
    minHeight: 66,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 2,
  },
  roleTileAssigned: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTileUnassigned: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  roleTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  roleIconEmoji: {
    fontSize: 13,
  },
  roleLabelTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  assignedPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubbleTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  assignedPersonName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  unassignedPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unassignedPromptTxt: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ── Roster Song Preview Mini ───────────────────────────────────
  rosterSongPreviewWrap: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 12,
  },
  rosterSongPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rosterSongPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  viewDetailsLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  miniSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  miniSongIdx: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '700',
    width: 16,
  },
  miniSongName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  miniKeyPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniKeyPillTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7E22CE',
  },
  miniSongLeader: {
    fontSize: 11,
    color: '#64748B',
  },

  // ── Sermon Card Body ───────────────────────────────────────────
  sermonCardBody: {
    padding: 14,
  },
  sermonFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sermonFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  sermonFieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
  },
  saveSermonBtn: {
    backgroundColor: '#1A2D5A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  saveSermonBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Tab 2: Setlist Styles ──────────────────────────────────────
  tabSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tabSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  primaryAddBtn: {
    backgroundColor: '#1A2D5A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  primaryAddBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  songCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  songCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  songIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  songIndexTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  songCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  songCardLeader: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  songActionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  songActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  songChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  musicChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  musicChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  arrangementWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 3,
  },
  arrTxt: {
    fontSize: 11.5,
    color: '#334155',
  },
  arrLabel: {
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Tab 3: Timeline Run Sheet ──────────────────────────────────
  timelineList: {
    paddingTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeColumn: {
    width: 58,
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingTop: 2,
  },
  timeStartTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeEndTxt: {
    fontSize: 10,
    color: '#64748B',
  },
  durationPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  durationPillTxt: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  nodeColumn: {
    width: 18,
    alignItems: 'center',
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  activityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityActions: {
    flexDirection: 'row',
  },
  activityActionBtn: {
    padding: 4,
  },
  activityProgramTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityAssignedTxt: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 3,
  },
  activitySongTxt: {
    fontSize: 11.5,
    color: '#4F46E5',
    marginTop: 2,
  },
  activityPassageTxt: {
    fontSize: 11.5,
    color: '#D97706',
    marginTop: 2,
  },
  activityPlaceTxt: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Tab 4: Bulletin / Share ────────────────────────────────────
  bulletinPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bulletinHeader: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  bulletinChurchName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2D5A',
    letterSpacing: 1,
  },
  bulletinServiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    textAlign: 'center',
  },
  bulletinDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  bulletinSection: {
    marginBottom: 12,
  },
  bulletinSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1A2D5A',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  bulletinItemTxt: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  whatsAppShareBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#25D366',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppShareBtnTxt: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Empty States ───────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyCreateBtn: {
    backgroundColor: '#1A2D5A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyCreateBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
  },
  emptyAddBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A2D5A',
  },

  // ── Modals Backdrop & Cards ────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Member Picker Modal
  customAssignRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  customAssignInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
  },
  customAssignSubmitBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAssignSubmitTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  memberSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  memberPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  memberPickerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberPickerPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Modal Inputs & Buttons
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  modalPrimaryBtn: {
    backgroundColor: '#1A2D5A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalPrimaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // Builder Modal Styles
  builderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  saveHeaderBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveHeaderBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  quickEventWrap: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  quickEventLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  quickEventChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  quickEventChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  quickEventChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickEventChipTxtActive: {
    color: '#FFFFFF',
  },
  // ── Pre-Built Timetable Format Templates ──────────
  templatePickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    marginBottom: 6,
  },
  templatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  templatePickerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  templatePickerSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  templateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  templateCardChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  templateCardChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  templateCardChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  templateCardChipIcon: {
    fontSize: 14,
  },
  templateCardChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  templateCardChipNameActive: {
    color: '#1D4ED8',
  },
  templateCardChipSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  templateCardChipSubActive: {
    color: '#3B82F6',
  },

  // ── Timetable Activities List Builder ──────────────
  builderSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  builderSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  builderSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emptyTimetableBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTimetableTxt: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  actBuilderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actReorderCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    gap: 2,
  },
  reorderBtn: {
    padding: 2,
  },
  actBuilderTime: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 50,
  },
  actBuilderTimeTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  actBuilderDurBadge: {
    backgroundColor: '#EDE8DC',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  actBuilderDurTxt: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  catBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  actPassageTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  actBuilderProgram: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actBuilderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actBuilderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  iconBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Add Section ──────────────────────────────
  quickAddSection: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickAddHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1A2D5A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAddPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  quickAddPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── Category Picker Chips (Modal 4) ────────────────
  catPickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  catPickChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  catPickChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  catPickChipTxtActive: {
    color: '#FFFFFF',
  },
});
