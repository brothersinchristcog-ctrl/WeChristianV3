/**
 * Utilities for Quiz Scheduling and Access Control.
 * Ensures quizzes scheduled for a specific date & time (e.g. 2:35 PM / 2:57 PM)
 * remain locked until that exact time arrives, and unlock automatically.
 */

/**
 * Format 24-hr time string (e.g. "14:35", "06:00", "02:57") or 12-hr string ("2:35 PM") into a clean "2:35 PM".
 * Also supports smart 12h resolution for quizzes scheduled for today's afternoon.
 */
export function formatQuizTime(
  timeStr?: string,
  scheduledDate?: string,
  now: Date = new Date()
): string {
  if (!timeStr || !timeStr.trim()) return '12:00 AM';
  const clean = timeStr.trim();

  // If already formatted with AM/PM (e.g. "2:35 PM")
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12 && match12[3]) {
    const h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = match12[3].toUpperCase();
    return `${h}:${m} ${ampm}`;
  }

  // 24-hr string: "14:35" or "02:57"
  const [hStr, mStr] = clean.split(':');
  let h24 = parseInt(hStr, 10);
  const mins = (mStr || '00').padStart(2, '0').slice(0, 2);

  if (isNaN(h24)) return clean;

  // Smart 12h PM detection for today if hour < 12 and current time is afternoon:
  // e.g. "02:57" scheduled on today when current time is 2:50 PM represents 2:57 PM.
  if (scheduledDate && h24 >= 1 && h24 < 12) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (scheduledDate === todayStr && now.getHours() >= 12) {
      h24 += 12;
    }
  }

  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${mins} ${ampm}`;
}

/**
 * Safely parse scheduledDate (YYYY-MM-DD) and scheduledTime (HH:mm) into a local Date object.
 * Intelligently resolves 12h/24h ambiguity so that an afternoon quiz saved as "02:57" is
 * correctly mapped to 2:57 PM (14:57) instead of 2:57 AM in the past.
 */
export function getQuizUnlockDate(
  scheduledDate?: string,
  scheduledTime?: string,
  now: Date = new Date()
): Date | null {
  if (!scheduledDate) return null;

  try {
    const dateParts = scheduledDate.split('-').map(p => parseInt(p, 10));
    if (dateParts.length < 3 || isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) {
      return null;
    }
    const [year, month, day] = dateParts;

    let hour = 0;
    let minute = 0;
    let hasExplicitAmPm = false;

    if (scheduledTime && scheduledTime.trim()) {
      const cleanTime = scheduledTime.trim();
      const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12 && match12[3]) {
        hasExplicitAmPm = true;
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const ampm = match12[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        hour = h;
        minute = m;
      } else {
        const [hStr, mStr] = cleanTime.split(':');
        hour = parseInt(hStr, 10) || 0;
        minute = parseInt(mStr, 10) || 0;
      }
    }

    // Smart 12h resolution when AM/PM is omitted:
    // If scheduled for today, and hour is between 1 and 11:
    // When current time is afternoon (>= 12:00) and the morning hour has already passed,
    // a quiz scheduled for e.g. "02:57" was entered as 2:57 PM (14:57), NOT 2:57 AM.
    if (!hasExplicitAmPm && hour >= 1 && hour < 12) {
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (scheduledDate === todayStr) {
        const morningDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        const afternoonDate = new Date(year, month - 1, day, hour + 12, minute, 0, 0);
        if (now.getTime() > morningDate.getTime() && (now.getTime() <= afternoonDate.getTime() + 60000 || now.getHours() >= 12)) {
          hour += 12;
        }
      }
    }

    return new Date(year, month - 1, day, hour, minute, 0, 0);
  } catch {
    return null;
  }
}

/**
 * Checks whether a quiz is currently scheduled and locked.
 * Returns true strictly if:
 * 1. quiz status is 'scheduled'
 * 2. scheduledDate is set
 * 3. current time is BEFORE the unlock date & time.
 *
 * As soon as current time >= unlock date & time, returns false (unlocked).
 */
export function isQuizScheduledLocked(
  quiz?: {
    status?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  } | null,
  now: Date = new Date()
): boolean {
  if (!quiz || quiz.status !== 'scheduled' || !quiz.scheduledDate) {
    return false;
  }

  const unlockDate = getQuizUnlockDate(quiz.scheduledDate, quiz.scheduledTime, now);
  if (!unlockDate) return false;

  return now.getTime() < unlockDate.getTime();
}

/**
 * Returns human-friendly text describing when the quiz will unlock.
 * E.g.
 * - "Unlocks in 5m · 2:35 PM"
 * - "Unlocks today at 2:35 PM"
 * - "Unlocks tomorrow at 2:35 PM"
 * - "Unlocks on Oct 12 at 2:35 PM"
 */
export function getQuizUnlockStatusText(
  scheduledDate?: string,
  scheduledTime?: string,
  now: Date = new Date()
): string {
  if (!scheduledDate) return 'Locked';

  const unlockDate = getQuizUnlockDate(scheduledDate, scheduledTime, now);
  const formattedTime = formatQuizTime(scheduledTime || '06:00', scheduledDate, now);

  if (!unlockDate) {
    return `Unlocks on ${scheduledDate} at ${formattedTime}`;
  }

  const diffMs = unlockDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'Unlocked';
  }

  const diffMinutes = Math.floor(diffMs / 60000);

  // If unlocking within the next 60 minutes
  if (diffMinutes < 60 && diffMinutes > 0) {
    return `Unlocks in ${diffMinutes}m · ${formattedTime}`;
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  if (scheduledDate === todayStr) {
    return `Unlocks today at ${formattedTime}`;
  } else if (scheduledDate === tomorrowStr) {
    return `Unlocks tomorrow at ${formattedTime}`;
  }

  return `Unlocks on ${scheduledDate} at ${formattedTime}`;
}
