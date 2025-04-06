import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import baseURL from "../../assets/common/baseurl";
import { logoutAction } from '../../context/Actions/Auth.actions';

const UserProfile = (props) => {
    const navigation = props.navigation || props;
    const dispatch = useDispatch();
    
    // Safely get user from Redux state with fallback
    const user = useSelector((state) => {
        // Safely access nested properties
        return state?.auth?.user || null;
    });
    
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Try to get user from multiple sources
            let profileData = null;

            // 1. Check Redux user
            if (user) {
                profileData = user;
            }

            // 2. If no Redux user, check AsyncStorage
            if (!profileData) {
                const storedUserData = await AsyncStorage.getItem('userData') || 
                                       await AsyncStorage.getItem('user');
                if (storedUserData) {
                    profileData = JSON.parse(storedUserData);
                }
            }

            // 3. If still no data, set error
            if (!profileData) {
                setError('No user profile found');
                setLoading(false);
                return;
            }

            setUserProfile(profileData);
            setLoading(false);
        } catch (error) {
            console.error('Profile Fetch Error:', error);
            setError('Failed to load profile');
            setLoading(false);
        }
    }, [user]);

    // Logout handler
    const handleLogout = async () => {
        try {
            // Dispatch logout action to clear Redux state
            await dispatch(logoutAction());

            // Clear AsyncStorage
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');

            // Navigate to Home screen
            navigation.navigate('Home'); // Adjust the screen name as per your navigation setup
        } catch (error) {
            console.error('Logout Error:', error);
            // Optionally show an error message to the user
        }
    };

    // Use focus effect to refresh profile
    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            return () => {}; 
        }, [fetchProfile])
    );

    // Loading state
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Default profile image
    const defaultImage = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollViewContent}
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
                            defaultSource={{ uri: defaultImage }}
                        />
                    </View>

                    <ProfileField label="Name" value={userProfile.name} />
                    <ProfileField label="Email" value={userProfile.email} />

                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={styles.logoutButton} 
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

// Profile field component
const ProfileField = ({ label, value }) => (
    <View style={styles.profileField}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <Text style={styles.fieldValue}>{value || 'Not Available'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    logoutButton: {
        backgroundColor: '#ff4500',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
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
        elevation: 3
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
    profileField: {
        marginBottom: 10
    },
    fieldLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5
    },
    fieldValue: {
        fontSize: 18,
        fontWeight: '500'
    }
});

export default UserProfile;