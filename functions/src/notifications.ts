import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic.
 */
export const pushMeetingLive = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const meeting = snap.data();
  const churchId = event.params.churchId;
  const meetingId = event.params.meetingId;

  // Format the start time
  const startDate = meeting.startTime.toDate();
  const timeString = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const payload = {
    notification: {
      title: `📅 New Online Meeting`,
      body: `${meeting.title} has been scheduled for today at ${timeString}.`,
    },
    data: {
      type: 'online_meeting',
      meetingId: meetingId,
      churchId: churchId,
      provider: meeting.provider || '',
      url: meeting.meetingUrl || '',
    },
    topic: `church_${churchId}`,
  };

  try {
    const response = await getMessaging().send(payload);
    console.log('Successfully sent meeting creation notification:', response);
  } catch (error) {
    console.error('Error sending meeting notification:', error);
  }
});

/**
 * 🙏 MANDATORY NOTIFICATION: ADMIN NOTIFIED OF EVERY PRAYER REQUEST
 * Triggered automatically whenever a member submits a prayer request in Firestore.
 * Always notifies church admins (public or private), clearly showing which specific member submitted it.
 */
export const onPrayerRequestCreatedAdmin = onDocumentCreated('churches/{churchId}/prayerRequests/{prayerId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const prayer = snap.data();
  const churchId = event.params.churchId;
  const prayerId = event.params.prayerId;
  const db = getFirestore();
  const messaging = getMessaging();

  // 1. Identify the specific submitting member's name
  let memberName = (prayer.name || prayer.memberName || prayer.authorName || '').trim();
  
  if (!memberName || memberName.toLowerCase() === 'faithful member' || memberName.toLowerCase() === 'church member') {
    const memberId = prayer.uid || prayer.authorId || prayer.contactId;
    if (memberId) {
      try {
        const mSnap = await db.collection('churches').doc(churchId).collection('members').doc(memberId).get();
        if (mSnap.exists && mSnap.data()?.name) {
          memberName = mSnap.data()!.name;
        } else {
          const uSnap = await db.collection('users').doc(memberId).get();
          if (uSnap.exists && (uSnap.data()?.name || uSnap.data()?.displayName)) {
            memberName = uSnap.data()!.name || uSnap.data()!.displayName;
          }
        }
      } catch (err) {
        console.warn('Could not resolve member name from Firestore:', err);
      }
    }
  }

  if (!memberName) {
    memberName = 'A Church Member';
  }

  // 2. Extract request excerpt
  const rawText = (prayer.request || prayer.text || prayer.requestEn || '').trim();
  const excerpt = rawText.length > 80 ? `${rawText.substring(0, 80)}...` : rawText;

  // 3. Formulate clear notification title and body identifying member and request
  const title = `🙏 New Prayer Request: ${memberName}`;
  const body = excerpt
    ? `${memberName} submitted a prayer request: "${excerpt}"`
    : `${memberName} has submitted a new prayer request. Please review in the Admin Dashboard.`;

  // 4. Query all admins for this church to collect direct device tokens
  const adminTokens: string[] = [];
  const adminUids: string[] = [];

  try {
    const membersSnap = await db.collection('churches').doc(churchId).collection('members').get();
    membersSnap.forEach(doc => {
      const m = doc.data();
      const role = String(m.userType || '').toLowerCase();
      const isAdmin = role.includes('admin') || role.includes('pastor') || role.includes('super');
      if (isAdmin) {
        adminUids.push(doc.id);
        if (m.fcmToken && typeof m.fcmToken === 'string' && m.fcmToken.trim().length > 10) {
          adminTokens.push(m.fcmToken.trim());
        }
      }
    });

    // Also check church doc for direct admin/pastor UIDs
    const churchDoc = await db.collection('churches').doc(churchId).get();
    if (churchDoc.exists) {
      const cData = churchDoc.data();
      const ownerUids = [cData?.adminUid, cData?.createdBy, cData?.pastorUid].filter(Boolean);
      for (const uid of ownerUids) {
        if (!adminUids.includes(uid)) {
          adminUids.push(uid);
        }
      }
    }

    // Check users collection for any admin tokens not captured
    for (const uid of adminUids) {
      try {
        const uSnap = await db.collection('users').doc(uid).get();
        const uData = uSnap.data();
        if (uData?.fcmToken && typeof uData.fcmToken === 'string' && uData.fcmToken.trim().length > 10) {
          const t = uData.fcmToken.trim();
          if (!adminTokens.includes(t)) {
            adminTokens.push(t);
          }
        }
      } catch (e) {}
    }
  } catch (lookupErr) {
    console.error('Error fetching admin tokens for prayer request notification:', lookupErr);
  }

  const notificationData = {
    type: 'prayer_request_admin',
    churchId: churchId,
    prayerId: prayerId,
    memberName: memberName,
    click_action: 'FLUTTER_NOTIFICATION_CLICK',
  };

  // 5. Direct multicast push to admin devices
  const uniqueTokens = Array.from(new Set(adminTokens));
  if (uniqueTokens.length > 0) {
    try {
      const sendRes = await messaging.sendEachForMulticast({
        notification: { title, body },
        data: notificationData,
        tokens: uniqueTokens,
      });
      console.log(`✅ Sent prayer request notification to ${sendRes.successCount} admin devices (${sendRes.failureCount} failed).`);
    } catch (pushErr) {
      console.error('Error sending multicast prayer admin notification:', pushErr);
    }
  }

  // 6. Broadcast to church admin topic church_{churchId}_admin
  try {
    await messaging.send({
      notification: { title, body },
      data: notificationData,
      topic: `church_${churchId}_admin`,
    });
    console.log(`✅ Broadcasted prayer request notification to topic: church_${churchId}_admin`);
  } catch (topicErr) {
    console.error('Error sending to church admin topic:', topicErr);
  }

  // 7. Write in-app notification record to churches/{churchId}/notifications
  try {
    await db.collection('churches').doc(churchId).collection('notifications').add({
      type: 'prayer_request_admin',
      title,
      body,
      memberName: memberName,
      prayerId: prayerId,
      requestExcerpt: excerpt,
      category: prayer.category || '',
      isPublic: prayer.isPublic ?? false,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (dbErr) {
    console.error('Error writing in-app notification document:', dbErr);
  }
});

/**
 * 🙏 NOTIFY COMMUNITY OF APPROVED PRAYER REQUEST
 * Triggered when a prayer request is approved (isAnswered becomes true).
 */
export const pushPrayerRequestApproved = onDocumentUpdated('churches/{churchId}/prayerRequests/{prayerId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const before = snap.before.data();
  const after = snap.after.data();
  const churchId = event.params.churchId;

  // Check if it just became approved AND is public
  if (!before.isAnswered && after.isAnswered && after.isPublic) {
    const payload = {
      notification: {
        title: `🙏 Community Prayer`,
        body: `Please join in prayer for ${after.name || 'a member'}.`,
      },
      data: { type: 'prayer_request_public', churchId: churchId },
      topic: `church_${churchId}`,
    };

    try {
      await getMessaging().send(payload);
    } catch (error) {
      console.error('Error sending prayer community notification:', error);
    }
  }
});

/**
 * ⏱ CHECK ONLINE MEETINGS (CRON JOB)
 * Cron Job: Runs every minute to check if any online meeting is starting now (or within 5 minutes)
 */
export const monitorMeetingLive = onSchedule('* * * * *', async (event) => {
  const db = getFirestore();
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const churchesSnapshot = await db.collection('churches').get();
    
    for (const churchDoc of churchesSnapshot.docs) {
      const churchId = churchDoc.id;
      
      // Query meetings that are scheduled or live
      const meetingsSnapshot = await churchDoc.ref.collection('online_meetings')
        .where('status', 'in', ['scheduled', 'live'])
        .get();

      for (const meetingDoc of meetingsSnapshot.docs) {
        const meeting = meetingDoc.data();
        if (!meeting.startTime) continue;
        
        const startTime = meeting.startTime.toDate();
        const updates: any = {};
        
        // 1. Check for "Live" notification
        if (startTime <= now && !meeting.liveNotified) {
          const payload = {
            notification: {
              title: `🔴 Live Meeting Now`,
              body: `${meeting.title} is now live.`,
            },
            data: {
              type: 'online_meeting',
              meetingId: meetingDoc.id,
              churchId: churchId,
              provider: meeting.provider || '',
              url: meeting.meetingUrl || '',
            },
            topic: `church_${churchId}`,
          };
          
          await getMessaging().send(payload).catch(e => console.error('Error sending Live notification', e));
          
          updates.liveNotified = true;
          if (meeting.status !== 'live') updates.status = 'live';
        }
        
        // 2. Check for "Reminder" notification (5 mins after start)
        if (startTime <= fiveMinsAgo && !meeting.reminderNotified) {
          const payload = {
            notification: {
              title: `🔔 Meeting Reminder`,
              body: `${meeting.title} is still live. Join now to participate.`,
            },
            data: {
              type: 'online_meeting',
              meetingId: meetingDoc.id,
              churchId: churchId,
              provider: meeting.provider || '',
              url: meeting.meetingUrl || '',
            },
            topic: `church_${churchId}`,
          };
          
          await getMessaging().send(payload).catch(e => console.error('Error sending Reminder notification', e));
          
          updates.reminderNotified = true;
        }

        // Apply updates if any notifications were sent
        if (Object.keys(updates).length > 0) {
          await meetingDoc.ref.update(updates);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkOnlineMeetings cron job:', error);
  }
});

/**
 * 🏛️ NOTIFY SUPER ADMINS OF NEW CHURCH REGISTRATION
 * Triggered automatically when a new church document is created in Firestore.
 */
export const pushNewChurchRegistered = onDocumentCreated('churches/{churchId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const church = snap.data();
  const churchId = event.params.churchId;
  const churchName = church.name || 'A New Church';

  const regDate = church.createdAt?.toDate ? church.createdAt.toDate() : new Date();
  const dateFormatted = regDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const timeFormatted = regDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  const dateTimeStr = `${dateFormatted} at ${timeFormatted}`;

  const title = '🏛️ New Church Registered';
  const pastorInfo = church.pastorName || church.adminName ? ` (Pastor: ${church.pastorName || church.adminName})` : '';
  const body = `"${churchName}"${pastorInfo} was registered on ${dateTimeStr}.`;

  const db = getFirestore();
  const messaging = getMessaging();

  try {
    // 1. Query all platform super admins
    const adminsSnapshot = await db.collection('platform_admins').get();
    if (adminsSnapshot.empty) {
      console.log('ℹ️ No platform super admins found in Firestore.');
      return;
    }

    const adminIds = adminsSnapshot.docs.map(d => d.id);
    const tokens: string[] = [];

    for (const adminId of adminIds) {
      const userSnap = await db.collection('users').doc(adminId).get();
      const data = userSnap.data();
      if (data?.fcmToken && typeof data.fcmToken === 'string') {
        tokens.push(data.fcmToken);
      }
    }

    // 2. Multicast push to Super Admin devices
    if (tokens.length > 0) {
      const payload = {
        notification: { title, body },
        data: {
          type: 'new_church',
          churchId,
          churchName,
          registrationDate: dateTimeStr,
        },
        tokens,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'daily_verse',
            sound: 'default',
          },
        },
      };

      const response = await messaging.sendEachForMulticast(payload);
      console.log(`✅ Sent new church notification to ${response.successCount} super admin device(s).`);
    }

    // 3. Also send to topic 'platform_super_admins'
    try {
      await messaging.send({
        topic: 'platform_super_admins',
        notification: { title, body },
        data: {
          type: 'new_church',
          churchId,
          churchName,
          registrationDate: dateTimeStr,
        },
      });
    } catch (topicErr) {
      console.log('ℹ️ Topic broadcast completed or skipped');
    }

    // 4. Log in platform_notifications collection
    await db.collection('platform_notifications').add({
      type: 'new_church',
      title,
      body,
      churchId,
      churchName,
      pastorName: church.pastorName || church.adminName || '',
      registrationDateTime: dateTimeStr,
      createdAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error('❌ Error sending new church super admin notification:', error);
  }
});

