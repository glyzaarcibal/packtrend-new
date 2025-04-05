import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, useColorScheme, Text, ActivityIndicator } from "react-native";
import Icon from "@expo/vector-icons/FontAwesome";
import { useTheme } from "react-native-paper";
import { useAuth } from "../context/Store/Auth"; // Updated import path
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import FavoritesNavigator from "./FavoritesNavigator";
import AdminNavigator from "./AdminNavigator";
import CartIcon from "../Screens/Shared/CartIcon";

const Tab = createBottomTabNavigator();

const Main = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState(Date.now()); // Force re-render key
  
  // Get auth state from the Auth context
  const { user, isAdmin, checkIsAdmin } = useAuth();
  
  // Directly calculate isAdmin from user object as backup method
  const directIsAdmin = user && (
    user.isAdmin === true || 
    user.is_admin === true || 
    user.isAdmin === 1 || 
    user.is_admin === 1
  );
  
  // Combined admin check using multiple methods
  const shouldShowAdminTab = isAdmin || directIsAdmin || checkIsAdmin();
  
  // Check local storage for admin status as a last resort
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user') || 
                               await AsyncStorage.getItem('userData');
        
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          console.log("Main - Stored user's admin value:", parsedUser.isAdmin);
          
          // If we can't detect admin status any other way, but the stored user has it
          if (!shouldShowAdminTab && 
              (parsedUser.isAdmin === true || 
               parsedUser.is_admin === true ||
               parsedUser.isAdmin === 1 || 
               parsedUser.is_admin === 1)) {
            // Force re-render with a new key
            setAdminKey(Date.now());
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking stored user data:", error);
        setLoading(false);
      }
    };
    
    checkStoredUser();
  }, [shouldShowAdminTab]);
  
  // Debug log to verify admin status
  useEffect(() => {
    console.log("Main - Current user:", user);
    console.log("Main - isAdmin from context:", isAdmin);
    console.log("Main - Direct isAdmin calculation:", directIsAdmin);
    console.log("Main - checkIsAdmin() result:", checkIsAdmin ? checkIsAdmin() : "not available");
    console.log("Main - shouldShowAdminTab:", shouldShowAdminTab);
    
    if (user) {
      console.log("Main - User's isAdmin property:", user.isAdmin);
      console.log("Main - User's isAdmin type:", typeof user.isAdmin);
    }
  }, [user, isAdmin, directIsAdmin, shouldShowAdminTab, checkIsAdmin]);

  // Show loading indicator while initial checks are performed
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#fff" }}>
      <Tab.Navigator 
        key={adminKey} // Force re-render when admin status changes
        initialRouteName="Home"
        screenOptions={{
          tabBarLabel: () => null,  // Hide tab labels
          headerShown: false,       // Hide headers
        }}
      >
        <Tab.Screen name="Home" component={HomeNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="home" color={color} size={30} />,
        }} />
        <Tab.Screen name="Favorites" component={FavoritesNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="heart" color={color} size={30} />,
        }} />
        <Tab.Screen name="Cart" component={CartNavigator} options={{
          tabBarIcon: ({ color }) => (
            <>
              <Icon name="shopping-cart" color={color} size={30} />
              <CartIcon />
            </>
          ),
        }} />
        
        <Tab.Screen name="User" component={UserNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="user" color={color} size={30} />,
        }} />
        
        {shouldShowAdminTab && (
          <Tab.Screen 
            name="Admin" 
            component={AdminNavigator} 
            options={{
              tabBarIcon: ({ color }) => <Icon name="cog" color={color} size={30} />,
            }}
          />
        )}
      </Tab.Navigator>
    </View>
  );
};

export default Main;