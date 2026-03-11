import React from 'react';
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
import type { MainTabScreenProps } from '../../navigation/types';

const ProfileScreen: React.FC<MainTabScreenProps<'Profile'>> = ({ navigation }) => {
  const { colors, mode } = useTheme();
  const { user } = useAuthStore();
  const { toggleMode } = useModeStore();

  const displayName = user?.displayName || 'UrbanFox';
  const email = user?.email || 'name@example.com';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.avatarCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarEmoji}>🦊</Text>
          </LinearGradient>
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>{email}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={[styles.statusText, { color: colors.success }]}>Active now</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>CURRENT MODE</Text>
          <TouchableOpacity style={styles.modeRow} onPress={toggleMode}>
            <LinearGradient
              colors={mode === 'social'
                ? ['#8B5CF6', '#EC4899']
                : ['#0F766E', '#0284C7']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modeBadge}
            >
              <Text style={styles.modeBadgeText}>
                {mode === 'social' ? '✨ Social' : '💼 Professional'}
              </Text>
            </LinearGradient>
            <Text style={[styles.modeSwitch, { color: colors.primary }]}>Switch ›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>YOUR STATS</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Matches', value: '12', emoji: '💜' },
              { label: 'Conversations', value: '8', emoji: '💬' },
              { label: 'Vibes Set', value: '24', emoji: '✨' },
              { label: 'Trust Score', value: '92', emoji: '🛡️' },
            ].map((stat) => (
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
          {[
            { label: 'Edit Profile', icon: '✏️', subtitle: 'Name, photo, bio, avatar' },
            { label: 'My Interests', icon: '🎯', subtitle: 'Update your interest tags' },
            { label: 'Notifications', icon: '🔔', subtitle: 'Match alerts, messages', screen: 'Notifications' as const },
            { label: 'Privacy', icon: '🔒', subtitle: 'Visibility and data settings' },
          ].map((action, i) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionRow, i < 3 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}
              onPress={() => action.screen && navigation.navigate(action.screen)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
                <Text style={[styles.actionSubtitle, { color: colors.textTertiary }]}>{action.subtitle}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
});

export default ProfileScreen;
