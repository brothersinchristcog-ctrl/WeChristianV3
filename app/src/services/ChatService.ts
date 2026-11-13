import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  ChatLastMessage,
  ChatMemberProfile,
  ChatMessage,
  ChatParticipantSummary,
  ChatPresence,
  ChatReplyPreview,
  ChatThread,
} from '../types/chat';

const CHURCHES_COLLECTION = 'churches';

const sanitizeRtdbKey = (raw: string): string =>
  String(raw || 'unknown').replace(/[.#$\[\]\/]/g, '_');

const normalizePhoneDigits = (phone?: string | null): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Safely obtain React Native Firebase Realtime Database instance.
 * Returns null gracefully if the native module isn't linked yet or RTDB URL isn't configured.
 */
const getRtdbInstance = (): any | null => {
  try {
    const dbMod = require('@react-native-firebase/database');
    const fn = dbMod?.default || dbMod;
    if (typeof fn !== 'function') return null;
    return fn();
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
        if (data.status === 'deleted' || data.archived === true) return;

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

        if (normPhone) {
          const existing = dedupByPhone.get(normPhone);
          // Prefer records whose doc ID matches an Auth uid (`data.uid === docId`)
          if (!existing || (memberUid && docId === memberUid)) {
            dedupByPhone.set(normPhone, profile);
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
        uid: currentUser.uid,
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

