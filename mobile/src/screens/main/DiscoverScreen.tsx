import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore, AppMode } from '../../store/modeStore';
import { useAuthStore } from '../../store/authStore';
import { discoveryApi, DiscoveryProfile } from '../../api/discovery';
import ProfileCard from '../../components/ProfileCard';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Discover'>;

// ── Adapter: map API profile to ProfileCard data ─────────────────────────────

function toCardData(p: DiscoveryProfile) {
  return {
    id: p.id,
    displayName: p.displayName,
    age: p.age,
    emoji: p.profilePhotos.length > 0 ? '' : defaultEmoji(p.displayName),
    photo: p.profilePhotos[0],
    distance: p.distance,
    compatibility: p.compatibilityScore,
    tags: p.interests.slice(0, 4),
    role: p.profession,
    company: p.company,
  };
}

function defaultEmoji(name: string): string {
  const emojis = ['\uD83D\uDE04', '\uD83D\uDE0E', '\uD83E\uDD29', '\uD83E\uDD73', '\uD83E\uDD13', '\uD83E\uDD17', '\uD83E\uDDD1\u200D\uD83D\uDE80', '\uD83C\uDFA8'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return emojis[Math.abs(hash) % emojis.length];
}

// ── Component ────────────────────────────────────────────────────────────────

const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode, setMode } = useModeStore();
  const user = useAuthStore((s) => s.user);
  const isSocial = mode === 'social';

  // Data state
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);

  // ── Fetch discovery feed ──────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await discoveryApi.getFeed(
        {
          mode,
          maxDistance: 10000,
          ageRange: { min: 18, max: 99 },
          genderPreference: ['all'],
        },
        1,
        20,
      );
      setProfiles(result.profiles);
      setNearbyCount(result.profiles.length);
      setCurrentIndex(0);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to load profiles';
      setError(msg);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // ── Swipe handler ─────────────────────────────────────────────────────────

  const currentProfile = currentIndex < profiles.length ? profiles[currentIndex] : null;

  const handleSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      if (!currentProfile) return;

      try {
        const result = await discoveryApi.swipe({
          targetUserId: currentProfile.id,
          action: direction === 'right' ? 'like' : 'pass',
          mode,
        });

        if (result.matched && result.matchId) {
          (navigation as any).navigate('MatchPrompt', {
            matchId: result.matchId,
            userId: currentProfile.id,
            userName: currentProfile.displayName,
            userAvatar: currentProfile.profilePhotos[0] || defaultEmoji(currentProfile.displayName),
            distance: currentProfile.distance,
            compatibility: currentProfile.compatibilityScore,
          });
        }
      } catch {
        // Swipe failed silently — still advance the card
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [currentProfile, mode, navigation],
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
    },
    [setMode],
  );

  // Memoized gradient colors
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

  // ── Card data adapter ─────────────────────────────────────────────────────

  const cardData = currentProfile ? toCardData(currentProfile) : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
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

      {/* Active Nearby Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          {nearbyCount !== null ? `${nearbyCount} active nearby` : 'Scanning...'}
        </Text>
      </View>

      {/* Mode Toggle */}
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

      {/* Quick Action Pills */}
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

      {/* Main Card Stack */}
      <View style={styles.cardContainer}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary, marginTop: 16 }]}>
              Finding people nearby...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>{'\u26A0\uFE0F'}</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
              Something went wrong
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadFeed}
            >
              <Text style={styles.emptyStateButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : cardData ? (
          <ProfileCard
            profile={cardData}
            isSocial={isSocial}
            gradientColors={cardGradientColors}
            onPress={handleProfilePress}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>{'\u2728'}</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
              No more people nearby
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
              Check back later or expand your radius
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadFeed}
            >
              <Text style={styles.emptyStateButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Swipe Action Buttons */}
      {cardData && (
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
