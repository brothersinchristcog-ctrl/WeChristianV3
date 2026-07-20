import FirestoreService from '../services/FirestoreService';
import { PastorEvent } from '../types/event';

/**
 * Checks if a proposed time range overlaps with any existing events on the same day.
 * 
 * @param dateStr - The date string, e.g. "2026-06-08" or ISO timestamp
 * @param startMs - The proposed start time in epoch milliseconds
 * @param durationMins - The proposed duration in minutes
 * @param excludeEventId - Optional event ID to exclude from conflict checks (e.g. when editing)
 * @returns Array of overlapping event titles. Empty array if no conflicts.
 */
export const checkScheduleConflicts = async (
  dateStr: string,
  startMs: number,
  durationMins: number,
  excludeEventId?: string
): Promise<string[]> => {
  try {
    const existingEvents = await FirestoreService.getPastorEvents();
    
    // Normalize target date to YYYY-MM-DD
    let targetDateStr = dateStr;
    if (dateStr.includes('T')) {
      targetDateStr = dateStr.split('T')[0];
    }

    const sameDayEvents = existingEvents.filter(e => 
      e.date === targetDateStr && e.id !== excludeEventId
    );

    if (sameDayEvents.length === 0) return [];

    const endMs = startMs + (durationMins * 60000);

    // Helper to parse the 12-hour AM/PM string into a Date object on the target day
    const parseTime = (timeStr: string) => {
      if (!timeStr) return startMs; // fallback
      
      const parts = timeStr.split(' ');
      let hours = 0, minutes = 0;
      
      if (parts.length >= 2) {
        const [time, modifier] = parts;
        const [h, m] = time.split(':');
        hours = parseInt(h, 10);
        if (hours === 12) hours = 0;
        if (modifier.toUpperCase() === 'PM') hours += 12;
        minutes = parseInt(m || '0', 10);
      } else {
        // Fallback for 24hr format
        const [h, m] = timeStr.split(':');
        hours = parseInt(h, 10);
        minutes = parseInt(m || '0', 10);
      }
      
      const d = new Date(startMs);
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    };

    const conflicts: string[] = [];

    for (const evt of sameDayEvents) {
      const evtStartMs = parseTime(evt.startTime);
      const evtEndMs = evtStartMs + ((evt.durationMins || 60) * 60000); // fallback 1hr

      if (startMs < evtEndMs && evtStartMs < endMs) {
        conflicts.push(`"${evt.title}" on ${evt.date} at ${evt.startTime}`);
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    return []; // Fail silently so we don't block event creation
  }
};
