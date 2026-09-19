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
 * 🙏 NOTIFY ADMIN OF PUBLIC PRAYER REQUEST
 * Triggered when a new prayer request is created.
 */
export declare const pushPrayerRequestAdmin: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
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
//# sourceMappingURL=notifications.d.ts.map