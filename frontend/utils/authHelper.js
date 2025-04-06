
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


export const setupAxiosAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    
    if (token) {
      // Set default headers for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting up axios auth:', error);
    return false;
  }
};

/**
 * Clears the authentication token from axios and AsyncStorage
 */
export const clearAuth = async () => {
  try {
    // Remove token from headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Remove token from AsyncStorage
    await AsyncStorage.removeItem('jwt');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('pushToken');
    
    return true;
  } catch (error) {
    console.error('Error clearing auth:', error);
    return false;
  }
};