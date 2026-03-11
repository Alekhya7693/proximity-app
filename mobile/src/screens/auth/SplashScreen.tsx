import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeInUp,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Splash'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Floating Orb Component ─────────────────────────────────────────────
interface FloatingOrbProps {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  delay: number;
  duration: number;
}

const FloatingOrb: React.FC<FloatingOrbProps> = ({
  size,
  color,
  initialX,
  initialY,
  delay,
  duration,
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1200 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 80 }),
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-25, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(25, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(18, {
            duration: duration * 1.3,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-18, {
            duration: duration * 1.3,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// ── Main Splash Screen ─────────────────────────────────────────────────
const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  // Pulsing glow animation for the app icon border
  const iconGlow = useSharedValue(0);

  useEffect(() => {
    iconGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [iconGlow]);

  const iconGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(iconGlow.value, [0, 1], [0.3, 0.8]),
    shadowRadius: interpolate(iconGlow.value, [0, 1], [12, 28]),
  }));

  // Button press scale
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onButtonPressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const onButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Floating orb data
  const orbs: FloatingOrbProps[] = [
    {
      size: 160,
      color: 'rgba(139, 92, 246, 0.08)',
      initialX: -50,
      initialY: SCREEN_HEIGHT * 0.08,
      delay: 0,
      duration: 3500,
    },
    {
      size: 120,
      color: 'rgba(236, 72, 153, 0.07)',
      initialX: SCREEN_WIDTH - 80,
      initialY: SCREEN_HEIGHT * 0.12,
      delay: 400,
      duration: 4000,
    },
    {
      size: 80,
      color: 'rgba(139, 92, 246, 0.06)',
      initialX: SCREEN_WIDTH * 0.5,
      initialY: SCREEN_HEIGHT * 0.25,
      delay: 800,
      duration: 3800,
    },
    {
      size: 100,
      color: 'rgba(236, 72, 153, 0.06)',
      initialX: 30,
      initialY: SCREEN_HEIGHT * 0.55,
      delay: 200,
      duration: 4200,
    },
    {
      size: 70,
      color: 'rgba(139, 92, 246, 0.05)',
      initialX: SCREEN_WIDTH * 0.65,
      initialY: SCREEN_HEIGHT * 0.6,
      delay: 600,
      duration: 3200,
    },
    {
      size: 50,
      color: 'rgba(236, 72, 153, 0.05)',
      initialX: SCREEN_WIDTH * 0.15,
      initialY: SCREEN_HEIGHT * 0.75,
      delay: 1000,
      duration: 4500,
    },
    {
      size: 90,
      color: 'rgba(139, 92, 246, 0.04)',
      initialX: SCREEN_WIDTH * 0.8,
      initialY: SCREEN_HEIGHT * 0.42,
      delay: 300,
      duration: 3600,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Floating background orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        {orbs.map((orb, index) => (
          <FloatingOrb key={index} {...orb} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* ── Centered Content ─────────────────────────────────────── */}
        <View style={styles.centerContent}>
          {/* App Icon - Rounded Square with Gradient Border */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(1000).delay(200))}
          >
            <Animated.View
              style={[
                styles.iconOuterWrapper,
                iconGlowStyle,
                Platform.select({
                  ios: {
                    shadowColor: '#8B5CF6',
                    shadowOffset: { width: 0, height: 0 },
                  },
                  android: { elevation: 12 },
                  web: {
                    boxShadow: '0 0 24px rgba(139, 92, 246, 0.5)',
                  } as any,
                }),
              ]}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradientBorder}
              >
                <View style={styles.iconInner}>
                  {/* Target/Circle Icon */}
                  <View style={styles.targetIconOuter}>
                    <View style={styles.targetIconMiddle}>
                      <View style={styles.targetIconCenter} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* App Name - Gradient Text via Masked LinearGradient */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(1000).delay(400))}
            style={styles.appNameWrapper}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.appNameGradientBg}
            >
              <Text style={styles.appNameText}>Proximity</Text>
            </LinearGradient>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={enteringAnim(FadeInUp.duration(1000).delay(600))}
            style={styles.tagline}
          >
            CONNECT. DISCOVER. BELONG.
          </Animated.Text>
        </View>

        {/* ── Bottom Actions ───────────────────────────────────────── */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(1000).delay(800))}
          style={styles.bottomActions}
        >
          {/* Get Started Button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              onPressIn={onButtonPressIn}
              onPressOut={onButtonPressOut}
              activeOpacity={1}
              style={styles.getStartedTouchable}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getStartedButton}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1A',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // ── Center Content ──────────────────────────────────────────────
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // ── App Icon ────────────────────────────────────────────────────
  iconOuterWrapper: {
    marginBottom: 32,
    borderRadius: 28,
  },
  iconGradientBorder: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  iconInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F0A1A',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetIconOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetIconMiddle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetIconCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EC4899',
  },

  // ── App Name (Gradient Text) ────────────────────────────────────
  appNameWrapper: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 4,
  },
  appNameGradientBg: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  appNameText: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    color: 'transparent',
    // backgroundClip text trick works on web; on native, the gradient shows through
    ...Platform.select({
      web: {
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } as any,
      default: {
        // On native, fallback to a solid gradient-like color.
        // The LinearGradient behind provides the visual gradient.
        color: '#FFFFFF',
      },
    }),
  },

  // ── Tagline ─────────────────────────────────────────────────────
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Bottom Actions ──────────────────────────────────────────────
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  getStartedTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
      } as any,
    }),
  },
  getStartedButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Sign In Link ────────────────────────────────────────────────
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signInLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});

export default SplashScreen;
