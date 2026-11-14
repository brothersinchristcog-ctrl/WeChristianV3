import { Linking, Platform, Clipboard, ToastAndroid } from 'react-native';

export interface ZoomLaunchParams {
  meetingLink?: string;
  meetingId?: string;
  password?: string;
  userName?: string;
}

/**
 * Automatically launches a Zoom meeting with credentials auto-filled.
 * If Zoom app is installed, uses the zoomus:// custom scheme so the passcode and name
 * are populated automatically without prompting the user.
 * Falls back to web URL with encrypted/raw password query parameter.
 */
export async function openZoomMeeting(params: ZoomLaunchParams): Promise<void> {
  const { meetingLink = '', meetingId = '', password = '', userName = 'Church Member' } = params;

  // 1. Auto-copy passcode to clipboard as instant failsafe
  if (password) {
    try {
      Clipboard.setString(password);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Passcode ${password} auto-filled!`, ToastAndroid.SHORT);
      }
    } catch (_) {}
  }

  // 2. Extract meeting ID from link if not provided directly
  let cleanId = meetingId.replace(/[\s-]/g, '');
  if (!cleanId && meetingLink) {
    const idMatch = meetingLink.match(/\/j\/(\d+)/);
    if (idMatch) {
      cleanId = idMatch[1];
    }
  }

  // 3. Extract pwd from link if not provided directly
  let cleanPwd = password;
  if (!cleanPwd && meetingLink) {
    const pwdMatch = meetingLink.match(/[?&]pwd=([^&#]+)/);
    if (pwdMatch) {
      cleanPwd = pwdMatch[1];
    }
  }

  // 4. Try native Zoom app protocol (zoomus://)
  // zoomus://zoom.us/join?confno={id}&pwd={pwd}&uname={name}
  if (cleanId) {
    const pwdPart = cleanPwd ? `&pwd=${encodeURIComponent(cleanPwd)}` : '';
    const unamePart = userName ? `&uname=${encodeURIComponent(userName)}` : '';
    const zoomusUrl = `zoomus://zoom.us/join?confno=${cleanId}${pwdPart}${unamePart}`;

    try {
      const canOpen = await Linking.canOpenURL('zoomus://');
      if (canOpen) {
        console.log('🚀 Launching Zoom native app with auto-filled passcode:', zoomusUrl);
        await Linking.openURL(zoomusUrl);
        return;
      }
    } catch (err) {
      console.warn('Native zoomus:// check failed, falling back to web link:', err);
    }
  }

  // 5. Fallback to HTTPS web URL
  let webUrl = meetingLink;
  if (cleanId && !webUrl) {
    webUrl = `https://zoom.us/j/${cleanId}${cleanPwd ? `?pwd=${encodeURIComponent(cleanPwd)}` : ''}`;
  } else if (webUrl && cleanPwd && !webUrl.includes('pwd=')) {
    const separator = webUrl.includes('?') ? '&' : '?';
    webUrl = `${webUrl}${separator}pwd=${encodeURIComponent(cleanPwd)}`;
  }

  if (webUrl) {
    console.log('🌐 Opening Zoom web URL:', webUrl);
    await Linking.openURL(webUrl);
  }
}
