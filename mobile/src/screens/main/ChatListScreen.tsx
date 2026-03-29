import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { chatApi, ChatPreview } from '../../api/chat';
import { showAlert } from '../../utils/alert';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'ChatList'>;

type FilterTab = 'all' | 'unread' | 'active';

// ── Row height constant for getItemLayout ────────────────────────────────────
const CHAT_ROW_HEIGHT = 82;
const SEPARATOR_HEIGHT = 4;

// ── Time formatting ─────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── Memoized Separator ───────────────────────────────────────────────────────
const ItemSeparator = React.memo(() => <View style={styles.separator} />);
ItemSeparator.displayName = 'ItemSeparator';

// ── Memoized Chat Row ────────────────────────────────────────────────────────

interface ChatRowProps {
  item: ChatPreview;
  onPress: (chat: ChatPreview) => void;
  surfaceColor: string;
  primaryColor: string;
  textColor: string;
  secondaryColor: string;
  tertiaryColor: string;
}

const ChatRow = React.memo<ChatRowProps>(
  ({
    item,
    onPress,
    surfaceColor,
    primaryColor,
    textColor,
    secondaryColor,
    tertiaryColor,
  }) => {
    const hasUnread = item.unreadCount > 0;
    const handlePress = useCallback(() => onPress(item), [onPress, item]);
    const timeAgo = formatTimeAgo(item.lastMessageAt);

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: surfaceColor }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: primaryColor + '10' },
            ]}
          >
            <Text style={styles.avatarEmoji}>{'\uD83D\uDC64'}</Text>
          </View>
          {item.isOnline && (
            <View style={styles.onlineDot}>
              <View style={styles.onlineDotInner} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text
              style={[styles.chatName, { color: textColor }]}
              numberOfLines={1}
            >
              {item.recipientName}
            </Text>
            <Text
              style={[
                styles.chatTime,
                {
                  color: hasUnread ? primaryColor : tertiaryColor,
                  fontWeight: hasUnread ? '600' : '400',
                },
              ]}
            >
              {timeAgo}
            </Text>
          </View>
          <View style={styles.chatBottomRow}>
            <Text
              style={[
                styles.chatMessage,
                {
                  color: hasUnread ? textColor : secondaryColor,
                  fontWeight: hasUnread ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {item.isTyping ? 'typing...' : item.lastMessage}
            </Text>
            {hasUnread && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: primaryColor },
                ]}
              >
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.matchId === next.item.matchId &&
    prev.item.unreadCount === next.item.unreadCount &&
    prev.item.isOnline === next.item.isOnline &&
    prev.item.lastMessage === next.item.lastMessage &&
    prev.item.isTyping === next.item.isTyping &&
    prev.surfaceColor === next.surfaceColor &&
    prev.primaryColor === next.primaryColor,
);

ChatRow.displayName = 'ChatRow';

// ── Component ────────────────────────────────────────────────────────────────

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch chats ───────────────────────────────────────────────────────────

  const loadChats = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await chatApi.getChatList();
      setChats(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to load chats';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadChats(true);
  }, [loadChats]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const unreadCount = useMemo(
    () => chats.filter((c) => c.unreadCount > 0).length,
    [chats],
  );

  const filteredChats = useMemo(() => {
    if (activeFilter === 'unread') return chats.filter((c) => c.unreadCount > 0);
    if (activeFilter === 'active') return chats.filter((c) => c.isOnline);
    return chats;
  }, [activeFilter, chats]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChatPress = useCallback(
    (chat: ChatPreview) => {
      (navigation as any).navigate('ChatDetail', {
        matchId: chat.matchId,
        recipientId: chat.recipientId,
        recipientName: chat.recipientName,
        recipientAvatar: chat.recipientPhoto || '\uD83D\uDC64',
        isActive: true,
      });
    },
    [navigation],
  );

  const handleComposePress = useCallback(
    () =>
      showAlert(
        'Start a Conversation',
        'Start a new conversation by matching with someone on the Discover tab.',
      ),
    [],
  );

  const handleFilterAll = useCallback(() => setActiveFilter('all'), []);
  const handleFilterUnread = useCallback(() => setActiveFilter('unread'), []);
  const handleFilterActive = useCallback(() => setActiveFilter('active'), []);

  // ── Filter Tabs ───────────────────────────────────────────────────────────

  const renderFilters = useCallback(
    () => (
      <View
        style={[
          styles.filterRow,
          { borderBottomColor: theme.colors.borderLight },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'all' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={handleFilterAll}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'all' ? theme.colors.primary : theme.colors.textTertiary,
                fontWeight: activeFilter === 'all' ? '700' : '500',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'unread' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={handleFilterUnread}
          activeOpacity={0.7}
        >
          <View style={styles.filterTabInner}>
            <Text
              style={[
                styles.filterTabText,
                {
                  color: activeFilter === 'unread' ? theme.colors.primary : theme.colors.textTertiary,
                  fontWeight: activeFilter === 'unread' ? '700' : '500',
                },
              ]}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'active' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={handleFilterActive}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'active' ? theme.colors.primary : theme.colors.textTertiary,
                fontWeight: activeFilter === 'active' ? '700' : '500',
              },
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [activeFilter, theme.colors, unreadCount, handleFilterAll, handleFilterUnread, handleFilterActive],
  );

  // ── Chat Item Render ──────────────────────────────────────────────────────

  const renderChatItem = useCallback(
    ({ item }: { item: ChatPreview }) => (
      <ChatRow
        item={item}
        onPress={handleChatPress}
        surfaceColor={theme.colors.surfaceElevated}
        primaryColor={theme.colors.primary}
        textColor={theme.colors.text}
        secondaryColor={theme.colors.textSecondary}
        tertiaryColor={theme.colors.textTertiary}
      />
    ),
    [handleChatPress, theme.colors],
  );

  const keyExtractor = useCallback((item: ChatPreview) => item.matchId, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<ChatPreview> | null | undefined, index: number) => ({
      length: CHAT_ROW_HEIGHT,
      offset: (CHAT_ROW_HEIGHT + SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );

  // ── Loading / Error / Empty states ────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Chats
          </Text>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
            Chats
          </Text>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerStateEmoji}>{'\u26A0\uFE0F'}</Text>
          <Text style={[styles.centerStateTitle, { color: theme.colors.text }]}>
            Unable to load chats
          </Text>
          <Text style={[styles.centerStateText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadChats()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
          Chats
        </Text>
        <TouchableOpacity
          style={[styles.composeButton, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.7}
          onPress={handleComposePress}
        >
          <Text style={styles.composeIcon}>{'\u270F\uFE0F'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilters()}

      {/* Chat List or Empty */}
      {filteredChats.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.centerStateEmoji}>{'\uD83D\uDCAC'}</Text>
          <Text style={[styles.centerStateTitle, { color: theme.colors.text }]}>
            {activeFilter === 'all' ? 'No conversations yet' : `No ${activeFilter} chats`}
          </Text>
          <Text style={[styles.centerStateText, { color: theme.colors.textSecondary }]}>
            {activeFilter === 'all'
              ? 'Match with someone and say hi to start chatting!'
              : 'Try switching to the "All" tab.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ItemSeparator}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 54;

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
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeIcon: {
    fontSize: 18,
  },

  // Center states
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
    marginTop: 4,
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

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  filterTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTabText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  separator: {
    height: 4,
  },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },

  // Chat Content
  chatContent: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  chatTime: {
    fontSize: 12,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
    lineHeight: 19,
  },

  // Unread Badge
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default ChatListScreen;
