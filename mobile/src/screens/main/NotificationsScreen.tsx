import React from 'react';
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

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    icon: '\u2764\uFE0F',
    iconColor: '#8B5CF6',
    title: 'New Match!',
    body: 'You matched with TidalWave',
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    icon: '\uD83D\uDCAC',
    iconColor: '#3B82F6',
    title: 'New message from UrbanFox',
    body: 'Are you still at the cafe?',
    time: '5m ago',
    unread: true,
  },
  {
    id: '3',
    icon: '\uD83C\uDFAF',
    iconColor: '#10B981',
    title: '94% match nearby',
    body: 'Someone compatible just entered your zone',
    time: '12m ago',
    unread: false,
  },
  {
    id: '4',
    icon: '\u23F0',
    iconColor: '#F59E0B',
    title: 'Chat expiring soon',
    body: 'VoltMind chat expires in 2 hours',
    time: '1h ago',
    unread: false,
  },
  {
    id: '5',
    icon: '\u2728',
    iconColor: '#EC4899',
    title: 'Vibe Check reminder',
    body: 'Update your vibe to attract better matches',
    time: '3h ago',
    unread: false,
  },
];

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

  const handleMarkAllRead = () => {
    // TODO: Mark all notifications as read
  };

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

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={[styles.markReadText, { color: theme.colors.primary }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ---- List ---- */}
      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
