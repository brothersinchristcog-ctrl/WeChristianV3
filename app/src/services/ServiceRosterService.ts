import { firestore } from './firebaseConfig';

export interface ServiceRole {
  id: string;
  name: string;
  placeholder?: string;
  isMulti?: boolean;
}

export interface ServiceDepartment {
  id: string;
  name: string;
  color: string;
  badgeBg?: string;
  roles: ServiceRole[];
}

export interface SetlistItem {
  id: string;
  title: string;
  ledBy: string;
  key: string;
  timeSignature: string; // e.g. "4/4", "3/4", "7/8"
  tempo: string;         // e.g. "100", "128"
  verses: string;        // e.g. "4V", "5V"
  prelude: string;       // e.g. "Acoustic + Drum", "Keys"
  interlude: string;     // e.g. "Keys + Elec (Alt)"
  notes: string;         // e.g. "Celebrate God's power, strength, and salvation"
  isOffertory?: boolean;
}

export type TimetableCategory = 
  | 'starting_prayer'
  | 'opening_song'
  | 'worship_songs'
  | 'bible_reading'
  | 'sermon'
  | 'closing_prayer'
  | 'break'
  | 'communion'
  | 'offertory'
  | 'announcements'
  | 'testimony'
  | 'intercession'
  | 'additional';

export interface TimetableTemplateMeta {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultTitle: string;
  serviceType: 'sunday_service' | 'special_event' | 'conference';
  getItems: () => RunSheetItem[];
}

export interface RunSheetItem {
  id: string;
  time: string;           // e.g. "09:00 to 09:20"
  startTime?: string;     // e.g. "09:00"
  endTime?: string;       // e.g. "09:20"
  durationMinutes: number;// e.g. 20
  program: string;        // e.g. "Flag Hoisting / Prayer for India"
  category?: TimetableCategory;
  assignedTo: string;     // e.g. "Ps. Raju / Ps. V. Babu"
  songTitle?: string;     // For songs/worship
  musicians?: string;     // Instrumentalists / band members
  passage?: string;       // For Bible reading (e.g. "Lev 19:2")
  place?: string;         // e.g. "4F Terrace", "1F Church", "Main Hall"
  notes?: string;
}

export interface ServicePlan {
  id: string;
  churchId: string;
  churchName?: string;
  date: string;               // YYYY-MM-DD e.g. "2026-08-16"
  serviceTitle: string;       // e.g. "Bethesda Family Conference 2026"
  serviceType: 'sunday_service' | 'special_event' | 'conference';
  status: 'draft' | 'published';
  startTime?: string;         // e.g. "09:00"
  endTime?: string;           // e.g. "16:00"
  location?: string;          // e.g. "Bethesda Church"
  totalDurationMinutes?: number;
  
  // Dynamic role assignments: map of roleId -> assigned member name(s)
  assignments: Record<string, string>;
  
  // Sunday School specific classes if used
  sundaySchoolClasses?: {
    className: string;
    teacher: string;
    lesson: string;
  }[];

  // Specific anchors
  startingPrayer?: { person: string; startTime: string; endTime: string };
  openingSong?: { songTitle: string; leader: string; musicians: string; startTime: string; endTime: string };
  bibleReading?: { person: string; passage: string; startTime: string; endTime: string };
  closingPrayer?: { person: string; startTime: string; endTime: string };

  // Sermon details
  sermon: {
    title: string;
    code: string;
    keyVerses: string;
    speaker: string;
    translation?: string;
    startTime?: string;
    endTime?: string;
  };

  // Setlist flow
  setlist: SetlistItem[];

  // Order of Service / Run-sheet (The full chronological timetable)
  runSheet: RunSheetItem[];

