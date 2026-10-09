import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from './firebaseConfig';
import { getLocalizedDailyQuizTitle } from '../constants/DailyQuizTranslations';
import { SupportedLanguage } from '../locales';

const QUIZ_NOTIF_STORAGE_KEY = '@wechristian_scheduled_quiz_notifs';
const QUIZ_SCHEDULE_SETTINGS_KEY = '@wechristian_daily_quiz_schedule_settings';
const NOTIF_ID_PREFIX = 'daily_quiz_slot_';

export interface DailyQuizScheduleConfig {
  enabled: boolean;
  scheduledTime: string; // e.g. "06:00"
  time24?: string;
  hour?: number;
  minute?: number;
  customTitle?: string;
  customBody?: string;
  targetScope?: 'all' | 'church';
  updatedAt?: any;
}

const DEFAULT_SCHEDULE_CONFIG: DailyQuizScheduleConfig = {
  enabled: true,
  scheduledTime: '06:00',
  time24: '06:00',
  hour: 6,
  minute: 0,
  customTitle: 'Daily Bible Quiz is Live!',
  customBody: "Today's Scripture challenge is ready. Test your knowledge and reflect on God's Word!",
  targetScope: 'all',
};

class DailyQuizNotificationService {
  private isScheduling = false;

  /**
   * Loads schedule settings from Firestore and caches locally.
   */
  async getScheduleConfig(): Promise<DailyQuizScheduleConfig> {
    try {
      const snap = await firestore()
        .collection('churches')
        .doc('global')
        .collection('settings')
        .doc('daily_quiz_schedule')
        .get();

      const exists = typeof (snap as any).exists === 'function' ? (snap as any).exists() : (snap as any).exists;
      if (exists) {
        const data = snap.data() as Partial<DailyQuizScheduleConfig>;
        const timeVal = data.scheduledTime || data.time24 || '06:00';
        const parts = timeVal.split(':');
        const h = typeof data.hour === 'number' ? data.hour : parseInt(parts[0], 10) || 6;
        const m = typeof data.minute === 'number' ? data.minute : parseInt(parts[1], 10) || 0;

        const config: DailyQuizScheduleConfig = {
          enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
          scheduledTime: timeVal,
          time24: timeVal,
          hour: h,
          minute: m,
          customTitle: data.customTitle || DEFAULT_SCHEDULE_CONFIG.customTitle,
          customBody: data.customBody || DEFAULT_SCHEDULE_CONFIG.customBody,
          targetScope: data.targetScope || 'all',
        };
        await AsyncStorage.setItem(QUIZ_SCHEDULE_SETTINGS_KEY, JSON.stringify(config)).catch(() => {});
        return config;
      }
    } catch {
      // offline fallback
    }

    try {
      const cached = await AsyncStorage.getItem(QUIZ_SCHEDULE_SETTINGS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...DEFAULT_SCHEDULE_CONFIG,
          ...parsed,
          scheduledTime: parsed.scheduledTime || parsed.time24 || '06:00',
        };
      }
    } catch {}

