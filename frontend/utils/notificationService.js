
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../assets/common/baseurl';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    // Set notification channel for Android
    await Notifications.setNotificationChannelAsync('order-updates', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the token
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('Push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  // Save token locally
  if (token) {
    await AsyncStorage.setItem('pushToken', token.data);
    
    // Register token with backend
    await registerTokenWithBackend(token.data);
    
    return token.data;
  }
  
  return null;
}

// Register token with backend
async function registerTokenWithBackend(pushToken) {
  try {
    // Get JWT token for authentication
    const jwt = await AsyncStorage.getItem('jwt');
    if (!jwt) {
      console.log('Not authenticated, cannot register push token');
      return false;
    }
    
    // Get device info
    const deviceId = Device.modelName || 'unknown';
    const isIOS = Platform.OS === 'ios';
    const platform = isIOS ? 'ios' : 'android';
    
    // Send request to backend
    const response = await axios.post(
      `${baseURL}users/register-push-token`,
      {
        pushToken,
        deviceId: `${platform}-${deviceId}`,
        platform
      },
      {
        headers: { Authorization: `Bearer ${jwt}` }
      }
    );
    
    console.log('Token registered with backend:', response.data);
    return true;
  } catch (error) {
    console.log('Error registering token with backend:', error);
    return false;
  }
}

// Send local notification
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // null means send immediately
  });
}

// Send notification about order status update
export async function sendOrderStatusNotification(orderId, status) {
  // Convert status code to text
  let statusText = 'updated';
  if (status === '1') statusText = 'delivered';
  else if (status === '2') statusText = 'shipped';
  else if (status === '3') statusText = 'pending';
  
  await sendLocalNotification(
    'Order Status Updated',
    `Your order #${orderId} has been ${statusText}`,
    {
      screen: 'OrderDetail',
      orderId,
      status
    }
  );
}

// Setup notification handlers
export function setupNotificationListeners(navigation) {
  // Handle notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received while app in foreground:', notification);
    }
  );

  // Handle notification response (user tapping on notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped, data:', data);
      
      // Navigate based on the screen specified in the notification
      if (data && data.screen) {
        switch (data.screen) {
          case 'OrderDetail':
            if (data.orderId) {
              navigation.navigate('Orders', {
                screen: 'OrderDetail',
                params: { id: data.orderId }
              });
            }
            break;
          case 'Orders':
            navigation.navigate('Orders', { screen: 'My Orders' });
            break;
          default:
            // Default navigation if screen not recognized
            navigation.navigate('Home');
        }
      }
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Get notification count (for badges)
export async function getNotificationCount() {
  try {
    const badges = await Notifications.getBadgeCountAsync();
    return badges;
  } catch (error) {
    console.log('Error getting badge count:', error);
    return 0;
  }
}

// Reset notification count
export async function resetNotificationCount() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.log('Error resetting badge count:', error);
  }
}