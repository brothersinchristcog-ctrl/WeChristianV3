import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';
// Ensure you have these environment variables set in functions/.env
// ZOOM_CLIENT_ID
// ZOOM_CLIENT_SECRET
// ZOOM_REDIRECT_URI (e.g., https://us-central1-wechristian-67f07.cloudfunctions.net/zoomOAuthCallback)
const getDb = () => getFirestore();
/**
 * Helper to get Zoom credentials from env variables
 */
const getZoomConfig = () => {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Zoom configuration is missing in the backend.');
    }
    return { clientId, clientSecret, redirectUri };
};
/**
 * 🔗 ZOOM OAUTH CALLBACK (HTTP Endpoint)
 * Called by Zoom after the church admin authorizes the app.
 */
export const zoomOAuthCallbackV2 = onRequest(async (req, res) => {
    const code = req.query.code;
    const state = req.query.state; // We will pass churchId and adminUid in state
    if (!code || !state) {
        res.status(400).send('Missing code or state parameter from Zoom.');
        return;
    }
    try {
        // State is expected to be a JSON string: {"churchId":"...", "adminUid":"..."}
        const stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        const { churchId, adminUid } = stateObj;
        if (!churchId) {
            throw new Error('Invalid state payload');
        }
        const { clientId, clientSecret, redirectUri } = getZoomConfig();
        const tokenUrl = 'https://zoom.us/oauth/token';
        // Request Access Token from Zoom
        const response = await axios.post(tokenUrl, null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            },
            headers: {
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const { access_token, refresh_token, expires_in } = response.data;
        // Save tokens to Firestore under the church's secure integrations collection
        await getDb()
            .collection('churches')
            .doc(churchId)
            .collection('integrations')
            .doc('zoom')
            .set({
            provider: 'zoom',
            access_token,
            refresh_token,
            expires_at: Date.now() + expires_in * 1000,
            connectedBy: adminUid,
            updatedAt: FieldValue.serverTimestamp(),
        });
        // Redirect the admin back to the mobile app using our deep link scheme
        res.redirect(`wechristian://zoom-connected?status=success&churchId=${churchId}`);
    }
    catch (error) {
        console.error('zoomOAuthCallback Error:', error.response?.data || error.message);
        res.redirect(`wechristian://zoom-connected?status=error&message=${encodeURIComponent(error.message)}`);
    }
});
/**
 * 📅 CREATE ONLINE MEETING
 * Callable function used by the Admin from the mobile app.
 */
export const createOnlineMeetingV2 = onCall(async (request) => {
    // Validate Authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { churchId, provider, title, description, startTime, endTime } = request.data;
    const adminUid = request.auth.uid;
    if (!churchId || !provider || !title || !startTime || !endTime) {
        throw new HttpsError('invalid-argument', 'Missing required fields.');
    }
    try {
        // 1. Verify user is a church admin
        // For now, assuming request validation is handled, but ideally we check Firestore:
        // const memberDoc = await getDb().collection(`churches/${churchId}/members`).doc(adminUid).get();
        // if (memberDoc.data()?.userType !== 'admin') throw new HttpsError('permission-denied', 'Only admins can create meetings.');
        let meetingUrl = '';
        const meetingsCollection = getDb().collection('churches').doc(churchId).collection('onlineMeetings');
        const meetingRef = meetingsCollection.doc();
        if (provider === 'zoom') {
            // Fetch Zoom tokens for this church
            const zoomDoc = await getDb().collection('churches').doc(churchId).collection('integrations').doc('zoom').get();
            if (!zoomDoc.exists) {
                throw new HttpsError('failed-precondition', 'Zoom is not connected for this church.');
            }
            let { access_token, refresh_token, expires_at } = zoomDoc.data();
            // Check if token is expired and refresh if necessary
            if (Date.now() > expires_at - 5 * 60 * 1000) { // 5 mins buffer
                const { clientId, clientSecret } = getZoomConfig();
                const refreshResponse = await axios.post('https://zoom.us/oauth/token', null, {
                    params: {
                        grant_type: 'refresh_token',
                        refresh_token,
                    },
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                access_token = refreshResponse.data.access_token;
                refresh_token = refreshResponse.data.refresh_token || refresh_token;
                await zoomDoc.ref.update({
                    access_token,
                    refresh_token,
                    expires_at: Date.now() + refreshResponse.data.expires_in * 1000,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
            // Create the Zoom Meeting
            const createResponse = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
                topic: title,
                agenda: description,
                type: 2, // Scheduled meeting
                start_time: new Date(startTime).toISOString(),
                duration: Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000),
                timezone: 'UTC',
                settings: {
                    host_video: true,
                    participant_video: false,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true,
                }
            }, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            });
            meetingUrl = createResponse.data.join_url;
        }
        else if (provider === 'google_meet') {
            // We will implement Google Meet next. 
            throw new HttpsError('unimplemented', 'Google Meet provider is not yet implemented.');
        }
        else {
            throw new HttpsError('invalid-argument', 'Invalid provider specified.');
        }
        // Save to Firestore
        const meetingData = {
            provider,
            title,
            description: description || '',
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            meetingUrl,
            status: 'scheduled',
            createdBy: adminUid,
            createdAt: FieldValue.serverTimestamp(),
        };
        await meetingRef.set(meetingData);
        return { success: true, meetingId: meetingRef.id, meetingUrl };
    }
    catch (error) {
        console.error('createOnlineMeeting Error:', error.response?.data || error.message);
        throw new HttpsError('internal', error.message || 'An error occurred while creating the meeting.');
    }
});
//# sourceMappingURL=meetings.js.map