import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import type { RiskZone, Coordinates } from '@/types';

// Calculate distance between two points in meters
function haversineDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function RiskZoneWarning() {
  const { currentLocation, riskZones } = useAppStore();
  const [activeWarning, setActiveWarning] = useState<RiskZone | null>(null);
  const [dismissedZones, setDismissedZones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentLocation) return;

    // Check if user is near any risk zone
    for (const zone of riskZones) {
      if (dismissedZones.has(zone.id)) continue;

      const distance = haversineDistance(currentLocation, zone.center);
      
      // Warn if within 1.5x the zone radius (approaching)
      if (distance <= zone.radius * 1.5) {
        // Check active hours if defined
        if (zone.activeHours) {
          const hour = new Date().getHours();
          const { start, end } = zone.activeHours;
          
          // Handle overnight ranges (e.g., 21:00 to 6:00)
          const isActive = start > end 
            ? (hour >= start || hour <= end)
            : (hour >= start && hour <= end);
          
          if (!isActive) continue;
        }

        if (zone.riskLevel === 'high' || zone.riskLevel === 'medium') {
          setActiveWarning(zone);
          
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          break;
        }
      }
    }
  }, [currentLocation, riskZones, dismissedZones]);

  const dismissWarning = () => {
    if (activeWarning) {
      setDismissedZones(prev => new Set([...prev, activeWarning.id]));
    }
    setActiveWarning(null);
  };

  return (
    <AnimatePresence>
      {activeWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 left-4 right-4 z-50 safe-top"
        >
          <div
            className={`
              rounded-2xl p-4 shadow-xl backdrop-blur-lg border-2
              ${activeWarning.riskLevel === 'high' 
                ? 'bg-danger/90 border-danger' 
                : 'bg-caution/90 border-caution'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${activeWarning.riskLevel === 'high' ? 'bg-danger-foreground/20' : 'bg-caution-foreground/20'}
              `}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">
                  {activeWarning.riskLevel === 'high' ? '⚠️ High Risk Area' : '⚡ Caution Area'}
                </h3>
                <p className="text-sm opacity-90">
                  {activeWarning.reason}
                </p>
                
                {activeWarning.activeHours && (
                  <p className="text-xs opacity-75 mt-1">
                    Active: {activeWarning.activeHours.start}:00 - {activeWarning.activeHours.end}:00
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={dismissWarning}
                className="shrink-0 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-white/20 hover:bg-white/30 border-0"
                onClick={dismissWarning}
              >
                <Shield className="w-4 h-4 mr-1" />
                I'm aware
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
