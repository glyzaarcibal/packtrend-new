// tokenManager.js
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const TOKEN_KEY = 'userAuthToken';
const API_URL = 'https://your-api-url.com';

// Save token to SecureStore
export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("Error saving token to SecureStore:", error);
    return false;
  }
};

// Get token from SecureStore
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Error retrieving token from SecureStore:", error);
    return null;
  }
};

// Delete token (for logout)
export const deleteToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error("Error deleting token from SecureStore:", error);
    return false;
  }
};

// Login and save token
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data && response.data.token) {
      await saveToken(response.data.token);
      return { success: true, user: response.data.user };
    } else {
      throw new Error('Token not received from server');
    }
  } catch (error) {
    console.error("Login error:", error.message || error);
    return { success: false, error: error.message || 'Login failed' };
  }
};

// Logout
export const logout = async () => {
  try {
    // First try to communicate logout to the server
    const token = await getToken();
    if (token) {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.warn('Server logout failed, continuing with local logout'));
    }
    
    // Then delete the token locally regardless of server response
    await deleteToken();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error.message || error);
    return { success: false, error: error.message || 'Logout failed' };
  }
};

// Check if user is logged in
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

// Setup axios interceptor to include token in all requests
export const setupAxiosInterceptors = async () => {
  axios.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
  
  // Handle token expiration
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 Unauthorized and we haven't tried to refresh the token yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Get new token from refresh endpoint
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
            headers: { 'Authorization': `Bearer ${await getToken()}` }
          });
          
          if (refreshResponse.data && refreshResponse.data.token) {
            // Save the new token
            await saveToken(refreshResponse.data.token);
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // If refresh failed, logout the user
          await deleteToken();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};