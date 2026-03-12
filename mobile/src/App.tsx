import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './theme/ThemeContext';
import { useAuthStore } from './store/authStore';
import { useModeStore } from './store/modeStore';
import { socketService } from './services/socket';
import { locationService } from './services/location';
import { notificationService } from './services/notifications';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import { socialColors } from './theme/colors';

const AppContent: React.FC = () => {
  const { isAuthenticated, initialize } = useAuthStore();
  const initializeMode = useModeStore((s) => s.initialize);
  const mode = useModeStore((s) => s.mode);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrapApp = async () => {
      try {
        await Promise.all([initialize(), initializeMode()]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    };

    bootstrapApp();
  }, []);

  // Connect services when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      notificationService.initialize();
      locationService.checkPermissionStatus().then((granted) => {
        if (granted) {
          locationService.startTracking();
        }
      });
    } else {
      socketService.disconnect();
      notificationService.cleanup();
      locationService.stopTracking();
    }

    return () => {
      socketService.disconnect();
      notificationService.cleanup();
      locationService.stopTracking();
    };
  }, [isAuthenticated]);

  // Only gate on isReady — it is set in the finally block AFTER
  // initialize() has already set isInitialized:true inside the store.
  // Using both caused a race condition where the two state sources
  // could resolve in different render cycles, stalling the loading screen.
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={socialColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={mode === 'social' ? 'dark' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;
