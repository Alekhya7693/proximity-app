import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useModeStore } from '../../store/modeStore';
import { matchesApi } from '../../api/matches';
import { authApi } from '../../api/auth';
import { getAvatarById } from '../../constants/avatars';
import type { MainTabScreenProps } from '../../navigation/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatData {
  label: string;
  value: string;
  emoji: string;
}

interface ActionData {
  label: string;
  icon: string;
  subtitle: string;
  screen?: 'Notifications' | 'EditProfile' | 'PrivacySettings';
}

const ACTIONS_DATA: ActionData[] = [
  { label: 'Edit Profile', icon: '\u270F\uFE0F', subtitle: 'Name, photo, bio, avatar', screen: 'EditProfile' as const },
  { label: 'My Interests', icon: '\uD83C\uDFAF', subtitle: 'Update your interest tags' },
  { label: 'Notifications', icon: '\uD83D\uDD14', subtitle: 'Match alerts, messages', screen: 'Notifications' as const },
  { label: 'Privacy', icon: '\uD83D\uDD12', subtitle: 'Visibility and data settings', screen: 'PrivacySettings' as const },
];

// ── Component ────────────────────────────────────────────────────────────────

const ProfileScreen: React.FC<MainTabScreenProps<'Profile'>> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const { user } = useAuthStore();
  const { toggleMode } = useModeStore();

  const displayName = user?.displayName || user?.firstName || 'Anonymous';
  const email = user?.email || '';

  // Fetch avatar from profile
  const [avatarId, setAvatarId] = useState<string | null>((user as any)?.avatar || null);
  const currentAvatar = getAvatarById(avatarId);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await authApi.getProfile();
        if (mounted && (profile as any)?.avatar) {
          setAvatarId((profile as any).avatar);
        }
      } catch {
        // Keep default avatar on error
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch real stats
  const [statsData, setStatsData] = useState<StatData[]>([
    { label: 'Matches', value: '-', emoji: '\uD83D\uDC9C' },
    { label: 'Conversations', value: '-', emoji: '\uD83D\uDCAC' },
    { label: 'Vibes Set', value: '-', emoji: '\u2728' },
    { label: 'Trust Score', value: '-', emoji: '\uD83D\uDEE1\uFE0F' },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await matchesApi.getMatches(mode as any);
        const totalMatches = result.matches.length;
        const withMessages = result.matches.filter((m) => m.lastMessage).length;
        if (mounted) {
          setStatsData([
            { label: 'Matches', value: String(totalMatches), emoji: '\uD83D\uDC9C' },
            { label: 'Conversations', value: String(withMessages), emoji: '\uD83D\uDCAC' },
            { label: 'Vibes Set', value: String(user?.vibes?.length || 0), emoji: '\u2728' },
            { label: 'Trust Score', value: '85', emoji: '\uD83D\uDEE1\uFE0F' },
          ]);
        }
      } catch {
        // Keep default dashes on error
      }
    })();
    return () => { mounted = false; };
  }, [mode, user?.vibes?.length]);

  const handleSettings = useCallback(
    () => navigation.navigate('Settings'),
    [navigation],
  );

  const handleActionPress = useCallback(
    (screen?: 'Notifications' | 'EditProfile' | 'PrivacySettings') => {
      if (screen) {
        navigation.navigate(screen);
      }
    },
    [navigation],
  );

  // Memoize gradient colors for the mode badge
  const modeGradientColors = useMemo<[string, string]>(
    () =>
      mode === 'social'
        ? ['#0EA5E9', '#F97316']
        : ['#1E3A5F', '#D4A853'],
    [mode],
  );

  const modeBadgeLabel = useMemo(
    () => (mode === 'social' ? '\u2728 Social' : '\uD83D\uDCBC Professional'),
    [mode],
  );

  const avatarGradientColors = useMemo<[string, string]>(
    () => [colors.gradient.start, colors.gradient.end],
    [colors.gradient.start, colors.gradient.end],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={handleSettings}>
            <Text style={styles.settingsIcon}>{'\u2699\uFE0F'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.avatarCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={currentAvatar.gradientColors}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarEmoji}>{currentAvatar.emoji}</Text>
          </LinearGradient>
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>{email}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={[styles.statusText, { color: colors.success }]}>Online</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>CURRENT MODE</Text>
          <TouchableOpacity style={styles.modeRow} onPress={toggleMode}>
            <LinearGradient
              colors={modeGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modeBadge}
            >
              <Text style={styles.modeBadgeText}>{modeBadgeLabel}</Text>
            </LinearGradient>
            <Text style={[styles.modeSwitch, { color: colors.primary }]}>Switch &rsaquo;</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>YOUR STATS</Text>
          <View style={styles.statsGrid}>
            {statsData.map((stat) => (
              <View key={stat.label} style={[styles.statItem, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
          {ACTIONS_DATA.map((action, i) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionRow, i < 3 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}
              onPress={() => handleActionPress(action.screen)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
                <Text style={[styles.actionSubtitle, { color: colors.textTertiary }]}>{action.subtitle}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>&rsaquo;</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700' },
  settingsIcon: { fontSize: 24 },
  avatarCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 40 },
  displayName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '500' },
  section: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  modeBadgeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  modeSwitch: { fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '600' },
  actionSubtitle: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 24, fontWeight: '300' },
  bottomSpacer: { height: 40 },
});

export default ProfileScreen;
