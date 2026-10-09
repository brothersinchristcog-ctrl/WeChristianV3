import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { BibleService } from './BibleService';
import { SupportedLanguage } from '../locales';

const VERSES_CACHE_KEY = '@wechristian_verses_cache';

// Stable notification ID prefix — used to deduplicate / cancel by slot
const NOTIF_ID_PREFIX = 'daily_verse_';

export interface DailyVerse {
  id: string;
  verseEn: string;
  referenceEn: string;
  verseTe: string;
  referenceTe: string;
  verseHi?: string;
  referenceHi?: string;
  verseTa?: string;
  referenceTa?: string;
  verseKn?: string;
  referenceKn?: string;
  verseMl?: string;
  referenceMl?: string;
  verseMr?: string;
  referenceMr?: string;
  translations?: Record<string, { verse: string; reference?: string } | string>;
  index?: number;
  backgroundUrl?: string;
  unsplashPhotographer?: string;
  [key: string]: any;
}

// Fixed epoch date for global synchronization across all phones
// Using UTC midnight to ensure everyone transitions days at roughly the same time (or use local midnight if preferred)
const EPOCH = new Date('2024-01-01T00:00:00Z');

class VerseNotificationService {
  // Mutex: prevents concurrent syncAndSchedule calls (e.g. auth state flicker)
  private isSyncing = false;

