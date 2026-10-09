import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic.
 */
export const pushMeetingLive = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
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
            url: meeting.meetingLink || meeting.meetingUrl || '',
            password: meeting.password || '',
        },
        topic: `church_${churchId}`,
    };
    try {
        const response = await getMessaging().send(payload);
        console.log('Successfully sent meeting creation notification:', response);
    }
    catch (error) {
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
    if (!snap)
        return;
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
                    memberName = mSnap.data().name;
                }
                else {
                    const uSnap = await db.collection('users').doc(memberId).get();
                    if (uSnap.exists && (uSnap.data()?.name || uSnap.data()?.displayName)) {
                        memberName = uSnap.data().name || uSnap.data().displayName;
                    }
                }
            }
            catch (err) {
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
    const adminTokens = [];
    const adminUids = [];
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
            }
            catch (e) { }
        }
    }
    catch (lookupErr) {
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
        }
        catch (pushErr) {
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
    }
    catch (topicErr) {
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
    }
    catch (dbErr) {
        console.error('Error writing in-app notification document:', dbErr);
    }
});
/**
 * 🙏 NOTIFY COMMUNITY OF APPROVED PRAYER REQUEST
 * Triggered when a prayer request is approved (isAnswered becomes true).
 */
export const pushPrayerRequestApproved = onDocumentUpdated('churches/{churchId}/prayerRequests/{prayerId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
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
        }
        catch (error) {
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
                if (!meeting.startTime)
                    continue;
                const startTime = meeting.startTime.toDate();
                const updates = {};
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
                    if (meeting.status !== 'live')
                        updates.status = 'live';
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
                        if (quiz.scheduledNotified)
                            continue;
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
                            await getMessaging().send(payload).catch((e) => console.error('Error sending Quiz Live notification', e));
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
                            }).catch(() => { });
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
                            }).catch(() => { });
                            // Mark quiz as published and notified
                            await quizDoc.ref.update({
                                status: 'published',
                                scheduledNotified: true,
                                updatedAt: FieldValue.serverTimestamp(),
                            }).catch(() => { });
                        }
                    }
                }
                catch (quizErr) {
                    console.error(`Error checking scheduled quizzes for church ${churchId}:`, quizErr);
                }
            }
        }
        // ─── 4. Check Super Admin Daily Bible Quiz Scheduled Notification ───
        try {
            await sendDailyQuizNotificationInternal(false);
        }
        catch (dailySchedErr) {
            console.warn('Notice checking daily quiz schedule in monitorMeetingLive:', dailySchedErr);
        }
    }
    catch (error) {
        console.error('Error in checkOnlineMeetings cron job:', error);
    }
});
/**
 * 🏛️ NOTIFY SUPER ADMINS OF NEW CHURCH REGISTRATION
 * Triggered automatically when a new church document is created in Firestore.
 */
export const pushNewChurchRegistered = onDocumentCreated('churches/{churchId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
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
        const tokens = [];
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
                    priority: 'high',
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
        }
        catch (topicErr) {
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
    }
    catch (error) {
        console.error('❌ Error sending new church super admin notification:', error);
    }
});
/**
 * 📖 NOTIFY CHURCH MEMBERS OF PUBLISHED BIBLE QUIZ
 * Triggered automatically when an Admin creates or publishes a Bible Quiz in Firestore.
 * Dispatches push notification to topic church_{churchId} and multicast tokens.
 */
