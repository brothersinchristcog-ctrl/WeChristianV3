export interface QuizCategoryInfo {
  id: string;
  name: string;
  group: 'Relationships & Life' | 'Spiritual & Emotional';
  imageUrl: string;
  teluguName?: string;
  totalLevels: number; // default 30
}

export const QUIZ_CATEGORIES: QuizCategoryInfo[] = [
  // Relationships & Life
  {
    id: 'Family',
    name: 'Family',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
    teluguName: 'కుటుంబం',
    totalLevels: 30,
  },
  {
    id: 'Friends',
    name: 'Friends',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
    teluguName: 'స్నేహితులు',
    totalLevels: 30,
  },
  {
    id: 'Mother',
    name: 'Mother',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80',
    teluguName: 'తల్లి',
    totalLevels: 30,
  },
  {
    id: 'Father',
    name: 'Father',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800&auto=format&fit=crop&q=80',
    teluguName: 'తండ్రి',
    totalLevels: 30,
  },
  {
    id: 'Love',
    name: 'Love',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
    teluguName: 'ప్రేమ (Agape)',
    totalLevels: 30,
  },
  {
    id: 'Care',
    name: 'Care',
    group: 'Relationships & Life',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    teluguName: 'ఆదరణ / శ్రద్ధ',
    totalLevels: 30,
  },

  // Spiritual & Emotional
  {
    id: 'Hope',
    name: 'Hope',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&auto=format&fit=crop&q=80',
    teluguName: 'నిరీక్షణ',
    totalLevels: 30,
  },
  {
    id: 'Failure',
    name: 'Failure',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    teluguName: 'పునరుద్ధరణ / ఓటమి',
    totalLevels: 30,
  },
  {
    id: 'Fear',
    name: 'Fear',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80',
    teluguName: 'భయం లేని విశ్వాసం',
    totalLevels: 30,
  },
  {
    id: 'Peace',
    name: 'Peace',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    teluguName: 'సమాధానం / శాంతి',
    totalLevels: 30,
  },
  {
    id: 'Life',
    name: 'Life',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    teluguName: 'నిత్యజీవం',
    totalLevels: 30,
  },
  {
    id: 'Wisdom',
    name: 'Wisdom',
    group: 'Spiritual & Emotional',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
    teluguName: 'దైవ జ్ఞానం',
    totalLevels: 30,
  },
];
