import { Share, Linking, Platform } from 'react-native';
import { BIBLE_BOOKS, CHAPTER_COUNTS, BIBLE_BOOK_USFM, BibleService } from './BibleService';

// Local bundled Telugu Bible JSON
let LOCAL_TELUGU_BIBLE: any = null;
try {
  LOCAL_TELUGU_BIBLE = require('../../assets/telugu_bible.json');
} catch (e) {
  console.warn('Local Telugu Bible JSON not loaded in PrayerVerseService:', e);
}

export interface BibleBookItem {
  index: number;
  nameEn: string;
  nameTe: string;
  testament: 'OT' | 'NT';
  totalChapters: number;
}

export interface SelectedVerseData {
  bookIndex: number;
  bookName: string;
  bookNameTe: string;
  chapter: number;
  verse: string; // e.g. "6" or "6-7"
  reference: string; // e.g. "Philippians 4:6-7"
  referenceTe: string; // e.g. "ఫిలిప్పీయులకు 4:6-7"
  textEn: string;
  textTe: string;
}

// ── Built-in 66 Holy Bible Books with English & Telugu Names ───────────────────
const ALL_66_BOOKS: BibleBookItem[] = (() => {
  const list: BibleBookItem[] = [];
  const enOT = BIBLE_BOOKS.en.OT;
  const enNT = BIBLE_BOOKS.en.NT;
  const teOT = BIBLE_BOOKS.te?.OT || [];
  const teNT = BIBLE_BOOKS.te?.NT || [];

  for (let i = 0; i < 39; i++) {
    list.push({
      index: i,
      nameEn: enOT[i] || `Book ${i + 1}`,
      nameTe: teOT[i] || enOT[i] || `Book ${i + 1}`,
      testament: 'OT',
      totalChapters: CHAPTER_COUNTS[i] || 1,
    });
  }

  for (let i = 0; i < 27; i++) {
    const globalIdx = 39 + i;
    list.push({
      index: globalIdx,
      nameEn: enNT[i] || `Book ${globalIdx + 1}`,
      nameTe: teNT[i] || enNT[i] || `Book ${globalIdx + 1}`,
      testament: 'NT',
      totalChapters: CHAPTER_COUNTS[globalIdx] || 1,
    });
  }

  return list;
})();

class PrayerVerseService {
  /**
   * 1. Get the list of all 66 Bible books with English and Telugu names
   */
  getBooksList(): BibleBookItem[] {
    return ALL_66_BOOKS;
  }

  /**
   * 2. Get total chapters in a book (1..150)
   */
  getChapterCount(bookIndex: number): number {
    if (bookIndex >= 0 && bookIndex < CHAPTER_COUNTS.length) {
      return CHAPTER_COUNTS[bookIndex];
    }
    return 1;
  }

  /**
   * 3. Get total verses in a specific chapter of a book from authentic Telugu Bible
   */
  getVerseCount(bookIndex: number, chapter: number): number {
    try {
      if (LOCAL_TELUGU_BIBLE?.Book?.[bookIndex]?.Chapter?.[chapter - 1]?.Verse) {
        return LOCAL_TELUGU_BIBLE.Book[bookIndex].Chapter[chapter - 1].Verse.length;
      }
    } catch (_) {}
    return 30; // fallback reasonable count
  }

