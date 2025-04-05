import React, { useState } from 'react';
import { View, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import baseURL from '../../assets/common/baseurl';

const Logout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleLogout = async () => {
        setIsLoading(true);
        
        try {
            // Get stored tokens
            const jwtToken = await AsyncStorage.getItem('jwt');
            const pushToken = await AsyncStorage.getItem('pushToken');
            
            // If we have both tokens, remove the push token from server
            if (jwtToken && pushToken) {
                try {
                    await axios.delete(`${baseURL}api/remove-push-token`, {
                        headers: { Authorization: `Bearer ${jwtToken}` },
                        data: { pushToken }
                    });
                    console.log('Push token removed from server');
                } catch (error) {
                    console.log('Error removing push token:', error);
                    // Continue with logout even if token removal fails
                }
            }
            
            // Clear AsyncStorage
            await AsyncStorage.multiRemove(['jwt', 'pushToken']);
            
            Toast.show({
                topOffset: 60,
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out',
            });
            
            // Navigate back to login
            navigation.navigate('Login');
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