import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { DiscoveryProfile } from '../api/discovery';
import { formatters } from '../utils/formatters';
import CompatibilityBadge from './CompatibilityBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  profile: DiscoveryProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onPress: () => void;
  isActive: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onSwipe,
  onPress,
  isActive,
}) => {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Pulsing glow animation for the compatibility badge area
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 }),
      ),
      -1,
      false,
    );
  }, [glowPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.9]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.15]) }],
  }));

  const triggerSwipe = (direction: 'left' | 'right') => {
    onSwipe(direction);
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { damping: 15 },
        );
        runOnJS(triggerSwipe)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          { borderColor: theme.colors.primaryLight + '30' },
          cardStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPress}
          style={styles.cardContent}
        >
          {/* Profile Photo -- fills the entire card */}
          <Image
            source={{
              uri:
                profile.profilePhotos[0] ||
                'https://randomuser.me/api/portraits/lego/1.jpg',
            }}
            style={styles.photo}
            resizeMode="cover"
          />

          {/* LIKE Label -- visually striking with colored background */}
          <Animated.View
            style={[
              styles.labelContainer,
              styles.likeLabel,
              { backgroundColor: theme.colors.success + '20' },
              likeOpacity,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: theme.colors.success },
              ]}
            >
              LIKE
            </Text>
          </Animated.View>

          {/* NOPE Label -- visually striking with colored background */}
          <Animated.View
            style={[
              styles.labelContainer,
              styles.passLabel,
              { backgroundColor: theme.colors.error + '20' },
              passOpacity,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: theme.colors.error },
              ]}
            >
              NOPE
            </Text>
          </Animated.View>

          {/* Multi-layer gradient overlay -- smooth fade from transparent to dark */}
          <View style={styles.gradientContainer} pointerEvents="none">
            <View style={styles.gradientLayer1} />
            <View style={styles.gradientLayer2} />
            <View style={styles.gradientLayer3} />
            <View style={styles.gradientLayer4} />
            <View style={styles.gradientLayer5} />
          </View>

          {/* Profile Info Overlay */}
          <View style={styles.infoOverlay}>
            {/* Top row: compatibility badge with pulsing glow + distance */}
            <View style={styles.infoTopRow}>
              <View style={styles.badgeWrapper}>
                <Animated.View
                  style={[
                    styles.badgeGlow,
                    {
                      backgroundColor: theme.colors.primary + '50',
                      shadowColor: theme.colors.primary,
                    },
                    glowStyle,
                  ]}
                />
                <CompatibilityBadge score={profile.compatibilityScore} />
              </View>
              <View style={styles.distancePill}>
                <Text style={styles.distanceIcon}>{'\u{1F4CD}'}</Text>
                <Text style={styles.distanceText}>
                  {formatters.formatDistance(profile.distance)}
                </Text>
              </View>
            </View>

            {/* Name and age */}
            <Text style={styles.nameText}>
              {profile.displayName}
              <Text style={styles.ageText}>, {profile.age}</Text>
            </Text>

            {/* Profession */}
            {profile.profession && (
              <Text style={styles.professionText}>
                {profile.profession}
                {profile.company ? ` at ${profile.company}` : ''}
              </Text>
            )}

            {/* Bio */}
            {profile.bio ? (
              <Text style={styles.bioText} numberOfLines={2}>
                {profile.bio}
              </Text>
            ) : null}

            {/* Interest tags with glassmorphism style */}
            {profile.interests.length > 0 && (
              <View style={styles.tagsRow}>
                {profile.interests.slice(0, 4).map((interest) => (
                  <View key={interest} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 4 && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      +{profile.interests.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  // ---- Card Shell ----
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    // Shadow -- gives a professional elevated look
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
    backgroundColor: '#0A0A0A',
  },
  cardContent: {
    width: '100%',
    aspectRatio: 0.65,
  },

  // ---- Photo ----
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  // ---- Swipe Labels ----
  labelContainer: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 3.5,
    borderRadius: 14,
  },
  likeLabel: {
    left: 28,
    borderColor: '#00B894',
    transform: [{ rotate: '-20deg' }],
  },
  passLabel: {
    right: 28,
    borderColor: '#FF6B6B',
    transform: [{ rotate: '20deg' }],
  },
  label: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ---- Multi-Layer Gradient Overlay ----
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  gradientLayer1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  gradientLayer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  gradientLayer4: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  gradientLayer5: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // ---- Info Overlay ----
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 16,
  },

  // ---- Top Row: Badge + Distance ----
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlow: {
    position: 'absolute',
    width: 52,
    height: 28,
    borderRadius: 14,
    // Shadow glow on iOS
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // ---- Distance Pill ----
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  distanceIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.2,
  },

  // ---- Name ----
  nameText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  ageText: {
    fontSize: 26,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.88)',
  },

  // ---- Profession ----
  professionText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
    marginTop: 3,
    letterSpacing: 0.2,
  },

  // ---- Bio ----
  bioText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
  },

  // ---- Interest Tags (Glassmorphism Style) ----
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    // On iOS, backdrop filters are not natively supported in RN,
    // so we simulate the glassmorphism look with semi-transparent white
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255,255,255,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

export default SwipeCard;
