import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const VERSES_POOL_KEY = '@wechristian_verses_pool';
const SHOWN_VERSES_KEY = '@wechristian_shown_verses';
const SCHEDULED_VERSES_KEY = '@wechristian_scheduled_verses';

export interface DailyVerse {
  id: string;
  verseEn: string;
  referenceEn: string;
  verseTe: string;
  referenceTe: string;
}

class VerseNotificationService {
  /**
   * Initializes the notification service, asks for permissions, and syncs/schedules verses.
   */
  async initialize() {
    console.log('[VerseNotificationService] Initializing...');
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('[VerseNotificationService] No notification permissions.');
      return;
    }

    // Set notification handler to show notifications even when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await this.syncVersesFromFirestore();
    await this.scheduleUpcomingNotifications();
  }

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  /**
   * Downloads all verses from Firestore and caches them locally
   */
  async syncVersesFromFirestore() {
    try {
      const snapshot = await firestore().collection('daily_verses').get();
      const verses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      await AsyncStorage.setItem(VERSES_POOL_KEY, JSON.stringify(verses));
      console.log(`[VerseNotificationService] Synced ${verses.length} verses from Firestore.`);
    } catch (error) {
      console.error('[VerseNotificationService] Error syncing verses:', error);
    }
  }

  /**
   * Schedules notifications for the next 7 days (4 times a day = 28 notifications)
   */
  async scheduleUpcomingNotifications() {
    try {
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // We only want to keep verse notifications, filter out others if needed
      // (For this implementation, we assume we control all local notifications)
      const verseNotifications = allScheduled.filter(n => n.content.data?.type === 'daily_verse');
      
      // If we already have more than 14 notifications scheduled, we don't need to do anything yet
      if (verseNotifications.length > 14) {
        console.log(`[VerseNotificationService] Already have ${verseNotifications.length} scheduled. Skipping.`);
        return;
      }

      console.log('[VerseNotificationService] Scheduling new verses...');
      
      // Load pool and shown history
      const poolStr = await AsyncStorage.getItem(VERSES_POOL_KEY);
      const shownStr = await AsyncStorage.getItem(SHOWN_VERSES_KEY);
      const scheduledStr = await AsyncStorage.getItem(SCHEDULED_VERSES_KEY);
      
      if (!poolStr) return;
      
      const pool: DailyVerse[] = JSON.parse(poolStr);
      let shownIds: string[] = shownStr ? JSON.parse(shownStr) : [];
      let scheduledIds: string[] = scheduledStr ? JSON.parse(scheduledStr) : [];

      if (pool.length === 0) return;

      // Ensure we don't pick already scheduled ones
      const unavailableIds = new Set([...shownIds, ...scheduledIds]);
      let availableVerses = pool.filter(v => !unavailableIds.has(v.id));

      // If we ran out of verses, reset the shown history (but keep scheduled)
      if (availableVerses.length < 28) {
        console.log('[VerseNotificationService] Pool exhausted. Resetting shown history.');
        shownIds = [];
        await AsyncStorage.setItem(SHOWN_VERSES_KEY, JSON.stringify([]));
        
        // Recalculate available
        const newUnavailable = new Set([...scheduledIds]);
        availableVerses = pool.filter(v => !newUnavailable.has(v.id));
      }

      // Shuffle available verses
      availableVerses = availableVerses.sort(() => 0.5 - Math.random());

      // Find the last scheduled date, or start from today
      let startDate = new Date();
      if (verseNotifications.length > 0) {
        // Find the maximum trigger date
        const maxTime = Math.max(...verseNotifications.map(n => {
          const trigger = n.trigger as any;
          return trigger?.value || trigger?.date || 0;
        }));
        if (maxTime > 0) {
          startDate = new Date(maxTime);
        }
      }

      // Schedule up to 28 new notifications
      const notificationsNeeded = 28 - verseNotifications.length;
      let versesScheduled = 0;
      let currentDate = new Date(startDate);

      while (versesScheduled < notificationsNeeded && availableVerses.length > 0) {
        currentDate.setDate(currentDate.getDate() + 1); // Move to next day

        const times = [
          { hour: 8, title: 'Good Morning', label: 'Morning' },
          { hour: 13, title: 'Good Afternoon', label: 'Afternoon' },
          { hour: 18, title: 'Good Evening', label: 'Evening' },
          { hour: 21, title: 'Good Night', label: 'Night' }
        ];

        for (const time of times) {
          if (versesScheduled >= notificationsNeeded || availableVerses.length === 0) break;

          const verse = availableVerses.pop()!;
          const scheduleDate = new Date(currentDate);
          scheduleDate.setHours(time.hour, 0, 0, 0);
          
          // Don't schedule in the past
          if (scheduleDate.getTime() < Date.now()) continue;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: time.title,
              body: `"${verse.verseEn}"\n"${verse.verseTe}"`,
              data: { 
                type: 'daily_verse',
                verseId: verse.id,
                period: time.label
              },
              sound: true,
            },
            trigger: scheduleDate,
          });

          scheduledIds.push(verse.id);
          versesScheduled++;
        }
      }

      // Save scheduled IDs
      await AsyncStorage.setItem(SCHEDULED_VERSES_KEY, JSON.stringify(scheduledIds));
      console.log(`[VerseNotificationService] Successfully scheduled ${versesScheduled} new verse notifications.`);

    } catch (error) {
      console.error('[VerseNotificationService] Error scheduling notifications:', error);
    }
  }

  /**
   * Called when a notification is tapped and the verse is opened.
   * Moves the verse from scheduled -> shown.
   */
  async markVerseAsShown(verseId: string) {
    try {
      const shownStr = await AsyncStorage.getItem(SHOWN_VERSES_KEY);
      const scheduledStr = await AsyncStorage.getItem(SCHEDULED_VERSES_KEY);
      
      let shownIds: string[] = shownStr ? JSON.parse(shownStr) : [];
      let scheduledIds: string[] = scheduledStr ? JSON.parse(scheduledStr) : [];

      if (!shownIds.includes(verseId)) {
        shownIds.push(verseId);
        await AsyncStorage.setItem(SHOWN_VERSES_KEY, JSON.stringify(shownIds));
      }

      scheduledIds = scheduledIds.filter(id => id !== verseId);
      await AsyncStorage.setItem(SCHEDULED_VERSES_KEY, JSON.stringify(scheduledIds));

    } catch (error) {
      console.error('[VerseNotificationService] Error marking verse as shown:', error);
    }
  }

  /**
   * Fetches a specific verse by ID from local pool
   */
  async getVerseById(verseId: string): Promise<DailyVerse | null> {
    try {
      const poolStr = await AsyncStorage.getItem(VERSES_POOL_KEY);
      if (!poolStr) return null;
      const pool: DailyVerse[] = JSON.parse(poolStr);
      return pool.find(v => v.id === verseId) || null;
    } catch (error) {
      console.error('[VerseNotificationService] Error getting verse by ID:', error);
      return null;
    }
  }
}

export default new VerseNotificationService();
