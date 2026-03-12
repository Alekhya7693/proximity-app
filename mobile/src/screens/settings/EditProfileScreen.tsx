import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'EditProfile'>;

// ---------------------------------------------------------------------------
// Avatar Options (reused from AvatarSetupScreen)
// ---------------------------------------------------------------------------
interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  gradientColors: [string, string];
}

const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'urban-fox',
    name: 'UrbanFox',
    emoji: '\u{1F98A}',
    gradientColors: ['#8B5CF6', '#A855F7'],
  },
  {
    id: 'solar-nomad',
    name: 'SolarNomad',
    emoji: '\u2B50',
    gradientColors: ['#F59E0B', '#F97316'],
  },
  {
    id: 'tidal-thinker',
    name: 'TidalThinker',
    emoji: '\u{1F30A}',
    gradientColors: ['#06B6D4', '#3B82F6'],
  },
  {
    id: 'night-hawk',
    name: 'NightHawk',
    emoji: '\u{1F985}',
    gradientColors: ['#6366F1', '#8B5CF6'],
  },
  {
    id: 'cosmic-drifter',
    name: 'CosmicDrifter',
    emoji: '\u{1F319}',
    gradientColors: ['#8B5CF6', '#EC4899'],
  },
  {
    id: 'ember-spark',
    name: 'EmberSpark',
    emoji: '\u{1F525}',
    gradientColors: ['#EF4444', '#F97316'],
  },
];

// ===========================================================================
// EditProfileScreen
// ===========================================================================
const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName ?? 'UrbanFox');
  const [bio, setBio] = useState('Exploring the city and meeting new people.');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('urban-fox');

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar)!;

  const handleSave = () => {
    showAlert('Profile Updated', 'Your profile changes have been saved.');
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(400))}
        style={styles.headerBar}
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
          Edit Profile
        </Text>

        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Preview */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(100))}
          style={styles.avatarPreviewSection}
        >
          <View style={[styles.previewCircleOuter, { borderColor: theme.colors.primary }]}>
            <LinearGradient
              colors={currentAvatar.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCircle}
            >
              <Text style={styles.previewEmoji}>{currentAvatar.emoji}</Text>
            </LinearGradient>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
              Upload Photo (Coming Soon)
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Display Name Input */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(200))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            DISPLAY NAME
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={24}
            />
          </View>
          <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
            {displayName.length}/24
          </Text>
        </Animated.View>

        {/* Bio Input */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(300))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            BIO
          </Text>
          <View
            style={[
              styles.inputContainer,
              styles.bioInputContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, styles.bioInput, { color: theme.colors.text }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
          </View>
          <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
            {bio.length}/160
          </Text>
        </Animated.View>

        {/* Avatar Selection */}
        <Animated.View
          entering={enteringAnim(FadeInDown.duration(500).delay(400))}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            AVATAR
          </Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.id;
              return (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarCard,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                    isSelected && {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => setSelectedAvatar(avatar.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={avatar.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarCircle}
                  >
                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  </LinearGradient>
                  <Text
                    style={[
                      styles.avatarName,
                      {
                        color: isSelected
                          ? theme.colors.text
                          : theme.colors.textTertiary,
                        fontWeight: isSelected ? '600' : '500',
                      },
                    ]}
                  >
                    {avatar.name}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedCheck,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.selectedCheckText}>{'\u2713'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View
        entering={enteringAnim(FadeIn.duration(500).delay(500))}
        style={styles.saveContainer}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handleSave}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingTop: 8,
    paddingBottom: 120,
  },

  // ---- Avatar Preview ----
  avatarPreviewSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    padding: 3,
    marginBottom: 12,
  },
  previewCircle: {
    flex: 1,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 44,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- Sections ----
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  // ---- Inputs ----
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bioInputContainer: {
    minHeight: 100,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  bioInput: {
    minHeight: 72,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },

  // ---- Avatar Grid ----
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  avatarCard: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  avatarName: {
    fontSize: 13,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ---- Save ----
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 16,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default EditProfileScreen;
