import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { MainTabParamList, ChatStackParamList } from './types';

import DiscoverScreen from '../screens/main/DiscoverScreen';
import MatchesScreen from '../screens/main/MatchesScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ChatDetailScreen from '../screens/main/ChatDetailScreen';
import HotZoneMapScreen from '../screens/main/HotZoneMapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen
        name="ChatListHome"
        component={ChatListScreen as React.ComponentType<any>}
      />
      <ChatStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </ChatStack.Navigator>
  );
};

interface TabIconProps {
  emoji: string;
  focused: boolean;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, focused, color }) => (
  <View style={[styles.tabIcon, focused && { backgroundColor: color + '20' }]}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
  </View>
);

const MainTabNavigator: React.FC = () => {
  const { colors, mode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBar.active,
        tabBarInactiveTintColor: colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji={mode === 'social' ? '✨' : '🔍'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="💜" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="💬" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HotZoneMap"
        component={HotZoneMapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🗺️" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="👤" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
  },
});

export default MainTabNavigator;
