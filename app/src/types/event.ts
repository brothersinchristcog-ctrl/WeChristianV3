// types/event.ts
export type EventType = 'worship' | 'prayer' | 'meeting' | 'outreach' | 'funeral';
export type TransportMode = 'car' | 'bike' | 'bus';

export interface PastorEvent {
  id:           string;
  title:        string;
  type:         EventType;
  date:         string;          // ISO 8601, e.g. "2026-06-08"
  startTime:    string;          // "09:00"
  endTime?:     string;
  durationMins: number;
  venue:        string;
  city?:        string;
  address:      string;
  lat:          number;
  lng:          number;
  contactName:  string;
  contactPhone?: string;
  description:  string;
  notes:        string;
  section:      'today' | 'upcoming' | 'past';
  travel: {
    distKm:  number;
    car:     number;             // minutes
    bike:    number;
    bus:     number;
    isHomeToEvent?: boolean;
    originLat?: number;
    originLng?: number;
    originName?: string;
    homeDistKm?: number;
    homeCar?: number;
    homeLat?: number;
    homeLng?: number;
    homeName?: string;
  };
}
