export type VolunteerType = 'general' | 'event';
export type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface EventVolunteerRole {
  id: string;
  name: string;
  slotsNeeded: number;
  assignedCount: number;
  description?: string;
}

export interface VolunteerApplication {
  id: string;
  churchId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string;
  memberFcmToken?: string;
  volunteerType: VolunteerType;
  status: VolunteerStatus;
  createdAt: any;
  updatedAt: any;

  // --- General Volunteer fields ---
  preferredMinistries?: string[];
  skills?: string[];
  availabilityNotes?: string;

  // --- Event Volunteer fields ---
  eventId?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  preferredRole?: string;

  // --- Admin Review & Assignment ---
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: any;
  rejectionReason?: string;
  adminNotes?: string;

  assignedRole?: string;
  assignedDate?: string;
  assignedTimeSlot?: string;
  assignedLocation?: string;
  assignedResponsibility?: string;
  assignedAt?: any;

  // --- Idempotency & Reminders ---
  adminNotified?: boolean;
  adminNotifiedAt?: any;
  lastNotifiedStatus?: VolunteerStatus;
  lastNotifiedStatusAt?: any;
  lastNotifiedAssignmentHash?: string;
  remindersSent?: {
    h24?: boolean;
    h24At?: any;
    h2?: boolean;
    h2At?: any;
  };
}

export const COMMON_MINISTRIES = [
  { id: 'worship', label: 'Worship & Choir · ఆరాధన బృందం', icon: 'Music' },
  { id: 'media_tech', label: 'Media & Sound / Tech · మీడియా & సౌండ్', icon: 'Video' },
  { id: 'ushers', label: 'Ushers & Greeters · ఆహ్వాన బృందం', icon: 'Users' },
  { id: 'children', label: 'Sunday School & Kids · సండే స్కూల్', icon: 'Smile' },
  { id: 'hospitality', label: 'Hospitality & Food · ఆతిథ్య సేవ', icon: 'Heart' },
  { id: 'prayer', label: 'Intercessory Prayer · విజ్ఞాపన ప్రార్థన', icon: 'HeartHandshake' },
  { id: 'setup', label: 'Stage & Campus Setup · ఏర్పాట్లు', icon: 'Layers' },
  { id: 'transport', label: 'Transport & Parking · పార్కింగ్', icon: 'MapPin' },
];

export const COMMON_EVENT_ROLES = [
  'Ushering & Welcome',
  'Sound & Audio Engineer',
  'Video & Live Stream',
  'Stage Setup & Logistics',
  'Registration & Attendance Desk',
  'Parking & Traffic Control',
  'Refreshments & Hospitality',
  'First Aid & Safety Support',
  'Prayer Team Support',
];

