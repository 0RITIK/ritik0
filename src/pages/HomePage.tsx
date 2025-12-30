import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SafetyMap } from '@/components/SafetyMap';
import { RouteSelector } from '@/components/RouteSelector';
import { RiskZoneLegend } from '@/components/RiskZoneLegend';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>SafeRoute - Navigate Safely</title>
        <meta name="description" content="Find the safest walking route with real-time risk awareness and emergency SOS features." />
      </Helmet>
      
      <div className="relative h-screen h-[100dvh]">
        <SafetyMap className="absolute inset-0" />
        <RouteSelector />
        <RiskZoneLegend />
      </div>
    </>
  );
}
