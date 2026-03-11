import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// -- Auth Stack --
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

// -- Onboarding Stack --
export type OnboardingStackParamList = {
  Basics: undefined;
  ModeSelect: undefined;
  Interests: undefined;
  SocialPrefs: undefined;
  ProfessionalPrefs: undefined;
  AvatarSetup: undefined;
};

// -- Main Tab Navigator --
export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  ChatList: undefined;
  HotZoneMap: undefined;
  Profile: undefined;
};

// -- Chat Stack (nested inside ChatList tab) --
export type ChatStackParamList = {
  ChatListHome: undefined;
  ChatDetail: { matchId: string; recipientName: string; recipientAvatar: string; isActive: boolean };
};

// -- Root Stack --
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProfileDetail: { userId: string; mode: 'social' | 'professional' };
  MatchPrompt: { matchId: string; userName: string; userAvatar: string; distance: number; compatibility: number };
  Settings: undefined;
  Filters: undefined;
  ReportUser: { userId: string; userName: string; userAvatar: string };
  Notifications: undefined;
  AdminDashboard: undefined;
  AdminReportQueue: undefined;
  AdminUserDetail: { userId: string };
};

// -- Screen Props --
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OnboardingStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type ChatStackScreenProps<T extends keyof ChatStackParamList> =
  NativeStackScreenProps<ChatStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
