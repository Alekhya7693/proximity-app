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
        // Web: try browser Geolocation API, return null if unavailable
        // IMPORTANT: never fall back to (0,0) — that would overwrite the user's
        // real server-side location with "Null Island" and break discovery.
        return new Promise((resolve) => {
          let resolved = false;
          const useNull = () => {
            if (resolved) return;
            resolved = true;
            console.warn('Location: Browser geolocation unavailable or denied. Using server-stored location.');
            resolve(null); // null = "no location update" — keep whatever is on the server
          };
          // Timeout after 8s to give the permission dialog enough time
          const timer = setTimeout(useNull, 8000);
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
              (err) => {
                clearTimeout(timer);
                console.warn('Browser geolocation error:', err.message);
                useNull();
              },
              { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false },
            );
          } else {
            clearTimeout(timer);
            useNull();
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
