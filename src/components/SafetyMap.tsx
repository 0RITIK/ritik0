import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '@/stores/appStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { RiskZone } from '@/types';

interface SafetyMapProps {
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
}

// Demo token - users should replace with their own
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsdnB4cHkxZjBkMnQya3Fuc2xpZjh1eXYifQ.O8tjxqgP3V4bAI7GKhUTJg';

export function SafetyMap({ className, onMapReady }: SafetyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { location } = useGeolocation();
  const { setCurrentLocation, riskZones, selectedRoute, destination } = useAppStore();

  // Update store with current location
  useEffect(() => {
    if (location) {
      setCurrentLocation(location);
    }
  }, [location, setCurrentLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const initialCenter: [number, number] = location 
      ? [location.lng, location.lat]
      : [-73.9857, 40.7484]; // Default to NYC

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
      onMapReady?.(map.current!);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !location) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg relative z-10"></div>
        </div>
      `;
      
      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([location.lng, location.lat]);
    }

    // Center map on first location
    if (!mapLoaded) {
      map.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 16,
        duration: 1500,
      });
    }
  }, [location, mapLoaded]);

  // Add risk zones
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing risk zone layers
    ['risk-zones-high', 'risk-zones-medium', 'risk-zones-low'].forEach(id => {
      if (map.current?.getLayer(id)) {
        map.current.removeLayer(id);
      }
      if (map.current?.getSource(id)) {
        map.current.removeSource(id);
      }
    });

    // Add risk zone circles
    const addRiskZones = (zones: RiskZone[], level: 'high' | 'medium' | 'low', color: string) => {
      const filteredZones = zones.filter(z => z.riskLevel === level);
      if (filteredZones.length === 0) return;

      const features = filteredZones.map(zone => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [zone.center.lng, zone.center.lat],
        },
        properties: {
          radius: zone.radius,
          reason: zone.reason,
        },
      }));

      map.current?.addSource(`risk-zones-${level}`, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      map.current?.addLayer({
        id: `risk-zones-${level}`,
        type: 'circle',
        source: `risk-zones-${level}`,
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': color,
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': color,
          'circle-stroke-opacity': 0.6,
        },
      });
    };

    addRiskZones(riskZones, 'high', '#ef4444');
    addRiskZones(riskZones, 'medium', '#f59e0b');
    addRiskZones(riskZones, 'low', '#22c55e');

  }, [riskZones, mapLoaded]);

  // Draw selected route
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedRoute) return;

    const routeId = 'selected-route';
    
    if (map.current.getLayer(routeId)) {
      map.current.removeLayer(routeId);
    }
    if (map.current.getSource(routeId)) {
      map.current.removeSource(routeId);
    }

    const routeColor = selectedRoute.type === 'safest' 
      ? '#22c55e' 
      : selectedRoute.type === 'balanced' 
        ? '#f59e0b' 
        : '#ef4444';

    map.current.addSource(routeId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: selectedRoute.coordinates.map(c => [c.lng, c.lat]),
        },
      },
    });

    map.current.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': routeColor,
        'line-width': 6,
        'line-opacity': 0.8,
      },
    });

    // Fit bounds to route
    const bounds = new mapboxgl.LngLatBounds();
    selectedRoute.coordinates.forEach(coord => {
      bounds.extend([coord.lng, coord.lat]);
    });
    map.current.fitBounds(bounds, { padding: 80 });

  }, [selectedRoute, mapLoaded]);

  // Add destination marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !destination) return;

    const markerId = 'destination-marker';
    
    // Remove existing marker
    const existingMarker = document.getElementById(markerId);
    if (existingMarker) existingMarker.remove();

    const el = document.createElement('div');
    el.id = markerId;
    el.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="w-1 h-4 bg-primary/50 rounded-b"></div>
      </div>
    `;

    new mapboxgl.Marker({ element: el })
      .setLngLat([destination.lng, destination.lat])
      .addTo(map.current);

  }, [destination, mapLoaded]);

  return (
    <div ref={mapContainer} className={className} />
  );
}
