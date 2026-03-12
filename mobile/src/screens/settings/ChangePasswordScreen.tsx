import React, { useState, useMemo } from 'react';
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
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ChangePassword'>;

// ---------------------------------------------------------------------------
// Password Strength
// ---------------------------------------------------------------------------
type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(password: string): {
  level: StrengthLevel;
  label: string;
  color: string;
  progress: number;
} {
  if (password.length === 0) {
    return { level: 'weak', label: '', color: '#6B7280', progress: 0 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', label: 'Weak', color: '#EF4444', progress: 0.25 };
  if (score === 2) return { level: 'fair', label: 'Fair', color: '#F59E0B', progress: 0.5 };
  if (score === 3) return { level: 'good', label: 'Good', color: '#10B981', progress: 0.75 };
  return { level: 'strong', label: 'Strong', color: '#059669', progress: 1 };
}

// ===========================================================================
// ChangePasswordScreen
// ===========================================================================
const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSave =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSave = () => {
    if (!canSave) return;
    showAlert('Password Updated', 'Your password has been changed successfully.');
    navigation.goBack();
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    onToggleShow: () => void,
    placeholder: string,
    delay: number,
  ) => (
    <Animated.View
      entering={enteringAnim(FadeInDown.duration(500).delay(delay))}
      style={styles.section}
    >
      <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: theme.colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={onToggleShow}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.showHideText, { color: theme.colors.primary }]}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
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
          Change Password
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderPasswordField(
          'CURRENT PASSWORD',
          currentPassword,
          setCurrentPassword,
          showCurrentPassword,
          () => setShowCurrentPassword(!showCurrentPassword),
          'Enter current password',
          100,
        )}

        {renderPasswordField(
          'NEW PASSWORD',
          newPassword,
          setNewPassword,
          showNewPassword,
          () => setShowNewPassword(!showNewPassword),
          'Enter new password',
          200,
        )}

        {/* Password Strength Indicator */}
        {newPassword.length > 0 && (
          <Animated.View
            entering={enteringAnim(FadeIn.duration(300))}
            style={styles.strengthSection}
          >
            <View style={[styles.strengthTrack, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    backgroundColor: strength.color,
                    width: `${strength.progress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </Animated.View>
        )}

        {renderPasswordField(
          'CONFIRM NEW PASSWORD',
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword),
          'Re-enter new password',
          300,
        )}

        {/* Match/Mismatch Indicator */}
        {passwordsMatch && (
          <Animated.View entering={enteringAnim(FadeIn.duration(300))}>
            <Text style={styles.matchText}>{'\u2713'} Passwords match</Text>
          </Animated.View>
        )}
        {passwordsMismatch && (
          <Animated.View entering={enteringAnim(FadeIn.duration(300))}>
            <Text style={styles.mismatchText}>{'\u2717'} Passwords do not match</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Save Button */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(400))}
        style={styles.saveContainer}
      >
        <TouchableOpacity
          activeOpacity={canSave ? 0.85 : 1}
          onPress={handleSave}
          disabled={!canSave}
        >
          <LinearGradient
            colors={
              canSave
                ? [theme.colors.primary, theme.colors.secondary]
                : ['#4B5563', '#6B7280']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, !canSave && { opacity: 0.6 }]}
          >
            <Text style={styles.saveButtonText}>Update Password</Text>
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

  // ---- Input ----
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  showHideText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },

  // ---- Strength ----
  strengthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -16,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 48,
  },

  // ---- Match ----
  matchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginTop: -16,
    marginLeft: 4,
  },
  mismatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: -16,
    marginLeft: 4,
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

export default ChangePasswordScreen;
