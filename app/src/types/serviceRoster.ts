/**
 * Complete Service Roster & Worship Operations Management System
 * Core TypeScript Definitions & Domain Models
 */

export type ServiceType = 
  | 'sunday_worship'
  | 'holy_communion'
  | 'bible_study'
  | 'fasting_prayer'
  | 'christmas_celebration'
  | 'easter_service'
  | 'special_meeting'
  | 'youth_service'
  | 'prayer_meeting'
  | 'other';

export type ServiceStatus = 
  | 'draft'
  | 'published'
  | 'live'
  | 'completed'
  | 'cancelled';

export type BuiltInActivityCategory = 
  | 'preparation'
  | 'starting_prayer'
  | 'opening_song'
  | 'worship_songs'
  | 'music'
  | 'bible_reading'
  | 'offering'
  | 'announcements'
  | 'sermon'
  | 'communion'
  | 'special_performance'
  | 'closing_prayer'
  | 'benediction'
  | 'break'
  | 'other';

export type ActivityCategory = BuiltInActivityCategory | (string & {});

export interface ActivityCategoryDef {
  id: string;
  label: string;
  bg: string;
  text: string;
  isCustom?: boolean;
}

export interface ActivityAttachment {
  name: string;
  url: string;
  type?: string; // e.g. 'pdf', 'audio', 'image', 'slides'
  sizeBytes?: number;
}

export interface RunSheetItem {
  id: string;
  order: number;
  program: string;
  category: ActivityCategory;
  description?: string;
  startTime: string;       // HH:mm (e.g. "10:00")
  durationMinutes: number; // e.g. 15
  endTime: string;         // HH:mm (e.g. "10:15")
  responsiblePerson?: string;
  responsibleMemberId?: string;
  supportingTeam?: string;
  supportingTeamId?: string;
  supportingTeamIds?: string[];
  instructions?: string;
  attachments?: ActivityAttachment[];
  assignmentStatus?: 'unassigned' | 'pending' | 'confirmed' | 'declined';
  completionStatus?: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface SetlistItem {
  id: string;
  songId?: string;          // Reference to worshipSongs or masterSongs doc id
  title: string;
  titleTe?: string;         // Telugu title
  titleEn?: string;
  artist?: string;
  key: string;              // e.g. "G", "C#m", "D"
  timeSignature: string;    // e.g. "4/4", "3/4", "6/8"
  tempo: string;            // BPM e.g. "72", "128"
  durationMinutes?: number; // e.g. 6
  ledBy: string;            // Song Leader name
  ledByMemberId?: string;   // Song Leader member UID
  singers?: string[];       // Vocalists
  musicianAssignments?: Record<string, { memberId?: string; memberName: string }>; // roleId -> musician
  rehearsalNotes?: string;
  lyricsTe?: string;        // Telugu lyrics for stage singing
  lyricsEn?: string;        // English / transliteration lyrics
  chordChartUrl?: string;
  isOffertory?: boolean;
  attachments?: ActivityAttachment[];
}

export interface ServiceRecurrenceRule {
  isRecurring: boolean;
  recurrenceType: 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  seriesId?: string;         // Shared ID across all generated occurrences in the series
  frequency?: number;        // e.g., every 1 week
  dayOfWeek?: number;        // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;          // YYYY-MM-DD
  occurrencesGenerated?: number;
}

export interface StageCue {
  id: string;
  message: string;
  sentAt: any;
  sentBy?: string;
  acknowledged?: boolean;
}

export interface LiveServiceState {
  isLive: boolean;
  currentActivityId?: string;
  currentActivityIndex: number;
  status: 'idle' | 'running' | 'paused' | 'ended';
  actualStartedAt?: any;
  actualEndedAt?: any;
  itemStartedAt?: any;
  itemPausedAt?: any;
  elapsedSeconds: number;
  itemElapsedSeconds?: number;
  stageNotes?: string;
  activeCue?: StageCue | null;
  cueHistory?: StageCue[];
  lastUpdated?: any;
}

export interface ServicePlan {
  id: string;
  churchId: string;
  churchName?: string;
  serviceTitle: string;
  serviceType: ServiceType;
  date: string;               // YYYY-MM-DD
  startTime: string;          // HH:mm (e.g. "10:30")
  endTime: string;            // HH:mm (e.g. "12:30")
  location: string;           // e.g. "Main Sanctuary"
  preacher: string;           // Speaker/Pastor
  theme?: string;             // Theme of the day e.g. "God's Grace"
  bibleReference?: string;    // Scripture reading e.g. "Romans 8:1"
  description?: string;
  additionalInstructions?: string;
  status: ServiceStatus;
  totalDurationMinutes: number;
  
  // Dynamic order of service (chronological timeline)
  runSheet: RunSheetItem[];

  // Worship setlist
  setlist: SetlistItem[];

  // Recurrence metadata
  recurrence?: ServiceRecurrenceRule;

  // Real-time live execution state
  liveState?: LiveServiceState;

