/**
 * Church of God (COG) Mobile App
 * Shared Firestore Schema Types
 */

export interface User {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  cellGroup: string;
  sfContactId?: string; // Sync with Salesforce
  photoURL?: string;
  role: 'member' | 'pastor' | 'admin';
  fcmToken?: string;
  createdAt: any; // Server Timestamp
  language: 'EN' | 'TE';
}

export interface DailyPromise {
  id: string; // YYYY-MM-DD
  verse: string;
  reference: string;
  devotionalNote: string;
  pastor: string;
  backgroundTheme: string; // Theme name or color
  imageUrl?: string;
}

export interface DailyVideo {
  id: string; // YYYY-MM-DD
  youtubeId: string;
  title: string;
  pastor: string;
  duration: string;
  publishedAt: any;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: any; // Timestamp
  time: string;
  venue: string;
  category: 'Service' | 'Youth' | 'Fasting' | 'Ministry' | 'Special';
  posterUrl: string;
  sfCampaignId: string;
  rsvpCount: number;
}

export interface PrayerRequest {
  id: string;
  uid?: string;
  contactId?: string;
  authorId?: string;
  name: string;
  phone?: string;
  text: string;
  textTe?: string;
  type?: 'public' | 'private';
  isPublic?: boolean;
  category: string;
  status?: 'pending' | 'approved';
  prayCount: number;
  prayedBy?: string[]; // List of UIDs
  prayedByNames?: string[]; // List of names
  response?: string; // Pastor's response
  isAnswered: boolean;
  isClosed?: boolean;
  isAnonymous?: boolean;
  testimony?: string;
  createdAt: any;
  replies?: any[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  pinned: boolean;
  targetSegment: 'All' | 'Leaders' | 'Youth' | 'Women';
  createdAt: any;
}

export interface GivingTransaction {
  id: string;
  uid: string;
  name: string;
  amount: number;
  category: 'Tithe' | 'Offering' | 'Mission' | 'Building' | 'Special';
  phonepeOrderId: string;
  sfOpportunityId?: string;
  status: 'pending' | 'success' | 'failed';
  receiptUrl?: string;
  createdAt: any;
}
