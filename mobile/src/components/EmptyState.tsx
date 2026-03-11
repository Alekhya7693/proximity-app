import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { enteringAnim } from '../utils/animations';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}

// Floating particle component
const Particle: React.FC<{
  delay: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
}> = ({ delay, startX, startY, size, color }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-30, { duration: 2400 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  emoji = '\uD83E\uDDED',
}) => {
  const theme = useTheme();

  const particles = [
    { delay: 0, startX: 40, startY: 60, size: 6, color: theme.colors.primaryLight },
    { delay: 400, startX: 180, startY: 30, size: 4, color: theme.colors.secondary },
    { delay: 800, startX: 100, startY: 80, size: 5, color: theme.colors.accent },
    { delay: 1200, startX: 240, startY: 70, size: 7, color: theme.colors.primaryLight },
    { delay: 600, startX: 280, startY: 50, size: 4, color: theme.colors.secondary },
    { delay: 1000, startX: 60, startY: 20, size: 5, color: theme.colors.accent },
  ];

  return (
    <View style={styles.container}>
      {/* Floating particles background */}
      <View style={styles.particlesContainer}>
        {particles.map((p, i) => (
          <Particle
            key={i}
            delay={p.delay}
            startX={p.startX}
            startY={p.startY}
            size={p.size}
            color={p.color}
          />
        ))}
      </View>

      {/* Emoji icon */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(600).delay(100))}
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
        ]}
      >
        <Text style={styles.emojiIcon}>{emoji}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={enteringAnim(FadeIn.duration(500).delay(250))}
        style={[
          styles.title,
          { color: theme.colors.text },
        ]}
      >
        {title}
      </Animated.Text>

      {/* Message */}
      <Animated.Text
        entering={enteringAnim(FadeIn.duration(500).delay(400))}
        style={[
          styles.message,
          { color: theme.colors.textSecondary },
        ]}
      >
        {message}
      </Animated.Text>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Animated.View entering={enteringAnim(FadeIn.duration(500).delay(550))}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  particlesContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 120,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 22,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 28,
    lineHeight: 22,
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 28,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default EmptyState;
