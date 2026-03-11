import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { locationService } from '../../services/location';
import { authApi } from '../../api/auth';
import { socketService } from '../../services/socket';
import { notificationService } from '../../services/notifications';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Settings'>;

const ANIMATION_BASE_DELAY = 80;

// ---------------------------------------------------------------------------
// Section Item Types
// ---------------------------------------------------------------------------
interface SettingsMenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

// ===========================================================================
// SettingsScreen
// ===========================================================================
const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  // ---------------------------------------------------------------------------
  // Business Logic
  // ---------------------------------------------------------------------------
  const doLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
    socketService.disconnect();
    notificationService.cleanup();
    await locationService.stopTracking();
    await logout();
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const doDeleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      socketService.disconnect();
      notificationService.cleanup();
      await locationService.stopTracking();
      await logout();
    } catch {
      showAlert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: doDeleteAccount },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // Section Definitions
  // ---------------------------------------------------------------------------
  const accountItems: SettingsMenuItem[] = [
    {
      icon: '\uD83D\uDC64',
      title: 'Edit Profile',
      subtitle: 'Name, photo, bio, avatar',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDD12',
      title: 'Change Password',
      subtitle: 'Update your login credentials',
      onPress: () => {},
    },
    {
      icon: '\u2709\uFE0F',
      title: 'Email Address',
      subtitle: user?.email ?? 'user@email.com',
      onPress: () => {},
    },
  ];

  const preferencesItems: SettingsMenuItem[] = [
    {
      icon: '\uD83D\uDC9C',
      title: 'Social Preferences',
      subtitle: 'Mode specific interests & filters',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDCBC',
      title: 'Professional Preferences',
      subtitle: 'Networking & mentorship settings',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDCCD',
      title: 'Discovery Radius',
      subtitle: 'Set your search distance',
      onPress: () => navigation.navigate('Filters'),
    },
  ];

  const privacyItems: SettingsMenuItem[] = [
    {
      icon: '\uD83D\uDEAB',
      title: 'Blocked Users',
      subtitle: 'Manage blocked profiles',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDEE1\uFE0F',
      title: 'Privacy Settings',
      subtitle: 'Location visibility & data',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDD14',
      title: 'Notification Settings',
      subtitle: 'Push, alerts & reminders',
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  const supportItems: SettingsMenuItem[] = [
    {
      icon: '\u2753',
      title: 'Help Center',
      subtitle: 'FAQs and guides',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDCE3',
      title: 'Report a Problem',
      subtitle: 'Let us know about issues',
      onPress: () => {},
    },
    {
      icon: '\uD83D\uDCC4',
      title: 'Terms & Privacy',
      subtitle: 'Legal information',
      onPress: () => {},
    },
  ];

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------
  const renderMenuItem = (item: SettingsMenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      activeOpacity={0.6}
      style={[
        styles.menuRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderLight,
        },
      ]}
      onPress={item.onPress}
    >
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{item.icon}</Text>
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.menuSubtitle, { color: theme.colors.textTertiary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>
        {'\u203A'}
      </Text>
    </TouchableOpacity>
  );

  const renderSection = (
    label: string,
    items: SettingsMenuItem[],
    delay: number,
  ) => (
    <Animated.View
      entering={enteringAnim(FadeInDown.delay(delay).duration(500).springify())}
      style={styles.section}
    >
      <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceElevated,
            shadowColor: theme.colors.cardShadow,
          },
        ]}
      >
        {items.map((item, index) =>
          renderMenuItem(item, index === items.length - 1),
        )}
      </View>
    </Animated.View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={styles.headerBar}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backArrow, { color: theme.colors.primary }]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Settings
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- User Card ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY).duration(500).springify())}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.userCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: theme.colors.cardShadow,
              },
            ]}
          >
            <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={styles.userAvatarEmoji}>{'\uD83E\uDD8A'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.displayName ?? 'UrbanFox'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textTertiary }]}>
                {user?.email ?? 'alex@proximity.app'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>
              {'\u203A'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Sections ---- */}
        {renderSection('ACCOUNT', accountItems, ANIMATION_BASE_DELAY * 2)}
        {renderSection('PREFERENCES', preferencesItems, ANIMATION_BASE_DELAY * 3)}
        {renderSection('PRIVACY & SAFETY', privacyItems, ANIMATION_BASE_DELAY * 4)}
        {renderSection('SUPPORT', supportItems, ANIMATION_BASE_DELAY * 5)}

        {/* ---- Danger Zone ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 6).duration(500).springify())}
          style={styles.dangerZone}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>
              Log Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            style={[
              styles.deleteAccountButton,
              { borderColor: theme.colors.error + '40' },
            ]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.deleteAccountText, { color: theme.colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Version ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 7).duration(500).springify())}
          style={styles.versionContainer}
        >
          <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
            Proximity v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ===========================================================================
// Styles
// ===========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ---- Header ----
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // ---- Scroll ----
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },

  // ---- User Card ----
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarEmoji: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },

  // ---- Section ----
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // ---- Menu Row ----
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginRight: 2,
  },

  // ---- Danger Zone ----
  dangerZone: {
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  logoutButton: {
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- Version ----
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen;
