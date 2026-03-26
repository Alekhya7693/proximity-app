import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Notifications'>;

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------
interface NotificationItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

// Notifications will be fetched from the backend API in production.
// Starting with an empty array to avoid showing placeholder data.

// ---------------------------------------------------------------------------
// Notification Row
// ---------------------------------------------------------------------------
interface NotificationRowProps {
  item: NotificationItem;
  index: number;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  textTertiaryColor: string;
  primaryColor: string;
}

const NotificationRow: React.FC<NotificationRowProps> = ({
  item,
  index,
  borderColor,
  surfaceColor,
  textColor,
  textSecondaryColor,
  textTertiaryColor,
  primaryColor,
}) => (
  <Animated.View
    entering={enteringAnim(FadeInDown.duration(400).delay(100 + index * 80))}
    style={[
      styles.notificationRow,
      {
        backgroundColor: surfaceColor,
        borderBottomColor: borderColor,
      },
      item.unread && {
        borderLeftWidth: 3,
        borderLeftColor: primaryColor,
      },
    ]}
  >
    <View
      style={[
        styles.notifIconCircle,
        { backgroundColor: item.iconColor + '20' },
      ]}
    >
      <Text style={styles.notifIcon}>{item.icon}</Text>
    </View>

    <View style={styles.notifContent}>
      <View style={styles.notifHeaderRow}>
        <Text
          style={[
            styles.notifTitle,
            { color: textColor },
            item.unread && { fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.unread && (
          <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
        )}
      </View>
      <Text
        style={[styles.notifBody, { color: textSecondaryColor }]}
        numberOfLines={2}
      >
        {item.body}
      </Text>
      <Text style={[styles.notifTime, { color: textTertiaryColor }]}>
        {item.time}
      </Text>
    </View>
  </Animated.View>
);

// ===========================================================================
// NotificationsScreen
// ===========================================================================
const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const hasUnread = notifications.some((n) => n.unread);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.unread ? { ...n, unread: false } : n)),
    );
  }, []);

  const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => (
    <NotificationRow
      item={item}
      index={index}
      borderColor={theme.colors.border}
      surfaceColor={theme.colors.surface}
      textColor={theme.colors.text}
      textSecondaryColor={theme.colors.textSecondary}
      textTertiaryColor={theme.colors.textTertiary}
      primaryColor={theme.colors.primary}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { borderBottomColor: theme.colors.border }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backArrow, { color: theme.colors.primary }]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>

        <TouchableOpacity
          onPress={handleMarkAllRead}
          activeOpacity={0.7}
          disabled={!hasUnread}
        >
          <Text
            style={[
              styles.markReadText,
              {
                color: hasUnread
                  ? theme.colors.primary
                  : theme.colors.textTertiary,
              },
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ---- List ---- */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        extraData={notifications}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'\uD83D\uDD14'}</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              When you get matches, messages, or alerts they will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ===========================================================================
// Styles
// ===========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ---- Header ----
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- List ----
  listContent: {
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  // ---- Empty State ----
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ---- Notification Row ----
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifIcon: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifBody: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 3,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 5,
  },
});

export default NotificationsScreen;
