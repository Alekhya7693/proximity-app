import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ── Auth Stack ──────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

// ── Onboarding Stack ────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  ProfileSetup: undefined;
  SocialPreferences: undefined;
  ProfessionalPreferences: undefined;
  LocationPermission: undefined;
};

// ── Main Tab Navigator ──────────────────────────────────────────────────

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  ChatList: undefined;
  Profile: undefined;
};

// ── Chat Stack (nested inside ChatList tab) ─────────────────────────────

export type ChatStackParamList = {
  ChatListHome: undefined;
  ChatDetail: { matchId: string; recipientName: string; recipientPhoto: string };
};

// ── Root Stack ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProfileDetail: { userId: string };
  Settings: undefined;
};

// ── Screen Props ────────────────────────────────────────────────────────

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

// ── Declare global navigation typing ────────────────────────────────────

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
