import * as functions from 'firebase-functions/v1';
/**
 * Callable function to create a Razorpay order before checkout
 */
export declare const createRazorpayOrderV4: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Webhook to listen to Razorpay payment events
 */
export declare const razorpayWebhookV1: functions.HttpsFunction;
/**
 * Callable function to create a church-specific Razorpay order for Giving/Tithing
 */
export declare const createRazorpayDonationOrderV6: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Callable function to verify a church-specific Razorpay donation signature
 */
export declare const verifyRazorpayDonationV6: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Callable function to verify a platform subscription Razorpay signature
 */
export declare const verifyRazorpaySubscriptionV3: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
//# sourceMappingURL=razorpay.d.ts.map