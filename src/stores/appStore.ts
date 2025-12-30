import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Coordinates, 
  TrustedContact, 
  Route, 
  RiskZone, 
  IncidentReport,
  SOSEvent 
} from '@/types';

interface AppState {
  // User location
  currentLocation: Coordinates | null;
  setCurrentLocation: (location: Coordinates | null) => void;
  
  // Destination
  destination: Coordinates | null;
  destinationName: string | null;
  setDestination: (coords: Coordinates | null, name?: string) => void;
  
  // Routes
  routes: Route[];
  selectedRoute: Route | null;
  setRoutes: (routes: Route[]) => void;
  setSelectedRoute: (route: Route | null) => void;
  
  // Risk zones
  riskZones: RiskZone[];
  setRiskZones: (zones: RiskZone[]) => void;
  addRiskZone: (zone: RiskZone) => void;
  
  // Incidents
  incidents: IncidentReport[];
  addIncident: (incident: IncidentReport) => void;
  
  // SOS
  sosActive: boolean;
  activeSOS: SOSEvent | null;
  triggerSOS: () => void;
  cancelSOS: () => void;
  
  // User profile
  userName: string;
  userPhone: string;
  trustedContacts: TrustedContact[];
  sosMessage: string;
  preferredMessagingApp: 'whatsapp' | 'sms' | 'telegram';
  autoCallOnSOS: boolean;
  
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  addTrustedContact: (contact: TrustedContact) => void;
  removeTrustedContact: (id: string) => void;
  updateTrustedContact: (id: string, updates: Partial<TrustedContact>) => void;
  setSosMessage: (message: string) => void;
  setPreferredMessagingApp: (app: 'whatsapp' | 'sms' | 'telegram') => void;
  setAutoCallOnSOS: (enabled: boolean) => void;
  
  // Navigation state
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
}

// Mock risk zones data
const mockRiskZones: RiskZone[] = [
  {
    id: '1',
    center: { lat: 40.7580, lng: -73.9855 },
    radius: 150,
    riskLevel: 'high',
    reason: 'Multiple harassment reports after 9 PM',
    reportedAt: new Date().toISOString(),
    activeHours: { start: 21, end: 6 },
  },
  {
    id: '2',
    center: { lat: 40.7550, lng: -73.9900 },
    radius: 100,
    riskLevel: 'medium',
    reason: 'Poor street lighting reported',
    reportedAt: new Date().toISOString(),
  },
  {
    id: '3',
    center: { lat: 40.7610, lng: -73.9820 },
    radius: 80,
    riskLevel: 'medium',
    reason: 'Isolated underpass - low foot traffic',
    reportedAt: new Date().toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Location
      currentLocation: null,
      setCurrentLocation: (location) => set({ currentLocation: location }),
      
      // Destination
      destination: null,
      destinationName: null,
      setDestination: (coords, name) => set({ destination: coords, destinationName: name || null }),
      
      // Routes
      routes: [],
      selectedRoute: null,
      setRoutes: (routes) => set({ routes }),
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      
      // Risk zones
      riskZones: mockRiskZones,
      setRiskZones: (zones) => set({ riskZones: zones }),
      addRiskZone: (zone) => set((state) => ({ riskZones: [...state.riskZones, zone] })),
      
      // Incidents
      incidents: [],
      addIncident: (incident) => set((state) => ({ incidents: [...state.incidents, incident] })),
      
      // SOS
      sosActive: false,
      activeSOS: null,
      triggerSOS: () => {
        const location = get().currentLocation;
        const sosEvent: SOSEvent = {
          id: crypto.randomUUID(),
          userId: 'current-user',
          location: location || { lat: 0, lng: 0 },
          startedAt: new Date().toISOString(),
          status: 'active',
          contactsNotified: get().trustedContacts.filter(c => c.notifyOnSOS).map(c => c.id),
        };
        set({ sosActive: true, activeSOS: sosEvent });
      },
      cancelSOS: () => set({ sosActive: false, activeSOS: null }),
      
      // User profile with defaults
      userName: '',
      userPhone: '',
      trustedContacts: [],
      sosMessage: '🚨 EMERGENCY ALERT\nI need help immediately.\nPlease call me or send help to my location.',
      preferredMessagingApp: 'whatsapp',
      autoCallOnSOS: true,
      
      setUserName: (name) => set({ userName: name }),
      setUserPhone: (phone) => set({ userPhone: phone }),
      addTrustedContact: (contact) => set((state) => ({ 
        trustedContacts: [...state.trustedContacts, contact] 
      })),
      removeTrustedContact: (id) => set((state) => ({ 
        trustedContacts: state.trustedContacts.filter(c => c.id !== id) 
      })),
      updateTrustedContact: (id, updates) => set((state) => ({
        trustedContacts: state.trustedContacts.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      setSosMessage: (message) => set({ sosMessage: message }),
      setPreferredMessagingApp: (app) => set({ preferredMessagingApp: app }),
      setAutoCallOnSOS: (enabled) => set({ autoCallOnSOS: enabled }),
      
      // Navigation
      isNavigating: false,
      setIsNavigating: (navigating) => set({ isNavigating: navigating }),
    }),
    {
      name: 'saferoute-storage',
      partialize: (state) => ({
        userName: state.userName,
        userPhone: state.userPhone,
        trustedContacts: state.trustedContacts,
        sosMessage: state.sosMessage,
        preferredMessagingApp: state.preferredMessagingApp,
        autoCallOnSOS: state.autoCallOnSOS,
        incidents: state.incidents,
      }),
    }
  )
);
