import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'VerifyEmail'>;

const CODE_LENGTH = 6;

const VerifyEmailScreen: React.FC<Props> = ({ route }) => {
  const { email } = route.params;
  const theme = useTheme();
  const { updateUser } = useAuthStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    if (value.length > 1) {
      // Handle paste
      const digits = value.split('').slice(0, CODE_LENGTH - index);
      digits.forEach((digit, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newCode[index] = value;
      setCode(newCode);
      if (value && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    // Auto-submit when complete
    const fullCode = newCode.join('');
    if (fullCode.length === CODE_LENGTH && !newCode.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeString = verificationCode || code.join('');
    if (codeString.length !== CODE_LENGTH) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyEmail({ email, code: codeString });
      updateUser({ isVerified: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', message);
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    try {
      await authApi.resendVerification(email);
      setResendCountdown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch {
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
            Verify Your Email
          </Text>
          <Text
            style={[
              theme.typography.body1,
              { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
            ]}
          >
            We sent a 6-digit code to
          </Text>
          <Text
            style={[
              theme.typography.subtitle2,
              { color: theme.colors.primary, marginTop: 4 },
            ]}
          >
            {email}
          </Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                {
                  borderColor: digit
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify()}
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
              Verify Email
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text
            style={[theme.typography.body2, { color: theme.colors.textSecondary }]}
          >
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCountdown > 0}
          >
            <Text
              style={[
                theme.typography.subtitle2,
                {
                  color:
                    resendCountdown > 0
                      ? theme.colors.textTertiary
                      : theme.colors.primary,
                },
              ]}
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.7 },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});

export default VerifyEmailScreen;
