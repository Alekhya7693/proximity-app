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

  // Floating orb data — cyan-blue and orange tones
  const orbs: FloatingOrbProps[] = [
    {
      size: 160,
      color: 'rgba(14, 165, 233, 0.08)',
      initialX: -50,
      initialY: SCREEN_HEIGHT * 0.08,
      delay: 0,
      duration: 3500,
    },
    {
      size: 120,
      color: 'rgba(249, 115, 22, 0.07)',
      initialX: SCREEN_WIDTH - 80,
      initialY: SCREEN_HEIGHT * 0.12,
      delay: 400,
      duration: 4000,
    },
    {
      size: 80,
      color: 'rgba(14, 165, 233, 0.06)',
      initialX: SCREEN_WIDTH * 0.5,
      initialY: SCREEN_HEIGHT * 0.25,
      delay: 800,
      duration: 3800,
    },
    {
      size: 100,
      color: 'rgba(249, 115, 22, 0.06)',
      initialX: 30,
      initialY: SCREEN_HEIGHT * 0.55,
      delay: 200,
      duration: 4200,
    },
    {
      size: 70,
      color: 'rgba(14, 165, 233, 0.05)',
      initialX: SCREEN_WIDTH * 0.65,
      initialY: SCREEN_HEIGHT * 0.6,
      delay: 600,
      duration: 3200,
    },
    {
      size: 50,
      color: 'rgba(249, 115, 22, 0.05)',
      initialX: SCREEN_WIDTH * 0.15,
      initialY: SCREEN_HEIGHT * 0.75,
      delay: 1000,
      duration: 4500,
    },
    {
      size: 90,
      color: 'rgba(6, 182, 212, 0.04)',
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
          {/* App Icon - Location pin with chat bubbles */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(1000).delay(200))}
          >
            <Animated.View
              style={[
                styles.iconOuterWrapper,
                iconGlowStyle,
                Platform.select({
                  ios: {
                    shadowColor: '#0EA5E9',
                    shadowOffset: { width: 0, height: 0 },
                  },
                  android: { elevation: 12 },
                  web: {
                    boxShadow: '0 0 24px rgba(14, 165, 233, 0.5)',
                  } as any,
                }),
              ]}
            >
              <LinearGradient
                colors={['#0EA5E9', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradientBorder}
              >
                <View style={styles.iconInner}>
                  {/* Location Pin Icon */}
                  <View style={styles.pinIconOuter}>
                    <View style={styles.pinIconInner}>
                      <View style={styles.chatBubble} />
                      <View style={styles.chatBubbleSmall} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* App Name - MYKO with dual-color text */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(1000).delay(400))}
            style={styles.appNameWrapper}
          >
            <View style={styles.appNameRow}>
              <Text style={styles.appNameBlue}>My</Text>
              <Text style={styles.appNameOrange}>Ko</Text>
            </View>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={enteringAnim(FadeInUp.duration(1000).delay(600))}
            style={styles.tagline}
          >
            MEET BY CHANCE. KONNECT BY CHOICE.
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
                colors={['#0EA5E9', '#F97316']}
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
    backgroundColor: '#0B2545',
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
    backgroundColor: '#0B2545',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIconOuter: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pinIconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatBubble: {
    width: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
    position: 'absolute',
    left: 4,
    top: 6,
  },
  chatBubbleSmall: {
    width: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    position: 'absolute',
    right: 4,
    top: 12,
  },

  // ── App Name (MYKO with dual colors) ───────────────────────────
  appNameWrapper: {
    marginBottom: 12,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appNameBlue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#0EA5E9',
  },
  appNameOrange: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#F97316',
  },

  // ── Tagline ─────────────────────────────────────────────────────
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#64748B',
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
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {
        boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)',
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
    color: '#64748B',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
  },
});

export default SplashScreen;
