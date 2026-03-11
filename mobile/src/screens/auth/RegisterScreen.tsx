import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Register'>;

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non_binary' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
] as const;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { setTokens, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validators.isValidName(firstName)) {
      newErrors.firstName = 'First name must be 2-50 characters';
    }
    if (!validators.isValidName(lastName)) {
      newErrors.lastName = 'Last name must be 2-50 characters';
    }
    if (!validators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validators.isValidPassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
      } else if (!validators.isValidAge(dob)) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select a gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        dateOfBirth,
        gender,
      });

      await setTokens(response.accessToken, response.refreshToken);
      await setUser(response.user);

      navigation.navigate('VerifyEmail', { email: email.trim().toLowerCase() });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text
              style={[
                theme.typography.h3,
                { color: theme.colors.text },
              ]}
            >
              Create Account
            </Text>
            <Text
              style={[
                theme.typography.body2,
                { color: theme.colors.textSecondary, marginTop: 4 },
              ]}
            >
              Join the Proximity community
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text
                  style={[
                    styles.label,
                    theme.typography.body2,
                    { color: theme.colors.text },
                  ]}
                >
                  First Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.firstName
                        ? theme.colors.error
                        : theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="First name"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    clearError('firstName');
                  }}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.firstName && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.firstName}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text
                  style={[
                    styles.label,
                    theme.typography.body2,
                    { color: theme.colors.text },
                  ]}
                >
                  Last Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.lastName
                        ? theme.colors.error
                        : theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    clearError('lastName');
                  }}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.lastName && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.lastName}
                  </Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, theme.typography.body2, { color: theme.colors.text }]}
              >
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.email ? theme.colors.error : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError('email');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, theme.typography.body2, { color: theme.colors.text }]}
              >
                Date of Birth
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.dateOfBirth ? theme.colors.error : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textTertiary}
                value={dateOfBirth}
                onChangeText={(t) => {
                  setDateOfBirth(t);
                  clearError('dateOfBirth');
                }}
                keyboardType="numbers-and-punctuation"
                editable={!isLoading}
              />
              {errors.dateOfBirth && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.dateOfBirth}
                </Text>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, theme.typography.body2, { color: theme.colors.text }]}
              >
                Gender
              </Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderChip,
                      {
                        borderColor:
                          gender === option.value
                            ? theme.colors.primary
                            : theme.colors.border,
                        backgroundColor:
                          gender === option.value
                            ? theme.colors.primaryLight
                            : theme.colors.surface,
                      },
                    ]}
                    onPress={() => {
                      setGender(option.value);
                      clearError('gender');
                    }}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color:
                            gender === option.value
                              ? theme.colors.primaryDark
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.gender}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, theme.typography.body2, { color: theme.colors.text }]}
              >
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.password ? theme.colors.error : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Create a password"
                placeholderTextColor={theme.colors.textTertiary}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  clearError('password');
                }}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, theme.typography.body2, { color: theme.colors.text }]}
              >
                Confirm Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.confirmPassword
                      ? theme.colors.error
                      : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.textTertiary}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  clearError('confirmPassword');
                }}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text
                  style={[
                    theme.typography.button,
                    { color: theme.colors.textInverse },
                  ]}
                >
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text
              style={[theme.typography.body2, { color: theme.colors.textSecondary }]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text
                style={[theme.typography.subtitle2, { color: theme.colors.primary }]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  header: { marginBottom: 32 },
  form: { marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: { fontSize: 12, marginTop: 4 },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;
