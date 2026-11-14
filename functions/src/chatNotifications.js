import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
const CHURCHES_COLLECTION = 'churches';
function getMessagePreviewText(msgData) {
    const type = String(msgData?.type || 'text');
    const text = String(msgData?.text || '').trim();
    if (text)
        return text.slice(0, 140);
    if (type === 'image')
        return '📷 Sent a photo';
    if (type === 'video')
        return '🎥 Sent a video';
    if (type === 'audio')
        return '🎤 Sent a voice message';
    if (type === 'document') {
        const fileName = msgData?.media?.fileName;
        return fileName ? `📄 ${fileName}` : '📄 Sent a document';
    }
    return 'New message';
}
const normalizePhoneLast10 = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    return digits.length >= 7 ? digits.slice(-10) : '';
};
const normalizeEmailLower = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    return s.includes('@') ? s : '';
};
/**
 * Resolve every FCM token and identity alias (UID + member doc IDs) for a chat memberId.
 * Falls back across participant hints, linked uid fields, normalized phone numbers, and email
 * so non-UID member docs (e.g. Salesforce/admin-imported contacts) still receive chat pushes.
 */
async function resolveMemberIdentity(db, churchId, memberId, participantHint) {
    const tokens = new Set();
    const aliasIds = new Set();
    const phones = new Set();
    const emails = new Set();
    if (memberId)
        aliasIds.add(memberId);
    const addToken = (val) => {
        if (typeof val === 'string' && val.trim().length > 10) {
            tokens.add(val.trim());
        }
    };
    const addArray = (arr) => {
        if (Array.isArray(arr))
            arr.forEach(addToken);
    };
    const inspectData = (docId, data) => {
        if (docId)
            aliasIds.add(String(docId));
        if (!data)
            return;
        if (typeof data.uid === 'string' && data.uid.trim())
            aliasIds.add(data.uid.trim());
        if (typeof data.memberId === 'string' && data.memberId.trim())
            aliasIds.add(data.memberId.trim());
        addToken(data.fcmToken);
        addArray(data.fcmTokens);
        const ph = normalizePhoneLast10(data.phone || data.mobile || data.phoneNumber);
        if (ph)
            phones.add(ph);
        const em = normalizeEmailLower(data.email);
        if (em)
            emails.add(em);
    };
    if (participantHint) {
        inspectData(memberId, participantHint);
    }
    const candidateIds = Array.from(aliasIds);
    for (const candId of candidateIds) {
        try {
            const memSnap = await db
                .collection(CHURCHES_COLLECTION)
                .doc(churchId)
                .collection('members')
                .doc(candId)
                .get();
            if (memSnap.exists) {
                inspectData(memSnap.id, memSnap.data());
            }
            else {
                const byUid = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(churchId)
                    .collection('members')
                    .where('uid', '==', candId)
                    .limit(3)
                    .get();
                byUid.forEach((doc) => inspectData(doc.id, doc.data()));
            }
        }
        catch { }
        try {
            const userSnap = await db.collection('users').doc(candId).get();
            if (userSnap.exists) {
                inspectData(userSnap.id, userSnap.data());
            }
        }
        catch { }
    }
    // Query any newly discovered linked UIDs not yet checked
    for (const aliasId of Array.from(aliasIds)) {
        if (candidateIds.includes(aliasId))
            continue;
        try {
            const linkedUser = await db.collection('users').doc(aliasId).get();
            if (linkedUser.exists)
                inspectData(linkedUser.id, linkedUser.data());
        }
        catch { }
        try {
            const linkedMem = await db
                .collection(CHURCHES_COLLECTION)
                .doc(churchId)
                .collection('members')
                .doc(aliasId)
                .get();
            if (linkedMem.exists)
                inspectData(linkedMem.id, linkedMem.data());
        }
        catch { }
    }
    // Fallback 1: resolve by normalized phone across church members & global users
    if (tokens.size === 0 && phones.size > 0) {
        try {
            const membersSnap = await db
                .collection(CHURCHES_COLLECTION)
                .doc(churchId)
                .collection('members')
                .get();
            membersSnap.forEach((d) => {
                const dData = d.data() || {};
                const dPhone = normalizePhoneLast10(dData.phone || dData.mobile || dData.phoneNumber);
                if (dPhone && phones.has(dPhone)) {
                    inspectData(d.id, dData);
                }
            });
        }
        catch { }
        // If discovering a linked UID via member doc uncovered tokens/UIDs, check users/{uid}
        for (const aliasId of Array.from(aliasIds)) {
            if (candidateIds.includes(aliasId))
                continue;
            try {
                const uSnap = await db.collection('users').doc(aliasId).get();
                if (uSnap.exists)
                    inspectData(uSnap.id, uSnap.data());
            }
            catch { }
        }
        if (tokens.size === 0) {
            try {
                const usersSnap = await db.collection('users').get();
                usersSnap.forEach((d) => {
                    const dData = d.data() || {};
                    const uPhone = normalizePhoneLast10(dData.phone || dData.mobile || dData.phoneNumber);
                    if (uPhone && phones.has(uPhone)) {
                        inspectData(d.id, dData);
                    }
                });
            }
            catch { }
        }
    }
    // Fallback 2: resolve by email across church members & global users
    if (tokens.size === 0 && emails.size > 0) {
        for (const em of emails) {
            try {
                const mEmailSnap = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(churchId)
                    .collection('members')
                    .where('email', '==', em)
                    .limit(3)
                    .get();
                mEmailSnap.forEach((d) => inspectData(d.id, d.data()));
            }
            catch { }
            try {
                const uEmailSnap = await db
                    .collection('users')
                    .where('email', '==', em)
                    .limit(3)
                    .get();
                uEmailSnap.forEach((d) => inspectData(d.id, d.data()));
            }
            catch { }
        }
    }
    return { tokens: Array.from(tokens), aliasIds };
}
/**
 * Push notification trigger for new messages in church direct & group chats.
 */
