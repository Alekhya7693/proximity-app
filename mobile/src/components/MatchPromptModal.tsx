import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { DiscoveryProfile } from '../api/discovery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#FD79A8',
  accent: '#00CEC9',
};

// ---------- Particle / floating element config ----------

const PARTICLE_EMOJIS = ['💜', '💕', '✨', '🎉', '💫', '❤️', '🎊', '💖', '⭐'];
const NUM_PARTICLES = 18;

interface ParticleConfig {
  emoji: string;
  startX: number;
  startY: number;
  driftX: number;
  duration: number;
  delay: number;
  size: number;
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    emoji: PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length],
    startX: Math.random() * SCREEN_WIDTH,
    startY: SCREEN_HEIGHT + 20 + Math.random() * 100,
    driftX: (Math.random() - 0.5) * 120,
    duration: 3000 + Math.random() * 3000,
    delay: Math.random() * 2500,
    size: 16 + Math.random() * 16,
  }));
}

// ---------- Single floating particle ----------

const FloatingParticle: React.FC<{ config: ParticleConfig }> = ({ config }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -(SCREEN_HEIGHT + 140)],
    );
    const translateX = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, config.driftX, config.driftX * 0.6],
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.1, 0.7, 1],
      [0, 1, 0.8, 0],
    );
    const rotate = interpolate(
      progress.value,
      [0, 1],
      [0, 360],
    );
    return {
      transform: [
        { translateY },
        { translateX },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: config.startX,
          top: config.startY,
          fontSize: config.size,
        },
        animatedStyle,
      ]}
    >
      {config.emoji}
    </Animated.Text>
  );
};

// ---------- Pulsing ring around photos ----------

const PulsingRing: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.18]);
    const opacity = interpolate(pulse.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: COLORS.primaryLight,
        },
        animatedStyle,
      ]}
    />
  );
};

// ---------- Main component ----------

interface MatchPromptModalProps {
  visible: boolean;
  matchedUser: DiscoveryProfile | null;
  matchId: string;
  onSayHi: (matchId: string) => void;
  onMaybeLater: () => void;
}

