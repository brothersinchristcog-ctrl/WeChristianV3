import * as functions from 'firebase-functions/v1';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const getDb = () => getFirestore();
const getMsg = () => getMessaging();

/**
 * Helper to get today's DD-MM format for birthdays/anniversaries.
 */
function getTodayMonthDay(): string {
  // Use IST timezone as requested (7 AM IST)
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = istFormatter.formatToParts(now);
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${month}-${day}`; // e.g. "08-13"
}

function getTodayStr(): string {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return istFormatter.format(now); // e.g., "2026-08-13"
}

async function runDailyCelebrationsSweep() {
  const todayStr = getTodayStr();

  // We use the IST date components (m, d) to match
  const today = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = istFormatter.formatToParts(today);
  const m = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  const d = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);

  // Find all churches
  const churchesSnap = await getDb().collection('churches').get();

  for (const churchDoc of churchesSnap.docs) {
    const churchId = churchDoc.id;

    // Fetch all members for this church
    const membersSnap = await getDb().collection('churches').doc(churchId).collection('members').get();

    const celebrantsMap = new Map<string, any>();

    // We use the IST date components (m, d) to match
    const checkDate = (dateStr: any) => {
      if (!dateStr || typeof dateStr !== 'string') return false;
      const dParts = dateStr.split(/[-/]/);
      if (dParts.length < 3) return false;
      const p0 = dParts[0];
      const p1 = dParts[1];
      const p2 = dParts[2];
      if (!p0 || !p1 || !p2) return false;
      
      let month, day;
      if (p0.length === 4) { // YYYY-MM-DD
        month = parseInt(p1, 10);
        day = parseInt(p2, 10);
      } else { // DD-MM-YYYY
        day = parseInt(p0, 10);
        month = parseInt(p1, 10);
      }
      return month === m && day === d;
    };

    membersSnap.forEach((doc: any) => {
      const data = doc.data();
      
      const dobStr = data.dob;
      if (checkDate(dobStr)) {
        celebrantsMap.set(doc.id + '_bday', { id: doc.id + '_bday', memberId: doc.id, data, type: 'Birthday' });
      }
      
      const annivStr = data.anniversaryDate;
      if (checkDate(annivStr)) {
        celebrantsMap.set(doc.id + '_anniv', { id: doc.id + '_anniv', memberId: doc.id, data, type: 'Wedding Anniversary' });
      }

      const bapStr = data.baptismDate;
      if (checkDate(bapStr)) {
        celebrantsMap.set(doc.id + '_bap', { id: doc.id + '_bap', memberId: doc.id, data, type: 'Baptism Anniversary' });
      }
    });

    if (celebrantsMap.size === 0) continue;

    // 1. Create or ensure live_celebrations doc exists for today
    const liveDocRef = getDb().collection('churches').doc(churchId).collection('live_celebrations').doc(todayStr);
    await liveDocRef.set({
      date: todayStr,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Build summary for all members
    const summaryLines: string[] = [];
    const celebrantsList = Array.from(celebrantsMap.values());

    for (const celebrant of celebrantsList) {
      const name = celebrant.data.name || 'A member';
      let emoji = '🎉';
      if (celebrant.type === 'Birthday') emoji = '🎂';
      if (celebrant.type === 'Wedding Anniversary') emoji = '💍';
      if (celebrant.type === 'Baptism Anniversary') emoji = '💧';

      summaryLines.push(`${emoji} ${name} — ${celebrant.type}`);

      // Populate celebrants subcollection for batching
      const fcmTokens = celebrant.data.fcmTokens || [];
      if (celebrant.data.fcmToken) fcmTokens.push(celebrant.data.fcmToken);

      await liveDocRef.collection('celebrants').doc(celebrant.id).set({
        memberId: celebrant.memberId,
        name: name,
        type: celebrant.type,
        fcmTokens: Array.from(new Set(fcmTokens)), // unique
        unnotifiedWishes: 0,
        totalWishes: 0
      }, { merge: true });

      // Send personalized notification to the celebrant
      if (fcmTokens.length > 0) {
        const personalizedPayload = {
          notification: {
            title: `${emoji} Your ${celebrant.type} Celebration is Live!`,
            body: `Your church family is celebrating with you today. ❤️`
          },
          data: {
            type: "LIVE_CELEBRATION",
            screen: "LiveCelebrationsChat",
            actionButton: "JOIN CELEBRATION"
          },
          tokens: Array.from(new Set(fcmTokens)) as string[]
        };
        try {
          await getMsg().sendEachForMulticast(personalizedPayload);
        } catch (e) {
          console.error(`Failed to send personalized notification to ${celebrant.id}`, e);
        }
      }
    }

    // Send Broadcast to all members
    let broadcastBody = '';
    if (celebrantsList.length === 1) {
      broadcastBody = `Today we celebrate ${celebrantsList[0].data.name}'s ${celebrantsList[0].type}! Join us in sending them your wishes and blessings.`;
    } else {
      broadcastBody = summaryLines.join('\n') + '\nLet\'s celebrate our church family together!';
    }

    const broadcastPayload = {
      topic: `church_${churchId}`,
      notification: {
        title: "🎉 Today's Celebrations",
        body: broadcastBody
      },
      data: {
        type: "LIVE_CELEBRATION",
        screen: "LiveCelebrationsChat",
        actionButton: "JOIN LIVE CHAT"
      },
      android: {
        notification: {
          clickAction: "FLUTTER_NOTIFICATION_CLICK"
        }
      }
    };

    try {
      await getMsg().send(broadcastPayload);
    } catch (e) {
      console.error(`Failed to send broadcast for church ${churchId}`, e);
    }
  }
}

