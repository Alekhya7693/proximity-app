import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'Basics'>;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

const socialColors = {
  background: '#0F0A1A',
  surface: '#1A1128',
  primary: '#8B5CF6',
  secondary: '#EC4899',
  text: '#FFFFFF',
  textSecondary: '#A78BFA',
  textTertiary: '#6B7280',
  border: '#2D2340',
  borderLight: '#1F1730',
};

const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarRow}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            {
              backgroundColor:
                i < currentStep ? socialColors.primary : socialColors.borderLight,
            },
          ]}
        />
      ))}
    </View>
    <Text style={styles.stepLabel}>STEP {currentStep} OF {totalSteps}</Text>
  </View>
);

const BasicsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const handleContinue = () => {
    navigation.navigate('ModeSelect');
  };

  const handleAgeChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    if (numericOnly.length <= 3) {
      setAge(numericOnly);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Bar */}
          <ProgressBar currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tell us about yourself</Text>
            <Text style={styles.headerSubtitle}>
              This helps us find you the best matches nearby
            </Text>
          </View>

          {/* Avatar Placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{'\u{1F60A}'}</Text>
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeIcon}>{'\u{1F4F7}'}</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.uploadLink}>Upload photo or generate avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Display Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DISPLAY NAME (OPTIONAL)</Text>
            <View
              style={[
                styles.inputContainer,
                nameFocused && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="UrbanFox (auto-generated)"
                placeholderTextColor={socialColors.textTertiary}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={30}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>

          {/* Age Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>AGE</Text>
            <View
              style={[
                styles.inputContainer,
                ageFocused && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Enter your age"
                placeholderTextColor={socialColors.textTertiary}
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="number-pad"
                maxLength={3}
                onFocus={() => setAgeFocused(true)}
                onBlur={() => setAgeFocused(false)}
              />
            </View>
          </View>

          {/* Short Bio Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SHORT BIO (OPTIONAL)</Text>
            <View
              style={[
                styles.inputContainer,
                styles.inputContainerMultiline,
                bioFocused && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Tell people a bit about yourself..."
                placeholderTextColor={socialColors.textTertiary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
              />
            </View>
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[socialColors.primary, socialColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: socialColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 32,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: socialColors.textTertiary,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: socialColors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: socialColors.textTertiary,
    lineHeight: 22,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: socialColors.surface,
    borderWidth: 2,
    borderColor: socialColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: socialColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: socialColors.background,
  },
  cameraBadgeIcon: {
    fontSize: 14,
  },
  uploadLink: {
    fontSize: 14,
    fontWeight: '500',
    color: socialColors.primary,
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: socialColors.textTertiary,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: socialColors.surface,
    borderWidth: 1.5,
    borderColor: socialColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: socialColors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
  },
  inputContainerMultiline: {
    minHeight: 110,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: socialColors.text,
    paddingVertical: 8,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 4,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    color: socialColors.textTertiary,
    textAlign: 'right',
    marginTop: 6,
  },

  // Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: socialColors.background,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: socialColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default BasicsScreen;
