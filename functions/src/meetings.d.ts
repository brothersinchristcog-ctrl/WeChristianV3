/**
 * 🔗 ZOOM OAUTH CALLBACK (HTTP Endpoint)
 * Called by Zoom after the church admin authorizes the app.
 */
export declare const zoomOAuthCallbackV2: import("firebase-functions/v2/https").HttpsFunction;
/**
 * 📅 CREATE ONLINE MEETING
 * Callable function used by the Admin from the mobile app.
 */
export declare const createOnlineMeetingV2: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    meetingId: string;
    meetingUrl: string;
}>, unknown>;
//# sourceMappingURL=meetings.d.ts.map