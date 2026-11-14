import axios from 'axios';
import { Buffer } from 'buffer';
import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';

interface CreateZoomMeetingParams {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  churchId?: string;
}

interface ZoomMeetingResult {
  success: boolean;
  meetingId: string;
  meetingUrl: string;
  password?: string;
  startUrl?: string;
}

const DEFAULT_ACCOUNT_ID = 'htvuprx7RZWY1kmQNAEa0g';
const DEFAULT_CLIENT_ID = 'lr9jEgNKQqyLaQhfj7hcgg';
const DEFAULT_CLIENT_SECRET = 'VKlnXjMu0f2nCTTOfYjLtK2M3U2ENiNf';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getDirectZoomToken(churchId?: string): Promise<string> {
  let accountId = DEFAULT_ACCOUNT_ID;
  let clientId = DEFAULT_CLIENT_ID;
  let clientSecret = DEFAULT_CLIENT_SECRET;

  // Optional: check if church has its own Zoom credentials configured in Firestore
  if (churchId) {
    try {
      const secretSnap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('secrets')
        .doc('zoom')
        .get();
      if (secretSnap.exists()) {
        const data = secretSnap.data();
        if (data?.accountId && data?.clientId && data?.clientSecret) {
          accountId = data.accountId;
          clientId = data.clientId;
          clientSecret = data.clientSecret;
        }
      }
    } catch {
      // Use defaults if Firestore read fails
    }
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

  const response = await axios.post(tokenUrl, null, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });

  const { access_token, expires_in } = response.data;
  if (!access_token) {
    throw new Error('Failed to acquire Zoom access token.');
  }

  cachedToken = {
    token: access_token,
    expiresAt: Date.now() + (expires_in || 3600) * 1000,
  };

  return access_token;
}

function extractZoomUserId(accessToken: string): string {
  try {
    const parts = accessToken.split('.');
    if (parts.length >= 2 && parts[1]) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload && payload.uid) return payload.uid;
    }
  } catch {
    // fallback
  }
  return 'me';
}

async function createZoomMeetingDirectly(
  params: CreateZoomMeetingParams
): Promise<ZoomMeetingResult> {
  const token = await getDirectZoomToken(params.churchId);
  const userId = extractZoomUserId(token);

  const startIso = params.startTime.toISOString();
  const durationMinutes = Math.max(
    15,
    Math.round((params.endTime.getTime() - params.startTime.getTime()) / 60000)
  );

  const response = await axios.post(
    `https://api.zoom.us/v2/users/${userId}/meetings`,
    {
      topic: params.title,
      agenda: params.description || '',
      type: 2, // Scheduled meeting
      start_time: startIso,
      duration: durationMinutes,
      timezone: 'UTC',
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
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const data = response.data;
  if (!data?.join_url) {
    throw new Error('No join URL returned from Zoom API.');
  }

  return {
    success: true,
    meetingId: String(data.id || ''),
    meetingUrl: data.join_url,
    password: data.password || '',
    startUrl: data.start_url || '',
  };
}

export async function createZoomMeeting(
  params: CreateZoomMeetingParams
): Promise<ZoomMeetingResult> {
  // 1. Try Cloud Function first
  try {
    const createZoomFn = functions().httpsCallable('createZoomMeeting');
    const res = await createZoomFn({
      title: params.title,
      description: params.description || '',
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
      churchId: params.churchId,
    });

    const data = res.data as any;
    if (data && data.meetingUrl) {
      return {
        success: true,
        meetingId: String(data.meetingId || ''),
        meetingUrl: data.meetingUrl,
        password: data.password || '',
        startUrl: data.startUrl || '',
      };
    }
  } catch (cfErr: any) {
    console.log(
      'Cloud Function createZoomMeeting unavailable or failed (',
      cfErr?.message || cfErr,
      '), falling back to direct Zoom API...'
    );
  }

  // 2. Direct fallback via Zoom Server-to-Server OAuth
  return await createZoomMeetingDirectly(params);
}
