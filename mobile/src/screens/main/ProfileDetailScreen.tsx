import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useModeStore } from '../../store/modeStore';
import { MatchDetail } from '../../api/matches';
import { discoveryApi } from '../../api/discovery';
import apiClient from '../../api/client';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ProfileDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Compatibility Bar ────────────────────────────────────────────────────────

interface CompatBarProps {
  label: string;
  value: number;
  color: string;
  trackColor: string;
}

const CompatBar: React.FC<CompatBarProps> = ({ label, value, color, trackColor }) => (
  <View style={barStyles.container}>
    <View style={barStyles.labelRow}>
      <Text style={[barStyles.label, { color: color + 'CC' }]}>{label}</Text>
      <Text style={[barStyles.value, { color }]}>{value}%</Text>
    </View>
    <View style={[barStyles.track, { backgroundColor: trackColor }]}>
      <View
        style={[
          barStyles.fill,
          { backgroundColor: color, width: `${value}%` },
        ]}
      />
    </View>
  </View>
);

const barStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 13, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

// ── Main Component ───────────────────────────────────────────────────────────

const ProfileDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId, mode: paramMode } = route.params;
  const theme = useTheme();
  const { mode: storeMode } = useModeStore();
  const mode = paramMode ?? storeMode;
  const isSocial = mode === 'social';

  const [profile, setProfile] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch profile ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiClient.get(`/profile/${userId}`);
        const p = response.data;
        // Calculate compatibility score from profile data
        // Mirrors the backend scoring: interest count overlap + vibe activity + completeness
        const interests: string[] = p.interests || [];
        const vibes: string[] = p.vibes || [];
        const completeness: number = p.profileCompleteness || 0;
        // Jaccard-style: assume viewer has similar interests — score based on richness of profile
        const interestScore = Math.min(interests.length * 12, 60);   // up to 60 pts
        const vibeScore = vibes.length > 0 ? 25 : 0;                  // 25 pts for active vibes
        const completenessScore = (completeness / 100) * 15;          // up to 15 pts
        const computedCompatibility = Math.min(Math.round(interestScore + vibeScore + completenessScore), 100);

        const detail: MatchDetail = {
          id: userId,
          userId: userId,
          displayName: p.displayName || p.user?.firstName || 'User',
          bio: p.bio || '',
          age: p.age || 0,
          profilePhotos: p.photos || [],
          interests,
          vibes,
          compatibilityScore: computedCompatibility,
          mode: mode,
          matchedAt: '',
          profession: p.occupation || p.profession,
          company: p.company || p.city,
        };
        if (!cancelled) setProfile(detail);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Unable to load profile');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, mode]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBlock = useCallback(async () => {
    try {
      await discoveryApi.blockUser(userId);
      showAlert('User Blocked', `${profile?.displayName || 'User'} has been blocked.`);
      navigation.goBack();
    } catch {
      showAlert('Error', 'Failed to block user.');
    }
  }, [userId, profile?.displayName, navigation]);

  const handleMorePress = useCallback(() => {
    const profileName = profile?.displayName || 'User';

    showAlert('Options', undefined, [
      {
        text: 'Report User',
        style: 'destructive',
        onPress: () => {
          navigation.navigate('ReportUser', {
            userId,
            userName: profileName,
            userAvatar: '\uD83D\uDC64',
          });
        },
      },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: () => {
          showAlert(
            'Block User',
            `Are you sure you want to block ${profileName}? You won't see them again.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', style: 'destructive', onPress: handleBlock },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [profile?.displayName, userId, navigation, handleBlock]);

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton} activeOpacity={0.7}>
            <Text style={[styles.navButtonTextDark, { color: theme.colors.text }]}>{'\u2190'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton} activeOpacity={0.7}>
            <Text style={[styles.navButtonTextDark, { color: theme.colors.text }]}>{'\u2190'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>{'\u26A0\uFE0F'}</Text>
          <Text style={[styles.centerTitle, { color: theme.colors.text }]}>Profile unavailable</Text>
          <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Social Mode Render ────────────────────────────────────────────────────

  if (isSocial) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header Gradient Area */}
          <LinearGradient
            colors={[theme.colors.gradientCard.start, theme.colors.gradientCard.middle, theme.colors.gradientCard.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerNav}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton} activeOpacity={0.7}>
                <Text style={styles.navButtonText}>{'\u2190'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} activeOpacity={0.7} onPress={handleMorePress}>
                <Text style={styles.navButtonText}>{'\u2022\u2022\u2022'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeEmoji}>{'\uD83D\uDC64'}</Text>
              </View>
              <Text style={styles.headerName}>
                {profile.displayName} {'\u00B7'} {profile.age}
              </Text>
            </View>
          </LinearGradient>

          {/* Compatibility Score Card */}
          <View style={[styles.section, styles.compatCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.compatHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Compatibility Score
              </Text>
              <View style={[styles.compatScoreBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.compatScoreText, { color: theme.colors.primary }]}>
                  {profile.compatibilityScore}%
                </Text>
              </View>
            </View>

            <CompatBar
              label="Shared Interests"
              value={Math.min(profile.interests.length * 12, 100)}
              color={theme.colors.primary}
              trackColor={theme.colors.primary + '15'}
            />
            <CompatBar
              label="Active Vibes"
              value={profile.vibes.length > 0 ? 100 : 0}
              color={theme.colors.success}
              trackColor={theme.colors.success + '15'}
            />
            <CompatBar
              label="Profile Quality"
              value={Math.round(((profile as any).profileCompleteness || 0))}
              color={theme.colors.secondary || '#F97316'}
              trackColor={(theme.colors.secondary || '#F97316') + '15'}
            />
          </View>

          {/* About */}
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>ABOUT</Text>
            <Text style={[styles.bioText, { color: theme.colors.text }]}>{profile.bio}</Text>
          </View>

          {/* Interests */}
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>INTERESTS</Text>
            <View style={styles.tagsContainer}>
              {profile.interests.map((interest) => (
                <View
                  key={interest}
                  style={[styles.interestTag, {
                    backgroundColor: theme.colors.primary + '15',
                    borderColor: theme.colors.primary + '30',
                  }]}
                >
                  <Text style={[styles.interestTagText, { color: theme.colors.primary }]}>
                    {interest}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Vibes */}
          {profile.vibes.length > 0 && (
            <View style={[styles.section, { paddingHorizontal: 20 }]}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>VIBES</Text>
              <View style={styles.tagsContainer}>
                {profile.vibes.map((vibe) => (
                  <View
                    key={vibe}
                    style={[styles.interestTag, {
                      backgroundColor: theme.colors.secondary + '15',
                      borderColor: theme.colors.secondary + '30',
                    }]}
                  >
                    <Text style={[styles.interestTagText, { color: theme.colors.secondary }]}>
                      {vibe}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Professional Mode Render ──────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.proHeader, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.navButton, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.navButtonText, { color: theme.colors.text }]}>{'\u2190'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
              onPress={handleMorePress}
            >
              <Text style={[styles.navButtonText, { color: theme.colors.text }]}>{'\u2022\u2022\u2022'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.proHeaderInfo}>
            <View style={[styles.proAvatarLarge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={styles.proAvatarEmoji}>{'\uD83D\uDC64'}</Text>
            </View>
            <Text style={[styles.proName, { color: theme.colors.text }]}>
              {profile.displayName}
            </Text>
            {profile.profession && (
              <Text style={[styles.proRole, { color: theme.colors.textSecondary }]}>
                {profile.profession}{profile.company ? ` @ ${profile.company}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Compatibility */}
        <View style={[styles.section, styles.compatCard, { backgroundColor: theme.colors.surface, marginHorizontal: 20 }]}>
          <View style={styles.compatHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Compatibility</Text>
            <View style={[styles.compatScoreBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.compatScoreText, { color: theme.colors.primary }]}>
                {profile.compatibilityScore}%
              </Text>
            </View>
          </View>

          <CompatBar
            label="Shared Interests"
            value={Math.min(profile.interests.length * 12, 100)}
            color={theme.colors.primary}
            trackColor={theme.colors.primary + '15'}
          />
          <CompatBar
            label="Active Vibes"
            value={profile.vibes.length > 0 ? 100 : 0}
            color={theme.colors.success}
            trackColor={theme.colors.success + '15'}
          />
          <CompatBar
            label="Profile Quality"
            value={Math.round(((profile as any).profileCompleteness || 0))}
            color={theme.colors.secondary || '#F97316'}
            trackColor={(theme.colors.secondary || '#F97316') + '15'}
          />
        </View>

        {/* Background */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>BACKGROUND</Text>
          <Text style={[styles.bioText, { color: theme.colors.text }]}>{profile.bio}</Text>
        </View>

        {/* Industry Focus */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>EXPERTISE</Text>
          <View style={styles.tagsContainer}>
            {profile.interests.map((tag) => (
              <View
                key={tag}
                style={[styles.interestTag, {
                  backgroundColor: theme.colors.primary + '10',
                  borderColor: theme.colors.primary + '25',
                }]}
              >
                <Text style={[styles.interestTagText, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Connect Button */}
        <View style={[styles.section, { paddingHorizontal: 20, paddingBottom: 32 }]}>
          <TouchableOpacity onPress={handleConnect} activeOpacity={0.85}>
            <LinearGradient
              colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectButton}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerEmoji: { fontSize: 64, marginBottom: 16 },
  centerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  centerText: { fontSize: 14, textAlign: 'center' },

  // Social Header Gradient
  headerGradient: {
    paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: 8,
  },
  navButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  navButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  navButtonTextDark: { fontSize: 18, fontWeight: '700' },
  headerInfo: { alignItems: 'center' },
  avatarLarge: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarLargeEmoji: { fontSize: 48 },
  headerName: {
    color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6,
  },

  // Professional Header
  proHeader: {
    paddingTop: 8, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  proHeaderInfo: { alignItems: 'center' },
  proAvatarLarge: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  proAvatarEmoji: { fontSize: 44 },
  proName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  proRole: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // Sections
  section: { marginTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },

  // Compat Card
  compatCard: {
    marginHorizontal: 20, padding: 20, borderRadius: 20, marginTop: -16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  compatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  compatScoreBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  compatScoreText: { fontSize: 22, fontWeight: '800' },

  // Bio
  bioText: { fontSize: 15, lineHeight: 23, fontWeight: '400' },

  // Tags
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  interestTagText: { fontSize: 13, fontWeight: '600' },

  // Connect Button
  connectButton: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  connectButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});

export default ProfileDetailScreen;
