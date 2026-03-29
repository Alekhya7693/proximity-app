import { Platform } from 'react-native';
import { useLocationStore } from '../store/locationStore';
import { locationApi } from '../api/location';
import { socketService } from './socket';

const LOCATION_UPDATE_INTERVAL = 60000; // 1 minute
const LOCATION_DISTANCE_FILTER = 100; // meters

const isNative = Platform.OS !== 'web';

// Lazy-load expo-location (native only)
let Location: any = null;
if (isNative) {
  try {
    Location = require('expo-location');
  } catch {
    // Location module unavailable
  }
}

let locationSubscription: any = null;
let serverUpdateInterval: ReturnType<typeof setInterval> | null = null;

export const locationService = {
  async requestPermissions(): Promise<boolean> {
    if (!isNative || !Location) {
      // On web, use browser Geolocation API permission
      useLocationStore.getState().setPermissionGranted(true);
      return true;
    }

    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      useLocationStore.getState().setError('Foreground location permission denied');
      useLocationStore.getState().setPermissionGranted(false);
      return false;
    }

    useLocationStore.getState().setPermissionGranted(true);
    return true;
  },

  async requestBackgroundPermissions(): Promise<boolean> {
    if (!isNative || !Location) return false;
    const { status } =
      await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<any | null> {
    try {
      if (!isNative || !Location) {
        // Web: try browser Geolocation API, fall back to approximate location
        return new Promise((resolve) => {
          let resolved = false;
          const useFallback = () => {
            if (resolved) return;
            resolved = true;
            // Use a generic fallback — the actual location will be
            // determined by the user's IP on the server side
            const fallbackCoords = { latitude: 0, longitude: 0 };
            console.warn('Location: Browser geolocation unavailable, using fallback');
            useLocationStore.getState().setLocation(fallbackCoords);
            resolve({ coords: fallbackCoords });
          };
          // Timeout after 5s to avoid hanging on browser permission dialogs
          const timer = setTimeout(useFallback, 5000);
          if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                const coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                useLocationStore.getState().setLocation(coords);
                resolve({ coords });
              },
              () => {
                clearTimeout(timer);
                useFallback();
              },
              { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false },
            );
          } else {
            clearTimeout(timer);
            useFallback();
          }
        });
      }

      const hasPermission = useLocationStore.getState().locationPermissionGranted;
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      useLocationStore.getState().setLocation(coords);
      return location;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get location';
      useLocationStore.getState().setError(message);
      return null;
    }
  },

  async startTracking(): Promise<void> {
    if (!isNative || !Location) {
      // Web: try to get real browser location, then mark as tracking
      const loc = await this.getCurrentLocation();
      useLocationStore.getState().setTrackingActive(true);
      return;
    }

    const hasPermission = useLocationStore.getState().locationPermissionGranted;
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return;
    }

    await this.stopTracking();

    try {
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: LOCATION_DISTANCE_FILTER,
          timeInterval: LOCATION_UPDATE_INTERVAL,
        },
        (location: any) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          useLocationStore.getState().setLocation(coords);
          socketService.updateLocation(coords.latitude, coords.longitude);
        },
      );

      serverUpdateInterval = setInterval(async () => {
        const currentLocation = useLocationStore.getState().currentLocation;
        if (currentLocation) {
          try {
            await locationApi.updateLocation(currentLocation);
          } catch (error) {
            console.warn('Failed to update location on server:', error);
          }
        }
      }, LOCATION_UPDATE_INTERVAL);

      useLocationStore.getState().setTrackingActive(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start tracking';
      useLocationStore.getState().setError(message);
    }
  },

  async stopTracking(): Promise<void> {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    if (serverUpdateInterval) {
      clearInterval(serverUpdateInterval);
      serverUpdateInterval = null;
    }

    useLocationStore.getState().setTrackingActive(false);
  },

  async checkPermissionStatus(): Promise<boolean> {
    if (!isNative || !Location) {
      // On web, assume granted for dev
      useLocationStore.getState().setPermissionGranted(true);
      return true;
    }

    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === 'granted';
    useLocationStore.getState().setPermissionGranted(granted);
    return granted;
  },
};
