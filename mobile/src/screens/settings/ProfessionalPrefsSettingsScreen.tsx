import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ProfessionalPrefsSettings'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INDUSTRY_OPTIONS = ['Technology', 'Finance', 'Healthcare', 'Marketing', 'Other'] as const;
const LOOKING_FOR_OPTIONS = ['Collaborators', 'Mentors', 'Co-founders', 'Clients', 'Peers'] as const;
const COMPANY_STAGE_OPTIONS = ['Startup', 'Growth', 'Enterprise', 'Any'] as const;

// ===========================================================================
// ProfessionalPrefsSettingsScreen
// ===========================================================================
const ProfessionalPrefsSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['Technology']);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(['Collaborators']);
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

  const handleSave = () => {
    showAlert('Preferences Saved', 'Your professional preferences have been updated.');
    navigation.goBack();
  };

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
  ) => (
    <Pressable key={label} onPress={onPress}>
      {isSelected ? (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipSelected}
        >
          <Text style={styles.chipTextSelected}>{label}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.chipUnselected,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
            },
          ]}
        >
          <Text style={[styles.chipTextUnselected, { color: theme.colors.textTertiary }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
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
          Professional Preferences
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Badge */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
        >
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>PROFESSIONAL MODE</Text>
          </View>
        </Animated.View>

        {/* Industry */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Industry
          </Text>
          <Text style={[styles.sectionHint, { color: theme.colors.textTertiary }]}>
            Select all that apply
          </Text>
          <View style={styles.chipsRow}>
            {INDUSTRY_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedIndustries.includes(option),
                () => toggleIndustry(option),
              ),
            )}
          </View>
        </Animated.View>

        {/* Looking for */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Looking for
          </Text>
          <Text style={[styles.sectionHint, { color: theme.colors.textTertiary }]}>
            What kind of connections are you seeking?
          </Text>
          <View style={styles.chipsRow}>
            {LOOKING_FOR_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedLookingFor.includes(option),
                () => toggleLookingFor(option),
              ),
            )}
          </View>
        </Animated.View>

        {/* Company Stage */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Company stage preference
          </Text>
          <View style={styles.chipsRow}>
            {COMPANY_STAGE_OPTIONS.map((option) =>
              renderChip(
                option,
                selectedStage === option,
                () => setSelectedStage(option),
              ),
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(500))}
        style={styles.saveContainer}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handleSave}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
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

  // ---- Mode Badge ----
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    marginBottom: 24,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#0F766E',
  },

  // ---- Section ----
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 14,
  },

  // ---- Chips ----
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
  },
  chipTextUnselected: {
    fontSize: 14,
    fontWeight: '400',
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

export default ProfessionalPrefsSettingsScreen;
