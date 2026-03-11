import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import { useTheme } from '../../theme/ThemeContext';
import { discoveryApi } from '../../api/discovery';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'SocialPreferences'>;

const SOCIAL_CATEGORIES = [
  {
    title: 'Activities',
    emoji: '\u{1F3C3}',
    interests: [
      'Hiking', 'Running', 'Yoga', 'Dancing', 'Gaming', 'Cooking',
      'Photography', 'Travel', 'Camping', 'Surfing', 'Cycling', 'Gym',
    ],
  },
  {
    title: 'Entertainment',
    emoji: '\u{1F3AC}',
    interests: [
      'Movies', 'Music', 'Concerts', 'Theater', 'Comedy', 'Reading',
      'Podcasts', 'Anime', 'Board Games', 'Art', 'Museums', 'Festivals',
    ],
  },
  {
    title: 'Lifestyle',
    emoji: '\u2615',
    interests: [
      'Coffee', 'Wine', 'Foodie', 'Fitness', 'Meditation', 'Volunteering',
      'Pets', 'Gardening', 'Fashion', 'DIY', 'Sustainability', 'Spirituality',
    ],
  },
];

const TAG_COLORS = [
  { border: '#6C5CE7', bg: 'rgba(108, 92, 231, 0.12)', text: '#6C5CE7' },
  { border: '#FD79A8', bg: 'rgba(253, 121, 168, 0.12)', text: '#E84393' },
  { border: '#00CEC9', bg: 'rgba(0, 206, 201, 0.12)', text: '#00B894' },
  { border: '#F39C12', bg: 'rgba(243, 156, 18, 0.12)', text: '#E17055' },
];

const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 15;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SocialPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { updateUser } = useAuthStore();

  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableVibes, setAvailableVibes] = useState<string[]>([]);

  useEffect(() => {
    loadVibes();
  }, []);

  const loadVibes = async () => {
    try {
      const vibes = await discoveryApi.getVibes('social');
      setAvailableVibes(vibes);
    } catch {
      // Use default categories if API fails
    }
  };

  const toggleInterest = useCallback((interest: string) => {
    setSelected((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= MAX_SELECTIONS) {
        showAlert('Limit Reached', `You can select up to ${MAX_SELECTIONS} interests.`);
        return prev;
      }
      return [...prev, interest];
    });
  }, []);

  const handleContinue = async () => {
    if (selected.length < MIN_SELECTIONS) {
      showAlert('Select More', `Please select at least ${MIN_SELECTIONS} interests.`);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.updateProfile({ socialInterests: selected });
      updateUser({ socialInterests: selected });
      navigation.navigate('ProfessionalPreferences');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save preferences';
      showAlert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTagColor = (interest: string) => {
    const idx = selected.indexOf(interest);
    if (idx === -1) return null;
    return TAG_COLORS[idx % TAG_COLORS.length];
  };

  const filteredVibes = availableVibes.filter(
    (v) => !SOCIAL_CATEGORIES.some((c) => c.interests.includes(v)),
  );

  const canContinue = selected.length >= MIN_SELECTIONS;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <Animated.View
          entering={enteringAnim(FadeIn.duration(400))}
          style={styles.progressContainer}
        >
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: '50%',
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginTop: 8 },
            ]}
          >
            Step 2 of 4
          </Text>
        </Animated.View>

        {/* Header */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>{'\u{1F389}'}</Text>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
            Social Interests
          </Text>
          <Text
            style={[
              theme.typography.body2,
              { color: theme.colors.textSecondary, marginTop: 6 },
            ]}
          >
            Pick what sparks joy -- we'll connect you with nearby people who share your passions
          </Text>
        </Animated.View>

        {/* Selection Counter Badge */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.counterRow}
        >
          <View
            style={[
              styles.counterBadge,
              {
                backgroundColor: canContinue
                  ? 'rgba(0, 184, 148, 0.12)'
                  : 'rgba(108, 92, 231, 0.10)',
                borderColor: canContinue
                  ? 'rgba(0, 184, 148, 0.3)'
                  : 'rgba(108, 92, 231, 0.2)',
              },
            ]}
          >
            <Text
              style={[
                theme.typography.buttonSmall,
                {
                  color: canContinue ? theme.colors.success : theme.colors.primary,
                },
              ]}
            >
              {selected.length}/{MAX_SELECTIONS} selected
            </Text>
          </View>
          {selected.length > 0 && selected.length < MIN_SELECTIONS && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 10 },
              ]}
            >
              {MIN_SELECTIONS - selected.length} more needed
            </Text>
          )}
        </Animated.View>

        {/* Categories */}
        {SOCIAL_CATEGORIES.map((category, catIdx) => (
          <Animated.View
            key={category.title}
            entering={enteringAnim(FadeInDown.duration(500).delay(300 + catIdx * 100))}
            style={styles.category}
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text
                style={[
                  theme.typography.subtitle1,
                  { color: theme.colors.text },
                ]}
              >
                {category.title}
              </Text>
            </View>
            <View style={styles.tagsRow}>
              {category.interests.map((interest, tagIdx) => {
                const isSelected = selected.includes(interest);
                const tagColor = getTagColor(interest);
                return (
                  <AnimatedPressable
                    key={interest}
                    entering={enteringAnim(FadeIn.duration(300).delay(350 + catIdx * 100 + tagIdx * 30))}
                    onPress={() => toggleInterest(interest)}
                    style={[
                      styles.tag,
                      isSelected && tagColor
                        ? {
                            backgroundColor: tagColor.bg,
                            borderColor: tagColor.border,
                          }
                        : {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.body2,
                        {
                          color: isSelected && tagColor
                            ? tagColor.text
                            : theme.colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {interest}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>
        ))}

        {/* Suggested Vibes from API */}
        {filteredVibes.length > 0 && (
          <Animated.View
            entering={enteringAnim(FadeInDown.duration(500).delay(600))}
            style={styles.category}
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryEmoji}>{'\u2728'}</Text>
              <Text
                style={[
                  theme.typography.subtitle1,
                  { color: theme.colors.text },
                ]}
              >
                Suggested
              </Text>
            </View>
            <View style={styles.tagsRow}>
              {filteredVibes.map((vibe, tagIdx) => {
                const isSelected = selected.includes(vibe);
                const tagColor = getTagColor(vibe);
                return (
                  <AnimatedPressable
                    key={vibe}
                    entering={enteringAnim(FadeIn.duration(300).delay(650 + tagIdx * 30))}
                    onPress={() => toggleInterest(vibe)}
                    style={[
                      styles.tag,
                      isSelected && tagColor
                        ? {
                            backgroundColor: tagColor.bg,
                            borderColor: tagColor.border,
                          }
                        : {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.body2,
                        {
                          color: isSelected && tagColor
                            ? tagColor.text
                            : theme.colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {vibe}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Continue Button */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(700))}
          style={styles.buttonWrapper}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: canContinue
                  ? theme.colors.primary
                  : theme.colors.border,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <View style={styles.buttonContent}>
                <Text
                  style={[
                    theme.typography.button,
                    {
                      color: canContinue
                        ? theme.colors.textInverse
                        : theme.colors.textTertiary,
                    },
                  ]}
                >
                  Continue
                </Text>
                <Text style={styles.buttonEmoji}>{'\u2713'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  header: {
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  category: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonWrapper: {
    marginTop: 8,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonEmoji: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default SocialPreferencesScreen;
