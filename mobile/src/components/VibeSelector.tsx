import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { discoveryApi } from '../api/discovery';
import { AppMode } from '../store/modeStore';
import InterestTag from './InterestTag';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VibeSelectorProps {
  visible: boolean;
  mode: AppMode;
  selectedVibes: string[];
  onSelect: (vibes: string[]) => void;
  onClose: () => void;
}

const VibeSelector: React.FC<VibeSelectorProps> = ({
  visible,
  mode,
  selectedVibes,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [availableVibes, setAvailableVibes] = useState<string[]>([]);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedVibes);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalSelected(selectedVibes);
      loadVibes();
    }
  }, [visible, mode]);

  const loadVibes = async () => {
    setIsLoading(true);
    try {
      const vibes = await discoveryApi.getVibes(mode);
      setAvailableVibes(vibes);
    } catch {
      // Use defaults
      setAvailableVibes(
        mode === 'social'
          ? [
              'Coffee Chat', 'Adventure', 'Chill', 'Party',
              'Workout Buddy', 'Study Partner', 'Foodie Run',
              'Game Night', 'Movie Night', 'Creative Collab',
            ]
          : [
              'Networking', 'Mentorship', 'Co-Working', 'Brainstorming',
              'Coffee Meeting', 'Industry Chat', 'Hiring',
              'Startup Talk', 'Skill Swap', 'Workshop',
            ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVibe = (vibe: string) => {
    setLocalSelected((prev) =>
      prev.includes(vibe)
        ? prev.filter((v) => v !== vibe)
        : [...prev, vibe],
    );
  };

  const handleApply = () => {
    onSelect(localSelected);
  };

  const handleClear = () => {
    setLocalSelected([]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          <View style={styles.handle}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          <View style={styles.sheetHeader}>
            <Text
              style={[theme.typography.h4, { color: theme.colors.text }]}
            >
              Set Your Vibe
            </Text>
            <TouchableOpacity onPress={handleClear}>
              <Text
                style={[
                  theme.typography.buttonSmall,
                  { color: theme.colors.error },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              theme.typography.body2,
              { color: theme.colors.textSecondary, marginBottom: 20 },
            ]}
          >
            Select vibes to filter your feed. Show profiles that match your
            current mood.
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.vibesList}
              contentContainerStyle={styles.vibesContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tagsRow}>
                {availableVibes.map((vibe) => (
                  <InterestTag
                    key={vibe}
                    label={vibe}
                    selected={localSelected.includes(vibe)}
                    onPress={() => toggleVibe(vibe)}
                  />
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.applyButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  theme.typography.button,
                  { color: theme.colors.textInverse },
                ]}
              >
                Apply Vibes
                {localSelected.length > 0
                  ? ` (${localSelected.length})`
                  : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  handle: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  vibesList: { flex: 1 },
  vibesContent: { paddingBottom: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { paddingTop: 16 },
  applyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VibeSelector;
