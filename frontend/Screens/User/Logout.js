import React, { useState } from 'react';
import { View, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/Store/Auth';

import baseURL from '../../assets/common/baseurl';

const Logout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const { logout } = useAuth();

    const handleLogout = async () => {
        setIsLoading(true);
        
        try {
            // First try to use the context logout function (recommended approach)
            if (logout && typeof logout === 'function') {
                await logout();
                console.log('Logged out using Auth context');
            } else {
                // Fallback to manual logout if context logout isn't available
                const jwtToken = await AsyncStorage.getItem('jwt');
                const pushToken = await AsyncStorage.getItem('pushToken');
                
                // Remove push token
                if (jwtToken && pushToken) {
                    try {
                        await axios.post(`${baseURL}users/push-token/remove`, 
                            { pushToken },
                            { headers: { Authorization: `Bearer ${jwtToken}` } }
                        );
                        console.log('Push token removed from server');
                    } catch (error) {
                        console.log('Error removing push token:', error);
                    }
                }
                
                // Try server logout
                try {
                    await axios.post(`${baseURL}users/logout`, {}, {
                        headers: { Authorization: `Bearer ${jwtToken}` }
                    });
                    console.log('Server logout successful');
                } catch (logoutError) {
                    console.log('Server logout error:', logoutError);
                }
                
                // Clear storage
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
            
            // Use navigation.navigate to go to Login 
            // This works better with nested navigators
            navigation.navigate('User', { screen: 'Login' });
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