import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { messaging, firestore, auth } from './firebaseConfig';

class NotificationService {
  messaging() {
    return messaging();
  }

  async requestUserPermission() {
    console.log('🧐 Requesting Notification Permissions...');
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      console.log('🤖 Android Notification Status:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('📱 Permission Enabled:', enabled);
    return enabled;
  }

  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('✅ FCM Token Found:', token);
        await this.saveTokenToFirestore(token);
        return token;
      } else {
        console.log('❌ No FCM token returned from messaging()');
      }
    } catch (error) {
      console.error('❌ FCM Token Error:', error);
    }
    return null;
  }

  async saveTokenToFirestore(token: string) {
    try {
      const user = auth().currentUser;
      if (!user) {
        console.log('⚠️ Cannot save token: No user logged in');
        return;
      }

      console.log('📤 Fetching user global church association to save token for UID:', user.uid);
      const FirestoreService = require('./FirestoreService').default;
      const globalUser = await FirestoreService.getGlobalUser(user.uid);

      if (globalUser?.primaryChurchId) {
        // Save to church members subcollection
        await firestore().collection('churches').doc(globalUser.primaryChurchId).collection('members').doc(user.uid).set({
          fcmToken: token,
          lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          platform: Platform.OS,
        }, { merge: true });

        // ALSO save to global users collection — Cloud Functions read tokens from here
        await firestore().collection('users').doc(user.uid).set({
          fcmToken: token,
          lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          primaryChurchId: globalUser.primaryChurchId,
          platform: Platform.OS,
        }, { merge: true });

        console.log('✨ Token saved successfully to member profile AND global users!');
      } else {
        console.log('⚠️ Token not saved: User does not belong to a church yet.');
      }
    } catch (err) {
      console.error('❌ Firestore Token Save Error:', err);
    }
  }

  // Handle navigation when a notification is clicked
  handleNotificationNavigation(remoteMessage: any, navigation: any) {
    if (!remoteMessage) return;

    // We can import the global ref to check if the navigator is fully ready
    const { navigationRef } = require('../../App');
    
    // Determine which navigation object to use
    let nav = null;
    if (navigationRef.isReady()) {
      nav = navigationRef;
    } else if (navigation && typeof navigation.navigate === 'function') {
      nav = navigation;
    }

    if (!nav) {
      console.log('⚠️ Navigation not fully ready yet, skipping notification navigation.');
      return;
    }

    const { type, id } = remoteMessage.data || {};
    console.log('🚀 Navigating for notification type:', type);

    try {
      switch (type) {
        case 'sermon':
          nav.navigate('Sermons');
          break;
        case 'event':
          nav.navigate('Events');
          break;
        case 'promise':
          nav.navigate('Updates');
          break;
        case 'attendance':
          nav.navigate('AttendanceScreen');
          break;
        case 'birthday':
        case 'anniversary':
        case 'baptism':
        case 'celebration':
        case 'emergency':
          nav.navigate('Updates', { highlightId: id, highlightType: type });
          break;
        case 'youtube_live':
          {
            const liveUrl = remoteMessage.data?.url || 'https://www.youtube.com/@Brothersinchristfellowship/live';
            Linking.openURL(liveUrl).catch(err => {
              console.error("Couldn't open live stream URL", err);
            });
          }
          break;
        default:
          // Fallback: navigate to Updates if it has a broadcast ID
          if (id) {
            nav.navigate('Updates', { highlightId: id, highlightType: type });
          } else {
            console.log('❓ Unknown notification type, staying on current screen');
          }
      }
    } catch (e) {
      console.error('❌ Notification navigation failed:', e);
    }
  }

  // Handle background notifications
  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }

  // Subscribe user to a specific church topic for isolated notifications
  async subscribeToChurchTopic(churchId: string) {
    if (!churchId) return;
    try {
      const topicName = `church_${churchId}`;
      await messaging().subscribeToTopic(topicName);
      console.log(`📡 Subscribed to FCM topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic church_${churchId}:`, error);
    }
  }

  // Unsubscribe user from a church topic (useful when switching churches or logging out)
  async unsubscribeFromChurchTopic(churchId: string) {
    if (!churchId) return;
    try {
      const topicName = `church_${churchId}`;
      await messaging().unsubscribeFromTopic(topicName);
      console.log(`🔌 Unsubscribed from FCM topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from topic church_${churchId}:`, error);
    }
  }

  // Handle notifications when the app is open (foreground)
  // NOTE: FCM already shows a system heads-up notification on Android even when the app is in foreground.
  // Do NOT show an Alert here — that would cause a double notification (system tray + in-app popup).
  // Navigation on tap is handled by onNotificationOpenedApp in RootNavigator.
  setupForegroundListener(navigation?: any) {
    return messaging().onMessage(async remoteMessage => {
      // Only log — do not show Alert (system notification already shown by FCM)
      console.log('⚡ Foreground push received (system notification already shown):', remoteMessage?.notification?.title);
    });
  }
}

export default new NotificationService();
