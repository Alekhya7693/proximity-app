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
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'AvatarSetup'>;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 5;

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
  success: '#10B981',
};

interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  gradientColors: [string, string];
}

const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'urban-fox',
    name: 'UrbanFox',
    emoji: '\u{1F98A}',
    gradientColors: ['#8B5CF6', '#A855F7'],
  },
  {
    id: 'solar-nomad',
    name: 'SolarNomad',
    emoji: '\u2B50',
    gradientColors: ['#F59E0B', '#F97316'],
  },
  {
    id: 'tidal-thinker',
    name: 'TidalThinker',
    emoji: '\u{1F30A}',
    gradientColors: ['#06B6D4', '#3B82F6'],
  },
  {
    id: 'night-hawk',
    name: 'NightHawk',
    emoji: '\u{1F985}',
    gradientColors: ['#6366F1', '#8B5CF6'],
  },
  {
    id: 'cosmic-drifter',
    name: 'CosmicDrifter',
    emoji: '\u{1F319}',
    gradientColors: ['#8B5CF6', '#EC4899'],
  },
  {
    id: 'ember-spark',
    name: 'EmberSpark',
    emoji: '\u{1F525}',
    gradientColors: ['#EF4444', '#F97316'],
  },
];

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

const AvatarSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>('urban-fox');

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar)!;

  const handleStartExploring = () => {
    // Navigate to main app after onboarding completes
    navigation.getParent()?.navigate('Main');
  };

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
          <Text style={styles.headerTitle}>Choose your avatar</Text>
          <Text style={styles.headerSubtitle}>
            Your public identity. Name changes with each location zone.
          </Text>
        </View>

        {/* Large Preview */}
        <View style={styles.previewSection}>
          <View style={styles.previewCircleOuter}>
            <LinearGradient
              colors={currentAvatar.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCircle}
            >
              <Text style={styles.previewEmoji}>{currentAvatar.emoji}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.previewName}>{currentAvatar.name}</Text>
          <View style={styles.zoneIndicator}>
            <View style={styles.greenDot} />
            <Text style={styles.zoneText}>Auto-changes per location zone</Text>
          </View>
        </View>

        {/* Avatar Grid */}
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.id;
            return (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  isSelected && styles.avatarCardSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={avatar.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </LinearGradient>
                <Text
                  style={[
                    styles.avatarName,
                    isSelected && styles.avatarNameSelected,
                  ]}
                >
                  {avatar.name}
                </Text>
                {isSelected && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.selectedCheckText}>{'\u2713'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Start Exploring Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleStartExploring}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[socialColors.primary, socialColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.continueButtonText}>Start Exploring</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AVATAR_CARD_WIDTH = '47%' as const;

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
    marginBottom: 28,
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

  // Preview
  previewSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  previewCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: socialColors.primary,
    padding: 3,
    marginBottom: 16,
  },
  previewCircle: {
    flex: 1,
    borderRadius: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 52,
  },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
    color: socialColors.text,
    marginBottom: 10,
  },
  zoneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: socialColors.success,
  },
  zoneText: {
    fontSize: 13,
    fontWeight: '400',
    color: socialColors.textTertiary,
  },

  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  avatarCard: {
    width: AVATAR_CARD_WIDTH,
    backgroundColor: socialColors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: socialColors.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  avatarCardSelected: {
    borderColor: socialColors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    shadowColor: socialColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  avatarName: {
    fontSize: 13,
    fontWeight: '500',
    color: socialColors.textTertiary,
  },
  avatarNameSelected: {
    color: socialColors.text,
    fontWeight: '600',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: socialColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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

export default AvatarSetupScreen;
