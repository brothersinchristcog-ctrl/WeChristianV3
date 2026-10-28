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

