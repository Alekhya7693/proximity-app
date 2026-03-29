import { Platform } from 'react-native';
import apiClient from '../api/client';

export type NotificationData = {
  type: 'new_match' | 'new_message' | 'proximity_alert';
  matchId?: string;
  userId?: string;
  title: string;
  body: string;
};

type NotificationListener = (data: NotificationData) => void;

// On web, notifications APIs are not available — provide a no-op service
const isNative = Platform.OS !== 'web';

// Lazy references for native modules
let Notifications: any = null;
let Device: any = null;

if (isNative) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Modules unavailable
  }
}

class NotificationService {
  private expoPushToken: string | null = null;
  private listeners: NotificationListener[] = [];
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize(): Promise<string | null> {
    if (!isNative || !Notifications || !Device) {
      return null;
    }

    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6C5CE7',
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'New Matches',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6C5CE7',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250],
          lightColor: '#6C5CE7',
        });

        await Notifications.setNotificationChannelAsync('proximity', {
          name: 'MYKO Alerts',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 100],
          lightColor: '#00CEC9',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = tokenData.data;

      if (this.expoPushToken) {
        await this.registerToken(this.expoPushToken);
      }
      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private async registerToken(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  setupListeners(
    onNotificationReceived?: NotificationListener,
    onNotificationTapped?: NotificationListener,
  ): void {
    if (!isNative || !Notifications) return;

    this.notificationListener =
      Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification.request.content.data as NotificationData;
        this.listeners.forEach((listener) => listener(data));
        onNotificationReceived?.(data);
      });

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data as NotificationData;
        onNotificationTapped?.(data);
      });
  }

  addListener(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    _channelId?: string,
  ): Promise<string> {
    if (!isNative || !Notifications) return '';
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as unknown as Record<string, unknown>,
        ...(Platform.OS === 'android' && _channelId ? { channelId: _channelId } : {}),
      },
      trigger: null,
    });
  }

  async clearBadge(): Promise<void> {
    if (!isNative || !Notifications) return;
    await Notifications.setBadgeCountAsync(0);
  }

  cleanup(): void {
    this.notificationListener?.remove();
    this.responseListener?.remove();
    this.notificationListener = null;
    this.responseListener = null;
    this.listeners = [];
  }
}

export const notificationService = new NotificationService();
