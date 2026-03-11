import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import type { ChatStackScreenProps } from '../../navigation/types';

type Props = ChatStackScreenProps<'ChatDetail'>;

// ── Mock Data ────────────────────────────────────────────────────────────────

interface MockMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isOwn: boolean;
  isRead: boolean;
}

const MOCK_MESSAGES: MockMessage[] = [
  {
    id: 'msg1',
    senderId: 'other',
    text: 'Hey! I noticed we both love coffee shops. Have you tried the new one on 5th?',
    time: '10:30 AM',
    isOwn: false,
    isRead: true,
  },
  {
    id: 'msg2',
    senderId: 'me',
    text: 'Not yet! I heard they have amazing pour-overs though. Is it good?',
    time: '10:32 AM',
    isOwn: true,
    isRead: true,
  },
  {
    id: 'msg3',
    senderId: 'other',
    text: 'It\'s incredible! The barista does this really cool latte art too. You should totally check it out.',
    time: '10:34 AM',
    isOwn: false,
    isRead: true,
  },
  {
    id: 'msg4',
    senderId: 'me',
    text: 'That sounds amazing! Want to check it out together sometime?',
    time: '10:35 AM',
    isOwn: true,
    isRead: true,
  },
  {
    id: 'msg5',
    senderId: 'other',
    text: 'That coffee shop sounds amazing! Want to check it out?',
    time: '10:37 AM',
    isOwn: false,
    isRead: true,
  },
  {
    id: 'msg6',
    senderId: 'me',
    text: 'Absolutely! How about tomorrow afternoon?',
    time: '10:38 AM',
    isOwn: true,
    isRead: false,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, recipientName, recipientAvatar, isActive } = route.params;
  const theme = useTheme();
  const { user } = useAuthStore();

  const [messages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    // In production, this would send via API/socket
  };

  // ── Render Message ──────────────────────────────────────────────────────

  const renderMessage = ({ item }: { item: MockMessage }) => {
    if (item.isOwn) {
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
                {item.time}
              </Text>
              <Text
                style={[
                  styles.readReceipt,
                  {
                    color: item.isRead
                      ? theme.colors.primary
                      : theme.colors.textTertiary,
                  },
                ]}
              >
                {'\u2713\u2713'}
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
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  // ── Active State ────────────────────────────────────────────────────────

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
            style={[
              styles.header,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
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
                style={[
                  styles.headerAvatar,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <Text style={styles.headerAvatarEmoji}>
                  {recipientAvatar || '\uD83E\uDD8A'}
                </Text>
              </View>
              <View>
                <Text style={[styles.headerName, { color: theme.colors.text }]}>
                  {recipientName}
                </Text>
                <View style={styles.headerStatusRow}>
                  <View style={styles.greenDot} />
                  <Text
                    style={[
                      styles.headerStatus,
                      { color: theme.colors.success },
                    ]}
                  >
                    Within range {'\u00B7'} 80m
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
              <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
                {'\u2022\u2022\u2022'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Banner */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: theme.colors.success + '12' },
            ]}
          >
            <Text style={[styles.bannerText, { color: theme.colors.success }]}>
              {'\uD83D\uDCCD'} Chat active {'\u00B7'} Both within 300m {'\u00B7'}{' '}
              Expires if you leave
            </Text>
          </View>

          {/* Messages */}
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
              disabled={!inputText.trim()}
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

  // ── Greyed Out State (Not Active) ───────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surfaceElevated },
        ]}
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
            style={[
              styles.headerAvatar,
              { backgroundColor: theme.colors.textTertiary + '15' },
            ]}
          >
            <Text style={[styles.headerAvatarEmoji, { opacity: 0.5 }]}>
              {recipientAvatar || '\uD83E\uDD8A'}
            </Text>
          </View>
          <View>
            <Text
              style={[
                styles.headerName,
                { color: theme.colors.textTertiary },
              ]}
            >
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

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
            {'\u2022\u2022\u2022'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Locked Banner */}
      <View
        style={[
          styles.lockedBanner,
          { backgroundColor: theme.colors.error + '10' },
        ]}
      >
        <Text style={[styles.lockedBannerText, { color: theme.colors.error }]}>
          {'\uD83D\uDD12'} Chat greyed out -- {recipientName} left the area.
          Messages are read-only. Chat deletes in 46 hours 12 min.
        </Text>
        {/* Progress bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.error + '15' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.error,
                width: '65%',
              },
            ]}
          />
        </View>
      </View>

      {/* Greyed Out Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={styles.greyedMessageRow}>
            {renderMessage({ item })}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        style={{ opacity: 0.45 }}
      />

      {/* No Input Bar -- read only */}
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
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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

  // Greyed message row
  greyedMessageRow: {
    opacity: 1, // overall list is set to 0.45
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