const MatchPromptModal: React.FC<MatchPromptModalProps> = ({
  visible,
  matchedUser,
  matchId,
  onSayHi,
  onMaybeLater,
}) => {
  const theme = useTheme();
  const particles = useMemo(() => generateParticles(), []);

  // --- entrance animations ---
  const containerScale = useSharedValue(0.5);
  const containerOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.3);
  const titleOpacity = useSharedValue(0);
  const photosTranslateY = useSharedValue(40);
  const photosOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset
      containerScale.value = 0.5;
      containerOpacity.value = 0;
      titleScale.value = 0.3;
      titleOpacity.value = 0;
      photosTranslateY.value = 40;
      photosOpacity.value = 0;
      buttonsTranslateY.value = 30;
      buttonsOpacity.value = 0;
      heartScale.value = 0;
      shimmer.value = 0;

      // Container entrance
      containerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      containerOpacity.value = withTiming(1, { duration: 300 });

      // Title entrance (delayed)
      titleScale.value = withDelay(
        200,
        withSpring(1, { damping: 8, stiffness: 120 }),
      );
      titleOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

      // Photos entrance
      photosTranslateY.value = withDelay(
        400,
        withSpring(0, { damping: 14, stiffness: 90 }),
      );
      photosOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

      // Heart bounce
      heartScale.value = withDelay(
        600,
        withSequence(
          withSpring(1.4, { damping: 6, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 100 }),
        ),
      );

      // Buttons entrance
      buttonsTranslateY.value = withDelay(
        700,
        withSpring(0, { damping: 14, stiffness: 90 }),
      );
      buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

      // Continuous shimmer on button
      shimmer.value = withDelay(
        1000,
        withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    }
  }, [visible]);

  // --- animated styles ---

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  const photosAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: photosTranslateY.value }],
    opacity: photosOpacity.value,
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsTranslateY.value }],
    opacity: buttonsOpacity.value,
  }));

  const buttonShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-80, 80]);
    return {
      transform: [{ translateX }],
    };
  });

  if (!matchedUser) return null;

  const matchPhoto = matchedUser.profilePhotos[0] || '';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Floating particles layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p, i) => (
            <FloatingParticle key={i} config={p} />
          ))}
        </View>

        {/* Main card */}
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.colors.surfaceElevated },
            containerAnimStyle,
          ]}
        >
          {/* --- Title --- */}
          <Animated.View style={[styles.titleContainer, titleAnimStyle]}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.titleText}>It's a Match!</Text>
            <Text
              style={[
                styles.subtitleText,
                { color: theme.colors.textSecondary },
              ]}
            >
              You and {matchedUser.displayName} liked each other
            </Text>
          </Animated.View>

          {/* --- Side-by-side photos --- */}
          <Animated.View style={[styles.photosRow, photosAnimStyle]}>
            {/* Current user placeholder */}
            <View style={styles.photoWrapper}>
              <PulsingRing size={PHOTO_SIZE + 16} delay={0} />
              <View style={[styles.photoBorderRing, styles.gradientBorderYou]}>
                <View style={styles.youCircle}>
                  <Text style={styles.youEmoji}>💜</Text>
                </View>
              </View>
              <Text
                style={[styles.photoLabel, { color: theme.colors.textSecondary }]}
              >
                You
              </Text>
            </View>

            {/* Heart in between */}
            <Animated.View style={[styles.heartBetween, heartAnimStyle]}>
              <Text style={styles.heartEmoji}>❤️</Text>
            </Animated.View>

            {/* Matched user photo */}
            <View style={styles.photoWrapper}>
              <PulsingRing size={PHOTO_SIZE + 16} delay={300} />
              <View style={[styles.photoBorderRing, styles.gradientBorderMatch]}>
                <Image source={{ uri: matchPhoto }} style={styles.matchPhoto} />
              </View>
              <Text
                style={[styles.photoLabel, { color: theme.colors.textSecondary }]}
              >
                {matchedUser.displayName}
              </Text>
            </View>
          </Animated.View>

          {/* --- Buttons --- */}
          <Animated.View style={[styles.actions, buttonsAnimStyle]}>
            {/* Say Hi button with gradient-like bg */}
            <TouchableOpacity
              style={styles.sayHiButton}
              onPress={() => onSayHi(matchId)}
              activeOpacity={0.85}
            >
              {/* Shimmer overlay */}
              <Animated.View style={[styles.shimmerOverlay, buttonShimmerStyle]}>
                <View style={styles.shimmerStripe} />
              </Animated.View>

              <Text style={styles.sayHiText}>Say Hi 👋</Text>
            </TouchableOpacity>

            {/* Maybe Later */}
            <TouchableOpacity
              style={styles.maybeLaterButton}
              onPress={onMaybeLater}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.maybeLaterText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ---------- Constants ----------

const PHOTO_SIZE = 100;
const CARD_WIDTH = SCREEN_WIDTH - 48;

// ---------- Styles ----------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: CARD_WIDTH,
    borderRadius: 28,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    overflow: 'hidden',
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  celebrationEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(108, 92, 231, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Photos row
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 0,
  },
  photoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: PHOTO_SIZE + 24,
  },
  photoBorderRing: {
    width: PHOTO_SIZE + 10,
    height: PHOTO_SIZE + 10,
    borderRadius: (PHOTO_SIZE + 10) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  gradientBorderYou: {
    borderColor: COLORS.primaryLight,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  gradientBorderMatch: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(253, 121, 168, 0.08)',
  },
  youCircle: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  youEmoji: {
    fontSize: 40,
  },
  matchPhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  photoLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Heart in between
  heartBetween: {
    marginHorizontal: 12,
    marginBottom: 20,
  },
  heartEmoji: {
    fontSize: 32,
  },

  // Actions
  actions: {
    width: '100%',
    gap: 12,
  },
  sayHiButton: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerStripe: {
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  sayHiText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  maybeLaterButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maybeLaterText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default MatchPromptModal;
