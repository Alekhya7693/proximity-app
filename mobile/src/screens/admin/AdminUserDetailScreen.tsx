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
import { adminColors } from '../../theme/colors';
import { showAlert } from '../../utils/alert';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'AdminUserDetail'>;

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------
interface ReportHistoryItem {
  id: string;
  type: string;
  time: string;
}

interface UserStat {
  label: string;
  value: string;
}

// Data will be fetched from admin API in production.
const REPORT_HISTORY: ReportHistoryItem[] = [];

const USER_STATS: UserStat[] = [
  { label: 'Joined', value: '--' },
  { label: 'Reports', value: '0' },
  { label: 'Trust Score', value: '--' },
];

// ===========================================================================
// AdminUserDetailScreen
// ===========================================================================
const AdminUserDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const colors = adminColors;
  const { userId } = route.params;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleWarnUser = () => {
    showAlert(
      'Warn User',
      'Send a warning to this user? They will be notified about the policy violation.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Warning', onPress: () => {} },
      ],
    );
  };

  const handleSuspendUser = () => {
    showAlert(
      'Suspend User',
      'Suspend this user for 7 days? They will not be able to access the app during this period.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const handleBanUser = () => {
    showAlert(
      'Ban User',
      'Permanently ban this user? This action cannot be easily undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ban User', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          User Detail
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- User Card ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={[
            styles.userCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.userCardTop}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.userAvatarEmoji}>{'\uD83D\uDC64'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                User
              </Text>
              <Text style={[styles.userId, { color: colors.textTertiary }]}>
                ID: {userId}
              </Text>
            </View>
          </View>

          {/* Status Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.alertMedium + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.alertMedium }]} />
              <Text style={[styles.statusText, { color: colors.alertMedium }]}>
                Under review
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                Active
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ---- Stats Row ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.statsRow}
        >
          {USER_STATS.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ---- Report History ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Report History ({REPORT_HISTORY.length})
          </Text>
          <View
            style={[
              styles.historyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {REPORT_HISTORY.map((report, index) => (
              <View
                key={report.id}
                style={[
                  styles.historyRow,
                  index < REPORT_HISTORY.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.historyDot, { backgroundColor: colors.alertHigh }]} />
                <View style={styles.historyContent}>
                  <Text style={[styles.historyType, { color: colors.text }]}>
                    {report.type}
                  </Text>
                  <Text style={[styles.historyTime, { color: colors.textTertiary }]}>
                    {report.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ---- Moderation Actions ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Moderation Actions
          </Text>

          <View style={styles.moderationActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.moderationBtn,
                {
                  backgroundColor: colors.alertMedium + '20',
                  borderColor: colors.alertMedium,
                },
              ]}
              onPress={handleWarnUser}
            >
              <Text style={styles.moderationBtnIcon}>{'\u26A0\uFE0F'}</Text>
              <Text style={[styles.moderationBtnText, { color: colors.alertMedium }]}>
                Warn User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.moderationBtn,
                {
                  backgroundColor: '#F97316' + '20',
                  borderColor: '#F97316',
                },
              ]}
              onPress={handleSuspendUser}
            >
              <Text style={styles.moderationBtnIcon}>{'\u23F8\uFE0F'}</Text>
              <Text style={[styles.moderationBtnText, { color: '#F97316' }]}>
                Suspend User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.moderationBtn,
                {
                  backgroundColor: colors.alertHigh + '20',
                  borderColor: colors.alertHigh,
                },
              ]}
              onPress={handleBanUser}
            >
              <Text style={styles.moderationBtnIcon}>{'\uD83D\uDEAB'}</Text>
              <Text style={[styles.moderationBtnText, { color: colors.alertHigh }]}>
                Ban User
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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

  // ---- Scroll ----
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // ---- User Card ----
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarEmoji: {
    fontSize: 28,
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  userId: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ---- Stats Row ----
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ---- Section ----
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // ---- History Card ----
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 13,
    fontWeight: '400',
  },

  // ---- Moderation Actions ----
  moderationActions: {
    gap: 10,
  },
  moderationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  moderationBtnIcon: {
    fontSize: 16,
  },
  moderationBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AdminUserDetailScreen;
