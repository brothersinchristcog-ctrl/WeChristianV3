import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalizedDailyQuizTitle } from '../constants/DailyQuizTranslations';
import { SupportedLanguage } from '../locales';

const QUIZ_NOTIF_STORAGE_KEY = '@wechristian_scheduled_quiz_notifs';
const NOTIF_ID_PREFIX = 'daily_quiz_slot_';

class DailyQuizNotificationService {
  private isScheduling = false;

  /**
   * Initializes the notification channel and schedules upcoming 5:00 AM notifications.
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
   * Schedules 5:00 AM notifications for the next N days (default 14 days).
   */
  async syncAndScheduleUpcoming(daysAhead: number = 14): Promise<{ scheduledCount: number; nextDate: string | null }> {
    if (this.isScheduling) return { scheduledCount: 0, nextDate: null };
    this.isScheduling = true;

    try {
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

        // 5:00 AM delivery time
        const scheduleDateTime = new Date(targetDate);
        scheduleDateTime.setHours(5, 0, 0, 0);

        // If today's 5:00 AM has already passed, skip today and look at tomorrow
        if (scheduleDateTime.getTime() <= Date.now()) {
          continue;
        }

        if (!firstUpcomingDate) {
          firstUpcomingDate = `${dateStr} 05:00 AM`;
        }

        // Avoid re-scheduling if already registered with the OS
        if (existingQuizNotifIds.has(notifId)) {
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: notifId,
          content: {
            title: '📖 Daily Bible Quiz is Live!',
            body: `Today's Scripture challenge (${dateStr}) is ready. Test your knowledge and reflect on God's Word!`,
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
            date: scheduleDateTime,
            channelId: 'daily_quiz',
          },
        });

        scheduledCount++;
      }

      console.log(`[DailyQuizNotificationService] Scheduled ${scheduledCount} 5:00 AM notifications. Next: ${firstUpcomingDate}`);
      return { scheduledCount, nextDate: firstUpcomingDate };
    } catch (e) {
      console.warn('[DailyQuizNotificationService] Schedule error:', e);
      return { scheduledCount: 0, nextDate: null };
    } finally {
      this.isScheduling = false;
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

      await Notifications.scheduleNotificationAsync({
        identifier: `test_quiz_${Date.now()}`,
        content: {
          title: `📖 ${title} is Live! (5:00 AM Test)`,
          body: `Today's Scripture challenge for ${dateStr} is ready. Tap to test your biblical knowledge!`,
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
