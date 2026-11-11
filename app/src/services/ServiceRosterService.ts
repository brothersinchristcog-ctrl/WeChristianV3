import { firestore } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateMonthYear, formatTimeTo12Hour } from '../utils/DateUtils';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ServicePlan,
  ServiceStatus,
  ServiceType,
  RunSheetItem,
  SetlistItem,
  ServiceTemplate,
  ActivityCategoryDef,
  MinistryTeam,
  MemberSkillRecord,
  MemberAvailabilityRecord,
  CandidateEntry,
  ServiceAssignmentQueue,
  ServiceRehearsal,
  VolunteerAttendanceRecord,
  LiveServiceState,
  StageCue,
  MemberServiceDuty,
  RosterAnalyticsData,
  VolunteerServingStat,
  SongUsageStat
} from '../types/serviceRoster';

const CHURCHES_COLLECTION = 'churches';

export const CUSTOM_ACTIVITY_CATEGORY_PRESETS: Array<{ bg: string; text: string }> = [
  { bg: '#EDE9FE', text: '#5B21B6' }, // Violet
  { bg: '#CCFBF1', text: '#0F766E' }, // Teal
  { bg: '#FFE4E6', text: '#BE123C' }, // Rose
  { bg: '#FEF3C7', text: '#B45309' }, // Amber
  { bg: '#DCFCE7', text: '#15803D' }, // Emerald
  { bg: '#E0F2FE', text: '#0369A1' }, // Sky
];

/**
 * Built-in Service Templates tailored for church worship services
 */
export const BUILT_IN_SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'tpl_sunday_worship',
    churchId: 'built_in',
    name: 'Regular Sunday Worship',
    description: 'Standard 2-hour full congregational worship service with prayer, setlist, sermon, and benediction.',
    serviceType: 'sunday_worship',
    defaultDurationMinutes: 120,
    isBuiltIn: true,
    runSheetTemplate: [
      { order: 1, program: 'Preparation & Sound Check', category: 'preparation', startTime: '10:00', durationMinutes: 15, endTime: '10:15', responsiblePerson: 'Sound & Media Team' },
      { order: 2, program: 'Opening Prayer', category: 'starting_prayer', startTime: '10:15', durationMinutes: 15, endTime: '10:30', responsiblePerson: 'Elder / Associate Pastor' },
      { order: 3, program: 'Welcome & Opening Greetings', category: 'announcements', startTime: '10:30', durationMinutes: 5, endTime: '10:35', responsiblePerson: 'Service Host' },
      { order: 4, program: 'Praise & Worship (Setlist)', category: 'worship_songs', startTime: '10:35', durationMinutes: 25, endTime: '11:00', responsiblePerson: 'Worship Team' },
      { order: 5, program: 'Bible Scripture Reading', category: 'bible_reading', startTime: '11:00', durationMinutes: 5, endTime: '11:05', responsiblePerson: 'Assigned Reader' },
      { order: 6, program: 'Tithe & Offering Prayer', category: 'offering', startTime: '11:05', durationMinutes: 5, endTime: '11:10', responsiblePerson: 'Offering Team' },
      { order: 7, program: 'Church Announcements', category: 'announcements', startTime: '11:10', durationMinutes: 5, endTime: '11:15', responsiblePerson: 'Church Secretary' },
      { order: 8, program: 'Sermon / Message', category: 'sermon', startTime: '11:15', durationMinutes: 50, endTime: '12:05', responsiblePerson: 'Pastor / Speaker' },
      { order: 9, program: 'Altar Call & Closing Prayer', category: 'closing_prayer', startTime: '12:05', durationMinutes: 10, endTime: '12:15', responsiblePerson: 'Pastor' },
      { order: 10, program: 'Benediction & Fellowship', category: 'benediction', startTime: '12:15', durationMinutes: 15, endTime: '12:30', responsiblePerson: 'Lead Pastor' }
    ]
  },
  {
    id: 'tpl_holy_communion',
    churchId: 'built_in',
    name: 'Holy Communion Service',
    description: 'First Sunday of the month celebration with the Lord’s Table, worship, and solemn reflection.',
    serviceType: 'holy_communion',
    defaultDurationMinutes: 135,
    isBuiltIn: true,
    runSheetTemplate: [
      { order: 1, program: 'Opening Prayer & Thanksgiving', category: 'starting_prayer', startTime: '10:00', durationMinutes: 15, endTime: '10:15' },
      { order: 2, program: 'Praise & Worship', category: 'worship_songs', startTime: '10:15', durationMinutes: 30, endTime: '10:45' },
      { order: 3, program: 'Sermon / Exhortation on Table', category: 'sermon', startTime: '10:45', durationMinutes: 35, endTime: '11:20' },
      { order: 4, program: 'Communion Bread Distribution', category: 'communion', startTime: '11:20', durationMinutes: 15, endTime: '11:35' },
      { order: 5, program: 'Communion Cup Distribution', category: 'communion', startTime: '11:35', durationMinutes: 15, endTime: '11:50' },
      { order: 6, program: 'Corporate Thanksgiving Prayer', category: 'closing_prayer', startTime: '11:50', durationMinutes: 10, endTime: '12:00' },
      { order: 7, program: 'Offering & Benediction', category: 'benediction', startTime: '12:00', durationMinutes: 15, endTime: '12:15' }
    ]
  },
  {
    id: 'tpl_bible_study',
    churchId: 'built_in',
    name: 'Midweek Bible Study',
    description: 'In-depth expositional scripture teaching, Q&A, and community prayer.',
    serviceType: 'bible_study',
    defaultDurationMinutes: 90,
    isBuiltIn: true,
    runSheetTemplate: [
      { order: 1, program: 'Opening Prayer', category: 'starting_prayer', startTime: '19:00', durationMinutes: 10, endTime: '19:10' },
      { order: 2, program: 'Devotional Songs (2 Songs)', category: 'opening_song', startTime: '19:10', durationMinutes: 15, endTime: '19:25' },
      { order: 3, program: 'Scripture Exposition / Study', category: 'sermon', startTime: '19:25', durationMinutes: 45, endTime: '20:10' },
      { order: 4, program: 'Q&A & Discussion', category: 'other', startTime: '20:10', durationMinutes: 10, endTime: '20:20' },
      { order: 5, program: 'Intercessory Prayer & Benediction', category: 'closing_prayer', startTime: '20:20', durationMinutes: 10, endTime: '20:30' }
    ]
  },
  {
    id: 'tpl_fasting_prayer',
    churchId: 'built_in',
    name: 'Fasting & Intercessory Prayer',
    description: 'Half-day or full-day prayer watch with worship, corporate intercession, and healing prayers.',
    serviceType: 'fasting_prayer',
    defaultDurationMinutes: 180,
    isBuiltIn: true,
    runSheetTemplate: [
      { order: 1, program: 'Consecration & Opening Prayer', category: 'starting_prayer', startTime: '10:00', durationMinutes: 20, endTime: '10:20' },
      { order: 2, program: 'Deep Worship & Repentance', category: 'worship_songs', startTime: '10:20', durationMinutes: 40, endTime: '11:00' },
      { order: 3, program: 'Prayer for Church & Nation', category: 'other', startTime: '11:00', durationMinutes: 30, endTime: '11:30' },
      { order: 4, program: 'Word of Encouragement', category: 'sermon', startTime: '11:30', durationMinutes: 30, endTime: '12:00' },
      { order: 5, program: 'Personal Ministry & Healing Prayers', category: 'closing_prayer', startTime: '12:00', durationMinutes: 50, endTime: '12:50' },
      { order: 6, program: 'Breaking of Fast & Benediction', category: 'benediction', startTime: '12:50', durationMinutes: 10, endTime: '13:00' }
    ]
  },
  {
    id: 'tpl_christmas_easter',
    churchId: 'built_in',
    name: 'Special Celebration Service (Christmas / Easter)',
    description: 'Festive service featuring special choir cantata, children’s presentation, and evangelistic message.',
    serviceType: 'christmas_celebration',
    defaultDurationMinutes: 150,
    isBuiltIn: true,
    runSheetTemplate: [
      { order: 1, program: 'Festive Prelude & Welcome', category: 'preparation', startTime: '09:30', durationMinutes: 15, endTime: '09:45' },
      { order: 2, program: 'Opening Prayer', category: 'starting_prayer', startTime: '09:45', durationMinutes: 10, endTime: '09:55' },
      { order: 3, program: 'Carols / Resurrection Praise & Worship', category: 'worship_songs', startTime: '09:55', durationMinutes: 30, endTime: '10:25' },
      { order: 4, program: 'Choir Special Performance', category: 'special_performance', startTime: '10:25', durationMinutes: 15, endTime: '10:40' },
      { order: 5, program: 'Sunday School Presentation', category: 'special_performance', startTime: '10:40', durationMinutes: 15, endTime: '10:55' },
      { order: 6, program: 'Celebration Message', category: 'sermon', startTime: '10:55', durationMinutes: 40, endTime: '11:35' },
      { order: 7, program: 'Special Offering & Thanksgiving', category: 'offering', startTime: '11:35', durationMinutes: 10, endTime: '11:45' },
      { order: 8, program: 'Benediction & Love Feast', category: 'benediction', startTime: '11:45', durationMinutes: 15, endTime: '12:00' }
    ]
  }
];

export const INITIAL_MINISTRY_TEAM_NAMES: string[] = [
  'Worship Team',
  'Prayer Team',
  'Music Team',
  'Media Team',
  'Livestream Team',
  'Sound Team',
  'Hospitality Team',
  'Offering Team',
  'Stage & Equipment Team',
  'Communion Team',
  "Children's Ministry",
  'Security Team',
  'Cleaning Team',
  'Parking Team',
];

export const INITIAL_MINISTRY_TEAM_IDS: string[] = [
  'team_worship',
  'team_prayer',
  'team_music',
  'team_media',
  'team_livestream',
  'team_sound',
  'team_hospitality',
  'team_offering',
  'team_stage',
  'team_communion',
  'team_children',
  'team_security',
  'team_cleaning',
  'team_parking',
];

export function getTeamDefaultRank(name?: string, id?: string): number {
  if (id) {
    const idIdx = INITIAL_MINISTRY_TEAM_IDS.indexOf(id);
    if (idIdx !== -1) return idIdx;
  }
  if (name) {
    const clean = name.trim().toLowerCase();
    const nameIdx = INITIAL_MINISTRY_TEAM_NAMES.findIndex(n => n.toLowerCase() === clean);
    if (nameIdx !== -1) return nameIdx;
  }
  return 999;
}

export const DEFAULT_MINISTRY_TEAMS: Omit<MinistryTeam, 'churchId' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'team_worship',
    name: 'Worship Team',
    description: 'Vocalists, song leaders, and choir guiding congregational praise.',
    color: '#831843', // Royal Berry
    memberIds: [],
    active: true,
    order: 0,
    positions: [
      { id: 'pos_worship_leader', title: 'Worship Leader', category: 'worship', defaultSkillRequired: 'Worship Leader' },
      { id: 'pos_singer_soprano', title: 'Vocalist (Soprano)', category: 'worship', defaultSkillRequired: 'Vocals' },
      { id: 'pos_singer_alto', title: 'Vocalist (Alto)', category: 'worship', defaultSkillRequired: 'Vocals' },
      { id: 'pos_singer_tenor', title: 'Vocalist (Tenor)', category: 'worship', defaultSkillRequired: 'Vocals' },
    ]
  },
  {
    id: 'team_prayer',
    name: 'Prayer Team',
    description: 'Intercessors leading opening, pastoral, and altar call prayers.',
    color: '#92400E', // Amber
    memberIds: [],
    active: true,
    order: 1,
    positions: [
      { id: 'pos_opening_prayer', title: 'Opening Prayer Leader', category: 'ministry', defaultSkillRequired: 'Opening Prayer' },
      { id: 'pos_intercessor', title: 'Intercessory Prayer Leader', category: 'ministry', defaultSkillRequired: 'Closing Prayer' },
      { id: 'pos_altar_prayer', title: 'Altar Call Ministry', category: 'ministry', defaultSkillRequired: 'Closing Prayer' },
    ]
  },
  {
    id: 'team_music',
    name: 'Music Team',
    description: 'Instrumentalists providing live worship accompaniment.',
    color: '#4A235A', // Deep Violet
    memberIds: [],
    active: true,
    order: 2,
    positions: [
      { id: 'pos_keyboard', title: 'Keyboard Player', category: 'worship', defaultSkillRequired: 'Keyboard' },
      { id: 'pos_acoustic', title: 'Acoustic Guitarist', category: 'worship', defaultSkillRequired: 'Guitar' },
      { id: 'pos_electric', title: 'Electric Guitarist', category: 'worship', defaultSkillRequired: 'Guitar' },
      { id: 'pos_bass', title: 'Bass Guitarist', category: 'worship', defaultSkillRequired: 'Bass Guitar' },
      { id: 'pos_drums', title: 'Drummer', category: 'worship', defaultSkillRequired: 'Drums' },
    ]
  },
  {
    id: 'team_media',
    name: 'Media Team',
    description: 'Projector, bilingual scripture presentation, and lyrics operations.',
    color: '#0F766E', // Teal
    memberIds: [],
    active: true,
    order: 3,
    positions: [
      { id: 'pos_lyrics_operator', title: 'Lyrics & Screen Operator', category: 'audio_visual', defaultSkillRequired: 'Lyrics and Projector' },
      { id: 'pos_bible_slides', title: 'Scripture Slides Controller', category: 'audio_visual', defaultSkillRequired: 'Lyrics and Projector' },
    ]
  },
  {
    id: 'team_livestream',
    name: 'Livestream Team',
    description: 'Online broadcast, PTZ camera operations, and YouTube streaming.',
    color: '#BE123C', // Crimson
    memberIds: [],
    active: true,
    order: 4,
    positions: [
      { id: 'pos_camera_lead', title: 'Camera Operator #1', category: 'audio_visual', defaultSkillRequired: 'Camera' },
      { id: 'pos_stream_switcher', title: 'Live Video Director', category: 'audio_visual', defaultSkillRequired: 'Livestream' },
    ]
  },
  {
    id: 'team_sound',
    name: 'Sound Team',
    description: 'Front of House (FOH) mix, monitor audio, and acoustic management.',
    color: '#1a2d5a', // WeChristian Navy
    memberIds: [],
    active: true,
    order: 5,
    positions: [
      { id: 'pos_sound_foh', title: 'Sound Engineer (FOH)', category: 'audio_visual', defaultSkillRequired: 'Sound Engineering' },
      { id: 'pos_sound_stage', title: 'Stage Audio Technician', category: 'audio_visual', defaultSkillRequired: 'Sound Engineering' },
    ]
  },
  {
    id: 'team_hospitality',
    name: 'Hospitality Team',
    description: 'Greeters welcoming members, guest registration, and sanctuary seating.',
    color: '#047857', // Emerald
    memberIds: [],
    active: true,
    order: 6,
    positions: [
      { id: 'pos_greeter_entrance', title: 'Main Door Greeter', category: 'hospitality', defaultSkillRequired: 'Welcome' },
      { id: 'pos_usher', title: 'Sanctuary Usher', category: 'hospitality', defaultSkillRequired: 'Welcome' },
    ]
  },
  {
    id: 'team_offering',
    name: 'Offering Team',
    description: 'Tithe & offering collection, usher coordination, and secure counting.',
    color: '#B45309', // Warm Bronze
    memberIds: [],
    active: true,
    order: 7,
    positions: [
      { id: 'pos_offering_lead', title: 'Offering Coordinator', category: 'ministry', defaultSkillRequired: 'Offering' },
      { id: 'pos_offering_collector', title: 'Offering Steward', category: 'ministry', defaultSkillRequired: 'Offering' },
    ]
  },
  {
    id: 'team_stage',
    name: 'Stage & Equipment Team',
    description: 'Pulpit preparation, microphone checks, instruments placement.',
    color: '#374151', // Charcoal
    memberIds: [],
    active: true,
    order: 8,
    positions: [
      { id: 'pos_stage_manager', title: 'Stage Manager', category: 'logistics' },
    ]
  },
  {
    id: 'team_communion',
    name: 'Communion Team',
    description: 'Preparation and sacred distribution of the bread and the cup.',
    color: '#701A75', // Fuchsia Dark
    memberIds: [],
    active: true,
    order: 9,
    positions: [
      { id: 'pos_communion_prep', title: 'Table Preparation Steward', category: 'ministry' },
      { id: 'pos_communion_server', title: 'Communion Server', category: 'ministry' },
    ]
  },
  {
    id: 'team_children',
    name: "Children's Ministry",
    description: 'Sunday School teachers and children worship coordinators.',
    color: '#0284C7', // Sky Blue
    memberIds: [],
    active: true,
    order: 10,
    positions: [
      { id: 'pos_sunday_school_lead', title: 'Sunday School Teacher', category: 'ministry' },
    ]
  },
  {
    id: 'team_security',
    name: 'Security Team',
    description: 'Church premises safety, perimeter stewardship, and emergency protocol.',
    color: '#1F2937', // Dark Gray
    memberIds: [],
    active: true,
    order: 11,
    positions: [
      { id: 'pos_safety_officer', title: 'Safety Steward', category: 'logistics' },
    ]
  },
  {
    id: 'team_cleaning',
    name: 'Cleaning Team',
    description: 'Sanctuary sanitization, post-service tidying, and care of God’s house.',
    color: '#15803D', // Forest Green
    memberIds: [],
    active: true,
    order: 12,
    positions: [
      { id: 'pos_sanctuary_care', title: 'Sanctuary Care Steward', category: 'logistics' },
    ]
  },
  {
    id: 'team_parking',
    name: 'Parking Team',
    description: 'Traffic guidance, parking lot organization, and guest vehicle assistance.',
    color: '#4338CA', // Indigo
    memberIds: [],
    active: true,
    order: 13,
    positions: [
      { id: 'pos_parking_attendant', title: 'Parking Attendant', category: 'logistics' },
    ]
  }
];

