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

type Props = RootStackScreenProps<'SocialPrefsSettings'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MEET_OPTIONS = ['Everyone', 'Women', 'Men', 'Non-binary'] as const;
const INTERACTION_OPTIONS = ['Coffee chats', 'Activities', 'Both'] as const;

// ===========================================================================
// SocialPrefsSettingsScreen
// ===========================================================================
const SocialPrefsSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [meetPref, setMeetPref] = useState<string>('Everyone');
  const [ageRange, setAgeRange] = useState<[number, number]>([21, 38]);
  const [interactionStyle, setInteractionStyle] = useState<string>('Both');

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

  const handleSave = () => {
    showAlert('Preferences Saved', 'Your social preferences have been updated.');
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
          Social Preferences
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
            <Text style={styles.modeBadgeText}>SOCIAL MODE</Text>
          </View>
        </Animated.View>

        {/* Who do you want to meet? */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Who do you want to meet?
          </Text>
          <View style={styles.chipsRow}>
            {MEET_OPTIONS.map((option) =>
              renderChip(option, meetPref === option, () => setMeetPref(option)),
            )}
          </View>
        </Animated.View>

        {/* Age Range */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Age range
          </Text>
          <View style={styles.ageRangeContainer}>
            {/* Min age control */}
            <View style={styles.ageControl}>
              <TouchableOpacity
                style={[styles.ageButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={handleAgeMinDecrease}
                activeOpacity={0.7}
              >
                <Text style={[styles.ageButtonText, { color: theme.colors.primary }]}>-</Text>
              </TouchableOpacity>
              <View style={[styles.ageValueBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.primary }]}>
                <Text style={[styles.ageValueText, { color: theme.colors.text }]}>{ageRange[0]}</Text>
              </View>
              <TouchableOpacity
                style={[styles.ageButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={handleAgeMinIncrease}
                activeOpacity={0.7}
              >
                <Text style={[styles.ageButtonText, { color: theme.colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.ageDash, { color: theme.colors.textTertiary }]}>to</Text>

            {/* Max age control */}
            <View style={styles.ageControl}>
              <TouchableOpacity
                style={[styles.ageButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={handleAgeMaxDecrease}
                activeOpacity={0.7}
              >
                <Text style={[styles.ageButtonText, { color: theme.colors.primary }]}>-</Text>
              </TouchableOpacity>
              <View style={[styles.ageValueBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.primary }]}>
                <Text style={[styles.ageValueText, { color: theme.colors.text }]}>{ageRange[1]}</Text>
              </View>
              <TouchableOpacity
                style={[styles.ageButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={handleAgeMaxIncrease}
                activeOpacity={0.7}
              >
                <Text style={[styles.ageButtonText, { color: theme.colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Visual range bar */}
          <View style={styles.rangeBarContainer}>
            <View style={[styles.rangeBarTrack, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.rangeBarFill,
                  {
                    backgroundColor: theme.colors.primary,
                    left: `${((ageRange[0] - 18) / (99 - 18)) * 100}%`,
                    right: `${((99 - ageRange[1]) / (99 - 18)) * 100}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={[styles.rangeLabelText, { color: theme.colors.textTertiary }]}>
                {ageRange[0]}
              </Text>
              <Text style={[styles.rangeLabelText, { color: theme.colors.textTertiary }]}>
                {ageRange[1]}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Preferred interaction style */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Preferred interaction style
          </Text>
          <View style={styles.chipsRow}>
            {INTERACTION_OPTIONS.map((option) =>
              renderChip(option, interactionStyle === option, () =>
                setInteractionStyle(option),
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    marginBottom: 24,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#EC4899',
  },

  // ---- Section ----
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
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

  // ---- Age Range ----
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  ageValueBox: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValueText: {
    fontSize: 18,
    fontWeight: '700',
  },
  ageDash: {
    fontSize: 16,
    fontWeight: '500',
  },

  // ---- Range Bar ----
  rangeBarContainer: {
    paddingHorizontal: 4,
  },
  rangeBarTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  rangeBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
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

export default SocialPrefsSettingsScreen;
