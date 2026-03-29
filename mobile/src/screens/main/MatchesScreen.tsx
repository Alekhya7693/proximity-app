import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore } from '../../store/modeStore';
import { matchesApi, Match } from '../../api/matches';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Matches'>;

// ── Row height constant for getItemLayout ────────────────────────────────────
const MATCH_ROW_HEIGHT = 80;
const SEPARATOR_HEIGHT = 8;

// ── Memoized Separator ───────────────────────────────────────────────────────
const ItemSeparator = React.memo(() => <View style={styles.separator} />);
ItemSeparator.displayName = 'ItemSeparator';

// ── Memoized Match Row ───────────────────────────────────────────────────────

interface MatchRowProps {
  item: Match;
  onPress: (match: Match) => void;
  surfaceColor: string;
  primaryColor: string;
  textColor: string;
  tertiaryColor: string;
  gradientStart: string;
  gradientEnd: string;
}

const MatchRow = React.memo<MatchRowProps>(
  ({
    item,
    onPress,
    surfaceColor,
    primaryColor,
    textColor,
    tertiaryColor,
    gradientStart,
    gradientEnd,
  }) => {
    const handlePress = useCallback(() => onPress(item), [onPress, item]);
    const hasChatted = !!item.lastMessage;
    const timeAgo = formatTimeAgo(item.matchedAt);

    return (
      <TouchableOpacity
        style={[styles.matchRow, { backgroundColor: surfaceColor }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Avatar */}
        <View
          style={[
            styles.matchAvatar,
            { backgroundColor: primaryColor + '10' },
          ]}
        >
          <Text style={styles.matchEmoji}>
            {item.profilePhoto ? '\uD83D\uDC64' : '\uD83D\uDC64'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={[styles.matchName, { color: textColor }]}>
              {item.displayName}
            </Text>
            <View
              style={[
                styles.matchPercent,
                { backgroundColor: primaryColor + '15' },
              ]}
            >
              <Text
                style={[styles.matchPercentText, { color: primaryColor }]}
              >
                {item.compatibilityScore}%
              </Text>
            </View>
          </View>
          <Text style={[styles.matchTimeAgo, { color: tertiaryColor }]}>
            {timeAgo}
          </Text>
        </View>

        {/* Action Button */}
        {hasChatted ? (
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatButton}
          >
            <Text style={styles.chatButtonText}>Chat</Text>
          </LinearGradient>
        ) : (
          <View
            style={[styles.sayHiOutlineButton, { borderColor: primaryColor }]}
          >
            <Text style={[styles.sayHiOutlineText, { color: primaryColor }]}>
              Say Hi
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.lastMessage?.text === next.item.lastMessage?.text &&
    prev.surfaceColor === next.surfaceColor &&
    prev.primaryColor === next.primaryColor,
);

MatchRow.displayName = 'MatchRow';

// ── Time formatting ─────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { mode } = useModeStore();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch matches ─────────────────────────────────────────────────────────

  const loadMatches = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await matchesApi.getMatches(mode);
      setMatches(result.matches);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to load matches';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [mode]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMatches(true);
  }, [loadMatches]);

  // ── Separate waiting (no chat) and active matches ─────────────────────────

  const waitingMatches = useMemo(
    () => matches.filter((m) => !m.lastMessage),
    [matches],
  );

  const allMatches = matches;

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleMatchPress = useCallback(
    (match: Match) => {
      if (match.lastMessage) {
        (navigation as any).navigate('ChatList', {
          screen: 'ChatDetail',
          params: {
            matchId: match.id,
            recipientId: match.userId,
            recipientName: match.displayName,
            recipientAvatar: match.profilePhoto || '\uD83D\uDC64',
            isActive: true,
          },
        });
      } else {
        navigation.navigate('MatchPrompt', {
          matchId: match.id,
          userId: match.userId,
          userName: match.displayName,
          userAvatar: match.profilePhoto || '\uD83D\uDC64',
          distance: match.distance || 0,
          compatibility: match.compatibilityScore,
        });
      }
    },
    [navigation],
  );

  const handleWaitingPress = useCallback(
    (match: Match) => {
      navigation.navigate('MatchPrompt', {
        matchId: match.id,
        userId: match.userId,
        userName: match.displayName,
        userAvatar: match.profilePhoto || '\uD83D\uDC64',
        distance: match.distance || 0,
        compatibility: match.compatibilityScore,
      });
    },
    [navigation],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const renderMatchItem = useCallback(
    ({ item }: { item: Match }) => (
      <MatchRow
        item={item}
        onPress={handleMatchPress}
        surfaceColor={theme.colors.surfaceElevated}
        primaryColor={theme.colors.primary}
        textColor={theme.colors.text}
        tertiaryColor={theme.colors.textTertiary}
        gradientStart={theme.colors.gradient.start}
        gradientEnd={theme.colors.gradient.end}
      />
    ),
    [handleMatchPress, theme.colors],
  );

  const keyExtractor = useCallback((item: Match) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Match> | null | undefined, index: number) => ({
      length: MATCH_ROW_HEIGHT,
      offset: (MATCH_ROW_HEIGHT + SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );

  const totalBadgeText = useMemo(
    () => `${allMatches.length} total`,
    [allMatches.length],
  );

  const renderWaitingItem = useCallback(
    (match: Match) => (
      <TouchableOpacity
        key={match.id}
        style={styles.waitingItem}
        onPress={() => handleWaitingPress(match)}
        activeOpacity={0.7}
      >
        <View style={styles.waitingAvatarContainer}>
          <View
            style={[
              styles.waitingAvatar,
              {
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary + '40',
              },
            ]}
          >
            <Text style={styles.waitingEmoji}>{'\uD83D\uDC64'}</Text>
          </View>
          {match.isOnline && (
            <View style={styles.notificationDot} />
          )}
        </View>
        <Text
          style={[styles.waitingName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {match.displayName}
        </Text>
        <Text
          style={[styles.waitingTime, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {formatTimeAgo(match.matchedAt)}
        </Text>
      </TouchableOpacity>
    ),
    [handleWaitingPress, theme.colors],
  );

  const renderListHeader = useCallback(
    () => (
      <View>
        {/* Waiting to Say Hi Section */}
        {waitingMatches.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
              >
                WAITING TO SAY HI
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.waitingScroll}
              style={styles.waitingContainer}
            >
              {waitingMatches.map(renderWaitingItem)}
            </ScrollView>
          </>
        )}

        {/* All Matches Label */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
          >
            ALL MATCHES
          </Text>
        </View>
      </View>
    ),
    [theme.colors.textTertiary, waitingMatches, renderWaitingItem],
  );

  // ── Loading / Error / Empty ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Matches
          </Text>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.centerStateText, { color: theme.colors.textSecondary }]}>
            Loading matches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Matches
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerStateEmoji}>{'\u26A0\uFE0F'}</Text>
          <Text style={[styles.centerStateTitle, { color: theme.colors.text }]}>
            Unable to load matches
          </Text>
          <Text style={[styles.centerStateText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadMatches()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (allMatches.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Matches
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerStateEmoji}>{'\uD83D\uDC9C'}</Text>
          <Text style={[styles.centerStateTitle, { color: theme.colors.text }]}>
            No matches yet
          </Text>
          <Text style={[styles.centerStateText, { color: theme.colors.textSecondary }]}>
            Start swiping on the Discover tab to find your first match!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Matches
        </Text>
        <View
          style={[
            styles.totalBadge,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <Text
            style={[styles.totalBadgeText, { color: theme.colors.primary }]}
          >
            {totalBadgeText}
          </Text>
        </View>
      </View>

      {/* Match List */}
      <FlatList
        data={allMatches}
        renderItem={renderMatchItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        removeClippedSubviews={Platform.OS !== 'web'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={7}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const WAITING_AVATAR_SIZE = 64;
const MATCH_AVATAR_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Center states (loading / error / empty)
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  centerStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  centerStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  centerStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Section Labels
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Waiting Section
  waitingContainer: {
    maxHeight: 120,
  },
  waitingScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  waitingItem: {
    alignItems: 'center',
    width: 72,
  },
  waitingAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  waitingAvatar: {
    width: WAITING_AVATAR_SIZE,
    height: WAITING_AVATAR_SIZE,
    borderRadius: WAITING_AVATAR_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingEmoji: {
    fontSize: 28,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  waitingName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitingTime: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },

  // Match Row
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  matchAvatar: {
    width: MATCH_AVATAR_SIZE,
    height: MATCH_AVATAR_SIZE,
    borderRadius: MATCH_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchEmoji: {
    fontSize: 24,
  },
  matchInfo: {
    flex: 1,
    marginRight: 10,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  matchPercent: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchTimeAgo: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Action Buttons
  chatButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sayHiOutlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sayHiOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MatchesScreen;
