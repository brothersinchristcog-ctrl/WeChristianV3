import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ChatGroupSettings,
  ChatLastMessage,
  ChatMediaAttachment,
  ChatMemberProfile,
  ChatMessage,
  ChatMessageType,
  ChatParticipantSummary,
  ChatPresence,
  ChatReplyPreview,
  ChatSystemEvent,
  ChatThread,
} from '../types/chat';

const CHURCHES_COLLECTION = 'churches';

const sanitizeRtdbKey = (raw: string): string =>
  String(raw || 'unknown').replace(/[.#$\[\]\/]/g, '_');

const omitUndefined = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) {
      clean[k] = v;
    }
  });
  return clean;
};

const normalizePhoneDigits = (phone?: string | null): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Safely obtain React Native Firebase Realtime Database instance.
 * Returns null gracefully if the native module isn't linked into this binary yet.
 */
const getRtdbInstance = (): any | null => {
  try {
    const { NativeModules } = require('react-native');
    if (
      !NativeModules?.RNFBDatabaseModule ||
      !NativeModules?.RNFBDatabaseQueryModule ||
      !NativeModules?.RNFBDatabaseReferenceModule ||
      typeof NativeModules?.RNFBDatabaseQueryModule?.on !== 'function' ||
      typeof NativeModules?.RNFBDatabaseReferenceModule?.set !== 'function'
    ) {
      return null;
    }

    const dbMod = require('@react-native-firebase/database');
    const fn = dbMod?.default || dbMod;
    if (typeof fn !== 'function') return null;

    const instance = fn();
    if (!instance || typeof instance.native?.on !== 'function') {
      return null;
    }
    return instance;
  } catch {
    return null;
  }
};

export const canCreateChurchGroup = (
  member: any,
  isPlatformSuperAdmin?: boolean
): boolean => {
  if (isPlatformSuperAdmin) return true;
  if (!member) return false;
  const roleStr = String(member.userType || member.role || '').toUpperCase();
  if (
    roleStr.includes('ADMIN') ||
    roleStr.includes('SUPER') ||
    roleStr.includes('PASTOR') ||
    roleStr.includes('LEADER') ||
    roleStr.includes('MINISTRY')
  ) {
    return true;
  }
  return Boolean(
    member.isAdmin ||
      member.isSuperAdmin ||
      member.isMinistryLeader ||
      member.isCareCellLeader
  );
};

