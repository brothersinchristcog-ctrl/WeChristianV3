/**
 * Scheduled cron job to check subscription expirations and send push notifications.
 * Runs daily at 9:00 AM.
 *
 * Target: users where subscription.status === 'trial' or 'active' (specifically 'trial' based on requirements).
 * Checks the validUntil field. Sends FCM notifications for 3 days, 1 day, and 0 days (expiry).
 */
export declare const checkSubscriptionExpirations: import("firebase-functions/v2/scheduler").ScheduleFunction;
//# sourceMappingURL=subscriptionCron.d.ts.map