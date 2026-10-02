// YouTubeService.ts
// Automatically finds the recording of a past church event from YouTube

const YOUTUBE_API_KEY = 'AIzaSyBKLbyuINc04XXgrUPyoSCZYtKdBbv-6ic';

// Cache channelId per handle so we don't fetch it every time
const channelIdCache: Record<string, string> = {};

/**
 * Resolves the YouTube channel ID from the channel handle.
 * Result is cached in memory for the app session.
 */
async function getChannelId(channelHandle: string): Promise<string | null> {
  if (!channelHandle) return null;
  if (channelIdCache[channelHandle]) return channelIdCache[channelHandle];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelHandle)}&type=channel&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const id = data.items[0].id.channelId;
      channelIdCache[channelHandle] = id;
      console.log('✅ [YouTubeService] Channel ID resolved:', id);
      return id;
    }
    console.warn('⚠️ [YouTubeService] Could not resolve channel ID from handle:', channelHandle);
    return null;
  } catch (error) {
    console.error('❌ [YouTubeService] getChannelId error:', error);
    return null;
  }
}

/**
 * Searches the church's YouTube channel for a video that was published
 * on the same date as the given event date.
 * Uses robust UTC parsing and intelligent keyword matching in memory,
 * while excluding daily promise devotionals and shorts.
 *
 * @param eventDate - The date of the event in 'YYYY-MM-DD' format
 * @param eventTitle - The title of the event, used as a keyword fallback
 * @param channelHandle - The YouTube handle (e.g. '@MyChurch')
 * @returns The 11-character YouTube video ID, or null if not found
 */
export async function findEventVideo(
  eventDate: string,
  eventTitle: string,
  channelHandle?: string
): Promise<string | null> {
  try {
    if (!channelHandle) return null;
    const channelId = await getChannelId(channelHandle);
    if (!channelId) return null;

    // 1. Robust UTC Date Parsing (avoids device timezone offset shifts)
    const dateParts = eventDate.split('T')[0].split('-');
    if (dateParts.length !== 3) {
      console.warn('⚠️ [YouTubeService] Invalid event date format:', eventDate);
      return null;
    }
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    
    const eventDay = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(eventDay.getTime())) {
      console.warn('⚠️ [YouTubeService] Invalid event date:', eventDate);
      return null;
    }

    // ±3 day search window to accommodate timezone differences and delayed uploads
    const publishedAfter = new Date(eventDay);
    publishedAfter.setUTCDate(publishedAfter.getUTCDate() - 2);
    
    const publishedBefore = new Date(eventDay);
    publishedBefore.setUTCDate(publishedBefore.getUTCDate() + 3);

    const afterISO = publishedAfter.toISOString();
    const beforeISO = publishedBefore.toISOString();

    console.log(`🔍 [YouTubeService] Searching for "${eventTitle}" in UTC range: ${afterISO.split('T')[0]} to ${beforeISO.split('T')[0]}`);

    // Query more results (maxResults=15) to ensure we don't miss the event video
    // due to daily promise/song flooding.
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=${channelId}` +
      `&type=video` +
      `&order=date` +
      `&publishedAfter=${encodeURIComponent(afterISO)}` +
      `&publishedBefore=${encodeURIComponent(beforeISO)}` +
      `&maxResults=15` +
      `&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('ℹ️ [YouTubeService] No videos uploaded in this date range.');
      return null;
    }

    // 2. Intelligent In-Memory Filtering and Selection
    const normalizedEventTitle = eventTitle.toLowerCase();
    
    // Tokenize event title into significant search terms
    const stopWords = new Set(['and', 'the', 'or', 'in', 'of', 'to', 'at', 'a', 'for', 'with', 'us', 'on', 'is', 'our', 'study', 'service', 'meeting', 'prayer', 'worship']);
    const eventTokens = normalizedEventTitle
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2 && !stopWords.has(token));

    // Core categories of church events to match
    const isBibleStudy = normalizedEventTitle.includes('bible') || normalizedEventTitle.includes('study');
    const isSundayService = normalizedEventTitle.includes('sunday') || normalizedEventTitle.includes('service') || normalizedEventTitle.includes('worship');
    const isFastingPrayer = normalizedEventTitle.includes('fasting') || normalizedEventTitle.includes('prayer');
    const isYouth = normalizedEventTitle.includes('youth');

    console.log(`💡 [YouTubeService] Extracted event tokens:`, eventTokens, `| Category:`, { isBibleStudy, isSundayService, isFastingPrayer, isYouth });

    const candidates: Array<{ videoId: string; title: string; score: number }> = [];

    for (const item of data.items) {
      const videoTitle = item.snippet.title.toLowerCase();
      const videoDesc = (item.snippet.description || '').toLowerCase();
      const videoId = item.id.videoId;

      // Rule 1: Exclude Daily Promise and Shorts videos
      const isDailyPromise = 
        videoTitle.includes('promise') || 
        videoTitle.includes('daily') || 
        videoTitle.includes('వాగ్దానం') || 
        videoTitle.includes('vaghanam') || 
        videoTitle.includes('vaganam') ||
        videoTitle.includes('vagdhanam');
        
      const isShort = 
        videoTitle.includes('short') || 
        videoTitle.includes('#shorts') || 
        videoTitle.includes('ytshorts') || 
        videoTitle.includes('youtubeshorts');

      if (isDailyPromise || isShort) {
        console.log(`🚫 [YouTubeService] Excluded daily devotional/short: "${item.snippet.title}"`);
        continue;
      }

      // Rule 2: Scoring the video based on keywords
      let score = 0;

      // Category matching bonus
      if (isBibleStudy && (videoTitle.includes('bible') || videoTitle.includes('study'))) score += 10;
      if (isSundayService && (videoTitle.includes('sunday') || videoTitle.includes('worship') || videoTitle.includes('service'))) score += 10;
      if (isFastingPrayer && (videoTitle.includes('fasting') || videoTitle.includes('prayer'))) score += 10;
      if (isYouth && videoTitle.includes('youth')) score += 10;

      // Token matching
      for (const token of eventTokens) {
        if (videoTitle.includes(token)) score += 5;
        if (videoDesc.includes(token)) score += 1;
      }

      // Live stream preference bonus
      if (videoTitle.includes('live') || videoTitle.includes('stream')) {
        score += 2;
      }

      candidates.push({ videoId, title: item.snippet.title, score });
    }

    // Sort candidates descending by score
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const bestMatch = candidates[0];
      // Require a minimum score of 2 to avoid returning a completely random video
      // if no relevant candidate exists.
      if (bestMatch.score >= 2) {
        console.log(`🎯 [YouTubeService] Best video match found: "${bestMatch.title}" (Score: ${bestMatch.score}, ID: ${bestMatch.videoId})`);
        return bestMatch.videoId;
      }
      
      // Fallback: If no high score, but we have a non-excluded candidate and it's a general live stream
      const liveStream = candidates.find(c => c.title.toLowerCase().includes('live'));
      if (liveStream) {
        console.log(`🎯 [YouTubeService] Fallback to general live stream candidate: "${liveStream.title}" (ID: ${liveStream.videoId})`);
        return liveStream.videoId;
      }
    }

    console.log('ℹ️ [YouTubeService] No matching church service video found.');
    return null;
  } catch (error) {
    console.error('❌ [YouTubeService] findEventVideo error:', error);
    return null;
  }
}