export const onChatMessageCreated = onDocumentCreated('churches/{churchId}/chats/{chatId}/messages/{messageId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const { churchId, chatId, messageId } = event.params;
    const msgData = snap.data() || {};
    const msgType = String(msgData.type || 'text');
    if (msgType === 'system')
        return;
    const senderId = String(msgData.senderId || '').trim();
    const senderName = String(msgData.senderName || 'Church Member');
    const db = getFirestore();
    const chatDoc = await db
        .collection(CHURCHES_COLLECTION)
        .doc(churchId)
        .collection('chats')
        .doc(chatId)
        .get();
    if (!chatDoc.exists) {
        console.warn(`[chatPush] Chat doc not found: churches/${churchId}/chats/${chatId}`);
        return;
    }
    const chatData = chatDoc.data() || {};
    const chatType = chatData.type === 'group' ? 'group' : 'direct';
    const participantIds = Array.isArray(chatData.participantIds)
        ? chatData.participantIds
        : [];
    const participantsMap = chatData.participants || {};
    const mutedBy = chatData.mutedBy || {};
    // Collect sender aliases (e.g. if sender's member doc ID differs from auth uid)
    const senderAliases = new Set();
    if (senderId)
        senderAliases.add(senderId);
    const senderHint = participantsMap[senderId];
    if (senderHint?.uid)
        senderAliases.add(String(senderHint.uid));
    if (senderHint?.memberId)
        senderAliases.add(String(senderHint.memberId));
    const initialRecipients = participantIds.filter((id) => {
        if (!id || senderAliases.has(id))
            return false;
        const pHint = participantsMap[id];
        if (pHint?.uid && senderAliases.has(String(pHint.uid)))
            return false;
        if (mutedBy[id] === true)
            return false;
        if (pHint?.uid && mutedBy[String(pHint.uid)] === true)
            return false;
        return true;
    });
    if (initialRecipients.length === 0) {
        console.log(`[chatPush] No unmuted non-sender recipients for chat=${chatId} msg=${messageId}`);
        return;
    }
    const tokenSet = new Set();
    await Promise.all(initialRecipients.map(async (recipientId) => {
        const identity = await resolveMemberIdentity(db, churchId, recipientId, participantsMap[recipientId] || null);
        // Skip if resolved identity actually belongs to the sender or has chat muted under an alias
        const isSenderAlias = Array.from(identity.aliasIds).some((id) => senderAliases.has(id));
        if (isSenderAlias)
            return;
        const isMutedAlias = Array.from(identity.aliasIds).some((id) => mutedBy[id] === true);
        if (isMutedAlias)
            return;
        // Filter out recipients who blocked the sender under any alias
        let isBlocked = false;
        for (const aliasId of identity.aliasIds) {
            try {
                const blockDoc = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(churchId)
                    .collection('chat_blocks')
                    .doc(aliasId)
                    .get();
                if (blockDoc.exists) {
                    const blockedList = blockDoc.data()?.blockedIds || [];
                    if (blockedList.some((b) => senderAliases.has(String(b)))) {
                        isBlocked = true;
                        break;
                    }
                }
            }
            catch { }
        }
        if (isBlocked)
            return;
        identity.tokens.forEach((t) => tokenSet.add(t));
    }));
    const tokens = Array.from(tokenSet);
    if (tokens.length === 0) {
        console.warn(`[chatPush] 0 FCM tokens resolved for church=${churchId} chat=${chatId} recipients=${JSON.stringify(initialRecipients)}`);
        return;
    }
    const groupName = String(chatData.name || 'Church Group');
    const title = chatType === 'group' ? `${groupName}` : senderName;
    const rawPreview = getMessagePreviewText(msgData);
    const body = chatType === 'group' ? `${senderName}: ${rawPreview}` : rawPreview;
    const messaging = getMessaging();
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
        const batchTokens = tokens.slice(i, i + chunkSize);
        const res = await messaging.sendEachForMulticast({
            tokens: batchTokens,
            notification: { title, body },
            data: {
                type: 'chat_message',
                churchId,
                chatId,
                chatType,
                title: chatType === 'group' ? groupName : senderName,
                body,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'church_alerts',
                    sound: 'default',
                    priority: 'max',
                    defaultSound: true,
                    defaultVibrateTimings: true,
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
        console.log(`[chatPush] Sent chat=${chatId} msg=${messageId} tokens=${batchTokens.length} success=${res.successCount} failure=${res.failureCount}`);
        if (res.failureCount > 0) {
            const failedCodes = res.responses
                .filter((r) => !r.success)
                .map((r) => r.error?.code || r.error?.message || 'unknown');
            console.warn(`[chatPush] Multicast failure details: ${JSON.stringify(failedCodes)}`);
        }
    }
});
//# sourceMappingURL=chatNotifications.js.map