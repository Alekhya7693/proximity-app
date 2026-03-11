import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

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
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>{'  '}</Text>
          </View>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.text, textAlign: 'center' },
            ]}
          >
            Check Your Email
          </Text>
          <Text
            style={[
              theme.typography.body1,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 12,
                paddingHorizontal: 16,
              },
            ]}
          >
            We sent password reset instructions to {email}. Please check your
            inbox and follow the link to reset your password.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 32 }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text
              style={[theme.typography.button, { color: theme.colors.textInverse }]}
            >
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text
            style={[theme.typography.h3, { color: theme.colors.text }]}
          >
            Forgot Password?
          </Text>
          <Text
            style={[
              theme.typography.body1,
              {
                color: theme.colors.textSecondary,
                marginTop: 8,
                marginBottom: 32,
              },
            ]}
          >
            Enter your email and we'll send you instructions to reset your
            password.
          </Text>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                theme.typography.body2,
                { color: theme.colors.text },
              ]}
            >
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {error ? (
              <Text
                style={[
                  styles.errorText,
                  theme.typography.caption,
                  { color: theme.colors.error },
                ]}
              >
                {error}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSendReset}
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
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={[theme.typography.body2, { color: theme.colors.primary }]}
            >
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: { alignItems: 'center', marginBottom: 24 },
  successEmoji: { fontSize: 64 },
  inputGroup: { marginBottom: 24 },
  label: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: { marginTop: 4 },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.7 },
  backLink: { alignItems: 'center', marginTop: 24 },
});

export default ForgotPasswordScreen;
