import React, { useState, useEffect, useContext } from 'react';
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
  Alert
} from 'react-native';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Share2,
  Clock,
  Music,
  Users,
  Sliders,
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
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService from '../../services/FirestoreService';
import ServiceRosterService, {
  ServicePlan,
  DEFAULT_DEPARTMENTS,
  SetlistItem,
  RunSheetItem,
  ServiceDepartment
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
  const { activeChurch } = useChurch();
  const { setActiveTab } = useContext(AdminTabContext);
  const { member } = useAuth();

  // State: Plans list & loading
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<'roster' | 'setlist' | 'runSheet' | 'export'>('roster');

  // State: Church Members for assignment picker
  const [churchMembers, setChurchMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);
  const [assigningRoleName, setAssigningRoleName] = useState<string>('');
  const [customAssigneeName, setCustomAssigneeName] = useState('');
  const [showMemberPickerModal, setShowMemberPickerModal] = useState(false);

  // State: Create / Edit Plan Modal
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [planFormDate, setPlanFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [planFormTitle, setPlanFormTitle] = useState('1st Service - Telugu');
  const [planFormType, setPlanFormType] = useState<'sunday_service' | 'special_event' | 'conference'>('sunday_service');
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
    verses: '4V',
    prelude: '',
    interlude: '',
    notes: '',
    isOffertory: false,
  });

  // State: Run-Sheet Item Modal
  const [showRunSheetModal, setShowRunSheetModal] = useState(false);
  const [editingRunSheetIndex, setEditingRunSheetIndex] = useState<number | null>(null);
  const [runSheetForm, setRunSheetForm] = useState<RunSheetItem>({
    id: '',
    time: '08:30 to 08:35',
    durationMinutes: 5,
    program: '',
    assignedTo: '',
    place: 'Main Hall',
    notes: ''
  });

  // Load church data
  useEffect(() => {
    loadData();
  }, [activeChurch]);

  const loadData = async () => {
    if (!activeChurch?.id) return;
    setLoading(true);
    try {
      const [fetchedPlans, members] = await Promise.all([
        ServiceRosterService.getServicePlans(activeChurch.id),
        FirestoreService.getAllMembers()
      ]);
      setPlans(fetchedPlans);
      setChurchMembers(members);
      if (fetchedPlans.length > 0 && !selectedPlan) {
        setSelectedPlan(fetchedPlans[0]);
      }
    } catch (e) {
      console.error('Error loading service planner data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Plan in Firestore
  const handleSavePlanDetails = async () => {
    if (!activeChurch?.id) return;
    if (!planFormTitle.trim() || !planFormDate.trim()) {
      Alert.alert('Required', 'Please specify a service title and date.');
      return;
    }
    setSavingPlan(true);
    try {
      const isNew = !selectedPlan?.id;
      const basePlan: Partial<ServicePlan> = selectedPlan?.id
        ? {
            ...selectedPlan,
            date: planFormDate,
            serviceTitle: planFormTitle,
            serviceType: planFormType,
          }
        : {
            churchId: activeChurch?.id || '',
            churchName: activeChurch?.name || 'Our Church',
            date: planFormDate,
            serviceTitle: planFormTitle,
            serviceType: planFormType,
            status: 'draft',
            assignments: {},
            sermon: {
              title: 'Be Holy',
              code: 'A1019',
              keyVerses: 'Lev 19:2',
              speaker: 'Pastor',
              translation: ''
            },
            setlist: [],
            runSheet: []
          };

      const churchId = activeChurch?.id || '';
      const savedId = await ServiceRosterService.saveServicePlan(churchId, basePlan);
      setShowCreatePlanModal(false);
      await loadData();
      const updated = await ServiceRosterService.getServicePlanById(activeChurch.id, savedId);
      if (updated) setSelectedPlan(updated);
      Alert.alert('Success', isNew ? 'New service schedule created!' : 'Service updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save service.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Quick Seed Sample Data (like Bethesda Church screenshots) for instant demo
  const handleLoadSampleBethesdaData = async () => {
    if (!activeChurch?.id) return;
    Alert.alert(
      'Load Bethesda Roster Demo?',
      'This will populate this schedule with the exact roles, songs, AV team, and run sheet seen in your church photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Demo Data',
          onPress: async () => {
            const sampleAssignments: Record<string, string> = {
              singer_1: 'Richard',
              singer_2: 'Amulya',
              singer_3: 'Dheeraj Paul',
              acoustic: 'Richard',
              keyboard: 'Lina',
              electric: 'Samuel N',
              bass: 'John Paul',
              drums: 'Shekar P',
              sound_foh: 'Akhil / Nikhil',
              sound_stage: 'Stephen / Oliver',
              media_pc1: 'Usha Rani',
              media_pc2: 'Bhargavi',
              media_pc3: 'Akshaya',
              media_pc4: 'Priya / Shreyesh',
              cam_main: 'Sandhya',
              cam_right: 'Benny',
              cam_left: 'Zion',
              cam_gimbal: 'N/A',
              video_dir: 'Avinash',
              photo_cam: 'SS Paul',
              ss_beginners: 'All (as per need) - Practice for Kids Sunday',
              ss_primary: 'All (as per need) - Practice for Kids Sunday',
              ss_juniors: 'All (as per need) - Practice for Kids Sunday',
              ss_seniors: 'All (as per need) - Practice for Kids Sunday',
              ss_special_needs: 'Lina, Anvitha, Naysa, Jyothi, Divya',
              fmh: 'Kranthi, Siddhath, Pooja, Emmanuel',
              ushering: 'Lakshmi, Jyothi, Ravi K, Peddababu',
              op_prayer: 'Ps. Raju',
              cl_prayer: 'Pas. John Paul',
              devotion: 'Richard',
              communion: 'N/A',
              announcements: 'Richard',
            };

            const sampleSetlist: SetlistItem[] = [
              {
                id: '1',
                title: 'Hallelujah Yesu Prabhun',
                ledBy: 'Amulya',
                key: 'F',
                timeSignature: '4/4',
                tempo: '100',
                verses: '4V',
                prelude: 'Acoustic + Drum',
                interlude: 'Keys + Elec (Alt)',
                notes: "Celebrate God's power, strength, and salvation"
              },
              {
                id: '2',
                title: 'Yesu Raajuga',
                ledBy: 'Richard',
                key: 'F#m',
                timeSignature: '2/4',
                tempo: '128',
                verses: '5V',
                prelude: 'Elec',
                interlude: 'Keys / Elec Alt',
                notes: 'Prep for 2nd Coming'
              },
              {
                id: '3',
                title: 'Papanni Pogotti',
                ledBy: 'Amulya',
                key: 'D',
                timeSignature: '4/4',
                tempo: '138',
                verses: '2V',
                prelude: 'Acoustic',
                interlude: 'Elec + Keys (Alt)',
                notes: 'God just wants our heart'
              },
              {
                id: '4',
                title: 'Parishuddha Parishuddha',
                ledBy: 'Amulya',
                key: 'G',
                timeSignature: '7/8',
                tempo: '102',
                verses: '5V',
                prelude: 'None',
                interlude: 'None',
                notes: 'Praise and Adoration'
              },
              {
                id: '5',
                title: 'Priyuda Nee Prema',
                ledBy: 'Amulya',
                key: 'G',
                timeSignature: '3/4',
                tempo: '130',
                verses: '3V',
                prelude: 'Keys',
                interlude: 'Elec + Keys (Alt)',
                notes: 'You washed us clean with your Blood'
              },
              {
                id: '6',
                title: 'Ee Tharam (Offertory)',
                ledBy: 'Amulya',
                key: 'F#m',
                timeSignature: '4/4',
                tempo: '130',
                verses: '2V',
                prelude: 'Elec',
                interlude: 'Elec + Keys',
                notes: 'Giving our best to God',
                isOffertory: true
              }
            ];

            const sampleRunSheet: RunSheetItem[] = [
              { id: '1', time: '07:00 to 08:15', durationMinutes: 75, program: 'Setups & practices', assignedTo: 'All Band & Tech' },
              { id: '2', time: '08:15 to 08:30', durationMinutes: 15, program: 'Devotion & prayers', assignedTo: 'Richard' },
              { id: '3', time: '08:30 to 08:35', durationMinutes: 5, program: 'Opening Prayer', assignedTo: 'Ps. Raju' },
              { id: '4', time: '08:35 to 09:10', durationMinutes: 35, program: 'Praise & Worship', assignedTo: 'Amulya & Team' },
              { id: '5', time: '09:10 to 09:15', durationMinutes: 5, program: 'Special Prayer', assignedTo: 'Pas. John Paul' },
              { id: '6', time: '09:15 to 10:00', durationMinutes: 45, program: 'Sermon: Be Holy (Lev 19:2)', assignedTo: 'Ps. Prakash' },
              { id: '7', time: '10:00 to 10:10', durationMinutes: 10, program: 'Announcements & Offertory', assignedTo: 'Richard' },
              { id: '8', time: '10:10 to 10:15', durationMinutes: 5, program: 'Closing Prayer & Benediction', assignedTo: 'Pas. John Paul' },
            ];

            const updated: ServicePlan = {
              ...(selectedPlan || {}),
              id: selectedPlan?.id || '',
              churchId: activeChurch?.id || '',
              churchName: activeChurch?.name || 'Our Church',
              date: selectedPlan?.date || '2026-09-27',
              serviceTitle: selectedPlan?.serviceTitle || '1st Service - Telugu',
              serviceType: 'sunday_service',
              status: 'published',
              assignments: sampleAssignments,
              sermon: {
                title: 'Be Holy',
                code: 'A1019',
                keyVerses: 'Lev 19:2',
                speaker: 'Ps. Prakash',
                translation: 'Sis. Jaya Prakash'
              },
              setlist: sampleSetlist,
              runSheet: sampleRunSheet,
              departments: DEFAULT_DEPARTMENTS
            };

            await ServiceRosterService.saveServicePlan(activeChurch.id, updated);
            await loadData();
            setSelectedPlan(updated);
            Alert.alert('Ready!', 'Bethesda Church Service Roster demo loaded successfully!');
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

  // Save Run-Sheet Item
  const handleSaveRunSheet = async () => {
    if (!selectedPlan || !activeChurch?.id) return;
    if (!runSheetForm.program.trim()) {
      Alert.alert('Required', 'Please enter a program/item title.');
      return;
    }
    let updated = [...(selectedPlan.runSheet || [])];
    if (editingRunSheetIndex !== null) {
      updated[editingRunSheetIndex] = { ...runSheetForm };
    } else {
      updated.push({ ...runSheetForm, id: Math.random().toString(36).substring(7) });
    }
    const updatedPlan = { ...selectedPlan, runSheet: updated };
    setSelectedPlan(updatedPlan);
    setShowRunSheetModal(false);
    await ServiceRosterService.saveServicePlan(activeChurch.id, {
      id: selectedPlan.id,
      runSheet: updated
    });
  };

  // Delete Run-Sheet Item
  const handleDeleteRunSheet = async (index: number) => {
    if (!selectedPlan || !activeChurch?.id) return;
    const updated = selectedPlan.runSheet.filter((_, i) => i !== index);
    setSelectedPlan({ ...selectedPlan, runSheet: updated });
    await ServiceRosterService.saveServicePlan(activeChurch.id, {
      id: selectedPlan.id,
      runSheet: updated
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

  return (
    <View style={styles.container}>
      {/* ── Top Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveTab(0)}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Service Operations & Roster
            </Text>
            <Text style={styles.headerSub}>
              {activeChurch?.name || 'Bethesda Church Hyderabad'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              setSelectedPlan(null);
              setPlanFormTitle('1st Service - Telugu');
              setPlanFormDate(new Date().toISOString().split('T')[0]);
              setShowCreatePlanModal(true);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.headerActionBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Plans Horizontal Selector Carousel ─────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.plansScroller}
          contentContainerStyle={styles.plansScrollerContent}
        >
          {plans.map((p, pIdx) => {
            const isSelected = selectedPlan?.id === p.id;
            return (
              <TouchableOpacity
                key={`plan_chip_${p.id || ''}_${pIdx}`}
                style={[
                  styles.planChip,
                  isSelected && styles.planChipActive
                ]}
                onPress={() => setSelectedPlan(p)}
              >
                <CalendarDays size={13} color={isSelected ? '#FFFFFF' : '#94A3B8'} />
                <Text
                  style={[
                    styles.planChipDate,
                    isSelected && styles.planChipDateActive
                  ]}
                >
                  {p.date}
                </Text>
                <Text
                  style={[
                    styles.planChipTitle,
                    isSelected && styles.planChipTitleActive
                  ]}
                  numberOfLines={1}
                >
                  {p.serviceTitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Active Service Sub-Nav Tabs ─────────────────────── */}
      {selectedPlan && (
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTab, activePlanTab === 'roster' && styles.subTabActive]}
            onPress={() => setActivePlanTab('roster')}
          >
            <Users size={16} color={activePlanTab === 'roster' ? '#0F4C5C' : '#64748B'} />
            <Text style={[styles.subTabTxt, activePlanTab === 'roster' && styles.subTabTxtActive]}>
              Team Roster
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, activePlanTab === 'setlist' && styles.subTabActive]}
            onPress={() => setActivePlanTab('setlist')}
          >
            <Music size={16} color={activePlanTab === 'setlist' ? '#0F4C5C' : '#64748B'} />
            <Text style={[styles.subTabTxt, activePlanTab === 'setlist' && styles.subTabTxtActive]}>
              Setlist Flow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, activePlanTab === 'runSheet' && styles.subTabActive]}
            onPress={() => setActivePlanTab('runSheet')}
          >
            <Clock size={16} color={activePlanTab === 'runSheet' ? '#0F4C5C' : '#64748B'} />
            <Text style={[styles.subTabTxt, activePlanTab === 'runSheet' && styles.subTabTxtActive]}>
              Run Sheet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, activePlanTab === 'export' && styles.subTabActive]}
            onPress={() => setActivePlanTab('export')}
          >
            <Share2 size={16} color={activePlanTab === 'export' ? '#0F4C5C' : '#64748B'} />
            <Text style={[styles.subTabTxt, activePlanTab === 'export' && styles.subTabTxtActive]}>
              Share Card
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main Content Body ──────────────────────────────── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F4C5C" />
          <Text style={styles.loadingTxt}>Loading church service schedules...</Text>
        </View>
      ) : !selectedPlan ? (
        <View style={styles.emptyContainer}>
          <CalendarDays size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Service Plan Selected</Text>
          <Text style={styles.emptySubtitle}>
            Create your first Sunday service or load the Bethesda Church preset demo.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleLoadSampleBethesdaData}
          >
            <Sparkles size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnTxt}>Load Bethesda Church Demo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* ────────────────────────────────────────────────────────
              TAB 1: TEAM ROSTER & DEPARTMENTS
             ──────────────────────────────────────────────────────── */}
          {activePlanTab === 'roster' && (
            <View>
              {/* Service Banner / Top Quick bar */}
              <View style={styles.serviceBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerDate}>{selectedPlan.date}</Text>
                  <Text style={styles.bannerTitle}>{selectedPlan.serviceTitle}</Text>
                </View>
                <TouchableOpacity
                  style={styles.demoLoadBtn}
                  onPress={handleLoadSampleBethesdaData}
                >
                  <Sparkles size={14} color="#0F4C5C" />
                  <Text style={styles.demoLoadBtnTxt}>Quick Preset</Text>
                </TouchableOpacity>
              </View>

              {/* 1. Worship Team & Set List Section */}
              <View style={styles.deptCard}>
                <View style={[styles.deptHeader, { backgroundColor: '#512E5F' }]}>
                  <Text style={styles.deptHeaderTitle}>Worship Team & Set List</Text>
                </View>
                <View style={styles.deptGrid}>
                  {[
                    { id: 'singer_1', label: 'Singer #1 / C' },
                    { id: 'keyboard', label: 'Keyboard' },
                    { id: 'singer_2', label: 'Singer #2 / L' },
                    { id: 'electric', label: 'Electric' },
                    { id: 'singer_3', label: 'Singer #3 / R' },
                    { id: 'bass', label: 'Bass' },
                    { id: 'acoustic', label: 'Acoustic' },
                    { id: 'drums', label: 'Drums' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridCell}
                      onPress={() => {
                        setAssigningRoleId(item.id);
                        setAssigningRoleName(item.label);
                        setShowMemberPickerModal(true);
                      }}
                    >
                      <Text style={styles.cellLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.cellValue,
                          !selectedPlan.assignments[item.id] && styles.cellPlaceholder
                        ]}
                        numberOfLines={1}
                      >
                        {selectedPlan.assignments[item.id] || 'Tap to assign'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mini Setlist Preview under Worship Team */}
                {selectedPlan.setlist && selectedPlan.setlist.length > 0 && (
                  <View style={styles.miniSetlistContainer}>
                    <View style={styles.miniSetlistHeader}>
                      <Text style={styles.miniSetlistTitle}>Scheduled Setlist</Text>
                      <TouchableOpacity onPress={() => setActivePlanTab('setlist')}>
                        <Text style={styles.miniSetlistLink}>View Details →</Text>
                      </TouchableOpacity>
                    </View>
                    {selectedPlan.setlist.map((s, idx) => (
                      <View key={`mini_song_${s.id || ''}_${idx}`} style={styles.miniSetlistRow}>
                        <Text style={styles.miniSongNum}>{idx + 1}.</Text>
                        <Text style={styles.miniSongTitle} numberOfLines={1}>{s.title}</Text>
                        <View style={styles.miniKeyBadge}>
                          <Text style={styles.miniKeyTxt}>{s.key || 'F'}</Text>
                        </View>
                        <Text style={styles.miniLedBy}>Led by {s.ledBy || 'Lead'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 2. Team BMW (Broadcast, Media, Worship & AV) Section */}
              <View style={styles.deptCard}>
                <View style={[styles.deptHeader, { backgroundColor: '#3D5A27' }]}>
                  <Text style={styles.deptHeaderTitle}>Team BMW (Audio, Media & Visuals)</Text>
                </View>
                <View style={styles.deptGrid}>
                  {[
                    { id: 'sound_foh', label: 'Sounds (FOH)' },
                    { id: 'cam_main', label: 'V. Camera (Main)' },
                    { id: 'sound_stage', label: 'Sounds (Stage)' },
                    { id: 'cam_right', label: 'V. Camera (Right)' },
                    { id: 'media_pc1', label: 'Media - PC1 (Live)' },
                    { id: 'cam_left', label: 'V. Camera (Left)' },
                    { id: 'media_pc2', label: 'Media - PC2 (CG)' },
                    { id: 'cam_gimbal', label: 'V. Camera (Gimbal)' },
                    { id: 'media_pc3', label: 'Media - PC3 (Lyrics)' },
                    { id: 'video_dir', label: 'Video Direction / Mix' },
                    { id: 'media_pc4', label: 'Media - PC4 (Stage)' },
                    { id: 'photo_cam', label: 'Photo Camera' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridCell}
                      onPress={() => {
                        setAssigningRoleId(item.id);
                        setAssigningRoleName(item.label);
                        setShowMemberPickerModal(true);
                      }}
                    >
                      <Text style={styles.cellLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.cellValue,
                          !selectedPlan.assignments[item.id] && styles.cellPlaceholder
                        ]}
                        numberOfLines={1}
                      >
                        {selectedPlan.assignments[item.id] || 'Tap to assign'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Sunday School Department */}
              <View style={styles.deptCard}>
                <View style={[styles.deptHeader, { backgroundColor: '#BA4A00' }]}>
                  <Text style={styles.deptHeaderTitle}>Sunday School & Kids Ministry</Text>
                </View>
                <View style={styles.deptColumn}>
                  {[
                    { id: 'ss_beginners', label: 'Beginners Class' },
                    { id: 'ss_primary', label: 'Primary Class' },
                    { id: 'ss_juniors', label: 'Juniors Class' },
                    { id: 'ss_seniors', label: 'Seniors Class' },
                    { id: 'ss_special_needs', label: 'Special Needs Crew' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.rowCell}
                      onPress={() => {
                        setAssigningRoleId(item.id);
                        setAssigningRoleName(item.label);
                        setShowMemberPickerModal(true);
                      }}
                    >
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.rowValue,
                          !selectedPlan.assignments[item.id] && styles.cellPlaceholder
                        ]}
                        numberOfLines={2}
                      >
                        {selectedPlan.assignments[item.id] || 'Tap to assign teachers & lesson'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. Hospitality & Liturgy (Others) */}
              <View style={styles.deptCard}>
                <View style={[styles.deptHeader, { backgroundColor: '#117864' }]}>
                  <Text style={styles.deptHeaderTitle}>Hospitality & Platform Ministers</Text>
                </View>
                <View style={styles.deptGrid}>
                  {[
                    { id: 'fmh', label: 'FMH (Hospitality)' },
                    { id: 'devotion', label: 'Devotion' },
                    { id: 'ushering', label: 'Ushering Team' },
                    { id: 'communion', label: 'Communion' },
                    { id: 'op_prayer', label: 'Opening Prayer' },
                    { id: 'cl_prayer', label: 'Closing Prayer' },
                    { id: 'announcements', label: 'Announcements' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridCell}
                      onPress={() => {
                        setAssigningRoleId(item.id);
                        setAssigningRoleName(item.label);
                        setShowMemberPickerModal(true);
                      }}
                    >
                      <Text style={styles.cellLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.cellValue,
                          !selectedPlan.assignments[item.id] && styles.cellPlaceholder
                        ]}
                        numberOfLines={1}
                      >
                        {selectedPlan.assignments[item.id] || 'Tap to assign'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 5. Sermon & Word Section */}
              <View style={styles.deptCard}>
                <View style={[styles.deptHeader, { backgroundColor: '#922B21' }]}>
                  <Text style={styles.deptHeaderTitle}>Sermon & Ministry of the Word</Text>
                </View>
                <View style={styles.sermonBox}>
                  <View style={styles.sermonRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.sermonLabel}>Sermon Title</Text>
                      <TextInput
                        style={styles.sermonInput}
                        value={selectedPlan.sermon?.title || ''}
                        placeholder="e.g. Be Holy"
                        onChangeText={t => {
                          const updated = {
                            ...selectedPlan,
                            sermon: { ...(selectedPlan.sermon || {}), title: t }
                          };
                          setSelectedPlan(updated as any);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.sermonLabel}>Code</Text>
                      <TextInput
                        style={styles.sermonInput}
                        value={selectedPlan.sermon?.code || ''}
                        placeholder="e.g. A1019"
                        onChangeText={t => {
                          const updated = {
                            ...selectedPlan,
                            sermon: { ...(selectedPlan.sermon || {}), code: t }
                          };
                          setSelectedPlan(updated as any);
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.sermonRow}>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.sermonLabel}>Key Scripture Verses</Text>
                      <TextInput
                        style={styles.sermonInput}
                        value={selectedPlan.sermon?.keyVerses || ''}
                        placeholder="e.g. Lev 19:2"
                        onChangeText={t => {
                          const updated = {
                            ...selectedPlan,
                            sermon: { ...(selectedPlan.sermon || {}), keyVerses: t }
                          };
                          setSelectedPlan(updated as any);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1.5, marginLeft: 10 }}>
                      <Text style={styles.sermonLabel}>Preacher / Speaker</Text>
                      <TextInput
                        style={styles.sermonInput}
                        value={selectedPlan.sermon?.speaker || ''}
                        placeholder="e.g. Ps. Prakash"
                        onChangeText={t => {
                          const updated = {
                            ...selectedPlan,
                            sermon: { ...(selectedPlan.sermon || {}), speaker: t }
                          };
                          setSelectedPlan(updated as any);
                        }}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.sermonLabel}>Translation Minister</Text>
                    <TextInput
                      style={styles.sermonInput}
                      value={selectedPlan.sermon?.translation || ''}
                      placeholder="e.g. Sis. Jaya Prakash"
                      onChangeText={t => {
                        const updated = {
                          ...selectedPlan,
                          sermon: { ...(selectedPlan.sermon || {}), translation: t }
                        };
                        setSelectedPlan(updated as any);
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveSermonBtn}
                    onPress={async () => {
                      if (!activeChurch?.id) return;
                      await ServiceRosterService.saveServicePlan(activeChurch.id, {
                        id: selectedPlan.id,
                        sermon: selectedPlan.sermon
                      });
                      Alert.alert('Saved', 'Sermon information updated.');
                    }}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.saveSermonBtnTxt}>Save Sermon Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB 2: SETLIST FLOW (MUSICAL METADATA)
             ──────────────────────────────────────────────────────── */}
          {activePlanTab === 'setlist' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Worship Setlist Flow</Text>
                  <Text style={styles.sectionSubtitle}>
                    Keys, BPM, Prelude & Musical Arrangements
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    setEditingSongIndex(null);
                    setSongForm({
                      id: '',
                      title: '',
                      ledBy: 'Amulya',
                      key: 'F',
                      timeSignature: '4/4',
                      tempo: '100',
                      verses: '4V',
                      prelude: 'Acoustic + Drum',
                      interlude: 'Keys + Elec (Alt)',
                      notes: 'Celebrate God’s power and salvation',
                      isOffertory: false,
                    });
                    setShowSongModal(true);
                  }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnTxt}>Add Song</Text>
                </TouchableOpacity>
              </View>

              {(!selectedPlan.setlist || selectedPlan.setlist.length === 0) ? (
                <View style={styles.emptyCard}>
                  <Music size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Songs in this Setlist</Text>
                  <Text style={styles.emptySubtitle}>
                    Add your songs with musical keys, tempo BPM, and band arrangements.
                  </Text>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleLoadSampleBethesdaData}
                  >
                    <Sparkles size={16} color="#0F4C5C" />
                    <Text style={styles.secondaryBtnTxt}>Load Sample Setlist</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                selectedPlan.setlist.map((song, index) => (
                  <View key={`song_card_${song.id || ''}_${index}`} style={styles.songCard}>
                    {song.isOffertory && (
                      <View style={styles.offertoryBadge}>
                        <Text style={styles.offertoryBadgeTxt}>OFFERTORY</Text>
                      </View>
                    )}
                    <View style={styles.songCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.songTitleTxt}>{song.title}</Text>
                        <Text style={styles.songLeaderTxt}>Leading: {song.ledBy || 'Lead'}</Text>
                      </View>
                      <View style={styles.songActions}>
                        <TouchableOpacity
                          style={styles.iconActionBtn}
                          onPress={() => {
                            setEditingSongIndex(index);
                            setSongForm({ ...song });
                            setShowSongModal(true);
                          }}
                        >
                          <Edit2 size={16} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconActionBtn}
                          onPress={() => handleDeleteSong(index)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Musical Parameters Grid */}
                    <View style={styles.musicalGrid}>
                      <View style={styles.musicalBadge}>
                        <Text style={styles.musicalBadgeLabel}>KEY</Text>
                        <Text style={styles.musicalBadgeVal}>{song.key || 'N/A'}</Text>
                      </View>
                      <View style={styles.musicalBadge}>
                        <Text style={styles.musicalBadgeLabel}>TIME.S</Text>
                        <Text style={styles.musicalBadgeVal}>{song.timeSignature || '4/4'}</Text>
                      </View>
                      <View style={styles.musicalBadge}>
                        <Text style={styles.musicalBadgeLabel}>TEMPO</Text>
                        <Text style={styles.musicalBadgeVal}>{song.tempo || '100'} BPM</Text>
                      </View>
                      <View style={styles.musicalBadge}>
                        <Text style={styles.musicalBadgeLabel}>VERSES</Text>
                        <Text style={styles.musicalBadgeVal}>{song.verses || '4V'}</Text>
                      </View>
                    </View>

                    {/* Arrangements */}
                    <View style={styles.arrangementBox}>
                      <View style={styles.arrRow}>
                        <Text style={styles.arrLabel}>Prelude:</Text>
                        <Text style={styles.arrVal}>{song.prelude || 'None'}</Text>
                      </View>
                      <View style={styles.arrRow}>
                        <Text style={styles.arrLabel}>Interlude:</Text>
                        <Text style={styles.arrVal}>{song.interlude || 'None'}</Text>
                      </View>
                      {song.notes ? (
                        <View style={styles.arrRow}>
                          <Text style={styles.arrLabel}>Notes:</Text>
                          <Text style={[styles.arrVal, { color: '#0F766E', fontWeight: '600' }]}>
                            {song.notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB 3: RUN SHEET (ORDER OF SERVICE TIMELINE)
             ──────────────────────────────────────────────────────── */}
          {activePlanTab === 'runSheet' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Order of Service (Run Sheet)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Minute-by-minute live cues & stage timing
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    setEditingRunSheetIndex(null);
                    setRunSheetForm({
                      id: '',
                      time: '08:30 to 08:35',
                      durationMinutes: 5,
                      program: '',
                      assignedTo: '',
                      place: 'Main Hall',
                      notes: ''
                    });
                    setShowRunSheetModal(true);
                  }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnTxt}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {(!selectedPlan.runSheet || selectedPlan.runSheet.length === 0) ? (
                <View style={styles.emptyCard}>
                  <Clock size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Timeline Items Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Define prayers, songs, announcements, and sermon durations.
                  </Text>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleLoadSampleBethesdaData}
                  >
                    <Sparkles size={16} color="#0F4C5C" />
                    <Text style={styles.secondaryBtnTxt}>Load Sample Run Sheet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.runSheetTable}>
                  <View style={styles.runSheetTableHeader}>
                    <Text style={[styles.thCell, { flex: 1.3 }]}>Time</Text>
                    <Text style={[styles.thCell, { width: 44, textAlign: 'center' }]}>Mins</Text>
                    <Text style={[styles.thCell, { flex: 2 }]}>Program</Text>
                    <Text style={[styles.thCell, { flex: 1.5 }]}>Assigned</Text>
                    <Text style={[styles.thCell, { width: 34 }]}></Text>
                  </View>

                  {selectedPlan.runSheet.map((item, idx) => (
                    <TouchableOpacity
                      key={`run_sheet_${item.id || ''}_${idx}`}
                      style={[
                        styles.runSheetRow,
                        idx % 2 === 1 && { backgroundColor: '#F8FAFC' }
                      ]}
                      onPress={() => {
                        setEditingRunSheetIndex(idx);
                        setRunSheetForm({ ...item });
                        setShowRunSheetModal(true);
                      }}
                    >
                      <Text style={[styles.tdCell, { flex: 1.3, fontWeight: '600', color: '#1E293B' }]}>
                        {item.time}
                      </Text>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeTxt}>{item.durationMinutes}m</Text>
                      </View>
                      <Text
                        style={[
                          styles.tdCell,
                          { flex: 2, fontWeight: item.program.includes('Sermon') ? '700' : '500', color: item.program.includes('Sermon') ? '#922B21' : '#334155' }
                        ]}
                        numberOfLines={1}
                      >
                        {item.program}
                      </Text>
                      <Text style={[styles.tdCell, { flex: 1.5, color: '#0F766E' }]} numberOfLines={1}>
                        {item.assignedTo || 'Unassigned'}
                      </Text>
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => handleDeleteRunSheet(idx)}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB 4: EXPORT & WHATSAPP CARD
             ──────────────────────────────────────────────────────── */}
          {activePlanTab === 'export' && (
            <View>
              <View style={styles.exportActionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportTitle}>Circulate Schedule to Church</Text>
                  <Text style={styles.exportSubtitle}>
                    1-Tap WhatsApp broadcast with full service details.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsAppShareBtn}
                  onPress={handleShareToWhatsApp}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.whatsAppShareBtnTxt}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {/* Visual Card Preview mimicking the church screenshot */}
              <View style={styles.cardPreviewBox}>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewChurchName}>
                      {selectedPlan.churchName || 'Bethesda Church Hyderabad'}
                    </Text>
                    <Text style={styles.previewScheduleTitle}>Church Service Schedule</Text>
                  </View>
                  <View style={styles.previewDateBadge}>
                    <Text style={styles.previewDateTxt}>{selectedPlan.date}</Text>
                    <Text style={styles.previewServiceTxt}>{selectedPlan.serviceTitle}</Text>
                  </View>
                </View>

                {/* Section 1: Worship */}
                <View style={styles.previewBarPurple}>
                  <Text style={styles.previewBarTxt}>Worship Team & Set List</Text>
                </View>
                <Text style={styles.previewBodyTxt}>
                  • Vocals: {selectedPlan.assignments['singer_1'] || '-'}, {selectedPlan.assignments['singer_2'] || '-'}, {selectedPlan.assignments['singer_3'] || '-'}
                </Text>
                <Text style={styles.previewBodyTxt}>
                  • Band: Keys ({selectedPlan.assignments['keyboard'] || '-'}), Elec ({selectedPlan.assignments['electric'] || '-'}), Bass ({selectedPlan.assignments['bass'] || '-'}), Drums ({selectedPlan.assignments['drums'] || '-'})
                </Text>

                {/* Section 2: BMW */}
                <View style={styles.previewBarGreen}>
                  <Text style={styles.previewBarTxt}>Team BMW (Broadcast & Media)</Text>
                </View>
                <Text style={styles.previewBodyTxt}>
                  • Sound FOH: {selectedPlan.assignments['sound_foh'] || '-'} | Stage: {selectedPlan.assignments['sound_stage'] || '-'}
                </Text>
                <Text style={styles.previewBodyTxt}>
                  • Media PC: Live ({selectedPlan.assignments['media_pc1'] || '-'}), Lyrics ({selectedPlan.assignments['media_pc3'] || '-'})
                </Text>

                {/* Section 3: Sunday School */}
                <View style={styles.previewBarOrange}>
                  <Text style={styles.previewBarTxt}>Sunday School</Text>
                </View>
                <Text style={styles.previewBodyTxt}>
                  • Lesson: {selectedPlan.assignments['ss_beginners'] || 'Practice for Kids Sunday'}
                </Text>

                {/* Section 4: Sermon */}
                <View style={styles.previewBarRed}>
                  <Text style={styles.previewBarTxt}>Sermon</Text>
                </View>
                <Text style={styles.previewBodyTxt}>
                  • "{selectedPlan.sermon?.title || 'Be Holy'}" ({selectedPlan.sermon?.code || 'A1019'}) - {selectedPlan.sermon?.speaker || 'Pastor'}
                </Text>
                {selectedPlan.sermon?.keyVerses && (
                  <Text style={styles.previewBodyTxt}>• Verses: {selectedPlan.sermon?.keyVerses}</Text>
                )}

                <View style={styles.previewFooter}>
                  <Text style={styles.previewFooterTxt}>WeChristian Church Operations System</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── MODAL: ASSIGN MEMBER TO ROLE ─────────────────────── */}
      <Modal
        visible={showMemberPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign to Role</Text>
                <Text style={styles.modalSub}>{assigningRoleName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMemberPickerModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Custom Free Text Input (For guests, visiting preachers or multiple people) */}
            <View style={styles.customInputBox}>
              <Text style={styles.customInputLabel}>Type Custom Name or Multiple People:</Text>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customTextInput}
                  placeholder="e.g. Richard / Akhil & Nikhil"
                  value={customAssigneeName}
                  onChangeText={setCustomAssigneeName}
                />
                <TouchableOpacity
                  style={styles.customAssignBtn}
                  onPress={() => {
                    if (customAssigneeName.trim()) {
                      handleAssignRole(customAssigneeName.trim());
                    }
                  }}
                >
                  <Text style={styles.customAssignBtnTxt}>Assign</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Church Members Directory Search */}
            <Text style={styles.memberPickerDivider}>— OR PICK REGISTERED MEMBER —</Text>
            <View style={styles.searchBar}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search church members..."
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
            </View>

            <ScrollView style={styles.membersList}>
              {filteredMembers.map((m, mIdx) => (
                <TouchableOpacity
                  key={`mem_${m.id || ''}_${mIdx}`}
                  style={styles.memberRow}
                  onPress={() => {
                    const name = m.name || m.firstName || 'Member';
                    handleAssignRole(name);
                  }}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarTxt}>
                      {(m.name || m.firstName || 'M').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.name || m.firstName}</Text>
                    {m.phone && <Text style={styles.memberPhone}>{m.phone}</Text>}
                  </View>
                  <ChevronRight size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: CREATE / EDIT SERVICE PLAN ────────────────── */}
      <Modal
        visible={showCreatePlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreatePlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Church Service</Text>
              <TouchableOpacity onPress={() => setShowCreatePlanModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.formLabel}>Service Title</Text>
              <TextInput
                style={styles.formInput}
                value={planFormTitle}
                placeholder="e.g. 1st Service - Telugu"
                onChangeText={setPlanFormTitle}
              />

              <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.formInput}
                value={planFormDate}
                placeholder="2026-09-27"
                onChangeText={setPlanFormDate}
              />

              <Text style={styles.formLabel}>Service Type</Text>
              <View style={styles.typeSelectorRow}>
                {[
                  { id: 'sunday_service', label: 'Sunday Service' },
                  { id: 'special_event', label: 'Special Event' },
                  { id: 'conference', label: 'Conference' }
                ].map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeBtn,
                      planFormType === t.id && styles.typeBtnActive
                    ]}
                    onPress={() => setPlanFormType(t.id as any)}
                  >
                    <Text
                      style={[
                        styles.typeBtnTxt,
                        planFormType === t.id && styles.typeBtnTxtActive
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                disabled={savingPlan}
                onPress={handleSavePlanDetails}
              >
                {savingPlan ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryModalBtnTxt}>Create Service Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ADD / EDIT SETLIST SONG ──────────────────── */}
      <Modal
        visible={showSongModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSongModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSongIndex !== null ? 'Edit Song' : 'Add Song to Setlist'}
              </Text>
              <TouchableOpacity onPress={() => setShowSongModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.formLabel}>Song Title</Text>
              <TextInput
                style={styles.formInput}
                value={songForm.title}
                placeholder="e.g. Hallelujah Yesu Prabhun"
                onChangeText={t => setSongForm({ ...songForm, title: t })}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Key</Text>
                  <TextInput
                    style={styles.formInput}
                    value={songForm.key}
                    placeholder="e.g. F, F#m, G"
                    onChangeText={t => setSongForm({ ...songForm, key: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Tempo (BPM)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={songForm.tempo}
                    placeholder="e.g. 100, 128"
                    onChangeText={t => setSongForm({ ...songForm, tempo: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Time Sig</Text>
                  <TextInput
                    style={styles.formInput}
                    value={songForm.timeSignature}
                    placeholder="4/4, 3/4"
                    onChangeText={t => setSongForm({ ...songForm, timeSignature: t })}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.formLabel}>Worship Leader · ఆరాధన నాయకుడు</Text>
                <TextInput
                  style={styles.formInput}
                  value={songForm.ledBy}
                  placeholder="e.g. Amulya, Richard or member name"
                  onChangeText={t => setSongForm({ ...songForm, ledBy: t })}
                />
                {/* Member suggestions / quick leader chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {['Amulya', 'Richard', ...churchMembers.slice(0, 3).map(m => m.name || m.firstName).filter(n => n && n !== 'Amulya' && n !== 'Richard')].map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: songForm.ledBy === name ? '#0F4C5C' : '#F1F5F9', borderWidth: 1, borderColor: songForm.ledBy === name ? '#0F4C5C' : '#CBD5E1' }]}
                      onPress={() => setSongForm({ ...songForm, ledBy: name })}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: songForm.ledBy === name ? '#FFFFFF' : '#475569' }}>
                        🎤 {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.formLabel}>Verses</Text>
                <TextInput
                  style={styles.formInput}
                  value={songForm.verses}
                  placeholder="e.g. 4V, 5V"
                  onChangeText={t => setSongForm({ ...songForm, verses: t })}
                />
              </View>

              {/* Prelude with Suggestion Chips */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.formLabel}>Prelude (Instruments entering)</Text>
                <TextInput
                  style={styles.formInput}
                  value={songForm.prelude}
                  placeholder="e.g. Acoustic + Drum"
                  onChangeText={t => setSongForm({ ...songForm, prelude: t })}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6 }}>
                  {PRELUDE_SUGGESTIONS.map(sug => {
                    const isSelected = songForm.prelude === sug;
                    return (
                      <TouchableOpacity
                        key={sug}
                        style={[{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: isSelected ? '#0D9488' : '#F0FDFA', borderWidth: 1, borderColor: isSelected ? '#0D9488' : '#CCFBF1' }]}
                        onPress={() => setSongForm({ ...songForm, prelude: sug })}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#0F766E' }}>
                          🎵 {sug}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Interlude with Suggestion Chips */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.formLabel}>Interlude Arrangement</Text>
                <TextInput
                  style={styles.formInput}
                  value={songForm.interlude}
                  placeholder="e.g. Keys + Elec (Alt)"
                  onChangeText={t => setSongForm({ ...songForm, interlude: t })}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6 }}>
                  {INTERLUDE_SUGGESTIONS.map(sug => {
                    const isSelected = songForm.interlude === sug;
                    return (
                      <TouchableOpacity
                        key={sug}
                        style={[{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: isSelected ? '#2563EB' : '#EFF6FF', borderWidth: 1, borderColor: isSelected ? '#2563EB' : '#DBEAFE' }]}
                        onPress={() => setSongForm({ ...songForm, interlude: sug })}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#1D4ED8' }}>
                          🎸 {sug}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Spiritual Notes & Ministry Focus with Presets */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.formLabel}>Spiritual Notes & Ministry Focus</Text>
                  {songForm.notes ? (
                    <TouchableOpacity onPress={() => setSongForm({ ...songForm, notes: '' })}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Clear Notes</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.formInput, { height: 64, textAlignVertical: 'top', paddingTop: 8 }]}
                  multiline
                  value={songForm.notes}
                  placeholder="e.g. Celebrate God's power, strength, and salvation"
                  onChangeText={t => setSongForm({ ...songForm, notes: t })}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6 }}>
                  {NOTES_SUGGESTIONS.map(sug => {
                    const isAdded = (songForm.notes || '').includes(sug);
                    return (
                      <TouchableOpacity
                        key={sug}
                        style={[{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: isAdded ? '#F59E0B' : '#FEF3C7', borderWidth: 1, borderColor: isAdded ? '#D97706' : '#FDE68A' }]}
                        onPress={() => {
                          if (!songForm.notes.trim()) setSongForm({ ...songForm, notes: sug });
                          else if (!songForm.notes.includes(sug)) setSongForm({ ...songForm, notes: `${songForm.notes} • ${sug}` });
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isAdded ? '#FFFFFF' : '#92400E' }}>
                          {isAdded ? '✓ ' : '+ '}{sug}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleSaveSong}>
              <Text style={styles.primaryModalBtnTxt}>Save Song to Setlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ADD / EDIT RUN SHEET ITEM ────────────────── */}
      <Modal
        visible={showRunSheetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRunSheetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRunSheetIndex !== null ? 'Edit Timeline Item' : 'Add Order of Service Item'}
              </Text>
              <TouchableOpacity onPress={() => setShowRunSheetModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.formLabel}>Time Window</Text>
              <TextInput
                style={styles.formInput}
                value={runSheetForm.time}
                placeholder="e.g. 08:30 to 08:35"
                onChangeText={t => setRunSheetForm({ ...runSheetForm, time: t })}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Duration (Minutes)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={String(runSheetForm.durationMinutes)}
                    keyboardType="numeric"
                    placeholder="5"
                    onChangeText={t =>
                      setRunSheetForm({
                        ...runSheetForm,
                        durationMinutes: parseInt(t, 10) || 5
                      })
                    }
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.formLabel}>Location / Place</Text>
                  <TextInput
                    style={styles.formInput}
                    value={runSheetForm.place || ''}
                    placeholder="Main Hall, 1F Church"
                    onChangeText={t => setRunSheetForm({ ...runSheetForm, place: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Program / Item Title</Text>
              <TextInput
                style={styles.formInput}
                value={runSheetForm.program}
                placeholder="e.g. Opening Prayer / Sermon / Worship"
                onChangeText={t => setRunSheetForm({ ...runSheetForm, program: t })}
              />

              <Text style={styles.formLabel}>Assigned Minister / Team</Text>
              <TextInput
                style={styles.formInput}
                value={runSheetForm.assignedTo}
                placeholder="e.g. Jasper / CA Richard Wesley"
                onChangeText={t => setRunSheetForm({ ...runSheetForm, assignedTo: t })}
              />

              <TouchableOpacity style={styles.primaryModalBtn} onPress={handleSaveRunSheet}>
                <Text style={styles.primaryModalBtnTxt}>Save Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9'
  },
  header: {
    backgroundColor: '#0F4C5C',
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    paddingHorizontal: 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  headerSub: {
    color: '#99F6E4',
    fontSize: 12.5,
    marginTop: 2
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E7490',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  headerActionBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  plansScroller: {
    marginTop: 14
  },
  plansScrollerContent: {
    gap: 8
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  planChipActive: {
    backgroundColor: '#FFFFFF'
  },
  planChipDate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11.5,
    fontWeight: '700'
  },
  planChipDateActive: {
    color: '#0F4C5C'
  },
  planChipTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600'
  },
  planChipTitleActive: {
    color: '#0F4C5C',
    fontWeight: '800'
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  subTabActive: {
    borderBottomColor: '#0F4C5C'
  },
  subTabTxt: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600'
  },
  subTabTxtActive: {
    color: '#0F4C5C',
    fontWeight: '700'
  },
  scrollBody: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40
  },
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  bannerDate: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase'
  },
  bannerTitle: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2
  },
  demoLoadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  demoLoadBtnTxt: {
    color: '#0F4C5C',
    fontSize: 12,
    fontWeight: '700'
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  deptHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  deptHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6
  },
  gridCell: {
    width: '50%',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  cellLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cellValue: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2
  },
  cellPlaceholder: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '400'
  },
  deptColumn: {
    padding: 8
  },
  rowCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  rowLabel: {
    color: '#BA4A00',
    fontSize: 12,
    fontWeight: '700'
  },
  rowValue: {
    color: '#1E293B',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18
  },
  miniSetlistContainer: {
    backgroundColor: '#FDF4FF',
    borderTopWidth: 1,
    borderTopColor: '#F0ABFC',
    padding: 10
  },
  miniSetlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  miniSetlistTitle: {
    color: '#701A75',
    fontSize: 12,
    fontWeight: '700'
  },
  miniSetlistLink: {
    color: '#A21CAF',
    fontSize: 11.5,
    fontWeight: '700'
  },
  miniSetlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 6
  },
  miniSongNum: {
    color: '#86198F',
    fontWeight: '700',
    fontSize: 12,
    width: 16
  },
  miniSongTitle: {
    color: '#1E293B',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1
  },
  miniKeyBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  miniKeyTxt: {
    color: '#6B21A8',
    fontSize: 10.5,
    fontWeight: '800'
  },
  miniLedBy: {
    color: '#64748B',
    fontSize: 11
  },
  sermonBox: {
    padding: 12
  },
  sermonRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  sermonLabel: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4
  },
  sermonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1E293B'
  },
  saveSermonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#922B21',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6
  },
  saveSermonBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4C5C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  addBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700'
  },
  songCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  offertoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6
  },
  offertoryBadgeTxt: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800'
  },
  songCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  songTitleTxt: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700'
  },
  songLeaderTxt: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  songActions: {
    flexDirection: 'row',
    gap: 6
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  musicalGrid: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8
  },
  musicalBadge: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  musicalBadgeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700'
  },
  musicalBadgeVal: {
    color: '#0F4C5C',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2
  },
  arrangementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8
  },
  arrRow: {
    flexDirection: 'row',
    marginVertical: 2
  },
  arrLabel: {
    width: 75,
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700'
  },
  arrVal: {
    flex: 1,
    color: '#334155',
    fontSize: 11.5
  },
  runSheetTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  runSheetTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F4C5C',
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  thCell: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  runSheetRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tdCell: {
    fontSize: 12.5
  },
  durationBadge: {
    width: 44,
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6
  },
  durationBadgeTxt: {
    color: '#0369A1',
    fontWeight: '700',
    fontSize: 11
  },
  exportActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  exportTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800'
  },
  exportSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  whatsAppShareBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  cardPreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  previewHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#922B21',
    paddingBottom: 8,
    marginBottom: 10
  },
  previewChurchName: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800'
  },
  previewScheduleTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600'
  },
  previewDateBadge: {
    backgroundColor: '#922B21',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center'
  },
  previewDateTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  previewServiceTxt: {
    color: '#FEE2E2',
    fontWeight: '600',
    fontSize: 10
  },
  previewBarPurple: {
    backgroundColor: '#512E5F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4
  },
  previewBarGreen: {
    backgroundColor: '#3D5A27',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 4
  },
  previewBarOrange: {
    backgroundColor: '#BA4A00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 4
  },
  previewBarRed: {
    backgroundColor: '#922B21',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 4
  },
  previewBarTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  previewBodyTxt: {
    color: '#334155',
    fontSize: 11.5,
    marginVertical: 1,
    lineHeight: 16
  },
  previewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 14,
    paddingTop: 8,
    alignItems: 'center'
  },
  previewFooterTxt: {
    color: '#94A3B8',
    fontSize: 10
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4C5C',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6
  },
  secondaryBtnTxt: {
    color: '#0F4C5C',
    fontSize: 13,
    fontWeight: '700'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingTxt: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '88%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  modalTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800'
  },
  modalSub: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1
  },
  customInputBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  customInputLabel: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13
  },
  customAssignBtn: {
    backgroundColor: '#0F4C5C',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 6
  },
  customAssignBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5
  },
  memberPickerDivider: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 10
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B'
  },
  membersList: {
    maxHeight: 220
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  avatarTxt: {
    color: '#0369A1',
    fontWeight: '800',
    fontSize: 13
  },
  memberName: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '600'
  },
  memberPhone: {
    color: '#64748B',
    fontSize: 11.5
  },
  formLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B'
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  typeBtnActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#E6FFFA'
  },
  typeBtnTxt: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600'
  },
  typeBtnTxtActive: {
    color: '#0F4C5C',
    fontWeight: '700'
  },
  primaryModalBtn: {
    backgroundColor: '#0F4C5C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  primaryModalBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
