// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as ReduxProvider } from "react-redux";
import { useDispatch } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import Toast from "react-native-toast-message";
import { ThemeProvider } from './context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

import DrawerNavigator from './Navigators/DrawerNavigator';
import { store, persistor } from './Redux/store';
import Auth from './context/Store/Auth';
import { loadCartFromStorage } from './Redux/Actions/cartActions';

// Cart Loader component that handles loading cart data
const CartLoader = () => {
  const dispatch = useDispatch();
  
  React.useEffect(() => {
    // Load cart data when the app starts
    const loadCart = async () => {
      try {
        // Check if user is authenticated
        const token = await AsyncStorage.getItem('jwt');
        const userId = await AsyncStorage.getItem('userId');
        
        // Determine which cart to load
        let cartData = null;
        if (token && userId) {
          // Load user-specific cart
          cartData = await AsyncStorage.getItem(`cart_${userId}`);
          console.log("Found user cart data:", !!cartData);
        } else {
          // Load guest cart
          cartData = await AsyncStorage.getItem('cart');
          console.log("Found guest cart data:", !!cartData);
        }
        
        if (cartData) {
          // Parse the cart data
          const parsedCart = JSON.parse(cartData);
          console.log("Loading saved cart with", parsedCart.length, "items");
          
          // Load the cart data into the Redux store
          await dispatch(loadCartFromStorage());
        }
      } catch (error) {
        console.error("Error loading cart on app startup:", error);
        Toast.show({
          type: 'error',
          text1: 'Cart Loading Error',
          text2: error.message || 'Failed to load cart'
        });
      }
    };
    
    loadCart();
  }, [dispatch]);
  
  return null; // This component doesn't render anything
};

// Loading component for PersistGate
const LoadingView = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading...</Text>
    </View>
  );
};

// Main App wrapper that includes the CartLoader
const AppWrapper = () => {
  return (
    <NavigationContainer>
      <CartLoader />
      <DrawerNavigator /> 
      <Toast />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <Auth>
          <ThemeProvider>
            <PaperProvider theme={theme}>  
              <AppWrapper />
            </PaperProvider>
          </ThemeProvider>
        </Auth>
      </PersistGate>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});