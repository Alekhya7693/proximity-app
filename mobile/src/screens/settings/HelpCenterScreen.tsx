import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'HelpCenter'>;

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How does proximity matching work?',
    answer:
      'Proximity uses your location to find people nearby within your discovery radius. When two users are within range and both show interest, a match is created. Chat is only available while both users remain within 300m of the match location.',
  },
  {
    id: '2',
    question: 'What happens when I leave a zone?',
    answer:
      'When you leave the 300m radius of your match location, the chat will be locked. If you return within 3 days, the chat unlocks. After 3 days, the chat is automatically deleted for privacy.',
  },
  {
    id: '3',
    question: 'How do avatars and names work?',
    answer:
      'Your avatar represents your identity in the app. Your display name changes automatically based on your location zone, providing pseudonymous interactions. You can choose your preferred avatar style in settings.',
  },
  {
    id: '4',
    question: 'What is the difference between Social and Professional modes?',
    answer:
      'Social mode is designed for casual connections, dating, and friendships. Professional mode focuses on networking, mentorship, and career opportunities. You can switch between modes at any time from your profile.',
  },
  {
    id: '5',
    question: 'How do I report inappropriate behavior?',
    answer:
      'You can report a user from their profile by tapping the report button, or use Settings > Report a Problem. We take all reports seriously and review them within 24 hours.',
  },
  {
    id: '6',
    question: 'Is my location data private?',
    answer:
      'Yes. Your exact location is never shared with other users. We only use approximate zone information for matching. You can disable location sharing at any time in Privacy Settings, though this will limit discovery features.',
  },
];

// ===========================================================================
// HelpCenterScreen
// ===========================================================================
const HelpCenterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleContactSupport = () => {
    showAlert(
      'Contact Support',
      'Email us at support@proximity.app and we will get back to you within 24 hours.',
    );
  };

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
          Help Center
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.sectionHeaderContainer}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            FREQUENTLY ASKED QUESTIONS
          </Text>
        </Animated.View>

        {/* FAQ List */}
        {FAQ_ITEMS.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <Animated.View
              key={item.id}
              entering={enteringAnim(
                FadeInDown.duration(400).delay(150 + index * 60),
              )}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleExpand(item.id)}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    shadowColor: theme.colors.cardShadow,
                    borderColor: isExpanded
                      ? theme.colors.primary + '40'
                      : 'transparent',
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text
                    style={[
                      styles.faqQuestion,
                      { color: theme.colors.text },
                      isExpanded && { color: theme.colors.primary },
                    ]}
                  >
                    {item.question}
                  </Text>
                  <Text
                    style={[
                      styles.expandIcon,
                      { color: theme.colors.textTertiary },
                      isExpanded && { color: theme.colors.primary },
                    ]}
                  >
                    {isExpanded ? '\u2212' : '+'}
                  </Text>
                </View>
                {isExpanded && (
                  <Text
                    style={[
                      styles.faqAnswer,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {item.answer}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Contact Support */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(600))}
          style={styles.contactSection}
        >
          <Text style={[styles.contactLabel, { color: theme.colors.textTertiary }]}>
            STILL NEED HELP?
          </Text>
          <TouchableOpacity activeOpacity={0.85} onPress={handleContactSupport}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactButton}
            >
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  sectionHeaderContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
  },

  // ---- FAQ Card ----
  faqCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
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
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 22,
    fontWeight: '300',
    width: 24,
    textAlign: 'center',
  },
  faqAnswer: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  // ---- Contact Support ----
  contactSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  contactButton: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default HelpCenterScreen;
