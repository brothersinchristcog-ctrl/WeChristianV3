/**
 * Scheduled cron job to check church subscription expirations and send push notifications.
 * Runs daily at 9:00 AM.
 *
 * Target: churches
 * Checks the validUntil field or 60 days from createdAt.
 * Sends FCM notifications for 3 days, 1 day, and 0 days (expiry) to church admins.
 */
export declare const checkSubscriptionExpirations: import("firebase-functions/v2/scheduler").ScheduleFunction;
//# sourceMappingURL=subscriptionCron.d.ts.map