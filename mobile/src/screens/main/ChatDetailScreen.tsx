import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { chatApi, Message } from '../../api/chat';
import { socketService } from '../../services/socket';
import ChatBubble from '../../components/ChatBubble';
import { formatters } from '../../utils/formatters';
import type { ChatStackScreenProps } from '../../navigation/types';

// ---------------------------------------------------------------------------
// Animated helpers (pure RN Animated API -- no extra deps)
// ---------------------------------------------------------------------------
import { Animated, Easing } from 'react-native';

/** Pulsing loader used while the initial message list is loading. */
const PulsingLoader: React.FC<{ color: string }> = ({ color }) => {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ opacity: pulse }}>
        <ActivityIndicator size="large" color={color} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.loadingLabel,
          { color, opacity: pulse },
        ]}
      >
        Loading messages
      </Animated.Text>
    </View>
  );
};

/** Three-dot bouncing typing indicator. */
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: -6,
            duration: 260,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 260,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 160);
    const a3 = bounce(dot3, 320);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: color,
    marginHorizontal: 2.5,
    transform: [{ translateY: anim }],
  });

  return (
    <View style={styles.typingDotsRow}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

/** Animated send button with scale feedback. */
const SendButton: React.FC<{
  enabled: boolean;
  primaryColor: string;
  primaryLightColor: string;
  disabledColor: string;
  onPress: () => void;
}> = ({ enabled, primaryColor, primaryLightColor, disabledColor, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.82,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={!enabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.sendButton,
          {
            backgroundColor: enabled ? primaryColor : disabledColor,
            transform: [{ scale }],
            // subtle outer glow when active
            ...(enabled
              ? {
                  shadowColor: primaryLightColor,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.45,
                  shadowRadius: 8,
                  elevation: 6,
                }
              : {}),
          },
        ]}
      >
        <Text style={styles.sendArrow}>{'\u2191'}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
type Props = ChatStackScreenProps<'ChatDetail'>;

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, recipientName } = route.params;
  const theme = useTheme();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: recipientName });
  }, [navigation, recipientName]);

  const loadMessages = useCallback(
    async (pageNum: number = 1) => {
      try {
        const result = await chatApi.getMessages(matchId, pageNum);
        if (pageNum === 1) {
          setMessages(result.messages.reverse());
        } else {
          setMessages((prev) => [...result.messages.reverse(), ...prev]);
        }
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [matchId],
  );

  useEffect(() => {
    loadMessages();
    socketService.joinChat(matchId);

    // Mark messages as read
    chatApi.markAsRead(matchId).catch(() => {});

    return () => {
      socketService.leaveChat(matchId);
    };
  }, [matchId, loadMessages]);

  // Listen for new messages
  useEffect(() => {
    socketService.setHandlers({
      onNewMessage: (data) => {
        if (data.matchId === matchId) {
          const newMessage: Message = {
            id: data.id,
            matchId: data.matchId,
            senderId: data.senderId,
            text: data.text,
            type: 'text',
            sentAt: data.sentAt,
            readAt: null,
            status: 'delivered',
          };
          setMessages((prev) => [...prev, newMessage]);
          chatApi.markAsRead(matchId).catch(() => {});
        }
      },
      onTyping: (data) => {
        if (data.matchId === matchId && data.userId !== user?.id) {
          setIsTyping(data.isTyping);
        }
      },
      onReadReceipt: (data) => {
        if (data.matchId === matchId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, readAt: data.readAt, status: 'read' as const }
                : msg,
            ),
          );
        }
      },
    });
  }, [matchId, user?.id]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      matchId,
      senderId: user?.id ?? '',
      text,
      type: 'text',
      sentAt: new Date().toISOString(),
      readAt: null,
      status: 'sending',
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sentMessage = await chatApi.sendMessage({ matchId, text });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? sentMessage : msg,
        ),
      );
    } catch {
      // Mark as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'sending' as const }
            : msg,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    socketService.sendTyping(matchId, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(matchId, false);
    }, 2000);
  };

  const handleLoadEarlier = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const showDate =
      index === 0 ||
      formatters.formatChatDate(item.sentAt) !==
        formatters.formatChatDate(messages[index - 1].sentAt);

    return (
      <>
        {showDate && (
          <View style={styles.dateHeaderWrapper}>
            <View
              style={[
                styles.dateChip,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  styles.dateChipText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {formatters.formatChatDate(item.sentAt)}
              </Text>
            </View>
          </View>
        )}
        <ChatBubble message={item} isOwn={isOwn} />
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Typing indicator -- positioned above message list */}
        {isTyping && (
          <View
            style={[
              styles.typingBanner,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <TypingDots color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.caption,
                styles.typingLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {recipientName} is typing
            </Text>
          </View>
        )}

        {/* Message list or loading state */}
        {isLoading ? (
          <PulsingLoader color={theme.colors.primary} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            inverted={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onScrollToIndexFailed={() => {}}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              hasMore ? (
                <TouchableOpacity
                  style={[
                    styles.loadMoreBtn,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={handleLoadEarlier}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.loadMoreArrow,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {'\u2191'}
                  </Text>
                  <Text
                    style={[
                      theme.typography.buttonSmall,
                      styles.loadMoreLabel,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Load earlier messages
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Input bar                                                         */}
        {/* ----------------------------------------------------------------- */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderTopColor: theme.colors.borderLight,
              // frosted / elevated look
              shadowColor: theme.colors.cardShadow,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 10,
            },
          ]}
        >
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textTertiary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={2000}
            />
          </View>

          <SendButton
            enabled={!!inputText.trim() && !isSending}
            primaryColor={theme.colors.primary}
            primaryLightColor={theme.colors.primaryLight}
            disabledColor={theme.colors.border}
            onPress={handleSend}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  /* Layout */
  container: { flex: 1 },
  flex: { flex: 1 },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  /* Typing banner */
  typingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginHorizontal: 48,
    alignSelf: 'center',
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingLabel: {
    marginLeft: 2,
  },

  /* Messages */
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  /* Date header chip */
  dateHeaderWrapper: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  /* Load earlier */
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 8,
  },
  loadMoreArrow: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  loadMoreLabel: {
    fontSize: 13,
  },

  /* Input bar (frosted-glass feel) */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  inputPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },

  /* Send button */
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  sendArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
});

export default ChatDetailScreen;
