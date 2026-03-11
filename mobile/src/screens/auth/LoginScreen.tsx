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
    // Fade in
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 80 }),
    );

    // Float vertically
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

    // Float horizontally
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

  // Header glow animation
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [glowPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(glowPulse.value, [0, 1], [4, 20]),
    textShadowColor: 'rgba(108, 92, 231, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
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

  // ── Validation (unchanged logic) ─────────────────────────────────────
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

      await setTokens(response.accessToken, response.refreshToken);
      await setUser(response.user);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.';
      showAlert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Floating orb data ────────────────────────────────────────────────
  const orbs: FloatingOrbProps[] = [
    {
      size: 120,
      color: 'rgba(108, 92, 231, 0.08)',
      initialX: -30,
      initialY: 40,
      delay: 0,
      duration: 3000,
    },
    {
      size: 80,
      color: 'rgba(253, 121, 168, 0.08)',
      initialX: SCREEN_WIDTH - 60,
      initialY: 100,
      delay: 400,
      duration: 3500,
    },
    {
      size: 60,
      color: 'rgba(0, 206, 201, 0.08)',
      initialX: SCREEN_WIDTH * 0.3,
      initialY: SCREEN_HEIGHT * 0.15,
      delay: 800,
      duration: 4000,
    },
    {
      size: 100,
      color: 'rgba(162, 155, 254, 0.07)',
      initialX: SCREEN_WIDTH * 0.6,
      initialY: SCREEN_HEIGHT * 0.55,
      delay: 200,
      duration: 3200,
    },
    {
      size: 50,
      color: 'rgba(253, 121, 168, 0.06)',
      initialX: 20,
      initialY: SCREEN_HEIGHT * 0.65,
      delay: 600,
      duration: 3800,
    },
    {
      size: 40,
      color: 'rgba(0, 206, 201, 0.06)',
      initialX: SCREEN_WIDTH * 0.7,
      initialY: SCREEN_HEIGHT * 0.35,
      delay: 1000,
      duration: 4200,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
          {/* ── Header ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(100))}
            style={styles.header}
          >
            {/* Gradient-like header background */}
            <View style={styles.headerGradient}>
              <View
                style={[
                  styles.gradientLayer1,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.gradientLayer2,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              />
              <View
                style={[
                  styles.gradientLayer3,
                  { backgroundColor: theme.colors.secondary },
                ]}
              />
            </View>

            {/* App logo / icon area */}
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.logoEmoji}>V</Text>
            </View>

            {/* App name with glow */}
            <Animated.Text
              style={[
                styles.appName,
                { color: theme.colors.primary },
                glowStyle,
              ]}
            >
              Vibeit
            </Animated.Text>

            {/* Tagline */}
            <Text
              style={[
                styles.tagline,
                theme.typography.body1,
                { color: theme.colors.textSecondary },
              ]}
            >
              Connect with people around you
            </Text>
          </Animated.View>

          {/* ── Form Card ───────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(300))}
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: theme.colors.cardShadow,
              },
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: errors.email
                      ? theme.colors.error
                      : emailFocused
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  emailFocused && {
                    borderWidth: 2,
                    ...Platform.select({
                      ios: {
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                      },
                      android: { elevation: 2 },
                      web: {
                        // web-only boxShadow property
                        boxShadow: `0 0 0 3px rgba(108, 92, 231, 0.1)`,
                      },
                    }),
                  },
                ]}
              >
                <Text style={styles.inputIcon}>{'📧'}</Text>
                <TextInput
                  style={[
                    styles.modernInput,
                    { color: theme.colors.text },
                  ]}
                  placeholder="Email address"
                  placeholderTextColor={theme.colors.textTertiary}
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
                  style={[
                    styles.errorText,
                    theme.typography.caption,
                    { color: theme.colors.error },
                  ]}
                >
                  {errors.email}
                </Animated.Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: errors.password
                      ? theme.colors.error
                      : passwordFocused
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                  passwordFocused && {
                    borderWidth: 2,
                    ...Platform.select({
                      ios: {
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                      },
                      android: { elevation: 2 },
                      web: {
                        // web-only boxShadow property
                        boxShadow: `0 0 0 3px rgba(108, 92, 231, 0.1)`,
                      },
                    }),
                  },
                ]}
              >
                <Text style={styles.inputIcon}>{'🔒'}</Text>
                <TextInput
                  style={[
                    styles.modernInput,
                    styles.passwordField,
                    { color: theme.colors.text },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.textTertiary}
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
                  <Text style={[styles.showPasswordText, { color: theme.colors.primary }]}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={[
                    styles.errorText,
                    theme.typography.caption,
                    { color: theme.colors.error },
                  ]}
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
              <Text
                style={[
                  theme.typography.body2,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* ── Sign In Button ─────────────────────────────────────── */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                onPressIn={onButtonPressIn}
                onPressOut={onButtonPressOut}
                disabled={isLoading}
                activeOpacity={1}
              >
                {/* Two-tone gradient simulation */}
                <View style={styles.buttonGradient}>
                  <View
                    style={[
                      styles.buttonGradientLeft,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.buttonGradientRight,
                      { backgroundColor: theme.colors.primaryLight },
                    ]}
                  />
                  {/* Overlay to smooth the transition */}
                  <View style={styles.buttonGradientOverlay} />
                </View>
                {isLoading ? (
                  <ActivityIndicator
                    color={theme.colors.textInverse}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.signInButtonText,
                      theme.typography.button,
                      { color: theme.colors.textInverse },
                    ]}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Social Login Divider ────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(500))}
            style={styles.dividerContainer}
          >
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <Text
              style={[
                styles.dividerText,
                theme.typography.caption,
                { color: theme.colors.textTertiary },
              ]}
            >
              or continue with
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </Animated.View>

          {/* ── Social Login Buttons ────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(600))}
            style={styles.socialRow}
          >
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.cardShadow,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text
                style={[
                  styles.socialLabel,
                  theme.typography.body2,
                  { color: theme.colors.text, fontWeight: '600' },
                ]}
              >
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.cardShadow,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.socialIconApple}>{'\uF8FF'}</Text>
              <Text
                style={[
                  styles.socialLabel,
                  theme.typography.body2,
                  { color: theme.colors.text, fontWeight: '600' },
                ]}
              >
                Apple
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(700))}
            style={styles.footer}
          >
            <Text
              style={[
                theme.typography.body2,
                { color: theme.colors.textSecondary },
              ]}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text
                style={[
                  theme.typography.subtitle2,
                  {
                    color: theme.colors.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                Sign Up
              </Text>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  headerGradient: {
    position: 'absolute',
    top: -80,
    left: -60,
    right: -60,
    height: 220,
    borderRadius: 120,
    overflow: 'hidden',
    opacity: 0.06,
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '100%',
    borderRadius: 120,
  },
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
    borderRadius: 120,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: -20,
    left: '30%',
    width: '40%',
    height: '60%',
    borderRadius: 80,
    opacity: 0.5,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      web: {
        // web-only boxShadow property
        boxShadow: '0 8px 32px rgba(108, 92, 231, 0.35)',
      },
    }),
  },
  logoEmoji: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.8,
  },

  // ── Form Card ───────────────────────────────────────────────────
  formCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(108, 92, 231, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      web: {
        // web-only boxShadow property
        boxShadow: '0 8px 32px rgba(108, 92, 231, 0.12)',
      },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
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
  },
  errorText: {
    marginTop: 6,
    marginLeft: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },

  // ── Sign In Button ──────────────────────────────────────────────
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        // web-only boxShadow property
        boxShadow: '0 6px 24px rgba(108, 92, 231, 0.4)',
      },
    }),
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  buttonGradientLeft: {
    flex: 1,
  },
  buttonGradientRight: {
    flex: 1,
  },
  buttonGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    left: '30%',
    right: '30%',
    backgroundColor: 'rgba(138, 124, 240, 0.6)',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    zIndex: 1,
    letterSpacing: 0.5,
  },

  // ── Divider ─────────────────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
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
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: {
        // web-only boxShadow property
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    color: '#DB4437',
  },
  socialIconApple: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
    color: '#000000',
  },
  socialLabel: {
    fontSize: 15,
  },

  // ── Footer ──────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
});

export default LoginScreen;
