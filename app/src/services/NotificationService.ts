import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { messaging, firestore, auth } from './firebaseConfig';

class NotificationService {
  private pendingDispatcher: ((remoteMessage: any) => void) | null = null;

  registerPendingDispatcher(dispatcher: ((remoteMessage: any) => void) | null) {
    this.pendingDispatcher = dispatcher;
  }

  /**
   * Unified entry point for foreground banner taps, local notification taps,
   * and view-switching in-app update clicks so admin notifications safely
   * switch to Admin View before navigating to AdminRoot.
   */
  dispatchNotification(remoteMessage: any, navigation?: any) {
    if (!remoteMessage) return;
    if (this.pendingDispatcher) {
      this.pendingDispatcher(remoteMessage);
      return;
    }
    this.handleNotificationNavigation(remoteMessage, navigation);
  }

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

    const rawData = remoteMessage?.data || remoteMessage || {};
    const type = ((rawData.type || (rawData.screen === 'BibleQuizDetail' || rawData.quizId ? 'quiz' : '')) as string).toLowerCase();
    const id = rawData.quizId || rawData.relatedId || rawData.id;
    const rootRouteNames: string[] = nav.getRootState?.()?.routeNames || [];
    const hasAdminRoot = rootRouteNames.length === 0 || rootRouteNames.includes('AdminRoot');
    const navigateToAdmin = (params: Record<string, any>) => {
      if (!hasAdminRoot) {
        console.warn('⚠️ AdminRoot is not mounted in the active navigator, routing to Updates instead.');
        nav.navigate('Updates', { highlightId: id, highlightType: type });
        return;
      }
      nav.navigate('AdminRoot', params);
    };
    console.log('🚀 Navigating for notification type:', type);

