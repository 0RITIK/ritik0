import { useCallback } from 'react';
import type { Coordinates, Route, RiskZone } from '@/types';

interface RouteCalculationOptions {
  origin: Coordinates;
  destination: Coordinates;
  riskZones: RiskZone[];
}

// Calculate distance between two points in meters
function haversineDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
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

// Check if a point is inside a risk zone
function isInRiskZone(point: Coordinates, zone: RiskZone): boolean {
  const distance = haversineDistance(point, zone.center);
  return distance <= zone.radius;
}

// Calculate safety score for a route segment
function calculateSegmentSafety(
  from: Coordinates,
  to: Coordinates,
  riskZones: RiskZone[]
): { score: number; warnings: string[] } {
  const warnings: string[] = [];
  let riskPenalty = 0;

  // Check midpoint and both endpoints against risk zones
  const midpoint: Coordinates = {
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2,
  };

  const checkPoints = [from, midpoint, to];

  for (const zone of riskZones) {
    for (const point of checkPoints) {
      if (isInRiskZone(point, zone)) {
        if (zone.riskLevel === 'high') {
          riskPenalty += 25;
          if (!warnings.includes(zone.reason)) {
            warnings.push(zone.reason);
          }
        } else if (zone.riskLevel === 'medium') {
          riskPenalty += 12;
          if (!warnings.includes(zone.reason)) {
            warnings.push(zone.reason);
          }
        } else {
          riskPenalty += 5;
        }
        break; // Only count each zone once per segment
      }
    }
  }

  // Time-based penalty (night is riskier)
  const hour = new Date().getHours();
  const isNightTime = hour >= 21 || hour <= 5;
  if (isNightTime) {
    riskPenalty += 10;
  }

  const score = Math.max(0, 100 - riskPenalty);
  return { score, warnings };
}

// Generate waypoints for a route (simulating different paths)
function generateWaypoints(
  origin: Coordinates,
  destination: Coordinates,
  routeType: 'safest' | 'balanced' | 'fastest',
  riskZones: RiskZone[]
): Coordinates[] {
  const waypoints: Coordinates[] = [origin];
  const directDistance = haversineDistance(origin, destination);
  
  // Number of intermediate points based on distance
  const numPoints = Math.max(2, Math.min(6, Math.floor(directDistance / 200)));
  
  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);
    
    // Base interpolated point
    let lat = origin.lat + (destination.lat - origin.lat) * t;
    let lng = origin.lng + (destination.lng - origin.lng) * t;
    
    // Add variation based on route type
    const variation = routeType === 'safest' ? 0.003 : routeType === 'balanced' ? 0.0015 : 0;
    
    // For safest route, try to avoid risk zones
    if (routeType === 'safest') {
      let bestLat = lat;
      let bestLng = lng;
      let bestRisk = Infinity;
      
      // Try a few different offsets and pick the safest
      const offsets = [
        { dlat: variation, dlng: 0 },
        { dlat: -variation, dlng: 0 },
        { dlat: 0, dlng: variation },
        { dlat: 0, dlng: -variation },
        { dlat: variation * 0.7, dlng: variation * 0.7 },
        { dlat: -variation * 0.7, dlng: variation * 0.7 },
      ];
      
      for (const offset of offsets) {
        const testPoint = { lat: lat + offset.dlat, lng: lng + offset.dlng };
        let totalRisk = 0;
        
        for (const zone of riskZones) {
          const dist = haversineDistance(testPoint, zone.center);
          if (dist < zone.radius) {
            totalRisk += zone.riskLevel === 'high' ? 100 : zone.riskLevel === 'medium' ? 50 : 25;
          }
        }
        
        if (totalRisk < bestRisk) {
          bestRisk = totalRisk;
          bestLat = testPoint.lat;
          bestLng = testPoint.lng;
        }
      }
      
      lat = bestLat;
      lng = bestLng;
    } else if (routeType === 'balanced') {
      // Add slight random variation for balanced route
      lat += (Math.random() - 0.5) * variation;
      lng += (Math.random() - 0.5) * variation;
    }
    
    waypoints.push({ lat, lng });
  }
  
  waypoints.push(destination);
  return waypoints;
}

export function useRouteCalculation() {
  const calculateRoutes = useCallback(
    ({ origin, destination, riskZones }: RouteCalculationOptions): Route[] => {
      const directDistance = haversineDistance(origin, destination);
      
      const routeTypes: Array<'safest' | 'balanced' | 'fastest'> = ['safest', 'balanced', 'fastest'];
      
      return routeTypes.map((type) => {
        const waypoints = generateWaypoints(origin, destination, type, riskZones);
        
        // Calculate total distance along the path
        let totalDistance = 0;
        const allWarnings: string[] = [];
        let totalSafetyScore = 0;
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const segmentDist = haversineDistance(waypoints[i], waypoints[i + 1]);
          totalDistance += segmentDist;
          
          const { score, warnings } = calculateSegmentSafety(
            waypoints[i],
            waypoints[i + 1],
            riskZones
          );
          
          totalSafetyScore += score;
          warnings.forEach((w) => {
            if (!allWarnings.includes(w)) {
              allWarnings.push(w);
            }
          });
        }
        
        // Average safety score across segments
        const avgSafety = totalSafetyScore / (waypoints.length - 1);
        
        // Adjust scores based on route type intention
        let finalSafetyScore = avgSafety;
        if (type === 'safest') {
          finalSafetyScore = Math.min(98, avgSafety + 15);
        } else if (type === 'balanced') {
          finalSafetyScore = Math.max(50, Math.min(85, avgSafety));
        } else {
          finalSafetyScore = Math.max(30, avgSafety - 10);
        }
        
        // Walking speed: ~1.2 m/s (4.3 km/h)
        const duration = totalDistance / 1.2;
        
        return {
          id: type,
          name: type === 'safest' ? 'Safest Route' : type === 'balanced' ? 'Balanced Route' : 'Fastest Route',
          type,
          safetyScore: Math.round(finalSafetyScore),
          distance: Math.round(totalDistance),
          duration: Math.round(duration),
          coordinates: waypoints,
          warnings: type === 'safest' ? [] : allWarnings.slice(0, 3),
        };
      });
    },
    []
  );

  return { calculateRoutes };
}
