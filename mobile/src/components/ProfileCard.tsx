import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card dimensions kept identical to DiscoverScreen originals
const RAW_CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_WIDTH = Math.min(RAW_CARD_WIDTH, 400);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.25, SCREEN_HEIGHT * 0.52);

export interface ProfileCardData {
  id: string;
  displayName: string;
  age: number;
  emoji: string;
  distance: number;
  compatibility: number;
  tags: string[];
  role?: string;
  company?: string;
  vibes?: string[];
  isOnline?: boolean;
}

interface ProfileCardProps {
  profile: ProfileCardData;
  isSocial: boolean;
  gradientColors: [string, string, string];
  onPress: () => void;
}

/**
 * Memoized profile card used on the Discover screen.
 * Uses a custom comparator to avoid re-renders when the same profile
 * data, mode, and gradient colors are provided.
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isSocial,
  gradientColors,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.cardTouchable}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Distance Badge - Top Left */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceBadgeText}>
            {profile.distance < 0.1
              ? '< 100m'
              : profile.distance < 1
              ? `${Math.round(profile.distance * 1000)}m`
              : `${profile.distance.toFixed(1)}km`}
          </Text>
        </View>

        {/* Match % Badge - Top Right */}
        <View
          style={[
            styles.matchBadge,
            { backgroundColor: 'rgba(255,255,255,0.2)' },
          ]}
        >
          <Text style={styles.matchBadgeText}>
            {Math.min(Math.round(profile.compatibility), 100)}%
          </Text>
        </View>

        {/* Center Avatar Emoji */}
        <View style={styles.avatarEmojiContainer}>
          <View style={styles.avatarEmojiCircle}>
            <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
          </View>
        </View>

        {/* Active Vibe Badge */}
        {profile.vibes && profile.vibes.length > 0 && (
          <View style={styles.vibeBadge}>
            <Text style={styles.vibeBadgeText}>
              ✨ {profile.vibes[0]}
            </Text>
          </View>
        )}

        {/* Online Indicator */}
        {profile.isOnline && (
          <View style={styles.onlineDot} />
        )}

        {/* Bottom Info */}
        <View style={styles.cardBottom}>
          <Text style={styles.cardName}>
            {profile.displayName || 'MYKO User'}
            {isSocial && profile.age > 0 ? `, ${profile.age}` : ''}
          </Text>
          {!isSocial && profile.role && (
            <Text style={styles.cardRole}>
              {profile.role}
              {profile.company ? ` @ ${profile.company}` : ''}
            </Text>
          )}

          {/* Tags */}
          <View style={styles.cardTags}>
            {profile.tags.map((tag) => (
              <View key={tag} style={styles.cardTag}>
                <Text style={styles.cardTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

function arePropsEqual(
  prev: ProfileCardProps,
  next: ProfileCardProps,
): boolean {
  return (
    prev.profile.id === next.profile.id &&
    prev.isSocial === next.isSocial &&
    prev.gradientColors[0] === next.gradientColors[0] &&
    prev.gradientColors[1] === next.gradientColors[1] &&
    prev.gradientColors[2] === next.gradientColors[2] &&
    prev.onPress === next.onPress
  );
}

export default React.memo(ProfileCard, arePropsEqual);

// ── Styles ──────────────────────────────────────────────────────────────────
// These are identical to the card-related styles in DiscoverScreen so the
// visual output does not change.

const styles = StyleSheet.create({
  cardTouchable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  vibeBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  vibeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    top: 20,
    left: 60,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEmojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatarEmojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 56,
  },
  cardBottom: {
    gap: 6,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardRole: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  cardTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
