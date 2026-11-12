import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic with strict atomic deduplication to prevent 5x duplicates.
 */
export const pushMeetingLive = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const meetingId = event.params.meetingId;
    const churchId = event.params.churchId;
    const db = getFirestore();
    const meetingRef = snap.ref;
    // 1. ATOMIC DEDUPLICATION: Run transaction to ensure notification is sent EXACTLY ONCE
    let shouldSend = false;
    try {
        shouldSend = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(meetingRef);
            if (!freshDoc.exists)
                return false;
            const data = freshDoc.data();
            if (data?.notificationSent === true) {
                return false;
            }
            transaction.update(meetingRef, {
                notificationSent: true,
                notificationSentAt: FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    catch (txErr) {
        console.warn('Transaction error checking notificationSent:', txErr);
        // If transaction fails (e.g. concurrent race), check in-memory data
        if (snap.data()?.notificationSent === true) {
            return;
        }
        shouldSend = true;
    }
    if (!shouldSend) {
        console.log(`🛑 Skipping duplicate meeting push notification for: ${meetingId}`);
        return;
    }
    const meeting = snap.data();
    // Format the start time
    let timeString = '';
    try {
        if (meeting.startTime?.toDate) {
            const startDate = meeting.startTime.toDate();
            timeString = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
        }
    }
    catch (_) { }
    const timeNotice = timeString ? ` for today at ${timeString}` : '';
    const payload = {
        notification: {
            title: `📅 New Online Meeting`,
            body: `${meeting.title || 'An online meeting'} has been scheduled${timeNotice}. Tap to join!`,
        },
        data: {
            type: 'online_meeting',
            meetingId: meetingId,
            churchId: churchId,
            provider: meeting.provider || '',
            url: meeting.meetingLink || meeting.meetingUrl || meeting.url || '',
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
 * 🛡️ DEPRECATED DUPLICATE TRIGGERS:
 * Deployed under old names in Firebase (alertMeetingPush, sendMeetingNotification, sendMeetingPush, meetingPushV1).
 * Replaced with no-ops here so when deployed they will NEVER send duplicate notifications.
 */
export const alertMeetingPush = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async () => {
    console.log('alertMeetingPush is deprecated; handled by pushMeetingLive');
});
export const sendMeetingNotification = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async () => {
    console.log('sendMeetingNotification is deprecated; handled by pushMeetingLive');
});
export const sendMeetingPush = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async () => {
    console.log('sendMeetingPush is deprecated; handled by pushMeetingLive');
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
                            url: meeting.meetingLink || meeting.meetingUrl || meeting.url || '',
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
                            url: meeting.meetingLink || meeting.meetingUrl || meeting.url || '',
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
    // ── ATOMIC EARLY IDEMPOTENCY GUARD ─────────────────────────────────────────
    // Write lastBroadcastDate NOW — before any network I/O — so that any other
    // concurrent scheduler invocation (automatedDailyQuiz / periodicDailyQuizSafetyNet
    // / monitorMeetingLive) that reads Firestore will see today's date and exit early.
    try {
        const earlyLockPayload = { lastBroadcastDate: dStr, lastBroadcastAt: FieldValue.serverTimestamp() };
        if (scheduleDocRef) {
            await scheduleDocRef.set(earlyLockPayload, { merge: true });
        }
        else {
            await db.collection('churches').doc('global').collection('settings').doc('daily_quiz_schedule').set(earlyLockPayload, { merge: true });
        }
        await db.collection('settings').doc('daily_quiz_schedule').set(earlyLockPayload, { merge: true });
        console.log(`🔒 [DailyQuiz] Idempotency lock acquired for ${dStr}. Proceeding with delivery...`);
    }
    catch (lockErr) {
        console.warn('[DailyQuiz] Could not acquire idempotency lock; continuing anyway:', lockErr);
    }
    const dParts = dStr.split('-');
    const displayDateStr = dParts.length === 3 ? `${dParts[2]}-${dParts[1]}-${dParts[0]}` : dStr;
    const pushTitle = dailyConfig?.customTitle || '📖 Daily Bible Quiz is Live!';
    const pushBody = dailyConfig?.customBody || `Today's Scripture challenge (${displayDateStr}) is ready. Test your knowledge and reflect on God's Word!`;
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
    // 5. Log in broadcasts/notifications for each church (silent — push already sent via multicast above)
    // NOTE: Topic broadcast has been intentionally REMOVED to prevent duplicate deliveries.
    // Users subscribed to church_{churchId} topics would receive BOTH the direct multicast push
    // AND the topic push, resulting in 2× (or more) notifications. Delivery is solely via multicast.
    try {
        const churchesSnap = await db.collection('churches').get();
        for (const cDoc of churchesSnap.docs) {
            const churchId = cDoc.id;
            if (churchId === 'global')
                continue;
            // Add to broadcasts collection (silent — no secondary push)
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
        console.warn('[DailyQuiz] Error logging to churches:', churchErr);
    }
    // 6. Update lastBroadcastDate record with final delivery count (lock was already written at Step 0)
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
        console.warn('[DailyQuiz] Error updating lastBroadcastDate record:', recordErr);
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
// ─────────────────────────────────────────────────────────────────────────────
// 📖 DAILY VERSE PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 📖 AUTOMATED DAILY VERSE MULTICAST PUSH (English & Telugu)
 * Determines the current slot (Morning, Afternoon, Evening, Night) or uses slotOverride.
 * Queries today's verse and dispatches FCM push notifications.
 */
export async function sendDailyVersePushInternal(slotOverride, targetChurchId = 'default', force = false) {
    if (getApps().length === 0) {
        initializeApp();
    }
    const db = getFirestore();
    const messaging = getMessaging();
    const PERIOD_SLOTS = {
        Morning: {
            index: 0,
            title: "✝️ Good Morning",
            titleEn: "✝️ Good Morning",
            titleTe: "✝️ శుభోదయం",
        },
        Afternoon: {
            index: 1,
            title: "✝️ Good Afternoon",
            titleEn: "✝️ Good Afternoon",
            titleTe: "✝️ శుభ మధ్యాహ్నం",
        },
        Evening: {
            index: 2,
            title: "✝️ Good Evening",
            titleEn: "✝️ Good Evening",
            titleTe: "✝️ శుభ సాయంత్రం",
        },
        Night: {
            index: 3,
            title: "✝️ Good Night",
            titleEn: "✝️ Good Night",
            titleTe: "✝️ శుభరాత్రి",
        },
    };
    const nowIst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    let slot = slotOverride;
    if (!slot || !PERIOD_SLOTS[slot]) {
        const hour = nowIst.getHours();
        if (hour >= 5 && hour < 12)
            slot = 'Morning';
        else if (hour >= 12 && hour < 17)
            slot = 'Afternoon';
        else if (hour >= 17 && hour < 21)
            slot = 'Evening';
        else
            slot = 'Night';
    }
    const slotInfo = PERIOD_SLOTS[slot] || PERIOD_SLOTS.Morning;
    const todayStr = `${nowIst.getFullYear()}-${String(nowIst.getMonth() + 1).padStart(2, '0')}-${String(nowIst.getDate()).padStart(2, '0')}`;
    const slotLockKey = `${todayStr}_${slot}`;
    if (!force) {
        const lockRef = db.collection('churches').doc(targetChurchId).collection('settings').doc('daily_verse_lock');
        let lockAcquired = false;
        try {
            lockAcquired = await db.runTransaction(async (transaction) => {
                const lockSnap = await transaction.get(lockRef);
                if (lockSnap.exists) {
                    const lockData = lockSnap.data() || {};
                    if (lockData.lastSlotKey === slotLockKey)
                        return false;
                }
                transaction.set(lockRef, {
                    lastSlotKey: slotLockKey, slot, date: todayStr,
                    dispatchedAt: FieldValue.serverTimestamp(), targetChurchId,
                }, { merge: true });
                return true;
            });
        }
        catch (_) {
            return { success: true, message: `Concurrency contention for slot ${slotLockKey}, skipping.`, skipped: true };
        }
        if (!lockAcquired) {
            return { success: true, message: `Daily verse already dispatched for slot ${slotLockKey}. Skipped.`, skipped: true };
        }
    }
    let totalVerses = 5863;
    let epochStr = '2024-01-01';
    try {
        const metaDoc = await db.collection('daily_verses_meta').doc('metadata').get();
        if (metaDoc.exists) {
            const mData = metaDoc.data() || {};
            if (mData.totalVerses)
                totalVerses = mData.totalVerses;
        }
    }
    catch (_) { }
    // Synchronized with VerseNotificationService: local calendar day difference from 2024-01-01
    const epochDate = new Date(Date.UTC(2024, 0, 1));
    const localDate = new Date(Date.UTC(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate()));
    const daysSinceEpoch = Math.floor((localDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
    const todayIndices = [
        (daysSinceEpoch * 4 + 0) % totalVerses,
        (daysSinceEpoch * 4 + 1) % totalVerses,
        (daysSinceEpoch * 4 + 2) % totalVerses,
        (daysSinceEpoch * 4 + 3) % totalVerses,
    ];
    const targetIndex = (todayIndices[slotInfo.index] !== undefined ? todayIndices[slotInfo.index] : todayIndices[0]) ?? 0;
    let verseDocData = null;
    let verseId = `verse_${targetIndex}`;
    try {
        const directDoc = await db.collection('daily_verses').doc(`verse_${targetIndex}`).get();
        if (directDoc.exists) {
            verseDocData = directDoc.data();
            verseId = directDoc.id;
        }
    }
    catch (_) { }
    if (!verseDocData) {
        try {
            const snap = await db.collection('daily_verses').where('index', '==', targetIndex).get();
            if (!snap.empty) {
                verseDocData = snap.docs[0]?.data();
                verseId = snap.docs[0]?.id || verseId;
            }
        }
        catch (_) { }
    }
    // Fallback to churches collection verse sub-store
    if (!verseDocData) {
        try {
            const churchesSnap = await db.collection('churches').get();
            for (const cDoc of churchesSnap.docs) {
                const vs = await cDoc.ref.collection('daily_verses').where('index', '==', targetIndex).limit(1).get();
                if (!vs.empty) {
                    verseDocData = vs.docs[0]?.data();
                    verseId = vs.docs[0]?.id || verseId;
                    break;
                }
            }
        }
        catch (_) { }
    }
    if (!verseDocData) {
        console.warn(`[sendDailyVersePushInternal] No verse found for index ${targetIndex}`);
        return { success: false, error: `Verse not found for index ${targetIndex}` };
    }
    const verseEnText = (verseDocData.verseEn || verseDocData.english || verseDocData.textEn || '').trim();
    const verseTeText = (verseDocData.verseTe || verseDocData.verse || verseDocData.telugu || verseDocData.textTe || '').trim();
    const refEnText = (verseDocData.referenceEn || verseDocData.refEn || '').trim();
    const refTeText = (verseDocData.referenceTe || verseDocData.reference || verseDocData.refTe || '').trim();
    const cleanVerseTe = verseTeText.replace(/^[\"""'']+|[\"""'']+$/g, '').trim();
    const cleanVerseEn = verseEnText.replace(/^[\"""'']+|[\"""'']+$/g, '').trim();
    const unifiedTitle = slotInfo.title;
    const unifiedBody = cleanVerseEn && refEnText
        ? `"${cleanVerseEn}"\n${refEnText}`
        : (cleanVerseEn || cleanVerseTe);
    // Collect all church tokens (multi-church support)
    const tokenSet = new Set();
    try {
        const churchesSnap = await db.collection('churches').get();
        for (const cDoc of churchesSnap.docs) {
            const membersSnap = await cDoc.ref.collection('members').get();
            membersSnap.forEach((d) => {
                const data = d.data();
                if (data.fcmToken && typeof data.fcmToken === 'string' && data.fcmToken.length > 10)
                    tokenSet.add(data.fcmToken);
                if (Array.isArray(data.fcmTokens)) {
                    data.fcmTokens.forEach((tk) => { if (typeof tk === 'string' && tk.length > 10)
                        tokenSet.add(tk); });
                }
            });
        }
    }
    catch (_) { }
    const tokens = Array.from(tokenSet);
    // Collect active church IDs for topic broadcasts
    const churchIds = [];
    try {
        const snap = await db.collection('churches').get();
        snap.forEach(d => churchIds.push(d.id));
    }
    catch (_) { }
    const verseData = {
        type: 'daily_verse', verseId: String(verseId), period: slot,
        churchId: targetChurchId, title: unifiedTitle, body: unifiedBody,
        verseTe: cleanVerseTe, refTe: refTeText, verseEn: cleanVerseEn, refEn: refEnText,
    };
    // Broadcast to all church topics
    for (const cid of churchIds) {
        try {
            await messaging.send({
                topic: `church_${cid}`,
                notification: { title: unifiedTitle, body: unifiedBody },
                data: { ...verseData, churchId: cid },
                android: {
                    priority: 'high', collapseKey: 'daily_verse',
                    notification: { sound: 'default', priority: 'max', channelId: 'daily_verse', tag: 'daily_verse', defaultSound: true, defaultVibrateTimings: true },
                },
                apns: {
                    headers: { 'apns-priority': '10', 'apns-collapse-id': 'daily_verse' },
                    payload: { aps: { sound: 'default', badge: 1, alert: { title: unifiedTitle, body: unifiedBody } } },
                },
            });
        }
        catch (e) {
            console.warn(`[DailyVerse] Topic broadcast failed for church_${cid}:`, e);
        }
    }
    // Fallback multicast to tokens
    if (tokens.length > 0) {
        for (let i = 0; i < tokens.length; i += 500) {
            try {
                await messaging.sendEachForMulticast({
                    notification: { title: unifiedTitle, body: unifiedBody },
                    data: verseData,
                    tokens: tokens.slice(i, i + 500),
                    android: { priority: 'high', collapseKey: 'daily_verse', notification: { sound: 'default', priority: 'max', channelId: 'daily_verse', tag: 'daily_verse', defaultSound: true, defaultVibrateTimings: true } },
                });
            }
            catch (_) { }
        }
    }
    // Log to broadcasts
    try {
        for (const cid of churchIds) {
            await db.collection('churches').doc(cid).collection('broadcasts').add({
                title: unifiedTitle, content: unifiedBody, date: todayStr,
                type: 'daily_verse', period: slot, verseId, silent: true,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }
    catch (_) { }
    return { success: true, slot, targetIndex, totalTokens: tokens.length };
}
/**
 * ⏰ SCHEDULED DAILY VERSE PUSH
 * Automatically dispatches Daily Verse push notifications 4 times a day.
 */
export const sendDailyVersePushScheduled = onSchedule({
    schedule: '0 6,12,18,21 * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
}, async () => {
    console.log('⏰ [sendDailyVersePushScheduled] Running scheduled Daily Verse push...');
    await sendDailyVersePushInternal();
});
/**
 * 🧪 HTTP endpoint to manually trigger the Daily Verse push
 */
export const triggerDailyVersePushHttp = onRequest({ cors: true, timeoutSeconds: 120, region: 'asia-south1' }, async (req, res) => {
    try {
        const slot = req.query.slot || req.body?.slot;
        const force = req.query.force === 'true' || req.body?.force === true;
        const result = await sendDailyVersePushInternal(slot, 'default', force);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('triggerDailyVersePushHttp error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 🏥 CARE CELL PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 📢 CARE CELL ANNOUNCEMENT PUSH
 */
export const pushCareCellAnnouncement = onDocumentCreated({ document: 'churches/{churchId}/careCellAnnouncements/{announcementId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const announcementId = event.params.announcementId;
    const churchId = event.params.churchId;
    const db = getFirestore();
    const announcementRef = snap.ref;
    const data = snap.data();
    let shouldSend = false;
    try {
        shouldSend = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(announcementRef);
            if (!freshDoc.exists)
                return false;
            if (freshDoc.data()?.notificationSent === true)
                return false;
            transaction.update(announcementRef, { notificationSent: true, notificationSentAt: FieldValue.serverTimestamp() });
            return true;
        });
    }
    catch (txErr) {
        console.warn('Transaction error on careCellAnnouncement:', txErr);
        if (data?.notificationSent === true)
            return;
        shouldSend = true;
    }
    if (!shouldSend)
        return;
    const title = data.title || 'Care Cell Announcement';
    const message = data.message || '';
    const scope = data.scope || 'Cell';
    const cellName = data.cellName || 'Care Cell';
    const messaging = getMessaging();
    const notifTitle = scope === 'All_Cells' ? `📢 Church Notice: ${title}` : `📢 ${cellName}: ${title}`;
    const notifBody = message.length > 120 ? `${message.substring(0, 117)}...` : message;
    const payload = {
        notification: { title: notifTitle, body: notifBody },
        data: { type: 'care_cell_announcement', title: notifTitle, body: notifBody, announcementId: String(announcementId), churchId: String(churchId), cellId: String(data.cellId || ''), scope: String(scope), click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    if (scope === 'All_Cells') {
        try {
            await messaging.send({ ...payload, topic: `church_${churchId}` });
        }
        catch (e) {
            console.error('Care cell announcement topic send failed:', e);
        }
    }
    else {
        try {
            const membershipsSnap = await db.collection('churches').doc(churchId).collection('careCellMemberships').where('cellId', '==', data.cellId).where('membershipStatus', '==', 'Active').get();
            const memberIds = membershipsSnap.docs.map(d => d.data().memberId).filter(Boolean);
            if (memberIds.length === 0)
                return;
            const tokens = [];
            for (const mId of memberIds) {
                try {
                    const memDoc = await db.collection('churches').doc(churchId).collection('members').doc(mId).get();
                    if (memDoc.exists) {
                        const token = memDoc.data()?.fcmToken;
                        if (token && typeof token === 'string' && !tokens.includes(token))
                            tokens.push(token);
                    }
                }
                catch (_) { }
            }
            if (tokens.length > 0)
                await messaging.sendEachForMulticast({ ...payload, tokens });
        }
        catch (err) {
            console.error('Care cell announcement cell-scoped send failed:', err);
        }
    }
});
/**
 * 📅 CARE CELL MEETING PUSH
 */
export const pushCareCellMeeting = onDocumentCreated({ document: 'churches/{churchId}/careCellMeetings/{meetingId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const meetingId = event.params.meetingId;
    const churchId = event.params.churchId;
    const db = getFirestore();
    const meetingRef = snap.ref;
    const data = snap.data();
    let shouldSend = false;
    try {
        shouldSend = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(meetingRef);
            if (!freshDoc.exists)
                return false;
            if (freshDoc.data()?.notificationSent === true)
                return false;
            transaction.update(meetingRef, { notificationSent: true, notificationSentAt: FieldValue.serverTimestamp() });
            return true;
        });
    }
    catch (txErr) {
        if (data?.notificationSent === true)
            return;
        shouldSend = true;
    }
    if (!shouldSend)
        return;
    const cellId = data.cellId;
    if (!cellId)
        return;
    const messaging = getMessaging();
    const meetingDate = data.meetingDate || '';
    const meetingTime = data.meetingTime || '';
    const venue = data.venue || 'Care Cell Location';
    const cellName = data.cellName || 'Care Cell';
    const notifTitle = `🙏 ${cellName}: Meeting Scheduled`;
    const notifBody = `Care Cell meeting on ${meetingDate} at ${meetingTime}. Venue: ${venue}. All members are requested to attend.`;
    try {
        const membershipsSnap = await db.collection('churches').doc(churchId).collection('careCellMemberships').where('cellId', '==', cellId).where('membershipStatus', '==', 'Active').get();
        const memberIds = membershipsSnap.docs.map(d => d.data().memberId).filter(Boolean);
        if (memberIds.length === 0)
            return;
        const tokens = [];
        for (const mId of memberIds) {
            try {
                const memDoc = await db.collection('churches').doc(churchId).collection('members').doc(mId).get();
                if (memDoc.exists) {
                    const token = memDoc.data()?.fcmToken;
                    if (token && typeof token === 'string' && !tokens.includes(token))
                        tokens.push(token);
                }
            }
            catch (_) { }
        }
        if (tokens.length > 0) {
            await messaging.sendEachForMulticast({
                notification: { title: notifTitle, body: notifBody },
                data: { type: 'care_cell_meeting', title: notifTitle, body: notifBody, meetingId: String(meetingId), cellId: String(cellId), churchId: String(churchId), meetingDate: String(meetingDate), meetingTime: String(meetingTime), click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } },
                apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                tokens,
            });
        }
    }
    catch (err) {
        console.error('Care cell meeting push failed:', err);
    }
});
/**
 * 🙏 CARE CELL PRAYER REQUEST PUSH
 */
export const pushCareCellPrayerRequest = onDocumentCreated({ document: 'churches/{churchId}/careCellPrayerRequests/{requestId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const requestId = event.params.requestId;
    const churchId = event.params.churchId;
    const db = getFirestore();
    const requestRef = snap.ref;
    const data = snap.data();
    let shouldSend = false;
    try {
        shouldSend = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(requestRef);
            if (!freshDoc.exists)
                return false;
            if (freshDoc.data()?.notificationSent === true)
                return false;
            transaction.update(requestRef, { notificationSent: true, notificationSentAt: FieldValue.serverTimestamp() });
            return true;
        });
    }
    catch (_) {
        if (data?.notificationSent === true)
            return;
        shouldSend = true;
    }
    if (!shouldSend)
        return;
    const cellId = data.cellId;
    if (!cellId)
        return;
    const messaging = getMessaging();
    const memberName = data.memberName || 'A Member';
    const request = data.request || data.prayerRequest || '';
    const cellName = data.cellName || 'Care Cell';
    const notifTitle = `🙏 ${cellName}: New Prayer Request`;
    const notifBody = `${memberName} has shared a prayer request. ${request.substring(0, 80)}${request.length > 80 ? '...' : ''}`;
    try {
        const membershipsSnap = await db.collection('churches').doc(churchId).collection('careCellMemberships').where('cellId', '==', cellId).where('membershipStatus', '==', 'Active').get();
        const memberIds = membershipsSnap.docs.map(d => d.data().memberId).filter(Boolean);
        if (memberIds.length === 0)
            return;
        const tokens = [];
        for (const mId of memberIds) {
            try {
                const memDoc = await db.collection('churches').doc(churchId).collection('members').doc(mId).get();
                if (memDoc.exists) {
                    const token = memDoc.data()?.fcmToken;
                    if (token && typeof token === 'string' && !tokens.includes(token))
                        tokens.push(token);
                }
            }
            catch (_) { }
        }
        if (tokens.length > 0) {
            await messaging.sendEachForMulticast({
                notification: { title: notifTitle, body: notifBody },
                data: { type: 'care_cell_prayer', title: notifTitle, body: notifBody, requestId: String(requestId), cellId: String(cellId), churchId: String(churchId), click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } },
                apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                tokens,
            });
        }
    }
    catch (err) {
        console.error('Care cell prayer request push failed:', err);
    }
});
/**
 * 🏡 CARE CELL PASTORAL VISIT PUSH
 */
export const pushCareCellVisit = onDocumentCreated({ document: 'churches/{churchId}/careCellVisits/{visitId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const visitId = event.params.visitId;
    const churchId = event.params.churchId;
    const db = getFirestore();
    const visitRef = snap.ref;
    const data = snap.data();
    let shouldSend = false;
    try {
        shouldSend = await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(visitRef);
            if (!freshDoc.exists)
                return false;
            if (freshDoc.data()?.pushNotificationSent === true)
                return false;
            transaction.update(visitRef, { pushNotificationSent: true, pushNotificationSentAt: FieldValue.serverTimestamp() });
            return true;
        });
    }
    catch (_) {
        if (data?.pushNotificationSent === true)
            return;
        shouldSend = true;
    }
    if (!shouldSend)
        return;
    const cellId = data.cellId;
    if (!cellId)
        return;
    const messaging = getMessaging();
    const title = data.title || 'Pastoral Care Cell Visit';
    const cellName = data.cellName || 'Care Cell';
    const visitDate = data.visitDate || '';
    const visitTime = data.visitTime || '';
    const visitors = data.visitors || 'Cell Leaders';
    try {
        const membershipsSnap = await db.collection('churches').doc(churchId).collection('careCellMemberships').where('cellId', '==', cellId).where('membershipStatus', '==', 'Active').get();
        const memberIds = membershipsSnap.docs.map(d => d.data().memberId).filter(Boolean);
        if (memberIds.length === 0)
            return;
        const tokens = [];
        for (const mId of memberIds) {
            try {
                const memDoc = await db.collection('churches').doc(churchId).collection('members').doc(mId).get();
                if (memDoc.exists) {
                    const token = memDoc.data()?.fcmToken;
                    if (token && typeof token === 'string' && !tokens.includes(token))
                        tokens.push(token);
                }
            }
            catch (_) { }
        }
        if (tokens.length > 0) {
            const notifTitle = `🏡 ${cellName}: ${title}`;
            const notifBody = `Visit on ${visitDate} at ${visitTime} by ${visitors}. Tap to confirm your availability!`;
            await messaging.sendEachForMulticast({
                notification: { title: notifTitle, body: notifBody },
                data: { type: 'care_cell_visit', title: notifTitle, body: notifBody, visitId: String(visitId), cellId: String(cellId), churchId: String(churchId), visitDate: String(visitDate), visitTime: String(visitTime), click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } },
                apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                tokens,
            });
        }
    }
    catch (err) {
        console.error('Care cell visit push failed:', err);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// ✨ TESTIMONY PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function handleTestimonyAdminCreatedPush(testimony, churchId, testimonyId, snapRef) {
    if (!testimony)
        return;
    const status = testimony.status;
    if (status !== 'Pending Review' && status !== 'Private')
        return;
    const db = getFirestore();
    const messaging = getMessaging();
    const docRef = snapRef || db.collection('churches').doc(churchId).collection('testimonies').doc(testimonyId);
    let lockAcquired = false;
    try {
        lockAcquired = await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            if (snap.data()?.adminPushSent === true)
                return false;
            transaction.update(docRef, { adminPushSent: true, adminPushSentAt: FieldValue.serverTimestamp() });
            return true;
        });
    }
    catch (_) {
        if (testimony.adminPushSent === true)
            return;
    }
    if (!lockAcquired)
        return;
    const title = 'New Testimony Submitted!';
    const body = 'A Member has submitted a new testimony. Please review it.';
    const memberName = (testimony.memberName || 'Church Member').trim();
    const adminTokens = [];
    try {
        const membersSnap = await db.collection('churches').doc(churchId).collection('members').get();
        membersSnap.forEach((doc) => {
            const m = doc.data();
            const role = String(m.userType || m.role || '').toLowerCase();
            if (role.includes('admin') || role.includes('pastor') || role.includes('super')) {
                if (m.fcmToken && typeof m.fcmToken === 'string' && m.fcmToken.trim().length > 10)
                    adminTokens.push(m.fcmToken.trim());
                if (Array.isArray(m.fcmTokens))
                    m.fcmTokens.forEach((tk) => { if (typeof tk === 'string' && tk.trim().length > 10)
                        adminTokens.push(tk.trim()); });
            }
        });
    }
    catch (err) {
        console.error('Error fetching admin tokens for testimony:', err);
    }
    const notificationData = {
        type: 'testimony_admin', churchId, testimonyId,
        screen: 'AdminRoot', targetTab: 'Testimonies', click_action: 'FLUTTER_NOTIFICATION_CLICK', channelId: 'church_alerts',
    };
    const uniqueAdminTokens = Array.from(new Set(adminTokens));
    if (uniqueAdminTokens.length > 0) {
        try {
            await messaging.sendEachForMulticast({
                notification: { title, body }, data: notificationData, tokens: uniqueAdminTokens,
                android: { priority: 'high', notification: { sound: 'default', priority: 'max', channelId: 'church_alerts', defaultSound: true, defaultVibrateTimings: true } },
                apns: { payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } } },
            });
        }
        catch (err) {
            console.error('Error sending testimony admin multicast:', err);
        }
    }
    try {
        await messaging.send({
            notification: { title, body }, data: notificationData, topic: `church_${churchId}_admin`,
            android: { priority: 'high', notification: { sound: 'default', priority: 'max', channelId: 'church_alerts', defaultSound: true, defaultVibrateTimings: true } },
            apns: { payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } } },
        });
    }
    catch (err) {
        console.error('Error sending testimony to admin topic:', err);
    }
    try {
        const notifPayload = {
            type: 'testimony_admin', targetRole: 'admin', title, body,
            content: `${memberName} submitted a new testimony: "${testimony.title || 'Untitled'}". Please review it.`,
            memberName, testimonyId, relatedId: testimonyId, churchId, privacy: testimony.privacy || 'Public',
            read: false, createdAt: FieldValue.serverTimestamp(),
        };
        await db.collection('churches').doc(churchId).collection('broadcasts').add(notifPayload);
        await db.collection('churches').doc(churchId).collection('notifications').add(notifPayload);
    }
    catch (err) {
        console.error('Error writing testimony in-app notification:', err);
    }
}
async function handleTestimonyWorkflowUpdatedPush(before, after, churchId, testimonyId, snapRef) {
    if (!after)
        return;
    const db = getFirestore();
    const messaging = getMessaging();
    const memberName = (after.memberName || 'Church Member').trim();
    const testimonyTitle = (after.title || 'Testimony').trim();
    // Case 0: Resubmitted for review
    if (before?.status !== 'Pending Review' && after.status === 'Pending Review' && after.adminPushSent !== true) {
        await handleTestimonyAdminCreatedPush(after, churchId, testimonyId, snapRef);
    }
    // Case 1: Member status update (Approved/Rejected)
    const statusChanged = before?.status !== after.status;
    if (statusChanged && (after.status === 'Approved' || after.status === 'Rejected') && after.lastMemberNotifiedStatus !== after.status && after.memberId) {
        if (snapRef) {
            try {
                await snapRef.update({ lastMemberNotifiedStatus: after.status, lastMemberNotifiedAt: FieldValue.serverTimestamp() });
            }
            catch (_) { }
        }
        const memberTokens = [];
        try {
            const memberDoc = await db.collection('churches').doc(churchId).collection('members').doc(after.memberId).get();
            if (memberDoc.exists) {
                const mData = memberDoc.data() || {};
                if (mData.fcmToken && typeof mData.fcmToken === 'string' && mData.fcmToken.trim().length > 10)
                    memberTokens.push(mData.fcmToken.trim());
                if (Array.isArray(mData.fcmTokens))
                    mData.fcmTokens.forEach((tk) => { if (typeof tk === 'string' && tk.trim().length > 10)
                        memberTokens.push(tk.trim()); });
            }
        }
        catch (_) { }
        const isApproved = after.status === 'Approved';
        const title = isApproved ? '🎉 Testimony Approved!' : 'Testimony Review Update';
        const body = isApproved
            ? `Your testimony "${testimonyTitle}" has been approved by the church admin.`
            : `Your testimony "${testimonyTitle}" was reviewed.${after.rejectionReason ? ` Note: ${after.rejectionReason}` : ''}`;
        const uniqueTokens = Array.from(new Set(memberTokens));
        if (uniqueTokens.length > 0) {
            try {
                await messaging.sendEachForMulticast({
                    notification: { title, body },
                    data: { type: 'testimony_member_status', churchId, testimonyId, status: after.status, rejectionReason: after.rejectionReason || '', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                    tokens: uniqueTokens,
                    android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } },
                    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                });
            }
            catch (err) {
                console.error('Error sending testimony member status push:', err);
            }
        }
        try {
            const memberBroadcast = {
                type: 'testimony_member_status', targetMemberId: after.memberId, title, body, content: body,
                testimonyId, relatedId: testimonyId, churchId, status: after.status, createdAt: FieldValue.serverTimestamp(),
            };
            await db.collection('churches').doc(churchId).collection('broadcasts').add(memberBroadcast);
            await db.collection('churches').doc(churchId).collection('members').doc(after.memberId).collection('notifications').add(memberBroadcast);
        }
        catch (_) { }
    }
    // Case 2: Published publicly – church-wide broadcast
    const isNewlyPublished = before?.status !== 'Published' && after.status === 'Published' && after.privacy === 'Public' && after.publicationPushSent !== true;
    if (isNewlyPublished) {
        if (snapRef) {
            try {
                await snapRef.update({ publicationPushSent: true, publicationPushSentAt: FieldValue.serverTimestamp() });
            }
            catch (_) { }
        }
        const title = '✨ New Testimony Shared!';
        const body = `${memberName} shared a testimony: "${testimonyTitle}". Tap to watch or read!`;
        const notificationData = {
            type: 'testimony_published', churchId, testimonyId, screen: 'TestimonyDetail', click_action: 'FLUTTER_NOTIFICATION_CLICK',
        };
        try {
            await messaging.send({ notification: { title, body }, data: notificationData, topic: `church_${churchId}`, android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } }, apns: { payload: { aps: { sound: 'default', badge: 1 } } } });
        }
        catch (_) { }
        try {
            const membersSnap = await db.collection('churches').doc(churchId).collection('members').get();
            const allTokens = [];
            membersSnap.forEach((doc) => {
                const d = doc.data();
                if (d.fcmToken && typeof d.fcmToken === 'string' && d.fcmToken.trim().length > 10)
                    allTokens.push(d.fcmToken.trim());
                if (Array.isArray(d.fcmTokens))
                    d.fcmTokens.forEach((tk) => { if (typeof tk === 'string' && tk.trim().length > 10)
                        allTokens.push(tk.trim()); });
            });
            const uniqueTokens = Array.from(new Set(allTokens));
            for (let i = 0; i < uniqueTokens.length; i += 500) {
                await messaging.sendEachForMulticast({ notification: { title, body }, data: notificationData, tokens: uniqueTokens.slice(i, i + 500), android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } }, apns: { payload: { aps: { sound: 'default', badge: 1 } } } });
            }
        }
        catch (_) { }
        try {
            const pubPayload = { type: 'testimony_published', title, body, content: body, testimonyId, relatedId: testimonyId, memberName, churchId, createdAt: FieldValue.serverTimestamp() };
            await db.collection('churches').doc(churchId).collection('broadcasts').add(pubPayload);
        }
        catch (_) { }
    }
}
export const onTestimonyCreatedAdmin = onDocumentCreated({ document: 'churches/{churchId}/testimonies/{testimonyId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    await handleTestimonyAdminCreatedPush(snap.data(), event.params.churchId, event.params.testimonyId, snap.ref);
});
export const onTestimonyUpdatedWorkflow = onDocumentUpdated({ document: 'churches/{churchId}/testimonies/{testimonyId}', region: 'asia-south1' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const snapRef = event.data?.after.ref;
    if (!after)
        return;
    await handleTestimonyWorkflowUpdatedPush(before, after, event.params.churchId, event.params.testimonyId, snapRef);
});
// ─────────────────────────────────────────────────────────────────────────────
// 🤝 VOLUNTEER PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function resolveVolunteerMemberTokens(db, churchId, memberId, memberPhone, memberEmail, memberName, directFcmToken) {
    const tokenSet = new Set();
    const addToken = (t) => { if (typeof t === 'string' && t.trim().length > 10)
        tokenSet.add(t.trim()); };
    const addTokensFromArray = (arr) => { if (Array.isArray(arr))
        arr.forEach(addToken); };
    const extractFromDoc = (docSnap) => { if (docSnap && docSnap.exists) {
        const data = docSnap.data() || {};
        addToken(data.fcmToken);
        addTokensFromArray(data.fcmTokens);
    } };
    const cid = churchId || 'default';
    if (directFcmToken)
        addToken(directFcmToken);
    if (memberId) {
        try {
            extractFromDoc(await db.collection('churches').doc(cid).collection('members').doc(memberId).get());
        }
        catch (_) { }
        try {
            extractFromDoc(await db.collection('users').doc(memberId).get());
        }
        catch (_) { }
    }
    if (tokenSet.size === 0 && memberPhone) {
        const cleanPhone = String(memberPhone).replace(/[^\d+]/g, '');
        const last10 = cleanPhone.slice(-10);
        if (last10.length >= 7) {
            try {
                const snap = await db.collection('churches').doc(cid).collection('members').get();
                snap.forEach(d => { if (String(d.data()?.phone || d.data()?.mobile || '').replace(/[^\d+]/g, '').endsWith(last10))
                    extractFromDoc(d); });
            }
            catch (_) { }
            try {
                const snap = await db.collection('users').get();
                snap.forEach(d => { if (String(d.data()?.phone || d.data()?.mobile || '').replace(/[^\d+]/g, '').endsWith(last10))
                    extractFromDoc(d); });
            }
            catch (_) { }
        }
    }
    if (tokenSet.size === 0 && memberEmail && memberEmail.includes('@')) {
        try {
            (await db.collection('churches').doc(cid).collection('members').where('email', '==', memberEmail.trim().toLowerCase()).limit(2).get()).forEach(d => extractFromDoc(d));
        }
        catch (_) { }
        try {
            (await db.collection('users').where('email', '==', memberEmail.trim().toLowerCase()).limit(2).get()).forEach(d => extractFromDoc(d));
        }
        catch (_) { }
    }
    return Array.from(tokenSet);
}
async function resolveVolunteerAdminTokens(db, churchId) {
    const tokenSet = new Set();
    const adminUidSet = new Set();
    const addToken = (t) => { if (typeof t === 'string' && t.trim().length > 10)
        tokenSet.add(t.trim()); };
    const cid = churchId || 'default';
    const checkMember = (doc) => {
        const m = doc.data() || {};
        const role = String(m.userType || m.role || '').toLowerCase();
        if (role.includes('admin') || role.includes('pastor') || role.includes('super') || role.includes('leader') || Boolean(m.isAdmin) || Boolean(m.isSuperAdmin)) {
            adminUidSet.add(doc.id);
            addToken(m.fcmToken);
            if (Array.isArray(m.fcmTokens))
                m.fcmTokens.forEach(addToken);
        }
    };
    try {
        (await db.collection('churches').doc(cid).collection('members').get()).forEach(checkMember);
    }
    catch (_) { }
    try {
        const cSnap = await db.collection('churches').doc(cid).get();
        if (cSnap.exists) {
            const cData = cSnap.data() || {};
            [cData.adminUid, cData.createdBy, cData.pastorUid, cData.ownerUid, ...(Array.isArray(cData.adminUids) ? cData.adminUids : [])].filter(Boolean).forEach((uid) => adminUidSet.add(uid));
        }
    }
    catch (_) { }
    for (const uid of Array.from(adminUidSet)) {
        try {
            const snap = await db.collection('users').doc(uid).get();
            if (snap.exists) {
                const d = snap.data() || {};
                addToken(d.fcmToken);
                if (Array.isArray(d.fcmTokens))
                    d.fcmTokens.forEach(addToken);
            }
        }
        catch (_) { }
    }
    try {
        (await db.collection('users').get()).forEach(doc => checkMember(doc));
    }
    catch (_) { }
    return { tokens: Array.from(tokenSet), adminUids: Array.from(adminUidSet) };
}
async function sendHighPriorityPush(messaging, tokens, title, body, data, channelId = 'church_alerts') {
    if (!tokens || tokens.length === 0)
        return { successCount: 0, failureCount: 0 };
    const uniqueTokens = Array.from(new Set(tokens.filter(t => typeof t === 'string' && t.trim().length > 10)));
    if (uniqueTokens.length === 0)
        return { successCount: 0, failureCount: 0 };
    let totalSuccess = 0, totalFailure = 0;
    for (let i = 0; i < uniqueTokens.length; i += 500) {
        const chunk = uniqueTokens.slice(i, i + 500);
        try {
            const res = await messaging.sendEachForMulticast({
                notification: { title, body },
                data: { ...data, title, body, channelId, sound: 'default', priority: 'high', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                tokens: chunk,
                android: { priority: 'high', notification: { title, body, sound: 'default', channelId, priority: 'max', defaultSound: true, defaultVibrateTimings: true, visibility: 'public', clickAction: 'FLUTTER_NOTIFICATION_CLICK' } },
                apns: { headers: { 'apns-priority': '10', 'apns-push-type': 'alert' }, payload: { aps: { alert: { title, body }, sound: 'default', badge: 1, contentAvailable: true } } },
            });
            totalSuccess += res.successCount;
            totalFailure += res.failureCount;
        }
        catch (_) {
            totalFailure += chunk.length;
        }
    }
    return { successCount: totalSuccess, failureCount: totalFailure };
}
async function writeVolunteerInAppNotifications(db, churchId, docId, payload, targetMemberIds) {
    const cid = churchId || 'default';
    const docData = { ...payload, churchId: cid, read: false, createdAt: FieldValue.serverTimestamp() };
    const writes = [
        db.collection('churches').doc(cid).collection('notifications').doc(docId).set(docData, { merge: true }),
        db.collection('churches').doc(cid).collection('broadcasts').doc(docId).set({ ...docData, silent: true }, { merge: true }),
    ];
    const memberIds = Array.isArray(targetMemberIds) ? Array.from(new Set(targetMemberIds.map(id => String(id || '').trim()).filter(Boolean))) : targetMemberIds ? [String(targetMemberIds).trim()].filter(Boolean) : [];
    for (const memberId of memberIds) {
        writes.push(db.collection('churches').doc(cid).collection('members').doc(memberId).collection('notifications').doc(docId).set(docData, { merge: true }));
    }
    const results = await Promise.allSettled(writes);
    for (const res of results) {
        if (res.status === 'rejected')
            console.error('Error writing volunteer in-app notification:', res.reason);
    }
}
function computeVolunteerAssignmentKey(data) {
    const raw = [data.assignedRole || '', data.assignedDate || '', data.assignedTimeSlot || '', data.assignedLocation || '', data.assignedResponsibility || ''].join('|');
    let hash = 5381;
    for (let i = 0; i < raw.length; i++)
        hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
    return hash.toString(36);
}
async function handleVolunteerApplicationAdminCreatedPush(appData, churchId, applicationId, snapRef) {
    if (!appData)
        return;
    const db = getFirestore();
    const messaging = getMessaging();
    const cid = churchId || 'default';
    if (appData.adminPushSent === true || appData.adminNotified === true)
        return;
    let memberName = (appData.memberName || '').trim();
    if (!memberName && appData.memberId) {
        try {
            const mDoc = await db.collection('churches').doc(cid).collection('members').doc(appData.memberId).get();
            if (mDoc.exists) {
                const m = mDoc.data();
                memberName = m?.name || m?.displayName || (m?.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : '');
            }
        }
        catch (_) { }
    }
    if (!memberName)
        memberName = 'A Church Member';
    const isEventVolunteer = appData.volunteerType === 'event';
    const eventName = (appData.eventTitle || 'Church Event').trim();
    const title = isEventVolunteer ? '📅 New Event Volunteer Application!' : '📋 New Volunteer Application!';
    const body = isEventVolunteer
        ? `${memberName} has applied to volunteer for ${eventName}. Please review the application.`
        : `${memberName} has submitted a new General Volunteer application. Please review the application.`;
    const { tokens: adminTokens, adminUids } = await resolveVolunteerAdminTokens(db, cid);
    const notificationData = {
        type: 'volunteer_application_admin', churchId: cid, applicationId, requestId: applicationId,
        volunteerType: appData.volunteerType || 'general', eventId: appData.eventId || '',
        eventTitle: isEventVolunteer ? eventName : '', memberName, screen: 'AdminRoot',
        targetTab: 'Volunteer Management', click_action: 'FLUTTER_NOTIFICATION_CLICK',
    };
    if (adminTokens.length > 0)
        await sendHighPriorityPush(messaging, adminTokens, title, body, notificationData, 'church_alerts');
    try {
        await messaging.send({ notification: { title, body }, data: notificationData, topic: `church_${cid}_admin`, android: { priority: 'high', notification: { sound: 'default', channelId: 'church_alerts' } }, apns: { payload: { aps: { sound: 'default', badge: 1 } } } });
    }
    catch (_) { }
    await writeVolunteerInAppNotifications(db, cid, `vol_admin_${applicationId}`, {
        type: 'volunteer_application_admin', targetRole: 'admin', title, body, content: body, memberName,
        volunteerType: appData.volunteerType || 'general', eventId: appData.eventId || '',
        eventTitle: isEventVolunteer ? eventName : '', applicationId, referenceId: applicationId,
        referenceType: isEventVolunteer ? 'event_volunteer' : 'general_volunteer',
    }, adminUids);
    if (snapRef) {
        try {
            await snapRef.update({ adminPushSent: true, adminNotified: true, adminPushSentAt: FieldValue.serverTimestamp() });
        }
        catch (_) { }
    }
}
async function handleVolunteerApplicationWorkflowUpdatedPush(before, after, churchId, applicationId, snapRef) {
    if (!after)
        return;
    const db = getFirestore();
    const messaging = getMessaging();
    const cid = churchId || 'default';
    const isEventVolunteer = after.volunteerType === 'event';
    const eventName = (after.eventTitle || 'the church event').trim();
    const memberId = after.memberId;
    const memberTokens = await resolveVolunteerMemberTokens(db, cid, memberId, after.memberPhone, after.memberEmail, after.memberName, after.memberFcmToken || after.fcmToken);
    const currentStatus = String(after.status || '').toLowerCase().trim();
    const beforeStatus = String(before?.status || '').toLowerCase().trim();
    const isStatusDecision = currentStatus === 'approved' || currentStatus === 'rejected' || currentStatus === 'declined';
    const statusChanged = beforeStatus !== currentStatus;
    const currentAssignmentHash = [after.assignedRole || '', after.assignedDate || '', after.assignedTimeSlot || '', after.assignedLocation || '', after.assignedResponsibility || ''].join('|');
    if (isStatusDecision && after.lastNotifiedStatus !== currentStatus) {
        let title = '', body = '';
        if (currentStatus === 'approved') {
            title = '🎉 Volunteer Application Approved!';
            body = isEventVolunteer ? `Your application for ${eventName} has been approved.${after.assignedRole ? ` Assigned Role: ${after.assignedRole}.` : ''} Please check your event details.` : 'Your volunteer application has been approved. Thank you for your willingness to serve.';
        }
        else {
            title = 'Volunteer Application Update';
            const reasonPart = after.rejectionReason ? ` Reason: ${after.rejectionReason}` : ' Please check your application details.';
            body = isEventVolunteer ? `Your volunteer application for ${eventName} has not been approved.${reasonPart}` : `Your volunteer application has not been approved.${reasonPart}`;
        }
        const notificationData = { type: 'volunteer_application_member', churchId: cid, applicationId, status: currentStatus, volunteerType: after.volunteerType || 'general', eventId: after.eventId || '', eventTitle: isEventVolunteer ? eventName : '', screen: isEventVolunteer && after.eventId ? 'EventDetails' : 'Volunteer', click_action: 'FLUTTER_NOTIFICATION_CLICK' };
        if (memberTokens.length > 0)
            await sendHighPriorityPush(messaging, memberTokens, title, body, notificationData, 'church_alerts');
        if (memberId) {
            await writeVolunteerInAppNotifications(db, cid, `vol_status_${applicationId}_${currentStatus === 'declined' ? 'rejected' : currentStatus}`, {
                type: 'volunteer_application_member', recipientId: memberId, recipientRole: 'member', targetMemberId: memberId,
                targetPhone: after.memberPhone || '', title, body, content: body, status: currentStatus,
                volunteerType: after.volunteerType || 'general', eventId: after.eventId || '', eventTitle: isEventVolunteer ? eventName : '',
                applicationId, referenceId: applicationId, referenceType: isEventVolunteer ? 'event_volunteer' : 'general_volunteer',
            }, memberId);
        }
        if (snapRef) {
            try {
                const p = { lastNotifiedStatus: currentStatus, lastNotifiedStatusAt: FieldValue.serverTimestamp() };
                if (currentStatus === 'approved')
                    p.lastNotifiedAssignmentHash = currentAssignmentHash;
                await snapRef.update(p);
            }
            catch (_) { }
        }
    }
    const beforeAssignmentHash = [before?.assignedRole || '', before?.assignedDate || '', before?.assignedTimeSlot || '', before?.assignedLocation || '', before?.assignedResponsibility || ''].join('|');
    const assignmentChanged = currentStatus === 'approved' && !statusChanged && currentAssignmentHash.trim() !== '||||' && currentAssignmentHash !== beforeAssignmentHash && after.lastNotifiedAssignmentHash !== currentAssignmentHash;
    if (assignmentChanged) {
        const title = '⭐ You Have Been Assigned!';
        const roleText = after.assignedRole ? `as ${after.assignedRole}` : 'a volunteer';
        const body = `You have been assigned ${roleText} for ${eventName}.${after.assignedResponsibility ? ` Duty: ${after.assignedResponsibility}.` : ''} Please check your assignment details.`;
        const notificationData = { type: 'volunteer_assignment', churchId: cid, applicationId, eventId: after.eventId || '', assignedRole: after.assignedRole || '', assignedTimeSlot: after.assignedTimeSlot || '', assignedLocation: after.assignedLocation || '', screen: 'EventDetails', click_action: 'FLUTTER_NOTIFICATION_CLICK' };
        if (memberTokens.length > 0)
            await sendHighPriorityPush(messaging, memberTokens, title, body, notificationData, 'church_alerts');
        if (memberId) {
            const assignKey = computeVolunteerAssignmentKey({ assignedRole: after.assignedRole, assignedDate: after.assignedDate, assignedTimeSlot: after.assignedTimeSlot, assignedLocation: after.assignedLocation, assignedResponsibility: after.assignedResponsibility });
            await writeVolunteerInAppNotifications(db, cid, `vol_assign_${applicationId}_${assignKey}`, { type: 'volunteer_assignment', recipientId: memberId, recipientRole: 'member', targetMemberId: memberId, targetPhone: after.memberPhone || '', title, body, content: body, volunteerType: after.volunteerType || 'event', eventId: after.eventId || '', eventTitle: eventName, applicationId, referenceId: applicationId, referenceType: 'event_volunteer' }, memberId);
        }
        if (snapRef) {
            try {
                await snapRef.update({ lastNotifiedAssignmentHash: currentAssignmentHash, assignedAt: FieldValue.serverTimestamp() });
            }
            catch (_) { }
        }
    }
}
async function handleEventChangesForVolunteersPush(before, after, churchId, eventId) {
    if (!after)
        return;
    const db = getFirestore();
    const messaging = getMessaging();
    const cid = churchId || 'default';
    const isCancelled = !before?.isCancelled && after?.isCancelled === true;
    const dateChanged = before?.date !== after?.date;
    const timeChanged = (before?.time || before?.startTime) !== (after?.time || after?.startTime);
    const locationChanged = before?.location !== after?.location;
    if (!isCancelled && !dateChanged && !timeChanged && !locationChanged)
        return;
    try {
        const volSnap = await db.collection('churches').doc(cid).collection('volunteer_applications').where('eventId', '==', eventId).where('status', '==', 'approved').get();
        if (volSnap.empty)
            return;
        const eventName = (after.title || after.name || 'Church Event').trim();
        let title = '', body = '';
        if (isCancelled) {
            title = `⚠️ Event Cancelled: ${eventName}`;
            body = `The event "${eventName}" has been cancelled. Your volunteer assignment is cancelled. Thank you for your willingness to serve.`;
        }
        else {
            title = `📅 Volunteer Update: ${eventName}`;
            const changeParts = [];
            if (dateChanged && after.date)
                changeParts.push(`Date: ${after.date}`);
            if (timeChanged)
                changeParts.push(`Time: ${after.time || after.startTime}`);
            if (locationChanged && after.location)
                changeParts.push(`Location: ${after.location}`);
            body = `Details for "${eventName}" have changed (${changeParts.join(', ')}). Please check your updated volunteer assignment.`;
        }
        const allTokens = [];
        for (const vDoc of volSnap.docs) {
            const vd = vDoc.data();
            const mTokens = await resolveVolunteerMemberTokens(db, cid, vd.memberId, vd.memberPhone, vd.memberEmail, vd.memberName);
            allTokens.push(...mTokens);
        }
        const uniqueTokens = Array.from(new Set(allTokens));
        if (uniqueTokens.length > 0)
            await sendHighPriorityPush(messaging, uniqueTokens, title, body, { type: 'volunteer_event_change', churchId: cid, eventId, screen: 'EventDetails', isCancelled: String(isCancelled), click_action: 'FLUTTER_NOTIFICATION_CLICK' }, 'church_alerts');
        for (const vDoc of volSnap.docs) {
            const vd = vDoc.data();
            const mId = vd.memberId;
            if (!mId)
                continue;
            await writeVolunteerInAppNotifications(db, cid, `vol_event_${eventId}_${mId}`, { type: 'volunteer_event_change', recipientId: mId, recipientRole: 'member', targetMemberId: mId, targetPhone: vd.memberPhone || '', title, body, content: body, eventId, eventTitle: eventName, referenceId: vDoc.id, referenceType: 'event_volunteer' }, mId);
        }
    }
    catch (err) {
        console.error('Error dispatching event volunteer change pushes:', err);
    }
}
export const onVolunteerApplicationCreated = onDocumentCreated({ document: 'churches/{churchId}/volunteer_applications/{applicationId}', region: 'asia-south1' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    await handleVolunteerApplicationAdminCreatedPush(snap.data(), event.params.churchId, event.params.applicationId, snap.ref);
});
export const onVolunteerApplicationUpdated = onDocumentUpdated({ document: 'churches/{churchId}/volunteer_applications/{applicationId}', region: 'asia-south1' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const snapRef = event.data?.after.ref;
    if (!after)
        return;
    await handleVolunteerApplicationWorkflowUpdatedPush(before, after, event.params.churchId, event.params.applicationId, snapRef);
});
export const onEventUpdatedForVolunteers = onDocumentUpdated({ document: 'churches/{churchId}/events/{eventId}', region: 'asia-south1' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after)
        return;
    await handleEventChangesForVolunteersPush(before, after, event.params.churchId, event.params.eventId);
});
export const scheduledVolunteerReminders = onSchedule({ schedule: '*/30 * * * *', timeZone: 'Asia/Kolkata', region: 'asia-south1' }, async () => {
    const db = getFirestore();
    const messaging = getMessaging();
    const now = new Date();
    try {
        const churchesSnap = await db.collection('churches').get();
        for (const cDoc of churchesSnap.docs) {
            const churchId = cDoc.id;
            const eventsSnap = await db.collection('churches').doc(churchId).collection('events').where('volunteerEnabled', '==', true).get();
            if (eventsSnap.empty)
                continue;
            for (const eDoc of eventsSnap.docs) {
                const ev = eDoc.data();
                if (ev.isCancelled === true)
                    continue;
                const dateStr = ev.date;
                const timeStr = ev.time || ev.startTime || '10:00';
                if (!dateStr)
                    continue;
                let eventTimestamp;
                try {
                    eventTimestamp = new Date(`${dateStr}T${timeStr.includes(':') ? timeStr.split(' ')[0] : '10:00'}:00`).getTime();
                    if (isNaN(eventTimestamp))
                        eventTimestamp = new Date(dateStr).getTime();
                }
                catch (_) {
                    continue;
                }
                const diffHours = (eventTimestamp - now.getTime()) / (1000 * 60 * 60);
                const is24hWindow = diffHours >= 23 && diffHours <= 25;
                const is2hWindow = diffHours >= 1.5 && diffHours <= 2.5;
                if (!is24hWindow && !is2hWindow)
                    continue;
                const volSnap = await db.collection('churches').doc(churchId).collection('volunteer_applications').where('eventId', '==', eDoc.id).where('status', '==', 'approved').get();
                if (volSnap.empty)
                    continue;
                for (const vDoc of volSnap.docs) {
                    const vData = vDoc.data();
                    const remindersSent = vData.remindersSent || {};
                    let shouldSend = false, reminderType = '', title = '', body = '';
                    if (is24hWindow && !remindersSent.h24) {
                        shouldSend = true;
                        reminderType = '24h';
                        title = '⏰ Volunteer Reminder: Tomorrow!';
                        body = `You are scheduled to volunteer for ${ev.title || 'Church Event'} tomorrow. Date: ${dateStr}, Time: ${timeStr}, Role: ${vData.assignedRole || vData.preferredRole || 'Volunteer'}, Location: ${ev.location || 'Church'}.`;
                    }
                    else if (is2hWindow && !remindersSent.h2) {
                        shouldSend = true;
                        reminderType = '2h';
                        title = '🔔 Volunteer Reminder: In 2 Hours!';
                        body = `Reminder: You are scheduled to volunteer for ${ev.title || 'Church Event'} in 2 hours. Role: ${vData.assignedRole || vData.preferredRole || 'Volunteer'}, Location: ${ev.location || 'Church'}.`;
                    }
                    if (!shouldSend)
                        continue;
                    const updateField = reminderType === '24h' ? { 'remindersSent.h24': true, 'remindersSent.h24At': FieldValue.serverTimestamp() } : { 'remindersSent.h2': true, 'remindersSent.h2At': FieldValue.serverTimestamp() };
                    try {
                        await vDoc.ref.update(updateField);
                    }
                    catch (_) { }
                    const memberId = vData.memberId;
                    if (memberId) {
                        const tokens = await resolveVolunteerMemberTokens(db, churchId, memberId, vData.memberPhone, vData.memberEmail, vData.memberName);
                        if (tokens.length > 0)
                            await sendHighPriorityPush(messaging, tokens, title, body, { type: 'volunteer_reminder', churchId, eventId: eDoc.id, screen: 'EventDetails', click_action: 'FLUTTER_NOTIFICATION_CLICK' }, 'church_alerts');
                        await writeVolunteerInAppNotifications(db, churchId, `vol_rem_${reminderType}_${eDoc.id}_${memberId}`, { type: 'volunteer_reminder', recipientId: memberId, recipientRole: 'member', targetMemberId: memberId, targetPhone: vData.memberPhone || '', title, body, content: body, eventId: eDoc.id, eventTitle: ev.title || 'Church Event', referenceId: vDoc.id, referenceType: 'event_volunteer' }, memberId);
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Error in scheduledVolunteerReminders cron:', err);
    }
});
export const triggerVolunteerPushTestHttp = onRequest({ cors: true, region: 'asia-south1' }, async (req, res) => {
    try {
        const db = getFirestore();
        const messaging = getMessaging();
        const action = String(req.query.action || 'admin_test');
        const churchId = String(req.query.churchId || 'default');
        const memberId = String(req.query.memberId || '');
        if (action === 'admin_test') {
            const { tokens, adminUids } = await resolveVolunteerAdminTokens(db, churchId);
            const sendRes = await sendHighPriorityPush(messaging, tokens, '📋 [Test] Volunteer Application Received', 'This is a test notification verifying Church Admin volunteer alert delivery.', { type: 'volunteer_application_admin', churchId, applicationId: 'test_app_id', screen: 'AdminRoot', targetTab: 'Volunteer Management' }, 'church_alerts');
            res.status(200).json({ success: true, action, churchId, adminUids, resolvedTokensCount: tokens.length, result: sendRes });
            return;
        }
        if (action === 'member_test') {
            if (!memberId) {
                res.status(400).json({ success: false, error: 'memberId is required for member_test' });
                return;
            }
            const tokens = await resolveVolunteerMemberTokens(db, churchId, memberId);
            const sendRes = await sendHighPriorityPush(messaging, tokens, '🎉 [Test] Volunteer Application Approved!', 'This is a test notification verifying Member volunteer approval delivery.', { type: 'volunteer_application_member', churchId, applicationId: 'test_app_id', status: 'approved', screen: 'Volunteer' }, 'church_alerts');
            res.status(200).json({ success: true, action, churchId, memberId, resolvedTokensCount: tokens.length, result: sendRes });
            return;
        }
        res.status(400).json({ success: false, error: 'Invalid action.' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err?.message || String(err) });
    }
});
//# sourceMappingURL=notifications.js.map