async function sendBibleQuizPublishNotification(churchId, quizId, quiz) {
    const db = getFirestore();
    const messaging = getMessaging();
    const title = `📖 New Bible Quiz: ${quiz.title || 'Challenge Your Bible Knowledge'}`;
    const details = quiz.book
        ? `${quiz.book}${quiz.chapterStart ? ` (Ch. ${quiz.chapterStart}${quiz.chapterEnd && quiz.chapterEnd !== quiz.chapterStart ? `-${quiz.chapterEnd}` : ''})` : ''}`
        : (quiz.topic || quiz.category || 'Holy Scripture');
    const body = `A new Bible quiz is now live: "${details}". Tap to test your knowledge!`;
    const notificationData = {
        type: 'quiz',
        quizId: String(quizId),
        id: String(quizId),
        relatedId: String(quizId),
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
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        priority: 'max',
                        channelId: 'church_alerts',
                    },
                },
                apns: {
                    headers: { 'apns-priority': '10' },
                    payload: { aps: { sound: 'default', badge: 1 } },
                },
            });
            console.log(`✅ Sent Bible quiz notification to topic: church_${churchId}`);
        }
        catch (topicErr) {
            console.warn(`Error sending quiz notification to topic church_${churchId}:`, topicErr);
        }
    }
    // 2. Also send multicast to registered tokens in users and members
    try {
        const tokenSet = new Set();
        if (churchId && churchId !== 'global') {
            const usersSnap = await db.collection('users').where('primaryChurchId', '==', churchId).get();
            usersSnap.forEach((doc) => {
                const u = doc.data();
                if (u.fcmToken)
                    tokenSet.add(u.fcmToken);
            });
            const membersSnap = await db.collection('churches').doc(churchId).collection('members').get();
            membersSnap.forEach((doc) => {
                const m = doc.data();
                if (m.fcmToken)
                    tokenSet.add(m.fcmToken);
            });
        }
        else {
            const usersSnap = await db.collection('users').limit(500).get();
            usersSnap.forEach((doc) => {
                const u = doc.data();
                if (u.fcmToken)
                    tokenSet.add(u.fcmToken);
            });
        }
        const tokens = Array.from(tokenSet);
        if (tokens.length > 0) {
            const response = await messaging.sendEachForMulticast({
                notification: { title, body },
                data: notificationData,
                tokens,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        priority: 'max',
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
    }
    catch (multicastErr) {
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
        }
        catch (dbErr) {
            console.warn('Error saving quiz in-app notification:', dbErr);
        }
    }
}
export const pushBibleQuizCreated = onDocumentCreated('churches/{churchId}/bibleQuizzes/{quizId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const quiz = snap.data();
    if (quiz?.status !== 'published')
        return;
    const churchId = event.params.churchId;
    const quizId = event.params.quizId;
    await sendBibleQuizPublishNotification(churchId, quizId, quiz);
    try {
        await snap.ref.update({ notificationSent: true });
    }
    catch (e) { }
});
export const pushBibleQuizUpdated = onDocumentUpdated('churches/{churchId}/bibleQuizzes/{quizId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const before = snap.before.data();
    const after = snap.after.data();
    // If status transitioned to 'published' and notification hasn't been sent yet
    if (before?.status !== 'published' && after?.status === 'published' && !after?.notificationSent) {
        const churchId = event.params.churchId;
        const quizId = event.params.quizId;
        await sendBibleQuizPublishNotification(churchId, quizId, after);
        try {
            await snap.after.ref.update({ notificationSent: true });
        }
        catch (e) { }
    }
});
/**
 * 📖 SEND DAILY BIBLE QUIZ NOTIFICATION (Core Engine)
 * Dispatches the daily Bible quiz challenge to church members.
 * Supports:
 * - Direct FCM Multicast to all registered device tokens with sound, max priority, and channelId 'daily_quiz'
 * - FCM Topic broadcast to each active church topic (church_{churchId})
 * - Logging into broadcasts and notifications subcollections for all churches
 * - Idempotency tracking via lastBroadcastDate
 */
