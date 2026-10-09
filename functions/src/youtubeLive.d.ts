/**
 * 1. 🔗 GET YOUTUBE OAUTH URL (Callable)
 * Generates the Google sign-in consent link for the Church Admin
 */
export declare const getYoutubeAuthUrl: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    authUrl: string;
}>, unknown>;
/**
 * 2. 🚀 YOUTUBE OAUTH CALLBACK (HTTP)
 * Redirect URI registered in Google Cloud Console
 */
export declare const youtubeOAuthCallback: import("firebase-functions/v2/https").HttpsFunction;
/**
 * 3. 🔍 GET YOUTUBE CHANNEL STATUS (Callable)
 * Checks whether the church has an active linked YouTube channel
 */
export declare const getYouTubeChannelStatus: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    isConnected: boolean;
    channelId?: never;
    channelTitle?: never;
    channelThumbnail?: never;
} | {
    isConnected: boolean;
    channelId: any;
    channelTitle: any;
    channelThumbnail: any;
}>, unknown>;
/**
 * 4. ❌ DISCONNECT YOUTUBE CHANNEL (Callable)
 */
export declare const disconnectYouTubeChannel: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * 5. 🎥 CREATE ZOOM MEETING + YOUTUBE LIVE STREAM (Callable)
 * Complete automated pipeline:
 * - Creates YouTube LiveBroadcast + LiveStream (RTMP)
 * - Binds YouTube broadcast to stream
 * - Creates Zoom meeting via Server-to-Server OAuth
 * - Pre-configures Zoom with YouTube RTMP Stream URL & Key (PATCH /meetings/{id}/livestream)
 * - Persists meeting entity in Firestore
 */
export declare const createZoomWithYouTubeLive: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    meetingId: string;
    meetingUrl: string;
    password: any;
    startUrl: string;
    youtubeLive: any;
}>, unknown>;
/**
 * 6. 🔴 CHECK YOUTUBE LIVE STATUS (Callable)
 * Queries real YouTube Data API lifeCycleStatus so no fake status is ever shown
 */
export declare const checkYouTubeLiveStatus: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    lifeCycleStatus?: never;
    watchUrl?: never;
    error?: never;
} | {
    status: "scheduled" | "live" | "ended" | "failed";
    lifeCycleStatus: any;
    watchUrl: string;
    error?: never;
} | {
    status: string;
    error: any;
    lifeCycleStatus?: never;
    watchUrl?: never;
}>, unknown>;
/**
 * 7. ▶ START ZOOM LIVE STREAM (Callable)
 * Triggers Zoom to begin pushing RTMP to YouTube once the meeting has started
 */
export declare const startZoomLiveStream: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: any;
    message?: never;
} | {
    success: boolean;
    message: any;
    data?: never;
}>, unknown>;
//# sourceMappingURL=youtubeLive.d.ts.map