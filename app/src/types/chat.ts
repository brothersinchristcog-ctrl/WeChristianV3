export type ChatType = 'direct' | 'group';

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'system';

export interface ChatParticipantSummary {
  memberId: string;
  uid?: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  userType?: string;
}

export interface ChatMemberProfile {
  id: string;
  uid?: string;
  churchId: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  userType?: string;
  ministry?: string | null;
  isAdmin?: boolean;
  isMinistryLeader?: boolean;
  isCareCellLeader?: boolean;
}

export interface ChatMediaAttachment {
  storagePath?: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  durationMs?: number;
  thumbnailUrl?: string;
}

export interface ChatReplyPreview {
  messageId: string;
  senderId: string;
  senderName: string;
  textPreview: string;
  type: ChatMessageType;
}

export interface ChatSystemEvent {
  action:
    | 'group_created'
    | 'member_added'
    | 'member_removed'
    | 'member_left'
    | 'admin_promoted'
    | 'admin_demoted';
  actorName: string;
  targetName?: string;
}

export interface ChatLastMessage {
  id: string;
  text: string;
  type: ChatMessageType;
  senderId: string;
  senderName: string;
  createdAt?: any;
}

export interface ChatGroupSettings {
  onlyAdminsCanMessage?: boolean;
  onlyAdminsCanEditInfo?: boolean;
  onlyAdminsCanAddMembers?: boolean;
}

export interface ChatThread {
  id: string;
  churchId: string;
  type: ChatType;
  name?: string;
  description?: string;
  teamCategory?: string;
  photoUrl?: string | null;
  participantIds: string[];
  participants?: Record<string, ChatParticipantSummary>;
  adminIds?: string[];
  createdBy?: string;
  settings?: ChatGroupSettings;
  lastMessage?: ChatLastMessage | null;
  unreadCounts?: Record<string, number>;
  mutedBy?: Record<string, any>;
  archivedBy?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string | null;
  type: ChatMessageType;
  text: string;
  media?: ChatMediaAttachment | null;
  replyTo?: ChatReplyPreview | null;
  forwardedFrom?: {
    isForwarded: boolean;
    originalSenderName?: string;
  } | null;
  reactions?: Record<string, string>;
  deliveredTo?: string[];
  readBy?: string[];
  deletedFor?: string[];
  deletedForEveryone?: boolean;
  deletedAt?: any;
  systemEvent?: ChatSystemEvent | null;
  createdAt?: any;
}

export interface ChatPresence {
  online: boolean;
  lastSeen?: number | null;
}

