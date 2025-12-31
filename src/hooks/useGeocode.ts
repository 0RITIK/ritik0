import { useState, useCallback } from 'react';
import type { Coordinates } from '@/types';

interface GeocodingResult {
  name: string;
  displayName: string;
  coords: Coordinates;
  type: string;
}

export function useGeocode() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (query: string, userLocation?: Coordinates) => {
    if (!query || query.length < 3) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '6',
        addressdetails: '1',
      });

      // Bias results towards user location if available
      if (userLocation) {
        params.append('viewbox', `${userLocation.lng - 0.1},${userLocation.lat + 0.1},${userLocation.lng + 0.1},${userLocation.lat - 0.1}`);
        params.append('bounded', '0');
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SafeRoute App',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      const mappedResults: GeocodingResult[] = data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        coords: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
        type: item.type || 'place',
      }));

      setResults(mappedResults);
      return mappedResults;
    } catch (err) {
      setError('Failed to search locations');
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (coords: Coordinates): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SafeRoute App',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    searchPlaces,
    reverseGeocode,
    results,
    isSearching,
    error,
    clearResults,
  };
}