  /**
   * 4. Parse verse input string into start and end numbers (e.g. "6", "6-7", "6 - 8")
   */
  parseVerseRange(verseInput: string | number, maxVerses: number = 100): { start: number; end: number; display: string } {
    const raw = String(verseInput || '1').trim();
    if (raw.includes('-')) {
      const parts = raw.split('-').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n));
      if (parts.length >= 2) {
        const start = Math.max(1, Math.min(parts[0], maxVerses));
        const end = Math.max(start, Math.min(parts[1], maxVerses));
        return { start, end, display: `${start}-${end}` };
      } else if (parts.length === 1) {
        const start = Math.max(1, Math.min(parts[0], maxVerses));
        return { start, end: start, display: `${start}` };
      }
    }
    const single = parseInt(raw, 10);
    const start = isNaN(single) ? 1 : Math.max(1, Math.min(single, maxVerses));
    return { start, end: start, display: `${start}` };
  }

  /**
   * 5. Automatically lookup and return Holy Scripture in both English and Telugu
   */
  async lookupScripture(
    bookIndex: number,
    chapter: number,
    verseInput: string | number = 1
  ): Promise<{ reference: string; referenceTe: string; textEn: string; textTe: string }> {
    const book = ALL_66_BOOKS[bookIndex] || ALL_66_BOOKS[0];
    const totalVerses = this.getVerseCount(bookIndex, chapter);
    const { start, end, display } = this.parseVerseRange(verseInput, totalVerses);

    const reference = `${book.nameEn} ${chapter}:${display}`;
    const referenceTe = `${book.nameTe} ${chapter}:${display}`;

    // ── 5a. Telugu Scripture Lookup (100% Offline, Instant from Local JSON) ──
    let textTe = '';
    try {
      if (LOCAL_TELUGU_BIBLE?.Book?.[bookIndex]?.Chapter?.[chapter - 1]?.Verse) {
        const chVerses = LOCAL_TELUGU_BIBLE.Book[bookIndex].Chapter[chapter - 1].Verse;
        const parts: string[] = [];
        for (let v = start; v <= end; v++) {
          const item = chVerses[v - 1];
          if (item?.Verse) {
            // Clean out any inline numbering or special symbols if present
            const clean = String(item.Verse).replace(/^\d+\s*/, '').trim();
            parts.push(clean);
          }
        }
        textTe = parts.join(' ');
      }
    } catch (teErr) {
      console.warn('Telugu scripture lookup error:', teErr);
    }

    // ── 5b. English Scripture Lookup (Online API with fallbacks) ──
    let textEn = '';
    const cleanQuery = `${book.nameEn} ${chapter}:${display}`;
    try {
      const url = `https://bible-api.com/${encodeURIComponent(cleanQuery)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.text) {
          textEn = data.text.replace(/\s+/g, ' ').trim();
        }
      }
    } catch (enErr) {
      console.warn('bible-api.com fetch failed, attempting BibleService fallback:', enErr);
    }

    // Fallback English via BibleService if bible-api.com didn't respond
    if (!textEn) {
      try {
        const chVerses = await BibleService.fetchChapterVerses(bookIndex, chapter, 'en');
        if (Array.isArray(chVerses) && chVerses.length > 0) {
          const matched = chVerses.filter(v => v.verse >= start && v.verse <= end);
          if (matched.length > 0) {
            textEn = matched.map(v => v.text).join(' ');
          }
        }
      } catch (fallbackErr) {
        console.warn('BibleService English fallback failed:', fallbackErr);
      }
    }

    return {
      reference,
      referenceTe,
      textEn: textEn || '',
      textTe: textTe || '',
    };
  }

  /**
   * 6. Format Motivational Message for Sharing (WhatsApp & Share sheet)
   */
  formatMotivationalMessage(
    memberName: string,
    prayerRequestText: string,
    verse: { reference: string; referenceTe?: string; text?: string; textTe?: string },
    personalResponse?: string,
    churchName = 'Rhema Global Ministries'
  ): string {
    const cleanName = (memberName || 'Beloved Member').trim();
    const excerpt = prayerRequestText
      ? prayerRequestText.length > 90
        ? `${prayerRequestText.substring(0, 90)}...`
        : prayerRequestText
      : '';

    let msg = `🙏 *Greetings in Christ, ${cleanName}!* \n\n`;
    msg += `Our pastoral team at *${churchName}* has received and prayed over your request`;
    if (excerpt) {
      msg += `: _"${excerpt.trim()}"_`;
    }
    msg += `.\n\n`;

    if (verse && verse.reference) {
      msg += `📖 *Holy Scripture:*\n`;
      if (verse.text && verse.text.trim()) {
        msg += `_"${verse.text.trim()}"_\n`;
      }
      if (verse.textTe && verse.textTe.trim() && verse.textTe.trim() !== (verse.text || '').trim()) {
        msg += `_"${verse.textTe.trim()}"_\n`;
      }
      msg += `— *${verse.reference}*`;
      if (verse.referenceTe && verse.referenceTe !== verse.reference) {
        msg += ` (${verse.referenceTe})`;
      }
      msg += `\n\n`;
    }

    if (personalResponse && personalResponse.trim()) {
      msg += `💬 *Pastoral Message:*\n${personalResponse.trim()}\n\n`;
    }

    msg += `_We continue to stand in faith and agreement with you in prayer. May God's peace, grace, and blessings surround you and your loved ones!_\n`;
    msg += `— *Pastoral Care Team, ${churchName}*`;

    return msg;
  }

  /**
   * 7. Share via WhatsApp
   */
  async shareViaWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      const cleanDigits = (phone || '').replace(/\D/g, '');
      let fullNumber = cleanDigits;
      if (cleanDigits.length === 10) {
        fullNumber = `91${cleanDigits}`;
      }

      const encoded = encodeURIComponent(message);
      const waUrl = fullNumber
        ? `whatsapp://send?phone=${fullNumber}&text=${encoded}`
        : `whatsapp://send?text=${encoded}`;

      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
        return true;
      } else {
        const webUrl = fullNumber
          ? `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encoded}`
          : `https://api.whatsapp.com/send?text=${encoded}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (err) {
      console.warn('⚠️ WhatsApp share failed, falling back to native share sheet:', err);
      return this.shareNative('Encouraging Scripture & Prayer Response', message);
    }
  }

  /**
   * 8. Share via Native System Share Sheet
   */
  async shareNative(title: string, message: string): Promise<boolean> {
    try {
      await Share.share({
        title: title || 'Encouraging Scripture & Prayer Response',
        message: message,
      });
      return true;
    } catch (err) {
      console.error('❌ Native share failed:', err);
      return false;
    }
  }
}

export default new PrayerVerseService();
