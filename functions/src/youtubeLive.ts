import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { getZoomServerToServerToken, extractZoomUserId } from './meetings.js';

const getDb = () => getFirestore();

const CLIENT_ID = process.env.GOOGLE_YOUTUBE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_YOUTUBE_CLIENT_SECRET || '';
const REDIRECT_URI =
  process.env.GOOGLE_YOUTUBE_REDIRECT_URI ||
  'https://us-central1-wechristian-67f07.cloudfunctions.net/youtubeOAuthCallback';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Helper: Retrieve fresh access token for church YouTube account
 */
async function getChurchYouTubeAccessToken(churchId: string): Promise<string> {
  const secretDoc = await getDb()
    .collection('churches')
    .doc(churchId)
    .collection('secrets')
    .doc('youtube')
    .get();

  if (!secretDoc.exists) {
    throw new HttpsError(
      'failed-precondition',
      'No YouTube channel connected for this church. Please connect a YouTube channel in Admin settings.'
    );
  }

  const secretData = secretDoc.data() || {};
  const refreshToken = secretData.refreshToken;
  if (!refreshToken) {
    throw new HttpsError('unauthenticated', 'YouTube refresh token missing. Please re-connect channel.');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const tokenRes = await oauth2Client.getAccessToken();
  const accessToken = tokenRes.token;
  if (!accessToken) {
    throw new HttpsError('internal', 'Failed to refresh YouTube access token.');
  }

  return accessToken;
}

/**
 * 1. 🔗 GET YOUTUBE OAUTH URL (Callable)
 * Generates the Google sign-in consent link for the Church Admin
 */
export const getYoutubeAuthUrl = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { churchId } = request.data || {};
  if (!churchId) {
    throw new HttpsError('invalid-argument', 'churchId is required.');
  }

  const oauth2Client = createOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: YOUTUBE_SCOPES,
    state: churchId,
  });

  return { authUrl };
});

/**
 * 2. 🚀 YOUTUBE OAUTH CALLBACK (HTTP)
 * Redirect URI registered in Google Cloud Console
 */
