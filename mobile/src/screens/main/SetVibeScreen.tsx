import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { showAlert } from '../../utils/alert';
import { discoveryApi } from '../../api/discovery';
import { useModeStore } from '../../store/modeStore';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'SetVibe'>;

// ---------------------------------------------------------------------------
// Vibe Options
// ---------------------------------------------------------------------------
interface VibeOption {
  id: string;
  emoji: string;
  label: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  { id: 'coffee', emoji: '\u2615', label: 'Coffee Chat' },
  { id: 'gaming', emoji: '\uD83C\uDFAE', label: 'Gaming' },
  { id: 'yoga', emoji: '\uD83E\uDDD8', label: 'Yoga' },
  { id: 'food', emoji: '\uD83C\uDF55', label: 'Food Run' },
  { id: 'study', emoji: '\uD83D\uDCDA', label: 'Study Session' },
  { id: 'workout', emoji: '\uD83C\uDFCB\uFE0F', label: 'Workout' },
  { id: 'music', emoji: '\uD83C\uDFB5', label: 'Live Music' },
  { id: 'creative', emoji: '\uD83C\uDFA8', label: 'Creative' },
  { id: 'networking', emoji: '\uD83D\uDCBC', label: 'Networking' },
  { id: 'drinks', emoji: '\uD83C\uDF7B', label: 'Drinks' },
];

// ---------------------------------------------------------------------------
// Timer Options
// ---------------------------------------------------------------------------
interface TimerOption {
  id: string;
  label: string;
  minutes: number;
}

const TIMER_OPTIONS: TimerOption[] = [
  { id: '30m', label: '30min', minutes: 30 },
  { id: '1h', label: '1hr', minutes: 60 },
  { id: '2h', label: '2hr', minutes: 120 },
  { id: '4h', label: '4hr', minutes: 240 },
];

// ===========================================================================
// SetVibeScreen
// ===========================================================================
const SetVibeScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const preSelectedVibe = route.params?.preSelectedVibe;

  const [selectedVibe, setSelectedVibe] = useState<string | null>(
    preSelectedVibe ?? null,
  );
  const [selectedTimer, setSelectedTimer] = useState<string>('1h');
  const [customText, setCustomText] = useState('');

  const handleSetVibe = async () => {
    if (!selectedVibe) {
      showAlert('Select a Vibe', 'Please choose a vibe before activating.');
      return;
    }

    const vibe = VIBE_OPTIONS.find((v) => v.id === selectedVibe);
    const timer = TIMER_OPTIONS.find((t) => t.id === selectedTimer);
    const mode = useModeStore.getState().mode;

    try {
      await discoveryApi.setActiveVibes([selectedVibe], mode);
      showAlert(
        'Vibe Set!',
        `${vibe?.emoji} ${vibe?.label} is now active for ${timer?.label}.${customText ? ` "${customText}"` : ''}`,
      );
      navigation.goBack();
    } catch {
      showAlert('Error', 'Failed to set vibe. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* ---- Header ---- */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeText, { color: theme.colors.textTertiary }]}>
            {'\u2715'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Set Your Vibe
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- Subtitle ---- */}
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Let people nearby know what you're up to
        </Text>

        {/* ---- Vibe Options Grid ---- */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
          CHOOSE A VIBE
        </Text>
        <View style={styles.vibeGrid}>
          {VIBE_OPTIONS.map((vibe) => {
            const isSelected = selectedVibe === vibe.id;
            return (
              <TouchableOpacity
                key={vibe.id}
                style={[
                  styles.vibeCard,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary + '18'
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedVibe(vibe.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                <Text
                  style={[
                    styles.vibeLabel,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {vibe.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---- Timer Selection ---- */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
          DURATION
        </Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((timer) => {
            const isSelected = selectedTimer === timer.id;
            return (
              <TouchableOpacity
                key={timer.id}
                style={[
                  styles.timerChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary + '18'
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedTimer(timer.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timerText,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {timer.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---- Custom Text ---- */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
          CUSTOM MESSAGE (OPTIONAL)
        </Text>
        <View
          style={[
            styles.customInputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.customInput, { color: theme.colors.text }]}
            placeholder="Add a custom message..."
            placeholderTextColor={theme.colors.textTertiary}
            value={customText}
            onChangeText={setCustomText}
            maxLength={100}
            multiline={false}
          />
        </View>
        <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
          {customText.length}/100
        </Text>
      </ScrollView>

      {/* ---- Action Buttons ---- */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSetVibe}
          disabled={!selectedVibe}
        >
          <LinearGradient
            colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.setVibeButton,
              !selectedVibe && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.setVibeButtonText}>
              {selectedVibe ? 'Set Vibe' : 'Select a Vibe'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: theme.colors.textTertiary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '400',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ---- Subtitle ----
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // ---- Section Label ----
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },

  // ---- Vibe Grid ----
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  vibeCard: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  vibeEmoji: {
    fontSize: 22,
  },
  vibeLabel: {
    fontSize: 14,
    flex: 1,
  },

  // ---- Timer Row ----
  timerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  timerChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
  },

  // ---- Custom Input ----
  customInputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  },
  customInput: {
    fontSize: 15,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 6,
  },

  // ---- Actions ----
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },
  setVibeButton: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  setVibeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelButton: {
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SetVibeScreen;
