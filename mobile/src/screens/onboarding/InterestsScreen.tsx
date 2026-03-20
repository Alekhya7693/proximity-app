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

type Props = OnboardingScreenProps<'Interests'>;

const TOTAL_STEPS = 6;
const CURRENT_STEP = 3;
const MIN_SELECTIONS = 3;

const socialColors = {
  background: '#0B2545',
  surface: '#133E68',
  primary: '#0EA5E9',
  secondary: '#F97316',
  text: '#FFFFFF',
  textSecondary: '#38BDF8',
  textTertiary: '#6B7280',
  border: '#1B5B8A',
  borderLight: '#0F3660',
};

interface InterestCategory {
  label: string;
  interests: string[];
}

const CATEGORIES: InterestCategory[] = [
  {
    label: 'LIFESTYLE',
    interests: ['Travel', 'Fitness', 'Coffee', 'Food', 'Photography', 'Music', 'Gaming'],
  },
  {
    label: 'SOCIAL',
    interests: ['Dating', 'Friends', 'Conversation', 'Events', 'Group Activities'],
  },
  {
    label: 'PROFESSIONAL',
    interests: ['Tech', 'Startups', 'AI', 'Finance'],
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

const InterestsScreen: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = useCallback((interest: string) => {
    setSelected((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  }, []);

  const canContinue = selected.length >= MIN_SELECTIONS;

  const handleContinue = () => {
    if (!canContinue) return;
    navigation.navigate('SocialPrefs');
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
          <Text style={styles.headerTitle}>Your interests</Text>
          <Text style={styles.headerSubtitle}>
            Select at least 3. These improve your compatibility score.
          </Text>
        </View>

        {/* Counter */}
        <View style={styles.counterRow}>
          <View
            style={[
              styles.counterBadge,
              canContinue ? styles.counterBadgeReady : styles.counterBadgePending,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                { color: canContinue ? '#10B981' : socialColors.primary },
              ]}
            >
              {selected.length} selected
            </Text>
          </View>
          {selected.length > 0 && selected.length < MIN_SELECTIONS && (
            <Text style={styles.counterHint}>
              {MIN_SELECTIONS - selected.length} more needed
            </Text>
          )}
        </View>

        {/* Categories */}
        {CATEGORIES.map((category) => (
          <View key={category.label} style={styles.category}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <View style={styles.tagsRow}>
              {category.interests.map((interest) => {
                const isSelected = selected.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={[socialColors.primary, socialColors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tagSelected}
                      >
                        <Text style={styles.tagTextSelected}>{interest}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.tagUnselected}>
                        <Text style={styles.tagTextUnselected}>{interest}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!canContinue}
        >
          <LinearGradient
            colors={
              canContinue
                ? [socialColors.primary, socialColors.secondary]
                : [socialColors.border, socialColors.border]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text
              style={[
                styles.continueButtonText,
                !canContinue && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
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
    marginBottom: 24,
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

  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterBadgeReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  counterBadgePending: {
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  counterHint: {
    fontSize: 12,
    fontWeight: '400',
    color: socialColors.textTertiary,
  },

  // Categories
  category: {
    marginBottom: 28,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: socialColors.textTertiary,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Tags
  tagSelected: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tagTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagUnselected: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: socialColors.border,
    backgroundColor: socialColors.surface,
  },
  tagTextUnselected: {
    fontSize: 14,
    fontWeight: '400',
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
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
  continueButtonTextDisabled: {
    color: socialColors.textTertiary,
  },
});

export default InterestsScreen;