  // Custom departments override (if this church customized their layout)
  departments?: ServiceDepartment[];

  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_DEPARTMENTS: ServiceDepartment[] = [
  {
    id: 'worship',
    name: 'Worship Team & Set List',
    color: '#4A235A', // Rich Deep Violet/Purple
    badgeBg: '#F4ECF7',
    roles: [
      { id: 'singer_1', name: 'Singer #1 / Center', placeholder: 'Assign singer' },
      { id: 'singer_2', name: 'Singer #2 / Left', placeholder: 'Assign singer' },
      { id: 'singer_3', name: 'Singer #3 / Right', placeholder: 'Assign singer' },
      { id: 'acoustic', name: 'Acoustic Guitar', placeholder: 'Assign guitarist' },
      { id: 'keyboard', name: 'Keyboard', placeholder: 'Assign keyboardist' },
      { id: 'electric', name: 'Electric Guitar', placeholder: 'Assign guitarist' },
      { id: 'bass', name: 'Bass Guitar', placeholder: 'Assign bassist' },
      { id: 'drums', name: 'Drums', placeholder: 'Assign drummer' },
    ]
  },
  {
    id: 'bmw',
    name: 'Team BMW (Sound, Media & AV)',
    color: '#3D5A27', // Olive / Forest Green
    badgeBg: '#EAFAF1',
    roles: [
      { id: 'sound_foh', name: 'Sounds (FOH)', placeholder: 'Assign sound engineer' },
      { id: 'sound_stage', name: 'Sounds (Stage)', placeholder: 'Assign stage monitor tech' },
      { id: 'media_pc1', name: 'Media - PC1 (Live)', placeholder: 'Assign live operator' },
      { id: 'media_pc2', name: 'Media - PC2 (CG)', placeholder: 'Assign CG operator' },
      { id: 'media_pc3', name: 'Media - PC3 (Lyrics)', placeholder: 'Assign lyrics operator' },
      { id: 'media_pc4', name: 'Media - PC4 (Stage)', placeholder: 'Assign stage screen tech' },
      { id: 'cam_main', name: 'V. Camera (Main)', placeholder: 'Assign camera operator' },
      { id: 'cam_right', name: 'V. Camera (Right)', placeholder: 'Assign camera operator' },
      { id: 'cam_left', name: 'V. Camera (Left)', placeholder: 'Assign camera operator' },
      { id: 'cam_gimbal', name: 'V. Camera (Gimbal)', placeholder: 'Assign camera operator' },
      { id: 'video_dir', name: 'Video Direction / Mix', placeholder: 'Assign video director' },
      { id: 'photo_cam', name: 'Photo Camera', placeholder: 'Assign photographer' },
    ]
  },
  {
    id: 'sunday_school',
    name: 'Sunday School',
    color: '#BA4A00', // Warm Rust Orange
    badgeBg: '#FDF2E9',
    roles: [
      { id: 'ss_beginners', name: 'Beginners Class', placeholder: 'Teacher & Lesson details' },
      { id: 'ss_primary', name: 'Primary Class', placeholder: 'Teacher & Lesson details' },
      { id: 'ss_juniors', name: 'Juniors Class', placeholder: 'Teacher & Lesson details' },
      { id: 'ss_seniors', name: 'Seniors Class', placeholder: 'Teacher & Lesson details' },
      { id: 'ss_special_needs', name: 'Special Needs Crew', placeholder: 'Assign teachers' },
    ]
  },
  {
    id: 'others',
    name: 'Hospitality & Platform Ministers',
    color: '#117864', // Deep Teal
    badgeBg: '#E8F8F5',
    roles: [
      { id: 'fmh', name: 'FMH (Food / Hospitality)', placeholder: 'Assign hospitality team' },
      { id: 'ushering', name: 'Ushering Team', placeholder: 'Assign ushers' },
      { id: 'op_prayer', name: 'Opening Prayer', placeholder: 'Assign minister' },
      { id: 'cl_prayer', name: 'Closing Prayer', placeholder: 'Assign minister' },
      { id: 'devotion', name: 'Devotion', placeholder: 'Assign speaker' },
      { id: 'communion', name: 'Communion', placeholder: 'Assign ministers' },
      { id: 'announcements', name: 'Announcements', placeholder: 'Assign announcer' },
    ]
  }
];

class ServiceRosterService {
  /**
   * Get all service plans for a church, ordered by date descending
   */
  async getServicePlans(churchId: string, limitCount = 30): Promise<ServicePlan[]> {
    try {
      if (!churchId) return [];
      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('service_plans')
        .orderBy('date', 'desc')
        .limit(limitCount)
        .get();

      let list = snap.docs.map(doc => ({
        id: doc.id,
        churchId,
        ...(doc.data() as any)
      })) as ServicePlan[];

      // Filter out any dummy plans (e.g. Richard, Amulya, or old Telugu dummy services)
      list = list.filter(p => 
        p.serviceTitle !== '1st Service - Telugu' && 
        p.assignments?.singer_1 !== 'Richard' &&
        Boolean(p.serviceTitle) && 
        Boolean(p.date)
      );

      // If no valid plans exist in service_plans, auto-import from church's real setlists
      if (list.length === 0) {
        try {
          const setlistDoc = await firestore()
            .collection('churches')
            .doc(churchId)
            .collection('setlists')
            .doc('all_services')
            .get();

          const docExists = typeof (setlistDoc as any).exists === 'function' ? (setlistDoc as any).exists() : (setlistDoc as any).exists;
          if (docExists) {
            const raw = setlistDoc.data()?.services || [];
            for (const s of raw) {
              const formattedPlan: Partial<ServicePlan> = {
                churchId,
                churchName: 'We Christian',
                date: s.date ? (s.date.includes('-') && s.date.length === 10 ? s.date : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                serviceTitle: s.name || 'Sunday Service',
                serviceType: s.category?.toLowerCase().includes('prayer') ? 'special_event' : 'sunday_service',
                status: 'published',
                startTime: s.startTime || '09:00',
                endTime: s.endTime || '11:00',
                location: 'We Christian Sanctuary',
                assignments: {},
                setlist: (s.songs || []).map((song: any, idx: number) => ({
                  id: song.id || String(idx + 1),
                  title: song.title || song.titleTe || 'Worship Song',
                  ledBy: song.ledBy || '',
                  key: song.key || 'F',
                  timeSignature: song.timeSignature || '4/4',
                  tempo: String(song.tempo || '100'),
                  verses: song.verses || '4V',
                  prelude: song.prelude || '',
                  interlude: song.interlude || '',
                  notes: song.notes || '',
                  isOffertory: Boolean(song.isOffertory)
                })),
                runSheet: this.getStandardSundayServiceSample()
              };
              const newId = await this.saveServicePlan(churchId, formattedPlan);
              list.push({ id: newId, ...formattedPlan } as ServicePlan);
            }
          }
        } catch (err) {
          console.warn('[ServiceRosterService] Error auto-importing real services:', err);
        }
      }

      return list;
    } catch (e) {
      console.error('[ServiceRosterService] getServicePlans error:', e);
      return [];
    }
  }

  /**
   * Get a single service plan by ID
   */
  async getServicePlanById(churchId: string, planId: string): Promise<ServicePlan | null> {
    try {
      if (!churchId || !planId) return null;
      const doc = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('service_plans')
        .doc(planId)
        .get();

      if (!doc.exists) return null;
      return { id: doc.id, churchId, ...(doc.data() as any) } as ServicePlan;
    } catch (e) {
      console.error('[ServiceRosterService] getServicePlanById error:', e);
      return null;
    }
  }

  /**
   * Save (create or update) a service plan
   */
  async saveServicePlan(churchId: string, plan: Partial<ServicePlan>): Promise<string> {
    try {
      if (!churchId) throw new Error('Church ID required');
      const col = firestore().collection('churches').doc(churchId).collection('service_plans');
      
      const payload: any = {
        ...plan,
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      if (plan.id) {
        await col.doc(plan.id).set(payload, { merge: true });
        return plan.id;
      } else {
        payload.createdAt = firestore.FieldValue.serverTimestamp();
        const docRef = await col.add(payload);
        return docRef.id;
      }
    } catch (e) {
      console.error('[ServiceRosterService] saveServicePlan error:', e);
      throw e;
    }
  }

  /**
   * Delete a service plan
   */
  async deleteServicePlan(churchId: string, planId: string): Promise<void> {
    try {
      if (!churchId || !planId) return;
      await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('service_plans')
        .doc(planId)
        .delete();
    } catch (e) {
      console.error('[ServiceRosterService] deleteServicePlan error:', e);
      throw e;
    }
  }

  /**
   * Clone a plan from last Sunday or another date
   */
  clonePlan(source: ServicePlan, newDate: string, newServiceTitle?: string): Partial<ServicePlan> {
    return {
      churchId: source.churchId,
      churchName: source.churchName,
      date: newDate,
      serviceTitle: newServiceTitle || source.serviceTitle,
      serviceType: source.serviceType,
      status: 'draft',
      assignments: { ...source.assignments },
      sundaySchoolClasses: source.sundaySchoolClasses ? [...source.sundaySchoolClasses] : [],
      sermon: {
        title: '',
        code: '',
        keyVerses: '',
        speaker: source.sermon?.speaker || '',
        translation: source.sermon?.translation || ''
      },
      setlist: source.setlist ? source.setlist.map(s => ({ ...s, id: Math.random().toString(36).substring(7) })) : [],
      runSheet: source.runSheet ? source.runSheet.map(r => ({ ...r, id: Math.random().toString(36).substring(7) })) : [],
      departments: source.departments || DEFAULT_DEPARTMENTS
    };
  }

  /**
   * Format a high-impact, clean WhatsApp broadcast text summary
   */
  generateWhatsAppShareText(plan: ServicePlan): string {
    const churchTitle = (plan.churchName || 'CHURCH').toUpperCase();
    let text = `⛪ *${churchTitle}*\n`;
    text += `📋 *${plan.serviceTitle} Schedule*\n`;
    text += `📅 Date: *${plan.date}*\n\n`;

    // 1. Sermon
    if (plan.sermon?.title) {
      text += `📖 *SERMON*\n`;
      text += `• Title: ${plan.sermon.title}${plan.sermon.code ? ` (${plan.sermon.code})` : ''}\n`;
      if (plan.sermon.keyVerses) text += `• Scripture: ${plan.sermon.keyVerses}\n`;
      if (plan.sermon.speaker) text += `• Speaker: ${plan.sermon.speaker}\n`;
      if (plan.sermon.translation) text += `• Translation: ${plan.sermon.translation}\n`;
      text += `\n`;
    }

    // 2. Worship Team & Songs
    const singers = [plan.assignments['singer_1'], plan.assignments['singer_2'], plan.assignments['singer_3']].filter(Boolean);
    const band = [
      plan.assignments['acoustic'] && `Acoustic: ${plan.assignments['acoustic']}`,
      plan.assignments['keyboard'] && `Keys: ${plan.assignments['keyboard']}`,
      plan.assignments['electric'] && `Electric: ${plan.assignments['electric']}`,
      plan.assignments['bass'] && `Bass: ${plan.assignments['bass']}`,
      plan.assignments['drums'] && `Drums: ${plan.assignments['drums']}`,
    ].filter(Boolean);

    text += `🎵 *WORSHIP TEAM & BAND*\n`;
    if (singers.length > 0) text += `• Vocals: ${singers.join(', ')}\n`;
    if (band.length > 0) text += `• Band: ${band.join(' | ')}\n`;
    
    if (plan.setlist && plan.setlist.length > 0) {
      text += `🎶 *Set List:*\n`;
      plan.setlist.forEach((s, idx) => {
        text += `  ${idx + 1}. ${s.title} [Key: ${s.key || 'N/A'}] - Led by ${s.ledBy || 'Lead'}\n`;
      });
    }
    text += `\n`;

    // 3. Media & Broadcast (BMW)
    text += `🎛️ *BROADCAST & MEDIA (TEAM BMW)*\n`;
    if (plan.assignments['sound_foh']) text += `• Sound FOH: ${plan.assignments['sound_foh']}\n`;
    if (plan.assignments['sound_stage']) text += `• Sound Stage: ${plan.assignments['sound_stage']}\n`;
    if (plan.assignments['media_pc1']) text += `• Live PC: ${plan.assignments['media_pc1']}\n`;
    if (plan.assignments['media_pc3']) text += `• Lyrics PC: ${plan.assignments['media_pc3']}\n`;
    if (plan.assignments['cam_main']) text += `• Camera Main: ${plan.assignments['cam_main']}\n`;
    if (plan.assignments['video_dir']) text += `• Video Direction: ${plan.assignments['video_dir']}\n`;
    text += `\n`;

    // 4. Hospitality & Liturgy
    text += `🤝 *HOSPITALITY & LITURGY*\n`;
    if (plan.assignments['op_prayer']) text += `• Opening Prayer: ${plan.assignments['op_prayer']}\n`;
    if (plan.assignments['cl_prayer']) text += `• Closing Prayer: ${plan.assignments['cl_prayer']}\n`;
    if (plan.assignments['announcements']) text += `• Announcements: ${plan.assignments['announcements']}\n`;
    if (plan.assignments['ushering']) text += `• Ushers: ${plan.assignments['ushering']}\n`;
    if (plan.assignments['fmh']) text += `• FMH: ${plan.assignments['fmh']}\n`;
    text += `\n`;

    text += `📲 View full setlist details, chords & live run sheet in the WeChristian App!`;
    return text;
  }

  /**
   * Parse time string into minutes from midnight (0 to 1439).
   * Supports "09:00", "9:00", "09:20 AM", "1:30 PM", "13:30", etc.
   */
  parseTimeToMinutes(str: string): number {
    if (!str || typeof str !== 'string') return 0;
    const clean = str.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parts = clean.replace(/[APM\s]/g, '').split(':');
    if (parts.length < 2) return 0;
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return Math.min(1439, Math.max(0, hours * 60 + minutes));
  }

  /**
   * Convert minutes from midnight back into "HH:mm" formatted string.
   */
  minutesToTimeString(totalMinutes: number): string {
    const mins = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate duration in minutes between start and end time.
   */
  calculateDuration(startStr: string, endStr: string): number {
    const s = this.parseTimeToMinutes(startStr);
    const e = this.parseTimeToMinutes(endStr);
    if (e >= s) return e - s;
    // Crosses midnight
    return (1440 - s) + e;
  }

  /**
   * Format start & end into standardized "09:00 to 09:20" string
   */
  formatTimeRange(startStr: string, endStr: string): string {
    const s = (startStr || '').trim();
    const e = (endStr || '').trim();
    if (!s && !e) return '';
    if (!e) return s;
    return `${s} to ${e}`;
  }

  /**
   * Validates schedule: detects overlaps between items, verifies bounds against overall service start & end,
   * and calculates durations.
   */
  validateSchedule(serviceStart: string, serviceEnd: string, items: RunSheetItem[]): {
    hasOverlaps: boolean;
    overlapMessages: string[];
    exceedsWindow: boolean;
    windowMessages: string[];
    totalScheduledMinutes: number;
    totalServiceMinutes: number;
  } {
    const overlapMessages: string[] = [];
    const windowMessages: string[] = [];

    const svcStartMin = this.parseTimeToMinutes(serviceStart || '09:00');
    const svcEndMin = this.parseTimeToMinutes(serviceEnd || '12:00');
    const totalServiceMinutes = svcEndMin >= svcStartMin ? svcEndMin - svcStartMin : (1440 - svcStartMin) + svcEndMin;

    let totalScheduledMinutes = 0;

    // Check individual items
    const parsedItems = items.map((item, index) => {
      // Determine start/end from properties or time string
      let sStr = item.startTime;
      let eStr = item.endTime;
      if (!sStr || !eStr) {
        const split = (item.time || '').split(/to|-/i);
        sStr = sStr || (split[0] ? split[0].trim() : '09:00');
        eStr = eStr || (split[1] ? split[1].trim() : '09:00');
      }
      const sMin = this.parseTimeToMinutes(sStr);
      let eMin = this.parseTimeToMinutes(eStr);
      if (eMin <= sMin && item.durationMinutes > 0) {
        eMin = sMin + item.durationMinutes;
      }
      const duration = Math.max(1, eMin - sMin);
      totalScheduledMinutes += duration;

      // Check within service window bounds
      if (serviceStart && sMin < svcStartMin) {
        windowMessages.push(`"${item.program || 'Activity'}" starts at ${sStr}, before service start (${serviceStart})`);
      }
      if (serviceEnd && eMin > svcEndMin) {
        windowMessages.push(`"${item.program || 'Activity'}" ends at ${eStr}, after service end (${serviceEnd})`);
      }

      return {
        index,
        title: item.program || `Item #${index + 1}`,
        sMin,
        eMin,
        sStr,
        eStr,
      };
    });

    // Check for pairwise overlaps
    for (let i = 0; i < parsedItems.length; i++) {
      for (let j = i + 1; j < parsedItems.length; j++) {
        const a = parsedItems[i];
        const b = parsedItems[j];
        if (a.sMin < b.eMin && b.sMin < a.eMin) {
          overlapMessages.push(`Overlap: "${a.title}" (${a.sStr}-${a.eStr}) conflicts with "${b.title}" (${b.sStr}-${b.eStr})`);
        }
      }
    }

    return {
      hasOverlaps: overlapMessages.length > 0,
      overlapMessages,
      exceedsWindow: windowMessages.length > 0,
      windowMessages,
      totalScheduledMinutes,
      totalServiceMinutes,
    };
  }

  /**
   * Generates a template Conference timetable
   */
  getBethesdaConferenceSample(): RunSheetItem[] {
    return [
      { id: 'c1', time: '09:00 to 09:20', startTime: '09:00', endTime: '09:20', durationMinutes: 20, program: 'Opening Prayer', category: 'starting_prayer', place: 'Main Hall', assignedTo: '' },
      { id: 'c2', time: '09:20 to 09:50', startTime: '09:20', endTime: '09:50', durationMinutes: 30, program: 'Praise & Worship', category: 'worship_songs', place: 'Main Hall', assignedTo: '', musicians: '' },
      { id: 'c3', time: '09:50 to 11:00', startTime: '09:50', endTime: '11:00', durationMinutes: 70, program: 'Conference Session 1', category: 'sermon', place: 'Main Hall', assignedTo: '' },
      { id: 'c4', time: '11:00 to 11:20', startTime: '11:00', endTime: '11:20', durationMinutes: 20, program: 'Tea Break', category: 'break', place: 'Dining Area', assignedTo: '' },
      { id: 'c5', time: '11:20 to 12:30', startTime: '11:20', endTime: '12:30', durationMinutes: 70, program: 'Conference Session 2', category: 'sermon', place: 'Main Hall', assignedTo: '' },
      { id: 'c6', time: '12:30 to 13:30', startTime: '12:30', endTime: '13:30', durationMinutes: 60, program: 'Lunch Break', category: 'break', place: 'Dining Area', assignedTo: '' },
      { id: 'c7', time: '13:30 to 14:00', startTime: '13:30', endTime: '14:00', durationMinutes: 30, program: 'Worship & Reflection', category: 'worship_songs', place: 'Main Hall', assignedTo: '', musicians: '' },
      { id: 'c8', time: '14:00 to 15:30', startTime: '14:00', endTime: '15:30', durationMinutes: 90, program: 'Breakout Sessions', category: 'sermon', place: 'Halls', assignedTo: '' },
      { id: 'c9', time: '15:30 to 16:00', startTime: '15:30', endTime: '16:00', durationMinutes: 30, program: 'Closing Prayer & Benediction', category: 'closing_prayer', place: 'Main Hall', assignedTo: '' }
    ];
  }

  /**
   * Generates a standard Sunday Service timetable template with all core church elements
   */
  getStandardSundayServiceSample(): RunSheetItem[] {
    return [
      { id: 's1', time: '09:00 to 09:10', startTime: '09:00', endTime: '09:10', durationMinutes: 10, program: 'Starting Prayer & Invocation', category: 'starting_prayer', place: 'Sanctuary', assignedTo: '' },
      { id: 's2', time: '09:10 to 09:20', startTime: '09:10', endTime: '09:20', durationMinutes: 10, program: 'Opening Praise Song', category: 'opening_song', songTitle: '', place: 'Sanctuary', assignedTo: '', musicians: '' },
      { id: 's3', time: '09:20 to 09:50', startTime: '09:20', endTime: '09:50', durationMinutes: 30, program: 'Praise & Worship', category: 'worship_songs', songTitle: '', place: 'Sanctuary', assignedTo: '', musicians: '' },
      { id: 's4', time: '09:50 to 10:00', startTime: '09:50', endTime: '10:00', durationMinutes: 10, program: 'Scripture / Bible Reading', category: 'bible_reading', passage: '', place: 'Sanctuary', assignedTo: '' },
      { id: 's5', time: '10:00 to 10:10', startTime: '10:00', endTime: '10:10', durationMinutes: 10, program: 'Welcome & Announcements', category: 'announcements', place: 'Sanctuary', assignedTo: '' },
      { id: 's6', time: '10:10 to 10:20', startTime: '10:10', endTime: '10:20', durationMinutes: 10, program: 'Offertory & Tithes', category: 'offertory', songTitle: '', place: 'Sanctuary', assignedTo: '' },
      { id: 's7', time: '10:20 to 11:00', startTime: '10:20', endTime: '11:00', durationMinutes: 40, program: 'Sermon / Message', category: 'sermon', passage: '', place: 'Sanctuary', assignedTo: '' },
      { id: 's8', time: '11:00 to 11:10', startTime: '11:00', endTime: '11:10', durationMinutes: 10, program: 'Altar Call & Pastoral Prayer', category: 'intercession', place: 'Sanctuary', assignedTo: '' },
      { id: 's9', time: '11:10 to 11:15', startTime: '11:10', endTime: '11:15', durationMinutes: 5, program: 'Closing Prayer & Benediction', category: 'closing_prayer', place: 'Sanctuary', assignedTo: '' }
    ];
  }

  /**
   * Generates an All-Night Prayer Vigil timetable template
   */
  getAllNightPrayerSample(): RunSheetItem[] {
    return [
      { id: 'an1', time: '21:00 to 21:20', startTime: '21:00', endTime: '21:20', durationMinutes: 20, program: 'Call to Worship & Opening Prayer', category: 'starting_prayer', place: 'Sanctuary', assignedTo: '' },
      { id: 'an2', time: '21:20 to 22:15', startTime: '21:20', endTime: '22:15', durationMinutes: 55, program: 'Warfare Praise & High Worship', category: 'worship_songs', songTitle: '', place: 'Sanctuary', assignedTo: '', musicians: '' },
      { id: 'an3', time: '22:15 to 22:50', startTime: '22:15', endTime: '22:50', durationMinutes: 35, program: 'Scriptural Exhortation', category: 'sermon', passage: '', place: 'Sanctuary', assignedTo: '' },
      { id: 'an4', time: '22:50 to 23:40', startTime: '22:50', endTime: '23:40', durationMinutes: 50, program: 'Repentance & Cleansing Intercession', category: 'intercession', place: 'Sanctuary', assignedTo: '' },
      { id: 'an5', time: '23:40 to 00:10', startTime: '23:40', endTime: '00:10', durationMinutes: 30, program: 'Tea & Fellowship Break', category: 'break', place: 'Dining Area', assignedTo: '' },
      { id: 'an6', time: '00:10 to 01:10', startTime: '00:10', endTime: '01:10', durationMinutes: 60, program: 'Midnight Deliverance & Healing Prayer', category: 'intercession', place: 'Sanctuary', assignedTo: '' },
      { id: 'an7', time: '01:10 to 01:45', startTime: '01:10', endTime: '01:45', durationMinutes: 35, program: 'Prophetic Word & Testimonies', category: 'testimony', place: 'Sanctuary', assignedTo: '' },
      { id: 'an8', time: '01:45 to 02:00', startTime: '01:45', endTime: '02:00', durationMinutes: 15, program: 'Dawn Thanksgiving & Benediction', category: 'closing_prayer', place: 'Sanctuary', assignedTo: '' }
    ];
  }

  /**
   * Generates a Mid-Week Bible Study & Prayer timetable template
   */
  getMidweekBibleStudySample(): RunSheetItem[] {
    return [
      { id: 'mw1', time: '19:00 to 19:10', startTime: '19:00', endTime: '19:10', durationMinutes: 10, program: 'Opening Prayer', category: 'starting_prayer', place: 'Sanctuary', assignedTo: '' },
      { id: 'mw2', time: '19:10 to 19:30', startTime: '19:10', endTime: '19:30', durationMinutes: 20, program: 'Worship & Devotional Songs', category: 'worship_songs', songTitle: '', place: 'Sanctuary', assignedTo: '', musicians: '' },
      { id: 'mw3', time: '19:30 to 20:15', startTime: '19:30', endTime: '20:15', durationMinutes: 45, program: 'In-Depth Bible Study Exposition', category: 'sermon', passage: '', place: 'Sanctuary', assignedTo: '' },
      { id: 'mw4', time: '20:15 to 20:35', startTime: '20:15', endTime: '20:35', durationMinutes: 20, program: 'Church Needs & Intercessory Prayer', category: 'intercession', place: 'Sanctuary', assignedTo: '' },
      { id: 'mw5', time: '20:35 to 20:45', startTime: '20:35', endTime: '20:45', durationMinutes: 10, program: 'Closing Benediction & Fellowship', category: 'closing_prayer', place: 'Sanctuary', assignedTo: '' }
    ];
  }

  /**
   * Generates a Holy Communion & Fasting timetable template
   */
  getCommunionFastingSample(): RunSheetItem[] {
    return [
      { id: 'cm1', time: '10:00 to 10:20', startTime: '10:00', endTime: '10:20', durationMinutes: 20, program: 'Opening Devotion & Fasting Prayer', category: 'starting_prayer', place: 'Sanctuary', assignedTo: '' },
      { id: 'cm2', time: '10:20 to 10:55', startTime: '10:20', endTime: '10:55', durationMinutes: 35, program: 'Solemn Praise & Worship', category: 'worship_songs', songTitle: '', place: 'Sanctuary', assignedTo: '', musicians: '' },
      { id: 'cm3', time: '10:55 to 11:05', startTime: '10:55', endTime: '11:05', durationMinutes: 10, program: 'Scripture Reading (1 Corinthians 11)', category: 'bible_reading', passage: '1 Cor 11:23-26', place: 'Sanctuary', assignedTo: '' },
      { id: 'cm4', time: '11:05 to 11:40', startTime: '11:05', endTime: '11:40', durationMinutes: 35, program: 'The Lord’s Table Exhortation', category: 'sermon', passage: '', place: 'Sanctuary', assignedTo: '' },
      { id: 'cm5', time: '11:40 to 12:00', startTime: '11:40', endTime: '12:00', durationMinutes: 20, program: 'Holy Communion (Bread & Wine)', category: 'communion', place: 'Sanctuary', assignedTo: '' },
      { id: 'cm6', time: '12:00 to 12:10', startTime: '12:00', endTime: '12:10', durationMinutes: 10, program: 'Tithes & Thanksgiving Offertory', category: 'offertory', place: 'Sanctuary', assignedTo: '' },
      { id: 'cm7', time: '12:10 to 12:15', startTime: '12:10', endTime: '12:15', durationMinutes: 5, program: 'Pastoral Blessing & Benediction', category: 'closing_prayer', place: 'Sanctuary', assignedTo: '' }
    ];
  }

  /**
   * Generates a Youth & Worship Night timetable template
   */
  getYouthWorshipNightSample(): RunSheetItem[] {
    return [
      { id: 'yn1', time: '18:00 to 18:15', startTime: '18:00', endTime: '18:15', durationMinutes: 15, program: 'Icebreaker & Welcome', category: 'additional', place: 'Youth Hall', assignedTo: '' },
      { id: 'yn2', time: '18:15 to 18:25', startTime: '18:15', endTime: '18:25', durationMinutes: 10, program: 'Opening Prayer', category: 'starting_prayer', place: 'Youth Hall', assignedTo: '' },
      { id: 'yn3', time: '18:25 to 19:15', startTime: '18:25', endTime: '19:15', durationMinutes: 50, program: 'Extended Contemporary Worship', category: 'worship_songs', songTitle: '', place: 'Youth Hall', assignedTo: '', musicians: '' },
      { id: 'yn4', time: '19:15 to 19:30', startTime: '19:15', endTime: '19:30', durationMinutes: 15, program: 'Youth Testimony & Creative Feature', category: 'testimony', place: 'Youth Hall', assignedTo: '' },
      { id: 'yn5', time: '19:30 to 20:05', startTime: '19:30', endTime: '20:05', durationMinutes: 35, program: 'Youth Message / Living Word', category: 'sermon', passage: '', place: 'Youth Hall', assignedTo: '' },
      { id: 'yn6', time: '20:05 to 20:25', startTime: '20:05', endTime: '20:25', durationMinutes: 20, program: 'Altar Ministry & Impartation', category: 'intercession', place: 'Youth Hall', assignedTo: '' },
      { id: 'yn7', time: '20:25 to 20:30', startTime: '20:25', endTime: '20:30', durationMinutes: 5, program: 'Closing Benediction & Social', category: 'closing_prayer', place: 'Youth Hall', assignedTo: '' }
    ];
  }

  /**
   * Returns list of all available service timetable templates
   */
  getAvailableTemplates(): TimetableTemplateMeta[] {
    return [
      {
        id: 'sunday',
        name: 'Sunday Worship',
        subtitle: '2 Hours · Standard Sunday Service',
        icon: '🌟',
        defaultStartTime: '09:00',
        defaultEndTime: '11:15',
        defaultTitle: 'Sunday Morning Worship Service',
        serviceType: 'sunday_service',
        getItems: () => this.getStandardSundayServiceSample()
      },
      {
        id: 'all_night',
        name: 'All-Night Prayer',
        subtitle: '5 Hours · Vigil & Deliverance',
        icon: '🌙',
        defaultStartTime: '21:00',
        defaultEndTime: '02:00',
        defaultTitle: 'Monthly All-Night Prayer Vigil',
        serviceType: 'special_event',
        getItems: () => this.getAllNightPrayerSample()
      },
      {
        id: 'midweek',
        name: 'Midweek Study',
        subtitle: '1.5 Hours · Word & Intercession',
        icon: '📖',
        defaultStartTime: '19:00',
        defaultEndTime: '20:45',
        defaultTitle: 'Wednesday Bible Study & Prayer',
        serviceType: 'sunday_service',
        getItems: () => this.getMidweekBibleStudySample()
      },
      {
        id: 'communion',
        name: 'Communion Service',
        subtitle: '2.25 Hours · Bread, Wine & Fasting',
        icon: '🍞',
        defaultStartTime: '10:00',
        defaultEndTime: '12:15',
        defaultTitle: 'Holy Communion & Fasting Service',
        serviceType: 'sunday_service',
        getItems: () => this.getCommunionFastingSample()
      },
      {
        id: 'youth',
        name: 'Youth Night',
        subtitle: '2 Hours · Worship & Testimony',
        icon: '🎸',
        defaultStartTime: '18:00',
        defaultEndTime: '20:30',
        defaultTitle: 'Youth Praise & Worship Night',
        serviceType: 'special_event',
        getItems: () => this.getYouthWorshipNightSample()
      },
      {
        id: 'conference',
        name: 'Revival Conference',
        subtitle: 'Full Day · Multi-Session',
        icon: '🕊️',
        defaultStartTime: '09:00',
        defaultEndTime: '16:00',
        defaultTitle: 'Bethesda Annual Revival Conference',
        serviceType: 'conference',
        getItems: () => this.getBethesdaConferenceSample()
      }
    ];
  }
}

export default new ServiceRosterService();
