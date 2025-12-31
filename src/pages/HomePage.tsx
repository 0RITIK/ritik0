import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SafetyMap } from '@/components/SafetyMap';
import { RouteSelector } from '@/components/RouteSelector';
import { RiskZoneLegend } from '@/components/RiskZoneLegend';
import { RiskZoneWarning } from '@/components/RiskZoneWarning';
import { DestinationSearch } from '@/components/DestinationSearch';

export default function HomePage() {
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
        
        {/* Search bar - z-40 */}
        <div className="absolute top-0 left-0 right-0 z-40 p-4 safe-top">
          <DestinationSearch />
        </div>
        
        {/* Route options - z-40 (handled in component) */}
        <RouteSelector />
        
        {/* Risk warnings - z-60 (handled in component, highest priority) */}
        <RiskZoneWarning />
      </div>
    </>
  );
}
