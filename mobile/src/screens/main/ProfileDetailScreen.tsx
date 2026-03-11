import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { matchesApi, MatchDetail } from '../../api/matches';
import { discoveryApi } from '../../api/discovery';
import { formatters } from '../../utils/formatters';
import CompatibilityBadge from '../../components/CompatibilityBadge';
import InterestTag from '../../components/InterestTag';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ProfileDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId } = route.params;
  const theme = useTheme();

  const [profile, setProfile] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await matchesApi.getMatchDetail(userId);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = () => {
    Alert.alert('Report User', 'Why are you reporting this user?', [
      {
        text: 'Inappropriate Content',
        onPress: () =>
          discoveryApi.reportUser(userId, 'inappropriate_content'),
      },
      {
        text: 'Harassment',
        onPress: () => discoveryApi.reportUser(userId, 'harassment'),
      },
      {
        text: 'Fake Profile',
        onPress: () => discoveryApi.reportUser(userId, 'fake_profile'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? They will no longer be able to see you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await discoveryApi.blockUser(userId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to block user.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            style={[theme.typography.body1, { color: theme.colors.primary }]}
          >
            Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReport}>
          <Text
            style={[theme.typography.body2, { color: theme.colors.error }]}
          >
            Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Carousel */}
        <View style={styles.photoCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setCurrentPhotoIndex(index);
            }}
            scrollEventThrottle={200}
          >
            {profile.profilePhotos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {profile.profilePhotos.length > 1 && (
            <View style={styles.photoIndicators}>
              {profile.profilePhotos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        index === currentPhotoIndex
                          ? theme.colors.textInverse
                          : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text
              style={[theme.typography.h3, { color: theme.colors.text }]}
            >
              {profile.displayName}, {profile.age}
            </Text>
            <CompatibilityBadge score={profile.compatibilityScore} />
          </View>

          {profile.profession && (
            <Text
              style={[
                theme.typography.subtitle1,
                { color: theme.colors.textSecondary, marginTop: 4 },
              ]}
            >
              {profile.profession}
              {profile.company ? ` at ${profile.company}` : ''}
            </Text>
          )}

          {profile.bio && (
            <Text
              style={[
                theme.typography.body1,
                { color: theme.colors.textSecondary, marginTop: 12 },
              ]}
            >
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Interests */}
        {profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                theme.typography.subtitle2,
                { color: theme.colors.text, marginBottom: 12 },
              ]}
            >
              Interests
            </Text>
            <View style={styles.tagsRow}>
              {profile.interests.map((interest) => (
                <InterestTag key={interest} label={interest} />
              ))}
            </View>
          </View>
        )}

        {/* Vibes */}
        {profile.vibes.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                theme.typography.subtitle2,
                { color: theme.colors.text, marginBottom: 12 },
              ]}
            >
              Vibes
            </Text>
            <View style={styles.tagsRow}>
              {profile.vibes.map((vibe) => (
                <View
                  key={vibe}
                  style={[
                    styles.vibeChip,
                    { backgroundColor: theme.colors.accent + '20' },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.accent },
                    ]}
                  >
                    {vibe}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Block Button */}
        <TouchableOpacity style={styles.blockButton} onPress={handleBlock}>
          <Text
            style={[
              theme.typography.body2,
              { color: theme.colors.error },
            ]}
          >
            Block User
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: { paddingBottom: 32 },
  photoCarousel: { position: 'relative' },
  photo: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
  photoIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: { width: 8, height: 8, borderRadius: 4 },
  infoSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { paddingHorizontal: 24, marginTop: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  blockButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 32,
  },
});

export default ProfileDetailScreen;
