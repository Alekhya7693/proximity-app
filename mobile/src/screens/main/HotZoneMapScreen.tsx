import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'HotZoneMap'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Cluster data
// ---------------------------------------------------------------------------
interface ClusterData {
  id: string;
  x: number;
  y: number;
  size: number;
  count: number;
}

const CLUSTERS: ClusterData[] = [
  { id: 'c1', x: 0.22, y: 0.18, size: 88, count: 31 },
  { id: 'c2', x: 0.65, y: 0.32, size: 72, count: 18 },
  { id: 'c3', x: 0.38, y: 0.55, size: 56, count: 9 },
  { id: 'c4', x: 0.75, y: 0.7, size: 44, count: 4 },
];

// Small ambient dots scattered on the "map"
const MAP_DOTS = [
  { x: 0.15, y: 0.35, size: 3 },
  { x: 0.5, y: 0.12, size: 2.5 },
  { x: 0.82, y: 0.22, size: 3.5 },
  { x: 0.3, y: 0.75, size: 2 },
  { x: 0.6, y: 0.6, size: 3 },
  { x: 0.9, y: 0.5, size: 2.5 },
  { x: 0.12, y: 0.6, size: 2 },
  { x: 0.45, y: 0.38, size: 3 },
  { x: 0.7, y: 0.82, size: 2 },
  { x: 0.55, y: 0.78, size: 2.5 },
];

// ---------------------------------------------------------------------------
// Cluster Circle
// ---------------------------------------------------------------------------
interface ClusterCircleProps {
  cluster: ClusterData;
  mapWidth: number;
  mapHeight: number;
  gradientStart: string;
  gradientEnd: string;
  delay: number;
}

const ClusterCircle: React.FC<ClusterCircleProps> = ({
  cluster,
  mapWidth,
  mapHeight,
  gradientStart,
  gradientEnd,
  delay,
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

// ===========================================================================
// HotZoneMapScreen
// ===========================================================================
const HotZoneMapScreen: React.FC<Props> = () => {
  const theme = useTheme();

  const mapHeight = 420;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(100))}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Hot Zone Map
        </Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>Live</Text>
        </View>
      </Animated.View>

      {/* ---- Privacy notice ---- */}
      <Animated.View
        entering={enteringAnim(FadeInDown.duration(500).delay(200))}
        style={[styles.privacyNotice, { backgroundColor: theme.colors.surfaceElevated }]}
      >
        <Text style={styles.privacyIcon}>{'\uD83D\uDD12'}</Text>
        <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
          Anonymous clusters only. No individual locations shown.
        </Text>
      </Animated.View>

      {/* ---- Map Area ---- */}
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
            style={[
              styles.gridLineH,
              {
                top: `${pos * 100}%`,
                backgroundColor: theme.colors.border + '40',
              },
            ]}
          />
        ))}
        {[0.25, 0.5, 0.75].map((pos) => (
          <View
            key={`v-${pos}`}
            style={[
              styles.gridLineV,
              {
                left: `${pos * 100}%`,
                backgroundColor: theme.colors.border + '40',
              },
            ]}
          />
        ))}

        {/* Ambient dots */}
        {MAP_DOTS.map((dot, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.mapDot,
              {
                left: dot.x * (SCREEN_WIDTH - 64),
                top: dot.y * mapHeight,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: theme.colors.textTertiary + '50',
              },
            ]}
          />
        ))}

        {/* Cluster circles */}
        {CLUSTERS.map((cluster, i) => (
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
      </Animated.View>

      {/* ---- Legend ---- */}
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

// ===========================================================================
// Styles
// ===========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },

  // ---- Privacy Notice ----
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  privacyIcon: {
    fontSize: 14,
  },
  privacyText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // ---- Map ----
  mapContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  mapDot: {
    position: 'absolute',
  },

  // ---- Clusters ----
  clusterOuter: {
    position: 'absolute',
  },
  clusterGradientBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  clusterInner: {
    backgroundColor: '#133E68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clusterLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#38BDF8',
    marginTop: -1,
    letterSpacing: 0.5,
  },

  // ---- User Dot ----
  userDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F620',
  },
  userDotCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ---- Legend ----
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDotCluster: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  legendDotUser: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default HotZoneMapScreen;
