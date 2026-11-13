import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Settings,
  Filter,
  Users,
  Music,
  MapPin,
  Mic,
  BookOpen,
  ArrowRight,
  Copy,
  RotateCcw,
  Check,
  X,
  Share2,
  Bookmark,
  Award,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Search,
  FileText,
  Sliders,
  PlayCircle,
  ListOrdered,
  Timer,
  Send,
  RefreshCw,
  Radio,
  Tv,
  Printer,
  Download,
  BarChart2,
  AlertTriangle
} from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { formatDateMonthYear, formatTimeTo12Hour } from '../../utils/DateUtils';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { WorshipSong } from '../../services/FirestoreService';
import ServiceRosterService, {
  getTeamDefaultRank,
  CUSTOM_ACTIVITY_CATEGORY_PRESETS,
} from '../../services/ServiceRosterService';
import {
  ServicePlan,
  ServiceStatus,
  ServiceType,
  RunSheetItem,
  SetlistItem,
  ActivityCategory,
  ActivityCategoryDef,
  ServiceTemplate,
  MinistryTeam,
  MemberSkillRecord,
  ServiceAssignmentQueue,
  CandidateEntry,
  ServiceRehearsal,
  VolunteerAttendanceRecord,
  RosterAnalyticsData,
  VolunteerServingStat,
  SongUsageStat
} from '../../types/serviceRoster';

const { width } = Dimensions.get('window');

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  sunday_worship: 'Sunday Worship',
  holy_communion: 'Holy Communion',
  bible_study: 'Bible Study',
  fasting_prayer: 'Fasting Prayer',
  christmas_celebration: 'Christmas Celebration',
  easter_service: 'Easter Service',
  special_meeting: 'Special Meeting',
  youth_service: 'Youth Service',
  prayer_meeting: 'Prayer Meeting',
  other: 'Special Service'
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  preparation: { bg: '#F3F4F6', text: '#4B5563' },
  starting_prayer: { bg: '#FEF3C7', text: '#92400E' },
  opening_song: { bg: '#EDE9FE', text: '#5B21B6' },
  worship_songs: { bg: '#FDF2F8', text: '#9D174D' },
  music: { bg: '#E0E7FF', text: '#3730A3' },
  bible_reading: { bg: '#E0F2FE', text: '#0369A1' },
  offering: { bg: '#ECFDF5', text: '#065F46' },
  announcements: { bg: '#FFFBEB', text: '#B45309' },
  sermon: { bg: '#FEF3C7', text: '#92400E' },
  communion: { bg: '#FCE7F3', text: '#831843' },
  special_performance: { bg: '#F5F3FF', text: '#6D28D9' },
  closing_prayer: { bg: '#FEF2F2', text: '#991B1B' },
  benediction: { bg: '#F0FDF4', text: '#166534' },
  break: { bg: '#F3F4F6', text: '#6B7280' },
  other: { bg: '#F1F5F9', text: '#334155' }
};

const SKILL_CATEGORIES = [
  { id: 'all', label: 'All Skills' },
  { id: 'pending', label: 'Pending Approvals' },
  { id: 'music', label: 'Music & Band' },
  { id: 'worship', label: 'Worship & Choir' },
  { id: 'technical', label: 'Audio & Media' },
  { id: 'church_ministry', label: 'Church Ministry' }
];

const STANDARD_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Em', 'Am', 'Dm', 'Bm'];

const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getSafeDateParts = (dateStr: string) => {
  if (!dateStr) return { day: '01', month: 'SUN' };
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    return {
      day: parts[2] || '01',
      month: (MONTH_NAMES[monthIdx] || 'SUN').toUpperCase()
    };
  }
  return { day: '01', month: 'SUN' };
};

