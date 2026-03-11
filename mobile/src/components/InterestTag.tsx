import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface InterestTagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

const InterestTag: React.FC<InterestTagProps> = ({
  label,
  selected = false,
  onPress,
  disabled = false,
}) => {
  const theme = useTheme();

  const backgroundColor = selected
    ? theme.colors.primaryLight
    : theme.colors.surface;
  const borderColor = selected
    ? theme.colors.primary
    : theme.colors.border;
  const textColor = selected
    ? theme.colors.primaryDark
    : theme.colors.textSecondary;

  const content = (
    <Text style={[styles.text, theme.typography.body2, { color: textColor }]}>
      {label}
    </Text>
  );

  if (!onPress) {
    return (
      <TouchableOpacity
        style={[styles.tag, { backgroundColor, borderColor }]}
        disabled
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.tag,
        { backgroundColor, borderColor },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {},
  disabled: { opacity: 0.5 },
});

export default InterestTag;
