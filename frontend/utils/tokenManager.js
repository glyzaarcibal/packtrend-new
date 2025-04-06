// utils/TokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class TokenManager {
  static async getToken() {
    try {
      // Try multiple potential token keys
      const token = 
        await AsyncStorage.getItem('jwt') || 
        await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        return null;
      }
      
      // Basic validation
      if (!token || typeof token !== 'string' || token.length < 10) {
        console.log('Token format invalid');
        return null;
      }
      
      // We'll keep token age checking disabled until auth flow is working
      
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  static async setToken(token) {
    try {
      // Store token with multiple keys for compatibility
      await AsyncStorage.multiSet([
        ['jwt', token],
        ['token', token]
      ]);
      
      // Store the token issue time for relative expiration checking
      await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  static async removeToken() {
    try {
      await AsyncStorage.multiRemove([
        'jwt', 
        'token', 
        'tokenTimestamp',
        'user', 
        'userData', 
        'pushToken'
      ]);
    } catch (error) {
      console.error('Error removing tokens:', error);
    }
  }

  // Helper method to check relative token age
  static async isTokenTooOld(maxAgeHours = 24) {
    try {
      const timestamp = await AsyncStorage.getItem('tokenTimestamp');
      if (!timestamp) return true;
      
      const issueTime = parseInt(timestamp, 10);
      const currentTime = Date.now();
      const tokenAgeMs = currentTime - issueTime;
      const tokenAgeHours = tokenAgeMs / (1000 * 60 * 60);
      
      return tokenAgeHours > maxAgeHours;
    } catch (error) {
      console.error('Error checking token age:', error);
      return true; // Assume token is too old if we can't check
    }
  }
}

export default TokenManager;