export const weCelebrationDailySweepV3 = functions.pubsub.schedule('0 7 * * *').timeZone('Asia/Kolkata').onRun(async (context: any) => {
  await runDailyCelebrationsSweep();
  return null;
});

/**
 * HTTP endpoint so Cloud Scheduler can Force-Run the daily celebrations sweep.
 */
export const triggerMorningCelebrations = onRequest({ cors: true }, async (req, res) => {
  try {
    await runDailyCelebrationsSweep();
    res.status(200).json({ success: true, message: 'Daily celebrations sweep complete.' });
  } catch (e: any) {
    console.error('triggerMorningCelebrations error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * 2. On Wish Created: Increment the unnotified counter
 */
export const weCelebrationWishCreatedTrigger = functions.region('asia-south1').firestore.document('churches/{churchId}/live_celebrations/{dateId}/messages/{msgId}').onCreate(async (snap, context) => {
  const data = snap.data();
  const targetCelebrantId = data.targetCelebrantId;

  if (!targetCelebrantId) return; // Not targeted to a specific celebrant

  const { churchId, dateId } = context.params;

  const celebrantRef = getDb().collection('churches').doc(churchId)
    .collection('live_celebrations').doc(dateId)
    .collection('celebrants').doc(targetCelebrantId);

  // Safely increment counters
  await celebrantRef.set({
    unnotifiedWishes: FieldValue.increment(1),
    totalWishes: FieldValue.increment(1)
  }, { merge: true });
});

export const weCelebrationBatchedWishes = functions.pubsub.schedule('*/10 * * * *').onRun(async (context: any) => {
  await runBatchedWishesSweep();
  return null;
});

/**
 * HTTP endpoint so Cloud Scheduler can Force-Run the batched wishes sweep.
 * Target URL: https://us-central1-wechristian-67f07.cloudfunctions.net/executeBatchedWishes
 */
export const executeBatchedWishes = onRequest({ cors: true }, async (req, res) => {
  try {
    await runBatchedWishesSweep();
    res.status(200).json({ success: true, message: 'Batched wishes sweep complete.' });
  } catch (e: any) {
    console.error('executeBatchedWishes error:', e);
    res.status(500).json({ error: e.message });
  }
});

async function runBatchedWishesSweep() {
  const celebrantsQuery = await getDb().collectionGroup('celebrants')
    .where('unnotifiedWishes', '>', 0)
    .get();

  if (celebrantsQuery.empty) {
    console.log('No celebrants with unnotified wishes.');
    return;
  }

  for (const doc of celebrantsQuery.docs) {
    const data = doc.data();
    let tokens: string[] = data.fcmTokens || [];
    const unnotified = data.unnotifiedWishes || 0;
    const total = data.totalWishes || 0;
    const type = data.type || 'Celebration';
    const celebrantMemberId = data.memberId || doc.id.split('_')[0];

    // Try to get up-to-date FCM tokens from the member document
    if (tokens.length === 0) {
      // Path: churches/{churchId}/live_celebrations/{dateId}/celebrants/{memberId}
      // Parent path gives us the church
      const pathParts = doc.ref.path.split('/');
      // pathParts: ['churches', churchId, 'live_celebrations', dateId, 'celebrants', celebrantId]
      if (pathParts.length >= 6) {
        const churchId = pathParts[1] as string;
        const memberSnap = await getDb()
          .collection('churches').doc(churchId)
          .collection('members').doc(celebrantMemberId)
          .get();
        if (memberSnap.exists) {
          const memberData = memberSnap.data() || {};
          tokens = memberData.fcmTokens || [];
          if (memberData.fcmToken) tokens.push(memberData.fcmToken);
          tokens = Array.from(new Set(tokens)).filter(Boolean);
          // Update the celebrant doc with the live tokens for next time
          await doc.ref.update({ fcmTokens: tokens });
        }
      }
    }

    if (tokens.length === 0 || unnotified === 0) {
      console.log(`Skipping ${celebrantMemberId}: no tokens or no unnotified wishes`);
      continue;
    }

    const title = total === unnotified
      ? `🎉 ${unnotified} New ${unnotified === 1 ? 'Wish' : 'Wishes'} on Your ${type}`
      : `❤️ ${unnotified} More ${unnotified === 1 ? 'Wish' : 'Wishes'} on Your ${type}`;
    const body = total === unnotified
      ? `Your church family is celebrating with you! ❤️`
      : `Your church family is sending you blessings today!`;

    const payload = {
      notification: { title, body },
      data: {
        type: 'LIVE_CELEBRATION',
        screen: 'LiveCelebrationsChat',
        actionButton: 'VIEW WISHES'
      },
      tokens
    };

    try {
      const result = await getMsg().sendEachForMulticast(payload);
      console.log(`Sent to ${celebrantMemberId}: ${result.successCount} success, ${result.failureCount} failed`);
      await doc.ref.update({ unnotifiedWishes: 0 });
    } catch (e) {
      console.error(`Failed to send batch notification for ${doc.id}`, e);
    }
  }
}

