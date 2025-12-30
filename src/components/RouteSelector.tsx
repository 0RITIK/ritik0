import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation, Clock, Shield, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import type { Route } from '@/types';

// Mock destinations for demo
const mockDestinations = [
  { name: 'Library', coords: { lat: 40.7580, lng: -73.9855 } },
  { name: 'Student Center', coords: { lat: 40.7550, lng: -73.9900 } },
  { name: 'Dormitory A', coords: { lat: 40.7610, lng: -73.9820 } },
  { name: 'Parking Lot B', coords: { lat: 40.7530, lng: -73.9880 } },
];

// Mock routes generator
function generateMockRoutes(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Route[] {
  const baseDist = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)) * 111000;
  
  return [
    {
      id: 'safest',
      name: 'Safest Route',
      type: 'safest',
      safetyScore: 92,
      distance: baseDist * 1.3,
      duration: (baseDist * 1.3) / 1.2,
      coordinates: [from, { lat: (from.lat + to.lat) / 2 + 0.002, lng: (from.lng + to.lng) / 2 }, to],
      warnings: [],
    },
    {
      id: 'balanced',
      name: 'Balanced Route',
      type: 'balanced',
      safetyScore: 76,
      distance: baseDist * 1.1,
      duration: (baseDist * 1.1) / 1.2,
      coordinates: [from, { lat: (from.lat + to.lat) / 2 + 0.001, lng: (from.lng + to.lng) / 2 - 0.001 }, to],
      warnings: ['Low lighting after 9 PM'],
    },
    {
      id: 'fastest',
      name: 'Fastest Route',
      type: 'fastest',
      safetyScore: 58,
      distance: baseDist,
      duration: baseDist / 1.2,
      coordinates: [from, to],
      warnings: ['Passes through isolated area', 'Poor street lighting'],
    },
  ];
}

export function RouteSelector() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  
  const { 
    currentLocation, 
    destination, 
    destinationName,
    setDestination, 
    routes, 
    setRoutes, 
    selectedRoute, 
    setSelectedRoute,
    setIsNavigating,
  } = useAppStore();

  const handleDestinationSelect = (dest: typeof mockDestinations[0]) => {
    setDestination(dest.coords, dest.name);
    setSearchQuery(dest.name);
    setShowSearch(false);
    
    if (currentLocation) {
      const newRoutes = generateMockRoutes(currentLocation, dest.coords);
      setRoutes(newRoutes);
      setSelectedRoute(newRoutes[0]); // Default to safest
      setShowRoutes(true);
    }
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const startNavigation = () => {
    setIsNavigating(true);
  };

  const clearDestination = () => {
    setDestination(null);
    setRoutes([]);
    setSelectedRoute(null);
    setShowRoutes(false);
    setSearchQuery('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-safe';
    if (score >= 60) return 'text-caution';
    return 'text-danger';
  };

  const getRouteColor = (type: Route['type']) => {
    if (type === 'safest') return 'border-safe bg-safe/10';
    if (type === 'balanced') return 'border-caution bg-caution/10';
    return 'border-danger bg-danger/10';
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-4 safe-top">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="pl-10 bg-transparent border-0 focus-visible:ring-0 text-base"
            />
          </div>
          {destination && (
            <Button variant="ghost" size="icon-sm" onClick={clearDestination}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {showSearch && !destination && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 overflow-hidden"
            >
              <div className="p-2 max-h-60 overflow-y-auto">
                {mockDestinations
                  .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((dest) => (
                    <button
                      key={dest.name}
                      onClick={() => handleDestinationSelect(dest)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors tap-highlight"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{dest.name}</p>
                        <p className="text-sm text-muted-foreground">Campus location</p>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Route Options */}
      <AnimatePresence>
        {showRoutes && routes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 glass rounded-2xl shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Choose Your Route</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowRoutes(false)}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all tap-highlight text-left",
                    getRouteColor(route.type),
                    selectedRoute?.id === route.id ? "ring-2 ring-primary" : "opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className={cn("w-5 h-5", getScoreColor(route.safetyScore))} />
                      <span className="font-semibold">{route.name}</span>
                    </div>
                    <span className={cn("text-2xl font-bold", getScoreColor(route.safetyScore))}>
                      {route.safetyScore}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(route.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {formatDistance(route.distance)}
                    </span>
                  </div>

                  {route.warnings.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {route.warnings.map((warning, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-caution/20 text-caution"
                        >
                          {warning}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="safe"
              size="lg"
              className="w-full mt-4"
              onClick={startNavigation}
              disabled={!selectedRoute}
            >
              <Navigation className="w-5 h-5" />
              Start Navigation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
