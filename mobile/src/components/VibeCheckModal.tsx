import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────

interface VibeOption {
  id: string;
  label: string;
  emoji: string;
}

interface VibeCheckModalProps {
  visible: boolean;
  onSelect: (vibeId: string) => void;
  onClose: () => void;
}

// ── Vibe Options ─────────────────────────────────────────────────────────────

const VIBE_OPTIONS: VibeOption[] = [
  { id: 'coffee', label: 'Coffee Chat', emoji: '\u2615' },
  { id: 'casual', label: 'Casual Convo', emoji: '\uD83D\uDCAC' },
  { id: 'social', label: 'Socializing', emoji: '\uD83C\uDF89' },
  { id: 'dating', label: 'Dating', emoji: '\u2764\uFE0F' },
];

// ── Component ────────────────────────────────────────────────────────────────

const VibeCheckModal: React.FC<VibeCheckModalProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleSetVibe = () => {
    if (selectedId) {
      onSelect(selectedId);
      setSelectedId(null);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Bottom Sheet */}
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          {/* Header */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            What's your vibe? {'\u2728'}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sets your intent for the next 30 minutes. Shown on your card.
          </Text>

          {/* 2x2 Grid */}
          <View style={styles.grid}>
            {VIBE_OPTIONS.map((vibe) => {
              const isSelected = selectedId === vibe.id;

              return (
                <TouchableOpacity
                  key={vibe.id}
                  style={styles.gridItem}
                  onPress={() => handleSelect(vibe.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[
                        theme.colors.gradient.start,
                        theme.colors.gradient.end,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.vibeCard}
                    >
                      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                      <Text style={styles.vibeLabelSelected}>{vibe.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.vibeCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                      <Text
                        style={[
                          styles.vibeLabel,
                          { color: theme.colors.text },
                        ]}
                      >
                        {vibe.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Set Vibe Button */}
          <TouchableOpacity
            onPress={handleSetVibe}
            activeOpacity={0.85}
            disabled={!selectedId}
            style={styles.setVibeButtonTouchable}
          >
            <LinearGradient
              colors={
                selectedId
                  ? [theme.colors.gradient.start, theme.colors.gradient.end]
                  : [theme.colors.border, theme.colors.border]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.setVibeButton}
            >
              <Text
                style={[
                  styles.setVibeButtonText,
                  { opacity: selectedId ? 1 : 0.5 },
                ]}
              >
                Set Vibe
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Sheet
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Header
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
  },
  vibeCard: {
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vibeEmoji: {
    fontSize: 32,
  },
  vibeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  vibeLabelSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Set Vibe Button
  setVibeButtonTouchable: {
    width: '100%',
  },
  setVibeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setVibeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default VibeCheckModal;
