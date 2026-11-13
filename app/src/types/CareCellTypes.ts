export type CareCellStatus = 'Active' | 'Inactive' | 'Archived';
export type MembershipStatus = 'Active' | 'Transferred' | 'Removed';
export type MeetingStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type MeetingType = 
  | 'Bible Study' 
  | 'Prayer Meeting' 
  | 'Fellowship' 
  | 'Worship' 
  | 'Special Meeting' 
  | 'Other';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type PrayerRequestPrivacy = 'Private' | 'Cell' | 'Public';
export type PrayerRequestStatus = 'New' | 'Praying' | 'Follow-up Required' | 'Answered' | 'Closed';
export type FollowupType = 
  | 'Phone Call' 
  | 'Home Visit' 
  | 'Personal Meeting' 
  | 'Prayer Visit' 
  | 'WhatsApp Message' 
  | 'Other';
export type FollowupStatus = 'Pending' | 'Contacted' | 'Completed' | 'Needs Further Follow-up';
export type VisitStatus =
  | 'Scheduled'
  | 'Awaiting Confirmation'
  | 'Confirmed'
  | 'Declined'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';
export type MemberVisitResponseStatus = 'Pending' | 'Accepted' | 'Declined';

export interface CareCellVisitMemberResponse {
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  response: MemberVisitResponseStatus;
  respondedAt?: any;
  notes?: string;
  preferredTime?: string; // Preferred visit time specified by the member (e.g. "5:00 PM - 7:00 PM")
}

export interface CareCellVisit {
  id: string;
  churchId?: string;
  cellId: string;
  cellCode?: string;
  cellName: string;
  title: string;
  purpose?: string;
  visitDate: string; // "YYYY-MM-DD"
  visitTime: string; // "HH:mm" e.g. "17:00"
  visitors: string;
  status: VisitStatus;
  notificationSent?: boolean;
  notificationSentAt?: any;
  createdBy: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
  totalMembersCount?: number;
  acceptedCount?: number;
  declinedCount?: number;
  pendingCount?: number;
  responses?: Record<string, CareCellVisitMemberResponse>;
  targetMemberIds?: string[];
  assignedLeaderId?: string;
  assignedLeaderName?: string;
  assignedAdminIds?: string[];
  routeStops?: VisitRoutePoint[];
  completedAt?: any;
  cancelledAt?: any;
}

