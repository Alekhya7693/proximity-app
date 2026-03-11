import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore } from '../../store/modeStore';
import { matchesApi, Match } from '../../api/matches';
import { formatters } from '../../utils/formatters';
import { enteringAnim } from '../../utils/animations';
import CompatibilityBadge from '../../components/CompatibilityBadge';
import ModeToggle from '../../components/ModeToggle';
import EmptyState from '../../components/EmptyState';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Matches'>;

const AVATAR_SIZE = 64;
const STORY_AVATAR_SIZE = 60;
const STORY_RING_SIZE = 68;
const PRIMARY = '#6C5CE7';
const PRIMARY_LIGHT = '#A29BFE';
const SECONDARY = '#FD79A8';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PulsingDot: React.FC<{ color: string }> = ({ color }) => (
  <Animated.View
    style={[
      styles.onlineDotOuter,
      { borderColor: '#FFFFFF' },
    ]}
  >
    <View style={[styles.onlineDotInner, { backgroundColor: color }]} />
  </Animated.View>
);

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode } = useModeStore();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMatches = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        const result = await matchesApi.getMatches(mode, pageNum);
        if (refresh || pageNum === 1) {
          setMatches(result.matches);
        } else {
          setMatches((prev) => [...prev, ...result.matches]);
        }
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [mode],
  );

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    loadMatches(1, true);
  }, [mode, loadMatches]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    loadMatches(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMatches(nextPage);
  };

  const handleMatchPress = (match: Match) => {
    navigation.navigate('ChatList');
  };

  // Derive new matches (first 3 without last messages or most recent)
  const newMatches = matches.slice(0, 3);

  const renderNewMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => handleMatchPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.storyRing, { borderColor: PRIMARY }]}>
        <Image
          source={{ uri: item.profilePhoto }}
          style={styles.storyAvatar}
          defaultSource={require('../../../assets/icon.png')}
        />
        {item.isOnline && (
          <View style={styles.storyOnlineDot}>
            <View style={[styles.storyOnlineDotInner, { backgroundColor: theme.colors.success }]} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.storyName,
          { color: theme.colors.text },
        ]}
        numberOfLines={1}
      >
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  const renderMatch = ({ item, index }: { item: Match; index: number }) => {
    const hasUnread = item.lastMessage && !item.lastMessage.isRead;

    return (
      <AnimatedTouchable
        entering={enteringAnim(FadeInDown.delay(index * 80).duration(400).springify())}
        style={[
          styles.matchCard,
          {
            backgroundColor: theme.colors.surfaceElevated,
            shadowColor: theme.colors.cardShadow,
          },
        ]}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.matchLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.profilePhoto }}
              style={styles.avatar}
              defaultSource={require('../../../assets/icon.png')}
            />
            {item.isOnline && <PulsingDot color={theme.colors.success} />}
          </View>
          <View style={styles.matchInfo}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.displayName,
                  { color: theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {item.displayName}
              </Text>
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: PRIMARY }]}>
                  <Text style={styles.unreadBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            {item.lastMessage ? (
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: hasUnread
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    fontWeight: hasUnread ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.text}
              </Text>
            ) : (
              <Text
                style={[
                  styles.sayHello,
                  { color: PRIMARY },
                ]}
              >
                Say hello! {'\uD83D\uDC4B'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.matchRight}>
          <CompatibilityBadge score={item.compatibilityScore} />
          {item.lastMessage && (
            <Text
              style={[
                styles.timeStamp,
                { color: theme.colors.textTertiary },
              ]}
            >
              {formatters.formatRelativeTime(item.lastMessage.sentAt)}
            </Text>
          )}
        </View>
      </AnimatedTouchable>
    );
  };

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.borderLight }]} />
  );

  const renderListHeader = () => {
    if (newMatches.length === 0) return null;

    return (
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500))}
        style={styles.newMatchesSection}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text },
          ]}
        >
          New Matches
        </Text>
        <FlatList
          data={newMatches}
          renderItem={renderNewMatchItem}
          keyExtractor={(item) => `new-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
        />
        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.borderLight }]} />
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text, marginTop: 16 },
          ]}
        >
          Messages
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <ModeToggle />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Matches
          </Text>
          <Text style={styles.headerEmoji}>{'\uD83D\uDC9C'}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && matches.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No Matches Yet"
          message="Keep swiping to find your matches! Compatible people near you will appear here."
        />
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={PRIMARY}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerEmoji: {
    fontSize: 20,
  },

  // ── Loading ─────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── New Matches (Stories) ───────────────────────────
  newMatchesSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 12,
    opacity: 0.5,
  },
  storiesContainer: {
    paddingRight: 8,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyAvatar: {
    width: STORY_AVATAR_SIZE,
    height: STORY_AVATAR_SIZE,
    borderRadius: STORY_AVATAR_SIZE / 2,
  },
  storyOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyOnlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  sectionDivider: {
    height: 1,
    marginTop: 16,
    marginHorizontal: 4,
  },

  // ── List ────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // ── Match Card ──────────────────────────────────────
  matchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginVertical: 4,
    // Shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Shadow (Android)
    elevation: 3,
  },
  matchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // ── Avatar ──────────────────────────────────────────
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  onlineDotOuter: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ── Match Info ──────────────────────────────────────
  matchInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  sayHello: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // ── Unread Badge ────────────────────────────────────
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // ── Match Right ─────────────────────────────────────
  matchRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeStamp: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Separator ───────────────────────────────────────
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 92,
  },
});

export default MatchesScreen;
