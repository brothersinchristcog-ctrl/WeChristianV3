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

      // ─── 3. Check Scheduled Bible Quizzes (Release & Broadcast at exact scheduled time) ───
      if (churchId && churchId !== 'global') {
        try {
          const quizzesSnapshot = await churchDoc.ref.collection('bibleQuizzes')
            .where('status', '==', 'scheduled')
            .get();

          const nowStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
          const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }); // HH:MM

          for (const quizDoc of quizzesSnapshot.docs) {
            const quiz = quizDoc.data();
            if (quiz.scheduledNotified) continue;

            const qDate = quiz.scheduledDate || '';
            const qTime = quiz.scheduledTime || '00:00';

            // Check if scheduled time has arrived or passed
            if (qDate && (qDate < nowStr || (qDate === nowStr && qTime <= nowTime))) {
              const quizTitle = quiz.title || 'Bible Quiz';
              const pushTitle = `📖 Bible Quiz is Now Live: ${quizTitle}`;
              const pushBody = `The scheduled Bible quiz is now unlocked and available to play! Tap to test your knowledge.`;

              const payload = {
                notification: { title: pushTitle, body: pushBody },
                data: {
                  type: 'quiz',
                  quizId: quizDoc.id,
                  id: quizDoc.id,
                  relatedId: quizDoc.id,
                  screen: 'BibleQuizDetail',
                  churchId: churchId,
                },
                topic: `church_${churchId}`,
              };

              await getMessaging().send(payload).catch((e: any) => console.error('Error sending Quiz Live notification', e));

              // Record in broadcasts so members see in Updates
              await churchDoc.ref.collection('broadcasts').add({
                title: pushTitle,
                content: pushBody,
                type: 'quiz',
                id: quizDoc.id,
                quizId: quizDoc.id,
                relatedId: quizDoc.id,
                screen: 'BibleQuizDetail',
                churchId: churchId,
                silent: true,
                createdAt: FieldValue.serverTimestamp(),
              }).catch(() => {});

              // Record in notifications
              await churchDoc.ref.collection('notifications').add({
                title: pushTitle,
                body: pushBody,
                type: 'quiz',
                id: quizDoc.id,
                quizId: quizDoc.id,
                relatedId: quizDoc.id,
                screen: 'BibleQuizDetail',
                churchId: churchId,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
              }).catch(() => {});

              // Mark quiz as published and notified
              await quizDoc.ref.update({
                status: 'published',
                scheduledNotified: true,
                updatedAt: FieldValue.serverTimestamp(),
              }).catch(() => {});
            }
          }
        } catch (quizErr) {
          console.error(`Error checking scheduled quizzes for church ${churchId}:`, quizErr);
        }
      }
    }

    // ─── 4. Check Super Admin Daily Bible Quiz Scheduled Notification ───
    try {
      const dailyScheduleDoc = await db.collection('churches').doc('global').collection('settings').doc('daily_quiz_schedule').get();
      const dailyConfig = dailyScheduleDoc.exists ? dailyScheduleDoc.data() : null;

      if (dailyConfig && dailyConfig.enabled !== false) {
        const targetTime = dailyConfig.time24 || '06:00';
        const nowStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
        const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }); // HH:MM

        if (dailyConfig.lastBroadcastDate !== nowStr && nowTime >= targetTime) {
          const pushTitle = dailyConfig.customTitle || '📖 Daily Bible Quiz is Live!';
          const pushBody = dailyConfig.customBody || `Today's Scripture challenge (${nowStr}) is ready. Test your knowledge and reflect on God's Word!`;

          const payload = {
            notification: { title: pushTitle, body: pushBody },
            data: {
              type: 'bible_quiz',
              quizId: `daily_quiz_${nowStr}`,
              churchId: 'global',
              scheduledDate: nowStr,
              screen: 'BibleQuizDetail',
            },
            topic: 'church_all',
          };

          await getMessaging().send(payload).catch((e: any) => console.error('Error sending Daily Quiz notification:', e));

          // Also broadcast to each active church topic
          for (const cDoc of churchesSnapshot.docs) {
            if (cDoc.id !== 'global') {
              getMessaging().send({
                ...payload,
                topic: `church_${cDoc.id}`,
              }).catch(() => {});
            }
          }

          // Mark notified for today
          await dailyScheduleDoc.ref.set({
            lastBroadcastDate: nowStr,
            lastBroadcastAt: FieldValue.serverTimestamp(),
          }, { merge: true }).catch(() => {});
        }
      }
    } catch (dailySchedErr) {
      console.warn('Notice checking daily quiz schedule:', dailySchedErr);
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

/**
 * 📖 NOTIFY CHURCH MEMBERS OF PUBLISHED BIBLE QUIZ
 * Triggered automatically when an Admin creates or publishes a Bible Quiz in Firestore.
 * Dispatches push notification to topic church_{churchId} and multicast tokens.
 */
async function sendBibleQuizPublishNotification(churchId: string, quizId: string, quiz: any) {
  const db = getFirestore();
  const messaging = getMessaging();

  const title = `📖 New Bible Quiz: ${quiz.title || 'Challenge Your Bible Knowledge'}`;
  const details = quiz.book
    ? `${quiz.book}${quiz.chapterStart ? ` (Ch. ${quiz.chapterStart}${quiz.chapterEnd && quiz.chapterEnd !== quiz.chapterStart ? `-${quiz.chapterEnd}` : ''})` : ''}`
    : (quiz.topic || quiz.category || 'Holy Scripture');
  const body = `A new Bible quiz is now live: "${details}". Tap to test your knowledge!`;

  const notificationData: Record<string, string> = {
    type: 'quiz',
    quizId: String(quizId),
    id: String(quizId),
    churchId: String(churchId),
    screen: 'BibleQuizDetail',
    click_action: 'FLUTTER_NOTIFICATION_CLICK',
  };

  // 1. Send to church topic (instant broadcast to all members subscribed to this church)
  if (churchId && churchId !== 'global') {
    try {
      await messaging.send({
        notification: { title, body },
        data: notificationData,
        topic: `church_${churchId}`,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            priority: 'max' as const,
            channelId: 'church_alerts',
          },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      console.log(`✅ Sent Bible quiz notification to topic: church_${churchId}`);
    } catch (topicErr) {
      console.warn(`Error sending quiz notification to topic church_${churchId}:`, topicErr);
    }
  }

  // 2. Also send multicast to registered tokens in users and members
  try {
    const tokenSet = new Set<string>();

    if (churchId && churchId !== 'global') {
      const usersSnap = await db.collection('users').where('primaryChurchId', '==', churchId).get();
      usersSnap.forEach((doc: any) => {
        const u = doc.data();
        if (u.fcmToken) tokenSet.add(u.fcmToken);
      });

      const membersSnap = await db.collection('churches').doc(churchId).collection('members').get();
      membersSnap.forEach((doc: any) => {
        const m = doc.data();
        if (m.fcmToken) tokenSet.add(m.fcmToken);
      });
    } else {
      const usersSnap = await db.collection('users').limit(500).get();
      usersSnap.forEach((doc: any) => {
        const u = doc.data();
        if (u.fcmToken) tokenSet.add(u.fcmToken);
      });
    }

    const tokens = Array.from(tokenSet);
    if (tokens.length > 0) {
      const response = await messaging.sendEachForMulticast({
        notification: { title, body },
        data: notificationData,
        tokens,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            priority: 'max' as const,
            channelId: 'church_alerts',
          },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      console.log(`✅ Sent Bible quiz multicast notification to ${response.successCount} devices (${response.failureCount} failed).`);
    }
  } catch (multicastErr) {
    console.error('Error sending multicast quiz notification:', multicastErr);
  }

  // 3. Write in-app notification document
  if (churchId && churchId !== 'global') {
    try {
      await db.collection('churches').doc(churchId).collection('notifications').add({
        type: 'quiz',
        title,
        body,
        quizId,
        quizTitle: quiz.title || '',
        category: quiz.category || '',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (dbErr) {
      console.warn('Error saving quiz in-app notification:', dbErr);
    }
  }
}

export const pushBibleQuizCreated = onDocumentCreated('churches/{churchId}/bibleQuizzes/{quizId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const quiz = snap.data();
  if (quiz?.status !== 'published') return;

  const churchId = event.params.churchId;
  const quizId = event.params.quizId;
  await sendBibleQuizPublishNotification(churchId, quizId, quiz);
  try {
    await snap.ref.update({ notificationSent: true });
  } catch (e) {}
});

export const pushBibleQuizUpdated = onDocumentUpdated('churches/{churchId}/bibleQuizzes/{quizId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const before = snap.before.data();
  const after = snap.after.data();

  // If status transitioned to 'published' and notification hasn't been sent yet
  if (before?.status !== 'published' && after?.status === 'published' && !after?.notificationSent) {
    const churchId = event.params.churchId;
    const quizId = event.params.quizId;
    await sendBibleQuizPublishNotification(churchId, quizId, after);
    try {
      await snap.after.ref.update({ notificationSent: true });
    } catch (e) {}
  }
});

