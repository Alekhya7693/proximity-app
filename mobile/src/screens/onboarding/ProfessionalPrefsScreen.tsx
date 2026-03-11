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

type Props = OnboardingScreenProps<'ProfessionalPrefs'>;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

const professionalColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  secondary: '#0284C7',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

const INDUSTRY_OPTIONS = ['Technology', 'Finance', 'Healthcare', 'Marketing', 'Other'];
const LOOKING_FOR_OPTIONS = ['Collaborators', 'Mentors', 'Co-founders', 'Clients', 'Peers'];
const COMPANY_STAGE_OPTIONS = ['Startup', 'Growth', 'Enterprise', 'Any'];

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
                i < currentStep
                  ? professionalColors.primary
                  : professionalColors.borderLight,
            },
          ]}
        />
      ))}
    </View>
    <Text style={styles.stepLabel}>STEP {currentStep} OF {totalSteps}</Text>
  </View>
);

const ProfessionalPrefsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('Any');

  const toggleIndustry = useCallback((item: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }, []);

  const toggleLookingFor = useCallback((item: string) => {
    setSelectedLookingFor((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }, []);

  const handleContinue = () => {
    navigation.navigate('AvatarSetup');
  };

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
  ) => (
    <Pressable key={label} onPress={onPress}>
      <View
        style={[
          styles.chip,
          isSelected ? styles.chipSelected : styles.chipUnselected,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );

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
          <Text style={styles.modeBadgeText}>PROFESSIONAL MODE</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Professional preferences</Text>
        </View>

        {/* Industry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Industry</Text>
          <View style={styles.chipsRow}>
            {INDUSTRY_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedIndustries.includes(option),
                () => toggleIndustry(option),
              ),
            )}
          </View>
        </View>

        {/* Looking for */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Looking for</Text>
          <View style={styles.chipsRow}>
            {LOOKING_FOR_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedLookingFor.includes(option),
                () => toggleLookingFor(option),
              ),
            )}
          </View>
        </View>

        {/* Company stage preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company stage preference</Text>
          <View style={styles.chipsRow}>
            {COMPANY_STAGE_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedStage === option,
                () => setSelectedStage(option),
              ),
            )}
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
            colors={[professionalColors.primary, professionalColors.secondary]}
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
    backgroundColor: professionalColors.background,
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
    color: professionalColors.textTertiary,
  },

  // Mode Badge
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    marginBottom: 16,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: professionalColors.primary,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: professionalColors.text,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: professionalColors.text,
    marginBottom: 14,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    borderColor: professionalColors.primary,
  },
  chipUnselected: {
    backgroundColor: professionalColors.surface,
    borderColor: professionalColors.border,
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    fontWeight: '600',
    color: professionalColors.primary,
  },
  chipTextUnselected: {
    fontWeight: '400',
    color: professionalColors.textSecondary,
  },

  // Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: professionalColors.background,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: professionalColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
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

export default ProfessionalPrefsScreen;