    return DEFAULT_SCHEDULE_CONFIG;
  }

  /**
   * Super Admin saves schedule settings to Firestore & updates device local notification triggers.
   */
  async saveScheduleConfig(config: DailyQuizScheduleConfig): Promise<boolean> {
    try {
      const timeVal = config.scheduledTime || config.time24 || '06:00';
      const parts = timeVal.split(':');
      const h = typeof config.hour === 'number' ? config.hour : parseInt(parts[0], 10) || 6;
      const m = typeof config.minute === 'number' ? config.minute : parseInt(parts[1], 10) || 0;

      const cleanConfig: DailyQuizScheduleConfig = {
        enabled: config.enabled,
        scheduledTime: timeVal,
        time24: timeVal,
        hour: h,
        minute: m,
        customTitle: config.customTitle || DEFAULT_SCHEDULE_CONFIG.customTitle,
        customBody: config.customBody || DEFAULT_SCHEDULE_CONFIG.customBody,
        targetScope: config.targetScope || 'all',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // 1. Write to Firestore global settings
      await firestore()
        .collection('churches')
        .doc('global')
        .collection('settings')
        .doc('daily_quiz_schedule')
        .set(cleanConfig, { merge: true });

      // 2. Also write to root settings for Cloud Functions compatibility
      await firestore()
        .collection('settings')
        .doc('daily_quiz_schedule')
        .set(cleanConfig, { merge: true })
        .catch(() => {});

      // 3. Cache locally in AsyncStorage
      await AsyncStorage.setItem(QUIZ_SCHEDULE_SETTINGS_KEY, JSON.stringify(cleanConfig));

      // 4. Cancel existing local notification triggers
      await this.cancelAllScheduled();

      // 5. Re-schedule upcoming notifications with the new scheduled time
      if (cleanConfig.enabled) {
        await this.syncAndScheduleUpcoming(14);
      }
      return true;
    } catch (err: any) {
      console.error('[DailyQuizNotificationService] Failed to save schedule settings:', err);
      return false;
    }
  }

  /**
   * Cancel all existing daily quiz notifications
   */
  async cancelAllScheduled(): Promise<void> {
    try {
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const quizNotifs = allScheduled.filter(n => n.identifier && n.identifier.startsWith(NOTIF_ID_PREFIX));
      for (const n of quizNotifs) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    } catch (e) {
      console.warn('[DailyQuizNotificationService] Error cancelling notifications:', e);
    }
  }

  /**
   * Initializes the notification channel and schedules upcoming notifications.
   */
  async initialize(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[DailyQuizNotificationService] Notification permission not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily_quiz', {
          name: 'Daily Bible Quiz',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          showBadge: true,
        });
      }

      await this.syncAndScheduleUpcoming();
    } catch (e) {
      console.warn('[DailyQuizNotificationService] Initialization error:', e);
    }
  }

  /**
   * Requests notification permissions from user.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Schedules notifications for the next N days based on Super Admin configured schedule time.
   */
  async syncAndScheduleUpcoming(daysAhead: number = 14): Promise<{ scheduledCount: number; nextDate: string | null }> {
    if (this.isScheduling) return { scheduledCount: 0, nextDate: null };
    this.isScheduling = true;

    try {
      const config = await this.getScheduleConfig();
      if (!config.enabled) {
        await this.cancelAllScheduled();
        return { scheduledCount: 0, nextDate: null };
      }

      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingQuizNotifIds = new Set(
        allScheduled
          .filter(n => n.identifier && n.identifier.startsWith(NOTIF_ID_PREFIX))
          .map(n => n.identifier)
      );

      const now = new Date();
      let scheduledCount = 0;
      let firstUpcomingDate: string | null = null;

      for (let i = 0; i <= daysAhead; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const notifId = `${NOTIF_ID_PREFIX}${dateStr}`;

        const hour = typeof config.hour === 'number' ? config.hour : 6;
        const minute = typeof config.minute === 'number' ? config.minute : 0;

        // Delivery time based on Super Admin schedule
        const scheduleDateTime = new Date(targetDate);
        scheduleDateTime.setHours(hour, minute, 0, 0);

        // If today's scheduled time has already passed, skip today and look at tomorrow
        if (scheduleDateTime.getTime() <= Date.now()) {
          continue;
        }

        if (!firstUpcomingDate) {
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const h12 = hour % 12 || 12;
          const mStr = String(minute).padStart(2, '0');
          firstUpcomingDate = `${dateStr} ${h12}:${mStr} ${ampm}`;
        }

        // Avoid re-scheduling if already registered with the OS
        if (existingQuizNotifIds.has(notifId)) {
          continue;
        }

        const titleText = config.customTitle || '📖 Daily Bible Quiz is Live!';
        const bodyText = config.customBody || `Today's Scripture challenge (${dateStr}) is ready. Test your knowledge and reflect on God's Word!`;

        await Notifications.scheduleNotificationAsync({
          identifier: notifId,
          content: {
            title: titleText,
            body: bodyText,
            sound: true,
            data: {
              type: 'bible_quiz',
              quizId: `daily_quiz_${dateStr}`,
              id: `daily_quiz_${dateStr}`,
              relatedId: `daily_quiz_${dateStr}`,
              churchId: 'global',
              scheduledDate: dateStr,
              screen: 'BibleQuizDetail',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduleDateTime,
            channelId: 'daily_quiz',
          },
        });

        scheduledCount++;
      }

      // Also register a recurring daily fallback trigger for exact 6:00 AM delivery
      try {
        const hour = typeof config.hour === 'number' ? config.hour : 6;
        const minute = typeof config.minute === 'number' ? config.minute : 0;
        await Notifications.scheduleNotificationAsync({
          identifier: `${NOTIF_ID_PREFIX}repeating_daily`,
          content: {
            title: config.customTitle || '📖 Daily Bible Quiz is Live!',
            body: config.customBody || "Today's Scripture challenge is ready. Test your knowledge and reflect on God's Word!",
            sound: true,
            data: {
              type: 'bible_quiz',
              quizId: 'daily_today',
              screen: 'BibleQuizDetail',
              churchId: 'global',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'daily_quiz',
          },
        });
      } catch (dailyErr) {
        // Optional daily fallback
      }

      console.log(`[DailyQuizNotificationService] Scheduled ${scheduledCount} notifications for ${config.time24}. Next: ${firstUpcomingDate}`);
      return { scheduledCount, nextDate: firstUpcomingDate };
    } catch (e) {
      console.warn('[DailyQuizNotificationService] Schedule error:', e);
      return { scheduledCount: 0, nextDate: null };
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Super Admin action: Instantly broadcasts today's Daily Quiz push notification
   * to all church members across the entire platform via Cloud Functions / Firestore.
   */
  async broadcastDailyQuizPushNow(): Promise<{ success: boolean; message: string; churchCount: number }> {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const quizId = `daily_quiz_${dateStr}`;

      const config = await this.getScheduleConfig();
      const pushTitle = config.customTitle || '📖 Daily Bible Quiz is Live!';
      const pushBody = config.customBody || `Today's Scripture challenge (${dateStr}) is ready. Test your knowledge and reflect on God's Word!`;

      // 1. Fetch all active churches
      const churchesSnap = await firestore().collection('churches').get();
      const targetChurches: string[] = [];
      churchesSnap.docs.forEach((doc: any) => {
        if (doc.id !== 'global') {
          targetChurches.push(doc.id);
        }
      });

      // 2. Add broadcast to each church (triggers Cloud Functions broadcast push to all members)
      for (const cId of targetChurches) {
        await firestore()
          .collection('churches')
          .doc(cId)
          .collection('broadcasts')
          .add({
            title: pushTitle,
            content: pushBody,
            type: 'quiz',
            quizId: quizId,
            id: quizId,
            relatedId: quizId,
            screen: 'BibleQuizDetail',
            churchId: cId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          })
          .catch(() => {});

        await firestore()
          .collection('churches')
          .doc(cId)
          .collection('notifications')
          .add({
            title: pushTitle,
            body: pushBody,
            type: 'quiz',
            quizId: quizId,
            id: quizId,
            relatedId: quizId,
            screen: 'BibleQuizDetail',
            churchId: cId,
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
          })
          .catch(() => {});
      }

      // 3. Mark lastBroadcastDate in Firestore
      await firestore()
        .collection('churches')
        .doc('global')
        .collection('settings')
        .doc('daily_quiz_schedule')
        .set({
          lastBroadcastDate: dateStr,
          lastBroadcastAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true })
        .catch(() => {});

      return {
        success: true,
        message: `Live Daily Quiz push broadcasted across ${targetChurches.length} churches!`,
        churchCount: targetChurches.length,
      };
    } catch (e: any) {
      console.error('[DailyQuizNotificationService] Error in broadcastDailyQuizPushNow:', e);
      return { success: false, message: e?.message || 'Failed to broadcast', churchCount: 0 };
    }
  }

  /**
   * Instantly triggers a test Daily Bible Quiz notification in `secondsDelay` seconds (default 2s)
   * so the admin / user can immediately check and verify the 5:00 AM notification right now!
   */
  async sendTestQuizNotification(secondsDelay: number = 2, language: SupportedLanguage = 'en'): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily_quiz', {
          name: 'Daily Bible Quiz',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          showBadge: true,
        });
      }

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const title = getLocalizedDailyQuizTitle(dateStr, language);

      const triggerDate = new Date(Date.now() + Math.max(1, secondsDelay) * 1000);

      const config = await this.getScheduleConfig();
      const timeDisplay = config.scheduledTime || config.time24 || '06:00';

      await Notifications.scheduleNotificationAsync({
        identifier: `test_quiz_${Date.now()}`,
        content: {
          title: `📖 ${title} is Live! (${timeDisplay} Test)`,
          body: config.customBody || `Today's Scripture challenge for ${dateStr} is ready. Tap to test your biblical knowledge!`,
          sound: true,
          data: {
            type: 'bible_quiz',
            quizId: `daily_quiz_${dateStr}`,
            churchId: 'global',
            scheduledDate: dateStr,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'daily_quiz',
        },
      });

      return true;
    } catch (e) {
      console.warn('[DailyQuizNotificationService] Failed to send test notification:', e);
      return false;
    }
  }

  /**
   * Returns information about upcoming scheduled 5:00 AM quiz notifications.
   */
  async getStatus(): Promise<{ scheduledTotal: number; nextDate: string | null }> {
    try {
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const quizNotifs = allScheduled.filter(
        n => n.identifier && n.identifier.startsWith(NOTIF_ID_PREFIX)
      );

      // Find earliest trigger date
      let earliestTime: number | null = null;
      for (const n of quizNotifs) {
        const trigger = n.trigger as any;
        const time = trigger?.value || trigger?.date;
        if (time && (!earliestTime || time < earliestTime)) {
          earliestTime = typeof time === 'number' ? time : new Date(time).getTime();
        }
      }

      const nextDateStr = earliestTime
        ? new Date(earliestTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null;

      return {
        scheduledTotal: quizNotifs.length,
        nextDate: nextDateStr,
      };
    } catch {
      return { scheduledTotal: 0, nextDate: null };
    }
  }
}

export default new DailyQuizNotificationService();
