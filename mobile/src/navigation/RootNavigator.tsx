import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList, OnboardingStackParamList } from './types';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import SettingsScreen from '../screens/main/SettingsScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';

// Onboarding screens
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import SocialPreferencesScreen from '../screens/onboarding/SocialPreferencesScreen';
import ProfessionalPreferencesScreen from '../screens/onboarding/ProfessionalPreferencesScreen';
import LocationPermissionScreen from '../screens/onboarding/LocationPermissionScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <OnboardingStack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
      />
      <OnboardingStack.Screen
        name="SocialPreferences"
        component={SocialPreferencesScreen}
      />
      <OnboardingStack.Screen
        name="ProfessionalPreferences"
        component={ProfessionalPreferencesScreen}
      />
      <OnboardingStack.Screen
        name="LocationPermission"
        component={LocationPermissionScreen}
      />
    </OnboardingStack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const needsOnboarding = isAuthenticated && user && !user.isOnboardingComplete;

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animation: 'fade' }}
        />
      ) : needsOnboarding ? (
        <RootStack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          options={{ animation: 'fade' }}
        />
      ) : (
        <>
          <RootStack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ animation: 'fade' }}
          />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              animation: 'slide_from_right',
              presentation: 'card',
            }}
          />
          <RootStack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

export default RootNavigator;