class ChatService {
  private chatsCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('chats');
  }

  private messagesCol(churchId: string, chatId: string) {
    return this.chatsCol(churchId).doc(chatId).collection('messages');
  }

  private membersCol(churchId: string) {
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('members');
  }

  /**
   * Resolves all identity keys representing the current member inside this church.
   */
  getMyIdentityIds(user: any, member: any): string[] {
    const ids = new Set<string>();
    if (user?.uid) ids.add(String(user.uid));
    if (member?.id) ids.add(String(member.id));
    if (member?.uid) ids.add(String(member.uid));
    return Array.from(ids).slice(0, 10);
  }

  getCanonicalId(user: any, member: any): string {
    return String(user?.uid || member?.uid || member?.id || '');
  }

  /**
   * Fetch all members belonging strictly to `churchId`, excluding the caller,
   * and filter by search text (name, phone, or ministry).
   */
  async searchChurchMembers(
    churchId: string,
    searchText: string,
    currentUser: { uid?: string | null; memberId?: string | null; phone?: string | null }
  ): Promise<ChatMemberProfile[]> {
    if (!churchId?.trim()) return [];
    try {
      const snap = await this.membersCol(churchId).get();
      const myIds = new Set(
        [currentUser?.uid, currentUser?.memberId].filter(Boolean).map(String)
      );
      const myPhone = normalizePhoneDigits(currentUser?.phone);
      const q = searchText.trim().toLowerCase();

      const dedupByPhone = new Map<string, ChatMemberProfile>();
      const results: ChatMemberProfile[] = [];

      snap.docs.forEach((doc) => {
        const data = doc.data() || {};
        const statusLower = String(data.status || '').trim().toLowerCase();
        if (
          statusLower === 'left' ||
          statusLower === 'removed' ||
          statusLower === 'deleted' ||
          statusLower === 'inactive' ||
          statusLower === 'archived' ||
          data.archived === true ||
          data.deleted === true ||
          data.isDeleted === true ||
          data.isActive === false
        ) {
          return;
        }

        const docId = doc.id;
        const memberUid = data.uid ? String(data.uid) : undefined;
        const phone = data.phone || data.mobile || null;
        const normPhone = normalizePhoneDigits(phone);

        // Exclude self
        if (myIds.has(docId) || (memberUid && myIds.has(memberUid))) return;
        if (myPhone && normPhone && myPhone === normPhone) return;

        const rawName =
          data.name ||
          [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
          'Church Member';

        const profile: ChatMemberProfile = {
          id: docId,
          uid: memberUid,
          churchId,
          name: rawName,
          photoUrl: data.photoURL || data.photoUrl || null,
          phone,
          userType: data.userType || 'Member',
          ministry: data.ministry || data.department || null,
          isAdmin: Boolean(data.isAdmin),
          isMinistryLeader: Boolean(data.isMinistryLeader),
          isCareCellLeader: Boolean(data.isCareCellLeader),
        };

        const dedupKey = normPhone || (memberUid ? `uid:${memberUid}` : '');
        if (dedupKey) {
          const existing = dedupByPhone.get(dedupKey);
          // Prefer records whose doc ID matches an Auth uid (`data.uid === docId`)
          if (!existing || (memberUid && docId === memberUid)) {
            dedupByPhone.set(dedupKey, profile);
          }
        } else {
          results.push(profile);
        }
      });

      const merged = [...Array.from(dedupByPhone.values()), ...results];
      const filtered = q
        ? merged.filter((m) => {
            const nameMatch = m.name.toLowerCase().includes(q);
            const ministryMatch = (m.ministry || '').toLowerCase().includes(q);
            const roleMatch = (m.userType || '').toLowerCase().includes(q);
            return nameMatch || ministryMatch || roleMatch;
          })
        : merged;

      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error('[ChatService] searchChurchMembers error:', err);
      return [];
    }
  }

  /**
   * Opens existing 1-to-1 private chat or creates it cleanly using deterministic DM ID.
   */
  async getOrCreateDirectChat(
    churchId: string,
    currentUser: ChatParticipantSummary,
    targetMember: ChatMemberProfile
  ): Promise<ChatThread> {
    const myId = currentUser.uid || currentUser.memberId;
    const targetId = targetMember.uid || targetMember.id;
    const pair = [myId, targetId].sort();
    const chatId = `dm_${sanitizeRtdbKey(pair[0])}_${sanitizeRtdbKey(pair[1])}`;
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const snap = await chatRef.get();

    const participants: Record<string, ChatParticipantSummary> = {
      [myId]: {
        memberId: myId,
        uid: currentUser.uid || myId,
        name: currentUser.name || 'Member',
        photoUrl: currentUser.photoUrl || null,
        phone: currentUser.phone || null,
        userType: currentUser.userType || 'Member',
      },
      [targetId]: {
        memberId: targetId,
        uid: targetMember.uid || targetMember.id,
        name: targetMember.name || 'Member',
        photoUrl: targetMember.photoUrl || null,
        phone: targetMember.phone || null,
        userType: targetMember.userType || 'Member',
      },
    };

    if (snap.exists()) {
      const existing = { id: snap.id, ...snap.data() } as ChatThread;
      // Keep participant display info fresh
      await chatRef
        .set(
          {
            participants: {
              ...(existing.participants || {}),
              ...participants,
            },
          },
          { merge: true }
        )
        .catch(() => {});
      return {
        ...existing,
        participants: { ...(existing.participants || {}), ...participants },
      };
    }

    const newThread: Omit<ChatThread, 'id'> = {
      churchId,
      type: 'direct',
      participantIds: pair,
      participants,
      adminIds: [],
      createdBy: myId,
      lastMessage: null,
      unreadCounts: {
        [myId]: 0,
        [targetId]: 0,
      },
      mutedBy: {},
      archivedBy: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await chatRef.set(newThread);
    return {
      id: chatId,
      ...newThread,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Real-time subscription to the user's chats inside the active church.
   */
  subscribeToMyChats(
    churchId: string,
    myIds: string[],
    onUpdate: (chats: ChatThread[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const cleanIds = myIds.filter(Boolean).slice(0, 10);
    if (!churchId?.trim() || cleanIds.length === 0) {
      onUpdate([]);
      return () => {};
    }

    const queryRef: FirebaseFirestoreTypes.Query =
      cleanIds.length === 1
        ? this.chatsCol(churchId).where('participantIds', 'array-contains', cleanIds[0])
        : this.chatsCol(churchId).where('participantIds', 'array-contains-any', cleanIds);

    return queryRef.onSnapshot(
      (snap) => {
        if (!snap) return;
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatThread[];

        list.sort((a, b) => {
          const aMs =
            a.updatedAt?.toMillis?.() ||
            a.lastMessage?.createdAt?.toMillis?.() ||
            a.createdAt?.toMillis?.() ||
            0;
          const bMs =
            b.updatedAt?.toMillis?.() ||
            b.lastMessage?.createdAt?.toMillis?.() ||
            b.createdAt?.toMillis?.() ||
            0;
          return bMs - aMs;
        });

        onUpdate(list);
      },
      (err) => {
        console.error('[ChatService] subscribeToMyChats error:', err);
        onError?.(err);
      }
    );
  }

  /**
   * Subscribe to total unread count across active (non-archived) chats for Home FAB badge.
   */
  subscribeToTotalUnreadCount(
    churchId: string,
    myIds: string[],
    onCount: (count: number) => void
  ): () => void {
    return this.subscribeToMyChats(
      churchId,
      myIds,
      (chats) => {
        let total = 0;
        chats.forEach((c) => {
          const isArchived = (c.archivedBy || []).some((id) => myIds.includes(id));
          if (isArchived) return;
          myIds.forEach((id) => {
            total += Number(c.unreadCounts?.[id] || 0);
          });
        });
        onCount(total);
      },
      () => onCount(0)
    );
  }

  /**
   * Subscribe to single chat metadata (for live header/unread/participant updates).
   */
  subscribeToChatThread(
    churchId: string,
    chatId: string,
    onUpdate: (chat: ChatThread | null) => void
  ): () => void {
    if (!churchId?.trim() || !chatId) return () => {};
    return this.chatsCol(churchId)
      .doc(chatId)
      .onSnapshot(
        (doc) => {
          if (!doc.exists()) {
            onUpdate(null);
            return;
          }
          onUpdate({ id: doc.id, ...doc.data() } as ChatThread);
        },
        (err) => {
          console.error('[ChatService] subscribeToChatThread error:', err);
        }
      );
  }

  /**
   * Subscribe to messages in descending order (for inverted FlatList).
   */
  subscribeToMessages(
    churchId: string,
    chatId: string,
    pageSize: number = 50,
    onUpdate: (messages: ChatMessage[]) => void
  ): () => void {
    if (!churchId?.trim() || !chatId) return () => {};
    return this.messagesCol(churchId, chatId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .onSnapshot(
        (snap) => {
          if (!snap) return;
          const msgs = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ChatMessage[];
          onUpdate(msgs);
        },
        (err) => {
          console.error('[ChatService] subscribeToMessages error:', err);
        }
      );
  }

  /**
   * Send a real-time text message (with optional reply preview).
   */
  async sendTextMessage(
    churchId: string,
    chatId: string,
    sender: ChatParticipantSummary,
    text: string,
    options?: {
      replyTo?: ChatReplyPreview | null;
      participantIds?: string[];
    }
  ): Promise<string> {
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Message cannot be empty.');

    const senderId = sender.uid || sender.memberId;
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const msgRef = this.messagesCol(churchId, chatId).doc();

    const messagePayload: Record<string, any> = {
      id: msgRef.id,
      senderId,
      senderName: sender.name || 'Member',
      senderPhotoUrl: sender.photoUrl || null,
      type: 'text',
      text: cleanText,
      replyTo: options?.replyTo || null,
      reactions: {},
      deliveredTo: [senderId],
      readBy: [senderId],
      deletedFor: [],
      deletedForEveryone: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    const lastMessage: ChatLastMessage = {
      id: msgRef.id,
      text: cleanText,
      type: 'text',
      senderId,
      senderName: sender.name || 'Member',
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    let participants = options?.participantIds;
    if (!participants || participants.length === 0) {
      const chatSnap = await chatRef.get();
      participants = (chatSnap.data()?.participantIds as string[]) || [];
    }

    const batch = firestore().batch();
    batch.set(msgRef, messagePayload);

    const chatUpdates: Record<string, any> = {
      lastMessage,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    participants.forEach((pId) => {
      if (pId && pId !== senderId) {
        chatUpdates[`unreadCounts.${pId}`] = firestore.FieldValue.increment(1);
      }
    });

    batch.update(chatRef, chatUpdates);
    await batch.commit();

    return msgRef.id;
  }

  /**
   * Mark a chat as read for the active user and update message readBy indicators.
   */
  async markChatAsRead(
    churchId: string,
    chatId: string,
    myIds: string[],
    unreadMessages: ChatMessage[] = []
  ): Promise<void> {
    if (!churchId?.trim() || !chatId || myIds.length === 0) return;
    const canonicalId = myIds[0];

    try {
      const chatRef = this.chatsCol(churchId).doc(chatId);
      const batch = firestore().batch();

      const clearUpdates: Record<string, any> = {};
      myIds.forEach((id) => {
        clearUpdates[`unreadCounts.${id}`] = 0;
      });
      batch.update(chatRef, clearUpdates);

      unreadMessages.slice(0, 25).forEach((m) => {
        const alreadyRead = (m.readBy || []).some((id) => myIds.includes(id));
        if (!alreadyRead && !myIds.includes(m.senderId)) {
          const mRef = this.messagesCol(churchId, chatId).doc(m.id);
          batch.update(mRef, {
            readBy: firestore.FieldValue.arrayUnion(canonicalId),
            deliveredTo: firestore.FieldValue.arrayUnion(canonicalId),
          });
        }
      });

      await batch.commit();
    } catch (err) {
      console.warn('[ChatService] markChatAsRead warning:', err);
    }
  }

  /**
   * Delete message either for the current member or for everyone (sender only).
   */
  async deleteMessage(
    churchId: string,
    chatId: string,
    messageId: string,
    myId: string,
    mode: 'me' | 'everyone'
  ): Promise<void> {
    const msgRef = this.messagesCol(churchId, chatId).doc(messageId);
    if (mode === 'everyone') {
      await msgRef.update({
        deletedForEveryone: true,
        text: 'This message was deleted',
        media: null,
        deletedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await msgRef.update({
        deletedFor: firestore.FieldValue.arrayUnion(myId),
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MEDIA UPLOADS, RICH MESSAGES, FORWARDING & REACTIONS (PHASE 2)
  // ───────────────────────────────────────────────────────────────────────────

  async uploadChatMedia(
    churchId: string,
    chatId: string,
    localUri: string,
    kind: 'image' | 'video' | 'audio' | 'document' | 'group_avatar',
    fileName?: string,
    mimeType?: string,
    onProgress?: (pct: number) => void
  ): Promise<{ storagePath: string; url: string }> {
    const cleanUri = localUri.trim();
    const fallbackExt =
      kind === 'image' || kind === 'group_avatar'
        ? 'jpg'
        : kind === 'video'
        ? 'mp4'
        : kind === 'audio'
        ? 'm4a'
        : 'pdf';
    const defaultMime =
      kind === 'image' || kind === 'group_avatar'
        ? 'image/jpeg'
        : kind === 'video'
        ? 'video/mp4'
        : kind === 'audio'
        ? 'audio/m4a'
        : 'application/octet-stream';

    const safeName = (fileName || `${kind}_${Date.now()}.${fallbackExt}`).replace(/[^a-zA-Z0-9._-]/g, '_');

    let uploadUri = cleanUri;
    if (cleanUri.startsWith('content://') && FileSystem.cacheDirectory) {
      try {
        const cachedPath = `${FileSystem.cacheDirectory}chat_upload_${Date.now()}_${safeName}`;
        await FileSystem.copyAsync({ from: cleanUri, to: cachedPath });
        uploadUri = cachedPath;
      } catch (copyErr) {
        console.warn('[ChatService] content:// copy warning, trying original URI:', copyErr);
      }
    }

    const storagePath = `churches/${churchId}/chats/${chatId}/${Date.now()}_${safeName}`;
    const ref = storage().ref(storagePath);
    const task = ref.putFile(uploadUri, { contentType: mimeType || defaultMime });

    if (onProgress && typeof task.on === 'function') {
      try {
        task.on('state_changed', (snap: any) => {
          const total = snap?.totalBytes || 0;
          const transferred = snap?.bytesTransferred || 0;
          if (total > 0) {
            onProgress(Math.min(100, Math.round((transferred / total) * 100)));
          }
        });
      } catch {}
    }

    await task;
    const url = await ref.getDownloadURL();
    return { storagePath, url };
  }

  private getMediaLabel(type: ChatMessageType, fileName?: string): string {
    switch (type) {
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎤 Voice message';
      case 'document':
        return fileName ? `📄 ${fileName}` : '📄 Document';
      default:
        return 'Message';
    }
  }

  async sendMediaMessage(
    churchId: string,
    chatId: string,
    sender: ChatParticipantSummary,
    params: {
      type: 'image' | 'video' | 'audio' | 'document';
      localUri: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      durationMs?: number;
      caption?: string;
      replyTo?: ChatReplyPreview | null;
      participantIds?: string[];
      onProgress?: (pct: number) => void;
    }
  ): Promise<string> {
    const senderId = sender.uid || sender.memberId;
    const { storagePath, url } = await this.uploadChatMedia(
      churchId,
      chatId,
      params.localUri,
      params.type,
      params.fileName,
      params.mimeType,
      params.onProgress
    );

    const media: ChatMediaAttachment = {
      storagePath,
      url,
      ...(params.mimeType ? { mimeType: params.mimeType } : {}),
      ...(params.fileName ? { fileName: params.fileName } : {}),
      ...(typeof params.sizeBytes === 'number' && !Number.isNaN(params.sizeBytes)
        ? { sizeBytes: params.sizeBytes }
        : {}),
      ...(typeof params.durationMs === 'number' && !Number.isNaN(params.durationMs)
        ? { durationMs: params.durationMs }
        : {}),
    };

    const previewLabel = params.caption?.trim() || this.getMediaLabel(params.type, params.fileName);
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const msgRef = this.messagesCol(churchId, chatId).doc();

    const messagePayload: Record<string, any> = {
      id: msgRef.id,
      senderId,
      senderName: sender.name || 'Member',
      senderPhotoUrl: sender.photoUrl || null,
      type: params.type,
      text: params.caption?.trim() || '',
      media,
      replyTo: params.replyTo || null,
      reactions: {},
      deliveredTo: [senderId],
      readBy: [senderId],
      deletedFor: [],
      deletedForEveryone: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    const lastMessage: ChatLastMessage = {
      id: msgRef.id,
      text: previewLabel,
      type: params.type,
      senderId,
      senderName: sender.name || 'Member',
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    let participants = params.participantIds;
    if (!participants || participants.length === 0) {
      const chatSnap = await chatRef.get();
      participants = (chatSnap.data()?.participantIds as string[]) || [];
    }

    const batch = firestore().batch();
    batch.set(msgRef, messagePayload);

    const chatUpdates: Record<string, any> = {
      lastMessage,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    participants.forEach((pId) => {
      if (pId && pId !== senderId) {
        chatUpdates[`unreadCounts.${pId}`] = firestore.FieldValue.increment(1);
      }
    });

    batch.set(chatRef, chatUpdates, { merge: true });
    await batch.commit();
    return msgRef.id;
  }

  async forwardMessages(
    churchId: string,
    sender: ChatParticipantSummary,
    targetChats: ChatThread[],
    sourceMessage: ChatMessage
  ): Promise<void> {
    if (!churchId || targetChats.length === 0) return;
    const senderId = sender.uid || sender.memberId;

    await Promise.all(
      targetChats.map(async (target) => {
        const chatRef = this.chatsCol(churchId).doc(target.id);
        const msgRef = this.messagesCol(churchId, target.id).doc();

        const previewLabel =
          sourceMessage.text?.trim() ||
          this.getMediaLabel(sourceMessage.type, sourceMessage.media?.fileName);

        const payload: Record<string, any> = {
          id: msgRef.id,
          senderId,
          senderName: sender.name || 'Member',
          senderPhotoUrl: sender.photoUrl || null,
          type: sourceMessage.type === 'system' ? 'text' : sourceMessage.type,
          text: sourceMessage.text || '',
          media: sourceMessage.media ? (omitUndefined(sourceMessage.media) as ChatMediaAttachment) : null,
          forwardedFrom: {
            isForwarded: true,
            originalSenderName: sourceMessage.senderName || 'Member',
          },
          reactions: {},
          deliveredTo: [senderId],
          readBy: [senderId],
          deletedFor: [],
          deletedForEveryone: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        const lastMessage: ChatLastMessage = {
          id: msgRef.id,
          text: `↪ ${previewLabel}`,
          type: payload.type,
          senderId,
          senderName: sender.name || 'Member',
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        const batch = firestore().batch();
        batch.set(msgRef, payload);

        const chatUpdates: Record<string, any> = {
          lastMessage,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        (target.participantIds || []).forEach((pId) => {
          if (pId && pId !== senderId) {
            chatUpdates[`unreadCounts.${pId}`] = firestore.FieldValue.increment(1);
          }
        });

        batch.set(chatRef, chatUpdates, { merge: true });
        await batch.commit();
      })
    );
  }

  async toggleMessageReaction(
    churchId: string,
    chatId: string,
    messageId: string,
    myId: string,
    emoji: string
  ): Promise<void> {
    if (!churchId || !chatId || !messageId || !myId) return;
    const msgRef = this.messagesCol(churchId, chatId).doc(messageId);
    const snap = await msgRef.get();
    const existing = snap.data()?.reactions?.[myId];
    if (existing === emoji) {
      await msgRef.update({
        [`reactions.${myId}`]: firestore.FieldValue.delete(),
      });
    } else {
      await msgRef.update({
        [`reactions.${myId}`]: emoji,
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP CREATION & MANAGEMENT (ADMIN & MINISTRY LEADERS)
  // ───────────────────────────────────────────────────────────────────────────

  private async postSystemEventMessage(
    churchId: string,
    chatId: string,
    text: string,
    systemEvent: ChatSystemEvent,
    actorId: string,
    actorName: string
  ): Promise<void> {
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const msgRef = this.messagesCol(churchId, chatId).doc();
    const batch = firestore().batch();

    batch.set(msgRef, {
      id: msgRef.id,
      senderId: actorId,
      senderName: actorName,
      type: 'system',
      text,
      systemEvent,
      reactions: {},
      deliveredTo: [],
      readBy: [actorId],
      deletedFor: [],
      deletedForEveryone: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    batch.set(
      chatRef,
      {
        lastMessage: {
          id: msgRef.id,
          text,
          type: 'system',
          senderId: actorId,
          senderName: actorName,
          createdAt: firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  }

  async createGroupChat(
    churchId: string,
    creator: ChatParticipantSummary,
    params: {
      name: string;
      description?: string;
      teamCategory?: string;
      localPhotoUri?: string | null;
      members: ChatMemberProfile[];
    }
  ): Promise<ChatThread> {
    const creatorId = creator.uid || creator.memberId;
    const chatRef = this.chatsCol(churchId).doc();
    const chatId = chatRef.id;

    let photoUrl: string | null = null;
    if (params.localPhotoUri) {
      const uploaded = await this.uploadChatMedia(
        churchId,
        chatId,
        params.localPhotoUri,
        'group_avatar',
        `group_${chatId}.jpg`
      );
      photoUrl = uploaded.url;
    }

    const participants: Record<string, ChatParticipantSummary> = {
      [creatorId]: {
        memberId: creatorId,
        uid: creator.uid || creatorId,
        name: creator.name || 'Leader',
        photoUrl: creator.photoUrl || null,
        phone: creator.phone || null,
        userType: creator.userType || 'Admin',
      },
    };
    const unreadCounts: Record<string, number> = { [creatorId]: 0 };
    const participantIdSet = new Set<string>([creatorId]);

    params.members.forEach((m) => {
      const mId = m.uid || m.id;
      if (!mId || participantIdSet.has(mId)) return;
      participantIdSet.add(mId);
      participants[mId] = {
        memberId: mId,
        uid: m.uid || m.id,
        name: m.name || 'Member',
        photoUrl: m.photoUrl || null,
        phone: m.phone || null,
        userType: m.userType || 'Member',
      };
      unreadCounts[mId] = 0;
    });

    const participantIds = Array.from(participantIdSet);
    const groupData: Omit<ChatThread, 'id'> = {
      churchId,
      type: 'group',
      name: params.name.trim(),
      description: params.description?.trim() || '',
      teamCategory: params.teamCategory || 'General',
      photoUrl,
      participantIds,
      participants,
      adminIds: [creatorId],
      createdBy: creatorId,
      settings: {
        onlyAdminsCanMessage: false,
        onlyAdminsCanEditInfo: true,
        onlyAdminsCanAddMembers: true,
      },
      lastMessage: null,
      unreadCounts,
      mutedBy: {},
      archivedBy: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await chatRef.set(groupData);
    await this.postSystemEventMessage(
      churchId,
      chatId,
      `${creator.name || 'Admin'} created "${params.name.trim()}"`,
      { action: 'group_created', actorName: creator.name || 'Admin' },
      creatorId,
      creator.name || 'Admin'
    );

    return {
      id: chatId,
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateGroupInfo(
    churchId: string,
    chatId: string,
    updates: {
      name?: string;
      description?: string;
      teamCategory?: string;
      localPhotoUri?: string | null;
      settings?: ChatGroupSettings;
    }
  ): Promise<void> {
    const payload: Record<string, any> = {
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    if (typeof updates.name === 'string' && updates.name.trim()) {
      payload.name = updates.name.trim();
    }
    if (typeof updates.description === 'string') {
      payload.description = updates.description.trim();
    }
    if (typeof updates.teamCategory === 'string') {
      payload.teamCategory = updates.teamCategory;
    }
    if (updates.settings) {
      payload.settings = updates.settings;
    }
    if (updates.localPhotoUri) {
      const uploaded = await this.uploadChatMedia(
        churchId,
        chatId,
        updates.localPhotoUri,
        'group_avatar',
        `group_${Date.now()}.jpg`
      );
      payload.photoUrl = uploaded.url;
    }

    await this.chatsCol(churchId).doc(chatId).set(payload, { merge: true });
  }

  async addGroupMembers(
    churchId: string,
    chatId: string,
    actor: { id: string; name: string },
    membersToAdd: ChatMemberProfile[]
  ): Promise<void> {
    if (!churchId || !chatId || membersToAdd.length === 0) return;
    const chatRef = this.chatsCol(churchId).doc(chatId);

    const newIds: string[] = [];
    const updates: Record<string, any> = {};

    membersToAdd.forEach((m) => {
      const mId = m.uid || m.id;
      if (!mId) return;
      newIds.push(mId);
      updates[`participants.${mId}`] = {
        memberId: mId,
        uid: m.uid || m.id,
        name: m.name || 'Member',
        photoUrl: m.photoUrl || null,
        phone: m.phone || null,
        userType: m.userType || 'Member',
      };
      updates[`unreadCounts.${mId}`] = 0;
    });

    if (newIds.length === 0) return;
    updates.participantIds = firestore.FieldValue.arrayUnion(...newIds);
    updates.updatedAt = firestore.FieldValue.serverTimestamp();

    await chatRef.update(updates);

    const names = membersToAdd.map((m) => m.name).join(', ');
    await this.postSystemEventMessage(
      churchId,
      chatId,
      `${actor.name} added ${names}`,
      { action: 'member_added', actorName: actor.name, targetName: names },
      actor.id,
      actor.name
    );
  }

  async removeGroupMember(
    churchId: string,
    chatId: string,
    actor: { id: string; name: string },
    targetId: string,
    targetName: string
  ): Promise<void> {
    const chatRef = this.chatsCol(churchId).doc(chatId);
    await chatRef.update({
      participantIds: firestore.FieldValue.arrayRemove(targetId),
      adminIds: firestore.FieldValue.arrayRemove(targetId),
      [`participants.${targetId}`]: firestore.FieldValue.delete(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await this.postSystemEventMessage(
      churchId,
      chatId,
      `${actor.name} removed ${targetName}`,
      { action: 'member_removed', actorName: actor.name, targetName },
      actor.id,
      actor.name
    );
  }

  async leaveGroupChat(
    churchId: string,
    chatId: string,
    myIds: string[],
    myName: string
  ): Promise<void> {
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const snap = await chatRef.get();
    const data = snap.data() as ChatThread | undefined;
    if (!data) return;

    const myIdSet = new Set(myIds);
    const remainingParticipants = (data.participantIds || []).filter((id) => !myIdSet.has(id));
    let remainingAdmins = (data.adminIds || []).filter((id) => !myIdSet.has(id));

    // Ensure group always retains at least one admin if members remain
    if (remainingAdmins.length === 0 && remainingParticipants.length > 0) {
      remainingAdmins = [remainingParticipants[0]];
    }

    const updates: Record<string, any> = {
      participantIds: remainingParticipants,
      adminIds: remainingAdmins,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    myIds.forEach((id) => {
      updates[`participants.${id}`] = firestore.FieldValue.delete();
    });

    await chatRef.update(updates);
    await this.postSystemEventMessage(
      churchId,
      chatId,
      `${myName} left the group`,
      { action: 'member_left', actorName: myName },
      myIds[0] || '',
      myName
    );
  }

  async toggleGroupAdmin(
    churchId: string,
    chatId: string,
    actor: { id: string; name: string },
    targetId: string,
    targetName: string,
    makeAdmin: boolean
  ): Promise<void> {
    const chatRef = this.chatsCol(churchId).doc(chatId);
    await chatRef.update({
      adminIds: makeAdmin
        ? firestore.FieldValue.arrayUnion(targetId)
        : firestore.FieldValue.arrayRemove(targetId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await this.postSystemEventMessage(
      churchId,
      chatId,
      makeAdmin
        ? `${actor.name} promoted ${targetName} to Group Admin`
        : `${actor.name} removed ${targetName} as Group Admin`,
      {
        action: makeAdmin ? 'admin_promoted' : 'admin_demoted',
        actorName: actor.name,
        targetName,
      },
      actor.id,
      actor.name
    );
  }

  /**
   * Permanently delete a group chat and all of its messages (Group Admins / Church Admins).
   */
  async deleteGroupChat(churchId: string, chatId: string): Promise<void> {
    if (!churchId || !chatId) return;
    const msgsSnap = await this.messagesCol(churchId, chatId).get();
    const docs = msgsSnap.docs || [];

    // Firestore batches allow up to 500 writes at a time
    for (let i = 0; i < docs.length; i += 450) {
      const batch = firestore().batch();
      docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await this.chatsCol(churchId).doc(chatId).delete();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MUTE, ARCHIVE, BLOCK & REPORT (PHASE 3)
  // ───────────────────────────────────────────────────────────────────────────

  async toggleMuteChat(
    churchId: string,
    chatId: string,
    myIds: string[],
    mute: boolean
  ): Promise<void> {
    const chatRef = this.chatsCol(churchId).doc(chatId);
    const updates: Record<string, any> = {};
    myIds.forEach((id) => {
      if (id) {
        updates[`mutedBy.${id}`] = mute ? true : firestore.FieldValue.delete();
      }
    });
    if (Object.keys(updates).length > 0) {
      await chatRef.update(updates);
    }
  }

  async toggleArchiveChat(
    churchId: string,
    chatId: string,
    myIds: string[],
    archive: boolean
  ): Promise<void> {
    const cleanIds = myIds.filter(Boolean);
    if (cleanIds.length === 0) return;
    await this.chatsCol(churchId)
      .doc(chatId)
      .update({
        archivedBy: archive
          ? firestore.FieldValue.arrayUnion(...cleanIds)
          : firestore.FieldValue.arrayRemove(...cleanIds),
      });
  }

  subscribeToBlockedMembers(
    churchId: string,
    myId: string,
    onUpdate: (blockedIds: string[]) => void
  ): () => void {
    if (!churchId || !myId) {
      onUpdate([]);
      return () => {};
    }
    return firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('chat_blocks')
      .doc(myId)
      .onSnapshot(
        (doc) => {
          const data = doc.data();
          onUpdate(Array.isArray(data?.blockedIds) ? data.blockedIds : []);
        },
        () => onUpdate([])
      );
  }

  async toggleBlockMember(
    churchId: string,
    myId: string,
    targetId: string,
    block: boolean
  ): Promise<void> {
    if (!churchId || !myId || !targetId) return;
    const ref = firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('chat_blocks')
      .doc(myId);

    await ref.set(
      {
        blockedIds: block
          ? firestore.FieldValue.arrayUnion(targetId)
          : firestore.FieldValue.arrayRemove(targetId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  async reportChatOrUser(
    churchId: string,
    payload: {
      reporterId: string;
      reporterName: string;
      chatId: string;
      targetMemberId?: string;
      targetName?: string;
      messageId?: string;
      messagePreview?: string;
      reason: string;
    }
  ): Promise<void> {
    if (!churchId) return;
    await firestore()
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('chat_reports')
      .add({
        ...omitUndefined(payload),
        churchId,
        status: 'open',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REALTIME DATABASE PRESENCE & TYPING INDICATORS
  // ───────────────────────────────────────────────────────────────────────────

  setOnlineStatus(churchId: string, memberId: string, online: boolean): void {
    if (!churchId || !memberId) return;
    const db = getRtdbInstance();
    if (!db) return;

    try {
      const ref = db.ref(
        `presence/${sanitizeRtdbKey(churchId)}/${sanitizeRtdbKey(memberId)}`
      );
      if (online) {
        ref
          .onDisconnect()
          .set({ online: false, lastSeen: Date.now() })
          .catch(() => {});
        ref.set({ online: true, lastSeen: Date.now() }).catch(() => {});
      } else {
        ref.set({ online: false, lastSeen: Date.now() }).catch(() => {});
      }
    } catch {
      // Safe fallback when RTDB isn't initialized yet
    }
  }

  subscribeToMemberPresence(
    churchId: string,
    memberId: string,
    onUpdate: (presence: ChatPresence) => void
  ): () => void {
    if (!churchId || !memberId) return () => {};
    const db = getRtdbInstance();
    if (!db) return () => {};

    try {
      const ref = db.ref(
        `presence/${sanitizeRtdbKey(churchId)}/${sanitizeRtdbKey(memberId)}`
      );
      const listener = ref.on('value', (snap: any) => {
        const val = snap?.val?.();
        if (val) {
          onUpdate({
            online: Boolean(val.online),
            lastSeen: typeof val.lastSeen === 'number' ? val.lastSeen : null,
          });
        } else {
          onUpdate({ online: false, lastSeen: null });
        }
      });
      return () => {
        try {
          ref.off('value', listener);
        } catch {}
      };
    } catch {
      return () => {};
    }
  }

  setTypingStatus(
    churchId: string,
    chatId: string,
    memberId: string,
    memberName: string,
    isTyping: boolean
  ): void {
    if (!churchId || !chatId || !memberId) return;
    const db = getRtdbInstance();
    if (!db) return;

    try {
      const ref = db.ref(
        `typing/${sanitizeRtdbKey(churchId)}/${sanitizeRtdbKey(chatId)}/${sanitizeRtdbKey(memberId)}`
      );
      if (isTyping) {
        ref.onDisconnect().remove().catch(() => {});
        ref.set({ name: memberName || 'Member', updatedAt: Date.now() }).catch(() => {});
      } else {
        ref.remove().catch(() => {});
      }
    } catch {}
  }

  subscribeToTypingUsers(
    churchId: string,
    chatId: string,
    myIds: string[],
    onUpdate: (typingNames: string[]) => void
  ): () => void {
    if (!churchId || !chatId) return () => {};
    const db = getRtdbInstance();
    if (!db) return () => {};

    const myCleanIds = new Set(myIds.map(sanitizeRtdbKey));
    try {
      const ref = db.ref(
        `typing/${sanitizeRtdbKey(churchId)}/${sanitizeRtdbKey(chatId)}`
      );
      const listener = ref.on('value', (snap: any) => {
        const val = snap?.val?.() || {};
        const now = Date.now();
        const names: string[] = [];
        Object.entries(val).forEach(([uidKey, entry]: [string, any]) => {
          if (myCleanIds.has(uidKey)) return;
          if (entry && typeof entry.updatedAt === 'number' && now - entry.updatedAt < 6500) {
            names.push(entry.name || 'Someone');
          }
        });
        onUpdate(names);
      });
      return () => {
        try {
          ref.off('value', listener);
        } catch {}
      };
    } catch {
      return () => {};
    }
  }
}

export default new ChatService();

