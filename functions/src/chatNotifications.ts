import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const CHURCHES_COLLECTION = 'churches';

function getMessagePreviewText(msgData: Record<string, any>): string {
  const type = String(msgData?.type || 'text');
  const text = String(msgData?.text || '').trim();
  if (text) return text.slice(0, 140);
  if (type === 'image') return '📷 Sent a photo';
  if (type === 'video') return '🎥 Sent a video';
  if (type === 'audio') return '🎤 Sent a voice message';
  if (type === 'document') {
    const fileName = msgData?.media?.fileName;
    return fileName ? `📄 ${fileName}` : '📄 Sent a document';
  }
  return 'New message';
}

async function resolveMemberTokens(
  db: ReturnType<typeof getFirestore>,
  churchId: string,
  memberId: string
): Promise<string[]> {
  const tokens = new Set<string>();
  const addToken = (val: unknown) => {
    if (typeof val === 'string' && val.trim().length > 10) {
      tokens.add(val.trim());
    }
  };
  const addArray = (arr: unknown) => {
    if (Array.isArray(arr)) arr.forEach(addToken);
  };

  try {
    const memSnap = await db
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('members')
      .doc(memberId)
      .get();
    if (memSnap.exists) {
      const mData = memSnap.data() || {};
      addToken(mData.fcmToken);
      addArray(mData.fcmTokens);
    }
  } catch {}

  try {
    const userSnap = await db.collection('users').doc(memberId).get();
    if (userSnap.exists) {
      const uData = userSnap.data() || {};
      addToken(uData.fcmToken);
      addArray(uData.fcmTokens);
    }
  } catch {}

  return Array.from(tokens);
}

/**
 * Push notification trigger for new messages in church direct & group chats.
 */
export const onChatMessageCreated = onDocumentCreated(
  'churches/{churchId}/chats/{chatId}/messages/{messageId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { churchId, chatId } = event.params;
    const msgData = snap.data() || {};
    const msgType = String(msgData.type || 'text');
    if (msgType === 'system') return;

    const senderId = String(msgData.senderId || '');
    const senderName = String(msgData.senderName || 'Church Member');

    const db = getFirestore();
    const chatDoc = await db
      .collection(CHURCHES_COLLECTION)
      .doc(churchId)
      .collection('chats')
      .doc(chatId)
      .get();
    if (!chatDoc.exists) return;

    const chatData = chatDoc.data() || {};
    const chatType = chatData.type === 'group' ? 'group' : 'direct';
    const participantIds: string[] = Array.isArray(chatData.participantIds)
      ? chatData.participantIds
      : [];
    const mutedBy: Record<string, any> = chatData.mutedBy || {};

    const recipients = participantIds.filter((id) => {
      if (!id || id === senderId) return false;
      if (mutedBy[id] === true) return false;
      return true;
    });

    if (recipients.length === 0) return;

    // Filter out recipients who blocked the sender
    const unblockedRecipients: string[] = [];
    await Promise.all(
      recipients.map(async (recipientId) => {
        try {
          const blockDoc = await db
            .collection(CHURCHES_COLLECTION)
            .doc(churchId)
            .collection('chat_blocks')
            .doc(recipientId)
            .get();
          const blockedList: string[] = blockDoc.exists
            ? blockDoc.data()?.blockedIds || []
            : [];
          if (!blockedList.includes(senderId)) {
            unblockedRecipients.push(recipientId);
          }
        } catch {
          unblockedRecipients.push(recipientId);
        }
      })
    );

    if (unblockedRecipients.length === 0) return;

    const tokenSet = new Set<string>();
    await Promise.all(
      unblockedRecipients.map(async (recipientId) => {
        const list = await resolveMemberTokens(db, churchId, recipientId);
        list.forEach((t) => tokenSet.add(t));
      })
    );

    const tokens = Array.from(tokenSet);
    if (tokens.length === 0) return;

    const groupName = String(chatData.name || 'Church Group');
    const title = chatType === 'group' ? `${groupName}` : senderName;
    const rawPreview = getMessagePreviewText(msgData);
    const body = chatType === 'group' ? `${senderName}: ${rawPreview}` : rawPreview;

    const messaging = getMessaging();
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const batchTokens = tokens.slice(i, i + chunkSize);
      await messaging.sendEachForMulticast({
        tokens: batchTokens,
        notification: { title, body },
        data: {
          type: 'chat_message',
          churchId,
          chatId,
          chatType,
          title: chatType === 'group' ? groupName : senderName,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'church_updates',
            tag: `chat_${chatId}`,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
    }
  }
);

