import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore } from '../../store/modeStore';
import { useLocationStore } from '../../store/locationStore';
import { discoveryApi, DiscoveryProfile, SwipeResult } from '../../api/discovery';
import SwipeCard from '../../components/SwipeCard';
import ModeToggle from '../../components/ModeToggle';
import MatchPromptModal from '../../components/MatchPromptModal';
import EmptyState from '../../components/EmptyState';
import VibeSelector from '../../components/VibeSelector';
import { enteringAnim } from '../../utils/animations';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Discover'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Animated Action Button ────────────────────────────────────────────────────
// Wraps each action button with a spring bounce on press via reanimated
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ActionButtonProps {
  onPress: () => void;
  size: number;
  style: object;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onPress, size, style, children }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 8, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 6, stiffness: 300, mass: 0.8 });
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedTouchable>
  );
};

// ─── Floating Decorative Dot ───────────────────────────────────────────────────
// Small pulsing dots that float behind the card area for a premium ambient feel
interface FloatingDotProps {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const FloatingDot: React.FC<FloatingDotProps> = ({ x, y, size, color, delay }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2200 }),
          withTiming(0.15, { duration: 2200 }),
        ),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 3000 }),
          withTiming(12, { duration: 3000 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity, translateY]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        dotStyle,
      ]}
    />
  );
};

