import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SafetyMap } from '@/components/SafetyMap';
import { RouteSelector } from '@/components/RouteSelector';
import { RiskZoneLegend } from '@/components/RiskZoneLegend';
import { RiskZoneWarning } from '@/components/RiskZoneWarning';
import { DestinationSearch } from '@/components/DestinationSearch';
import { ActiveNavigation } from '@/components/ActiveNavigation';
import { useAppStore } from '@/stores/appStore';

export default function HomePage() {
  const isNavigating = useAppStore(state => state.isNavigating);

  return (
    <>
      <Helmet>
        <title>SafeRoute - Navigate Safely</title>
        <meta name="description" content="Find the safest walking route with real-time risk awareness and emergency SOS features." />
      </Helmet>
      
      <div className="relative h-screen h-[100dvh] overflow-hidden">
        {/* Map Layer - z-0 */}
        <SafetyMap className="absolute inset-0 z-0" />
        
        {/* UI Layers with proper z-index hierarchy */}
        
        {/* Legend - z-30 */}
        <RiskZoneLegend />
        
        {/* Active navigation overlay - z-50 (highest for navigation UI) */}
        {isNavigating && <ActiveNavigation />}
        
        {/* Search bar - z-40 (hidden during navigation) */}
        {!isNavigating && (
          <div className="absolute top-0 left-0 right-0 z-40 p-4 safe-top">
            <DestinationSearch />
          </div>
        )}
        
        {/* Route options - z-40 (hidden during navigation) */}
        {!isNavigating && <RouteSelector />}
        
        {/* Risk warnings - z-60 (handled in component, highest priority) */}
        <RiskZoneWarning />
      </div>
    </>
  );
}
