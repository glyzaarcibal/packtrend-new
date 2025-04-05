// Save this in a file like utils/auth-helpers.js or add to your existing Auth actions
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";

// Function to handle logout - can be used across the app
export const handleLogout = async (navigation) => {
  try {
    // Remove JWT token
    await AsyncStorage.removeItem('jwt');
    
    // Remove push token if you're storing it
    await AsyncStorage.removeItem('pushToken');
    
    // Show toast notification
    Toast.show({
      topOffset: 60,
      type: "success",
      text1: "Logged Out",
      text2: "You have been successfully logged out",
    });
    
    // Navigate back to login screen
    setTimeout(() => {
      // Navigate to User tab and then to Login screen
      navigation.navigate("User", { screen: "Login" });
    }, 500);
    
    return true;
  } catch (error) {
    console.log("Logout error:", error);
    
    Toast.show({
      topOffset: 60,
      type: "error",
      text1: "Logout Failed",
      text2: "There was a problem logging out",
    });
    
    return false;
  }
};

// Function to check if user is authenticated
export const checkAuthentication = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    return !!token; // Returns true if token exists, false otherwise
  } catch (error) {
    console.log("Auth check error:", error);
    return false;
  }
};