import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from '@react-navigation/native';
// Update the import path to match where your useAuth is exported
import { useAuth } from '../../context/Store/Auth';

const UserProfile = (props) => {
    // Get navigation from either props or props.navigation
    const navigation = props.navigation || props;
    
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Use the useAuth hook to get current auth state
    const { user: authUser, token: authToken, logout } = useAuth();

    useEffect(() => {
        // Log user data from AuthContext
        console.log('Auth Context User:', authUser);
        console.log('Auth Context Token exists:', authToken ? 'Yes' : 'No');
        
        // Log profile data
        console.log('User Profile Full Data:', userProfile);
        if (userProfile) {
            console.log('Is Admin (isAdmin):', userProfile.isAdmin);
            console.log('Is Admin Type (isAdmin):', typeof userProfile.isAdmin);
        }
    }, [authUser, authToken, userProfile]);
    
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // First, try to use token from AuthContext
            let token = authToken;
            
            // If that fails, try to get from AsyncStorage (both potential keys)
            if (!token) {
                token = await AsyncStorage.getItem('jwt') || 
                        await AsyncStorage.getItem('token');
            }
            
            if (!token) {
                console.log('No token found in any location');
                throw new Error('No authentication token found');
            }
            
            // First check if we already have user data in context
            if (authUser) {
                console.log('Using user data from AuthContext');
                setUserProfile(authUser);
            } else {
                // Try to load from AsyncStorage (both potential keys)
                const storedUserData = await AsyncStorage.getItem('user') || 
                                       await AsyncStorage.getItem('userData');
                                       
                if (storedUserData) {
                    console.log('Using user data from AsyncStorage');
                    const parsedUserData = JSON.parse(storedUserData);
                    // Ensure isAdmin is a boolean
                    parsedUserData.isAdmin = !!parsedUserData.isAdmin;
                    setUserProfile(parsedUserData);
                }
            }
            
            // Try to get updated profile from server
            try {
                console.log('Fetching profile from server...');
                console.log('Using token:', token.substring(0, 10) + '...');
                
                const profileUrl = `${baseURL}users/profile`;
                const response = await axios.get(profileUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Profile response:', response.data);
                
                if (response.data && response.data.success) {
                    const profileData = {
                        ...response.data.user,
                        isAdmin: !!response.data.user.isAdmin
                    };
                    
                    console.log('Updated profile data from server:', profileData);
                    setUserProfile(profileData);
                    
                    // Store the updated data
                    await AsyncStorage.setItem('user', JSON.stringify(profileData));
                    await AsyncStorage.setItem('userData', JSON.stringify(profileData));
                }
            } catch (profileError) {
                console.warn('Error fetching updated profile:', profileError);
                // Continue with stored profile data
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Profile Fetch Error:', error);
            
            if (error.response?.status === 401) {
                await handleTokenExpiration();
            } else {
                setError(error.message || 'Failed to load profile');
            }
            
            setLoading(false);
        }
    }, [authUser, authToken, navigation]);

    const handleTokenExpiration = async () => {
        try {
            await AsyncStorage.multiRemove(['jwt', 'token', 'user', 'userData']);
            
            Alert.alert(
                'Session Expired', 
                'Your session has expired. Please log in again.',
                [{ 
                    text: 'OK', 
                    onPress: () => navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }]
                    })
                }]
            );
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleLogout = async () => {
        try {
            // Use the logout function from useAuth hook
            if (logout && typeof logout === 'function') {
                await logout();
            } else {
                // Fallback if logout function is not available
                await AsyncStorage.multiRemove(['jwt', 'token', 'user', 'userData']);
            }
            
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            });
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
        }
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfile', { userProfile });
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            return () => {}; 
        }, [fetchProfile])
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Try Again" onPress={fetchProfile} />
                <View style={styles.buttonSpacer} />
                <Button title="Go to Login" onPress={() => navigation.navigate('Login')} color="#4682B4" />
            </View>
        );
    }

    const isAdminUser = userProfile && 
        (userProfile.isAdmin === true || 
         userProfile.is_admin === true || 
         userProfile.isAdmin === 1 || 
         userProfile.is_admin === 1);

    // Default profile image if none is available
    const defaultImage = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>My Profile</Text>
            
            {userProfile && (
                <View style={styles.profileCard}>
                    <View style={styles.profileImageContainer}>
                        <Image 
                            source={{ 
                                uri: userProfile.image 
                                    ? userProfile.image.startsWith('http') 
                                        ? userProfile.image 
                                        : `${baseURL}${userProfile.image.replace(/^\//, '')}`
                                    : defaultImage 
                            }}
                            style={styles.profileImage}
                            onError={(e) => {
                                console.log('Image load error:', e.nativeEvent.error);
                            }}
                        />
                    </View>

                    <ProfileField label="Name" value={userProfile.name} />
                    <ProfileField label="Email" value={userProfile.email} />
                    <ProfileField label="Phone" value={userProfile.phone} />
                    
                    {userProfile.lastActive && (
                        <ProfileField 
                            label="Last Active" 
                            value={new Date(userProfile.lastActive).toLocaleString()} 
                        />
                    )}

                    <Text style={styles.fieldLabel}>Status:</Text>
                    <Text style={styles.fieldValue}>
                        {isAdminUser ? 'Admin' : 'Regular User'}
                    </Text>
                </View>
            )}
            
            <View style={styles.buttonContainer}>
                <Button 
                    title="Edit Profile" 
                    onPress={handleEditProfile} 
                    color="#4682B4" 
                    style={styles.button}
                />
                <View style={styles.buttonSpacer} />
                <Button 
                    title="Logout" 
                    onPress={handleLogout} 
                    color="#ff6347" 
                    style={styles.button}
                />
            </View>
        </ScrollView>
    );
};

const ProfileField = ({ label, value }) => (
    <>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <Text style={styles.fieldValue}>{value || 'Not Available'}</Text>
    </>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center'
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e1e1e1'
    },
    fieldLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 12
    },
    fieldValue: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 8
    },
    buttonContainer: {
        marginTop: 15
    },
    button: {
        marginBottom: 10
    },
    buttonSpacer: {
        height: 10
    },
    adminSection: {
        marginBottom: 20
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10
    },
    adminButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600'
    }
});

export default UserProfile;