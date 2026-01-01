import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Navigation, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { useVoiceGuidance } from '@/hooks/useVoiceGuidance';
import { cn } from '@/lib/utils';

export function ActiveNavigation() {
  const {
    isNavigating,
    setIsNavigating,
    selectedRoute,
    currentLocation,
    destinationName,
    setDestination,
    setRoutes,
    setSelectedRoute,
  } = useAppStore();

  const {
    isEnabled,
    isSpeaking,
    currentInstruction,
    startNavigation,
    stopNavigation,
    updateForPosition,
    toggleVoice,
    getRemainingDistance,
  } = useVoiceGuidance();

  // Start voice navigation when navigation begins
  useEffect(() => {
    if (isNavigating && selectedRoute) {
      startNavigation(selectedRoute.coordinates);
    }
    
    return () => {
      if (!isNavigating) {
        stopNavigation();
      }
    };
  }, [isNavigating, selectedRoute, startNavigation, stopNavigation]);

  // Update instructions based on position
  useEffect(() => {
    if (isNavigating && currentLocation && selectedRoute) {
      updateForPosition(currentLocation, selectedRoute.coordinates);
    }
  }, [currentLocation, isNavigating, selectedRoute, updateForPosition]);

  const handleEndNavigation = () => {
    stopNavigation();
    setIsNavigating(false);
    setDestination(null);
    setRoutes([]);
    setSelectedRoute(null);
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins} min`;
  };

  if (!isNavigating || !selectedRoute) return null;

  const remainingDistance = currentLocation 
    ? getRemainingDistance(currentLocation, selectedRoute.coordinates)
    : selectedRoute.distance;

  // Estimate remaining time based on walking speed (~5km/h = 1.4m/s)
  const remainingTime = remainingDistance / 1.4;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50 safe-top"
    >
      {/* Main instruction card */}
      <div className="bg-primary text-primary-foreground m-4 rounded-2xl shadow-xl overflow-hidden">
        {/* Current instruction */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              isSpeaking ? "bg-primary-foreground/20 animate-pulse" : "bg-primary-foreground/10"
            )}>
              <Navigation className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold leading-tight">
                {currentInstruction?.text || 'Follow the route'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary-foreground/10 border-t border-primary-foreground/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 opacity-70" />
              <span className="font-medium">{formatDistance(remainingDistance)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 opacity-70" />
              <span className="font-medium">{formatDuration(remainingTime)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={toggleVoice}
            >
              {isEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleEndNavigation}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Destination info */}
      <div className="mx-4 -mt-2">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground">Navigating to</p>
          <p className="text-sm font-medium truncate text-foreground">
            {destinationName || 'Selected destination'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