    try {
      switch (type) {
        case 'daily_verse': {
          const verseId = rawData.verseId || id;
          const period = rawData.period || 'Morning';
          nav.navigate('VerseOfTheDay', { verseId, period });
          break;
        }
        case 'sermon':
          nav.navigate('Sermons');
          break;
        case 'event':
          nav.navigate('Events');
          break;
        case 'online_meeting':
          try {
            nav.navigate('OnlineMeetings');
          } catch (_) {
            try {
              navigateToAdmin({ targetTab: 'Online Meetings' });
            } catch (e) {
              console.warn('Navigation to online meetings failed:', e);
            }
          }
          break;
        case 'invoice':
          navigateToAdmin({ targetTab: 'Expense', highlightInvoiceId: id });
          break;
        case 'promise':
          nav.navigate('Updates');
          break;
        case 'attendance':
          nav.navigate('AttendanceScreen');
          break;
        case 'baptism_request_admin':
          navigateToAdmin({ targetTab: 'Baptism' });
          break;
        case 'testimony_admin': {
          const testimonyId = rawData.testimonyId || rawData.relatedId || rawData.id || id;
          navigateToAdmin({
            targetTab: 'Testimonies',
            testimonyId,
            churchId: rawData.churchId,
            timestamp: Date.now(),
          });
          break;
        }
        case 'testimony_member_status': {
          const testimonyId = rawData.testimonyId || rawData.relatedId || rawData.id || id;
          if (testimonyId) {
            nav.navigate('TestimonyDetail', {
              testimonyId,
              churchId: rawData.churchId,
            });
          } else {
            nav.navigate('Testimonies', { initialTab: 'mine' });
          }
          break;
        }
        case 'testimony_published':
        case 'testimony': {
          const testimonyId = rawData.testimonyId || rawData.relatedId || rawData.id || id;
          if (testimonyId) {
            nav.navigate('TestimonyDetail', {
              testimonyId,
              churchId: rawData.churchId,
            });
          } else {
            nav.navigate('Testimonies', { initialTab: 'feed' });
          }
          break;
        }
        case 'volunteer_application_admin': {
          const appId = rawData.applicationId || rawData.requestId || id;
          navigateToAdmin({
            targetTab: 'Volunteer Management',
            applicationId: appId,
            subType: rawData.volunteerType || rawData.subType || 'general',
            timestamp: Date.now(),
          });
          break;
        }
        case 'volunteer_application_member': {
          const eventId = rawData.eventId;
          if (eventId) {
            nav.navigate('EventDetails', { eventId, id: eventId });
          } else {
            nav.navigate('Volunteer');
          }
          break;
        }
        case 'volunteer_assignment':
        case 'volunteer_reminder':
        case 'volunteer_event_change': {
          const eventId = rawData.eventId || id;
          if (eventId) {
            nav.navigate('EventDetails', { eventId, id: eventId });
          } else {
            nav.navigate('Volunteer');
          }
          break;
        }
        case 'baptism_request_member':
        case 'birthday':
        case 'anniversary':
        case 'baptism':
        case 'celebration':
        case 'emergency':
          nav.navigate('Updates', { highlightId: id, highlightType: type });
          break;
        case 'youtube_live': {
          const liveUrl = remoteMessage.data && remoteMessage.data.url ? remoteMessage.data.url : 'https://www.youtube.com/@Brothersinchristfellowship/live';
          Linking.openURL(liveUrl).catch(function(err) {
            console.error("Couldn't open live stream URL", err);
          });
          break;
        }
        case 'LIVE_CELEBRATION':
          nav.navigate('LiveCelebrationsChat', {});
          break;
        case 'new_church':
          navigateToAdmin({ targetTab: 'App Admin' });
          break;
        case 'prayer_request_admin':
        case 'prayer_request':
        case 'prayer':
          navigateToAdmin({ targetTab: 'Prayers' });
          break;
        case 'prayer_request_public':
          nav.navigate('PrayerWall', { tab: 'public_requests' });
          break;
        case 'prayer_request_member':
          nav.navigate('PrayerWall', { tab: 'my_requests' });
          break;
        case 'quiz':
        case 'quiz_scheduled':
        case 'bible_quiz': {
          const quizTargetId = rawData.quizId || rawData.relatedId || rawData.id || id;
          const targetChurchId = rawData.churchId;
          console.log('📖 [NotificationService] Routing directly to Bible quiz:', { quizTargetId, targetChurchId });
          if (quizTargetId) {
            nav.navigate('BibleQuizDetail', {
              quizId: quizTargetId,
              id: quizTargetId,
              relatedId: rawData.relatedId || quizTargetId,
              churchId: targetChurchId,
            });
          } else {
            nav.navigate('ChurchQuizzes');
          }
          break;
        }
        case 'admin_roster_alert': {
          navigateToAdmin({
            targetTab: 'Service Roster',
            serviceId: rawData.serviceId,
            roleId: rawData.roleId,
            timestamp: Date.now(),
          });
          break;
        }
        case 'service_responsibility_broadcast':
        case 'service_reminder':
        case 'rehearsal_alert':
        case 'service_assignment':
        case 'service_roster':
        case 'roster_assignment': {
          const initialTab =
            type === 'service_assignment' ||
            type === 'service_responsibility_broadcast' ||
            type === 'service_reminder'
              ? 'responsibilities'
              : 'roster';
          nav.navigate('MyService', {
            serviceId: rawData.serviceId,
            initialTab,
          });
          break;
        }
        case 'care_cell_visit_declined': {
          navigateToAdmin({
            targetTab: 'Care Cells',
            careCellTab: rawData.careCellTab || 'visits',
            cellId: rawData.cellId,
            visitId: rawData.visitId || id,
            timestamp: Date.now(),
          });
          break;
        }
        case 'care_cell_visit':
        case 'care_cell_meeting':
        case 'care_cell_announcement':
        case 'care_cell_prayer': {
          const initialTab =
            type === 'care_cell_visit'
              ? 'visits'
              : type === 'care_cell_prayer'
              ? 'prayers'
              : type === 'care_cell_announcement'
              ? 'notices'
              : 'gatherings';
          nav.navigate('CareCell', {
            initialTab,
            visitId: rawData.visitId || id,
            cellId: rawData.cellId,
          });
          break;
        }
        case 'chat_message': {
          const chatId = rawData.chatId || rawData.relatedId || id;
          if (chatId) {
            nav.navigate('ChatRoom', {
              chatId,
              churchId: rawData.churchId,
              title: rawData.title || 'Church Chat',
              chatType: rawData.chatType || 'direct',
            });
          } else {
            nav.navigate('ChatList');
          }
          break;
        }
        default:
          if (id) {
            nav.navigate('Updates', { highlightId: id, highlightType: type });
          } else {
            console.log('Unknown notification type, staying on current screen');
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

  async subscribeToChurchTopic(churchId: string) {
    if (!churchId) return;
    try {
      // Check permission first to prevent silent failures on fresh installs (especially iOS APNS)
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
      if (!enabled) {
        console.log(`⚠️ Cannot subscribe to church_${churchId} yet: Permissions not granted.`);
        return;
      }

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

  // Subscribe Admin users to church admin alerts (e.g. Prayer Requests, Mod Alerts)
  async subscribeToChurchAdminTopic(churchId: string) {
    if (!churchId) return;
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;

      const topicName = `church_${churchId}_admin`;
      await messaging().subscribeToTopic(topicName);
      console.log(`📡 Subscribed to FCM admin topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic church_${churchId}_admin:`, error);
    }
  }

  // Unsubscribe Admin from church admin alerts (on logout or church switch)
  async unsubscribeFromChurchAdminTopic(churchId: string) {
    if (!churchId) return;
    try {
      const topicName = `church_${churchId}_admin`;
      await messaging().unsubscribeFromTopic(topicName);
      console.log(`🔌 Unsubscribed from FCM admin topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from topic church_${churchId}_admin:`, error);
    }
  }

  // Subscribe Super Admin users to platform-wide alerts
  async subscribeToSuperAdminTopic() {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
      await messaging().subscribeToTopic('platform_super_admins');
      console.log('📡 Subscribed to FCM topic: platform_super_admins');
    } catch (error) {
      console.error('❌ Failed to subscribe to platform_super_admins topic:', error);
    }
  }

  // Unsubscribe Super Admin from platform-wide alerts (on logout)
  async unsubscribeFromSuperAdminTopic() {
    try {
      await messaging().unsubscribeFromTopic('platform_super_admins');
      console.log('🔌 Unsubscribed from FCM topic: platform_super_admins');
    } catch (error) {
      console.error('❌ Failed to unsubscribe from platform_super_admins topic:', error);
    }
  }

  // Handle notifications when the app is open (foreground)
  setupForegroundListener(navigation?: any) {
    return messaging().onMessage(async remoteMessage => {
      console.log('⚡ Foreground push received:', remoteMessage?.notification?.title);
      // Foreground notifications are cleanly displayed via the in-app sliding banner in App.js
      // System modal Alert.alert is suppressed to avoid duplicate intrusive popups
    });
  }
}

export default new NotificationService();
