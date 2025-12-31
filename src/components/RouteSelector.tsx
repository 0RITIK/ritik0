import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, Shield, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import type { Route } from '@/types';

export function RouteSelector() {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    destination,
    destinationName,
    routes,
    selectedRoute,
    setSelectedRoute,
    setIsNavigating,
    setDestination,
    setRoutes,
  } = useAppStore();

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

  const getRouteBadgeColor = (type: Route['type']) => {
    if (type === 'safest') return 'bg-safe text-safe-foreground';
    if (type === 'balanced') return 'bg-caution text-caution-foreground';
    return 'bg-danger text-danger-foreground';
  };

  if (!destination || routes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-24 left-4 right-4 z-30"
    >
      <div className="glass rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Navigating to</p>
            <p className="font-semibold truncate">{destinationName || 'Selected Location'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={clearDestination}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Route Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all tap-highlight text-left',
                      getRouteColor(route.type),
                      selectedRoute?.id === route.id
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getRouteBadgeColor(route.type))}>
                          {route.type === 'safest' ? '🛡️ Safest' : route.type === 'balanced' ? '⚖️ Balanced' : '⚡ Fastest'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className={cn('w-4 h-4', getScoreColor(route.safetyScore))} />
                        <span className={cn('text-xl font-bold', getScoreColor(route.safetyScore))}>
                          {route.safetyScore}
                        </span>
                      </div>
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
                            ⚠️ {warning}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 pt-0">
                <Button
                  variant="safe"
                  size="lg"
                  className="w-full"
                  onClick={startNavigation}
                  disabled={!selectedRoute}
                >
                  <Navigation className="w-5 h-5" />
                  Start Navigation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed summary */}
        {!isExpanded && selectedRoute && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getRouteBadgeColor(selectedRoute.type))}>
                {selectedRoute.type === 'safest' ? '🛡️' : selectedRoute.type === 'balanced' ? '⚖️' : '⚡'}
              </span>
              <span className="text-sm">
                {formatDuration(selectedRoute.duration)} • {formatDistance(selectedRoute.distance)}
              </span>
            </div>
            <Button variant="safe" size="sm" onClick={startNavigation}>
              <Navigation className="w-4 h-4" />
              Go
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
