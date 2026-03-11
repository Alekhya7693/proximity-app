import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore, AppMode } from '../../store/modeStore';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Discover'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────────────────────

interface MockProfile {
  id: string;
  displayName: string;
  age: number;
  emoji: string;
  distance: number;
  compatibility: number;
  tags: string[];
  // Professional fields
  role?: string;
  company?: string;
}

const SOCIAL_PROFILES: MockProfile[] = [
  {
    id: '1',
    displayName: 'UrbanFox',
    age: 27,
    emoji: '\uD83E\uDD8A',
    distance: 80,
    compatibility: 94,
    tags: ['Coffee', 'Photography', 'Hiking', 'Live Music'],
  },
  {
    id: '2',
    displayName: 'NeonDrift',
    age: 24,
    emoji: '\uD83C\uDF1F',
    distance: 120,
    compatibility: 87,
    tags: ['Art', 'Gaming', 'Anime', 'Cooking'],
  },
  {
    id: '3',
    displayName: 'WildPetal',
    age: 29,
    emoji: '\uD83C\uDF3A',
    distance: 45,
    compatibility: 91,
    tags: ['Yoga', 'Reading', 'Travel', 'Wine'],
  },
];

const PROFESSIONAL_PROFILES: MockProfile[] = [
  {
    id: '4',
    displayName: 'AlexChen',
    emoji: '\uD83D\uDCBC',
    age: 31,
    distance: 150,
    compatibility: 91,
    role: 'Product Manager',
    company: 'Stripe',
    tags: ['Fintech', 'Product Strategy', 'SaaS'],
  },
  {
    id: '5',
    displayName: 'MayaPatel',
    emoji: '\uD83D\uDE80',
    age: 28,
    distance: 200,
    compatibility: 88,
    role: 'Senior Engineer',
    company: 'Vercel',
    tags: ['React', 'TypeScript', 'Open Source'],
  },
  {
    id: '6',
    displayName: 'JordanLee',
    emoji: '\uD83C\uDFA8',
    age: 26,
    distance: 90,
    compatibility: 85,
    role: 'UX Designer',
    company: 'Figma',
    tags: ['Design Systems', 'Prototyping', 'User Research'],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode, setMode } = useModeStore();
  const isSocial = mode === 'social';

  const profiles = isSocial ? SOCIAL_PROFILES : PROFESSIONAL_PROFILES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = profiles[currentIndex];

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right' && currentProfile) {
        // Simulate match for demo
      }
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
    },
    [currentProfile, profiles.length],
  );

  const handleProfilePress = useCallback(() => {
    if (currentProfile) {
      navigation.navigate('ProfileDetail', {
        userId: currentProfile.id,
        mode,
      });
    }
  }, [currentProfile, navigation, mode]);

  const handleModeSwitch = useCallback(
    async (newMode: AppMode) => {
      await setMode(newMode);
      setCurrentIndex(0);
    },
    [setMode],
  );

  // Gradient colors for the card
  const cardGradientColors: [string, string, string] = isSocial
    ? [theme.colors.gradientCard.start, theme.colors.gradientCard.middle, theme.colors.gradientCard.end]
    : [theme.colors.gradientCard.start, theme.colors.gradientCard.middle, theme.colors.gradientCard.end];

  const modeToggleGradient: [string, string] = isSocial
    ? [theme.colors.gradient.start, theme.colors.gradient.end]
    : [theme.colors.gradient.start, theme.colors.gradient.end];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Proximity
          </Text>
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor: isSocial ? '#10B981' + '20' : '#3B82F6' + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.modeBadgeText,
                { color: isSocial ? '#10B981' : '#3B82F6' },
              ]}
            >
              {isSocial ? 'SOCIAL' : 'PRO'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconText}>{'\uD83D\uDD14'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconText}>{'\u2699\uFE0F'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Active Nearby Status ────────────────────────────────────────── */}
      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          12 active nearby
        </Text>
        <Text style={[styles.statusSeparator, { color: theme.colors.textTertiary }]}>
          {' \u00B7 '}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Downtown Core
        </Text>
      </View>

      {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.modeToggleContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.modeTab}
          onPress={() => handleModeSwitch('social')}
          activeOpacity={0.8}
        >
          {isSocial ? (
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modeTabGradient}
            >
              <Text style={styles.modeTabActiveText}>Social</Text>
            </LinearGradient>
          ) : (
            <View style={styles.modeTabInactive}>
              <Text style={[styles.modeTabInactiveText, { color: theme.colors.textTertiary }]}>
                Social
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeTab}
          onPress={() => handleModeSwitch('professional')}
          activeOpacity={0.8}
        >
          {!isSocial ? (
            <LinearGradient
              colors={['#0F766E', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modeTabGradient}
            >
              <Text style={styles.modeTabActiveText}>Professional</Text>
            </LinearGradient>
          ) : (
            <View style={styles.modeTabInactive}>
              <Text style={[styles.modeTabInactiveText, { color: theme.colors.textTertiary }]}>
                Professional
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Quick Action Pills ──────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        <View
          style={[
            styles.vibePill,
            {
              backgroundColor: theme.colors.primary + '18',
              borderColor: theme.colors.primary + '40',
            },
          ]}
        >
          <Text style={styles.vibePillEmoji}>{'\u2615'}</Text>
          <Text style={[styles.vibePillText, { color: theme.colors.primary }]}>
            Coffee Chat
          </Text>
          <Text style={[styles.vibePillTimer, { color: theme.colors.textTertiary }]}>
            28m
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.actionPill,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionPillText, { color: theme.colors.text }]}>
            + Set Vibe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionPill,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Filters')}
        >
          <Text style={styles.actionPillIcon}>{'\u26A1'}</Text>
          <Text style={[styles.actionPillText, { color: theme.colors.text }]}>
            Filter
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Main Card Stack ─────────────────────────────────────────────── */}
      <View style={styles.cardContainer}>
        {currentProfile && (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleProfilePress}
            style={styles.cardTouchable}
          >
            <LinearGradient
              colors={cardGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Distance Badge - Top Left */}
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>
                  {currentProfile.distance}m
                </Text>
              </View>

              {/* Match % Badge - Top Right */}
              <View
                style={[
                  styles.matchBadge,
                  { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <Text style={styles.matchBadgeText}>
                  {currentProfile.compatibility}%
                </Text>
              </View>

              {/* Center Avatar Emoji */}
              <View style={styles.avatarEmojiContainer}>
                <View style={styles.avatarEmojiCircle}>
                  <Text style={styles.avatarEmoji}>{currentProfile.emoji}</Text>
                </View>
              </View>

              {/* Bottom Info */}
              <View style={styles.cardBottom}>
                <Text style={styles.cardName}>
                  {currentProfile.displayName}
                  {isSocial
                    ? ` ${currentProfile.age}`
                    : ''}
                </Text>
                {!isSocial && currentProfile.role && (
                  <Text style={styles.cardRole}>
                    {currentProfile.role}
                    {currentProfile.company ? ` @ ${currentProfile.company}` : ''}
                  </Text>
                )}

                {/* Tags */}
                <View style={styles.cardTags}>
                  {currentProfile.tags.map((tag) => (
                    <View key={tag} style={styles.cardTag}>
                      <Text style={styles.cardTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Swipe Action Buttons ────────────────────────────────────────── */}
      {currentProfile && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={() => handleSwipe('left')}
            activeOpacity={0.8}
          >
            <Text style={styles.passButtonText}>{'\u2715'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={modeToggleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.likeButton}
            >
              <Text style={styles.likeButtonText}>{'\u2665'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusSeparator: {
    fontSize: 13,
  },

  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    padding: 4,
  },
  modeTab: {
    flex: 1,
  },
  modeTabGradient: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActiveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modeTabInactive: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabInactiveText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Quick Action Pills
  pillsScroll: {
    marginTop: 12,
    maxHeight: 44,
  },
  pillsRow: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  vibePillEmoji: {
    fontSize: 14,
  },
  vibePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  vibePillTimer: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  actionPillIcon: {
    fontSize: 13,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Card Container
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  cardTouchable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },

  // Distance Badge
  distanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Match % Badge
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Avatar Emoji
  avatarEmojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatarEmojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 56,
  },

  // Card Bottom
  cardBottom: {
    gap: 6,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardRole: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  cardTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  passButtonText: {
    fontSize: 28,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  likeButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
});

export default DiscoverScreen;
