import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useModeStore } from '../../store/modeStore';
import InterestTag from '../../components/InterestTag';
import ModeToggle from '../../components/ModeToggle';
import { enteringAnim } from '../../utils/animations';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Profile'>;

const PRIMARY = '#6C5CE7';
const PRIMARY_LIGHT = '#A29BFE';
const SECONDARY = '#FD79A8';
const ACCENT = '#00CEC9';

const VIBE_COLORS = [
  { bg: '#6C5CE720', text: '#6C5CE7', border: '#6C5CE740' },
  { bg: '#FD79A820', text: '#FD79A8', border: '#FD79A840' },
  { bg: '#00CEC920', text: '#00CEC9', border: '#00CEC940' },
  { bg: '#FDCB6E20', text: '#E17055', border: '#FDCB6E40' },
  { bg: '#74B9FF20', text: '#0984E3', border: '#74B9FF40' },
  { bg: '#55EFC420', text: '#00B894', border: '#55EFC440' },
];

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { mode } = useModeStore();

  if (!user) return null;

  const interests =
    mode === 'social' ? user.socialInterests : user.professionalInterests;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header Bar */}
      <Animated.View entering={enteringAnim(FadeIn.duration(400))} style={styles.headerBar}>
        <ModeToggle />
        <Text style={[theme.typography.h4, { color: theme.colors.text, letterSpacing: 0.5 }]}>
          Profile
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>{'⚙️'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Header Background */}
        <Animated.View entering={enteringAnim(FadeIn.duration(600))} style={styles.headerBgWrapper}>
          <View style={[styles.headerBgTop, { backgroundColor: PRIMARY }]} />
          <View style={[styles.headerBgMiddle, { backgroundColor: PRIMARY_LIGHT }]} />
          <View style={[styles.headerBgBottom, { backgroundColor: theme.colors.background }]} />
          {/* Decorative floating orbs */}
          <View style={[styles.decorOrb, styles.decorOrb1, { backgroundColor: SECONDARY + '30' }]} />
          <View style={[styles.decorOrb, styles.decorOrb2, { backgroundColor: ACCENT + '25' }]} />
          <View style={[styles.decorOrb, styles.decorOrb3, { backgroundColor: PRIMARY_LIGHT + '35' }]} />
        </Animated.View>

        {/* Profile Photo Section */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(150).duration(500).springify())}
          style={styles.photoSection}
        >
          <View style={styles.photoRingOuter}>
            <View style={[styles.photoRing, { borderColor: PRIMARY }]}>
              <View style={[styles.photoRingInner, { borderColor: PRIMARY_LIGHT }]}>
                {user.profilePhotos.length > 0 ? (
                  <Image
                    source={{ uri: user.profilePhotos[0] }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View
                    style={[
                      styles.profilePhoto,
                      styles.photoPlaceholder,
                      { backgroundColor: PRIMARY_LIGHT + '30' },
                    ]}
                  >
                    <Text style={styles.placeholderInitial}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Photo count badge */}
            {user.profilePhotos.length > 1 && (
              <View style={styles.photoCountBadge}>
                <View style={styles.photoCountInner}>
                  <Text style={styles.photoCountText}>
                    +{user.profilePhotos.length - 1}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* User Name + Verified Badge */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(250).duration(500).springify())}
          style={styles.nameSection}
        >
          <Text
            style={[
              styles.displayName,
              { color: theme.colors.text },
            ]}
          >
            {user.displayName}
          </Text>

          {user.isVerified && (
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedCheck}>{'✓'}</Text>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </Animated.View>

        {/* Status Badge */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(320).duration(500).springify())}
          style={styles.statusSection}
        >
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '15' }]}>
            <Text style={styles.statusEmoji}>{'🔥'}</Text>
            <Text style={[styles.statusText, { color: theme.colors.success }]}>
              Active Today
            </Text>
          </View>
        </Animated.View>

        {/* Bio Card */}
        {user.bio ? (
          <Animated.View
            entering={enteringAnim(FadeInDown.delay(400).duration(500).springify())}
            style={[
              styles.bioCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: theme.colors.cardShadow,
              },
            ]}
          >
            <View style={[styles.bioAccentBar, { backgroundColor: PRIMARY }]} />
            <View style={styles.bioContent}>
              <Text style={[styles.bioQuoteMark, { color: PRIMARY_LIGHT }]}>
                {'\"'}
              </Text>
              <Text
                style={[
                  theme.typography.body1,
                  {
                    color: theme.colors.textSecondary,
                    fontStyle: 'italic',
                    lineHeight: 26,
                  },
                ]}
              >
                {user.bio}
              </Text>
              <Text style={[styles.bioQuoteMarkEnd, { color: PRIMARY_LIGHT }]}>
                {'\"'}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Interests Section */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(500).duration(500).springify())}
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              shadowColor: theme.colors.cardShadow,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>
              {mode === 'social' ? '💜' : '💼'}
            </Text>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text },
              ]}
            >
              {mode === 'social'
                ? 'Social Interests'
                : 'Professional Interests'}
            </Text>
          </View>
          <View style={styles.tagsRow}>
            {interests.map((interest) => (
              <InterestTag key={interest} label={interest} selected />
            ))}
          </View>
          {interests.length === 0 && (
            <Text
              style={[
                theme.typography.body2,
                { color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 8 },
              ]}
            >
              No interests added yet
            </Text>
          )}
        </Animated.View>

        {/* Current Vibes Section */}
        {user.vibes.length > 0 && (
          <Animated.View
            entering={enteringAnim(FadeInDown.delay(600).duration(500).springify())}
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                shadowColor: theme.colors.cardShadow,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{'✨'}</Text>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text },
                ]}
              >
                Current Vibes
              </Text>
            </View>
            <View style={styles.tagsRow}>
              {user.vibes.map((vibe, index) => {
                const colorSet = VIBE_COLORS[index % VIBE_COLORS.length];
                return (
                  <Animated.View
                    key={vibe}
                    entering={enteringAnim(FadeInUp.delay(650 + index * 80).duration(400).springify())}
                  >
                    <View
                      style={[
                        styles.vibeChip,
                        {
                          backgroundColor: colorSet.bg,
                          borderColor: colorSet.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.vibeText,
                          { color: colorSet.text },
                        ]}
                      >
                        {vibe}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Edit Profile Button */}
        <Animated.View
          entering={enteringAnim(FadeInDown.delay(700).duration(500).springify())}
          style={styles.editButtonWrapper}
        >
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              // Navigate to edit profile
            }}
            activeOpacity={0.8}
          >
            <View style={styles.editButtonGradient}>
              <View style={[styles.editButtonBgLeft, { backgroundColor: PRIMARY }]} />
              <View style={[styles.editButtonBgRight, { backgroundColor: PRIMARY_LIGHT }]} />
            </View>
            <Text style={styles.editButtonText}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  settingsIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Decorative Header Background */
  headerBgWrapper: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: -80,
  },
  headerBgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.9,
  },
  headerBgMiddle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    opacity: 0.4,
  },
  headerBgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 100,
  },
  decorOrb1: {
    width: 80,
    height: 80,
    top: -20,
    right: -10,
  },
  decorOrb2: {
    width: 60,
    height: 60,
    top: 20,
    left: 30,
  },
  decorOrb3: {
    width: 40,
    height: 40,
    top: 50,
    right: 60,
  },

  /* Profile Photo */
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 10,
  },
  photoRingOuter: {
    position: 'relative',
  },
  photoRing: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
    backgroundColor: '#FFFFFF',
  },
  photoRingInner: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    fontSize: 56,
    fontWeight: '700',
    color: '#6C5CE7',
    opacity: 0.7,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    zIndex: 20,
  },
  photoCountInner: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Name Section */
  nameSection: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B89415',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00B89430',
    gap: 5,
  },
  verifiedCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
    letterSpacing: 0.5,
  },

  /* Status Badge */
  statusSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Bio Card */
  bioCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bioAccentBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  bioContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  bioQuoteMark: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: -4,
  },
  bioQuoteMarkEnd: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'right',
    marginTop: -4,
  },

  /* Section Cards */
  sectionCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  /* Vibe Chips */
  vibeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Edit Profile Button */
  editButtonWrapper: {
    marginHorizontal: 24,
    marginTop: 8,
  },
  editButton: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  editButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  editButtonBgLeft: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  editButtonBgRight: {
    flex: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 16,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default ProfileScreen;
