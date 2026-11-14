import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';
import * as Linking from 'expo-linking';

export interface YouTubeChannelStatus {
  isConnected: boolean;
  channelId?: string;
  channelTitle?: string;
  channelThumbnail?: string;
}

export interface CreateMeetingWithYouTubeParams {
  churchId: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime?: Date | string;
  durationMinutes?: number;
  enableYouTubeLive: boolean;
  privacy?: 'public' | 'unlisted' | 'private';
  password?: string;
}

export interface YouTubeLiveResult {
  success: boolean;
  meetingId: string;
  meetingUrl: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomPassword?: string;
  zoomStartUrl?: string;
  password?: string;
  startUrl?: string;
  youtubeLive?: {
    enabled: boolean;
    broadcastId?: string;
    streamId?: string;
    watchUrl?: string;
    privacy?: 'public' | 'unlisted' | 'private';
    status?: 'scheduled' | 'live' | 'ended' | 'failed';
    error?: string;
  };
}

export class YouTubeLiveService {
  /**
   * Fetches Google OAuth consent URL and launches the web browser for the Admin to connect their YouTube channel
   */
  static async connectYouTubeChannel(churchId: string): Promise<void> {
    try {
      let authUrl: string | undefined;

      try {
        const getAuthUrlFn = functions().httpsCallable('getYoutubeAuthUrl');
        const res = await getAuthUrlFn({ churchId });
        authUrl = (res.data as any)?.authUrl;
      } catch (callErr: any) {
        console.warn('[YouTubeLiveService] getYoutubeAuthUrl callable notice, using direct OAuth fallback:', callErr?.message);
        // Direct OAuth URL fallback so the user is never blocked
        const clientId = '962252889183-0pd9bj9acde4oql7nuonko603sg69pbv.apps.googleusercontent.com';
        const redirectUri = 'https://us-central1-wechristian-67f07.cloudfunctions.net/youtubeOAuthCallback';
        const scopes = [
          'https://www.googleapis.com/auth/youtube',
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' ');

        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${encodeURIComponent(churchId)}`;
      }

      if (!authUrl) {
        throw new Error('No authentication URL could be generated.');
      }

      await Linking.openURL(authUrl);
    } catch (err: any) {
      console.error('[YouTubeLiveService] connectYouTubeChannel error:', err);
      throw new Error(err?.message || 'Failed to initiate YouTube channel authorization.');
    }
  }

  /**
   * Checks whether the specified church has connected their YouTube channel
   */
  static async getChannelStatus(churchId: string): Promise<YouTubeChannelStatus> {
    try {
      // 1. Fast read from Firestore client cache
      const doc = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('settings')
        .doc('youtube_channel')
        .get();

      const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
      if (exists) {
        const data = doc.data();
        if (data?.isConnected) {
          return {
            isConnected: true,
            channelId: data.channelId,
            channelTitle: data.channelTitle,
            channelThumbnail: data.channelThumbnail,
          };
        }
      }

      // 2. Fallback to Cloud Function check
      const checkStatusFn = functions().httpsCallable('getYouTubeChannelStatus');
      const res = await checkStatusFn({ churchId });
      return res.data as YouTubeChannelStatus;
    } catch (err) {
      console.warn('[YouTubeLiveService] getChannelStatus notice:', err);
      return { isConnected: false };
    }
  }

  /**
   * Disconnects the church's YouTube channel
   */
  static async disconnectChannel(churchId: string): Promise<boolean> {
    try {
      const disconnectFn = functions().httpsCallable('disconnectYouTubeChannel');
      await disconnectFn({ churchId });
      return true;
    } catch (err: any) {
      console.error('[YouTubeLiveService] disconnectChannel error:', err);
      throw new Error(err?.message || 'Failed to disconnect YouTube channel.');
    }
  }

  /**
   * Schedules a Zoom meeting and automatically configures YouTube Live streaming
   */
  static async createZoomWithYouTubeLive(
    params: CreateMeetingWithYouTubeParams
  ): Promise<YouTubeLiveResult> {
    try {
      const createFn = functions().httpsCallable('createZoomWithYouTubeLive');
      const startIso = typeof params.startTime === 'string' ? params.startTime : params.startTime.toISOString();
      const endIso = params.endTime ? (typeof params.endTime === 'string' ? params.endTime : params.endTime.toISOString()) : undefined;

      const res = await createFn({
        churchId: params.churchId,
        title: params.title,
        description: params.description || '',
        startTime: startIso,
        endTime: endIso,
        durationMinutes: params.durationMinutes,
        privacy: params.privacy || 'public',
        enableYouTubeLive: params.enableYouTubeLive,
        password: params.password,
      });

      const data = res.data as any;
      return {
        success: Boolean(data?.success ?? true),
        meetingId: data.zoomMeetingId || data.meetingId,
        meetingUrl: data.zoomJoinUrl || data.meetingUrl,
        zoomMeetingId: data.zoomMeetingId || data.meetingId,
        zoomJoinUrl: data.zoomJoinUrl || data.meetingUrl,
        zoomPassword: data.zoomPassword || data.password,
        zoomStartUrl: data.zoomStartUrl || data.startUrl,
        password: data.zoomPassword || data.password,
        startUrl: data.zoomStartUrl || data.startUrl,
        youtubeLive: data.youtubeLive,
      };
    } catch (err: any) {
      console.error('[YouTubeLiveService] createZoomWithYouTubeLive error:', err);
      throw new Error(err?.message || 'Failed to create Zoom meeting with YouTube Live.');
    }
  }

  /**
   * Checks the true YouTube stream lifeCycleStatus (prevents displaying fake 'live' state)
   */
  static async checkLiveStatus(
    churchId: string,
    broadcastId: string,
    meetingId?: string
  ): Promise<{ status: 'scheduled' | 'live' | 'ended' | 'failed' | 'unknown'; watchUrl?: string }> {
    try {
      const checkFn = functions().httpsCallable('checkYouTubeLiveStatus');
      const res = await checkFn({ churchId, broadcastId, meetingId });
      return res.data as any;
    } catch (err) {
      console.warn('[YouTubeLiveService] checkLiveStatus notice:', err);
      return { status: 'unknown' };
    }
  }

  /**
   * Instructs Zoom to start pushing the live stream RTMP once host has joined the meeting
   */
  static async startZoomLiveStream(meetingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const startFn = functions().httpsCallable('startZoomLiveStream');
      const res = await startFn({ meetingId });
      return res.data as any;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to trigger Zoom stream.' };
    }
  }
}
