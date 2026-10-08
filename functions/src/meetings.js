import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';
const getDb = () => getFirestore();
let cachedZoomToken = null;
/**
 * Helper: Acquire Server-to-Server OAuth access token from Zoom
 */
async function getZoomServerToServerToken() {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    if (!accountId || !clientId || !clientSecret) {
        throw new Error('Zoom Server-to-Server credentials missing in backend environment. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.');
    }
    // Check in-memory cached token (with 60-second buffer)
    if (cachedZoomToken && Date.now() < cachedZoomToken.expiresAt - 60000) {
        return cachedZoomToken.token;
    }
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;
    const response = await axios.post(tokenUrl, null, {
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const { access_token, expires_in } = response.data;
    if (!access_token) {
        throw new Error('Failed to obtain access token from Zoom OAuth.');
    }
    cachedZoomToken = {
        token: access_token,
        expiresAt: Date.now() + (expires_in || 3600) * 1000,
    };
    return access_token;
}
function extractZoomUserId(accessToken) {
    try {
        const parts = accessToken.split('.');
        if (parts.length >= 2 && parts[1]) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload && payload.uid)
                return payload.uid;
        }
    }
    catch {
        // fallback
    }
    return 'me';
}
/**
 * 📹 CREATE ZOOM MEETING (Callable Function)
 * Called by the Admin App when clicking "Generate Link" for Zoom Meetings.
 * Uses Zoom Server-to-Server OAuth on the backend without exposing secrets.
 */
export const createZoomMeeting = onCall({ cors: true, invoker: 'public' }, async (request) => {
    const { title, description, startTime, endTime, churchId } = request.data || {};
    if (!title) {
        throw new HttpsError('invalid-argument', 'Title is required for the meeting.');
    }
    try {
        const accessToken = await getZoomServerToServerToken();
        const userId = extractZoomUserId(accessToken);
        const startDt = startTime ? new Date(startTime) : new Date();
        const endDt = endTime ? new Date(endTime) : new Date(startDt.getTime() + 60 * 60 * 1000);
        const durationMinutes = Math.max(15, Math.round((endDt.getTime() - startDt.getTime()) / 60000));
        const response = await axios.post(`https://api.zoom.us/v2/users/${userId}/meetings`, {
            topic: title,
            agenda: description || '',
            type: 2, // Scheduled meeting
            start_time: startDt.toISOString(),
            duration: durationMinutes,
            timezone: 'UTC',
            password: String(request.data?.password || Math.floor(100000 + Math.random() * 900000)),
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true,
                mute_upon_entry: true,
                waiting_room: false,
                approval_type: 0,
            },
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        const meetingData = response.data;
        return {
            success: true,
            meetingId: String(meetingData.id),
            meetingUrl: meetingData.join_url,
            password: meetingData.password || '',
            startUrl: meetingData.start_url || '',
        };
    }
    catch (err) {
        console.error('[createZoomMeeting] Error:', err?.response?.data || err?.message || err);
        const msg = err?.response?.data?.message ||
            err?.message ||
            'Failed to create Zoom meeting via Zoom API';
        throw new HttpsError('internal', msg);
    }
});
/**
 * 🔗 HTTP Trigger Alternative for createZoomMeeting
 */
export const createZoomMeetingHttp = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
    const { title, description, startTime, endTime } = req.body || {};
    if (!title) {
        res.status(400).json({ error: 'Title is required for the meeting.' });
        return;
    }
    try {
        const accessToken = await getZoomServerToServerToken();
        const userId = extractZoomUserId(accessToken);
        const startDt = startTime ? new Date(startTime) : new Date();
        const endDt = endTime ? new Date(endTime) : new Date(startDt.getTime() + 60 * 60 * 1000);
        const durationMinutes = Math.max(15, Math.round((endDt.getTime() - startDt.getTime()) / 60000));
        const response = await axios.post(`https://api.zoom.us/v2/users/${userId}/meetings`, {
            topic: title,
            agenda: description || '',
            type: 2,
            start_time: startDt.toISOString(),
            duration: durationMinutes,
            timezone: 'UTC',
            password: String(req.body?.password || Math.floor(100000 + Math.random() * 900000)),
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true,
                mute_upon_entry: true,
                waiting_room: false,
                approval_type: 0,
            },
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        const meetingData = response.data;
        res.status(200).json({
            success: true,
            meetingId: String(meetingData.id),
            meetingUrl: meetingData.join_url,
            password: meetingData.password || '',
            startUrl: meetingData.start_url || '',
        });
    }
    catch (err) {
        console.error('[createZoomMeetingHttp] Error:', err?.response?.data || err?.message || err);
        res.status(500).json({
            error: err?.response?.data?.message || err?.message || 'Failed to create Zoom meeting via Zoom API',
        });
    }
});
//# sourceMappingURL=meetings.js.map