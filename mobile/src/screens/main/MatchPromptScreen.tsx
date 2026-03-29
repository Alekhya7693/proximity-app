import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { matchesApi } from '../../api/matches';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'MatchPrompt'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 90;
const CARD_WIDTH = SCREEN_WIDTH - 64;

const MatchPromptScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, userId, userName, userAvatar, distance, compatibility } = route.params;
  const theme = useTheme();
  const [isSending, setIsSending] = useState(false);

  const handleSayHi = async () => {
    setIsSending(true);
    try {
      await matchesApi.sendHi(matchId);
    } catch {
      // Still navigate to chat even if greet API fails
    } finally {
      setIsSending(false);
    }
    // Navigate to ChatDetail with the matched user
    (navigation as any).replace('Main', {
      screen: 'ChatList',
      params: {
        screen: 'ChatDetail',
        params: {
          matchId,
          recipientId: userId,
          recipientName: userName,
          recipientAvatar: userAvatar,
          isActive: true,
        },
      },
    });
  };

  const handleMaybeLater = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.overlay}>
      {/* Centered Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surfaceElevated },
        ]}
      >
        {/* Overlapping Avatars */}
        <View style={styles.avatarsContainer}>
          {/* Your avatar */}
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.surfaceElevated,
                zIndex: 2,
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>{'\uD83D\uDC9C'}</Text>
          </View>

          {/* Heart between */}
          <View style={styles.heartBetween}>
            <View
              style={[
                styles.heartCircle,
                { backgroundColor: '#FF4B6E' },
              ]}
            >
              <Text style={styles.heartEmoji}>{'\u2764\uFE0F'}</Text>
            </View>
          </View>

          {/* Their avatar */}
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.colors.secondary + '25',
                borderColor: theme.colors.surfaceElevated,
                marginLeft: -20,
                zIndex: 1,
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>{userAvatar || '\uD83E\uDD8A'}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          It's a Match! {'\uD83C\uDF89'}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          You and {userName} both liked each other. This chat is valid while
          you're nearby.
        </Text>

        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: theme.colors.success + '15' },
          ]}
        >
          <View style={styles.statusDot} />
          <Text style={[styles.statusText, { color: theme.colors.success }]}>
            Active {'\u00B7'} {distance}m away {'\u00B7'} Chat zone valid
          </Text>
        </View>

        {/* Say Hi Button */}
        <TouchableOpacity
          onPress={handleSayHi}
          activeOpacity={0.85}
          style={styles.sayHiTouchable}
        >
          <LinearGradient
            colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sayHiButton}
          >
            <Text style={styles.sayHiText}>
              {'\uD83D\uDC4B'} Say Hi
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Maybe Later */}
        <TouchableOpacity
          onPress={handleMaybeLater}
          activeOpacity={0.7}
          style={styles.maybeLaterButton}
        >
          <Text
            style={[
              styles.maybeLaterText,
              { color: theme.colors.textTertiary },
            ]}
          >
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    borderRadius: 28,
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  // Avatars
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  avatarEmoji: {
    fontSize: 40,
  },

  // Heart
  heartBetween: {
    position: 'absolute',
    zIndex: 3,
  },
  heartCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4B6E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heartEmoji: {
    fontSize: 18,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 10,
  },

  // Subtitle
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Say Hi Button
  sayHiTouchable: {
    width: '100%',
    marginBottom: 12,
  },
  sayHiButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sayHiText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Maybe Later
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default MatchPromptScreen;
