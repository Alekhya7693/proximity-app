import React, { useState } from 'react';
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

// ── Component ────────────────────────────────────────────────────────────────

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const unreadCount = MOCK_CHATS.filter((c) => c.unreadCount > 0).length;

  const filteredChats = MOCK_CHATS.filter((chat) => {
    if (activeFilter === 'unread') return chat.unreadCount > 0;
    if (activeFilter === 'active') return chat.isActive;
    return true;
  });

  // Find the TidalWave chat for the warning banner
  const expiringChat = MOCK_CHATS.find(
    (c) => c.displayName === 'TidalWave' && c.isExpired,
  );

  const handleChatPress = (chat: ChatItem) => {
    (navigation as any).navigate('ChatDetail', {
      matchId: chat.matchId,
      recipientName: chat.displayName,
      recipientAvatar: chat.emoji,
      isActive: chat.isActive,
    });
  };

  // ── Filter Tabs ─────────────────────────────────────────────────────────

  const renderFilters = () => (
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
        onPress={() => setActiveFilter('all')}
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
        onPress={() => setActiveFilter('unread')}
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
        onPress={() => setActiveFilter('active')}
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
  );

  // ── Chat Item ───────────────────────────────────────────────────────────

  const renderChatItem = ({ item }: { item: ChatItem }) => {
    const isExpired = item.isExpired;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: theme.colors.surfaceElevated,
            opacity: isExpired ? 0.5 : 1,
          },
        ]}
        onPress={() => handleChatPress(item)}
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
                  ? theme.colors.textTertiary + '15'
                  : theme.colors.primary + '10',
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
                { color: isExpired ? theme.colors.textTertiary : theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {item.displayName}
            </Text>
            <Text
              style={[
                styles.chatTime,
                {
                  color: hasUnread
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
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
                    ? theme.colors.textTertiary
                    : hasUnread
                      ? theme.colors.text
                      : theme.colors.textSecondary,
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
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