  async initialize() {
    console.log('[VerseNotificationService] Initializing...');
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily_verse', {
        name: 'Daily Verses',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FCD34D',
      });
    }

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
   * Builds a stable, unique notification identifier for a given date + period slot.
   * This ensures that even if syncAndSchedule is called multiple times, the same
   * slot is never duplicated — the OS simply overwrites/ignores the same identifier.
   * Format: daily_verse_YYYY-MM-DD_Morning (e.g. daily_verse_2024-09-23_Morning)
   */
  private getNotifId(date: Date, periodLabel: string): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${NOTIF_ID_PREFIX}${y}-${m}-${d}_${periodLabel}`;
  }

  /**
   * Combined function to fetch missing verses and schedule them perfectly.
   * Protected by an isSyncing mutex to prevent double-execution on auth re-renders.
   */
  async syncAndSchedule() {
    // ── Mutex guard: skip if already running ──────────────────────────────────
    if (this.isSyncing) {
      console.log('[VerseNotificationService] Sync already in progress. Skipping duplicate call.');
      return;
    }
    this.isSyncing = true;

    try {
      const times = [
        { hour: 8,  title: '✝️ Good Morning',   label: 'Morning'   },
        { hour: 13, title: '✝️ Good Afternoon',  label: 'Afternoon' },
        { hour: 18, title: '✝️ Good Evening',    label: 'Evening'   },
        { hour: 21, title: '✝️ Good Night',      label: 'Night'     },
      ];

      // 1. Calculate the next 7 days we need to cover
      const today = new Date();
      const targetDates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        targetDates.push(d);
      }

      // 2. Build the full set of stable IDs we expect to have scheduled
      const now = new Date();
      const expectedIds = new Set<string>();
      for (const d of targetDates) {
        for (const time of times) {
          const scheduleDate = new Date(d);
          scheduleDate.setHours(time.hour, 0, 0, 0);
          if (scheduleDate > now) {
            expectedIds.add(this.getNotifId(d, time.label));
          }
        }
      }

      // 3. Cancel ALL legacy, duplicate, or stale scheduled notifications first!
      // This wipes out:
      //  - Old legacy notifications that had random UUIDs and old titles ("Good Morning", sun/moon emojis)
      //  - Stale notifications from past days or obsolete schedules
      //  - Any duplicate notification entries for the same slot
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const seenIds = new Set<string>();
      for (const n of allScheduled) {
        const title = n.content.title || '';
        const hasCross = title.startsWith('✝️') || title.startsWith('✝');
        const isDuplicate = seenIds.has(n.identifier);
        if (!expectedIds.has(n.identifier) || !hasCross || isDuplicate) {
          console.log(`[VerseNotificationService] Cancelling legacy/duplicate/stale notification: ${n.identifier} (${title})`);
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        } else {
          seenIds.add(n.identifier);
        }
      }

      // 4. Clean up any legacy AsyncStorage tracking keys from old implementation
      AsyncStorage.multiRemove([
        '@wechristian_scheduled_verses',
        '@wechristian_shown_verses',
        '@wechristian_verses_pool',
      ]).catch(() => {});

      // 5. Check which of the expected IDs still need to be scheduled
      const remainingScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledVerseIds = new Set(remainingScheduled.map(n => n.identifier));
      const missingIds = [...expectedIds].filter(id => !scheduledVerseIds.has(id));

      // 6. If all expected notifications are already scheduled, nothing to do
      if (missingIds.length === 0) {
        console.log('[VerseNotificationService] All verse notifications already scheduled. Skipping.');
        return;
      }

      console.log(`[VerseNotificationService] Need to schedule ${missingIds.length} missing notification(s).`);

      // 6. Fetch total verses metadata
      const metaDoc = await firestore().collection('daily_verses_meta').doc('metadata').get();
      const metaExists = typeof metaDoc.exists === 'function' ? metaDoc.exists() : metaDoc.exists;
      if (!metaExists) return;
      const totalVerses = metaDoc.data()?.totalVerses || 0;
      if (totalVerses === 0) return;

      // 7. Calculate which verse indices are required
      const requiredIndices = new Set<number>();
      for (const d of targetDates) {
        this.getIndicesForDate(d, totalVerses).forEach(idx => requiredIndices.add(idx));
      }

      // 8. Load cache and fetch any missing verse data
      const cacheStr = await AsyncStorage.getItem(VERSES_CACHE_KEY);
      const cache: Record<number, DailyVerse> = cacheStr ? JSON.parse(cacheStr) : {};

      const missingIndices = Array.from(requiredIndices).filter(idx => !cache[idx]);
      if (missingIndices.length > 0) {
        console.log(`[VerseNotificationService] Fetching ${missingIndices.length} missing verses from Firestore...`);
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
        await AsyncStorage.setItem(VERSES_CACHE_KEY, JSON.stringify(cache));
      }

      // 9. Schedule only the missing notification slots using stable identifiers
      let scheduledCount = 0;

      for (const d of targetDates) {
        const dailyIndices = this.getIndicesForDate(d, totalVerses);

        for (let i = 0; i < 4; i++) {
          const time = times[i];
          const notifId = this.getNotifId(d, time.label);

          // Skip if this slot is already scheduled
          if (!missingIds.includes(notifId)) continue;

          const verseIndex = dailyIndices[i];
          const verse = cache[verseIndex];
          if (!verse) continue;

          const scheduleDate = new Date(d);
          scheduleDate.setHours(time.hour, 0, 0, 0);

          // Hard safety check: Never schedule a notification in the past or current time
          if (scheduleDate.getTime() <= Date.now()) {
            continue;
          }

          await Notifications.scheduleNotificationAsync({
            identifier: notifId, // ← stable ID prevents duplicates
            content: {
              title: time.title,
              body: `"${verse.verseEn}"\n${verse.referenceEn}`,
              sound: true,
              data: {
                type: 'daily_verse',
                verseId: verse.id,
                period: time.label,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduleDate,
              channelId: 'daily_verse', // dedicated channel — independent of other app notifications
            },
          });
          scheduledCount++;
        }
      }

      console.log(`[VerseNotificationService] Scheduled ${scheduledCount} new verse notification(s). Total covered: ${expectedIds.size}.`);

    } catch (error) {
      console.error('[VerseNotificationService] Error syncing/scheduling verses:', error);
    } finally {
      // Always release the mutex
      this.isSyncing = false;
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

  /**
   * Localizes a DailyVerse object for the requested language by resolving
   * scripture text and reference via BibleService or local cache.
   */
  async localizeVerse(verse: DailyVerse, lang: SupportedLanguage): Promise<DailyVerse> {
    if (!verse || !lang || lang === 'en') return verse;
    if (lang === 'te' && verse.verseTe && verse.verseTe.trim().length > 0) return verse;

    const cap = lang.charAt(0).toUpperCase() + lang.slice(1);
    const directKey = `verse${cap}`;
    const directRefKey = `reference${cap}`;

    // If already localized in-memory
    if (verse[directKey] && verse[directRefKey]) {
      return verse;
    }

    const cacheKey = `@daily_verse_trans_${verse.id || verse.referenceEn}_${lang}`;
    try {
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached.verse && cached.reference) {
          return {
            ...verse,
            [directKey]: cached.verse,
            [directRefKey]: cached.reference,
            [`verse_${lang}`]: cached.verse,
            [`reference_${lang}`]: cached.reference,
          };
        }
      }
    } catch (_) {}

    const ref = verse.referenceEn || verse.reference;
    if (!ref) return verse;

    try {
      const res = await BibleService.fetchVerseByReference(ref, lang);
      if (res && res.verse) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(res));
        return {
          ...verse,
          [directKey]: res.verse,
          [directRefKey]: res.reference,
          [`verse_${lang}`]: res.verse,
          [`reference_${lang}`]: res.reference,
        };
      }
    } catch (e) {
      console.warn('[VerseNotificationService] Failed to localize verse:', e);
    }

    return verse;
  }

  /**
   * Localizes an array of DailyVerse objects for the requested language
   */
  async localizeVerses(verses: DailyVerse[], lang: SupportedLanguage): Promise<DailyVerse[]> {
    if (!verses || verses.length === 0 || !lang || lang === 'en') return verses;
    return Promise.all(verses.map(v => this.localizeVerse(v, lang)));
  }
}

export default new VerseNotificationService();
