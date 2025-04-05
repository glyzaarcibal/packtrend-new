// backend/services/pushNotificationService.js
const { Expo } = require('expo-server-sdk');
const User = require('../models/user');

// Initialize Expo SDK
const expo = new Expo();

// Send push notification to a specific user
exports.sendPushNotification = async (userId, message, data) => {
  try {
    // Find user to get push tokens
    const user = await User.findById(userId);
    
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return false;
    }
    
    // Filter valid Expo push tokens
    const pushTokens = user.pushTokens.filter(token => 
      Expo.isExpoPushToken(token)
    );
    
    if (pushTokens.length === 0) {
      console.log(`No valid Expo push tokens found for user ${userId}`);
      return false;
    }
    
    // Create notification messages
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: message.title || 'Order Update',
      body: message.body,
      data: data || {},
      priority: 'high',
      channelId: 'order-updates',
    }));
    
    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('Push notification sent:', ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    // Process tickets to check for errors
    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`Error sending notification: ${ticket.message}`);
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          // Remove invalid token
          const invalidToken = messages[tickets.indexOf(ticket)].to;
          await this.removePushToken(userId, invalidToken);
        }
      }
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
    
    // Later we can check receipts if needed
    if (receiptIds.length > 0) {
      // Store receipt IDs for later checking (optional)
      console.log('Receipt IDs for later verification:', receiptIds);
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
};

// Send order status update notification
exports.sendOrderStatusNotification = async (userId, order, prevStatus) => {
  // Get status text for better readability
  const getStatusText = (statusCode) => {
    switch (statusCode) {
      case '1': return 'Delivered';
      case '2': return 'Shipped';
      case '3': return 'Pending';
      default: return 'Updated';
    }
  };
  
  const currentStatusText = getStatusText(order.status);
  const previousStatusText = getStatusText(prevStatus);
  
  // Create notification message
  const message = {
    title: `Order Status Updated: ${currentStatusText}`,
    body: `Your order #${order._id} has been updated from ${previousStatusText} to ${currentStatusText}.`
  };
  
  // Include relevant data for deep linking
  const data = {
    screen: 'OrderDetail',
    orderId: order._id.toString(),
    status: order.status
  };
  
  // Send the notification
  return this.sendPushNotification(userId, message, data);
};

// The existing token management functions from your code
exports.registerPushToken = async (userId, pushToken, deviceId = null) => {
  try {
    // First remove this token from any other users who might have it
    await User.updateMany(
      { pushTokens: pushToken, _id: { $ne: userId } },
      { $pull: { pushTokens: pushToken } }
    );
    
    // Add metadata to the token
    const tokenWithMetadata = {
      token: pushToken,
      deviceId: deviceId || 'unknown',
      lastUsed: new Date(),
      platform: deviceId ? (deviceId.startsWith('ios') ? 'ios' : 'android') : 'unknown'
    };
    
    // Add to current user if not already present
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize pushTokensWithMetadata if it doesn't exist
    if (!user.pushTokensWithMetadata) {
      user.pushTokensWithMetadata = [];
    }
    
    // Check if this token already exists for this user
    const tokenIndex = user.pushTokensWithMetadata.findIndex(
      item => item.token === pushToken
    );
    
    if (tokenIndex >= 0) {
      // Update the existing token's metadata
      user.pushTokensWithMetadata[tokenIndex].lastUsed = new Date();
      if (deviceId) {
        user.pushTokensWithMetadata[tokenIndex].deviceId = deviceId;
      }
    } else {
      // Add the new token with metadata
      user.pushTokensWithMetadata.push(tokenWithMetadata);
      
      // Keep the simple pushTokens array in sync (for backward compatibility)
      if (!user.pushTokens.includes(pushToken)) {
        user.pushTokens.push(pushToken);
      }
    }
    
    await user.save();
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
};

// Remove a push token (same as your implementation)
exports.removePushToken = async (userId, pushToken) => {
  try {
    // Remove token from user
    const result = await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          pushTokens: pushToken,
          pushTokensWithMetadata: { token: pushToken }
        } 
      },
      { new: true }
    );
    
    return !!result;
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
};

// Clean up stale tokens (same as your implementation)
exports.cleanupStaleTokens = async (daysThreshold = 30) => {
  try {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - daysThreshold);
    
    const users = await User.find({
      'pushTokensWithMetadata.lastUsed': { $lt: staleDate }
    });
    
    let totalRemoved = 0;
    
    for (const user of users) {
      // Find tokens to remove
      const staleTokens = user.pushTokensWithMetadata
        .filter(item => item.lastUsed < staleDate)
        .map(item => item.token);
      
      if (staleTokens.length > 0) {
        // Remove from metadata array
        user.pushTokensWithMetadata = user.pushTokensWithMetadata
          .filter(item => item.lastUsed >= staleDate);
        
        // Remove from simple array
        user.pushTokens = user.pushTokens
          .filter(token => !staleTokens.includes(token));
        
        await user.save();
        totalRemoved += staleTokens.length;
      }
    }
    
    console.log(`Cleaned up ${totalRemoved} stale push tokens`);
    return totalRemoved;
  } catch (error) {
    console.error('Error cleaning up stale tokens:', error);
    throw error;
  }
};

// Schedule regular cleanup (same as your implementation)
exports.scheduleTokenCleanup = (intervalHours = 24) => {
  setInterval(() => {
    this.cleanupStaleTokens()
      .catch(err => console.error('Scheduled token cleanup failed:', err));
  }, intervalHours * 60 * 60 * 1000);
};