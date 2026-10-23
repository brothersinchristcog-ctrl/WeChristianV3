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

export interface RunSheetItem {
  id: string;
  time: string;           // e.g. "08:30 to 08:35"
  durationMinutes: number;// e.g. 5
  program: string;        // e.g. "Opening Prayer"
  assignedTo: string;     // e.g. "Jasper"
  place?: string;         // e.g. "Main Hall", "1F Church"
  notes?: string;
}

export interface ServicePlan {
  id: string;
  churchId: string;
  churchName?: string;
  date: string;               // YYYY-MM-DD e.g. "2026-09-27"
  serviceTitle: string;       // e.g. "1st Service - Telugu", "2nd Service - Bilingual"
  serviceType: 'sunday_service' | 'special_event' | 'conference';
  status: 'draft' | 'published';
  
  // Dynamic role assignments: map of roleId -> assigned member name(s)
  assignments: Record<string, string>;
  
  // Sunday School specific classes if used
  sundaySchoolClasses?: {
    className: string;
    teacher: string;
    lesson: string;
  }[];

  // Sermon details
  sermon: {
    title: string;
    code: string;
    keyVerses: string;
    speaker: string;
    translation?: string;
  };

  // Setlist flow
  setlist: SetlistItem[];

  // Order of Service / Run-sheet
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
      { id: 'singer_1', name: 'Singer #1 / Center', placeholder: 'e.g. Richard' },
      { id: 'singer_2', name: 'Singer #2 / Left', placeholder: 'e.g. Amulya' },
      { id: 'singer_3', name: 'Singer #3 / Right', placeholder: 'e.g. Dheeraj Paul' },
      { id: 'acoustic', name: 'Acoustic Guitar', placeholder: 'e.g. Richard' },
      { id: 'keyboard', name: 'Keyboard', placeholder: 'e.g. Lina' },
      { id: 'electric', name: 'Electric Guitar', placeholder: 'e.g. Samuel N' },
      { id: 'bass', name: 'Bass Guitar', placeholder: 'e.g. John Paul' },
      { id: 'drums', name: 'Drums', placeholder: 'e.g. Shekar P' },
    ]
  },
  {
    id: 'bmw',
    name: 'Team BMW (Sound, Media & AV)',
    color: '#3D5A27', // Olive / Forest Green
    badgeBg: '#EAFAF1',
    roles: [
      { id: 'sound_foh', name: 'Sounds (FOH)', placeholder: 'e.g. Akhil / Nikhil' },
      { id: 'sound_stage', name: 'Sounds (Stage)', placeholder: 'e.g. Stephen / Oliver' },
      { id: 'media_pc1', name: 'Media - PC1 (Live)', placeholder: 'e.g. Usha Rani' },
      { id: 'media_pc2', name: 'Media - PC2 (CG)', placeholder: 'e.g. Bhargavi' },
      { id: 'media_pc3', name: 'Media - PC3 (Lyrics)', placeholder: 'e.g. Akshaya' },
      { id: 'media_pc4', name: 'Media - PC4 (Stage)', placeholder: 'e.g. Priya / Shreyesh' },
      { id: 'cam_main', name: 'V. Camera (Main)', placeholder: 'e.g. Sandhya' },
      { id: 'cam_right', name: 'V. Camera (Right)', placeholder: 'e.g. Benny' },
      { id: 'cam_left', name: 'V. Camera (Left)', placeholder: 'e.g. Zion' },
      { id: 'cam_gimbal', name: 'V. Camera (Gimbal)', placeholder: 'e.g. N/A' },
      { id: 'video_dir', name: 'Video Direction / Mix', placeholder: 'e.g. Avinash' },
      { id: 'photo_cam', name: 'Photo Camera', placeholder: 'e.g. SS Paul' },
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
      { id: 'ss_special_needs', name: 'Special Needs Crew', placeholder: 'e.g. Lina, Anvitha, Naysa...' },
    ]
  },
  {
    id: 'others',
    name: 'Hospitality & Platform Ministers',
    color: '#117864', // Deep Teal
    badgeBg: '#E8F8F5',
    roles: [
      { id: 'fmh', name: 'FMH (Food / Hospitality)', placeholder: 'e.g. Kranthi, Siddhath, Pooja...' },
      { id: 'ushering', name: 'Ushering Team', placeholder: 'e.g. Lakshmi, Jyothi, Ravi K...' },
      { id: 'op_prayer', name: 'Opening Prayer', placeholder: 'e.g. Ps. Raju' },
      { id: 'cl_prayer', name: 'Closing Prayer', placeholder: 'e.g. Pas. John Paul' },
      { id: 'devotion', name: 'Devotion', placeholder: 'e.g. Richard' },
      { id: 'communion', name: 'Communion', placeholder: 'e.g. N/A' },
      { id: 'announcements', name: 'Announcements', placeholder: 'e.g. Richard' },
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

      return snap.docs.map(doc => ({
        id: doc.id,
        churchId,
        ...(doc.data() as any)
      })) as ServicePlan[];
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
}

export default new ServiceRosterService();
