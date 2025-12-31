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
      
      <div className="relative h-screen h-[100dvh]">
        <SafetyMap className="absolute inset-0" />
        
        {/* Top search bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 safe-top">
          <DestinationSearch />
        </div>
        
        {/* Risk zone warnings */}
        <RiskZoneWarning />
        
        {/* Route options */}
        <RouteSelector />
        
        {/* Legend */}
        <RiskZoneLegend />
      </div>
    </>
  );
}
