/**
 * 📹 CREATE ZOOM MEETING (Callable Function)
 * Called by the Admin App when clicking "Generate Link" for Zoom Meetings.
 * Uses Zoom Server-to-Server OAuth on the backend without exposing secrets.
 */
export declare const createZoomMeeting: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    meetingId: string;
    meetingUrl: any;
    password: any;
    startUrl: any;
}>, unknown>;
/**
 * 🔗 HTTP Trigger Alternative for createZoomMeeting
 */
export declare const createZoomMeetingHttp: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=meetings.d.ts.map