import * as functions from 'firebase-functions/v1';
export declare const weCelebrationDailySweep: functions.CloudFunction<unknown>;
/**
 * HTTP endpoint so Cloud Scheduler can Force-Run the daily celebrations sweep.
 */
export declare const triggerMorningCelebrations: import("firebase-functions/v2/https").HttpsFunction;
/**
 * 2. On Wish Created: Increment the unnotified counter
 */
export declare const weCelebrationWishCreatedTrigger: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const weCelebrationBatchedWishes: functions.CloudFunction<unknown>;
/**
 * HTTP endpoint so Cloud Scheduler can Force-Run the batched wishes sweep.
 * Target URL: https://us-central1-wechristian-67f07.cloudfunctions.net/executeBatchedWishes
 */
export declare const executeBatchedWishes: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=celebrations.d.ts.map