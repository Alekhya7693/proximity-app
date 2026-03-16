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
  Linking,
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Register'>;

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

// ── Main Register Screen ───────────────────────────────────────────────
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

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
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (trimmedUsername.length > 30) {
      newErrors.username = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const passwordValidation = validators.isValidPassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await setUser(response.user);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK'
          ? 'Unable to connect to server. Please try again.'
          : 'Registration failed. Please try again.');
      showAlert('Registration Failed', message);
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

  // Floating orb data
  const orbs: FloatingOrbProps[] = [
    {
      size: 120,
      color: 'rgba(139, 92, 246, 0.07)',
      initialX: -30,
      initialY: 60,
      delay: 0,
      duration: 3200,
    },
    {
      size: 80,
      color: 'rgba(236, 72, 153, 0.06)',
      initialX: SCREEN_WIDTH - 60,
      initialY: 120,
      delay: 400,
      duration: 3800,
    },
    {
      size: 60,
      color: 'rgba(139, 92, 246, 0.05)',
      initialX: SCREEN_WIDTH * 0.4,
      initialY: SCREEN_HEIGHT * 0.7,
      delay: 800,
      duration: 4000,
    },
    {
      size: 90,
      color: 'rgba(236, 72, 153, 0.05)',
      initialX: 20,
      initialY: SCREEN_HEIGHT * 0.5,
      delay: 600,
      duration: 3500,
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
          {/* ── Header ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(100))}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Join the network. No phone number needed.
            </Text>
          </Animated.View>

          {/* ── Social Auth Buttons ─────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(200))}
          >
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('apple')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialButtonIconApple}>{'\uF8FF'}</Text>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.socialButtonSpacing]}
              onPress={() => handleSocialAuth('google')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialButtonIconGoogle}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(300))}
            style={styles.dividerContainer}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* ── Form ────────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(400))}
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
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError('email');
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

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View
                style={[
                  styles.inputWrapper,
                  usernameFocused && styles.inputWrapperFocused,
                  errors.username ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="#6B7280"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    clearError('username');
                  }}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!isLoading}
                />
              </View>
              {errors.username && (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={styles.errorText}
                >
                  {errors.username}
                </Animated.Text>
              )}
            </View>

            {/* Name Inputs */}
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, styles.nameField]}>
                <Text style={styles.inputLabel}>FIRST NAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    firstNameFocused && styles.inputWrapperFocused,
                    errors.firstName ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor="#6B7280"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearError('firstName');
                    }}
                    onFocus={() => setFirstNameFocused(true)}
                    onBlur={() => setFirstNameFocused(false)}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    editable={!isLoading}
                  />
                </View>
                {errors.firstName && (
                  <Animated.Text
                    entering={enteringAnim(FadeInDown.duration(300))}
                    style={styles.errorText}
                  >
                    {errors.firstName}
                  </Animated.Text>
                )}
              </View>
              <View style={styles.nameGap} />
              <View style={[styles.inputGroup, styles.nameField]}>
                <Text style={styles.inputLabel}>LAST NAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    lastNameFocused && styles.inputWrapperFocused,
                    errors.lastName ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor="#6B7280"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearError('lastName');
                    }}
                    onFocus={() => setLastNameFocused(true)}
                    onBlur={() => setLastNameFocused(false)}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    editable={!isLoading}
                  />
                </View>
                {errors.lastName && (
                  <Animated.Text
                    entering={enteringAnim(FadeInDown.duration(300))}
                    style={styles.errorText}
                  >
                    {errors.lastName}
                  </Animated.Text>
                )}
              </View>
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
                  placeholder="Create a password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError('password');
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordFocused && styles.inputWrapperFocused,
                  errors.confirmPassword ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.passwordField]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError('confirmPassword');
                  }}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Animated.Text
                  entering={enteringAnim(FadeInDown.duration(300))}
                  style={styles.errorText}
                >
                  {errors.confirmPassword}
                </Animated.Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                clearError('terms');
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                  errors.terms ? styles.checkboxError : null,
                ]}
              >
                {agreedToTerms && (
                  <Text style={styles.checkmark}>{'✓'}</Text>
                )}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => Linking.openURL('https://proximity.app/terms')}
                >
                  Terms & Conditions
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    Linking.openURL('https://proximity.app/privacy')
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Animated.Text
                entering={enteringAnim(FadeInDown.duration(300))}
                style={[styles.errorText, { marginTop: 4, marginBottom: 8 }]}
              >
                {errors.terms}
              </Animated.Text>
            )}

            {/* Create Account Button */}
            <Animated.View style={[buttonAnimatedStyle, { marginTop: 8 }]}>
              <TouchableOpacity
                onPress={handleRegister}
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
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.gradientButtonText}>
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <Animated.View
            entering={enteringAnim(FadeInUp.duration(800).delay(500))}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    backgroundColor: '#0F0A1A',
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    marginBottom: 28,
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
    color: '#6B7280',
    lineHeight: 24,
  },

  // ── Social Auth Buttons ─────────────────────────────────────────
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  socialButtonSpacing: {
    marginTop: 12,
  },
  socialButtonIconApple: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginRight: 10,
  },
  socialButtonIconGoogle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // ── Divider ─────────────────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D2340',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Inputs ──────────────────────────────────────────────────────
  nameRow: {
    flexDirection: 'row',
  },
  nameField: {
    flex: 1,
  },
  nameGap: {
    width: 12,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: '#1A1128',
    borderWidth: 1.5,
    borderColor: '#2D2340',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
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
    color: '#8B5CF6',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  // ── Checkbox ────────────────────────────────────────────────────
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2D2340',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkboxError: {
    borderColor: '#EF4444',
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  linkText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // ── Gradient Button ─────────────────────────────────────────────
  gradientButtonTouchable: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: '0 6px 24px rgba(139, 92, 246, 0.4)',
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

  // ── Footer ──────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});

export default RegisterScreen;
