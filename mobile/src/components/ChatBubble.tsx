import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Message } from '../api/chat';
import { formatters } from '../utils/formatters';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn }) => {
  const theme = useTheme();

  const bubbleColor = isOwn
    ? theme.colors.chat.sent
    : theme.colors.chat.received;
  const textColor = isOwn
    ? theme.colors.chat.sentText
    : theme.colors.chat.receivedText;

  const statusText = (() => {
    switch (message.status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      default:
        return '';
    }
  })();

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: bubbleColor },
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {message.type === 'system' ? (
          <Text
            style={[
              styles.systemText,
              theme.typography.caption,
              { color: theme.colors.textSecondary },
            ]}
          >
            {message.text}
          </Text>
        ) : (
          <Text style={[styles.messageText, theme.typography.body1, { color: textColor }]}>
            {message.text}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.meta,
          isOwn ? styles.ownMeta : styles.otherMeta,
        ]}
      >
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, fontSize: 11 },
          ]}
        >
          {formatters.formatMessageTime(message.sentAt)}
        </Text>
        {isOwn && statusText && (
          <Text
            style={[
              theme.typography.caption,
              {
                color:
                  message.status === 'read'
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                fontSize: 11,
                marginLeft: 6,
              },
            ]}
          >
            {statusText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    maxWidth: '80%',
  },
  ownContainer: { alignSelf: 'flex-end' },
  otherContainer: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {},
  systemText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  ownMeta: { justifyContent: 'flex-end' },
  otherMeta: { justifyContent: 'flex-start' },
});

export default ChatBubble;
