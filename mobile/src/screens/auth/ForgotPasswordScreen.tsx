import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
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
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'ForgotPassword'>;

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
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 80 }),
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(20, {
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
          withTiming(15, {
            duration: duration * 1.3,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-15, {
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

// ── Main ForgotPassword Screen ─────────────────────────────────────────
const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  // Button press scale
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const onButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const handleSendReset = async () => {
    if (!validators.isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setIsSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send reset email. Please try again.';
      showAlert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating orb data
  const orbs: FloatingOrbProps[] = [
    {
      size: 100,
      color: 'rgba(14, 165, 233, 0.07)',
      initialX: -20,
      initialY: 80,
      delay: 0,
      duration: 3500,
    },
    {
      size: 70,
      color: 'rgba(249, 115, 22, 0.06)',
      initialX: SCREEN_WIDTH - 50,
      initialY: 140,
      delay: 400,
      duration: 4000,
    },
    {
      size: 50,
      color: 'rgba(14, 165, 233, 0.05)',
      initialX: SCREEN_WIDTH * 0.4,
      initialY: SCREEN_HEIGHT * 0.6,
      delay: 800,
      duration: 3800,
    },
  ];

  // ── Success State ──────────────────────────────────────────────────
  if (isSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.orbContainer} pointerEvents="none">
          {orbs.map((orb, index) => (
            <FloatingOrb key={index} {...orb} />
          ))}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.centerContent}>
          <Animated.View
            entering={enteringAnim(FadeIn.duration(600))}
            style={styles.successCard}
          >
            {/* Success Icon */}
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>{'✓'}</Text>
            </View>

            <Text style={styles.successTitle}>Email sent!</Text>
            <Text style={styles.successMessage}>
              Check your inbox for the password reset link. It expires in 30
              minutes.
            </Text>

            {/* Back to Login Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
              style={styles.successButtonTouchable}
            >
              <LinearGradient
                colors={['#0EA5E9', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successButton}
              >
                <Text style={styles.successButtonText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Floating background orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        {orbs.map((orb, index) => (
          <FloatingOrb key={index} {...orb} />
        ))}
      </View>

      {/* Back Button */}
      <Animated.View entering={enteringAnim(FadeInUp.duration(600).delay(100))}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.formContent}>
          {/* ── Header ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(200))}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              Enter the email address associated with your account. We'll send
              you a reset link.
            </Text>
          </Animated.View>

          {/* ── Email Input ─────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(400))}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                  error ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
              {error ? (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={styles.errorText}
                >
                  {error}
                </Animated.Text>
              ) : null}
            </View>

            {/* Send Reset Link Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleSendReset}
                onPressIn={onButtonPressIn}
                onPressOut={onButtonPressOut}
                disabled={isLoading}
                activeOpacity={1}
                style={[
                  styles.gradientButtonTouchable,
                  isLoading && styles.buttonDisabled,
                ]}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.gradientButtonText}>
                      Send Reset Link
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2545',
  },
  flex: {
    flex: 1,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  // ── Back Button ─────────────────────────────────────────────────
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#133E68',
    borderWidth: 1.5,
    borderColor: '#1B5B8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 24,
    marginTop: 8,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },

  // ── Form Content ────────────────────────────────────────────────
  formContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },

  // ── Inputs ──────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#133E68',
    borderWidth: 1.5,
    borderColor: '#1B5B8A',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  inputWrapperFocused: {
    borderColor: '#0EA5E9',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
      } as any,
    }),
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: Platform.OS === 'web' ? 16 : 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  // ── Gradient Button ─────────────────────────────────────────────
  gradientButtonTouchable: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: '0 6px 24px rgba(14, 165, 233, 0.4)',
      } as any,
    }),
  },
  gradientButton: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  gradientButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // ── Success State ───────────────────────────────────────────────
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheckmark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  successButtonTouchable: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: '0 6px 24px rgba(14, 165, 233, 0.4)',
      } as any,
    }),
  },
  successButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default ForgotPasswordScreen;
