import { useState, useCallback } from 'react';

/**
 * Reverse geocodes latitude and longitude into a readable street/area/city address.
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AttendanceApp/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.display_name) {
        return data.display_name;
      }
      const addr = data.address || {};
      const parts = [
        addr.road || addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village || addr.county,
        addr.state,
        addr.country,
      ].filter(Boolean);

      if (parts.length > 0) return parts.join(', ');
    }
  } catch (err) {
    console.warn('Reverse geocode warning:', err);
  }
  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
};

/**
 * Hook for capturing GPS location and reverse geocoding to an address.
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(() => {
    setError(null);
    setIsLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Fetch human readable address
        const address = await reverseGeocode(latitude, longitude);

        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          address: address,
        });
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location in your browser settings to punch in.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Unable to determine your location. Please try again.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown location error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always get fresh location
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { location, error, isLoading, getLocation, clearLocation };
};

