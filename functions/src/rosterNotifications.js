import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const CHURCHES_COLLECTION = 'churches';
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
function formatDateMonthYear(dateStr) {
    if (!dateStr)
        return '';
    try {
        const clean = String(dateStr).trim();
        if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(clean))
            return clean;
        const datePart = clean.split('T')[0] ?? '';
        const parts = datePart.split(/[-/]/);
        if (parts.length === 3) {
            let y = 0;
            let m = -1;
            let d = 0;
            const p0 = parts[0] ?? '';
            const p1 = parts[1] ?? '';
            const p2 = parts[2] ?? '';
            if (p0.length === 4) {
                y = parseInt(p0, 10);
                m = parseInt(p1, 10) - 1;
                d = parseInt(p2, 10);
            }
            else if (p2.length === 4) {
                d = parseInt(p0, 10);
                m = parseInt(p1, 10) - 1;
                y = parseInt(p2, 10);
            }
            if (y > 0 && d > 0 && m >= 0 && m < 12) {
                return `${String(d).padStart(2, '0')} ${MONTH_NAMES[m]} ${y}`;
            }
        }
    }
    catch { }
    return String(dateStr);
}
function formatTimeTo12Hour(timeStr) {
    if (!timeStr)
        return '';
    try {
        const clean = String(timeStr).trim();
        if (/^(1[0-2]|0?[1-9]):[0-5][0-9]\s*(AM|PM)$/i.test(clean)) {
            return clean.toUpperCase();
        }
        const isPM = /pm/i.test(clean);
        const isAM = /am/i.test(clean);
        const parts = clean.replace(/[^\d:]/g, '').split(':').map(Number);
        if (parts.length >= 2) {
            const h = parts[0] || 0;
            const m = parts[1] || 0;
            let period = 'AM';
            if (isPM)
                period = 'PM';
            else if (isAM)
                period = 'AM';
            else
                period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 === 0 ? 12 : h % 12;
            return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
        }
    }
    catch { }
    return String(timeStr);
}
/**
 * 🔍 HELPER: Resolves valid FCM tokens for a member or candidate across:
 * 1. churches/{churchId}/members/{candidateId} (fcmToken, fcmTokens)
 * 2. users/{candidateId}
 * 3. Phone number search in church members
 * 4. Display name search in church members
 */
export async function resolveCandidateFcmTokens(db, churchId, candidateId, candidatePhone, candidateName) {
    const tokens = new Set();
    const addToken = (t) => {
        if (typeof t === 'string' && t.trim().length > 10) {
            tokens.add(t.trim());
        }
    };
    const addTokensFromArray = (arr) => {
        if (Array.isArray(arr)) {
            arr.forEach(t => addToken(t));
        }
    };
    if (!churchId || (!candidateId && !candidatePhone && !candidateName))
        return [];
    // 1. Direct candidateId lookup in churches/{churchId}/members/{candidateId}
    if (candidateId) {
        try {
            const memDoc = await db
                .collection(CHURCHES_COLLECTION)
                .doc(churchId)
                .collection('members')
                .doc(candidateId)
                .get();
            if (memDoc.exists) {
                const data = memDoc.data() || {};
                addToken(data.fcmToken);
                addTokensFromArray(data.fcmTokens);
            }
        }
        catch (e) {
            console.warn(`[RosterNotification] Error resolving memberDoc for ${candidateId}:`, e);
        }
        // Also check global users/{candidateId}
        if (tokens.size === 0) {
            try {
                const userDoc = await db.collection('users').doc(candidateId).get();
                if (userDoc.exists) {
                    const uData = userDoc.data() || {};
                    addToken(uData.fcmToken);
                    addTokensFromArray(uData.fcmTokens);
                }
            }
            catch (_) { }
        }
    }
    // 2. Query church members by phone number if tokens not yet found
    if (tokens.size === 0 && candidatePhone) {
        const cleanPhone = candidatePhone.replace(/[^\d+]/g, '');
        if (cleanPhone.length >= 7) {
            try {
                const mSnap = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(churchId)
                    .collection('members')
                    .where('phone', '==', cleanPhone)
                    .limit(3)
                    .get();
                mSnap.forEach(d => {
                    addToken(d.data()?.fcmToken);
                    addTokensFromArray(d.data()?.fcmTokens);
                });
            }
            catch (_) { }
        }
    }
    // 3. Query members by name if tokens not yet found
    if (tokens.size === 0 && candidateName) {
        const trimmedName = candidateName.trim();
        if (trimmedName.length > 2) {
            try {
                const mSnap = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(churchId)
                    .collection('members')
                    .where('name', '==', trimmedName)
                    .limit(3)
                    .get();
                mSnap.forEach(d => {
                    addToken(d.data()?.fcmToken);
                    addTokensFromArray(d.data()?.fcmTokens);
                });
            }
            catch (_) { }
        }
    }
    return Array.from(tokens);
}
/**
 * 📲 HELPER: Sends assignment push notification & records in-app notification
 */
