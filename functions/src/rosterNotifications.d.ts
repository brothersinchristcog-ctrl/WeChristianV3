import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
/**
 * 🔍 HELPER: Resolves valid FCM tokens for a member or candidate across:
 * 1. churches/{churchId}/members/{candidateId} (fcmToken, fcmTokens)
 * 2. users/{candidateId}
 * 3. Phone number search in church members
 * 4. Display name search in church members
 */
export declare function resolveCandidateFcmTokens(db: Firestore, churchId: string, candidateId: string, candidatePhone?: string | undefined, candidateName?: string | undefined): Promise<string[]>;
/**
 * 📲 HELPER: Sends assignment push notification & records in-app notification
 */
export declare function sendCandidateAssignmentPush(params: {
    db: Firestore;
    churchId: string;
    serviceId: string;
    roleId: string;
    roleTitle: string;
    candidate: {
        candidateId: string;
        candidateName: string;
        candidatePhone?: string | undefined;
    };
    candidateIndex: number;
    queueRef: DocumentReference;
    timeoutMinutes: number;
    isCascade?: boolean | undefined;
}): Promise<{
    success: boolean;
    tokensCount: number;
    error?: string | undefined;
}>;
/**
 * 🔔 1. ON SERVICE ASSIGNMENT QUEUE DISPATCHED (Written: Create + Update)
 * Fired whenever an assignment queue document is created or updated in Firestore.
 * Sends targeted push notifications to the active candidate with Accept/Decline options.
 */
export declare const onServiceAssignmentQueueDispatched: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    churchId: string;
    serviceId: string;
    roleId: string;
}>>;
/**
 * ⚡ 2. ON SERVICE ASSIGNMENT RESPONDED (CASCADE ADVANCER)
 * Fired when an assignment queue is updated. If the active candidate declined or timed out,
 * this function automatically cascades the request to Candidate 2, Candidate 3, etc.
 */
export declare const onServiceAssignmentResponded: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    churchId: string;
    serviceId: string;
    roleId: string;
}>>;
/**
 * ⏰ 3. ASSIGNMENT TIMEOUT CHECKER CRON JOB
 * Dedicated Cloud Scheduler running every 5 minutes.
 * Scans active queues with status == 'pending' and marks candidates as 'timed_out'
 * if their deadline has elapsed, allowing the cascade trigger above to take over.
 */
export declare const checkServiceAssignmentTimeoutsCron: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * ⏰ 4. SERVICE ROSTER REMINDERS CRON JOB
 * Dedicated Cloud Scheduler running daily at 08:00 AM IST.
 * Sends 24-hour reminders to all confirmed volunteers for tomorrow's services.
 */
export declare const sendServiceRosterRemindersCron: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🌐 5. HTTP TRIGGER TO TEST ROSTER TIMEOUTS
 */
export declare const triggerCheckRosterTimeoutsHttp: import("firebase-functions/v2/https").HttpsFunction;
/**
 * 🌐 5B. HTTP TRIGGER TO MANUALLY DISPATCH OR RETRY ASSIGNMENT NOTIFICATION
 */
export declare const dispatchServiceAssignmentNotificationHttp: import("firebase-functions/v2/https").HttpsFunction;
/**
 * 🎶 6. ON SERVICE REHEARSAL CREATED
 * Fired when a rehearsal is scheduled for a worship service.
 * Alerts all invited team members and assigned band musicians via FCM.
 */
export declare const onServiceRehearsalCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
    serviceId: string;
    rehearsalId: string;
}>>;
/**
 * 🔍 HELPER: Identifies all eligible church members with matching skills and availability
 */
export declare function findEligibleMembersForResponsibility(db: Firestore, churchId: string, serviceDate: string, roleId: string, roleTitle: string, requiredSkill?: string | undefined, category?: string | undefined): Promise<Array<{
    memberId: string;
    memberName: string;
    memberPhone?: string | undefined;
    fcmTokens: string[];
}>>;
/**
 * 📢 HELPER: Alerts Church Admins and Pastors when manual action is needed
 */
export declare function notifyChurchAdmins(db: Firestore, churchId: string, params: {
    title: string;
    body: string;
    serviceId: string;
    roleId?: string | undefined;
    serviceTitle?: string | undefined;
    serviceDate?: string | undefined;
    notifId?: string | undefined;
}): Promise<void>;
/**
 * ⚡ DISPATCH AUTOMATIC RESPONSIBILITIES WHEN SERVICE IS PUBLISHED
 */
export declare function autoDispatchPublishedServiceResponsibilities(params: {
    db: Firestore;
    churchId: string;
    serviceId: string;
    plan: any;
}): Promise<void>;
/**
 * 🚀 ON SERVICE PLAN PUBLISHED:
 * Automatically runs First-Come, First-Served auto-assignment broadcast to all eligible members!
 */
export declare const onServicePlanPublished: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    churchId: string;
    serviceId: string;
}>>;
/**
 * 🔒 HTTP TRIGGER: SAFE TRANSACTIONAL FIRST-COME SLOT BOOKING
 */
export declare const bookResponsibilitySlotHttp: import("firebase-functions/v2/https").HttpsFunction;
/**
 * ❌ HTTP TRIGGER: SAFE TRANSACTIONAL DECLINE & AUTO-REASSIGNMENT
 */
export declare const declineResponsibilitySlotHttp: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=rosterNotifications.d.ts.map