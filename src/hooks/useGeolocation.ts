import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '@/types';

interface GeolocationState {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
    permissionStatus: null,
  });

  const updateLocation = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      loading: false,
      error: null,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get your location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(updateLocation, handleError, defaultOptions);
  }, [updateLocation, handleError, options]);

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState(prev => ({ ...prev, permissionStatus: result.state }));
        
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionStatus: result.state }));
          if (result.state === 'granted') {
            requestLocation();
          }
        });
      });
    }
  }, [requestLocation]);

  // Watch position for continuous updates
  useEffect(() => {
    if (!navigator.geolocation) return;

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, defaultOptions);

    // Watch for updates
    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      defaultOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation, handleError, options]);

  return {
    ...state,
    requestLocation,
  };
}
