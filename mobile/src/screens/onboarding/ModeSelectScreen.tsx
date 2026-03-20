import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useModeStore } from '../../store/modeStore';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'ModeSelect'>;

type ModeOption = 'social' | 'professional';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 2;

const socialColors = {
  background: '#0B2545',
  surface: '#133E68',
  primary: '#0EA5E9',
  secondary: '#F97316',
  text: '#FFFFFF',
  textSecondary: '#7DD3FC',
  textTertiary: '#93B8D7',
  border: '#1B5B8A',
  borderLight: '#0F3660',
};

const SOCIAL_TAGS = ['Dating', 'New Friends', 'Coffee Chat', 'Socializing'];
const PROFESSIONAL_TAGS = ['Networking', 'Mentorship', 'Collaboration'];

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

const ModeSelectScreen: React.FC<Props> = ({ navigation }) => {
  const { setMode } = useModeStore();
  const [selectedMode, setSelectedMode] = useState<ModeOption>('social');

  const handleSelectMode = (mode: ModeOption) => {
    setSelectedMode(mode);
  };

  const handleContinue = async () => {
    await setMode(selectedMode);
    navigation.navigate('Interests');
  };

  const isSocialSelected = selectedMode === 'social';
  const isProfessionalSelected = selectedMode === 'professional';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>How do you want to connect?</Text>
          <Text style={styles.headerSubtitle}>
            You can switch modes anytime. Each mode has its own preferences.
          </Text>
        </View>

        {/* Social Mode Card */}
        <TouchableOpacity
          style={[
            styles.modeCard,
            isSocialSelected && styles.modeCardSelected,
          ]}
          onPress={() => handleSelectMode('social')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.15)', 'rgba(249, 115, 22, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeCardGradient}
          >
            {/* Card Header */}
            <View style={styles.modeCardHeader}>
              <View style={styles.modeIconRow}>
                <Text style={styles.modeIcon}>{'\u2728'}</Text>
                <View style={styles.modeTitleGroup}>
                  <Text style={styles.modeTitle}>Social Mode</Text>
                  <Text style={styles.modeSubtitle}>
                    Meet people, make friends, find dates
                  </Text>
                </View>
              </View>
              {isSocialSelected && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>{'\u2713'}</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {SOCIAL_TAGS.map((tag) => (
                <View key={tag} style={styles.modeTag}>
                  <Text style={styles.modeTagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Selected indicator */}
            {isSocialSelected && (
              <View style={styles.selectedIndicator}>
                <View style={styles.selectedDot} />
                <Text style={styles.selectedText}>Selected as primary mode</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Professional Mode Card */}
        <TouchableOpacity
          style={[
            styles.modeCard,
            isProfessionalSelected && styles.modeCardSelected,
          ]}
          onPress={() => handleSelectMode('professional')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(30, 58, 95, 0.25)', 'rgba(212, 168, 83, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeCardGradient}
          >
            {/* Card Header */}
            <View style={styles.modeCardHeader}>
              <View style={styles.modeIconRow}>
                <Text style={styles.modeIcon}>{'\u{1F4BC}'}</Text>
                <View style={styles.modeTitleGroup}>
                  <Text style={styles.modeTitle}>Professional Mode</Text>
                  <Text style={styles.modeSubtitle}>
                    Network, collaborate, find mentors
                  </Text>
                </View>
              </View>
              {isProfessionalSelected && (
                <View style={[styles.checkCircle, styles.checkCircleTeal]}>
                  <Text style={styles.checkMark}>{'\u2713'}</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {PROFESSIONAL_TAGS.map((tag) => (
                <View key={tag} style={[styles.modeTag, styles.modeTagTeal]}>
                  <Text style={[styles.modeTagText, styles.modeTagTextTeal]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            {/* Selected indicator */}
            {isProfessionalSelected && (
              <View style={styles.selectedIndicator}>
                <View style={[styles.selectedDot, styles.selectedDotTeal]} />
                <Text style={styles.selectedText}>Selected as primary mode</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: socialColors.background,
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

  // Mode Cards
  modeCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: socialColors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  modeCardSelected: {
    borderColor: socialColors.primary,
    shadowColor: socialColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  modeCardGradient: {
    padding: 20,
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modeIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  modeIcon: {
    fontSize: 32,
    marginRight: 14,
    marginTop: 2,
  },
  modeTitleGroup: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: socialColors.text,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: socialColors.textTertiary,
    lineHeight: 20,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: socialColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkCircleTeal: {
    backgroundColor: '#D4A853',
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
  },
  modeTagTeal: {
    backgroundColor: 'rgba(212, 168, 83, 0.12)',
    borderColor: 'rgba(212, 168, 83, 0.25)',
  },
  modeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: socialColors.textSecondary,
  },
  modeTagTextTeal: {
    color: '#E0BE7A',
  },

  // Selected indicator
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: socialColors.primary,
  },
  selectedDotTeal: {
    backgroundColor: '#D4A853',
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '500',
    color: socialColors.textTertiary,
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

export default ModeSelectScreen;
