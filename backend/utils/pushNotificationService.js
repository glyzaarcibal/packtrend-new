const { Expo } = require('expo-server-sdk');
const User = require('../models/user');

const expo = new Expo();

// Send push notification to a specific user
exports.sendPushNotification = async (userId, message, data) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return false;
    }
    
    const pushTokens = user.pushTokens.filter(token => 
      Expo.isExpoPushToken(token)
    );
    
    if (pushTokens.length === 0) {
      console.log(`No valid Expo push tokens found for user ${userId}`);
      return false;
    }
    
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: message.title || 'Order Update',
      body: message.body,
      data: data || {},
      priority: 'high',
      channelId: 'order-updates',
    }));
    
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
    
    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`Error sending notification: ${ticket.message}`);
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          const invalidToken = messages[tickets.indexOf(ticket)].to;
          await this.removePushToken(userId, invalidToken);
        }
      }
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
    
    if (receiptIds.length > 0) {
      console.log('Receipt IDs for later verification:', receiptIds);
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
};

exports.sendOrderStatusNotification = async (userId, order, prevStatus) => {
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
  
  const message = {
    title: `Order Status Updated: ${currentStatusText}`,
    body: `Your order #${order._id} has been updated from ${previousStatusText} to ${currentStatusText}.`
  };
  
  const data = {
    screen: 'OrderDetail',
    orderId: order._id.toString(),
    status: order.status
  };
  
  return this.sendPushNotification(userId, message, data);
};

exports.registerPushToken = async (userId, pushToken, deviceId = null) => {
  try {
    await User.updateMany(
      { pushTokens: pushToken, _id: { $ne: userId } },
      { $pull: { pushTokens: pushToken } }
    );
    
    const tokenWithMetadata = {
      token: pushToken,
      deviceId: deviceId || 'unknown',
      lastUsed: new Date(),
      platform: deviceId ? (deviceId.startsWith('ios') ? 'ios' : 'android') : 'unknown'
    };
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.pushTokensWithMetadata) {
      user.pushTokensWithMetadata = [];
    }
    
    const tokenIndex = user.pushTokensWithMetadata.findIndex(
      item => item.token === pushToken
    );
    
    if (tokenIndex >= 0) {
      user.pushTokensWithMetadata[tokenIndex].lastUsed = new Date();
      if (deviceId) {
        user.pushTokensWithMetadata[tokenIndex].deviceId = deviceId;
      }
    } else {
      user.pushTokensWithMetadata.push(tokenWithMetadata);
      
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

exports.removePushToken = async (userId, pushToken) => {
  try {
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

exports.cleanupStaleTokens = async (daysThreshold = 30) => {
  try {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - daysThreshold);
    
    const users = await User.find({
      'pushTokensWithMetadata.lastUsed': { $lt: staleDate }
    });
    
    let totalRemoved = 0;
    
    for (const user of users) {
      const staleTokens = user.pushTokensWithMetadata
        .filter(item => item.lastUsed < staleDate)
        .map(item => item.token);
      
      if (staleTokens.length > 0) {
        user.pushTokensWithMetadata = user.pushTokensWithMetadata
          .filter(item => item.lastUsed >= staleDate);
        
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

exports.scheduleTokenCleanup = (intervalHours = 24) => {
  setInterval(() => {
    this.cleanupStaleTokens()
      .catch(err => console.error('Scheduled token cleanup failed:', err));
  }, intervalHours * 60 * 60 * 1000);
};