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
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import { authApi } from '../../api/auth';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'PrivacySettings'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PrivacyToggle {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

// ===========================================================================
// PrivacySettingsScreen
// ===========================================================================
const PrivacySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const persistPrivacy = (key: string, value: boolean) => {
    authApi.updatePreferences({ [key]: value }).catch(() => {
      // Silently fail — settings are optimistically applied
    });
  };

  // ---------------------------------------------------------------------------
  // Section Definitions
  // ---------------------------------------------------------------------------
  const visibilityItems: PrivacyToggle[] = [
    {
      id: 'online-status',
      icon: '\u{1F7E2}',
      title: 'Show Online Status',
      subtitle: 'Let others see when you are active',
      value: showOnlineStatus,
      onToggle: (v: boolean) => { setShowOnlineStatus(v); persistPrivacy('showOnlineStatus', v); },
    },
    {
      id: 'profile-visibility',
      icon: '\u{1F441}\uFE0F',
      title: 'Profile Visibility',
      subtitle: 'Appear in discovery feed to nearby users',
      value: profileVisibility,
      onToggle: (v: boolean) => { setProfileVisibility(v); persistPrivacy('profileVisibility', v); },
    },
  ];

  const locationItems: PrivacyToggle[] = [
    {
      id: 'location-sharing',
      icon: '\u{1F4CD}',
      title: 'Location Sharing',
      subtitle: 'Share your proximity zone with matches',
      value: locationSharing,
      onToggle: (v: boolean) => { setLocationSharing(v); persistPrivacy('locationSharing', v); },
    },
  ];

  const communicationItems: PrivacyToggle[] = [
    {
      id: 'read-receipts',
      icon: '\u{2705}',
      title: 'Read Receipts',
      subtitle: 'Show when you have read messages',
      value: readReceipts,
      onToggle: (v: boolean) => { setReadReceipts(v); persistPrivacy('readReceipts', v); },
    },
  ];

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------
  const renderToggle = (item: PrivacyToggle, isLast: boolean) => (
    <View
      key={item.id}
      style={[
        styles.toggleRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderLight,
        },
      ]}
    >
      <View style={styles.toggleIconContainer}>
        <Text style={styles.toggleIcon}>{item.icon}</Text>
      </View>
      <View style={styles.toggleTextContainer}>
        <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.toggleSubtitle, { color: theme.colors.textTertiary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary + '60',
        }}
        thumbColor={item.value ? theme.colors.primary : '#f4f3f4'}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );

  const renderSection = (
    label: string,
    items: PrivacyToggle[],
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
          renderToggle(item, index === items.length - 1),
        )}
      </View>
    </Animated.View>
  );

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
          Privacy Settings
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('VISIBILITY', visibilityItems, 100)}
        {renderSection('LOCATION', locationItems, 200)}
        {renderSection('COMMUNICATION', communicationItems, 300)}

        {/* Info Note */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}
        >
          <Text style={styles.infoIcon}>{'\u{2139}\uFE0F'}</Text>
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            Disabling location sharing will prevent you from appearing in nearby
            user discovery. You will still be able to browse profiles.
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

  // ---- Toggle Row ----
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  toggleSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },

  // ---- Info Card ----
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
});

export default PrivacySettingsScreen;
