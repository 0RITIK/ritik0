export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SafetyScore {
  overall: number;
  lighting: number;
  crowdDensity: number;
  crimeHistory: number;
  isolation: number;
  timeOfDay: number;
}

export interface Route {
  id: string;
  name: string;
  type: 'safest' | 'balanced' | 'fastest';
  safetyScore: number;
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: Coordinates[];
  warnings: string[];
}

export interface RiskZone {
  id: string;
  center: Coordinates;
  radius: number; // in meters
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  reportedAt: string;
  activeHours?: { start: number; end: number }; // 24h format
}

export interface IncidentReport {
  id: string;
  type: 'dark_alley' | 'broken_light' | 'isolated_area' | 'harassment' | 'other';
  location: Coordinates;
  description?: string;
  photoUrl?: string;
  reportedBy: string;
  reportedAt: string;
  verified: boolean;
  upvotes: number;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnSOS: boolean;
  isPrimary: boolean;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  trustedContacts: TrustedContact[];
  sosMessage: string;
  preferredMessagingApp: 'whatsapp' | 'sms' | 'telegram';
  autoCallOnSOS: boolean;
  campusSecurity?: string;
}

export interface SOSEvent {
  id: string;
  userId: string;
  location: Coordinates;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'resolved' | 'cancelled';
  contactsNotified: string[];
}

export type IncidentType = IncidentReport['type'];

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  dark_alley: 'Dark Alley',
  broken_light: 'Broken Streetlight',
  isolated_area: 'Isolated Area',
  harassment: 'Harassment Incident',
  other: 'Other Concern',
};

export const INCIDENT_ICONS: Record<IncidentType, string> = {
  dark_alley: '🌑',
  broken_light: '💡',
  isolated_area: '🏚️',
  harassment: '⚠️',
  other: '📍',
};
