import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Matches'>;

// ── Mock Data ────────────────────────────────────────────────────────────────

interface WaitingMatch {
  id: string;
  displayName: string;
  emoji: string;
  timeAgo: string;
  hasNotification: boolean;
}

interface MatchItem {
  id: string;
  displayName: string;
  age: number;
  emoji: string;
  compatibility: number;
  timeAgo: string;
  isChatting: boolean;
}

const WAITING_MATCHES: WaitingMatch[] = [
  { id: 'w1', displayName: 'UrbanFox', emoji: '\uD83E\uDD8A', timeAgo: 'Just matched', hasNotification: true },
  { id: 'w2', displayName: 'NeonDrift', emoji: '\uD83C\uDF1F', timeAgo: '15m ago', hasNotification: true },
  { id: 'w3', displayName: 'WildPetal', emoji: '\uD83C\uDF3A', timeAgo: '1h ago', hasNotification: false },
  { id: 'w4', displayName: 'CosmicRay', emoji: '\uD83C\uDF0C', timeAgo: '2h ago', hasNotification: false },
  { id: 'w5', displayName: 'TidalWave', emoji: '\uD83C\uDF0A', timeAgo: '3h ago', hasNotification: true },
];

const ALL_MATCHES: MatchItem[] = [
  { id: 'm1', displayName: 'UrbanFox', age: 27, emoji: '\uD83E\uDD8A', compatibility: 94, timeAgo: '2m ago', isChatting: true },
  { id: 'm2', displayName: 'NeonDrift', age: 24, emoji: '\uD83C\uDF1F', compatibility: 87, timeAgo: '15m ago', isChatting: false },
  { id: 'm3', displayName: 'WildPetal', age: 29, emoji: '\uD83C\uDF3A', compatibility: 91, timeAgo: '1h ago', isChatting: true },
  { id: 'm4', displayName: 'CosmicRay', age: 26, emoji: '\uD83C\uDF0C', compatibility: 83, timeAgo: '2h ago', isChatting: false },
  { id: 'm5', displayName: 'TidalWave', age: 31, emoji: '\uD83C\uDF0A', compatibility: 79, timeAgo: '4h ago', isChatting: false },
  { id: 'm6', displayName: 'LunarMist', age: 23, emoji: '\uD83C\uDF19', compatibility: 88, timeAgo: '6h ago', isChatting: true },
  { id: 'm7', displayName: 'EchoBlaze', age: 28, emoji: '\uD83D\uDD25', compatibility: 76, timeAgo: '1d ago', isChatting: false },
];

// ── Component ────────────────────────────────────────────────────────────────

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const handleMatchPress = (match: MatchItem) => {
    if (match.isChatting) {
      (navigation as any).navigate('ChatList', {
        screen: 'ChatDetail',
        params: {
          matchId: match.id,
          recipientName: match.displayName,
          recipientAvatar: match.emoji,
          isActive: true,
        },
      });
    } else {
      navigation.navigate('MatchPrompt', {
        matchId: match.id,
        userName: match.displayName,
        userAvatar: match.emoji,
        distance: 80,
        compatibility: match.compatibility,
      });
    }
  };

  const handleWaitingPress = (waiting: WaitingMatch) => {
    navigation.navigate('MatchPrompt', {
      matchId: waiting.id,
      userName: waiting.displayName,
      userAvatar: waiting.emoji,
      distance: 120,
      compatibility: 85,
    });
  };

  // ── Waiting Avatar Item ─────────────────────────────────────────────────

  const renderWaitingItem = ({ item }: { item: WaitingMatch }) => (
    <TouchableOpacity
      style={styles.waitingItem}
      onPress={() => handleWaitingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.waitingAvatarContainer}>
        <View
          style={[
            styles.waitingAvatar,
            {
              backgroundColor: theme.colors.primary + '15',
              borderColor: theme.colors.primary + '40',
            },
          ]}
        >
          <Text style={styles.waitingEmoji}>{item.emoji}</Text>
        </View>
        {item.hasNotification && (
          <View style={styles.notificationDot} />
        )}
      </View>
      <Text
        style={[styles.waitingName, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {item.displayName}
      </Text>
      <Text
        style={[styles.waitingTime, { color: theme.colors.textTertiary }]}
        numberOfLines={1}
      >
        {item.timeAgo}
      </Text>
    </TouchableOpacity>
  );

  // ── Match Row Item ──────────────────────────────────────────────────────

  const renderMatchItem = ({ item }: { item: MatchItem }) => (
    <TouchableOpacity
      style={[
        styles.matchRow,
        { backgroundColor: theme.colors.surfaceElevated },
      ]}
      onPress={() => handleMatchPress(item)}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View
        style={[
          styles.matchAvatar,
          { backgroundColor: theme.colors.primary + '10' },
        ]}
      >
        <Text style={styles.matchEmoji}>{item.emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.matchInfo}>
        <View style={styles.matchNameRow}>
          <Text style={[styles.matchName, { color: theme.colors.text }]}>
            {item.displayName}, {item.age}
          </Text>
          <View
            style={[
              styles.matchPercent,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Text
              style={[
                styles.matchPercentText,
                { color: theme.colors.primary },
              ]}
            >
              {item.compatibility}%
            </Text>
          </View>
        </View>
        <Text
          style={[styles.matchTimeAgo, { color: theme.colors.textTertiary }]}
        >
          {item.timeAgo}
        </Text>
      </View>

      {/* Action Button */}
      {item.isChatting ? (
        <LinearGradient
          colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chatButton}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.sayHiOutlineButton,
            { borderColor: theme.colors.primary },
          ]}
        >
          <Text
            style={[
              styles.sayHiOutlineText,
              { color: theme.colors.primary },
            ]}
          >
            Say Hi
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListHeader = () => (
    <View>
      {/* Waiting to Say Hi Section */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
        >
          WAITING TO SAY HI
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.waitingScroll}
        style={styles.waitingContainer}
      >
        {WAITING_MATCHES.map((item) => (
          <View key={item.id}>
            {renderWaitingItem({ item })}
          </View>
        ))}
      </ScrollView>

      {/* All Matches Label */}
      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
        >
          ALL MATCHES
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Matches
        </Text>
        <View
          style={[
            styles.totalBadge,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <Text
            style={[styles.totalBadgeText, { color: theme.colors.primary }]}
          >
            {ALL_MATCHES.length} total
          </Text>
        </View>
      </View>

      {/* Match List */}
      <FlatList
        data={ALL_MATCHES}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const WAITING_AVATAR_SIZE = 64;
const MATCH_AVATAR_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Section Labels
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Waiting Section
  waitingContainer: {
    maxHeight: 120,
  },
  waitingScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  waitingItem: {
    alignItems: 'center',
    width: 72,
  },
  waitingAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  waitingAvatar: {
    width: WAITING_AVATAR_SIZE,
    height: WAITING_AVATAR_SIZE,
    borderRadius: WAITING_AVATAR_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingEmoji: {
    fontSize: 28,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  waitingName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitingTime: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },

  // Match Row
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  matchAvatar: {
    width: MATCH_AVATAR_SIZE,
    height: MATCH_AVATAR_SIZE,
    borderRadius: MATCH_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchEmoji: {
    fontSize: 24,
  },
  matchInfo: {
    flex: 1,
    marginRight: 10,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  matchPercent: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchPercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchTimeAgo: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Action Buttons
  chatButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sayHiOutlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sayHiOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MatchesScreen;
