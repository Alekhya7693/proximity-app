import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { chatApi, Message } from '../../api/chat';
import { discoveryApi } from '../../api/discovery';
import { showAlert } from '../../utils/alert';
import type { ChatStackScreenProps, RootStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = ChatStackScreenProps<'ChatDetail'>;

// ── Time formatting ─────────────────────────────────────────────────────────

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${mins} ${ampm}`;
}

// ── Component ────────────────────────────────────────────────────────────────

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, recipientId, recipientName, recipientAvatar, isActive } = route.params;
  const targetUserId = recipientId || matchId; // fallback for backward compat
  const theme = useTheme();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ── Fetch messages ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await chatApi.getMessages(matchId);
        if (!cancelled) {
          setMessages(result.messages);
          // Mark as read
          chatApi.markAsRead(matchId).catch(() => {});
        }
      } catch {
        // Show empty chat on error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matchId]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);

    // Optimistic: add message immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      matchId,
      senderId: user?.id || '',
      text,
      type: 'text',
      sentAt: new Date().toISOString(),
      readAt: null,
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const sent = await chatApi.sendMessage({ matchId, text });
      // Replace optimistic message with server response
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? sent : m)),
      );
    } catch {
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? { ...m, status: 'failed' as const } : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, matchId, user?.id]);

  // ── Block user handler ────────────────────────────────────────────────────

  const handleBlock = useCallback(async () => {
    try {
      await discoveryApi.blockUser(targetUserId);
      showAlert('User Blocked', `${recipientName} has been blocked.`);
      navigation.goBack();
    } catch {
      showAlert('Error', 'Failed to block user. Please try again.');
    }
  }, [targetUserId, recipientName, navigation]);

  const handleMorePress = useCallback(() => {
    showAlert('Options', undefined, [
      {
        text: 'View Profile',
        onPress: () => {
          rootNavigation.navigate('ProfileDetail', {
            userId: targetUserId,
            mode: 'social',
          });
        },
      },
      {
        text: 'Report User',
        style: 'destructive',
        onPress: () => {
          rootNavigation.navigate('ReportUser', {
            userId: targetUserId,
            userName: recipientName,
            userAvatar: recipientAvatar,
          });
        },
      },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: () => {
          showAlert(
            'Block User',
            `Are you sure you want to block ${recipientName}? You won't see them again.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', style: 'destructive', onPress: handleBlock },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [targetUserId, recipientName, recipientAvatar, rootNavigation, handleBlock]);

  // ── Render Message ────────────────────────────────────────────────────────

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;

    if (isOwn) {
      return (
        <View style={[styles.messageBubbleRow, styles.ownRow]}>
          <View style={styles.ownBubbleWrapper}>
            <LinearGradient
              colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ownBubble}
            >
              <Text style={styles.ownBubbleText}>{item.text}</Text>
            </LinearGradient>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: theme.colors.textTertiary }]}>
                {formatMessageTime(item.sentAt)}
              </Text>
              <Text
                style={[
                  styles.readReceipt,
                  {
                    color: item.status === 'read'
                      ? theme.colors.primary
                      : theme.colors.textTertiary,
                  },
                ]}
              >
                {item.status === 'sending' ? '\u23F3' : '\u2713\u2713'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageBubbleRow, styles.otherRow]}>
        <View style={styles.otherBubbleWrapper}>
          <View
            style={[
              styles.otherBubble,
              {
                backgroundColor: theme.colors.surface,
                opacity: isActive ? 1 : 0.5,
              },
            ]}
          >
            <Text style={[styles.otherBubbleText, { color: theme.colors.text }]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: theme.colors.textTertiary }]}>
            {formatMessageTime(item.sentAt)}
          </Text>
        </View>
      </View>
    );
  }, [user?.id, isActive, theme.colors]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surfaceElevated }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>{recipientName}</Text>
          </View>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Active State ──────────────────────────────────────────────────────────

  if (isActive) {
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
          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: theme.colors.surfaceElevated }]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.backText, { color: theme.colors.primary }]}>
                {'\u2190'}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View
                style={[styles.headerAvatar, { backgroundColor: theme.colors.primary + '15' }]}
              >
                <Text style={styles.headerAvatarEmoji}>
                  {recipientAvatar || '\uD83D\uDC64'}
                </Text>
              </View>
              <View>
                <Text style={[styles.headerName, { color: theme.colors.text }]}>
                  {recipientName}
                </Text>
                <View style={styles.headerStatusRow}>
                  <View style={styles.greenDot} />
                  <Text style={[styles.headerStatus, { color: theme.colors.success }]}>
                    Within range
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7} onPress={handleMorePress}>
              <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
                {'\u2022\u2022\u2022'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Banner */}
          <View
            style={[styles.statusBanner, { backgroundColor: theme.colors.success + '12' }]}
          >
            <Text style={[styles.bannerText, { color: theme.colors.success }]}>
              {'\uD83D\uDCCD'} Chat active {'\u00B7'} Both within 300m {'\u00B7'} Expires if you leave
            </Text>
          </View>

          {/* Messages */}
          {messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <Text style={[styles.emptyMessagesText, { color: theme.colors.textTertiary }]}>
                No messages yet. Say hi!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderTopColor: theme.colors.borderLight,
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
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim()
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <Text style={styles.sendArrow}>{'\u2191'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Greyed Out State (Not Active / Chat Locked) ───────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surfaceElevated }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>{'\u2190'}</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.textTertiary + '15' }]}>
            <Text style={[styles.headerAvatarEmoji, { opacity: 0.5 }]}>
              {recipientAvatar || '\uD83D\uDC64'}
            </Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: theme.colors.textTertiary }]}>
              {recipientName}
            </Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.redDot} />
              <Text style={[styles.headerStatus, { color: theme.colors.error }]}>
                Out of range {'\u00B7'} Chat locked
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7} onPress={handleMorePress}>
          <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
            {'\u2022\u2022\u2022'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Locked Banner */}
      <View style={[styles.lockedBanner, { backgroundColor: theme.colors.error + '10' }]}>
        <Text style={[styles.lockedBannerText, { color: theme.colors.error }]}>
          {'\uD83D\uDD12'} Chat locked -- {recipientName} left the area. Messages are read-only.
        </Text>
      </View>

      {/* Greyed Out Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        style={{ opacity: 0.45 }}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyMessagesText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 22,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarEmoji: {
    fontSize: 22,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Status Banner (Active)
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Locked Banner
  lockedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lockedBannerText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageBubbleRow: {
    marginBottom: 8,
  },
  ownRow: {
    alignItems: 'flex-end',
  },
  otherRow: {
    alignItems: 'flex-start',
  },
  ownBubbleWrapper: {
    maxWidth: '78%',
    alignItems: 'flex-end',
  },
  otherBubbleWrapper: {
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  ownBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  ownBubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  otherBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  otherBubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 3,
  },
  readReceipt: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Input Bar
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