export async function sendCandidateAssignmentPush(params) {
    const { db, churchId, serviceId, roleId, roleTitle, candidate, candidateIndex, queueRef, timeoutMinutes, isCascade } = params;
    // 1. Fetch parent service details for context
    const serviceDoc = await db
        .collection(CHURCHES_COLLECTION)
        .doc(churchId)
        .collection('servicePlans')
        .doc(serviceId)
        .get();
    const serviceData = serviceDoc.data() || {};
    const serviceTitle = String(serviceData.serviceTitle || 'Worship Service');
    const serviceDate = String(serviceData.date || '');
    const serviceTime = String(serviceData.startTime || '10:00');
    const location = String(serviceData.location || 'Church Sanctuary');
    const timeoutHours = Math.max(1, Math.round(timeoutMinutes / 60));
    const title = isCascade
        ? `Service Assignment Request: ${roleTitle}`
        : `New Service Assignment: ${roleTitle}`;
    const body = `You are requested to serve as ${roleTitle} for "${serviceTitle}" on ${formatDateMonthYear(serviceDate)} at ${formatTimeTo12Hour(serviceTime)} (${location}). Response deadline: ${timeoutHours} hour(s). Tap to Accept or Decline.`;
    // 2. In-app notification payload
    const inAppPayload = {
        type: 'service_assignment',
        title,
        body,
        churchId,
        serviceId,
        roleId,
        roleTitle,
        serviceTitle,
        serviceDate: formatDateMonthYear(serviceDate),
        serviceTime: formatTimeTo12Hour(serviceTime),
        location,
        candidateId: candidate.candidateId,
        candidateName: candidate.candidateName,
        timeoutMinutes,
        status: 'pending',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
    };
    try {
        await db
            .collection(CHURCHES_COLLECTION)
            .doc(churchId)
            .collection('members')
            .doc(candidate.candidateId)
            .collection('notifications')
            .add(inAppPayload);
    }
    catch (e) {
        console.warn(`[RosterNotification] Could not write member in-app notif for ${candidate.candidateName}:`, e);
    }
    try {
        const broadcastRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(churchId)
            .collection('broadcasts')
            .doc(`assign_${serviceId}_${roleId}_${candidate.candidateId}`);
        await broadcastRef.set({
            ...inAppPayload,
            id: `assign_${serviceId}_${roleId}_${candidate.candidateId}`,
            content: body,
            targetMemberId: candidate.candidateId,
            targetPhone: candidate.candidatePhone || null,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    catch (bErr) {
        console.warn(`[RosterNotification] Could not write assignment broadcast for ${candidate.candidateName}:`, bErr);
    }
    // 3. Resolve FCM tokens
    const tokens = await resolveCandidateFcmTokens(db, churchId, candidate.candidateId, candidate.candidatePhone, candidate.candidateName);
    if (tokens.length === 0) {
        console.log(`[RosterNotification] Candidate ${candidate.candidateName} (${candidate.candidateId}) has no registered FCM push token. (In-app notification saved).`);
        // Still mark notification as attempted in queue record
        try {
            const qSnap = await queueRef.get();
            if (qSnap.exists) {
                const qData = qSnap.data() || {};
                const cands = [...(qData.candidates || [])];
                if (cands[candidateIndex]) {
                    cands[candidateIndex] = {
                        ...cands[candidateIndex],
                        notificationSent: true,
                        notifiedAt: new Date().toISOString(),
                        noFcmToken: true,
                    };
                    await queueRef.update({
                        candidates: cands,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
            }
        }
        catch (e) {
            console.warn('[RosterNotification] Could not update queue for noFcmToken:', e);
        }
        return { success: true, tokensCount: 0 };
    }
    // 4. Dispatch FCM push to each device token
    let sentCount = 0;
    let lastError;
    for (const token of tokens) {
        try {
            await getMessaging().send({
                token,
                notification: { title, body },
                data: {
                    type: 'service_assignment',
                    churchId,
                    serviceId,
                    roleId,
                    roleTitle,
                    serviceTitle,
                    serviceDate: formatDateMonthYear(serviceDate),
                    serviceTime: formatTimeTo12Hour(serviceTime),
                    location,
                    candidateId: candidate.candidateId,
                    timeoutHours: String(timeoutHours),
                    click_action: 'OPEN_SERVICE_ASSIGNMENT',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'church_alerts',
                        color: '#1a2d5a',
                        sound: 'default',
                    },
                },
                apns: {
                    headers: {
                        'apns-priority': '10',
                    },
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            });
            sentCount++;
            console.log(`[RosterNotification] Push sent to candidate ${candidate.candidateName} for ${roleTitle} (${token.slice(0, 10)}...)`);
        }
        catch (err) {
            console.error(`[RosterNotification] Push send failed to token for ${candidate.candidateName}:`, err);
            lastError = err?.message || String(err);
        }
    }
    // 5. Update queue document state
    try {
        const qSnap = await queueRef.get();
        if (qSnap.exists) {
            const qData = qSnap.data() || {};
            const cands = [...(qData.candidates || [])];
            if (cands[candidateIndex]) {
                cands[candidateIndex] = {
                    ...cands[candidateIndex],
                    notificationSent: true,
                    notifiedAt: new Date().toISOString(),
                    pushSentCount: sentCount,
                };
                await queueRef.update({
                    candidates: cands,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        }
    }
    catch (e) {
        console.warn('[RosterNotification] Could not update queue candidate state:', e);
    }
    return lastError !== undefined
        ? { success: sentCount > 0, tokensCount: sentCount, error: lastError }
        : { success: sentCount > 0, tokensCount: sentCount };
}
/**
 * 🔔 1. ON SERVICE ASSIGNMENT QUEUE DISPATCHED (Written: Create + Update)
 * Fired whenever an assignment queue document is created or updated in Firestore.
 * Sends targeted push notifications to the active candidate with Accept/Decline options.
 */
export const onServiceAssignmentQueueDispatched = onDocumentWritten({
    document: `${CHURCHES_COLLECTION}/{churchId}/servicePlans/{serviceId}/assignmentQueues/{roleId}`,
    region: 'asia-south1',
}, async (event) => {
    const afterSnap = event.data?.after;
    if (!afterSnap || !afterSnap.exists)
        return;
    const { churchId, serviceId, roleId } = event.params;
    const db = getFirestore();
    const queueRef = afterSnap.ref;
    const queueData = afterSnap.data();
    if (!queueData)
        return;
    if (queueData.status !== 'pending')
        return;
    if (queueData.mode === 'first_come_first_served')
        return; // Handled simultaneously via broadcast dispatcher
    const currentIdx = queueData.currentCandidateIndex || 0;
    const candidates = queueData.candidates || [];
    const activeCandidate = candidates[currentIdx];
    // Only dispatch if active candidate has not yet received push notification
    if (!activeCandidate || activeCandidate.notificationSent === true)
        return;
    console.log(`[RosterNotification] Processing assignment queue push for role "${queueData.roleTitle}" (Candidate: ${activeCandidate.candidateName})`);
    await sendCandidateAssignmentPush({
        db,
        churchId,
        serviceId,
        roleId,
        roleTitle: queueData.roleTitle || 'Ministry Responsibility',
        candidate: activeCandidate,
        candidateIndex: currentIdx,
        queueRef,
        timeoutMinutes: queueData.timeoutMinutes || 120,
        isCascade: currentIdx > 0,
    });
});
/**
 * ⚡ 2. ON SERVICE ASSIGNMENT RESPONDED (CASCADE ADVANCER)
 * Fired when an assignment queue is updated. If the active candidate declined or timed out,
 * this function automatically cascades the request to Candidate 2, Candidate 3, etc.
 */
export const onServiceAssignmentResponded = onDocumentUpdated({
    document: `${CHURCHES_COLLECTION}/{churchId}/servicePlans/{serviceId}/assignmentQueues/{roleId}`,
    region: 'asia-south1',
}, async (event) => {
    const change = event.data;
    if (!change)
        return;
    const afterData = change.after.data();
    const queueRef = change.after.ref;
    const { churchId, serviceId, roleId } = event.params;
    const db = getFirestore();
    const curIdx = afterData.currentCandidateIndex || 0;
    const candidates = afterData.candidates || [];
    const activeCandidate = candidates[curIdx];
    // If already confirmed or exhausted, do nothing
    if (afterData.status === 'confirmed' || afterData.status === 'exhausted')
        return;
    // Check if current candidate has declined or timed out
    if (activeCandidate && (activeCandidate.status === 'declined' || activeCandidate.status === 'timed_out')) {
        const nextIdx = curIdx + 1;
        if (nextIdx < candidates.length) {
            // Cascade to next candidate
            const nextCandidate = candidates[nextIdx];
            const timeoutMinutes = afterData.timeoutMinutes || 120; // 2 hours default
            const deadlineDate = new Date(Date.now() + timeoutMinutes * 60 * 1000);
            await db.runTransaction(async (transaction) => {
                const freshSnap = await transaction.get(queueRef);
                if (!freshSnap.exists)
                    return;
                const freshData = freshSnap.data() || {};
                const freshCands = [...(freshData.candidates || [])];
                if (freshCands[nextIdx]) {
                    freshCands[nextIdx] = {
                        ...freshCands[nextIdx],
                        status: 'pending',
                        requestedAt: new Date().toISOString(),
                        deadline: deadlineDate.toISOString(),
                        notificationSent: false,
                    };
                }
                transaction.update(queueRef, {
                    currentCandidateIndex: nextIdx,
                    status: 'pending',
                    candidates: freshCands,
                    history: FieldValue.arrayUnion({
                        timestamp: new Date().toISOString(),
                        action: `auto_cascade_to_candidate_${nextIdx + 1}`,
                        candidateId: nextCandidate.candidateId,
                        candidateName: nextCandidate.candidateName,
                        details: `Cascaded to Candidate #${nextIdx + 1} (${nextCandidate.candidateName}) after Candidate #${curIdx + 1} ${activeCandidate.status}.`,
                    }),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            });
            console.log(`[RosterNotification] Auto-cascading role "${afterData.roleTitle}" to Candidate #${nextIdx + 1} (${nextCandidate.candidateName})`);
            // Send push notification to the newly activated candidate
            await sendCandidateAssignmentPush({
                db,
                churchId,
                serviceId,
                roleId,
                roleTitle: afterData.roleTitle || 'Ministry Responsibility',
                candidate: nextCandidate,
                candidateIndex: nextIdx,
                queueRef,
                timeoutMinutes,
                isCascade: true,
            });
        }
        else {
            // Queue exhausted! No more candidates left in queue
            await queueRef.update({
                status: 'exhausted',
                history: FieldValue.arrayUnion({
                    timestamp: new Date().toISOString(),
                    action: 'queue_exhausted_all_declined',
                    details: `All ${candidates.length} candidate(s) declined or timed out. Admin manual assignment required.`,
                }),
                updatedAt: FieldValue.serverTimestamp(),
            });
            console.log(`[RosterNotification] Queue exhausted for role ${roleId} in service ${serviceId}. Alerting admins.`);
        }
    }
});
/**
 * ⏰ 3. ASSIGNMENT TIMEOUT CHECKER CRON JOB
 * Dedicated Cloud Scheduler running every 5 minutes.
 * Scans active queues with status == 'pending' and marks candidates as 'timed_out'
 * if their deadline has elapsed, allowing the cascade trigger above to take over.
 */
export const checkServiceAssignmentTimeoutsCron = onSchedule({
    schedule: '*/5 * * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
}, async () => {
    try {
        console.log('[RosterCron] Checking service assignment timeouts...');
        const db = getFirestore();
        const now = new Date();
        const todayIso = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        // Query across all assignmentQueues collectionGroup with direct multi-tenant church fallback
        let queueDocs = [];
        try {
            const activeQueuesSnap = await db
                .collectionGroup('assignmentQueues')
                .where('status', '==', 'pending')
                .get();
            queueDocs = activeQueuesSnap.docs;
        }
        catch (cgErr) {
            console.warn('[RosterCron] collectionGroup on assignmentQueues requires index or failed, falling back to churches scan:', cgErr);
            const churchesSnap = await db.collection(CHURCHES_COLLECTION).get();
            for (const cDoc of churchesSnap.docs) {
                const churchPlansSnap = await cDoc.ref.collection('servicePlans').get();
                for (const planDoc of churchPlansSnap.docs) {
                    const queues = await planDoc.ref.collection('assignmentQueues').where('status', '==', 'pending').get();
                    queueDocs.push(...queues.docs);
                }
            }
        }
        let timedOutCount = 0;
        const planCache = new Map();
        const expiredByService = new Map();
        for (const doc of queueDocs) {
            const data = doc.data();
            // Validate parent service plan exists and is still active/upcoming so deleted or past plans never alert admins
            const planRef = doc.ref.parent.parent;
            if (!planRef)
                continue;
            let cachedPlan = planCache.get(planRef.path);
            if (!cachedPlan) {
                const planSnap = await planRef.get();
                cachedPlan = { exists: planSnap.exists, data: planSnap.data() || {} };
                planCache.set(planRef.path, cachedPlan);
            }
            if (!cachedPlan.exists) {
                // Clean up orphaned subcollection queue left behind after plan deletion
                try {
                    await doc.ref.delete();
                }
                catch (_) { }
                continue;
            }
            const planDateStr = String(cachedPlan.data.date || '').slice(0, 10);
            const isPlanInactive = cachedPlan.data.status !== 'published';
            const isPlanPast = /^\d{4}-\d{2}-\d{2}$/.test(planDateStr) && planDateStr < todayIso;
            if (isPlanInactive || isPlanPast) {
                try {
                    await doc.ref.update({
                        status: 'exhausted',
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                catch (_) { }
                continue;
            }
            // Check First-Come First-Served automated responsibilities
            if (data.mode === 'first_come_first_served') {
                const deadline = data.deadline;
                if (deadline && now > new Date(deadline) && data.status === 'pending' && !data.confirmedCandidateId) {
                    let transitioned = false;
                    try {
                        transitioned = await db.runTransaction(async (tx) => {
                            const freshSnap = await tx.get(doc.ref);
                            if (!freshSnap.exists)
                                return false;
                            const fresh = freshSnap.data() || {};
                            if (fresh.status !== 'pending' || fresh.confirmedCandidateId || fresh.expiryAlertSent === true) {
                                return false;
                            }
                            tx.update(doc.ref, {
                                status: 'exhausted',
                                expiryAlertSent: true,
                                history: FieldValue.arrayUnion({
                                    timestamp: new Date().toISOString(),
                                    action: 'first_come_deadline_expired',
                                    details: 'Response deadline expired with no member bookings. Admin alerted.',
                                }),
                                updatedAt: FieldValue.serverTimestamp(),
                            });
                            return true;
                        });
                    }
                    catch (txErr) {
                        console.warn(`[RosterCron] Transaction failed expiring queue ${doc.id}:`, txErr);
                    }
                    if (transitioned) {
                        console.log(`[RosterCron] First-Come queue ${doc.id} timed out without bookings.`);
                        timedOutCount++;
                        const churchId = String(data.churchId || cachedPlan.data.churchId || planRef.parent.parent?.id || '');
                        if (!churchId)
                            continue;
                        const serviceId = String(data.serviceId || planRef.id);
                        const groupKey = `${churchId}|${serviceId}`;
                        const existingGroup = expiredByService.get(groupKey) || {
                            churchId,
                            serviceId,
                            serviceTitle: String(cachedPlan.data.serviceTitle || 'Worship Service'),
                            serviceDate: planDateStr,
                            roles: [],
                        };
                        existingGroup.roles.push({
                            roleId: String(data.roleId || doc.id),
                            roleTitle: String(data.roleTitle || 'Responsibility'),
                        });
                        expiredByService.set(groupKey, existingGroup);
                    }
                    continue;
                }
            }
            const curIdx = data.currentCandidateIndex || 0;
            const candidates = data.candidates || [];
            const activeCandidate = candidates[curIdx];
            if (activeCandidate && activeCandidate.status === 'pending' && activeCandidate.deadline) {
                const deadlineDate = new Date(activeCandidate.deadline);
                if (now > deadlineDate) {
                    console.log(`[RosterCron] Candidate ${activeCandidate.candidateName} timed out on doc ${doc.id}`);
                    const freshCands = [...candidates];
                    if (freshCands[curIdx]) {
                        freshCands[curIdx] = {
                            ...freshCands[curIdx],
                            status: 'timed_out',
                            timedOutAt: new Date().toISOString(),
                        };
                    }
                    await doc.ref.update({
                        candidates: freshCands,
                        history: FieldValue.arrayUnion({
                            timestamp: new Date().toISOString(),
                            action: `candidate_${curIdx + 1}_timed_out`,
                            candidateId: activeCandidate.candidateId,
                            candidateName: activeCandidate.candidateName,
                        }),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    timedOutCount++;
                }
            }
        }
        // Send one consolidated admin alert per service
        for (const group of expiredByService.values()) {
            const dateLabel = group.serviceDate ? formatDateMonthYear(group.serviceDate) : '';
            const dateSuffix = dateLabel ? ` (${dateLabel})` : '';
            const roleTitles = group.roles.map(r => r.roleTitle);
            const roleKey = group.roles.map(r => r.roleId).sort().join('_').slice(0, 80);
            const firstRoleTitle = roleTitles[0] || 'Responsibility';
            const title = group.roles.length === 1
                ? `⏰ Response Deadline Expired: ${firstRoleTitle}`
                : `⏰ ${group.roles.length} Unfilled Duties: ${group.serviceTitle}`;
            const body = group.roles.length === 1
                ? `No eligible member accepted ${firstRoleTitle} for "${group.serviceTitle}"${dateSuffix} within the response deadline. Tap to assign manually in Service Roster.`
                : `${roleTitles.join(', ')} did not receive an acceptance within the deadline for "${group.serviceTitle}"${dateSuffix}. Tap to assign manually in Service Roster.`;
            await notifyChurchAdmins(db, group.churchId, {
                title,
                body,
                serviceId: group.serviceId,
                roleId: group.roles[0]?.roleId || '',
                serviceTitle: group.serviceTitle,
                serviceDate: group.serviceDate,
                notifId: `admin_roster_expired_${group.serviceId}_${roleKey}`,
            });
        }
        console.log(`[RosterCron] Done checking timeouts. Marked ${timedOutCount} item(s) timed out.`);
    }
    catch (cronErr) {
        console.error('[RosterCron] Error in checkServiceAssignmentTimeoutsCron:', cronErr);
    }
});
/**
 * ⏰ 4. SERVICE ROSTER REMINDERS CRON JOB
 * Dedicated Cloud Scheduler running daily at 08:00 AM IST.
 * Sends 24-hour reminders to all confirmed volunteers for tomorrow's services.
 */
export const sendServiceRosterRemindersCron = onSchedule({
    schedule: '0 8 * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
}, async () => {
    try {
        console.log('[RosterCron] Checking tomorrow service reminders...');
        const db = getFirestore();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0] ?? '';
        let serviceDocs = [];
        try {
            const servicesSnap = await db
                .collectionGroup('servicePlans')
                .where('status', '==', 'published')
                .where('date', '==', tomorrowStr)
                .get();
            serviceDocs = servicesSnap.docs;
        }
        catch (cgErr) {
            console.warn('[RosterCron] collectionGroup on servicePlans requires index or failed, falling back to churches scan:', cgErr);
            const churchesSnap = await db.collection(CHURCHES_COLLECTION).get();
            for (const cDoc of churchesSnap.docs) {
                const plansSnap = await cDoc.ref
                    .collection('servicePlans')
                    .where('status', '==', 'published')
                    .where('date', '==', tomorrowStr)
                    .get();
                serviceDocs.push(...plansSnap.docs);
            }
        }
        for (const sDoc of serviceDocs) {
            const sData = sDoc.data() || {};
            const churchId = String(sData.churchId || sDoc.ref.parent.parent?.id || '');
            if (!churchId)
                continue;
            const queuesSnap = await sDoc.ref.collection('assignmentQueues').where('status', '==', 'confirmed').get();
            for (const qDoc of queuesSnap.docs) {
                const qData = qDoc.data();
                if (qData.confirmedCandidateId) {
                    const tokens = await resolveCandidateFcmTokens(db, churchId, qData.confirmedCandidateId, undefined, qData.confirmedCandidateName);
                    const roleTitle = String(qData.roleTitle || 'Volunteer');
                    const svcTitle = String(sData.serviceTitle || 'Worship Service');
                    const svcTime = String(sData.startTime || '10:00');
                    const title = `Reminder: Serving Tomorrow as ${roleTitle}`;
                    const body = `Service: ${svcTitle} starts tomorrow at ${formatTimeTo12Hour(svcTime)}. Please arrive 30 mins prior for prayer & sound check.`;
                    for (const token of tokens) {
                        try {
                            await getMessaging().send({
                                token,
                                notification: { title, body },
                                data: {
                                    type: 'service_reminder',
                                    churchId,
                                    serviceId: sDoc.id,
                                    roleTitle,
                                    serviceDate: formatDateMonthYear(tomorrowStr),
                                },
                                android: {
                                    priority: 'high',
                                    notification: { channelId: 'church_alerts', color: '#1a2d5a', sound: 'default' },
                                },
                            });
                        }
                        catch (remErr) {
                            console.error(`[RosterCron] Failed sending reminder to ${qData.confirmedCandidateName}:`, remErr);
                        }
                    }
                }
            }
        }
        console.log('[RosterCron] Finished processing service reminders.');
    }
    catch (fatalErr) {
        console.error('[RosterCron] Error in sendServiceRosterRemindersCron:', fatalErr);
    }
});
/**
 * 🌐 5. HTTP TRIGGER TO TEST ROSTER TIMEOUTS
 */
export const triggerCheckRosterTimeoutsHttp = onRequest({ cors: true, region: 'asia-south1' }, async (_req, res) => {
    try {
        const db = getFirestore();
        const snap = await db.collectionGroup('assignmentQueues').where('status', '==', 'pending').get();
        res.json({ success: true, pendingQueuesCount: snap.size });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * 🌐 5B. HTTP TRIGGER TO MANUALLY DISPATCH OR RETRY ASSIGNMENT NOTIFICATION
 */
export const dispatchServiceAssignmentNotificationHttp = onRequest({ cors: true, region: 'asia-south1' }, async (req, res) => {
    try {
        const { churchId, serviceId, roleId } = req.body || req.query;
        if (!churchId || !serviceId || !roleId) {
            res.status(400).json({ error: 'churchId, serviceId, and roleId are required' });
            return;
        }
        const db = getFirestore();
        const targetChurch = String(churchId);
        const queueRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('servicePlans')
            .doc(String(serviceId))
            .collection('assignmentQueues')
            .doc(String(roleId));
        const qSnap = await queueRef.get();
        if (!qSnap.exists) {
            res.status(404).json({ error: 'Assignment queue document not found' });
            return;
        }
        const qData = qSnap.data() || {};
        const curIdx = qData.currentCandidateIndex || 0;
        const candidates = qData.candidates || [];
        const activeCandidate = candidates[curIdx];
        if (!activeCandidate) {
            res.status(400).json({ error: 'No active candidate in assignment queue' });
            return;
        }
        const result = await sendCandidateAssignmentPush({
            db,
            churchId: targetChurch,
            serviceId: String(serviceId),
            roleId: String(roleId),
            roleTitle: qData.roleTitle || 'Ministry Responsibility',
            candidate: activeCandidate,
            candidateIndex: curIdx,
            queueRef,
            timeoutMinutes: qData.timeoutMinutes || 120,
            isCascade: curIdx > 0,
        });
        res.json({ ...result, candidate: activeCandidate.candidateName });
    }
    catch (err) {
        console.error('dispatchServiceAssignmentNotificationHttp error:', err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * 🎶 6. ON SERVICE REHEARSAL CREATED
 * Fired when a rehearsal is scheduled for a worship service.
 * Alerts all invited team members and assigned band musicians via FCM.
 */
export const onServiceRehearsalCreated = onDocumentCreated({
    document: `${CHURCHES_COLLECTION}/{churchId}/servicePlans/{serviceId}/rehearsals/{rehearsalId}`,
    region: 'asia-south1',
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const { churchId, serviceId } = event.params;
    const db = getFirestore();
    const rData = snap.data();
    const rehearsalName = String(rData.rehearsalName || 'Worship Rehearsal');
    const date = String(rData.date || '');
    const startTime = String(rData.startTime || '18:00');
    const location = String(rData.location || 'Church Sanctuary');
    const participantSet = new Set();
    (rData.participantMemberIds || []).forEach((id) => participantSet.add(id));
    // If teams are assigned, include all members of those teams
    const assignedTeamIds = rData.assignedTeamIds || [];
    for (const teamId of assignedTeamIds) {
        try {
            const teamDoc = await db.collection(CHURCHES_COLLECTION).doc(churchId).collection('ministryTeams').doc(teamId).get();
            if (teamDoc.exists) {
                const members = teamDoc.data()?.memberIds || [];
                members.forEach((mId) => participantSet.add(mId));
            }
        }
        catch (err) {
            console.error(`[RosterNotification] Error fetching team ${teamId} members:`, err);
        }
    }
    if (participantSet.size === 0)
        return;
    // Fetch parent service plan for title
    const serviceDoc = await db.collection(CHURCHES_COLLECTION).doc(churchId).collection('servicePlans').doc(serviceId).get();
    const serviceTitle = serviceDoc.data()?.serviceTitle || 'Upcoming Service';
    const title = `Rehearsal Scheduled: ${rehearsalName}`;
    const body = `Practice for "${serviceTitle}" on ${formatDateMonthYear(date)} at ${formatTimeTo12Hour(startTime)} (${location}). Tap to review songs & notes.`;
    for (const memberId of participantSet) {
        try {
            const tokens = await resolveCandidateFcmTokens(db, churchId, memberId);
            for (const token of tokens) {
                await getMessaging().send({
                    token,
                    notification: { title, body },
                    data: {
                        type: 'rehearsal_alert',
                        churchId,
                        serviceId,
                        rehearsalId: event.params.rehearsalId,
                        date: formatDateMonthYear(date),
                        startTime: formatTimeTo12Hour(startTime),
                        location,
                    },
                    android: {
                        priority: 'high',
                        notification: { channelId: 'church_alerts', color: '#1a2d5a' },
                    },
                });
            }
        }
        catch (err) {
            console.error(`[RosterNotification] Failed to alert member ${memberId} for rehearsal:`, err);
        }
    }
    console.log(`[RosterNotification] Dispatched rehearsal alerts to ${participantSet.size} participants.`);
});
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🌟 AUTOMATIC RESPONSIBILITY ASSIGNMENT WORKFLOW (FIRST-COME, FIRST-SERVED)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const ROLE_SKILL_KEYWORDS = {
    role_keyboard: ['keyboard', 'piano', 'pianist', 'keyboardist', 'keys', 'synth'],
    role_drums: ['drum', 'drums', 'drummer', 'percussion', 'percussionist'],
    role_bass: ['bass', 'bassist', 'bass guitar'],
    role_acoustic: ['acoustic', 'acoustic guitar', 'guitarist', 'rhythm guitar'],
    role_electric: ['electric', 'electric guitar', 'lead guitar', 'guitarist'],
    role_sound: ['sound', 'audio', 'sound engineer', 'audio engineer', 'foh', 'media', 'sound technician'],
    role_worship_leader: ['worship leader', 'worship', 'lead vocals', 'singer', 'vocalist', 'vocals'],
};
const CATEGORY_SKILL_KEYWORDS = {
    PRAYER: ['prayer', 'intercession', 'intercessor', 'elder', 'pastor'],
    WORSHIP: ['worship', 'praise', 'vocals', 'singer', 'worship leader'],
    SERMON: ['preacher', 'pastor', 'speaker', 'evangelist', 'sermon', 'teaching'],
    SCRIPTURE_READING: ['scripture', 'bible reading', 'reader', 'reading'],
    COMMUNION: ['communion', 'elder', 'pastor', 'deacon'],
    OFFERING: ['offering', 'usher', 'deacon', 'steward'],
    ANNOUNCEMENT: ['announcement', 'coordinator', 'media', 'host'],
};
/**
 * 🔍 HELPER: Identifies all eligible church members with matching skills and availability
 */
export async function findEligibleMembersForResponsibility(db, churchId, serviceDate, roleId, roleTitle, requiredSkill, category) {
    const targetChurch = churchId;
    if (!targetChurch)
        return [];
    // 1. Fetch active members
    const membersSnap = await db
        .collection(CHURCHES_COLLECTION)
        .doc(targetChurch)
        .collection('members')
        .get();
    const activeMembers = membersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status !== 'Left');
    // 2. Fetch verified skills
    const verifiedSkillMap = new Map();
    try {
        const skillsSnap = await db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('memberSkills')
            .where('verificationStatus', '==', 'verified')
            .get();
        skillsSnap.docs.forEach(doc => {
            const data = doc.data();
            const mId = data.memberId;
            if (mId && data.skillName) {
                const list = verifiedSkillMap.get(mId) || [];
                list.push(String(data.skillName).toLowerCase().trim());
                verifiedSkillMap.set(mId, list);
            }
        });
    }
    catch (err) {
        console.warn('[RosterNotification] Error fetching verified skills:', err);
    }
    // 3. Keywords to match against
    const targetKeywords = [];
    if (ROLE_SKILL_KEYWORDS[roleId]) {
        targetKeywords.push(...ROLE_SKILL_KEYWORDS[roleId]);
    }
    if (category && CATEGORY_SKILL_KEYWORDS[category.toUpperCase()]) {
        targetKeywords.push(...(CATEGORY_SKILL_KEYWORDS[category.toUpperCase()] || []));
    }
    if (requiredSkill && requiredSkill.trim()) {
        targetKeywords.push(...requiredSkill.toLowerCase().split(/[/,\s]+/).filter(w => w.length > 2));
    }
    if (roleTitle && roleTitle.trim()) {
        targetKeywords.push(...roleTitle.toLowerCase().split(/[/,\s]+/).filter(w => w.length > 2));
    }
    const matchesAnyKeyword = (candidateStr) => {
        if (!candidateStr)
            return false;
        const lower = candidateStr.toLowerCase();
        return targetKeywords.some(kw => lower.includes(kw) || kw.includes(lower));
    };
    const eligible = [];
    for (const m of activeMembers) {
        // Check skills
        const vSkills = verifiedSkillMap.get(m.id) || [];
        const hasVerified = vSkills.some(s => matchesAnyKeyword(s));
        const pSkills = [
            ...(typeof m.primarySkill === 'string' ? m.primarySkill.split(',') : []),
            ...(Array.isArray(m.primarySkills) ? m.primarySkills : []),
        ].map(s => String(s).trim());
        const hasPrimary = pSkills.some(s => matchesAnyKeyword(s));
        const sSkills = [
            ...(typeof m.secondarySkill === 'string' ? m.secondarySkill.split(',') : []),
            ...(Array.isArray(m.secondarySkills) ? m.secondarySkills : []),
        ].map(s => String(s).trim());
        const hasSecondary = sSkills.some(s => matchesAnyKeyword(s));
        const genSkills = [
            ...(typeof m.skills === 'string' ? m.skills.split(',') : []),
            ...(Array.isArray(m.skills) ? m.skills : []),
        ].map(s => String(s).trim());
        const hasGenSkill = genSkills.some(s => matchesAnyKeyword(s));
        if (!hasVerified && !hasPrimary && !hasSecondary && !hasGenSkill) {
            continue;
        }
        // Check blockout availability
        if (serviceDate) {
            try {
                const monthYear = serviceDate.slice(0, 7); // YYYY-MM
                const availDoc = await db
                    .collection(CHURCHES_COLLECTION)
                    .doc(targetChurch)
                    .collection('memberAvailability')
                    .doc(`${m.id}_${monthYear}`)
                    .get();
                if (availDoc.exists) {
                    const aData = availDoc.data() || {};
                    const unavail = aData.unavailableDates || [];
                    if (unavail.includes(serviceDate)) {
                        continue;
                    }
                }
            }
            catch (_) { }
        }
        const fullName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Church Member';
        const normName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
        const existingIdx = eligible.findIndex(e => e.memberId === m.id ||
            (normName && normName !== 'church member' && e.memberName.trim().toLowerCase().replace(/\s+/g, ' ') === normName));
        const tokens = await resolveCandidateFcmTokens(db, targetChurch, m.id, m.phone, m.name);
        const existingEntry = existingIdx !== -1 ? eligible[existingIdx] : undefined;
        if (existingEntry) {
            const mergedTokens = Array.from(new Set([...existingEntry.fcmTokens, ...tokens]));
            existingEntry.fcmTokens = mergedTokens;
            if (!existingEntry.memberPhone && m.phone) {
                existingEntry.memberPhone = m.phone;
            }
        }
        else {
            eligible.push({
                memberId: m.id,
                memberName: fullName,
                memberPhone: m.phone,
                fcmTokens: tokens,
            });
        }
    }
    return eligible;
}
/**
 * 📢 HELPER: Alerts Church Admins and Pastors when manual action is needed
 */
export async function notifyChurchAdmins(db, churchId, params) {
    const { title, body, serviceId, roleId, serviceTitle, serviceDate, notifId } = params;
    const targetChurch = churchId;
    if (!targetChurch)
        return;
    try {
        const adminTokens = new Set();
        const adminMemberIdSet = new Set();
        // Query church members for admins/pastors
        const memSnap = await db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('members')
            .get();
        for (const doc of memSnap.docs) {
            const data = doc.data() || {};
            const userTypeStr = String(data.userType || '').toLowerCase();
            const roleStr = String(data.role || '').toLowerCase();
            const posStr = String(data.position || '').toLowerCase();
            const isAdmin = data.isAdmin === true ||
                userTypeStr.includes('admin') ||
                userTypeStr.includes('pastor') ||
                userTypeStr.includes('super') ||
                roleStr.includes('admin') ||
                roleStr.includes('pastor') ||
                posStr.includes('pastor');
            if (isAdmin) {
                adminMemberIdSet.add(doc.id);
                const tokens = await resolveCandidateFcmTokens(db, targetChurch, doc.id, data.phone, data.name);
                tokens.forEach(t => adminTokens.add(t));
            }
        }
        // Also include owner/admin UIDs declared on the church doc itself
        try {
            const churchDoc = await db.collection(CHURCHES_COLLECTION).doc(targetChurch).get();
            if (churchDoc.exists) {
                const cData = churchDoc.data() || {};
                const ownerUids = [cData.adminUid, cData.createdBy, cData.pastorUid].filter(Boolean);
                for (const uid of ownerUids) {
                    const uidStr = String(uid);
                    if (!adminMemberIdSet.has(uidStr)) {
                        adminMemberIdSet.add(uidStr);
                        const tokens = await resolveCandidateFcmTokens(db, targetChurch, uidStr);
                        tokens.forEach(t => adminTokens.add(t));
                    }
                }
            }
        }
        catch (_) { }
        const adminMemberIds = Array.from(adminMemberIdSet);
        // Send in-app notification to all admin members
        const notifPayload = {
            type: 'admin_roster_alert',
            targetRole: 'admin',
            title,
            body,
            churchId: targetChurch,
            serviceId,
            roleId: roleId || '',
            serviceTitle: serviceTitle || '',
            serviceDate: serviceDate || '',
            status: 'action_required',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        for (const aId of adminMemberIds) {
            try {
                const colRef = db
                    .collection(CHURCHES_COLLECTION)
                    .doc(targetChurch)
                    .collection('members')
                    .doc(aId)
                    .collection('notifications');
                if (notifId) {
                    await colRef.doc(notifId).set(notifPayload, { merge: true });
                }
                else {
                    await colRef.add(notifPayload);
                }
            }
            catch (_) { }
        }
        // Dispatch FCM pushes to all admin tokens
        for (const token of adminTokens) {
            try {
                await getMessaging().send({
                    token,
                    notification: { title, body },
                    data: {
                        type: 'admin_roster_alert',
                        churchId: targetChurch,
                        serviceId,
                        roleId: roleId || '',
                        serviceTitle: serviceTitle || '',
                        serviceDate: serviceDate || '',
                        click_action: 'OPEN_ADMIN_SERVICE_PLANNER',
                    },
                    android: {
                        priority: 'high',
                        notification: { channelId: 'church_alerts', color: '#c0392b', sound: 'default' },
                    },
                });
            }
            catch (err) {
                console.warn('[RosterNotification] Push to admin failed:', err);
            }
        }
        console.log(`[RosterNotification] Admin alert dispatched to ${adminMemberIds.length} admins (${adminTokens.size} devices).`);
    }
    catch (err) {
        console.error('[RosterNotification] notifyChurchAdmins error:', err);
    }
}
/**
 * ⚡ DISPATCH AUTOMATIC RESPONSIBILITIES WHEN SERVICE IS PUBLISHED
 */
export async function autoDispatchPublishedServiceResponsibilities(params) {
    const { db, churchId, serviceId, plan } = params;
    const targetChurch = churchId;
    if (!targetChurch)
        return;
    const serviceDate = String(plan.date || '');
    const serviceTitle = String(plan.serviceTitle || 'Worship Service');
    const serviceTime = String(plan.startTime || '10:00');
    const location = String(plan.location || 'Church Sanctuary');
    const queuesCol = db
        .collection(CHURCHES_COLLECTION)
        .doc(targetChurch)
        .collection('servicePlans')
        .doc(serviceId)
        .collection('assignmentQueues');
    // List of standard whole-service band roles
    const bandRoles = [
        { roleId: 'role_keyboard', title: 'Keyboardist / Pianist', skill: 'Keyboard / Piano' },
        { roleId: 'role_drums', title: 'Drummer / Percussionist', skill: 'Drums / Percussion' },
        { roleId: 'role_bass', title: 'Bass Guitarist', skill: 'Bass Guitar' },
        { roleId: 'role_acoustic', title: 'Acoustic Guitarist', skill: 'Acoustic Guitar' },
        { roleId: 'role_electric', title: 'Electric Guitarist', skill: 'Electric Guitar' },
        { roleId: 'role_sound', title: 'Sound & Audio Engineer', skill: 'Sound Engineer' },
        { roleId: 'role_worship_leader', title: 'Worship Leader', skill: 'Worship Leader' },
    ];
    const responsibilitiesToDispatch = [];
    // 1. Add unassigned band roles
    for (const b of bandRoles) {
        const existingAssignee = plan.assignments?.[b.roleId];
        if (!existingAssignee || !String(existingAssignee).trim()) {
            responsibilitiesToDispatch.push({
                roleId: b.roleId,
                roleTitle: b.title,
                requiredSkill: b.skill,
            });
        }
    }
    // 2. Add unassigned runSheet items
    (plan.runSheet || []).forEach((item, idx) => {
        if (!item.responsiblePerson || !String(item.responsiblePerson).trim()) {
            const cleanId = item.id ? (String(item.id).startsWith('act_') ? item.id : `act_${item.id}`) : `act_${idx}`;
            responsibilitiesToDispatch.push({
                roleId: cleanId,
                roleTitle: item.program || 'Order of Service Responsibility',
                requiredSkill: item.category || item.program,
                activityId: item.id || cleanId,
                activityName: item.program,
                category: item.category,
            });
        }
    });
    const nowIso = new Date().toISOString();
    const timeoutMinutes = 120; // 2 hours
    const deadlineIso = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();
    const noEligibleRoles = [];
    for (const resp of responsibilitiesToDispatch) {
        const qDocRef = queuesCol.doc(resp.roleId);
        const existingSnap = await qDocRef.get();
        const existingData = existingSnap.exists ? existingSnap.data() || {} : {};
        if (existingSnap.exists) {
            // If already booked or confirmed, don't overwrite
            if (existingData.status === 'confirmed' || existingData.confirmedCandidateId) {
                continue;
            }
        }
        // Find eligible members
        const eligibleMembers = await findEligibleMembersForResponsibility(db, targetChurch, serviceDate, resp.roleId, resp.roleTitle, resp.requiredSkill, resp.category);
        if (eligibleMembers.length === 0) {
            // No eligible members! Mark exhausted and collect for single summary admin alert
            await qDocRef.set({
                id: resp.roleId,
                serviceId,
                churchId: targetChurch,
                roleId: resp.roleId,
                roleTitle: resp.roleTitle,
                activityId: resp.activityId || resp.roleId,
                activityName: resp.activityName || resp.roleTitle,
                requiredSkill: resp.requiredSkill,
                mode: 'first_come_first_served',
                status: 'exhausted',
                noEligibleAlertSent: true,
                eligibleMemberIds: [],
                declinedMemberIds: [],
                candidates: [],
                timeoutMinutes,
                deadline: deadlineIso,
                history: [{
                        timestamp: nowIso,
                        action: 'no_eligible_members',
                        details: 'No members found with matching verified skills and availability.',
                    }],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            if (existingData.noEligibleAlertSent !== true) {
                noEligibleRoles.push({ roleId: resp.roleId, roleTitle: resp.roleTitle });
            }
            continue;
        }
        // Candidates list for first-come first-served
        const candidateEntries = eligibleMembers.map(m => ({
            candidateId: m.memberId,
            candidateName: m.memberName,
            candidatePhone: m.memberPhone || '',
            status: 'pending',
            requestedAt: nowIso,
            deadline: deadlineIso,
            notificationSent: true,
        }));
        await qDocRef.set({
            id: resp.roleId,
            serviceId,
            churchId: targetChurch,
            roleId: resp.roleId,
            roleTitle: resp.roleTitle,
            activityId: resp.activityId || resp.roleId,
            activityName: resp.activityName || resp.roleTitle,
            requiredSkill: resp.requiredSkill,
            mode: 'first_come_first_served',
            status: 'pending',
            timeoutMinutes,
            deadline: deadlineIso,
            eligibleMemberIds: eligibleMembers.map(m => m.memberId),
            declinedMemberIds: [],
            candidates: candidateEntries,
            history: [{
                    timestamp: nowIso,
                    action: 'broadcast_dispatched',
                    details: `First-Come, First-Served broadcast sent to ${eligibleMembers.length} eligible member(s) with ${Math.round(timeoutMinutes / 60)}h deadline.`,
                }],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        // Send push notification & in-app notification to ALL eligible members simultaneously!
        const notifTitle = `Responsibility Available: ${resp.roleTitle}`;
        const notifBody = `"${serviceTitle}" on ${formatDateMonthYear(serviceDate)} at ${formatTimeTo12Hour(serviceTime)} needs a ${resp.roleTitle}. First to accept gets booked! Tap to claim slot.`;
        const inAppPayload = {
            type: 'service_responsibility_broadcast',
            title: notifTitle,
            body: notifBody,
            churchId: targetChurch,
            serviceId,
            roleId: resp.roleId,
            roleTitle: resp.roleTitle,
            serviceTitle,
            serviceDate: formatDateMonthYear(serviceDate),
            serviceTime: formatTimeTo12Hour(serviceTime),
            location,
            timeoutMinutes,
            status: 'available',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        };
        for (const em of eligibleMembers) {
            try {
                await db.collection(CHURCHES_COLLECTION).doc(targetChurch).collection('members').doc(em.memberId).collection('notifications').add(inAppPayload);
                await db.collection(CHURCHES_COLLECTION).doc(targetChurch).collection('broadcasts').doc(`fcfs_${serviceId}_${resp.roleId}_${em.memberId}`).set({
                    ...inAppPayload,
                    id: `fcfs_${serviceId}_${resp.roleId}_${em.memberId}`,
                    content: notifBody,
                    targetMemberId: em.memberId,
                    targetPhone: em.memberPhone || null,
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            catch (_) { }
            for (const token of em.fcmTokens) {
                try {
                    await getMessaging().send({
                        token,
                        notification: { title: notifTitle, body: notifBody },
                        data: {
                            type: 'service_responsibility_broadcast',
                            churchId: targetChurch,
                            serviceId,
                            roleId: resp.roleId,
                            roleTitle: resp.roleTitle,
                            serviceTitle,
                            click_action: 'OPEN_MY_RESPONSIBILITIES',
                        },
                        android: {
                            priority: 'high',
                            notification: { channelId: 'church_alerts', color: '#1a2d5a', sound: 'default' },
                        },
                    });
                }
                catch (pushErr) {
                    console.warn(`[RosterNotification] Broadcast push failed for ${em.memberName}:`, pushErr);
                }
            }
        }
        console.log(`[RosterNotification] Broadcast ${resp.roleTitle} dispatched to ${eligibleMembers.length} eligible members.`);
    }
    if (noEligibleRoles.length > 0) {
        const roleNames = noEligibleRoles.map(r => r.roleTitle);
        const dateLabel = serviceDate ? formatDateMonthYear(serviceDate) : '';
        const dateSuffix = dateLabel ? ` (${dateLabel})` : '';
        const roleKey = noEligibleRoles.map(r => r.roleId).sort().join('_').slice(0, 80);
        await notifyChurchAdmins(db, targetChurch, {
            title: noEligibleRoles.length === 1
                ? `⚠️ No Volunteers: ${roleNames[0]}`
                : `⚠️ ${noEligibleRoles.length} Roles Need Manual Assignment: ${serviceTitle}`,
            body: noEligibleRoles.length === 1
                ? `No eligible members found with verified skills for ${roleNames[0]} in "${serviceTitle}"${dateSuffix}. Please assign manually.`
                : `No eligible members found for ${roleNames.join(', ')} in "${serviceTitle}"${dateSuffix}. Tap to assign manually in Service Roster.`,
            serviceId,
            roleId: noEligibleRoles[0]?.roleId || '',
            serviceTitle,
            serviceDate,
            notifId: `admin_roster_no_eligible_${serviceId}_${roleKey}`,
        });
    }
}
/**
 * 🚀 ON SERVICE PLAN PUBLISHED:
 * Automatically runs First-Come, First-Served auto-assignment broadcast to all eligible members!
 */
export const onServicePlanPublished = onDocumentWritten({
    document: `${CHURCHES_COLLECTION}/{churchId}/servicePlans/{serviceId}`,
    region: 'asia-south1',
}, async (event) => {
    const beforeData = event.data?.before?.data();
    const afterSnap = event.data?.after;
    if (!afterSnap || !afterSnap.exists)
        return;
    const afterData = afterSnap.data();
    if (!afterData)
        return;
    const { churchId, serviceId } = event.params;
    const db = getFirestore();
    // Only trigger when transitioning to 'published'
    if (afterData.status === 'published' && beforeData?.status !== 'published') {
        console.log(`[RosterNotification] Service plan ${serviceId} published! Auto-dispatching responsibilities.`);
        const targetChurch = churchId;
        const serviceTitle = String(afterData.serviceTitle || 'Worship Service');
        const serviceDate = String(afterData.date || '');
        const serviceTime = String(afterData.startTime || '10:00');
        const location = String(afterData.location || 'Church Sanctuary');
        const dateDisplay = formatDateMonthYear(serviceDate) || serviceDate;
        const timeDisplay = formatTimeTo12Hour(serviceTime) || serviceTime;
        const broadcastDoc = {
            id: `roster_published_${serviceId}`,
            type: 'service_roster',
            title: `Service Roster Published: ${serviceTitle}`,
            content: `The upcoming service roster and worship order for ${dateDisplay} at ${timeDisplay} (${location}) has been published. Tap to view the schedule, setlist and responsibilities.`,
            body: `The upcoming service roster and worship order for ${dateDisplay} at ${timeDisplay} (${location}) has been published. Tap to view the schedule, setlist and responsibilities.`,
            churchId: targetChurch,
            serviceId,
            serviceTitle,
            serviceDate,
            serviceTime,
            location,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        try {
            await db
                .collection(CHURCHES_COLLECTION)
                .doc(targetChurch)
                .collection('broadcasts')
                .doc(`roster_published_${serviceId}`)
                .set(broadcastDoc, { merge: true });
            await db
                .collection(CHURCHES_COLLECTION)
                .doc(targetChurch)
                .collection('notifications')
                .doc(`roster_published_${serviceId}`)
                .set(broadcastDoc, { merge: true });
        }
        catch (bErr) {
            console.warn('[RosterNotification] Could not write published roster broadcast:', bErr);
        }
        // Send general church-wide push notification to topic
        try {
            await getMessaging().send({
                topic: `church_${targetChurch}`,
                notification: {
                    title: `📋 Service Roster Published: ${serviceTitle}`,
                    body: `The service roster for ${dateDisplay} at ${timeDisplay} is now live. Tap to view schedule & duties.`,
                },
                data: {
                    type: 'service_roster',
                    churchId: targetChurch,
                    serviceId,
                    serviceTitle,
                    click_action: 'OPEN_SERVICE_ROSTER',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'church_alerts',
                        color: '#059669',
                        sound: 'default',
                    },
                },
            });
        }
        catch (pushErr) {
            console.warn('[RosterNotification] Topic push for published roster failed:', pushErr);
        }
        await autoDispatchPublishedServiceResponsibilities({
            db,
            churchId,
            serviceId,
            plan: afterData,
        });
    }
});
/**
 * 🔒 HTTP TRIGGER: SAFE TRANSACTIONAL FIRST-COME SLOT BOOKING
 */
export const bookResponsibilitySlotHttp = onRequest({ cors: true, region: 'asia-south1' }, async (req, res) => {
    try {
        const { churchId, serviceId, roleId, memberId, memberName } = req.body || req.query;
        if (!churchId || !serviceId || !roleId || !memberId) {
            res.status(400).json({ error: 'churchId, serviceId, roleId, and memberId are required' });
            return;
        }
        const db = getFirestore();
        const targetChurch = String(churchId);
        const queueRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('servicePlans')
            .doc(String(serviceId))
            .collection('assignmentQueues')
            .doc(String(roleId));
        const planRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('servicePlans')
            .doc(String(serviceId));
        const result = await db.runTransaction(async (transaction) => {
            const qSnap = await transaction.get(queueRef);
            if (!qSnap.exists) {
                throw new Error('Responsibility queue not found.');
            }
            const qData = qSnap.data() || {};
            if (qData.status === 'confirmed' || qData.confirmedCandidateId) {
                return { booked: false, message: 'This responsibility slot has already been booked by another member.', bookedBy: qData.confirmedCandidateName };
            }
            const nowIso = new Date().toISOString();
            const candidateName = String(memberName || 'Volunteer');
            const normTargetName = candidateName.trim().toLowerCase().replace(/\s+/g, ' ');
            const isSameCand = (c) => c.candidateId === memberId ||
                (normTargetName && normTargetName !== 'volunteer' && String(c.candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ') === normTargetName);
            const updatedCandidates = (qData.candidates || []).map((c) => {
                if (isSameCand(c)) {
                    return { ...c, status: 'accepted', declineReason: null, respondedAt: nowIso };
                }
                return { ...c, status: c.status === 'declined' ? 'declined' : 'missed' };
            });
            const updatedDeclinedIds = (qData.declinedMemberIds || []).filter(id => id !== memberId);
            transaction.update(queueRef, {
                status: 'confirmed',
                confirmedCandidateId: memberId,
                confirmedCandidateName: candidateName,
                bookedAt: nowIso,
                declinedMemberIds: updatedDeclinedIds,
                candidates: updatedCandidates,
                history: FieldValue.arrayUnion({
                    timestamp: nowIso,
                    action: 'slot_booked_first_come',
                    candidateId: memberId,
                    candidateName,
                    details: `Booked by ${candidateName} (First to accept)`,
                }),
                updatedAt: FieldValue.serverTimestamp(),
            });
            transaction.update(planRef, {
                [`assignments.${roleId}`]: candidateName,
                [`assignmentMemberIds.${roleId}`]: memberId,
                [`assignmentStatus.${roleId}`]: 'confirmed',
                updatedAt: FieldValue.serverTimestamp(),
            });
            return { booked: true, roleTitle: qData.roleTitle, candidateName };
        });
        res.json(result);
    }
    catch (err) {
        console.error('bookResponsibilitySlotHttp error:', err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * ❌ HTTP TRIGGER: SAFE TRANSACTIONAL DECLINE & AUTO-REASSIGNMENT
 */
export const declineResponsibilitySlotHttp = onRequest({ cors: true, region: 'asia-south1' }, async (req, res) => {
    try {
        const { churchId, serviceId, roleId, memberId, memberName, reason } = req.body || req.query;
        if (!churchId || !serviceId || !roleId || !memberId) {
            res.status(400).json({ error: 'churchId, serviceId, roleId, and memberId are required' });
            return;
        }
        const db = getFirestore();
        const targetChurch = String(churchId);
        const serviceIdStr = String(serviceId);
        const roleIdStr = String(roleId);
        const memberIdStr = String(memberId);
        const queueRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('servicePlans')
            .doc(serviceIdStr)
            .collection('assignmentQueues')
            .doc(roleIdStr);
        const planRef = db
            .collection(CHURCHES_COLLECTION)
            .doc(targetChurch)
            .collection('servicePlans')
            .doc(serviceIdStr);
        let allDeclined = false;
        let slotReopened = false;
        let roleTitle = 'Responsibility';
        let serviceTitle = 'Worship Service';
        await db.runTransaction(async (transaction) => {
            const qSnap = await transaction.get(queueRef);
            if (!qSnap.exists)
                throw new Error('Queue not found');
            const qData = qSnap.data() || {};
            roleTitle = qData.roleTitle || 'Responsibility';
            const declinedList = Array.from(new Set([...(qData.declinedMemberIds || []), memberIdStr]));
            const eligibleList = qData.eligibleMemberIds || [];
            const isCurrentConfirmed = qData.confirmedCandidateId === memberIdStr;
            const nowIso = new Date().toISOString();
            const normTargetName = String(memberName || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const isSameCand = (c) => c.candidateId === memberIdStr ||
                (normTargetName && normTargetName !== 'volunteer' && String(c.candidateName || '').trim().toLowerCase().replace(/\s+/g, ' ') === normTargetName);
            const updatedCandidates = (qData.candidates || []).map((c) => {
                if (isSameCand(c)) {
                    return { ...c, status: 'declined', declineReason: reason || 'Unavailable', respondedAt: nowIso };
                }
                return c;
            });
            if (isCurrentConfirmed) {
                // Re-open the slot!
                slotReopened = true;
                const remainingEligibleCount = eligibleList.filter((id) => !declinedList.includes(id)).length;
                transaction.update(queueRef, {
                    status: remainingEligibleCount > 0 ? 'pending' : 'exhausted',
                    confirmedCandidateId: FieldValue.delete(),
                    confirmedCandidateName: FieldValue.delete(),
                    declinedMemberIds: declinedList,
                    candidates: updatedCandidates,
                    history: FieldValue.arrayUnion({
                        timestamp: nowIso,
                        action: 'confirmed_member_cancelled_slot_reopened',
                        candidateId: memberIdStr,
                        candidateName: memberName || 'Volunteer',
                        details: `Cancelled by ${memberName}: ${reason || 'Unavailable'}. Slot re-opened.`,
                    }),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                transaction.update(planRef, {
                    [`assignments.${roleIdStr}`]: FieldValue.delete(),
                    [`assignmentMemberIds.${roleIdStr}`]: FieldValue.delete(),
                    [`assignmentStatus.${roleIdStr}`]: 'pending',
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
            else {
                // Normal decline
                allDeclined = eligibleList.length > 0 && declinedList.length >= eligibleList.length;
                transaction.update(queueRef, {
                    status: allDeclined ? 'exhausted' : qData.status,
                    declinedMemberIds: declinedList,
                    candidates: updatedCandidates,
                    history: FieldValue.arrayUnion({
                        timestamp: nowIso,
                        action: 'candidate_declined',
                        candidateId: memberIdStr,
                        candidateName: memberName || 'Volunteer',
                        details: `Declined: ${reason || 'Unavailable'}`,
                    }),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
        });
        // If all declined -> notify Admin!
        if (allDeclined) {
            const planSnap = await planRef.get();
            serviceTitle = planSnap.data()?.serviceTitle || 'Worship Service';
            await notifyChurchAdmins(db, targetChurch, {
                title: `⚠️ All Volunteers Declined: ${roleTitle}`,
                body: `All eligible members have declined the ${roleTitle} responsibility for "${serviceTitle}". Please assign manually.`,
                serviceId: serviceIdStr,
                roleId: roleIdStr,
                serviceTitle,
            });
        }
        res.json({ success: true, slotReopened, allDeclined });
    }
    catch (err) {
        console.error('declineResponsibilitySlotHttp error:', err);
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=rosterNotifications.js.map