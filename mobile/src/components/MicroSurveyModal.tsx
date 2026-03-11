import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { enteringAnim } from '../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SurveyOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

interface MicroSurveyModalProps {
  visible: boolean;
  onSubmit: (optionId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const SURVEY_OPTIONS: SurveyOption[] = [
  {
    id: 'coffee',
    emoji: '\u2615',
    title: 'Coffee chats',
    description: 'relaxed and conversational',
  },
  {
    id: 'activity',
    emoji: '\uD83C\uDFAF',
    title: 'Activities',
    description: 'doing something together',
  },
];

// ===========================================================================
// MicroSurveyModal
// ===========================================================================
const MicroSurveyModal: React.FC<MicroSurveyModalProps> = ({
  visible,
  onSubmit,
  onSkip,
  onClose,
}) => {
  const theme = useTheme();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit(selectedOption);
      setSelectedOption(null);
    }
  };

  const handleSkip = () => {
    setSelectedOption(null);
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          entering={enteringAnim(SlideInDown.duration(400).springify())}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Badge */}
          <Animated.View
            entering={enteringAnim(FadeIn.duration(400).delay(100))}
            style={styles.badgeRow}
          >
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                + Quick Question
              </Text>
            </View>
          </Animated.View>

          {/* Helper text */}
          <Animated.View
            entering={enteringAnim(FadeIn.duration(400).delay(150))}
          >
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              Helps improve your matches
            </Text>
          </Animated.View>

          {/* Question */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(500).delay(200))}
          >
            <Text style={[styles.questionText, { color: theme.colors.text }]}>
              Do you prefer coffee chats or activity-based meetups?
            </Text>
            <Text style={[styles.questionSubtitle, { color: theme.colors.textTertiary }]}>
              Social Mode {'\u00B7'} Question 1 of 1
            </Text>
          </Animated.View>

          {/* Option Cards */}
          <View style={styles.optionsContainer}>
            {SURVEY_OPTIONS.map((option, index) => {
              const isSelected = selectedOption === option.id;

              return (
                <Animated.View
                  key={option.id}
                  entering={enteringAnim(FadeInUp.duration(500).delay(300 + index * 100))}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedOption(option.id)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.optionCardGradient, { padding: 2 }]}
                      >
                        <View
                          style={[
                            styles.optionCardInner,
                            { backgroundColor: theme.colors.surfaceElevated },
                          ]}
                        >
                          <Text style={styles.optionEmoji}>{option.emoji}</Text>
                          <View style={styles.optionTextContainer}>
                            <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                              {option.title}
                            </Text>
                            <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                              {' \u2014 '}{option.description}
                            </Text>
                          </View>
                          <View style={[styles.radioOuter, { borderColor: theme.colors.primary }]}>
                            <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                          </View>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <View style={styles.optionTextContainer}>
                          <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                            {option.title}
                          </Text>
                          <Text style={[styles.optionDescription, { color: theme.colors.textTertiary }]}>
                            {' \u2014 '}{option.description}
                          </Text>
                        </View>
                        <View style={[styles.radioOuter, { borderColor: theme.colors.border }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Submit Button */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(500).delay(500))}
            style={styles.actionsContainer}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={!selectedOption}
            >
              <LinearGradient
                colors={
                  selectedOption
                    ? [theme.colors.primary, theme.colors.secondary]
                    : [theme.colors.border, theme.colors.border]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.submitButton,
                  !selectedOption && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleSkip}
              style={styles.skipButton}
            >
              <Text style={[styles.skipText, { color: theme.colors.textTertiary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ===========================================================================
// Styles
// ===========================================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },

  // ---- Sheet ----
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // ---- Badge ----
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },

  // ---- Question ----
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
  },

  // ---- Options ----
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  optionCardGradient: {
    borderRadius: 16,
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ---- Actions ----
  actionsContainer: {
    alignItems: 'center',
  },
  submitButton: {
    width: SCREEN_WIDTH - 48,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default MicroSurveyModal;
