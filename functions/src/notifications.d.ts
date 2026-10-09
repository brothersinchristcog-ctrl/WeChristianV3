/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic.
 */
export declare const pushMeetingLive: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
    meetingId: string;
}>>;
/**
 * 🙏 MANDATORY NOTIFICATION: ADMIN NOTIFIED OF EVERY PRAYER REQUEST
 * Triggered automatically whenever a member submits a prayer request in Firestore.
 * Always notifies church admins (public or private), clearly showing which specific member submitted it.
 */
export declare const onPrayerRequestCreatedAdmin: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
    prayerId: string;
}>>;
/**
 * 🙏 NOTIFY COMMUNITY OF APPROVED PRAYER REQUEST
 * Triggered when a prayer request is approved (isAnswered becomes true).
 */
export declare const pushPrayerRequestApproved: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    churchId: string;
    prayerId: string;
}>>;
/**
 * ⏱ CHECK ONLINE MEETINGS (CRON JOB)
 * Cron Job: Runs every minute to check if any online meeting is starting now (or within 5 minutes)
 */
export declare const monitorMeetingLive: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🏛️ NOTIFY SUPER ADMINS OF NEW CHURCH REGISTRATION
 * Triggered automatically when a new church document is created in Firestore.
 */
export declare const pushNewChurchRegistered: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
}>>;
export declare const pushBibleQuizCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
    quizId: string;
}>>;
export declare const pushBibleQuizUpdated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    churchId: string;
    quizId: string;
}>>;
/**
 * 📖 SEND DAILY BIBLE QUIZ NOTIFICATION (Core Engine)
 * Dispatches the daily Bible quiz challenge to church members.
 * Supports:
 * - Direct FCM Multicast to all registered device tokens with sound, max priority, and channelId 'daily_quiz'
 * - FCM Topic broadcast to each active church topic (church_{churchId})
 * - Logging into broadcasts and notifications subcollections for all churches
 * - Idempotency tracking via lastBroadcastDate
 */
export declare function sendDailyQuizNotificationInternal(force?: boolean): Promise<{
    success: boolean;
    sentCount: number;
    message: string;
}>;
/**
 * ⏰ AUTOMATED DAILY BIBLE QUIZ SCHEDULER
 * Scheduled to run every day at 06:00 AM IST (12:30 AM UTC)
 * Automatically delivers the Daily Bible Quiz push notification to members worldwide.
 */
export declare const automatedDailyQuiz: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * ⏰ PERIODIC SCHEDULED QUIZ SAFETY NET
 * Runs every 15 minutes between 05:00 AM and 09:00 AM IST
 * Ensures that if Super Admin configured a custom delivery time or a temporary network glitch occurred at 06:00,
 * the daily quiz is automatically delivered as soon as the scheduled time is reached.
 */
export declare const periodicDailyQuizSafetyNet: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚀 TRIGGER DAILY QUIZ NOTIFICATION (HTTP / Super Admin Test Endpoint)
 * Invokable endpoint for Super Admin to manually trigger or test the daily quiz push immediately.
 */
export declare const triggerDailyQuizNotificationHttp: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=notifications.d.ts.map