export async function sendDailyQuizNotificationInternal(force = false) {
    const db = getFirestore();
    const messaging = getMessaging();
    // 1. Current date and time in IST (Asia/Kolkata)
    const nowIst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dStr = `${nowIst.getFullYear()}-${String(nowIst.getMonth() + 1).padStart(2, '0')}-${String(nowIst.getDate()).padStart(2, '0')}`;
    const nowTime = `${String(nowIst.getHours()).padStart(2, '0')}:${String(nowIst.getMinutes()).padStart(2, '0')}`;
    console.log(`⏰ [DailyQuiz] Checking daily quiz schedule at IST ${nowTime} for date ${dStr} (force=${force})`);
    // 2. Read Super Admin schedule settings from Firestore
    let dailyConfig = null;
    let scheduleDocRef = null;
    try {
        const globalDoc = await db.collection('churches').doc('global').collection('settings').doc('daily_quiz_schedule').get();
        if (globalDoc.exists) {
            dailyConfig = globalDoc.data();
            scheduleDocRef = globalDoc.ref;
        }
        else {
            const rootDoc = await db.collection('settings').doc('daily_quiz_schedule').get();
            if (rootDoc.exists) {
                dailyConfig = rootDoc.data();
                scheduleDocRef = rootDoc.ref;
            }
        }
    }
    catch (err) {
        console.warn('[DailyQuiz] Notice reading daily_quiz_schedule settings:', err);
    }
    // Check if disabled by Super Admin
    if (dailyConfig && dailyConfig.enabled === false && !force) {
        console.log('🔇 [DailyQuiz] Automation is disabled in Super Admin settings.');
        return { success: false, sentCount: 0, message: 'Disabled in Super Admin settings' };
    }
    // Check scheduled time (default: 06:00 AM)
    const targetTime = dailyConfig?.time24 || dailyConfig?.scheduledTime || '06:00';
    if (!force) {
        if (dailyConfig?.lastBroadcastDate === dStr) {
            console.log(`ℹ️ [DailyQuiz] Already broadcasted today (${dStr}).`);
            return { success: true, sentCount: 0, message: 'Already sent today' };
        }
        if (nowTime < targetTime) {
            console.log(`⏳ [DailyQuiz] Current time ${nowTime} is before scheduled time ${targetTime}. Waiting for scheduled time.`);
            return { success: false, sentCount: 0, message: `Scheduled for ${targetTime}` };
        }
    }
    const pushTitle = dailyConfig?.customTitle || '📖 Daily Bible Quiz is Live!';
    const pushBody = dailyConfig?.customBody || `Today's Scripture challenge (${dStr}) is ready. Test your knowledge and reflect on God's Word!`;
    const quizId = `daily_quiz_${dStr}`;
    const notificationData = {
        type: 'bible_quiz',
        quizId: quizId,
        id: quizId,
        relatedId: quizId,
        scheduledDate: dStr,
        screen: 'BibleQuizDetail',
        churchId: 'global',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
    };
    // 3. Collect registered FCM tokens from users and members
    const tokenSet = new Set();
    try {
        const usersSnap = await db.collection('users').get();
        usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data?.fcmToken && typeof data.fcmToken === 'string' && data.fcmToken.trim().length > 10) {
                tokenSet.add(data.fcmToken.trim());
            }
        });
        const membersSnap = await db.collectionGroup('members').get();
        membersSnap.forEach((doc) => {
            const data = doc.data();
            if (data?.fcmToken && typeof data.fcmToken === 'string' && data.fcmToken.trim().length > 10) {
                tokenSet.add(data.fcmToken.trim());
            }
        });
    }
    catch (tokenErr) {
        console.warn('[DailyQuiz] Error collecting user tokens:', tokenErr);
    }
    const tokens = Array.from(tokenSet);
    let multicastSuccess = 0;
    let multicastFailed = 0;
    // 4. Send high-priority multicast push to all registered devices (in batches of 500)
    if (tokens.length > 0) {
        for (let i = 0; i < tokens.length; i += 500) {
            const batchTokens = tokens.slice(i, i + 500);
            try {
                const fcmResponse = await messaging.sendEachForMulticast({
                    notification: {
                        title: pushTitle,
                        body: pushBody,
                    },
                    data: notificationData,
                    tokens: batchTokens,
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'daily_quiz',
                        },
                    },
                    apns: {
                        headers: { 'apns-priority': '10' },
                        payload: { aps: { sound: 'default', badge: 1 } },
                    },
                });
                multicastSuccess += fcmResponse.successCount;
                multicastFailed += fcmResponse.failureCount;
            }
            catch (batchErr) {
                console.error('[DailyQuiz] Multicast batch send error:', batchErr);
            }
        }
        console.log(`✅ [DailyQuiz] Multicast push sent: ${multicastSuccess} success, ${multicastFailed} failed.`);
    }
    // 5. Broadcast to each church topic & log in broadcasts/notifications
    try {
        const churchesSnap = await db.collection('churches').get();
        for (const cDoc of churchesSnap.docs) {
            const churchId = cDoc.id;
            if (churchId === 'global')
                continue;
            // Topic broadcast as secondary delivery
            try {
                await messaging.send({
                    notification: { title: pushTitle, body: pushBody },
                    data: notificationData,
                    topic: `church_${churchId}`,
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'daily_quiz',
                        },
                    },
                    apns: {
                        headers: { 'apns-priority': '10' },
                        payload: { aps: { sound: 'default', badge: 1 } },
                    },
                });
            }
            catch (topicErr) {
                // Continue
            }
            // Add to broadcasts collection
            await cDoc.ref.collection('broadcasts').add({
                title: pushTitle,
                content: pushBody,
                type: 'quiz',
                quizId: quizId,
                id: quizId,
                relatedId: quizId,
                screen: 'BibleQuizDetail',
                churchId: churchId,
                silent: true,
                createdAt: FieldValue.serverTimestamp(),
            }).catch(() => { });
            // Add to notifications collection
            await cDoc.ref.collection('notifications').add({
                title: pushTitle,
                body: pushBody,
                type: 'quiz',
                quizId: quizId,
                id: quizId,
                relatedId: quizId,
                screen: 'BibleQuizDetail',
                churchId: churchId,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
            }).catch(() => { });
        }
    }
    catch (churchErr) {
        console.warn('[DailyQuiz] Error broadcasting to churches:', churchErr);
    }
    // 6. Record lastBroadcastDate to prevent duplicate broadcasts today
    try {
        const updatePayload = {
            lastBroadcastDate: dStr,
            lastBroadcastAt: FieldValue.serverTimestamp(),
            lastSuccessCount: multicastSuccess,
        };
        if (scheduleDocRef) {
            await scheduleDocRef.set(updatePayload, { merge: true });
        }
        else {
            await db.collection('churches').doc('global').collection('settings').doc('daily_quiz_schedule').set(updatePayload, { merge: true });
        }
        await db.collection('settings').doc('daily_quiz_schedule').set(updatePayload, { merge: true });
    }
    catch (recordErr) {
        console.warn('[DailyQuiz] Error recording lastBroadcastDate:', recordErr);
    }
    console.log(`🎉 [DailyQuiz] Successfully delivered for ${dStr} (${multicastSuccess} devices reached)`);
    return { success: true, sentCount: multicastSuccess, message: `Delivered to ${multicastSuccess} devices` };
}
/**
 * ⏰ AUTOMATED DAILY BIBLE QUIZ SCHEDULER
 * Scheduled to run every day at 06:00 AM IST (12:30 AM UTC)
 * Automatically delivers the Daily Bible Quiz push notification to members worldwide.
 */
