export interface SkillCategory {
  id: string;
  name: string;
  iconName: string;
  skills: string[];
}

export const CHURCH_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'worship',
    name: 'Worship & Music',
    iconName: 'Music',
    skills: [
      'Worship Leader',
      'Vocalist / Singer',
      'Acoustic Guitar',
      'Electric Guitar',
      'Bass Guitar',
      'Keyboard / Piano',
      'Drums / Percussion',
      'Choir / Harmonies',
      'Violin / Strings',
      'Flute / Woodwinds'
    ]
  },
  {
    id: 'media',
    name: 'Media & Technology',
    iconName: 'Video',
    skills: [
      'Sound Engineer (FOH)',
      'Stage Audio / Monitors',
      'Live Streaming / Broadcast',
      'Media / Lyrics Projection',
      'Video Camera Operator',
      'Video Director / Mixer',
      'Photographer',
      'Video Editor',
      'Graphic Designer',
      'Social Media Coordinator',
      'Lighting Technician'
    ]
  },
  {
    id: 'ministry',
    name: 'Ministry & Teaching',
    iconName: 'BookOpen',
    skills: [
      'Preacher / Evangelist',
      'Bible Study Teacher',
      'Sunday School Teacher',
      'Youth Ministry Leader',
      'Children Ministry Helper',
      'Intercessory Prayer Leader',
      'Pastoral Care & Counseling',
      'Women’s Fellowship Leader',
      'Men’s Fellowship Leader',
      'Outreach / Visitation Team'
    ]
  },
  {
    id: 'operations',
    name: 'Hospitality & Operations',
    iconName: 'HeartHandshake',
    skills: [
      'Usher / Greeter',
      'Food & Hospitality (FMH)',
      'Communion Preparation',
      'Event Coordinator / Planner',
      'Stage Decoration / Setup',
      'Driver / Transportation',
      'Facilities & Maintenance',
      'Administration / Finance',
      'Medical / First Aid',
      'Security / Parking'
    ]
  }
];

export const ALL_PREDEFINED_SKILLS: string[] = Array.from(
  new Set(CHURCH_SKILL_CATEGORIES.flatMap(cat => cat.skills))
).sort();

export const getMemberSkills = (m: any): string[] => {
  if (!m) return [];
  if (Array.isArray(m.skills) && m.skills.length > 0) {
    return Array.from(new Set(m.skills.map((s: any) => String(s).trim()).filter(Boolean)));
  }
  const fallback = [m.primarySkill, m.secondarySkill]
    .map(s => (s ? String(s).trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(fallback));
};
