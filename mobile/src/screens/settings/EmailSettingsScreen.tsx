import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'EmailSettings'>;

// ===========================================================================
// EmailSettingsScreen
// ===========================================================================
const EmailSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuthStore();

  const currentEmail = user?.email ?? 'user@email.com';
  const [newEmail, setNewEmail] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
  const canVerify = newEmail.length > 0 && isValidEmail && newEmail !== currentEmail;

  const handleVerify = () => {
    if (!canVerify) return;
    showAlert(
      'Verification Sent',
      `A verification link has been sent to ${newEmail}. Please check your inbox.`,
    );
  };

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
          Email Address
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Email */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            CURRENT EMAIL
          </Text>
          <View
            style={[
              styles.currentEmailCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: theme.colors.cardShadow,
              },
            ]}
          >
            <View style={[styles.emailIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={styles.emailIcon}>{'\u2709\uFE0F'}</Text>
            </View>
            <View style={styles.emailInfo}>
              <Text style={[styles.emailText, { color: theme.colors.text }]}>
                {currentEmail}
              </Text>
              <View style={styles.verifiedRow}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* New Email */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            NEW EMAIL
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: newEmail.length > 0
                  ? isValidEmail
                    ? theme.colors.primary
                    : '#EF4444'
                  : theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Enter new email address"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {newEmail.length > 0 && !isValidEmail && (
            <Text style={styles.errorText}>Please enter a valid email address</Text>
          )}
        </Animated.View>

        {/* Info Note */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}
        >
          <Text style={[styles.infoIcon]}>{'\u{2139}\uFE0F'}</Text>
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            We will send a verification link to your new email. Your email
            will not change until you verify it.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Verify Button */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(400))}
        style={styles.saveContainer}
      >
        <TouchableOpacity
          activeOpacity={canVerify ? 0.85 : 1}
          onPress={handleVerify}
          disabled={!canVerify}
        >
          <LinearGradient
            colors={
              canVerify
                ? [theme.colors.primary, theme.colors.secondary]
                : ['#4B5563', '#6B7280']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, !canVerify && { opacity: 0.6 }]}
          >
            <Text style={styles.saveButtonText}>Send Verification</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    paddingTop: 16,
    paddingBottom: 120,
  },

  // ---- Section ----
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  // ---- Current Email Card ----
  currentEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
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
  emailIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailIcon: {
    fontSize: 20,
  },
  emailInfo: {
    flex: 1,
    marginLeft: 14,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10B981',
  },

  // ---- Input ----
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  // ---- Info Card ----
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    gap: 12,
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

  // ---- Save ----
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 16,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default EmailSettingsScreen;