export const youtubeOAuthCallback = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  const code = req.query.code as string;
  const churchId = (req.query.state as string) || 'global';
  const error = req.query.error as string;

  if (error) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>YouTube Authorization Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #1e293b; padding: 32px; border-radius: 16px; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Cancelled</h2>
            <p>Google authorization was not completed (${error}). You can close this window and try again.</p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  if (!code) {
    res.status(400).send('Authorization code missing.');
    return;
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn('[YouTubeOAuth] No refresh_token returned. User might have previously consented.');
    }

    oauth2Client.setCredentials(tokens);

    // Fetch authorized YouTube Channel details
    let channelId = '';
    let channelTitle = 'Church Channel';
    let channelThumbnail = '';

    try {
      const channelRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      const items = channelRes.data?.items;
      if (items && items.length > 0) {
        const ch = items[0];
        channelId = ch.id;
        channelTitle = ch.snippet?.title || 'Church Channel';
        channelThumbnail = ch.snippet?.thumbnails?.default?.url || ch.snippet?.thumbnails?.high?.url || '';
      }
    } catch (chErr: any) {
      console.warn('[YouTubeOAuth] Error fetching channel info:', chErr?.message);
    }

    // Persist secret tokens securely in Firestore
    const secretsRef = getDb().collection('churches').doc(churchId).collection('secrets').doc('youtube');
    const existingSecret = await secretsRef.get();
    const existingData = existingSecret.data() || {};

    await secretsRef.set(
      {
        refreshToken: tokens.refresh_token || existingData.refreshToken || '',
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date || 0,
        channelId,
        channelTitle,
        channelThumbnail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Save public channel status for UI display
    await getDb().collection('churches').doc(churchId).collection('settings').doc('youtube_channel').set(
      {
        isConnected: true,
        channelId,
        channelTitle,
        channelThumbnail,
        connectedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>YouTube Connected</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b132b; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #1c2541; padding: 36px; border-radius: 20px; max-width: 440px; box-shadow: 0 12px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); }
            .badge { display: inline-flex; align-items: center; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.3); }
            h2 { font-size: 24px; margin: 0 0 10px 0; color: #ffffff; }
            .ch-name { color: #f59e0b; font-weight: 700; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
            .btn { background: #dc2626; color: #ffffff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓ Connected Successfully</div>
            <h2>YouTube Channel Linked</h2>
            <p>Your channel <span class="ch-name">${channelTitle}</span> is now linked to WeChristian for Live Streaming.</p>
            <p style="font-size: 13px; color: #64748b;">You can safely close this browser window and return to the WeChristian app.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[YouTubeOAuth] Error in callback:', err?.message || err);
    res.status(500).send(`Failed to complete YouTube connection: ${err?.message || 'Internal error'}`);
  }
});

/**
 * 3. 🔍 GET YOUTUBE CHANNEL STATUS (Callable)
 * Checks whether the church has an active linked YouTube channel
 */
export const getYouTubeChannelStatus = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { churchId } = request.data || {};
  if (!churchId) {
    throw new HttpsError('invalid-argument', 'churchId is required.');
  }

  const doc = await getDb()
    .collection('churches')
    .doc(churchId)
    .collection('settings')
    .doc('youtube_channel')
    .get();

  if (!doc.exists) {
    return { isConnected: false };
  }

  const data = doc.data() || {};
  return {
    isConnected: Boolean(data.isConnected),
    channelId: data.channelId || '',
    channelTitle: data.channelTitle || '',
    channelThumbnail: data.channelThumbnail || '',
  };
});

/**
 * 4. ❌ DISCONNECT YOUTUBE CHANNEL (Callable)
 */
export const disconnectYouTubeChannel = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { churchId } = request.data || {};
  if (!churchId) {
    throw new HttpsError('invalid-argument', 'churchId is required.');
  }

  await getDb().collection('churches').doc(churchId).collection('secrets').doc('youtube').delete();
  await getDb().collection('churches').doc(churchId).collection('settings').doc('youtube_channel').set(
    {
      isConnected: false,
      channelId: '',
      channelTitle: '',
      channelThumbnail: '',
      disconnectedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
});

/**
 * 5. 🎥 CREATE ZOOM MEETING + YOUTUBE LIVE STREAM (Callable)
 * Complete automated pipeline:
 * - Creates YouTube LiveBroadcast + LiveStream (RTMP)
 * - Binds YouTube broadcast to stream
 * - Creates Zoom meeting via Server-to-Server OAuth
 * - Pre-configures Zoom with YouTube RTMP Stream URL & Key (PATCH /meetings/{id}/livestream)
 * - Persists meeting entity in Firestore
 */
export const createZoomWithYouTubeLive = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const {
    churchId,
    title,
    description,
    startTime,
    endTime,
    privacy = 'public',
    enableYouTubeLive = true,
    password,
  } = request.data || {};

  if (!title) {
    throw new HttpsError('invalid-argument', 'Title is required for the meeting.');
  }
  if (!churchId) {
    throw new HttpsError('invalid-argument', 'churchId is required.');
  }

  const startDt = startTime ? new Date(startTime) : new Date();
  const endDt = endTime ? new Date(endTime) : new Date(startDt.getTime() + 60 * 60 * 1000);
  const durationMinutes = Math.max(15, Math.round((endDt.getTime() - startDt.getTime()) / 60000));

  // 1. Create Zoom Meeting via Zoom Server-to-Server OAuth
  let zoomMeetingId = '';
  let zoomJoinUrl = '';
  let zoomStartUrl = '';
  let zoomPassword = password || String(Math.floor(100000 + Math.random() * 900000));

  try {
    const zoomToken = await getZoomServerToServerToken();
    const userId = extractZoomUserId(zoomToken);

    const zoomRes = await axios.post(
      `https://api.zoom.us/v2/users/${userId}/meetings`,
      {
        topic: title,
        agenda: description || '',
        type: 2,
        start_time: startDt.toISOString(),
        duration: durationMinutes,
        timezone: 'UTC',
        password: zoomPassword,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
          waiting_room: false,
          approval_type: 0,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const zmData = zoomRes.data;
    zoomMeetingId = String(zmData.id);
    zoomJoinUrl = zmData.join_url;
    zoomStartUrl = zmData.start_url || '';
    zoomPassword = zmData.password || zoomPassword;
  } catch (zmErr: any) {
    console.error('[createZoomWithYouTubeLive] Zoom create error:', zmErr?.response?.data || zmErr?.message);
    throw new HttpsError('internal', `Zoom Meeting creation failed: ${zmErr?.response?.data?.message || zmErr?.message}`);
  }

  let youtubeLiveDetails: any = null;

  // 2. Provision YouTube Live Broadcast & RTMP Stream if requested
  if (enableYouTubeLive) {
    try {
      const ytAccessToken = await getChurchYouTubeAccessToken(churchId);

      // A. Create LiveBroadcast
      const broadcastRes = await axios.post(
        'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails',
        {
          snippet: {
            title: title,
            description: description || `Live Service from WeChristian`,
            scheduledStartTime: startDt.toISOString(),
          },
          status: {
            privacyStatus: privacy,
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
            recordFromStart: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${ytAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const broadcastData = broadcastRes.data;
      const broadcastId = broadcastData.id;
      const watchUrl = `https://www.youtube.com/watch?v=${broadcastId}`;

      // B. Create LiveStream (RTMP Ingestion)
      const streamRes = await axios.post(
        'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn',
        {
          snippet: {
            title: `${title} - RTMP Ingestion`,
          },
          cdn: {
            ingestionType: 'rtmp',
            resolution: 'variable',
            frameRate: 'variable',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${ytAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const streamData = streamRes.data;
      const streamId = streamData.id;
      const rtmpIngestionUrl = streamData.cdn?.ingestionInfo?.ingestionAddress || 'rtmp://a.rtmp.youtube.com/live2';
      const rtmpStreamKey = streamData.cdn?.ingestionInfo?.streamName;

      // C. Bind LiveBroadcast to LiveStream
      await axios.post(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&part=id,contentDetails&streamId=${streamId}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${ytAccessToken}`,
          },
        }
      );

      // D. Configure Zoom Meeting Live Stream settings via Zoom API
      if (rtmpStreamKey) {
        try {
          const zoomToken = await getZoomServerToServerToken();
          await axios.patch(
            `https://api.zoom.us/v2/meetings/${zoomMeetingId}/livestream`,
            {
              stream_url: rtmpIngestionUrl,
              stream_key: rtmpStreamKey,
              page_url: watchUrl,
            },
            {
              headers: {
                Authorization: `Bearer ${zoomToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(`✅ [createZoomWithYouTubeLive] Pre-configured Zoom livestream for meeting ${zoomMeetingId}`);
        } catch (patchErr: any) {
          console.warn('[createZoomWithYouTubeLive] Notice patching Zoom livestream:', patchErr?.response?.data || patchErr?.message);
        }
      }

      youtubeLiveDetails = {
        enabled: true,
        broadcastId,
        streamId,
        watchUrl,
        privacy,
        status: 'scheduled',
      };
    } catch (ytErr: any) {
      console.error('[createZoomWithYouTubeLive] YouTube Live setup error:', ytErr?.response?.data || ytErr?.message);
      // Even if YouTube setup encountered error, meeting is created with error flag
      youtubeLiveDetails = {
        enabled: true,
        status: 'failed',
        error: ytErr?.response?.data?.error?.message || ytErr?.message || 'Failed to setup YouTube Live',
      };
    }
  }

  // 3. Save Online Meeting in Firestore
  const pad = (n: number) => String(n).padStart(2, '0');
  const scheduledDate = `${startDt.getFullYear()}-${pad(startDt.getMonth() + 1)}-${pad(startDt.getDate())}`;
  const scheduledTime = `${pad(startDt.getHours())}:${pad(startDt.getMinutes())}`;

  const meetingRecord: any = {
    id: zoomMeetingId,
    title,
    description: description || '',
    provider: 'zoom',
    meetingType: 'zoom',
    meetingLink: zoomJoinUrl,
    password: zoomPassword,
    startUrl: zoomStartUrl,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    status: 'scheduled',
    churchId,
    youtubeLive: youtubeLiveDetails || { enabled: false },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await getDb()
    .collection('churches')
    .doc(churchId)
    .collection('online_meetings')
    .doc(zoomMeetingId)
    .set(meetingRecord);

  return {
    success: true,
    meetingId: zoomMeetingId,
    meetingUrl: zoomJoinUrl,
    password: zoomPassword,
    startUrl: zoomStartUrl,
    youtubeLive: youtubeLiveDetails,
  };
});

/**
 * 6. 🔴 CHECK YOUTUBE LIVE STATUS (Callable)
 * Queries real YouTube Data API lifeCycleStatus so no fake status is ever shown
 */
export const checkYouTubeLiveStatus = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { churchId, broadcastId, meetingId } = request.data || {};
  if (!broadcastId || !churchId) {
    throw new HttpsError('invalid-argument', 'broadcastId and churchId are required.');
  }

  try {
    const ytAccessToken = await getChurchYouTubeAccessToken(churchId);
    const res = await axios.get(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=status,snippet&id=${broadcastId}`,
      {
        headers: { Authorization: `Bearer ${ytAccessToken}` },
      }
    );

    const items = res.data?.items;
    if (!items || items.length === 0) {
      return { status: 'not_found' };
    }

    const lifeCycleStatus = items[0].status?.lifeCycleStatus; // 'created' | 'ready' | 'testing' | 'live' | 'complete' | 'revoked'
    let mappedStatus: 'scheduled' | 'live' | 'ended' | 'failed' = 'scheduled';

    if (lifeCycleStatus === 'live' || lifeCycleStatus === 'liveStarting') {
      mappedStatus = 'live';
    } else if (lifeCycleStatus === 'complete') {
      mappedStatus = 'ended';
    } else if (lifeCycleStatus === 'revoked') {
      mappedStatus = 'failed';
    } else {
      mappedStatus = 'scheduled';
    }

    // Update in Firestore meeting record if meetingId is provided
    if (meetingId) {
      await getDb()
        .collection('churches')
        .doc(churchId)
        .collection('online_meetings')
        .doc(meetingId)
        .update({
          'youtubeLive.status': mappedStatus,
          updatedAt: FieldValue.serverTimestamp(),
        })
        .catch(() => {});
    }

    return {
      status: mappedStatus,
      lifeCycleStatus,
      watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
    };
  } catch (err: any) {
    console.warn('[checkYouTubeLiveStatus] Error:', err?.message);
    return { status: 'unknown', error: err?.message };
  }
});

/**
 * 7. ▶ START ZOOM LIVE STREAM (Callable)
 * Triggers Zoom to begin pushing RTMP to YouTube once the meeting has started
 */
export const startZoomLiveStream = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { meetingId } = request.data || {};
  if (!meetingId) {
    throw new HttpsError('invalid-argument', 'meetingId is required.');
  }

  try {
    const zoomToken = await getZoomServerToServerToken();
    const res = await axios.patch(
      `https://api.zoom.us/v2/meetings/${meetingId}/livestream/status`,
      { action: 'start' },
      {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, data: res.data };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Zoom livestream could not be started.';
    return { success: false, message: msg };
  }
});
