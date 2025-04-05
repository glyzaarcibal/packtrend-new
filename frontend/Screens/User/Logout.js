import React, { useState } from 'react';
import { View, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/Store/Auth'; // Use the correct path

import baseURL from '../../assets/common/baseurl';

const Logout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const { logout } = useAuth(); // Get the logout function from context

    const handleLogout = async () => {
        setIsLoading(true);
        
        try {
            // First try to use the context logout function (recommended approach)
            if (logout && typeof logout === 'function') {
                await logout();
                console.log('Logged out using Auth context');
            } else {
                // Fallback to manual logout if context logout isn't available
                // Get stored tokens
                const jwtToken = await AsyncStorage.getItem('jwt');
                const pushToken = await AsyncStorage.getItem('pushToken');
                
                // If we have both tokens, remove the push token from server
                if (jwtToken && pushToken) {
                    try {
                        // Try the correct endpoint from your userRoutes.js
                        await axios.post(`${baseURL}users/push-token/remove`, 
                            { pushToken },
                            { headers: { Authorization: `Bearer ${jwtToken}` } }
                        );
                        console.log('Push token removed from server');
                    } catch (error) {
                        console.log('Error removing push token:', error);
                        // Continue with logout even if token removal fails
                    }
                }
                
                // Try to call logout endpoint
                try {
                    await axios.post(`${baseURL}users/logout`, {}, {
                        headers: { Authorization: `Bearer ${jwtToken}` }
                    });
                    console.log('Server logout successful');
                } catch (logoutError) {
                    console.log('Server logout error:', logoutError);
                    // Continue with local logout
                }
                
                // Clear all possible auth storage keys
                await AsyncStorage.multiRemove([
                    'jwt', 
                    'token', 
                    'pushToken', 
                    'user', 
                    'userData'
                ]);
                console.log('Local storage cleared');
            }
            
            Toast.show({
                topOffset: 60,
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out',
            });
            
            // Try different navigation approaches
            try {
                // Method 1: Navigate to Login
                navigation.navigate('Login');
                console.log('Navigated to Login');
            } catch (navError1) {
                console.log('Navigation error 1:', navError1);
                
                try {
                    // Method 2: Reset to Login
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                    console.log('Reset to Login');
                } catch (navError2) {
                    console.log('Navigation error 2:', navError2);
                    
                    try {
                        // Method 3: Navigate to the drawer root
                        navigation.navigate('Main', { screen: 'Login' });
                        console.log('Navigated to Main > Login');
                    } catch (navError3) {
                        console.log('Navigation error 3:', navError3);
                    }
                }
            }
        } catch (error) {
            console.log('Logout error:', error);
            
            Toast.show({
                topOffset: 60,
                type: 'error',
                text1: 'Logout Failed',
                text2: 'There was a problem logging out',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <Button
                    title="Logout"
                    onPress={handleLogout}
                    color="#FF6B6B"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Logout;