import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'SocialPrefs'>;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

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

const MEET_OPTIONS = ['Everyone', 'Women', 'Men', 'Non-binary'];
const INTERACTION_OPTIONS = ['Coffee chats', 'Activities', 'Both'];

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

const SocialPrefsScreen: React.FC<Props> = ({ navigation }) => {
  const [meetPref, setMeetPref] = useState<string>('Everyone');
  const [ageRange, setAgeRange] = useState<[number, number]>([21, 38]);
  const [interactionStyle, setInteractionStyle] = useState<string>('Both');

  const handleContinue = () => {
    navigation.navigate('ProfessionalPrefs');
  };

  const handleAgeMinDecrease = useCallback(() => {
    setAgeRange(([min, max]) => [Math.max(18, min - 1), max]);
  }, []);

  const handleAgeMinIncrease = useCallback(() => {
    setAgeRange(([min, max]) => [Math.min(max - 1, min + 1), max]);
  }, []);

  const handleAgeMaxDecrease = useCallback(() => {
    setAgeRange(([min, max]) => [min, Math.max(min + 1, max - 1)]);
  }, []);

  const handleAgeMaxIncrease = useCallback(() => {
    setAgeRange(([min, max]) => [min, Math.min(99, max + 1)]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

        {/* Mode Badge */}
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>SOCIAL MODE</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Social preferences</Text>
        </View>

        {/* Who do you want to meet? */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who do you want to meet?</Text>
          <View style={styles.chipsRow}>
            {MEET_OPTIONS.map((option) => {
              const isSelected = meetPref === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMeetPref(option)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[socialColors.primary, socialColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chipSelected}
                    >
                      <Text style={styles.chipTextSelected}>{option}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipUnselected}>
                      <Text style={styles.chipTextUnselected}>{option}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age range</Text>
          <View style={styles.ageRangeContainer}>
            {/* Min age control */}
            <View style={styles.ageControl}>
              <TouchableOpacity
                style={styles.ageButton}
                onPress={handleAgeMinDecrease}
                activeOpacity={0.7}
              >
                <Text style={styles.ageButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.ageValueBox}>
                <Text style={styles.ageValueText}>{ageRange[0]}</Text>
              </View>
              <TouchableOpacity
                style={styles.ageButton}
                onPress={handleAgeMinIncrease}
                activeOpacity={0.7}
              >
                <Text style={styles.ageButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.ageDash}>to</Text>

            {/* Max age control */}
            <View style={styles.ageControl}>
              <TouchableOpacity
                style={styles.ageButton}
                onPress={handleAgeMaxDecrease}
                activeOpacity={0.7}
              >
                <Text style={styles.ageButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.ageValueBox}>
                <Text style={styles.ageValueText}>{ageRange[1]}</Text>
              </View>
              <TouchableOpacity
                style={styles.ageButton}
                onPress={handleAgeMaxIncrease}
                activeOpacity={0.7}
              >
                <Text style={styles.ageButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Visual range bar */}
          <View style={styles.rangeBarContainer}>
            <View style={styles.rangeBarTrack}>
              <View
                style={[
                  styles.rangeBarFill,
                  {
                    left: `${((ageRange[0] - 18) / (99 - 18)) * 100}%`,
                    right: `${((99 - ageRange[1]) / (99 - 18)) * 100}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabelText}>{ageRange[0]}</Text>
              <Text style={styles.rangeLabelText}>{ageRange[1]}</Text>
            </View>
          </View>
        </View>

        {/* Preferred interaction style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred interaction style</Text>
          <View style={styles.chipsRow}>
            {INTERACTION_OPTIONS.map((option) => {
              const isSelected = interactionStyle === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setInteractionStyle(option)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[socialColors.primary, socialColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chipSelected}
                    >
                      <Text style={styles.chipTextSelected}>{option}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipUnselected}>
                      <Text style={styles.chipTextUnselected}>{option}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
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

  // Mode Badge
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    marginBottom: 16,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: socialColors.secondary,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: socialColors.text,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: socialColors.text,
    marginBottom: 14,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipSelected: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  chipTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chipUnselected: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: socialColors.border,
    backgroundColor: socialColors.surface,
  },
  chipTextUnselected: {
    fontSize: 14,
    fontWeight: '400',
    color: socialColors.textTertiary,
  },

  // Age Range
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  ageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: socialColors.surface,
    borderWidth: 1.5,
    borderColor: socialColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: socialColors.primary,
  },
  ageValueBox: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: socialColors.surface,
    borderWidth: 1.5,
    borderColor: socialColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: socialColors.text,
  },
  ageDash: {
    fontSize: 16,
    fontWeight: '500',
    color: socialColors.textTertiary,
  },

  // Range Bar
  rangeBarContainer: {
    paddingHorizontal: 4,
  },
  rangeBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: socialColors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  rangeBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: socialColors.primary,
    borderRadius: 2,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeLabelText: {
    fontSize: 12,
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

export default SocialPrefsScreen;
