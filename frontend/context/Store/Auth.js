import React, { useContext, useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from "react-redux";
import axios from 'axios';
import baseURL from "../../assets/common/baseurl";

// Create a new context that can be accessed with useAuth
const AuthContext = createContext();

// Check if Redux constants exist to avoid errors
const safeDispatch = (dispatch, type, payload) => {
    try {
        if (type && typeof type === 'string') {
            dispatch({ type, payload });
        } else {
            console.warn("Skipping Redux dispatch due to undefined action type");
        }
    } catch (error) {
        console.error("Error dispatching Redux action:", error);
    }
};

const Auth = (props) => {
    const [showChild, setShowChild] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const dispatch = useDispatch();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debug baseURL
    useEffect(() => {
        console.log("Auth - Using baseURL:", baseURL);
    }, []);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Check for stored token in various locations
                const storedToken = await AsyncStorage.getItem("jwt") || 
                                    await AsyncStorage.getItem("token");
                
                console.log("Auth - Found token:", storedToken ? "Yes" : "No");
                
                if (storedToken) {
                    // Get user data
                    const userData = await AsyncStorage.getItem("user") || 
                                    await AsyncStorage.getItem("userData");
                    
                    console.log("Auth - Found user data:", userData ? "Yes" : "No");
                    
                    if (userData) {
                        const parsedUser = JSON.parse(userData);
                        
                        // Normalize isAdmin to be a boolean
                        // Check all possible isAdmin formats
                        const isAdminUser = parsedUser.isAdmin === true || 
                                          parsedUser.is_admin === true || 
                                          parsedUser.isAdmin === 1 || 
                                          parsedUser.is_admin === 1;
                        
                        parsedUser.isAdmin = isAdminUser;
                        setIsAdmin(isAdminUser);
                        
                        console.log("Auth loaded user:", parsedUser.name);
                        console.log("User is admin:", isAdminUser);
                        console.log("Admin status type:", typeof isAdminUser);
                        
                        // Try to update Redux state safely
                        try {
                            safeDispatch(dispatch, "SET_CURRENT_USER", parsedUser);
                        } catch (reduxError) {
                            console.warn("Redux dispatch error:", reduxError);
                            // Continue even if Redux update fails
                        }
                        
                        // Update local state
                        setUser(parsedUser);
                        setToken(storedToken);
                        
                        // Store updated user object with normalized isAdmin
                        await AsyncStorage.setItem("user", JSON.stringify(parsedUser));
                        
                        // Store token in both keys for compatibility
                        await AsyncStorage.setItem("jwt", storedToken);
                        await AsyncStorage.setItem("token", storedToken);
                    }
                }
                
                // Delay showing children to ensure auth state is ready
                setShowChild(true);
                setLoading(false);
            } catch (error) {
                console.error("Auth loading error:", error);
                setLoading(false);
                setShowChild(true);
            }
        };

        loadUserData();
    }, [dispatch]);

    // Login function
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

    // Logout function
    const logout = async (pushToken = null) => {
        setLoading(true);
        
        try {
            if (token) {
                // Configure request with authorization header
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                
                try {
                    // Send logout request to server
                    console.log("Attempting server logout");
                    console.log("Logout URL:", `${baseURL}users/logout`);
                    
                    await axios.post(
                        `${baseURL}users/logout`,
                        { pushToken },
                        config
                    );
                    
                    console.log("Server logout successful");
                } catch (logoutError) {
                    console.warn("Server logout failed:", logoutError.message);
                    console.warn("Response:", logoutError.response?.data);
                    // Continue with local logout even if server logout fails
                }
            }
            
            // Clear user data regardless of server response
            setUser(null);
            setToken(null);
            setIsAdmin(false);
            
            // Update Redux safely
            try {
                safeDispatch(dispatch, "CLEAR_CURRENT_USER", null);
            } catch (reduxError) {
                console.warn("Redux logout dispatch error:", reduxError);
                // Continue even if Redux update fails
            }
            
            // Clear all authentication data
            const keys = ['user', 'userData', 'jwt', 'token', 'pushToken'];
            await AsyncStorage.multiRemove(keys);
            console.log("Cleared storage keys:", keys);
            
            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error("Logout error:", error);
            setLoading(false);
            return { success: false, error: error.message };
        }
    };

    

    return (
        <>
            {showChild && (
                <AuthContext.Provider 
                    value={{ 
                        user,
                        token,
                        isAdmin,
                        isAuthenticated: !!user,
                        loading,
                        error,
                        login,
                        logout,
                        checkIsAdmin,
                    }}
                >
                    {props.children}
                </AuthContext.Provider>
            )}
            {!showChild && <></>}
        </>
    );
};

// Create a hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default Auth;