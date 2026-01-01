import { useState, useCallback, useEffect, useRef } from 'react';
import type { Coordinates } from '@/types';

interface NavigationInstruction {
  id: string;
  text: string;
  distance: number; // meters until this instruction
  coords: Coordinates;
  announced: boolean;
}

// Calculate bearing between two points
function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

// Get turn direction from bearing change
function getTurnDirection(prevBearing: number, newBearing: number): string {
  let diff = newBearing - prevBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 20) return 'continue straight';
  if (diff > 0 && diff < 60) return 'bear right';
  if (diff >= 60 && diff < 120) return 'turn right';
  if (diff >= 120) return 'make a sharp right';
  if (diff < 0 && diff > -60) return 'bear left';
  if (diff <= -60 && diff > -120) return 'turn left';
  return 'make a sharp left';
}

// Haversine distance in meters
function getDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useVoiceGuidance() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  const [instructions, setInstructions] = useState<NavigationInstruction[]>([]);
  const announcedSet = useRef<Set<string>>(new Set());

  // Initialize speech synthesis
  const speak = useCallback((text: string) => {
    if (!isEnabled || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to get a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  // Generate instructions from route coordinates
  const generateInstructions = useCallback((waypoints: Coordinates[]): NavigationInstruction[] => {
    if (waypoints.length < 2) return [];

    const newInstructions: NavigationInstruction[] = [];
    let prevBearing = calculateBearing(waypoints[0], waypoints[1]);

    // Start instruction
    newInstructions.push({
      id: 'start',
      text: 'Starting navigation. Head forward.',
      distance: 0,
      coords: waypoints[0],
      announced: false,
    });

    // Turn instructions at each waypoint
    for (let i = 1; i < waypoints.length - 1; i++) {
      const newBearing = calculateBearing(waypoints[i], waypoints[i + 1]);
      const turnDirection = getTurnDirection(prevBearing, newBearing);
      const distanceToNext = getDistance(waypoints[i], waypoints[i + 1]);

      if (turnDirection !== 'continue straight') {
        const distanceText = distanceToNext >= 1000 
          ? `${(distanceToNext / 1000).toFixed(1)} kilometers` 
          : `${Math.round(distanceToNext)} meters`;

        newInstructions.push({
          id: `turn-${i}`,
          text: `${turnDirection.charAt(0).toUpperCase() + turnDirection.slice(1)}, then continue for ${distanceText}.`,
          distance: getDistance(waypoints[0], waypoints[i]),
          coords: waypoints[i],
          announced: false,
        });
      }

      prevBearing = newBearing;
    }

    // Destination instruction
    newInstructions.push({
      id: 'destination',
      text: 'You have arrived at your destination.',
      distance: 0,
      coords: waypoints[waypoints.length - 1],
      announced: false,
    });

    return newInstructions;
  }, []);

  // Update based on current position
  const updateForPosition = useCallback((currentPos: Coordinates, waypoints: Coordinates[]) => {
    if (instructions.length === 0 || !currentPos) return;

    // Find nearest upcoming instruction
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let i = 0; i < instructions.length; i++) {
      const dist = getDistance(currentPos, instructions[i].coords);
      
      // Find the next unannounced instruction within 50m
      if (dist < nearestDistance && !announcedSet.current.has(instructions[i].id)) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex >= 0) {
      const instruction = instructions[nearestIndex];
      setCurrentInstruction(instruction);

      // Announce when within 30 meters
      if (nearestDistance < 30 && !announcedSet.current.has(instruction.id)) {
        announcedSet.current.add(instruction.id);
        speak(instruction.text);
        setInstructions(prev => 
          prev.map((inst, i) => i === nearestIndex ? { ...inst, announced: true } : inst)
        );
      }
    }

    // Check if arrived at destination
    if (waypoints.length > 0) {
      const destDist = getDistance(currentPos, waypoints[waypoints.length - 1]);
      if (destDist < 20 && !announcedSet.current.has('destination')) {
        announcedSet.current.add('destination');
        speak('You have arrived at your destination.');
      }
    }
  }, [instructions, speak]);

  // Start navigation with route
  const startNavigation = useCallback((waypoints: Coordinates[]) => {
    announcedSet.current.clear();
    const newInstructions = generateInstructions(waypoints);
    setInstructions(newInstructions);
    
    if (newInstructions.length > 0) {
      setCurrentInstruction(newInstructions[0]);
      // Announce start after a short delay
      setTimeout(() => speak(newInstructions[0].text), 500);
      announcedSet.current.add(newInstructions[0].id);
    }
  }, [generateInstructions, speak]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    window.speechSynthesis.cancel();
    setInstructions([]);
    setCurrentInstruction(null);
    announcedSet.current.clear();
  }, []);

  // Toggle voice
  const toggleVoice = useCallback(() => {
    setIsEnabled(prev => !prev);
    if (isEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [isEnabled]);

  // Calculate remaining distance to destination
  const getRemainingDistance = useCallback((currentPos: Coordinates, waypoints: Coordinates[]): number => {
    if (!currentPos || waypoints.length === 0) return 0;
    return getDistance(currentPos, waypoints[waypoints.length - 1]);
  }, []);

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Voices may load async
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return {
    isEnabled,
    isSpeaking,
    currentInstruction,
    instructions,
    speak,
    startNavigation,
    stopNavigation,
    updateForPosition,
    toggleVoice,
    getRemainingDistance,
  };
}
