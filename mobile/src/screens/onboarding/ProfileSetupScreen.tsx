import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { enteringAnim } from '../../utils/animations';
import { showAlert } from '../../utils/alert';
import { useTheme } from '../../theme/ThemeContext';
import { validators } from '../../utils/validators';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { OnboardingScreenProps } from '../../navigation/types';

type Props = OnboardingScreenProps<'ProfileSetup'>;

const PRIMARY = '#6C5CE7';
const PRIMARY_LIGHT = '#A29BFE';
const SECONDARY = '#FD79A8';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user, updateUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [photos, setPhotos] = useState<string[]>(user?.profilePhotos ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') {
      // On web, use realistic placeholder profile images for demo
      const placeholders = [
        'https://randomuser.me/api/portraits/lego/2.jpg',
        'https://randomuser.me/api/portraits/lego/3.jpg',
        'https://randomuser.me/api/portraits/lego/4.jpg',
      ];
      const nextIdx = photos.length % placeholders.length;
      setPhotos((prev) => [...prev, placeholders[nextIdx]]);
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          'Permission Required',
          'Please allow access to your photo library.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      // Fallback for web/unsupported platforms
      setPhotos((prev) => [...prev, 'https://randomuser.me/api/portraits/lego/5.jpg']);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (!validators.isValidName(displayName)) {
      showAlert('Error', 'Display name must be 2-50 characters');
      return;
    }

    if (!validators.isValidBio(bio)) {
      showAlert('Error', 'Bio must be 500 characters or less');
      return;
    }

    if (photos.length === 0) {
      showAlert('Error', 'Please add at least one profile photo');
      return;
    }

    setIsLoading(true);
    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      for (const photoUri of photos) {
        if (photoUri.startsWith('http')) {
          uploadedUrls.push(photoUri);
          continue;
        }
        const formData = new FormData();
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as unknown as Blob);

        const { url } = await authApi.uploadProfilePhoto(formData);
        uploadedUrls.push(url);
      }

      await authApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePhotos: uploadedUrls,
      });

      updateUser({
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePhotos: uploadedUrls,
      });

      navigation.navigate('SocialPreferences');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save profile';
      showAlert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const bioProgress = bio.length / 500;
  const bioBarColor =
    bioProgress < 0.7 ? PRIMARY_LIGHT : bioProgress < 0.9 ? '#FDCB6E' : SECONDARY;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress Bar ─────────────────────────────────────────── */}
        <AnimatedView entering={enteringAnim(FadeIn.duration(600).delay(100))}>
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressStepText, { color: theme.colors.textSecondary }]}>
                Step 1 of 4
              </Text>
              <Text style={[styles.progressPercent, { color: PRIMARY }]}>
                25%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}>
              <AnimatedView
                entering={enteringAnim(FadeIn.duration(800).delay(400))}
                style={[styles.progressFill, { width: '25%' }]}
              />
            </View>
          </View>
        </AnimatedView>

        {/* ── Header ───────────────────────────────────────────────── */}
        <AnimatedView
          entering={enteringAnim(FadeInDown.duration(600).delay(200).springify().damping(14))}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>📸</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Set Up Your Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Add photos and tell the world a little about yourself
          </Text>
        </AnimatedView>

        {/* ── Photo Grid ───────────────────────────────────────────── */}
        <AnimatedView
          entering={enteringAnim(FadeInDown.duration(600).delay(350).springify().damping(14))}
          style={styles.photoSection}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            Your Photos
          </Text>
          <Text style={[styles.sectionHint, { color: theme.colors.textTertiary }]}>
            Add up to 6 photos {'\u2022'} first photo is your main
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <AnimatedView
                key={`photo-${index}`}
                entering={enteringAnim(FadeIn.duration(400).delay(100 * index))}
                style={styles.photoCard}
              >
                <Image source={{ uri }} style={styles.photo} />
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>MAIN</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => handleRemovePhoto(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removePhotoText}>{'\u2715'}</Text>
                </TouchableOpacity>
              </AnimatedView>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity
                style={[
                  styles.addPhotoBtn,
                  {
                    borderColor: PRIMARY_LIGHT,
                    backgroundColor: `${PRIMARY}08`,
                  },
                ]}
                onPress={handlePickPhoto}
                activeOpacity={0.6}
              >
                <View style={styles.addPhotoIconCircle}>
                  <Text style={styles.addPhotoPlus}>+</Text>
                </View>
                <Text style={[styles.addPhotoLabel, { color: PRIMARY }]}>
                  Add Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedView>

        {/* ── Display Name Input ────────────────────────────────────── */}
        <AnimatedView
          entering={enteringAnim(FadeInDown.duration(600).delay(500).springify().damping(14))}
          style={styles.inputGroup}
        >
          <View
            style={[
              styles.modernInputContainer,
              {
                borderColor: nameFocused ? PRIMARY : theme.colors.border,
                backgroundColor: nameFocused ? `${PRIMARY}06` : theme.colors.surface,
              },
              nameFocused && styles.modernInputContainerFocused,
            ]}
          >
            <Text style={styles.inputEmoji}>👤</Text>
            <View style={styles.inputInner}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    color: nameFocused ? PRIMARY : theme.colors.textSecondary,
                  },
                ]}
              >
                Display Name
              </Text>
              <TextInput
                style={[styles.modernInput, { color: theme.colors.text }]}
                placeholder="How should others see you?"
                placeholderTextColor={theme.colors.textTertiary}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={50}
                editable={!isLoading}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>
        </AnimatedView>

        {/* ── Bio Input ────────────────────────────────────────────── */}
        <AnimatedView
          entering={enteringAnim(FadeInDown.duration(600).delay(650).springify().damping(14))}
          style={styles.inputGroup}
        >
          <View
            style={[
              styles.modernInputContainer,
              styles.modernInputContainerBio,
              {
                borderColor: bioFocused ? PRIMARY : theme.colors.border,
                backgroundColor: bioFocused ? `${PRIMARY}06` : theme.colors.surface,
              },
              bioFocused && styles.modernInputContainerFocused,
            ]}
          >
            <Text style={[styles.inputEmoji, { alignSelf: 'flex-start', marginTop: 16 }]}>
              ✍️
            </Text>
            <View style={[styles.inputInner, { flex: 1 }]}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    color: bioFocused ? PRIMARY : theme.colors.textSecondary,
                  },
                ]}
              >
                Bio
              </Text>
              <TextInput
                style={[styles.modernInput, styles.modernTextArea, { color: theme.colors.text }]}
                placeholder="Tell others about yourself..."
                placeholderTextColor={theme.colors.textTertiary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                editable={!isLoading}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
              />
            </View>
          </View>
          {/* Bio character bar */}
          <View style={styles.bioCounterRow}>
            <View style={[styles.bioBarTrack, { backgroundColor: theme.colors.borderLight }]}>
              <View
                style={[
                  styles.bioBarFill,
                  {
                    width: `${Math.min(bioProgress * 100, 100)}%`,
                    backgroundColor: bioBarColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.bioCounterText, { color: theme.colors.textTertiary }]}>
              {bio.length}/500
            </Text>
          </View>
        </AnimatedView>

        {/* ── Continue Button ──────────────────────────────────────── */}
        <AnimatedView entering={enteringAnim(FadeInUp.duration(600).delay(800).springify().damping(14))}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.continueButtonInner}>
                <Text style={styles.continueButtonText}>
                  Continue
                </Text>
                <Text style={styles.continueButtonArrow}>{'\u2192'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </AnimatedView>

        {/* Bottom spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const PHOTO_SIZE = 100;
const PHOTO_HEIGHT = 133;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* ── Progress Bar ──────────────────────────────────────────────── */
  progressContainer: {
    marginBottom: 28,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },

  /* ── Header ────────────────────────────────────────────────────── */
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* ── Photo Section ─────────────────────────────────────────────── */
  photoSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      },
    }),
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_HEIGHT,
    borderRadius: 16,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 8px rgba(255,107,107,0.45)',
      },
    }),
  },
  removePhotoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  addPhotoBtn: {
    width: PHOTO_SIZE,
    height: PHOTO_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${PRIMARY}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoPlus: {
    fontSize: 24,
    fontWeight: '300',
    color: PRIMARY,
    lineHeight: 28,
  },
  addPhotoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Modern Input Fields ───────────────────────────────────────── */
  inputGroup: {
    marginBottom: 20,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 64,
  },
  modernInputContainerBio: {
    alignItems: 'flex-start',
    minHeight: 130,
  },
  modernInputContainerFocused: {
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 0 0 3px ${PRIMARY}20`,
      },
    }),
  },
  inputEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  inputInner: {
    flex: 1,
  },
  floatingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 0,
  },
  modernInput: {
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  modernTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  /* ── Bio Counter ───────────────────────────────────────────────── */
  bioCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  bioBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bioBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bioCounterText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 48,
    textAlign: 'right',
  },

  /* ── Continue Button ───────────────────────────────────────────── */
  continueButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    marginTop: 12,
    backgroundColor: PRIMARY,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0 6px 20px ${PRIMARY}50`,
      },
    }),
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '400',
  },
});

export default ProfileSetupScreen;
