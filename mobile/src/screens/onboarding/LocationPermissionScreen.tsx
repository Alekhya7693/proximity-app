import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import { useTheme } from '../../theme/ThemeContext';
import { locationService } from '../../services/location';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { storage } from '../../utils/storage';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'LocationPermission'>;

const FEATURES = [
  {
    emoji: '\uD83D\uDD0D',
    title: 'Discover Nearby',
    description: 'Find compatible people in your vicinity',
    bgColor: '#EDE7F6',
  },
  {
    emoji: '\uD83D\uDD14',
    title: 'Proximity Alerts',
    description: 'Get notified when a great match is nearby',
    bgColor: '#E8F5E9',
  },
  {
    emoji: '\uD83D\uDCCF',
    title: 'Distance Info',
    description: 'See how far away potential connections are',
    bgColor: '#FFF3E0',
  },
];

const LocationPermissionScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const { updateUser } = useAuthStore();
  const { locationPermissionGranted } = useLocationStore();

  const [isLoading, setIsLoading] = useState(false);

  // Progress bar animation
  const progressWidth = useSharedValue(0);

  // Pulsing rings animation
  const ringScale1 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0.4);
  const ringScale2 = useSharedValue(1);
  const ringOpacity2 = useSharedValue(0.25);

  useEffect(() => {
    // Animate progress bar to 100%
    progressWidth.value = withTiming(1, { duration: 800 });

    // Pulsing ring 1
    ringScale1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.8, { duration: 1800 }),
      ),
      -1,
      false,
    );
    ringOpacity1.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(0, { duration: 1800 }),
      ),
      -1,
      false,
    );

    // Pulsing ring 2 (delayed effect via different scale)
    ringScale2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(2.2, { duration: 2200 }),
      ),
      -1,
      false,
    );
    ringOpacity2.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 0 }),
        withTiming(0, { duration: 2200 }),
      ),
      -1,
      false,
    );
  }, [progressWidth, ringScale1, ringOpacity1, ringScale2, ringOpacity2]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  const handleEnableLocation = async () => {
    // If already granted, just complete onboarding
    if (locationPermissionGranted) {
      setIsLoading(true);
      try {
        await locationService.getCurrentLocation();
        await storage.setOnboardingComplete(true);
        updateUser({ isOnboardingComplete: true });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const granted = await locationService.requestPermissions();

      if (!granted) {
        showAlert(
          'Permission Denied',
          'Location access is essential for Proximity to work. Please enable it in your device settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        setIsLoading(false);
        return;
      }

      // Get initial location
      await locationService.getCurrentLocation();

      // Mark onboarding complete
      await storage.setOnboardingComplete(true);
      updateUser({ isOnboardingComplete: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to get location permission';
      showAlert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await storage.setOnboardingComplete(true);
    updateUser({ isOnboardingComplete: true });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Progress Bar */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={styles.progressBarContainer}
      >
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: theme.colors.primary },
              progressAnimStyle,
            ]}
          />
        </View>
        <Text
          style={[
            styles.stepLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          Step 4 of 4
        </Text>
      </Animated.View>

      <View style={styles.content}>
        {/* Header with animated location pin */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(600).delay(100))}
          style={styles.header}
        >
          <View style={styles.iconArea}>
            {/* Pulsing ring 2 (outer) */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRingOuter,
                { borderColor: theme.colors.primary },
                ring2Style,
              ]}
            />
            {/* Pulsing ring 1 (inner) */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRingInner,
                { borderColor: theme.colors.primary },
                ring1Style,
              ]}
            />
            {/* Center icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.pinEmoji}>{'\uD83D\uDCCD'}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              { color: theme.colors.text },
            ]}
          >
            Enable Location
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Help us connect you with amazing people nearby
          </Text>
        </Animated.View>

        {/* Feature Cards */}
        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={enteringAnim(FadeInDown.duration(500).delay(300 + index * 120))}
            >
              <View
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureEmojiContainer,
                    { backgroundColor: feature.bgColor },
                  ]}
                >
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text
                    style={[
                      styles.featureTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={[
                      styles.featureDescription,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Privacy Note */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(700))}
          style={[
            styles.privacyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <Text style={styles.privacyLock}>{'\uD83D\uDD12'}</Text>
          <Text
            style={[
              styles.privacyText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Your exact location is never shared. Only approximate distance is
            shown to other users.
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={enteringAnim(FadeInDown.duration(500).delay(850))}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleEnableLocation}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonEmoji}>{'\uD83D\uDCCD'}</Text>
                <Text
                  style={[
                    styles.buttonText,
                    { color: theme.colors.textInverse },
                  ]}
                >
                  {locationPermissionGranted
                    ? 'Continue with Location'
                    : 'Enable Location'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Skip Link */}
        <Animated.View entering={enteringAnim(FadeIn.duration(400).delay(1000))}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.skipText,
                { color: theme.colors.textTertiary },
              ]}
            >
              Maybe Later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  pulseRingInner: {
    width: 90,
    height: 90,
  },
  pulseRingOuter: {
    width: 110,
    height: 110,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pinEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 21,
  },
  features: {
    marginBottom: 20,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  privacyLock: {
    fontSize: 18,
    marginRight: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
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
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LocationPermissionScreen;
