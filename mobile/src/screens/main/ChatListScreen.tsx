import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { showAlert } from '../../utils/alert';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'ChatList'>;

// ── Mock Data ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'active';

interface ChatItem {
  id: string;
  matchId: string;
  displayName: string;
  age: number;
  emoji: string;
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
  isOnline: boolean;
  isExpired: boolean;
  isActive: boolean;
}

const MOCK_CHATS: ChatItem[] = [
  {
    id: 'c1',
    matchId: 'm1',
    displayName: 'UrbanFox',
    age: 27,
    emoji: '\uD83E\uDD8A',
    lastMessage: 'That coffee shop sounds amazing! Want to check it out?',
    timeAgo: '2m',
    unreadCount: 3,
    isOnline: true,
    isExpired: false,
    isActive: true,
  },
  {
    id: 'c2',
    matchId: 'm3',
    displayName: 'WildPetal',
    age: 29,
    emoji: '\uD83C\uDF3A',
    lastMessage: 'I love that hiking trail too! We should go sometime.',
    timeAgo: '15m',
    unreadCount: 1,
    isOnline: true,
    isExpired: false,
    isActive: true,
  },
  {
    id: 'c3',
    matchId: 'm6',
    displayName: 'LunarMist',
    age: 23,
    emoji: '\uD83C\uDF19',
    lastMessage: 'See you at the gallery opening then!',
    timeAgo: '1h',
    unreadCount: 0,
    isOnline: false,
    isExpired: false,
    isActive: true,
  },
  {
    id: 'c4',
    matchId: 'm4',
    displayName: 'CosmicRay',
    age: 26,
    emoji: '\uD83C\uDF0C',
    lastMessage: 'That was a great conversation yesterday',
    timeAgo: '3h',
    unreadCount: 0,
    isOnline: false,
    isExpired: false,
    isActive: true,
  },
  {
    id: 'c5',
    matchId: 'm5',
    displayName: 'TidalWave',
    age: 31,
    emoji: '\uD83C\uDF0A',
    lastMessage: 'Chat expired - moved away',
    timeAgo: '1d',
    unreadCount: 0,
    isOnline: false,
    isExpired: true,
    isActive: false,
  },
  {
    id: 'c6',
    matchId: 'm7',
    displayName: 'EchoBlaze',
    age: 28,
    emoji: '\uD83D\uDD25',
    lastMessage: 'Chat expired - moved away',
    timeAgo: '2d',
    unreadCount: 0,
    isOnline: false,
    isExpired: true,
    isActive: false,
  },
];

// ── Row height constant for getItemLayout ────────────────────────────────────
const CHAT_ROW_HEIGHT = 82; // padding (14*2) + avatar (54) = 82
const SEPARATOR_HEIGHT = 4;

// ── Memoized Separator ───────────────────────────────────────────────────────
const ItemSeparator = React.memo(() => <View style={styles.separator} />);
ItemSeparator.displayName = 'ItemSeparator';

// ── Memoized Chat Row ────────────────────────────────────────────────────────

interface ChatRowProps {
  item: ChatItem;
  onPress: (chat: ChatItem) => void;
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
    const isExpired = item.isExpired;
    const hasUnread = item.unreadCount > 0;
    const handlePress = useCallback(() => onPress(item), [onPress, item]);

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: surfaceColor,
            opacity: isExpired ? 0.5 : 1,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={isExpired}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isExpired
                  ? tertiaryColor + '15'
                  : primaryColor + '10',
              },
            ]}
          >
            <Text style={[styles.avatarEmoji, isExpired && styles.expiredEmoji]}>
              {item.emoji}
            </Text>
          </View>
          {item.isOnline && !isExpired && (
            <View style={styles.onlineDot}>
              <View style={styles.onlineDotInner} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text
              style={[
                styles.chatName,
                { color: isExpired ? tertiaryColor : textColor },
              ]}
              numberOfLines={1}
            >
              {item.displayName}
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
              {item.timeAgo}
            </Text>
          </View>
          <View style={styles.chatBottomRow}>
            <Text
              style={[
                styles.chatMessage,
                {
                  color: isExpired
                    ? tertiaryColor
                    : hasUnread
                      ? textColor
                      : secondaryColor,
                  fontWeight: hasUnread ? '600' : '400',
                  fontStyle: isExpired ? 'italic' : 'normal',
                },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
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
    prev.item.id === next.item.id &&
    prev.item.unreadCount === next.item.unreadCount &&
    prev.item.isOnline === next.item.isOnline &&
    prev.item.lastMessage === next.item.lastMessage &&
    prev.surfaceColor === next.surfaceColor &&
    prev.primaryColor === next.primaryColor,
);

ChatRow.displayName = 'ChatRow';

// ── Component ────────────────────────────────────────────────────────────────

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const unreadCount = useMemo(
    () => MOCK_CHATS.filter((c) => c.unreadCount > 0).length,
    [],
  );

  const filteredChats = useMemo(() => {
    if (activeFilter === 'unread') return MOCK_CHATS.filter((c) => c.unreadCount > 0);
    if (activeFilter === 'active') return MOCK_CHATS.filter((c) => c.isActive);
    return MOCK_CHATS;
  }, [activeFilter]);

  // Find the TidalWave chat for the warning banner
  const expiringChat = useMemo(
    () => MOCK_CHATS.find((c) => c.displayName === 'TidalWave' && c.isExpired),
    [],
  );

  const handleChatPress = useCallback(
    (chat: ChatItem) => {
      (navigation as any).navigate('ChatDetail', {
        matchId: chat.matchId,
        recipientName: chat.displayName,
        recipientAvatar: chat.emoji,
        isActive: chat.isActive,
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

  // ── Filter Tabs ─────────────────────────────────────────────────────────

  const renderFilters = useCallback(
    () => (
      <View
        style={[
          styles.filterRow,
          { borderBottomColor: theme.colors.borderLight },
        ]}
      >
        {/* All */}
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
                color:
                  activeFilter === 'all'
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                fontWeight: activeFilter === 'all' ? '700' : '500',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Unread */}
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
                  color:
                    activeFilter === 'unread'
                      ? theme.colors.primary
                      : theme.colors.textTertiary,
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

        {/* Active */}
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
                color:
                  activeFilter === 'active'
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
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
    ({ item }: { item: ChatItem }) => (
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

  const keyExtractor = useCallback((item: ChatItem) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<ChatItem> | null | undefined, index: number) => ({
      length: CHAT_ROW_HEIGHT,
      offset: (CHAT_ROW_HEIGHT + SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );

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

      {/* Chat List */}
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
      />

      {/* Warning Banner */}
      {expiringChat && (
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: theme.colors.warning + '15' },
          ]}
        >
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>
            {'\u26A0\uFE0F'} TidalWave chat expires in 46 hours. Move closer to
            unlock messaging again
          </Text>
        </View>
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
  expiredEmoji: {
    opacity: 0.4,
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

  // Warning Banner
  warningBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default ChatListScreen;
