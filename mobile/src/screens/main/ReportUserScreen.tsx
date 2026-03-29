import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import { discoveryApi } from '../../api/discovery';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ReportUser'>;

// ---------------------------------------------------------------------------
// Report Reasons
// ---------------------------------------------------------------------------
const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment', icon: '\uD83D\uDEAB' },
  { id: 'fake_profile', label: 'Fake profile', icon: '\uD83C\uDFAD' },
  { id: 'spam', label: 'Spam', icon: '\uD83D\uDCE7' },
  { id: 'inappropriate', label: 'Inappropriate behavior', icon: '\u26A0\uFE0F' },
  { id: 'unsafe', label: 'Unsafe conduct', icon: '\uD83D\uDEE1\uFE0F' },
] as const;

type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

// ===========================================================================
// ReportUserScreen
// ===========================================================================
const ReportUserScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { userId, userName, userAvatar } = route.params;

  const [selectedReason, setSelectedReason] = useState<ReportReasonId>('harassment');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await discoveryApi.reportUser(userId, selectedReason, additionalDetails || undefined);
      showAlert('Report Submitted', 'Thank you for helping keep MYKO safe. We will review this report shortly.');
      navigation.goBack();
    } catch {
      showAlert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { borderBottomColor: theme.colors.border }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backArrow, { color: theme.colors.primary }]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Report User
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---- User Card ---- */}
          <Animated.View
            entering={enteringAnim(FadeInDown.duration(500).delay(100))}
            style={[
              styles.reportedUserCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.reportedAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={styles.reportedAvatarEmoji}>{userAvatar || '\uD83D\uDC64'}</Text>
            </View>
            <View style={styles.reportedInfo}>
              <Text style={[styles.reportedName, { color: theme.colors.text }]}>
                {userName}
              </Text>
              <Text style={[styles.reportedSubtext, { color: theme.colors.textTertiary }]}>
                Reporting this profile
              </Text>
            </View>
          </Animated.View>

          {/* ---- Reason Selection ---- */}
          <Animated.View
            entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              What's the issue?
            </Text>

            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedReason(reason.id)}
                    style={[
                      styles.reasonRow,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '15'
                          : theme.colors.surfaceElevated,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.reasonIcon}>{reason.icon}</Text>
                    <Text
                      style={[
                        styles.reasonLabel,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {reason.label}
                    </Text>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ---- Additional Details ---- */}
          <Animated.View
            entering={enteringAnim(FadeInDown.duration(500).delay(300))}
            style={styles.detailsSection}
          >
            <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>
              Additional details (optional)
            </Text>
            <TextInput
              style={[
                styles.detailsInput,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Describe the issue in more detail..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
            />
            <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
              {additionalDetails.length}/500
            </Text>
          </Animated.View>
        </ScrollView>

        {/* ---- Actions ---- */}
        <Animated.View
          entering={enteringAnim(FadeIn.duration(500).delay(400))}
          style={styles.actionsContainer}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={[styles.cancelText, { color: theme.colors.textTertiary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ===========================================================================
// Styles
// ===========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // ---- Header ----
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // ---- Scroll ----
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // ---- Reported User Card ----
  reportedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  reportedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportedAvatarEmoji: {
    fontSize: 24,
  },
  reportedInfo: {
    marginLeft: 14,
    flex: 1,
  },
  reportedName: {
    fontSize: 17,
    fontWeight: '700',
  },
  reportedSubtext: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },

  // ---- Section ----
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },

  // ---- Reasons ----
  reasonsList: {
    gap: 10,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  reasonIcon: {
    fontSize: 18,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ---- Details ----
  detailsSection: {
    marginTop: 24,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 6,
  },

  // ---- Actions ----
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },
  submitButton: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    minWidth: 280,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelButton: {
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReportUserScreen;