export default function AdminServicePlanner({ navigation, routeParams }: any) {
  const insets = useSafeAreaInsets();
  const hookNavigation = useNavigation<any>();
  const stackNavigation = navigation || hookNavigation;
  const { isDark, colors } = useTheme();
  const screenBg = colors.background;
  const cardSurface = colors.surface;
  const secondarySurface = isDark ? '#0F172A' : '#F8FAFC';
  const primaryText = colors.text;
  const secondaryText = colors.textSecondary;
  const borderColor = colors.border;
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBorder = isDark ? '#334155' : '#CBD5E1';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';

  // Unified WeChristian2 Design System Tokens (Navy #1A2D5A, Gold #FBBF24, Emerald #059669, Crimson #C0392B)
  const navyBrand = '#1A2D5A';
  const goldAccent = '#FBBF24';
  const primaryBtnBg = isDark ? '#FBBF24' : '#1A2D5A';
  const primaryBtnText = isDark ? '#0F172A' : '#FFFFFF';
  const publishBtnBg = isDark ? '#10B981' : '#059669';
  const secondaryBtnBg = isDark ? '#1E293B' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? '#334155' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E2E8F0' : '#1E293B';
  const dangerBtnBg = isDark ? 'rgba(220, 38, 38, 0.14)' : '#FEF2F2';
  const dangerBtnBorder = isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA';
  const dangerBtnText = isDark ? '#F87171' : '#C0392B';

  const { activeChurch } = useChurch();
  const { member } = useAuth();
  const { setActiveTab, setTabByName } = useContext(AdminTabContext);

  const churchId = activeChurch?.id || '';

  // Navigation / Tab state: 'calendar', 'builder', 'setlist', 'queue', 'teams', 'skills', 'templates'
  const [activePlannerTab, setActivePlannerTab] = useState<'calendar' | 'builder' | 'setlist' | 'queue' | 'teams' | 'skills' | 'templates'>('calendar');

  const cachedPlansInit = ServiceRosterService.getCachedServicePlans(churchId);
  const cachedRosterMembers = FirestoreService.getCachedSync<any[]>('members_all', churchId);
  const cachedRosterSongs = FirestoreService.getWorshipSongsCachedSync(churchId);
  // Service Plans state
  const [plans, setPlans] = useState<ServicePlan[]>(cachedPlansInit || []);
  const [loading, setLoading] = useState(!cachedPlansInit);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(cachedPlansInit && cachedPlansInit.length > 0 ? cachedPlansInit[0] : null);

  // Church Members state
  const [churchMembers, setChurchMembers] = useState<any[]>(cachedRosterMembers || []);

  // Church Songs Library state (Phase 3)
  const [churchSongs, setChurchSongs] = useState<WorshipSong[]>(cachedRosterSongs || []);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songLibrarySearch, setSongLibrarySearch] = useState('');
  const [showSongPickerModal, setShowSongPickerModal] = useState(false);
  const [selectedSongIdsForBatch, setSelectedSongIdsForBatch] = useState<string[]>([]);
  const [addingBatchSongs, setAddingBatchSongs] = useState(false);
  const [showConfigureSongModal, setShowConfigureSongModal] = useState(false);
  const [selectedSongForSetlist, setSelectedSongForSetlist] = useState<WorshipSong | null>(null);
  const [editingSetlistIndex, setEditingSetlistIndex] = useState<number | null>(null);

  // Setlist Item form state (Phase 3)
  const [songKeyInput, setSongKeyInput] = useState('G');
  const [songBpmInput, setSongBpmInput] = useState('120');
  const [songTimeSigInput, setSongTimeSigInput] = useState('4/4');
  const [songDurationInput, setSongDurationInput] = useState('6');
  const [songLeaderInput, setSongLeaderInput] = useState('');
  const [songKeyboardInput, setSongKeyboardInput] = useState('');
  const [songAcousticInput, setSongAcousticInput] = useState('');
  const [songElectricInput, setSongElectricInput] = useState('');
  const [songBassInput, setSongBassInput] = useState('');
  const [songDrumsInput, setSongDrumsInput] = useState('');
  const [songNotesInput, setSongNotesInput] = useState('');
  const [savingSetlistSong, setSavingSetlistSong] = useState(false);

  // Setlist Lyrics Modal (Phase 3)
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [viewingLyricsSong, setViewingLyricsSong] = useState<any>(null);

  // Ministry Teams state (Phase 2)
  const [ministryTeams, setMinistryTeams] = useState<MinistryTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MinistryTeam | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamDescInput, setTeamDescInput] = useState('');
  const [teamColorInput, setTeamColorInput] = useState('#1A2D5A');
  const [teamLeaderId, setTeamLeaderId] = useState<string | undefined>(undefined);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);
  const [isSavingTeamOrder, setIsSavingTeamOrder] = useState(false);
  const [teamOrderFeedback, setTeamOrderFeedback] = useState<string | null>(null);

  // Member Skills state (Phase 2)
  const [memberSkills, setMemberSkills] = useState<MemberSkillRecord[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('all');
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [skillMemberId, setSkillMemberId] = useState('');
  const [skillCategory, setSkillCategory] = useState<'music' | 'worship' | 'technical' | 'church_ministry'>('music');
  const [skillNameInput, setSkillNameInput] = useState('Keyboard');
  const [skillProficiency, setSkillProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'lead'>('intermediate');
  const [savingSkill, setSavingSkill] = useState(false);

  // Assignment Queue & Auto-Replacement Cascade state (Phase 4)
  const [assignmentQueues, setAssignmentQueues] = useState<ServiceAssignmentQueue[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [showDispatchQueueModal, setShowDispatchQueueModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [targetRoleTitle, setTargetRoleTitle] = useState('');
  const [targetActivityId, setTargetActivityId] = useState<string | undefined>(undefined);
  const [targetActivityName, setTargetActivityName] = useState<string | undefined>(undefined);
  const [dispatchTimeoutHours, setDispatchTimeoutHours] = useState(24);
  const [ladderCandidates, setLadderCandidates] = useState<Array<{ candidateId: string; candidateName: string; candidatePhone?: string }>>([]);
  const [candidateRecommendations, setCandidateRecommendations] = useState<Array<{
    memberId: string;
    memberName: string;
    memberPhone?: string;
    matchScore: number;
    matchReasons: string[];
    isAvailable: boolean;
    availabilityReason?: string;
  }>>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [savingDispatchQueue, setSavingDispatchQueue] = useState(false);

  // Manual Override state
  const [overrideMemberId, setOverrideMemberId] = useState('');
  const [overrideMemberSearch, setOverrideMemberSearch] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Simulate Response state
  const [activeQueueForSimulate, setActiveQueueForSimulate] = useState<ServiceAssignmentQueue | null>(null);
  const [simulateAction, setSimulateAction] = useState<'accept' | 'decline'>('accept');
  const [simulateDeclineReason, setSimulateDeclineReason] = useState('Out of town for family engagement');
  const [submittingSimulate, setSubmittingSimulate] = useState(false);

  // Volunteer Attendance state (Phase 9)
  const [attendanceRecords, setAttendanceRecords] = useState<VolunteerAttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);


  // Run-Sheet Export state (Phase 9)
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [printingSheet, setPrintingSheet] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Service Creation Wizard Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<ServiceType>('sunday_worship');
  const [createDate, setCreateDate] = useState(() => {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    return nextSunday.toISOString().split('T')[0];
  });
  const [createStartTime, setCreateStartTime] = useState('10:00 AM');
  const [createEndTime, setCreateEndTime] = useState('12:00 PM');
  const [createLocation, setCreateLocation] = useState('');
  const [createPreacher, setCreatePreacher] = useState('');
  const [createTheme, setCreateTheme] = useState('');
  const [createScripture, setCreateScripture] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createRecurrence, setCreateRecurrence] = useState<'one_time' | 'weekly' | 'biweekly' | 'monthly'>('one_time');
  const [createOccurrencesCount, setCreateOccurrencesCount] = useState(4);
  const [selectedTemplateForNew, setSelectedTemplateForNew] = useState<string>('tpl_sunday_worship');
  const [savingService, setSavingService] = useState(false);

  // Created Service Success Modal Card State
  const [showCreatedSuccessModal, setShowCreatedSuccessModal] = useState(false);
  const [createdSuccessInfo, setCreatedSuccessInfo] = useState<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    preacher?: string;
    isRecurring: boolean;
    occurrencesCount?: number;
    recurrenceFrequency?: string;
    templateName?: string;
    planId: string;
    isEdit?: boolean;
  } | null>(null);

  // ─── Unified All-In-One Roster Form State ───
  const [createRunSheet, setCreateRunSheet] = useState<RunSheetItem[]>([]);
  const [createSetlist, setCreateSetlist] = useState<SetlistItem[]>([]);
  const [createAssignments, setCreateAssignments] = useState<Array<{
    id: string;
    roleTitle: string;
    activityId?: string;
    activityName?: string;
    assignedMemberId?: string;
    assignedMemberName?: string;
    assignedMemberPhone?: string;
    requiredSkill?: string;
    timeoutMinutes: number;
  }>>([]);
  const [responseTimeoutHours, setResponseTimeoutHours] = useState<number>(2);
  const [isEditingExistingPlan, setIsEditingExistingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Quick Sub-modals for Unified Form
  const [showAssignMemberModal, setShowAssignMemberModal] = useState(false);
  const [selectedDutyIndexForAssign, setSelectedDutyIndexForAssign] = useState<number | null>(null);
  const [assignMemberSearch, setAssignMemberSearch] = useState('');

  const [showAddActivityQuickModal, setShowAddActivityQuickModal] = useState(false);
  const [quickActTitle, setQuickActTitle] = useState('');
  const [quickActCategory, setQuickActCategory] = useState<ActivityCategory>('worship_songs');
  const [quickActDuration, setQuickActDuration] = useState('15');

  const [showAddDutyQuickModal, setShowAddDutyQuickModal] = useState(false);
  const [quickDutyTitle, setQuickDutyTitle] = useState('');
  const [quickDutySkill, setQuickDutySkill] = useState('');

  // Date and Time Picker state (Service Creation)
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  // Date and Time Picker state (Service Edit)
  const [isEditDatePickerVisible, setEditDatePickerVisible] = useState(false);
  const [isEditStartTimePickerVisible, setEditStartTimePickerVisible] = useState(false);

  // Activity Item Modal (Add / Edit)
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [actProgram, setActProgram] = useState('');
  const [actCategory, setActCategory] = useState<ActivityCategory>('worship_songs');
  const [actDuration, setActDuration] = useState('15');
  const [actResponsible, setActResponsible] = useState('');
  const [actResponsibleId, setActResponsibleId] = useState('');
  const [actTeam, setActTeam] = useState('');
  const [actTeamIds, setActTeamIds] = useState<string[]>([]);
  const [actShowAllMembers, setActShowAllMembers] = useState(false);
  const [actInstructions, setActInstructions] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [customCategories, setCustomCategories] = useState<ActivityCategoryDef[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColorIdx, setNewCategoryColorIdx] = useState(0);
  const [savingNewCategory, setSavingNewCategory] = useState(false);

  // Service Details Edit Modal
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<ServiceType>('sunday_worship');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [isEditEndTimePickerVisible, setEditEndTimePickerVisible] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editPreacher, setEditPreacher] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editScripture, setEditScripture] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Save Service as Reusable Template Modal
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Service Worship Band Modal (Whole Service Assignment)
  const [showBandModal, setShowBandModal] = useState(false);
  const [bandKeyboard, setBandKeyboard] = useState('');
  const [bandKeyboardId, setBandKeyboardId] = useState('');
  const [bandDrums, setBandDrums] = useState('');
  const [bandDrumsId, setBandDrumsId] = useState('');
  const [bandBass, setBandBass] = useState('');
  const [bandBassId, setBandBassId] = useState('');
  const [bandAcoustic, setBandAcoustic] = useState('');
  const [bandAcousticId, setBandAcousticId] = useState('');
  const [bandElectric, setBandElectric] = useState('');
  const [bandElectricId, setBandElectricId] = useState('');
  const [bandSound, setBandSound] = useState('');
  const [bandSoundId, setBandSoundId] = useState('');
  const [bandWorshipLeader, setBandWorshipLeader] = useState('');
  const [bandWorshipLeaderId, setBandWorshipLeaderId] = useState('');
  const [savingBand, setSavingBand] = useState(false);
  const [expandedInstrumentMembers, setExpandedInstrumentMembers] = useState<Record<string, boolean>>({});

  const parseSkillsList = (val: any): string[] => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  interface MusicianCandidate {
    id: string;
    name: string;
    phone?: string;
    isPrimary: boolean;
    isSecondary: boolean;
    isVerified: boolean;
    badge: string;
  }

  const getMusicianCandidates = (instrumentKey: string): MusicianCandidate[] => {
    const keywordMap: Record<string, string[]> = {
      keyboard: ['keyboard', 'piano', 'keys', 'synth', 'organ'],
      drums: ['drum', 'percussion', 'cajon', 'pad', 'octapad'],
      bass: ['bass'],
      acoustic: ['acoustic', 'guitar'],
      electric: ['electric', 'lead guitar'],
      sound: ['sound', 'audio', 'foh', 'stage audio', 'monitors', 'mixer'],
      worship_leader: ['worship leader', 'worship', 'vocal', 'singer', 'vocalist', 'songs', 'choir']
    };

    const keywords = keywordMap[instrumentKey] || [];
    if (keywords.length === 0) return [];

    const list: MusicianCandidate[] = [];

    churchMembers.forEach(m => {
      const pSkills = [
        ...parseSkillsList(m.primarySkill),
        ...(Array.isArray(m.primarySkills) ? m.primarySkills : [])
      ].map(s => String(s).toLowerCase().trim());

      const sSkills = [
        ...parseSkillsList(m.secondarySkill),
        ...(Array.isArray(m.secondarySkills) ? m.secondarySkills : [])
      ].map(s => String(s).toLowerCase().trim());

      const verifiedRecords = memberSkills.filter(
        s => s.memberId === m.id && s.verificationStatus === 'verified'
      );
      const vSkills = verifiedRecords.map(s => String(s.skillName || '').toLowerCase().trim());

      const isPrimary = pSkills.some(ps => keywords.some(k => ps.includes(k)));
      const isSecondary = sSkills.some(ss => keywords.some(k => ss.includes(k)));
      const isVerified = vSkills.some(vs => keywords.some(k => vs.includes(k)));

      if (isPrimary || isSecondary || isVerified) {
        let badge = '';
        if (isVerified && isPrimary) badge = '★ Primary (Verified)';
        else if (isPrimary) badge = '★ Primary';
        else if (isVerified && isSecondary) badge = '★ Secondary (Verified)';
        else if (isSecondary) badge = '★ Secondary';
        else if (isVerified) badge = '✓ Verified';

        list.push({
          id: m.id,
          name: m.name || m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Church Member',
          phone: m.phone || m.phoneNumber || m.mobile,
          isPrimary,
          isSecondary,
          isVerified,
          badge
        });
      }
    });

    return list.sort((a, b) => {
      const scoreA = (a.isVerified && a.isPrimary ? 40 : 0) + (a.isPrimary ? 30 : 0) + (a.isVerified && a.isSecondary ? 20 : 0) + (a.isSecondary ? 10 : 0) + (a.isVerified ? 5 : 0);
      const scoreB = (b.isVerified && b.isPrimary ? 40 : 0) + (b.isPrimary ? 30 : 0) + (b.isVerified && b.isSecondary ? 20 : 0) + (b.isSecondary ? 10 : 0) + (b.isVerified ? 5 : 0);
      return scoreB - scoreA;
    });
  };

  // Templates state
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Data Loading
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchPlans = async (): Promise<ServicePlan[]> => {
    try {
      if (plans.length === 0) setLoading(true);
      const data = await ServiceRosterService.getServicePlans(churchId);
      setPlans(data);
      if (data.length > 0) {
        if (!selectedPlan || !data.some(p => p.id === selectedPlan.id)) {
          setSelectedPlan(data[0]);
        } else {
          const fresh = data.find(p => p.id === selectedPlan.id);
          if (fresh) setSelectedPlan(fresh);
        }
      } else {
        setSelectedPlan(null);
      }
      return data;
    } catch (err) {
      console.error('Error loading service plans:', err);
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const list = await ServiceRosterService.getServiceTemplates(churchId);
      setTemplates(list);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchChurchMembers = async () => {
    try {
      const members = await FirestoreService.getAllMembers();
      setChurchMembers(members || []);
    } catch (err) {
      console.error('Error loading church members:', err);
    }
  };

  const fetchChurchSongs = async () => {
    try {
      setLoadingSongs(true);
      const songs = await FirestoreService.getWorshipSongs();
      setChurchSongs(songs || []);
    } catch (err) {
      console.error('Error loading church songs:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  const fetchMinistryTeams = async () => {
    try {
      setLoadingTeams(true);
      const teams = await ServiceRosterService.getMinistryTeams(churchId);
      setMinistryTeams(teams);
    } catch (err) {
      console.error('Error loading ministry teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchMemberSkills = async () => {
    try {
      setLoadingSkills(true);
      const skills = await ServiceRosterService.getMemberSkills(churchId);
      setMemberSkills(skills);
    } catch (err) {
      console.error('Error loading member skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchCustomCategories = async () => {
    try {
      const cats = await ServiceRosterService.getCustomActivityCategories(churchId);
      setCustomCategories(cats);
    } catch (err) {
      console.error('Error loading custom activity categories:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchTemplates();
    fetchChurchMembers();
    fetchChurchSongs();
    fetchMinistryTeams();
    fetchMemberSkills();
    fetchCustomCategories();
  }, [churchId]);

  useEffect(() => {
    const targetServiceId = routeParams?.serviceId;
    if (!targetServiceId || plans.length === 0) return;
    const match = plans.find((p) => p.id === targetServiceId);
    if (match) {
      setSelectedPlan(match);
      setActivePlannerTab('queue');
    }
  }, [routeParams?.serviceId, routeParams?.timestamp, plans]);

  // Realtime subscription for Assignment Queues on selected service (Phase 4)
  useEffect(() => {
    if (!selectedPlan?.id) {
      setAssignmentQueues([]);
      return;
    }
    setLoadingQueues(true);
    const unsubscribe = ServiceRosterService.listenAssignmentQueues(
      churchId,
      selectedPlan.id,
      (queues) => {
        setAssignmentQueues(queues);
        setLoadingQueues(false);
      }
    );
    return () => unsubscribe();
  }, [selectedPlan?.id, churchId]);

  // Realtime subscription for Volunteer Attendance on selected service (Phase 9)
  useEffect(() => {
    if (!selectedPlan?.id) {
      setAttendanceRecords([]);
      return;
    }
    setLoadingAttendance(true);
    const unsubscribe = ServiceRosterService.listenVolunteerAttendance(
      churchId,
      selectedPlan.id,
      (records) => {
        setAttendanceRecords(records);
        setLoadingAttendance(false);
      }
    );
    return () => unsubscribe();
  }, [selectedPlan?.id, churchId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
    fetchTemplates();
    fetchChurchMembers();
    fetchChurchSongs();
    fetchMinistryTeams();
    fetchMemberSkills();
    fetchCustomCategories();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtered Services, Skills & Songs
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.serviceType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.serviceTitle.toLowerCase().includes(q);
        const matchesPreacher = p.preacher?.toLowerCase().includes(q);
        const matchesDate = p.date.includes(q);
        if (!matchesTitle && !matchesPreacher && !matchesDate) return false;
      }
      return true;
    });
  }, [plans, statusFilter, typeFilter, searchQuery]);

  const filteredSkills = useMemo(() => {
    return memberSkills.filter(s => {
      if (skillCategoryFilter === 'pending') return s.verificationStatus === 'pending';
      if (skillCategoryFilter !== 'all' && s.category !== skillCategoryFilter) return false;
      return true;
    });
  }, [memberSkills, skillCategoryFilter]);

  const filteredLibrarySongs = useMemo(() => {
    if (!songLibrarySearch.trim()) return churchSongs;
    const q = songLibrarySearch.toLowerCase();
    return churchSongs.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.titleTe?.toLowerCase().includes(q) ||
      s.artist?.toLowerCase().includes(q)
    );
  }, [churchSongs, songLibrarySearch]);

  const filteredTeamMembers = useMemo(() => {
    if (!teamMemberSearch.trim()) return churchMembers;
    const q = teamMemberSearch.toLowerCase().trim();
    return churchMembers.filter(m => {
      const name = (m.name || `${m.firstName || ''} ${m.lastName || ''}`).toLowerCase();
      const phone = (m.phone || (m as any).phoneNumber || (m as any).mobile || '').toLowerCase();
      const skill = (m.primarySkill || m.userType || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || skill.includes(q);
    });
  }, [churchMembers, teamMemberSearch]);

  const filteredMinistryTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return ministryTeams;
    const q = teamSearchQuery.toLowerCase().trim();
    return ministryTeams.filter(team => {
      const name = (team.name || '').toLowerCase();
      const desc = (team.description || '').toLowerCase();
      const leader = (team.leaderName || '').toLowerCase();
      const memberMatch = (team.memberIds || []).some(mId => {
        const found = churchMembers.find(m => m.id === mId);
        const mName = (found?.name || `${found?.firstName || ''} ${found?.lastName || ''}`).toLowerCase();
        return mName.includes(q);
      });
      return name.includes(q) || desc.includes(q) || leader.includes(q) || memberMatch;
    });
  }, [ministryTeams, teamSearchQuery, churchMembers]);

  const getTeamMemberNames = (memberIds?: string[]): string[] => {
    if (!memberIds || memberIds.length === 0) return [];
    return memberIds
      .map(id => {
        const found = churchMembers.find(m => m.id === id);
        if (!found) return null;
        return found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || 'Member';
      })
      .filter((n): n is string => Boolean(n));
  };

  /**
   * Resolve MinistryTeam records for a RunSheet activity using explicit team IDs,
   * custom team names, or category/program defaults.
   */
  const resolveTeamsForActivity = (act: Partial<RunSheetItem>): MinistryTeam[] => {
    const explicitRefs = [
      ...(act.supportingTeamIds || []),
      ...(act.supportingTeamId ? [act.supportingTeamId] : []),
      ...(act.supportingTeam ? [act.supportingTeam] : []),
    ];
    const refsToUse = explicitRefs.length > 0
      ? explicitRefs
      : ServiceRosterService.getDefaultTeamIdsForActivity(act.category, act.program);
    return ServiceRosterService.resolveMatchingTeams(ministryTeams, refsToUse);
  };

  /**
   * Candidate quick-pick pool for Order Builder's Activity Modal:
   * prioritizes deduplicated members from selected Ministry Teams.
   */
  const activityCandidatePool = useMemo(() => {
    const selectedTeams = ministryTeams.filter(t => actTeamIds.includes(t.id));
    const poolMap = new Map<string, { member: any; teamNames: string[] }>();

    selectedTeams.forEach(team => {
      const teamPeopleIds = Array.from(
        new Set([...(team.leaderId ? [team.leaderId] : []), ...(team.memberIds || [])].filter(Boolean))
      );
      teamPeopleIds.forEach(pid => {
        const found = churchMembers.find(m => m.id === pid || m.uid === pid);
        if (!found) return;
        const existing = poolMap.get(found.id);
        if (existing) {
          if (team.name && !existing.teamNames.includes(team.name)) {
            existing.teamNames.push(team.name);
          }
        } else {
          poolMap.set(found.id, {
            member: found,
            teamNames: team.name ? [team.name] : []
          });
        }
      });
    });

    const teamMembers = Array.from(poolMap.values());
    const hasTeamPool = teamMembers.length > 0;
    const rawQuery = (!actResponsibleId && actResponsible.trim()) ? actResponsible.trim().toLowerCase() : '';

    let items = [...teamMembers];
    if (!hasTeamPool || actShowAllMembers) {
      churchMembers.forEach(m => {
        if (!poolMap.has(m.id) && m.status !== 'Left') {
          items.push({ member: m, teamNames: [] });
        }
      });
    }

    if (rawQuery) {
      const textMatches = items.filter(entry => {
        const mName = (entry.member.name || `${entry.member.firstName || ''} ${entry.member.lastName || ''}`).toLowerCase();
        return mName.includes(rawQuery);
      });
      if (textMatches.length > 0) {
        const rest = items.filter(entry => !textMatches.includes(entry));
        items = [...textMatches, ...rest];
      }
    }

    const capped = (!hasTeamPool && !actShowAllMembers && !rawQuery) ? items.slice(0, 10) : items;
    return {
      items: capped,
      selectedTeams,
      hasTeamPool
    };
  }, [churchMembers, ministryTeams, actTeamIds, actResponsible, actResponsibleId, actShowAllMembers]);

  /**
   * Combined list of church custom categories + built-in categories.
   */
  const allCategoryDefs = useMemo<ActivityCategoryDef[]>(() => {
    const builtIn: ActivityCategoryDef[] = Object.keys(CATEGORY_COLORS).map(key => ({
      id: key,
      label: key.replace(/_/g, ' '),
      bg: CATEGORY_COLORS[key].bg,
      text: CATEGORY_COLORS[key].text,
      isCustom: false,
    }));
    const builtInIds = new Set(builtIn.map(b => b.id));
    const uniqueCustom = customCategories.filter(c => c.id && !builtInIds.has(c.id));
    return [...uniqueCustom, ...builtIn];
  }, [customCategories]);

  const getCategoryDef = (categoryId?: string): ActivityCategoryDef => {
    const key = (categoryId || 'other').trim();
    const found = allCategoryDefs.find(c => c.id === key);
    if (found) return found;
    return {
      id: key,
      label: key.replace(/_/g, ' '),
      bg: CATEGORY_COLORS.other.bg,
      text: CATEGORY_COLORS.other.text,
      isCustom: false,
    };
  };

  const handleCreateCustomCategory = async (onSelectCat: (cat: ActivityCategory) => void) => {
    const clean = newCategoryName.trim();
    if (!clean) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    const candidateSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const existing = allCategoryDefs.find(
      c => c.id === candidateSlug || c.label.toLowerCase() === clean.toLowerCase()
    );
    if (existing) {
      onSelectCat(existing.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      return;
    }

    try {
      setSavingNewCategory(true);
      const chosenPreset = CUSTOM_ACTIVITY_CATEGORY_PRESETS[newCategoryColorIdx] || CUSTOM_ACTIVITY_CATEGORY_PRESETS[0];
      const created = await ServiceRosterService.addCustomActivityCategory(churchId, clean, chosenPreset);
      setCustomCategories(prev => [created, ...prev.filter(c => c.id !== created.id)]);
      onSelectCat(created.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add category.');
    } finally {
      setSavingNewCategory(false);
    }
  };

  const handleDeleteCustomCategory = (catDef: ActivityCategoryDef, selectedCat: ActivityCategory, onSelectCat: (cat: ActivityCategory) => void) => {
    if (!catDef.isCustom) return;
    Alert.alert(
      'Remove Custom Category',
      `Remove "${catDef.label}" from saved categories? Existing service items keep their label.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ServiceRosterService.deleteCustomActivityCategory(churchId, catDef.id);
              setCustomCategories(prev => prev.filter(c => c.id !== catDef.id));
              if (selectedCat === catDef.id) {
                onSelectCat('other');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove category.');
            }
          }
        }
      ]
    );
  };

  const renderActivityCategorySelector = (
    selectedCat: ActivityCategory,
    onSelectCat: (cat: ActivityCategory) => void
  ) => (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={[styles.fieldLabel, { color: primaryText, marginBottom: 0 }]}>Category</Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 14,
            backgroundColor: showNewCategoryInput ? inputBg : publishBtnBg,
            borderWidth: showNewCategoryInput ? 1 : 0,
            borderColor: inputBorder,
          }}
          onPress={() => {
            setShowNewCategoryInput(prev => !prev);
            setNewCategoryName('');
          }}
          activeOpacity={0.75}
        >
          {showNewCategoryInput ? (
            <X size={11} color={secondaryText} />
          ) : (
            <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
          )}
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: showNewCategoryInput ? secondaryText : '#FFFFFF',
          }}>
            {showNewCategoryInput ? 'Close' : 'New'}
          </Text>
        </TouchableOpacity>
      </View>

      {showNewCategoryInput && (
        <View style={{
          backgroundColor: inputBg,
          borderColor: publishBtnBg,
          borderWidth: 1,
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: primaryText, marginBottom: 6 }}>
            Add New Category
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: cardSurface,
                color: primaryText,
                borderColor: inputBorder,
                marginBottom: 8,
              }
            ]}
            placeholder="e.g. Baby Dedication, Testimony, Baptism..."
            placeholderTextColor="#94A3B8"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoFocus
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {CUSTOM_ACTIVITY_CATEGORY_PRESETS.map((preset, idx) => {
                const selectedColor = newCategoryColorIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setNewCategoryColorIdx(idx)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: preset.bg,
                      borderWidth: selectedColor ? 2 : 1,
                      borderColor: selectedColor ? preset.text : inputBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedColor && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: preset.text }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: inputBorder,
                }}
                onPress={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: secondaryText }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: publishBtnBg,
                  opacity: savingNewCategory ? 0.7 : 1,
                }}
                disabled={savingNewCategory}
                onPress={() => handleCreateCustomCategory(onSelectCat)}
              >
                {savingNewCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Add Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {allCategoryDefs.map(cat => {
          const isSelected = selectedCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categorySelectChip,
                isSelected && [styles.categorySelectChipActive, { backgroundColor: primaryBtnBg }],
                !isSelected && { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }
              ]}
              onPress={() => onSelectCat(cat.id)}
              onLongPress={() => cat.isCustom && handleDeleteCustomCategory(cat, selectedCat, onSelectCat)}
            >
              <Text style={[
                styles.categorySelectChipTxt,
                !isSelected && { color: secondaryText },
                isSelected && [styles.categorySelectChipTxtActive, { color: primaryBtnText }]
              ]}>
                {cat.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const pendingSkillsCount = useMemo(() => {
    return memberSkills.filter(s => s.verificationStatus === 'pending').length;
  }, [memberSkills]);

  const timelineValidation = useMemo(() => {
    if (!selectedPlan?.runSheet) return { isValid: true, overlaps: [], warnings: [] };
    return ServiceRosterService.validateTimeline(
      selectedPlan.runSheet,
      selectedPlan.startTime,
      selectedPlan.endTime
    );
  }, [selectedPlan]);

  // Total setlist worship duration
  const totalSetlistMinutes = useMemo(() => {
    if (!selectedPlan?.setlist) return 0;
    return selectedPlan.setlist.reduce((acc, curr) => acc + (curr.durationMinutes || 5), 0);
  }, [selectedPlan]);

  // Consolidated Volunteer Roster for Attendance (Phase 9)
  const serviceVolunteers = useMemo(() => {
    if (!selectedPlan) return [];
    const list: Array<{
      key: string;
      memberId: string;
      memberName: string;
      roleId: string;
      roleTitle: string;
      teamName: string;
      category?: string;
    }> = [];

    const seen = new Set<string>();

    // 1. RunSheet ministers & leaders
    (selectedPlan.runSheet || []).forEach(item => {
      if (item.responsiblePerson && item.responsiblePerson.trim()) {
        const memberId = item.responsibleMemberId || item.responsiblePerson;
        const key = `${item.id}_${memberId}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            key,
            memberId,
            memberName: item.responsiblePerson,
            roleId: item.id,
            roleTitle: item.program,
            teamName: item.supportingTeam || 'Runsheet Ministry',
            category: item.category
          });
        }
      }
    });

    // 2. Setlist Worship Leaders & Band musicians
    (selectedPlan.setlist || []).forEach((song, idx) => {
      if (song.ledBy && song.ledBy.trim()) {
        const memberId = song.ledByMemberId || song.ledBy;
        const key = `worship_lead_${memberId}_${song.id || idx}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            key,
            memberId,
            memberName: song.ledBy,
            roleId: `worship_lead_${song.id || idx}`,
            roleTitle: `Worship Lead (${song.title})`,
            teamName: 'Worship Team',
            category: 'worship_songs'
          });
        }
      }
      if (song.musicianAssignments) {
        Object.entries(song.musicianAssignments).forEach(([roleKey, assignment]) => {
          if (assignment?.memberName && assignment.memberName.trim()) {
            const memberId = assignment.memberId || assignment.memberName;
            const key = `band_${memberId}_${roleKey}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                key,
                memberId,
                memberName: assignment.memberName,
                roleId: `band_${roleKey}`,
                roleTitle: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
                teamName: 'Praise Band',
                category: 'music'
              });
            }
          }
        });
      }
    });

    // 3. Confirmed queue assignments
    assignmentQueues.forEach(q => {
      if (q.status === 'confirmed' && q.confirmedCandidateName) {
        const key = `queue_${q.roleId}_${q.confirmedCandidateId || q.confirmedCandidateName}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            key,
            memberId: q.confirmedCandidateId || q.confirmedCandidateName,
            memberName: q.confirmedCandidateName,
            roleId: q.roleId,
            roleTitle: q.roleTitle,
            teamName: 'Assigned Role'
          });
        }
      }
    });

    return list;
  }, [selectedPlan, assignmentQueues]);

  // Attendance summary statistics for selected service
  const attendanceStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;

    serviceVolunteers.forEach(v => {
      const rec = attendanceRecords.find(r =>
        (r.roleId === v.roleId && r.memberId === v.memberId) ||
        (r.memberName === v.memberName && r.roleTitle === v.roleTitle)
      );
      if (!rec) {
        unmarked++;
      } else if (rec.attendanceStatus === 'present') {
        present++;
      } else if (rec.attendanceStatus === 'late') {
        late++;
      } else if (rec.attendanceStatus === 'absent') {
        absent++;
      } else if (rec.attendanceStatus === 'excused') {
        excused++;
      } else {
        unmarked++;
      }
    });

    const total = serviceVolunteers.length;
    const turnoutRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return { total, present, late, absent, excused, unmarked, turnoutRate };
  }, [serviceVolunteers, attendanceRecords]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Service Plan Actions
  // ─────────────────────────────────────────────────────────────────────────────

  // Helper to format ISO YYYY-MM-DD to human readable string (e.g., "Sun, Nov 15, 2026")
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }
      }
    } catch {}
    return dateStr;
  };

  // Helper to format HH:mm (24h) to 12h readable time (e.g., "10:00 AM")
  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return 'Select Time';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
        }
      }
    } catch {}
    return timeStr;
  };

  const parseDateForPicker = (dateStr: string): Date => {
    try {
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) return dt;
        }
      }
    } catch {}
    return new Date();
  };

  const parseTimeForPicker = (timeStr: string): Date => {
    try {
      if (timeStr) {
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m)) {
            const dt = new Date();
            dt.setHours(h, m, 0, 0);
            return dt;
          }
        }
      }
    } catch {}
    return new Date();
  };

  const getDayOfWeekName = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
        return d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    } catch {}
    return 'Sunday';
  };

  const calculateRecurrencePreviewDates = (
    startDateStr: string,
    frequency: 'weekly' | 'biweekly' | 'monthly',
    count: number
  ): string[] => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const parts = (startDateStr || toLocalDate(new Date())).split('-').map(Number);
    const y = parts[0] || new Date().getFullYear();
    const m = parts[1] || (new Date().getMonth() + 1);
    const d = parts[2] || new Date().getDate();

    const dates: string[] = [];
    const total = Math.min(Math.max(count || 1, 1), 12);

    for (let i = 0; i < total; i++) {
      const cur = new Date(y, m - 1, d, 12, 0, 0);
      if (i > 0) {
        if (frequency === 'weekly') {
          cur.setDate(cur.getDate() + (i * 7));
        } else if (frequency === 'biweekly') {
          cur.setDate(cur.getDate() + (i * 14));
        } else if (frequency === 'monthly') {
          cur.setMonth(cur.getMonth() + i);
        }
      }
      dates.push(toLocalDate(cur));
    }
    return dates;
  };

  const recurrenceDayName = useMemo(() => getDayOfWeekName(createDate), [createDate]);

  const recurrenceCountOptions = useMemo(() => {
    if (createRecurrence === 'weekly') {
      return [
        { count: 2, label: '2 Weeks' },
        { count: 4, label: '4 Weeks (1 Mo)' },
        { count: 8, label: '8 Weeks (2 Mos)' },
        { count: 12, label: '12 Weeks (3 Mos)' },
      ];
    } else if (createRecurrence === 'biweekly') {
      return [
        { count: 2, label: '2 (1 Mo)' },
        { count: 4, label: '4 (2 Mos)' },
        { count: 6, label: '6 (3 Mos)' },
        { count: 8, label: '8 (4 Mos)' },
      ];
    } else {
      return [
        { count: 2, label: '2 Months' },
        { count: 3, label: '3 Months' },
        { count: 6, label: '6 Months' },
        { count: 12, label: '12 Months' },
      ];
    }
  }, [createRecurrence]);

  const previewRecurrenceDates = useMemo(() => {
    if (createRecurrence === 'one_time') return [];
    return calculateRecurrencePreviewDates(createDate, createRecurrence as any, createOccurrencesCount);
  }, [createDate, createRecurrence, createOccurrencesCount]);

  const handleConfirmCreateDate = (selectedDate: Date) => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    setCreateDate(`${y}-${m}-${d}`);
    setDatePickerVisible(false);
  };

  const handleConfirmCreateStartTime = (selectedTime: Date) => {
    const h = String(selectedTime.getHours()).padStart(2, '0');
    const m = String(selectedTime.getMinutes()).padStart(2, '0');
    setCreateStartTime(`${h}:${m}`);
    setStartTimePickerVisible(false);
  };

  const handleConfirmCreateEndTime = (selectedTime: Date) => {
    const h = String(selectedTime.getHours()).padStart(2, '0');
    const m = String(selectedTime.getMinutes()).padStart(2, '0');
    setCreateEndTime(`${h}:${m}`);
    setEndTimePickerVisible(false);
  };

  const handleConfirmEditDate = (selectedDate: Date) => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    setEditDate(`${y}-${m}-${d}`);
    setEditDatePickerVisible(false);
  };

  const handleConfirmEditStartTime = (selectedTime: Date) => {
    const h = String(selectedTime.getHours()).padStart(2, '0');
    const m = String(selectedTime.getMinutes()).padStart(2, '0');
    setEditStartTime(`${h}:${m}`);
    setEditStartTimePickerVisible(false);
  };

  const handleConfirmEditEndTime = (selectedTime: Date) => {
    const h = String(selectedTime.getHours()).padStart(2, '0');
    const m = String(selectedTime.getMinutes()).padStart(2, '0');
    setEditEndTime(`${h}:${m}`);
    setEditEndTimePickerVisible(false);
  };

  const DEFAULT_FORM_DUTIES = [
    { id: 'duty_preacher', roleTitle: 'Preacher / Speaker', requiredSkill: 'Preaching', timeoutMinutes: 120 },
    { id: 'duty_worship_lead', roleTitle: 'Worship Leader', requiredSkill: 'Worship Leading', timeoutMinutes: 120 },
    { id: 'duty_keyboard', roleTitle: 'Keyboardist / Pianist', requiredSkill: 'Keyboard', timeoutMinutes: 120 },
    { id: 'duty_guitar', roleTitle: 'Guitarist (Acoustic/Electric)', requiredSkill: 'Guitar', timeoutMinutes: 120 },
    { id: 'duty_drums', roleTitle: 'Drummer', requiredSkill: 'Drums', timeoutMinutes: 120 },
    { id: 'duty_sound', roleTitle: 'Sound & Audio Engineer', requiredSkill: 'Sound & Audio', timeoutMinutes: 120 },
    { id: 'duty_media', roleTitle: 'Media & Slide Projection', requiredSkill: 'Media & Projection', timeoutMinutes: 120 },
    { id: 'duty_livestream', roleTitle: 'Livestream Steward', requiredSkill: 'Livestream', timeoutMinutes: 120 },
    { id: 'duty_usher', roleTitle: 'Head Usher / Greeter', requiredSkill: 'Hospitality / Ushering', timeoutMinutes: 120 },
  ];

  const recalculateRunSheetTimes = (items: RunSheetItem[], startTime: string): RunSheetItem[] => {
    let cur = startTime || '10:00';
    return items.map((item, idx) => {
      const dur = item.durationMinutes || 10;
      const s = cur;
      const e = ServiceRosterService.addMinutesToTime(cur, dur);
      cur = e;
      return {
        ...item,
        order: idx + 1,
        startTime: s,
        endTime: e,
        durationMinutes: dur
      };
    });
  };

  const openCreateModal = () => {
    setCreateTitle('');
    setCreateType('sunday_worship');
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    const y = nextSunday.getFullYear();
    const m = String(nextSunday.getMonth() + 1).padStart(2, '0');
    const d = String(nextSunday.getDate()).padStart(2, '0');
    setCreateDate(`${y}-${m}-${d}`);
    setCreateStartTime('10:00 AM');
    setCreateEndTime('12:00 PM');
    setCreateLocation('');
    setCreatePreacher('');
    setCreateTheme('');
    setCreateScripture('');
    setCreateDescription('');
    setCreateRecurrence('one_time');
    setCreateOccurrencesCount(4);
    setSelectedTemplateForNew('tpl_sunday_worship');

    // Populate default run sheet from template
    const foundTpl = templates.find(t => t.id === 'tpl_sunday_worship') || templates[0];
    if (foundTpl && foundTpl.runSheetTemplate) {
      let cur = '10:00';
      const initialItems: RunSheetItem[] = foundTpl.runSheetTemplate.map((item, idx) => {
        const dur = item.durationMinutes || 10;
        const s = cur;
        const e = ServiceRosterService.addMinutesToTime(cur, dur);
        cur = e;
        return {
          ...item,
          id: `act_${Date.now()}_${idx}`,
          order: idx + 1,
          startTime: s,
          durationMinutes: dur,
          endTime: e,
          assignmentStatus: 'unassigned',
          completionStatus: 'pending'
        };
      });
      setCreateRunSheet(initialItems);
    } else {
      setCreateRunSheet([]);
    }

    setCreateSetlist([]);
    setCreateAssignments(DEFAULT_FORM_DUTIES.map(d => ({ ...d })));
    setResponseTimeoutHours(2);
    setIsEditingExistingPlan(false);
    setEditingPlanId(null);
    setShowCreateModal(true);
  };

  const openEditServiceInForm = (plan: ServicePlan) => {
    setCreateTitle(plan.serviceTitle || '');
    setCreateType(plan.serviceType || 'sunday_worship');
    setCreateDate(plan.date || '');
    setCreateStartTime(formatTimeTo12Hour(plan.startTime) || '10:00 AM');
    setCreateEndTime(formatTimeTo12Hour(plan.endTime) || '12:00 PM');
    setCreateLocation(plan.location || '');
    setCreatePreacher(plan.preacher || '');
    setCreateTheme(plan.theme || '');
    setCreateScripture(plan.bibleReference || '');
    setCreateDescription(plan.description || '');
    setCreateRecurrence('one_time');
    setSelectedTemplateForNew('blank');

    setCreateRunSheet(plan.runSheet || []);
    setCreateSetlist(plan.setlist || []);

    // Load assignments
    const loadedAssignments: any[] = [];
    const usedRoleIds = new Set<string>();

    assignmentQueues.forEach(q => {
      usedRoleIds.add(q.roleId);
      const activeCandidate = q.candidates?.[q.currentCandidateIndex || 0];
      loadedAssignments.push({
        id: q.roleId,
        roleTitle: q.roleTitle,
        activityId: q.activityId,
        activityName: q.activityName,
        assignedMemberId: activeCandidate?.candidateId || (q as any).assignedMemberId,
        assignedMemberName: activeCandidate?.candidateName || (q as any).assignedMemberName,
        assignedMemberPhone: activeCandidate?.candidatePhone,
        requiredSkill: q.roleTitle,
        timeoutMinutes: q.timeoutMinutes || 120
      });
    });

    DEFAULT_FORM_DUTIES.forEach(d => {
      if (!usedRoleIds.has(d.id)) {
        let prefilledMemberId: string | undefined = undefined;
        let prefilledMemberName: string | undefined = undefined;
        if (d.id === 'duty_preacher' && plan.preacher) {
          const match = churchMembers.find(m =>
            (m.name || `${m.firstName || ''} ${m.lastName || ''}`).trim().toLowerCase() === plan.preacher?.trim().toLowerCase()
          );
          if (match) {
            prefilledMemberId = match.id;
            prefilledMemberName = match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim();
          }
        }
        loadedAssignments.push({
          ...d,
          assignedMemberId: prefilledMemberId,
          assignedMemberName: prefilledMemberName
        });
      }
    });

    setCreateAssignments(loadedAssignments);
    setResponseTimeoutHours(2);
    setIsEditingExistingPlan(true);
    setEditingPlanId(plan.id);
    setSelectedPlan(plan);
    setShowCreateModal(true);
  };

  const handleSelectTemplateForForm = (templateId: string) => {
    setSelectedTemplateForNew(templateId);
    if (templateId === 'blank') {
      setCreateRunSheet([]);
      return;
    }
    const found = templates.find(t => t.id === templateId);
    if (found && found.runSheetTemplate) {
      let cur = createStartTime || '10:00';
      const items: RunSheetItem[] = found.runSheetTemplate.map((item, idx) => {
        const dur = item.durationMinutes || 10;
        const s = cur;
        const e = ServiceRosterService.addMinutesToTime(cur, dur);
        cur = e;
        return {
          ...item,
          id: `act_${Date.now()}_${idx}`,
          order: idx + 1,
          startTime: s,
          durationMinutes: dur,
          endTime: e,
          assignmentStatus: 'unassigned',
          completionStatus: 'pending'
        };
      });
      setCreateRunSheet(items);
    }
  };

  const handleMoveRunSheetItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= createRunSheet.length) return;
    const updated = [...createRunSheet];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setCreateRunSheet(recalculateRunSheetTimes(updated, createStartTime));
  };

  const handleDeleteRunSheetItem = (index: number) => {
    const updated = createRunSheet.filter((_, idx) => idx !== index);
    setCreateRunSheet(recalculateRunSheetTimes(updated, createStartTime));
  };

  const handleMoveSetlistItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= createSetlist.length) return;
    const updated = [...createSetlist];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setCreateSetlist(updated);
  };

  const handleDeleteSetlistItem = (index: number) => {
    setCreateSetlist(createSetlist.filter((_, idx) => idx !== index));
  };

  const handleOpenAssignMemberModal = (index: number) => {
    setSelectedDutyIndexForAssign(index);
    setAssignMemberSearch('');
    setShowAssignMemberModal(true);
  };

  const handleSelectMemberForDuty = (memberItem: any) => {
    if (selectedDutyIndexForAssign === null) return;
    const memberName = memberItem.name || `${memberItem.firstName || ''} ${memberItem.lastName || ''}`.trim() || 'Volunteer';
    const updated = [...createAssignments];
    updated[selectedDutyIndexForAssign] = {
      ...updated[selectedDutyIndexForAssign],
      assignedMemberId: memberItem.id,
      assignedMemberName: memberName,
      assignedMemberPhone: memberItem.phone || memberItem.mobile || memberItem.phoneNumber || ''
    };
    setCreateAssignments(updated);
    setShowAssignMemberModal(false);
    setSelectedDutyIndexForAssign(null);
  };

  const handleClearDutyAssignment = (index: number) => {
    const updated = [...createAssignments];
    updated[index] = {
      ...updated[index],
      assignedMemberId: undefined,
      assignedMemberName: undefined,
      assignedMemberPhone: undefined
    };
    setCreateAssignments(updated);
  };

  const handleAddQuickActivity = () => {
    if (!quickActTitle.trim()) {
      Alert.alert('Required', 'Please enter activity title.');
      return;
    }
    const dur = parseInt(quickActDuration) || 10;
    const lastItem = createRunSheet[createRunSheet.length - 1];
    const sTime = lastItem?.endTime || createStartTime || '10:00';
    const eTime = ServiceRosterService.addMinutesToTime(sTime, dur);

    const newItem: RunSheetItem = {
      id: `act_${Date.now()}`,
      order: createRunSheet.length + 1,
      program: quickActTitle.trim(),
      category: quickActCategory,
      startTime: sTime,
      durationMinutes: dur,
      endTime: eTime,
      assignmentStatus: 'unassigned',
      completionStatus: 'pending'
    };

    setCreateRunSheet([...createRunSheet, newItem]);
    setQuickActTitle('');
    setShowAddActivityQuickModal(false);
  };

  const handleAddQuickDuty = () => {
    if (!quickDutyTitle.trim()) {
      Alert.alert('Required', 'Please enter duty role title.');
      return;
    }
    const newDuty = {
      id: `duty_custom_${Date.now()}`,
      roleTitle: quickDutyTitle.trim(),
      requiredSkill: quickDutySkill.trim() || quickDutyTitle.trim(),
      timeoutMinutes: responseTimeoutHours * 60
    };
    setCreateAssignments([...createAssignments, newDuty]);
    setQuickDutyTitle('');
    setQuickDutySkill('');
    setShowAddDutyQuickModal(false);
  };

  const handlePublishServiceWithCascade = (plan: ServicePlan) => {
    Alert.alert(
      'Publish Service & Dispatch Notifications 🚀',
      `Publish "${plan.serviceTitle}" (${formatDateMonthYear(plan.date)}) and send push notifications to assigned volunteers with a 2-hour response deadline?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish & Notify',
          style: 'default',
          onPress: async () => {
            try {
              setSavingService(true);
              await ServiceRosterService.updateServiceStatus(churchId, plan.id, 'published');
              await ServiceRosterService.publishServiceRosterBroadcast(churchId, plan.id);

              const timeoutMinutes = 120; // 2 hours default
              const dispatchedDuties: string[] = [];
              const seenRoleKeys = new Set<string>();
              const seenMemberDutyKeys = new Set<string>();

              // Helper to resolve member ID from member name or phone
              const resolveMemberId = (rawId?: string, rawName?: string): { id?: string; name: string; phone?: string } => {
                const cleanName = (rawName || '').trim();
                const lowerName = cleanName.toLowerCase();

                if (rawId && rawId.trim()) {
                  const m = churchMembers.find(m => m.id === rawId || m.uid === rawId);
                  if (m) {
                    const mName = m.name || m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || cleanName;
                    return { id: m.id || rawId, name: mName, phone: m.phone || m.phoneNumber || m.mobile };
                  }
                  return { id: rawId, name: cleanName, phone: undefined };
                }

                if (lowerName) {
                  // 1. Exact match
                  const exactMatch = churchMembers.find(m => {
                    const mName = (m.name || m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || '').toLowerCase();
                    const mPhone = (m.phone || m.phoneNumber || m.mobile || '').trim();
                    return mName === lowerName || mPhone === cleanName;
                  });
                  if (exactMatch) {
                    const mName = exactMatch.name || exactMatch.fullName || `${exactMatch.firstName || ''} ${exactMatch.lastName || ''}`.trim() || cleanName;
                    return { id: exactMatch.id, name: mName, phone: exactMatch.phone || exactMatch.phoneNumber || exactMatch.mobile };
                  }

                  // 2. Inclusion / substring match
                  const partialMatch = churchMembers.find(m => {
                    const mName = (m.name || m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || '').toLowerCase();
                    const mFirst = (m.firstName || '').toLowerCase().trim();
                    const mLast = (m.lastName || '').toLowerCase().trim();
                    return (
                      (mName && (mName.includes(lowerName) || lowerName.includes(mName))) ||
                      (mFirst && (mFirst === lowerName || lowerName.includes(mFirst))) ||
                      (mLast && (mLast === lowerName || lowerName.includes(mLast)))
                    );
                  });
                  if (partialMatch) {
                    const mName = partialMatch.name || partialMatch.fullName || `${partialMatch.firstName || ''} ${partialMatch.lastName || ''}`.trim() || cleanName;
                    return { id: partialMatch.id, name: mName, phone: partialMatch.phone || partialMatch.phoneNumber || partialMatch.mobile };
                  }
                }
                return { id: rawId || undefined, name: cleanName, phone: undefined };
              };

              // Collect duties across RunSheet, Band, Setlist, and Assignments
              const allDuties: Array<{
                roleId: string;
                roleTitle: string;
                activityId?: string;
                activityName?: string;
                memberId: string;
                memberName: string;
                memberPhone?: string;
                requiredSkill?: string;
                teamIds?: string[];
              }> = [];

              // 1. RunSheet activities (Order of Service)
              (plan.runSheet || []).forEach((item, idx) => {
                if (item.responsiblePerson && item.responsiblePerson.trim()) {
                  const resolved = resolveMemberId(item.responsibleMemberId, item.responsiblePerson);
                  const roleId = item.id ? (item.id.startsWith('act_') ? item.id : `act_${item.id}`) : `act_${idx}`;
                  const dutyKey = `${resolved.id || resolved.name}_${roleId}`;
                  if (resolved.id && !seenRoleKeys.has(roleId) && !seenMemberDutyKeys.has(dutyKey)) {
                    seenRoleKeys.add(roleId);
                    seenMemberDutyKeys.add(dutyKey);
                    const actTeams = resolveTeamsForActivity(item).map(t => t.id);
                    allDuties.push({
                      roleId,
                      roleTitle: item.program || 'Service Activity',
                      activityId: item.id,
                      activityName: item.program,
                      memberId: resolved.id,
                      memberName: resolved.name,
                      memberPhone: resolved.phone,
                      requiredSkill: item.category || item.program,
                      teamIds: actTeams.length > 0 ? actTeams : ServiceRosterService.getDefaultTeamIdsForActivity(item.category, item.program)
                    });
                  }
                }
              });

              // 2. Whole-Service Musical Instruments & Worship Band (Primary whole-service notifications)
              const wholeBandRoleDefs = [
                { roleId: 'role_keyboard', defaultTitle: 'Keyboardist / Pianist', skill: 'Keyboard / Piano', teamIds: ['team_music'] },
                { roleId: 'role_drums', defaultTitle: 'Drummer / Percussionist', skill: 'Drums / Percussion', teamIds: ['team_music'] },
                { roleId: 'role_bass', defaultTitle: 'Bass Guitarist', skill: 'Bass Guitar', teamIds: ['team_music'] },
                { roleId: 'role_acoustic', defaultTitle: 'Acoustic Guitarist', skill: 'Acoustic Guitar', teamIds: ['team_music'] },
                { roleId: 'role_electric', defaultTitle: 'Electric Guitarist', skill: 'Electric Guitar', teamIds: ['team_music'] },
                { roleId: 'role_sound', defaultTitle: 'Sound & Audio Engineer', skill: 'Sound Engineer (FOH)', teamIds: ['team_sound'] },
                { roleId: 'role_worship_leader', defaultTitle: 'Worship Leader', skill: 'Worship Leader', teamIds: ['team_worship'] },
              ];

              wholeBandRoleDefs.forEach(b => {
                const memberName = plan.assignments?.[b.roleId];
                if (memberName && memberName.trim() && !seenRoleKeys.has(b.roleId)) {
                  const resolved = resolveMemberId(plan.assignmentMemberIds?.[b.roleId], memberName);
                  const dutyKey = `${resolved.id || resolved.name}_${b.roleId}`;
                  if (resolved.id && !seenMemberDutyKeys.has(dutyKey)) {
                    seenRoleKeys.add(b.roleId);
                    seenMemberDutyKeys.add(dutyKey);
                    allDuties.push({
                      roleId: b.roleId,
                      roleTitle: b.defaultTitle,
                      memberId: resolved.id,
                      memberName: resolved.name,
                      memberPhone: resolved.phone,
                      requiredSkill: b.skill,
                      teamIds: b.teamIds
                    });
                  }
                }
              });

              // 3. Other General Service Assignments (Preacher, Ushes, Media, etc.)
              if (plan.assignments) {
                for (const [roleId, memberName] of Object.entries(plan.assignments)) {
                  if (!memberName || !memberName.trim() || seenRoleKeys.has(roleId)) continue;
                  const resolved = resolveMemberId(plan.assignmentMemberIds?.[roleId], memberName);
                  const dutyKey = `${resolved.id || resolved.name}_${roleId}`;
                  if (resolved.id && !seenMemberDutyKeys.has(dutyKey)) {
                    seenRoleKeys.add(roleId);
                    seenMemberDutyKeys.add(dutyKey);
                    const cleanActId = roleId.replace(/^(role_)?(act_)+/, '');
                    const matchedRunSheetItem = (plan.runSheet || []).find(it => it.id === roleId || it.id === `act_${cleanActId}` || it.id.replace(/^(act_)+/, '') === cleanActId);
                    const roleTitle = (matchedRunSheetItem?.program) || (roleId.includes('act_') ? 'Order of Service Duty' : roleId.replace('role_', '').replace(/_/g, ' ').toUpperCase());
                    const matchedRoleTeams = matchedRunSheetItem
                      ? resolveTeamsForActivity(matchedRunSheetItem).map(t => t.id)
                      : (roleId === 'role_media' ? ['team_media'] : roleId === 'role_sound' ? ['team_sound'] : undefined);
                    allDuties.push({
                      roleId,
                      roleTitle,
                      memberId: resolved.id,
                      memberName: resolved.name,
                      memberPhone: resolved.phone,
                      requiredSkill: matchedRunSheetItem?.category || roleTitle,
                      teamIds: matchedRoleTeams
                    });
                  }
                }
              }

              // 4. Setlist songs (Only notify guest / unique players not already covered by whole-service band)
              (plan.setlist || []).forEach((song, idx) => {
                const wholeServiceLeader = plan.assignments?.['role_worship_leader'];
                if (song.ledBy && song.ledBy.trim() && song.ledBy !== wholeServiceLeader) {
                  const resolved = resolveMemberId(song.ledByMemberId, song.ledBy);
                  const roleId = `worship_lead_${song.id || idx}`;
                  const dutyKey = `${resolved.id || resolved.name}_worship_leader`;
                  if (resolved.id && !seenRoleKeys.has(roleId) && !seenMemberDutyKeys.has(dutyKey)) {
                    seenRoleKeys.add(roleId);
                    seenMemberDutyKeys.add(dutyKey);
                    allDuties.push({
                      roleId,
                      roleTitle: `Worship Lead (${song.title})`,
                      memberId: resolved.id,
                      memberName: resolved.name,
                      memberPhone: resolved.phone,
                      requiredSkill: 'Worship Leader'
                    });
                  }
                }
                if (song.musicianAssignments) {
                  Object.entries(song.musicianAssignments).forEach(([instrument, assignment]) => {
                    const wholeBandName = plan.assignments?.[`role_${instrument}`];
                    if (assignment?.memberName && assignment.memberName.trim() && assignment.memberName !== wholeBandName) {
                      const resolved = resolveMemberId(assignment.memberId, assignment.memberName);
                      const roleId = `band_${song.id || idx}_${instrument}`;
                      const dutyKey = `${resolved.id || resolved.name}_${instrument}`;
                      if (resolved.id && !seenRoleKeys.has(roleId) && !seenMemberDutyKeys.has(dutyKey)) {
                        seenRoleKeys.add(roleId);
                        seenMemberDutyKeys.add(dutyKey);
                        allDuties.push({
                          roleId,
                          roleTitle: `${instrument.charAt(0).toUpperCase() + instrument.slice(1)} (${song.title})`,
                          memberId: resolved.id,
                          memberName: resolved.name,
                          memberPhone: resolved.phone,
                          requiredSkill: instrument
                        });
                      }
                    }
                  });
                }
              });

              // Dispatch queue for each duty
              for (const duty of allDuties) {
                try {
                  const backupCandidates: Array<{ candidateId: string; candidateName: string; candidatePhone?: string }> = [];
                  try {
                    const recs = await ServiceRosterService.getEligibleCandidatesForRole(churchId, plan.date, {
                      teamIds: duty.teamIds,
                      requiredSkill: duty.requiredSkill || duty.roleTitle,
                      roleTitle: duty.roleTitle
                    });
                    for (const r of recs) {
                      if (r.memberId !== duty.memberId && backupCandidates.length < 2) {
                        backupCandidates.push({
                          candidateId: r.memberId,
                          candidateName: r.memberName || 'Volunteer',
                          candidatePhone: r.memberPhone || undefined
                        });
                      }
                    }
                  } catch (e) {
                    console.warn('Backup fetch error for role:', duty.roleTitle, e);
                  }

                  const ladder = [
                    {
                      candidateId: duty.memberId,
                      candidateName: duty.memberName || 'Volunteer',
                      candidatePhone: duty.memberPhone || undefined
                    },
                    ...backupCandidates
                  ];

                  await ServiceRosterService.dispatchAssignmentQueue(churchId, plan.id, {
                    roleId: duty.roleId,
                    roleTitle: duty.roleTitle,
                    ...(duty.activityId ? { activityId: duty.activityId } : {}),
                    ...(duty.activityName ? { activityName: duty.activityName } : {}),
                    candidates: ladder,
                    timeoutMinutes
                  });

                  dispatchedDuties.push(`${duty.memberName} (${duty.roleTitle})`);
                } catch (dutyErr: any) {
                  console.warn(`[PublishService] Error dispatching queue for ${duty.roleTitle}:`, dutyErr);
                }
              }

              // Automatically dispatch First-Come, First-Served broadcast for all unassigned responsibilities
              let fcfsDispatchedCount = 0;
              try {
                const fcfsRes = await ServiceRosterService.autoDispatchFirstComeResponsibilities(churchId, plan.id);
                fcfsDispatchedCount = fcfsRes.dispatchedCount;
              } catch (fcfsErr) {
                console.warn('[PublishService] autoDispatchFirstComeResponsibilities error:', fcfsErr);
              }

              const updatedPlan = { ...plan, status: 'published' as ServiceStatus };
              setSelectedPlan(updatedPlan);
              setPlans(plans.map(p => p.id === plan.id ? updatedPlan : p));

              const count = dispatchedDuties.length;
              Alert.alert(
                'Service Published & Broadcasted! 🚀',
                `"${plan.serviceTitle}" is now published!\n\n` +
                (fcfsDispatchedCount > 0
                  ? `⚡ ${fcfsDispatchedCount} open responsibility slot(s) automatically broadcasted to all verified musicians & members (First-Come, First-Served).\n\n`
                  : '') +
                (count > 0
                  ? `👤 ${count} volunteer notification(s) dispatched.\n\n`
                  : '') +
                `The first eligible member to accept each slot gets booked immediately!`
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to publish service.');
            } finally {
              setSavingService(false);
            }
          }
        }
      ]
    );
  };

  const handleQuickPublishPlan = (plan: ServicePlan) => {
    handlePublishServiceWithCascade(plan);
  };

  const handlePublishService = async (publishNow: boolean = true) => {
    if (!createTitle.trim()) {
      Alert.alert('Required', 'Please enter a service name.');
      return;
    }
    if (!createDate.trim()) {
      Alert.alert('Required', 'Please enter a service date (YYYY-MM-DD).');
      return;
    }
    if (!createStartTime.trim()) {
      Alert.alert('Required', 'Please select a start time.');
      return;
    }

    try {
      setSavingService(true);

      // 1. Recalculate Run Sheet times
      let runningTime = createStartTime;
      const finalRunSheet: RunSheetItem[] = createRunSheet.map((item, idx) => {
        const dur = item.durationMinutes || 10;
        const sTime = runningTime;
        const eTime = ServiceRosterService.addMinutesToTime(runningTime, dur);
        runningTime = eTime;
        return {
          ...item,
          id: item.id || `act_${Date.now()}_${idx}`,
          order: idx + 1,
          startTime: sTime,
          endTime: eTime,
          durationMinutes: dur,
          assignmentStatus: item.assignmentStatus || 'unassigned',
          completionStatus: item.completionStatus || 'pending'
        };
      });

      const finalStatus: ServiceStatus = publishNow ? 'published' : 'draft';

      let targetPlanId: string | undefined = editingPlanId || undefined;

      if (isEditingExistingPlan && editingPlanId) {
        await ServiceRosterService.updateServicePlan(churchId, editingPlanId, {
          serviceTitle: createTitle.trim(),
          serviceType: createType,
          date: createDate,
          startTime: createStartTime,
          endTime: createEndTime,
          location: createLocation.trim(),
          preacher: createPreacher.trim(),
          theme: createTheme.trim(),
          bibleReference: createScripture.trim(),
          description: createDescription.trim(),
          status: finalStatus,
          runSheet: finalRunSheet,
          setlist: createSetlist
        });
      } else {
        const created = await ServiceRosterService.createServicePlan(
          churchId,
          {
            serviceTitle: createTitle.trim(),
            serviceType: createType,
            date: createDate,
            startTime: createStartTime,
            endTime: createEndTime,
            location: createLocation.trim(),
            preacher: createPreacher.trim(),
            theme: createTheme.trim(),
            bibleReference: createScripture.trim(),
            description: createDescription.trim(),
            status: finalStatus,
            runSheet: finalRunSheet,
            setlist: createSetlist
          },
          createRecurrence !== 'one_time' ? {
            frequency: createRecurrence,
            count: createOccurrencesCount
          } : undefined
        );
        targetPlanId = created[0]?.id;
      }

      // 2. If publishing, dispatch assignment queues for each assigned duty role
      if (publishNow && targetPlanId) {
        await ServiceRosterService.publishServiceRosterBroadcast(churchId, targetPlanId);
        const timeoutMinutes = responseTimeoutHours * 60;
        let dispatchedCount = 0;

        for (const duty of createAssignments) {
          if (!duty.assignedMemberId) continue;

          try {
            // Primary candidate
            const primaryCandidate = {
              candidateId: duty.assignedMemberId,
              candidateName: duty.assignedMemberName || 'Volunteer',
              candidatePhone: duty.assignedMemberPhone || undefined
            };

            // Fetch up to 2 backup candidates who have the verified skill for this duty
            const backupCandidates: Array<{ candidateId: string; candidateName: string; candidatePhone?: string }> = [];
            try {
              const recs = await ServiceRosterService.getEligibleCandidatesForRole(churchId, createDate, {
                requiredSkill: duty.requiredSkill || duty.roleTitle,
                roleTitle: duty.roleTitle
              });
              for (const r of recs) {
                if (r.memberId !== duty.assignedMemberId && backupCandidates.length < 2) {
                  backupCandidates.push({
                    candidateId: r.memberId,
                    candidateName: r.memberName || 'Volunteer',
                    candidatePhone: r.memberPhone || undefined
                  });
                }
              }
            } catch (e) {
              console.warn('Could not auto-fetch backup candidates for role:', duty.roleTitle, e);
            }

            const ladder = [primaryCandidate, ...backupCandidates];

            await ServiceRosterService.dispatchAssignmentQueue(churchId, targetPlanId, {
              roleId: duty.id,
              roleTitle: duty.roleTitle,
              candidates: ladder,
              timeoutMinutes
            });
            dispatchedCount++;
          } catch (dutyErr) {
            console.warn(`[CreatePublish] Error dispatching queue for ${duty.roleTitle}:`, dutyErr);
          }
        }

        Alert.alert(
          'Service Published! 🚀',
          `"${createTitle}" is now published!\n\n${dispatchedCount} push notification(s) dispatched to assigned volunteers with a ${responseTimeoutHours}-hour response deadline.\n\nAutomated cloud scheduling will monitor responses and automatically notify verified backups if any volunteer declines or times out.`
        );
      }

      setShowCreateModal(false);
      const updatedPlans = await fetchPlans();
      if (targetPlanId && updatedPlans) {
        const fresh = updatedPlans.find(p => p.id === targetPlanId);
        if (fresh) {
          setSelectedPlan(fresh);
        }
      }

      if (!publishNow) {
        const chosenTplName = selectedTemplateForNew === 'blank'
          ? 'Blank Order'
          : (templates.find(t => t.id === selectedTemplateForNew)?.name || 'Sunday Worship Preset');

        setCreatedSuccessInfo({
          title: createTitle.trim() || 'Worship Service',
          date: createDate,
          startTime: createStartTime,
          endTime: createEndTime,
          location: createLocation.trim() || 'Church Sanctuary',
          preacher: createPreacher.trim(),
          isRecurring: createRecurrence !== 'one_time',
          occurrencesCount: createRecurrence !== 'one_time' ? createOccurrencesCount : 1,
          recurrenceFrequency: createRecurrence,
          templateName: chosenTplName,
          planId: targetPlanId || '',
          isEdit: isEditingExistingPlan,
        });
        setShowCreatedSuccessModal(true);
      } else {
        setActivePlannerTab('builder');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save service.');
    } finally {
      setSavingService(false);
    }
  };

  // Alias for clean creation button
  const handleCreateService = () => handlePublishService(false);

  const handleUpdateStatus = async (newStatus: ServiceStatus) => {
    if (!selectedPlan) return;
    try {
      await ServiceRosterService.updateServiceStatus(churchId, selectedPlan.id, newStatus);
      setSelectedPlan({ ...selectedPlan, status: newStatus });
      setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, status: newStatus } : p));
      Alert.alert('Status Updated', `Service is now ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status.');
    }
  };

  const handleDeleteServicePlan = (planId: string, planTitle: string, planDate: string) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${planTitle}" (${planDate})?\n\nThis cannot be undone and will permanently remove all activities, songs, and volunteer duty assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingService(true);
              await ServiceRosterService.deleteServicePlan(churchId, planId);
              const remaining = plans.filter(p => p.id !== planId);
              setPlans(remaining);
              if (selectedPlan?.id === planId) {
                setSelectedPlan(remaining[0] || null);
              }
              if (showCreateModal && editingPlanId === planId) {
                setShowCreateModal(false);
              }
              Alert.alert('Deleted', `"${planTitle}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete service.');
            } finally {
              setSavingService(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteService = () => {
    if (!selectedPlan) return;
    handleDeleteServicePlan(selectedPlan.id, selectedPlan.serviceTitle, selectedPlan.date);
  };

  const openEditDetailsModal = () => {
    if (!selectedPlan) return;
    setEditTitle(selectedPlan.serviceTitle || '');
    setEditType(selectedPlan.serviceType || 'sunday_worship');
    setEditDate(selectedPlan.date || '');
    setEditStartTime(formatTimeTo12Hour(selectedPlan.startTime) || '10:00 AM');
    setEditEndTime(formatTimeTo12Hour(selectedPlan.endTime) || '12:00 PM');
    setEditLocation(selectedPlan.location || '');
    setEditPreacher(selectedPlan.preacher || '');
    setEditTheme(selectedPlan.theme || '');
    setEditScripture(selectedPlan.bibleReference || '');
    setEditDescription(selectedPlan.description || '');
    setShowEditDetailsModal(true);
  };

  const handleSaveDetails = async () => {
    if (!selectedPlan) return;
    try {
      const updates: Partial<ServicePlan> = {
        serviceTitle: editTitle.trim(),
        serviceType: editType,
        date: editDate.trim(),
        startTime: editStartTime.trim(),
        endTime: editEndTime.trim(),
        location: editLocation.trim(),
        preacher: editPreacher.trim(),
        theme: editTheme.trim(),
        bibleReference: editScripture.trim(),
        description: editDescription.trim()
      };
      await ServiceRosterService.updateServicePlan(churchId, selectedPlan.id, updates);
      const updated = { ...selectedPlan, ...updates };
      setSelectedPlan(updated);
      setPlans(plans.map(p => p.id === selectedPlan.id ? updated : p));
      setShowEditDetailsModal(false);
      Alert.alert('Saved', 'Service details updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save details.');
    }
  };

  const openSaveAsTemplateModal = () => {
    if (!selectedPlan) return;
    setNewTemplateName(`${selectedPlan.serviceTitle} Template`);
    setNewTemplateDesc(selectedPlan.description || `Reusable service order based on ${selectedPlan.serviceTitle}`);
    setShowSaveTemplateModal(true);
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!selectedPlan) return;
    if (!newTemplateName.trim()) {
      Alert.alert('Required', 'Please enter a template name.');
      return;
    }
    setSavingTemplate(true);
    try {
      const created = await ServiceRosterService.createServiceTemplate(churchId, {
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim(),
        runSheetTemplate: selectedPlan.runSheet || []
      });
      setTemplates(prev => [created, ...prev]);
      setShowSaveTemplateModal(false);
      Alert.alert('Success 🎉', `Template "${created.name}" saved! You can now reuse this service structure anytime when creating new services.`);
    } catch (tErr: any) {
      Alert.alert('Error', tErr?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const openServiceBandModal = () => {
    if (!selectedPlan) return;
    const a = selectedPlan.assignments || {};
    const m = selectedPlan.assignmentMemberIds || {};

    setBandKeyboard(a['role_keyboard'] || '');
    setBandKeyboardId(m['role_keyboard'] || '');
    setBandDrums(a['role_drums'] || '');
    setBandDrumsId(m['role_drums'] || '');
    setBandBass(a['role_bass'] || '');
    setBandBassId(m['role_bass'] || '');
    setBandAcoustic(a['role_acoustic'] || '');
    setBandAcousticId(m['role_acoustic'] || '');
    setBandElectric(a['role_electric'] || '');
    setBandElectricId(m['role_electric'] || '');
    setBandSound(a['role_sound'] || '');
    setBandSoundId(m['role_sound'] || '');
    setBandWorshipLeader(a['role_worship_leader'] || '');
    setBandWorshipLeaderId(m['role_worship_leader'] || '');
    setShowBandModal(true);
  };

  const handleSaveServiceBand = async () => {
    if (!selectedPlan) return;
    try {
      setSavingBand(true);
      const newAssignments: Record<string, string> = { ...(selectedPlan.assignments || {}) };
      const newMemberIds: Record<string, string> = { ...(selectedPlan.assignmentMemberIds || {}) };

      const updateRole = (roleKey: string, name: string, id: string) => {
        const clean = name.trim();
        if (clean) {
          newAssignments[roleKey] = clean;
          if (id) {
            newMemberIds[roleKey] = id;
          } else {
            const lower = clean.toLowerCase();
            const found = churchMembers.find(m => {
              const mName = (m.name || m.fullName || `${m.firstName || ''} ${m.lastName || ''}`).toLowerCase().trim();
              const mFirst = (m.firstName || '').toLowerCase().trim();
              const mLast = (m.lastName || '').toLowerCase().trim();
              return mName === lower || mName.includes(lower) || lower.includes(mName) || mFirst === lower || mLast === lower;
            });
            if (found) newMemberIds[roleKey] = found.id;
          }
        } else {
          delete newAssignments[roleKey];
          delete newMemberIds[roleKey];
        }
      };

      updateRole('role_keyboard', bandKeyboard, bandKeyboardId);
      updateRole('role_drums', bandDrums, bandDrumsId);
      updateRole('role_bass', bandBass, bandBassId);
      updateRole('role_acoustic', bandAcoustic, bandAcousticId);
      updateRole('role_electric', bandElectric, bandElectricId);
      updateRole('role_sound', bandSound, bandSoundId);
      updateRole('role_worship_leader', bandWorshipLeader, bandWorshipLeaderId);

      // Populate across all songs in the setlist so song cards and setlist reflect the whole-service band
      const updatedSetlist = (selectedPlan.setlist || []).map(song => {
        const musicians: Record<string, { memberName: string; memberId?: string }> = { ...(song.musicianAssignments || {}) };
        if (bandKeyboard.trim() && !musicians.keyboard?.memberName) {
          musicians.keyboard = { memberName: bandKeyboard.trim(), ...(newMemberIds['role_keyboard'] ? { memberId: newMemberIds['role_keyboard'] } : {}) };
        }
        if (bandDrums.trim() && !musicians.drums?.memberName) {
          musicians.drums = { memberName: bandDrums.trim(), ...(newMemberIds['role_drums'] ? { memberId: newMemberIds['role_drums'] } : {}) };
        }
        if (bandBass.trim() && !musicians.bass?.memberName) {
          musicians.bass = { memberName: bandBass.trim(), ...(newMemberIds['role_bass'] ? { memberId: newMemberIds['role_bass'] } : {}) };
        }
        if (bandAcoustic.trim() && !musicians.acoustic?.memberName) {
          musicians.acoustic = { memberName: bandAcoustic.trim(), ...(newMemberIds['role_acoustic'] ? { memberId: newMemberIds['role_acoustic'] } : {}) };
        }
        if (bandElectric.trim() && !musicians.electric?.memberName) {
          musicians.electric = { memberName: bandElectric.trim(), ...(newMemberIds['role_electric'] ? { memberId: newMemberIds['role_electric'] } : {}) };
        }
        return {
          ...song,
          musicianAssignments: musicians,
          ledBy: song.ledBy || bandWorshipLeader.trim() || 'Worship Leader'
        };
      });

      const updates: Partial<ServicePlan> = {
        assignments: newAssignments,
        assignmentMemberIds: newMemberIds,
        setlist: updatedSetlist
      };

      await ServiceRosterService.updateServicePlan(churchId, selectedPlan.id, updates);
      const updatedPlan: ServicePlan = {
        ...selectedPlan,
        ...updates
      };
      setSelectedPlan(updatedPlan);
      setPlans(plans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
      setShowBandModal(false);
      Alert.alert('Worship Band Assigned! 🎹🥁', 'The keyboard player, drummer, and musical instruments have been assigned for the entire service and all songs.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save worship band.');
    } finally {
      setSavingBand(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Order Builder (RunSheet Actions)
  // ─────────────────────────────────────────────────────────────────────────────

  const openAddActivityModal = () => {
    setEditingActivityId(null);
    setActProgram('');
    setActCategory('worship_songs');
    setActDuration('15');
    setActResponsible('');
    setActResponsibleId('');
    setActTeam('');
    setActTeamIds([]);
    setActShowAllMembers(false);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setActInstructions('');
    setShowActivityModal(true);
  };

  const openEditActivityModal = (item: RunSheetItem) => {
    setEditingActivityId(item.id);
    setActProgram(item.program);
    setActCategory(item.category);
    setActDuration(String(item.durationMinutes || 10));
    setActResponsible(item.responsiblePerson || '');
    setActResponsibleId(item.responsibleMemberId || '');
    setActTeam(item.supportingTeam || '');
    const matched = resolveTeamsForActivity({
      ...item,
      supportingTeam: item.supportingTeam || (!item.responsibleMemberId ? item.responsiblePerson : '')
    });
    setActTeamIds(matched.map(t => t.id));
    setActShowAllMembers(false);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setActInstructions(item.instructions || '');
    setShowActivityModal(true);
  };

  const handleSelectActivityCategory = (cat: ActivityCategory) => {
    setActCategory(cat);
    if (!editingActivityId && !actTeam.trim()) {
      const suggested = ServiceRosterService.resolveMatchingTeams(
        ministryTeams,
        ServiceRosterService.getDefaultTeamIdsForActivity(cat, actProgram)
      );
      setActTeamIds(suggested.map(t => t.id));
    }
  };

  const toggleActivityTeamChip = (team: MinistryTeam) => {
    const exists = actTeamIds.includes(team.id);
    const nextIds = exists
      ? actTeamIds.filter(id => id !== team.id)
      : [...actTeamIds, team.id];
    setActTeamIds(nextIds);
    const nextNames = ministryTeams
      .filter(t => nextIds.includes(t.id))
      .map(t => t.name)
      .filter(Boolean);
    setActTeam(nextNames.join(' & '));
  };

  const handleSaveActivity = async () => {
    if (!selectedPlan) return;
    if (!actProgram.trim()) {
      Alert.alert('Required', 'Please enter activity/program title.');
      return;
    }
    const durationNum = parseInt(actDuration, 10) || 10;

    try {
      setSavingActivity(true);
      if (editingActivityId) {
        await ServiceRosterService.updateActivityItem(churchId, selectedPlan.id, editingActivityId, {
          program: actProgram.trim(),
          category: actCategory,
          durationMinutes: durationNum,
          responsiblePerson: actResponsible.trim(),
          responsibleMemberId: actResponsibleId || undefined,
          supportingTeam: actTeam.trim(),
          supportingTeamId: actTeamIds[0] || '',
          supportingTeamIds: actTeamIds,
          instructions: actInstructions.trim()
        });
      } else {
        await ServiceRosterService.addActivityItem(churchId, selectedPlan.id, {
          program: actProgram.trim(),
          category: actCategory,
          durationMinutes: durationNum,
          startTime: selectedPlan.startTime,
          endTime: selectedPlan.startTime,
          responsiblePerson: actResponsible.trim(),
          responsibleMemberId: actResponsibleId || undefined,
          supportingTeam: actTeam.trim(),
          supportingTeamId: actTeamIds[0] || '',
          supportingTeamIds: actTeamIds,
          instructions: actInstructions.trim()
        });
      }

      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }
      setShowActivityModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save activity.');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = (itemId: string, itemTitle?: string) => {
    if (!selectedPlan) return;
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to remove "${itemTitle || 'this activity'}" from the Order of Service?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ServiceRosterService.deleteActivityItem(churchId, selectedPlan.id, itemId);
              const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
              if (freshPlan) {
                setSelectedPlan(freshPlan);
                setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete activity.');
            }
          }
        }
      ]
    );
  };

  const handleMoveActivity = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPlan?.runSheet) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedPlan.runSheet.length) return;

    const list = [...selectedPlan.runSheet];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    try {
      await ServiceRosterService.reorderActivityItems(churchId, selectedPlan.id, list);
      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reorder activity.');
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!selectedPlan) return;
    Alert.alert(
      'Apply Template',
      'This will replace the current Order of Service with the selected template timetable. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              await ServiceRosterService.applyTemplateToService(churchId, templateId, selectedPlan.id);
              const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
              if (freshPlan) {
                setSelectedPlan(freshPlan);
                setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
              }
              setShowApplyTemplateModal(false);
              Alert.alert('Applied', 'Template applied to Order of Service successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to apply template.');
            }
          }
        }
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: WORSHIP SETLIST MANAGEMENT ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const openSongPicker = () => {
    setSongLibrarySearch('');
    setSelectedSongIdsForBatch([]);
    setShowSongPickerModal(true);
  };

  const toggleSongSelectionForBatch = (songId: string) => {
    setSelectedSongIdsForBatch(prev =>
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleBatchAddSongsToSetlist = async () => {
    if (selectedSongIdsForBatch.length === 0) return;
    try {
      setAddingBatchSongs(true);
      const chosenSongs = churchSongs.filter(s => selectedSongIdsForBatch.includes(s.id));
      if (chosenSongs.length === 0) return;

      const newItems: SetlistItem[] = chosenSongs.map((song, idx) => ({
        id: `set_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        songId: song.id,
        title: song.title || song.titleEn || song.titleTe || 'Worship Song',
        titleTe: song.titleTe || '',
        titleEn: song.titleEn || '',
        artist: song.artist || '',
        key: song.key || 'G',
        tempo: song.tempo || '120',
        timeSignature: song.timeSignature || '4/4',
        durationMinutes: 5,
        ledBy: 'Worship Leader',
        musicianAssignments: {},
        rehearsalNotes: ''
      }));

      if (showCreateModal) {
        setCreateSetlist(prev => [...prev, ...newItems]);
        setShowSongPickerModal(false);
        setSelectedSongIdsForBatch([]);
        Alert.alert('Songs Added 🎵', `Added ${newItems.length} songs to setlist.`);
        return;
      }

      if (!selectedPlan) return;

      await ServiceRosterService.addMultipleSongsToSetlist(churchId, selectedPlan.id, newItems);

      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }

      setShowSongPickerModal(false);
      setSelectedSongIdsForBatch([]);
      Alert.alert('Setlist Updated 🎵', `Added ${newItems.length} song(s) to "${selectedPlan.serviceTitle}" setlist.`);
    } catch (err: any) {
      console.error('Failed to batch add songs:', err);
      Alert.alert('Error', err?.message || 'Failed to add songs to setlist.');
    } finally {
      setAddingBatchSongs(false);
    }
  };

  const handleSelectSongFromLibrary = async (song: WorshipSong) => {
    toggleSongSelectionForBatch(song.id);
  };

  const openEditSetlistItem = (item: SetlistItem, index: number) => {
    setEditingSetlistIndex(index);
    setSelectedSongForSetlist(null);
    setSongKeyInput(item.key || 'G');
    setSongBpmInput(item.tempo || '120');
    setSongTimeSigInput(item.timeSignature || '4/4');
    setSongDurationInput(String(item.durationMinutes || 6));
    setSongLeaderInput(item.ledBy || '');
    setSongKeyboardInput(item.musicianAssignments?.keyboard?.memberName || '');
    setSongAcousticInput(item.musicianAssignments?.acoustic?.memberName || '');
    setSongElectricInput(item.musicianAssignments?.electric?.memberName || '');
    setSongBassInput(item.musicianAssignments?.bass?.memberName || '');
    setSongDrumsInput(item.musicianAssignments?.drums?.memberName || '');
    setSongNotesInput(item.rehearsalNotes || '');
    setShowConfigureSongModal(true);
  };

  const handleSaveSetlistSong = async () => {
    if (!selectedPlan) return;
    const durNum = parseInt(songDurationInput, 10) || 6;

    const musicianMap: Record<string, { memberName: string }> = {};
    if (songKeyboardInput.trim()) musicianMap.keyboard = { memberName: songKeyboardInput.trim() };
    if (songAcousticInput.trim()) musicianMap.acoustic = { memberName: songAcousticInput.trim() };
    if (songElectricInput.trim()) musicianMap.electric = { memberName: songElectricInput.trim() };
    if (songBassInput.trim()) musicianMap.bass = { memberName: songBassInput.trim() };
    if (songDrumsInput.trim()) musicianMap.drums = { memberName: songDrumsInput.trim() };

    try {
      setSavingSetlistSong(true);
      if (editingSetlistIndex !== null) {
        // Editing existing setlist item
        const list = [...(selectedPlan.setlist || [])];
        const existing = list[editingSetlistIndex];
        if (existing) {
          list[editingSetlistIndex] = {
            ...existing,
            key: songKeyInput,
            tempo: songBpmInput,
            timeSignature: songTimeSigInput,
            durationMinutes: durNum,
            ledBy: songLeaderInput.trim() || 'Worship Leader',
            musicianAssignments: musicianMap,
            rehearsalNotes: songNotesInput.trim()
          };
          await ServiceRosterService.reorderSetlist(churchId, selectedPlan.id, list);
        }
      } else if (selectedSongForSetlist) {
        // Adding new song from library
        const newSetlistItem: SetlistItem = {
          id: `set_${Date.now()}`,
          songId: selectedSongForSetlist.id,
          title: selectedSongForSetlist.title || selectedSongForSetlist.titleEn || selectedSongForSetlist.titleTe || 'Worship Song',
          titleTe: selectedSongForSetlist.titleTe || '',
          titleEn: selectedSongForSetlist.titleEn || '',
          artist: selectedSongForSetlist.artist || '',
          key: songKeyInput,
          tempo: songBpmInput,
          timeSignature: songTimeSigInput,
          durationMinutes: durNum,
          ledBy: songLeaderInput.trim() || 'Worship Leader',
          musicianAssignments: musicianMap,
          rehearsalNotes: songNotesInput.trim()
        };
        await ServiceRosterService.addSongToSetlist(churchId, selectedPlan.id, newSetlistItem);
      }

      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }
      setShowConfigureSongModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save setlist song.');
    } finally {
      setSavingSetlistSong(false);
    }
  };

  const handleRemoveSetlistSong = async (songItemId: string) => {
    if (!selectedPlan) return;
    try {
      await ServiceRosterService.removeSongFromSetlist(churchId, selectedPlan.id, songItemId);
      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove song from setlist.');
    }
  };

  const handleMoveSetlistSong = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPlan?.setlist) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedPlan.setlist.length) return;

    const list = [...selectedPlan.setlist];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    try {
      await ServiceRosterService.reorderSetlist(churchId, selectedPlan.id, list);
      const freshPlan = await ServiceRosterService.getServicePlanById(churchId, selectedPlan.id);
      if (freshPlan) {
        setSelectedPlan(freshPlan);
        setPlans(plans.map(p => p.id === freshPlan.id ? freshPlan : p));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reorder setlist.');
    }
  };

  const openLyricsModal = (item: SetlistItem) => {
    const matchedSong = churchSongs.find(s => s.id === item.songId || s.title?.toLowerCase() === item.title.toLowerCase());
    setViewingLyricsSong({
      title: item.title,
      titleTe: item.titleTe || matchedSong?.titleTe,
      artist: item.artist || matchedSong?.artist,
      key: item.key,
      tempo: item.tempo,
      lyricsTe: matchedSong?.lyricsTe || '',
      lyricsEn: matchedSong?.lyrics || matchedSong?.lyricsEn || ''
    });
    setShowLyricsModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: MINISTRY TEAMS MANAGEMENT ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const openCreateTeamModal = () => {
    setSelectedTeam(null);
    setTeamNameInput('');
    setTeamDescInput('');
    setTeamColorInput('#1A2D5A');
    setTeamLeaderId(undefined);
    setTeamMemberIds([]);
    setTeamMemberSearch('');
    setShowTeamModal(true);
  };

  const openEditTeamModal = (team: MinistryTeam) => {
    setSelectedTeam(team);
    setTeamNameInput(team.name);
    setTeamDescInput(team.description || '');
    setTeamColorInput(team.color || '#1A2D5A');
    setTeamLeaderId(team.leaderId);
    setTeamMemberIds(team.memberIds || []);
    setTeamMemberSearch('');
    setShowTeamModal(true);
  };

  const handleDeleteTeam = (team: MinistryTeam) => {
    Alert.alert(
      'Delete Ministry Team',
      `Are you sure you want to delete the "${team.name}" ministry team? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingTeam(true);
              await ServiceRosterService.deleteMinistryTeam(churchId, team.id);
              if (showTeamModal) {
                setShowTeamModal(false);
              }
              await fetchMinistryTeams();
              Alert.alert('Deleted', `Ministry team "${team.name}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete ministry team.');
            } finally {
              setSavingTeam(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveTeam = async () => {
    if (!teamNameInput.trim()) {
      Alert.alert('Required', 'Please enter ministry team name.');
      return;
    }
    const leaderMember = teamLeaderId ? churchMembers.find(m => m.id === teamLeaderId) : undefined;
    const leaderName = leaderMember
      ? (leaderMember.name || `${leaderMember.firstName || ''} ${leaderMember.lastName || ''}`.trim() || '')
      : '';
    const leaderPhone = leaderMember
      ? (leaderMember.phone || (leaderMember as any).phoneNumber || (leaderMember as any).mobile || '')
      : '';
    const cleanMemberIds = (teamMemberIds || []).filter((id): id is string => Boolean(id));

    try {
      setSavingTeam(true);
      if (selectedTeam) {
        await ServiceRosterService.updateMinistryTeam(churchId, selectedTeam.id, {
          name: teamNameInput.trim(),
          description: teamDescInput.trim(),
          color: teamColorInput || '#1A2D5A',
          leaderId: teamLeaderId || '',
          leaderName,
          leaderPhone,
          memberIds: cleanMemberIds
        });
      } else {
        await ServiceRosterService.createMinistryTeam(churchId, {
          name: teamNameInput.trim(),
          description: teamDescInput.trim(),
          color: teamColorInput || '#1A2D5A',
          leaderId: teamLeaderId || '',
          leaderName,
          leaderPhone,
          memberIds: cleanMemberIds,
          active: true
        });
      }

      await fetchMinistryTeams();
      setShowTeamModal(false);
      Alert.alert('Saved', 'Ministry team saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save ministry team.');
    } finally {
      setSavingTeam(false);
    }
  };


  const handleMoveTeam = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ministryTeams.length) return;

    const reordered = [...ministryTeams];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Immediate optimistic update
    setMinistryTeams(reordered);
    setTeamOrderFeedback(`Moved ${moved.name} to #${targetIndex + 1}`);

    try {
      setIsSavingTeamOrder(true);
      await ServiceRosterService.updateMinistryTeamsOrder(churchId, reordered);
      setTimeout(() => setTeamOrderFeedback(null), 2500);
    } catch (err: any) {
      console.error('Failed to update team order:', err);
    } finally {
      setIsSavingTeamOrder(false);
    }
  };

  const handleResetTeamOrder = () => {
    Alert.alert(
      'Reset Ministry Team Order',
      'Reset all ministry teams back to the standard default order?\n\n1. Worship Team\n2. Prayer Team\n3. Music Team\n4. Media Team\n5. Livestream Team\n(followed by remaining departments)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSavingTeamOrder(true);
              const reset = [...ministryTeams].sort((a, b) => {
                const rankA = getTeamDefaultRank(a.name, a.id);
                const rankB = getTeamDefaultRank(b.name, b.id);
                if (rankA !== rankB) return rankA - rankB;
                return (a.name || '').localeCompare(b.name || '');
              });
              setMinistryTeams(reset);
              await ServiceRosterService.updateMinistryTeamsOrder(churchId, reset);
              setTeamOrderFeedback('Restored to default order');
              setTimeout(() => setTeamOrderFeedback(null), 2500);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to reset order.');
            } finally {
              setIsSavingTeamOrder(false);
            }
          }
        }
      ]
    );
  };

  const handleSeedDefaultTeams = async () => {
    Alert.alert(
      'Seed Ministry Teams',
      'This will populate the 14 standard church ministry teams (Worship, Music, Sound, Media, Livestream, etc.). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed Teams',
          onPress: async () => {
            try {
              setLoadingTeams(true);
              const seeded = await ServiceRosterService.seedDefaultMinistryTeams(churchId);
              setMinistryTeams(seeded);
              Alert.alert('Success', `Seeded ${seeded.length} standard ministry teams.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to seed teams.');
            } finally {
              setLoadingTeams(false);
            }
          }
        }
      ]
    );
  };

  const toggleMemberInTeam = (memberId: string) => {
    if (teamMemberIds.includes(memberId)) {
      setTeamMemberIds(teamMemberIds.filter(id => id !== memberId));
    } else {
      setTeamMemberIds([...teamMemberIds, memberId]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: MEMBER SKILLS ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleVerifySkill = async (skillId: string, status: 'verified' | 'rejected') => {
    try {
      const verifierName = member?.name || 'Admin';
      await ServiceRosterService.verifyMemberSkill(churchId, skillId, status, verifierName);
      setMemberSkills(memberSkills.map(s => s.id === skillId ? { ...s, verificationStatus: status, verifiedBy: verifierName } : s));
      Alert.alert('Skill Updated', `Skill marked as ${status.toUpperCase()}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to verify skill.');
    }
  };

  const handleAddMemberSkill = async () => {
    if (!skillMemberId) {
      Alert.alert('Required', 'Please select a church member.');
      return;
    }
    if (!skillNameInput.trim()) {
      Alert.alert('Required', 'Please enter skill name.');
      return;
    }
    const targetMember = churchMembers.find(m => m.id === skillMemberId);

    try {
      setSavingSkill(true);
      await ServiceRosterService.addOrUpdateMemberSkill(churchId, {
        memberId: skillMemberId,
        memberName: targetMember?.name || targetMember?.firstName || 'Member',
        memberPhone: targetMember?.phone,
        category: skillCategory,
        skillName: skillNameInput.trim(),
        proficiencyLevel: skillProficiency,
        verificationStatus: 'verified',
        verifiedBy: member?.name || 'Admin'
      });

      await fetchMemberSkills();
      setShowAddSkillModal(false);
      Alert.alert('Success', 'Member skill added & verified.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add member skill.');
    } finally {
      setSavingSkill(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Assignment Queue & Cascade Workflow Handlers (Phase 4)
  // ─────────────────────────────────────────────────────────────────────────────

  const serviceRolesList = useMemo(() => {
    if (!selectedPlan) return [];
    const roles: Array<{
      roleId: string;
      roleTitle: string;
      category: string;
      activityId?: string;
      activityName?: string;
      suggestedSkill?: string;
      suggestedTeamId?: string;
      suggestedTeamIds?: string[];
    }> = [];

    // 1. Roles from RunSheet activities
    (selectedPlan.runSheet || []).forEach(act => {
      const rId = `act_${act.id}`;
      const matchedTeams = resolveTeamsForActivity(act);
      const defaultIds = ServiceRosterService.getDefaultTeamIdsForActivity(act.category, act.program);
      const resolvedTeamIds = matchedTeams.length > 0
        ? matchedTeams.map(t => t.id)
        : (act.supportingTeamIds && act.supportingTeamIds.length > 0
            ? act.supportingTeamIds
            : (act.supportingTeamId
                ? [act.supportingTeamId]
                : (defaultIds.length > 0 ? defaultIds : (act.supportingTeam ? [act.supportingTeam] : []))));
      roles.push({
        roleId: rId,
        roleTitle: act.responsiblePerson || act.program,
        category: act.category,
        activityId: act.id,
        activityName: act.program,
        suggestedSkill: act.program,
        suggestedTeamId: resolvedTeamIds[0],
        suggestedTeamIds: resolvedTeamIds
      });
    });

    // 2. Standard Service Ministry Positions
    const standardRoles = [
      { id: 'role_preacher', title: 'Preacher / Speaker', category: 'sermon', skill: 'Sermon' },
      { id: 'role_worship_leader', title: 'Worship Leader', category: 'worship', skill: 'Worship Leader', teamId: 'team_worship' },
      { id: 'role_keyboard', title: 'Keyboardist / Synth', category: 'music', skill: 'Keyboard', teamId: 'team_music' },
      { id: 'role_acoustic', title: 'Acoustic Guitar', category: 'music', skill: 'Guitar', teamId: 'team_music' },
      { id: 'role_electric', title: 'Electric Guitarist', category: 'music', skill: 'Electric Guitar', teamId: 'team_music' },
      { id: 'role_bass', title: 'Bass Guitar', category: 'music', skill: 'Bass Guitar', teamId: 'team_music' },
      { id: 'role_drums', title: 'Drummer', category: 'music', skill: 'Drums', teamId: 'team_music' },
      { id: 'role_sound', title: 'Sound Engineer', category: 'technical', skill: 'Sound Engineering', teamId: 'team_sound' },
      { id: 'role_media', title: 'Media & Projector', category: 'technical', skill: 'Lyrics and Projector', teamId: 'team_media' },
      { id: 'role_livestream', title: 'Livestream Operator', category: 'technical', skill: 'Livestream', teamId: 'team_livestream' },
      { id: 'role_greeter', title: 'Main Door Greeter', category: 'hospitality', skill: 'Welcome', teamId: 'team_hospitality' },
      { id: 'role_usher', title: 'Sanctuary Usher', category: 'hospitality', skill: 'Welcome', teamId: 'team_hospitality' },
      { id: 'role_offering', title: 'Offering Coordinator', category: 'offering', skill: 'Offering', teamId: 'team_offering' },
    ];

    standardRoles.forEach(sr => {
      if (!roles.some(r => r.roleId === sr.id)) {
        roles.push({
          roleId: sr.id,
          roleTitle: sr.title,
          category: sr.category,
          suggestedSkill: sr.skill,
          suggestedTeamId: sr.teamId,
          suggestedTeamIds: sr.teamId ? [sr.teamId] : undefined
        });
      }
    });

    return roles;
  }, [selectedPlan, ministryTeams]);

  const openDispatchQueueModal = async (
    roleId: string,
    roleTitle: string,
    activityId?: string,
    activityName?: string,
    suggestedTeamId?: string,
    suggestedSkill?: string,
    suggestedTeamIds?: string[]
  ) => {
    if (!selectedPlan) return;
    setTargetRoleId(roleId);
    setTargetRoleTitle(roleTitle);
    setTargetActivityId(activityId);
    setTargetActivityName(activityName);
    setDispatchTimeoutHours(2); // 2 hours default deadline for prompt auto-cascade

    // Check if queue already exists to prefill ladder
    const existing = assignmentQueues.find(q => q.roleId === roleId);
    if (existing && existing.candidates?.length > 0) {
      setLadderCandidates(existing.candidates.map(c => ({
        candidateId: c.candidateId,
        candidateName: c.candidateName,
        candidatePhone: c.candidatePhone
      })));
    } else {
      setLadderCandidates([]);
    }

    setShowDispatchQueueModal(true);
    setLoadingRecommendations(true);

    try {
      const recs = await ServiceRosterService.getEligibleCandidatesForRole(churchId, selectedPlan.date, {
        teamId: suggestedTeamId,
        teamIds: suggestedTeamIds,
        requiredSkill: suggestedSkill || roleTitle,
        roleTitle
      });
      setCandidateRecommendations(recs);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const addCandidateToLadder = (member: { id?: string; memberId?: string; name?: string; memberName?: string; phone?: string; memberPhone?: string }) => {
    const id = member.id || member.memberId || '';
    const name = member.name || member.memberName || 'Member';
    const phone = member.phone || member.memberPhone;

    if (ladderCandidates.some(c => c.candidateId === id)) {
      Alert.alert('Already Added', `${name} is already in the candidate ladder.`);
      return;
    }
    if (ladderCandidates.length >= 3) {
      Alert.alert('Maximum Reached', 'You can specify up to 3 candidates in the sequential ladder (Primary, 1st Backup, 2nd Backup).');
      return;
    }

    setLadderCandidates([...ladderCandidates, { candidateId: id, candidateName: name, candidatePhone: phone }]);
  };

  const removeCandidateFromLadder = (index: number) => {
    setLadderCandidates(ladderCandidates.filter((_, idx) => idx !== index));
  };

  const handleDispatchQueueSubmit = async () => {
    if (!selectedPlan) return;
    if (ladderCandidates.length === 0) {
      Alert.alert('Required', 'Please add at least 1 candidate to dispatch the queue.');
      return;
    }

    try {
      setSavingDispatchQueue(true);
      await ServiceRosterService.dispatchAssignmentQueue(churchId, selectedPlan.id, {
        roleId: targetRoleId,
        roleTitle: targetRoleTitle,
        activityId: targetActivityId,
        activityName: targetActivityName,
        candidates: ladderCandidates,
        timeoutMinutes: dispatchTimeoutHours * 60
      });

      setShowDispatchQueueModal(false);
      Alert.alert('Queue Dispatched', `Assignment queue for "${targetRoleTitle}" activated! Push notification dispatched to Primary Volunteer (${ladderCandidates[0]?.candidateName}) with a ${dispatchTimeoutHours}h response deadline.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to dispatch assignment queue.');
    } finally {
      setSavingDispatchQueue(false);
    }
  };

  const openManualOverrideModal = (roleId: string, roleTitle: string) => {
    setTargetRoleId(roleId);
    setTargetRoleTitle(roleTitle);
    setOverrideMemberId('');
    setOverrideMemberSearch('');
    setOverrideNotes('');
    setShowOverrideModal(true);
  };

  const handleManualOverrideSubmit = async () => {
    if (!selectedPlan) return;
    if (!overrideMemberId) {
      Alert.alert('Required', 'Please select a church member to assign.');
      return;
    }

    const chosenMember = churchMembers.find(m => m.id === overrideMemberId);
    const memberName = chosenMember?.name || `${chosenMember?.firstName || ''} ${chosenMember?.lastName || ''}`.trim() || 'Volunteer';

    try {
      setSavingOverride(true);
      await ServiceRosterService.manualOverrideAssignment(
        churchId,
        selectedPlan.id,
        targetRoleId,
        overrideMemberId,
        memberName,
        overrideNotes.trim() || undefined
      );

      setShowOverrideModal(false);
      Alert.alert('Assigned', `${memberName} manually assigned and confirmed as ${targetRoleTitle}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to manually assign member.');
    } finally {
      setSavingOverride(false);
    }
  };

  const openSimulateModal = (queue: ServiceAssignmentQueue, initialAction: 'accept' | 'decline' = 'accept') => {
    setActiveQueueForSimulate(queue);
    setSimulateAction(initialAction);
    setSimulateDeclineReason('Out of town for personal engagement');
    setShowSimulateModal(true);
  };

  const handleSimulateResponseSubmit = async () => {
    if (!selectedPlan || !activeQueueForSimulate) return;
    const uniqueCands = ServiceRosterService.deduplicateCandidates(activeQueueForSimulate.candidates || []);
    const curIdx = activeQueueForSimulate.currentCandidateIndex || 0;
    const pendingCand = uniqueCands.find(c => c.status === 'pending' || c.status === 'waiting');
    const candidate = activeQueueForSimulate.mode === 'first_come_first_served'
      ? (pendingCand || uniqueCands[0])
      : (uniqueCands[curIdx] || pendingCand || uniqueCands[0]);
    if (!candidate) {
      Alert.alert('Error', 'No active candidate found in this queue.');
      return;
    }

    try {
      setSubmittingSimulate(true);
      await ServiceRosterService.respondToAssignment(
        churchId,
        selectedPlan.id,
        activeQueueForSimulate.roleId,
        candidate.candidateId,
        simulateAction,
        simulateAction === 'decline' ? simulateDeclineReason : undefined,
        candidate.candidateName
      );

      setShowSimulateModal(false);
      if (simulateAction === 'accept') {
        Alert.alert(
          'Slot Booked! 🎉',
          `${candidate.candidateName} accepted the responsibility. Slot is now BOOKED and locked.`
        );
      } else {
        if (activeQueueForSimulate.mode === 'first_come_first_served') {
          Alert.alert(
            'Declined!',
            `${candidate.candidateName} declined ("${simulateDeclineReason}"). Slot remains available for other eligible volunteers.`
          );
        } else {
          const nextCand = activeQueueForSimulate.candidates?.[curIdx + 1];
          if (nextCand) {
            const nextPriorityLabel = curIdx + 1 === 1 ? '1st Backup' : '2nd Backup';
            Alert.alert('Declined & Cascaded!', `${candidate.candidateName} declined ("${simulateDeclineReason}"). Auto-cascade advanced immediately to ${nextPriorityLabel}: ${nextCand.candidateName}!`);
          } else {
            Alert.alert('Queue Exhausted!', `${candidate.candidateName} declined and no more candidates remain in the ladder. Queue marked as EXHAUSTED.`);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process simulated response.');
    } finally {
      setSubmittingSimulate(false);
    }
  };

  const handleDeleteQueue = (roleId: string, roleTitle: string) => {
    if (!selectedPlan) return;
    Alert.alert(
      'Reset Assignment Queue',
      `Clear the queue for "${roleTitle}" and reset assignment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await ServiceRosterService.deleteAssignmentQueue(churchId, selectedPlan.id, roleId);
              Alert.alert('Reset', 'Queue was cleared.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reset queue.');
            }
          }
        }
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 9: Volunteer Attendance & Native PDF/CSV Run-Sheet Export Actions
  // ─────────────────────────────────────────────────────────────────────────────

  const handleMarkVolunteerAttendance = async (
    volunteer: { memberId: string; memberName: string; roleId: string; roleTitle: string },
    status: 'present' | 'late' | 'absent' | 'excused'
  ) => {
    if (!selectedPlan?.id) return;
    try {
      await ServiceRosterService.markVolunteerAttendance(churchId, selectedPlan.id, {
        memberId: volunteer.memberId,
        memberName: volunteer.memberName,
        roleId: volunteer.roleId,
        roleTitle: volunteer.roleTitle,
        attendanceStatus: status,
        markedBy: member?.id || 'admin',
        markedByName: member?.name || (member as any)?.fullName || 'Administrator'
      });
    } catch (err) {
      console.error('Failed to mark volunteer attendance:', err);
      Alert.alert('Error', 'Failed to update attendance status.');
    }
  };

  const handleCheckInAllVolunteers = async () => {
    if (!selectedPlan?.id || serviceVolunteers.length === 0) return;
    Alert.alert(
      'Check-In All Volunteers',
      `Mark all ${serviceVolunteers.length} volunteer(s) as Present for ${selectedPlan.serviceTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check-In All',
          onPress: async () => {
            try {
              setSavingAttendance(true);
              const records = serviceVolunteers.map(v => ({
                memberId: v.memberId,
                memberName: v.memberName,
                roleId: v.roleId,
                roleTitle: v.roleTitle,
                attendanceStatus: 'present' as const,
                markedBy: member?.id || 'admin',
                markedByName: member?.name || (member as any)?.fullName || 'Administrator'
              }));
              await ServiceRosterService.bulkMarkVolunteerAttendance(churchId, selectedPlan.id, records);
              Alert.alert('Success', `Checked in all ${serviceVolunteers.length} volunteer(s) as Present.`);
            } catch (err) {
              console.error('Failed bulk check in:', err);
              Alert.alert('Error', 'Failed to mark all volunteers.');
            } finally {
              setSavingAttendance(false);
            }
          }
        }
      ]
    );
  };

  const handleExportPdf = async () => {
    if (!selectedPlan) return;
    try {
      setExportingPdf(true);
      await ServiceRosterService.exportServicePlanPdf(selectedPlan, activeChurch?.name || 'Worship Ministry');
    } catch (err: any) {
      console.error('Export PDF error:', err);
      Alert.alert('Export Error', err?.message || 'Could not export PDF run-sheet');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintDirectly = async () => {
    if (!selectedPlan) return;
    try {
      setPrintingSheet(true);
      await ServiceRosterService.printServicePlanDirectly(selectedPlan, activeChurch?.name || 'Worship Ministry');
    } catch (err: any) {
      console.error('Print error:', err);
      Alert.alert('Print Error', err?.message || 'Could not print run-sheet');
    } finally {
      setPrintingSheet(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedPlan) return;
    try {
      setExportingCsv(true);
      await ServiceRosterService.exportServicePlanCsv(selectedPlan);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      Alert.alert('Export Error', err?.message || 'Could not export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const renderBandInstrumentSection = (config: {
    emoji: string;
    title: string;
    instrumentKey: string;
    value: string;
    valueId: string;
    onChangeText: (txt: string) => void;
    onSelectCandidate: (cand: { id: string; name: string }) => void;
    onClear: () => void;
  }) => {
    const candidates = getMusicianCandidates(config.instrumentKey);
    const isExpanded = expandedInstrumentMembers[config.instrumentKey] || false;

    return (
      <View style={{ marginBottom: 16 }}>
        {/* Header with Title and Clear button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
            <Text style={[styles.fieldLabel, { color: primaryText, marginBottom: 0, fontWeight: '700' }]}>
              {config.title}
            </Text>
          </View>
          {config.value ? (
            <TouchableOpacity onPress={config.onClear} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={{ fontSize: 11.5, color: '#EF4444', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              color: primaryText,
              borderColor: config.value ? '#10B981' : inputBorder,
              borderWidth: config.value ? 1.5 : 1
            }
          ]}
          placeholder={`Enter or select ${config.title.toLowerCase()}`}
          placeholderTextColor="#94A3B8"
          value={config.value}
          onChangeText={config.onChangeText}
        />

        {/* Skilled Candidates Display */}
        <View style={{ marginTop: 6 }}>
          {candidates.length > 0 ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10.5, color: isDark ? '#34D399' : '#059669', fontWeight: '700', letterSpacing: 0.5 }}>
                  MATCHED BY SKILL ({candidates.length}):
                </Text>
                <TouchableOpacity
                  onPress={() => setExpandedInstrumentMembers(prev => ({ ...prev, [config.instrumentKey]: !isExpanded }))}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={{ fontSize: 10.5, color: secondaryText, fontWeight: '600' }}>
                    {isExpanded ? 'Hide All' : '+ Show All Members'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {candidates.map(c => {
                  const isSelected = config.valueId === c.id || config.value.toLowerCase().trim() === c.name.toLowerCase().trim();
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.quickMemberChip,
                        {
                          backgroundColor: isSelected ? publishBtnBg : (isDark ? '#27272A' : '#F1F5F9'),
                          borderColor: isSelected ? publishBtnBg : (c.isPrimary ? '#10B981' : (isDark ? '#3F3F46' : '#CBD5E1')),
                          borderWidth: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5
                        }
                      ]}
                      onPress={() => config.onSelectCandidate({ id: c.id, name: c.name })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickMemberChipTxt, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {c.name}
                      </Text>
                      <View style={{
                        paddingHorizontal: 5,
                        paddingVertical: 1.5,
                        borderRadius: 6,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : (c.isPrimary ? (isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7') : (isDark ? 'rgba(100,116,139,0.2)' : '#E2E8F0'))
                      }}>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '800',
                          color: isSelected ? '#FFFFFF' : (c.isPrimary ? (isDark ? '#34D399' : '#15803D') : secondaryText)
                        }}>
                          {c.badge}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 11, color: secondaryText, fontStyle: 'italic', marginBottom: 4 }}>
                No members tagged with this skill in profile. Select volunteer:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {churchMembers.slice(0, 12).map(m => {
                  const mName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Member';
                  const isSelected = config.valueId === m.id || config.value.toLowerCase().trim() === mName.toLowerCase().trim();
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.quickMemberChip,
                        {
                          backgroundColor: isSelected ? publishBtnBg : (isDark ? '#27272A' : '#F1F5F9'),
                          borderColor: isSelected ? publishBtnBg : (isDark ? '#3F3F46' : '#CBD5E1'),
                          borderWidth: 1
                        }
                      ]}
                      onPress={() => config.onSelectCandidate({ id: m.id, name: mName })}
                    >
                      <Text style={[styles.quickMemberChipTxt, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Expanded all members if toggled */}
          {candidates.length > 0 && isExpanded && (
            <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: cardBorder }}>
              <Text style={{ fontSize: 10, color: secondaryText, fontWeight: '700', marginBottom: 4 }}>
                ALL CHURCH MEMBERS:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {churchMembers.map(m => {
                  const mName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Member';
                  const isSelected = config.valueId === m.id || config.value.toLowerCase().trim() === mName.toLowerCase().trim();
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.quickMemberChip,
                        {
                          backgroundColor: isSelected ? publishBtnBg : (isDark ? '#27272A' : '#F1F5F9'),
                          borderColor: isSelected ? publishBtnBg : (isDark ? '#3F3F46' : '#CBD5E1'),
                          borderWidth: 1
                        }
                      ]}
                      onPress={() => config.onSelectCandidate({ id: m.id, name: mName })}
                    >
                      <Text style={[styles.quickMemberChipTxt, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* ─── WeChristian2 Navy Hero Header ─── */}
      <View
        style={[
          styles.heroHeader,
          {
            paddingTop: setTabByName ? 4 : insets.top + 8,
            backgroundColor: '#1A2D5A',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => { if (setTabByName) setTabByName('Dashboard'); else if (navigation?.canGoBack?.()) navigation.goBack(); else setActiveTab(0); }}
            style={[styles.circularBackBtn, { backgroundColor: 'rgba(255, 255, 255, 0.14)', borderColor: 'rgba(255, 255, 255, 0.25)' }]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
            <Text style={[styles.headerTitle, { color: '#FFFFFF', marginTop: 0 }]} numberOfLines={1}>
              {activePlannerTab === 'setlist' ? 'Worship Setlist' :
                activePlannerTab === 'queue' ? 'Assignments' :
                  activePlannerTab === 'teams' ? 'Ministry Teams' :
                    activePlannerTab === 'skills' ? 'Verified Skills' :
                      activePlannerTab === 'templates' ? 'Service Templates' :
                        'Service Roster'}
            </Text>
            <Text style={[styles.heroSub, { color: '#CBD5E1' }]} numberOfLines={1}>
              {activeChurch?.name || 'Church Worship & Roster Operations'}
            </Text>
          </View>

          {/* Right Action Button (WeChristian2 Gold CTA) */}
          <TouchableOpacity
            style={[
              styles.newServiceBtn,
              {
                backgroundColor: '#FBBF24',
                borderColor: '#FBBF24',
                flexShrink: 0
              }
            ]}
            onPress={
              activePlannerTab === 'setlist' ? openSongPicker :
              activePlannerTab === 'teams' ? openCreateTeamModal :
              activePlannerTab === 'skills' ? () => setShowAddSkillModal(true) :
              openCreateModal
            }
            activeOpacity={0.85}
          >
            <Plus size={14} color="#1A2D5A" strokeWidth={2.5} />
            <Text
              style={[
                styles.newServiceBtnTxt,
                { color: '#1A2D5A' }
              ]}
              numberOfLines={1}
            >
              {activePlannerTab === 'setlist' ? 'Add Song' :
               activePlannerTab === 'teams' ? 'Add Team' :
               activePlannerTab === 'skills' ? 'Add Skill' :
               'New Service'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Navigation Tabs & Search Bar ─── */}
      <View style={[styles.subNavSurface, { backgroundColor: screenBg, borderBottomColor: borderColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'calendar' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('calendar')}
          >
            <CalendarDays size={14} color={activePlannerTab === 'calendar' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'calendar' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Services ({plans.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'builder' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('builder')}
            disabled={!selectedPlan}
          >
            <Layers size={14} color={activePlannerTab === 'builder' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'builder' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Order Builder {selectedPlan ? `(${selectedPlan.runSheet?.length || 0})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'setlist' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('setlist')}
            disabled={!selectedPlan}
          >
            <Music size={14} color={activePlannerTab === 'setlist' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'setlist' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Worship Setlist {selectedPlan ? `(${selectedPlan.setlist?.length || 0})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'queue' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('queue')}
            disabled={!selectedPlan}
          >
            <ListOrdered size={14} color={activePlannerTab === 'queue' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'queue' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Assignments {selectedPlan ? `(${assignmentQueues.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'teams' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('teams')}
          >
            <Users size={14} color={activePlannerTab === 'teams' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'teams' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Ministry Teams ({ministryTeams.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'skills' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('skills')}
          >
            <Award size={14} color={activePlannerTab === 'skills' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'skills' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Verified Skills {pendingSkillsCount > 0 ? `(${pendingSkillsCount} ⚠️)` : `(${memberSkills.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activePlannerTab === 'templates' ? {
                backgroundColor: primaryBtnBg,
                borderColor: primaryBtnBg,
              } : {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              }
            ]}
            onPress={() => setActivePlannerTab('templates')}
          >
            <BookOpen size={14} color={activePlannerTab === 'templates' ? primaryBtnText : secondaryText} />
            <Text style={[
              styles.tabBtnTxt,
              activePlannerTab === 'templates' ? { color: primaryBtnText, fontWeight: '800' } : { color: secondaryText }
            ]}>
              Templates ({templates.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ─── Search Bar below Hero / Tabs ─── */}
        <View style={styles.headerSearchWrap}>
          <View style={[
            styles.headerSearchBar,
            {
              backgroundColor: cardSurface,
              borderColor: inputBorder,
            }
          ]}>
            <Search size={16} color={secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              placeholder={
                activePlannerTab === 'teams' ? 'Search ministry teams, leaders, members...' :
                activePlannerTab === 'calendar' ? 'Search services by title, preacher, date...' :
                activePlannerTab === 'setlist' ? 'Search worship songs, song leader...' :
                activePlannerTab === 'queue' ? 'Search roles, assignments...' :
                activePlannerTab === 'skills' ? 'Search member skills, categories...' :
                'Search service operations...'
              }
              placeholderTextColor={secondaryText}
              style={[styles.headerSearchInput, { color: primaryText }]}
              value={
                activePlannerTab === 'teams' ? teamSearchQuery :
                activePlannerTab === 'calendar' ? searchQuery :
                activePlannerTab === 'setlist' ? songLibrarySearch :
                searchQuery
              }
              onChangeText={(text) => {
                if (activePlannerTab === 'teams') setTeamSearchQuery(text);
                else if (activePlannerTab === 'calendar') setSearchQuery(text);
                else if (activePlannerTab === 'setlist') setSongLibrarySearch(text);
                else setSearchQuery(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {((activePlannerTab === 'teams' && teamSearchQuery.length > 0) ||
              (activePlannerTab === 'calendar' && searchQuery.length > 0) ||
              (activePlannerTab === 'setlist' && songLibrarySearch.length > 0)) && (
              <TouchableOpacity
                onPress={() => {
                  if (activePlannerTab === 'teams') setTeamSearchQuery('');
                  else if (activePlannerTab === 'calendar') setSearchQuery('');
                  else if (activePlannerTab === 'setlist') setSongLibrarySearch('');
                  else setSearchQuery('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ─── Body Content ─── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryBtnBg} />
          <Text style={[styles.centerText, { color: secondaryText }]}>Loading service operations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
        >
          {/* TAB 1: CALENDAR & SERVICE SCHEDULE */}
          {activePlannerTab === 'calendar' && (
            <View style={styles.tabContent}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {['all', 'draft', 'published', 'completed', 'cancelled'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text style={[styles.filterChipTxt, statusFilter === st && styles.filterChipTxtActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>



              {filteredPlans.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                  <Calendar size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>No Services Scheduled</Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    Create your first worship service, conference, or prayer meeting to start planning.
                  </Text>
                  <TouchableOpacity
                    style={styles.createEmptyBtn}
                    onPress={openCreateModal}
                  >
                    <Plus size={15} color="#FFFFFF" />
                    <Text style={styles.createEmptyBtnTxt}>Create Service</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredPlans.map((plan, planIdx) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const typeLabel = SERVICE_TYPE_LABELS[plan.serviceType] || plan.serviceType;
                  const { day, month } = getSafeDateParts(plan.date);
                  return (
                    <TouchableOpacity
                      key={plan.id ? `plan_${plan.id}_${planIdx}` : `plan_${planIdx}`}
                      style={[
                        styles.planCard,
                        { backgroundColor: cardSurface, borderColor: isSelected ? primaryBtnBg : cardBorder },
                        isSelected && styles.planCardSelected
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedPlan(plan);
                        setActivePlannerTab('builder');
                      }}
                    >
                      <View style={styles.planCardTop}>
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeDay}>{day}</Text>
                          <Text style={styles.dateBadgeMonth}>{month}</Text>
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.planTypeTag}>{typeLabel.toUpperCase()}</Text>
                            <View style={[
                              styles.miniStatusPill,
                              plan.status === 'published' ? styles.statusPillPublished :
                                plan.status === 'completed' ? styles.statusPillCompleted :
                                  styles.statusPillDraft
                            ]}>
                              <Text style={styles.miniStatusPillTxt}>{plan.status.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={[styles.planTitle, { color: primaryText }]} numberOfLines={1}>
                            {plan.serviceTitle}
                          </Text>
                          <Text style={[styles.planMeta, { color: secondaryText }]} numberOfLines={1}>
                            ⏰ {formatDisplayTime(plan.startTime)} - {formatDisplayTime(plan.endTime)} ({plan.totalDurationMinutes || 120}m) · 📍 {plan.location}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#94A3B8" />
                      </View>

                      <View style={[styles.planCardBottom, { borderTopColor: borderColor }]}>
                        <View style={styles.planStatRow}>
                          <Text style={[styles.planStatTxt, { color: secondaryText }]}>
                            📋 {plan.runSheet?.length || 0} Activities
                          </Text>
                          <Text style={[styles.planStatTxt, { color: secondaryText }]}>
                            🎵 {plan.setlist?.length || 0} Songs
                          </Text>
                          {plan.preacher && plan.preacher.trim() ? (
                            <Text style={[styles.planStatTxt, { color: secondaryText }]}>
                              🎤 {plan.preacher.trim()}
                            </Text>
                          ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {plan.status === 'draft' && (
                            <TouchableOpacity
                              style={styles.cardQuickPublishBtn}
                              onPress={() => handleQuickPublishPlan(plan)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.cardQuickPublishBtnTxt}>🚀 Publish</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.cardManageBtn, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: cardBorder }]}
                            onPress={() => openEditServiceInForm(plan)}
                            activeOpacity={0.8}
                          >
                            <Edit3 size={12} color={primaryText} style={{ marginRight: 4 }} />
                            <Text style={[styles.cardManageBtnTxt, { color: primaryText }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.cardManageBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                            onPress={() => {
                              setSelectedPlan(plan);
                              setActivePlannerTab('builder');
                            }}
                            activeOpacity={0.8}
                          >
                            <Layers size={12} color={secondaryBtnText} style={{ marginRight: 4 }} />
                            <Text style={[styles.cardManageBtnTxt, { color: secondaryBtnText }]}>Order Builder</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.cardDeleteBtn, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FECACA' }]}
                            onPress={() => handleDeleteServicePlan(plan.id, plan.serviceTitle, plan.date)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Trash2 size={13} color="#DC2626" />
                            <Text style={styles.cardDeleteBtnTxt}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: DYNAMIC ORDER BUILDER & RUNSHEET */}
          {activePlannerTab === 'builder' && selectedPlan && (
            <View style={styles.tabContent}>
              <View style={[styles.selectedBanner, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.selectedBannerTag}>SELECTED SERVICE</Text>
                    <Text style={[styles.selectedBannerTitle, { color: primaryText }]}>
                      {selectedPlan.serviceTitle}
                    </Text>

                    {/* Date and Time neatly displayed below title with proper spacing */}
                    <View style={{ marginTop: 8, gap: 5 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Calendar size={13} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: primaryText }}>
                            {formatDateMonthYear(selectedPlan.date)}
                          </Text>
                        </View>
                        <Text style={{ color: secondaryText, fontSize: 12 }}>•</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color="#D97706" />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: primaryText }}>
                            {formatDisplayTime(selectedPlan.startTime)} - {formatDisplayTime(selectedPlan.endTime)}
                          </Text>
                        </View>
                      </View>

                      {selectedPlan.location ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                          <MapPin size={13} color="#DC2626" />
                          <Text style={{ fontSize: 12.5, fontWeight: '500', color: secondaryText }} numberOfLines={1}>
                            {selectedPlan.location}
                          </Text>
                        </View>
                      ) : null}

                      {selectedPlan.theme ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                          <BookOpen size={13} color="#D97706" />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }} numberOfLines={1}>
                            Theme: "{selectedPlan.theme}" {selectedPlan.bibleReference ? `(${selectedPlan.bibleReference})` : ''}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: cardBorder }]}
                      onPress={openEditDetailsModal}
                    >
                      <Edit3 size={14} color={secondaryBtnText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: cardBorder }]}
                      onPress={openSaveAsTemplateModal}
                    >
                      <Bookmark size={14} color={secondaryBtnText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: cardBorder }]}
                      onPress={() => setShowApplyTemplateModal(true)}
                    >
                      <Copy size={14} color={secondaryBtnText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FCA5A5' }]}
                      onPress={handleDeleteService}
                    >
                      <Trash2 size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status Indicator & Main Action (Publish / Print) */}
                <View style={[styles.bannerBottomRow, { borderTopColor: borderColor, marginTop: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.statusSwitcherLabel, { color: secondaryText }]}>Status:</Text>
                    <View style={[
                      styles.statusPill,
                      selectedPlan.status === 'published' ? styles.statusPillPublished :
                        selectedPlan.status === 'live' ? styles.statusPillLive :
                          selectedPlan.status === 'completed' ? styles.statusPillCompleted :
                            styles.statusPillDraft
                    ]}>
                      <Text style={[
                        styles.statusPillTxt,
                        selectedPlan.status === 'published' ? { color: '#047857' } :
                          selectedPlan.status === 'live' ? { color: '#DC2626' } :
                            selectedPlan.status === 'completed' ? { color: '#475569' } :
                              { color: '#64748B' }
                      ]}>
                        {selectedPlan.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {selectedPlan.status === 'draft' ? (
                      <TouchableOpacity
                        style={[styles.publishServiceBtn, { paddingVertical: 8, paddingHorizontal: 14, marginBottom: 0 }]}
                        onPress={() => handlePublishServiceWithCascade(selectedPlan)}
                        activeOpacity={0.85}
                      >
                        <Send size={13} color="#FFFFFF" />
                        <Text style={styles.publishServiceBtnTxt}>
                          🚀 Publish & Notify Volunteers
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.printSheetBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                      onPress={handlePrintDirectly}
                      disabled={printingSheet}
                    >
                      {printingSheet ? (
                        <ActivityIndicator size="small" color={primaryText} />
                      ) : (
                        <>
                          <Printer size={13} color={secondaryBtnText} />
                          <Text style={[styles.printSheetBtnTxt, { color: secondaryBtnText }]}>Print</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Timeline Overlap & Bound Warnings */}
              {!timelineValidation.isValid && (
                <View style={styles.warningBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.warningTitle}>Timeline Conflict Detected</Text>
                  </View>
                  {timelineValidation.overlaps.map((ov, i) => (
                    <Text key={i} style={styles.warningMsg}>• {ov}</Text>
                  ))}
                  {timelineValidation.warnings.map((wn, i) => (
                    <Text key={i} style={styles.warningMsg}>• {wn}</Text>
                  ))}
                </View>
              )}

              {/* Order of Service Header with Add Button */}
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionHeading, { color: primaryText }]}>Order of Service</Text>
                  <Text style={[styles.sectionSubheading, { color: secondaryText }]}>
                    {selectedPlan.runSheet?.length || 0} items · Total {selectedPlan.totalDurationMinutes || 0} minutes
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addActivityBtn}
                  onPress={openAddActivityModal}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addActivityBtnTxt}>Add Activity</Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic RunSheet List */}
              {(!selectedPlan.runSheet || selectedPlan.runSheet.length === 0) ? (
                <View style={[styles.emptyRunSheetCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Layers size={32} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>No Activities Added Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    Build the timeline by adding worship, prayer, sermon, and communion segments or apply a ready template.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.addActivityBtn}
                      onPress={openAddActivityModal}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.addActivityBtnTxt}>Add Activity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.applyTemplateBtn}
                      onPress={() => setShowApplyTemplateModal(true)}
                    >
                      <Copy size={14} color={secondaryBtnText} />
                      <Text style={styles.applyTemplateBtnTxt}>Apply Template</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                selectedPlan.runSheet.map((item, index) => {
                  const catDef = getCategoryDef(item.category);
                  const catStyle = { bg: catDef.bg, text: catDef.text };
                  return (
                    <View
                      key={item.id ? `run_${item.id}_${index}` : `run_${index}`}
                      style={[styles.runSheetItemCard, { backgroundColor: cardSurface, borderColor }]}
                    >
                      <View style={styles.reorderColumn}>
                        <TouchableOpacity
                          style={[styles.reorderArrow, index === 0 && { opacity: 0.2 }]}
                          disabled={index === 0}
                          onPress={() => handleMoveActivity(index, 'up')}
                        >
                          <ChevronUp size={16} color="#64748B" />
                        </TouchableOpacity>
                        <Text style={styles.orderNumberText}>{item.order || index + 1}</Text>
                        <TouchableOpacity
                          style={[styles.reorderArrow, index === selectedPlan.runSheet.length - 1 && { opacity: 0.2 }]}
                          disabled={index === selectedPlan.runSheet.length - 1}
                          onPress={() => handleMoveActivity(index, 'down')}
                        >
                          <ChevronDown size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, paddingHorizontal: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
                            <Text style={[styles.categoryBadgeTxt, { color: catStyle.text }]}>
                              {catDef.label.toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.timeBadge, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: cardBorder, borderWidth: 1 }]}>
                            <Clock size={11} color={isDark ? '#A1A1AA' : secondaryText} />
                            <Text style={[styles.timeBadgeTxt, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                              {formatDisplayTime(item.startTime)} - {formatDisplayTime(item.endTime)} ({item.durationMinutes}m)
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.itemProgramTitle, { color: primaryText }]}>
                          {item.program}
                        </Text>

                        {item.responsiblePerson ? (
                          <Text style={[styles.itemResponsible, { color: secondaryText }]}>
                            👤 Assigned: <Text style={{ fontWeight: '700', color: primaryText }}>{item.responsiblePerson}</Text>
                            {item.supportingTeam ? ` (${item.supportingTeam})` : ''}
                          </Text>
                        ) : null}

                        {item.instructions ? (
                          <Text style={[styles.itemInstructions, { color: secondaryText }]} numberOfLines={2}>
                            📝 {item.instructions}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.itemActionCol}>
                        <TouchableOpacity
                          style={[
                            styles.itemEditBtn,
                            {
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF',
                              borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                            }
                          ]}
                          onPress={() => openEditActivityModal(item)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="Edit activity"
                        >
                          <Edit3 size={15} color={isDark ? '#60A5FA' : '#2563EB'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.itemDeleteBtn,
                            {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
                              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
                            }
                          ]}
                          onPress={() => handleDeleteActivity(item.id, item.program)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="Delete activity"
                        >
                          <Trash2 size={15} color={isDark ? '#F87171' : '#DC2626'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: WORSHIP SETLIST MANAGEMENT (PHASE 3) */}
          {activePlannerTab === 'setlist' && selectedPlan && (
            <View style={styles.tabContent}>
              {/* Setlist Summary Banner */}
              <View style={[styles.selectedBanner, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedBannerTag}>WORSHIP SETLIST</Text>
                    <Text style={[styles.selectedBannerTitle, { color: primaryText }]}>
                      {selectedPlan.serviceTitle} ({formatDateMonthYear(selectedPlan.date)})
                    </Text>
                    <Text style={[styles.selectedBannerMeta, { color: secondaryText }]}>
                      🎵 {selectedPlan.setlist?.length || 0} Songs Selected · Total Worship Time: ~{totalSetlistMinutes} mins
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addActivityBtn}
                    onPress={openSongPicker}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.addActivityBtnTxt}>Add Song</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* WHOLE-SERVICE WORSHIP BAND CARD */}
              <View style={[styles.selectedBanner, { backgroundColor: cardSurface, borderColor: cardBorder, marginTop: 10, marginBottom: 14 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(251, 191, 36, 0.16)' : '#EEF2FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Music size={16} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.selectedBannerTag, { marginBottom: 1 }]}>SERVICE WORSHIP BAND</Text>
                      <Text style={[styles.selectedBannerTitle, { color: primaryText, fontSize: 15 }]} numberOfLines={1}>
                        Whole-Service Musical Instruments
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.publishServiceBtn, { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: publishBtnBg, flexShrink: 0 }]}
                    onPress={openServiceBandModal}
                    activeOpacity={0.85}
                  >
                    <Edit3 size={13} color="#FFFFFF" />
                    <Text style={[styles.publishServiceBtnTxt, { fontSize: 12 }]}>
                      {selectedPlan.assignments?.['role_keyboard'] || selectedPlan.assignments?.['role_drums'] ? 'Edit Band' : '+ Assign Band'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11.5, color: secondaryText, marginBottom: 10 }}>
                  Assigned once for the whole service. All setlist praise songs automatically use this band without needing to assign per song.
                </Text>

                {/* Band Members Quick Grid - 2-Column Responsive Layout */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                  {/* Keyboard */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>🎹</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>KEYBOARD</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_keyboard'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_keyboard'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Drums */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>🥁</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>DRUMS</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_drums'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_drums'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Bass Guitar */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>🎸</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>BASS GUITAR</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_bass'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_bass'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Acoustic Guitar */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>🎸</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>ACOUSTIC GUITAR</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_acoustic'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_acoustic'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Electric Guitar */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>⚡</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>ELECTRIC GUITAR</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_electric'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_electric'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Sound & Audio */}
                  <View style={{ width: '48.5%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 14 }}>🎧</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>SOUND / AUDIO</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: selectedPlan.assignments?.['role_sound'] ? primaryText : '#94A3B8', lineHeight: 16 }} numberOfLines={2}>
                        {selectedPlan.assignments?.['role_sound'] || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Worship Leader */}
                  {selectedPlan.assignments?.['role_worship_leader'] ? (
                    <View style={{ width: '100%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}>
                      <Text style={{ fontSize: 14 }}>🎤</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 9.5, color: secondaryText, fontWeight: '700' }} numberOfLines={1}>WORSHIP LEADER</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: primaryText, lineHeight: 16 }} numberOfLines={2}>
                          {selectedPlan.assignments['role_worship_leader']}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Setlist Songs List */}
              {(!selectedPlan.setlist || selectedPlan.setlist.length === 0) ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Music size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>No Songs in Setlist</Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    Select praise and worship songs from your church library, assign song leaders, keys, and instrumentalists.
                  </Text>
                  <TouchableOpacity
                    style={styles.createEmptyBtn}
                    onPress={openSongPicker}
                  >
                    <Plus size={15} color="#FFFFFF" />
                    <Text style={styles.createEmptyBtnTxt}>Add from Song Library</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                selectedPlan.setlist.map((item, index) => {
                  const musicians = item.musicianAssignments || {};
                  return (
                    <View
                      key={item.id ? `set_${item.id}_${index}` : `set_${index}`}
                      style={[styles.setlistCard, { backgroundColor: cardSurface, borderColor }]}
                    >
                      {/* Top Row: Reorder Arrows + Song Details */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                        {/* Reorder Arrows */}
                        <View style={styles.reorderColumn}>
                          <TouchableOpacity
                            style={[styles.reorderArrow, index === 0 && { opacity: 0.2 }]}
                            disabled={index === 0}
                            onPress={() => handleMoveSetlistSong(index, 'up')}
                          >
                            <ChevronUp size={16} color="#64748B" />
                          </TouchableOpacity>
                          <Text style={styles.orderNumberText}>{index + 1}</Text>
                          <TouchableOpacity
                            style={[styles.reorderArrow, index === selectedPlan.setlist.length - 1 && { opacity: 0.2 }]}
                            disabled={index === selectedPlan.setlist.length - 1}
                            onPress={() => handleMoveSetlistSong(index, 'down')}
                          >
                            <ChevronDown size={16} color="#64748B" />
                          </TouchableOpacity>
                        </View>

                        {/* Song Details */}
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <View style={styles.keyBadge}>
                              <Text style={styles.keyBadgeTxt}>Key {item.key || 'G'}</Text>
                            </View>
                            <View style={styles.bpmBadge}>
                              <Text style={styles.bpmBadgeTxt}>{item.tempo || '120'} BPM</Text>
                            </View>
                            <View style={styles.timeSigBadge}>
                              <Text style={styles.timeSigBadgeTxt}>{item.timeSignature || '4/4'}</Text>
                            </View>
                            <Text style={[styles.durationTxt, { color: secondaryText }]}>
                              ⏱️ ~{item.durationMinutes || 6}m
                            </Text>
                          </View>

                          <Text style={[styles.setlistSongTitle, { color: primaryText }]}>
                            {item.title}
                          </Text>
                          {item.titleTe ? (
                            <Text style={[styles.setlistSongTe, { color: '#D97706' }]}>
                              {item.titleTe}
                            </Text>
                          ) : null}

                          <Text style={[styles.setlistLeaderTxt, { color: secondaryText }]}>
                            🎤 Song Leader: <Text style={{ fontWeight: '700', color: primaryText }}>{item.ledBy || 'Worship Leader'}</Text>
                          </Text>

                          {/* Musicians Breakdown (Inherits from Whole-Service Band) */}
                          <View style={styles.musiciansChipRow}>
                            {(musicians.keyboard?.memberName || selectedPlan.assignments?.['role_keyboard']) && (
                              <View style={styles.musicianChip}>
                                <Text style={styles.musicianChipTxt}>🎹 Keys: {musicians.keyboard?.memberName || selectedPlan.assignments?.['role_keyboard']}</Text>
                              </View>
                            )}
                            {(musicians.drums?.memberName || selectedPlan.assignments?.['role_drums']) && (
                              <View style={styles.musicianChip}>
                                <Text style={styles.musicianChipTxt}>🥁 Drums: {musicians.drums?.memberName || selectedPlan.assignments?.['role_drums']}</Text>
                              </View>
                            )}
                            {(musicians.bass?.memberName || selectedPlan.assignments?.['role_bass']) && (
                              <View style={styles.musicianChip}>
                                <Text style={styles.musicianChipTxt}>🎸 Bass: {musicians.bass?.memberName || selectedPlan.assignments?.['role_bass']}</Text>
                              </View>
                            )}
                            {(musicians.acoustic?.memberName || selectedPlan.assignments?.['role_acoustic']) && (
                              <View style={styles.musicianChip}>
                                <Text style={styles.musicianChipTxt}>🎸 Acoustic: {musicians.acoustic?.memberName || selectedPlan.assignments?.['role_acoustic']}</Text>
                              </View>
                            )}
                            {(musicians.electric?.memberName || selectedPlan.assignments?.['role_electric']) && (
                              <View style={styles.musicianChip}>
                                <Text style={styles.musicianChipTxt}>⚡ Electric: {musicians.electric?.memberName || selectedPlan.assignments?.['role_electric']}</Text>
                              </View>
                            )}
                          </View>

                          {item.rehearsalNotes ? (
                            <Text style={[styles.rehearsalNotesTxt, { color: secondaryText }]} numberOfLines={2}>
                              📝 Arrangement: {item.rehearsalNotes}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Action Row below song details - Clean, professional, dark-mode compliant */}
                      <View style={{ width: '100%', flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#27272A' : '#E2E8F0' }}>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}
                          onPress={() => openLyricsModal(item)}
                          activeOpacity={0.7}
                        >
                          <FileText size={13} color={primaryText} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: primaryText }}>Lyrics</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }}
                          onPress={() => openEditSetlistItem(item, index)}
                          activeOpacity={0.7}
                        >
                          <Sliders size={13} color={primaryText} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: primaryText }}>Edit / Key</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2', borderWidth: 1, borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : '#FECACA' }}
                          onPress={() => handleRemoveSetlistSong(item.id)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={13} color="#DC2626" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB: ASSIGNMENT QUEUES & CASCADE WORKFLOW (PHASE 4) */}
          {activePlannerTab === 'queue' && selectedPlan && (
            <View style={styles.tabContent}>
              {/* Selected Service Banner in Assignments tab */}
              <View style={[styles.selectedBanner, { backgroundColor: cardSurface, borderColor: cardBorder, marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.selectedBannerTag}>SERVICE RESPONSIBILITY ASSIGNMENTS</Text>
                    <Text style={[styles.selectedBannerTitle, { color: primaryText }]}>
                      {selectedPlan.serviceTitle}
                    </Text>
                    <Text style={[styles.selectedBannerMeta, { color: secondaryText }]}>
                      📅 {formatDateMonthYear(selectedPlan.date)} · ⏰ {formatDisplayTime(selectedPlan.startTime)} - {formatDisplayTime(selectedPlan.endTime)} · 📍 {selectedPlan.location}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: cardBorder }]}
                      onPress={openEditDetailsModal}
                    >
                      <Edit3 size={14} color={secondaryBtnText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bannerActionBtn, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FCA5A5' }]}
                      onPress={handleDeleteService}
                    >
                      <Trash2 size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status and Publish button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: secondaryText, fontWeight: '600' }}>Service Status:</Text>
                    <View style={[
                      styles.miniStatusPill,
                      selectedPlan.status === 'published' ? styles.statusPillPublished : styles.statusPillDraft
                    ]}>
                      <Text style={styles.miniStatusPillTxt}>{selectedPlan.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {selectedPlan.status === 'draft' ? (
                    <TouchableOpacity
                      style={[styles.publishServiceBtn, { paddingVertical: 7, paddingHorizontal: 12 }]}
                      onPress={() => handlePublishServiceWithCascade(selectedPlan)}
                      activeOpacity={0.85}
                    >
                      <Send size={13} color="#FFFFFF" />
                      <Text style={[styles.publishServiceBtnTxt, { fontSize: 12 }]}>
                        Publish & Dispatch
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.outlineActionBtn, { paddingVertical: 6, paddingHorizontal: 10, borderColor: '#059669', backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5' }]}
                      onPress={() => handlePublishServiceWithCascade(selectedPlan)}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={13} color="#059669" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                        Re-dispatch / Notify
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Automatic Background Notifications Alert Box */}
              <View style={[styles.cascadeAlertBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder, marginBottom: 12 }]}>
                <Send size={15} color={isDark ? '#FBBF24' : '#1A2D5A'} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cascadeAlertTitle, { color: isDark ? '#FBBF24' : '#1A2D5A' }]}>
                    Automatic Responsibility Assignment & Slot Booking
                  </Text>
                  <Text style={[styles.cascadeAlertBody, { color: secondaryText }]}>
                    When a service is published, the system automatically identifies all eligible members based on verified skills (Keyboards, Drums, Guitars, Audio, Order of Service) and broadcasts simultaneous notifications (First-Come, First-Served). The first member to accept books the slot immediately.
                  </Text>
                </View>
              </View>

              {/* Summary banner */}
              <View style={[styles.queueSummaryBanner, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={styles.queueSummaryCol}>
                  <Text style={[styles.queueSummaryNum, { color: primaryText }]}>{serviceRolesList.length}</Text>
                  <Text style={[styles.queueSummaryLbl, { color: secondaryText }]}>Total Roles</Text>
                </View>
                <View style={[styles.queueSummaryDivider, { backgroundColor: borderColor }]} />
                <View style={styles.queueSummaryCol}>
                  <Text style={[styles.queueSummaryNum, { color: '#059669' }]}>
                    {assignmentQueues.filter(q => q.status === 'confirmed').length}
                  </Text>
                  <Text style={[styles.queueSummaryLbl, { color: secondaryText }]}>Confirmed</Text>
                </View>
                <View style={[styles.queueSummaryDivider, { backgroundColor: borderColor }]} />
                <View style={styles.queueSummaryCol}>
                  <Text style={[styles.queueSummaryNum, { color: '#D97706' }]}>
                    {assignmentQueues.filter(q => q.status === 'pending').length}
                  </Text>
                  <Text style={[styles.queueSummaryLbl, { color: secondaryText }]}>Pending</Text>
                </View>
                <View style={[styles.queueSummaryDivider, { backgroundColor: borderColor }]} />
                <View style={styles.queueSummaryCol}>
                  <Text style={[styles.queueSummaryNum, { color: '#DC2626' }]}>
                    {assignmentQueues.filter(q => q.status === 'exhausted').length}
                  </Text>
                  <Text style={[styles.queueSummaryLbl, { color: secondaryText }]}>Exhausted</Text>
                </View>
              </View>

              {/* Roles list */}
              {serviceRolesList.length === 0 ? (
                <View style={[styles.emptyRunSheetCard, { backgroundColor: cardSurface, borderColor: cardBorder, marginTop: 12 }]}>
                  <Users size={32} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>No Roles Found</Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    Service roles are generated from your Order of Service items and standard church positions. Add items in the Order Builder to assign responsibilities.
                  </Text>
                  <TouchableOpacity
                    style={[styles.addActivityBtn, { marginTop: 12 }]}
                    onPress={() => setActivePlannerTab('builder')}
                  >
                    <Layers size={14} color="#FFFFFF" />
                    <Text style={styles.addActivityBtnTxt}>Go to Order Builder</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                serviceRolesList.map((role, rIdx) => {
                  const queue = assignmentQueues.find(q => q.roleId === role.roleId);
                  const curIdx = queue?.currentCandidateIndex || 0;
                  const activeCandidate = queue?.candidates?.[curIdx];
                  const directAssignedName = selectedPlan.assignments?.[role.roleId];
                  const isConfirmed = queue?.status === 'confirmed' || (Boolean(directAssignedName) && queue?.status !== 'exhausted' && queue?.status !== 'cancelled');
                  const isPending = queue?.status === 'pending' && !isConfirmed;
                  const isExhausted = queue?.status === 'exhausted' && !isConfirmed;
                  const notDispatched = !queue && !isConfirmed;

                  return (
                    <View
                      key={role.roleId ? `role_${role.roleId}_${rIdx}` : `role_${rIdx}`}
                      style={[
                        styles.queueRoleCard,
                        { backgroundColor: cardSurface, borderColor: cardBorder },
                        isConfirmed && styles.queueRoleCardConfirmed,
                        isPending && styles.queueRoleCardPending,
                        isExhausted && styles.queueRoleCardExhausted
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.queueRoleHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                            <View style={[styles.queueCategoryPill, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: cardBorder, borderWidth: 1 }]}>
                              <Text style={[styles.queueCategoryPillTxt, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>
                                {getCategoryDef(role.category).label.toUpperCase()}
                              </Text>
                            </View>
                            {role.activityName ? (
                              <Text style={[styles.queueActivityTag, { color: secondaryText }]} numberOfLines={1}>
                                Activity: {role.activityName}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={[styles.queueRoleTitle, { color: primaryText }]}>
                            {role.roleTitle}
                          </Text>
                        </View>

                        {/* Status Pill */}
                        {isConfirmed && (
                          <View style={[styles.queueStatusBadge, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5', borderColor: isDark ? 'rgba(5, 150, 105, 0.4)' : '#A7F3D0', borderWidth: 1 }]}>
                            <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} />
                            <Text style={[styles.badgeConfirmedTxt, { color: isDark ? '#34D399' : '#059669' }]}>
                              {queue?.mode === 'first_come_first_served' ? 'BOOKED' : 'CONFIRMED'}
                            </Text>
                          </View>
                        )}
                        {isPending && (
                          <View style={[styles.queueStatusBadge, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : '#FDE68A', borderWidth: 1 }]}>
                            <Timer size={12} color={isDark ? '#FBBF24' : '#D97706'} />
                            <Text style={[styles.badgePendingTxt, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                              {queue?.mode === 'first_come_first_served'
                                ? `AVAILABLE (${queue.eligibleMemberIds?.length || queue.candidates?.length || 0} Eligible)`
                                : `PENDING (${curIdx === 0 ? 'Primary' : curIdx === 1 ? '1st Backup' : '2nd Backup'})`}
                            </Text>
                          </View>
                        )}
                        {isExhausted && (
                          <View style={[styles.queueStatusBadge, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2', borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA', borderWidth: 1 }]}>
                            <AlertCircle size={12} color={isDark ? '#F87171' : '#DC2626'} />
                            <Text style={[styles.badgeExhaustedTxt, { color: isDark ? '#F87171' : '#DC2626' }]}>
                              {queue?.mode === 'first_come_first_served' ? 'NO MEMBERS AVAILABLE' : 'EXHAUSTED'}
                            </Text>
                          </View>
                        )}
                        {notDispatched && (
                          <View style={[styles.queueStatusBadge, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: cardBorder, borderWidth: 1 }]}>
                            <Text style={[styles.badgeDraftTxt, { color: isDark ? '#A1A1AA' : '#64748B' }]}>UNASSIGNED</Text>
                          </View>
                        )}
                      </View>

                      {/* Confirmed Volunteer Banner */}
                      {isConfirmed && (
                        <View style={[
                          styles.confirmedVolunteerBanner,
                          {
                            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                            borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0',
                            borderWidth: 1,
                          }
                        ]}>
                          <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.confirmedVolunteerName, { color: isDark ? '#34D399' : '#065F46' }]}>
                              {queue?.confirmedCandidateName || directAssignedName || 'Assigned Volunteer'}
                            </Text>
                            <Text style={[styles.confirmedVolunteerSub, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                              Ready for service responsibility · Contact: {activeCandidate?.candidatePhone || 'In church directory'}
                            </Text>
                          </View>
                        </View>
                      )}

                    {/* Candidate Ladder / Eligible Members when queue exists */}
                    {queue && queue.candidates && queue.candidates.length > 0 && (() => {
                      const uniqueCandidates = ServiceRosterService.deduplicateCandidates(queue.candidates);
                      return (
                        <View style={[
                          styles.candidateLadderBox,
                          {
                            backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                            borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                            borderWidth: 1,
                          }
                        ]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={[styles.candidateLadderHeading, { color: isDark ? '#A1A1AA' : '#64748B', marginBottom: 0 }]}>
                              {queue.mode === 'first_come_first_served'
                                ? `ELIGIBLE MEMBERS & RESPONSES (${uniqueCandidates.length} ${uniqueCandidates.length === 1 ? 'volunteer' : 'volunteers'})`
                                : `CANDIDATE REPLACEMENT LADDER (${uniqueCandidates.length} ${uniqueCandidates.length === 1 ? 'candidate' : 'candidates'})`}
                            </Text>
                            <Text style={{ fontSize: 10, color: isDark ? '#71717A' : '#94A3B8' }}>
                              Timeout: {Math.round((queue.timeoutMinutes || 1440) / 60)}h{queue.mode === 'first_come_first_served' ? ' · First-Come' : ''}
                            </Text>
                          </View>
                          {uniqueCandidates.map((cand, idx) => {
                            const isCurrentActive = idx === curIdx && isPending;
                            const isCandAccepted = cand.status === 'accepted';
                            const isCandDeclined = cand.status === 'declined';
                            const isCandTimedOut = cand.status === 'timed_out';

                            return (
                              <View
                                key={cand.candidateId ? `cand_${cand.candidateId}_${idx}` : `cand_${idx}`}
                                style={[
                                  styles.ladderCandidateRow,
                                  { borderBottomColor: isDark ? '#3F3F46' : '#F1F5F9' },
                                  isCurrentActive && [
                                    styles.ladderCandidateRowActive,
                                    { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7' }
                                  ],
                                  isCandAccepted && [
                                    styles.ladderCandidateRowAccepted,
                                    { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }
                                  ]
                                ]}
                              >
                                <View style={[
                                  styles.rankCircle,
                                  isCurrentActive ? styles.rankCircleActive :
                                    isCandAccepted ? styles.rankCircleAccepted :
                                      isCandDeclined ? styles.rankCircleDeclined :
                                        styles.rankCircleIdle
                                ]}>
                                  <Text style={styles.rankCircleTxt}>{idx + 1}</Text>
                                </View>

                                <View style={{ flex: 1, paddingHorizontal: 8 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <Text style={[styles.ladderCandName, { color: primaryText }]}>
                                      {cand.candidateName}
                                    </Text>
                                    {queue.mode !== 'first_come_first_served' && !isCandDeclined && !isCandAccepted && (
                                      <View style={{
                                        paddingHorizontal: 5,
                                        paddingVertical: 1,
                                        borderRadius: 4,
                                        backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FFFBEB'
                                      }}>
                                        <Text style={{
                                          fontSize: 9.5,
                                          fontWeight: '700',
                                          color: isDark ? '#FBBF24' : '#D97706'
                                        }}>
                                          {idx === 0 ? 'Primary' : idx === 1 ? '1st Backup' : '2nd Backup'}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={[
                                    styles.ladderCandMeta,
                                    {
                                      color: isCandAccepted ? (isDark ? '#34D399' : '#059669') :
                                        isCandDeclined ? (isDark ? '#F87171' : '#DC2626') :
                                          isCurrentActive ? (isDark ? '#FBBF24' : '#D97706') :
                                            secondaryText
                                    }
                                  ]}>
                                    {isCandAccepted ? '✅ Accepted & confirmed (Slot Booked)' :
                                      isCandDeclined ? `❌ Declined: ${cand.declineReason || 'Unavailable'}` :
                                        isCandTimedOut ? '⏰ Response deadline expired' :
                                          queue.mode === 'first_come_first_served'
                                            ? (queue.status === 'confirmed' ? 'Slot booked by another member' : `⏳ Awaiting response · First to accept gets booked`)
                                            : (isCurrentActive ? `⏳ Awaiting response · Deadline in ~${Math.round(queue.timeoutMinutes / 60)}h` :
                                                idx === 1 ? 'In reserve (1st Backup)' : 'In reserve (2nd Backup)')}
                                  </Text>
                                </View>

                                {!isCandDeclined && (
                                  <View style={[
                                    styles.candStatusMiniPill,
                                    isCandAccepted ? styles.candPillAccepted :
                                      isCandTimedOut ? styles.candPillTimedOut :
                                        isCurrentActive ? styles.candPillActive :
                                          [styles.candPillWaiting, { backgroundColor: isDark ? '#3F3F46' : '#E2E8F0' }]
                                  ]}>
                                    <Text style={[
                                      styles.candStatusMiniTxt,
                                      (!isCandAccepted && !isCandTimedOut && !isCurrentActive) ? {
                                        color: isDark ? '#D4D4D8' : '#64748B'
                                      } : { color: '#FFFFFF' }
                                    ]}>
                                      {isCandAccepted ? 'BOOKED' : (queue.mode === 'first_come_first_served' ? 'OFFERED' : cand.status.toUpperCase())}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}

                    {/* Actions: Row 1 (Primary 2-column balanced action buttons: Broadcast & Direct Assign) */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        style={[styles.dispatchQueueBtn, { flex: 1, paddingVertical: 9, paddingHorizontal: 10, justifyContent: 'center' }]}
                        onPress={() => openDispatchQueueModal(
                          role.roleId,
                          role.roleTitle,
                          role.activityId,
                          role.activityName,
                          role.suggestedTeamId,
                          role.suggestedSkill,
                          role.suggestedTeamIds
                        )}
                        activeOpacity={0.8}
                      >
                        <Send size={12} color="#FFFFFF" />
                        <Text style={styles.dispatchQueueBtnTxt} numberOfLines={1}>
                          {notDispatched ? '⚡ Auto-Assign' : (queue?.mode === 'first_come_first_served' ? '⚡ Broadcast' : '⚡ Reconfigure')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.overrideBtn,
                          {
                            flex: 1,
                            paddingVertical: 9,
                            paddingHorizontal: 10,
                            justifyContent: 'center',
                            backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                            borderColor: isDark ? '#3F3F46' : '#CBD5E1'
                          }
                        ]}
                        onPress={() => openManualOverrideModal(role.roleId, role.roleTitle)}
                        activeOpacity={0.8}
                      >
                        <UserCheck size={13} color={primaryText} />
                        <Text style={[styles.overrideBtnTxt, { color: primaryText }]} numberOfLines={1}>Direct Assign</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Actions: Row 2 (Accept, Decline & Reset buttons cleanly aligned) */}
                    {(queue || isConfirmed) && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.simulateBtn,
                            {
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              justifyContent: 'center',
                              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                              borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0'
                            }
                          ]}
                          onPress={() => {
                            if (queue?.candidates && queue.candidates.length > 0) {
                              openSimulateModal(queue, 'accept');
                            } else {
                              openManualOverrideModal(role.roleId, role.roleTitle);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} />
                          <Text style={[styles.simulateBtnTxt, { color: isDark ? '#34D399' : '#059669' }]} numberOfLines={1}>
                            Accept
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.simulateBtn,
                            {
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              justifyContent: 'center',
                              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
                              borderColor: isDark ? 'rgba(217, 119, 6, 0.35)' : '#FDE68A'
                            }
                          ]}
                          onPress={() => {
                            if (queue?.candidates && queue.candidates.length > 0) {
                              openSimulateModal(queue, 'decline');
                            } else {
                              Alert.alert(
                                'No Candidates in Queue',
                                `No candidate is currently queued for "${role.roleTitle}". Tap "⚡ Auto-Assign" to broadcast to eligible members.`
                              );
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <X size={12} color={isDark ? '#FBBF24' : '#D97706'} />
                          <Text style={[styles.simulateBtnTxt, { color: isDark ? '#FBBF24' : '#B45309' }]} numberOfLines={1}>
                            Decline
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.deleteQueueBtn,
                            {
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
                              borderColor: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FECACA'
                            }
                          ]}
                          onPress={() => handleDeleteQueue(role.roleId, role.roleTitle)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={12} color={isDark ? '#F87171' : '#DC2626'} />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? '#F87171' : '#DC2626' }} numberOfLines={1}>
                            Reset
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

          {/* TAB: VOLUNTEER ATTENDANCE (PHASE 9) */}
          {/* TAB 4: MINISTRY TEAMS MANAGEMENT (PHASE 2) */}
          {activePlannerTab === 'teams' && (
            <View style={styles.tabContent}>
              {teamOrderFeedback && (
                <View style={[styles.feedbackBanner, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={[styles.feedbackBannerTxt, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                    {teamOrderFeedback}
                  </Text>
                </View>
              )}

              {filteredMinistryTeams.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Users size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>
                    {teamSearchQuery.trim() ? 'No Matching Teams' : 'No Ministry Teams Yet'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    {teamSearchQuery.trim()
                      ? `No ministry teams found matching "${teamSearchQuery}". Try another keyword.`
                      : 'Set up your standard ministry departments (Worship, Audio, Livestream, Ushers, Communion).'}
                  </Text>
                  {teamSearchQuery.trim() ? (
                    <TouchableOpacity
                      style={[styles.createEmptyBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderWidth: 1, borderColor: cardBorder }]}
                      onPress={() => setTeamSearchQuery('')}
                    >
                      <X size={15} color={primaryText} />
                      <Text style={[styles.createEmptyBtnTxt, { color: primaryText }]}>Clear Search</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.createEmptyBtn}
                      onPress={handleSeedDefaultTeams}
                    >
                      <Sparkles size={15} color="#FFFFFF" />
                      <Text style={styles.createEmptyBtnTxt}>Seed 14 Standard Teams</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredMinistryTeams.map((team, index) => {
                  const memberCount = team.memberIds?.length || 0;
                  const memberNames = getTeamMemberNames(team.memberIds);
                  return (
                    <View
                      key={team.id}
                      style={[
                        styles.teamCard,
                        {
                          backgroundColor: cardSurface,
                          borderColor: cardBorder,
                        }
                      ]}
                    >
                      {/* Left Department Accent Bar */}
                      <View style={[styles.teamColorBar, { backgroundColor: team.color || '#1A2D5A' }]} />

                      {/* Main Card Information Area */}
                      <TouchableOpacity
                        style={styles.teamCardContent}
                        activeOpacity={0.85}
                        onPress={() => openEditTeamModal(team)}
                      >
                        {/* Header: Team Name & Status Badge */}
                        <View style={styles.teamHeaderRow}>
                          <Text style={[styles.teamTitle, { color: primaryText, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                            {team.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View
                              style={[
                                styles.teamActiveBadge,
                                team.active
                                  ? (isDark ? styles.teamActiveBadgeOnDark : styles.teamActiveBadgeOn)
                                  : (isDark ? styles.teamActiveBadgeOffDark : styles.teamActiveBadgeOff)
                              ]}
                            >
                              <Text
                                style={[
                                  styles.teamActiveBadgeTxt,
                                  team.active
                                    ? (isDark ? styles.teamActiveBadgeTxtOnDark : styles.teamActiveBadgeTxtOn)
                                    : styles.teamActiveBadgeTxtOff
                                ]}
                              >
                                {team.active ? 'ACTIVE' : 'INACTIVE'}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.itemDeleteBtn,
                                {
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
                                  borderWidth: 1,
                                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                                }
                              ]}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                handleDeleteTeam(team);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel={`Delete ${team.name}`}
                            >
                              <Trash2 size={13} color={isDark ? '#F87171' : '#DC2626'} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Description */}
                        <Text style={[styles.teamDescription, { color: secondaryText }]} numberOfLines={2}>
                          {team.description || `Ministry team serving ${activeChurch?.name || 'the church'}`}
                        </Text>

                        {/* Footer Meta: Leader & Assigned Members */}
                        <View style={[styles.teamMetaBox, { borderTopColor: isDark ? '#27272A' : '#F1F5F9', borderTopWidth: 1, paddingTop: 10, marginTop: 4 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 120 }}>
                              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 11 }}>👑</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.teamMetaTxt, { color: secondaryText }]} numberOfLines={1}>
                                  Leader: <Text style={{ fontWeight: '700', color: primaryText }}>{team.leaderName || 'Unassigned'}</Text>
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.teamMembersCountBadge, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: cardBorder, borderWidth: 1 }]}>
                              <Users size={12} color={secondaryText} />
                              <Text style={[styles.teamMembersCountTxt, { color: isDark ? '#E4E4E7' : '#0F172A' }]}>
                                {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                              </Text>
                            </View>
                          </View>

                          {/* Dedicated Member Names Roster: prevents names from getting mixed */}
                          {memberNames.length > 0 && (
                            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#27272A' : '#F1F5F9' }}>
                              <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? '#A1A1AA' : '#64748B', marginBottom: 5 }}>
                                Team Members ({memberCount}):
                              </Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                {memberNames.map((mName, mIdx) => (
                                  <View
                                    key={mIdx}
                                    style={{
                                      paddingHorizontal: 7,
                                      paddingVertical: 3,
                                      borderRadius: 6,
                                      backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                                      borderWidth: 1,
                                      borderColor: cardBorder,
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: primaryText }}>
                                      {mName}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Clean Dedicated Reorder Column */}
                      <View style={[styles.teamReorderCol, { borderLeftColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                        <TouchableOpacity
                          style={[
                            styles.reorderArrowBtn,
                            {
                              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                            },
                            index === 0 && styles.reorderArrowBtnDisabled
                          ]}
                          disabled={index === 0 || isSavingTeamOrder}
                          onPress={() => handleMoveTeam(index, 'up')}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <ChevronUp
                            size={16}
                            color={index === 0 ? (isDark ? '#52525B' : '#CBD5E1') : (isDark ? '#FAFAFA' : '#0F172A')}
                            strokeWidth={2.6}
                          />
                        </TouchableOpacity>

                        <View style={styles.orderRankPill}>
                          <Text style={[styles.orderRankTxt, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                            #{index + 1}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.reorderArrowBtn,
                            {
                              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                            },
                            index === ministryTeams.length - 1 && styles.reorderArrowBtnDisabled
                          ]}
                          disabled={index === ministryTeams.length - 1 || isSavingTeamOrder}
                          onPress={() => handleMoveTeam(index, 'down')}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <ChevronDown
                            size={16}
                            color={index === ministryTeams.length - 1 ? (isDark ? '#52525B' : '#CBD5E1') : (isDark ? '#FAFAFA' : '#0F172A')}
                            strokeWidth={2.6}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 5: MEMBER SKILLS & VERIFICATION (PHASE 2) */}
          {activePlannerTab === 'skills' && (
            <View style={styles.tabContent}>
              <View style={styles.skillStatsRow}>
                <View style={[styles.skillStatCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Text style={[styles.skillStatNum, { color: primaryText }]}>{memberSkills.length}</Text>
                  <Text style={[styles.skillStatLbl, { color: secondaryText }]}>Total Skills</Text>
                </View>
                <View style={[styles.skillStatCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Text style={[styles.skillStatNum, { color: '#059669' }]}>
                    {memberSkills.filter(s => s.verificationStatus === 'verified').length}
                  </Text>
                  <Text style={[styles.skillStatLbl, { color: secondaryText }]}>Verified</Text>
                </View>
                <View style={[styles.skillStatCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Text style={[styles.skillStatNum, { color: pendingSkillsCount > 0 ? '#DC2626' : primaryText }]}>
                    {pendingSkillsCount}
                  </Text>
                  <Text style={[styles.skillStatLbl, { color: secondaryText }]}>Pending Review</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {SKILL_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, skillCategoryFilter === cat.id && styles.filterChipActive]}
                    onPress={() => setSkillCategoryFilter(cat.id)}
                  >
                    <Text style={[styles.filterChipTxt, skillCategoryFilter === cat.id && styles.filterChipTxtActive]}>
                      {cat.label.toUpperCase()} {cat.id === 'pending' && pendingSkillsCount > 0 ? `(${pendingSkillsCount})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredSkills.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: cardSurface, borderColor }]}>
                  <Award size={36} color="#94A3B8" />
                  <Text style={[styles.emptyTitle, { color: primaryText }]}>No Member Skills Found</Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    Record member talents in music, praise, technical audio/video, and prayer ministries.
                  </Text>
                  <TouchableOpacity
                    style={styles.createEmptyBtn}
                    onPress={() => setShowAddSkillModal(true)}
                  >
                    <Plus size={15} color="#FFFFFF" />
                    <Text style={styles.createEmptyBtnTxt}>Add Member Skill</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredSkills.map(skill => {
                  const isPending = skill.verificationStatus === 'pending';
                  const isVerified = skill.verificationStatus === 'verified';
                  return (
                    <View
                      key={skill.id}
                      style={[
                        styles.skillCard,
                        { backgroundColor: cardSurface, borderColor },
                        isPending && styles.skillCardPending
                      ]}
                    >
                      <View style={styles.skillCardLeft}>
                        <View style={styles.skillAvatarBox}>
                          <Text style={styles.skillAvatarTxt}>
                            {(skill.memberName || 'M').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.skillMemberName, { color: primaryText }]}>
                              {skill.memberName}
                            </Text>
                            <View style={[
                              styles.miniSkillStatusBadge,
                              isVerified ? styles.skillStatusVerified :
                                isPending ? styles.skillStatusPending :
                                  styles.skillStatusRejected
                            ]}>
                              <Text style={styles.miniSkillStatusBadgeTxt}>
                                {skill.verificationStatus.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.skillNameText, { color: primaryText }]}>
                            🎯 {skill.skillName} ({skill.proficiencyLevel?.toUpperCase() || 'INTERMEDIATE'})
                          </Text>
                          <Text style={[styles.skillCategoryMeta, { color: secondaryText }]}>
                            Category: {skill.category.replace('_', ' ').toUpperCase()} {skill.verifiedBy ? `· Verified by: ${skill.verifiedBy}` : ''}
                          </Text>
                        </View>
                      </View>

                      {isPending ? (
                        <View style={styles.skillActionBtnsRow}>
                          <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={() => handleVerifySkill(skill.id, 'verified')}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.verifyBtnTxt}>Verify</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleVerifySkill(skill.id, 'rejected')}
                          >
                            <X size={14} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 6: SERVICE TEMPLATES */}
          {activePlannerTab === 'templates' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionHeading, { color: primaryText }]}>Service Templates</Text>
                  <Text style={[styles.sectionSubheading, { color: secondaryText }]}>
                    Standard service structures you can apply to any service in 1 click.
                  </Text>
                </View>
              </View>

              {templates.map(tpl => (
                <View
                  key={tpl.id}
                  style={[styles.templateCard, { backgroundColor: cardSurface, borderColor }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.templateTypeTag}>{SERVICE_TYPE_LABELS[tpl.serviceType] || tpl.serviceType}</Text>
                        {tpl.isBuiltIn && <Text style={styles.builtInTag}>BUILT-IN</Text>}
                      </View>
                      <Text style={[styles.templateTitle, { color: primaryText }]}>{tpl.name}</Text>
                      <Text style={[styles.templateDescription, { color: secondaryText }]}>{tpl.description}</Text>
                      <Text style={[styles.templateDuration, { color: '#D97706' }]}>
                        ⏱️ Duration: ~{tpl.defaultDurationMinutes} mins · {tpl.runSheetTemplate?.length || 0} Segments
                      </Text>
                    </View>
                  </View>

                  <View style={styles.templatePreviewList}>
                    {tpl.runSheetTemplate.slice(0, 4).map((item, idx) => (
                      <Text key={idx} style={[styles.templatePreviewItem, { color: secondaryText }]} numberOfLines={1}>
                        {idx + 1}. {item.program} ({item.durationMinutes}m)
                      </Text>
                    ))}
                    {tpl.runSheetTemplate.length > 4 && (
                      <Text style={[styles.templatePreviewMore, { color: isDark ? '#FBBF24' : '#1A2D5A' }]}>
                        + {tpl.runSheetTemplate.length - 4} more activities...
                      </Text>
                    )}
                  </View>

                  {selectedPlan && (
                    <TouchableOpacity
                      style={styles.applyTemplateCardBtn}
                      onPress={() => handleApplyTemplate(tpl.id)}
                    >
                      <Copy size={13} color="#FFFFFF" />
                      <Text style={styles.applyTemplateCardBtnTxt}>Apply to Selected Service</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: SONG PICKER MODAL (PHASE 3) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showSongPickerModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Select Songs from Library</Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  {selectedSongIdsForBatch.length > 0 ? `${selectedSongIdsForBatch.length} song(s) selected · ` : ''}Choose from {churchSongs.length} Telugu & English praise songs.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowSongPickerModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Song Search Bar */}
            <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, { color: primaryText }]}
                placeholder="Search song title (Telugu/English) or artist..."
                placeholderTextColor="#94A3B8"
                value={songLibrarySearch}
                onChangeText={setSongLibrarySearch}
              />
              {songLibrarySearch.length > 0 && (
                <TouchableOpacity onPress={() => setSongLibrarySearch('')}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Song List with Multi-Selection Checkboxes */}
            {loadingSongs ? (
              <ActivityIndicator size="small" color={primaryBtnBg} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {filteredLibrarySongs.map((song, songIdx) => {
                  const isAlreadyInSetlist = (showCreateModal ? createSetlist : (selectedPlan?.setlist || [])).some(s => s.songId === song.id);
                  const isSelected = selectedSongIdsForBatch.includes(song.id);
                  return (
                    <TouchableOpacity
                      key={song.id ? `song_${song.id}_${songIdx}` : `song_${songIdx}`}
                      style={[
                        styles.songPickItem,
                        { borderColor: cardBorder },
                        isSelected && { backgroundColor: isDark ? 'rgba(46, 107, 79, 0.25)' : '#ECFDF5', borderColor: publishBtnBg },
                        isAlreadyInSetlist && { opacity: 0.65, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }
                      ]}
                      onPress={() => {
                        if (isAlreadyInSetlist) {
                          Alert.alert('Already Added', `"${song.title}" is already in the setlist.`);
                          return;
                        }
                        toggleSongSelectionForBatch(song.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.songCheckbox,
                        isSelected && styles.songCheckboxSelected,
                        isAlreadyInSetlist && { backgroundColor: '#10B981', borderColor: '#10B981' }
                      ]}>
                        {(isSelected || isAlreadyInSetlist) && (
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 6 }}>
                        <Text style={[styles.songPickTitle, { color: primaryText }]} numberOfLines={1}>{song.title}</Text>
                        {song.titleTe ? (
                          <Text style={[styles.songPickTe, { color: '#D97706' }]} numberOfLines={1}>{song.titleTe}</Text>
                        ) : null}
                        <Text style={[styles.songPickMeta, { color: secondaryText }]} numberOfLines={1}>
                          Key: {song.key || 'G'} · {song.artist || 'Traditional Worship'}
                        </Text>
                      </View>
                      {isAlreadyInSetlist ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Check size={13} color="#10B981" strokeWidth={2.5} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Added</Text>
                        </View>
                      ) : isSelected ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: publishBtnBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Selected</Text>
                        </View>
                      ) : (
                        <Plus size={16} color={secondaryText} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSongPickerModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: selectedSongIdsForBatch.length > 0 ? publishBtnBg : '#94A3B8',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }
                ]}
                disabled={selectedSongIdsForBatch.length === 0 || addingBatchSongs}
                onPress={handleBatchAddSongsToSetlist}
                activeOpacity={0.85}
              >
                {addingBatchSongs ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Music size={14} color="#FFFFFF" />
                    <Text style={styles.modalConfirmBtnTxt}>
                      {selectedSongIdsForBatch.length > 0
                        ? `Add (${selectedSongIdsForBatch.length}) Songs to Setlist`
                        : 'Select Songs to Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CONFIGURE SETLIST SONG (PHASE 3) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showConfigureSongModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  {editingSetlistIndex !== null ? 'Edit Setlist Song' : 'Configure Song for Worship'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  {selectedSongForSetlist?.title || 'Assign Key, BPM, Song Leader & Musicians'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowConfigureSongModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Musical Key Picker */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Musical Key *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {STANDARD_KEYS.map(k => (
                  <TouchableOpacity
                    key={k}
                    style={[
                      styles.keyPickerChip,
                      songKeyInput === k && styles.keyPickerChipActive,
                      songKeyInput !== k && { backgroundColor: inputBg, borderColor: inputBorder }
                    ]}
                    onPress={() => setSongKeyInput(k)}
                  >
                    <Text style={[styles.keyPickerChipTxt, songKeyInput === k && styles.keyPickerChipTxtActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* BPM, Time Sig & Duration */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Tempo (BPM)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="120"
                    keyboardType="numeric"
                    value={songBpmInput}
                    onChangeText={setSongBpmInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Time Signature</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="4/4"
                    value={songTimeSigInput}
                    onChangeText={setSongTimeSigInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Duration (Mins)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="6"
                    keyboardType="numeric"
                    value={songDurationInput}
                    onChangeText={setSongDurationInput}
                  />
                </View>
              </View>

              {/* Song Leader */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Song Leader *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="Name of song leader"
                value={songLeaderInput}
                onChangeText={setSongLeaderInput}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {(() => {
                  const leadCandidates = getMusicianCandidates('worship_leader');
                  const list = leadCandidates.length > 0
                    ? leadCandidates.map(c => ({ id: c.id, name: c.name, badge: c.badge }))
                    : churchMembers.slice(0, 8).map(m => ({ id: m.id, name: m.name || m.firstName, badge: '' }));
                  return list.map(item => {
                    const isSelected = songLeaderInput === item.name;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.quickMemberChip,
                          {
                            backgroundColor: isSelected ? publishBtnBg : (isDark ? '#27272A' : '#F1F5F9'),
                            borderColor: isSelected ? publishBtnBg : (isDark ? '#3F3F46' : '#CBD5E1'),
                            borderWidth: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4
                          }
                        ]}
                        onPress={() => setSongLeaderInput(item.name)}
                      >
                        <Text style={[styles.quickMemberChipTxt, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {item.name}
                        </Text>
                        {item.badge ? (
                          <View style={{
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7')
                          }}>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: isSelected ? '#FFFFFF' : (isDark ? '#34D399' : '#15803D') }}>
                              {item.badge}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>

              {/* Musician Assignments */}
              <View style={{ backgroundColor: isDark ? '#27272A' : '#F1F5F9', padding: 10, borderRadius: 8, marginTop: 6, marginBottom: 8, borderWidth: 1, borderColor: cardBorder }}>
                <Text style={{ fontSize: 11.5, color: secondaryText, lineHeight: 17 }}>
                  ℹ️ <Text style={{ fontWeight: '700', color: primaryText }}>Service Band Auto-Applied:</Text>{' '}
                  🎹 Keys: <Text style={{ fontWeight: '700', color: selectedPlan?.assignments?.['role_keyboard'] ? primaryText : '#94A3B8' }}>{selectedPlan?.assignments?.['role_keyboard'] || 'Unassigned'}</Text> · 🥁 Drums: <Text style={{ fontWeight: '700', color: selectedPlan?.assignments?.['role_drums'] ? primaryText : '#94A3B8' }}>{selectedPlan?.assignments?.['role_drums'] || 'Unassigned'}</Text>
                  {'\n'}Optional: Only edit below if this specific song features a different guest player.
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 4 }]}>Band Musician Overrides (Optional)</Text>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subFieldLabel, { color: secondaryText }]}>Keyboard</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="Keyboard player"
                    value={songKeyboardInput}
                    onChangeText={setSongKeyboardInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subFieldLabel, { color: secondaryText }]}>Acoustic Guitar</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="Acoustic guitarist"
                    value={songAcousticInput}
                    onChangeText={setSongAcousticInput}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subFieldLabel, { color: secondaryText }]}>Drums</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="Drummer"
                    value={songDrumsInput}
                    onChangeText={setSongDrumsInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subFieldLabel, { color: secondaryText }]}>Bass Guitar</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="Bassist"
                    value={songBassInput}
                    onChangeText={setSongBassInput}
                  />
                </View>
              </View>

              {/* Rehearsal Arrangement Notes */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Rehearsal & Arrangement Notes</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Intro with Keys -> Acoustic joins on Verse 1 -> Full Band Chorus -> Modulate to Key A on Bridge"
                multiline
                numberOfLines={3}
                value={songNotesInput}
                onChangeText={setSongNotesInput}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfigureSongModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={savingSetlistSong}
                onPress={handleSaveSetlistSong}
              >
                {savingSetlistSong ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Save to Setlist</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN SERVICE WORSHIP BAND & MUSICIANS (WHOLE SERVICE) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showBandModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  Assign Service Worship Band 🎹🥁
                </Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Assigned once for the whole service · Applies to all songs
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowBandModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Info Banner */}
              <View style={{ backgroundColor: isDark ? 'rgba(26, 45, 90, 0.45)' : '#EEF2FF', padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#C7D2FE' }}>
                <Text style={{ fontSize: 12, color: primaryText, fontWeight: '600', lineHeight: 18 }}>
                  💡 Assign your musical instruments once here. WeChristian will automatically apply them across all praise & worship songs, display them on the print sheet, and notify them on service publish!
                </Text>
              </View>

              {/* 1. Keyboard */}
              {renderBandInstrumentSection({
                emoji: '🎹',
                title: 'Keyboardist / Pianist',
                instrumentKey: 'keyboard',
                value: bandKeyboard,
                valueId: bandKeyboardId,
                onChangeText: (txt) => {
                  setBandKeyboard(txt);
                  setBandKeyboardId('');
                },
                onSelectCandidate: (cand) => {
                  setBandKeyboard(cand.name);
                  setBandKeyboardId(cand.id);
                },
                onClear: () => {
                  setBandKeyboard('');
                  setBandKeyboardId('');
                }
              })}

              {/* 2. Drums */}
              {renderBandInstrumentSection({
                emoji: '🥁',
                title: 'Drummer / Percussionist',
                instrumentKey: 'drums',
                value: bandDrums,
                valueId: bandDrumsId,
                onChangeText: (txt) => {
                  setBandDrums(txt);
                  setBandDrumsId('');
                },
                onSelectCandidate: (cand) => {
                  setBandDrums(cand.name);
                  setBandDrumsId(cand.id);
                },
                onClear: () => {
                  setBandDrums('');
                  setBandDrumsId('');
                }
              })}

              {/* 3. Bass Guitar */}
              {renderBandInstrumentSection({
                emoji: '🎸',
                title: 'Bass Guitarist',
                instrumentKey: 'bass',
                value: bandBass,
                valueId: bandBassId,
                onChangeText: (txt) => {
                  setBandBass(txt);
                  setBandBassId('');
                },
                onSelectCandidate: (cand) => {
                  setBandBass(cand.name);
                  setBandBassId(cand.id);
                },
                onClear: () => {
                  setBandBass('');
                  setBandBassId('');
                }
              })}

              {/* 4. Acoustic Guitar */}
              {renderBandInstrumentSection({
                emoji: '🎸',
                title: 'Acoustic Guitarist',
                instrumentKey: 'acoustic',
                value: bandAcoustic,
                valueId: bandAcousticId,
                onChangeText: (txt) => {
                  setBandAcoustic(txt);
                  setBandAcousticId('');
                },
                onSelectCandidate: (cand) => {
                  setBandAcoustic(cand.name);
                  setBandAcousticId(cand.id);
                },
                onClear: () => {
                  setBandAcoustic('');
                  setBandAcousticId('');
                }
              })}

              {/* 5. Electric Guitar */}
              {renderBandInstrumentSection({
                emoji: '⚡',
                title: 'Electric Guitarist',
                instrumentKey: 'electric',
                value: bandElectric,
                valueId: bandElectricId,
                onChangeText: (txt) => {
                  setBandElectric(txt);
                  setBandElectricId('');
                },
                onSelectCandidate: (cand) => {
                  setBandElectric(cand.name);
                  setBandElectricId(cand.id);
                },
                onClear: () => {
                  setBandElectric('');
                  setBandElectricId('');
                }
              })}

              {/* 6. Sound & Audio */}
              {renderBandInstrumentSection({
                emoji: '🎧',
                title: 'Sound & Audio Engineer',
                instrumentKey: 'sound',
                value: bandSound,
                valueId: bandSoundId,
                onChangeText: (txt) => {
                  setBandSound(txt);
                  setBandSoundId('');
                },
                onSelectCandidate: (cand) => {
                  setBandSound(cand.name);
                  setBandSoundId(cand.id);
                },
                onClear: () => {
                  setBandSound('');
                  setBandSoundId('');
                }
              })}

              {/* 7. Worship Leader */}
              {renderBandInstrumentSection({
                emoji: '🎤',
                title: 'Primary Worship Leader',
                instrumentKey: 'worship_leader',
                value: bandWorshipLeader,
                valueId: bandWorshipLeaderId,
                onChangeText: (txt) => {
                  setBandWorshipLeader(txt);
                  setBandWorshipLeaderId('');
                },
                onSelectCandidate: (cand) => {
                  setBandWorshipLeader(cand.name);
                  setBandWorshipLeaderId(cand.id);
                },
                onClear: () => {
                  setBandWorshipLeader('');
                  setBandWorshipLeaderId('');
                }
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBandModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: publishBtnBg }]}
                onPress={handleSaveServiceBand}
                disabled={savingBand}
              >
                {savingBand ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Save Service Band</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={showLyricsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.keyBadge}>
                    <Text style={styles.keyBadgeTxt}>Key {viewingLyricsSong?.key || 'G'}</Text>
                  </View>
                  <View style={styles.bpmBadge}>
                    <Text style={styles.bpmBadgeTxt}>{viewingLyricsSong?.tempo || '120'} BPM</Text>
                  </View>
                </View>
                <Text style={[styles.modalTitle, { color: primaryText, marginTop: 4 }]}>
                  {viewingLyricsSong?.title}
                </Text>
                {viewingLyricsSong?.titleTe ? (
                  <Text style={[styles.modalSubtitle, { color: '#D97706' }]}>
                    {viewingLyricsSong.titleTe}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setShowLyricsModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Telugu Lyrics */}
              {viewingLyricsSong?.lyricsTe ? (
                <View style={styles.lyricsBlock}>
                  <Text style={[styles.lyricsLangHeader, { color: '#D97706' }]}>తెలుగు సాహిత్యం (TELUGU LYRICS)</Text>
                  <Text style={[styles.lyricsText, { color: primaryText }]}>
                    {viewingLyricsSong.lyricsTe}
                  </Text>
                </View>
              ) : null}

              {/* English Lyrics */}
              {viewingLyricsSong?.lyricsEn ? (
                <View style={styles.lyricsBlock}>
                  <Text style={[styles.lyricsLangHeader, { color: primaryText }]}>ENGLISH LYRICS / TRANSLITERATION</Text>
                  <Text style={[styles.lyricsText, { color: primaryText }]}>
                    {viewingLyricsSong.lyricsEn}
                  </Text>
                </View>
              ) : null}

              {!viewingLyricsSong?.lyricsTe && !viewingLyricsSong?.lyricsEn && (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: secondaryText }}>No lyrics text stored for this song.</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLyricsModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Close Lyrics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: SERVICE CREATION WIZARD */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '92%' }]}>
            {/* Modal Drag Indicator */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.modalHeaderIconBadge, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                  <CalendarDays size={20} color={primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: primaryText }]}>
                    {isEditingExistingPlan ? 'Edit & Publish Service' : 'Create Worship Service'}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: secondaryText }]} numberOfLines={1}>
                    All-in-one service schedule, run sheet & volunteer roster
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isEditingExistingPlan && editingPlanId && (
                  <TouchableOpacity
                    style={[styles.modalCloseCircle, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleDeleteServicePlan(editingPlanId, createTitle || 'This service', createDate)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                  onPress={() => setShowCreateModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* CARD 1: BASIC INFORMATION */}
              <View style={[styles.formSectionCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={[styles.formCardHeaderRow, { borderBottomColor: borderColor }]}>
                  <Sparkles size={14} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                  <Text style={[styles.formCardHeaderText, { color: primaryText }]}>BASIC INFORMATION</Text>
                </View>

                <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Name *</Text>
                <View style={[styles.modernInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.modernInput, { color: primaryText }]}
                    placeholder="e.g. Sunday Morning Worship"
                    placeholderTextColor="#94A3B8"
                    value={createTitle}
                    onChangeText={setCreateTitle}
                  />
                </View>

                <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Service Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.typeSelectChip,
                        createType === st && styles.typeSelectChipActive,
                        createType !== st && { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }
                      ]}
                      onPress={() => setCreateType(st)}
                    >
                      <Text style={[styles.typeSelectChipTxt, createType === st && styles.typeSelectChipTxtActive]}>
                        {SERVICE_TYPE_LABELS[st]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* CARD 2: DATE & SCHEDULE */}
              <View style={[styles.formSectionCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={[styles.formCardHeaderRow, { borderBottomColor: borderColor }]}>
                  <Calendar size={14} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                  <Text style={[styles.formCardHeaderText, { color: primaryText }]}>DATE & SCHEDULE</Text>
                </View>

                <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Date *</Text>
                <TouchableOpacity
                  style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={() => setDatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                    <Calendar size={18} color={primaryText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerValueText, { color: primaryText }]}>
                      {formatDisplayDate(createDate)}
                    </Text>
                    <Text style={[styles.pickerSubText, { color: secondaryText }]}>
                      {createDate ? `${formatDateMonthYear(createDate)} (Date Month Year)` : 'Tap to select service date'}
                    </Text>
                  </View>
                  <ChevronDown size={16} color={secondaryText} />
                </TouchableOpacity>

                <View style={[styles.formRow, { marginTop: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: primaryText }]}>Start Time *</Text>
                    <TouchableOpacity
                      style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                      onPress={() => setStartTimePickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                        <Clock size={16} color={primaryText} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerValueText, { color: primaryText }]} numberOfLines={1}>
                          {formatDisplayTime(createStartTime)}
                        </Text>
                        <Text style={[styles.pickerSubText, { color: secondaryText }]} numberOfLines={1}>
                          {createStartTime ? `${formatDisplayTime(createStartTime)} (12-hour format)` : 'Select start time'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: primaryText }]}>End Time *</Text>
                    <TouchableOpacity
                      style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                      onPress={() => setEndTimePickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#FEF3C7' }]}>
                        <Clock size={16} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerValueText, { color: primaryText }]} numberOfLines={1}>
                          {formatDisplayTime(createEndTime)}
                        </Text>
                        <Text style={[styles.pickerSubText, { color: secondaryText }]} numberOfLines={1}>
                          {createEndTime ? `${formatDisplayTime(createEndTime)} (12-hour format)` : 'Select end time'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* CARD 3: LOCATION & SERMON DETAILS */}
              <View style={[styles.formSectionCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                <View style={[styles.formCardHeaderRow, { borderBottomColor: borderColor }]}>
                  <MapPin size={14} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                  <Text style={[styles.formCardHeaderText, { color: primaryText }]}>LOCATION & SERMON DETAILS</Text>
                </View>

                {/* Location */}
                <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Location</Text>
                <View style={[styles.modernInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <MapPin size={16} color="#64748B" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.modernInput, { color: primaryText }]}
                    placeholder="e.g. Main Church Sanctuary / Hall"
                    placeholderTextColor="#94A3B8"
                    value={createLocation}
                    onChangeText={setCreateLocation}
                  />
                </View>

                {/* Preacher / Speaker */}
                <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Preacher / Speaker</Text>
                <View style={[styles.modernInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <Mic size={16} color="#64748B" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.modernInput, { color: primaryText }]}
                    placeholder="e.g. Pastor / Guest Speaker Name"
                    placeholderTextColor="#94A3B8"
                    value={createPreacher}
                    onChangeText={setCreatePreacher}
                  />
                </View>

                {/* Sermon Theme */}
                <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Sermon Theme</Text>
                <View style={[styles.modernInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <BookOpen size={16} color="#64748B" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.modernInput, { color: primaryText }]}
                    placeholder="e.g. Living by Faith, Walking in the Spirit"
                    placeholderTextColor="#94A3B8"
                    value={createTheme}
                    onChangeText={setCreateTheme}
                  />
                </View>

                {/* Bible Scripture */}
                <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Bible Scripture</Text>
                <View style={[styles.modernInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <FileText size={16} color="#64748B" style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.modernInput, { color: primaryText }]}
                    placeholder="e.g. Romans 8:1-4, Psalm 23"
                    placeholderTextColor="#94A3B8"
                    value={createScripture}
                    onChangeText={setCreateScripture}
                  />
                </View>
              </View>

              {/* CARD 4: RECURRENCE & STARTING TEMPLATE */}
              {!isEditingExistingPlan && (
                <View style={[styles.formSectionCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                  <View style={[styles.formCardHeaderRow, { borderBottomColor: borderColor }]}>
                    <RotateCcw size={14} color={isDark ? '#FBBF24' : '#1A2D5A'} />
                    <Text style={[styles.formCardHeaderText, { color: primaryText }]}>RECURRENCE & ORDER TEMPLATE</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Recurrence</Text>
                  <View style={styles.recurrenceOptionGrid}>
                    {[
                      { id: 'one_time', label: 'One-Time', sub: 'Single service' },
                      { id: 'weekly', label: 'Weekly', sub: `Every ${recurrenceDayName}` },
                      { id: 'biweekly', label: 'Bi-Weekly', sub: 'Every 2 weeks' },
                      { id: 'monthly', label: 'Monthly', sub: `Monthly on ${recurrenceDayName}` }
                    ].map(r => {
                      const isSelected = createRecurrence === r.id;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={[
                            styles.recurrenceGridBtn,
                            isSelected && {
                              backgroundColor: primaryBtnBg,
                              borderColor: primaryBtnBg,
                            },
                            !isSelected && { backgroundColor: inputBg, borderColor: inputBorder }
                          ]}
                          onPress={() => setCreateRecurrence(r.id as any)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={[styles.recurrenceGridBtnTitle, { color: isSelected ? primaryBtnText : primaryText }]}>
                              {r.label}
                            </Text>
                            {isSelected && <Check size={13} color={primaryBtnText} strokeWidth={3} />}
                          </View>
                          <Text style={[styles.recurrenceGridBtnSub, { color: isSelected ? (isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.8)') : secondaryText }]} numberOfLines={1}>
                            {r.sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {createRecurrence !== 'one_time' && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.fieldLabel, { color: primaryText }]}>Occurrences Count</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        {recurrenceCountOptions.map(opt => {
                          const isSelected = createOccurrencesCount === opt.count;
                          return (
                            <TouchableOpacity
                              key={opt.count}
                              style={[
                                styles.countChip,
                                isSelected && {
                                  backgroundColor: primaryBtnBg,
                                  borderColor: primaryBtnBg,
                                },
                                !isSelected && { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }
                              ]}
                              onPress={() => setCreateOccurrencesCount(opt.count)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.countChipTxt, { color: isSelected ? primaryBtnText : primaryText, fontWeight: isSelected ? '800' : '600' }]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Live Preview Card of Generated Recurring Dates */}
                      <View style={[styles.recurrencePreviewCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderColor: isDark ? '#059669' : '#A7F3D0' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <CalendarDays size={13} color="#059669" />
                            <Text style={[styles.recurrencePreviewTitle, { color: isDark ? '#34D399' : '#065F46' }]}>
                              {previewRecurrenceDates.length} Service Dates Will Be Created:
                            </Text>
                          </View>
                          <Text style={[styles.recurrencePreviewBadge, { color: isDark ? '#34D399' : '#047857' }]}>
                            {createRecurrence === 'weekly' ? 'Weekly' : createRecurrence === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
                          </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                          {previewRecurrenceDates.map((dStr, idx) => (
                            <View key={dStr} style={[styles.recurrenceDateChip, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: isDark ? '#374151' : '#CBD5E1' }]}>
                              <View style={[styles.recurrenceDateChipNum, { backgroundColor: idx === 0 ? '#1A2D5A' : (isDark ? '#334155' : '#E2E8F0') }]}>
                                <Text style={[styles.recurrenceDateChipNumTxt, { color: idx === 0 ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#475569') }]}>
                                  #{idx + 1}
                                </Text>
                              </View>
                              <Text style={[styles.recurrenceDateChipTxt, { color: primaryText }]}>
                                {formatDateMonthYear(dStr)}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}

                  {/* Order of Service Template Selection */}
                  <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 14 }]}>Order of Service Template</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.tplSelectChip,
                        selectedTemplateForNew === 'blank' && {
                          backgroundColor: primaryBtnBg,
                          borderColor: primaryBtnBg,
                        },
                        selectedTemplateForNew !== 'blank' && { backgroundColor: inputBg, borderColor: inputBorder }
                      ]}
                      onPress={() => handleSelectTemplateForForm('blank')}
                      activeOpacity={0.8}
                    >
                      {selectedTemplateForNew === 'blank' && (
                        <Check size={13} color={primaryBtnText} strokeWidth={3} />
                      )}
                      <Text
                        style={[
                          styles.tplSelectChipTxt,
                          { color: selectedTemplateForNew === 'blank' ? primaryBtnText : primaryText, fontWeight: selectedTemplateForNew === 'blank' ? '800' : '600' }
                        ]}
                      >
                        Start Blank
                      </Text>
                    </TouchableOpacity>
                    {templates.map((tpl, tplIdx) => {
                      const isSelected = selectedTemplateForNew === tpl.id;
                      return (
                        <TouchableOpacity
                          key={tpl.id ? `tpl_${tpl.id}_${tplIdx}` : `tpl_${tplIdx}`}
                          style={[
                            styles.tplSelectChip,
                            isSelected && {
                              backgroundColor: primaryBtnBg,
                              borderColor: primaryBtnBg,
                            },
                            !isSelected && { backgroundColor: inputBg, borderColor: inputBorder }
                          ]}
                          onPress={() => handleSelectTemplateForForm(tpl.id)}
                          activeOpacity={0.8}
                        >
                          {isSelected && (
                            <Check size={13} color={primaryBtnText} strokeWidth={3} />
                          )}
                          <Text style={[styles.tplSelectChipTxt, { color: isSelected ? primaryBtnText : primaryText, fontWeight: isSelected ? '800' : '600' }]}>
                            {tpl.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Selected Template Live Details */}
                  {selectedTemplateForNew === 'blank' ? (
                    <View style={[styles.tplSelectedSummary, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9', borderColor: inputBorder }]}>
                      <Sparkles size={13} color={secondaryText} />
                      <Text style={[styles.tplSelectedSummaryTxt, { color: secondaryText }]}>
                        Blank Order: Start fresh without preset timeline activities. You will build them in the Order Builder workspace.
                      </Text>
                    </View>
                  ) : (
                    (() => {
                      const selTpl = templates.find(t => t.id === selectedTemplateForNew);
                      if (!selTpl) return null;
                      const itemCount = selTpl.runSheetTemplate?.length || 0;
                      const sampleItems = selTpl.runSheetTemplate?.slice(0, 3).map((i: any) => i.program || i.title || '').filter(Boolean).join(', ') || '';
                      return (
                        <View style={[styles.tplSelectedSummary, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF', borderColor: isDark ? '#1D4ED8' : '#BFDBFE' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Layers size={13} color="#2563EB" />
                              <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#60A5FA' : '#1D4ED8' }}>
                                {selTpl.name}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#93C5FD' : '#2563EB' }}>
                              {itemCount} activities · {selTpl.defaultDurationMinutes || 120} mins
                            </Text>
                          </View>
                          {sampleItems ? (
                            <Text style={{ fontSize: 11, color: secondaryText }} numberOfLines={1}>
                              Preset includes: {sampleItems}{itemCount > 3 ? ` +${itemCount - 3} more` : ''}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })()
                  )}
                </View>
              )}

              {/* Guidance Info Card */}
              <View style={[styles.nextStepsCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Layers size={20} color={isDark ? '#FBBF24' : '#1A2D5A'} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nextStepsTitle, { color: primaryText }]}>
                      Dedicated Workspace Preparation
                    </Text>
                    <Text style={[styles.nextStepsBody, { color: secondaryText }]}>
                      Once you click Create Service below, the workspace will open the dedicated Order Builder where you can comfortably prepare the timeline run sheet, pick worship songs, and assign volunteer roles.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooterRow, { borderTopColor: borderColor, backgroundColor: cardSurface }]}>
              {isEditingExistingPlan && editingPlanId && (
                <TouchableOpacity
                  style={styles.modalFooterDeleteBtn}
                  disabled={savingService}
                  onPress={() => handleDeleteServicePlan(editingPlanId, createTitle || 'This service', createDate)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalDraftBtn, { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                disabled={savingService}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalDraftBtnTxt, { color: primaryText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPublishBtn, { backgroundColor: '#1A2D5A' }]}
                disabled={savingService}
                onPress={handleCreateService}
                activeOpacity={0.85}
              >
                {savingService ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                    <Text
                      style={styles.modalPublishBtnTxt}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {isEditingExistingPlan ? 'Save Changes' : 'Create Service & Prepare Order'}
                    </Text>
                    <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* DateTimePicker Modals for Service Creation */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={parseDateForPicker(createDate)}
              onConfirm={handleConfirmCreateDate}
              onCancel={() => setDatePickerVisible(false)}
            />
            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              date={parseTimeForPicker(createStartTime)}
              is24Hour={false}
              onConfirm={handleConfirmCreateStartTime}
              onCancel={() => setStartTimePickerVisible(false)}
            />
            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              date={parseTimeForPicker(createEndTime)}
              is24Hour={false}
              onConfirm={handleConfirmCreateEndTime}
              onCancel={() => setEndTimePickerVisible(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── BEAUTIFUL SERVICE CREATED SUCCESS POPUP MODAL ── */}
      <Modal
        visible={showCreatedSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreatedSuccessModal(false)}
      >
        <View style={styles.successModalBackdrop}>
          <View style={[styles.successModalCard, { backgroundColor: cardSurface, borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
            {/* Top Close Icon */}
            <TouchableOpacity
              style={[styles.successModalCloseBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
              onPress={() => {
                setShowCreatedSuccessModal(false);
                setActivePlannerTab('calendar');
              }}
              activeOpacity={0.7}
            >
              <X size={16} color={primaryText} />
            </TouchableOpacity>

            {/* Top Header without success icon mark */}
            <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 16 }}>
              <Text style={[styles.successModalTitle, { color: primaryText }]}>
                {createdSuccessInfo?.isEdit
                  ? 'Service Updated! 💾'
                  : createdSuccessInfo?.isRecurring
                    ? `${createdSuccessInfo.occurrencesCount} Services Created! 🎉`
                    : 'Service Created! 🎉'}
              </Text>
              <Text style={[styles.successModalSub, { color: secondaryText }]}>
                {createdSuccessInfo?.isRecurring
                  ? 'Your recurring service series is successfully generated and added to the roster.'
                  : 'Your service is created and ready in the Order Builder workspace.'}
              </Text>
            </View>

            {/* Summary Details Card */}
            <View style={[styles.successDetailsBox, { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <Text style={[styles.successServiceTitle, { color: primaryText }]} numberOfLines={1}>
                {createdSuccessInfo?.title || 'Worship Service'}
              </Text>

              <View style={styles.successDetailRow}>
                <Calendar size={13} color="#2563EB" />
                <Text style={[styles.successDetailTxt, { color: primaryText }]}>
                  {formatDateMonthYear(createdSuccessInfo?.date || '')}
                </Text>
              </View>

              <View style={styles.successDetailRow}>
                <Clock size={13} color="#D97706" />
                <Text style={[styles.successDetailTxt, { color: primaryText }]}>
                  {createdSuccessInfo?.startTime} – {createdSuccessInfo?.endTime}
                </Text>
              </View>

              {createdSuccessInfo?.isRecurring && (
                <View style={styles.successDetailRow}>
                  <RotateCcw size={13} color="#059669" />
                  <Text style={[styles.successDetailTxt, { color: '#059669', fontWeight: '700' }]}>
                    {createdSuccessInfo?.recurrenceFrequency === 'weekly' ? 'Weekly' : createdSuccessInfo?.recurrenceFrequency === 'biweekly' ? 'Bi-Weekly' : 'Monthly'} · {createdSuccessInfo?.occurrencesCount} occurrences scheduled
                  </Text>
                </View>
              )}

              <View style={styles.successDetailRow}>
                <Layers size={13} color="#7C3AED" />
                <Text style={[styles.successDetailTxt, { color: secondaryText }]}>
                  Template: <Text style={{ color: primaryText, fontWeight: '600' }}>{createdSuccessInfo?.templateName}</Text>
                </Text>
              </View>

              {createdSuccessInfo?.location ? (
                <View style={styles.successDetailRow}>
                  <MapPin size={13} color="#DC2626" />
                  <Text style={[styles.successDetailTxt, { color: secondaryText }]} numberOfLines={1}>
                    {createdSuccessInfo?.location}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* What's Next Hint */}
            <View style={[styles.successHintBox, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.1)' : '#FFFBEB', borderColor: isDark ? '#B45309' : '#FDE68A' }]}>
              <Sparkles size={14} color="#D97706" style={{ marginTop: 1 }} />
              <Text style={[styles.successHintTxt, { color: isDark ? '#FBBF24' : '#92400E' }]}>
                Next: Open the Order Builder to arrange your run sheet timeline, add songs, and assign volunteer roles.
              </Text>
            </View>

            {/* Action Buttons - Beautiful & High Quality */}
            <View style={styles.successModalActions}>
              <TouchableOpacity
                style={[
                  styles.successPrimaryBtn,
                  {
                    backgroundColor: '#1A2D5A',
                    shadowColor: '#1A2D5A',
                  }
                ]}
                onPress={() => {
                  setShowCreatedSuccessModal(false);
                  setActivePlannerTab('builder');
                }}
                activeOpacity={0.88}
              >
                <Layers size={17} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.successPrimaryBtnTxt} numberOfLines={1}>
                  Open Order Builder Workspace
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.6} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.successSecondaryBtn,
                  {
                    borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                    backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                  }
                ]}
                onPress={() => {
                  setShowCreatedSuccessModal(false);
                  setActivePlannerTab('calendar');
                }}
                activeOpacity={0.8}
              >
                <Calendar size={15} color={isDark ? '#E4E4E7' : '#334155'} />
                <Text style={[styles.successSecondaryBtnTxt, { color: isDark ? '#E4E4E7' : '#1E293B' }]}>
                  Done · View in Calendar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN MEMBER TO RESPONSIBILITY WITH VERIFIED SKILL HIGHLIGHT */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showAssignMemberModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  Assign Volunteer
                </Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]} numberOfLines={1}>
                  {selectedDutyIndexForAssign !== null && createAssignments[selectedDutyIndexForAssign]
                    ? `Role: ${createAssignments[selectedDutyIndexForAssign].roleTitle} (Skill: ${createAssignments[selectedDutyIndexForAssign].requiredSkill})`
                    : 'Select a member'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAssignMemberModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Member Search */}
            <View style={[styles.searchBox, { backgroundColor: screenBg, borderColor }]}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, { color: primaryText }]}
                placeholder="Search member name or phone..."
                placeholderTextColor="#94A3B8"
                value={assignMemberSearch}
                onChangeText={setAssignMemberSearch}
              />
              {assignMemberSearch.length > 0 && (
                <TouchableOpacity onPress={() => setAssignMemberSearch('')}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {(() => {
                const currentDuty = selectedDutyIndexForAssign !== null ? createAssignments[selectedDutyIndexForAssign] : null;
                const reqSkill = (currentDuty?.requiredSkill || currentDuty?.roleTitle || '').toLowerCase();

                // Sort members: verified skill first
                const sorted = [...churchMembers].filter(m => {
                  if (!assignMemberSearch.trim()) return true;
                  const q = assignMemberSearch.toLowerCase();
                  const name = (m.name || `${m.firstName || ''} ${m.lastName || ''}`).toLowerCase();
                  const phone = (m.phone || m.mobile || m.phoneNumber || '').toLowerCase();
                  return name.includes(q) || phone.includes(q);
                }).sort((a, b) => {
                  const aVerified = memberSkills.some(s => s.memberId === a.id && s.verificationStatus === 'verified' && s.skillName.toLowerCase().includes(reqSkill));
                  const bVerified = memberSkills.some(s => s.memberId === b.id && s.verificationStatus === 'verified' && s.skillName.toLowerCase().includes(reqSkill));
                  if (aVerified && !bVerified) return -1;
                  if (!aVerified && bVerified) return 1;
                  return 0;
                });

                if (sorted.length === 0) {
                  return (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: secondaryText, fontSize: 13 }}>No matching members found.</Text>
                    </View>
                  );
                }

                return sorted.map((m, mIdx) => {
                  const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Church Member';
                  const phone = m.phone || m.mobile || m.phoneNumber || '';
                  const verifiedSkill = memberSkills.find(s => s.memberId === m.id && s.verificationStatus === 'verified' && s.skillName.toLowerCase().includes(reqSkill));

                  return (
                    <TouchableOpacity
                      key={m.id ? `member_assign_${m.id}_${mIdx}` : `member_assign_${mIdx}`}
                      style={[
                        styles.memberAssignCard,
                        { borderColor },
                        verifiedSkill && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }
                      ]}
                      onPress={() => handleSelectMemberForDuty(m)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.memberAvatarCircle, verifiedSkill && { backgroundColor: '#10B981' }]}>
                        <Text style={styles.memberAvatarTxt}>
                          {name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.memberAssignName, { color: primaryText }]}>{name}</Text>
                          {verifiedSkill && (
                            <View style={styles.verifiedSkillBadge}>
                              <Check size={10} color="#FFFFFF" strokeWidth={3} />
                              <Text style={styles.verifiedSkillBadgeTxt}>Verified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memberAssignPhone, { color: secondaryText }]}>
                          {phone || 'No phone recorded'}
                          {verifiedSkill ? ` · 🎯 ${verifiedSkill.skillName}` : ''}
                        </Text>
                      </View>
                      <Plus size={16} color={verifiedSkill ? '#10B981' : primaryText} />
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAssignMemberModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD ACTIVITY TO RUN SHEET */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showAddActivityQuickModal} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>Add Activity to Run Sheet</Text>
              <TouchableOpacity onPress={() => setShowAddActivityQuickModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Activity Name *</Text>
              <View style={[styles.modernInputContainer, { backgroundColor: screenBg, borderColor }]}>
                <TextInput
                  style={[styles.modernInput, { color: primaryText }]}
                  placeholder="e.g. Special Testimony / Scripture Reading"
                  placeholderTextColor="#94A3B8"
                  value={quickActTitle}
                  onChangeText={setQuickActTitle}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                {renderActivityCategorySelector(quickActCategory, (cat) => setQuickActCategory(cat))}
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Planned Duration (Minutes)</Text>
              <View style={[styles.modernInputContainer, { backgroundColor: screenBg, borderColor }]}>
                <Clock size={16} color="#64748B" style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.modernInput, { color: primaryText }]}
                  placeholder="e.g. 10"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={quickActDuration}
                  onChangeText={setQuickActDuration}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddActivityQuickModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAddQuickActivity}
              >
                <Text style={styles.modalConfirmBtnTxt}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD CUSTOM DUTY ROLE */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showAddDutyQuickModal} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>Add Responsibility / Duty</Text>
              <TouchableOpacity onPress={() => setShowAddDutyQuickModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Duty / Role Title *</Text>
              <View style={[styles.modernInputContainer, { backgroundColor: screenBg, borderColor }]}>
                <TextInput
                  style={[styles.modernInput, { color: primaryText }]}
                  placeholder="e.g. Scripture Reading Steward"
                  placeholderTextColor="#94A3B8"
                  value={quickDutyTitle}
                  onChangeText={setQuickDutyTitle}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText, marginTop: 12 }]}>Required Verified Skill</Text>
              <View style={[styles.modernInputContainer, { backgroundColor: screenBg, borderColor }]}>
                <Award size={16} color="#64748B" style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.modernInput, { color: primaryText }]}
                  placeholder="e.g. Scripture Reading / Public Speaking"
                  placeholderTextColor="#94A3B8"
                  value={quickDutySkill}
                  onChangeText={setQuickDutySkill}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddDutyQuickModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAddQuickDuty}
              >
                <Text style={styles.modalConfirmBtnTxt}>Add Role</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ACTIVITY ITEM EDITOR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showActivityModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>
                {editingActivityId ? 'Edit Activity Item' : 'Add Activity to Service'}
              </Text>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowActivityModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Activity / Program Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Praise & Worship (Setlist)"
                placeholderTextColor="#94A3B8"
                value={actProgram}
                onChangeText={setActProgram}
              />

              {renderActivityCategorySelector(actCategory, handleSelectActivityCategory)}

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Duration (Minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="15"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                value={actDuration}
                onChangeText={setActDuration}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Ministry Team Pool (Optional Filter)</Text>
              {ministryTeams.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {ministryTeams.map(team => {
                    const isSelectedTeam = actTeamIds.includes(team.id);
                    const count = Array.from(
                      new Set([...(team.leaderId ? [team.leaderId] : []), ...(team.memberIds || [])].filter(Boolean))
                    ).length;
                    return (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.categorySelectChip,
                          isSelectedTeam
                            ? { backgroundColor: publishBtnBg, borderColor: publishBtnBg, borderWidth: 1 }
                            : { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }
                        ]}
                        onPress={() => toggleActivityTeamChip(team)}
                      >
                        <Text style={[
                          styles.categorySelectChipTxt,
                          { color: isSelectedTeam ? '#FFFFFF' : primaryText }
                        ]}>
                          {team.name}{count > 0 ? ` (${count})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Responsible Person</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="Type name or select member below"
                placeholderTextColor="#94A3B8"
                value={actResponsible}
                onChangeText={text => {
                  setActResponsible(text);
                  setActResponsibleId('');
                }}
              />

              {activityCandidatePool.selectedTeams.length > 0 && (
                <Text style={{ fontSize: 11, color: secondaryText, marginBottom: 6 }}>
                  {activityCandidatePool.hasTeamPool
                    ? `Eligible members from: ${activityCandidatePool.selectedTeams.map(t => t.name).join(', ')}`
                    : `No members assigned yet in ${activityCandidatePool.selectedTeams.map(t => t.name).join(', ')} — showing church directory`}
                </Text>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {activityCandidatePool.items.map(({ member: m, teamNames }) => {
                  const displayName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Member';
                  const isActive = actResponsibleId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.quickMemberChip,
                        !isActive && { backgroundColor: inputBg, borderColor: inputBorder },
                        isActive && styles.quickMemberChipActive
                      ]}
                      onPress={() => {
                        setActResponsible(displayName);
                        setActResponsibleId(m.id);
                      }}
                    >
                      <Text style={[
                        styles.quickMemberChipTxt,
                        !isActive && { color: primaryText },
                        isActive && styles.quickMemberChipTxtActive
                      ]}>
                        {displayName}
                        {teamNames.length > 0 ? ` · ${teamNames.join(' & ')}` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {activityCandidatePool.hasTeamPool && (
                  <TouchableOpacity
                    style={[
                      styles.quickMemberChip,
                      { backgroundColor: actShowAllMembers ? primaryBtnBg : inputBg, borderColor: inputBorder }
                    ]}
                    onPress={() => setActShowAllMembers(prev => !prev)}
                  >
                    <Text style={[
                      styles.quickMemberChipTxt,
                      { color: actShowAllMembers ? primaryBtnText : secondaryText }
                    ]}>
                      {actShowAllMembers ? 'Team Pool Only' : '+ All Members'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Supporting Team Label</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Worship Team"
                placeholderTextColor="#94A3B8"
                value={actTeam}
                onChangeText={setActTeam}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Special Instructions / Notes</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="Add instructions for stage, sound engineer, or scripture readers..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={actInstructions}
                onChangeText={setActInstructions}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowActivityModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={savingActivity}
                onPress={handleSaveActivity}
              >
                {savingActivity ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Save Activity</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: EDIT SERVICE DETAILS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showEditDetailsModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Edit Service Information</Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]} numberOfLines={1}>
                  Update service schedule, title, preacher & sanctuary details
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {selectedPlan && (
                  <TouchableOpacity
                    style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: cardBorder }]}
                    onPress={() => {
                      setShowEditDetailsModal(false);
                      openEditServiceInForm(selectedPlan);
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Layers size={14} color={secondaryBtnText} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                  onPress={() => setShowEditDetailsModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Service Type Selection */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(st => {
                    const active = editType === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.filterChip,
                          active ? styles.filterChipActive : { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }
                        ]}
                        onPress={() => setEditType(st)}
                      >
                        <Text style={[styles.filterChipTxt, active && styles.filterChipTxtActive]}>
                          {SERVICE_TYPE_LABELS[st] || st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Service Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Sunday Morning Worship"
                placeholderTextColor="#94A3B8"
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Date</Text>
              <TouchableOpacity
                style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder, marginBottom: 12 }]}
                onPress={() => setEditDatePickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                  <Calendar size={16} color={primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerValueText, { color: primaryText }]} numberOfLines={1}>
                    {formatDisplayDate(editDate)}
                  </Text>
                  <Text style={[styles.pickerSubText, { color: secondaryText }]} numberOfLines={1}>
                    {editDate ? `${formatDateMonthYear(editDate)} (Date Month Year)` : 'Select date'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Start Time</Text>
                  <TouchableOpacity
                    style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    onPress={() => setEditStartTimePickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                      <Clock size={16} color={primaryText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerValueText, { color: primaryText }]} numberOfLines={1}>
                        {formatDisplayTime(editStartTime)}
                      </Text>
                      <Text style={[styles.pickerSubText, { color: secondaryText }]} numberOfLines={1}>
                        {editStartTime ? `${formatDisplayTime(editStartTime)}` : 'Start time'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>End Time</Text>
                  <TouchableOpacity
                    style={[styles.pickerInputBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                    onPress={() => setEditEndTimePickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerIconContainer, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                      <Clock size={16} color={primaryText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerValueText, { color: primaryText }]} numberOfLines={1}>
                        {formatDisplayTime(editEndTime)}
                      </Text>
                      <Text style={[styles.pickerSubText, { color: secondaryText }]} numberOfLines={1}>
                        {editEndTime ? `${formatDisplayTime(editEndTime)}` : 'End time'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Location / Sanctuary</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Main Church Sanctuary / Hall"
                placeholderTextColor="#94A3B8"
                value={editLocation}
                onChangeText={setEditLocation}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Preacher / Speaker</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Pastor / Speaker Name"
                placeholderTextColor="#94A3B8"
                value={editPreacher}
                onChangeText={setEditPreacher}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Theme</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="e.g. God's Grace / Living by Faith"
                    placeholderTextColor="#94A3B8"
                    value={editTheme}
                    onChangeText={setEditTheme}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Bible Scripture</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                    placeholder="e.g. Romans 8:1, Psalm 23"
                    placeholderTextColor="#94A3B8"
                    value={editScripture}
                    onChangeText={setEditScripture}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Description / Notes</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder, height: 60 }]}
                placeholder="Additional service details or notes for volunteers..."
                placeholderTextColor="#94A3B8"
                multiline
                value={editDescription}
                onChangeText={setEditDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditDetailsModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveDetails}
              >
                <Text style={styles.modalConfirmBtnTxt}>Save Changes</Text>
              </TouchableOpacity>
            </View>

            {/* DateTimePicker Modals for Service Edit */}
            <DateTimePickerModal
              isVisible={isEditDatePickerVisible}
              mode="date"
              date={parseDateForPicker(editDate)}
              onConfirm={handleConfirmEditDate}
              onCancel={() => setEditDatePickerVisible(false)}
            />
            <DateTimePickerModal
              isVisible={isEditStartTimePickerVisible}
              mode="time"
              date={parseTimeForPicker(editStartTime)}
              is24Hour={false}
              onConfirm={handleConfirmEditStartTime}
              onCancel={() => setEditStartTimePickerVisible(false)}
            />
            <DateTimePickerModal
              isVisible={isEditEndTimePickerVisible}
              mode="time"
              date={parseTimeForPicker(editEndTime)}
              is24Hour={false}
              onConfirm={handleConfirmEditEndTime}
              onCancel={() => setEditEndTimePickerVisible(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: SAVE AS REUSABLE TEMPLATE (ISSUE 6) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showSaveTemplateModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Save as Service Template</Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Save this customized order of service as a reusable template for future services
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowSaveTemplateModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Template Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder }]}
                placeholder="e.g. Sunday Celebration Order, Midweek Service"
                placeholderTextColor="#94A3B8"
                value={newTemplateName}
                onChangeText={setNewTemplateName}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Description</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: primaryText, borderColor: inputBorder, height: 60 }]}
                placeholder="Describe when to use this template..."
                placeholderTextColor="#94A3B8"
                multiline
                value={newTemplateDesc}
                onChangeText={setNewTemplateDesc}
              />

              <View style={[styles.templatePreviewBox, { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderColor: cardBorder }]}>
                <Text style={[styles.templatePreviewTitle, { color: primaryText }]}>
                  📋 Included Activities ({selectedPlan?.runSheet?.length || 0})
                </Text>
                {(selectedPlan?.runSheet || []).map((item, idx) => (
                  <View key={item.id ? `prv_${item.id}` : `prv_${idx}`} style={styles.templatePreviewRow}>
                    <Text style={[styles.templatePreviewNum, { color: secondaryText }]}>{idx + 1}.</Text>
                    <Text style={[styles.templatePreviewTxt, { color: primaryText }]} numberOfLines={1}>
                      {item.program} ({item.durationMinutes}m)
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSaveTemplateModal(false)}
                disabled={savingTemplate}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveCurrentAsTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Save Template 💾</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: APPLY TEMPLATE MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showApplyTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Apply Service Template</Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Choose a template to replace the Order of Service timetable.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyTemplateModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {templates.map((tpl, tplIdx) => (
                <TouchableOpacity
                  key={tpl.id ? `apply_tpl_${tpl.id}_${tplIdx}` : `apply_tpl_${tplIdx}`}
                  style={[styles.applyTplItem, { borderColor }]}
                  onPress={() => handleApplyTemplate(tpl.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.applyTplTitle, { color: primaryText }]}>{tpl.name}</Text>
                    <Text style={[styles.applyTplMeta, { color: secondaryText }]}>
                      {tpl.runSheetTemplate.length} activities · ~{tpl.defaultDurationMinutes} mins
                    </Text>
                  </View>
                  <ArrowRight size={16} color={primaryText} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApplyTemplateModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: MINISTRY TEAM ROSTER & DETAILS MODAL (PHASE 2) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showTeamModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  {selectedTeam ? `Manage ${selectedTeam.name}` : 'Create Ministry Team'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Assign existing church members and designate a team leader.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTeamModal(false)} style={styles.modalCloseCircle}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Team Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="e.g. Worship Team"
                placeholderTextColor="#94A3B8"
                value={teamNameInput}
                onChangeText={setTeamNameInput}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Description</Text>
              <TextInput
                style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="Department purpose and scope..."
                placeholderTextColor="#94A3B8"
                value={teamDescInput}
                onChangeText={setTeamDescInput}
              />

              {/* Accent Color Selection */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Team Accent Color</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { color: '#1A2D5A', label: 'Navy' },
                  { color: '#059669', label: 'Emerald' },
                  { color: '#7C3AED', label: 'Purple' },
                  { color: '#D97706', label: 'Gold' },
                  { color: '#C0392B', label: 'Crimson' },
                  { color: '#0D9488', label: 'Teal' },
                ].map(c => {
                  const isCurColor = teamColorInput === c.color;
                  return (
                    <TouchableOpacity
                      key={c.color}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 5,
                        paddingHorizontal: 9,
                        borderRadius: 16,
                        backgroundColor: isCurColor
                          ? (isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9')
                          : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderWidth: 1.5,
                        borderColor: isCurColor ? c.color : (isDark ? '#334155' : '#E2E8F0'),
                      }}
                      onPress={() => setTeamColorInput(c.color)}
                    >
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.color }} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: primaryText }}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Designate Team Leader</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.quickMemberChip,
                    !teamLeaderId
                      ? [styles.quickMemberChipActive, { backgroundColor: '#1A2D5A', borderColor: '#1A2D5A' }]
                      : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: cardBorder }
                  ]}
                  onPress={() => setTeamLeaderId(undefined)}
                >
                  <Text style={[
                    styles.quickMemberChipTxt,
                    !teamLeaderId
                      ? styles.quickMemberChipTxtActive
                      : { color: secondaryText }
                  ]}>
                    No Leader
                  </Text>
                </TouchableOpacity>
                {churchMembers.map(m => {
                  const isActive = teamLeaderId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.quickMemberChip,
                        isActive
                          ? [styles.quickMemberChipActive, { backgroundColor: '#1A2D5A', borderColor: '#1A2D5A' }]
                          : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: cardBorder }
                      ]}
                      onPress={() => setTeamLeaderId(m.id)}
                    >
                      <Text style={[
                        styles.quickMemberChipTxt,
                        isActive
                          ? styles.quickMemberChipTxtActive
                          : { color: secondaryText }
                      ]}>
                        👑 {m.name || m.firstName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Team Members Header with Actions */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 8 }}>
                <Text style={[styles.fieldLabel, { color: primaryText, marginBottom: 0 }]}>
                  Team Members ({teamMemberIds.length} Selected)
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const allIds = churchMembers.map(m => m.id).filter(Boolean);
                      setTeamMemberIds(allIds);
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? '#34D399' : '#059669' }}>
                      Select All
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ color: secondaryText, fontSize: 11 }}>•</Text>
                  <TouchableOpacity
                    onPress={() => setTeamMemberIds([])}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDark ? '#F87171' : '#DC2626' }}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search input for members */}
              <View style={[styles.memberSearchBox, { backgroundColor: screenBg, borderColor }]}>
                <Search size={14} color={secondaryText} />
                <TextInput
                  style={[styles.memberSearchInput, { color: primaryText }]}
                  placeholder="Filter members by name, phone or skill..."
                  placeholderTextColor="#94A3B8"
                  value={teamMemberSearch}
                  onChangeText={setTeamMemberSearch}
                  autoCapitalize="none"
                />
                {teamMemberSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setTeamMemberSearch('')}>
                    <X size={14} color={secondaryText} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dedicated Smooth Scrollable Member List */}
              <View style={[styles.memberPickerContainer, { borderColor: isDark ? '#3F3F46' : '#E2E8F0', backgroundColor: isDark ? '#18181B' : '#F8FAFC' }]}>
                <ScrollView
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: 240 }}
                  contentContainerStyle={{ padding: 6 }}
                >
                  {filteredTeamMembers.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: secondaryText, fontSize: 12 }}>
                        {teamMemberSearch.trim() ? `No members found matching "${teamMemberSearch}"` : 'No church members available'}
                      </Text>
                    </View>
                  ) : (
                    filteredTeamMembers.map(m => {
                      const isSelected = teamMemberIds.includes(m.id);
                      const mName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Church Member';
                      const initials = mName.split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'M';
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.memberRosterItem,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5')
                                : (isDark ? '#27272A' : '#FFFFFF'),
                              borderColor: isSelected
                                ? (isDark ? '#059669' : '#10B981')
                                : (isDark ? '#3F3F46' : '#E2E8F0'),
                              borderWidth: 1,
                            }
                          ]}
                          onPress={() => toggleMemberInTeam(m.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.memberAvatarCircle,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? '#065F46' : '#D1FAE5')
                                : (isDark ? '#3F3F46' : '#F1F5F9')
                            }
                          ]}>
                            <Text style={[
                              styles.memberAvatarTxt,
                              {
                                color: isSelected
                                  ? (isDark ? '#34D399' : '#047857')
                                  : (isDark ? '#D4D4D8' : '#475569')
                              }
                            ]}>
                              {initials}
                            </Text>
                          </View>

                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={[
                              styles.memberRosterName,
                              {
                                color: isSelected
                                  ? (isDark ? '#FFFFFF' : '#065F46')
                                  : primaryText
                              }
                            ]} numberOfLines={1}>
                              {mName}
                            </Text>
                            <Text style={[
                              styles.memberRosterPhone,
                              {
                                color: isSelected
                                  ? (isDark ? '#A7F3D0' : '#047857')
                                  : secondaryText
                              }
                            ]} numberOfLines={1}>
                              {m.phone || (m as any).phoneNumber || (m as any).mobile || 'No phone'} · {m.primarySkill || m.userType || 'Member'}
                            </Text>
                          </View>

                          <View style={[
                            styles.checkboxCircle,
                            isSelected ? styles.checkboxCircleActive : {
                              borderColor: isDark ? '#52525B' : '#CBD5E1',
                              backgroundColor: isDark ? '#27272A' : '#FFFFFF'
                            }
                          ]}>
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { justifyContent: 'space-between' }]}>
              {selectedTeam ? (
                <TouchableOpacity
                  style={[
                    styles.modalFooterDeleteBtn,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
                    }
                  ]}
                  disabled={savingTeam}
                  onPress={() => handleDeleteTeam(selectedTeam)}
                >
                  <Trash2 size={14} color={isDark ? '#F87171' : '#DC2626'} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#F87171' : '#DC2626' }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              ) : <View />}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowTeamModal(false)}
                >
                  <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  disabled={savingTeam}
                  onPress={handleSaveTeam}
                >
                  {savingTeam ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmBtnTxt}>Save Team</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: ADD MEMBER SKILL MODAL (PHASE 2) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showAddSkillModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Add & Verify Member Skill</Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Grant a verified ministry skill to qualify for automatic service assignments.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddSkillModal(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Select Member *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {churchMembers.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.quickMemberChip, skillMemberId === m.id && styles.quickMemberChipActive]}
                    onPress={() => setSkillMemberId(m.id)}
                  >
                    <Text style={[styles.quickMemberChipTxt, skillMemberId === m.id && styles.quickMemberChipTxtActive]}>
                      {m.name || m.firstName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Skill Category</Text>
              <View style={styles.skillCategoryRow}>
                {[
                  { id: 'music', label: 'Music & Band' },
                  { id: 'worship', label: 'Worship / Vocals' },
                  { id: 'technical', label: 'Audio / Video' },
                  { id: 'church_ministry', label: 'Church Ministry' }
                ].map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.skillCategoryBtn, skillCategory === c.id && styles.skillCategoryBtnActive]}
                    onPress={() => setSkillCategory(c.id as any)}
                  >
                    <Text style={[styles.skillCategoryBtnTxt, skillCategory === c.id && styles.skillCategoryBtnTxtActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Suggested Skills</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {(skillCategory === 'music' ? ['Keyboard', 'Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Drums'] :
                  skillCategory === 'worship' ? ['Worship Leader', 'Choir Singer', 'Song Leader', 'Harmony Vocals'] :
                    skillCategory === 'technical' ? ['Sound Engineering', 'Camera Operator', 'Livestream', 'Lyrics and Projector'] :
                      ['Opening Prayer', 'Closing Prayer', 'Bible Reading', 'Welcome & Ushering', 'Offering Steward']
                ).map(sk => (
                  <TouchableOpacity
                    key={sk}
                    style={[styles.presetSkillChip, skillNameInput === sk && styles.presetSkillChipActive]}
                    onPress={() => setSkillNameInput(sk)}
                  >
                    <Text style={[styles.presetSkillChipTxt, skillNameInput === sk && styles.presetSkillChipTxtActive]}>
                      {sk}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Skill Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="e.g. Keyboard"
                placeholderTextColor="#94A3B8"
                value={skillNameInput}
                onChangeText={setSkillNameInput}
              />

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Proficiency Level</Text>
              <View style={styles.proficiencyRow}>
                {['beginner', 'intermediate', 'advanced', 'lead'].map(lvl => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.proficiencyChip, skillProficiency === lvl && styles.proficiencyChipActive]}
                    onPress={() => setSkillProficiency(lvl as any)}
                  >
                    <Text style={[styles.proficiencyChipTxt, skillProficiency === lvl && styles.proficiencyChipTxtActive]}>
                      {lvl.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddSkillModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={savingSkill}
                onPress={handleAddMemberSkill}
              >
                {savingSkill ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Save & Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: DISPATCH ASSIGNMENT QUEUE (PHASE 4) ─── */}
      <Modal visible={showDispatchQueueModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardSurface, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.queueCategoryPill}>ASSIGNMENT QUEUE</Text>
                  <Text style={[styles.headerBadgeTxt, { color: '#D97706' }]}>AUTO-CASCADE</Text>
                </View>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  {targetRoleTitle}
                </Text>
                {targetActivityName && (
                  <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                    For Service Activity: {targetActivityName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowDispatchQueueModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Timeout selector */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Response Timeout (Before Cascade)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {[
                  { hrs: 2, label: '2 Hours (Recommended)' },
                  { hrs: 3, label: '3 Hours' },
                  { hrs: 6, label: '6 Hours' },
                  { hrs: 12, label: '12 Hours' },
                  { hrs: 24, label: '24 Hours' }
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.hrs}
                    style={[styles.timeoutChip, dispatchTimeoutHours === opt.hrs && styles.timeoutChipActive]}
                    onPress={() => setDispatchTimeoutHours(opt.hrs)}
                  >
                    <Text style={[styles.timeoutChipTxt, dispatchTimeoutHours === opt.hrs && styles.timeoutChipTxtActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected Ladder */}
              <Text style={[styles.fieldLabel, { color: primaryText }]}>
                Sequential Candidate Ladder ({ladderCandidates.length}/3)
              </Text>
              <Text style={[styles.fieldHint, { color: secondaryText }]}>
                Primary volunteer is contacted first. If declined or timed out, 1st Backup is automatically notified.
              </Text>

              {ladderCandidates.length === 0 ? (
                <View style={[styles.emptyCard, { padding: 14, backgroundColor: screenBg, borderColor }]}>
                  <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
                    No candidates added yet. Pick from intelligent suggestions below.
                  </Text>
                </View>
              ) : (
                ladderCandidates.map((cand, idx) => (
                  <View key={cand.candidateId ? `ladder_${cand.candidateId}_${idx}` : `ladder_${idx}`} style={styles.ladderSelectedCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={styles.ladderRankBadge}>
                        <Text style={styles.ladderRankBadgeTxt}>{idx + 1}</Text>
                      </View>
                      <View>
                        <Text style={styles.ladderSelectedName}>{cand.candidateName}</Text>
                        <Text style={[styles.ladderCandMeta, { color: secondaryText }]}>
                          {idx === 0 ? 'Primary Volunteer' : idx === 1 ? '1st Backup' : '2nd Backup'} · {cand.candidatePhone || 'In directory'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeCandidateFromLadder(idx)}>
                      <X size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Intelligent Suggestions */}
              <View style={{ marginTop: 14, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.fieldLabel, { color: primaryText, marginBottom: 0 }]}>
                  Recommended Candidates
                </Text>
                {loadingRecommendations && <ActivityIndicator size="small" color={primaryBtnBg} />}
              </View>
              <Text style={[styles.fieldHint, { color: secondaryText }]}>
                Ranked by verified skills, ministry team membership, and blockout availability.
              </Text>

              {candidateRecommendations.slice(0, 10).map((rec, recIdx) => {
                const isAdded = ladderCandidates.some(c => c.candidateId === rec.memberId);
                return (
                  <View
                    key={rec.memberId ? `rec_${rec.memberId}_${recIdx}` : `rec_${recIdx}`}
                    style={[
                      styles.recMemberCard,
                      { backgroundColor: cardSurface, borderColor },
                      !rec.isAvailable && { opacity: 0.6 }
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.recMemberName, { color: primaryText }]}>
                          {rec.memberName}
                        </Text>
                        <View style={styles.matchScoreBadge}>
                          <Text style={styles.matchScoreTxt}>
                            {rec.matchScore > 0 ? `+${rec.matchScore} Match` : 'Available'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                        {rec.matchReasons.map((r, i) => (
                          <Text key={i} style={styles.recReasonTag}>{r}</Text>
                        ))}
                        {!rec.isAvailable && (
                          <Text style={[styles.recReasonTag, { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
                            🚫 {rec.availabilityReason || 'Blocked Out'}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addCandidateBtn,
                        isAdded && { backgroundColor: '#E2E8F0' },
                        !rec.isAvailable && { backgroundColor: '#F1F5F9' }
                      ]}
                      disabled={isAdded || ladderCandidates.length >= 3}
                      onPress={() => addCandidateToLadder({
                        id: rec.memberId,
                        name: rec.memberName,
                        phone: rec.memberPhone
                      })}
                    >
                      {isAdded ? (
                        <Check size={12} color="#059669" />
                      ) : (
                        <Plus size={12} color="#FFFFFF" />
                      )}
                      <Text style={[
                        styles.addCandidateBtnTxt,
                        isAdded && { color: '#059669' }
                      ]}>
                        {isAdded ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDispatchQueueModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={savingDispatchQueue || ladderCandidates.length === 0}
                onPress={handleDispatchQueueSubmit}
              >
                {savingDispatchQueue ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Start Queue ({ladderCandidates.length})</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: MANUAL OVERRIDE (PHASE 4) ─── */}
      <Modal visible={showOverrideModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardSurface, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueCategoryPill}>ADMIN OVERRIDE</Text>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  Manual Assign: {targetRoleTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOverrideModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Search Church Member</Text>
              <TextInput
                style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="Type member name..."
                placeholderTextColor="#94A3B8"
                value={overrideMemberSearch}
                onChangeText={setOverrideMemberSearch}
              />

              <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
                {churchMembers
                  .filter(m => !overrideMemberSearch.trim() || (m.name || '').toLowerCase().includes(overrideMemberSearch.toLowerCase()))
                  .slice(0, 20)
                  .map(m => {
                    const isSelected = overrideMemberId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.memberSelectItem,
                          { borderColor },
                          isSelected && styles.memberSelectItemActive
                        ]}
                        onPress={() => setOverrideMemberId(m.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memberSelectName, { color: primaryText }]}>
                            {m.name || `${m.firstName || ''} ${m.lastName || ''}`}
                          </Text>
                          <Text style={[styles.memberSelectSub, { color: secondaryText }]}>
                            {m.phone || 'No phone'} · {m.userType || 'Member'}
                          </Text>
                        </View>
                        {isSelected && <Check size={16} color={primaryText} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: primaryText }]}>Admin Override Notes</Text>
              <TextInput
                style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                placeholder="e.g. Spoke verbally, agreed to serve"
                placeholderTextColor="#94A3B8"
                value={overrideNotes}
                onChangeText={setOverrideNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowOverrideModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={savingOverride || !overrideMemberId}
                onPress={handleManualOverrideSubmit}
              >
                {savingOverride ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>Confirm Assignment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: SIMULATE MEMBER RESPONSE (PHASE 4 CASCADE TEST) ─── */}
      <Modal visible={showSimulateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardSurface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.queueCategoryPill}>CASCADE SIMULATOR</Text>
                  <Text style={[styles.headerBadgeTxt, { color: '#D97706' }]}>TEST WORKFLOW</Text>
                </View>
                <Text style={[styles.modalTitle, { color: primaryText }]}>
                  Simulate Response for {activeQueueForSimulate?.candidates?.[activeQueueForSimulate?.currentCandidateIndex || 0]?.candidateName}
                </Text>
                <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                  Role: {activeQueueForSimulate?.roleTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSimulateModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: primaryText }]}>Select Volunteer Action</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <TouchableOpacity
                  style={[
                    styles.timeoutChip,
                    { flex: 1, paddingVertical: 10 },
                    simulateAction === 'accept' && { backgroundColor: '#059669', borderColor: '#059669' }
                  ]}
                  onPress={() => setSimulateAction('accept')}
                >
                  <Text style={[
                    styles.timeoutChipTxt,
                    { textAlign: 'center' },
                    simulateAction === 'accept' && { color: '#FFFFFF', fontWeight: '800' }
                  ]}>
                    ✅ Accept Duty
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timeoutChip,
                    { flex: 1, paddingVertical: 10 },
                    simulateAction === 'decline' && { backgroundColor: '#DC2626', borderColor: '#DC2626' }
                  ]}
                  onPress={() => setSimulateAction('decline')}
                >
                  <Text style={[
                    styles.timeoutChipTxt,
                    { textAlign: 'center' },
                    simulateAction === 'decline' && { color: '#FFFFFF', fontWeight: '800' }
                  ]}>
                    ❌ Decline Duty
                  </Text>
                </TouchableOpacity>
              </View>

              {simulateAction === 'decline' && (
                <View>
                  <Text style={[styles.fieldLabel, { color: primaryText }]}>Decline Reason (For Auto-Cascade)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: screenBg, color: primaryText, borderColor }]}
                    value={simulateDeclineReason}
                    onChangeText={setSimulateDeclineReason}
                  />
                  <Text style={[styles.fieldHint, { color: secondaryText }]}>
                    Submitting this will immediately advance the queue to Candidate #{(activeQueueForSimulate?.currentCandidateIndex || 0) + 2} in the ladder!
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSimulateModal(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  simulateAction === 'decline' && { backgroundColor: '#DC2626' }
                ]}
                disabled={submittingSimulate}
                onPress={handleSimulateResponseSubmit}
              >
                {submittingSimulate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnTxt}>
                    {simulateAction === 'accept' ? 'Submit Acceptance' : 'Submit Decline & Cascade'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circularBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  heroSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  subNavSurface: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillDraft: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusPillPublished: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillLive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusPillCompleted: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusPillTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  newServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  newServiceBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabsScroll: {
    marginTop: 6,
    marginBottom: 2,
  },
  headerSearchWrap: {
    marginTop: 8,
    marginBottom: 2,
  },
  headerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1.2,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  teamMetaBox: {
    paddingTop: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tabBtnActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
    elevation: 2,
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tabBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bodyScroll: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  centerText: {
    marginTop: 12,
    fontSize: 13,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  filterChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  filterChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 18,
  },
  createEmptyBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  planCardSelected: {
    borderColor: '#1A2D5A',
    borderWidth: 2,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBadge: {
    width: 50,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeDay: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  dateBadgeMonth: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  planTypeTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  miniStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniStatusPillTxt: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  planTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  planMeta: {
    fontSize: 11.5,
    marginTop: 3,
  },
  planCardBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  planStatRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  planStatTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  openHudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  openHudBtnTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  selectedBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  selectedBannerTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  selectedBannerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  selectedBannerMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  selectedBannerTheme: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  bannerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  bannerBottomRow: {
    borderTopWidth: 1,
  },
  statusSwitcherRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSwitcherLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleBtnActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  statusToggleBtnTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  statusToggleBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  warningBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  warningTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  warningMsg: {
    fontSize: 11.5,
    color: '#B91C1C',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 12,
    marginTop: 2,
  },
  addActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
  },
  addActivityBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  applyTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  applyTemplateBtnTxt: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyRunSheetCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  runSheetItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  reorderColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  reorderArrow: {
    padding: 2,
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  timeBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemProgramTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  itemResponsible: {
    fontSize: 11.5,
    marginTop: 1,
  },
  itemInstructions: {
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemActionCol: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 6,
  },
  itemEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phase 3: Setlist Styles
  setlistCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 13,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  templatePreviewBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  templatePreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  templatePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  templatePreviewNum: {
    fontSize: 12,
    fontWeight: '600',
    width: 20,
  },
  templatePreviewTxt: {
    fontSize: 12.5,
    flex: 1,
  },
  keyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keyBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  bpmBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bpmBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  timeSigBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeSigBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  durationTxt: {
    fontSize: 10.5,
  },
  setlistSongTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  setlistSongTe: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  setlistLeaderTxt: {
    fontSize: 11.5,
    marginTop: 2,
  },
  musiciansChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  musicianChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  musicianChipTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  rehearsalNotesTxt: {
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 4,
  },
  setlistActionCol: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  lyricsBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  // Search Box in Song Picker
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  songCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#FFFFFF',
  },
  songCheckboxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  songPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  songPickIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songPickTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '800',
  },
  songPickTe: {
    fontSize: 11.5,
    marginTop: 1,
  },
  songPickMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  keyPickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  keyPickerChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  keyPickerChipTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  keyPickerChipTxtActive: {
    color: '#FFFFFF',
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  lyricsBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lyricsLangHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lyricsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  templateCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  templateTypeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  builtInTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  templateTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  templateDescription: {
    fontSize: 11.5,
    marginTop: 2,
  },
  templateDuration: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  templatePreviewList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  templatePreviewItem: {
    fontSize: 11,
    marginTop: 1,
  },
  templatePreviewMore: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  applyTemplateCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A2D5A',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  applyTemplateCardBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  seedTeamsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seedTeamsBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
  },
  teamCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  teamColorBar: {
    width: 5,
  },
  teamCardContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  teamTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  teamActiveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  teamActiveBadgeOn: {
    backgroundColor: '#DCFCE7',
  },
  teamActiveBadgeOnDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  teamActiveBadgeOff: {
    backgroundColor: '#F3F4F6',
  },
  teamActiveBadgeOffDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  teamActiveBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  teamActiveBadgeTxtOn: {
    color: '#15803D',
  },
  teamActiveBadgeTxtOnDark: {
    color: '#34D399',
  },
  teamActiveBadgeTxtOff: {
    color: '#94A3B8',
  },
  teamDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  teamMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  teamMetaTxt: {
    fontSize: 11.5,
  },
  teamMembersCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  teamMembersCountTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamReorderCol: {
    width: 48,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  reorderArrowBtn: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  reorderArrowBtnDisabled: {
    opacity: 0.35,
  },
  orderRankPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderRankTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  feedbackBannerTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  skillStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  skillStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  skillStatNum: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '900',
  },
  skillStatLbl: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    marginBottom: 8,
  },
  skillCardPending: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  skillCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillAvatarTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  skillMemberName: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '800',
  },
  miniSkillStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  skillStatusVerified: {
    backgroundColor: '#D1FAE5',
  },
  skillStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  skillStatusRejected: {
    backgroundColor: '#FEE2E2',
  },
  miniSkillStatusBadgeTxt: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  skillNameText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  skillCategoryMeta: {
    fontSize: 10.5,
    marginTop: 1,
  },
  skillActionBtnsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  verifyBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    maxWidth: 290,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    marginBottom: 12,
    minHeight: 46,
  },
  formSectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  nextStepsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  nextStepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  nextStepsBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  formCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  formCardHeaderText: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  modernInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 10,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    height: 75,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  pickerInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    minHeight: 48,
  },
  pickerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pickerValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerSubText: {
    fontSize: 10.5,
    marginTop: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  typeSelectChipActive: {
    backgroundColor: '#1A2D5A',
  },
  typeSelectChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeSelectChipTxtActive: {
    color: '#FFFFFF',
  },
  recurrenceOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  recurrenceGridBtn: {
    width: '48.5%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  recurrenceGridBtnTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  recurrenceGridBtnSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  recurrencePreviewCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recurrencePreviewTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  recurrencePreviewBadge: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  recurrenceDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  recurrenceDateChipNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceDateChipNumTxt: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  recurrenceDateChipTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  tplSelectedSummary: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tplSelectedSummaryTxt: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  recurrenceOptionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  recurrenceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  recurrenceBtnActive: {
    borderColor: '#1A2D5A',
    backgroundColor: '#1A2D5A',
  },
  recurrenceBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  recurrenceBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  countChipActive: {
    backgroundColor: '#1A2D5A',
  },
  countChipTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  countChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tplSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  tplSelectChipActive: {
    borderColor: '#1A2D5A',
    backgroundColor: '#1A2D5A',
  },
  tplSelectChipTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  tplSelectChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categorySelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  categorySelectChipActive: {
    backgroundColor: '#1A2D5A',
  },
  categorySelectChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  categorySelectChipTxtActive: {
    color: '#FFFFFF',
  },
  quickMemberChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickMemberChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  quickMemberChipTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickMemberChipTxtActive: {
    color: '#FFFFFF',
  },
  memberSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 12.5,
    padding: 0,
  },
  memberPickerContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    maxHeight: 260,
    overflow: 'hidden',
  },
  memberRosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  memberRosterItemSelected: {
    backgroundColor: '#ECFDF5',
  },
  memberRosterName: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberRosterPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  skillCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  skillCategoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  skillCategoryBtnActive: {
    borderColor: '#1A2D5A',
    backgroundColor: '#1A2D5A',
  },
  skillCategoryBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  skillCategoryBtnTxtActive: {
    color: '#FFFFFF',
  },
  presetSkillChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  presetSkillChipActive: {
    backgroundColor: '#1A2D5A',
  },
  presetSkillChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetSkillChipTxtActive: {
    color: '#FFFFFF',
  },
  proficiencyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  proficiencyChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  proficiencyChipActive: {
    borderColor: '#1A2D5A',
    backgroundColor: '#1A2D5A',
  },
  proficiencyChipTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  proficiencyChipTxtActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  applyTplItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  applyTplTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  applyTplMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  // Phase 4 Assignment Queue Styles
  queueSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  queueSummaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  queueSummaryNum: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '900',
  },
  queueSummaryLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  queueSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  queueRoleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  queueRoleCardConfirmed: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  queueRoleCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  queueRoleCardExhausted: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  queueRoleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  queueCategoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  queueCategoryPillTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  queueActivityTag: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  queueRoleTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  queueStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  badgeConfirmedTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  badgeExhausted: {
    backgroundColor: '#FEF2F2',
  },
  badgeExhaustedTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  badgeDraft: {
    backgroundColor: '#F1F5F9',
  },
  badgeDraftTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmedVolunteerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmedVolunteerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  confirmedVolunteerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  candidateLadderBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  candidateLadderHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ladderCandidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ladderCandidateRowActive: {
    borderRadius: 6,
  },
  ladderCandidateRowAccepted: {
    borderRadius: 6,
  },
  rankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleActive: {
    backgroundColor: '#D97706',
  },
  rankCircleAccepted: {
    backgroundColor: '#059669',
  },
  rankCircleDeclined: {
    backgroundColor: '#DC2626',
  },
  rankCircleIdle: {
    backgroundColor: '#CBD5E1',
  },
  rankCircleTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ladderCandName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ladderCandMeta: {
    fontSize: 10.5,
    marginTop: 1,
  },
  candStatusMiniPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  candPillActive: {
    backgroundColor: '#D97706',
  },
  candPillAccepted: {
    backgroundColor: '#059669',
  },
  candPillDeclined: {
    backgroundColor: '#DC2626',
  },
  candPillTimedOut: {
    backgroundColor: '#991B1B',
  },
  candPillWaiting: {
    backgroundColor: '#E2E8F0',
  },
  candStatusMiniTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  queueActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dispatchQueueBtn: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dispatchQueueBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overrideBtn: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  overrideBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  simulateBtn: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  simulateBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteQueueBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeoutChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  timeoutChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  timeoutChipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timeoutChipTxtActive: {
    color: '#FFFFFF',
  },
  ladderSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  ladderRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ladderRankBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ladderSelectedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  recMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  recMemberName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  matchScoreBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchScoreTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  recReasonTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  addCandidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1A2D5A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addCandidateBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  memberSelectItemActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#1A2D5A',
  },
  memberSelectName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  memberSelectSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalSheet: {
    width: '94%',
    borderRadius: 20,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  fieldHint: {
    fontSize: 11.5,
    marginBottom: 8,
  },
  // Phase 6 Rehearsal Styles
  rehearsalCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 15,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  rehearsalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rehearsalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rehearsalMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  rehearsalCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  rehearsalTeamsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  rehTeamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rehTeamPillTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  rehSongsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  rehSectionSubheading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rehSongItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  rehSongTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  rehNotesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  rehNotesTxt: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  rehAttendanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  attStatItem: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  takeAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  takeAttendanceBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rehPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  rehPresetChipActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  rehPresetChipTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  rehPresetChipTxtActive: {
    color: '#FFFFFF',
  },
  rehSongPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  rehSongPickRowActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#1A2D5A',
  },
  rehSongPickTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  attMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  attPillGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  attPill: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  attPillTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamPickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  teamPickerChipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Phase 9 Export Toolbar
  exportToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
    gap: 5,
  },
  exportBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  printSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  printSheetBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Phase 9 Volunteer Attendance Roster
  turnoutCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnoutCirclePercent: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  turnoutCircleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  attCountersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  attCounterItem: {
    alignItems: 'center',
  },
  attCounterVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  attCounterLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  bulkCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  bulkCheckInBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  volunteerAttCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  volCardName: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '800',
  },
  volTeamBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  volTeamBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  volRoleTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  volMarkedMeta: {
    fontSize: 10,
    marginTop: 3,
    fontStyle: 'italic',
  },
  attStatusPillGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  attStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  attStatusPillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  attStatusPillPresent: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  attStatusPillLate: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  attStatusPillAbsent: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  attStatusPillExcused: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  attStatusPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Phase 9 Analytics Styles
  refreshAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  refreshAnalyticsBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  analyticsLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsLoadingTxt: {
    fontSize: 13,
    marginTop: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiValue: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
  },
  analyticsSectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  analyticsCardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '800',
  },
  analyticsCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cascadeBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cascadeBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownTxt: {
    fontSize: 12,
  },
  fatigueAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  fatigueAlertTxt: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
    fontWeight: '600',
  },
  volunteerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statVolunteerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  statVolunteerMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  fatigueBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  fatigueBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  balancedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  balancedBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  rolesServedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  roleServedChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleServedChipTxt: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  servesCountPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  servesCountVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  servesCountLbl: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  topSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  songRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songRankTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  topSongTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '800',
  },
  topSongTeTitle: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  topSongMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  songCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  songCountTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  // ─── Unified All-in-One Form Styles ───
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  activityOrderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  activityOrderTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  activityTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '800',
  },
  activityMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  activityActionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  outlineActionBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  songItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  songOrderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  songKeyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  songKeyBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  cascadeAlertBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  cascadeAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  cascadeAlertBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  dutyItemCard: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 10,
  },
  dutyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dutyRoleTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '800',
  },
  dutySkillTagTxt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dutyCascadePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dutyCascadePillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  dutyAssigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  dutyAssigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dutyAssigneeName: {
    fontSize: 12,
    fontWeight: '700',
  },
  dutyAssigneePhone: {
    fontSize: 10.5,
    marginTop: 1,
  },
  dutyChangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    marginRight: 6,
  },
  dutyChangeBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dutyClearBtn: {
    padding: 4,
  },
  dutyAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  dutyAssignBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2D5A',
  },
  reviewSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reviewLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  reviewValue: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },
  publishServiceBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  publishServiceBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  saveDraftBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveDraftBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  modalDraftBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  modalDraftBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalPublishBtn: {
    flex: 2.2,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1A2D5A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  modalPublishBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  // ── Success Popup Modal Styles ──
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  successModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  successModalSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  successDetailsBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  successServiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successDetailTxt: {
    fontSize: 12,
    flex: 1,
  },
  successHintBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 18,
  },
  successHintTxt: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  successModalActions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  successPrimaryBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    elevation: 4,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  successPrimaryBtnTxt: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  successSecondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  successSecondaryBtnTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  memberAssignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  memberAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  memberAssignName: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '800',
  },
  memberAssignPhone: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedSkillBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedSkillBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardQuickPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cardQuickPublishBtnTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardManageBtnTxt: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cardDeleteBtnTxt: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteServiceFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  deleteServiceFormBtnTxt: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalFooterDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
