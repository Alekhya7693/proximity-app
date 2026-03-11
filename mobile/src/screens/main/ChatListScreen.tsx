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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withSpring, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { chatApi, ChatPreview } from '../../api/chat';
import { formatters } from '../../utils/formatters';
import { enteringAnim } from '../../utils/animations';
import EmptyState from '../../components/EmptyState';
import type { MainTabScreenProps } from '../../navigation/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ── Pulsing Online Dot ─────────────────────────────────────────────────
const PulsingDot: React.FC = () => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1.35 + 0.3 - pulse.value * 0.3, // subtle opacity oscillation
  }));

  return (
    <Animated.View style={[styles.onlineDotOuter, animatedStyle]}>
      <View style={styles.onlineDotInner} />
    </Animated.View>
  );
};

// ── Typing Indicator ───────────────────────────────────────────────────
const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const bounce = (delay: number) =>
      withRepeat(
        withSequence(
          withTiming(0, { duration: delay }),
          withTiming(-3, { duration: 250, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 600 - delay }),
        ),
        -1,
        false,
      );
    dot1.value = bounce(0);
    dot2.value = bounce(150);
    dot3.value = bounce(300);
  }, [dot1, dot2, dot3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={styles.typingRow}>
      <Text style={styles.typingText}>typing</Text>
      <Animated.Text style={[styles.typingDot, s1]}>.</Animated.Text>
      <Animated.Text style={[styles.typingDot, s2]}>.</Animated.Text>
      <Animated.Text style={[styles.typingDot, s3]}>.</Animated.Text>
    </View>
  );
};

// ── Chat Card ──────────────────────────────────────────────────────────
interface ChatCardProps {
  item: ChatPreview;
  index: number;
  onPress: (chat: ChatPreview) => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ item, index, onPress }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.975, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const hasUnread = item.unreadCount > 0;

  return (
    <Animated.View
      entering={enteringAnim(FadeInDown.delay(index * 65).duration(400).springify().damping(16))}
    >
      <AnimatedTouchable
        style={[
          styles.chatCard,
          {
            backgroundColor: theme.colors.surfaceElevated,
            shadowColor: theme.colors.cardShadow,
          },
          hasUnread && styles.chatCardUnread,
          animatedCardStyle,
        ]}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatarRing,
              item.isOnline
                ? { borderColor: '#00B894' }
                : { borderColor: 'transparent' },
            ]}
          >
            <Image source={{ uri: item.recipientPhoto }} style={styles.avatar} />
          </View>
          {item.isOnline && <PulsingDot />}
        </View>

        {/* Content */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                styles.nameText,
                { color: theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {item.recipientName}
            </Text>
            <Text
              style={[
                styles.timestampText,
                {
                  color: hasUnread ? '#6C5CE7' : theme.colors.textTertiary,
                  fontWeight: hasUnread ? '600' : '400',
                },
              ]}
            >
              {formatters.formatRelativeTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.chatPreview}>
            {item.isTyping ? (
              <TypingIndicator />
            ) : (
              <Text
                style={[
                  styles.messageText,
                  {
                    color: hasUnread
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    fontWeight: hasUnread ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            )}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
};

// ── Separator ──────────────────────────────────────────────────────────
const Separator: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.separatorWrapper}>
      <View
        style={[
          styles.separator,
          { backgroundColor: theme.colors.borderLight },
        ]}
      />
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────
type Props = MainTabScreenProps<'ChatList'>;

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const result = await chatApi.getChatList();
      setChats(result);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadChats();
    });
    return unsubscribe;
  }, [navigation, loadChats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadChats();
  };

  const handleChatPress = (chat: ChatPreview) => {
    (navigation as any).navigate('ChatDetail', {
      matchId: chat.matchId,
      recipientName: chat.recipientName,
      recipientPhoto: chat.recipientPhoto,
    });
  };

  const renderChat = ({ item, index }: { item: ChatPreview; index: number }) => (
    <ChatCard item={item} index={index} onPress={handleChatPress} />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500))}
        style={[styles.headerBar, { borderBottomColor: theme.colors.borderLight }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>{'\uD83D\uDCAC'}</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Messages
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textTertiary }]}>
          {chats.length > 0
            ? `${chats.length} conversation${chats.length !== 1 ? 's' : ''}`
            : 'Your conversations appear here'}
        </Text>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <EmptyState
          title="No Messages Yet"
          message="Match with someone and start a conversation!"
        />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.matchId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={['#6C5CE7', '#A29BFE']}
            />
          }
          ItemSeparatorComponent={Separator}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
const AVATAR_SIZE = 62;
const AVATAR_RING_SIZE = AVATAR_SIZE + 6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerEmoji: {
    fontSize: 26,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 42, // align with title text after emoji
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Separator
  separatorWrapper: {
    paddingLeft: AVATAR_RING_SIZE + 16,
    paddingVertical: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },

  // Chat card
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginVertical: 3,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chatCardUnread: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarRing: {
    width: AVATAR_RING_SIZE,
    height: AVATAR_RING_SIZE,
    borderRadius: AVATAR_RING_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 184, 148, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B894',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Chat info
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  timestampText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },

  // Preview
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 19,
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6C5CE7',
    fontWeight: '500',
  },
  typingDot: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#6C5CE7',
    fontWeight: '700',
    lineHeight: 19,
  },

  // Unread badge
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    marginLeft: 10,
    backgroundColor: '#6C5CE7',
    // Gradient-like effect via layered shadow
    ...Platform.select({
      ios: {
        shadowColor: '#A29BFE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default ChatListScreen;