// ─── Pulsing Loader ────────────────────────────────────────────────────────────
const PulsingLoader: React.FC<{ color: string }> = ({ color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.loaderContainer, animStyle]}>
      <View style={[styles.loaderRing, { borderColor: color + '30' }]}>
        <View style={[styles.loaderRingInner, { borderColor: color }]}>
          <ActivityIndicator size="large" color={color} />
        </View>
      </View>
      <Text style={[styles.loaderText, { color: color + 'AA' }]}>
        Finding your vibe...
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DiscoverScreen
// ═══════════════════════════════════════════════════════════════════════════════
const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode } = useModeStore();
  const { currentLocation } = useLocationStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchResult, setMatchResult] = useState<SwipeResult | null>(null);
  const [showVibeSelector, setShowVibeSelector] = useState(false);
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const pageRef = useRef(1);

  // ── Data Loading ───────────────────────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    try {
      const result = await discoveryApi.getFeed(
        {
          mode,
          maxDistance: 50000,
          ageRange: { min: 18, max: 100 },
          genderPreference: [],
          vibes: activeVibes.length > 0 ? activeVibes : undefined,
        },
        pageRef.current,
      );

      if (pageRef.current === 1) {
        setProfiles(result.profiles);
        setCurrentIndex(0);
      } else {
        setProfiles((prev) => [...prev, ...result.profiles]);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mode, activeVibes]);

  useEffect(() => {
    pageRef.current = 1;
    setIsLoading(true);
    loadProfiles();
  }, [mode, activeVibes, loadProfiles]);

  // ── Swipe Handler ──────────────────────────────────────────────────────────
  const handleSwipe = async (direction: 'left' | 'right') => {
    const profile = profiles[currentIndex];
    if (!profile) return;

    const action = direction === 'right' ? 'like' : 'pass';

    try {
      const result = await discoveryApi.swipe({
        targetUserId: profile.id,
        action,
        mode,
      });

      if (result.matched) {
        setMatchResult(result);
      }
    } catch {
      console.error('Swipe failed');
    }

    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Preload more profiles when running low
      if (next >= profiles.length - 3) {
        pageRef.current += 1;
        loadProfiles();
      }
      return next;
    });
  };

  const handleProfilePress = (profile: DiscoveryProfile) => {
    navigation.navigate('ProfileDetail', { userId: profile.id });
  };

  const handleVibesSelected = (vibes: string[]) => {
    setActiveVibes(vibes);
    setShowVibeSelector(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentProfile = profiles[currentIndex];

  // Floating dots configuration — scattered around the card area
  const floatingDots: FloatingDotProps[] = [
    { x: 24, y: 60, size: 8, color: theme.colors.primary + '40', delay: 0 },
    { x: SCREEN_WIDTH - 50, y: 120, size: 6, color: theme.colors.secondary + '35', delay: 400 },
    { x: 40, y: SCREEN_HEIGHT * 0.42, size: 10, color: theme.colors.accent + '30', delay: 800 },
    { x: SCREEN_WIDTH - 65, y: SCREEN_HEIGHT * 0.35, size: 7, color: theme.colors.primaryLight + '40', delay: 1200 },
    { x: 60, y: SCREEN_HEIGHT * 0.22, size: 5, color: theme.colors.secondary + '25', delay: 600 },
    { x: SCREEN_WIDTH - 40, y: SCREEN_HEIGHT * 0.55, size: 9, color: theme.colors.primary + '25', delay: 1000 },
    { x: SCREEN_WIDTH * 0.5 - 10, y: 40, size: 6, color: theme.colors.accent + '20', delay: 1400 },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(100))}
        style={styles.header}
      >
        <ModeToggle />

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Discover
        </Text>

        <TouchableOpacity
          onPress={() => setShowVibeSelector(true)}
          activeOpacity={0.7}
          style={[
            styles.vibesButton,
            {
              backgroundColor: theme.colors.primary + '12',
              borderColor: theme.colors.primary + '25',
            },
          ]}
        >
          <Text style={styles.vibesButtonEmoji}>{'\u2728'}</Text>
          <Text style={[styles.vibesButtonText, { color: theme.colors.primary }]}>
            Vibes
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Active Vibes Chips Bar ────────────────────────────────────────── */}
      {activeVibes.length > 0 && (
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(400).delay(200))}
          style={styles.vibesBar}
        >
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibesScrollContent}
          >
            {activeVibes.map((vibe, index) => (
              <Animated.View
                key={vibe}
                entering={enteringAnim(FadeIn.duration(300).delay(index * 80))}
                style={[
                  styles.vibeChip,
                  {
                    backgroundColor: theme.colors.primary + '18',
                    borderColor: theme.colors.primary + '30',
                  },
                ]}
              >
                <View
                  style={[
                    styles.vibeChipDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.vibeChipText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {vibe}
                </Text>
              </Animated.View>
            ))}
            <TouchableOpacity
              onPress={() => setShowVibeSelector(true)}
              style={[
                styles.vibeChipAdd,
                { borderColor: theme.colors.textTertiary + '50' },
              ]}
            >
              <Text style={[styles.vibeChipAddText, { color: theme.colors.textTertiary }]}>
                + Add
              </Text>
            </TouchableOpacity>
          </Animated.ScrollView>
        </Animated.View>
      )}

      {/* ─── Card Container with Floating Decorations ──────────────────────── */}
      <View style={styles.cardContainer}>
        {/* Floating ambient dots */}
        {!isLoading && currentProfile && floatingDots.map((dot, i) => (
          <FloatingDot key={`dot-${i}`} {...dot} />
        ))}

        {isLoading ? (
          <PulsingLoader color={theme.colors.primary} />
        ) : !currentProfile ? (
          <Animated.View
            entering={enteringAnim(FadeIn.duration(600))}
            style={styles.emptyStateWrapper}
          >
            <View style={styles.premiumEmptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: theme.colors.primary + '10' },
                ]}
              >
                <Text style={styles.emptyEmoji}>{'\uD83C\uDF1F'}</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                You've seen everyone!
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                New people are joining all the time.{'\n'}Check back soon or broaden your vibes.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  pageRef.current = 1;
                  setIsLoading(true);
                  loadProfiles();
                }}
                activeOpacity={0.8}
                style={[
                  styles.emptyRefreshButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.emptyRefreshText}>Refresh Feed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowVibeSelector(true)}
                activeOpacity={0.7}
                style={[
                  styles.emptyVibesButton,
                  { borderColor: theme.colors.primary + '40' },
                ]}
              >
                <Text style={[styles.emptyVibesText, { color: theme.colors.primary }]}>
                  {'\u2728'} Adjust Vibes
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Next card behind — scaled down with reduced opacity */}
            {profiles[currentIndex + 1] && (
              <Animated.View
                entering={enteringAnim(FadeIn.duration(300))}
                style={[styles.cardWrapper, styles.nextCard]}
              >
                <SwipeCard
                  profile={profiles[currentIndex + 1]}
                  onSwipe={() => {}}
                  onPress={() => {}}
                  isActive={false}
                />
              </Animated.View>
            )}

            {/* Active card */}
            <Animated.View
              key={`card-${currentIndex}`}
              entering={enteringAnim(FadeIn.duration(400))}
              style={styles.cardWrapper}
            >
              <SwipeCard
                profile={currentProfile}
                onSwipe={handleSwipe}
                onPress={() => handleProfilePress(currentProfile)}
                isActive
              />
            </Animated.View>
          </>
        )}
      </View>

      {/* ─── Action Buttons ────────────────────────────────────────────────── */}
      {currentProfile && !isLoading && (
        <Animated.View
          entering={enteringAnim(FadeInUp.duration(500).delay(200))}
          style={styles.actionButtons}
        >
          {/* Pass Button */}
          <ActionButton
            onPress={() => handleSwipe('left')}
            size={72}
            style={styles.passBtn}
          >
            <Text style={styles.passBtnText}>{'\u2715'}</Text>
          </ActionButton>

          {/* Super-Like Button (star) */}
          <ActionButton
            onPress={() => handleSwipe('right')}
            size={56}
            style={[
              styles.superLikeBtn,
              {
                backgroundColor: theme.colors.accent,
              },
            ]}
          >
            <Text style={styles.superLikeBtnText}>{'\u2B50'}</Text>
          </ActionButton>

          {/* Like Button */}
          <ActionButton
            onPress={() => handleSwipe('right')}
            size={72}
            style={[
              styles.likeBtn,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.likeBtnText}>{'\u2665'}</Text>
          </ActionButton>
        </Animated.View>
      )}

      {/* ─── Match Prompt Modal ────────────────────────────────────────────── */}
      <MatchPromptModal
        visible={!!matchResult?.matched}
        matchedUser={matchResult?.matchedUser ?? null}
        matchId={matchResult?.matchId ?? ''}
        onSayHi={(matchId) => {
          setMatchResult(null);
          navigation.navigate('ChatList');
        }}
        onMaybeLater={() => setMatchResult(null)}
      />

      {/* ─── Vibe Selector Bottom Sheet ────────────────────────────────────── */}
      <VibeSelector
        visible={showVibeSelector}
        mode={mode}
        selectedVibes={activeVibes}
        onSelect={handleVibesSelected}
        onClose={() => setShowVibeSelector(false)}
      />
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ─── Container ────────────────────────────────────────────────────────────
  container: {
    flex: 1,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  vibesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  vibesButtonEmoji: {
    fontSize: 14,
  },
  vibesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ─── Vibes Chips Bar ──────────────────────────────────────────────────────
  vibesBar: {
    paddingBottom: 8,
  },
  vibesScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  vibeChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vibeChipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  vibeChipAdd: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  vibeChipAddText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── Card Container ───────────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
  },
  nextCard: {
    transform: [{ scale: 0.94 }],
    opacity: 0.55,
  },

  // ─── Action Buttons ───────────────────────────────────────────────────────
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 18,
    paddingBottom: Platform.OS === 'ios' ? 12 : 18,
    zIndex: 100,
    position: 'relative',
  },
  passBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FF6B6B',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  passBtnText: {
    fontSize: 32,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  superLikeBtn: {
    ...Platform.select({
      ios: {
        shadowColor: '#00CEC9',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  superLikeBtnText: {
    fontSize: 24,
  },
  likeBtn: {
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  likeBtnText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '400',
  },

  // ─── Loading State ────────────────────────────────────────────────────────
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRingInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ─── Premium Empty State ──────────────────────────────────────────────────
  emptyStateWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  premiumEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyRefreshButton: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyRefreshText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyVibesButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  emptyVibesText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DiscoverScreen;
