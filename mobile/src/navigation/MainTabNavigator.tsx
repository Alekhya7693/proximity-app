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
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

// Chat stack with list and detail
const ChatStackNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <ChatStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.text },
      }}
    >
      <ChatStack.Screen
        name="ChatListHome"
        component={ChatListScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route }) => ({
          title: route.params.recipientName,
          headerBackTitle: 'Back',
        })}
      />
    </ChatStack.Navigator>
  );
};

interface TabIconProps {
  label: string;
  focused: boolean;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ label, focused, color }) => {
  const iconMap: Record<string, string> = {
    Discover: 'D',
    Matches: 'M',
    Chat: 'C',
    Profile: 'P',
  };

  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.tabIcon,
          {
            backgroundColor: focused ? color + '20' : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.tabIconText,
            { color, fontWeight: focused ? '700' : '400' },
          ]}
        >
          {iconMap[label] || label.charAt(0)}
        </Text>
      </View>
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBar.active,
        tabBarInactiveTintColor: theme.colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar.background,
          borderTopColor: theme.colors.borderLight,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Discover" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Matches" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Chat" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: { fontSize: 16 },
});

export default MainTabNavigator;
