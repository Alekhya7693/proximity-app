import React, { useState, useCallback } from 'react';
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
import { useTheme } from '../../theme/ThemeContext';
import { enteringAnim } from '../../utils/animations';
import { useFiltersStore } from '../../store/filtersStore';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Filters'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RADIUS_MIN = 50;
const RADIUS_MAX = 1000;
const RADIUS_STEP = 50;
const AGE_MIN = 18;
const AGE_MAX = 65;

const SHOW_ME_OPTIONS = ['Everyone', 'Women', 'Men', 'Non-binary'] as const;
type ShowMeOption = (typeof SHOW_ME_OPTIONS)[number];

const VIBE_OPTIONS = ['Any', 'Coffee Chat', 'Dating', 'Networking', 'Friendship'] as const;
type VibeOption = (typeof VIBE_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Slider Component (simplified, using touchable steps)
// ---------------------------------------------------------------------------
interface SimpleSliderProps {
  min: number;
  max: number;
  value: number;
  step?: number;
  onValueChange: (value: number) => void;
  trackColor: string;
  activeColor: string;
}

const SimpleSlider: React.FC<SimpleSliderProps> = ({
  min,
  max,
  value,
  step = 1,
  onValueChange,
  trackColor,
  activeColor,
}) => {
  const progress = (value - min) / (max - min);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number; locationY: number } }) => {
      // We approximate the track width from the event
      // This is a simple approach; a gesture handler gives better UX
      const trackWidth = 300; // approximate
      const rawProgress = Math.max(0, Math.min(1, evt.nativeEvent.locationX / trackWidth));
      const rawValue = min + rawProgress * (max - min);
      const snapped = Math.round(rawValue / step) * step;
      onValueChange(Math.max(min, Math.min(max, snapped)));
    },
    [min, max, step, onValueChange],
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.sliderContainer}
    >
      <View style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.sliderFill,
            { backgroundColor: activeColor, width: `${progress * 100}%` },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${progress * 100}%`,
              backgroundColor: activeColor,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Dual Slider (for age range)
// ---------------------------------------------------------------------------
interface DualSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  trackColor: string;
  activeColor: string;
}

const DualSlider: React.FC<DualSliderProps> = ({
  min,
  max,
  low,
  high,
  onLowChange,
  onHighChange,
  trackColor,
  activeColor,
}) => {
  const lowProgress = (low - min) / (max - min);
  const highProgress = (high - min) / (max - min);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      const trackWidth = 300;
      const rawProgress = Math.max(0, Math.min(1, evt.nativeEvent.locationX / trackWidth));
      const rawValue = Math.round(min + rawProgress * (max - min));
      // Determine which thumb is closer
      const distToLow = Math.abs(rawValue - low);
      const distToHigh = Math.abs(rawValue - high);
      if (distToLow <= distToHigh) {
        const clamped = Math.min(rawValue, high - 1);
        onLowChange(Math.max(min, clamped));
      } else {
        const clamped = Math.max(rawValue, low + 1);
        onHighChange(Math.min(max, clamped));
      }
    },
    [min, max, low, high, onLowChange, onHighChange],
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.sliderContainer}
    >
      <View style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.sliderFill,
            {
              backgroundColor: activeColor,
              left: `${lowProgress * 100}%`,
              width: `${(highProgress - lowProgress) * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${lowProgress * 100}%`,
              backgroundColor: activeColor,
              borderColor: '#FFFFFF',
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${highProgress * 100}%`,
              backgroundColor: activeColor,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

// ===========================================================================
// FiltersScreen
// ===========================================================================
const FiltersScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const filtersStore = useFiltersStore();

  // ---- State (initialized from store) ----
  const [radius, setRadius] = useState(filtersStore.radius);
  const [ageRange, setAgeRange] = useState<[number, number]>(filtersStore.ageRange);
  const [showMe, setShowMe] = useState<ShowMeOption>(filtersStore.showMe as ShowMeOption);
  const [vibeFilter, setVibeFilter] = useState<VibeOption>(filtersStore.vibeFilter as VibeOption);

  const handleReset = () => {
    setRadius(300);
    setAgeRange([21, 38]);
    setShowMe('Everyone');
    setVibeFilter('Any');
  };

  const handleApply = () => {
    filtersStore.setRadius(radius);
    filtersStore.setAgeRange(ageRange);
    filtersStore.setShowMe(showMe);
    filtersStore.setVibeFilter(vibeFilter);
    navigation.goBack();
  };

  const formatRadius = (m: number): string => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
  };

  // ---- Renders ----
  const renderChip = <T extends string>(
    label: T,
    selected: boolean,
    onPress: () => void,
  ) => {
    if (selected) {
      return (
        <TouchableOpacity key={label} activeOpacity={0.8} onPress={onPress}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chip}
          >
            <Text style={styles.chipTextSelected}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        key={label}
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.chip, { backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border }]}
      >
        <Text style={[styles.chipText, { color: theme.colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ---- Header ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={[styles.headerBar, { borderBottomColor: theme.colors.border }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backArrow, { color: theme.colors.primary }]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Discovery Filters
        </Text>

        <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
          <Text style={[styles.resetText, { color: theme.colors.secondary }]}>
            Reset
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Discovery Radius ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Discovery Radius
            </Text>
            <View style={[styles.valueBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.valueBadgeText, { color: theme.colors.primary }]}>
                {formatRadius(radius)}
              </Text>
            </View>
          </View>
          <View style={[styles.sliderCard, { backgroundColor: theme.colors.surface }]}>
            <SimpleSlider
              min={RADIUS_MIN}
              max={RADIUS_MAX}
              value={radius}
              step={RADIUS_STEP}
              onValueChange={setRadius}
              trackColor={theme.colors.border}
              activeColor={theme.colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, { color: theme.colors.textTertiary }]}>
                50m
              </Text>
              <Text style={[styles.sliderLabelText, { color: theme.colors.textTertiary }]}>
                1km
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ---- Age Range ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Age Range
            </Text>
            <View style={styles.ageValues}>
              <View style={[styles.valueBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.valueBadgeText, { color: theme.colors.primary }]}>
                  {ageRange[0]}
                </Text>
              </View>
              <Text style={[styles.ageDash, { color: theme.colors.textTertiary }]}> - </Text>
              <View style={[styles.valueBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.valueBadgeText, { color: theme.colors.primary }]}>
                  {ageRange[1]}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.sliderCard, { backgroundColor: theme.colors.surface }]}>
            <DualSlider
              min={AGE_MIN}
              max={AGE_MAX}
              low={ageRange[0]}
              high={ageRange[1]}
              onLowChange={(v) => setAgeRange([v, ageRange[1]])}
              onHighChange={(v) => setAgeRange([ageRange[0], v])}
              trackColor={theme.colors.border}
              activeColor={theme.colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, { color: theme.colors.textTertiary }]}>
                {AGE_MIN}
              </Text>
              <Text style={[styles.sliderLabelText, { color: theme.colors.textTertiary }]}>
                {AGE_MAX}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ---- Show Me ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Show me
          </Text>
          <View style={styles.chipRow}>
            {SHOW_ME_OPTIONS.map((option) =>
              renderChip(option, showMe === option, () => setShowMe(option)),
            )}
          </View>
        </Animated.View>

        {/* ---- Filter by Vibe ---- */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Filter by Vibe
          </Text>
          <View style={styles.chipRow}>
            {VIBE_OPTIONS.map((option) =>
              renderChip(option, vibeFilter === option, () => setVibeFilter(option)),
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ---- Apply Button ---- */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(500))}
        style={styles.applyContainer}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handleApply}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyButton}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ---- Scroll ----
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  // ---- Section ----
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  ageValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageDash: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ---- Slider ----
  sliderCard: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    top: 0,
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    top: -8,
    marginLeft: -11,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ---- Chips ----
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ---- Apply ----
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 16,
  },
  applyButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default FiltersScreen;