export interface CareCell {
  id: string;
  cellCode: string; // e.g. "CareCell-001" or "Rhema_CareCell-001"
  name: string;
  description: string;
  location: string;
  leaderId: string;
  leaderName: string;
  leaderPhone: string;
  leaderPhoto?: string;
  assistantLeaderId?: string;
  assistantLeaderName?: string;
  assistantLeaderPhone?: string;
  assistantLeaderPhoto?: string;
  meetingDay: string; // e.g. "Friday"
  meetingTime: string; // e.g. '19:00'
  meetingEndTime?: string; // e.g. '20:30'
  meetingLocation: string;
  meetingLatitude?: number;
  meetingLongitude?: number;
  locality?: string;
  maximumMembers?: number; // Optional flexible cell size (no hard cap)
  status: CareCellStatus;
  churchId?: string;
  assignedAdminIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CareCellMembership {
  id: string;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  address?: string;
  locality?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  membershipStatus: MembershipStatus;
  preferredVisitTime?: string;
  joinedAt?: any;
  leftAt?: any;
  transferredToCellId?: string;
  transferredToCellName?: string;
  assignedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface VisitRoutePoint {
  memberId: string;
  memberName: string;
  memberPhone?: string;
  address?: string;
  locality?: string;
  latitude: number;
  longitude: number;
  order: number;
  accuracy?: LocationAccuracy;
  distanceFromPreviousKm?: number;
  isApproximateDistance?: boolean;
  consent?: boolean;
}

export interface CareCellMeeting {
  id: string;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  title: string;
  description: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  location: string;
  bibleBook?: string;
  bibleChapter?: number;
  bibleVerse?: string;
  scriptureTextEn?: string;
  scriptureTextTe?: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CareCellAttendance {
  id: string; // "${meetingId}_${memberId}"
  meetingId: string;
  cellId: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  attendanceStatus: AttendanceStatus;
  notes?: string;
  markedBy: string;
  markedAt: any;
  updatedAt?: any;
}

export interface CareCellPrayerRequest {
  id: string;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  title: string;
  description: string;
  privacy: PrayerRequestPrivacy;
  status: PrayerRequestStatus;
  pastoralResponse?: string;
  respondedBy?: string;
  respondedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface CareCellFollowup {
  id: string;
  cellId: string;
  cellCode?: string;
  cellName?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  assignedLeaderId: string;
  assignedLeaderName?: string;
  followupType: FollowupType;
  followupDate: string; // "YYYY-MM-DD"
  reason?: string;
  notes: string;
  nextFollowupDate?: string; // "YYYY-MM-DD"
  status: FollowupStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface CareCellAnnouncement {
  id: string;
  cellId: string; // 'ALL' for church-wide or specific cellId
  cellCode?: string;
  cellName?: string;
  title: string;
  message: string;
  createdBy: string;
  createdByName?: string;
  expiryDate?: string;
  status: 'Active' | 'Archived';
  createdAt?: any;
}

export interface CareCellMeetingReport {
  id: string;
  cellId: string;
  meetingId: string;
  summary: string;
  scripture?: string;
  totalMembers: number;
  presentMembers: number;
  absentMembers: number;
  lateMembers: number;
  excusedMembers: number;
  prayerPoints?: string;
  nextMeetingDate?: string;
  photoUrls?: string[];
  submittedBy: string;
  submittedByName?: string;
  submittedAt: any;
}

export interface CareCellOverviewStats {
  totalCareCells: number;
  activeCareCells: number;
  inactiveCareCells: number;
  totalCellLeaders: number;
  totalAssignedMembers: number;
  totalMeetingsThisMonth: number;
  averageAttendanceRate: number; // 0 to 100 percentage
  membersRequiringFollowup: number;
}


export type LocationSource = 'profile_geocoding' | 'member_confirmed_pin';
export type LocationAccuracy =
  | 'verified_home'
  | 'village_approximate'
  | 'not_verified';
export type GeocodingStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'needs_review';
export type MemberVisitBadgeStatus =
  | 'no_pending'
  | 'scheduled'
  | 'awaiting_confirmation'
  | 'requires_followup';

export interface MemberLocationRecord {
  memberId: string;
  churchId: string;
  memberName: string;
  profileImage?: string;
  phone?: string;
  village?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  residentialAddress?: string;
  careCellId?: string;
  careCellName?: string;
  careCellLeaderId?: string;
  careCellLeaderName?: string;
  careCellLeaderPhone?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  resolvedLocality?: string;
  resolvedDistrict?: string;
  resolvedState?: string;
  resolvedCountry?: string;
  googleResultType?: string;
  googleLocationType?: string;
  placeId?: string;
  geohash?: string;
  addressFingerprint?: string;
  locationSource: LocationSource;
  locationAccuracy: LocationAccuracy;
  geocodingStatus: GeocodingStatus;
  geocodingNote?: string;
  // Exact residential confirmation fields (only visible with consent)
  locationSharingConsent: boolean;
  confirmedLatitude?: number;
  confirmedLongitude?: number;
  confirmedGeohash?: string;
  completeAddress?: string;
  landmark?: string;
  lastVisitDate?: string;
  upcomingVisitId?: string;
  upcomingVisitDate?: string;
  upcomingVisitTime?: string;
  upcomingVisitStatus?: VisitStatus;
  requiresFollowup?: boolean;
  geocodedAt?: any;
  confirmedAt?: any;
  updatedAt?: any;
}

export interface NearbyMemberMatch {
  location: MemberLocationRecord;
  distanceKm: number;
  isApproximateDistance: boolean;
  effectiveLatitude: number;
  effectiveLongitude: number;
}
