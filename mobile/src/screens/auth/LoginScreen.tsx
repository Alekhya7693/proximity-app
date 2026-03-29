import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  FadeInUp,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Login'>;

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

// ── Main Login Screen ──────────────────────────────────────────────────
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Icon glow animation
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
    shadowOpacity: interpolate(iconGlow.value, [0, 1], [0.2, 0.6]),
    shadowRadius: interpolate(iconGlow.value, [0, 1], [8, 20]),
  }));

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

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!validators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!validators.isNotEmpty(password)) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await setUser(response.user);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK'
          ? 'Unable to connect to server. Please try again.'
          : 'Invalid email or password. Please try again.');
      showAlert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'apple' | 'google') => {
    // TODO: Implement social auth
    showAlert(
      'Coming Soon',
      `${provider === 'apple' ? 'Apple' : 'Google'} sign-in will be available soon.`,
    );
  };

  // Floating orb data — cyan-blue and orange tones
  const orbs: FloatingOrbProps[] = [
    {
      size: 120,
      color: 'rgba(14, 165, 233, 0.08)',
      initialX: -30,
      initialY: 40,
      delay: 0,
      duration: 3000,
    },
    {
      size: 80,
      color: 'rgba(249, 115, 22, 0.07)',
      initialX: SCREEN_WIDTH - 60,
      initialY: 100,
      delay: 400,
      duration: 3500,
    },
    {
      size: 60,
      color: 'rgba(14, 165, 233, 0.06)',
      initialX: SCREEN_WIDTH * 0.3,
      initialY: SCREEN_HEIGHT * 0.15,
      delay: 800,
      duration: 4000,
    },
    {
      size: 100,
      color: 'rgba(249, 115, 22, 0.06)',
      initialX: SCREEN_WIDTH * 0.6,
      initialY: SCREEN_HEIGHT * 0.55,
      delay: 200,
      duration: 3200,
    },
    {
      size: 50,
      color: 'rgba(6, 182, 212, 0.05)',
      initialX: 20,
      initialY: SCREEN_HEIGHT * 0.65,
      delay: 600,
      duration: 3800,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Floating background orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        {orbs.map((orb, index) => (
          <FloatingOrb key={index} {...orb} />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo + Header ──────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(100))}
            style={styles.header}
          >
            {/* Small MYKO Logo (gradient icon) */}
            <Animated.View
              style={[
                styles.logoWrapper,
                iconGlowStyle,
                Platform.select({
                  ios: {
                    shadowColor: '#0EA5E9',
                    shadowOffset: { width: 0, height: 0 },
                  },
                  android: { elevation: 8 },
                  web: {
                    boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
                  } as any,
                }),
              ]}
            >
              <LinearGradient
                colors={['#0EA5E9', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBorder}
              >
                <View style={styles.logoInner}>
                  <View style={styles.logoTargetOuter}>
                    <View style={styles.logoTargetMiddle}>
                      <View style={styles.logoTargetCenter} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Text style={styles.headerTitle}>Welcome back</Text>
            <Text style={styles.headerSubtitle}>Sign in to continue</Text>
          </Animated.View>

          {/* ── Form ────────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(300))}
          >
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                  errors.email ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={styles.errorText}
                >
                  {errors.email}
                </Animated.Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                  errors.password ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.passwordField]}
                  placeholder="Enter your password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={styles.errorText}
                >
                  {errors.password}
                </Animated.Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleLogin}
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
                    <Text style={styles.gradientButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Social Login Divider ────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(500))}
            style={styles.dividerContainer}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* ── Social Login Buttons ────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(600))}
            style={styles.socialRow}
          >
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('apple')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIconApple}>{'\uF8FF'}</Text>
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('google')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIconGoogle}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(700))}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    marginBottom: 32,
  },
  logoWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    borderRadius: 18,
  },
  logoBorder: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  logoInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0B2545',
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTargetOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTargetMiddle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTargetCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },

  // ── Inputs ──────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#64748B',
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
  passwordField: {
    paddingRight: 50,
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
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

  // ── Divider ─────────────────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1B5B8A',
  },
  dividerText: {
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Social Buttons ──────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#133E68',
    borderWidth: 1.5,
    borderColor: '#1B5B8A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  socialIconApple: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    color: '#FFFFFF',
  },
  socialIconGoogle: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    color: '#4285F4',
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Footer ──────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
  },
});

export default LoginScreen;
