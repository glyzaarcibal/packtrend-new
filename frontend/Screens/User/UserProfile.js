import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import baseURL from "../../assets/common/baseurl";
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const UserProfile = ({ navigation }) => {
    const dispatch = useDispatch();
    
    const user = useSelector((state) => state?.auth?.user || null);
    
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            let profileData = user;

            if (!profileData) {
                const storedUserData = await AsyncStorage.getItem('userData') || 
                                       await AsyncStorage.getItem('user');
                if (storedUserData) {
                    profileData = JSON.parse(storedUserData);
                }
            }

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

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            
                            // Get authentication token
                            const token = await AsyncStorage.getItem('jwt') || 
                                         await AsyncStorage.getItem('token');
                            
                            if (token) {
                                // Attempt to call logout endpoint - we're skipping API call if it's not working
                                // This is a client-side logout only
                                console.log('Performing client-side logout');
                            }
                            
                            // Clear stored user data
                            await AsyncStorage.removeItem('jwt');
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('userData');
                            await AsyncStorage.removeItem('user');
                            
                            // Update Redux state
                            dispatch({
                                type: 'LOGOUT'
                            });
                            
                            // Simple navigation approach - try different options
                            try {
                                
                                navigation.navigate('Home');
                            } catch (navError) {
                                console.log('Navigation error:', navError);
                                try {
                                   
                                    navigation.navigate('Auth', { screen: 'Login' });
                                } catch (nestedNavError) {
                                    console.log('Nested navigation error:', nestedNavError);
                                    // Option 3: Go back to the first screen in history
                                    navigation.popToTop();
                                }
                            }
                            
                            setLoading(false);
                        } catch (error) {
                            console.error('Logout Error:', error);
                            setLoading(false);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        navigation.navigate('EditReview');
    };

    const handleTryAgain = () => {
        fetchProfile();
    };

    const navigateToAdminDashboard = () => {
        navigation.navigate('AdminDashboard');
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
                <ActivityIndicator size="large" color="#6979F8" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={[styles.button, styles.tryAgainButton]} 
                    onPress={handleTryAgain}
                >
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const defaultImage = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    const isAdminUser = userProfile?.isAdmin || userProfile?.is_admin;

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Content Header with Edit Button */}
                <View style={styles.headerContainer}>
                    <View style={styles.contentHeader}>
                        <Text style={styles.contentHeaderTitle}>My Profile</Text>
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusText}>
                                Status: {isAdminUser ? 'Admin' : 'User'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleEditProfile}
                    >
                        <Icon name="edit" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.imageSection}>
                    <View style={styles.profileImageContainer}>
                        <Image 
                            source={{ 
                                uri: userProfile?.image 
                                    ? userProfile.image.startsWith('http') 
                                        ? userProfile.image 
                                        : `${baseURL}${userProfile.image.replace(/^\//, '')}`
                                    : defaultImage 
                            }}
                            style={styles.profileImage}
                            defaultSource={{ uri: defaultImage }}
                        />
                        {isAdminUser && (
                            <View style={styles.adminBadge}>
                                <Icon name="verified" size={12} color="#FFF" />
                                <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <ProfileField 
                        icon="person" 
                        label="Name" 
                        value={userProfile?.name || 'Not Available'} 
                    />
                    <ProfileField 
                        icon="email" 
                        label="Email" 
                        value={userProfile?.email || 'Not Available'} 
                    />
                    <ProfileField 
                        icon="phone" 
                        label="Phone" 
                        value={userProfile?.phone || 'Not Available'} 
                    />
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('MyReview')}
                    >
                        <Icon name="rate-review" size={20} color="#6979F8" style={styles.menuIcon} />
                        <Text style={styles.menuText}>My Reviews</Text>
                    </TouchableOpacity>
                    
                    {/* Admin Dashboard Button - Only visible for admin users */}
                    {isAdminUser && (
                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={navigateToAdminDashboard}
                        >
                            <Icon name="dashboard" size={20} color="#6979F8" style={styles.menuIcon} />
                            <Text style={styles.menuText}>Admin Dashboard</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Icon name="logout" size={20} color="#FFF" style={styles.logoutIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        PackTrend © {new Date().getFullYear()}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const ProfileField = ({ icon, label, value }) => (
    <View style={styles.fieldContainer}>
        <View style={styles.iconContainer}>
            <Icon name={icon} size={20} color="#6979F8" />
        </View>
        <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEF0FF'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingRight: 10
    },
    editButton: {
        backgroundColor: '#6979F8',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 5
    },
    menuText:{
        fontSize: 16,
        fontWeight: '500',
        color: '#333'
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F2FF',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginRight: 12
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#EEF0FF'
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6979F8'
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center'
    },
    // Content Header (kept)
    contentHeader: {
        alignItems: 'center',
        flex: 1
    },
    contentHeaderTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    statusContainer: {
        backgroundColor: '#E0E5FF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12
    },
    statusText: {
        fontSize: 14,
        color: '#6979F8',
        fontWeight: '500'
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    imageSection: {
        alignItems: 'center',
        marginVertical: 20
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        borderWidth: 4,
        borderColor: 'white'
    },
    adminBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6979F8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 12
    },
    adminBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '500',
        marginLeft: 4
    },
    infoSection: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        overflow: 'hidden'
    },
    fieldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5'
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    fieldContent: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333'
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5'
    },
    // Logout Button
    logoutButton: {
        backgroundColor: '#FF6B6B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutIcon: {
        marginRight: 10,
    },
    logoutText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },
    tryAgainButton: {
        backgroundColor: '#6979F8',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    footer: {
        marginTop: 30,
        alignItems: 'center'
    },
    footerText: {
        color: '#A0A8D0',
        fontSize: 14
    }
});

export default UserProfile;