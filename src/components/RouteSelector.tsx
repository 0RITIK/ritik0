import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, Shield, ChevronUp, ChevronDown, X, AlertTriangle } from 'lucide-react';
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

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-safe/20';
    if (score >= 60) return 'bg-caution/20';
    return 'bg-danger/20';
  };

  const getRouteBorder = (type: Route['type'], isSelected: boolean) => {
    const base = type === 'safest' 
      ? 'border-safe' 
      : type === 'balanced' 
        ? 'border-caution' 
        : 'border-danger';
    return isSelected ? `${base} border-2` : 'border-border border';
  };

  if (!destination || routes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-24 left-4 right-4 z-40"
    >
      {/* Solid background card */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-secondary/50 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Navigating to</p>
            <p className="font-semibold truncate text-foreground">{destinationName || 'Selected Location'}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={clearDestination}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Route Options - Expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route)}
                    className={cn(
                      'w-full p-4 rounded-xl transition-all text-left bg-secondary/30',
                      getRouteBorder(route.type, selectedRoute?.id === route.id),
                      selectedRoute?.id === route.id && 'ring-1 ring-primary/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-semibold',
                          route.type === 'safest' ? 'bg-safe/20 text-safe' :
                          route.type === 'balanced' ? 'bg-caution/20 text-caution' :
                          'bg-danger/20 text-danger'
                        )}>
                          {route.type === 'safest' ? '🛡️ SAFEST' : 
                           route.type === 'balanced' ? '⚖️ BALANCED' : 
                           '⚡ FASTEST'}
                        </span>
                      </div>
                      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg', getScoreBg(route.safetyScore))}>
                        <Shield className={cn('w-4 h-4', getScoreColor(route.safetyScore))} />
                        <span className={cn('text-lg font-bold', getScoreColor(route.safetyScore))}>
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
                      <div className="mt-3 space-y-1">
                        {route.warnings.slice(0, 2).map((warning, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-caution bg-caution/10 px-2 py-1 rounded"
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{warning}</span>
                          </div>
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
                  className="w-full font-semibold"
                  onClick={startNavigation}
                  disabled={!selectedRoute}
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Start Navigation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Summary */}
        {!isExpanded && selectedRoute && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-xs px-2 py-1 rounded-full font-semibold',
                selectedRoute.type === 'safest' ? 'bg-safe/20 text-safe' :
                selectedRoute.type === 'balanced' ? 'bg-caution/20 text-caution' :
                'bg-danger/20 text-danger'
              )}>
                {selectedRoute.type === 'safest' ? '🛡️' : selectedRoute.type === 'balanced' ? '⚖️' : '⚡'}
              </span>
              <span className="text-sm text-foreground">
                {formatDuration(selectedRoute.duration)} • {formatDistance(selectedRoute.distance)}
              </span>
            </div>
            <Button variant="safe" size="sm" onClick={startNavigation}>
              <Navigation className="w-4 h-4 mr-1" />
              Go
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
