/**
 * Formats a date value (string YYYY-MM-DD, Firestore Timestamp, Date, etc.)
 * to DD-MM-YYYY for display in the UI.
 * This ensures the underlying data remains easily sortable and queryable in Firebase,
 * while the UI presents it in a more user-friendly format for this region.
 * 
 * @param dateValue The date string, Firestore Timestamp, or Date object
 * @returns The DD-MM-YYYY formatted string, or the fallback string
 */
export const formatDateDisplay = (dateValue: any): string => {
  if (!dateValue) return '';

  // If it's a Firestore Timestamp with .toDate()
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    try {
      const d: Date = dateValue.toDate();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      // fallback
    }
  }

  // If it has seconds property (Firestore Timestamp-like object)
  if (typeof dateValue === 'object' && typeof dateValue?.seconds === 'number') {
    try {
      const d = new Date(dateValue.seconds * 1000);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      // fallback
    }
  }

  // If it's a native Date instance
  if (dateValue instanceof Date) {
    try {
      const day = String(dateValue.getDate()).padStart(2, '0');
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const year = dateValue.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      // fallback
    }
  }

  // Convert to string safely
  let dateString = '';
  if (typeof dateValue === 'string') {
    dateString = dateValue.trim();
  } else {
    try {
      dateString = String(dateValue).trim();
    } catch {
      return '';
    }
  }

  if (!dateString || typeof dateString.includes !== 'function') {
    return '';
  }

  // If ISO string like "2026-10-28T05:19:58.880Z", extract date part cleanly
  if (dateString.includes('T')) {
    const isoDate = dateString.split('T')[0];
    const parts = isoDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // Handle cases where time is appended (e.g. "YYYY-MM-DD • 10:00 AM" or "YYYY-MM-DD   10:00 AM")
  let separator = '';
  if (dateString.includes(' • ')) separator = ' • ';
  else if (dateString.includes('   ')) separator = '   ';
  else if (dateString.includes(' ? ')) separator = ' ? ';

  const dateParts = separator ? dateString.split(separator) : [dateString];
  const actualDate = dateParts[0];

  const parts = actualDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    if (dateParts.length > 1) {
      return `${formattedDate} • ${dateParts.slice(1).join(separator)}`;
    }
    return formattedDate;
  }

  return dateString;
};

/**
 * Formats a date value with time (e.g., ISO string "2026-10-28T05:19:58.880Z",
 * Firestore Timestamp, Date) to user-friendly "DD-MM-YYYY • hh:mm AM/PM"
 */
export const formatDateTimeDisplay = (dateValue: any): string => {
  if (!dateValue) return '';
  try {
    let d: Date | null = null;
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      d = dateValue.toDate();
    } else if (typeof dateValue === 'object' && typeof dateValue?.seconds === 'number') {
      d = new Date(dateValue.seconds * 1000);
    } else if (dateValue instanceof Date) {
      d = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    }

    if (d && !isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day}-${month}-${year} • ${timeStr}`;
    }
  } catch {
    // fallback
  }

  return formatDateDisplay(dateValue);
};

/**
 * Scans a string for any YYYY-MM-DD date occurrences and replaces them with DD-MM-YYYY
 */
export const formatDatesInText = (text: string): string => {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_match, y, m, d) => `${d}-${m}-${y}`);
};

/**
 * Formats any date string, Date object, or timestamp to Date Month Year format
 * e.g., "15 November 2026"
 */
export const formatDateMonthYear = (dateVal: any): string => {
  if (!dateVal) return '';
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  try {
    let y = 0, m = -1, d = 0;
    if (typeof dateVal === 'string') {
      const clean = dateVal.trim();
      if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(clean)) return clean;
      const parts = clean.split('T')[0].split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          d = parseInt(parts[2], 10);
        } else if (parts[2].length === 4) {
          d = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          y = parseInt(parts[2], 10);
        }
      }
    } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      y = dateVal.getFullYear();
      m = dateVal.getMonth();
      d = dateVal.getDate();
    } else if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
      const dt: Date = dateVal.toDate();
      y = dt.getFullYear();
      m = dt.getMonth();
      d = dt.getDate();
    }
    if (y > 0 && d > 0 && m >= 0 && m < 12) {
      const dayStr = String(d).padStart(2, '0');
      return `${dayStr} ${MONTHS[m]} ${y}`;
    }
  } catch {}
  return String(dateVal || '');
};

const formatSingleTimeTokenTo12Hour = (token: string): string => {
  const trimmed = token.trim();
  if (!trimmed) return '';
  const withoutDate = trimmed.includes('T') ? trimmed.split('T')[1] || trimmed : trimmed;
  const match = withoutDate.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(AM|PM|Z)?$/i);
  if (!match) return trimmed;

  const rawH = parseInt(match[1], 10);
  const rawM = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();
  if (isNaN(rawH) || isNaN(rawM) || rawH > 23 || rawM > 59) return trimmed;

  let period = 'AM';
  if (meridiem === 'PM') period = 'PM';
  else if (meridiem === 'AM') period = 'AM';
  else period = rawH >= 12 ? 'PM' : 'AM';

  const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
  return `${String(displayH).padStart(2, '0')}:${String(rawM).padStart(2, '0')} ${period}`;
};

/**
 * Formats a 24-hour, ISO/UTC time (e.g. "12:00:00.000Z"), or time range into clean 12-hour AM/PM format
 * e.g., "10:00" -> "10:00 AM", "12:00:00.000Z" -> "12:00 PM", "14:30" -> "02:30 PM"
 */
export const formatTimeTo12Hour = (timeVal: any): string => {
  if (!timeVal) return '';
  try {
    const clean = String(timeVal).trim();
    if (!clean) return '';

    const rangeParts = clean.split(/\s*(?:–|—|\s-\s|(?<=:\d{2}(?::\d{2}(?:\.\d+)?)?(?:\s*(?:AM|PM|Z))?)-(?=\d{1,2}:))\s*/i);
    if (rangeParts.length > 1) {
      return rangeParts.map(formatSingleTimeTokenTo12Hour).filter(Boolean).join(' – ');
    }

    return formatSingleTimeTokenTo12Hour(clean);
  } catch {}
  return String(timeVal || '');
};


