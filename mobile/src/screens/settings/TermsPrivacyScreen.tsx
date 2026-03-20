import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'TermsPrivacy'>;

// ---------------------------------------------------------------------------
// Content Sections
// ---------------------------------------------------------------------------
interface LegalSection {
  id: string;
  title: string;
  content: string;
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'tos-1',
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using the MYKO application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.',
  },
  {
    id: 'tos-2',
    title: '2. User Accounts',
    content:
      'You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.',
  },
  {
    id: 'tos-3',
    title: '3. Acceptable Use',
    content:
      'You agree not to use the app to harass, abuse, or harm others. Prohibited behavior includes sending unsolicited messages, impersonating others, sharing inappropriate content, or attempting to manipulate matching algorithms. Violations may result in account suspension or termination.',
  },
  {
    id: 'tos-4',
    title: '4. Content and Intellectual Property',
    content:
      'You retain ownership of content you create. By posting content, you grant MYKO a non-exclusive license to display it within the app. All app designs, logos, and features are the intellectual property of MYKO.',
  },
  {
    id: 'tos-5',
    title: '5. Termination',
    content:
      'We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through the settings menu, which will permanently remove your data.',
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'pp-1',
    title: '1. Information We Collect',
    content:
      'We collect information you provide during registration (email, display preferences), usage data (interactions, matches), and location data (approximate zone information for proximity matching). We do not collect or store your exact GPS coordinates on our servers.',
  },
  {
    id: 'pp-2',
    title: '2. How We Use Your Information',
    content:
      'Your information is used to provide proximity-based matching, improve the user experience, ensure safety, and communicate important updates. We do not sell your personal data to third parties.',
  },
  {
    id: 'pp-3',
    title: '3. Data Storage and Security',
    content:
      'Your data is stored securely using industry-standard encryption. Chat messages are automatically deleted after 3 days. We implement appropriate technical and organizational measures to protect your data against unauthorized access.',
  },
  {
    id: 'pp-4',
    title: '4. Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data. You can download your data or request deletion through the app settings. We respond to all data requests within 30 days.',
  },
  {
    id: 'pp-5',
    title: '5. Contact Us',
    content:
      'For any privacy-related questions or concerns, please contact our Data Protection Officer at privacy@myko.app.',
  },
];

// ===========================================================================
// TermsPrivacyScreen
// ===========================================================================
const TermsPrivacyScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const renderLegalSection = (section: LegalSection, index: number, baseDelay: number) => (
    <Animated.View
      key={section.id}
      entering={enteringAnim(
        FadeInDown.duration(400).delay(baseDelay + index * 60),
      )}
      style={styles.legalSection}
    >
      <Text style={[styles.legalTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.legalContent, { color: theme.colors.textTertiary }]}>
        {section.content}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={styles.headerBar}
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
          Terms & Privacy
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Terms of Service */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
        >
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <Text style={styles.sectionIcon}>{'\u{1F4DC}'}</Text>
            <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
              Terms of Service
            </Text>
          </View>
        </Animated.View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              shadowColor: theme.colors.cardShadow,
            },
          ]}
        >
          {TERMS_SECTIONS.map((section, index) =>
            renderLegalSection(section, index, 200),
          )}
        </View>

        {/* Privacy Policy */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(500))}
          style={styles.privacyHeaderContainer}
        >
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <Text style={styles.sectionIcon}>{'\u{1F6E1}\uFE0F'}</Text>
            <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
              Privacy Policy
            </Text>
          </View>
        </Animated.View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              shadowColor: theme.colors.cardShadow,
            },
          ]}
        >
          {PRIVACY_SECTIONS.map((section, index) =>
            renderLegalSection(section, index, 600),
          )}
        </View>

        {/* Last Updated */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(400).delay(900))}
          style={styles.lastUpdated}
        >
          <Text style={[styles.lastUpdatedText, { color: theme.colors.textTertiary }]}>
            Last updated: March 1, 2026
          </Text>
        </Animated.View>
      </ScrollView>
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

  // ---- Header ----
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingTop: 8,
    paddingBottom: 48,
  },

  // ---- Section Header ----
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    gap: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  privacyHeaderContainer: {
    marginTop: 28,
  },

  // ---- Section Card ----
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ---- Legal Section ----
  legalSection: {
    marginBottom: 20,
  },
  legalTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  legalContent: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },

  // ---- Last Updated ----
  lastUpdated: {
    alignItems: 'center',
    marginTop: 24,
  },
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default TermsPrivacyScreen;
