import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../assets/common/baseurl';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data from storage on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setIsLoading(true);
        
        // Check for jwt first (for backwards compatibility)
        let storedToken = await AsyncStorage.getItem('jwt');
        
        // If no jwt, try 'token'
        if (!storedToken) {
          storedToken = await AsyncStorage.getItem('token');
        }
        
        // Look for user data in multiple possible keys
        const userData = await AsyncStorage.getItem('user') || 
                         await AsyncStorage.getItem('userData');
        
        if (storedToken && userData) {
          const parsedUser = JSON.parse(userData);
          console.log("Loaded user from storage:", parsedUser);
          console.log("Token found:", storedToken ? "Yes" : "No");
          
          // Ensure isAdmin is a boolean
          if (parsedUser) {
            parsedUser.isAdmin = parsedUser.isAdmin === true || 
                                parsedUser.is_admin === true || 
                                parsedUser.isAdmin === 1 || 
                                parsedUser.is_admin === 1;
          }
          
          setUser(parsedUser);
          setToken(storedToken);
          
          // Store token in both places for compatibility
          await AsyncStorage.setItem('jwt', storedToken);
          await AsyncStorage.setItem('token', storedToken);
          
          // Store user data in both places for compatibility
          await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
          await AsyncStorage.setItem('userData', JSON.stringify(parsedUser));
        }
      } catch (e) {
        console.error("Failed to load user data from storage", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  const login = async (email, password, deviceId = null, pushToken = null) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting login with:", email);
      
      const response = await axios.post(`${baseURL}users/login`, {
        email,
        password,
        deviceId,
        pushToken
      });
      
      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from server");
      }
      
      const authToken = response.data.token;
      let userData = response.data.user;
      
      // Strict admin status normalization
      const isAdminUser = userData.isAdmin === true;
      
      // Detailed logging for admin status
      console.log("Login Debug:", {
        rawUserData: userData,
        rawIsAdmin: userData.isAdmin,
        typeofIsAdmin: typeof userData.isAdmin,
        normalizedIsAdmin: isAdminUser
      });
      
      // Ensure user data has normalized admin status
      userData = {
        ...userData,
        isAdmin: isAdminUser
      };
      
      // Update states
      setIsAdmin(isAdminUser);
      setUser(userData);
      setToken(authToken);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('jwt', authToken);
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Try to update Redux safely
      try {
        safeDispatch(dispatch, "SET_CURRENT_USER", userData);
      } catch (reduxError) {
        console.warn("Redux dispatch error:", reduxError);
      }
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      
      setError(error.response?.data?.message || "Login failed. Please try again.");
      setLoading(false);
      return { success: false, error: error.response?.data?.message || "Login failed" };
    }
  };
  
  // Robust admin status check
  const checkIsAdmin = () => {
    if (!user) return false;
    
    // Strict admin status check
    const isAdmin = user.isAdmin === true;
    
    console.log("Admin Status Check:", {
      user: user,
      rawIsAdmin: user.isAdmin,
      typeofIsAdmin: typeof user.isAdmin,
      isAdmin: isAdmin
    });
    
    return isAdmin;
  };
  
  

  const logout = async (pushToken = null) => {
    setIsLoading(true);
    
    try {
      if (token) {
        // Configure request with authorization header
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        
        try {
          // Send logout request to server
          await axios.post(
            `${baseURL}users/logout`,
            { pushToken },
            config
          );
        } catch (logoutError) {
          console.warn("Server logout failed:", logoutError);
          // Continue with local logout even if server logout fails
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user data regardless of server response
      setUser(null);
      setToken(null);
      
      // Clear all authentication data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('jwt');
      await AsyncStorage.removeItem('token');
      
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        logout,
        setUser, // Include if you need to update user data elsewhere
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };