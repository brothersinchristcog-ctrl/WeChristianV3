import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type TestimonyPrivacy = 'Private' | 'Public';

export type TestimonyStatus =
  | 'Pending Review'
  | 'Private'
  | 'Approved'
  | 'Published'
  | 'Rejected';

export type TestimonyType = 'Written' | 'Video' | 'Document' | 'Mixed';

export type TestimonyCategory =
  | 'Healing'
  | 'Salvation'
  | 'Provision'
  | 'Family & Marriage'
  | 'Deliverance'
  | 'Answered Prayer'
  | 'Career & Education'
  | 'Other';

export const TESTIMONY_CATEGORIES: TestimonyCategory[] = [
  'Healing',
  'Salvation',
  'Provision',
  'Family & Marriage',
  'Deliverance',
  'Answered Prayer',
  'Career & Education',
  'Other',
];

export interface TestimonyAttachment {
  path: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface LocalMediaSelection {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number | null;
}

export interface Testimony {
  testimonyId: string;
  churchId: string;
  memberId: string;
  memberName?: string;
  memberPhotoUrl?: string | null;
  memberPhone?: string | null;
  title: string;
  description: string;
  testimonyType: TestimonyType;
  writtenContent: string;
  category?: string | null;
  videoStoragePath: string | null;
  videoDurationMs?: number | null;
  videoSizeBytes?: number | null;
  videoMimeType?: string | null;
  attachmentStoragePaths: TestimonyAttachment[];
  privacy: TestimonyPrivacy;
  publicConsentGranted?: boolean;
  status: TestimonyStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | any;
  reviewedAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | any | null;
  reviewedBy: string | null;
  reviewedByName?: string | null;
  publishedAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | any | null;
  rejectionReason: string | null;
  // Notification idempotency flags managed by Cloud Functions
  adminPushSent?: boolean;
  lastMemberNotifiedStatus?: string | null;
  publicationPushSent?: boolean;
}

export interface TestimonyUploadConfig {
  maxVideoSizeBytes: number;
  maxVideoSizeMB: number;
  recommendedVideoDurationSeconds: number;
  allowedVideoExtensions: string[];
  allowedVideoMimeTypes: string[];
  maxDocumentSizeBytes: number;
  maxDocumentSizeMB: number;
  maxDocumentsCount: number;
  allowedDocumentExtensions: string[];
  allowedDocumentMimeTypes: string[];
}

export const DEFAULT_TESTIMONY_UPLOAD_CONFIG: TestimonyUploadConfig = {
  maxVideoSizeBytes: 100 * 1024 * 1024, // 100 MB
  maxVideoSizeMB: 100,
  recommendedVideoDurationSeconds: 5 * 60, // 5 minutes
  allowedVideoExtensions: ['.mp4', '.mov'],
  allowedVideoMimeTypes: ['video/mp4', 'video/quicktime'],
  maxDocumentSizeBytes: 10 * 1024 * 1024, // 10 MB per file
  maxDocumentSizeMB: 10,
  maxDocumentsCount: 5,
  allowedDocumentExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  allowedDocumentMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
};
