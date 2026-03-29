import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { locationApi, NearbyUser } from '../../api/location';
import { useLocationStore } from '../../store/locationStore';
import { enteringAnim } from '../../utils/animations';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'HotZoneMap'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Convert nearby users into cluster data ──────────────────────────────────

interface ClusterData {
  id: string;
  x: number;
  y: number;
  size: number;
  count: number;
}

function buildClusters(users: NearbyUser[]): ClusterData[] {
  if (!users || users.length === 0) return [];

  // Group users by distance bands into clusters
  const close = users.filter((u) => u.distance <= 500);
  const nearby = users.filter((u) => u.distance > 500 && u.distance <= 2000);
  const far = users.filter((u) => u.distance > 2000 && u.distance <= 5000);
  const extended = users.filter((u) => u.distance > 5000);

  const clusters: ClusterData[] = [];
  if (close.length > 0)
    clusters.push({ id: 'c1', x: 0.45, y: 0.4, size: Math.min(40 + close.length * 6, 100), count: close.length });
  if (nearby.length > 0)
    clusters.push({ id: 'c2', x: 0.22, y: 0.2, size: Math.min(36 + nearby.length * 5, 88), count: nearby.length });
  if (far.length > 0)
    clusters.push({ id: 'c3', x: 0.7, y: 0.3, size: Math.min(32 + far.length * 4, 72), count: far.length });
  if (extended.length > 0)
    clusters.push({ id: 'c4', x: 0.75, y: 0.7, size: Math.min(28 + extended.length * 3, 56), count: extended.length });

  return clusters;
}

// ── Cluster Circle Component ────────────────────────────────────────────────

interface ClusterCircleProps {
  cluster: ClusterData;
  mapWidth: number;
  mapHeight: number;
  gradientStart: string;
  gradientEnd: string;
  delay: number;
}

const ClusterCircle: React.FC<ClusterCircleProps> = ({
  cluster, mapWidth, mapHeight, gradientStart, gradientEnd, delay,
}) => {
  const left = cluster.x * mapWidth - cluster.size / 2;
  const top = cluster.y * mapHeight - cluster.size / 2;

  return (
    <Animated.View
      entering={enteringAnim(FadeIn.duration(600).delay(delay))}
      style={[
        styles.clusterOuter,
        {
          width: cluster.size + 6,
          height: cluster.size + 6,
          borderRadius: (cluster.size + 6) / 2,
          left: left - 3,
          top: top - 3,
        },
      ]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.clusterGradientBorder,
          {
            width: cluster.size + 6,
            height: cluster.size + 6,
            borderRadius: (cluster.size + 6) / 2,
          },
        ]}
      >
        <View
          style={[
            styles.clusterInner,
            {
              width: cluster.size,
              height: cluster.size,
              borderRadius: cluster.size / 2,
            },
          ]}
        >
          <Text style={styles.clusterCount}>{cluster.count}</Text>
          <Text style={styles.clusterLabel}>active</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ── HotZoneMapScreen ────────────────────────────────────────────────────────

const HotZoneMapScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapHeight = 420;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await locationApi.getNearbyUsers(10000);
        if (!cancelled) setNearbyUsers(users);
      } catch {
        // Empty map on error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const clusters = useMemo(() => buildClusters(nearbyUsers), [nearbyUsers]);
  const totalActive = nearbyUsers.length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(100))}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Hot Zone Map
        </Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>
            {totalActive > 0 ? `${totalActive} nearby` : 'Live'}
          </Text>
        </View>
      </Animated.View>

      {/* Privacy notice */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(200))}
        style={[styles.privacyNotice, { backgroundColor: theme.colors.surfaceElevated }]}
      >
        <Text style={styles.privacyIcon}>{'\uD83D\uDD12'}</Text>
        <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
          Anonymous clusters only. No individual locations shown.
        </Text>
      </Animated.View>

      {/* Map Area */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(700).delay(300))}
        style={[
          styles.mapContainer,
          {
            height: mapHeight,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pos) => (
          <View
            key={`h-${pos}`}
            style={[styles.gridLineH, { top: `${pos * 100}%`, backgroundColor: theme.colors.border + '40' }]}
          />
        ))}
        {[0.25, 0.5, 0.75].map((pos) => (
          <View
            key={`v-${pos}`}
            style={[styles.gridLineV, { left: `${pos * 100}%`, backgroundColor: theme.colors.border + '40' }]}
          />
        ))}

        {isLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.mapLoadingText, { color: theme.colors.textTertiary }]}>
              Scanning area...
            </Text>
          </View>
        ) : clusters.length === 0 ? (
          <View style={styles.mapLoading}>
            <Text style={styles.mapEmptyEmoji}>{'\uD83D\uDCCD'}</Text>
            <Text style={[styles.mapLoadingText, { color: theme.colors.textTertiary }]}>
              No activity clusters nearby
            </Text>
          </View>
        ) : (
          <>
            {/* Cluster circles */}
            {clusters.map((cluster, i) => (
              <ClusterCircle
                key={cluster.id}
                cluster={cluster}
                mapWidth={SCREEN_WIDTH - 64}
                mapHeight={mapHeight}
                gradientStart={theme.colors.primary}
                gradientEnd={theme.colors.secondary}
                delay={400 + i * 150}
              />
            ))}

            {/* User position dot */}
            <Animated.View
              entering={enteringAnim(FadeIn.duration(800).delay(900))}
              style={[
                styles.userDot,
                {
                  left: 0.48 * (SCREEN_WIDTH - 64) - 8,
                  top: 0.45 * mapHeight - 8,
                },
              ]}
            >
              <View style={styles.userDotPulse} />
              <View style={styles.userDotCenter} />
            </Animated.View>
          </>
        )}
      </Animated.View>

      {/* Legend */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(500))}
        style={styles.legendContainer}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendDotCluster, { borderColor: theme.colors.primary }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Activity Cluster
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotUser} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Your Position
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: '#10B981' },

  privacyNotice: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8,
  },
  privacyIcon: { fontSize: 14 },
  privacyText: { fontSize: 13, fontWeight: '500', flex: 1 },

  mapContainer: {
    marginHorizontal: 20, borderRadius: 20, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  mapLoading: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  mapLoadingText: { fontSize: 14, fontWeight: '500' },
  mapEmptyEmoji: { fontSize: 48 },

  gridLineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },

  clusterOuter: { position: 'absolute' },
  clusterGradientBorder: { alignItems: 'center', justifyContent: 'center', padding: 3 },
  clusterInner: { backgroundColor: '#133E68', alignItems: 'center', justifyContent: 'center' },
  clusterCount: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  clusterLabel: { fontSize: 9, fontWeight: '600', color: '#38BDF8', marginTop: -1, letterSpacing: 0.5 },

  userDot: { position: 'absolute', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  userDotPulse: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#3B82F620' },
  userDotCenter: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFFFFF' },

  legendContainer: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 24, marginTop: 20, paddingHorizontal: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDotCluster: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, backgroundColor: 'transparent' },
  legendDotUser: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFFFFF' },
  legendText: { fontSize: 13, fontWeight: '500' },
});

export default HotZoneMapScreen;
