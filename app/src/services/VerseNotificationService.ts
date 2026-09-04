import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const VERSES_CACHE_KEY = '@wechristian_verses_cache';

export interface DailyVerse {
  id: string;
  verseEn: string;
  referenceEn: string;
  verseTe: string;
  referenceTe: string;
  index?: number;
  backgroundUrl?: string;
  unsplashPhotographer?: string;
}

// Fixed epoch date for global synchronization across all phones
// Using UTC midnight to ensure everyone transitions days at roughly the same time (or use local midnight if preferred)
const EPOCH = new Date('2024-01-01T00:00:00Z');

class VerseNotificationService {
  
  async initialize() {
    console.log('[VerseNotificationService] Initializing...');
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    await this.syncAndSchedule();
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
   * Calculates which indices a given date needs (Morning, Afternoon, Evening, Night)
   */
  getIndicesForDate(date: Date, totalVerses: number): number[] {
    if (totalVerses === 0) return [];
    
    // Calculate days since epoch based on local timezone date (so 'today' is consistent per timezone)
    // To make it globally exact same verse at same moment, we could use UTC, but local is usually better for "Morning".
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const epochDate = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
    const daysSinceEpoch = Math.floor((localDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      (daysSinceEpoch * 4 + 0) % totalVerses,
      (daysSinceEpoch * 4 + 1) % totalVerses,
      (daysSinceEpoch * 4 + 2) % totalVerses,
      (daysSinceEpoch * 4 + 3) % totalVerses,
    ];
  }

  /**
   * Combined function to fetch missing verses and schedule them perfectly.
   */
  async syncAndSchedule() {
    try {
      // 1. Check scheduled notifications to see if we need to do work
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const verseNotifications = allScheduled.filter(n => n.content.data?.type === 'daily_verse');
      
      // If we already have 14+ notifications (3+ days) scheduled, save battery/network and skip.
      if (verseNotifications.length > 14) {
        console.log(`[VerseNotificationService] Already have ${verseNotifications.length} scheduled. Skipping sync.`);
        return;
      }

      // 2. Fetch total verses metadata
      const metaDoc = await firestore().collection('daily_verses_meta').doc('metadata').get();
      const metaExists = typeof metaDoc.exists === 'function' ? metaDoc.exists() : metaDoc.exists;
      if (!metaExists) return;
      const totalVerses = metaDoc.data()?.totalVerses || 0;
      if (totalVerses === 0) return;

      // 3. Determine which dates we need to schedule
      const targetDates: Date[] = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        targetDates.push(d);
      }

      // 4. Calculate exactly which indices are required for the next 7 days
      const requiredIndices = new Set<number>();
      for (const d of targetDates) {
        this.getIndicesForDate(d, totalVerses).forEach(idx => requiredIndices.add(idx));
      }

      // 5. Check local cache
      const cacheStr = await AsyncStorage.getItem(VERSES_CACHE_KEY);
      const cache: Record<number, DailyVerse> = cacheStr ? JSON.parse(cacheStr) : {};
      
      // 6. Find missing indices
      const missingIndices = Array.from(requiredIndices).filter(idx => !cache[idx]);

      // 7. Fetch missing indices from Firestore efficiently (using 'in' batches of 10)
      if (missingIndices.length > 0) {
        console.log(`[VerseNotificationService] Fetching ${missingIndices.length} missing verses...`);
        for (let i = 0; i < missingIndices.length; i += 10) {
          const batch = missingIndices.slice(i, i + 10);
          const snapshot = await firestore().collection('daily_verses').where('index', 'in', batch).get();
          snapshot.docs.forEach(doc => {
            const data = doc.data() as DailyVerse;
            if (data.index !== undefined) {
              cache[data.index] = { ...data, id: doc.id };
            }
          });
        }
        // Save updated cache
        await AsyncStorage.setItem(VERSES_CACHE_KEY, JSON.stringify(cache));
      }

      // 8. Schedule them
      console.log('[VerseNotificationService] Scheduling new verses deterministically...');
      
      // Cancel all existing verse notifications to ensure clean slate and correct order if anything changed
      for (const n of verseNotifications) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }

      const times = [
        { hour: 8, title: 'Good Morning', label: 'Morning' },
        { hour: 13, title: 'Good Afternoon', label: 'Afternoon' },
        { hour: 18, title: 'Good Evening', label: 'Evening' },
        { hour: 21, title: 'Good Night', label: 'Night' }
      ];

      const now = new Date();
      let scheduledCount = 0;

      for (const d of targetDates) {
        const dailyIndices = this.getIndicesForDate(d, totalVerses);
        
        for (let i = 0; i < 4; i++) {
          const verseIndex = dailyIndices[i];
          const verse = cache[verseIndex];
          const time = times[i];

          if (!verse) continue; // safety check

          const scheduleDate = new Date(d);
          scheduleDate.setHours(time.hour, 0, 0, 0);

          // Only schedule if it's in the future
          if (scheduleDate > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: time.title,
                body: `"${verse.verseEn}"\n${verse.referenceEn}`,
                sound: true,
                data: {
                  type: 'daily_verse',
                  verseId: verse.id,
                  period: time.label
                },
              },
              trigger: { 
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: scheduleDate,
                channelId: 'default' 
              },
            });
            scheduledCount++;
          }
        }
      }

      console.log(`[VerseNotificationService] Successfully scheduled ${scheduledCount} verses globally synced!`);

    } catch (error) {
      console.error('[VerseNotificationService] Error syncing/scheduling verses:', error);
    }
  }

  /**
   * (Helper) Used by UI when user clicks notification
   */
  async getVerseById(id: string): Promise<DailyVerse | null> {
    try {
      const cacheStr = await AsyncStorage.getItem(VERSES_CACHE_KEY);
      if (cacheStr) {
        const cache: Record<number, DailyVerse> = JSON.parse(cacheStr);
        const found = Object.values(cache).find(v => v.id === id);
        if (found) return found;
      }
      
      // Fallback: Fetch directly from Firestore if not in cache (useful for testing or if cache cleared)
      const doc = await firestore().collection('daily_verses').doc(id).get();
      const docExists = typeof doc.exists === 'function' ? doc.exists() : doc.exists;
      if (docExists) {
        return { ...doc.data(), id: doc.id } as DailyVerse;
      }
    } catch (e) {
      console.log('[VerseNotificationService] Error fetching verse by ID:', e);
    }
    
    return null;
  }

  /**
   * (Helper) Used by the HomeScreen Daily Verse Card — fetches today's verse for a specific period
   */
  async getVerseForDate(date: Date, period: string): Promise<DailyVerse | null> {
    try {
      // 1. Try cache first
      const cacheStr = await AsyncStorage.getItem(VERSES_CACHE_KEY);
      const metaDoc = await firestore().collection('daily_verses_meta').doc('metadata').get();
      const metaExists = typeof metaDoc.exists === 'function' ? metaDoc.exists() : metaDoc.exists;
      if (!metaExists) return null;
      const totalVerses = metaDoc.data()?.totalVerses || 0;
      if (totalVerses === 0) return null;

      const periodOrder: Record<string, number> = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 };
      const periodOffset = periodOrder[period] ?? 0;
      const allIndices = this.getIndicesForDate(date, totalVerses);
      const targetIndex = allIndices[periodOffset];

      if (cacheStr) {
        const cache: Record<number, DailyVerse> = JSON.parse(cacheStr);
        if (cache[targetIndex]) return cache[targetIndex];
      }

      // 2. Fallback: fetch from Firestore by index
      const snapshot = await firestore().collection('daily_verses').where('index', '==', targetIndex).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: doc.id } as DailyVerse;
      }
    } catch (e) {
      console.log('[VerseNotificationService] Error in getVerseForDate:', e);
    }
    return null;
  }

  async markVerseAsShown(id: string) {
    // No longer needed as we use deterministic math, but kept for interface compatibility
  }

  /**
   * Fetches verses for multiple recent days efficiently (combines cache and batch firestore queries).
   */
  async getRecentVerses(pastDays: number, includeToday: boolean = true, forceRefresh: boolean = false): Promise<{ date: Date, verses: DailyVerse[] }[]> {
    try {
      let totalVerses = 0;
      const metaCacheStr = await AsyncStorage.getItem('@wechristian_verses_meta');
      if (metaCacheStr) {
        totalVerses = parseInt(metaCacheStr, 10);
      }
      
      if (totalVerses === 0 || forceRefresh) {
        const metaDoc = await firestore().collection('daily_verses_meta').doc('metadata').get();
        const metaExists = typeof metaDoc.exists === 'function' ? metaDoc.exists() : metaDoc.exists;
        if (metaExists) {
          totalVerses = metaDoc.data()?.totalVerses || 0;
          await AsyncStorage.setItem('@wechristian_verses_meta', totalVerses.toString());
        }
      }
      
      if (totalVerses === 0) return [];

      const today = new Date();
      const targetDates: Date[] = [];
      
      if (includeToday) {
        targetDates.push(new Date(today));
      }
      
      for (let i = 1; i <= pastDays; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        targetDates.push(d);
      }

      const requiredIndices = new Set<number>();
      for (const d of targetDates) {
        this.getIndicesForDate(d, totalVerses).forEach(idx => requiredIndices.add(idx));
      }

      const cacheStr = await AsyncStorage.getItem(VERSES_CACHE_KEY);
      const cache: Record<number, DailyVerse> = cacheStr ? JSON.parse(cacheStr) : {};
      
      const missingIndices = forceRefresh 
        ? Array.from(requiredIndices) 
        : Array.from(requiredIndices).filter(idx => !cache[idx]);

      if (missingIndices.length > 0) {
        const batchPromises = [];
        for (let i = 0; i < missingIndices.length; i += 10) {
          const batch = missingIndices.slice(i, i + 10);
          batchPromises.push(
            firestore().collection('daily_verses').where('index', 'in', batch).get()
          );
        }
        
        const snapshots = await Promise.all(batchPromises);
        
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            const data = doc.data() as DailyVerse;
            if (data.index !== undefined) {
              cache[data.index] = { ...data, id: doc.id };
            }
          });
        });

        await AsyncStorage.setItem(VERSES_CACHE_KEY, JSON.stringify(cache));
      }

      const results = [];
      for (const d of targetDates) {
        const dailyIndices = this.getIndicesForDate(d, totalVerses);
        const versesForDay: DailyVerse[] = [];
        for (let i = 0; i < 4; i++) {
          if (cache[dailyIndices[i]]) {
            versesForDay.push(cache[dailyIndices[i]]);
          }
        }
        results.push({ date: d, verses: versesForDay });
      }
      return results;
    } catch (e) {
      console.error('[VerseNotificationService] Error in getRecentVerses:', e);
      return [];
    }
  }

  /**
   * Helper to retrieve all 4 verses for today (Morning, Afternoon, Evening, Night)
   */
  async getTodayVerses(forceRefresh: boolean = false): Promise<DailyVerse[]> {
    try {
      const recent = await this.getRecentVerses(0, true, forceRefresh);
      return recent[0]?.verses || [];
    } catch (e) {
      console.error('[VerseNotificationService] Error in getTodayVerses:', e);
      return [];
    }
  }
}

export default new VerseNotificationService();
