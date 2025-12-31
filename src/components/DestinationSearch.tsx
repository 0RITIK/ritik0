import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGeocode } from '@/hooks/useGeocode';
import { useAppStore } from '@/stores/appStore';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';

export function DestinationSearch() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { searchPlaces, results, isSearching, clearResults } = useGeocode();
  const { calculateRoutes } = useRouteCalculation();
  const {
    currentLocation,
    destination,
    destinationName,
    setDestination,
    setRoutes,
    setSelectedRoute,
    riskZones,
  } = useAppStore();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      searchPlaces(debouncedQuery, currentLocation || undefined);
    }
  }, [debouncedQuery, currentLocation, searchPlaces]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelectDestination = useCallback(
    (name: string, coords: { lat: number; lng: number }) => {
      setDestination(coords, name);
      setQuery(name);
      setShowResults(false);
      clearResults();

      if (currentLocation) {
        const routes = calculateRoutes({
          origin: currentLocation,
          destination: coords,
          riskZones,
        });
        setRoutes(routes);
        setSelectedRoute(routes[0]);
      }
    },
    [currentLocation, riskZones, calculateRoutes, setDestination, setRoutes, setSelectedRoute, clearResults]
  );

  const clearDestination = () => {
    setDestination(null);
    setQuery('');
    setRoutes([]);
    setSelectedRoute(null);
    clearResults();
    setShowResults(false);
  };

  return (
    <div className="w-full search-container">
      <div className="relative">
        {/* Search Box - Solid Background */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-visible">
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Where do you want to go?"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length >= 3) {
                    setShowResults(true);
                  }
                }}
                onFocus={() => {
                  if (query.length >= 3 || results.length > 0) {
                    setShowResults(true);
                  }
                }}
                className="pl-10 bg-transparent border-0 focus-visible:ring-0 text-base h-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {(destination || query) && (
              <Button variant="ghost" size="icon-sm" onClick={clearDestination}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown - Absolutely positioned with solid bg */}
        <AnimatePresence>
          {showResults && results.length > 0 && !destination && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-[100] bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={`${result.coords.lat}-${result.coords.lng}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDestination(result.name, result.coords);
                    }}
                    className="w-full flex items-start gap-3 p-4 hover:bg-accent transition-colors text-left border-b border-border/50 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{result.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Suggestions */}
        {!destination && !showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {['Hospital', 'Police Station', 'Bus Station', 'Metro'].map((place) => (
              <Button
                key={place}
                variant="secondary"
                size="sm"
                className="shrink-0 bg-secondary hover:bg-secondary/80"
                onClick={() => {
                  setQuery(place);
                  searchPlaces(place, currentLocation || undefined);
                  setShowResults(true);
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {place}
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