class ServiceRosterService {
  private docExists(snap: any): boolean {
    if (!snap) return false;
    return typeof snap.exists === 'function' ? Boolean(snap.exists()) : Boolean(snap.exists);
  }

  private requireChurchId(churchId: string): string {
    const clean = (churchId || '').trim();
    if (!clean) {
      throw new Error('Church ID is required for Service Roster operations.');
    }
    return clean;
  }

  /**
   * Reference helper for multi-tenant church scoped root collection (`churches/{churchId}`)
   */
  private getServicePlansCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('servicePlans');
  }

  private getServiceTemplatesCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('serviceTemplates');
  }

  private getMinistryTeamsCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('ministryTeams');
  }

  private getMemberSkillsCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('memberSkills');
  }

  private getMemberAvailabilityCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('memberAvailability');
  }

  private getActivityCategoriesCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(this.requireChurchId(churchId))
      .collection('activityCategories');
  }

  private getAssignmentQueuesCol(churchId: string, serviceId: string) {
    return this.getServicePlansCol(churchId)
      .doc(serviceId)
      .collection('assignmentQueues');
  }

  private getRehearsalsCol(churchId: string, serviceId: string) {
    return this.getServicePlansCol(churchId)
      .doc(serviceId)
      .collection('rehearsals');
  }

  private getAttendanceCol(churchId: string, serviceId: string) {
    return this.getServicePlansCol(churchId)
      .doc(serviceId)
      .collection('attendance');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SERVICE PLANS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all service plans matching optional filters
   */
  async getServicePlans(
    churchId: string,
    filter?: {
      status?: ServiceStatus;
      serviceType?: ServiceType;
      startDate?: string;
      endDate?: string;
      limitCount?: number;
    }
  ): Promise<ServicePlan[]> {
    if (!churchId?.trim()) return [];
    try {
      const snap = await this.getServicePlansCol(churchId).get();
      let list = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as ServicePlan[];

      if (filter?.status) {
        list = list.filter(p => p.status === filter.status);
      }
      if (filter?.serviceType) {
        list = list.filter(p => p.serviceType === filter.serviceType);
      }
      if (filter?.startDate) {
        list = list.filter(p => p.date >= filter.startDate!);
      }
      if (filter?.endDate) {
        list = list.filter(p => p.date <= filter.endDate!);
      }

      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      if (filter?.limitCount) {
        list = list.slice(0, filter.limitCount);
      }

      return list;
    } catch (err) {
      console.error('[ServiceRosterService] getServicePlans error:', err);
      return [];
    }
  }

  /**
   * Fetch single service plan by ID
   */
  async getServicePlanById(churchId: string, planId: string): Promise<ServicePlan | null> {
    if (!churchId?.trim() || !planId) return null;
    try {
      const doc = await this.getServicePlansCol(churchId).doc(planId).get();
      if (!this.docExists(doc)) return null;
      return { id: doc.id, ...doc.data() } as ServicePlan;
    } catch (err) {
      console.error('[ServiceRosterService] getServicePlanById error:', err);
      return null;
    }
  }

  /**
   * Fetch upcoming published plans for members & home banner
   */
  async getUpcomingPublishedPlans(churchId: string, limitCount: number = 5): Promise<ServicePlan[]> {
    if (!churchId?.trim()) return [];
    try {
      const today = new Date().toISOString().split('T')[0];
      const snap = await this.getServicePlansCol(churchId).get();

      const plans = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as ServicePlan))
        .filter(p => (p.status === 'published' || p.status === 'live') && (p.date >= today))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .slice(0, limitCount);

      return plans;
    } catch (err) {
      console.error('[ServiceRosterService] getUpcomingPublishedPlans error:', err);
      return [];
    }
  }

  /**
   * Create a new Service Plan.
   * If recurrence is requested (weekly or monthly), generates multiple distinct occurrences,
   * each with its own activities and independent assignment queue.
   */
  async createServicePlan(
    churchId: string,
    planData: Partial<ServicePlan>,
    recurrenceOptions?: {
      frequency: 'weekly' | 'biweekly' | 'monthly';
      count: number; // e.g. 4 for next 4 occurrences
    }
  ): Promise<ServicePlan[]> {
    const targetChurch = this.requireChurchId(churchId);
    const plansCol = this.getServicePlansCol(targetChurch);
    const createdPlans: ServicePlan[] = [];

    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalDateString = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Safely parse date components without UTC timezone offset corruption
    const today = new Date();
    const todayStr = toLocalDateString(today);
    const baseDateStr = planData.date || todayStr;
    const dateParts = baseDateStr.split('-').map(Number);
    const bYear = dateParts[0] || today.getFullYear();
    const bMonth = dateParts[1] || (today.getMonth() + 1);
    const bDay = dateParts[2] || today.getDate();

    const seriesId = recurrenceOptions ? `series_${Date.now()}` : undefined;
    const totalOccurrences = recurrenceOptions ? Math.min(Math.max(recurrenceOptions.count, 1), 12) : 1;

    const baseRunSheet = planData.runSheet || [];
    const baseStartTime = planData.startTime || '10:00';
    const recalculatedRunSheet = this.calculateItemEndTimes(baseRunSheet, baseStartTime);
    const totalDuration = this.calculateTotalDurationMinutes(recalculatedRunSheet);

    for (let i = 0; i < totalOccurrences; i++) {
      // 12:00:00 (noon) avoids daylight saving / midnight date-boundary shifts
      const occurrenceDate = new Date(bYear, bMonth - 1, bDay, 12, 0, 0);
      if (i > 0 && recurrenceOptions) {
        if (recurrenceOptions.frequency === 'weekly') {
          occurrenceDate.setDate(occurrenceDate.getDate() + (i * 7));
        } else if (recurrenceOptions.frequency === 'biweekly') {
          occurrenceDate.setDate(occurrenceDate.getDate() + (i * 14));
        } else if (recurrenceOptions.frequency === 'monthly') {
          occurrenceDate.setMonth(occurrenceDate.getMonth() + i);
        }
      }

      const dateStr = toLocalDateString(occurrenceDate);
      const newDocRef = plansCol.doc();

      // Deep clone activities for this specific occurrence so changes don't cross-contaminate
      const occurrenceRunSheet = recalculatedRunSheet.map((item, idx) => ({
        ...item,
        id: `act_${Date.now()}_${idx}_${i}`,
        assignmentStatus: 'unassigned' as const,
        completionStatus: 'pending' as const
      }));

      const newPlan: ServicePlan = {
        id: newDocRef.id,
        churchId: targetChurch,
        churchName: planData.churchName || 'Church Sanctuary',
        serviceTitle: planData.serviceTitle || 'Sunday Worship Celebration',
        serviceType: planData.serviceType || 'sunday_worship',
        date: dateStr,
        startTime: baseStartTime,
        endTime: planData.endTime || this.addMinutesToTime(baseStartTime, totalDuration || 120),
        location: planData.location || 'Main Sanctuary',
        preacher: planData.preacher ? planData.preacher.trim() : '',
        theme: planData.theme || '',
        bibleReference: planData.bibleReference || '',
        description: planData.description || '',
        additionalInstructions: planData.additionalInstructions || '',
        status: planData.status || 'draft',
        totalDurationMinutes: totalDuration || 120,
        runSheet: occurrenceRunSheet,
        setlist: planData.setlist || [],
        recurrence: recurrenceOptions ? {
          isRecurring: true,
          recurrenceType: recurrenceOptions.frequency,
          seriesId,
          frequency: recurrenceOptions.frequency === 'biweekly' ? 2 : 1,
          occurrencesGenerated: totalOccurrences
        } : {
          isRecurring: false,
          recurrenceType: 'one_time'
        },
        liveState: {
          isLive: false,
          currentActivityIndex: 0,
          status: 'idle',
          elapsedSeconds: 0
        },
        assignments: {},
        assignmentMemberIds: {},
        assignmentStatus: {},
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      await newDocRef.set(this.sanitizeForFirestore(newPlan));
      createdPlans.push(newPlan);
    }

    return createdPlans;
  }

  /**
   * Remove undefined fields recursively before writing to Firestore
   * Prevents Firestore "Unsupported field value: undefined" errors
   */
  sanitizeForFirestore<T>(data: T): T {
    if (data === null || data === undefined) return null as any;
    if (Array.isArray(data)) {
      return data
        .filter(item => item !== undefined)
        .map(item => this.sanitizeForFirestore(item)) as any;
    }
    if (typeof data === 'object') {
      // Preserve Firestore FieldValue, Timestamp, FieldPath, and Date instances
      if (
        (data as any).constructor &&
        ((data as any).constructor.name === 'FieldValue' ||
          (data as any).constructor.name === 'Timestamp' ||
          (data as any).constructor.name === 'FieldPath' ||
          (data as any)._methodName ||
          (data as any)._fieldValue ||
          data instanceof Date)
      ) {
        return data;
      }
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(data as Record<string, any>)) {
        if (val !== undefined) {
          sanitized[key] = this.sanitizeForFirestore(val);
        }
      }
      return sanitized as any;
    }
    return data;
  }

  /**
   * Update an existing service plan
   */
  async updateServicePlan(churchId: string, planId: string, updates: Partial<ServicePlan>): Promise<void> {
    const docRef = this.getServicePlansCol(churchId).doc(planId);

    // If runSheet or startTime changed, keep times coherent
    let updatedRunSheet = updates.runSheet;
    let totalDuration = updates.totalDurationMinutes;
    if (updatedRunSheet && updates.startTime) {
      updatedRunSheet = this.calculateItemEndTimes(updatedRunSheet, updates.startTime);
      totalDuration = this.calculateTotalDurationMinutes(updatedRunSheet);
    }

    const payload = this.sanitizeForFirestore({
      ...updates,
      ...(updatedRunSheet ? { runSheet: updatedRunSheet } : {}),
      ...(totalDuration !== undefined ? { totalDurationMinutes: totalDuration } : {}),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });

    await docRef.update(payload);
  }

  /**
   * Delete a service plan and its assignmentQueues / rehearsals / volunteerAttendance subcollections
   */
  async deleteServicePlan(churchId: string, planId: string): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(planId);
    const subcollections = ['assignmentQueues', 'rehearsals', 'volunteerAttendance'];

    for (const sub of subcollections) {
      try {
        const subSnap = await planRef.collection(sub).get();
        if (!subSnap.empty) {
          const batch = firestore().batch();
          subSnap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (err) {
        console.warn(`[ServiceRosterService] Could not clean up subcollection ${sub} for plan ${planId}:`, err);
      }
    }

    await planRef.delete();
  }

  /**
   * Broadcasts published service roster announcement across church feeds (broadcasts and notifications)
   * so it immediately appears in the Updates / Notifications screen for all members.
   */
  async publishServiceRosterBroadcast(churchId: string, planId: string): Promise<void> {
    try {
      const targetChurch = this.requireChurchId(churchId);
      const planDoc = await this.getServicePlansCol(targetChurch).doc(planId).get();
      if (!this.docExists(planDoc)) return;
      const plan = planDoc.data() as ServicePlan;
      const serviceTitle = plan.serviceTitle || 'Worship Service';
      const serviceDate = plan.date || '';
      const serviceTime = plan.startTime || '10:00';
      const location = plan.location || 'Church Sanctuary';

      const dateDisplay = formatDateMonthYear(serviceDate) || serviceDate;
      const timeDisplay = formatTimeTo12Hour(serviceTime) || serviceTime;

      const broadcastPayload = {
        id: `roster_published_${planId}`,
        type: 'service_roster',
        title: `Service Roster Published: ${serviceTitle}`,
        content: `The upcoming service roster and worship order for ${dateDisplay} at ${timeDisplay} (${location}) has been published. Tap to view the schedule, setlist and responsibilities.`,
        body: `The upcoming service roster and worship order for ${dateDisplay} at ${timeDisplay} (${location}) has been published. Tap to view the schedule, setlist and responsibilities.`,
        churchId: targetChurch,
        serviceId: planId,
        serviceTitle,
        serviceDate,
        serviceTime,
        location,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      const sanitized = this.sanitizeForFirestore(broadcastPayload);

      // Write to church-wide broadcasts (Updates screen query target)
      await firestore()
        .collection(CHURCHES_COLLECTION)
        .doc(targetChurch)
        .collection('broadcasts')
        .doc(`roster_published_${planId}`)
        .set(sanitized, { merge: true })
        .catch(err => console.warn('[publishServiceRosterBroadcast] broadcasts write warning:', err));

      // Write to church-wide notifications
      await firestore()
        .collection(CHURCHES_COLLECTION)
        .doc(targetChurch)
        .collection('notifications')
        .doc(`roster_published_${planId}`)
        .set(sanitized, { merge: true })
        .catch(err => console.warn('[publishServiceRosterBroadcast] notifications write warning:', err));
    } catch (err) {
      console.warn('[publishServiceRosterBroadcast] Error writing broadcast doc:', err);
    }
  }

  /**
   * Transition service status (e.g. draft -> published -> live -> completed)
   */
  async updateServiceStatus(churchId: string, planId: string, status: ServiceStatus): Promise<void> {
    await this.getServicePlansCol(churchId).doc(planId).update({
      status,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });

    if (status === 'published') {
      await this.publishServiceRosterBroadcast(churchId, planId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC SERVICE ORDER / RUNSHEET ENGINE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Recalculates end times and start times down the chronological sequence
   */
  calculateItemEndTimes(items: RunSheetItem[], serviceStartTime: string = '10:00'): RunSheetItem[] {
    let currentStart = serviceStartTime;

    return items.map((item, index) => {
      const dur = Math.max(1, item.durationMinutes || 5);
      const endTime = this.addMinutesToTime(currentStart, dur);
      const updated: RunSheetItem = {
        ...item,
        order: index + 1,
        startTime: currentStart,
        durationMinutes: dur,
        endTime
      };
      currentStart = endTime;
      return updated;
    });
  }

  /**
   * Sums total duration of run sheet items
   */
  calculateTotalDurationMinutes(items: RunSheetItem[]): number {
    return items.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }

  /**
   * Validates timeline for overlaps or out-of-bounds relative to the service window
   */
  validateTimeline(items: RunSheetItem[], serviceStart?: string, serviceEnd?: string) {
    const warnings: string[] = [];
    const overlaps: string[] = [];

    const startMin = serviceStart ? this.timeStringToMinutes(serviceStart) : 0;
    const endMin = serviceEnd ? this.timeStringToMinutes(serviceEnd) : 24 * 60;

    for (let i = 0; i < items.length; i++) {
      const curr = items[i];
      const s = this.timeStringToMinutes(curr.startTime);
      const e = this.timeStringToMinutes(curr.endTime);

      if (serviceStart && s < startMin) {
        warnings.push(`"${curr.program}" starts at ${curr.startTime}, before service start (${serviceStart})`);
      }
      if (serviceEnd && e > endMin) {
        warnings.push(`"${curr.program}" ends at ${curr.endTime}, after service scheduled end (${serviceEnd})`);
      }

      for (let j = i + 1; j < items.length; j++) {
        const next = items[j];
        const nextS = this.timeStringToMinutes(next.startTime);
        const nextE = this.timeStringToMinutes(next.endTime);

        if (s < nextE && nextS < e) {
          overlaps.push(`Time conflict between "${curr.program}" (${curr.startTime}-${curr.endTime}) and "${next.program}" (${next.startTime}-${next.endTime})`);
        }
      }
    }

    return {
      isValid: overlaps.length === 0 && warnings.length === 0,
      overlaps,
      warnings
    };
  }

  /**
   * Add a new activity item to the service plan
   */
  async addActivityItem(
    churchId: string,
    planId: string,
    item: Omit<RunSheetItem, 'id' | 'order'>
  ): Promise<RunSheetItem> {
    const plan = await this.getServicePlanById(churchId, planId);
    if (!plan) throw new Error('Service plan not found');

    const currentItems = plan.runSheet || [];
    const newItem: RunSheetItem = {
      ...item,
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      order: currentItems.length + 1,
      assignmentStatus: item.responsibleMemberId ? 'pending' : 'unassigned',
      completionStatus: 'pending'
    };

    const updatedList = this.calculateItemEndTimes([...currentItems, newItem], plan.startTime);
    const newTotalDuration = this.calculateTotalDurationMinutes(updatedList);

    await this.updateServicePlan(churchId, planId, {
      runSheet: updatedList,
      totalDurationMinutes: newTotalDuration
    });

    return newItem;
  }

  /**
   * Update an existing activity item inside runSheet
   */
  async updateActivityItem(
    churchId: string,
    planId: string,
    itemId: string,
    updates: Partial<RunSheetItem>
  ): Promise<void> {
    const plan = await this.getServicePlanById(churchId, planId);
    if (!plan) throw new Error('Service plan not found');

    const updatedList = (plan.runSheet || []).map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });

    const recalculated = this.calculateItemEndTimes(updatedList, plan.startTime);
    const newTotalDuration = this.calculateTotalDurationMinutes(recalculated);

    await this.updateServicePlan(churchId, planId, {
      runSheet: recalculated,
      totalDurationMinutes: newTotalDuration
    });
  }

  /**
   * Delete an activity item from runSheet
   */
  async deleteActivityItem(churchId: string, planId: string, itemId: string): Promise<void> {
    const plan = await this.getServicePlanById(churchId, planId);
    if (!plan) throw new Error('Service plan not found');

    const filtered = (plan.runSheet || []).filter(item => item.id !== itemId);
    const recalculated = this.calculateItemEndTimes(filtered, plan.startTime);
    const newTotalDuration = this.calculateTotalDurationMinutes(recalculated);

    await this.updateServicePlan(churchId, planId, {
      runSheet: recalculated,
      totalDurationMinutes: newTotalDuration
    });
  }

  /**
   * Reorder activity items in runSheet
   */
  async reorderActivityItems(churchId: string, planId: string, newOrder: RunSheetItem[]): Promise<void> {
    const plan = await this.getServicePlanById(churchId, planId);
    if (!plan) throw new Error('Service plan not found');

    const recalculated = this.calculateItemEndTimes(newOrder, plan.startTime);
    const newTotalDuration = this.calculateTotalDurationMinutes(recalculated);

    await this.updateServicePlan(churchId, planId, {
      runSheet: recalculated,
      totalDurationMinutes: newTotalDuration
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SERVICE TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch templates combining built-in presets and church custom templates
   */
  async getServiceTemplates(churchId: string): Promise<ServiceTemplate[]> {
    if (!churchId?.trim()) return BUILT_IN_SERVICE_TEMPLATES;
    try {
      const snap = await this.getServiceTemplatesCol(churchId).orderBy('createdAt', 'desc').get();
      const customTemplates = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceTemplate[];

      return [...BUILT_IN_SERVICE_TEMPLATES, ...customTemplates];
    } catch (err) {
      console.error('[ServiceRosterService] getServiceTemplates error:', err);
      return BUILT_IN_SERVICE_TEMPLATES;
    }
  }

  /**
   * Create a new custom template for the church
   */
  async createServiceTemplate(churchId: string, template: Partial<ServiceTemplate>): Promise<ServiceTemplate> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getServiceTemplatesCol(targetChurch);
    const newDoc = col.doc();

    const created: ServiceTemplate = {
      id: newDoc.id,
      churchId: targetChurch,
      name: template.name || 'Custom Service Template',
      description: template.description || '',
      serviceType: template.serviceType || 'sunday_worship',
      defaultDurationMinutes: template.defaultDurationMinutes || 120,
      runSheetTemplate: template.runSheetTemplate || [],
      isBuiltIn: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };

    await newDoc.set(this.sanitizeForFirestore(created));
    return created;
  }

  /**
   * Apply a template structure onto an existing service plan
   */
  async applyTemplateToService(churchId: string, templateId: string, serviceId: string): Promise<RunSheetItem[]> {
    const templates = await this.getServiceTemplates(churchId);
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const plan = await this.getServicePlanById(churchId, serviceId);
    if (!plan) throw new Error('Service plan not found');

    // Instantiate fresh activity items with clean statuses (no volunteer carry-over)
    const baseItems: RunSheetItem[] = template.runSheetTemplate.map((item, idx) => ({
      ...item,
      id: `act_${Date.now()}_${idx}`,
      order: idx + 1,
      startTime: item.startTime || plan.startTime,
      durationMinutes: item.durationMinutes || 10,
      endTime: item.endTime || this.addMinutesToTime(plan.startTime, item.durationMinutes || 10),
      assignmentStatus: 'unassigned',
      completionStatus: 'pending'
    }));

    const recalculated = this.calculateItemEndTimes(baseItems, plan.startTime);
    const totalDur = this.calculateTotalDurationMinutes(recalculated);

    await this.updateServicePlan(churchId, serviceId, {
      runSheet: recalculated,
      totalDurationMinutes: totalDur,
      serviceType: template.serviceType
    });

    return recalculated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. MINISTRY TEAMS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all ministry teams for church, sorted by custom display order
   */
  async getMinistryTeams(churchId: string, onlyActive: boolean = false): Promise<MinistryTeam[]> {
    const targetChurch = (churchId || '').trim();
    if (!targetChurch) return [];
    try {
      let query: any = this.getMinistryTeamsCol(targetChurch);
      if (onlyActive) {
        query = query.where('active', '==', true);
      }
      const snap = await query.get();
      let teams: MinistryTeam[] = [];
      if (snap.empty) {
        // Automatically seed default teams if none exist yet!
        teams = await this.seedDefaultMinistryTeams(targetChurch);
      } else {
        teams = snap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as MinistryTeam[];
      }

      // Check local AsyncStorage order cache first
      const localOrderMap: Record<string, number> = {};
      try {
        const cached = await AsyncStorage.getItem(`@wechristian_ministry_teams_order_${targetChurch}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any, idx: number) => {
              if (item?.id) {
                localOrderMap[item.id] = typeof item.order === 'number' ? item.order : idx;
              }
            });
          }
        }
      } catch (_) {}

      // Sort teams according to:
      // 1. Explicit document order
      // 2. Cached local order
      // 3. Fallback default order: Worship, Prayer, Music, Media, Livestream, etc.
      teams.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : (localOrderMap[a.id] !== undefined ? localOrderMap[a.id] : getTeamDefaultRank(a.name, a.id));
        const orderB = typeof b.order === 'number' ? b.order : (localOrderMap[b.id] !== undefined ? localOrderMap[b.id] : getTeamDefaultRank(b.name, b.id));
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });

      return teams;
    } catch (err) {
      console.error('[ServiceRosterService] getMinistryTeams error:', err);
      return [];
    }
  }

  /**
   * Create or save a ministry team
   */
  async createMinistryTeam(churchId: string, team: Partial<MinistryTeam>): Promise<MinistryTeam> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getMinistryTeamsCol(targetChurch);
    const docRef = team.id ? col.doc(team.id) : col.doc();

    const created: MinistryTeam = {
      id: docRef.id,
      churchId: targetChurch,
      name: team.name || 'New Ministry Team',
      description: team.description || '',
      color: team.color || '#1a2d5a',
      leaderId: team.leaderId || '',
      leaderName: team.leaderName || '',
      leaderPhone: team.leaderPhone || '',
      memberIds: (team.memberIds || []).filter((id): id is string => Boolean(id)),
      positions: team.positions || [],
      active: team.active ?? true,
      order: typeof team.order === 'number' ? team.order : 999,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };

    const sanitized = this.sanitizeForFirestore(created);
    await docRef.set(sanitized, { merge: true });
    return created;
  }

  /**
   * Update ministry team
   */
  async updateMinistryTeam(churchId: string, teamId: string, updates: Partial<MinistryTeam>): Promise<void> {
    const payload = this.sanitizeForFirestore({
      ...updates,
      ...(updates.memberIds ? { memberIds: updates.memberIds.filter((id): id is string => Boolean(id)) } : {}),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    await this.getMinistryTeamsCol(churchId).doc(teamId).set(payload, { merge: true });
  }

  /**
   * Save customized display order for ministry teams across app restarts and Firestore
   */
  async updateMinistryTeamsOrder(churchId: string, orderedTeams: MinistryTeam[]): Promise<void> {
    const targetChurch = (churchId || '').trim();
    if (!targetChurch) return;
    try {
      // 1. Persist to AsyncStorage immediately for instant local retrieval across app restarts
      const orderMap = orderedTeams.map((t, idx) => ({ id: t.id, name: t.name, order: idx }));
      try {
        await AsyncStorage.setItem(`@wechristian_ministry_teams_order_${targetChurch}`, JSON.stringify(orderMap));
      } catch (storageErr) {
        console.warn('[ServiceRosterService] AsyncStorage order save warning:', storageErr);
      }

      // 2. Batch update order in Firestore
      const col = this.getMinistryTeamsCol(targetChurch);
      const batch = firestore().batch();
      orderedTeams.forEach((team, index) => {
        if (!team.id) return;
        const docRef = col.doc(team.id);
        batch.set(
          docRef,
          {
            order: index,
            updatedAt: firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.error('[ServiceRosterService] updateMinistryTeamsOrder error:', err);
    }
  }

  /**
   * Add member to a ministry team
   */
  async addMemberToTeam(churchId: string, teamId: string, memberId: string): Promise<void> {
    if (!memberId) return;
    await this.getMinistryTeamsCol(churchId).doc(teamId).set({
      memberIds: firestore.FieldValue.arrayUnion(memberId),
      updatedAt: firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  /**
   * Remove member from a ministry team
   */
  async removeMemberFromTeam(churchId: string, teamId: string, memberId: string): Promise<void> {
    if (!memberId) return;
    await this.getMinistryTeamsCol(churchId).doc(teamId).set({
      memberIds: firestore.FieldValue.arrayRemove(memberId),
      updatedAt: firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  /**
   * Delete a ministry team
   */
  async deleteMinistryTeam(churchId: string, teamId: string): Promise<void> {
    if (!churchId?.trim() || !teamId) return;
    await this.getMinistryTeamsCol(churchId).doc(teamId).delete();
  }

  /**
   * Seed the 14 standard ministry teams if database is empty
   */
  async seedDefaultMinistryTeams(churchId: string): Promise<MinistryTeam[]> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getMinistryTeamsCol(targetChurch);
    const seeded: MinistryTeam[] = [];

    for (let i = 0; i < DEFAULT_MINISTRY_TEAMS.length; i++) {
      const def = DEFAULT_MINISTRY_TEAMS[i];
      const docRef = col.doc(def.id);
      const teamObj: MinistryTeam = {
        ...def,
        order: i,
        churchId: targetChurch,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };
      await docRef.set(this.sanitizeForFirestore(teamObj), { merge: true });
      seeded.push(teamObj);
    }

    try {
      const orderMap = seeded.map((t, idx) => ({ id: t.id, name: t.name, order: idx }));
      await AsyncStorage.setItem(`@wechristian_ministry_teams_order_${targetChurch}`, JSON.stringify(orderMap));
    } catch (_) {}

    return seeded;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MEMBER SKILLS REPOSITORY & VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch skills for church, filterable by member or verification status
   */
  async getMemberSkills(
    churchId: string,
    memberId?: string,
    status?: 'verified' | 'pending' | 'rejected'
  ): Promise<MemberSkillRecord[]> {
    if (!churchId?.trim()) return [];
    try {
      let query: any = this.getMemberSkillsCol(churchId);
      if (memberId) {
        query = query.where('memberId', '==', memberId);
      }
      if (status) {
        query = query.where('verificationStatus', '==', status);
      }

      const snap = await query.get();
      return snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as MemberSkillRecord[];
    } catch (err) {
      console.error('[ServiceRosterService] getMemberSkills error:', err);
      return [];
    }
  }

  /**
   * Add or submit a member skill
   */
  async addOrUpdateMemberSkill(churchId: string, skill: Partial<MemberSkillRecord>): Promise<MemberSkillRecord> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getMemberSkillsCol(targetChurch);
    const docId = skill.id || `${skill.memberId}_${(skill.skillName || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const docRef = col.doc(docId);

    const record: MemberSkillRecord = {
      id: docId,
      churchId: targetChurch,
      memberId: skill.memberId || '',
      memberName: skill.memberName || '',
      memberPhone: skill.memberPhone,
      category: skill.category || 'music',
      skillName: skill.skillName || 'General Skill',
      proficiencyLevel: skill.proficiencyLevel || 'intermediate',
      verificationStatus: skill.verificationStatus || 'verified',
      submittedByMember: skill.submittedByMember ?? false,
      verifiedBy: skill.verifiedBy,
      verifiedAt: skill.verificationStatus === 'verified' ? firestore.FieldValue.serverTimestamp() : undefined,
      notes: skill.notes || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(this.sanitizeForFirestore(record), { merge: true });
    return record;
  }

  /**
   * Verify or reject submitted skill
   */
  async verifyMemberSkill(
    churchId: string,
    skillId: string,
    status: 'verified' | 'rejected',
    verifiedBy: string,
    rejectionReason?: string
  ): Promise<void> {
    await this.getMemberSkillsCol(churchId).doc(skillId).update(this.sanitizeForFirestore({
      verificationStatus: status,
      verifiedBy: verifiedBy || 'Admin',
      verifiedAt: firestore.FieldValue.serverTimestamp(),
      ...(rejectionReason ? { rejectionReason } : {}),
      updatedAt: firestore.FieldValue.serverTimestamp()
    }));
  }

  /**
   * Delete member skill
   */
  async deleteMemberSkill(churchId: string, skillId: string): Promise<void> {
    await this.getMemberSkillsCol(churchId).doc(skillId).delete();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. MEMBER AVAILABILITY & BLOCKOUT DATES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get availability for a member
   */
  async getMemberAvailability(churchId: string, memberId: string, monthYear?: string): Promise<MemberAvailabilityRecord | null> {
    if (!churchId?.trim() || !memberId) return null;
    try {
      const targetMonth = monthYear || new Date().toISOString().slice(0, 7);
      const docId = `${memberId}_${targetMonth}`;
      const doc = await this.getMemberAvailabilityCol(churchId).doc(docId).get();
      if (!this.docExists(doc)) return null;
      return { id: doc.id, ...doc.data() } as MemberAvailabilityRecord;
    } catch (err) {
      console.error('[ServiceRosterService] getMemberAvailability error:', err);
      return null;
    }
  }

  /**
   * Save or update availability / blockouts
   */
  async saveMemberAvailability(churchId: string, record: Partial<MemberAvailabilityRecord>): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const targetMonth = record.monthYear || new Date().toISOString().slice(0, 7);
    const docId = `${record.memberId}_${targetMonth}`;
    const docRef = this.getMemberAvailabilityCol(targetChurch).doc(docId);

    await docRef.set(this.sanitizeForFirestore({
      id: docId,
      churchId: targetChurch,
      memberId: record.memberId || '',
      memberName: record.memberName || '',
      monthYear: targetMonth,
      unavailableDates: record.unavailableDates || [],
      preferredServiceTimes: record.preferredServiceTimes || [],
      maxServicesPerMonth: record.maxServicesPerMonth,
      notes: record.notes || '',
      updatedAt: firestore.FieldValue.serverTimestamp()
    }), { merge: true });
  }

  /**
   * Check if member is available on a specific service date
   */
  async checkMemberAvailability(churchId: string, memberId: string, date: string): Promise<{ isAvailable: boolean; reason?: string }> {
    if (!churchId?.trim() || !memberId || !date) return { isAvailable: true };
    try {
      const monthYear = date.slice(0, 7);
      const docId = `${memberId}_${monthYear}`;
      const doc = await this.getMemberAvailabilityCol(churchId).doc(docId).get();
      if (!this.docExists(doc)) return { isAvailable: true };

      const data = doc.data() as MemberAvailabilityRecord;
      if (data?.unavailableDates?.includes(date)) {
        return {
          isAvailable: false,
          reason: data.notes || 'Marked as unavailable / blockout date'
        };
      }

      return { isAvailable: true };
    } catch (err) {
      console.error('[ServiceRosterService] checkMemberAvailability error:', err);
      return { isAvailable: true };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. WORSHIP SETLIST MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Add song to service setlist
   */
  async addSongToSetlist(churchId: string, serviceId: string, songItem: SetlistItem): Promise<void> {
    const plan = await this.getServicePlanById(churchId, serviceId);
    if (!plan) throw new Error('Service plan not found');

    const sanitizedItem = this.sanitizeForFirestore(songItem);
    const currentSetlist = plan.setlist || [];
    const updated = [...currentSetlist, sanitizedItem];

    await this.updateServicePlan(churchId, serviceId, {
      setlist: updated
    });
  }

  /**
   * Add multiple songs to service setlist in a single atomic update
   */
  async addMultipleSongsToSetlist(churchId: string, serviceId: string, songItems: SetlistItem[]): Promise<void> {
    if (!songItems || songItems.length === 0) return;
    const plan = await this.getServicePlanById(churchId, serviceId);
    if (!plan) throw new Error('Service plan not found');

    const sanitizedItems = songItems.map(item => this.sanitizeForFirestore(item));
    const currentSetlist = plan.setlist || [];
    const updated = [...currentSetlist, ...sanitizedItems];

    await this.updateServicePlan(churchId, serviceId, {
      setlist: updated
    });
  }

  /**
   * Update setlist item
   */
  async updateSetlistSong(churchId: string, serviceId: string, songItemId: string, updates: Partial<SetlistItem>): Promise<void> {
    const plan = await this.getServicePlanById(churchId, serviceId);
    if (!plan) throw new Error('Service plan not found');

    const updated = (plan.setlist || []).map(s => {
      if (s.id === songItemId) {
        return { ...s, ...updates };
      }
      return s;
    });

    await this.updateServicePlan(churchId, serviceId, {
      setlist: updated
    });
  }

  /**
   * Remove song from setlist
   */
  async removeSongFromSetlist(churchId: string, serviceId: string, songItemId: string): Promise<void> {
    const plan = await this.getServicePlanById(churchId, serviceId);
    if (!plan) throw new Error('Service plan not found');

    const updated = (plan.setlist || []).filter(s => s.id !== songItemId);

    await this.updateServicePlan(churchId, serviceId, {
      setlist: updated
    });
  }

  /**
   * Reorder songs in setlist
   */
  async reorderSetlist(churchId: string, serviceId: string, newSetlist: SetlistItem[]): Promise<void> {
    await this.updateServicePlan(churchId, serviceId, {
      setlist: newSetlist
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. ASSIGNMENT QUEUES & CASCADE WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Deduplicate candidate entries by candidateId and normalized candidateName,
   * preserving the most definitive response status ('accepted' > 'declined' > 'timed_out' > 'pending' > 'waiting').
   */
  deduplicateCandidates(candidates: CandidateEntry[] = []): CandidateEntry[] {
    if (!Array.isArray(candidates) || candidates.length <= 1) return candidates || [];
    const statusPriority: Record<string, number> = {
      accepted: 5,
      declined: 4,
      timed_out: 3,
      missed: 2,
      pending: 1,
      waiting: 0,
    };

    const result: CandidateEntry[] = [];
    for (const cand of candidates) {
      if (!cand) continue;
      const cId = (cand.candidateId || '').trim();
      const cName = (cand.candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ');

      const existingIdx = result.findIndex(existing => {
        const eId = (existing.candidateId || '').trim();
        const eName = (existing.candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (cId && eId && cId === eId) return true;
        if (cName && eName && cName !== 'volunteer' && cName !== 'member' && cName === eName) return true;
        return false;
      });

      if (existingIdx === -1) {
        result.push({ ...cand });
      } else {
        const existing = result[existingIdx];
        const pNew = statusPriority[cand.status] ?? 0;
        const pOld = statusPriority[existing.status] ?? 0;
        if (pNew >= pOld) {
          result[existingIdx] = {
            ...existing,
            ...cand,
            candidateId: existing.candidateId || cand.candidateId,
            candidateName: cand.candidateName || existing.candidateName,
            candidatePhone: cand.candidatePhone || existing.candidatePhone,
            declineReason: cand.declineReason || existing.declineReason,
            respondedAt: cand.respondedAt || existing.respondedAt,
          };
        } else {
          result[existingIdx] = {
            ...cand,
            ...existing,
            candidatePhone: existing.candidatePhone || cand.candidatePhone,
            declineReason: existing.declineReason || cand.declineReason,
            respondedAt: existing.respondedAt || cand.respondedAt,
          };
        }
      }
    }
    return result;
  }

  /**
   * Fetch all assignment queues for a service plan
   */
  async getAssignmentQueues(churchId: string, serviceId: string): Promise<ServiceAssignmentQueue[]> {
    if (!churchId?.trim() || !serviceId) return [];
    try {
      const snap = await this.getAssignmentQueuesCol(churchId, serviceId).get();
      return snap.docs.map((doc: any) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...data,
          candidates: this.deduplicateCandidates(data.candidates || [])
        };
      }) as ServiceAssignmentQueue[];
    } catch (err) {
      console.error('[ServiceRosterService] getAssignmentQueues error:', err);
      return [];
    }
  }

  /**
   * Realtime listener for assignment queues (instant UI updates on accept/decline/cascade)
   */
  listenAssignmentQueues(
    churchId: string,
    serviceId: string,
    onUpdate: (queues: ServiceAssignmentQueue[]) => void
  ): () => void {
    if (!churchId?.trim() || !serviceId) return () => {};
    return this.getAssignmentQueuesCol(churchId, serviceId).onSnapshot(
      (snap: any) => {
        const queues = snap.docs.map((doc: any) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
            candidates: this.deduplicateCandidates(data.candidates || [])
          };
        }) as ServiceAssignmentQueue[];
        onUpdate(queues);
      },
      (err: any) => {
        console.error('[ServiceRosterService] listenAssignmentQueues error:', err);
      }
    );
  }

  /**
   * Dispatch assignment queue with candidate ladder (Rank 1, Rank 2, Rank 3)
   */
  async dispatchAssignmentQueue(
    churchId: string,
    serviceId: string,
    params: {
      roleId: string;
      roleTitle: string;
      activityId?: string;
      activityName?: string;
      candidates: Array<{ candidateId: string; candidateName: string; candidatePhone?: string }>;
      timeoutMinutes?: number;
    }
  ): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    if (!params.candidates || params.candidates.length === 0) {
      throw new Error('At least one candidate is required to dispatch an assignment queue.');
    }

    const safeRoleId = (params.roleId || 'role').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timeoutMinutes = params.timeoutMinutes || 1440; // Default 24 hours
    const nowIso = new Date().toISOString();
    const deadlineIso = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

    const formattedCandidates: CandidateEntry[] = params.candidates.map((c, idx) => {
      const entry: CandidateEntry = {
        candidateId: c.candidateId || '',
        candidateName: c.candidateName || 'Volunteer',
        status: idx === 0 ? 'pending' : 'waiting'
      };
      if (c.candidatePhone) {
        entry.candidatePhone = c.candidatePhone;
      }
      if (idx === 0) {
        entry.requestedAt = nowIso;
        entry.deadline = deadlineIso;
      }
      return entry;
    });

    const primaryCandidate = formattedCandidates[0];

    const queueRecord: Record<string, any> = {
      id: safeRoleId,
      serviceId,
      churchId: targetChurch,
      roleId: safeRoleId,
      roleTitle: params.roleTitle || 'Ministry Responsibility',
      status: 'pending',
      currentCandidateIndex: 0,
      timeoutMinutes,
      candidates: formattedCandidates,
      history: [
        {
          timestamp: nowIso,
          action: 'queue_dispatched',
          candidateId: primaryCandidate?.candidateId || '',
          candidateName: primaryCandidate?.candidateName || 'Volunteer',
          details: `Dispatched to Candidate #1 (${primaryCandidate?.candidateName || 'Volunteer'}) with ${Math.round(timeoutMinutes / 60)}h deadline.`
        }
      ],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };

    if (params.activityId) {
      queueRecord.activityId = params.activityId;
    }
    if (params.activityName) {
      queueRecord.activityName = params.activityName;
    }

    const sanitizedQueue = this.sanitizeForFirestore(queueRecord);
    const queueRef = this.getAssignmentQueuesCol(targetChurch, serviceId).doc(safeRoleId);
    await queueRef.set(sanitizedQueue);

    // Sync state to parent service plan
    const planRef = this.getServicePlansCol(targetChurch).doc(serviceId);
    const planUpdates: Record<string, any> = {
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    if (primaryCandidate?.candidateName) {
      planUpdates[`assignments.${safeRoleId}`] = primaryCandidate.candidateName;
    }
    if (primaryCandidate?.candidateId) {
      planUpdates[`assignmentMemberIds.${safeRoleId}`] = primaryCandidate.candidateId;
    }
    planUpdates[`assignmentStatus.${safeRoleId}`] = 'pending';
    await planRef.update(this.sanitizeForFirestore(planUpdates));

    // Write in-app notification to the active candidate immediately
    try {
      const activeCand = formattedCandidates[0];
      if (activeCand?.candidateId) {
        const notifDoc = this.sanitizeForFirestore({
          id: `assign_${serviceId}_${safeRoleId}_${activeCand.candidateId}`,
          type: 'service_assignment',
          title: `New Service Assignment: ${params.roleTitle || 'Ministry Responsibility'}`,
          content: `You are requested to serve as ${params.roleTitle || 'volunteer'}. Please respond within ${Math.max(1, Math.round(timeoutMinutes / 60))} hours. Tap to view and respond.`,
          body: `You are requested to serve as ${params.roleTitle || 'volunteer'}. Please respond within ${Math.max(1, Math.round(timeoutMinutes / 60))} hours. Tap to view and respond.`,
          churchId: targetChurch,
          targetMemberId: activeCand.candidateId,
          targetPhone: activeCand.candidatePhone || null,
          serviceId,
          roleId: safeRoleId,
          roleTitle: params.roleTitle || 'Ministry Responsibility',
          activityId: params.activityId || '',
          activityName: params.activityName || '',
          candidateId: activeCand.candidateId,
          status: 'pending',
          read: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
        await firestore()
          .collection(CHURCHES_COLLECTION)
          .doc(targetChurch)
          .collection('members')
          .doc(activeCand.candidateId)
          .collection('notifications')
          .doc(`assign_${serviceId}_${safeRoleId}`)
          .set(notifDoc, { merge: true })
          .catch(() => {});

        // Also write targeted broadcast document so it appears in the Updates screen
        await firestore()
          .collection(CHURCHES_COLLECTION)
          .doc(targetChurch)
          .collection('broadcasts')
          .doc(`assign_${serviceId}_${safeRoleId}_${activeCand.candidateId}`)
          .set(notifDoc, { merge: true })
          .catch(() => {});
      }
    } catch (_) {}
  }

  /**
   * Automatic Responsibility Assignment Workflow (First-Come, First-Served):
   * Identifies all eligible members matching verified / primary / secondary skills,
   * creates/updates assignment queues, and broadcasts notifications to all eligible members simultaneously.
   */
  async autoDispatchFirstComeResponsibilities(
    churchId: string,
    serviceId: string
  ): Promise<{ dispatchedCount: number; emptyCount: number }> {
    const targetChurch = this.requireChurchId(churchId);
    const planDoc = await this.getServicePlansCol(targetChurch).doc(serviceId).get();
    if (!this.docExists(planDoc)) throw new Error('Service plan not found.');
    const plan = planDoc.data() as ServicePlan;

    const bandRoles = [
      { roleId: 'role_keyboard', title: 'Keyboardist / Pianist', skill: 'Keyboard / Piano' },
      { roleId: 'role_drums', title: 'Drummer / Percussionist', skill: 'Drums / Percussion' },
      { roleId: 'role_bass', title: 'Bass Guitarist', skill: 'Bass Guitar' },
      { roleId: 'role_acoustic', title: 'Acoustic Guitarist', skill: 'Acoustic Guitar' },
      { roleId: 'role_electric', title: 'Electric Guitarist', skill: 'Electric Guitar' },
      { roleId: 'role_sound', title: 'Sound & Audio Engineer', skill: 'Sound Engineer' },
      { roleId: 'role_worship_leader', title: 'Worship Leader', skill: 'Worship Leader' },
    ];

    const unassigned: Array<{
      roleId: string;
      roleTitle: string;
      requiredSkill: string;
      activityId?: string;
      activityName?: string;
    }> = [];

    // Band roles
    bandRoles.forEach(b => {
      if (!plan.assignments?.[b.roleId] || !plan.assignments[b.roleId].trim()) {
        unassigned.push({
          roleId: b.roleId,
          roleTitle: b.title,
          requiredSkill: b.skill
        });
      }
    });

    // RunSheet items
    (plan.runSheet || []).forEach((item, idx) => {
      if (!item.responsiblePerson || !item.responsiblePerson.trim()) {
        const cleanId = item.id ? (item.id.startsWith('act_') ? item.id : `act_${item.id}`) : `act_${idx}`;
        unassigned.push({
          roleId: cleanId,
          roleTitle: item.program || 'Order of Service Responsibility',
          requiredSkill: item.category || item.program,
          activityId: item.id || cleanId,
          activityName: item.program
        });
      }
    });

    let dispatchedCount = 0;
    let emptyCount = 0;
    const nowIso = new Date().toISOString();
    const timeoutMinutes = 120; // 2 hours
    const deadlineIso = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

    for (const resp of unassigned) {
      const qDocRef = this.getAssignmentQueuesCol(targetChurch, serviceId).doc(resp.roleId);
      const existingSnap = await qDocRef.get();
      if (this.docExists(existingSnap)) {
        const existingData = existingSnap.data() as any;
        if (existingData.status === 'confirmed' || existingData.confirmedCandidateId) {
          continue; // Already confirmed/booked
        }
      }

      // Fetch eligible candidates
      const eligible = await this.getEligibleCandidatesForRole(targetChurch, plan.date, {
        requiredSkill: resp.requiredSkill,
        roleTitle: resp.roleTitle
      });

      const qualified = eligible.filter(e => e.isAvailable && e.matchScore >= 20);

      if (qualified.length === 0) {
        emptyCount++;
        await qDocRef.set(this.sanitizeForFirestore({
          id: resp.roleId,
          serviceId,
          churchId: targetChurch,
          roleId: resp.roleId,
          roleTitle: resp.roleTitle,
          activityId: resp.activityId,
          activityName: resp.activityName,
          requiredSkill: resp.requiredSkill,
          mode: 'first_come_first_served',
          status: 'exhausted',
          eligibleMemberIds: [],
          declinedMemberIds: [],
          candidates: [],
          timeoutMinutes,
          deadline: deadlineIso,
          history: [{
            timestamp: nowIso,
            action: 'no_eligible_members',
            details: 'No members found with matching verified skills and availability.'
          }],
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        }), { merge: true });
        continue;
      }

      const candidateEntries = qualified.map(m => ({
        candidateId: m.memberId,
        candidateName: m.memberName,
        candidatePhone: m.memberPhone || '',
        status: 'pending' as const,
        requestedAt: nowIso,
        deadline: deadlineIso
      }));

      await qDocRef.set(this.sanitizeForFirestore({
        id: resp.roleId,
        serviceId,
        churchId: targetChurch,
        roleId: resp.roleId,
        roleTitle: resp.roleTitle,
        activityId: resp.activityId,
        activityName: resp.activityName,
        requiredSkill: resp.requiredSkill,
        mode: 'first_come_first_served',
        status: 'pending',
        timeoutMinutes,
        deadline: deadlineIso,
        eligibleMemberIds: qualified.map(m => m.memberId),
        declinedMemberIds: [],
        candidates: candidateEntries,
        history: [{
          timestamp: nowIso,
          action: 'broadcast_dispatched',
          details: `First-Come, First-Served broadcast sent to ${qualified.length} eligible member(s) with ${Math.round(timeoutMinutes / 60)}h deadline.`
        }],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      }), { merge: true });

      // Write targeted notifications and broadcasts for eligible members so they appear in UpdatesScreen
      for (const m of qualified) {
        try {
          const fcfsDoc = this.sanitizeForFirestore({
            id: `fcfs_${serviceId}_${resp.roleId}_${m.memberId}`,
            type: 'service_responsibility_broadcast',
            title: `Responsibility Available: ${resp.roleTitle}`,
            content: `"${plan.serviceTitle || 'Worship Service'}" on ${formatDateMonthYear(plan.date)} at ${formatTimeTo12Hour(plan.startTime)} needs a ${resp.roleTitle}. First to accept gets booked! Tap to claim slot.`,
            body: `"${plan.serviceTitle || 'Worship Service'}" on ${formatDateMonthYear(plan.date)} at ${formatTimeTo12Hour(plan.startTime)} needs a ${resp.roleTitle}. First to accept gets booked! Tap to claim slot.`,
            churchId: targetChurch,
            targetMemberId: m.memberId,
            targetPhone: m.memberPhone || null,
            serviceId,
            roleId: resp.roleId,
            roleTitle: resp.roleTitle,
            activityId: resp.activityId || '',
            activityName: resp.activityName || '',
            serviceTitle: plan.serviceTitle,
            serviceDate: plan.date,
            serviceTime: plan.startTime,
            status: 'available',
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp()
          });

          await firestore()
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('broadcasts')
            .doc(`fcfs_${serviceId}_${resp.roleId}_${m.memberId}`)
            .set(fcfsDoc, { merge: true })
            .catch(() => {});

          await firestore()
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('members')
            .doc(m.memberId)
            .collection('notifications')
            .doc(`fcfs_${serviceId}_${resp.roleId}`)
            .set(fcfsDoc, { merge: true })
            .catch(() => {});
        } catch (_) {}
      }

      dispatchedCount++;
    }

    return { dispatchedCount, emptyCount };
  }

  /**
   * Concurrency-safe Accept / Decline response workflow with auto-cascade
   */
  async respondToAssignment(
    churchId: string,
    serviceId: string,
    roleId: string,
    candidateId: string,
    action: 'accept' | 'decline',
    reason?: string,
    candidateName?: string
  ): Promise<void> {
    const queueRef = this.getAssignmentQueuesCol(churchId, serviceId).doc(roleId);
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);

    await firestore().runTransaction(async (transaction: any) => {
      const qSnap = await transaction.get(queueRef);
      if (!this.docExists(qSnap)) {
        throw new Error('Assignment queue not found for this role.');
      }

      const qData = qSnap.data() as ServiceAssignmentQueue;
      const candidates = [...(qData.candidates || [])];
      const nowIso = new Date().toISOString();

      // ─────────────────────────────────────────────────────────────────────────
      // 1. FIRST-COME, FIRST-SERVED AUTOMATIC SLOT BOOKING
      // ─────────────────────────────────────────────────────────────────────────
      const isFCFS = (qData as any).mode === 'first_come_first_served';
      const normTargetName = (candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const isSameCandidate = (c: CandidateEntry) => {
        if (candidateId && c.candidateId === candidateId) return true;
        const cNorm = (c.candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (normTargetName && cNorm && normTargetName !== 'volunteer' && cNorm === normTargetName) return true;
        return false;
      };

      if (isFCFS) {
        if (action === 'accept') {
          // Concurrency check: Ensure slot is not already booked!
          if (qData.status === 'confirmed' || qData.confirmedCandidateId) {
            if (qData.confirmedCandidateId !== candidateId) {
              throw new Error('This responsibility slot has already been booked by another member.');
            }
            return;
          }

          const matchedCand = candidates.find(c => isSameCandidate(c));
          const resolvedId = matchedCand?.candidateId || candidateId;
          const resolvedName = candidateName || matchedCand?.candidateName || 'Volunteer';

          let updatedCandidates: CandidateEntry[] = candidates.map((c): CandidateEntry => {
            if (isSameCandidate(c)) {
              return { ...c, status: 'accepted', declineReason: undefined, respondedAt: nowIso };
            }
            return { ...c, status: c.status === 'declined' ? 'declined' : 'waiting' };
          });

          if (!updatedCandidates.some(c => isSameCandidate(c))) {
            updatedCandidates.push({
              candidateId: resolvedId,
              candidateName: resolvedName,
              status: 'accepted',
              respondedAt: nowIso
            });
          }
          updatedCandidates = this.deduplicateCandidates(updatedCandidates);

          const updatedDeclinedIds = (((qData as any).declinedMemberIds || []) as string[]).filter(
            id => id !== candidateId && id !== resolvedId
          );

          const historyEntry = {
            timestamp: nowIso,
            action: 'slot_booked_first_come',
            candidateId: resolvedId,
            candidateName: resolvedName,
            details: `Booked by ${resolvedName} (First to accept)`
          };

          transaction.update(queueRef, this.sanitizeForFirestore({
            status: 'confirmed',
            confirmedCandidateId: resolvedId,
            confirmedCandidateName: resolvedName,
            bookedAt: nowIso,
            declinedMemberIds: updatedDeclinedIds,
            candidates: updatedCandidates,
            history: firestore.FieldValue.arrayUnion(historyEntry),
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));

          transaction.update(planRef, this.sanitizeForFirestore({
            [`assignments.${roleId}`]: resolvedName,
            [`assignmentMemberIds.${roleId}`]: resolvedId,
            [`assignmentStatus.${roleId}`]: 'confirmed',
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));
          return;
        } else {
          // Decline in FCFS mode
          const matchedCand = candidates.find(c => isSameCandidate(c));
          const resolvedId = matchedCand?.candidateId || candidateId;
          const resolvedName = candidateName || matchedCand?.candidateName || 'Volunteer';

          const declinedList = Array.from(new Set([
            ...((qData as any).declinedMemberIds || []),
            resolvedId,
            ...(candidateId ? [candidateId] : [])
          ]));
          const isCurrentConfirmed = qData.confirmedCandidateId === candidateId || qData.confirmedCandidateId === resolvedId;

          let updatedCandidates = candidates.map(c => {
            if (isSameCandidate(c)) {
              return { ...c, status: 'declined' as const, declineReason: reason || 'Unavailable', respondedAt: nowIso };
            }
            return c;
          });

          if (!updatedCandidates.some(c => isSameCandidate(c))) {
            updatedCandidates.push({
              candidateId: resolvedId,
              candidateName: resolvedName,
              status: 'declined' as const,
              declineReason: reason || 'Unavailable',
              respondedAt: nowIso
            });
          }
          updatedCandidates = this.deduplicateCandidates(updatedCandidates);

          if (isCurrentConfirmed) {
            // Re-open the slot!
            const remainingCount = updatedCandidates.filter(c => c.status !== 'declined').length;
            transaction.update(queueRef, this.sanitizeForFirestore({
              status: remainingCount > 0 ? 'pending' : 'exhausted',
              confirmedCandidateId: firestore.FieldValue.delete(),
              confirmedCandidateName: firestore.FieldValue.delete(),
              declinedMemberIds: declinedList,
              candidates: updatedCandidates,
              history: firestore.FieldValue.arrayUnion({
                timestamp: nowIso,
                action: 'confirmed_member_cancelled_slot_reopened',
                candidateId: resolvedId,
                candidateName: resolvedName,
                details: `Cancelled by ${resolvedName}: ${reason || 'Unavailable'}. Slot re-opened.`
              }),
              updatedAt: firestore.FieldValue.serverTimestamp()
            }));

            transaction.update(planRef, this.sanitizeForFirestore({
              [`assignments.${roleId}`]: firestore.FieldValue.delete(),
              [`assignmentMemberIds.${roleId}`]: firestore.FieldValue.delete(),
              [`assignmentStatus.${roleId}`]: 'pending',
              updatedAt: firestore.FieldValue.serverTimestamp()
            }));
          } else {
            const allDeclined = updatedCandidates.length > 0 && updatedCandidates.every(c => c.status === 'declined');
            transaction.update(queueRef, this.sanitizeForFirestore({
              status: allDeclined ? 'exhausted' : qData.status,
              declinedMemberIds: declinedList,
              candidates: updatedCandidates,
              history: firestore.FieldValue.arrayUnion({
                timestamp: nowIso,
                action: 'candidate_declined',
                candidateId: resolvedId,
                candidateName: resolvedName,
                details: `Declined: ${reason || 'Unavailable'}`
              }),
              updatedAt: firestore.FieldValue.serverTimestamp()
            }));
          }
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 2. SEQUENTIAL CANDIDATE LADDER (FALLBACK / MANUAL LADDER)
      // ─────────────────────────────────────────────────────────────────────────
      const curIdx = qData.currentCandidateIndex || 0;
      const activeCandidate = candidates[curIdx];

      if (!activeCandidate) {
        throw new Error('No active candidate in assignment queue.');
      }

      if (action === 'accept') {
        // Mark active candidate accepted and resolve queue
        candidates[curIdx] = {
          ...activeCandidate,
          status: 'accepted',
          respondedAt: nowIso
        };

        const historyEntry = {
          timestamp: nowIso,
          action: 'candidate_accepted',
          candidateId: activeCandidate.candidateId,
          candidateName: activeCandidate.candidateName,
          details: `Confirmed as ${qData.roleTitle}`
        };

        transaction.update(queueRef, this.sanitizeForFirestore({
          status: 'confirmed',
          confirmedCandidateId: activeCandidate.candidateId,
          confirmedCandidateName: activeCandidate.candidateName,
          candidates,
          history: firestore.FieldValue.arrayUnion(historyEntry),
          updatedAt: firestore.FieldValue.serverTimestamp()
        }));

        transaction.update(planRef, this.sanitizeForFirestore({
          [`assignments.${roleId}`]: activeCandidate.candidateName || '',
          [`assignmentMemberIds.${roleId}`]: activeCandidate.candidateId || '',
          [`assignmentStatus.${roleId}`]: 'confirmed',
          updatedAt: firestore.FieldValue.serverTimestamp()
        }));
      } else {
        // Decline and auto-cascade to next candidate in queue
        candidates[curIdx] = {
          ...activeCandidate,
          status: 'declined',
          declineReason: reason || 'Unavailable',
          respondedAt: nowIso
        };

        const nextIdx = curIdx + 1;
        if (nextIdx < candidates.length) {
          const nextCand = candidates[nextIdx];
          const timeoutMins = qData.timeoutMinutes || 1440;
          const deadlineIso = new Date(Date.now() + timeoutMins * 60 * 1000).toISOString();

          candidates[nextIdx] = {
            ...nextCand,
            status: 'pending',
            requestedAt: nowIso,
            deadline: deadlineIso
          };

          const historyEntry = {
            timestamp: nowIso,
            action: `declined_cascaded_to_candidate_${nextIdx + 1}`,
            candidateId: activeCandidate.candidateId,
            candidateName: activeCandidate.candidateName,
            details: `Declined: ${reason || 'Unavailable'}. Cascaded to Candidate #${nextIdx + 1} (${nextCand?.candidateName}).`
          };

          transaction.update(queueRef, this.sanitizeForFirestore({
            status: 'pending',
            currentCandidateIndex: nextIdx,
            candidates,
            history: firestore.FieldValue.arrayUnion(historyEntry),
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));

          transaction.update(planRef, this.sanitizeForFirestore({
            [`assignments.${roleId}`]: nextCand?.candidateName || '',
            [`assignmentMemberIds.${roleId}`]: nextCand?.candidateId || '',
            [`assignmentStatus.${roleId}`]: 'pending',
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));
        } else {
          // All candidates exhausted!
          const historyEntry = {
            timestamp: nowIso,
            action: 'queue_exhausted_all_declined',
            candidateId: activeCandidate.candidateId,
            candidateName: activeCandidate.candidateName,
            details: `Declined: ${reason || 'Unavailable'}. All candidates in queue have declined or timed out.`
          };

          transaction.update(queueRef, this.sanitizeForFirestore({
            status: 'exhausted',
            candidates,
            history: firestore.FieldValue.arrayUnion(historyEntry),
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));

          transaction.update(planRef, this.sanitizeForFirestore({
            [`assignmentStatus.${roleId}`]: 'declined',
            updatedAt: firestore.FieldValue.serverTimestamp()
          }));
        }
      }
    });
  }

  /**
   * Admin manual override for assignment (bypasses queue directly)
   */
  async manualOverrideAssignment(
    churchId: string,
    serviceId: string,
    roleId: string,
    memberId: string,
    memberName: string,
    notes?: string
  ): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const queueRef = this.getAssignmentQueuesCol(targetChurch, serviceId).doc(roleId);
    const planRef = this.getServicePlansCol(targetChurch).doc(serviceId);

    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      action: 'manual_override',
      candidateId: memberId,
      candidateName: memberName,
      details: notes || 'Admin manual assignment override'
    };

    await queueRef.set(this.sanitizeForFirestore({
      id: roleId,
      serviceId,
      churchId: targetChurch,
      roleId,
      status: 'confirmed',
      confirmedCandidateId: memberId,
      confirmedCandidateName: memberName,
      history: firestore.FieldValue.arrayUnion(historyEntry),
      updatedAt: firestore.FieldValue.serverTimestamp()
    }), { merge: true });

    const planUpdates: Record<string, any> = {
      [`assignments.${roleId}`]: memberName || '',
      [`assignmentMemberIds.${roleId}`]: memberId || '',
      [`assignmentStatus.${roleId}`]: 'confirmed',
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    if (notes) {
      planUpdates[`assignmentNotes.${roleId}`] = notes;
    }
    await planRef.update(this.sanitizeForFirestore(planUpdates));
  }

  /**
   * Delete assignment queue
   */
  async deleteAssignmentQueue(churchId: string, serviceId: string, roleId: string): Promise<void> {
    await this.getAssignmentQueuesCol(churchId, serviceId).doc(roleId).delete();
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    await planRef.update({
      [`assignments.${roleId}`]: firestore.FieldValue.delete(),
      [`assignmentMemberIds.${roleId}`]: firestore.FieldValue.delete(),
      [`assignmentStatus.${roleId}`]: firestore.FieldValue.delete(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Cancel or delete a duty assignment for a member (from pending or confirmed state).
   * Updates plan assignments, runsheet, and queue.
   */
  async cancelOrDeleteDutyAssignment(
    churchId: string,
    serviceId: string,
    roleId: string,
    memberId: string,
    memberName?: string,
    reason: string = 'Member requested deletion / cancellation'
  ): Promise<void> {
    if (!churchId?.trim() || !serviceId || !roleId) return;

    try {
      const planRef = this.getServicePlansCol(churchId).doc(serviceId);
      const planSnap = await planRef.get();
      if (this.docExists(planSnap)) {
        const plan = planSnap.data() as ServicePlan;
        const updates: Record<string, any> = {
          updatedAt: firestore.FieldValue.serverTimestamp()
        };

        // 1. Remove from whole-service assignments if present
        updates[`assignments.${roleId}`] = firestore.FieldValue.delete();
        updates[`assignmentMemberIds.${roleId}`] = firestore.FieldValue.delete();
        updates[`assignmentStatus.${roleId}`] = 'declined';

        // 2. Check runSheet activities
        if (plan.runSheet) {
          const cleanRoleId = roleId.replace(/^(role_)?(act_)+/, '');
          let changedRunsheet = false;
          const updatedRunsheet = plan.runSheet.map(item => {
            const isMatch = item.id === roleId ||
              item.id === `act_${cleanRoleId}` ||
              item.id.replace(/^(act_)+/, '') === cleanRoleId ||
              (item.responsibleMemberId === memberId && Boolean(memberId)) ||
              (memberName && item.responsiblePerson && item.responsiblePerson.toLowerCase().trim() === memberName.toLowerCase().trim() && item.id === roleId);

            if (isMatch) {
              changedRunsheet = true;
              return {
                ...item,
                responsiblePerson: '',
                responsibleMemberId: '',
                assignmentStatus: 'declined' as const
              };
            }
            return item;
          });

          if (changedRunsheet) {
            updates.runSheet = updatedRunsheet;
          }
        }

        await planRef.update(updates);
      }

      // 3. Update queue if exists
      try {
        const queueRef = this.getAssignmentQueuesCol(churchId, serviceId).doc(roleId);
        const qSnap = await queueRef.get();
        if (this.docExists(qSnap)) {
          const qData = qSnap.data() as ServiceAssignmentQueue;

          if ((qData as any).mode === 'first_come_first_served') {
            const declinedList = Array.from(new Set([...((qData as any).declinedMemberIds || []), memberId]));
            const eligibleList = (qData as any).eligibleMemberIds || [];
            const remaining = eligibleList.filter((id: string) => !declinedList.includes(id));
            const updatedCandidates = (qData.candidates || []).map(c => {
              if (c.candidateId === memberId) {
                return { ...c, status: 'declined' as const, declineReason: reason, respondedAt: new Date().toISOString() };
              }
              return c;
            });
            await queueRef.update({
              status: remaining.length > 0 ? 'pending' : 'exhausted',
              confirmedCandidateId: firestore.FieldValue.delete(),
              confirmedCandidateName: firestore.FieldValue.delete(),
              declinedMemberIds: declinedList,
              candidates: updatedCandidates,
              updatedAt: firestore.FieldValue.serverTimestamp()
            });
            if (remaining.length > 0) {
              await planRef.update({
                [`assignmentStatus.${roleId}`]: 'pending',
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
            }
          } else {
            const candidates = [...(qData.candidates || [])];
            const curIdx = qData.currentCandidateIndex || 0;
            if (candidates[curIdx]) {
              candidates[curIdx] = {
                ...candidates[curIdx],
                status: 'declined',
                declineReason: reason,
                respondedAt: new Date().toISOString()
              };
              await queueRef.update({
                candidates,
                status: 'declined',
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('[ServiceRosterService] cancelOrDeleteDutyAssignment error:', err);
      throw err;
    }
  }

  /**
   * Default ministry team IDs suggested for each Order of Service activity category.
   */
  getDefaultTeamIdsForActivity(category?: string, program?: string): string[] {
    const pLower = (program || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    if (cat === 'preparation' || pLower.includes('sound check') || pLower.includes('preparation')) {
      return ['team_sound', 'team_media'];
    }
    if (cat === 'worship_songs' || cat === 'opening_song' || pLower.includes('worship') || pLower.includes('praise')) {
      return ['team_worship', 'team_music'];
    }
    if (cat === 'music' || cat === 'special_performance') {
      return ['team_music', 'team_worship'];
    }
    if (cat === 'starting_prayer' || cat === 'closing_prayer' || pLower.includes('prayer')) {
      return ['team_prayer'];
    }
    if (cat === 'offering' || pLower.includes('offering') || pLower.includes('tithe')) {
      return ['team_offering'];
    }
    if (cat === 'communion' || pLower.includes('communion')) {
      return ['team_communion'];
    }
    if (cat === 'announcements' || pLower.includes('welcome') || pLower.includes('greeting')) {
      return ['team_media', 'team_hospitality'];
    }
    return [];
  }

  /**
   * Resolve MinistryTeam records from team IDs, display names, or composite labels
   * (e.g. "Sound & Media Team" -> [Sound Team, Media Team]).
   */
  resolveMatchingTeams(teams: MinistryTeam[], refs?: string | string[]): MinistryTeam[] {
    if (!teams || teams.length === 0 || !refs) return [];
    const refList = (Array.isArray(refs) ? refs : [refs])
      .map(r => (r || '').trim())
      .filter(Boolean);
    if (refList.length === 0) return [];

    const matchedIds = new Set<string>();
    for (const rawRef of refList) {
      const refLower = rawRef.toLowerCase();
      const tokens = refLower
        .split(/\s*(?:&|,|\+|\/|\band\b)\s*/i)
        .map(t => t.trim().replace(/\s+team$/i, '').trim())
        .filter(t => t.length >= 3);

      for (const team of teams) {
        if (!team?.id) continue;
        if (team.id === rawRef) {
          matchedIds.add(team.id);
          continue;
        }
        const tNameLower = (team.name || '').toLowerCase().trim();
        if (!tNameLower) continue;
        if (tNameLower === refLower) {
          matchedIds.add(team.id);
          continue;
        }
        const tBase = tNameLower.replace(/\s+team$/i, '').trim();
        if (tBase.length >= 3 && tokens.some(tok => tok === tBase || tok === tNameLower)) {
          matchedIds.add(team.id);
        }
      }
    }

    return teams.filter(t => matchedIds.has(t.id));
  }

  /**
   * Intelligent candidate recommendation engine for a specific role
   */
  async getEligibleCandidatesForRole(
    churchId: string,
    serviceDate: string,
    params: {
      teamId?: string;
      teamIds?: string[];
      requiredSkill?: string;
      roleTitle?: string;
    }
  ): Promise<Array<{
    memberId: string;
    memberName: string;
    memberPhone?: string;
    matchScore: number;
    matchReasons: string[];
    isAvailable: boolean;
    availabilityReason?: string;
  }>> {
    if (!churchId?.trim()) return [];
    try {
      const targetChurch = churchId.trim();
      // 1. Fetch church members
      const membersSnap = await firestore()
        .collection(CHURCHES_COLLECTION)
        .doc(targetChurch)
        .collection('members')
        .get();

      const members = membersSnap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => m.status !== 'Left');

      // 2. Resolve single or multiple ministry teams by ID, name, or composite label
      const teamMemberIds = new Set<string>();
      const memberTeamNames = new Map<string, string[]>();
      const requestedTeamRefs = Array.from(
        new Set(
          [...(params.teamIds || []), ...(params.teamId ? [params.teamId] : [])]
            .map(r => (r || '').trim())
            .filter(Boolean)
        )
      );
      if (requestedTeamRefs.length > 0) {
        const allTeams = await this.getMinistryTeams(targetChurch);
        const matchedTeams = this.resolveMatchingTeams(allTeams, requestedTeamRefs);
        for (const tData of matchedTeams) {
          const teamPeople = Array.from(
            new Set([...(tData.memberIds || []), ...(tData.leaderId ? [tData.leaderId] : [])].filter(Boolean))
          );
          for (const id of teamPeople) {
            teamMemberIds.add(id);
            const names = memberTeamNames.get(id) || [];
            if (tData.name && !names.includes(tData.name)) {
              names.push(tData.name);
              memberTeamNames.set(id, names);
            }
          }
        }
      }

      // 3. Fetch verified skills
      const verifiedSkills = await this.getMemberSkills(targetChurch, undefined, 'verified');
      const skillMap = new Map<string, string[]>();
      verifiedSkills.forEach(s => {
        const list = skillMap.get(s.memberId) || [];
        list.push(s.skillName.toLowerCase());
        skillMap.set(s.memberId, list);
      });

      // 4. Score each member
      const results: Array<{
        memberId: string;
        memberName: string;
        memberPhone?: string;
        matchScore: number;
        matchReasons: string[];
        isAvailable: boolean;
        availabilityReason?: string;
      }> = [];

      const targetSkill = (params.requiredSkill || params.roleTitle || '').toLowerCase().trim();

      const checkMatch = (candidate: string) => {
        if (!candidate || !targetSkill) return false;
        const c = candidate.toLowerCase().trim();
        return c.includes(targetSkill) || targetSkill.includes(c);
      };

      for (const m of members) {
        let score = 10;
        const reasons: string[] = [];

        // Check team membership (single or multiple teams, deduplicated)
        if (requestedTeamRefs.length > 0 && teamMemberIds.has(m.id)) {
          score += 50;
          const tNames = memberTeamNames.get(m.id) || [];
          reasons.push(tNames.length > 0 ? `Team: ${tNames.join(' · ')}` : 'Team Member');
        }

        // Check verified skills
        const mSkills = skillMap.get(m.id) || [];
        const hasVerified = Boolean(targetSkill && mSkills.some(s => checkMatch(s)));

        // Check primary skills
        const pSkills = [
          ...(typeof m.primarySkill === 'string' ? m.primarySkill.split(',') : []),
          ...(Array.isArray(m.primarySkills) ? m.primarySkills : [])
        ].map(s => s.trim());
        const hasPrimary = pSkills.some(s => checkMatch(s));

        // Check secondary skills
        const sSkills = [
          ...(typeof m.secondarySkill === 'string' ? m.secondarySkill.split(',') : []),
          ...(Array.isArray(m.secondarySkills) ? m.secondarySkills : [])
        ].map(s => s.trim());
        const hasSecondary = sSkills.some(s => checkMatch(s));

        if (hasVerified) {
          score += 50;
          reasons.push('Verified Skill Match');
        }
        if (hasPrimary) {
          score += 30;
          reasons.push('Profile Primary Skill');
        } else if (hasSecondary) {
          score += 20;
          reasons.push('Profile Secondary Skill');
        }

        // Check availability blockouts
        const availCheck = await this.checkMemberAvailability(targetChurch, m.id, serviceDate);
        if (!availCheck.isAvailable) {
          score -= 100;
          reasons.push('Blocked Out');
        }

        const fullName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Church Member';
        const normName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
        const existingIdx = results.findIndex(r =>
          r.memberId === m.id ||
          (normName && normName !== 'church member' && r.memberName.trim().toLowerCase().replace(/\s+/g, ' ') === normName)
        );

        if (existingIdx !== -1) {
          if (score > results[existingIdx].matchScore) {
            results[existingIdx] = {
              memberId: m.id,
              memberName: fullName,
              memberPhone: m.phone || results[existingIdx].memberPhone,
              matchScore: score,
              matchReasons: reasons,
              isAvailable: availCheck.isAvailable,
              availabilityReason: availCheck.reason
            };
          }
        } else {
          results.push({
            memberId: m.id,
            memberName: fullName,
            memberPhone: m.phone,
            matchScore: score,
            matchReasons: reasons,
            isAvailable: availCheck.isAvailable,
            availabilityReason: availCheck.reason
          });
        }
      }

      // Sort descending by score
      return results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (err) {
      console.error('[ServiceRosterService] getEligibleCandidatesForRole error:', err);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. REHEARSAL MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getServiceRehearsals(churchId: string, serviceId: string): Promise<ServiceRehearsal[]> {
    if (!churchId?.trim() || !serviceId) return [];
    try {
      const snap = await this.getRehearsalsCol(churchId, serviceId).orderBy('date', 'asc').get();
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ServiceRehearsal[];
    } catch (err) {
      console.error('[ServiceRosterService] getServiceRehearsals error:', err);
      return [];
    }
  }

  listenServiceRehearsals(
    churchId: string,
    serviceId: string,
    onUpdate: (rehearsals: ServiceRehearsal[]) => void
  ): () => void {
    if (!churchId?.trim() || !serviceId) return () => {};
    return this.getRehearsalsCol(churchId, serviceId).orderBy('date', 'asc').onSnapshot(
      (snap: any) => {
        const list = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ServiceRehearsal[];
        onUpdate(list);
      },
      (err: any) => console.error('[ServiceRosterService] listenServiceRehearsals error:', err)
    );
  }

  async createOrUpdateRehearsal(churchId: string, serviceId: string, rehearsal: Partial<ServiceRehearsal>): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getRehearsalsCol(targetChurch, serviceId);
    const docId = rehearsal.id || col.doc().id;
    await col.doc(docId).set(this.sanitizeForFirestore({
      ...rehearsal,
      id: docId,
      serviceId,
      churchId: targetChurch,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      ...(rehearsal.id ? {} : { createdAt: firestore.FieldValue.serverTimestamp() })
    }), { merge: true });
  }

  async deleteRehearsal(churchId: string, serviceId: string, rehearsalId: string): Promise<void> {
    await this.getRehearsalsCol(churchId, serviceId).doc(rehearsalId).delete();
  }

  async updateRehearsalAttendance(
    churchId: string,
    serviceId: string,
    rehearsalId: string,
    memberId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ): Promise<void> {
    await this.getRehearsalsCol(churchId, serviceId).doc(rehearsalId).update({
      [`attendance.${memberId}`]: status,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. VOLUNTEER ATTENDANCE
  // ─────────────────────────────────────────────────────────────────────────────

  async getVolunteerAttendance(churchId: string, serviceId: string): Promise<VolunteerAttendanceRecord[]> {
    if (!churchId?.trim() || !serviceId) return [];
    try {
      const snap = await this.getAttendanceCol(churchId, serviceId).get();
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as VolunteerAttendanceRecord[];
    } catch (err) {
      console.error('[ServiceRosterService] getVolunteerAttendance error:', err);
      return [];
    }
  }

  listenVolunteerAttendance(
    churchId: string,
    serviceId: string,
    onUpdate: (records: VolunteerAttendanceRecord[]) => void
  ): () => void {
    if (!churchId?.trim() || !serviceId) return () => {};
    return this.getAttendanceCol(churchId, serviceId).onSnapshot(
      (snap: any) => {
        const records = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as VolunteerAttendanceRecord[];
        onUpdate(records);
      },
      (err: any) => console.error('[ServiceRosterService] listenVolunteerAttendance error:', err)
    );
  }

  async markVolunteerAttendance(
    churchId: string,
    serviceId: string,
    record: Partial<VolunteerAttendanceRecord>
  ): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const docId = `${serviceId}_${record.memberId}_${record.roleId || 'role'}`;
    await this.getAttendanceCol(targetChurch, serviceId).doc(docId).set(this.sanitizeForFirestore({
      id: docId,
      serviceId,
      churchId: targetChurch,
      memberId: record.memberId,
      memberName: record.memberName || 'Volunteer',
      roleId: record.roleId || '',
      roleTitle: record.roleTitle || '',
      attendanceStatus: record.attendanceStatus || 'present',
      markedBy: record.markedBy || 'admin',
      markedByName: record.markedByName || 'Administrator',
      markedAt: firestore.FieldValue.serverTimestamp(),
      notes: record.notes || ''
    }), { merge: true });
  }

  async bulkMarkVolunteerAttendance(
    churchId: string,
    serviceId: string,
    records: Array<Partial<VolunteerAttendanceRecord>>
  ): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const batch = firestore().batch();
    const col = this.getAttendanceCol(targetChurch, serviceId);

    records.forEach(record => {
      const docId = `${serviceId}_${record.memberId}_${record.roleId || 'role'}`;
      const docRef = col.doc(docId);
      batch.set(docRef, this.sanitizeForFirestore({
        id: docId,
        serviceId,
        churchId: targetChurch,
        memberId: record.memberId,
        memberName: record.memberName || 'Volunteer',
        roleId: record.roleId || '',
        roleTitle: record.roleTitle || '',
        attendanceStatus: record.attendanceStatus || 'present',
        markedBy: record.markedBy || 'admin',
        markedByName: record.markedByName || 'Administrator',
        markedAt: firestore.FieldValue.serverTimestamp(),
        notes: record.notes || ''
      }), { merge: true });
    });

    await batch.commit();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. LIVE SERVICE EXECUTION STATE
  // ─────────────────────────────────────────────────────────────────────────────

  async updateLiveServiceState(churchId: string, serviceId: string, liveState: Partial<LiveServiceState>): Promise<void> {
    await this.getServicePlansCol(churchId).doc(serviceId).update(this.sanitizeForFirestore({
      liveState: {
        ...liveState,
        lastUpdated: firestore.FieldValue.serverTimestamp()
      },
      updatedAt: firestore.FieldValue.serverTimestamp()
    }));
  }

  listenLiveServiceState(
    churchId: string,
    serviceId: string,
    onUpdate: (liveState: LiveServiceState | undefined) => void
  ): () => void {
    if (!churchId?.trim() || !serviceId) return () => {};
    return this.getServicePlansCol(churchId).doc(serviceId).onSnapshot(
      (snap: any) => {
        if (!this.docExists(snap)) {
          onUpdate(undefined);
          return;
        }
        const plan = snap.data() as ServicePlan;
        onUpdate(plan.liveState);
      },
      (err: any) => console.error('[ServiceRosterService] listenLiveServiceState error:', err)
    );
  }

  /**
   * Real-time listener for the entire service plan document during Live Mode
   * (syncs runSheet, setlist, status, and liveState in real time)
   */
  listenLiveServicePlan(
    churchId: string,
    serviceId: string,
    onUpdate: (plan: ServicePlan | null) => void
  ): () => void {
    if (!churchId?.trim() || !serviceId) return () => {};
    return this.getServicePlansCol(churchId).doc(serviceId).onSnapshot(
      (snap: any) => {
        if (!this.docExists(snap)) {
          onUpdate(null);
          return;
        }
        onUpdate({ id: snap.id, ...snap.data() } as ServicePlan);
      },
      (err: any) => console.error('[ServiceRosterService] listenLiveServicePlan error:', err)
    );
  }

  /**
   * Start Live Service execution
   */
  async startLiveService(churchId: string, serviceId: string): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    const snap = await planRef.get();
    if (!this.docExists(snap)) throw new Error('Service plan not found');
    const plan = snap.data() as ServicePlan;

    const firstItem = (plan.runSheet || [])[0];
    const initialLiveState: LiveServiceState = {
      isLive: true,
      currentActivityIndex: 0,
      currentActivityId: firstItem ? firstItem.id : undefined,
      status: 'running',
      actualStartedAt: firestore.FieldValue.serverTimestamp(),
      itemStartedAt: firestore.FieldValue.serverTimestamp(),
      elapsedSeconds: 0,
      activeCue: null,
      lastUpdated: firestore.FieldValue.serverTimestamp()
    };

    // Mark first item as in_progress
    const updatedRunSheet = (plan.runSheet || []).map((item, idx) => ({
      ...item,
      completionStatus: idx === 0 ? ('in_progress' as const) : ('pending' as const)
    }));

    await planRef.update(this.sanitizeForFirestore({
      status: 'live',
      liveState: initialLiveState,
      runSheet: updatedRunSheet,
      updatedAt: firestore.FieldValue.serverTimestamp()
    }));
  }

  /**
   * Advance or jump to a specific activity index in runSheet
   */
  async advanceLiveActivity(
    churchId: string,
    serviceId: string,
    targetIndex: number,
    markPreviousCompleted: boolean = true
  ): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    const snap = await planRef.get();
    if (!this.docExists(snap)) throw new Error('Service plan not found');
    const plan = snap.data() as ServicePlan;
    const runSheet = plan.runSheet || [];

    if (targetIndex < 0 || targetIndex >= runSheet.length) return;

    const targetItem = runSheet[targetIndex];

    const updatedRunSheet = runSheet.map((item, idx) => {
      if (idx === targetIndex) {
        return { ...item, completionStatus: 'in_progress' as const };
      }
      if (markPreviousCompleted && idx < targetIndex) {
        return { ...item, completionStatus: 'completed' as const };
      }
      return item;
    });

    await planRef.update({
      runSheet: updatedRunSheet,
      'liveState.currentActivityIndex': targetIndex,
      'liveState.currentActivityId': targetItem.id,
      'liveState.status': 'running',
      'liveState.itemStartedAt': firestore.FieldValue.serverTimestamp(),
      'liveState.lastUpdated': firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Pause or Resume the live service countdown timer
   */
  async setLiveTimerPaused(churchId: string, serviceId: string, pause: boolean): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    await planRef.update({
      'liveState.status': pause ? 'paused' : 'running',
      ...(pause
        ? { 'liveState.itemPausedAt': firestore.FieldValue.serverTimestamp() }
        : { 'liveState.itemPausedAt': null }
      ),
      'liveState.lastUpdated': firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Broadcast an instant stage cue from Tech Booth to stage confidence monitor
   */
  async sendStageCue(
    churchId: string,
    serviceId: string,
    message: string,
    sentBy: string = 'Tech Booth'
  ): Promise<void> {
    const cue: StageCue = {
      id: `cue_${Date.now()}`,
      message: message.trim(),
      sentAt: new Date().toISOString(),
      sentBy,
      acknowledged: false
    };

    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    await planRef.update({
      'liveState.activeCue': cue,
      'liveState.cueHistory': firestore.FieldValue.arrayUnion(cue),
      'liveState.lastUpdated': firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Dismiss or acknowledge active stage cue
   */
  async dismissStageCue(churchId: string, serviceId: string): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    await planRef.update({
      'liveState.activeCue': null,
      'liveState.lastUpdated': firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Conclude the live service
   */
  async endLiveService(churchId: string, serviceId: string): Promise<void> {
    const planRef = this.getServicePlansCol(churchId).doc(serviceId);
    const snap = await planRef.get();
    if (!this.docExists(snap)) return;
    const plan = snap.data() as ServicePlan;

    // Mark all remaining pending/in_progress items as completed
    const updatedRunSheet = (plan.runSheet || []).map(item => ({
      ...item,
      completionStatus: item.completionStatus === 'skipped' ? 'skipped' : ('completed' as const)
    }));

    await planRef.update({
      status: 'completed',
      runSheet: updatedRunSheet,
      'liveState.isLive': false,
      'liveState.status': 'ended',
      'liveState.actualEndedAt': firestore.FieldValue.serverTimestamp(),
      'liveState.activeCue': null,
      'liveState.lastUpdated': firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. MEMBER SERVICE EXPERIENCE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all upcoming service duties and invitations for a specific church member.
   * Scans published plans, runsheet assignments, setlist assignments, sequential queues, and rehearsals.
   */
  async getMemberUpcomingDuties(churchId: string, memberId: string, memberName?: string): Promise<MemberServiceDuty[]> {
    if (!churchId?.trim() || (!memberId && !memberName)) return [];
    try {
      const today = new Date().toISOString().split('T')[0];
      const plansSnap = await this.getServicePlansCol(churchId).get();

      const plans = plansSnap.docs
        .map((pDoc: any) => ({ id: pDoc.id, ...pDoc.data() } as ServicePlan))
        .filter(plan => (plan.status === 'published' || plan.status === 'live') && (plan.date >= today))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      const duties: MemberServiceDuty[] = [];

      for (const plan of plans) {
        const planStartTime = plan.startTime || '10:00';
        const defaultCallTime = this.addMinutesToTime(planStartTime, -45); // 45m before service

        // Fetch rehearsals for this service
        let rehearsals: ServiceRehearsal[] = [];
        try {
          const rSnap = await this.getRehearsalsCol(churchId, plan.id).get();
          rehearsals = rSnap.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() }))
            .filter((r: ServiceRehearsal) => (r.participantMemberIds || []).includes(memberId));
        } catch (_) {}

        // 1. Check direct runSheet assignments
        (plan.runSheet || []).forEach(item => {
          const isAssigned = item.responsibleMemberId === memberId ||
            (memberName && item.responsiblePerson && item.responsiblePerson.toLowerCase().trim() === memberName.toLowerCase().trim());
          if (isAssigned) {
            duties.push({
              id: `${plan.id}_${item.id}`,
              serviceId: plan.id,
              serviceTitle: plan.serviceTitle,
              serviceType: plan.serviceType,
              date: plan.date,
              startTime: plan.startTime,
              endTime: plan.endTime,
              location: plan.location,
              preacher: plan.preacher,
              roleId: item.id,
              roleTitle: item.program,
              activityName: item.program,
              callTime: defaultCallTime,
              status: (item.assignmentStatus === 'confirmed' || item.assignmentStatus === 'pending')
                ? item.assignmentStatus
                : 'confirmed',
              instructions: item.instructions || item.description,
              rehearsals,
              setlist: plan.setlist || []
            });
          }
        });

        // 2. Check Setlist assignments (Song leader or Musician)
        (plan.setlist || []).forEach(song => {
          const isSongLead = song.ledByMemberId === memberId ||
            (memberName && song.ledBy && song.ledBy.toLowerCase().trim() === memberName.toLowerCase().trim());
          if (isSongLead) {
            duties.push({
              id: `${plan.id}_setlist_lead_${song.id}`,
              serviceId: plan.id,
              serviceTitle: plan.serviceTitle,
              serviceType: plan.serviceType,
              date: plan.date,
              startTime: plan.startTime,
              endTime: plan.endTime,
              location: plan.location,
              preacher: plan.preacher,
              roleId: `song_lead_${song.id}`,
              roleTitle: `Worship Leader: ${song.title}`,
              activityName: `Praise & Worship (Key ${song.key || 'G'})`,
              callTime: defaultCallTime,
              status: 'confirmed',
              instructions: song.rehearsalNotes,
              rehearsals,
              setlist: plan.setlist || []
            });
          }
          if (song.musicianAssignments) {
            Object.entries(song.musicianAssignments).forEach(([roleKey, mus]) => {
              const musName = mus.memberName || (mus as any).name;
              const isMusician = mus.memberId === memberId ||
                (memberName && musName && musName.toLowerCase().trim() === memberName.toLowerCase().trim());
              if (isMusician) {
                duties.push({
                  id: `${plan.id}_setlist_mus_${song.id}_${roleKey}`,
                  serviceId: plan.id,
                  serviceTitle: plan.serviceTitle,
                  serviceType: plan.serviceType,
                  date: plan.date,
                  startTime: plan.startTime,
                  endTime: plan.endTime,
                  location: plan.location,
                  preacher: plan.preacher,
                  roleId: roleKey,
                  roleTitle: `${roleKey.toUpperCase()}: ${song.title}`,
                  activityName: 'Band / Worship Setlist',
                  callTime: defaultCallTime,
                  status: 'confirmed',
                  instructions: song.rehearsalNotes,
                  rehearsals,
                  setlist: plan.setlist || []
                });
              }
            });
          }
        });

        // 2b. Check Whole-Service Band & General Assignments (plan.assignmentMemberIds & plan.assignments)
        const bandRoleTitles: Record<string, string> = {
          role_keyboard: 'Keyboardist / Pianist',
          role_drums: 'Drummer / Percussionist',
          role_bass: 'Bass Guitarist',
          role_acoustic: 'Acoustic Guitarist',
          role_electric: 'Electric Guitarist',
          role_sound: 'Sound & Audio Engineer',
          role_media: 'Media & Projector',
          role_livestream: 'Livestream Operator',
          role_preacher: 'Preacher / Speaker',
          role_greeter: 'Main Door Greeter',
          role_usher: 'Sanctuary Usher',
          role_offering: 'Offering Coordinator',
          role_worship_leader: 'Worship Leader'
        };

        const resolveRoleTitle = (rId: string): string => {
          if (bandRoleTitles[rId]) return bandRoleTitles[rId];
          const cleanId = rId.replace(/^(role_)?(act_)+/, '');
          const found = (plan.runSheet || []).find(it =>
            it.id === rId ||
            it.id === `act_${cleanId}` ||
            it.id.replace(/^(act_)+/, '') === cleanId
          );
          if (found?.program && found.program.trim()) return found.program;
          if (rId.includes('act_')) return 'Order of Service Responsibility';
          return rId.replace(/^role_/, '').replace(/_/g, ' ').toUpperCase();
        };

        if (plan.assignmentMemberIds) {
          for (const [rId, mId] of Object.entries(plan.assignmentMemberIds)) {
            const isAssignedBand = mId === memberId ||
              (memberName && plan.assignments?.[rId] && plan.assignments[rId].toLowerCase().trim() === memberName.toLowerCase().trim());
            if (isAssignedBand && !duties.some(d => d.roleId === rId && d.serviceId === plan.id)) {
              const rTitle = resolveRoleTitle(rId);
              duties.push({
                id: `${plan.id}_${rId}_band`,
                serviceId: plan.id,
                serviceTitle: plan.serviceTitle,
                serviceType: plan.serviceType,
                date: plan.date,
                startTime: plan.startTime,
                endTime: plan.endTime,
                location: plan.location,
                preacher: plan.preacher,
                roleId: rId,
                roleTitle: rTitle,
                activityName: rTitle,
                callTime: defaultCallTime,
                status: (plan.assignmentStatus?.[rId] === 'pending') ? 'pending' : 'confirmed',
                rehearsals,
                setlist: plan.setlist || []
              });
            }
          }
        }

        if (plan.assignments && memberName) {
          for (const [rId, name] of Object.entries(plan.assignments)) {
            if (name && name.toLowerCase().trim() === memberName.toLowerCase().trim() && !duties.some(d => d.roleId === rId && d.serviceId === plan.id)) {
              const rTitle = resolveRoleTitle(rId);
              duties.push({
                id: `${plan.id}_${rId}_band_name`,
                serviceId: plan.id,
                serviceTitle: plan.serviceTitle,
                serviceType: plan.serviceType,
                date: plan.date,
                startTime: plan.startTime,
                endTime: plan.endTime,
                location: plan.location,
                preacher: plan.preacher,
                roleId: rId,
                roleTitle: rTitle,
                activityName: rTitle,
                callTime: defaultCallTime,
                status: (plan.assignmentStatus?.[rId] === 'pending') ? 'pending' : 'confirmed',
                rehearsals,
                setlist: plan.setlist || []
              });
            }
          }
        }

        // 3. Check sequential & FCFS assignment queues (Pending invitations or Confirmed)
        try {
          const queuesSnap = await this.getAssignmentQueuesCol(churchId, plan.id).get();
          for (const qDoc of queuesSnap.docs) {
            const queue = qDoc.data() as ServiceAssignmentQueue;
            const candidates = queue.candidates || [];
            const curIdx = queue.currentCandidateIndex ?? 0;
            const activeCand = candidates[curIdx];

            let qRoleTitle = queue.roleTitle || '';
            if (!qRoleTitle || qRoleTitle.toLowerCase().includes('act_') || qRoleTitle.toLowerCase().startsWith('act act')) {
              qRoleTitle = resolveRoleTitle(queue.roleId);
            }

            // 3a. Check First-Come, First-Served broadcast queues
            const isFCFS = (queue as any).mode === 'first_come_first_served';
            if (isFCFS) {
              const eligibleIds = (queue as any).eligibleMemberIds || [];
              const declinedIds = (queue as any).declinedMemberIds || [];
              const isEligible = eligibleIds.includes(memberId) || candidates.some(c => c.candidateId === memberId);
              const isDeclined = declinedIds.includes(memberId) || candidates.some(c => c.candidateId === memberId && c.status === 'declined');

              if (queue.status === 'confirmed') {
                if (queue.confirmedCandidateId === memberId) {
                  if (!duties.some(d => d.roleId === queue.roleId && d.serviceId === plan.id)) {
                    duties.push({
                      id: `${plan.id}_${queue.roleId}_confirmed`,
                      serviceId: plan.id,
                      serviceTitle: plan.serviceTitle,
                      serviceType: plan.serviceType,
                      date: plan.date,
                      startTime: plan.startTime,
                      endTime: plan.endTime,
                      location: plan.location,
                      preacher: plan.preacher,
                      roleId: queue.roleId,
                      roleTitle: qRoleTitle,
                      activityName: queue.activityName || qRoleTitle,
                      callTime: defaultCallTime,
                      status: 'confirmed',
                      rehearsals,
                      setlist: plan.setlist || []
                    });
                  }
                }
              } else if (queue.status === 'pending' && isEligible && !isDeclined) {
                if (!duties.some(d => d.roleId === queue.roleId && d.serviceId === plan.id)) {
                  duties.push({
                    id: `${plan.id}_${queue.roleId}_fcfs_pending`,
                    serviceId: plan.id,
                    serviceTitle: plan.serviceTitle,
                    serviceType: plan.serviceType,
                    date: plan.date,
                    startTime: plan.startTime,
                    endTime: plan.endTime,
                    location: plan.location,
                    preacher: plan.preacher,
                    roleId: queue.roleId,
                    roleTitle: qRoleTitle,
                    activityName: queue.activityName || qRoleTitle,
                    callTime: defaultCallTime,
                    status: 'pending',
                    deadline: (queue as any).deadline,
                    queueId: queue.id,
                    candidateIndex: 0,
                    instructions: 'First-come, first-served open slot. First member to accept gets booked!',
                    rehearsals,
                    setlist: plan.setlist || []
                  });
                }
              }
              continue;
            }

            // 3b. If this member is the current active candidate and status is pending -> INVITATION!
            if (activeCand && activeCand.candidateId === memberId && activeCand.status === 'pending' && queue.status === 'pending') {
              if (!duties.some(d => d.roleId === queue.roleId && d.serviceId === plan.id)) {
                duties.push({
                  id: `${plan.id}_${queue.roleId}_invite`,
                  serviceId: plan.id,
                  serviceTitle: plan.serviceTitle,
                  serviceType: plan.serviceType,
                  date: plan.date,
                  startTime: plan.startTime,
                  endTime: plan.endTime,
                  location: plan.location,
                  preacher: plan.preacher,
                  roleId: queue.roleId,
                  roleTitle: qRoleTitle,
                  activityName: queue.activityName || qRoleTitle,
                  callTime: defaultCallTime,
                  status: 'pending',
                  deadline: activeCand.deadline,
                  queueId: queue.id,
                  candidateIndex: curIdx,
                  rehearsals,
                  setlist: plan.setlist || []
                });
              }
            } else if (queue.confirmedCandidateId === memberId && queue.status === 'confirmed') {
              if (!duties.some(d => d.roleId === queue.roleId && d.serviceId === plan.id)) {
                duties.push({
                  id: `${plan.id}_${queue.roleId}_confirmed`,
                  serviceId: plan.id,
                  serviceTitle: plan.serviceTitle,
                  serviceType: plan.serviceType,
                  date: plan.date,
                  startTime: plan.startTime,
                  endTime: plan.endTime,
                  location: plan.location,
                  preacher: plan.preacher,
                  roleId: queue.roleId,
                  roleTitle: qRoleTitle,
                  activityName: queue.activityName || qRoleTitle,
                  callTime: defaultCallTime,
                  status: 'confirmed',
                  rehearsals,
                  setlist: plan.setlist || []
                });
              }
            }
          }
        } catch (_) {}
      }

      return duties.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return a.date.localeCompare(b.date);
      });
    } catch (err) {
      console.error('[ServiceRosterService] getMemberUpcomingDuties error:', err);
      return [];
    }
  }

  /**
   * Real-time listener for member upcoming duties
   */
  listenMemberUpcomingDuties(
    churchId: string,
    memberId: string,
    onUpdate: (duties: MemberServiceDuty[]) => void,
    memberName?: string
  ): () => void {
    if (!churchId?.trim() || !memberId) return () => {};

    return this.getServicePlansCol(churchId).onSnapshot(
      async () => {
        const duties = await this.getMemberUpcomingDuties(churchId, memberId, memberName);
        onUpdate(duties);
      },
      (err: any) => console.error('[ServiceRosterService] listenMemberUpcomingDuties error:', err)
    );
  }

  /**
   * Add a blockout date for member availability
   */
  async addMemberBlockoutDate(
    churchId: string,
    memberId: string,
    memberName: string,
    date: string,
    reason?: string
  ): Promise<void> {
    const targetChurch = this.requireChurchId(churchId);
    const col = this.getMemberAvailabilityCol(targetChurch);
    const existingSnap = await col.where('memberId', '==', memberId).limit(1).get();

    const blockout = {
      date,
      reason: reason || 'Personal blockout'
    };

    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0];
      await col.doc(doc.id).update({
        blockouts: firestore.FieldValue.arrayUnion(blockout),
        unavailableDates: firestore.FieldValue.arrayUnion(date),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } else {
      await col.add({
        memberId,
        memberName,
        churchId: targetChurch,
        monthYear: date.substring(0, 7),
        unavailableDates: [date],
        blockouts: [blockout],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    }
  }

  /**
   * Remove a blockout date for member availability
   */
  async removeMemberBlockoutDate(
    churchId: string,
    memberId: string,
    date: string
  ): Promise<void> {
    if (!churchId?.trim() || !memberId) return;
    const col = this.getMemberAvailabilityCol(churchId);
    const existingSnap = await col.where('memberId', '==', memberId).limit(1).get();
    if (existingSnap.empty) return;

    const doc = existingSnap.docs[0];
    const data = doc.data() as MemberAvailabilityRecord;
    const remaining = (data.blockouts || []).filter(b => b.date !== date);
    const remainingDates = (data.unavailableDates || []).filter(d => d !== date);

    await col.doc(doc.id).update({
      blockouts: remaining,
      unavailableDates: remainingDates,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. PDF RUN-SHEET, CSV EXPORT & ROSTER ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generates clean, high-fidelity print-ready HTML for Order of Worship Run-Sheet
   */
  generateRunSheetHtml(plan: ServicePlan, churchName?: string): string {
    const resolvedChurchName = churchName || plan.churchName || 'Church Sanctuary';
    const formattedDate = formatDateMonthYear(plan.date) || 'Worship Service';
    const formattedStartTime = formatTimeTo12Hour(plan.startTime);
    const formattedEndTime = formatTimeTo12Hour(plan.endTime);
    const runSheetItems = plan.runSheet || [];
    const setlistItems = plan.setlist || [];

    // Parse assignments
    const assignmentsList: Array<{ roleTitle: string; memberName: string }> = [];
    if (plan.assignments) {
      Object.entries(plan.assignments).forEach(([roleId, memberName]) => {
        if (memberName && memberName.trim()) {
          const roleTitle = roleId.replace('role_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          assignmentsList.push({ roleTitle, memberName });
        }
      });
    }

    const runSheetRows = runSheetItems.map(item => `
      <tr>
        <td style="text-align: center; font-weight: 700; width: 32px; color: #64748B;">${item.order || '-'}</td>
        <td style="white-space: nowrap; font-weight: 700; width: 130px; color: #0F172A; font-variant-numeric: tabular-nums;">
          ${formatTimeTo12Hour(item.startTime)} - ${formatTimeTo12Hour(item.endTime)}
        </td>
        <td>
          <div style="font-weight: 700; font-size: 13px; color: #0F172A;">${item.program}</div>
          ${item.instructions ? `<div style="font-size: 10.5px; color: #64748B; margin-top: 2px; font-style: italic;">• ${item.instructions}</div>` : ''}
        </td>
        <td style="width: 105px;">
          <span class="cat-badge">${item.category?.replace(/_/g, ' ') || '-'}</span>
        </td>
        <td style="text-align: center; font-weight: 700; width: 45px; color: #475569;">${item.durationMinutes}m</td>
        <td style="font-weight: 700; color: #1a2d5a; width: 160px;">
          ${item.responsiblePerson || '<span style="color:#94A3B8; font-weight: normal;">Unassigned</span>'}
        </td>
        <td style="font-size: 11px; color: #475569; width: 110px;">${item.supportingTeam || '-'}</td>
      </tr>
    `).join('');

    const setlistRows = setlistItems.map((s, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700; width: 32px; color: #64748B;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; font-size: 13px; color: #0F172A;">${s.title}</div>
          ${s.titleTe ? `<div style="font-size: 11px; color: #B45309; margin-top: 1px;">${s.titleTe}</div>` : ''}
        </td>
        <td style="text-align: center; width: 65px;">
          <span class="key-badge">Key ${s.key || 'G'}</span>
        </td>
        <td style="text-align: center; font-weight: 700; width: 65px; color: #475569;">${s.tempo ? `${s.tempo} BPM` : '120'}</td>
        <td style="text-align: center; width: 50px; color: #475569;">${s.timeSignature || '4/4'}</td>
        <td style="font-weight: 700; color: #1a2d5a; width: 140px;">${s.ledBy || 'Worship Leader'}</td>
        <td style="font-size: 10.5px; color: #64748B;">${s.rehearsalNotes || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${plan.serviceTitle} - Service Run-Sheet</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 0;
            font-size: 11.5px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2.5px solid #1a2d5a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .church-name {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #1a2d5a;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .doc-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #c0392b;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }
          .service-meta-grid {
            display: flex;
            justify-content: space-between;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            font-size: 11px;
            gap: 16px;
          }
          .meta-col {
            flex: 1;
            min-width: 0;
          }
          .meta-item {
            margin: 3px 0;
          }
          .meta-label {
            font-weight: 700;
            color: #64748B;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          .meta-val {
            font-weight: 800;
            color: #0F172A;
          }
          .section-heading {
            font-size: 11px;
            font-weight: 800;
            color: #1a2d5a;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-left: 3.5px solid #c0392b;
            padding-left: 8px;
            margin: 14px 0 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 11px;
            page-break-inside: auto;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
          th {
            background: #1a2d5a;
            color: #FFFFFF;
            font-weight: 800;
            text-align: left;
            padding: 7px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #E2E8F0;
            vertical-align: middle;
          }
          tr:nth-child(even) td {
            background-color: #F8FAFC;
          }
          .cat-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            background: #F1F5F9;
            color: #475569;
            border: 1px solid #E2E8F0;
            white-space: nowrap;
          }
          .key-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            background: #EFF6FF;
            color: #1a2d5a;
            border: 1px solid #BFDBFE;
          }
          .assignments-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
          }
          .assignment-item {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 6px 10px;
            min-width: 130px;
            flex: 1;
          }
          .assignment-role {
            font-size: 9.5px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .assignment-name {
            font-size: 11.5px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 1px;
          }
          .notes-box {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 6px;
            padding: 9px 12px;
            margin-top: 10px;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #94A3B8;
            margin-top: 16px;
            border-top: 1px solid #E2E8F0;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="church-name">${resolvedChurchName}</div>
          <div class="doc-title">ORDER OF WORSHIP & SERVICE RUN-SHEET</div>
        </div>

        <div class="service-meta-grid">
          <div class="meta-col">
            <div class="meta-item"><span class="meta-label">SERVICE:</span> <span class="meta-val">${plan.serviceTitle}</span></div>
            <div class="meta-item"><span class="meta-label">DATE & TIME:</span> <span class="meta-val">${formattedDate} · ${formattedStartTime} - ${formattedEndTime} (${plan.totalDurationMinutes || 120}m)</span></div>
            <div class="meta-item"><span class="meta-label">LOCATION:</span> <span class="meta-val">${plan.location || 'Main Sanctuary'}</span></div>
          </div>
          <div class="meta-col">
            <div class="meta-item"><span class="meta-label">PREACHER:</span> <span class="meta-val">${plan.preacher || 'Pastor'}</span></div>
            ${plan.theme ? `<div class="meta-item"><span class="meta-label">THEME:</span> <span class="meta-val">"${plan.theme}"</span></div>` : ''}
            ${plan.bibleReference ? `<div class="meta-item"><span class="meta-label">SCRIPTURE:</span> <span class="meta-val">${plan.bibleReference}</span></div>` : ''}
          </div>
        </div>

        ${assignmentsList.length > 0 ? `
          <div class="section-heading">MINISTRY RESPONSIBILITIES</div>
          <div class="assignments-grid">
            ${assignmentsList.map(a => `
              <div class="assignment-item">
                <div class="assignment-role">${a.roleTitle}</div>
                <div class="assignment-name">${a.memberName}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section-heading">CHRONOLOGICAL RUN-SHEET TIMELINE (${runSheetItems.length} SEGMENTS)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="width: 130px;">Time</th>
              <th>Program / Segment</th>
              <th style="width: 105px;">Category</th>
              <th style="width: 45px; text-align: center;">Dur</th>
              <th style="width: 160px;">Assigned Minister</th>
              <th style="width: 110px;">Ministry Team</th>
            </tr>
          </thead>
          <tbody>
            ${runSheetRows || '<tr><td colspan="7" style="text-align: center; color: #94A3B8; padding: 14px;">No activities scheduled</td></tr>'}
          </tbody>
        </table>

        ${setlistItems.length > 0 ? `
          <div class="section-heading">WORSHIP SETLIST (${setlistItems.length} SONGS)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 32px; text-align: center;">#</th>
                <th>Song Title</th>
                <th style="text-align: center; width: 65px;">Key</th>
                <th style="text-align: center; width: 65px;">BPM</th>
                <th style="text-align: center; width: 50px;">Time</th>
                <th style="width: 140px;">Song Leader</th>
                <th>Musician / Audio Notes</th>
              </tr>
            </thead>
            <tbody>
              ${setlistRows}
            </tbody>
          </table>
        ` : ''}

        ${plan.additionalInstructions ? `
          <div class="notes-box">
            <strong style="color: #92400E; text-transform: uppercase; font-size: 10.5px;">Director & Sound Booth Notes:</strong><br/>
            <span style="color: #451A03; margin-top: 2px; display: inline-block;">${plan.additionalInstructions}</span>
          </div>
        ` : ''}

        <div class="footer">
          Generated by WeChristian Service Roster & Worship Operations · ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Export service plan to a print-ready PDF and open system share dialog
   */
  async exportServicePlanPdf(plan: ServicePlan, churchName?: string): Promise<string> {
    const html = this.generateRunSheetHtml(plan, churchName);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Run-Sheet PDF: ${plan.serviceTitle}`
      });
    }
    return uri;
  }

  /**
   * Direct Print dialog
   */
  async printServicePlanDirectly(plan: ServicePlan, churchName?: string): Promise<void> {
    const html = this.generateRunSheetHtml(plan, churchName);
    await Print.printAsync({ html });
  }

  /**
   * Generates structured CSV string for Order of Service and Worship Setlist
   */
  generateRunSheetCsv(plan: ServicePlan): string {
    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    const lines: string[] = [];

    // Header info
    lines.push(`Service Title,${escapeCsv(plan.serviceTitle)}`);
    lines.push(`Date,${escapeCsv(formatDateMonthYear(plan.date))}`);
    lines.push(`Scheduled Time,${escapeCsv(`${formatTimeTo12Hour(plan.startTime)} - ${formatTimeTo12Hour(plan.endTime)}`)}`);
    lines.push(`Location,${escapeCsv(plan.location)}`);
    lines.push(`Preacher,${escapeCsv(plan.preacher)}`);
    lines.push(`Theme,${escapeCsv(plan.theme)}`);
    lines.push(`Bible Reference,${escapeCsv(plan.bibleReference)}`);
    lines.push('');

    // Order of Service table
    lines.push('ORDER OF SERVICE');
    lines.push('Order,Start Time,End Time,Duration (Mins),Program,Category,Minister,Supporting Team,Instructions');

    (plan.runSheet || []).forEach(item => {
      lines.push([
        item.order || '',
        escapeCsv(item.startTime),
        escapeCsv(item.endTime),
        item.durationMinutes || 0,
        escapeCsv(item.program),
        escapeCsv(item.category),
        escapeCsv(item.responsiblePerson),
        escapeCsv(item.supportingTeam),
        escapeCsv(item.instructions)
      ].join(','));
    });

    // Setlist table if exists
    if (plan.setlist && plan.setlist.length > 0) {
      lines.push('');
      lines.push('WORSHIP SETLIST');
      lines.push('Index,Song Title,Telugu Title,Key,Tempo (BPM),Time Signature,Duration (Mins),Song Leader,Notes');
      plan.setlist.forEach((s, idx) => {
        lines.push([
          idx + 1,
          escapeCsv(s.title),
          escapeCsv(s.titleTe),
          escapeCsv(s.key),
          escapeCsv(s.tempo),
          escapeCsv(s.timeSignature),
          s.durationMinutes || 6,
          escapeCsv(s.ledBy),
          escapeCsv(s.rehearsalNotes)
        ].join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Export service plan to CSV and trigger native share sheet
   */
  async exportServicePlanCsv(plan: ServicePlan): Promise<string> {
    const csv = this.generateRunSheetCsv(plan);
    const cleanDate = (plan.date || 'service').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `RunSheet_${cleanDate}.csv`;
    const targetPath = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(targetPath, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetPath, {
        mimeType: 'text/csv',
        dialogTitle: `Export Run-Sheet CSV: ${plan.serviceTitle}`
      });
    }
    return targetPath;
  }

  /**
   * Intelligent Roster Analytics Engine:
   * Computes volunteer health / burnout risk, song usage distribution, and queue acceptance metrics.
   */
  async getRosterAnalytics(churchId: string): Promise<RosterAnalyticsData> {
    if (!churchId?.trim()) {
      return {
        totalServices: 0,
        completedServices: 0,
        averageTurnoutPercent: 0,
        totalVolunteerAssignments: 0,
        acceptanceRatePercent: 100,
        totalQueueInvites: 0,
        totalAccepted: 0,
        totalDeclined: 0,
        totalTimedOut: 0,
        volunteerServingCounts: [],
        topWorshipSongs: []
      };
    }
    try {
      const plansSnap = await this.getServicePlansCol(churchId).get();
      const allPlans = plansSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ServicePlan));

      const totalServices = allPlans.length;
      const completedServices = allPlans.filter(p => p.status === 'completed').length;

      // Volunteer Serving Frequency & Burnout Tracker
      const volunteerMap = new Map<string, { memberName: string; count: number; lastDate: string; roles: Set<string>; dates: string[] }>();
      const songUsageMap = new Map<string, { title: string; titleTe?: string; count: number; lastDate: string; key: string }>();

      let totalAssignments = 0;
      let totalAttendanceRecords = 0;
      let totalPresent = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split('T')[0];

      for (const plan of allPlans) {
        const pDate = plan.date || '';

        // Scan runsheet items
        (plan.runSheet || []).forEach(item => {
          if (item.responsibleMemberId) {
            totalAssignments++;
            const existing = volunteerMap.get(item.responsibleMemberId) || {
              memberName: item.responsiblePerson || 'Volunteer',
              count: 0,
              lastDate: '',
              roles: new Set<string>(),
              dates: []
            };
            existing.count++;
            existing.roles.add(item.program);
            existing.dates.push(pDate);
            if (!existing.lastDate || pDate > existing.lastDate) existing.lastDate = pDate;
            volunteerMap.set(item.responsibleMemberId, existing);
          }
        });

        // Scan setlist items
        (plan.setlist || []).forEach(song => {
          if (song.title) {
            const sKey = song.title.toLowerCase().trim();
            const existing = songUsageMap.get(sKey) || {
              title: song.title,
              titleTe: song.titleTe,
              count: 0,
              lastDate: '',
              key: song.key || 'G'
            };
            existing.count++;
            if (!existing.lastDate || pDate > existing.lastDate) existing.lastDate = pDate;
            songUsageMap.set(sKey, existing);
          }

          if (song.ledByMemberId) {
            totalAssignments++;
            const existing = volunteerMap.get(song.ledByMemberId) || {
              memberName: song.ledBy || 'Worship Leader',
              count: 0,
              lastDate: '',
              roles: new Set<string>(),
              dates: []
            };
            existing.count++;
            existing.roles.add('Worship Leader');
            existing.dates.push(pDate);
            if (!existing.lastDate || pDate > existing.lastDate) existing.lastDate = pDate;
            volunteerMap.set(song.ledByMemberId, existing);
          }
        });
      }

      // 2. Fetch queues for acceptance rate metrics
      let totalInvites = 0;
      let totalAccepted = 0;
      let totalDeclined = 0;
      let totalTimedOut = 0;

      for (const plan of allPlans.slice(0, 20)) {
        try {
          const qSnap = await this.getAssignmentQueuesCol(churchId, plan.id).get();
          qSnap.docs.forEach((qDoc: any) => {
            const queue = qDoc.data() as ServiceAssignmentQueue;
            (queue.candidates || []).forEach(c => {
              if (c.status !== 'waiting') totalInvites++;
              if (c.status === 'accepted') totalAccepted++;
              if (c.status === 'declined') totalDeclined++;
              if (c.status === 'timed_out') totalTimedOut++;
            });
          });

          const aSnap = await this.getAttendanceCol(churchId, plan.id).get();
          aSnap.docs.forEach((aDoc: any) => {
            const att = aDoc.data() as VolunteerAttendanceRecord;
            totalAttendanceRecords++;
            if (att.attendanceStatus === 'present' || att.attendanceStatus === 'late') {
              totalPresent++;
            }
          });
        } catch (_) {}
      }

      const acceptanceRatePercent = totalInvites > 0 ? Math.round((totalAccepted / totalInvites) * 100) : 100;
      const averageTurnoutPercent = totalAttendanceRecords > 0 ? Math.round((totalPresent / totalAttendanceRecords) * 100) : 92;

      // Compile Volunteer Serving Stats
      const volunteerServingCounts: VolunteerServingStat[] = Array.from(volunteerMap.entries())
        .map(([mId, data]) => {
          const recentServes = data.dates.filter(d => d >= thirtyDaysAgoIso).length;
          return {
            memberId: mId,
            memberName: data.memberName,
            servingCount: data.count,
            lastServedDate: data.lastDate,
            fatigueRisk: recentServes >= 3,
            rolesServed: Array.from(data.roles)
          };
        })
        .sort((a, b) => b.servingCount - a.servingCount);

      // Compile Top Worship Songs
      const topWorshipSongs: SongUsageStat[] = Array.from(songUsageMap.values())
        .map(s => ({
          title: s.title,
          titleTe: s.titleTe,
          count: s.count,
          lastSungDate: s.lastDate || 'N/A',
          key: s.key || 'Standard'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalServices,
        completedServices,
        averageTurnoutPercent,
        totalVolunteerAssignments: totalAssignments,
        acceptanceRatePercent,
        totalQueueInvites: totalInvites,
        totalAccepted,
        totalDeclined,
        totalTimedOut,
        volunteerServingCounts,
        topWorshipSongs
      };
    } catch (err) {
      console.error('[ServiceRosterService] getRosterAnalytics error:', err);
      return {
        totalServices: 0,
        completedServices: 0,
        averageTurnoutPercent: 0,
        totalVolunteerAssignments: 0,
        acceptanceRatePercent: 100,
        totalQueueInvites: 0,
        totalAccepted: 0,
        totalDeclined: 0,
        totalTimedOut: 0,
        volunteerServingCounts: [],
        topWorshipSongs: []
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. TIME & FORMATTING UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  timeStringToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim();
    const isPM = /pm/i.test(clean);
    const isAM = /am/i.test(clean);
    const numbersOnly = clean.replace(/[^\d:]/g, '');
    const parts = numbersOnly.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return (h % 24) * 60 + m;
  }

  minutesToTimeString(minutes: number): string {
    const totalMinutes = ((minutes % 1440) + 1440) % 1440;
    const rawH = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    const period = rawH >= 12 ? 'PM' : 'AM';
    const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  addMinutesToTime(timeStr: string, minutesToAdd: number): string {
    const total = this.timeStringToMinutes(timeStr) + minutesToAdd;
    return this.minutesToTimeString(total);
  }

  formatDateMonthYear(dateVal: any): string {
    return formatDateMonthYear(dateVal);
  }

  formatTimeTo12Hour(timeVal: any): string {
    return formatTimeTo12Hour(timeVal);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. CUSTOM ACTIVITY CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch church custom activity categories stored in Firestore (with AsyncStorage offline cache).
   */
  async getCustomActivityCategories(churchId: string): Promise<ActivityCategoryDef[]> {
    const targetChurch = (churchId || '').trim();
    if (!targetChurch) return [];
    const cacheKey = `@wechristian_activity_categories_${targetChurch}`;
    try {
      const snap = await this.getActivityCategoriesCol(targetChurch).get();
      const categories: ActivityCategoryDef[] = snap.docs
        .map((doc: any) => {
          const d = doc.data() || {};
          return {
            id: d.id || doc.id,
            label: d.label || doc.id.replace(/_/g, ' '),
            bg: d.bg || '#EDE9FE',
            text: d.text || '#5B21B6',
            isCustom: true,
          };
        })
        .sort((a: ActivityCategoryDef, b: ActivityCategoryDef) =>
          (a.label || '').localeCompare(b.label || '')
        );
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(categories));
      } catch (_) {}
      return categories;
    } catch (err) {
      console.error('[ServiceRosterService] getCustomActivityCategories error:', err);
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
      return [];
    }
  }

  /**
   * Create (or update) a church-scoped custom activity category for the Order Builder.
   */
  async addCustomActivityCategory(
    churchId: string,
    label: string,
    colorPreset?: { bg: string; text: string }
  ): Promise<ActivityCategoryDef> {
    const targetChurch = this.requireChurchId(churchId);
    const cleanLabel = (label || '').trim();
    if (!cleanLabel) {
      throw new Error('Please enter a category name.');
    }

    const slug = cleanLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const id = slug || `custom_${Date.now()}`;
    const chosenColor = colorPreset || CUSTOM_ACTIVITY_CATEGORY_PRESETS[0];

    const record: ActivityCategoryDef = {
      id,
      label: cleanLabel,
      bg: chosenColor.bg,
      text: chosenColor.text,
      isCustom: true,
    };

    await this.getActivityCategoriesCol(targetChurch).doc(id).set(
      this.sanitizeForFirestore({
        ...record,
        churchId: targetChurch,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }),
      { merge: true }
    );

    try {
      const cacheKey = `@wechristian_activity_categories_${targetChurch}`;
      const existing = await this.getCustomActivityCategories(targetChurch);
      const updated = [record, ...existing.filter(c => c.id !== id)];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (_) {}

    return record;
  }

  /**
   * Remove a custom activity category from the church list.
   */
  async deleteCustomActivityCategory(churchId: string, categoryId: string): Promise<void> {
    const targetChurch = (churchId || '').trim();
    if (!targetChurch || !categoryId) return;
    await this.getActivityCategoriesCol(targetChurch).doc(categoryId).delete();
    try {
      const cacheKey = `@wechristian_activity_categories_${targetChurch}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify(parsed.filter((c: ActivityCategoryDef) => c.id !== categoryId))
          );
        }
      }
    } catch (_) {}
  }
}

export default new ServiceRosterService();
