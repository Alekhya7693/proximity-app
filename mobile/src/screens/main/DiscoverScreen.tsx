import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore, AppMode } from '../../store/modeStore';
import ProfileCard from '../../components/ProfileCard';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Discover'>;

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
  { id: '1', displayName: 'UrbanFox', age: 27, emoji: '\uD83E\uDD8A', distance: 80, compatibility: 94, tags: ['Coffee', 'Photography', 'Hiking', 'Live Music'] },
  { id: '2', displayName: 'NeonDrift', age: 24, emoji: '\uD83C\uDF1F', distance: 120, compatibility: 87, tags: ['Art', 'Gaming', 'Anime', 'Cooking'] },
  { id: '3', displayName: 'WildPetal', age: 29, emoji: '\uD83C\uDF3A', distance: 45, compatibility: 91, tags: ['Yoga', 'Reading', 'Travel', 'Wine'] },
  { id: '7', displayName: 'LunarMist', age: 25, emoji: '\uD83C\uDF19', distance: 95, compatibility: 89, tags: ['Music', 'Dancing', 'Festivals', 'Vegan'] },
  { id: '8', displayName: 'EmberSpark', age: 30, emoji: '\uD83D\uDD25', distance: 60, compatibility: 92, tags: ['Fitness', 'Outdoor', 'Dogs', 'Brunch'] },
  { id: '9', displayName: 'TidalWave', age: 26, emoji: '\uD83C\uDF0A', distance: 110, compatibility: 85, tags: ['Surfing', 'Beach', 'Meditation', 'Travel'] },
];

const PROFESSIONAL_PROFILES: MockProfile[] = [
  { id: '4', displayName: 'AlexChen', emoji: '\uD83D\uDCBC', age: 31, distance: 150, compatibility: 91, role: 'Product Manager', company: 'Stripe', tags: ['Fintech', 'Product Strategy', 'SaaS'] },
  { id: '5', displayName: 'MayaPatel', emoji: '\uD83D\uDE80', age: 28, distance: 200, compatibility: 88, role: 'Senior Engineer', company: 'Vercel', tags: ['React', 'TypeScript', 'Open Source'] },
  { id: '6', displayName: 'JordanLee', emoji: '\uD83C\uDFA8', age: 26, distance: 90, compatibility: 85, role: 'UX Designer', company: 'Figma', tags: ['Design Systems', 'Prototyping', 'User Research'] },
  { id: '10', displayName: 'SamKim', emoji: '\uD83D\uDCCA', age: 33, distance: 170, compatibility: 90, role: 'Data Scientist', company: 'Databricks', tags: ['ML', 'Python', 'Analytics'] },
  { id: '11', displayName: 'TaylorNg', emoji: '\uD83C\uDFAF', age: 29, distance: 80, compatibility: 86, role: 'Marketing Lead', company: 'Notion', tags: ['Growth', 'Content', 'Community'] },
  { id: '12', displayName: 'RileyPark', emoji: '\u26A1', age: 27, distance: 130, compatibility: 83, role: 'Founding Engineer', company: 'Stealth', tags: ['Startup', 'Full Stack', 'AI'] },
];

// ── Component ────────────────────────────────────────────────────────────────

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode, setMode } = useModeStore();
  const isSocial = mode === 'social';

  const profiles = useMemo(
    () => (isSocial ? SOCIAL_PROFILES : PROFESSIONAL_PROFILES),
    [isSocial],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenAll, setSeenAll] = useState(false);
  const currentProfile = seenAll ? null : profiles[currentIndex] || null;

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right' && currentProfile) {
        // 40% chance of match when swiping right
        if (Math.random() < 0.4) {
          (navigation as any).navigate('MatchPrompt', {
            matchId: 'match-' + currentProfile.id,
            userName: currentProfile.displayName,
            userAvatar: currentProfile.emoji,
            distance: currentProfile.distance,
            compatibility: currentProfile.compatibility,
          });
        }
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= profiles.length) {
        setSeenAll(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentProfile, currentIndex, profiles.length, navigation],
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
      setSeenAll(false);
    },
    [setMode],
  );

  // Memoized gradient colors for the card
  const cardGradientColors = useMemo<[string, string, string]>(
    () => [theme.colors.gradientCard.start, theme.colors.gradientCard.middle, theme.colors.gradientCard.end],
    [theme.colors.gradientCard.start, theme.colors.gradientCard.middle, theme.colors.gradientCard.end],
  );

  const modeToggleGradient = useMemo<[string, string]>(
    () => [theme.colors.gradient.start, theme.colors.gradient.end],
    [theme.colors.gradient.start, theme.colors.gradient.end],
  );

  const handleSwipeLeft = useCallback(() => handleSwipe('left'), [handleSwipe]);
  const handleSwipeRight = useCallback(() => handleSwipe('right'), [handleSwipe]);

  const handleNotifications = useCallback(
    () => navigation.navigate('Notifications'),
    [navigation],
  );
  const handleSettings = useCallback(
    () => navigation.navigate('Settings'),
    [navigation],
  );
  const handleCoffeePill = useCallback(
    () => (navigation as any).navigate('SetVibe', { preSelectedVibe: 'coffee' }),
    [navigation],
  );
  const handleSetVibe = useCallback(
    () => (navigation as any).navigate('SetVibe'),
    [navigation],
  );
  const handleFilters = useCallback(
    () => navigation.navigate('Filters'),
    [navigation],
  );
  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setSeenAll(false);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            MYKO
          </Text>
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor: isSocial ? '#0EA5E9' + '20' : '#D4A853' + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.modeBadgeText,
                { color: isSocial ? '#0EA5E9' : '#D4A853' },
              ]}
            >
              {isSocial ? 'SOCIAL' : 'PRO'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: theme.colors.surface }]}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconText}>{'\uD83D\uDD14'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: theme.colors.surface }]}
            onPress={handleSettings}
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
              colors={['#0EA5E9', '#F97316']}
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
              colors={['#1E3A5F', '#D4A853']}
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
        <TouchableOpacity
          style={[
            styles.vibePill,
            {
              backgroundColor: theme.colors.primary + '18',
              borderColor: theme.colors.primary + '40',
            },
          ]}
          activeOpacity={0.7}
          onPress={handleCoffeePill}
        >
          <Text style={styles.vibePillEmoji}>{'\u2615'}</Text>
          <Text style={[styles.vibePillText, { color: theme.colors.primary }]}>
            Coffee Chat
          </Text>
          <Text style={[styles.vibePillTimer, { color: theme.colors.textTertiary }]}>
            28m
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
          onPress={handleSetVibe}
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
          onPress={handleFilters}
        >
          <Text style={styles.actionPillIcon}>{'\u26A1'}</Text>
          <Text style={[styles.actionPillText, { color: theme.colors.text }]}>
            Filter
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Main Card Stack ─────────────────────────────────────────────── */}
      <View style={styles.cardContainer}>
        {currentProfile ? (
          <ProfileCard
            profile={currentProfile}
            isSocial={isSocial}
            gradientColors={cardGradientColors}
            onPress={handleProfilePress}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>{'\u2728'}</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No more people nearby</Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>Check back later or expand your radius</Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={styles.emptyStateButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Swipe Action Buttons ────────────────────────────────────────── */}
      {currentProfile && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={handleSwipeLeft}
            activeOpacity={0.8}
          >
            <Text style={styles.passButtonText}>{'\u2715'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSwipeRight}
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
        shadowColor: '#0EA5E9',
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DiscoverScreen;