export const automatedDailyQuiz = onSchedule({ schedule: '0 6 * * *', timeZone: 'Asia/Kolkata' }, async (event) => {
    console.log('⏰ Running automatedDailyQuiz 06:00 AM IST scheduler...');
    await sendDailyQuizNotificationInternal(false);
});
/**
 * ⏰ PERIODIC SCHEDULED QUIZ SAFETY NET
 * Runs every 15 minutes between 05:00 AM and 09:00 AM IST
 * Ensures that if Super Admin configured a custom delivery time or a temporary network glitch occurred at 06:00,
 * the daily quiz is automatically delivered as soon as the scheduled time is reached.
 */
export const periodicDailyQuizSafetyNet = onSchedule({ schedule: '*/15 5-9 * * *', timeZone: 'Asia/Kolkata' }, async (event) => {
    await sendDailyQuizNotificationInternal(false);
});
/**
 * 🚀 TRIGGER DAILY QUIZ NOTIFICATION (HTTP / Super Admin Test Endpoint)
 * Invokable endpoint for Super Admin to manually trigger or test the daily quiz push immediately.
 */
export const triggerDailyQuizNotificationHttp = onRequest({ cors: true }, async (req, res) => {
    try {
        const force = req.query.force === 'true' || req.body?.force === true;
        const result = await sendDailyQuizNotificationInternal(force);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
//# sourceMappingURL=notifications.js.map