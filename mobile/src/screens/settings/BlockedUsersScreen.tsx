import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'BlockedUsers'>;

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------
interface BlockedUser {
  id: string;
  displayName: string;
  emoji: string;
  gradientColors: [string, string];
  blockedDate: string;
}

const INITIAL_BLOCKED_USERS: BlockedUser[] = [
  {
    id: '1',
    displayName: 'ShadowWolf',
    emoji: '\u{1F43A}',
    gradientColors: ['#6366F1', '#0EA5E9'],
    blockedDate: '2 weeks ago',
  },
  {
    id: '2',
    displayName: 'NeonDrift',
    emoji: '\u{1F308}',
    gradientColors: ['#F97316', '#F97316'],
    blockedDate: '1 month ago',
  },
  {
    id: '3',
    displayName: 'GhostPulse',
    emoji: '\u{1F47B}',
    gradientColors: ['#94A3B8', '#64748B'],
    blockedDate: '3 months ago',
  },
];

// ===========================================================================
// BlockedUsersScreen
// ===========================================================================
const BlockedUsersScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(INITIAL_BLOCKED_USERS);

  const handleUnblock = (user: BlockedUser) => {
    showAlert(
      'Unblock User',
      `Are you sure you want to unblock ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: () => {
            setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
          },
        },
      ],
    );
  };

  const renderBlockedUser = ({ item, index }: { item: BlockedUser; index: number }) => (
    <Animated.View
      entering={enteringAnim(FadeInDown.duration(400).delay(100 + index * 80))}
      style={[
        styles.userRow,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <LinearGradient
        colors={item.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.userAvatar}
      >
        <Text style={styles.userEmoji}>{item.emoji}</Text>
      </LinearGradient>

      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {item.displayName}
        </Text>
        <Text style={[styles.blockedDate, { color: theme.colors.textTertiary }]}>
          Blocked {item.blockedDate}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.unblockButton, { borderColor: theme.colors.primary }]}
        onPress={() => handleUnblock(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.unblockText, { color: theme.colors.primary }]}>
          Unblock
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={enteringAnim(FadeIn.duration(500).delay(200))}
      style={styles.emptyState}
    >
      <Text style={styles.emptyEmoji}>{'\u{1F389}'}</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No blocked users
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
        You haven't blocked anyone. Users you block will appear here.
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={styles.headerBar}
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
          Blocked Users
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Count Badge */}
      {blockedUsers.length > 0 && (
        <Animated.View
          entering={enteringAnim(FadeIn.duration(400).delay(100))}
          style={styles.countContainer}
        >
          <Text style={[styles.countText, { color: theme.colors.textTertiary }]}>
            {blockedUsers.length} blocked user{blockedUsers.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}

      {/* List */}
      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // ---- Count ----
  countContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ---- List ----
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },

  // ---- User Row ----
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmoji: {
    fontSize: 22,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedDate: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '600',
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
});

export default BlockedUsersScreen;
