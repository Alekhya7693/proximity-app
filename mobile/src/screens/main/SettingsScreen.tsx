import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../utils/alert';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { locationService } from '../../services/location';
import { locationApi } from '../../api/location';
import { authApi } from '../../api/auth';
import { socketService } from '../../services/socket';
import { notificationService } from '../../services/notifications';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Settings'>;

const ANIMATION_BASE_DELAY = 80;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { logout } = useAuthStore();
  const { isTrackingActive, locationPermissionGranted } = useLocationStore();

  const [locationVisible, setLocationVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [proximityAlerts, setProximityAlerts] = useState(true);

  // ---------------------------------------------------------------------------
  // Business Logic (unchanged)
  // ---------------------------------------------------------------------------

  const handleToggleLocationVisibility = async (value: boolean) => {
    setLocationVisible(value);
    try {
      await locationApi.setLocationVisibility(value);
      if (value && !isTrackingActive) {
        await locationService.startTracking();
      } else if (!value) {
        await locationService.stopTracking();
      }
    } catch {
      setLocationVisible(!value);
      showAlert('Error', 'Failed to update location visibility.');
    }
  };

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
  // Reusable Renders
  // ---------------------------------------------------------------------------

  const renderToggleRow = (
    title: string,
    description: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    isLast?: boolean,
  ) => (
    <View
      style={[
        styles.toggleRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderLight },
      ]}
    >
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primaryLight,
        }}
        thumbColor={value ? theme.colors.primary : '#f4f3f4'}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );

  const renderMenuItem = (
    title: string,
    onPress: () => void,
    isLast?: boolean,
  ) => (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[
        styles.menuRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderLight },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>
        {'\u203A'}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (emoji: string, label: string) => (
    <View style={[styles.sectionPill, { backgroundColor: theme.colors.primaryLight + '1A' }]}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
        {label}
      </Text>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Card wrapper with shadow
  // ---------------------------------------------------------------------------

  const renderCard = (children: React.ReactNode) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          shadowColor: theme.colors.cardShadow,
        },
      ]}
    >
      {children}
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { backgroundColor: theme.colors.surface }]}
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

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {'\u2699\uFE0F'} Settings
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Location Section ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 1).duration(500).springify())}
          style={styles.section}
        >
          {renderSectionHeader('\uD83D\uDCCD', 'Location')}
          {renderCard(
            renderToggleRow(
              'Location Visibility',
              'Allow others to see your approximate distance',
              locationVisible,
              handleToggleLocationVisibility,
              true,
            ),
          )}
        </Animated.View>

        {/* ---- Notifications Section ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 2).duration(500).springify())}
          style={styles.section}
        >
          {renderSectionHeader('\uD83D\uDD14', 'Notifications')}
          {renderCard(
            <>
              {renderToggleRow(
                'Push Notifications',
                'Receive notifications for matches and messages',
                notificationsEnabled,
                setNotificationsEnabled,
              )}
              {renderToggleRow(
                'Proximity Alerts',
                'Get notified when compatible people are nearby',
                proximityAlerts,
                setProximityAlerts,
                true,
              )}
            </>,
          )}
        </Animated.View>

        {/* ---- Account Section ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 3).duration(500).springify())}
          style={styles.section}
        >
          {renderSectionHeader('\uD83D\uDC64', 'Account')}
          {renderCard(
            <>
              {renderMenuItem('Change Password', () => {
                /* navigate to change password */
              })}
              {renderMenuItem('Blocked Users', () => {
                /* navigate to blocked users */
              })}
              {renderMenuItem('Privacy Policy', () => {
                /* navigate to privacy policy */
              })}
              {renderMenuItem('Terms of Service', () => {
                /* navigate to terms of service */
              }, true)}
            </>,
          )}
        </Animated.View>

        {/* ---- Actions ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 4).duration(500).springify())}
          style={styles.actionsSection}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.signOutButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '0A',
              },
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.signOutEmoji}>{'\uD83D\uDEAA'}</Text>
            <Text style={[styles.signOutText, { color: theme.colors.primary }]}>
              Sign Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteEmoji}>{'\u26A0\uFE0F'}</Text>
            <Text style={[styles.deleteText, { color: theme.colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Version ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(ANIMATION_BASE_DELAY * 5).duration(500).springify())}
          style={styles.versionContainer}
        >
          <Text style={[styles.versionEmoji]}>{'\uD83D\uDCE1'}</Text>
          <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
            Proximity v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ---- Header ---- */
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  /* ---- Scroll ---- */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },

  /* ---- Sections ---- */
  section: {
    marginBottom: 28,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* ---- Card ---- */
  card: {
    borderRadius: 16,
    paddingHorizontal: 18,
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

  /* ---- Toggle Rows ---- */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  /* ---- Menu Rows ---- */
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginRight: 2,
  },

  /* ---- Actions ---- */
  actionsSection: {
    marginTop: 4,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
  },
  signOutEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  deleteEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ---- Version ---- */
  versionContainer: {
    alignItems: 'center',
    marginTop: 36,
    paddingBottom: 8,
  },
  versionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen;
