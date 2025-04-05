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
      
      // Optional: Add token expiration check if you have JWT decoding
      // const isExpired = this.isTokenExpired(token);
      // if (isExpired) return null;
      
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
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  static async removeToken() {
    try {
      await AsyncStorage.multiRemove([
        'jwt', 
        'token', 
        'user', 
        'userData', 
        'pushToken'
      ]);
    } catch (error) {
      console.error('Error removing tokens:', error);
    }
  }

  // Optional: Implement token expiration check
  // static isTokenExpired(token) {
  //   try {
  //     const decoded = jwt_decode(token);
  //     return decoded.exp < Date.now() / 1000;
  //   } catch (error) {
  //     console.error('Token decoding error:', error);
  //     return true;
  //   }
  // }
}

export default TokenManager;