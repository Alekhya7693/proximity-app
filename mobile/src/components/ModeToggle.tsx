import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useModeStore } from '../store/modeStore';

const TOGGLE_WIDTH = 120;
const TOGGLE_HEIGHT = 32;
const PILL_PADDING = 2;
const PILL_WIDTH = TOGGLE_WIDTH / 2 - PILL_PADDING;

const ModeToggle: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleMode } = useModeStore();

  const translateX = useSharedValue(
    mode === 'social' ? PILL_PADDING : TOGGLE_WIDTH / 2,
  );

  const handleToggle = async () => {
    const newMode = mode === 'social' ? 'professional' : 'social';
    translateX.value = withTiming(
      newMode === 'social' ? PILL_PADDING : TOGGLE_WIDTH / 2,
      { duration: 200 },
    );
    await toggleMode();
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.8}
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.primary },
          pillStyle,
        ]}
      />
      <View style={styles.labels}>
        <Text
          style={[
            styles.label,
            {
              color:
                mode === 'social'
                  ? theme.colors.textInverse
                  : theme.colors.textSecondary,
              fontWeight: mode === 'social' ? '600' : '400',
            },
          ]}
        >
          Social
        </Text>
        <Text
          style={[
            styles.label,
            {
              color:
                mode === 'professional'
                  ? theme.colors.textInverse
                  : theme.colors.textSecondary,
              fontWeight: mode === 'professional' ? '600' : '400',
            },
          ]}
        >
          Pro
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: TOGGLE_HEIGHT - PILL_PADDING * 2,
    borderRadius: (TOGGLE_HEIGHT - PILL_PADDING * 2) / 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    width: TOGGLE_WIDTH / 2,
  },
});

export default ModeToggle;
