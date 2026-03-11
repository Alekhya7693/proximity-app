import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatters } from '../utils/formatters';

interface CompatibilityBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({
  score,
  size = 'small',
}) => {
  const theme = useTheme();
  const level = formatters.getCompatibilityLevel(score);

  const badgeColor = theme.colors.compatibility[level];
  const percentage = formatters.formatCompatibility(score);

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 11 },
    medium: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 13 },
    large: { paddingHorizontal: 16, paddingVertical: 7, fontSize: 16 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor + '20',
          borderColor: badgeColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: badgeColor,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {percentage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});

export default CompatibilityBadge;
