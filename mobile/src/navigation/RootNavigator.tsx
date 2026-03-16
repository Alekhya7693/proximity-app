import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList, OnboardingStackParamList } from './types';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Root-level screens
import SettingsScreen from '../screens/main/SettingsScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import MatchPromptScreen from '../screens/main/MatchPromptScreen';
import FiltersScreen from '../screens/main/FiltersScreen';
import ReportUserScreen from '../screens/main/ReportUserScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SetVibeScreen from '../screens/main/SetVibeScreen';

// Settings screens
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import EmailSettingsScreen from '../screens/settings/EmailSettingsScreen';
import SocialPrefsSettingsScreen from '../screens/settings/SocialPrefsSettingsScreen';
import ProfessionalPrefsSettingsScreen from '../screens/settings/ProfessionalPrefsSettingsScreen';
import BlockedUsersScreen from '../screens/settings/BlockedUsersScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import HelpCenterScreen from '../screens/settings/HelpCenterScreen';
import ReportProblemScreen from '../screens/settings/ReportProblemScreen';
import TermsPrivacyScreen from '../screens/settings/TermsPrivacyScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminReportQueueScreen from '../screens/admin/AdminReportQueueScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';

// Onboarding screens
import BasicsScreen from '../screens/onboarding/BasicsScreen';
import ModeSelectScreen from '../screens/onboarding/ModeSelectScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import SocialPrefsScreen from '../screens/onboarding/SocialPrefsScreen';
import ProfessionalPrefsScreen from '../screens/onboarding/ProfessionalPrefsScreen';
import AvatarSetupScreen from '../screens/onboarding/AvatarSetupScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F0A1A' },
      }}
    >
      <OnboardingStack.Screen name="Basics" component={BasicsScreen} />
      <OnboardingStack.Screen name="ModeSelect" component={ModeSelectScreen} />
      <OnboardingStack.Screen name="Interests" component={InterestsScreen} />
      <OnboardingStack.Screen name="SocialPrefs" component={SocialPrefsScreen} />
      <OnboardingStack.Screen name="ProfessionalPrefs" component={ProfessionalPrefsScreen} />
      <OnboardingStack.Screen name="AvatarSetup" component={AvatarSetupScreen} />
    </OnboardingStack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const needsOnboarding = isAuthenticated && user && !user.isOnboardingComplete;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
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
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <RootStack.Screen
            name="MatchPrompt"
            component={MatchPromptScreen}
            options={{ animation: 'fade', presentation: 'transparentModal' }}
          />
          <RootStack.Screen
            name="Filters"
            component={FiltersScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="ReportUser"
            component={ReportUserScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="EmailSettings"
            component={EmailSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="SocialPrefsSettings"
            component={SocialPrefsSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="ProfessionalPrefsSettings"
            component={ProfessionalPrefsSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="ReportProblem"
            component={ReportProblemScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="TermsPrivacy"
            component={TermsPrivacyScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="SetVibe"
            component={SetVibeScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <RootStack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="AdminReportQueue"
            component={AdminReportQueueScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <RootStack.Screen
            name="AdminUserDetail"
            component={AdminUserDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

export default RootNavigator;
