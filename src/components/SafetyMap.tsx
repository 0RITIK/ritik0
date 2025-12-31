import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/stores/appStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { RiskZone } from '@/types';

interface SafetyMapProps {
  className?: string;
  onMapReady?: (map: L.Map) => void;
}

export function SafetyMap({ className, onMapReady }: SafetyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const riskZoneLayers = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const destinationMarker = useRef<L.Marker | null>(null);

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

    const initialCenter: [number, number] = location
      ? [location.lat, location.lng]
      : [40.7484, -73.9857]; // Default to NYC

    map.current = L.map(mapContainer.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
    });

    // Add dark tile layer (CartoDB Dark Matter - free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map.current);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map.current);

    // Initialize risk zone layer group
    riskZoneLayers.current = L.layerGroup().addTo(map.current);

    onMapReady?.(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !location) return;

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="relative">
          <div class="absolute inset-0 w-4 h-4 bg-primary/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg relative z-10"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (!userMarker.current) {
      userMarker.current = L.marker([location.lat, location.lng], { icon: userIcon })
        .addTo(map.current);
      
      // Center map on first location
      map.current.setView([location.lat, location.lng], 16);
    } else {
      userMarker.current.setLatLng([location.lat, location.lng]);
    }
  }, [location]);

  // Add risk zones
  useEffect(() => {
    if (!map.current || !riskZoneLayers.current) return;

    // Clear existing risk zones
    riskZoneLayers.current.clearLayers();

    const addRiskZones = (zones: RiskZone[], level: 'high' | 'medium' | 'low', color: string) => {
      const filteredZones = zones.filter(z => z.riskLevel === level);
      
      filteredZones.forEach(zone => {
        const circle = L.circle([zone.center.lat, zone.center.lng], {
          radius: zone.radius * 10, // Convert to meters
          fillColor: color,
          fillOpacity: 0.25,
          color: color,
          weight: 2,
          opacity: 0.6,
        });
        
        circle.bindPopup(`<strong>${zone.reason}</strong>`);
        riskZoneLayers.current?.addLayer(circle);
      });
    };

    addRiskZones(riskZones, 'high', '#ef4444');
    addRiskZones(riskZones, 'medium', '#f59e0b');
    addRiskZones(riskZones, 'low', '#22c55e');
  }, [riskZones]);

  // Draw selected route
  useEffect(() => {
    if (!map.current) return;

    // Remove existing route
    if (routeLayer.current) {
      map.current.removeLayer(routeLayer.current);
      routeLayer.current = null;
    }

    if (!selectedRoute) return;

    const routeColor = selectedRoute.type === 'safest'
      ? '#22c55e'
      : selectedRoute.type === 'balanced'
        ? '#f59e0b'
        : '#ef4444';

    const coordinates: [number, number][] = selectedRoute.coordinates.map(c => [c.lat, c.lng]);

    routeLayer.current = L.polyline(coordinates, {
      color: routeColor,
      weight: 6,
      opacity: 0.8,
    }).addTo(map.current);

    // Fit bounds to route
    map.current.fitBounds(routeLayer.current.getBounds(), { padding: [50, 50] });
  }, [selectedRoute]);

  // Add destination marker
  useEffect(() => {
    if (!map.current) return;

    // Remove existing destination marker
    if (destinationMarker.current) {
      map.current.removeLayer(destinationMarker.current);
      destinationMarker.current = null;
    }

    if (!destination) return;

    const destIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="w-1 h-4 bg-primary/50 rounded-b"></div>
        </div>
      `,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
    });

    destinationMarker.current = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map.current);
  }, [destination]);

  return (
    <div ref={mapContainer} className={className} />
  );
}
