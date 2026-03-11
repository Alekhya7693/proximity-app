import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { adminColors } from '../../theme/colors';
import { enteringAnim } from '../../utils/animations';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'AdminReportQueue'>;

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------
type Priority = 'high' | 'medium' | 'low';
type FilterTab = 'all' | 'high_priority' | 'harassment' | 'fake_profile';

interface ReportItem {
  id: string;
  reportedUser: string;
  reporterUser: string;
  reason: string;
  priority: Priority;
  time: string;
  userId: string;
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high_priority', label: 'High Priority' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'fake_profile', label: 'Fake Profile' },
];

const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'r1',
    reportedUser: 'ShadowViper',
    reporterUser: 'TidalWave',
    reason: 'Harassment',
    priority: 'high',
    time: '5m ago',
    userId: 'usr_8d4f2a',
  },
  {
    id: 'r2',
    reportedUser: 'CryptoKing99',
    reporterUser: 'UrbanFox',
    reason: 'Fake profile',
    priority: 'high',
    time: '12m ago',
    userId: 'usr_3b7e1c',
  },
  {
    id: 'r3',
    reportedUser: 'NightOwl',
    reporterUser: 'VoltMind',
    reason: 'Spam',
    priority: 'medium',
    time: '28m ago',
    userId: 'usr_9a2f4d',
  },
  {
    id: 'r4',
    reportedUser: 'GhostRider',
    reporterUser: 'CoralReef',
    reason: 'Inappropriate behavior',
    priority: 'medium',
    time: '1h ago',
    userId: 'usr_5c8e3b',
  },
  {
    id: 'r5',
    reportedUser: 'PixelDust',
    reporterUser: 'AuroraSkye',
    reason: 'Unsafe conduct',
    priority: 'low',
    time: '2h ago',
    userId: 'usr_7d1a9f',
  },
];

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; borderColor: string }> = {
  high: { label: 'High Priority', color: adminColors.alertHigh, borderColor: adminColors.alertHigh },
  medium: { label: 'Medium Priority', color: adminColors.alertMedium, borderColor: adminColors.alertMedium },
  low: { label: 'Low Priority', color: adminColors.alertLow, borderColor: adminColors.alertLow },
};

// ===========================================================================
// AdminReportQueueScreen
// ===========================================================================
const AdminReportQueueScreen: React.FC<Props> = ({ navigation }) => {
  const colors = adminColors;
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredReports = MOCK_REPORTS.filter((report) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high_priority') return report.priority === 'high';
    if (activeFilter === 'harassment') return report.reason === 'Harassment';
    if (activeFilter === 'fake_profile') return report.reason === 'Fake profile';
    return true;
  });

  const renderReportCard = ({ item, index }: { item: ReportItem; index: number }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];

    return (
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(400).delay(100 + index * 80))}
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderLeftWidth: 4,
            borderLeftColor: priorityConfig.borderColor,
          },
        ]}
      >
        {/* Priority Badge */}
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: priorityConfig.color + '20' },
          ]}
        >
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: priorityConfig.color },
            ]}
          />
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>

        {/* Report Info */}
        <Text style={[styles.reportUsers, { color: colors.text }]}>
          <Text style={styles.reportUserBold}>{item.reportedUser}</Text>
          {' reported by '}
          <Text style={styles.reportUserBold}>{item.reporterUser}</Text>
        </Text>
        <Text style={[styles.reportTime, { color: colors.textTertiary }]}>
          {item.time}
        </Text>

        <Text style={[styles.reportReason, { color: colors.text }]}>
          Reason: <Text style={styles.reportReasonBold}>{item.reason}</Text>
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.dismissBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
              Dismiss
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.warnBtn, { backgroundColor: colors.alertMedium + '20', borderColor: colors.alertMedium }]}
          >
            <Text style={[styles.actionBtnText, { color: colors.alertMedium }]}>
              Warn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.banBtn, { backgroundColor: colors.alertHigh + '20', borderColor: colors.alertHigh }]}
            onPress={() => navigation.navigate('AdminUserDetail', { userId: item.userId })}
          >
            <Text style={[styles.actionBtnText, { color: colors.alertHigh }]}>
              Ban
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
          Report Queue
        </Text>

        <View style={[styles.countBadge, { backgroundColor: colors.alertHigh + '20' }]}>
          <Text style={[styles.countBadgeText, { color: colors.alertHigh }]}>
            23 open
          </Text>
        </View>
      </Animated.View>

      {/* ---- Filter Tabs ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400).delay(100))}
        style={styles.filterRow}
      >
        <FlatList
          horizontal
          data={FILTER_TABS}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter(item.id)}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === item.id
                      ? colors.primary + '20'
                      : colors.surface,
                  borderColor:
                    activeFilter === item.id
                      ? colors.primary
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === item.id
                        ? colors.primary
                        : colors.textTertiary,
                    fontWeight: activeFilter === item.id ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        />
      </Animated.View>

      {/* ---- Report List ---- */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ---- Filters ----
  filterRow: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ---- List ----
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },

  // ---- Report Card ----
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportUsers: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 2,
  },
  reportUserBold: {
    fontWeight: '700',
  },
  reportTime: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 14,
  },
  reportReasonBold: {
    fontWeight: '700',
  },

  // ---- Action Row ----
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {},
  warnBtn: {},
  banBtn: {},
});

export default AdminReportQueueScreen;