  // Backward compatibility maps for legacy displays
  assignments?: Record<string, string>; // roleId -> assigned member name
  assignmentMemberIds?: Record<string, string>; // roleId -> member.id
  assignmentStatus?: Record<string, 'pending' | 'confirmed' | 'declined'>;
  assignmentDeclineReasons?: Record<string, string>;
  assignmentCallTimes?: Record<string, string>;
  assignmentNotes?: Record<string, string>;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServiceTemplate {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  defaultDurationMinutes: number;
  runSheetTemplate: Array<Omit<RunSheetItem, 'id'> & { id?: string }>;
  defaultResponsibilities?: string[];
  isBuiltIn?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface MinistryRole {
  id: string;
  title: string;
  category?: 'worship' | 'audio_visual' | 'hospitality' | 'ministry' | 'logistics';
  defaultSkillRequired?: string;
  placeholder?: string;
  isMulti?: boolean;
}

export interface MinistryTeam {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  color: string;
  leaderId?: string;
  leaderName?: string;
  leaderPhone?: string;
  memberIds: string[];
  positions: MinistryRole[];
  active: boolean;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface MemberSkillRecord {
  id: string;
  churchId: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  category: 'music' | 'worship' | 'technical' | 'church_ministry';
  skillName: string; // e.g. "Keyboard", "Vocals", "Sound Engineering"
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'lead';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  submittedByMember: boolean;
  verifiedBy?: string;
  verifiedAt?: any;
  rejectionReason?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface MemberAvailabilityRecord {
  id: string;
  churchId: string;
  memberId: string;
  memberName: string;
  monthYear: string; // YYYY-MM
  unavailableDates: string[]; // ['2026-11-08', '2026-11-15']
  blockouts?: Array<{ date: string; reason?: string }>;
  preferredServiceTimes?: string[]; // e.g. ['morning_only']
  maxServicesPerMonth?: number;
  notes?: string;
  updatedAt?: any;
}

export interface CandidateEntry {
  candidateId: string;
  candidateName: string;
  candidatePhone?: string;
  status: 'pending' | 'waiting' | 'accepted' | 'declined' | 'timed_out';
  requestedAt?: any;
  deadline?: any;
  respondedAt?: any;
  declineReason?: string;
  notificationId?: string;
}

export interface ServiceAssignmentQueue {
  id: string; // matches roleId
  serviceId: string;
  churchId: string;
  roleId: string;
  roleTitle: string;
  activityId?: string;
  activityName?: string;
  mode?: 'sequential' | 'first_come_first_served';
  status: 'draft' | 'pending' | 'confirmed' | 'exhausted' | 'manual_required' | 'cancelled';
  confirmedCandidateId?: string;
  confirmedCandidateName?: string;
  bookedAt?: string;
  deadline?: string;
  eligibleMemberIds?: string[];
  declinedMemberIds?: string[];
  currentCandidateIndex: number;
  timeoutMinutes: number; // e.g. 1440 (24 hours)
  candidates: CandidateEntry[];
  history: Array<{
    timestamp: any;
    action: string;
    candidateId?: string;
    candidateName?: string;
    details?: string;
  }>;
  createdAt?: any;
  updatedAt?: any;
}

export interface ServiceRehearsal {
  id: string;
  serviceId: string;
  churchId: string;
  rehearsalName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  assignedTeamIds: string[];
  participantMemberIds: string[];
  songPracticeIds: string[];
  instrumentAssignments?: Record<string, string>;
  notes?: string;
  attachments?: ActivityAttachment[];
  attendance?: Record<string, 'present' | 'absent' | 'late' | 'excused'>;
  createdAt?: any;
  updatedAt?: any;
}

export interface VolunteerAttendanceRecord {
  id: string; // composite key: serviceId_memberId_roleId
  serviceId: string;
  churchId: string;
  memberId: string;
  memberName: string;
  roleId: string;
  roleTitle: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  markedByName?: string;
  markedAt: any;
  notes?: string;
}

export interface MemberServiceDuty {
  id: string; // composite duty id: serviceId_roleId
  serviceId: string;
  serviceTitle: string;
  serviceType: ServiceType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  preacher: string;
  roleId: string;
  roleTitle: string;
  activityName?: string;
  callTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'confirmed';
  deadline?: any;
  queueId?: string;
  candidateIndex?: number;
  instructions?: string;
  rehearsals: ServiceRehearsal[];
  setlist: SetlistItem[];
}

export interface VolunteerServingStat {
  memberId: string;
  memberName: string;
  servingCount: number;
  lastServedDate?: string;
  fatigueRisk: boolean; // served 3+ times in past 30 days
  rolesServed: string[];
}

export interface SongUsageStat {
  songId?: string;
  title: string;
  titleTe?: string;
  count: number;
  lastSungDate: string;
  key: string;
}

export interface RosterAnalyticsData {
  totalServices: number;
  completedServices: number;
  averageTurnoutPercent: number;
  totalVolunteerAssignments: number;
  acceptanceRatePercent: number;
  totalQueueInvites: number;
  totalAccepted: number;
  totalDeclined: number;
  totalTimedOut: number;
  volunteerServingCounts: VolunteerServingStat[];
  topWorshipSongs: SongUsageStat[];
}
