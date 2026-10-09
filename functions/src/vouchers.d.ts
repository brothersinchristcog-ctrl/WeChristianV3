/**
 * Callable Cloud Function: redeemVoucherV1
 * Validates and atomically redeems a voucher code for a church.
 * Calculation: New Expiry = max(Current Subscription Expiry, Current Date) + durationDays
 */
export declare const redeemVoucherV1: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    validUntil: string;
    voucherCode: string;
    durationDays: any;
    previousExpiry: string | undefined;
}>, unknown>;
/**
 * Callable Cloud Function: getVouchersAdminV1
 * Fetches all vouchers using Admin SDK (100% immune to firestore/permission-denied).
 */
export declare const getVouchersAdminV1: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    vouchers: {
        id: string;
    }[];
}>, unknown>;
/**
 * Callable Cloud Function: createVoucherAdminV1
 * Creates a single voucher using Admin SDK.
 */
export declare const createVoucherAdminV1: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    code: any;
}>, unknown>;
/**
 * Callable Cloud Function: bulkCreateVouchersAdminV1
 * Generates up to 100 vouchers in batch using Admin SDK.
 */
export declare const bulkCreateVouchersAdminV1: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    count: number;
    codes: string[];
}>, unknown>;
/**
 * Callable Cloud Function: toggleVoucherStatusAdminV1
 */
export declare const toggleVoucherStatusAdminV1: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
//# sourceMappingURL=vouchers.d.ts.map