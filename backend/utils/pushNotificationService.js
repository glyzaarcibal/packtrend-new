// utils/pushNotificationService.js
const User = require('../models/user');

// Add a push token to a user's account
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

// Remove a push token
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

// Remove stale tokens (not used in X days)
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

// Schedule regular cleanup of stale tokens
exports.scheduleTokenCleanup = (intervalHours = 24) => {
  setInterval(() => {
    this.cleanupStaleTokens()
      .catch(err => console.error('Scheduled token cleanup failed:', err));
  }, intervalHours * 60 * 60 * 1000);
};