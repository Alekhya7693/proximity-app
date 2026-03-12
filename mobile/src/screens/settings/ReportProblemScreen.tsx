import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
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

type Props = RootStackScreenProps<'ReportProblem'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORY_OPTIONS = ['Bug', 'Feature Request', 'Other'] as const;
type Category = (typeof CATEGORY_OPTIONS)[number];

// ===========================================================================
// ReportProblemScreen
// ===========================================================================
const ReportProblemScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');

  const canSubmit = category !== null && description.trim().length >= 10;

  const handleSubmit = () => {
    if (!canSubmit) return;
    showAlert(
      'Report Submitted',
      'Thank you for your feedback. We will review your report and get back to you.',
    );
    navigation.goBack();
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
          Report a Problem
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Picker */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            CATEGORY
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((option) => {
              const isSelected = category === option;
              return (
                <Pressable key={option} onPress={() => setCategory(option)}>
                  {isSelected ? (
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.categoryChipSelected}
                    >
                      <Text style={styles.categoryChipTextSelected}>
                        {option}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.categoryChipUnselected,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipTextUnselected,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        {option}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            DESCRIPTION
          </Text>
          <View
            style={[
              styles.textAreaContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: theme.colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please describe the issue or suggestion in detail (min 10 characters)..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
          <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
            {description.length}/1000
          </Text>
        </Animated.View>

        {/* Info Note */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}
        >
          <Text style={styles.infoIcon}>{'\u{1F4E7}'}</Text>
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            We review all reports and typically respond within 24 hours. For
            urgent safety concerns, please select "Bug" and describe the issue.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(400))}
        style={styles.submitContainer}
      >
        <TouchableOpacity
          activeOpacity={canSubmit ? 0.85 : 1}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <LinearGradient
            colors={
              canSubmit
                ? [theme.colors.primary, theme.colors.secondary]
                : ['#4B5563', '#6B7280']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitButton, !canSubmit && { opacity: 0.6 }]}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
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
    marginBottom: 12,
    marginLeft: 4,
  },

  // ---- Category Chips ----
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChipSelected: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  categoryChipTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryChipUnselected: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  categoryChipTextUnselected: {
    fontSize: 14,
    fontWeight: '400',
  },

  // ---- Text Area ----
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    minHeight: 160,
  },
  textArea: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    minHeight: 128,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
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

  // ---- Submit ----
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default ReportProblemScreen;
