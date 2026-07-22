import * as functionsCompat from 'firebase-functions/v1';
/**
 * 📖 GET DAILY PROMISE
 */
export declare const getDailyPromise: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: any;
}>, unknown>;
/**
 * 📅 GET UPCOMING EVENTS
 */
export declare const getUpcomingEvents: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: any;
}>, unknown>;
/**
 * 🛡️ CHECK CONTACT EXISTS
 */
export declare const checkContactExists: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    exists: boolean;
    member: {
        id: any;
        accountId: any;
        name: string;
        firstName: any;
        lastName: any;
        email: any;
        phone: any;
        userType: any;
        mailingCity: any;
        mailingState: any;
        mailingStreet: any;
        joinDate: any;
    };
    success: boolean;
} | {
    exists: boolean;
    member?: never;
    success: boolean;
}>, unknown>;
/**
 * 🔔 NOTIFY MEMBERS
 */
export declare const notifyMembersV2: import("firebase-functions/v2/https").HttpsFunction;
/**
 * ⏰ AUTOMATED DAILY PROMISE SCHEDULER
 * Scheduled to run every day at 07:00 AM IST (01:30 AM UTC)
 */
export declare const automatedDailyPromise: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * ⏰ AUTOMATED DAILY BIRTHDAYS SCHEDULER
 * Scheduled to run every day at 08:00 AM IST (02:30 AM UTC)
 */
export declare const weChristianBdaysRun: functionsCompat.CloudFunction<unknown>;
/**
 * ⏰ AUTOMATED DAILY ANNIVERSARIES SCHEDULER
 * Scheduled to run every day at 08:30 AM IST (03:00 AM UTC)
 */
export declare const weChristianAnnivsRun: functionsCompat.CloudFunction<unknown>;
/**
 * ⏰ AUTOMATED DAILY BAPTISM ANNIVERSARIES SCHEDULER
 * Scheduled to run every day at 07:00 AM IST
 */
export declare const weChristianBaptismsRun: functionsCompat.CloudFunction<unknown>;
/**
 * 📣 ON BROADCAST CREATED TRIGGER (Gen 2)
 * Automatically sends push notifications when a new broadcast is added to Firestore (e.g. Emergency Meeting or custom admin updates)
 */
export declare const processBroadcastPushNotifications: functionsCompat.CloudFunction<functionsCompat.firestore.QueryDocumentSnapshot>;
/**
 * 📤 UPLOAD EVENT IMAGE
 */
export declare const uploadEventImage: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    url: string;
}>, unknown>;
/**
 * ⏰ YOUTUBE LIVE CHECK SCHEDULER
 * Runs every 5 minutes to check if YouTube channel is live
 */
export declare const checkYouTubeLive: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 📢 TRIGGER TEST YOUTUBE LIVE NOTIFICATION
 */
export declare const triggerTestYouTubeLive: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    sent?: never;
    failed?: never;
    broadcastId?: never;
} | {
    success: boolean;
    sent: any;
    failed: any;
    broadcastId: any;
    message?: never;
}>, unknown>;
export declare const testBdays: import("firebase-functions/v2/https").HttpsFunction;
export declare const testAnnivs: import("firebase-functions/v2/https").HttpsFunction;
export declare const testBaptisms: import("firebase-functions/v2/https").HttpsFunction;
export * from './payments.js';
export * from './checkPaymentStatus.js';
//# sourceMappingURL=index.d.ts.map