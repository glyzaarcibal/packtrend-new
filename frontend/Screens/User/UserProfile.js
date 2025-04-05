import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from "../../assets/common/baseurl";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { logoutUser } from '../../context/Actions/Auth.actions';
import { AuthContext } from '../../context/AuthContext';

const UserProfile = ({ navigation }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { dispatch = () => {} } = useContext(AuthContext) || {};

    useEffect(() => {
        console.log('User Profile Full Data:', userProfile);
        if (userProfile) {
            console.log('Is Admin (isAdmin):', userProfile.isAdmin);
            console.log('Is Admin (is_admin):', userProfile.is_admin);
            console.log('Is Admin Type (isAdmin):', typeof userProfile.isAdmin);
            console.log('Is Admin Type (is_admin):', typeof userProfile.is_admin);
        }
    }, [userProfile]);
    
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const jwt = await AsyncStorage.getItem('jwt');
            
            if (!jwt) {
                throw new Error('No authentication token found');
            }

            const storedUserData = await AsyncStorage.getItem('userData');
            if (storedUserData) {
                const parsedUserData = JSON.parse(storedUserData);
                setUserProfile(parsedUserData);
            }
            
            const profileUrl = `${baseURL}profile`;
            const response = await axios.get(profileUrl, {
                headers: { Authorization: `Bearer ${jwt}` }
            });

            if (response.data) {
                const profileData = {
                    ...response.data.user,  // Ensure we're getting the user object from the response
                    isAdmin: response.data.user.isAdmin === true || response.data.user.is_admin === 1
                };
                
                setUserProfile(profileData);
                await AsyncStorage.setItem('userData', JSON.stringify(profileData));
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
    }, [navigation]);

    const handleTokenExpiration = async () => {
        try {
            await AsyncStorage.multiRemove(['jwt', 'userData']);
            
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
            if (dispatch && typeof dispatch === 'function') {
                logoutUser(dispatch);
            }
            
            await AsyncStorage.multiRemove(['jwt', 'userData']);
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
            </View>
        );
    }

    const isAdminUser = userProfile && 
        (userProfile.isAdmin === true || 
         userProfile.is_admin === 1 || 
         userProfile.isAdmin === 1);

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