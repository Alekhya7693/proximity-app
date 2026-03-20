import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { adminColors } from '../../theme/colors';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'AdminDashboard'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StatCard {
  id: string;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

interface BarData {
  label: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const STATS: StatCard[] = [
  { id: 'active', title: 'Active Users (24h)', value: '8,421', trend: '+12%', trendUp: true },
  { id: 'matches', title: 'New Matches Today', value: '1,204', trend: '+8%', trendUp: true },
  { id: 'reports', title: 'Open Reports', value: '23', trend: '-15%', trendUp: false },
  { id: 'chats', title: 'Active Chats', value: '3,891', trend: '+5%', trendUp: true },
];

const ACTIVITY_DATA: BarData[] = [
  { label: 'M', value: 0.7 },
  { label: 'T', value: 0.85 },
  { label: 'W', value: 0.6 },
  { label: 'T', value: 0.9 },
  { label: 'F', value: 1.0 },
  { label: 'S', value: 0.75 },
  { label: 'S', value: 0.5 },
];

// ===========================================================================
// AdminDashboardScreen
// ===========================================================================
const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const colors = adminColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { borderBottomColor: colors.border }]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBg}
            >
              <Text style={styles.logoText}>P</Text>
            </LinearGradient>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              MYKO Admin
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Super Admin {'\u00B7'} Live
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminReportQueue')}
            style={[styles.alertBadge, { backgroundColor: colors.alertHigh + '20' }]}
          >
            <Text style={[styles.alertBadgeText, { color: colors.alertHigh }]}>
              {'\u26A0'} 23 Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.bellButton, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.bellIcon}>{'\uD83D\uDD14'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Stats Grid ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.statsGrid}
        >
          {STATS.map((stat, index) => (
            <Animated.View
              key={stat.id}
              entering={enteringAnim(FadeInDown.duration(500).delay(150 + index * 80))}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statTitle, { color: colors.textTertiary }]}>
                {stat.title}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor: stat.trendUp
                      ? colors.success + '20'
                      : colors.alertHigh + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.trendText,
                    {
                      color: stat.trendUp
                        ? colors.success
                        : colors.alertHigh,
                    },
                  ]}
                >
                  {stat.trendUp ? '\u2191' : '\u2193'} {stat.trend}
                </Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ---- Activity Chart ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(500))}
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            User Activity (7 days)
          </Text>
          <View style={styles.chartContainer}>
            {ACTIVITY_DATA.map((bar, index) => (
              <View key={`bar-${index}`} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={[colors.primary, '#F97316']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[
                      styles.barFill,
                      { height: `${bar.value * 100}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textTertiary }]}>
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ---- Quick Actions ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(600))}
          style={styles.quickActionsSection}
        >
          <Text style={[styles.quickActionsTitle, { color: colors.textTertiary }]}>
            QUICK ACTIONS
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminReportQueue')}
          >
            <LinearGradient
              colors={[colors.primary, '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryAction}
            >
              <Text style={styles.primaryActionText}>Review Reports</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.secondaryAction,
              { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
              Manage Users
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {},
  logoBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },

  // ---- Scroll ----
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // ---- Stats Grid ----
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47.5%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ---- Chart ----
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '70%',
    maxWidth: 36,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#1B5B8A20',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  // ---- Quick Actions ----
  quickActionsSection: {
    gap: 12,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  primaryAction: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryAction: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AdminDashboardScreen;
